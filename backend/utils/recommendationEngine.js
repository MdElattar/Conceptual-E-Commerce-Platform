import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import RecentlyViewed from '../models/recentlyViewedModel.js';
import UserBehavior from '../models/userBehaviorModel.js';

const SCORE_WEIGHTS = {
  CATEGORY_MATCH: 10,
  BRAND_MATCH: 5,
  FEATURE_OVERLAP: 3,
  SALES_FACTOR: 2,
  RATING_FACTOR: 1,
  RECENCY_BOOST: 1.5,
};

function calculateScore(product, seedCategories, seedBrands, seedFeatures, viewedProductIds, recencyFactor = 1) {
  let score = 0;

  if (seedCategories.includes(product.category)) {
    score += SCORE_WEIGHTS.CATEGORY_MATCH * recencyFactor;
  }

  if (seedBrands.includes(product.brand)) {
    score += SCORE_WEIGHTS.BRAND_MATCH * recencyFactor;
  }

  if (seedFeatures.length > 0 && product.features) {
    const overlap = product.features.filter(f =>
      seedFeatures.some(sf => sf.toLowerCase() === f.toLowerCase())
    ).length;
    score += overlap * SCORE_WEIGHTS.FEATURE_OVERLAP;
  }

  score += (product.numSales || 0) * SCORE_WEIGHTS.SALES_FACTOR;
  score += (product.rating || 0) * SCORE_WEIGHTS.RATING_FACTOR;

  return score;
}

export async function getPersonalizedRecommendations(userId, limit = 20) {
  const recentlyViewed = await RecentlyViewed.findOne({ user: userId }).lean();

  let seedProductIds = [];
  let seedCategories = [];
  let seedBrands = [];
  let seedFeatures = [];

  if (recentlyViewed?.products?.length) {
    const recentProducts = await Product.find({
      _id: { $in: recentlyViewed.products.map(p => p.product) },
      status: 'active',
    }).lean();

    recentProducts.forEach(p => {
      if (p.category) seedCategories.push(p.category);
      if (p.brand) seedBrands.push(p.brand);
      if (p.features) seedFeatures.push(...p.features);
    });

    seedProductIds = recentProducts.map(p => p._id.toString());
  }

  const purchasedProductIds = await getPurchasedProductIds(userId);

  const orderAggregation = await Order.aggregate([
    { $match: { user: userId, isDelivered: true } },
    { $unwind: '$orderItems' },
    { $group: { _id: '$orderItems.product' } },
  ]);
  const purchasedIds = new Set(orderAggregation.map(o => o._id.toString()));

  const excludedIds = new Set([...seedProductIds, ...purchasedIds]);
  if (userId) excludedIds.add(userId.toString());

  if (seedCategories.length === 0 && seedBrands.length === 0) {
    return getTrendingRecommendations(limit);
  }

  const candidates = await Product.find({
    _id: { $nin: Array.from(excludedIds) },
    status: 'active',
    $or: [
      { category: { $in: seedCategories } },
      { brand: { $in: seedBrands } },
    ],
  }).lean();

  const scored = candidates.map(product => {
    const latestView = recentlyViewed?.products?.find(
      p => p.product.toString() === product._id.toString()
    );
    const daysSinceView = latestView
      ? (Date.now() - new Date(latestView.viewedAt).getTime()) / (1000 * 86400)
      : 30;
    const recencyFactor = Math.max(0.2, 1 - daysSinceView / 30);

    const score = calculateScore(
      product, seedCategories, seedBrands, seedFeatures, seedProductIds, recencyFactor
    );

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(item => item.product);
}

export async function getTrendingRecommendations(limit = 20) {
  return Product.find({ status: 'active' })
    .sort({ numSales: -1, rating: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getSimilarProducts(productId, limit = 10) {
  const source = await Product.findById(productId).lean();
  if (!source) return [];

  const candidates = await Product.find({
    _id: { $ne: productId },
    status: 'active',
    $or: [
      { category: source.category },
      { brand: source.brand },
    ],
  }).lean();

  const srcFeatures = source.features || [];
  const srcCategory = source.category;
  const srcBrand = source.brand;

  const scored = candidates.map(product => {
    let score = 0;

    if (product.category === srcCategory) score += SCORE_WEIGHTS.CATEGORY_MATCH;
    if (product.brand === srcBrand) score += SCORE_WEIGHTS.BRAND_MATCH;

    if (srcFeatures.length > 0 && product.features) {
      const overlap = product.features.filter(f =>
        srcFeatures.some(sf => sf.toLowerCase() === f.toLowerCase())
      ).length;
      score += overlap * SCORE_WEIGHTS.FEATURE_OVERLAP;
    }

    score += (product.numSales || 0) * SCORE_WEIGHTS.SALES_FACTOR;
    score += (product.rating || 0) * SCORE_WEIGHTS.RATING_FACTOR;

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(item => item.product);
}

export async function getAlsoViewed(productId, limit = 10) {
  const viewEvents = await UserBehavior.find({
    product: productId,
    eventType: 'view',
  })
    .select('user')
    .lean();

  if (viewEvents.length === 0) return getSimilarProducts(productId, limit);

  const userIds = [...new Set(viewEvents.map(e => e.user.toString()))];

  const coViewEvents = await UserBehavior.aggregate([
    { $match: { user: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) }, eventType: 'view' } },
    { $group: { _id: '$product', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit + 10 },
  ]);

  const coViewedIds = coViewEvents
    .map(e => e._id.toString())
    .filter(id => id !== productId)
    .slice(0, limit);

  if (coViewedIds.length === 0) return getSimilarProducts(productId, limit);

  const products = await Product.find({
    _id: { $in: coViewedIds },
    status: 'active',
  }).lean();

  const idOrder = new Map(coViewedIds.map((id, i) => [id, i]));
  products.sort((a, b) => (idOrder.get(a._id.toString()) || 0) - (idOrder.get(b._id.toString()) || 0));

  return products;
}

export async function getBoughtTogether(productId, limit = 10) {
  const orders = await Order.find({
    'orderItems.product': productId,
    isDelivered: true,
  })
    .select('orderItems')
    .lean();

  const coOccurrence = new Map();

  orders.forEach(order => {
    if (!order.orderItems) return;
    const productIds = order.orderItems
      .map(item => item.product?.toString())
      .filter(id => id && id !== productId);

    const uniqueIds = [...new Set(productIds)];
    uniqueIds.forEach(id => {
      coOccurrence.set(id, (coOccurrence.get(id) || 0) + 1);
    });
  });

  if (coOccurrence.size === 0) return [];

  const sorted = [...coOccurrence.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const products = await Product.find({
    _id: { $in: sorted },
    status: 'active',
  }).lean();

  const idOrder = new Map(sorted.map((id, i) => [id, i]));
  products.sort((a, b) => (idOrder.get(a._id.toString()) || 0) - (idOrder.get(b._id.toString()) || 0));

  return products;
}

async function getPurchasedProductIds(userId) {
  const orders = await Order.find({ user: userId, isDelivered: true })
    .select('orderItems.product')
    .lean();
  const ids = new Set();
  orders.forEach(order => {
    if (order.orderItems) {
      order.orderItems.forEach(item => {
        if (item.product) ids.add(item.product.toString());
      });
    }
  });
  return Array.from(ids);
}
