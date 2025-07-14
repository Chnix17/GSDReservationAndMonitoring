import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, 
  FiClock,
  FiEye
 } from 'react-icons/fi';
import { Modal, Tabs, Button, Empty, Pagination } from 'antd';
import { InfoCircleOutlined, ToolOutlined, UserOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import ReservationCalendar from '../components/ReservationCalendar';
import Sidebar from './component/dean_sidebar';
import { SecureStorage } from '../utils/encryption';
import { toast } from 'react-toastify';
import ReservationDetails from './component/Reservation_Details';

const { TabPane } = Tabs;

const Dashboard = () => {
  const navigate = useNavigate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [activeReservations, setActiveReservations] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [completedReservations, setCompletedReservations] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Pagination states
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const pageSize = 3;

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const declineReasons = [
    'Schedule conflict with existing reservation',
    'Resource not available for the requested time',
    'Insufficient information provided',
    'Other'
  ];

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
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    if (decryptedUserLevel !== 5 && decryptedUserLevel !== 6 && decryptedUserLevel !== 18) {
        localStorage.clear();
        navigate('/gsd');
    }
}, [navigate]);



  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const userId = SecureStorage.getSessionItem('user_id');
        const baseUrl = SecureStorage.getLocalItem("url");
        console.log('Fetching reservations for user ID:', userId);

        const response = await fetch(`${baseUrl}/faculty&staff.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'fetchMyReservation',
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
              status: res.reservation_status_name
            };

            if (res.reservation_status_name === "Completed") {
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

  useEffect(() => {
    const fetchApprovalRequests = async () => {
      try {
        const departmentId = SecureStorage.getSessionItem('department_id');
        const baseUrl = SecureStorage.getLocalItem("url");
        
        const response = await fetch(`${baseUrl}/Department_Dean.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'fetchApprovalByDept',
            json: {
              department_id: departmentId,
              user_level_id: SecureStorage.getSessionItem("user_level_id"),
              current_user_id: SecureStorage.getSessionItem("user_id")
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          // Sort by creation date and take the latest 5
          const sortedRequests = result.data
            .sort((a, b) => new Date(b.reservation_created_at) - new Date(a.reservation_created_at))
            .slice(0, 5);
          setApprovalRequests(sortedRequests);
        }
      } catch (error) {
        console.error('Error fetching approval requests:', error);
      }
    };

    fetchApprovalRequests();
  }, []);

  const handleViewReservation = async (reservation) => {
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      // Fetch reservation details, status history, and maintenance resources
      const [detailsResponse, statusResponse, maintenanceResponse] = await Promise.all([
        fetch(`${baseUrl}/faculty&staff.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'fetchMyReservationbyId',
            reservationId: reservation.id
          })
        }),
        fetch(`${baseUrl}/faculty&staff.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'fetchStatusById',
            reservationId: reservation.id
          })
        }),
        fetch(`${baseUrl}/faculty&staff.php`, {
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

  const handleViewDetails = async (request) => {
    const formattedRequest = {
      reservation_id: request.reservation_id,
      requester_name: request.requester_name,
      user_level_name: request.user_level_name,
      department_name: request.department_name,
      reservation_created_at: request.reservation_created_at,
      reservation_start_date: request.reservation_start_date,
      reservation_end_date: request.reservation_end_date,
      reservation_title: request.reservation_title,
      reservation_description: request.reservation_description,
      venues: request.venues || [],
      vehicles: request.vehicles || [],
      equipment: request.equipment || [],
      passengers: request.passengers || [],
      drivers: request.drivers || [],
      user_id: request.reservation_user_id,
      active: request.active || "1"
    };

    setSelectedRequest(formattedRequest);
  };

  const handleApproval = async (reservationId, isAccepted) => {
    if (!selectedRequest) {
      toast.error('No request selected');
      return;
    }

    try {
      let notification_message = '';
      
      if (isAccepted) {
        notification_message = 'Your reservation has been processed to GSD, waiting for the approval';
      } else {
        notification_message = `Your Reservation Has Been Declined. Reason: ${declineReason === 'Other' ? customReason : declineReason}`;
      }

      const baseUrl = SecureStorage.getLocalItem("url");
      const response = await fetch(`${baseUrl}/process_reservation.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'handleApproval',
          reservation_id: reservationId,
          is_accepted: isAccepted,
          user_id: SecureStorage.getSessionItem("user_id"),
          notification_message: notification_message,
          notification_user_id: selectedRequest.user_id
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        toast.success(isAccepted ? 'Request approved successfully' : 'Request declined successfully');
        setSelectedRequest(null);
        setDeclineModalVisible(false);
        setDeclineReason('');
        setCustomReason('');
        // Refresh the approval requests
        const updatedRequests = approvalRequests.filter(req => req.reservation_id !== reservationId);
        setApprovalRequests(updatedRequests);
      } else {
        toast.error(result.message || 'Failed to update approval status');
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      toast.error('Network error occurred while updating approval status. Please try again.');
    }
  };

  const handleDeclineConfirm = () => {
    if (!declineReason || (declineReason === 'Other' && !customReason)) {
      toast.error('Please select a reason for declining');
      return;
    }
    handleApproval(selectedRequest?.reservation_id, false);
  };

  const DetailModal = ({ visible, onClose, reservationDetails }) => {
    if (!reservationDetails) return null;

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

  // Calculate paginated data
  const paginatedActive = activeReservations.slice((activePage - 1) * pageSize, activePage * pageSize);
  const paginatedCompleted = completedReservations.slice((completedPage - 1) * pageSize, completedPage * pageSize);
  const paginatedApproval = approvalRequests.slice((approvalPage - 1) * pageSize, approvalPage * pageSize);

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
             
            </motion.div>
            
          </div>

          {/* Approval Requests Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700 mb-8"
          >
            <div className="bg-gradient-to-r from-lime-900 to-green-900 p-3 md:p-4 flex justify-between items-center">
              <h2 className="text-white text-base md:text-lg font-semibold flex items-center">
                <FiCalendar className="mr-2 text-sm md:text-base" /> Latest Approval Requests
              </h2>
              <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                {approvalRequests.length} Pending
              </div>
            </div>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4]">
              <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                  <tr>
                    <th scope="col" className="px-4 py-4 whitespace-nowrap text-xs md:text-sm font-medium uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-4 py-4 whitespace-nowrap text-xs md:text-sm font-medium uppercase tracking-wider">Requestor</th>
                    <th scope="col" className="px-4 py-4 whitespace-nowrap text-xs md:text-sm font-medium uppercase tracking-wider">Schedule</th>
                    <th scope="col" className="px-4 py-4 whitespace-nowrap text-xs md:text-sm font-medium uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-4 whitespace-nowrap text-xs md:text-sm font-medium uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApproval.length > 0 ? (
                    paginatedApproval.map((request) => (
                      <tr key={request.reservation_id} className="bg-white border-b last:border-b-0 border-gray-200 hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-4 py-6 font-medium max-w-[140px] truncate">{request.reservation_title}</td>
                        <td className="px-4 py-6 font-medium">{request.requester_name}</td>
                        <td className="px-4 py-6">
                          <div className="font-medium">
                            {format(new Date(request.reservation_start_date), 'MMM dd, yyyy h:mm a')} - 
                            {format(new Date(request.reservation_end_date), 'h:mm a')}
                          </div>
                          <div className="text-xs text-gray-500">
                            Duration: {calculateDuration(request.reservation_start_date, request.reservation_end_date)}
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <span className="inline-flex items-center px-6 py-2 rounded-full text-base font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Pending
                          </span>
                        </td>
                        <td className="px-4 py-6">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-lime-700 bg-lime-100 hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
                          >
                            <FiEye className="mr-1" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-2 md:px-6 py-12 md:py-24 text-center">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-gray-500 dark:text-gray-400">
                              No pending approval requests
                            </span>
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-center mt-4">
                <Pagination
                  current={approvalPage}
                  pageSize={pageSize}
                  total={approvalRequests.length}
                  onChange={setApprovalPage}
                  showSizeChanger={false}
                />
              </div>
            </div>
          </motion.div>

          {/* Statistics Grid */}
          
          {/* Active and Completed Reservations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Active Reservations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100"
            >
              <div className="bg-gradient-to-r from-lime-900 to-green-900 p-3 md:p-4 flex justify-between items-center">
                <h2 className="text-white text-base md:text-lg font-semibold flex items-center">
                  <FiCalendar className="mr-2 text-sm md:text-base" /> Active Reservations
                </h2>
                <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                  {activeReservations.length} Active
                </div>
              </div>
              <div className="p-3 md:p-4">
                <div
                  className="space-y-4"
                  style={{
                    maxHeight: '420px', // 3 cards * 120px + padding
                    minHeight: '420px',
                    overflowY: 'auto',
                  }}
                >
                  {paginatedActive.length > 0 ? (
                    paginatedActive.map((reservation) => (
                      <motion.div
                        key={reservation.id}
                        className="p-4 bg-white/50 border border-gray-100 rounded-xl hover:border-green-200 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleViewReservation(reservation)}
                        style={{ minHeight: '120px' }}
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
                    <div className="text-center py-8 text-gray-500 bg-white/50 rounded-xl">
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
                <div className="flex justify-center mt-4">
                  <Pagination
                    current={activePage}
                    pageSize={pageSize}
                    total={activeReservations.length}
                    onChange={setActivePage}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            </motion.div>

            {/* Completed Reservations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100"
            >
              <div className="bg-gradient-to-r from-lime-900 to-green-900 p-3 md:p-4 flex justify-between items-center">
                <h2 className="text-white text-base md:text-lg font-semibold flex items-center">
                  <FiCalendar className="mr-2 text-sm md:text-base" /> Completed Reservations
                </h2>
                <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                  {completedReservations.length} Completed
                </div>
              </div>
              <div className="p-3 md:p-4">
                <div
                  className="space-y-4"
                  style={{
                    maxHeight: '420px',
                    minHeight: '420px',
                    overflowY: 'auto',
                  }}
                >
                  {paginatedCompleted.length > 0 ? (
                    paginatedCompleted.map((reservation) => (
                      <motion.div
                        key={reservation.id}
                        className="p-4 bg-white/50 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        style={{ minHeight: '120px' }}
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-white/50 rounded-xl">
                      <FiCalendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No completed reservations found</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-center mt-4">
                  <Pagination
                    current={completedPage}
                    pageSize={pageSize}
                    total={completedReservations.length}
                    onChange={setCompletedPage}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Activities Section */}
          
        </div>
      </div>

      {/* Reservation Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <ReservationDetails
            visible={!!selectedRequest}
            onClose={() => {
              setSelectedRequest(null);
              setDeclineModalVisible(false);
            }}
            reservationDetails={selectedRequest}
            onApprove={() => handleApproval(selectedRequest.reservation_id, true)}
            onDecline={() => setDeclineModalVisible(true)}
            isApprovalView={true}
          />
        )}
      </AnimatePresence>

      {/* Decline Reason Modal */}
      <Modal
        title="Select Decline Reason"
        open={declineModalVisible}
        onCancel={() => setDeclineModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeclineModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleDeclineConfirm}
            disabled={!declineReason || (declineReason === 'Other' && !customReason)}
          >
            Confirm Decline
          </Button>
        ]}
      >
        <div className="space-y-4">
          {declineReasons.map((reason) => (
            <div key={reason} className="flex items-center">
              <input
                type="radio"
                id={reason}
                name="declineReason"
                value={reason}
                checked={declineReason === reason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="mr-2"
              />
              <label htmlFor={reason}>{reason}</label>
            </div>
          ))}
          {declineReason === 'Other' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify the reason..."
              className="w-full p-2 border rounded-md"
              rows={4}
            />
          )}
        </div>
      </Modal>

      <ReservationCalendar 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      <DetailModal 
        visible={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        reservationDetails={reservationDetails}
      />
    </div>
  );
};

export default Dashboard;
