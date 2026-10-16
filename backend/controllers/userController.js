import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import speakeasy from "speakeasy";

import User from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import { validateRegisterInput } from "../middleware/validationMiddleware.js";
import stripePackage from "stripe";
const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

// @desc    Auth user with Google
// @route   POST /api/users/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { name, email, image } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    // Case 1: Existing User Flow
    const token = generateToken(res, user._id, user.tokenVersion);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      vendorProfile: user.vendorProfile,
      image: user.image,
      token,
    });
  } else {
    // Case 2: New User Onboarding
    const generatedPassword = Math.random().toString(36).slice(-10) + "Aa1@";
    const newUser = await User.create({
      name,
      email,
      password: generatedPassword,
      image,
      isVerified: true,
    });

    if (newUser) {
      const token = generateToken(res, newUser._id, newUser.tokenVersion);
      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        role: user.role,
        vendorProfile: user.vendorProfile,
        image: newUser.image,
        token,
      });
    } else {
      res.status(400);
      throw new Error("Invalid Google authentication datasets provided.");
    }
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Reset login attempts counter upon successful verification
    user.loginAttempts = 0;
    await user.save();

    // Reset Rate Limiter instance if globally available inside middleware hooks
    try {
      const { loginLimiter } = await import("../routes/userRoutes.js");
      if (loginLimiter?.resetKey) loginLimiter.resetKey(req.ip);
    } catch (err) {
      console.log("Limiter reset skipped tracking context.");
    }

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, twoFactorPending: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      res.json({
        _id: user._id,
        requires2FA: true,
        tempToken,
      });
      return;
    }

    const token = generateToken(res, user._id, user.tokenVersion);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role, 
      vendorProfile: user.vendorProfile,
      twoFactorEnabled: user.twoFactorEnabled,
      token,
    });
  } else {
    if (user) {
      user.loginAttempts += 1;
      await user.save();
      const remaining = 5 - user.loginAttempts;
      res.status(401);
      if (remaining <= 0) {
        throw new Error(
          "Account temporarily locked due to multiple failed login attempts. Please try again later.",
        );
      } else {
        throw new Error(
          `Incorrect password credential details. ${remaining} attempts remaining.`,
        );
      }
    } else {
      res.status(401);
      throw new Error("Target email address profile not found in our records.");
    }
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const userExists = await User.findOne({ $or: [{ email }, { phone }] });

  const validationError = validateRegisterInput(req.body);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  if (userExists) {
    res.status(400);
    throw new Error("User with this email or phone number already exists.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000;

  const user = await User.create({
    name,
    email,
    password,
    otp,
    otpExpires,
    phone,
  });

  if (user) {
    const token = generateToken(res, user._id, user.tokenVersion);

    try {
      await sendEmail({
        email: user.email,
        subject: "Your Account Verification Code",
        message: `Your account activation verification security code is: ${otp}`,
      });
    } catch (error) {
      console.error("Email dispatch failure log trace:", error);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      role: user.role, 
      token,
      message:
        "Verification code has been successfully dispatched to your email address.",
    });
  } else {
    res.status(400);
    throw new Error(
      "Invalid user registration records structural data provided.",
    );
  }
});

// @desc    Verify OTP
// @route   POST /api/users/verify
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    otp,
    otpExpires: { $gt: Date.now() },
  });

  if (user) {
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(res, user._id, user.tokenVersion);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      role: user.role, 
      vendorProfile: user.vendorProfile,
      token,
    });
  } else {
    res.status(400);
    throw new Error("The verification token code is incorrect or has expired.");
  }
});

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    if (user.isVerified) {
      res.status(400);
      throw new Error(
        "This profile account has already been verified and activated.",
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "New Account Verification Code",
      message: `Your new account validation code is: ${otp}`,
    });

    res
      .status(200)
      .json({
        message:
          "A new verification security code has been sent to your email address.",
      });
  } else {
    res.status(404);
    throw new Error("User profile records not found.");
  }
});

// @desc    Forgot Password Request Flow
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Note: ensure validateForgotInput handles localization requirements context mapping internally
  const error =
    typeof validateForgotInput === "function"
      ? validateForgotInput(email)
      : null;

  if (error) {
    res.status(400);
    throw new Error(error);
  }

  if (!user) {
    res.status(404);
    throw new Error("Email address matching criteria could not be verified.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordToken = otp;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  await sendEmail({
    email: user.email,
    subject: "Password Reset Authorization Token",
    message: `Your security password reset authorization code token is: ${otp}`,
  });

  res
    .status(200)
    .json({
      success: true,
      message:
        "Password recovery credentials have been routed to your email address inbox.",
    });
});

