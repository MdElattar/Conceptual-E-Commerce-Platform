import mongoose from "mongoose";

const categoryRequestSchema = mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    requestedCategoryName: { type: String, required: true, trim: true },
    reason: { type: String, required: true },
    exampleProducts: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  }, { timestamps: true });

const CategoryRequest = mongoose.model("CategoryRequest", categoryRequestSchema);
export default CategoryRequest;