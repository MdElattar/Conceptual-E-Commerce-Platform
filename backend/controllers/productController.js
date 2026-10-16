import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import { notifyVendorProductApproved, notifyVendorProductRejected, notifyVendorPendingEditsApproved, notifyVendorPendingEditsRejected } from '../services/notificationService.js';
import { auditProductCreate, auditProductEdit, auditProductSubmit, auditProductArchive, auditProductHide, auditProductApprove, auditProductReject, auditPendingEditsSubmit, auditPendingEditsApprove, auditPendingEditsReject, auditStockAdjust } from '../services/auditService.js';
import {
  getPersonalizedRecommendations,
  getTrendingRecommendations,
  getSimilarProducts,
  getBoughtTogether,
  getAlsoViewed,
} from '../utils/recommendationEngine.js';


// @desc    Fetch all products with advanced Amazon-style dynamic filtering & sorting
// @route   GET /api/products
// @access  Public

 const getProducts = asyncHandler(async (req, res) => {
  try {
    // 1. استخراج الفلاتر والترتيب القادمة ديناميكياً من الـ URL Query
    const { keyword, category, brands, minPrice, maxPrice, rating, sortBy, isAdminQuery, minReviews, inStock, limit } = req.query;

    // 2. بناء كائن الفلترة الأساسي
    let searchFilters = {};

    // فلتر كلمة البحث (Keyword)
    if (keyword) {
      searchFilters.name = {
        $regex: keyword,
        $options: 'i',
      };
    }

    // فلتر القسم (Category) - يتجاهل الفلترة لو كان 'all'
    if (category && category !== 'all') {
      searchFilters.category = { 
        $regex: new RegExp(`^${category}$`, 'i') 
      };
    }

    // فلتر الماركات المتعددة (Multi-Brand Array)
    if (brands) {
      const brandArray = brands.split(',').map(b => new RegExp(`^${b.trim()}$`, 'i'));
      searchFilters.brand = { $in: brandArray };
    }

    // فلتر التقييم (Customer Review)
    if (rating) {
      searchFilters.rating = { $gte: Number(rating) };
    }

    // فلتر نطاق السعر المحمي (Price Range)
    if (minPrice || maxPrice) {
      searchFilters.price = {};
      if (minPrice) searchFilters.price.$gte = Number(minPrice);
      if (maxPrice) searchFilters.price.$lte = Number(maxPrice);
    }

    // فلتر الحد الأدنى للتقييمات (Minimum Reviews)
    if (minReviews) {
      searchFilters.numReviews = { $gte: Number(minReviews) };
    }

    // فلتر المنتجات المتوفرة في المخزن (In Stock)
    if (inStock === 'true') {
      searchFilters.countInStock = { $gt: 0 };
    }

    // فلتر التاجر/البائع (Vendor/User)
    if (req.query.user) {
      searchFilters.user = req.query.user;
    }

    // 🛡️ 3. جدار حماية الحالات
    let statusFilter = { status: "active" };
    
    if (req.headers.authorization) {
      if (isAdminQuery === 'true') {
        statusFilter = {}; // الأدمن يرى كل الحالات (Pending, Active... إلخ)
      }
    }

    // دمج فلاتر البحث مع فلاتر حماية الحالة
    const finalMongoQuery = { ...searchFilters, ...statusFilter };

    // 🌟 4. محرك الترتيب الذكي (Amazon Smart Sorting Engine)
    let sortOptions = { isSponsored: -1 }; 

    if (sortBy === 'price-asc') {
      sortOptions.price = 1;
    } else if (sortBy === 'price-desc') {
      sortOptions.price = -1;
    } else if (sortBy === 'rating') {
      sortOptions.rating = -1;
    } else if (sortBy === 'sales') {
      sortOptions.numSales = -1;
    } else if (sortBy === 'trending') {
      sortOptions.numSales = -1;
      sortOptions.createdAt = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // 5. تنفيذ الاستعلام في قاعدة البيانات مع جلب بيانات التاجر
    // 🌟🌟 التعديل السحري هنا: تغيير vendor إلى user 🌟🌟
    let productsQuery = Product.find(finalMongoQuery)
      .populate('user', 'name email vendorProfile') 
      .sort(sortOptions);

    if (limit) {
      productsQuery = productsQuery.limit(Number(limit));
    }

    const products = await productsQuery;

    // إرجاع المصفوفة مباشرة لحماية الـ Frontend Tags من الكراش
    res.json(products);

  } catch (error) {
    res.status(500);
    throw new Error(`Database Query Pipeline Error: ${error.message}`);
  }
});

// @desc    Fetch a single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category")
    .populate("user", "name vendorProfile");

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found.');
  }
});

