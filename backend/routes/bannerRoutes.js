// backend/routes/bannerRoutes.js
import express from 'express';
const router = express.Router();
import {
  getBanners,
  getAdminBanners,
  createBanner,
  deleteBanner,
  toggleBannerStatus,
} from '../controllers/bannerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';
import { delPattern } from '../utils/cacheService.js';

const invalidateBannerCache = async (req, res, next) => {
  await delPattern('cache:/api/banners*');
  next();
};

// مسار عام للعملاء ومسار للأدمن لإنشاء البانر
router.route('/')
  .get(cache(300), getBanners)
  .post(protect, admin, invalidateBannerCache, createBanner);

// مسار للأدمن لرؤية كل البانرات (نشطة وغير نشطة)
router.route('/admin').get(protect, admin, cache(120), getAdminBanners);

// مسارات التحكم بالحذف والتعديل
router.route('/:id').delete(protect, admin, invalidateBannerCache, deleteBanner);
router.route('/:id/toggle').put(protect, admin, invalidateBannerCache, toggleBannerStatus);

export default router;