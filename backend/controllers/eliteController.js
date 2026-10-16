import asyncHandler from 'express-async-handler';
import stripePackage from 'stripe';
import EliteSubscription from '../models/eliteSubscriptionModel.js';
import User from '../models/userModel.js';

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

const ELITE_PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    currency: 'USD',
    period: 'forever',
    description: 'Essential access for individual buyers',
    features: [
      { included: true, text: 'Standard shipping on all orders' },
      { included: true, text: 'Order tracking & notifications' },
      { included: true, text: 'Basic customer support' },
      { included: true, text: '30-day return window' },
      { included: false, text: 'Exclusive member discounts' },
      { included: false, text: 'Priority customer service' },
      { included: false, text: 'Free expedited shipping' },
      { included: false, text: 'Early access to deals' },
    ],
    benefits: [],
  },
  {
    id: 'monthly',
    name: 'Elite Monthly',
    price: 9.99,
    currency: 'USD',
    period: '/month',
    description: 'Premium benefits for serious shoppers',
    popular: true,
    features: [
      { included: true, text: 'Everything in Starter' },
      { included: true, text: 'Up to 20% off on all orders' },
      { included: true, text: 'Free expedited shipping' },
      { included: true, text: '45-day extended returns' },
      { included: true, text: 'Priority 24/7 customer service' },
      { included: true, text: 'Early access to limited deals' },
      { included: true, text: 'Exclusive Elite-only products' },
      { included: false, text: 'Vendor marketplace tools' },
    ],
    benefits: [
      'Up to 20% off on all orders',
      'Free expedited shipping',
      '45-day extended returns',
      'Priority 24/7 customer service',
      'Early access to limited deals',
      'Exclusive Elite-only products',
    ],
  },
  {
    id: 'yearly',
    name: 'Elite Yearly',
    price: 99.99,
    currency: 'USD',
    period: '/year',
    description: 'Best value — save 17% compared to monthly',
    popular: false,
    features: [
      { included: true, text: 'Everything in Elite Monthly' },
      { included: true, text: 'Up to 20% off on all orders' },
      { included: true, text: 'Free expedited shipping' },
      { included: true, text: '45-day extended returns' },
      { included: true, text: 'Priority 24/7 customer service' },
      { included: true, text: 'Early access to limited deals' },
      { included: true, text: 'Exclusive Elite-only products' },
      { included: true, text: '2 months free (save 17%)' },
    ],
    benefits: [
      'Up to 20% off on all orders',
      'Free expedited shipping',
      '45-day extended returns',
      'Priority 24/7 customer service',
      'Early access to limited deals',
      'Exclusive Elite-only products',
      'Best annual value',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    currency: 'USD',
    period: '/month',
    description: 'Complete solution for businesses & traders',
    features: [
      { included: true, text: 'Everything in Elite' },
      { included: true, text: 'Bulk order discounts up to 35%' },
      { included: true, text: 'Dedicated account manager' },
      { included: true, text: '60-day extended returns' },
      { included: true, text: 'Vendor marketplace listing' },
      { included: true, text: 'API integration for procurement' },
      { included: true, text: 'Multi-user account management' },
      { included: true, text: 'Custom negotiated pricing' },
    ],
    benefits: [
      'Bulk order discounts up to 35%',
      'Dedicated account manager',
      '60-day extended returns',
      'Vendor marketplace listing',
      'API integration for procurement',
      'Multi-user account management',
      'Custom negotiated pricing',
    ],
  },
];

const getPlans = asyncHandler(async (req, res) => {
  res.json(ELITE_PLANS);
});

const getMembership = asyncHandler(async (req, res) => {
  const subscription = await EliteSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    return res.json({
      isElite: false,
      subscription: null,
      plan: 'free',
    });
  }

  const isActive = subscription.isActive();

  res.json({
    isElite: isActive,
    subscription: isActive ? subscription : { ...subscription.toObject(), status: subscription.status },
    plan: isActive ? subscription.plan : 'free',
  });
});

