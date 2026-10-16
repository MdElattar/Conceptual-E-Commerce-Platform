import mongoose from 'mongoose';

const vendorSubscriptionSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  },
  plan: {
    type: String,
    enum: ['free', 'professional', 'enterprise'],
    default: 'free',
  },
  price: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'expired', 'past_due'],
    default: 'active',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  autoRenew: {
    type: Boolean,
    default: true,
  },
  canceledAt: {
    type: Date,
  },
  paymentMethod: {
    type: String,
  },
  stripeSubscriptionId: {
    type: String,
  },
  limits: {
    maxProducts: { type: Number, default: 10 },
    adCredits: { type: Number, default: 0 },
    analytics: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    featuredStore: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    dedicatedManager: { type: Boolean, default: false },
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

vendorSubscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && this.expiresAt > new Date();
};

const VendorSubscription = mongoose.model('VendorSubscription', vendorSubscriptionSchema);
export default VendorSubscription;