// @desc    Verify Reset Code
// @route   POST /api/users/verify-reset-code
// @access  Public
const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    resetPasswordToken: otp,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error(
      "The reset verification criteria code token is invalid or has expired.",
    );
  }

  res
    .status(200)
    .json({
      success: true,
      message: "Security parameters token verified successfully.",
    });
});

// @desc    Reset Password Action Execution
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("Target user profile reference could not be resolved.");
  }

  const isSamePassword = await bcrypt.compare(password, user.password);
  if (isSamePassword) {
    res.status(400);
    throw new Error(
      "Security policy restriction: You cannot reuse a historically assigned password credential.",
    );
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res
    .status(200)
    .json({
      success: true,
      message: "Account profile password parameters updated successfully.",
    });
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res
    .status(200)
    .json({ message: "Session terminated. Logged out successfully." });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role, 
      vendorProfile: user.vendorProfile,
      storeCredit: user.storeCredit || 0,
      addresses: user.addresses,
    });
  } else {
    res.status(404);
    throw new Error("User profile not found.");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    if (req.body.password) user.password = req.body.password;
    if (req.body.addresses) user.addresses = req.body.addresses;

    // 🌟 [السر هنا] استقبال وحفظ بيانات التاجر والبنك في الداتابيز
    if (req.body.vendorProfile) {
      // التأكد من وجود الكائن الأساسي
      if (!user.vendorProfile) user.vendorProfile = {};

      // تحديث البيانات الأساسية للمتجر
      if (req.body.vendorProfile.storeName !== undefined) {
        user.vendorProfile.storeName = req.body.vendorProfile.storeName;
      }
      if (req.body.vendorProfile.storeDescription !== undefined) {
        user.vendorProfile.storeDescription = req.body.vendorProfile.storeDescription;
      }
      if (req.body.vendorProfile.payoutGateway !== undefined) {
        user.vendorProfile.payoutGateway = req.body.vendorProfile.payoutGateway;
      }

      // تحديث بيانات الحساب البنكي
      if (req.body.vendorProfile.bankAccount) {
        if (!user.vendorProfile.bankAccount) user.vendorProfile.bankAccount = {};
        
        if (req.body.vendorProfile.bankAccount.bankName !== undefined) {
          user.vendorProfile.bankAccount.bankName = req.body.vendorProfile.bankAccount.bankName;
        }
        if (req.body.vendorProfile.bankAccount.accountHolderName !== undefined) {
          user.vendorProfile.bankAccount.accountHolderName = req.body.vendorProfile.bankAccount.accountHolderName;
        }
        if (req.body.vendorProfile.bankAccount.accountNumber !== undefined) {
          user.vendorProfile.bankAccount.accountNumber = req.body.vendorProfile.bankAccount.accountNumber;
        }
        if (req.body.vendorProfile.bankAccount.routingNumber !== undefined) {
          user.vendorProfile.bankAccount.routingNumber = req.body.vendorProfile.bankAccount.routingNumber;
        }
        if (req.body.vendorProfile.bankAccount.iban !== undefined) {
          user.vendorProfile.bankAccount.iban = req.body.vendorProfile.bankAccount.iban;
        }
      }
    }

    const updatedUser = await user.save();
    
    // استيراد أو استخدام دالة generateToken (تأكد إنها موجودة فوق عندك في الملف)
    const token = generateToken(res, updatedUser._id, updatedUser.tokenVersion);

    

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token,
      role: updatedUser.role, 
      vendorProfile: updatedUser.vendorProfile,
      storeCredit: updatedUser.storeCredit || 0,
      addresses: updatedUser.addresses,
    });
  } else {
    res.status(404);
    throw new Error("User profile mapping reference not found.");
  }
});

// @desc    Logout from all devices
// @route   POST /api/users/logout-all
// @access  Private
const logoutAllDevices = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.tokenVersion += 1;
    await user.save();
    res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
    res
      .status(200)
      .json({
        message:
          "Successfully revoked session access mapping keys from all devices.",
      });
  } else {
    res.status(404);
    throw new Error("User context reference not found.");
  }
});

// --- ADMIN CONTROLLERS ---

