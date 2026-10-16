import express from 'express';
const router = express.Router();
import { 
  createOrder, getMyOrders, getOrders, updateOrderToPaid,
  getOrderById, updateOrderToDelivered, updateOrderToProcessed,
  updateOrderToOnWay, cancelOrder, updateOrderToCancelled,
  payOrderWithWallet, getShippingEstimate,
  adminBankRefundAndDeductWallet,
  getMyWalletHistory,
  getAllWalletHistory,
  getVendorOrders,
  customerConfirmItemDelivery, 
  requestVendorPayout,
  // 🌟 [جديد] دوال الأدمن للتحكم في سحوبات التجار
  getPayoutRequests,
  resolvePayoutRequest,
  getVendorWalletTransactions,
} from '../controllers/orderController.js';

import { protect, admin, isVendor } from '../middleware/authMiddleware.js';
import { isEliteMember } from '../middleware/eliteMiddleware.js';

// ============================================================================
// 1. Static Routes Configuration (يجب أن تكون في الأعلى لتجنب تداخل الـ ID)
// ============================================================================
router.route('/').get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);

// 🛡️ مسارات التاجر
router.route('/vendor').get(protect, isVendor, getVendorOrders);
router.route('/vendor/payout').post(protect, isVendor, requestVendorPayout);
router.route('/vendor/wallet-transactions').get(protect, isVendor, getVendorWalletTransactions);

// 🌟🌟🌟 الـ FIX الجذري: مسارات السحب يجب أن تكون هنا فوق الـ /:id 🌟🌟🌟
router.route('/payout-requests').get(protect, admin, getPayoutRequests);
router.route('/payout-requests/:id').put(protect, admin, resolvePayoutRequest);

router.post('/create-checkout-session', protect, isEliteMember, createOrder);
router.route('/shipping-estimate').post(getShippingEstimate);
router.route('/admin/wallet-history').get(protect, admin, getAllWalletHistory);
router.route('/my-wallet-history').get(protect, getMyWalletHistory);

// ============================================================================
// 2. Dynamic Parameter Routes Configuration
// ============================================================================
router.route('/:orderId/item/:itemId/confirm-delivery').put(protect, customerConfirmItemDelivery);

// 👇 مسار الـ ID الديناميكي أصبح في الأسفل بأمان
router.route('/:id').get(protect, getOrderById); 
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/onway').put(protect, admin, updateOrderToOnWay);
router.route('/:id/cancel').put(protect, updateOrderToCancelled);
router.route('/:id/process').put(protect, admin, updateOrderToProcessed);
router.route('/:id/pay-wallet').put(protect, payOrderWithWallet);
router.route('/:id/bank-refund-deduct').put(protect, admin, adminBankRefundAndDeductWallet);

export default router;