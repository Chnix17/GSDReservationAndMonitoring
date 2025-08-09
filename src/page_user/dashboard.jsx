import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion,  } from 'framer-motion';
import { FiCalendar, 
  FiClock, 
 } from 'react-icons/fi';
import { Modal, Tabs, Pagination } from 'antd';
import { InfoCircleOutlined, ToolOutlined, UserOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

import Sidebar from './component/user_sidebar';
import { SecureStorage } from '../utils/encryption';
import { toast } from 'react-toastify';

const { TabPane } = Tabs;

const Dashboard = () => {
  const navigate = useNavigate();


  const [activeReservations, setActiveReservations] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [completedReservations, setCompletedReservations] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Pagination states
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const pageSize = 3;

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
          const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
          const decryptedUserLevel = parseInt(encryptedUserLevel);
          if (decryptedUserLevel !== 3 && decryptedUserLevel !== 15 && decryptedUserLevel !== 16 && decryptedUserLevel !== 17) {
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
              feedback: res.feedback || '',
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
                        onClick={() => navigate('/addReservation')}
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
                          {reservation.feedback && (
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                              {reservation.feedback}
                            </span>
                          )}
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

   
      <DetailModal 
        visible={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        reservationDetails={reservationDetails}
      />
    </div>
  );
};

export default Dashboard;
