import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiList, FiHelpCircle, FiLogOut, FiBell, FiUser, FiSettings, 
  FiClock, FiCheckCircle, FiAlertCircle, FiBarChart2, FiUsers, FiBookmark, 
  FiX, FiCheck, FiTrash2, FiInfo, FiMessageSquare, FiMapPin, FiEye } from 'react-icons/fi';
import { Modal, Tabs } from 'antd';
import { InfoCircleOutlined, BuildOutlined, ToolOutlined, UserOutlined, TeamOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import ReservationCalendar from '../components/ReservationCalendar';
import Sidebar from './component/user_sidebar';
import { SecureStorage } from '../utils/encryption';
import { toast } from 'react-toastify';

const { TabPane } = Tabs;

const Dashboard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showSupportTicket, setShowSupportTicket] = useState(false);
  const [activeReservations, setActiveReservations] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [completedReservations, setCompletedReservations] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Add event listener for sidebar toggle
    const handleSidebarToggle = (e) => {
      if (e.detail && typeof e.detail.collapsed !== 'undefined') {
        setIsSidebarCollapsed(e.detail.collapsed);
      }
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  useEffect(() => {
          const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
          console.log("this is encryptedUserLevel", encryptedUserLevel);
          if (encryptedUserLevel !== '3' && encryptedUserLevel !== '15' && encryptedUserLevel !== '16' && encryptedUserLevel !== '17') {
              localStorage.clear();
              navigate('/gsd');
          }
      }, [navigate]);

  const navButtonVariants = {
    hover: { 
      scale: 1.05,
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const statsData = [
    { title: "Total Reservations", value: "156", icon: FiBookmark, color: "bg-blue-500" },
    { title: "Pending Requests", value: "8", icon: FiClock, color: "bg-yellow-500" },
    { title: "Approved Today", value: "12", icon: FiCheckCircle, color: "bg-green-500" },
    
  ];

  const recentActivities = [
    { type: "Approved", message: "Roofdeck reservation approved", time: "2 minutes ago" },
    { type: "Pending", message: "New reservation request for Ms Lobby", time: "1 hour ago" },
    { type: "Cancelled", message: "Multipurpose Hall reservation cancelled", time: "3 hours ago" },
    { type: "Completed", message: "Event in Auditorium completed", time: "5 hours ago" },
  ];

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch('http://localhost/coc/gsd/fetch_reserve.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchNotificationsByUserId',
          user_id: localStorage.getItem('user_id')
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setNotifications(result.data);
      } else {
        console.error('Failed to fetch notifications:', result);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('http://localhost/coc/gsd/update_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateNotification',
          notification_id: notificationId
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        // Update local state to reflect the change
        setNotifications(notifications.map(notif => 
          notif.notification_id === notificationId 
            ? {...notif, is_read_by_user: '1'}
            : notif
        ));
      } else {
        console.error('Failed to mark notification as read:', result.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const storedName = SecureStorage.getSessionItem('name');
    setUserName(storedName || 'User');
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const userId = SecureStorage.getSessionItem('user_id');
        console.log('Fetching reservations for user ID:', userId);

        const response = await fetch('http://localhost/coc/gsd/faculty&staff.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'fetchMyActiveReservation',
            userId: userId
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result);

        if (result.status === 'success' && Array.isArray(result.data)) {
          console.log('Number of reservations:', result.data.length);
          
          const active = [];
          const completed = [];
          
          result.data.forEach(res => {
            console.log('Processing reservation:', res);
            const startTime = new Date(res.reservation_start_date);
            const endTime = new Date(res.reservation_end_date);
            const currentTime = new Date();
            
            const formattedReservation = {
              id: res.reservation_id,
              venue: res.reservation_title,
              date: startTime.toLocaleDateString(),
              time: `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`,
              purpose: res.reservation_description,
              participants: res.reservation_participants,
              startTime,
              endTime,
              feedback: res.feedback || 'No feedback',
              status: res.reservation_status
            };

            if (res.reservation_status === "Completed") {
              completed.push(formattedReservation);
            } else {
              const isOngoing = currentTime >= startTime && currentTime <= endTime;
              formattedReservation.status = isOngoing ? 'Ongoing' : 'Upcoming';
              active.push(formattedReservation);
            }
          });
          
          // Sort active reservations so ongoing ones appear first
          active.sort((a, b) => {
            if (a.status === 'Ongoing' && b.status !== 'Ongoing') return -1;
            if (a.status !== 'Ongoing' && b.status === 'Ongoing') return 1;
            return a.startTime - b.startTime;
          });

          // Sort completed reservations by end date, most recent first
          completed.sort((a, b) => b.endTime - a.endTime);
          
          console.log('Formatted active reservations:', active);
          console.log('Formatted completed reservations:', completed);
          setActiveReservations(active);
          setCompletedReservations(completed);
        } else {
          console.error('Invalid API response format:', result);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };

    fetchReservations();
  }, []);

  const handleViewReservation = async (reservation) => {
    try {
      // Fetch reservation details, status history, and maintenance resources
      const [detailsResponse, statusResponse, maintenanceResponse] = await Promise.all([
        fetch('http://localhost/coc/gsd/faculty&staff.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'fetchMyReservationbyId',
            reservationId: reservation.id
          })
        }),
        fetch('http://localhost/coc/gsd/faculty&staff.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'fetchStatusById',
            reservationId: reservation.id
          })
        }),
        fetch('http://localhost/coc/gsd/faculty&staff.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'displayedMaintenanceResources',
            reservationId: reservation.id
          })
        })
      ]);

      const [result, statusResult, maintenanceResult] = await Promise.all([
        detailsResponse.json(),
        statusResponse.json(),
        maintenanceResponse.json()
      ]);
      
      if (result.status === 'success') {
        const details = result.data;
        setReservationDetails({
          ...details,
          statusHistory: statusResult.status === 'success' ? statusResult.data : [],
          maintenanceResources: maintenanceResult.status === 'success' ? maintenanceResult.data : []
        });
        setIsDetailModalOpen(true);
      } else {
        throw new Error(result.message || 'Failed to fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      toast.error('Failed to fetch reservation details');
    }
  };

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

  const NotificationsPopup = () => (
    <AnimatePresence>
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
                onClick={() => setNotifications([])}
                className="p-1 hover:bg-green-700 rounded-full transition-colors"
                title="Clear all notifications"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-green-100 mt-1">
            {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {notificationsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : notifications.length > 0 ? (
            <motion.div layout>
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
                  } p-4 hover:bg-opacity-90 transition-all cursor-pointer group`}
                  onClick={() => markNotificationAsRead(notif.notification_id)}
                >
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
                        const updatedNotifications = notifications.filter(
                          n => n.notification_id !== notif.notification_id
                        );
                        setNotifications(updatedNotifications);
                      }}
                    >
                      <FiTrash2 className="w-4 h-4 text-gray-500" />
                    </motion.button>
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
    </AnimatePresence>
  );

  const SupportTicketPopup = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50"
    >
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-lg">
        <h3 className="font-bold text-lg">Support Tickets</h3>
        <p className="text-sm text-blue-100">Create or view your support tickets</p>
      </div>
      <div className="p-4 space-y-3">
        <button
          onClick={() => navigate('/support/new')}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors"
        >
          <FiMessageSquare className="w-5 h-5" />
          <span>Create New Ticket</span>
        </button>
        <button
          onClick={() => navigate('/support/list')}
          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors"
        >
          <FiList className="w-5 h-5" />
          <span>View My Tickets</span>
        </button>
      </div>
    </motion.div>
  );

  const NotificationBell = () => (
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
        {showNotifications && <NotificationsPopup />}
      </AnimatePresence>
    </div>
  );

  const DetailModal = ({ visible, onClose, reservationDetails }) => {
    if (!reservationDetails) return null;

    const getStatusColor = () => {
      if (reservationDetails.active === "0") return "gold";
      switch (reservationDetails.reservation_status?.toLowerCase()) {
        case 'approved': return "green";
        case 'declined': return "red";
        case 'pending': return "blue";
        default: return "blue";
      }
    };

    const isCompleted = reservationDetails.statusHistory?.some(
      status => status.status_id === "4" && status.active === "1"
    );

    const renderResourceSummary = () => {
      if (!isCompleted || !reservationDetails.maintenanceResources?.length) return null;

      return (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 p-4 border-b border-orange-100">
            <h3 className="text-lg font-medium text-orange-800 flex items-center gap-2">
              <ToolOutlined className="text-orange-500" />
              Reservation Resources Summary
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {reservationDetails.maintenanceResources.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <ToolOutlined className="text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{resource.resource_name}</p>
                      <p className="text-sm text-gray-500">
                        {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {resource.condition_name}
                    </span>
                    {resource.resource_type.toLowerCase() !== 'venue' && 
                     resource.resource_type.toLowerCase() !== 'vehicle' && (
                      <p className="text-sm text-gray-500 mt-1">Quantity: {resource.quantity}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <Modal
        title={null}
        visible={visible}
        onCancel={onClose}
        width={900}
        footer={[
          <button
            key="close"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        ]}
        className="reservation-detail-modal"
        bodyStyle={{ padding: '0' }}
      >
        <div className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-6 rounded-t-lg">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {reservationDetails.reservation_event_title || reservationDetails.reservation_destination}
                </h1>
              </div>
              <div className="text-white text-right">
                <p className="text-white opacity-90 text-sm">Created on</p>
                <p className="font-semibold">
                  {new Date(reservationDetails.reservation_created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultActiveKey="1" className="p-6">
            <TabPane tab={<span><InfoCircleOutlined /> Details</span>} key="1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <UserOutlined className="text-blue-500" /> Requester Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <UserOutlined className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Name</p>
                          <p className="font-medium">{reservationDetails.requester_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-full">
                          <TeamOutlined className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Department</p>
                          <p className="font-medium">{reservationDetails.department_name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <CalendarOutlined className="text-orange-500" /> Schedule Information
                    </h3>
                    <div className="space-y-2">
                      {reservationDetails.reservation_start_date && (
                        <div className="flex items-center gap-2">
                          <div className="bg-orange-100 p-2 rounded-full">
                            <CalendarOutlined className="text-orange-600" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Date & Time</p>
                            <p className="font-medium">
                              {format(new Date(reservationDetails.reservation_start_date), 'MMM dd, yyyy h:mm a')} - 
                              {format(new Date(reservationDetails.reservation_end_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {reservationDetails.reservation_description && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700">{reservationDetails.reservation_description}</p>
                </div>
              )}
            </TabPane>

            <TabPane tab={<span><CalendarOutlined /> Status Log</span>} key="2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <CalendarOutlined className="text-blue-500" /> Status History
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {reservationDetails.statusHistory && reservationDetails.statusHistory.map((status, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            status.status_name?.toLowerCase() === 'approved' ? 'bg-green-500' :
                            status.status_name?.toLowerCase() === 'declined' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{status.status_name}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(status.updated_at), 'MMM dd, yyyy h:mm a')}
                              {status.updated_by_full_name && status.status_name !== 'Pending' && (
                                <span className="ml-2 text-gray-400">
                                  • Updated by {status.updated_by_full_name}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!reservationDetails.statusHistory || reservationDetails.statusHistory.length === 0) && (
                    <div className="p-4 text-center text-gray-500">
                      No status history available
                    </div>
                  )}
                </div>
              </div>
            </TabPane>
          </Tabs>
          {renderResourceSummary()}
        </div>
      </Modal>
    );
  };

  return (
    <div className={`flex h-screen bg-gradient-to-br from-white to-green-100 overflow-hidden transition-all duration-300`}>
      <Sidebar />
      <div className={`flex-1 overflow-auto mt-20 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-5' : 'lg:ml-16'}`}>
        <div className="p-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1"
            >
              <h1 className="text-4xl font-bold text-gray-800">
                Dashboard
              </h1>
              <p className="text-gray-500 mt-2">
                Welcome back, {userName}! Here's your reservation overview.
              </p>
            </motion.div>
            
          </div>

          {/* Statistics Grid */}
          
          {/* Active and Completed Reservations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Active Reservations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Active Reservations</h2>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  {activeReservations.length} Active
                </span>
              </div>
              <div className="space-y-4">
                {activeReservations.length > 0 ? (
                  activeReservations.map((reservation) => (
                    <motion.div
                      key={reservation.id}
                      className="p-4 border border-gray-100 rounded-xl hover:border-green-200 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleViewReservation(reservation)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{reservation.venue}</h3>
                          <p className="text-gray-500 text-sm mt-1">{reservation.purpose}</p>
                          {reservation.participants > 0 && (
                            <p className="text-gray-500 text-sm mt-1">
                              Participants: {reservation.participants}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          reservation.status === 'Ongoing' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {reservation.status}
                        </span>
                      </div>
                      <div className="flex items-center mt-3 text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-2" />
                          {reservation.date}
                        </div>
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 mr-2" />
                          {reservation.time}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiCalendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No active reservations found</p>
                    <button
                      onClick={() => navigate('/add-reservation')}
                      className="mt-4 text-green-600 hover:text-green-700 font-medium"
                    >
                      Create a new reservation
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Completed Reservations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Completed Reservations</h2>
                <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                  {completedReservations.length} Completed
                </span>
              </div>
              <div className="space-y-4">
                {completedReservations.map((reservation) => (
                  <motion.div
                    key={reservation.id}
                    className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{reservation.venue}</h3>
                        <p className="text-gray-500 text-sm mt-1">{reservation.purpose}</p>
                      </div>
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        {reservation.feedback}
                      </span>
                    </div>
                    <div className="flex items-center mt-3 text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-2" />
                        {reservation.date}
                      </div>
                      <div className="flex items-center">
                        <FiClock className="w-4 h-4 mr-2" />
                        {reservation.time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Activities Section */}
          
        </div>
      </div>

      <ReservationCalendar 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      <AnimatePresence>
        {showSupportTicket && <SupportTicketPopup />}
      </AnimatePresence>

      <DetailModal 
        visible={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        reservationDetails={reservationDetails}
      />
    </div>
  );
};

export default Dashboard;
