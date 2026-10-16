import EliteSubscription from '../models/eliteSubscriptionModel.js';

const isEliteMember = async (req, res, next) => {
  try {
    if (!req.user) {
      req.isEliteMember = false;
      return next();
    }

    const subscription = await EliteSubscription.findOne({
      user: req.user._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    req.isEliteMember = !!subscription;
    req.eliteSubscription = subscription || null;
    next();
  } catch (error) {
    req.isEliteMember = false;
    next();
  }
};

const requireElite = async (req, res, next) => {
  try {
    const subscription = await EliteSubscription.findOne({
      user: req.user._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    if (!subscription) {
      res.status(403);
      throw new Error('DK-TEC Elite membership required.');
    }

    req.eliteSubscription = subscription;
    next();
  } catch (error) {
    res.status(403);
    throw new Error('DK-TEC Elite membership required.');
  }
};

export { isEliteMember, requireElite };
