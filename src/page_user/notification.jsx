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
  FaEye 
} from 'react-icons/fa';
import Sidebar from './component/user_sidebar';
import { SecureStorage } from '../utils/encryption';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Add responsive design handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = SecureStorage.getSessionItem('user_id');
        const baseUrl = SecureStorage.getLocalItem("url");
        const response = await fetch(`${baseUrl}/faculty&staff.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: "fetchNotification",
            userId: userId
          })
        });

        const data = await response.json();
        if (data.status === "success") {
          const formattedNotifications = data.data.map(notification => ({
            id: notification.notification_reservation_id,
            type: 'pending', // You might want to add this in your API response
            title: 'Reservation Status',
            message: notification.notification_message,
            date: notification.notification_created_at,
            isRead: false, // You might want to add this in your API response
            priority: 'medium', // You might want to add this in your API response
            details: `Reservation ID: ${notification.notification_reservation_reservation_id}\nUser ID: ${notification.notification_user_id}\nCreated At: ${notification.notification_created_at}`
          }));
          setNotifications(formattedNotifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const getStatusColor = (type) => {
    switch (type) {
      case 'accepted':
        return 'bg-green-50 border-green-500 text-green-700';
      case 'pending':
        return 'bg-yellow-50 border-yellow-500 text-yellow-700';
      case 'declined':
        return 'bg-red-50 border-red-500 text-red-700';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-700';
    }
  };

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

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
    setSelectedNotification(null);
  };

  const filteredNotifications = notifications.filter(
    (notif) => filter === 'all' || notif.type === filter
  );

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
                    {notifications.filter(n => !n.isRead).length} unread notifications
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } transition-colors duration-200`}
                      >
                        All
                      </button>
                      {['accepted', 'pending', 'declined'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilter(type)}
                          className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                            filter === type
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.isRead ? 'bg-blue-50' : ''
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
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-gray-500"
                              title="Mark as read"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedNotification(notification)}
                            className="p-2 text-gray-400 hover:text-gray-500"
                            title="View details"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-500"
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