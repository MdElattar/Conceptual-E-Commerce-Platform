import express from 'express';
const router = express.Router();
import {
  getVendorPlans,
  getVendorSubscription,
  subscribeVendor,
  cancelVendorSubscription,
  adminGetAllVendorSubscriptions,
} from '../controllers/vendorSubscriptionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';

const vendorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'vendor' || req.user.role === 'admin' || req.user.isAdmin)) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a vendor');
  }
};

router.route('/plans').get(cache(300), getVendorPlans);
router.route('/').get(protect, vendorOrAdmin, getVendorSubscription).post(protect, vendorOrAdmin, subscribeVendor);
router.route('/cancel').post(protect, vendorOrAdmin, cancelVendorSubscription);
router.route('/admin').get(protect, admin, adminGetAllVendorSubscriptions);

export default router;