// @desc    Get all users records
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc    Delete user account profile entry
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error(
        "Security restriction rule: System administrative accounts cannot be purged or deleted directly.",
      );
    }
    await User.deleteOne({ _id: user._id });
    res.json({
      message:
        "User account ledger record successfully removed from the platform database.",
    });
  } else {
    res.status(404);
    throw new Error(
      "User profile matching target parameter details not found.",
    );
  }
});

// @desc    Get user profile data matching target parameters ID reference attributes
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) res.json(user);
  else {
    res.status(404);
    throw new Error("User database profile record index not found.");
  }
});

// @desc    Get public vendor profile (for store pages)
// @route   GET /api/users/public/:id
// @access  Public
const getPublicVendorProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name vendorProfile role');
  if (user && (user.role === 'vendor' || user.vendorProfile?.storeName)) {
    res.json({
      _id: user._id,
      name: user.name,
      vendorProfile: user.vendorProfile,
    });
  } else {
    res.status(404);
    throw new Error("Vendor store not found.");
  }
});

// @desc    Update user attributes profile metrics configurations parameters
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    // Super Administrator security guard layer protection policy rules checklist logic setup mapping attributes
    if (req.user.email === "tvninjagames@gmail.com") {
      user.isAdmin =
        req.body.isAdmin !== undefined
          ? Boolean(req.body.isAdmin)
          : user.isAdmin;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error(
      "User metadata file target index mapping profile row not found.",
    );
  }
});

// @desc    Fetch metric visualization configurations indices for global dashboards reporting tracking modules
// @route   GET /api/users/dashboard/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const ordersCount = await Order.countDocuments();
  const usersCount = await User.countDocuments();
  const productsCount = await Product.countDocuments();
  const salesData = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
  ]);
  res.json({
    ordersCount,
    usersCount,
    productsCount,
    totalSales: salesData[0]?.totalSales || 0,
    pendingOrders: await Order.countDocuments({ isDelivered: false }),
  });
});

// @desc    Update FCM Token for Push Notifications systems processes pipelines
// @route   PUT /api/users/fcm-token
// @access  Private
const updateUserFCMToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fcmToken: fcmToken } },
    { returnDocument: 'after' },
  );

  if (user) {
    res
      .status(200)
      .json({
        success: true,
        message:
          "Token configuration instance parameters updated successfully.",
      });
  } else {
    res.status(404);
    throw new Error(
      "User registry record entity block context could not be identified.",
    );
  }
});

// @desc    Send OTP authentication security layer validation parameters directly to user registered telephone phone number systems
// @route   POST /api/users/send-phone-otp
// @access  Private
export const sendPhoneOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error(
      "Please provide a valid international format phone standard number input fields entry value.",
    );
  }

  // Regex validations monitoring checking frameworks mapping criteria metrics protocols configurations guidelines setups
  const internationalPhoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!internationalPhoneRegex.test(phone)) {
    res.status(400);
    throw new Error(
      "Invalid telephone format mapping specifications. Values input parameters must start with explicit international extension parameters (+2010...).",
    );
  }

  user.phone = phone;
  const otp = user.generatePhoneOtp();
  await user.save();

  console.log(`============= DKTEC PHONE OTP TOOL =============`);
  console.log(`Sending SMS to: ${phone}`);
  console.log(`Your Verification Code is: [ ${otp} ]`);
  console.log(`================================================`);

  res.status(200).json({
    success: true,
    message:
      "Verification metrics attributes successfully dispatched straight towards target terminal nodes configuration framework layouts (Sandbox mode active: review terminal prints output metrics traces).",
  });
});

// @desc    Verify phone validation security parameter constraints layers
// @route   POST /api/users/verify-phone-otp
// @access  Private
export const verifyPhoneOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    res.status(400);
    throw new Error(
      "Please provide the verification token sequence key code parameters string layout.",
    );
  }

  const user = await User.findById(req.user._id);

  if (user.phoneOtp === otp && user.phoneOtpExpires > Date.now()) {
    user.isPhoneVerified = true;

    user.phoneOtp = undefined;
    user.phoneOtpExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Telephone metadata attributes successfully verified and securely bound into platform database profile mapping rules setups. ✅",
      isPhoneVerified: true,
    });
  } else {
    res.status(400);
    throw new Error(
      "The telecommunication confirmation access key token signature code pattern match rejected or expired. Request a replacement.",
    );
  }
});

