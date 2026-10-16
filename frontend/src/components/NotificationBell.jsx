import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheckDouble, FaTrash, FaSpinner, FaTimes, FaClock, FaCheckCircle, FaBan, FaExclamationTriangle, FaBoxOpen, FaTruck, FaMoneyBillWave, FaUserCheck, FaBullhorn } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation, useDeleteNotificationMutation } from '../slices/notificationsApiSlice';

const typeIcons = {
  product_approved: { icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  product_rejected: { icon: FaBan, color: 'text-red-500', bg: 'bg-red-50' },
  product_pending_review: { icon: FaClock, color: 'text-blue-500', bg: 'bg-blue-50' },
  pending_edits_approved: { icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  pending_edits_rejected: { icon: FaBan, color: 'text-red-500', bg: 'bg-red-50' },
  new_order: { icon: FaBoxOpen, color: 'text-orange-500', bg: 'bg-orange-50' },
  order_shipped: { icon: FaTruck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  order_delivered: { icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  order_cancelled: { icon: FaTimes, color: 'text-red-500', bg: 'bg-red-50' },
  payout_processed: { icon: FaMoneyBillWave, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  kyc_approved: { icon: FaUserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ad_approved: { icon: FaBullhorn, color: 'text-purple-500', bg: 'bg-purple-50' },
  system: { icon: FaExclamationTriangle, color: 'text-gray-500', bg: 'bg-gray-50' },
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { userInfo } = useSelector((state) => state.auth);

  const { data, isLoading, refetch } = useGetNotificationsQuery({ limit: 20 }, { skip: !userInfo, pollingInterval: 30000 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userInfo) return;
    const socket = window.socket;
    if (!socket) return;
    const handler = (notification) => {
      refetch();
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [userInfo, refetch]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
    } catch {
      toast.error('Failed to delete notification.');
    }
  };

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
      >
        <FaBell className="text-gray-600" size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                <FaBell className="text-orange-500" size={12} />
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 cursor-pointer">
                  <FaCheckDouble size={10} /> Mark All Read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-8 text-center">
                  <FaSpinner className="animate-spin text-gray-300 mx-auto text-2xl" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FaBell className="text-gray-200 text-3xl mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = typeIcons[notif.type] || typeIcons.system;
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif._id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${!notif.read ? 'bg-orange-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={config.color} size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-xs ${!notif.read ? 'font-black' : 'font-bold'} text-gray-900`}>{notif.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.read && (
                                <button
                                  onClick={() => handleMarkRead(notif._id)}
                                  className="p-1 text-gray-300 hover:text-orange-500 transition-colors cursor-pointer"
                                  title="Mark as read"
                                >
                                  <FaCheckDouble size={10} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notif._id)}
                                className="p-1 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] text-gray-400 font-medium">{getTimeAgo(notif.createdAt)}</span>
                            {notif.link && (
                              <Link to={notif.link} onClick={() => setIsOpen(false)} className="text-[9px] text-orange-600 font-bold hover:underline">
                                View
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
