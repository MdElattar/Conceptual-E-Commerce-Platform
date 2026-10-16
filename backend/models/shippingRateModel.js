import mongoose from 'mongoose';

const shippingRateSchema = mongoose.Schema({
  country: { 
    type: String, 
    required: true, 
    default: 'EG' // كود الدولة مثل EG, SA, AE
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true, // تم جعلها false مؤقتاً حتى لا تضرب مع أي بيانات قديمة مسجلة مسبقاً
  },
  minWeight: { type: Number, required: true }, 
  maxWeight: { type: Number, required: true }, 
  cost: { type: Number, required: true },      
  isDefault: { type: Boolean, default: false } // لو مفعل، هيستخدم لو الدولة مش موجودة في الجدول
}, { timestamps: true });

// عمل "Index" عشان نمنع تكرار نفس شريحة الوزن لنفس الدولة
shippingRateSchema.index({ country: 1, minWeight: 1, maxWeight: 1 }, { unique: true });

const ShippingRate = mongoose.model('ShippingRate', shippingRateSchema);
export default ShippingRate;