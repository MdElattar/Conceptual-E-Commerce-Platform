const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },

    // 🌟 [جديد] تحديد رتبة المستخدم لدعم التعددية (مشتري عادي، تاجر، مدير)
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
    },

    // 🌟 الملف التجاري الخاص بالتاجر (يملأ فقط إذا كان الحساب لتاجر)
    vendorProfile: {
      storeName: { type: String, trim: true },
      storeDescription: { type: String },
      storeLogo: { type: String, default: "" },
      storeBanner: { type: String, default: "" },
      isVerified: { type: Boolean, default: false },
      balance: { type: Number, default: 0.0 },
      availableBalance: { type: Number, default: 0.0 },
      escrowBalance: { type: Number, default: 0.0 },
      kyc: {
        nationalId: { type: String, default: "" },
        commercialRegister: { type: String, default: "" },
        taxCard: { type: String, default: "" },
        documentsUploaded: [{ type: String }],
        submittedAt: { type: Date },
      },
      payoutGateway: { type: String, enum: ["BankTransfer", "Vesto", "StripeConnect"], default: "BankTransfer" },
      bankAccount: {
        bankName: { type: String, default: "" },
        accountHolderName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        iban: { type: String, default: "" },
        routingNumber: { type: String, default: "" },
      },
      subscription: {
        plan: { type: String, enum: ["free", "silver", "gold", "professional"], default: "free" },
        expiresAt: { type: Date }
      }
    },

    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },

    phone: {
      type: String,
      required: [true, "Please add a phone number"],
      trim: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneOtp: {
      type: String,
      default: undefined,
    },
    phoneOtpExpires: {
      type: Date,
      default: undefined,
    },

    fcmToken: { type: String, default: "" },
    tokenVersion: { type: Number, default: 0 },

    resetPasswordToken: String,
    resetPasswordExpires: Date,
    loginAttempts: {
      type: Number,
      default: 0,
      required: true,
    },
    addresses: [
      {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String },
        addressLine: { type: String, required: true },
        country: { type: String, default: "EG" },
        state: { type: String },
        building: { type: String },
        apartment: { type: String },
        zipCode: { type: String },
        addressLabel: { type: String, enum: ['Home', 'Work', 'Office', 'Other'], default: 'Home' },
        notes: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
    storeCredit: {
      type: Number,
      required: true,
      default: 0.0,
    },
    stripeCustomerId: {
      type: String,
      default: "",
    },

    twoFactorSecret: { type: String, default: "" },
    twoFactorEnabled: { type: Boolean, default: false },
    backupCodes: [{ code: String, used: { type: Boolean, default: false } }],
  },
  { timestamps: true },
);

// دالة لتوليد كود الـ OTP الخاص بالهاتف وتحديد صلاحيته
userSchema.methods.generatePhoneOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneOtp = otp;
  this.phoneOtpExpires = Date.now() + 10 * 60 * 1000; 
  return otp;
};

// دالة لمقارنة الباسوورد وقت تسجيل الدخول
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// التشفير والتحقق من قوة الباسورد قبل الحفظ
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!strongPasswordRegex.test(this.password)) {
    throw new Error(
      "كلمة المرور ضعيفة! يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص.",
    );
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;