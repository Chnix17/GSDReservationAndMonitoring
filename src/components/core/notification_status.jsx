import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiAlertCircle, FiInfo, FiTrash2 } from 'react-icons/fi';

const NotificationAdmin = ({ 
  notifications = [], 
  showNotifications, 
  setShowNotifications,
  onMarkAsRead,
  onClearAll,
  isLoading
}) => {
  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 text-gray-700 hover:text-green-600 transition-colors relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <FiBell className="w-6 h-6" />
        <AnimatePresence>
          {notifications.filter(n => n.is_read_by_user === '0').length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            >
              {notifications.filter(n => n.is_read_by_user === '0').length}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-green-600 to-green-500 text-white">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={onClearAll}
                    className="p-1 hover:bg-green-700 rounded-full transition-colors"
                    title="Clear all notifications"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-green-700 rounded-full transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-green-100 mt-1">
                {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : notifications.length > 0 ? (
                <motion.div layout className="divide-y divide-gray-100">
                  {notifications.map((notif, index) => (
                    <motion.div
                      layout
                      key={notif.notification_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative ${
                        notif.is_read_by_user === '0'
                          ? getNotificationStyle(notif.type)
                          : 'bg-gray-50'
                      } hover:bg-opacity-90 cursor-pointer group`}
                      onClick={() => onMarkAsRead(notif.notification_id)}
                    >
                      <div className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              notif.is_read_by_user === '0' ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notif.notification_message}
                            </p>
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {new Date(notif.notification_created_at).toLocaleString()}
                              </span>
                              {notif.is_read_by_user === '0' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              // You can add delete functionality here
                            }}
                          >
                            <FiTrash2 className="w-4 h-4 text-gray-500" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center p-8 text-gray-500"
                >
                  <FiBell className="w-12 h-12 mb-2 text-gray-400" />
                  <p className="text-center">No notifications yet</p>
                  <p className="text-sm text-center text-gray-400">
                    We'll notify you when something arrives
                  </p>
                </motion.div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t text-xs text-center text-gray-500">
              Click on a notification to mark it as read
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationAdmin;