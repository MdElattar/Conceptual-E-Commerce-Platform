// 🛡️ جدار حماية التجار والمنصة العالمية
const isVendor = (req, res, next) => {
  // التأكد من أن المستخدم مسجل دخول أولاً (req.user موجود بفضل ميرور الحماية الأساسي)
  if (req.user && req.user.role === "vendor") {
    next();
  } else {
    res.status(403);
    throw new Error("عذراً، هذا الإجراء مخصص لحسابات التجار فقط!");
  }
};

// 🌟 [تريكة الأمان الصارم] التحقق من توثيق التاجر (KYC Verification)
// تمنع هذه التريكة التاجر من رفع منتجات أو استقبال طلبات إذا كانت أوراقه مزورة أو لم تراجع بعد
const isVerifiedVendor = (req, res, next) => {
  if (
    req.user &&
    req.user.role === "vendor" &&
    req.user.vendorProfile &&
    req.user.vendorProfile.isVerified === true
  ) {
    next();
  } else {
    res.status(403);
    throw new Error(
      "حسابك التجاري قيد المراجعة حالياً. لا يمكنك إجراء عمليات حتى يتم التحقق من وثائقك الرسمية (KYC) من قبل الإدارة."
    );
  }
};

// 🏛️ [تريكة الإدارة المشتركة] صلاحية الوصول للتاجر أو مدير الموقع معاً
// نحتاجها في مسارات (Routes) مثل رؤية تفاصيل منتج معين أو مراجعة أوردر مشترك
const isAdminOrVendor = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "vendor" || req.user.isAdmin)) {
    next();
  } else {
    res.status(403);
    throw new Error("غير مسموح! هذه الصلاحية للمسؤولين أو أصحاب المتاجر فقط.");
  }
};

module.exports = {
  isVendor,
  isVerifiedVendor,
  isAdminOrVendor,
};