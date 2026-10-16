import asyncHandler from "express-async-handler";
import ReturnRequest from "../models/returnModel.js";
import Order from "../models/orderModel.js";
import WalletTransaction from "../models/walletTransactionModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import { notifyCustomerReturnApproved, notifyCustomerReturnRejected } from '../services/notificationService.js';
import { auditReturnApprove, auditReturnReject } from '../services/auditService.js';

const VALID_STATUSES = ["pending", "approved", "rejected", "received", "refunded", "completed"];

const ALLOWED_TRANSITIONS = {
  pending:  ["approved", "rejected"],
  approved: ["received", "rejected"],
  received: ["refunded"],
  rejected: [],
  refunded: ["completed"],
  completed: [],
};

const getReturnPolicy = asyncHandler(async (req, res) => {
  res.json({
    policy: {
      returnPeriod: "30 days from delivery",
      eligibility: [
        "Item must be unused and in original packaging",
        "Electronics have a 15-day return window",
        "Custom or made-to-order items are non-returnable",
      ],
      process: [
        "Submit a return request from your orders page",
        "Wait for admin approval (1-2 business days)",
        "Ship the item back using the provided label",
        "Refund issued within 5-7 business days after receipt",
      ],
      refundMethod: "Refunds are issued to your wallet or original payment method",
      exceptions: [
        "Software licenses and digital products",
        "Personal care items",
        "Items with tampered serial numbers",
      ],
    },
  });
});

const createReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, orderItemId, productId, reason, details, images } = req.body;

  if (!orderId || !orderItemId || !productId || !reason) {
    res.status(400);
    throw new Error("Missing required fields: orderId, orderItemId, productId, reason");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized - this order does not belong to you");
  }

  if (!order.isDelivered) {
    res.status(400);
    throw new Error("Cannot return an item that has not been delivered yet");
  }

  const orderItem = order.orderItems.find(
    (item) => item._id.toString() === orderItemId
  );
  if (!orderItem) {
    res.status(404);
    throw new Error("Order item not found");
  }

  if (orderItem.product && orderItem.product.toString() !== productId) {
    res.status(400);
    throw new Error("Product ID does not match the order item");
  }

  const existingReturn = await ReturnRequest.findOne({
    user: req.user._id,
    order: orderId,
    orderItemId,
  });
  if (existingReturn) {
    res.status(400);
    throw new Error("A return request for this item already exists");
  }

  const returnReq = await ReturnRequest.create({
    user: req.user._id,
    order: orderId,
    orderItemId,
    product: productId,
    reason,
    details,
    images: images || [],
    refundAmount: orderItem.price * orderItem.qty,
  });

  res.status(201).json(returnReq);
});

const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ user: req.user._id })
    .populate("product", "name image")
    .populate("order", "createdAt")
    .sort("-createdAt");
  res.json(returns);
});

const getReturnById = asyncHandler(async (req, res) => {
  const returnReq = await ReturnRequest.findById(req.params.id)
    .populate("product", "name image price")
    .populate("order", "createdAt totalPrice");

  if (!returnReq) {
    res.status(404);
    throw new Error("Return request not found");
  }

  if (returnReq.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  res.json(returnReq);
});

const getAdminReturns = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({})
    .populate("user", "name email")
    .populate("product", "name image")
    .populate("order", "createdAt")
    .sort("-createdAt");
  res.json(returns);
});

