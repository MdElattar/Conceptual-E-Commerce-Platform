import express from 'express';
const router = express.Router();
import { getShippingRates, createShippingRate, deleteShippingRate } from '../controllers/shippingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').get(protect, admin, getShippingRates).post(protect, admin, createShippingRate);
router.route('/:id').delete(protect, admin, deleteShippingRate);

export default router;