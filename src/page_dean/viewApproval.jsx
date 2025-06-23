import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeanSidebar from './component/dean_sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { FiEye,  } from 'react-icons/fi';
import { Button, Tooltip, Empty, Input, Select, Pagination } from 'antd';
import { Box, Typography, RadioGroup, FormControlLabel, Radio as MuiRadio, TextField, Modal as MuiModal, Button as MuiButton } from '@mui/material';
import ReservationDetails from './component/Reservation_Details';
import ReservationDetailsApproval from './component/Reservation_Details Approval';
import { format } from 'date-fns';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const ViewApproval = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [approvalModalRequest, setApprovalModalRequest] = useState(null);

  const filterOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'declined', label: 'Declined' }
  ];

  const declineReasons = [
    'Schedule conflict with existing reservation',
    'Resource not available for the requested time',
    'Insufficient information provided',
    'Other'
  ];

  const navigate = useNavigate();

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    if (decryptedUserLevel !== 5 && decryptedUserLevel !== 6 && decryptedUserLevel !== 18) {
      localStorage.clear();
      navigate('/gsd');
    }
  }, [navigate]);

  useEffect(() => {
    const storedDepartmentId = SecureStorage.getSessionItem("department_id");
    if (storedDepartmentId) {
      setDepartmentId(storedDepartmentId);
    } else {
      console.error("No department ID found in localStorage.");
    }
  }, []);

  const fetchApprovalRequests = useCallback(async () => {
    if (!departmentId) {
      console.error("Department ID is not available");
      return;
    }

    setLoading(true);
    try {
      // First, try fetchApprovalByDept
      const response1 = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'fetchApprovalByDept',
        json: {
          department_id: departmentId,
          user_level_id: SecureStorage.getSessionItem("user_level_id"),
          current_user_id: SecureStorage.getSessionItem("user_id")
        }
      });
      let data1 = response1.data && response1.data.data ? response1.data.data.map(item => ({ ...item, fromApprovalByDept: true })) : [];

      // Next, try fetchRequestReservation
      const response2 = await axios.post('http://localhost/coc/gsd/Department_Dean.php', {
        operation: 'fetchRequestReservation'
      });
      let data2 = response2.data && response2.data.data ? response2.data.data.map(item => ({
        reservation_id: item.reservation_id,
        requester_name: item.requester_name,
        user_level_name: item.user_level_name || '',
        department_name: item.departments_name || item.department_name || '',
        reservation_created_at: item.reservation_created_at,
        reservation_start_date: item.reservation_start_date,
        reservation_end_date: item.reservation_end_date,
        reservation_title: item.reservation_title,
        reservation_description: item.reservation_description,
        venues: item.venues || [],
        vehicles: item.vehicles || [],
        equipment: item.equipment || [],
        passengers: item.passengers || [],
        drivers: item.drivers || [],
        user_id: item.reservation_user_id || item.requester_id,
        active: item.active || "1",
        status: item.status || item.reservation_status || '',
        fromApprovalByDept: false
      })) : [];

      // Merge logic
      let merged = [];
      if (data1.length && data2.length) {
        // Merge and deduplicate by reservation_id
        const all = [...data1, ...data2];
        const seen = new Set();
        merged = all.filter(item => {
          if (seen.has(item.reservation_id)) return false;
          seen.add(item.reservation_id);
          return true;
        });
      } else if (data1.length) {
        merged = data1;
      } else if (data2.length) {
        merged = data2;
      } else {
        merged = [];
      }
      setRequests(merged);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  const handleApproval = async (reservationId, isAccepted) => {
    if (!selectedRequest) {
      alert('No request selected');
      return;
    }

    try {
      setLoading(true);

      let notification_message = '';
      
      if (isAccepted) {
        notification_message = 'Your reservation has been processed to GSD, waiting for the approval';
      } else {
        notification_message = `Your Reservation Has Been Declined. Reason: ${declineReason === 'Other' ? customReason : declineReason}`;
      }

      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'handleApproval',
        reservation_id: reservationId,
        is_accepted: isAccepted,
        user_id: SecureStorage.getSessionItem("user_id"),
        notification_message: notification_message,
        notification_user_id: selectedRequest.user_id
      });

      if (response.data.status === 'success') {
        alert(isAccepted ? 'Request approved successfully' : 'Request declined successfully');
        setSelectedRequest(null);
        setDeclineModalVisible(false);
        setDeclineReason('');
        setCustomReason('');
        await fetchApprovalRequests();
      } else {
        alert(response.data.message || 'Failed to update approval status');
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Network error occurred while updating approval status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineConfirm = () => {
    if (!declineReason || (declineReason === 'Other' && !customReason)) {
      alert('Please select a reason for declining');
      return;
    }
    handleApproval(selectedRequest?.reservation_id, false);
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
      user_id: request.reservation_user_id,
      active: request.active || "1",
      fromApprovalByDept: request.fromApprovalByDept
    };
    setSelectedRequest(formattedRequest);
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/Department_Dean.php', {
        operation: 'fetchVenueScheduledCheck'
      });
      if (response.data && response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching venue schedule:', error);
      return [];
    }
  };

  const handleViewApprovalDetails = async (request) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/Department_Dean.php', {
        operation: 'fetchRequestById',
        reservation_id: request.reservation_id
      });
      // Fetch venue class schedule/class schedule data
      const scheduleData = await fetchAvailability();
      if (response.data && response.data.status === 'success' && response.data.data) {
        setApprovalModalRequest({
          ...response.data.data,
          availabilityData: scheduleData
        });
      } else {
        alert('Failed to fetch reservation details');
      }
    } catch (error) {
      alert('Network error while fetching reservation details');
    } finally {
      setLoading(false);
    }
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

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (
      (request.reservation_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.reservation_description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesStatus;
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

  const handleModalActionComplete = () => {
    fetchApprovalRequests();
    setApprovalModalRequest(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-none">
        <DeanSidebar />
      </div>
      <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="p-[2.5rem] lg:p-12 min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="mb-4 mt-20">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Approval Requests
              </h2>
            </div>
          </motion.div>

          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder="Search requests..."
                    allowClear
                    prefix={<SearchOutlined />}
                    size="large"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    placeholder="Filter by status"
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={filterOptions}
                    className="w-full"
                    size="large"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size="large"
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                    <tr>
                      <th scope="col" className="px-6 py-3" onClick={() => handleSort('id')}>
                        <div className="flex items-center cursor-pointer hover:text-gray-900">
                          ID
                          {sortField === 'id' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center">
                          Title
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center cursor-pointer hover:text-gray-900">
                          Created At
                          {sortField === 'createdAt' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3" onClick={() => handleSort('startDate')}>
                        <div className="flex items-center cursor-pointer hover:text-gray-900">
                          Start Date
                          {sortField === 'startDate' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center">
                          Requester
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center">
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
                            className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <td className="px-6 py-4">{request.reservation_id}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <span className="font-medium">{request.reservation_title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {format(new Date(request.reservation_created_at), 'MMM dd, yyyy h:mm a')}
                            </td>
                            <td className="px-6 py-4">
                              {format(new Date(request.reservation_start_date), 'MMM dd, yyyy h:mm a')}
                            </td>
                            <td className="px-6 py-4">{request.requester_name}</td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button
                                  type="primary"
                                  icon={<FiEye />}
                                  onClick={() => request.fromApprovalByDept ? handleViewDetails(request) : handleViewApprovalDetails(request)}
                                  size="middle"
                                  className="bg-blue-600 hover:bg-blue-700"
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
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

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={sortedRequests ? sortedRequests.length : 0}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger={true}
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} of ${total} items`
                    }
                    className="flex justify-end"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reservation Details Modal */}
      <AnimatePresence>
        {selectedRequest && selectedRequest.fromApprovalByDept && (
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
        {approvalModalRequest && (!selectedRequest || !selectedRequest.fromApprovalByDept) && (
          <ReservationDetailsApproval
            visible={!!approvalModalRequest}
            onClose={() => setApprovalModalRequest(null)}
            reservationDetails={approvalModalRequest}
            onApprove={() => handleApproval(approvalModalRequest.reservation_id, true)}
            onDecline={() => setDeclineModalVisible(true)}
            isApprovalView={true}
            onActionComplete={handleModalActionComplete}
          />
        )}
      </AnimatePresence>

      {/* Decline Reason Modal */}
      <MuiModal
        open={declineModalVisible}
        onClose={() => setDeclineModalVisible(false)}
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)'
          }
        }}
      >
        <Box sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 500,
          bgcolor: '#ffffff',
          borderRadius: 3,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
          p: 4,
          outline: 'none'
        }}>
          <Typography variant="h6" component="h2" sx={{
            fontWeight: 600,
            color: '#1e293b',
            mb: 3
          }}>
            Select Decline Reason
          </Typography>
          
          <RadioGroup
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            sx={{ mb: 3 }}
          >
            {declineReasons.map((reason) => (
              <FormControlLabel
                key={reason}
                value={reason}
                control={
                  <MuiRadio 
                    sx={{
                      color: '#64748b',
                      '&.Mui-checked': {
                        color: '#ef4444',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#1e293b', fontSize: '0.95rem' }}>
                    {reason}
                  </Typography>
                }
                sx={{ 
                  mb: 1,
                  py: 0.5,
                  px: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.02)'
                  }
                }}
              />
            ))}
          </RadioGroup>

          {declineReason === 'Other' && (
            <TextField
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              label="Please specify the reason"
              placeholder="Enter your reason here..."
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.95rem',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ef4444',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#64748b',
                  '&.Mui-focused': {
                    color: '#ef4444',
                  },
                },
              }}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <MuiButton 
              onClick={() => setDeclineModalVisible(false)}
              variant="outlined"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 500,
                color: '#64748b',
                borderColor: '#e2e8f0',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  borderColor: '#cbd5e1',
                }
              }}
            >
              Cancel
            </MuiButton>
            <MuiButton 
              onClick={handleDeclineConfirm}
              variant="contained" 
              color="error"
              disabled={!declineReason || (declineReason === 'Other' && !customReason)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(239, 68, 68, 0.12)',
                  color: 'rgba(239, 68, 68, 0.5)'
                }
              }}
            >
              Confirm Decline
            </MuiButton>
          </Box>
        </Box>
      </MuiModal>
    </div>
  );
};

export default ViewApproval;