const subscribe = asyncHandler(async (req, res) => {
  const { plan, paymentMethod, autoRenew } = req.body;

  if (!plan || !['monthly', 'yearly'].includes(plan)) {
    res.status(400);
    throw new Error('Invalid plan. Choose monthly or yearly.');
  }

  const planDef = ELITE_PLANS.find(p => p.id === plan);
  if (!planDef) {
    res.status(400);
    throw new Error('Plan not found.');
  }

  if (!paymentMethod || paymentMethod === 'stripe') {
    return res.json({ success: false, redirectToCheckout: true, plan, message: 'Please complete payment via checkout.' });
  }

  const price = planDef.price;
  const durationDays = plan === 'yearly' ? 365 : 30;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  let existing = await EliteSubscription.findOne({ user: req.user._id });

  if (existing && existing.isActive()) {
    existing.plan = plan;
    existing.price = price;
    existing.status = 'active';
    existing.startDate = new Date();
    existing.expiresAt = expiresAt;
    existing.autoRenew = autoRenew !== undefined ? autoRenew : true;
    existing.benefits = planDef.benefits;
    if (paymentMethod) existing.paymentMethod = paymentMethod;

    if (paymentMethod === 'wallet') {
      const user = await User.findById(req.user._id);
      if (!user || user.storeCredit < price) {
        return res.status(402).json({ success: false, redirectToCheckout: true, amount: price });
      }
      user.storeCredit -= price;
      await user.save();
    }

    const updated = await existing.save();
    return res.status(200).json({ success: true, subscription: updated });
  }

  if (existing) {
    existing.plan = plan;
    existing.price = price;
    existing.status = 'active';
    existing.startDate = new Date();
    existing.expiresAt = expiresAt;
    existing.autoRenew = autoRenew !== undefined ? autoRenew : true;
    existing.canceledAt = undefined;
    existing.benefits = planDef.benefits;
    if (paymentMethod) existing.paymentMethod = paymentMethod;
  }

  if (paymentMethod === 'wallet') {
    const user = await User.findById(req.user._id);
    if (!user || user.storeCredit < price) {
      return res.status(402).json({ success: false, redirectToCheckout: true, amount: price });
    }
    user.storeCredit -= price;
    await user.save();
  }

  if (existing) {
    const updated = await existing.save();
    return res.status(200).json({ success: true, subscription: updated });
  }

  const subscription = await EliteSubscription.create({
    user: req.user._id,
    plan,
    price,
    currency: 'USD',
    expiresAt,
    autoRenew: autoRenew !== undefined ? autoRenew : true,
    benefits: planDef.benefits,
    paymentMethod: paymentMethod || undefined,
  });

  res.status(201).json({ success: true, subscription });
});

const createEliteCheckoutSession = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!plan || !['monthly', 'yearly'].includes(plan)) {
    res.status(400);
    throw new Error('Invalid plan.');
  }

  const planDef = ELITE_PLANS.find(p => p.id === plan);
  if (!planDef) {
    res.status(400);
    throw new Error('Plan not found.');
  }

  const existing = await EliteSubscription.findOne({ user: req.user._id, status: 'active', expiresAt: { $gt: new Date() } });
  if (existing) {
    res.status(400);
    throw new Error('You already have an active Elite membership.');
  }

  const priceInCents = Math.round(planDef.price * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: req.user.email,
    client_reference_id: req.user._id.toString(),
    metadata: {
      plan,
      userId: req.user._id.toString(),
      type: 'elite_subscription',
    },
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `DK-TEC Elite ${planDef.name}`,
          description: planDef.description,
        },
        unit_amount: priceInCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${req.headers.origin || 'http://localhost:3000'}/elite-dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin || 'http://localhost:3000'}/dk-elite`,
  });

  res.json({ url: session.url, sessionId: session.id });
});

const handleEliteWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { plan, userId } = session.metadata;

    if (!plan || !userId) {
      res.status(400).json({ error: 'Missing metadata' });
      return;
    }

    const planDef = ELITE_PLANS.find(p => p.id === plan);
    if (!planDef) {
      res.status(400).json({ error: 'Plan not found' });
      return;
    }

    const durationDays = plan === 'yearly' ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    let subscription = await EliteSubscription.findOne({ user: userId });

    if (subscription) {
      subscription.plan = plan;
      subscription.price = planDef.price;
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.expiresAt = expiresAt;
      subscription.autoRenew = true;
      subscription.paymentMethod = 'stripe';
      subscription.stripeSubscriptionId = session.id;
      subscription.benefits = planDef.benefits;
    } else {
      subscription = await EliteSubscription.create({
        user: userId,
        plan,
        price: planDef.price,
        currency: 'USD',
        expiresAt,
        autoRenew: true,
        paymentMethod: 'stripe',
        stripeSubscriptionId: session.id,
        benefits: planDef.benefits,
      });
    }

    await subscription.save();
  }

  res.json({ received: true });
});

const requestCancellation = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const subscription = await EliteSubscription.findOne({ user: req.user._id });

  if (!subscription || !subscription.isActive()) {
    res.status(400);
    throw new Error('No active Elite membership found.');
  }

  subscription.cancelReason = reason || '';
  subscription.cancelRequestedAt = new Date();
  subscription.status = 'pending_cancel';
  await subscription.save();

  res.json({ success: true, message: 'Cancellation request submitted to admin.' });
});

const reactivateMembership = asyncHandler(async (req, res) => {
  const subscription = await EliteSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    res.status(404);
    throw new Error('No Elite membership found to reactivate.');
  }

  if (subscription.isActive()) {
    res.status(400);
    throw new Error('Your Elite membership is already active.');
  }

  const durationDays = subscription.plan === 'yearly' ? 365 : 30;
  subscription.status = 'active';
  subscription.autoRenew = true;
  subscription.canceledAt = undefined;
  subscription.expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  subscription.startDate = new Date();
  await subscription.save();

  res.json({ success: true, subscription });
});

const checkElite = asyncHandler(async (req, res) => {
  const subscription = await EliteSubscription.findOne({
    user: req.params.userId,
    status: 'active',
    expiresAt: { $gt: new Date() },
  });

  res.json({ isElite: !!subscription });
});

const adminGetAllMemberships = asyncHandler(async (req, res) => {
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

  const total = await EliteSubscription.countDocuments(query);
  const memberships = await EliteSubscription.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    memberships,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
});

const adminUpdateMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { plan, status, expiresAt, autoRenew, price } = req.body;

  const subscription = await EliteSubscription.findById(id);
  if (!subscription) {
    res.status(404);
    throw new Error('Membership not found.');
  }

  if (status === 'canceled' && subscription.status !== 'canceled') {
    const refundAmount = subscription.price || 0;
    if (refundAmount > 0) {
      const user = await User.findById(subscription.user);
      if (user) {
        user.storeCredit = (user.storeCredit || 0) + refundAmount;
        await user.save();
      }
    }
  }

  if (plan) subscription.plan = plan;
  if (status) subscription.status = status;
  if (expiresAt) subscription.expiresAt = new Date(expiresAt);
  if (autoRenew !== undefined) subscription.autoRenew = autoRenew;
  if (price !== undefined) subscription.price = price;

  const updated = await subscription.save();
  res.json({ success: true, subscription: updated });
});

const toggleAutoRenew = asyncHandler(async (req, res) => {
  const subscription = await EliteSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    res.status(404);
    throw new Error('No Elite membership found.');
  }

  subscription.autoRenew = !subscription.autoRenew;
  await subscription.save();

  res.json({ success: true, autoRenew: subscription.autoRenew });
});

export {
  getPlans,
  getMembership,
  subscribe,
  createEliteCheckoutSession,
  handleEliteWebhook,
  requestCancellation,
  reactivateMembership,
  checkElite,
  adminGetAllMemberships,
  adminUpdateMembership,
  toggleAutoRenew,
};
