import express from 'express';
const router = express.Router();
import {
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
} from '../controllers/eliteController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';

router.route('/plans').get(cache(300), getPlans);
router.route('/').get(protect, getMembership).post(protect, subscribe);
router.route('/create-checkout-session').post(protect, createEliteCheckoutSession);
router.route('/webhook').post(express.raw({ type: 'application/json' }), handleEliteWebhook);
router.route('/cancel-request').post(protect, requestCancellation);
router.route('/reactivate').post(protect, reactivateMembership);
router.route('/auto-renew').patch(protect, toggleAutoRenew);
router.route('/check/:userId').get(cache(60), checkElite);
router.route('/admin').get(protect, admin, adminGetAllMemberships);
router.route('/admin/:id').put(protect, admin, adminUpdateMembership);

export default router;
