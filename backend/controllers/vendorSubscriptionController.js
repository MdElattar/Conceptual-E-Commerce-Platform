import asyncHandler from 'express-async-handler';
import VendorSubscription from '../models/vendorSubscriptionModel.js';
import User from '../models/userModel.js';

const VENDOR_PLANS = [
  {
    id: 'free',
    name: 'Standard Free',
    price: 0,
    currency: 'USD',
    period: 'forever',
    description: 'Essential tools to start selling',
    limits: {
      maxProducts: 10,
      adCredits: 0,
      analytics: false,
      prioritySupport: false,
      featuredStore: false,
      apiAccess: false,
      dedicatedManager: false,
    },
    features: [
      { included: true, text: 'Up to 10 products' },
      { included: true, text: 'Basic order management' },
      { included: true, text: 'Standard support' },
      { included: true, text: 'Cash on delivery & bank transfers' },
      { included: false, text: 'Advertising credits' },
      { included: false, text: 'Sales analytics & reports' },
      { included: false, text: 'Priority support' },
      { included: false, text: 'Featured store badge' },
      { included: false, text: 'API access' },
      { included: false, text: 'Dedicated account manager' },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 29.99,
    currency: 'USD',
    period: '/month',
    description: 'Grow your business with powerful tools',
    popular: true,
    limits: {
      maxProducts: 100,
      adCredits: 5,
      analytics: true,
      prioritySupport: true,
      featuredStore: false,
      apiAccess: true,
      dedicatedManager: false,
    },
    features: [
      { included: true, text: 'Up to 100 products' },
      { included: true, text: 'Advanced order management' },
      { included: true, text: '5 advertising credits/month' },
      { included: true, text: 'Sales analytics & reports' },
      { included: true, text: 'Priority support 24/7' },
      { included: true, text: 'API access for integrations' },
      { included: true, text: 'Cash on delivery & bank transfers' },
      { included: false, text: 'Featured store badge' },
      { included: false, text: 'Dedicated account manager' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    currency: 'USD',
    period: '/month',
    description: 'Maximum exposure & dedicated support',
    limits: {
      maxProducts: 1000,
      adCredits: 25,
      analytics: true,
      prioritySupport: true,
      featuredStore: true,
      apiAccess: true,
      dedicatedManager: true,
    },
    features: [
      { included: true, text: 'Up to 1,000 products' },
      { included: true, text: 'Everything in Professional' },
      { included: true, text: '25 advertising credits/month' },
      { included: true, text: 'Featured store badge' },
      { included: true, text: 'Dedicated account manager' },
      { included: true, text: 'Priority listing in search results' },
      { included: true, text: 'Bulk discount on ad credits' },
    ],
  },
];

const getVendorPlans = asyncHandler(async (req, res) => {
  res.json(VENDOR_PLANS);
});

const getVendorSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('vendorProfile');

  const subscription = await VendorSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    return res.json({
      hasSubscription: false,
      subscription: null,
      plan: user?.vendorProfile?.subscription?.plan || 'free',
      limits: VENDOR_PLANS.find(p => p.id === (user?.vendorProfile?.subscription?.plan || 'free'))?.limits,
    });
  }

  const isActive = subscription.isActive();

  res.json({
    hasSubscription: isActive,
    subscription: isActive ? subscription : { ...subscription.toObject(), status: subscription.status },
    plan: isActive ? subscription.plan : 'free',
    limits: subscription.limits || VENDOR_PLANS.find(p => p.id === subscription.plan)?.limits,
  });
});

const subscribeVendor = asyncHandler(async (req, res) => {
  const { plan, paymentMethod, autoRenew } = req.body;

  if (!plan || !['professional', 'enterprise'].includes(plan)) {
    res.status(400);
    throw new Error('Invalid plan. Choose professional or enterprise.');
  }

  const planDef = VENDOR_PLANS.find(p => p.id === plan);
  if (!planDef) {
    res.status(400);
    throw new Error('Plan not found.');
  }

  const price = planDef.price;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (paymentMethod === 'wallet') {
    const user = await User.findById(req.user._id);
    if (!user || user.storeCredit < price) {
      res.status(400);
      throw new Error('Insufficient wallet balance.');
    }
    user.storeCredit -= price;
    await user.save();
  }

  const updateData = {
    plan,
    price,
    currency: 'USD',
    status: 'active',
    startDate: new Date(),
    expiresAt,
    autoRenew: autoRenew !== undefined ? autoRenew : true,
    limits: planDef.limits,
    paymentMethod: paymentMethod || undefined,
    canceledAt: undefined,
  };

  let subscription = await VendorSubscription.findOne({ user: req.user._id });

  if (subscription) {
    Object.assign(subscription, updateData);
    await subscription.save();
  } else {
    subscription = await VendorSubscription.create({
      user: req.user._id,
      ...updateData,
    });
  }

  const user = await User.findById(req.user._id);
  if (user) {
    user.vendorProfile.subscription = {
      plan,
      expiresAt,
    };
    await user.save();
  }

  res.status(201).json({ success: true, subscription });
});

const cancelVendorSubscription = asyncHandler(async (req, res) => {
  const subscription = await VendorSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    res.status(404);
    throw new Error('No vendor subscription found.');
  }

  if (!subscription.isActive()) {
    res.status(400);
    throw new Error('Your vendor subscription is not active.');
  }

  subscription.autoRenew = false;
  subscription.status = 'canceled';
  subscription.canceledAt = new Date();
  await subscription.save();

  res.json({ success: true, message: 'Vendor subscription canceled. Benefits remain active until expiry.' });
});

const adminGetAllVendorSubscriptions = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status && ['active', 'canceled', 'expired', 'past_due'].includes(status)) {
    query.status = status;
  }
  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    query.user = { $in: users.map(u => u._id) };
  }

  const total = await VendorSubscription.countDocuments(query);
  const subscriptions = await VendorSubscription.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    subscriptions,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
});

export {
  getVendorPlans,
  getVendorSubscription,
  subscribeVendor,
  cancelVendorSubscription,
  adminGetAllVendorSubscriptions,
};
