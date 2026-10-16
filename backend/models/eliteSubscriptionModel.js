import mongoose from 'mongoose';

const eliteSubscriptionSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true,
  },
  plan: {
    type: String,
    enum: ['free', 'monthly', 'yearly'],
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
    enum: ['active', 'canceled', 'expired', 'past_due', 'pending_cancel'],
    default: 'active',
  },
  cancelReason: { type: String, default: '' },
  cancelRequestedAt: { type: Date },
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
    enum: ['stripe', 'wallet'],
  },
  stripeSubscriptionId: {
    type: String,
    default: '',
  },
  stripeCustomerId: {
    type: String,
    default: '',
  },
  benefits: [{
    type: String,
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

eliteSubscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && this.expiresAt > new Date();
};

const EliteSubscription = mongoose.model('EliteSubscription', eliteSubscriptionSchema);
export default EliteSubscription;
