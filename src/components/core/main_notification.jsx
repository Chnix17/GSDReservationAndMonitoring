import React, { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, 
  FaCheck, 
  FaClock, 
  FaTimes, 
  FaCheckCircle, 
  FaFilter
} from 'react-icons/fa';
import { Card, Empty, Pagination } from 'antd';

import Sidebar from './Sidebar';
import { SecureStorage } from '../../utils/encryption';

const NotificationPage = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Update page size based on screen size
  useEffect(() => {
    if (isMobile) {
      setItemsPerPage(5);
    } else if (isTablet) {
      setItemsPerPage(8);
    } else {
      setItemsPerPage(10);
    }
  }, [isMobile, isTablet]);

  // Reset to first page when filters or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, notifications.length]);

  // Fetch notifications from API (aligned with Sidebar)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const baseUrl = SecureStorage.getLocalItem('url');
        const userId = SecureStorage.getLocalItem('user_id');

        // Regular notifications
        const regularResponse = await fetch(`${baseUrl}faculty&staff.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'fetchNotification',
            userId
          })
        });
        const regularData = await regularResponse.json();


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


        all.sort((a, b) => {
          const dateA = new Date(a.date || a.notification_created_at);
          const dateB = new Date(b.date || b.notification_created_at);
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
      const userId = SecureStorage.getLocalItem('user_id');
      const notif = notifications.find(n => n.id === id);
      if (!notif) return;

      if (notif.notification_reservation_id) {
        // Regular notification
        await fetch(`${baseUrl}faculty&staff.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'updateReadNotification',
            notificationIds: [notif.notification_reservation_id],
            userId
          })
        });
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
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
    <div className="flex min-h-screen bg-gradient-to-br from-green-100 to-white">
      {!isMobile && (
        <div className="flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {isMobile && (
        <div className="flex-shrink-0">
          <Sidebar />
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <div className={`${isMobile ? 'px-4 py-4 mt-16' : isTablet ? 'px-6 py-6 mt-20' : 'px-8 py-6 mt-20 max-w-7xl mx-auto'} min-h-screen w-full`}>
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4">
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-900`}>
                Notifications
              </h2>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                {notifications.filter(n => Number(n.is_read) === 0).length} unread notifications
              </p>
            </div>
          </motion.div>

          <div className="bg-[#fafff4] rounded-lg shadow-sm">
            <div className={`border-b border-gray-200 ${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center flex-wrap gap-4'}`}>
                <div className={isMobile ? 'w-full flex justify-between items-center' : ''}>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-sm'} border border-gray-300 rounded-md shadow-sm font-medium text-[#145414] bg-white hover:bg-[#d4f4dc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#145414]`}
                  >
                    <FaFilter className="mr-2" />
                    {isMobile ? 'Filters' : 'Filter'}
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
                    <div className={`flex flex-wrap gap-2 ${isMobile ? 'justify-center' : ''}`}>
                      <button
                        onClick={() => setFilter('all')}
                        className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-full font-medium ${
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
                          className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-full font-medium capitalize ${
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

{isMobile ? (
              // Mobile Card View
              <div className="space-y-3 p-3">
                {paginatedNotifications.length > 0 ? (
                  paginatedNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`border border-gray-200 rounded-lg shadow-sm ${
                        Number(notification.is_read) === 0 ? 'bg-[#d4f4dc]' : 'bg-white'
                      }`}
                      size="small"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            <div className="flex-shrink-0 mt-0.5">
                              {getStatusIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {notification.title}
                              </h3>
                              <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">
                            {formatDate(notification.date)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        {Number(notification.is_read) === 0 && (
                          <div className="pt-2">
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-[#145414] hover:bg-[#d4f4dc] rounded-md border border-gray-300 transition-colors duration-200"
                            >
                              <FaCheck className="w-3 h-3" />
                              Mark as Read
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-gray-500">No notifications found</span>
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              // Desktop/Tablet List View
              <div className="divide-y divide-gray-200">
                {paginatedNotifications.length > 0 ? (
                  paginatedNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`${isTablet ? 'p-4' : 'p-6'} hover:bg-gray-50 transition-colors duration-200 ${
                        Number(notification.is_read) === 0 ? 'bg-[#d4f4dc]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex ${isTablet ? 'flex-col gap-2' : 'justify-between items-start'}`}>
                            <div className="flex-1">
                              <h3 className={`${isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
                                {notification.title}
                              </h3>
                              <p className={`mt-1 ${isTablet ? 'text-sm' : 'text-base'} text-gray-600`}>
                                {notification.message}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {formatDate(notification.date)}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                                  {notification.priority}
                                </span>
                              </div>
                            </div>
                            {Number(notification.is_read) === 0 && (
                              <div className={`${isTablet ? 'w-full justify-end flex' : ''}`}>
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className={`inline-flex items-center gap-2 ${isTablet ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} font-medium text-[#145414] hover:bg-[#d4f4dc] rounded-md border border-gray-300 transition-colors duration-200`}
                                  title="Mark as read"
                                >
                                  <FaCheck className={isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
                                  <span>Mark as Read</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-gray-500">No notifications found</span>
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {filteredNotifications.length > 0 && (
              <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200`}>
                <Pagination
                  current={currentPage}
                  pageSize={itemsPerPage}
                  total={filteredNotifications.length}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setItemsPerPage(size);
                  }}
                  showSizeChanger={!isMobile}
                  showTotal={!isMobile ? (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items` : false
                  }
                  size={isMobile ? "small" : "default"}
                  className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                  simple={isMobile}
                />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default NotificationPage;