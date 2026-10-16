import express from 'express';
const router = express.Router();
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getMyNotifications);
router.route('/read-all').put(protect, markAllAsRead);
router.route('/:id/read').put(protect, markAsRead);
router.route('/:id').delete(protect, deleteNotification);

export default router;
