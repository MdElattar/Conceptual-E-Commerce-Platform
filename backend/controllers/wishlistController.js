import asyncHandler from "express-async-handler";
import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js";

const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products.product");
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }
  res.json(wishlist);
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const alreadyExists = wishlist.products.find(
    (p) => p.product.toString() === productId
  );

  if (alreadyExists) {
    res.status(400);
    throw new Error("Product already in wishlist");
  }

  wishlist.products.push({ product: productId });
  await wishlist.save();

  const populated = await Wishlist.findById(wishlist._id).populate("products.product");
  res.status(201).json(populated);
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    res.status(404);
    throw new Error("Wishlist not found");
  }

  wishlist.products = wishlist.products.filter(
    (p) => p.product.toString() !== productId
  );

  await wishlist.save();
  const populated = await Wishlist.findById(wishlist._id).populate("products.product");
  res.json(populated);
});

const clearWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = [];
    await wishlist.save();
  }
  res.json({ message: "Wishlist cleared" });
});

export { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