// @desc    Create a new product instance (Supports Admin & Vendors)
// @route   POST /api/products
// @access  Private/Admin/Vendor
const createProduct = asyncHandler(async (req, res) => {
  const { 
    name, price, description, image, images, category, brand,
    countInStock, features, specs, colors, sizes, weight,
    dynamicAttributes, sku, isSponsored, sponsoredExpiresAt
  } = req.body;

  // 🛡️ التعديل الجذري: لو الحساب vendor (تاجر)، المنتج ينزل pending إجبارياً فوراً
  let initialStatus = "active";
  if (req.user && req.user.role === "vendor") {
    initialStatus = "pending";
  }

  const product = new Product({
    name,
    price: Number(price),
    user: req.user._id,
    description,
    image,
    images: images || [],
    brand: brand || 'Heavy Tech',
    category,
    countInStock: Number(countInStock) || 0,
    weight: Number(weight) || 0, 
    features: features || [],
    specs: specs || [],
    colors: colors || [],
    sizes: sizes || [],
    dynamicAttributes: dynamicAttributes || [],
    sku: sku || undefined,
    status: initialStatus, 
    isSponsored: req.user.role === "admin" ? (isSponsored || false) : false, 
    sponsoredExpiresAt: sponsoredExpiresAt || null
  });

  const createdProduct = await product.save();
  await auditProductCreate({ user: req.user._id, product: createdProduct, req });
  res.status(201).json(createdProduct);
});

// @desc    Update an existing product profile
// @route   PUT /api/products/:id
// @access  Private/Admin/Vendor
const updateProduct = asyncHandler(async (req, res) => {
  const { 
    name, price, description, image, images, category, brand,
    countInStock, features, specs, colors, sizes, weight,
    dynamicAttributes, sku, isSponsored, sponsoredExpiresAt, status
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    if (req.user.role !== "admin" && product.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Unauthorized! You can only modify your own products.");
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.image = image || product.image;
    product.images = images || product.images;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.price = price !== undefined ? Number(price) : product.price;
    product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock;
    product.weight = weight !== undefined ? Number(weight) : product.weight;
    product.features = features || product.features;
    product.specs = specs || product.specs;
    product.colors = colors || product.colors;
    product.sizes = sizes || product.sizes;
    product.dynamicAttributes = dynamicAttributes || product.dynamicAttributes;
    product.sku = sku || product.sku;

    // 🔄 لو التاجر عدل أي داتا، المنتج يرجع يتقفل pending وميظهرش على الموقع لحد ما توافق عليه تاني
    if (req.user.role === "vendor") {
      product.status = "pending";
    }

    if (req.user.role === "admin") {
      product.status = status || product.status;
      product.isSponsored = isSponsored !== undefined ? isSponsored : product.isSponsored;
      product.sponsoredExpiresAt = sponsoredExpiresAt || product.sponsoredExpiresAt;
    }
    
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found for modification update.');
  }
});

// 🌟🌟🌟 الـ Endpoints الجديدة والمهمة اللي الفرونت إند بيكلمها عند الضغط على Approve أو Reject 🌟🌟🌟

// @desc    Approve a product and make it active
// @route   PUT /api/products/:id/approve
// @access  Private/Admin
const approveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    product.status = 'active';
    if (req.body.category) {
      product.category = req.body.category;
    }
    const approvedProduct = await product.save();

    const io = req.app.get('socketio');
    await notifyVendorProductApproved({
      vendorId: product.user,
      productId: product._id,
      productName: product.name,
      io,
    });
    await auditProductApprove({ user: req.user._id, product, req });

    res.json(approvedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Reject a product and save rejection reason
// @route   PUT /api/products/:id/reject
// @access  Private/Admin
const rejectProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    product.status = 'rejected';
    product.rejectReason = req.body.rejectReason || 'No reason provided';
    const rejectedProduct = await product.save();

    const io = req.app.get('socketio');
    await notifyVendorProductRejected({
      vendorId: product.user,
      productId: product._id,
      productName: product.name,
      reason: product.rejectReason,
      io,
    });
    await auditProductReject({ user: req.user._id, product, reason: product.rejectReason, req });

    res.json(rejectedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a target product entry
// @route   DELETE /api/products/:id
// @access  Private/Admin/Vendor
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    if (req.user.role !== "admin" && product.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Unauthorized! You can only delete your own products.");
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product successfully deleted from database records.' });
  } else {
    res.status(404);
    throw new Error('Product not found.');
  }
});

// @desc    Create a verified customer transaction review for a specific product
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const product = await Product.findById(productId);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('You have already submitted a product review.');
    }

    const hasBoughtAndReceived = await Order.findOne({
      user: req.user._id,
      isPaid: true,
      isDelivered: true,
      'orderItems.product': productId, 
    });

    if (!hasBoughtAndReceived) {
      res.status(400);
      throw new Error('You can only review items that have been fully purchased and delivered.');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
      isVerified: true, 
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Product review successfully published.' });
  } else {
    res.status(404);
    throw new Error('Product not found.');
  }
});