// @desc    Submit vendor partnership request (KYC Docs)
// @route   POST /api/users/vendor-request
// @access  Private (Registered Users Only)
const submitVendorRequest = asyncHandler(async (req, res) => {
  const {
    storeName,
    storeDescription,
    nationalId,
    commercialRegister,
    documentUrl,
  } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    // التأكد من وجود الكائن الأساسي لتجنب أي أخطاء
    if (!user.vendorProfile) {
      user.vendorProfile = {};
    }

    // تعيين البيانات مباشرة لتجنب مشكلة الـ Cast Error
    user.vendorProfile.storeName = storeName;
    user.vendorProfile.storeDescription = storeDescription;
    user.vendorProfile.isVerified = false; // التاجر قيد المراجعة
    user.vendorProfile.kyc = {
      nationalId: nationalId || "",
      commercialRegister: commercialRegister || "",
      documentsUploaded: documentUrl ? [documentUrl] : [],
      submittedAt: Date.now(),
    };

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Partnership request submitted successfully. Awaiting Admin approval.",
    });
  } else {
    res.status(404);
    throw new Error("User account not found in the system.");
  }
});

// @desc    إنشاء جلسة توثيق الهوية عبر Stripe Identity
// @route   POST /api/users/verify-identity
// @access  Private
const createIdentityVerificationSession = asyncHandler(async (req, res) => {
  const { storeName, storeDescription, commercialRegister } = req.body;

  // 1. جلب بيانات المستخدم من الداتابيز
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 2. إنشاء جلسة التوثيق الرسمية في سيرفرات Stripe
  const verificationSession = await stripe.identity.verificationSessions.create(
    {
      type: "document",
      metadata: {
        userId: user._id.toString(),
        storeName,
        storeDescription,
        commercialRegister: commercialRegister || "N/A",
      },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      return_url: "http://localhost:5173/profile?status=payout_pending", // 🌟 ده الرابط الوحيد المطلوب
    },
  );

  // 3. حفظ البيانات المبدئية للتاجر في حسابه لحين وصول رد Stripe النهائي
  if (!user.vendorProfile) user.vendorProfile = {};
  user.vendorProfile.storeName = storeName;
  user.vendorProfile.storeDescription = storeDescription;
  user.vendorProfile.isVerified = false; // يظل غير موثق حتى ينجح الفحص
  if (user.vendorProfile.kyc) {
    user.vendorProfile.kyc.commercialRegister = commercialRegister;
  }

  await user.save();

  // 4. إرسال الرابط الآمن للفرونت إند لتوجيه المستخدم
  res.json({ url: verificationSession.url });
});

// @desc    Get all pending vendor requests for Admin review
// @route   GET /api/users/vendor-requests-list
// @access  Private/Admin
const getVendorRequestsList = asyncHandler(async (req, res) => {
  // البحث عن كل المستخدمين اللي ماليين بيانات المتجر بس لسه رتبتهم user (مش vendor)
  const pendingRequests = await User.find({
    "vendorProfile.storeName": { $exists: true, $ne: "" },
    role: "user",
  }).select("name email vendorProfile"); // جلب البيانات الحقول المطلوبة فقط للجدول

  res.json(pendingRequests);
});

// @desc    Approve or Reject a vendor partnership request
// @route   PUT /api/users/vendor-approval/:id
// @access  Private/Admin
const reviewVendorRequest = asyncHandler(async (req, res) => {
  const { action } = req.body; // سحب الإجراء (approve أو reject) من الفرونت إند
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User account not found.");
  }

  if (action === "approve") {
    // 🛡️ ترقية الحساب وتوثيقه نهائياً بقرار الأدمن بعد مراجعة بيانات سترايب
    user.role = "vendor";
    if (user.vendorProfile) {
      user.vendorProfile.isVerified = true;
      if (user.vendorProfile.kyc) {
        user.vendorProfile.kyc.approvedAt = Date.now();
      }
    }
    await user.save();
    return res.json({
      message: `Account upgraded to verified merchant successfully.`,
    });
  }

  if (action === "reject") {
    // في حالة الرفض: نقوم بتنظيف بيانات التاجر ليعيد التقديم مرة أخرى إن أراد
    user.vendorProfile = undefined;
    await user.save();
    return res.json({
      message: "Merchant request rejected and cleared from queue.",
    });
  }

  res.status(400);
  throw new Error("Invalid compliance action. Use 'approve' or 'reject'.");
});

