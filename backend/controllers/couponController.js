import Coupon from "../models/couponModel.js";
import asyncHandler from "../middleware/asyncHandler.js";

/**
 * @desc    Validate coupon with dynamic currency conversion and vendor isolation
 * @route   POST /api/coupons/validate
 * @access  Private
 */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartItems, currency = "USD", exchangeRate = 1 } = req.body;

  // 1. Validation: Ensure cart contains items
  if (!cartItems || cartItems.length === 0) {
    res.status(400);
    throw new Error("Your shopping cart is empty.");
  }

  // 2. Retrieval: Fetch coupon and verify active status
  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    res.status(404);
    throw new Error("This promotional code is invalid or has expired.");
  }

  // 3. Verification: Check expiration date bounds
  if (new Date() > new Date(coupon.expiryDate)) {
    res.status(400);
    throw new Error("This coupon code has expired.");
  }

  // 4. Verification: Enforce global usage ceiling limitations
  if (coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("This coupon has reached its maximum usage limit.");
  }

  // 5. Verification: Enforce per-user allocation constraints
  if (req.user) {
    const userUsageCount =
      req.user.usedCoupons?.filter(
        (c) => c.toString() === coupon._id.toString(),
      ).length || 0;
    if (userUsageCount >= (coupon.userLimit || 1)) {
      res.status(400);
      throw new Error(
        "You have already used this coupon the maximum number of times allowed.",
      );
    }
  }

  // 6. Evaluation: Multi-Vendor & Category Eligibility Metrics 🎯
  let cartTotalInCurrentCurrency = 0;
  let eligibleSubtotalInCurrentCurrency = 0;
  const hasCategoryRestriction = coupon.specificCategories && coupon.specificCategories.length > 0;

  cartItems.forEach((item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    const itemTotal = price * qty;

    cartTotalInCurrentCurrency += itemTotal;
    
    let isEligible = true;

    // الفحص الأول: هل المنتج في التصنيفات المسموحة؟
    if (hasCategoryRestriction && !coupon.specificCategories.includes(item.categoryId)) {
      isEligible = false;
    }

    // الفحص الثاني والأهم (حماية التجار): لو الكوبون خاص بتاجر معين، تأكد إن المنتج بتاعه
    if (!coupon.isGlobal && coupon.vendor) {
      if (item.vendor !== coupon.vendor.toString()) {
        isEligible = false;
      }
    }

    if (isEligible) {
      eligibleSubtotalInCurrentCurrency += itemTotal;
    }
  });

  if (eligibleSubtotalInCurrentCurrency === 0) {
    res.status(400);
    throw new Error(
      "None of the items in your cart are eligible for this discount. Make sure the items belong to the coupon issuer."
    );
  }

  // 7. Conversion & Strict Verification
  const minRequiredInBaseCurrency = Number(coupon.minOrderAmount || 0);
  const minRequiredInCurrentCurrency = minRequiredInBaseCurrency * exchangeRate;

  if (eligibleSubtotalInCurrentCurrency < minRequiredInCurrentCurrency) {
    res.status(400);
    throw new Error(
      `Minimum eligible order amount for this coupon is ${minRequiredInCurrentCurrency.toLocaleString()} ${currency}.`
    );
  }

  // 8. Processing: Determine exact deduction rate values
  let finalDiscountInCurrentCurrency = 0;

  if (coupon.discountType === "percentage") {
    finalDiscountInCurrentCurrency = (eligibleSubtotalInCurrentCurrency * coupon.discountAmount) / 100;
  } else {
    const fixedDiscountInCurrentCurrency = coupon.discountAmount * exchangeRate;
    finalDiscountInCurrentCurrency = Math.min(
      fixedDiscountInCurrentCurrency,
      eligibleSubtotalInCurrentCurrency,
    );
  }

  // 9. Dispatch: Return structural tracking metrics
  res.status(200).json({
    success: true,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      appliedDiscount: Number(finalDiscountInCurrentCurrency.toFixed(2)),
      currency,
      originalMinOrderUSD: minRequiredInBaseCurrency,
      convertedMinOrder: Number(minRequiredInCurrentCurrency.toFixed(2)),
      message: `Success! You saved ${finalDiscountInCurrentCurrency.toFixed(2)} ${currency}.`,
    },
  });
});

// @desc    Create a new coupon profile rule entry
// @route   POST /api/coupons
// @access  Private/Admin or Vendor
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountAmount,
    expiryDate,
    usageLimit,
    specificCategories,
    minOrderAmount,
    isGlobal // الفرونت إند ممكن يبعتها لو الأدمن هو اللي بيعمل الكوبون
  } = req.body;

  const couponExists = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();

  if (couponExists) {
    res.status(400);
    throw new Error("Coupon code already exists");
  }

  // 🌟 تريكة الأمان: لو المستخدم أدمن وعايز يعمله Global ماشي، لو تاجر غصب عنه هيكون مخصص لمتجره
  const isGlobalCoupon = req.user.isAdmin ? (isGlobal !== false) : false;
  const vendorId = isGlobalCoupon ? null : req.user._id;

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    discountType,
    discountAmount,
    minOrderAmount: Number(minOrderAmount) || 0,
    expiryDate,
    usageLimit: usageLimit || 100,
    specificCategories,
    isGlobal: isGlobalCoupon,
    vendor: vendorId, // ربط الكوبون بالتاجر
  });

  if (coupon) {
    res.status(201).json(coupon);
  } else {
    res.status(400);
    throw new Error("Invalid coupon data");
  }
});

// @desc    Get all coupons entries array lists
// @route   GET /api/coupons
// @access  Private/Admin or Vendor
export const getCoupons = asyncHandler(async (req, res) => {
  // الأدمن يشوف كل الكوبونات، التاجر يشوف الكوبونات بتاعته بس
  const query = req.user.isAdmin ? {} : { vendor: req.user._id };
  
  const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();
  res.json(coupons);
});

// @desc    Delete an absolute coupon listing record permanently
// @route   DELETE /api/coupons/:id
// @access  Private/Admin or Vendor
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }

  // حماية إضافية: التأكد إن التاجر بيمسح الكوبون بتاعه هو بس (إلا لو كان أدمن)
  if (!req.user.isAdmin && coupon.vendor?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Unauthorized access. You can only delete your own coupons.");
  }

  await coupon.deleteOne();
  res.json({ message: "Coupon removed successfully" });
});