import express from "express";
const router = express.Router();
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  verifyOTP,
  resendOTP,
  googleAuth,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  logoutAllDevices,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getDashboardStats,
  updateUserFCMToken,
  sendPhoneOTP,
  verifyPhoneOTP,
  submitVendorRequest,
  createIdentityVerificationSession,
  getVendorRequestsList, // 🌟 [جديد] دالة جلب طلبات التجار للأدمن
  reviewVendorRequest,
  getPendingVendors,   // 🌟 [جديد] دالة قبول أو رفض التاجر
  getPublicVendorProfile,
  verify2FALogin,
  generate2FASecret,
  enable2FA,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes,
} from "../controllers/userController.js";
import rateLimit from "express-rate-limit";
import { admin, protect } from "../middleware/authMiddleware.js";
import { cache } from "../middleware/cacheMiddleware.js";

// Rate Limiting Policy Configuration Layer
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window allocation metric
  max: 5, // Maximum threshold allocation before lock out
  message: {
    message: "Too many login attempts, please try again after a minute",
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      message: options.message.message,
      remaining: 0,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication Gateways Routes
router.post("/login", loginLimiter, authUser);
router.post("/google", googleAuth);
router.post("/", registerUser);
router.post("/logout", logoutUser);
router.post("/verify", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.post("/logout-all", protect, logoutAllDevices);

// Mobile SMS OTP Notification Subsystems Gateway Channels
router.post("/send-phone-otp", protect, sendPhoneOTP);
router.post("/verify-phone-otp", protect, verifyPhoneOTP);

// Device Integration Services Channels
router.put("/fcm-token", protect, updateUserFCMToken);

// ========================================================
// 🛡️ منظومة بوابات وطلبات مراجعة التجار (KYC System)
// ========================================================
router.route('/vendor-request').post(protect, submitVendorRequest);
router.route('/verify-identity').post(protect, createIdentityVerificationSession);

// 🌟 [تريكة حل الـ CastError]: تم وضع مسارات الأدمن الثابتة هنا فوق الـ (/:id) مباشرة
router.route('/vendors/pending').get(protect, admin, getPendingVendors);
router.route('/vendor-requests-list').get(protect, admin, getVendorRequestsList);
router.route('/vendor-approval/:id').put(protect, admin, reviewVendorRequest);

// User Profile Context Matrix Routes
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Management Auditing Analytics Dashboard Pipelines
router.route("/").get(protect, admin, getUsers);
router.route("/stats").get(protect, admin, getDashboardStats);

// 🌟 المسار العام لبروفايل التاجر (يجب أن يكون قبل المسارات الديناميكية)
router.route('/public/:id').get(cache(120), getPublicVendorProfile);

// ==========================================
//  Routes — Two-Factor Authentication (2FA)
// ==========================================
router.post('/verify-2fa', verify2FALogin);
router.get('/2fa/secret', protect, generate2FASecret);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/2fa/backup-codes', protect, getBackupCodes);
router.post('/2fa/regenerate-backup-codes', protect, regenerateBackupCodes);

// ========================================================
// 🔴 المسارات الديناميكية (يجب أن تظل دائماً في أسفل الملف)
// ========================================================
router
  .route("/:id")
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

export default router;