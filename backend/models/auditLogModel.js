import mongoose from 'mongoose';

const auditLogSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  action: {
    type: String,
    required: true,
    enum: [
      'product.create', 'product.edit', 'product.submit', 'product.archive',
      'product.hide', 'product.approve', 'product.reject', 'product.delete',
      'pending_edits.submit', 'pending_edits.approve', 'pending_edits.reject',
      'product.stock.adjust',
      'order.item.process', 'order.item.ship', 'order.item.cancel',
      'order.item.deliver', 'payout.request', 'payout.resolve',
      'return.approve', 'return.reject',
      'profile.update', 'kyc.submit', 'kyc.approve', 'kyc.reject',
    ],
  },
  target: { type: String, default: '' },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
}, { timestamps: true });

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
