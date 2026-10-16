import mongoose from "mongoose";

const viewedProductSchema = mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productImage: { type: String, default: "" },
  productName: { type: String, default: "" },
  productPrice: { type: Number, default: 0 },
  vendorName: { type: String, default: "" },
  viewedAt: { type: Date, default: Date.now },
});

const recentlyViewedSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  products: [viewedProductSchema],
}, { timestamps: true });

// Note: `user: { unique: true }` in the schema already creates the user index
recentlyViewedSchema.index({ "products.viewedAt": -1 });

const RecentlyViewed = mongoose.model("RecentlyViewed", recentlyViewedSchema);
export default RecentlyViewed;
