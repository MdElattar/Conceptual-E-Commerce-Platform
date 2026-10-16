// backend/controllers/advertisingController.js
import asyncHandler from "express-async-handler";
import AdRequest from "../models/adRequestModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import WalletTransaction from "../models/walletTransactionModel.js";

// 🌟 الباقات المتاحة (مُعرفة في الباك إند للأمان لمنع تلاعب الفرونت إند)
const AD_PACKAGES = {
  basic: { id: "basic", days: 3, priceUSD: 15, name: "Quick Boost (3 Days)" },
  pro: { id: "pro", days: 7, priceUSD: 30, name: "Pro Placement (7 Days)" },
  elite: { id: "elite", days: 14, priceUSD: 50, name: "Elite Dominance (14 Days)" },
};

// @desc    Create a new Ad Boost Request (Vendor)
// @route   POST /api/advertising/boost
// @access  Private/Vendor
export const requestProductBoost = asyncHandler(async (req, res) => {
  const { productId, packageId } = req.body;
  const vendor = await User.findById(req.user._id);

  if (!vendor || vendor.role !== "vendor" || !vendor.vendorProfile) {
    res.status(403); throw new Error("Unauthorized vendor access.");
  }

  const selectedPackage = AD_PACKAGES[packageId];
  if (!selectedPackage) {
    res.status(400); throw new Error("Invalid Ad Package selected.");
  }

  // 1. التحقق من رصيد التاجر
  if (vendor.vendorProfile.availableBalance < selectedPackage.priceUSD) {
    res.status(400); throw new Error("Insufficient wallet balance for this ad campaign.");
  }

  // 2. التحقق من صحة المنتج
  const product = await Product.findOne({ _id: productId, user: vendor._id });
  if (!product) {
    res.status(404); throw new Error("Product not found or doesn't belong to you.");
  }
  if (product.isSponsored) {
    res.status(400); throw new Error("This product is already being sponsored!");
  }

  // 3. خصم المبلغ من المحفظة وتسجيل المعاملة
  vendor.vendorProfile.availableBalance -= selectedPackage.priceUSD;
  await vendor.save();

  await WalletTransaction.create({
    user: vendor._id,
    transactionType: "Deduction",
    amount: selectedPackage.priceUSD,
    balanceAfter: vendor.vendorProfile.availableBalance,
    description: `Ad Campaign Fee (${selectedPackage.name}) for Product ID: ${product._id}`,
    status: "Completed",
  });

  // 4. إنشاء طلب الإعلان للإدارة
  const adRequest = await AdRequest.create({
    vendor: vendor._id,
    product: product._id,
    package: selectedPackage,
    status: "pending",
  });

  res.status(201).json({ message: "Ad campaign requested successfully.", adRequest });
});

// @desc    Get all pending Ad Requests (Admin)
// @route   GET /api/advertising/requests
// @access  Private/Admin
export const getPendingAdRequests = asyncHandler(async (req, res) => {
  const requests = await AdRequest.find({ status: "pending" })
    .populate("vendor", "name email vendorProfile")
    .populate("product", "name image price isSponsored")
    .sort({ createdAt: -1 });

  res.json(requests);
});

// @desc    Resolve Ad Request - Approve or Reject (Admin)
// @route   PUT /api/advertising/requests/:id
// @access  Private/Admin
export const resolveAdRequest = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'
  const adRequest = await AdRequest.findById(req.params.id);

  if (!adRequest || adRequest.status !== "pending") {
    res.status(404); throw new Error("Ad request not found or already processed.");
  }

  const product = await Product.findById(adRequest.product);
  const vendor = await User.findById(adRequest.vendor);

  if (action === "approve") {
    // 🌟 تفعيل الإعلان
    if (product) {
      product.isSponsored = true;
      // حساب تاريخ الانتهاء (تاريخ اليوم + عدد أيام الباقة)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + adRequest.package.days);
      product.sponsoredExpiresAt = expirationDate;
      await product.save();
    }
    
    adRequest.status = "active";
    await adRequest.save();
    res.json({ message: "Ad Campaign Approved and Activated!" });

  } else if (action === "reject") {
    // 🌟 رفض الإعلان وإرجاع الفلوس للتاجر
    adRequest.status = "rejected";
    await adRequest.save();

    if (vendor && vendor.vendorProfile) {
      vendor.vendorProfile.availableBalance += adRequest.package.priceUSD;
      await vendor.save();

      await WalletTransaction.create({
        user: vendor._id,
        transactionType: "Deposit",
        amount: adRequest.package.priceUSD,
        balanceAfter: vendor.vendorProfile.availableBalance,
        description: `Refund: Rejected Ad Campaign (${adRequest.package.name})`,
        status: "Completed",
      });
    }
    res.json({ message: "Ad Campaign Rejected. Funds refunded to vendor." });
  } else {
    res.status(400); throw new Error("Invalid action.");
  }
});

// ====================================================================
// 🌟 نظام الأتمتة (Automation) لإيقاف الإعلانات المنتهية
// هذا الفنكشن هيشتغل لوحده كل شوية عن طريق Cron Job
// ====================================================================
export const checkAndExpireAds = async () => {
  try {
    const now = new Date();
    // ابحث عن كل المنتجات اللي لسه Sponsored وتاريخ انتهائها أقدم من أو يساوي دلوقتي
    const expiredProducts = await Product.find({
      isSponsored: true,
      sponsoredExpiresAt: { $lte: now }
    });

    if (expiredProducts.length > 0) {
      console.log(`[Cron Job] Found ${expiredProducts.length} expired ads. Deactivating...`);
      
      for (const product of expiredProducts) {
        product.isSponsored = false;
        product.sponsoredExpiresAt = undefined;
        await product.save();

        // تحديث حالة الطلب في الداتا بيز إلى Expired
        await AdRequest.updateMany(
          { product: product._id, status: "active" },
          { $set: { status: "expired" } }
        );
      }
      console.log(`[Cron Job] Ads deactivated successfully.`);
    }
  } catch (error) {
    console.error(`[Cron Job Error] Failed to expire ads: ${error.message}`);
  }
};