// 🌟 متنساش تضيفهم في الـ export في آخر الملف:

// @desc    Get pending vendor requests
// @route   GET /api/users/vendors/pending
// @access  Private/Admin
const getPendingVendors = asyncHandler(async (req, res) => {
  const pendingVendors = await User.find({
    role: "vendor",
    "vendorProfile.isVerified": false,
  }).select("-password");

  res.json(pendingVendors);
});

const verify2FALogin = asyncHandler(async (req, res) => {
  const { tempToken, token: code } = req.body;

  if (!tempToken || !code) {
    res.status(400);
    throw new Error('Temp token and verification code are required');
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error('Temporary token expired or invalid. Please login again.');
  }

  if (!decoded.twoFactorPending) {
    res.status(401);
    throw new Error('Invalid token type');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    res.status(401);
    throw new Error('2FA not enabled for this account');
  }

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (isValid) {
    const fullToken = generateToken(res, user._id, user.tokenVersion);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      vendorProfile: user.vendorProfile,
      twoFactorEnabled: user.twoFactorEnabled,
      token: fullToken,
    });
    return;
  }

  const backupMatch = user.backupCodes.find(bc => bc.code === code && !bc.used);
  if (backupMatch) {
    backupMatch.used = true;
    await user.save();

    const fullToken = generateToken(res, user._id, user.tokenVersion);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      vendorProfile: user.vendorProfile,
      twoFactorEnabled: user.twoFactorEnabled,
      token: fullToken,
    });
    return;
  }

  res.status(401);
  throw new Error('Invalid verification code');
});

const generate2FASecret = asyncHandler(async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `DKTEC:${req.user.email}`,
  });

  res.json({
    secret: secret.base32,
    qrCode: secret.otpauth_url,
  });
});

const enable2FA = asyncHandler(async (req, res) => {
  const { secret, token: code } = req.body;

  if (!secret || !code) {
    res.status(400);
    throw new Error('Secret and verification code are required');
  }

  const isValid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!isValid) {
    res.status(400);
    throw new Error('Invalid verification code. Please try again.');
  }

  const backupCodes = [];
  for (let i = 0; i < 8; i++) {
    const code = require('crypto').randomBytes(4).toString('hex').toUpperCase();
    backupCodes.push({ code, used: false });
  }

  req.user.twoFactorSecret = secret;
  req.user.twoFactorEnabled = true;
  req.user.backupCodes = backupCodes;
  await req.user.save();

  res.json({
    message: '2FA enabled successfully',
    backupCodes: backupCodes.map(bc => bc.code),
  });
});

const disable2FA = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Password is required to disable 2FA');
  }

  const userWithPassword = await User.findById(req.user._id);
  if (!userWithPassword) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await userWithPassword.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid password');
  }

  userWithPassword.twoFactorSecret = '';
  userWithPassword.twoFactorEnabled = false;
  userWithPassword.backupCodes = [];
  await userWithPassword.save();

  res.json({ message: '2FA disabled successfully' });
});

const getBackupCodes = asyncHandler(async (req, res) => {
  res.json({
    backupCodes: req.user.backupCodes.filter(bc => !bc.used).map(bc => bc.code),
    usedCount: req.user.backupCodes.filter(bc => bc.used).length,
    totalCount: req.user.backupCodes.length,
  });
});

const regenerateBackupCodes = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Password is required to regenerate backup codes');
  }

  const userWithPassword = await User.findById(req.user._id);
  if (!userWithPassword) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await userWithPassword.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid password');
  }

  const backupCodes = [];
  for (let i = 0; i < 8; i++) {
    const code = require('crypto').randomBytes(4).toString('hex').toUpperCase();
    backupCodes.push({ code, used: false });
  }

  userWithPassword.backupCodes = backupCodes;
  await userWithPassword.save();

  res.json({
    message: 'Backup codes regenerated',
    backupCodes: backupCodes.map(bc => bc.code),
  });
});

export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  verifyOTP,
  resendOTP,
  googleAuth,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  logoutAllDevices,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getDashboardStats,
  updateUserFCMToken,
  submitVendorRequest,
  createIdentityVerificationSession,
  getVendorRequestsList,
  reviewVendorRequest,
  getPendingVendors,
  getPublicVendorProfile,
  verify2FALogin,
  generate2FASecret,
  enable2FA,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes,
};