const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, adminNote, refundAmount } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("Status is required");
  }

  if (!VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const returnReq = await ReturnRequest.findById(req.params.id);
  if (!returnReq) {
    res.status(404);
    throw new Error("Return request not found");
  }

  const currentStatus = returnReq.status;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Cannot transition from "${currentStatus}" to "${status}". Allowed: ${allowed.join(", ") || "none"}`);
  }

  returnReq.status = status;
  if (adminNote !== undefined) returnReq.adminNote = adminNote;
  if (refundAmount !== undefined) returnReq.refundAmount = refundAmount;

  if (status === "refunded") {
    const refundAmt = refundAmount || returnReq.refundAmount || 0;

    if (refundAmt > 0) {
      const user = await User.findById(returnReq.user);
      if (user) {
        user.storeCredit = (user.storeCredit || 0) + refundAmt;
        await user.save();

        await WalletTransaction.create({
          user: returnReq.user,
          transactionType: "Deposit",
          amount: refundAmt,
          balanceAfter: user.storeCredit,
          order: returnReq.order,
          actionBy: req.user._id,
          description: `Refund for return request #${returnReq._id} - ${returnReq.reason || "Customer return"}`,
        });
      }
    }

    if (returnReq.product) {
      await Product.findByIdAndUpdate(returnReq.product, {
        $inc: { countInStock: 1 },
      });
    }

    const order = await Order.findById(returnReq.order);
    if (order) {
      for (const item of order.orderItems) {
        if (item.product && item.product.toString() === returnReq.product?.toString()) {
          const product = await Product.findById(returnReq.product);
          if (product && product.user) {
            const vendor = await User.findById(product.user);
            if (vendor && vendor.vendorProfile) {
              // Only deduct from vendor balance if escrow was already released
              if (item.payoutStatus === "Released") {
                const itemTotal = (item.price || 0) * (item.qty || 1);
                vendor.vendorProfile.availableBalance = Math.max(0, (vendor.vendorProfile.availableBalance || 0) - itemTotal);
                await vendor.save();
              }
            }
          }
          break;
        }
      }
    }
  }

  const updated = await returnReq.save();
  res.json(updated);
});

const getOrderItemsForReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }
  if (!order.isDelivered) {
    res.status(400);
    throw new Error("Order has not been delivered yet");
  }
  const daysSinceDelivery = Math.floor((Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceDelivery > 30) {
    res.status(400);
    throw new Error("Return window has expired (30 days from delivery)");
  }
  res.json(order.orderItems);
});

const getVendorReturns = asyncHandler(async (req, res) => {
  const vendorProducts = await Product.find({ user: req.user._id }).select('_id');
  const vendorProductIds = vendorProducts.map(p => p._id);

  const returns = await ReturnRequest.find({ product: { $in: vendorProductIds } })
    .populate('user', 'name email')
    .populate('product', 'name image price')
    .populate('order', 'createdAt')
    .sort('-createdAt');

  res.json(returns);
});

const vendorUpdateReturnStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error("Vendor can only approve or reject return requests.");
  }

  const returnReq = await ReturnRequest.findById(req.params.id)
    .populate('product', 'name user');
  if (!returnReq) {
    res.status(404);
    throw new Error("Return request not found");
  }

  if (returnReq.status !== 'pending') {
    res.status(400);
    throw new Error("Can only process pending return requests.");
  }

  const product = await Product.findById(returnReq.product?._id || returnReq.product);
  if (!product || product.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized - this product does not belong to you");
  }

  returnReq.status = status;
  if (reason) returnReq.adminNote = reason;

  const io = req.app?.get('io');

  if (status === 'approved') {
    await notifyCustomerReturnApproved({
      customerId: returnReq.user,
      productName: product.name,
      returnId: returnReq._id,
      io,
    });
    await auditReturnApprove({ user: req.user._id, productName: product.name, returnId: returnReq._id, reason, req });
  } else if (status === 'rejected') {
    await notifyCustomerReturnRejected({
      customerId: returnReq.user,
      productName: product.name,
      returnId: returnReq._id,
      reason: reason || 'Item does not meet return criteria',
      io,
    });
    await auditReturnReject({ user: req.user._id, productName: product.name, returnId: returnReq._id, reason, req });
  }

  const updated = await returnReq.save();
  res.json(updated);
});

export {
  getReturnPolicy, createReturnRequest, getMyReturns,
  getReturnById, getAdminReturns, updateReturnStatus, getOrderItemsForReturn,
  getVendorReturns, vendorUpdateReturnStatus,
};
