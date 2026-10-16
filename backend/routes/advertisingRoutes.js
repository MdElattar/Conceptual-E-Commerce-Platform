// backend/routes/advertisingRoutes.js
import express from 'express';
const router = express.Router();

import { 
    requestProductBoost, 
    getPendingAdRequests, 
    resolveAdRequest 
} from '../controllers/advertisingController.js';
import { protect, admin, isVendor } from '../middleware/authMiddleware.js';

// مسار التاجر لطلب الإعلان
router.route('/boost').post(protect, isVendor, requestProductBoost);

// مسارات الإدارة لجلب الطلبات والموافقة/الرفض
router.route('/requests').get(protect, admin, getPendingAdRequests);
router.route('/requests/:id').put(protect, admin, resolveAdRequest);

export default router;