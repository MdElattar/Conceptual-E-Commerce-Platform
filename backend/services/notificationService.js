import Notification from '../models/notificationModel.js';

const createNotification = async ({ user, type, title, message, link, metadata, io }) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      link,
      metadata,
    });

    if (io) {
      io.to(user.toString()).emit('notification', {
        _id: notification._id,
        type,
        title,
        message,
        link,
        metadata,
        read: false,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

const notifyVendorProductApproved = async ({ vendorId, productId, productName, io }) => {
  return createNotification({
    user: vendorId,
    type: 'product_approved',
    title: 'Product Approved',
    message: `"${productName}" has been approved and is now live on the marketplace.`,
    link: `/vendor/dashboard`,
    metadata: { productId },
    io,
  });
};

const notifyVendorProductRejected = async ({ vendorId, productId, productName, reason, io }) => {
  return createNotification({
    user: vendorId,
    type: 'product_rejected',
    title: 'Product Rejected',
    message: `"${productName}" was rejected. Reason: ${reason || 'No reason provided.'}`,
    link: `/vendor/product/${productId}/edit`,
    metadata: { productId, reason },
    io,
  });
};

const notifyVendorPendingEditsApproved = async ({ vendorId, productId, productName, io }) => {
  return createNotification({
    user: vendorId,
    type: 'pending_edits_approved',
    title: 'Edits Approved',
    message: `Your changes to "${productName}" have been approved and applied.`,
    link: `/vendor/product/${productId}/edit`,
    metadata: { productId },
    io,
  });
};

const notifyVendorPendingEditsRejected = async ({ vendorId, productId, productName, reason, io }) => {
  return createNotification({
    user: vendorId,
    type: 'pending_edits_rejected',
    title: 'Edits Rejected',
    message: `Your changes to "${productName}" were rejected. Reason: ${reason || 'No reason provided.'}`,
    link: `/vendor/product/${productId}/edit`,
    metadata: { productId, reason },
    io,
  });
};

const notifyVendorNewOrder = async ({ vendorId, orderId, itemName, qty, io }) => {
  return createNotification({
    user: vendorId,
    type: 'new_order',
    title: 'New Order Received',
    message: `New order for ${qty}x "${itemName}". Check your fulfillment center.`,
    link: `/vendor/dashboard`,
    metadata: { orderId, itemName, qty },
    io,
  });
};

const notifyCustomerReturnApproved = async ({ customerId, productName, returnId, io }) => {
  return createNotification({
    user: customerId,
    type: 'return_approved',
    title: 'Return Request Approved',
    message: `Your return request for "${productName}" has been approved. Please ship the item back.`,
    link: `/my-returns`,
    metadata: { returnId },
    io,
  });
};

const notifyCustomerReturnRejected = async ({ customerId, productName, returnId, reason, io }) => {
  return createNotification({
    user: customerId,
    type: 'return_rejected',
    title: 'Return Request Rejected',
    message: `Your return request for "${productName}" was rejected. Reason: ${reason || 'No reason provided.'}`,
    link: `/my-returns`,
    metadata: { returnId, reason },
    io,
  });
};

export {
  createNotification,
  notifyVendorProductApproved,
  notifyVendorProductRejected,
  notifyVendorPendingEditsApproved,
  notifyVendorPendingEditsRejected,
  notifyVendorNewOrder,
  notifyCustomerReturnApproved,
  notifyCustomerReturnRejected,
};
