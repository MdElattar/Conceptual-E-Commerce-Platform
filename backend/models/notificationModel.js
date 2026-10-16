import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  type: {
    type: String,
    enum: ['product_approved', 'product_rejected', 'product_pending_review', 'pending_edits_approved', 'pending_edits_rejected', 'new_order', 'order_shipped', 'order_delivered', 'order_cancelled', 'payout_processed', 'payout_rejected', 'kyc_approved', 'kyc_rejected', 'ad_approved', 'ad_rejected', 'return_approved', 'return_rejected', 'system'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
