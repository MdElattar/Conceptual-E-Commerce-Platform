import AuditLog from '../models/auditLogModel.js';

const createAuditLog = async ({ user, action, target, targetId, details, metadata, req }) => {
  try {
    const ip = req?.ip || req?.connection?.remoteAddress || '';
    await AuditLog.create({
      user,
      action,
      target,
      targetId,
      details,
      metadata,
      ip,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
  }
};

const auditProductCreate = ({ user, product, req }) =>
  createAuditLog({ user, action: 'product.create', target: 'Product', targetId: product._id, details: `Created product "${product.name}"`, metadata: { name: product.name, price: product.price }, req });

const auditProductEdit = ({ user, product, changes, req }) =>
  createAuditLog({ user, action: 'product.edit', target: 'Product', targetId: product._id, details: `Edited product "${product.name}"`, metadata: { name: product.name, changes }, req });

const auditProductSubmit = ({ user, product, req }) =>
  createAuditLog({ user, action: 'product.submit', target: 'Product', targetId: product._id, details: `Submitted product "${product.name}" for review`, metadata: { name: product.name }, req });

const auditProductArchive = ({ user, product, req }) =>
  createAuditLog({ user, action: 'product.archive', target: 'Product', targetId: product._id, details: `Archived product "${product.name}"`, metadata: { name: product.name }, req });

const auditProductHide = ({ user, product, reason, req }) =>
  createAuditLog({ user, action: 'product.hide', target: 'Product', targetId: product._id, details: `Hidden product "${product.name}"`, metadata: { name: product.name, reason }, req });

const auditProductApprove = ({ user, product, req }) =>
  createAuditLog({ user, action: 'product.approve', target: 'Product', targetId: product._id, details: `Approved product "${product.name}"`, metadata: { name: product.name }, req });

const auditProductReject = ({ user, product, reason, req }) =>
  createAuditLog({ user, action: 'product.reject', target: 'Product', targetId: product._id, details: `Rejected product "${product.name}"`, metadata: { name: product.name, reason }, req });

const auditPendingEditsSubmit = ({ user, product, req }) =>
  createAuditLog({ user, action: 'pending_edits.submit', target: 'Product', targetId: product._id, details: `Submitted pending edits for "${product.name}"`, metadata: { name: product.name }, req });

const auditPendingEditsApprove = ({ user, product, req }) =>
  createAuditLog({ user, action: 'pending_edits.approve', target: 'Product', targetId: product._id, details: `Approved pending edits for "${product.name}"`, metadata: { name: product.name }, req });

const auditPendingEditsReject = ({ user, product, reason, req }) =>
  createAuditLog({ user, action: 'pending_edits.reject', target: 'Product', targetId: product._id, details: `Rejected pending edits for "${product.name}"`, metadata: { name: product.name, reason }, req });

const auditOrderItemShip = ({ user, orderId, itemId, itemName, trackingNumber, req }) =>
  createAuditLog({ user, action: 'order.item.ship', target: 'OrderItem', targetId: itemId, details: `Shipped "${itemName}"`, metadata: { orderId, itemId, itemName, trackingNumber }, req });

const auditOrderItemCancel = ({ user, orderId, itemId, itemName, reason, req }) =>
  createAuditLog({ user, action: 'order.item.cancel', target: 'OrderItem', targetId: itemId, details: `Cancelled "${itemName}"`, metadata: { orderId, itemId, itemName, reason }, req });

const auditPayoutRequest = ({ user, amount, req }) =>
  createAuditLog({ user, action: 'payout.request', target: 'Payout', details: `Requested payout of ${amount}`, metadata: { amount }, req });

const auditStockAdjust = ({ user, product, previousStock, newStock, reason, req }) =>
  createAuditLog({ user, action: 'product.stock.adjust', target: 'Product', targetId: product._id, details: `Stock adjusted for "${product.name}": ${previousStock} → ${newStock}`, metadata: { name: product.name, previousStock, newStock, reason }, req });

const auditReturnApprove = ({ user, productName, returnId, reason, req }) =>
  createAuditLog({ user, action: 'return.approve', target: 'ReturnRequest', targetId: returnId, details: `Approved return for "${productName}"`, metadata: { productName, returnId, reason }, req });

const auditReturnReject = ({ user, productName, returnId, reason, req }) =>
  createAuditLog({ user, action: 'return.reject', target: 'ReturnRequest', targetId: returnId, details: `Rejected return for "${productName}"`, metadata: { productName, returnId, reason }, req });

export {
  auditStockAdjust,
  auditReturnApprove,
  auditReturnReject,
  createAuditLog,
  auditProductCreate,
  auditProductEdit,
  auditProductSubmit,
  auditProductArchive,
  auditProductHide,
  auditProductApprove,
  auditProductReject,
  auditPendingEditsSubmit,
  auditPendingEditsApprove,
  auditPendingEditsReject,
  auditOrderItemShip,
  auditOrderItemCancel,
  auditPayoutRequest,
};
