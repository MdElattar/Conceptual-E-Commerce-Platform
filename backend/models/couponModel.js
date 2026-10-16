// models/couponModel.js
const mongoose = require('mongoose');

const couponSchema = mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountAmount: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 }, // 👈 الحد الأدنى للشراء (رقم 3)
  minPurchase: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 1 }, // عدد المرات الكلي
  usedCount: { type: Number, default: 0 },    // كم مرة استُخدم فعلياً
  userLimit: { type: Number, default: 1 },    // كم مرة لليوزر الواحد
  specificCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // لو فاضي يبقى على كله
  isActive: { type: Boolean, default: true },
  // ضف دول داخل هيكل الكوبون
  isGlobal: { 
    type: Boolean, 
    default: false // بيحدد هل هو كوبون موقع ولا كوبون تاجر
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // بيربط الكوبون بالتاجر
    default: null
  },
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;