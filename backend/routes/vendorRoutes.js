import express from 'express';
const router = express.Router();
import { 
  getVendorStats, 
  getVendorOrders, 
  updateVendorOrderItemStatus, 
  requestPayout,
  getSellerPerformance,
  getVendorAnalytics 
} from '../controllers/vendorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isVendor, isVerifiedVendor } from '../middleware/vendorMiddleware.js';

// 📊 جلب إحصائيات لوحة تحكم التاجر (المحفظة، المنتجات، المبيعات)
router.get('/stats', protect, isVendor, getVendorStats);

// 📦 جلب الطلبات والمنتجات الخاصة بهذا التاجر فقط (مع حماية بيانات التجار الآخرين)
router.get('/orders', protect, isVendor, getVendorOrders);

// 🚚 [تريكة الـ Escrow] تحديث حالة شحن المنتج وفك حجز الأموال للتاجر أوتوماتيكياً عند التوصيل
router.put('/orders/:orderId/item/:itemId', protect, isVerifiedVendor, updateVendorOrderItemStatus);

// 📊 Seller Performance Metrics Dashboard
router.get('/performance', protect, isVendor, getSellerPerformance);

// 💰 طلب سحب الأرباح من محفظة التاجر للحساب البنكي الرسمي
router.post('/withdraw', protect, isVerifiedVendor, requestPayout);

// 📈 Advanced Analytics — top/bottom products, weekly trends, comparisons, inventory, forecast
router.get('/analytics', protect, isVendor, getVendorAnalytics);

export default router;