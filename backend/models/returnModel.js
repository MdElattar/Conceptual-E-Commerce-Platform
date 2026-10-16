import mongoose from "mongoose";

const returnRequestSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  orderItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "received", "refunded", "completed"],
    default: "pending",
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundMethod: {
    type: String,
    enum: ["wallet", "original", "bank"],
    default: "wallet",
  },
  adminNote: {
    type: String,
    default: "",
  },
  images: [String],
}, { timestamps: true });

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
export default ReturnRequest;
