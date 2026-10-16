import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0 } = req.query;
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(Number(skip));
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ notifications, unreadCount });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true, readAt: new Date() },
    { returnDocument: 'after' }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found.');
  }
  res.json(notification);
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );
  res.json({ message: 'All notifications marked as read.' });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found.');
  }
  res.json({ message: 'Notification deleted.' });
});

export { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