// @desc    Fetch top rated product entries
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "active", numReviews: { $gt: 0 }, countInStock: { $gt: 0 } }).sort({ rating: -1, numReviews: -1 }).limit(12);
  res.json(products);
});

// @desc    Get all products for the logged-in vendor (all statuses: active, pending, rejected, draft)
// @route   GET /api/products/vendor
// @access  Private/Vendor
const getVendorProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id })
      .populate('user', 'name email vendorProfile')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to fetch vendor products: ${error.message}`);
  }
});

// @desc    Vendor updates their own product (creates pendingEdits for active products)
// @route   PUT /api/products/:id/vendor-edit
// @access  Private/Vendor
const vendorEditProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  // Security: vendor can only edit their own products
  if (product.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized. You can only edit your own products.');
  }

  // Fields vendor IS allowed to edit
  const allowedFields = [
    'name', 'description', 'image', 'images', 'price', 'originalPrice',
    'countInStock', 'weight', 'sku', 'category', 'brand',
    'features', 'specs', 'colors', 'sizes', 'dynamicAttributes',
    'metaTitle', 'seoKeywords'
  ];

  // Build the edits object
  const edits = {};
  let hasChanges = false;
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      edits[field] = req.body[field];
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    res.status(400);
    throw new Error('No valid fields to update.');
  }

  // If product is active or approved, create pending edits (don't change live product)
  if (product.status === 'active') {
    product.hasPendingEdits = true;
    product.pendingEdits = edits;
    product.pendingEditsSubmittedAt = new Date();
    product.status = 'pending_review';
    
    await product.save();
    await auditPendingEditsSubmit({ user: req.user._id, product, req });
    return res.json({
      message: 'Your changes have been submitted for review. The live listing remains active until approved.',
      product,
      pendingReview: true
    });
  }

  // If product is draft/pending/rejected, apply changes directly
  for (const [key, value] of Object.entries(edits)) {
    product[key] = value;
  }

  // If rejected, resubmit for review
  if (product.status === 'rejected') {
    product.status = 'pending';
    product.rejectReason = '';
  }

  await product.save();
  await auditProductEdit({ user: req.user._id, product, changes: edits, req });
  res.json({
    message: 'Product updated successfully.',
    product,
    pendingReview: false
  });
});

// @desc    Submit a draft product for review
// @route   PUT /api/products/:id/submit
// @access  Private/Vendor
const submitProductForReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (product.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized.');
  }

  if (product.status !== 'draft' && product.status !== 'rejected') {
    res.status(400);
    throw new Error('Product is already submitted or active.');
  }

  product.status = 'pending';
  product.rejectReason = '';
  await product.save();

  await auditProductSubmit({ user: req.user._id, product, req });
  res.json({ message: 'Product submitted for review.', product });
});

// @desc    Archive a product (soft delete)
// @route   PUT /api/products/:id/archive
// @access  Private/Vendor
const archiveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (product.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized.');
  }

  product.status = 'archived';
  product.archivedAt = new Date();
  await product.save();

  await auditProductArchive({ user: req.user._id, product, req });
  res.json({ message: 'Product archived.', product });
});

// @desc    Hide a product from marketplace
// @route   PUT /api/products/:id/hide
// @access  Private/Vendor
const hideProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (product.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized.');
  }

  product.status = 'hidden';
  product.hiddenAt = new Date();
  product.hiddenReason = req.body.reason || '';
  await product.save();

  await auditProductHide({ user: req.user._id, product, reason: req.body.reason, req });
  res.json({ message: 'Product hidden from marketplace.', product });
});

// @desc    Admin approve pending edits
// @route   PUT /api/products/:id/approve-edits
// @access  Private/Admin
const approvePendingEdits = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (!product.hasPendingEdits || !product.pendingEdits) {
    res.status(400);
    throw new Error('No pending edits to approve.');
  }

  // Apply all pending edits
  const edits = product.pendingEdits;
  for (const [key, value] of Object.entries(edits)) {
    if (key !== 'status' && key !== 'user') {
      product[key] = value;
    }
  }

  product.hasPendingEdits = false;
  product.pendingEdits = null;
  product.pendingEditsSubmittedAt = null;
  product.status = 'active';

  await product.save();

  const io = req.app.get('socketio');
  await notifyVendorPendingEditsApproved({
    vendorId: product.user,
    productId: product._id,
    productName: product.name,
    io,
  });
  await auditPendingEditsApprove({ user: req.user._id, product, req });

  res.json({ message: 'Pending edits approved and applied.', product });
});

// @desc    Admin reject pending edits
// @route   PUT /api/products/:id/reject-edits
// @access  Private/Admin
const rejectPendingEdits = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  product.hasPendingEdits = false;
  product.pendingEdits = null;
  product.pendingEditsSubmittedAt = null;
  product.status = 'active';
  product.rejectReason = req.body.reason || 'Edits rejected by admin.';

  await product.save();

  const io = req.app.get('socketio');
  await notifyVendorPendingEditsRejected({
    vendorId: product.user,
    productId: product._id,
    productName: product.name,
    reason: product.rejectReason,
    io,
  });
  await auditPendingEditsReject({ user: req.user._id, product, reason: product.rejectReason, req });

  res.json({ message: 'Pending edits rejected. Original listing remains.', product });
});

// @desc    Admin suspend a product
// @route   PUT /api/products/:id/suspend
// @access  Private/Admin
const suspendProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  product.status = 'suspended';
  product.suspendedAt = new Date();
  product.suspendedReason = req.body.reason || 'Suspended by admin.';
  await product.save();

  res.json({ message: 'Product suspended.', product });
});

// @desc    Get all products with pending edits (admin)
// @route   GET /api/products/pending-edits
// @access  Private/Admin
const getPendingEditsProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ hasPendingEdits: true })
    .populate('user', 'name email vendorProfile')
    .sort({ pendingEditsSubmittedAt: -1 });

  res.json(products);
});

// @desc    Adjust stock for a product (vendor only)
// @route   PUT /api/products/:id/adjust-stock
// @access  Private/Vendor
const adjustStock = asyncHandler(async (req, res) => {
  const { quantity, reason } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (product.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized. You can only adjust stock for your own products.');
  }

  const previousStock = product.countInStock;
  const newStock = Number(quantity);

  if (isNaN(newStock) || newStock < 0) {
    res.status(400);
    throw new Error('Invalid stock quantity. Must be a non-negative number.');
  }

  product.countInStock = newStock;
  if (req.body.lowStockThreshold !== undefined) {
    product.lowStockThreshold = Number(req.body.lowStockThreshold) || 5;
  }

  await product.save();

  await auditStockAdjust({ user: req.user._id, product, previousStock, newStock, reason: reason || '', req });

  res.json({ message: 'Stock updated.', product, previousStock, newStock });
});

const getRecommendations = asyncHandler(async (req, res) => {
  const { type, productId, limit: limitParam } = req.query;
  const limit = Math.min(parseInt(limitParam) || 20, 50);

  let products = [];

  if (type === 'personalized' && req.user) {
    products = await getPersonalizedRecommendations(req.user._id, limit);
  } else if (type === 'trending') {
    products = await getTrendingRecommendations(limit);
  } else if (type === 'similar' && productId) {
    products = await getSimilarProducts(productId, limit);
  } else if (type === 'boughtTogether' && productId) {
    products = await getBoughtTogether(productId, limit);
  } else if (type === 'alsoViewed' && productId) {
    products = await getAlsoViewed(productId, limit);
  } else {
    products = await getTrendingRecommendations(limit);
  }

  res.json(products);
});

export { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  createProductReview,
  getTopProducts,
  approveProduct,
  rejectProduct,
  getVendorProducts,
  vendorEditProduct,
  submitProductForReview,
  archiveProduct,
  hideProduct,
  approvePendingEdits,
  rejectPendingEdits,
  suspendProduct,
  getPendingEditsProducts,
  adjustStock,
  getRecommendations,
};