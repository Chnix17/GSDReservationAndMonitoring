import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, 
  FaCheck, 
  FaClock, 
  FaTimes, 
  FaTrash, 
  FaCheckCircle, 
  FaFilter,
  FaEye,
  FaChevronLeft,
  FaChevronRight 
} from 'react-icons/fa';

import Sidebar from './Sidebar';
import { SecureStorage } from '../../utils/encryption';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Reset to first page when filters or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, notifications.length]);

  // Fetch notifications from API (aligned with Sidebar)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const baseUrl = SecureStorage.getLocalItem('url');
        const userId = SecureStorage.getSessionItem('user_id');
        const departmentId = SecureStorage.getSessionItem('department_id');
        const userLevelId = SecureStorage.getSessionItem('user_level_id');

        // Regular notifications
        const regularResponse = await fetch(`${baseUrl}/faculty&Staff.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'fetchNotification',
            userId
          })
        });
        const regularData = await regularResponse.json();

        // Approval notifications
        const approvalResponse = await fetch(`${baseUrl}/process_reservation.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'fetchApprovalNotification',
            department_id: departmentId,
            user_level_id: userLevelId
          })
        });
        const approvalData = await approvalResponse.json();

        // Read approvals map for current user
        const readResponse = await fetch(`${baseUrl}/process_reservation.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: 'fetchReadApprovalNotification' })
        });
        const readData = await readResponse.json();

        const readApprovalMap = new Map();
        if (readData.status === 'success') {
          readData.data.forEach(r => {
            if (String(r.user_id) === String(userId) && Number(r.is_read) === 1) {
              readApprovalMap.set(r.notification_id, true);
            }
          });
        }

        let all = [];

        if (regularData.status === 'success') {
          const regs = regularData.data.map(n => ({
            ...n,
            id: n.notification_reservation_id,
            type: 'pending',
            title: 'Reservation Status',
            message: n.notification_message,
            date: n.notification_created_at,
            // keep backend-aligned is_read if present, default to 0 (unread)
            is_read: typeof n.is_read !== 'undefined' ? Number(n.is_read) : 0,
            priority: 'medium',
            details: `Reservation ID: ${n.notification_reservation_reservation_id}\nUser ID: ${n.notification_user_id}\nCreated At: ${n.notification_created_at}`
          }));
          all = [...all, ...regs];
        }

        if (approvalData.status === 'success') {
          const apps = approvalData.data
            .filter(n => String(n.notification_department_id) === String(departmentId) && String(n.notification_user_level_id) === String(userLevelId))
            .map(n => ({
              ...n,
              id: n.notification_id,
              type: 'approval',
              title: 'Approval Request',
              message: n.notification_message,
              date: n.notification_create,
              is_read: readApprovalMap.has(n.notification_id) ? 1 : 0,
              priority: 'high',
              details: `Department ID: ${n.notification_department_id}\nUser Level: ${n.notification_user_level_id}\nCreated At: ${n.notification_create}`
            }));
          all = [...all, ...apps];
        }

        all.sort((a, b) => {
          const dateA = new Date(a.date || a.notification_created_at || a.notification_create);
          const dateB = new Date(b.date || b.notification_created_at || b.notification_create);
          return dateB - dateA;
        });

        setNotifications(all);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'accepted':
        return <FaCheckCircle className="text-green-500 w-5 h-5" />;
      case 'pending':
        return <FaClock className="text-yellow-500 w-5 h-5" />;
      case 'declined':
        return <FaTimes className="text-red-500 w-5 h-5" />;
      case 'approval':
        return <FaBell className="text-blue-500 w-5 h-5" />;
      default:
        return <FaBell className="text-gray-500 w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 172800000) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const markAsRead = async (id) => {
    try {
      const baseUrl = SecureStorage.getLocalItem('url');
      const userId = SecureStorage.getSessionItem('user_id');
      const notif = notifications.find(n => n.id === id);
      if (!notif) return;

      if (notif.notification_reservation_id) {
        // Regular notification
        await fetch(`${baseUrl}/faculty&Staff.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'updateReadNotification',
            notificationIds: [notif.notification_reservation_id],
            userId
          })
        });
      } else if (notif.notification_id) {
        // Approval notification
        await fetch(`${baseUrl}/process_reservation.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'updateReadApprovalNotification',
            notification_ids: [notif.notification_id],
            user_id: userId
          })
        });
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
    setSelectedNotification(null);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'read') return Number(n.is_read) === 1;
    if (filter === 'unread') return Number(n.is_read) === 0;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIdx = (currentPageSafe - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIdx, endIdx);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col mt-20">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-500 mt-1">
                    {notifications.filter(n => Number(n.is_read) === 0).length} unread notifications
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[#145414] bg-white hover:bg-[#d4f4dc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#145414]"
                  >
                    <FaFilter className="mr-2" />
                    Filter
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          filter === 'all'
                            ? 'bg-[#145414] text-white'
                            : 'bg-gray-100 text-[#145414] hover:bg-[#d4f4dc]'
                        } transition-colors duration-200`}
                      >
                        All
                      </button>
                      {['read', 'unread'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilter(type)}
                          className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                            filter === type
                              ? 'bg-[#145414] text-white'
                              : 'bg-gray-100 text-[#145414] hover:bg-[#d4f4dc]'
                          } transition-colors duration-200`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="divide-y divide-gray-200">
              {paginatedNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                    Number(notification.is_read) === 0 ? 'bg-[#d4f4dc]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-gray-600">{notification.message}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {formatDate(notification.date)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {Number(notification.is_read) === 0 && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-[#145414] hover:bg-[#d4f4dc] rounded"
                              title="Mark as read"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedNotification(notification)}
                            className="p-2 text-[#145414] hover:bg-[#d4f4dc] rounded"
                            title="View details"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-[#145414] hover:bg-[#d4f4dc] rounded"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <FaBell className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-500">No notifications found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredNotifications.length > 0 && (
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPageSafe === 1}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-[#145414] bg-white border border-gray-300 hover:bg-[#d4f4dc] disabled:opacity-50"
                >
                  <FaChevronLeft /> Prev
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-8 h-8 rounded-md text-sm font-medium ${
                        pg === currentPageSafe ? 'bg-[#145414] text-white' : 'bg-gray-100 text-[#145414] hover:bg-[#d4f4dc]'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPageSafe === totalPages}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-[#145414] bg-white border border-gray-300 hover:bg-[#d4f4dc] disabled:opacity-50"
                >
                  Next <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedNotification.type)}
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedNotification.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">{selectedNotification.message}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600">
                    {selectedNotification.details}
                  </pre>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{formatDate(selectedNotification.date)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full ${getPriorityBadge(selectedNotification.priority)}`}>
                    {selectedNotification.priority} priority
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPage;