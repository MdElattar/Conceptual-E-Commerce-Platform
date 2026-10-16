import mongoose from "mongoose";

const specSchema = mongoose.Schema({
  label: { type: String, required: true }, 
  value: { type: String, required: true }, 
});

const reviewSchema = mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    isVerified: { type: Boolean, required: true, default: true },
  }, { timestamps: true });

const productSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: [true, "Please add a product name"], trim: true },
    brand: { type: String, required: [true, "Please add a brand"] },
    category: { type: String, required: [true, "Please add a category"] },
    description: { type: String, required: [true, "Please add a description"] },
    price: { type: Number, required: true, default: 0 },
    originalPrice: { type: Number },
    weight: { type: Number, required: true, default: 0 },
    image: { type: String, required: true },
    images: [{ type: String }], 
    specs: [specSchema],
    dynamicAttributes: [{ key: { type: String }, value: { type: String } }],
    countInStock: { type: Number, required: true, default: 0 },
    colors: [String], 
    sizes: [String],
    features: { type: [String], default: [] },
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    sku: { type: String, unique: true, sparse: true, trim: true },
    status: { type: String, enum: ["draft", "pending", "pending_review", "active", "rejected", "hidden", "suspended", "archived"], default: "draft" },
    isSponsored: { type: Boolean, default: false },
    sponsoredExpiresAt: { type: Date },
    numSales: { type: Number, default: 0 },
    rejectReason: { type: String, default: '' },
    metaTitle: { type: String, trim: true },
    seoKeywords: { type: String, trim: true },
    eliteDiscount: { type: Number, default: 0, min: 0, max: 100 },
    hasPendingEdits: { type: Boolean, default: false },
    pendingEdits: { type: mongoose.Schema.Types.Mixed, default: null },
    pendingEditsSubmittedAt: { type: Date },
    archivedAt: { type: Date },
    hiddenAt: { type: Date },
    suspendedAt: { type: Date },
    suspendedReason: { type: String, default: '' },
    hiddenReason: { type: String, default: '' },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  }, { timestamps: true });

productSchema.index({ name: "text", description: "text", seoKeywords: "text" });
const Product = mongoose.model("Product", productSchema);
export default Product;