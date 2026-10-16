import asyncHandler from 'express-async-handler';
import AuditLog from '../models/auditLogModel.js';

// @desc    Get all audit logs (admin)
// @route   GET /api/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const { limit = 100, skip = 0, action, userId } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (userId) filter.user = userId;

  const logs = await AuditLog.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(Number(skip));

  const total = await AuditLog.countDocuments(filter);

  res.json({ logs, total });
});

// @desc    Get audit logs for a specific user (admin only)
// @route   GET /api/audit-logs/user/:userId
// @access  Private/Admin
const getUserAuditLogs = asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0 } = req.query;
  const logs = await AuditLog.find({ user: req.params.userId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(Number(skip));

  res.json(logs);
});

export { getAuditLogs, getUserAuditLogs };
