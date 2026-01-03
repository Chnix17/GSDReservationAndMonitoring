import React, { useState, useEffect, useCallback } from 'react';
import DeanSidebar from '../../components/core/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { SecureStorage } from '../../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip, Empty, Input, Pagination, Modal, Card, Typography } from 'antd';
import ReservationDetails from './component/Reservation_Details';
import { format } from 'date-fns';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useMediaQuery } from 'react-responsive';

const { Text } = Typography;

const ViewApproval = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    currentStatus: ''
  });

  const declineReasons = [
    'Schedule conflict with existing reservation',
    'Resource not available for the requested time',
    'Insufficient information provided',
    'Other'
  ];

  const navigate = useNavigate();

  // Update page size based on screen size
  useEffect(() => {
    if (isMobile) {
      setPageSize(5);
    } else if (isTablet) {
      setPageSize(8);
    } else {
      setPageSize(10);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    if (decryptedUserLevel !== 5 && decryptedUserLevel !== 6 && decryptedUserLevel !== 18 && decryptedUserLevel !== 20) {
      localStorage.clear();
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const storedDepartmentId = SecureStorage.getLocalItem("department_id");
    if (storedDepartmentId) {
      setDepartmentId(storedDepartmentId);
    } else {
      console.error("No department ID found in localStorage.");
    }
  }, []);

  // Get baseUrl from SecureStorage
  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchApprovalRequests = useCallback(async () => {
    if (!departmentId) {
      console.error("Department ID is not available");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/Department_Dean.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchApprovalByDept',
          json: {
            department_id: departmentId,
            user_level_id: SecureStorage.getLocalItem("user_level_id"),
            current_user_id: SecureStorage.getLocalItem("user_id")
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        setRequests(result.data);
      } else {
        console.error('Invalid API response format:', result);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId, baseUrl]);

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

      const response = await fetch(`${baseUrl}/Department_Dean.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'handleApproval',
          reservation_id: reservationId,
          is_accepted: isAccepted,
          user_id: SecureStorage.getLocalItem("user_id"),
          notification_message: notification_message,
          notification_user_id: selectedRequest.reservation_user_id || selectedRequest.user_id
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
        const updatedRequests = requests.filter(req => req.reservation_id !== reservationId);
        setRequests(updatedRequests);
      } else {
        // Show error modal instead of toast for backend validation errors
        setErrorModal({
          visible: true,
          title: 'Approval Failed',
          message: result.message || 'Failed to update approval status',
          currentStatus: selectedRequest?.status_name || ''
        });
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      // Show error modal for network errors too
      setErrorModal({
        visible: true,
        title: 'Network Error',
        message: 'Network error occurred while updating approval status. Please try again.',
        currentStatus: selectedRequest?.status_name || ''
      });
    }
  };

  const handleDeclineConfirm = () => {
    if (!declineReason || (declineReason === 'Other' && !customReason)) {
      toast.error('Please select a reason for declining');
      return;
    }
    handleApproval(selectedRequest?.reservation_id, false);
  };

  const handleErrorModalClose = () => {
    setErrorModal({ visible: false, title: '', message: '', currentStatus: '' });
  };

  const handleViewDetails = (request) => {
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
      reservation_user_id: request.reservation_user_id,
      active: request.active || "1"
    };
    setSelectedRequest(formattedRequest);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleRefresh = () => {
    fetchApprovalRequests();
    setSearchQuery('');
  };

  useEffect(() => {
    if (departmentId) {
      fetchApprovalRequests();
    }
  }, [departmentId, fetchApprovalRequests]);

  // Listen for push notification refresh messages from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      console.log('[ViewApproval] Received message from service worker:', event.data);
      
      if (event.data && event.data.type === 'REFRESH_DATA') {
        console.log('[ViewApproval] Refreshing approval requests due to push notification');
        
        // Show a toast notification about the refresh
        toast.info('New approval request received. Refreshing data...', {
          autoClose: 2000,
        });
        
        // Refresh the approval requests list
        fetchApprovalRequests();
        
        // If detail modal is open, refresh the modal data without closing it
        if (selectedRequest?.reservation_id) {
          console.log('[ViewApproval] Refreshing modal data for reservation:', selectedRequest.reservation_id);
          
          // Find the updated request from the list and update the modal
          fetchApprovalRequests().then(() => {
            // After fetching, find the current request and update it
            const updatedRequest = requests.find(r => r.reservation_id === selectedRequest.reservation_id);
            if (updatedRequest) {
              handleViewDetails(updatedRequest);
            }
          });
        }
      }
    };

    // Add event listener for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Cleanup function
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [fetchApprovalRequests, selectedRequest, requests]);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (
      (request.reservation_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.reservation_description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return matchesSearch;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortField === 'id') {
      return sortOrder === 'asc' ? a.reservation_id - b.reservation_id : b.reservation_id - a.reservation_id;
    }
    if (sortField === 'createdAt') {
      return sortOrder === 'asc' 
        ? new Date(a.reservation_created_at) - new Date(b.reservation_created_at)
        : new Date(b.reservation_created_at) - new Date(a.reservation_created_at);
    }
    if (sortField === 'startDate') {
      return sortOrder === 'asc'
        ? new Date(a.reservation_start_date) - new Date(b.reservation_start_date)
        : new Date(b.reservation_start_date) - new Date(a.reservation_start_date);
    }
    return 0;
  });


  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <DeanSidebar />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto">
        <div className={`${isMobile ? 'px-4 py-4 mt-5' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Approval Request
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  placeholder={isMobile ? "Search requests..." : "Search by title or description"}
                  allowClear
                  prefix={<SearchOutlined />}
                  size={isMobile ? "middle" : "large"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size={isMobile ? "middle" : "large"}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Responsive Table / Cards */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                {isMobile ? (
                  // Mobile Card View
                  <div className="p-3">
                    {sortedRequests && sortedRequests.length > 0 ? (
                      sortedRequests
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((request) => (
                          <Card
                            key={request.reservation_id}
                            className="mb-3 shadow-sm"
                            size="small"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0">
                                  <EyeOutlined className="mr-2 text-green-900 flex-shrink-0" />
                                  <Text strong className="text-sm truncate">{request.reservation_title}</Text>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    icon={<EyeOutlined />}
                                    onClick={() => handleViewDetails(request)}
                                    size="small"
                                    type="primary"
                                    className="bg-green-600 hover:bg-green-700 border-green-600"
                                  />
                                </div>
                              </div>
                              <div>
                                <Text type="secondary" className="text-xs">Created:</Text>
                                <div className="text-xs text-gray-600">
                                  {format(new Date(request.reservation_created_at), 'MMM dd, yyyy h:mm a')}
                                </div>
                              </div>
                              <div>
                                <Text type="secondary" className="text-xs">Start Date:</Text>
                                <div className="text-xs text-gray-600">
                                  {format(new Date(request.reservation_start_date), 'MMM dd, yyyy h:mm a')}
                                </div>
                              </div>
                              <div>
                                <Text type="secondary" className="text-xs">Requester:</Text>
                                <div className="text-sm font-medium">{request.requester_name}</div>
                              </div>
                            </div>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-gray-500">
                              No requests found
                            </span>
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Desktop/Tablet Table View
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                      <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                        <tr>
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                            <div className="flex items-center">
                              Title
                            </div>
                          </th>
                          {!isTablet && (
                            <th scope="col" className="px-4 py-4 cursor-pointer" onClick={() => handleSort('createdAt')}>
                              <div className="flex items-center">
                                Created At
                                {sortField === 'createdAt' && (
                                  <span className="ml-1">
                                    {sortOrder === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                              </div>
                            </th>
                          )}
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('startDate')}>
                            <div className="flex items-center">
                              Start Date
                              {sortField === 'startDate' && (
                                <span className="ml-1">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                            <div className="flex items-center">
                              Requester
                            </div>
                          </th>
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                            <div className="flex items-center justify-center">
                              Actions
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRequests && sortedRequests.length > 0 ? (
                          sortedRequests
                            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                            .map((request) => (
                              <tr
                                key={request.reservation_id}
                                className="bg-white border-b last:border-b-0 border-gray-200"
                              >
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'} font-semibold`}>
                                  <span className="truncate block max-w-[200px]">{request.reservation_title}</span>
                                </td>
                                {!isTablet && (
                                  <td className="px-4 py-5 whitespace-nowrap">
                                    {format(new Date(request.reservation_created_at), 'MMM dd, yyyy h:mm a')}
                                  </td>
                                )}
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'} whitespace-nowrap`}>
                                  {format(new Date(request.reservation_start_date), 'MMM dd, yyyy h:mm a')}
                                </td>
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'}`}>{request.requester_name}</td>
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'}`}>
                                  <div className="flex justify-center">
                                    <Tooltip title="View Details">
                                      <Button
                                        shape="circle"
                                        icon={<EyeOutlined />}
                                        onClick={() => handleViewDetails(request)}
                                        size={isTablet ? "middle" : "large"}
                                        className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                      />
                                    </Tooltip>
                                  </div>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={isTablet ? 4 : 5} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                  <span className="text-gray-500 dark:text-gray-400">
                                    No requests found
                                  </span>
                                }
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={sortedRequests ? sortedRequests.length : 0}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger={!isMobile}
                    showTotal={!isMobile ? (total, range) =>
                      `${range[0]}-${range[1]} of ${total} items` : false
                    }
                    size={isMobile ? "small" : "default"}
                    className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                  />
                </div>
              </>
            )}
          </div>
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

      {/* Error Modal */}
      <Modal
        title="Cannot Process Approval"
        open={errorModal.visible}
        onCancel={handleErrorModalClose}
        footer={[
          <Button key="ok" type="primary" onClick={handleErrorModalClose}>
            OK
          </Button>
        ]}
        centered
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
            ⚠️
          </div>
          <h3 style={{ color: '#ff4d4f', marginBottom: '16px' }}>
            Approval Not Allowed
          </h3>
          <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#666', marginBottom: '16px' }}>
            {errorModal.message}
          </p>
          {errorModal.currentStatus && (
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '6px',
              border: '1px solid #d9d9d9'
            }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                <strong>Current Status:</strong> {errorModal.currentStatus}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ViewApproval;