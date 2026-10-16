import asyncHandler from "express-async-handler";
import RecentlyViewed from "../models/recentlyViewedModel.js";

const getRecentlyViewed = asyncHandler(async (req, res) => {
  let data = await RecentlyViewed.findOne({ user: req.user._id })
    .populate("products.product", "name image price")
    .sort({ "products.viewedAt": -1 });
  
  if (!data) {
    data = await RecentlyViewed.create({ user: req.user._id, products: [] });
  }
  
  res.json(data);
});

const addRecentlyViewed = asyncHandler(async (req, res) => {
  const { productId, productImage, productName, productPrice, vendorName } = req.body;
  
  if (!productId) {
    res.status(400);
    throw new Error("Product ID is required");
  }
  
  let data = await RecentlyViewed.findOne({ user: req.user._id });
  
  if (!data) {
    data = await RecentlyViewed.create({ user: req.user._id, products: [] });
  }
  
  data.products = data.products.filter(
    (p) => p.product.toString() !== productId
  );
  
  data.products.unshift({
    product: productId,
    productImage: productImage || "",
    productName: productName || "",
    productPrice: productPrice || 0,
    vendorName: vendorName || "",
    viewedAt: new Date(),
  });
  
  if (data.products.length > 20) {
    data.products = data.products.slice(0, 20);
  }
  
  await data.save();
  
  const populated = await RecentlyViewed.findById(data._id)
    .populate("products.product", "name image price");
  
  res.json(populated);
});

const clearRecentlyViewed = asyncHandler(async (req, res) => {
  let data = await RecentlyViewed.findOne({ user: req.user._id });
  if (data) {
    data.products = [];
    await data.save();
  }
  res.json({ message: "Recently viewed cleared" });
});

export { getRecentlyViewed, addRecentlyViewed, clearRecentlyViewed };
