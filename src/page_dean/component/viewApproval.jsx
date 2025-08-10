import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiEye, FiCalendar, FiMapPin, FiUser } from 'react-icons/fi';
import { Modal, Descriptions, Badge, Timeline, Card, Tabs, Button, Tag, Space, Divider, Alert, Table, List, Avatar } from 'antd';

const ViewApproval = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null); // Will be fetched from localStorage
  const [requestType, setRequestType] = useState('all'); // Default type
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [availabilityData, setAvailabilityData] = useState(null);

  // Fetch the department_id from localStorage on component mount
  useEffect(() => {
    const storedDepartmentId = localStorage.getItem("department_id");
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
        department_id: departmentId,
      });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve or Disapprove a request
  const handleApproval = async (approvalId, status) => {
    try {
        const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'approveRequest',
        approval_id: approvalId,
        status: status,
      });

      if (response.data.status === 'success') {
        alert(response.data.message);
        // Refresh the list after successful approval
        fetchApprovalRequests();
        // Close the details modal
        handleCloseDetails();
      } else {
        alert('Failed to update approval status');
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Error occurred while updating approval status');
    }
  };

  // Handle request type filter change
  const handleRequestTypeChange = (event) => {
    setRequestType(event.target.value);
  };

  // View details of the selected request
  const handleViewDetails = async (request) => {
    setSelectedRequest(request);
  };

  // Close the details view
  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setAvailabilityData(null);
  };

  // Decline the selected request
  const handleDecline = async (approvalId) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'declineRequest',
        approval_id: approvalId,
      });

      if (response.data.status === 'success') {
        alert(response.data.message);
        // Refresh the list after successful decline
        fetchApprovalRequests();
        // Close the details modal
        handleCloseDetails();
      } else {
        alert('Failed to decline the request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Error occurred while declining the request');
    }
  };

  useEffect(() => {
    if (departmentId) {
      fetchApprovalRequests();
    }
  }, [departmentId]);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (
      (request.vehicle?.form_name || request.venue?.form_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.vehicle?.purpose || request.venue?.event_title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesType = requestType === 'all' || 
      (requestType === 'vehicle' && request.vehicle?.license) ||
      (requestType === 'venue' && request.venue?.name);

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.approval_created_at) - new Date(a.approval_created_at);
    }
    return new Date(a.approval_created_at) - new Date(b.approval_created_at);
  });

  const isAnyResourceUnavailable = (availabilityData, details) => {
    if (!availabilityData) return false;

    let isUnavailable = false;

    if (details.venue) {
      isUnavailable = availabilityData.unavailable_venues?.some(
        v => v.ven_id === details.venue.venue_id
      ) || isUnavailable;
    }

    if (details.vehicle) {
      isUnavailable = availabilityData.unavailable_vehicles?.some(
        v => v.vehicle_id === details.vehicle.vehicle_id
      ) || isUnavailable;
      
      // Check driver availability
      isUnavailable = availabilityData.unavailable_drivers?.some(
        d => d.driver_id === details.vehicle.driver_id
      ) || isUnavailable;
    }

    if (details.equipment) {
      isUnavailable = availabilityData.unavailable_equipment?.some(
        e => e.equip_id === details.equipment.equip_id
      ) || isUnavailable;
    }

    return isUnavailable;
  };

  const getAvailabilityStatus = (type, id) => {
    if (!availabilityData) return true;

    switch (type) {
      case 'venue':
        return !availabilityData.unavailable_venues?.some(v => v.ven_id === id);
      case 'vehicle':
        return !availabilityData.unavailable_vehicles?.some(v => v.vehicle_id === id);
      case 'driver':
        return !availabilityData.unavailable_drivers?.some(d => d.driver_id === id);
      case 'equipment':
        return !availabilityData.unavailable_equipment?.some(e => e.equip_id === id);
      default:
        return true;
    }
  };

  const VenueRequestModal = ({ request, visible, onClose, onApprove, onDecline, availabilityData }) => {
    const getAvailabilityStatus = (type, id) => {
      if (!availabilityData) return true;
      return !availabilityData.unavailable_venues?.some(v => v.ven_id === id);
    };
  
    return (
      <Modal
        visible={visible}
        onCancel={onClose}
        width={800}
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Venue Request Details</span>
            <Space>
              <Tag color="blue">{request.venue.name}</Tag>
              <Badge status={request.status === 'pending' ? 'processing' : request.status === 'approved' ? 'success' : 'error'} 
                    text={request.status?.toUpperCase()} />
            </Space>
          </div>
        }
        footer={[
          <Button key="decline" danger icon={<FiX />} onClick={onDecline}>Decline</Button>,
          <Button key="approve" type="primary" className="bg-green-600" icon={<FiCheck />} onClick={onApprove}>Approve</Button>
        ]}
      >
        <div className="space-y-6">
          {/* Request Overview Card */}
          <Card title="Event Information" className="shadow-sm">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Event Title" span={2}>{request.venue.event_title}</Descriptions.Item>
              <Descriptions.Item label="Requester">{request.venue.requester}</Descriptions.Item>
              <Descriptions.Item label="Participants">{request.venue.participants}</Descriptions.Item>
              <Descriptions.Item label="Start Date" span={1}>
                {new Date(request.venue.start_date).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="End Date" span={1}>
                {new Date(request.venue.end_date).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
  
          {/* Venue Details Card */}
          <Card title="Venue Details" className="shadow-sm">
            <Descriptions bordered>
              <Descriptions.Item label="Venue Name" span={2}>{request.venue.name}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getAvailabilityStatus('venue', request.venue.ven_id) ? 'success' : 'error'}>
                  {getAvailabilityStatus('venue', request.venue.ven_id) ? 'Available' : 'Unavailable'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={3}>{request.venue.description}</Descriptions.Item>
            </Descriptions>
          </Card>
  
          {/* Equipment Section if any */}
          {request.equipment && request.equipment.equipment_ids.length > 0 && (
            <Card title="Equipment Requested" className="shadow-sm">
              <Table
                dataSource={request.equipment.equipment_ids.map((id, index) => ({
                  key: id,
                  name: request.equipment.name[index],
                  quantity: request.equipment.quantity[index]
                }))}
                columns={[
                  { title: 'Equipment', dataIndex: 'name' },
                  { title: 'Quantity', dataIndex: 'quantity' }
                ]}
                pagination={false}
              />
            </Card>
          )}
        </div>
      </Modal>
    );
  };
  
  const VehicleRequestModal = ({ request, visible, onClose, onApprove, onDecline, availabilityData }) => {
    const getAvailabilityStatus = (type, id) => {
      if (!availabilityData) return true;
      switch (type) {
        case 'vehicle':
          return !availabilityData.unavailable_vehicles?.some(v => v.vehicle_id === id);
        case 'driver':
          return !availabilityData.unavailable_drivers?.some(d => d.driver_id === id);
        default:
          return true;
      }
    };
  
    return (
      <Modal
        visible={visible}
        onCancel={onClose}
        width={800}
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Vehicle Request Details</span>
            <Space>
              <Tag color="purple">{request.vehicle.license || 'No License'}</Tag>
              <Badge 
                status={request.status === 'pending' ? 'processing' : request.status === 'approved' ? 'success' : 'error'} 
                text={request.status?.toUpperCase()} 
              />
            </Space>
          </div>
        }
        footer={[
          <Button key="decline" danger icon={<FiX />} onClick={onDecline}>Decline</Button>,
          <Button key="approve" type="primary" className="bg-green-600" icon={<FiCheck />} onClick={onApprove}>Approve</Button>
        ]}
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <Card title="Request Information" className="shadow-sm">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Requester" span={2}>{request.vehicle.requester}</Descriptions.Item>
              <Descriptions.Item label="Purpose" span={2}>{request.vehicle.purpose}</Descriptions.Item>
              <Descriptions.Item label="Destination" span={2}>{request.vehicle.destination}</Descriptions.Item>
            </Descriptions>
          </Card>
  
          {/* Schedule Information */}
          <Card title="Schedule Details" className="shadow-sm">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Start Date & Time">
                {new Date(request.vehicle.start_date).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="End Date & Time">
                {new Date(request.vehicle.end_date).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
  
          {/* Vehicle Details */}
          <Card title="Vehicle Information" className="shadow-sm">
            <Descriptions bordered>
              <Descriptions.Item label="License Plate">{request.vehicle.license}</Descriptions.Item>
              <Descriptions.Item label="Make">{request.vehicle.make}</Descriptions.Item>
              <Descriptions.Item label="Model">{request.vehicle.model}</Descriptions.Item>
              <Descriptions.Item label="Category">{request.vehicle.category}</Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={getAvailabilityStatus('vehicle', request.vehicle.vehicle_id) ? 'success' : 'error'}>
                  {getAvailabilityStatus('vehicle', request.vehicle.vehicle_id) ? 'Available' : 'Unavailable'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
  
          {/* Drivers Section */}
          <Card title="Assigned Driver" className="shadow-sm">
            <List
              dataSource={request.vehicle.driver_ids.map((id, index) => ({
                id,
                name: request.vehicle.driver_names[index]
              }))}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<FiUser />} />}
                    title={item.name}
                    description={
                      <Tag color={getAvailabilityStatus('driver', item.id) ? 'success' : 'error'}>
                        {getAvailabilityStatus('driver', item.id) ? 'Available' : 'Unavailable'}
                      </Tag>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
  
          {/* Passengers Section */}
          {request.passengers && request.passengers.length > 0 && (
            <Card title="Passengers" className="shadow-sm">
              <List
                dataSource={request.passengers}
                renderItem={passenger => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<FiUser />} />}
                      title={passenger.passenger_name}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </div>
      </Modal>
    );
  };

  // Add this new function to determine the request type
  const getRequestType = (request) => {
    if (request?.venue?.ven_id) {
      return 'venue';
    } else if (request?.vehicle?.vehicle_id) {
      return 'vehicle';
    }
    return null;
  };

  // Modify the modal rendering section
  return (
    <div className="flex flex-col">
      {/* Filters Section */}
      <div className="bg-white border-b py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <select
              value={requestType}
              onChange={handleRequestTypeChange}
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="venue">Venue</option>
              <option value="vehicle">Vehicle</option>
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

            <button
              onClick={fetchApprovalRequests}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto py-6">
        <AnimatePresence>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No requests found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {sortedRequests.map((request) => (
                <motion.div
                  key={request.approval_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Enhanced Request Card Layout */}
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.vehicle?.form_name || request.venue?.form_name || 'Unnamed Request'}
                        </h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FiCalendar className="mr-2" />
                            {new Date(request.approval_created_at).toLocaleDateString()}
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
                          request.vehicle?.license ? 
                          'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {request.vehicle?.license ? 'Vehicle' : 'Venue'}
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

      {/* Enhanced Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <>
            {getRequestType(selectedRequest) === 'venue' && (
              <VenueRequestModal
                request={selectedRequest}
                visible={!!selectedRequest}
                onClose={handleCloseDetails}
                onApprove={() => handleApproval(selectedRequest.approval_id, 'approved')}
                onDecline={() => handleDecline(selectedRequest.approval_id)}
                availabilityData={availabilityData}
              />
            )}
            {getRequestType(selectedRequest) === 'vehicle' && (
              <VehicleRequestModal
                request={selectedRequest}
                visible={!!selectedRequest}
                onClose={handleCloseDetails}
                onApprove={() => handleApproval(selectedRequest.approval_id, 'approved')}
                onDecline={() => handleDecline(selectedRequest.approval_id)}
                availabilityData={availabilityData}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewApproval;
