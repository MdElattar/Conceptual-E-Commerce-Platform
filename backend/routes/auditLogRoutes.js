import express from 'express';
const router = express.Router();
import { getAuditLogs, getUserAuditLogs } from '../controllers/auditLogController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').get(protect, admin, getAuditLogs);
router.route('/user/:userId').get(protect, admin, getUserAuditLogs);

export default router;
