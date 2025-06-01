import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeanSidebar from './component/dean_sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiEye, FiCalendar, FiMapPin, FiUser, FiBox, FiInfo, FiClock, FiArchive, FiTool, FiGrid, FiUsers } from 'react-icons/fi';
import { Descriptions, Badge, Timeline, Card, Tabs, Button, Tag, Space, Divider, Alert, Table, List, Avatar, Tooltip, Empty, Spin, Input } from 'antd';
import { Box, Typography, RadioGroup, FormControlLabel, Radio as MuiRadio, TextField, Modal as MuiModal, Button as MuiButton, Paper, AlertTitle } from '@mui/material';

const ViewApproval = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [requestType, setRequestType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customReason, setCustomReason] = useState('');

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

  // Fetch the department_id from localStorage on component mount
  useEffect(() => {
    const storedDepartmentId = SecureStorage.getSessionItem("department_id");
    if (storedDepartmentId) {
      setDepartmentId(storedDepartmentId);
    } else {
      console.error("No department ID found in localStorage.");
    }
  }, []);

  // Fetch the approval requests when the component mounts or when filters change
  const fetchApprovalRequests = async () => {
    if (!departmentId) {
      console.error("Department ID is not available");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'fetchApprovalByDept',
        json: {
          department_id: departmentId,
          user_level_id: SecureStorage.getSessionItem("user_level_id"),
          current_user_id: SecureStorage.getSessionItem("user_id")
        }
      });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

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
        notification_user_id: selectedRequest.user_id // Adding the notification_user_id parameter
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

  // Handle request type filter change
  const handleRequestTypeChange = (event) => {
    setRequestType(event.target.value);
  };

  // View details of the selected request
  const handleViewDetails = async (request) => {
    const formattedRequest = {
      reservation_id: request.reservation_id,
      requester: request.requester_name,
      department_name: request.department_name,
      reservation_created_at: request.reservation_created_at,
      reservation_start_date: request.reservation_start_date,
      reservation_end_date: request.reservation_end_date,
      title: request.reservation_title,
      description: request.reservation_description,
      venues: request.venues || [],
      vehicles: request.vehicles || [],
      equipment: request.equipment ? {
        equipment_ids: request.equipment.map(e => e.equipment_id),
        items: request.equipment
      } : null,
      passengers: request.passengers || [],
      drivers: request.drivers || [],
      user_id: request.reservation_user_id
    };

    console.log("Formatted Request:", formattedRequest);
    
    setSelectedRequest(formattedRequest);
  };

  // Close the details view
  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  useEffect(() => {
    if (departmentId) {
      fetchApprovalRequests();
    }
  }, [departmentId]);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (
      (request.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.purpose || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesType = requestType === 'all' || 
      (requestType === 'vehicle' && request.vehicle?.id) ||
      (requestType === 'venue' && request.venue?.id);

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.reservation_created_at) - new Date(a.reservation_created_at);
    }
    return new Date(a.reservation_created_at) - new Date(b.reservation_created_at);
  });

  // Update the RequestDetailsModal component to handle decline properly
  const RequestDetailsModal = ({ request, visible, onClose, onApprove, onDecline }) => {
    if (!request) return null;
    
    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return 'N/A';
      const date = new Date(dateTimeStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const calculateDuration = () => {
      if (!request.reservation_start_date || !request.reservation_end_date) return "N/A";
      
      const start = new Date(request.reservation_start_date);
      const end = new Date(request.reservation_end_date);
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs > 0 ? `${diffHrs}h` : ''} ${diffMins > 0 ? `${diffMins}m` : ''}`.trim() || "0m";
    };
    
    return (
      <MuiModal
        open={visible}
        onClose={onClose}
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
          width: '95%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          bgcolor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          <MuiButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              zIndex: 10,
              color: 'text.secondary',
              minWidth: 'auto',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              p: 0,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            <FiX size={20} />
          </MuiButton>

          {/* Left Panel - Request Information */}
          <Box sx={{
            width: { xs: '100%', md: '33%' },
            bgcolor: '#f8fafc',
            p: 4,
            borderRight: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.06)',
            overflow: 'auto'
          }}>
            <Typography variant="h5" component="h2" sx={{ 
              fontWeight: 600, 
              mb: 4,
              color: '#1e293b'
            }}>
              Reservation Details
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Paper elevation={0} sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 3,
                border: '1px solid rgba(0, 0, 0, 0.06)',
                bgcolor: '#ffffff'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: '#3b82f6', 
                    width: 48, 
                    height: 48,
                    boxShadow: '0 2px 10px rgba(59, 130, 246, 0.25)' 
                  }}>
                    <FiUser size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {request.requester}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {request.department_name}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 3,
                  '& .field-label': {
                    fontSize: '0.75rem',
                    color: '#64748b',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  },
                  '& .field-value': {
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    fontWeight: 500,
                  }
                }}>
                  <Box>
                    <Typography className="field-label">Request ID</Typography>
                    <Typography className="field-value" sx={{ 
                      fontFamily: 'monospace', 
                      bgcolor: '#f1f5f9', 
                      p: 1, 
                      borderRadius: 1,
                      fontSize: '0.8rem' 
                    }}>
                      {request.reservation_id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography className="field-label">Created On</Typography>
                    <Typography className="field-value">
                      {formatDateTime(request.reservation_created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 3,
                border: '1px solid rgba(0, 0, 0, 0.06)',
                bgcolor: '#ffffff'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  color: '#1e293b',
                  fontWeight: 600
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#e0f2fe',
                    color: '#0284c7',
                    width: 32,
                    height: 32,
                    borderRadius: '50%'
                  }}>
                    <FiCalendar size={16} />
                  </Box>
                  Schedule Information
                </Typography>

                <Box sx={{ 
                  display: 'grid', 
                  gap: 3,
                  '& .field-label': {
                    fontSize: '0.75rem',
                    color: '#64748b',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  },
                  '& .field-value': {
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    fontWeight: 500,
                  }
                }}>
                  <Box>
                    <Typography className="field-label">Start Date & Time</Typography>
                    <Typography className="field-value" sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Box sx={{ 
                        color: '#0284c7', 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center' 
                      }}>
                        <FiClock size={14} />
                      </Box>
                      {formatDateTime(request.reservation_start_date)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography className="field-label">End Date & Time</Typography>
                    <Typography className="field-value" sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Box sx={{ 
                        color: '#0284c7', 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center' 
                      }}>
                        <FiClock size={14} />
                      </Box>
                      {formatDateTime(request.reservation_end_date)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography className="field-label">Duration</Typography>
                    <Typography className="field-value">
                      <Tag color="#0284c7" style={{ borderRadius: '4px', padding: '2px 10px' }}>
                        {calculateDuration()}
                      </Tag>
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ 
                p: 3, 
                borderRadius: 3,
                border: '1px solid rgba(0, 0, 0, 0.06)',
                bgcolor: '#ffffff'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  color: '#1e293b',
                  fontWeight: 600
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#fef2f2',
                    color: '#ef4444',
                    width: 32,
                    height: 32,
                    borderRadius: '50%'
                  }}>
                    <FiInfo size={16} />
                  </Box>
                  Request Information
                </Typography>

                <Box sx={{ 
                  display: 'grid', 
                  gap: 3,
                  '& .field-label': {
                    fontSize: '0.75rem',
                    color: '#64748b',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  },
                  '& .field-value': {
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    fontWeight: 500,
                  }
                }}>
                  <Box>
                    <Typography className="field-label">Title</Typography>
                    <Typography className="field-value">
                      {request.title || 'No title provided'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography className="field-label">Description</Typography>
                    <Typography className="field-value" sx={{ 
                      bgcolor: '#f8fafc', 
                      p: 2, 
                      borderRadius: 2,
                      fontWeight: 400,
                      maxHeight: '120px',
                      overflow: 'auto',
                      fontSize: '0.85rem',
                      lineHeight: 1.6
                    }}>
                      {request.description || 'No description provided'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>

          {/* Right Panel - Resource Details */}
          <Box sx={{
            width: { xs: '100%', md: '67%' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#ffffff',
          }}>
            <Box sx={{ 
              p: 4, 
              borderBottom: '1px solid', 
              borderColor: 'rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: '#1e293b'
              }}>
                Reserved Resources
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Review all resources requested for this reservation
              </Typography>
            </Box>

            <Box sx={{ 
              p: 4, 
              overflow: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              {/* Venues Section */}
              {request.venues && request.venues.length > 0 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2.5 
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(82, 196, 26, 0.1)',
                    }}>
                      <FiMapPin style={{ color: "#52c41a" }} />
                    </Box>
                    <Typography sx={{ 
                      fontSize: '1rem', 
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      Venues
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2
                  }}>
                    {request.venues.map((venue, index) => (
                      <Paper 
                        key={venue.venue_id || index} 
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderLeft: '4px solid #52c41a',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2
                        }}>
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '8px',
                            bgcolor: 'rgba(82, 196, 26, 0.08)',
                            color: '#52c41a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FiMapPin size={18} />
                          </Box>
                          <Box>
                            <Typography sx={{ 
                              fontSize: '0.75rem',
                              color: '#64748b',
                              mb: 0.5,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Venue Name
                            </Typography>
                            <Typography sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.95rem'
                            }}>
                              {venue.venue_name}
                            </Typography>
                            {venue.location && (
                              <Typography sx={{ 
                                fontSize: '0.85rem',
                                color: '#64748b',
                                mt: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}>
                                <FiMapPin size={12} />
                                {venue.location}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Vehicles Section */}
              {request.vehicles && request.vehicles.length > 0 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2.5 
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(24, 144, 255, 0.1)',
                    }}>
                      <FiGrid style={{ color: "#1890ff" }} />
                    </Box>
                    <Typography sx={{ 
                      fontSize: '1rem', 
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      Vehicles
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2
                  }}>
                    {request.vehicles.map((vehicle, index) => (
                      <Paper 
                        key={vehicle.vehicle_id || index} 
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderLeft: '4px solid #1890ff',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2
                        }}>
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '8px',
                            bgcolor: 'rgba(24, 144, 255, 0.08)',
                            color: '#1890ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FiGrid size={18} />
                          </Box>
                          <Box sx={{ width: '100%' }}>
                            <Typography sx={{ 
                              fontSize: '0.75rem',
                              color: '#64748b',
                              mb: 0.5,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Vehicle
                            </Typography>
                            <Typography sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.95rem'
                            }}>
                              {vehicle.vehicle_name || vehicle.name}
                            </Typography>
                            
                            <Box sx={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: 2,
                              mt: 2
                            }}>
                              {vehicle.model && (
                                <Box>
                                  <Typography sx={{ 
                                    fontSize: '0.7rem',
                                    color: '#64748b',
                                    mb: 0.25,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    Model
                                  </Typography>
                                  <Typography sx={{ 
                                    color: '#334155',
                                    fontSize: '0.85rem'
                                  }}>
                                    {vehicle.model}
                                  </Typography>
                                </Box>
                              )}
                              
                              {(vehicle.license || vehicle.plate_number) && (
                                <Box>
                                  <Typography sx={{ 
                                    fontSize: '0.7rem',
                                    color: '#64748b',
                                    mb: 0.25,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    License Plate
                                  </Typography>
                                  <Typography sx={{ 
                                    color: '#334155',
                                    fontSize: '0.85rem',
                                    fontFamily: 'monospace',
                                    bgcolor: '#f1f5f9',
                                    p: '2px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-block'
                                  }}>
                                    {vehicle.license || vehicle.plate_number}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Equipment Section */}
              {request.equipment && request.equipment.items && request.equipment.items.length > 0 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2.5 
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(250, 84, 28, 0.1)',
                    }}>
                      <FiTool style={{ color: "#fa541c" }} />
                    </Box>
                    <Typography sx={{ 
                      fontSize: '1rem', 
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      Equipment
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2
                  }}>
                    {request.equipment.items.map((item, index) => (
                      <Paper 
                        key={item.equipment_id || index} 
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderLeft: '4px solid #fa541c',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2
                        }}>
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '8px',
                            bgcolor: 'rgba(250, 84, 28, 0.08)',
                            color: '#fa541c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FiTool size={18} />
                          </Box>
                          <Box>
                            <Typography sx={{ 
                              fontSize: '0.75rem',
                              color: '#64748b',
                              mb: 0.5,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Equipment
                            </Typography>
                            <Typography sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.95rem'
                            }}>
                              {item.equipment_name || item.name}
                            </Typography>
                            {item.quantity && (
                              <Box sx={{
                                mt: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}>
                                <Tag color="#fa541c" style={{ 
                                  borderRadius: '4px', 
                                  padding: '1px 8px', 
                                  fontSize: '0.75rem' 
                                }}>
                                  Qty: {item.quantity}
                                </Tag>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Passengers Section */}
              {request.passengers && request.passengers.length > 0 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2.5 
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(114, 46, 209, 0.1)',
                    }}>
                      <FiUsers style={{ color: "#722ed1" }} />
                    </Box>
                    <Typography sx={{ 
                      fontSize: '1rem', 
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      Passengers ({request.passengers.length})
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 2
                  }}>
                    {request.passengers.map((passenger, index) => (
                      <Paper 
                        key={index} 
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderLeft: '4px solid #722ed1',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            transform: 'translateY(-2px)'
                          },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Avatar sx={{ 
                          bgcolor: '#722ed1', 
                          width: 36, 
                          height: 36,
                          fontSize: '0.9rem'
                        }}>
                          {(passenger.name || passenger).charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ 
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.9rem'
                          }}>
                            {passenger.name || passenger}
                          </Typography>
                          {passenger.role && (
                            <Typography sx={{ 
                              fontSize: '0.75rem',
                              color: '#64748b'
                            }}>
                              {passenger.role}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Drivers Section */}
              {request.drivers && request.drivers.length > 0 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2.5 
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(19, 194, 194, 0.1)',
                    }}>
                      <FiUsers style={{ color: "#13c2c2" }} />
                    </Box>
                    <Typography sx={{ 
                      fontSize: '1rem', 
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      Drivers
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2
                  }}>
                    {request.drivers.map((driver, index) => (
                      <Paper 
                        key={index} 
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderLeft: '4px solid #13c2c2',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            transform: 'translateY(-2px)'
                          },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Avatar sx={{ 
                          bgcolor: '#13c2c2', 
                          width: 40, 
                          height: 40,
                          fontSize: '1rem'
                        }}>
                          {(!driver.name || driver.is_accepted_trip === null) ? 'T' : driver.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ 
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.9rem'
                          }}>
                            {(!driver.name && driver.is_accepted_trip === null) ? (
                              'Trip Ticket Request'
                            ) : (
                              driver.name || 'Trip Ticket Request'
                            )}
                          </Typography>
                          {driver.driver_id && (
                            <Typography sx={{ 
                              fontSize: '0.75rem',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <Box component="span" sx={{
                                fontSize: '0.75rem',
                                color: '#a1a1aa',
                                bgcolor: '#f4f4f5',
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 1,
                                fontFamily: 'monospace'
                              }}>
                                ID: {driver.driver_id}
                              </Box>
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ 
              p: 4, 
              borderTop: '1px solid', 
              borderColor: 'rgba(0, 0, 0, 0.06)',
              bgcolor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              gap: 2
            }}>
              <Alert
                severity="info"
                sx={{ 
                  flexGrow: 1, 
                  maxWidth: { xs: '100%', md: '65%' },
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    color: '#0ea5e9',
                    opacity: 1,
                    alignItems: 'center'
                  },
                  '& .MuiAlert-message': {
                    color: '#0c4a6e'
                  }
                }}
              >
                <AlertTitle sx={{ fontWeight: 600 }}>Ready for Review</AlertTitle>
                <Typography variant="body2">
                  Please review the details of this reservation request and take appropriate action.
                </Typography>
              </Alert>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                flexShrink: 0,
                width: { xs: '100%', md: 'auto' }
              }}>
                <MuiButton
                  variant="outlined"
                  color="error"
                  startIcon={<FiX />}
                  onClick={() => onDecline(request.reservation_id)}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: 'rgba(239, 68, 68, 0.04)'
                    }
                  }}
                >
                  Decline Request
                </MuiButton>
                <MuiButton
                  variant="contained"
                  color="success"
                  startIcon={<FiCheck />}
                  onClick={() => onApprove(request.reservation_id)}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)'
                    }
                  }}
                >
                  Approve Request
                </MuiButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </MuiModal>
    );
  };

  // Update the DeclineReasonModal to work as an overlay with fixed state handling
  const DeclineReasonModal = ({ visible, onClose }) => {
    // Move the handlers inside the modal component to maintain state
    const handleReasonChange = (event) => {
      setDeclineReason(event.target.value);
      if (event.target.value !== 'Other') {
        setCustomReason('');
      }
    };

    const handleCustomReasonChange = (event) => {
      setCustomReason(event.target.value);
    };

    const handleClose = () => {
      onClose();
      // Don't reset the states here to preserve input when reopening
    };

    if (!visible) return null;

    return (
      <MuiModal
        open={visible}
        onClose={handleClose}
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
            onChange={handleReasonChange}
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
              onChange={handleCustomReasonChange}
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
              onClick={handleClose}
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
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DeanSidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header Section */}
          <header className="bg-white shadow-sm px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900">Approval Requests</h1>
              <p className="mt-1 text-sm text-gray-500">Manage and review reservation requests for your department</p>
            </div>
          </header>

          {/* Filters Section */}
          <div className="bg-white border-b px-8 py-4">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by requester, title, purpose..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <select
                  value={requestType}
                  onChange={handleRequestTypeChange}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="venue">Venue</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="equipment">Equipment</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

                <Tooltip title="Refresh data">
                  <button
                    onClick={fetchApprovalRequests}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Spin size="large" />
                  </div>
                ) : sortedRequests.length === 0 ? (
                  <Empty 
                    description="No requests found matching your criteria" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="my-16"
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {sortedRequests.map((request) => (
                      <motion.div
                        key={request.reservation_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100"
                      >
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {request.reservation_title || 'Unnamed Request'}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {request.reservation_description || 'No description provided'}
                              </p>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <FiUser className="mr-2" />
                                  {request.requester}
                                </span>
                                <span className="flex items-center">
                                  <FiCalendar className="mr-2" />
                                  {new Date(request.reservation_created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <FiMapPin className="mr-2" />
                                  {request.vehicle?.destination || request.venue?.name || 'N/A'}
                                </span>
                                <span className="flex items-center">
                                  <FiUser className="mr-2" />
                                  {request.vehicle?.requester || request.venue?.requester || 'Unknown'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                request.vehicle ? 
                                'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {request.vehicle ? 'Vehicle' : 'Venue'}
                              </span>
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                              >
                                <FiEye className="mr-2" />
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Universal Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            visible={!!selectedRequest}
            onClose={() => {
              handleCloseDetails();
              setDeclineModalVisible(false); // Also close decline modal if open
            }}
            onApprove={() => handleApproval(selectedRequest.reservation_id, true)}
            onDecline={() => setDeclineModalVisible(true)}
          />
        )}
      </AnimatePresence>

      <DeclineReasonModal
        visible={declineModalVisible}
        onClose={() => setDeclineModalVisible(false)}
      />
    </div>
  );
};

export default ViewApproval;