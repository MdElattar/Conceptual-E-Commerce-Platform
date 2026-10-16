import mongoose from 'mongoose';

const userBehaviorSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventType: {
    type: String,
    enum: ['view', 'add_to_cart', 'purchase', 'search', 'wishlist'],
    required: true,
  },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  searchQuery: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

userBehaviorSchema.index({ user: 1, eventType: 1, createdAt: -1 });
userBehaviorSchema.index({ eventType: 1, createdAt: -1 });
userBehaviorSchema.index({ product: 1, eventType: 1 });

const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);
export default UserBehavior;
