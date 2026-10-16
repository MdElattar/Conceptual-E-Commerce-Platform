import express from 'express';
const router = express.Router();
import { 
  createCoupon, 
  validateCoupon, 
  getCoupons, 
  deleteCoupon 
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// Base Route: /api/coupons
router.route('/')
  .get(protect, admin, getCoupons)    
  .post(protect, admin, createCoupon); 

// Validation Route
router.post('/validate', protect, validateCoupon); 

// Target Identifier Parameterized Routes
router.route('/:id')
  .delete(protect, admin, deleteCoupon); 

export default router;