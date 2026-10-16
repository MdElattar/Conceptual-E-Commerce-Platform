import mongoose from "mongoose";

// 🌟 [تريكة أمازون] تفصيل محتويات السلة لتعمل كأوردرات مصغرة
const orderItemSchema = mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  color: { type: String }, 
  size: { type: String },
  weight: { type: Number, default: 0 }, 
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // 💰 الحسبة المالية الخاصة بالتاجر والموقع لكل قطعة
  commissionRate: { type: Number, default: 10 }, // عمولة الموقع %
  commissionEarned: { type: Number, default: 0.0 }, // ربح الموقع
  vendorEarnings: { type: Number, default: 0.0 },   // صافي التاجر

  // 🛡️ نظام الـ Escrow - التأكيد الثنائي
  payoutStatus: {
    type: String,
    enum: ["Holding", "Released", "Refunded"],
    default: "Holding",
  },
  vendorShipped: { type: Boolean, default: false }, // التاجر أرسل المنتج
  customerConfirmedDelivery: { type: Boolean, default: false }, // العميل أكد الاستلام
  deliveryProofImage: { type: String }, // 📸 صورة إثبات الاستلام التي يرفعها العميل

  fulfillmentMethod: {
    type: String,
    enum: ["Merchant", "Platform"], 
    default: "Merchant",
  },
  itemStatus: {
    type: String,
    enum: ["Pending", "Processed", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  trackingNumber: { type: String, default: '' },
  deliveredAt: { type: Date },
  shippedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledReason: { type: String, default: '' },
});

const orderSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: mongoose.Schema.Types.Mixed, required: true },
    totalWeight: { type: Number, required: true, default: 0 },
    
    orderItems: [orderItemSchema],
    
    itemsPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true }, 

    totalPlatformCommission: { type: Number, default: 0.0 },

    paymentResult: { id: String, status: String, email_address: String },
    currency: { type: String, required: true, default: "USD" },
    exchangeRate: { type: Number, required: true, default: 1 },
    discountPrice: { type: Number, required: true, default: 0.0 },
    couponCode: { type: String }, 
    paymentMethod: { type: String, required: true },
    
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    
    isProcessed: { type: Boolean, default: false },
    isOnWay: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "orderItems.vendor": 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;