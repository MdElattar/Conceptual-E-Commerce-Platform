import express from 'express';
const router = express.Router();
import { 
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
  getRecommendations
} from '../controllers/productController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';
import { delPattern } from '../utils/cacheService.js';
import { isVendor, isVerifiedVendor, isAdminOrVendor } from '../middleware/vendorMiddleware.js';

router.route('/:id/approve').put(protect, admin, approveProduct);
router.route('/:id/reject').put(protect, admin, rejectProduct);

router.get('/top', cache(300), getTopProducts);
router.get('/recommendations', optionalAuth, getRecommendations);

router.route('/vendor').get(protect, isVendor, getVendorProducts);

// 🌟 Admin pending edits
router.route('/pending-edits').get(protect, admin, getPendingEditsProducts);
router.route('/:id/approve-edits').put(protect, admin, approvePendingEdits);
router.route('/:id/reject-edits').put(protect, admin, rejectPendingEdits);

// 🌟 Admin suspend
router.route('/:id/suspend').put(protect, admin, suspendProduct);

// 🌟 Vendor product management
router.route('/:id/vendor-edit').put(protect, isVendor, vendorEditProduct);
router.route('/:id/submit').put(protect, isVendor, submitProductForReview);
router.route('/:id/archive').put(protect, isVendor, archiveProduct);
router.route('/:id/hide').put(protect, isVendor, hideProduct);
router.route('/:id/adjust-stock').put(protect, isVendor, adjustStock);

const invalidateProductCache = async (req, res, next) => {
  await delPattern('cache:/api/products*');
  next();
};

router.route('/')
  .get(cache(60), getProducts)
  .post(protect, isAdminOrVendor, invalidateProductCache, createProduct);

router.route('/:id/reviews').post(protect, createProductReview);

router.route('/:id')
  .get(cache(120), getProductById)
  .put(protect, isAdminOrVendor, invalidateProductCache, updateProduct)   
  .delete(protect, isAdminOrVendor, invalidateProductCache, deleteProduct);

export default router;