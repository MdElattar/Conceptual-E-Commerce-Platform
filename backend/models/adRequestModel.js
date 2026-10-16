// backend/models/adRequestModel.js
import mongoose from "mongoose";

const adRequestSchema = mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    package: {
      id: { type: String, required: true }, // 'basic', 'pro', 'elite'
      name: { type: String, required: true },
      days: { type: Number, required: true },
      priceUSD: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "expired"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const AdRequest = mongoose.model("AdRequest", adRequestSchema);
export default AdRequest;