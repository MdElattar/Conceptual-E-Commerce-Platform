import express from 'express';
const router = express.Router();
import { createCategoryRequest, getCategoryRequests, updateCategoryRequest } from '../controllers/categoryRequestController.js';
import { protect, admin, isVendor } from '../middleware/authMiddleware.js';

router.route('/').post(protect, isVendor, createCategoryRequest).get(protect, admin, getCategoryRequests);
router.route('/:id').put(protect, admin, updateCategoryRequest);

export default router;