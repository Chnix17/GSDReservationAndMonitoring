import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
    FaClock, 
    FaCalendar, 
    FaUser, 
    FaEye, 
    FaUsers,
    FaBuilding,
    FaTools,
    FaCheckCircle,
    FaUserShield,
    FaCar,
    FaMapMarkedAlt,
    FaFileAlt,
    FaIdCard,
    FaTags,
    FaSearch
} from 'react-icons/fa';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './component/user_sidebar';
import { Modal, Tabs, Table, Input, Button, Tag, Tooltip, Space } from 'antd';
import { SecureStorage } from '../utils/encryption';
import { InfoCircleOutlined, BuildOutlined, ToolOutlined, UserOutlined, TeamOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const ViewReserve = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [reservations, setReservations] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedReservation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const baseUrl = SecureStorage.getLocalItem("url");

    const [detailedReservation] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [reservationDetails, setReservationDetails] = useState(null);

    const statusColors = {
        confirmed: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    // Table columns configuration
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text) => <span className="font-semibold text-blue-800">{text}</span>
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 170,
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            width: 170,
            sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
            render: (text) => format(new Date(text), 'MMM dd, yyyy h:mm a')
        },
        {
            title: 'End Date',
            dataIndex: 'endDate',
            key: 'endDate',
            width: 170,
            sorter: (a, b) => new Date(a.endDate) - new Date(b.endDate),
            render: (text) => format(new Date(text), 'MMM dd, yyyy h:mm a')
        },
        {
            title: 'Participants',
            dataIndex: 'participants',
            key: 'participants',
            width: 120,
            render: (text) => text || 'Not specified'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Tag 
                    color={
                        status === 'confirmed' ? 'success' : 
                        status === 'pending' ? 'warning' : 
                        'error'
                    }
                >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Tag>
            ),
            filters: [
                { text: 'Confirmed', value: 'confirmed' },
                { text: 'Pending', value: 'pending' },
                { text: 'Cancelled', value: 'cancelled' }
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button 
                            type="primary" 
                            icon={<FaEye />} 
                            onClick={() => handleViewReservation(record)}
                            size="small"
                            className="bg-blue-500 hover:bg-blue-600 border-blue-500"
                        />
                    </Tooltip>
                    {record.status !== 'cancelled' && (
                        <Tooltip title="Cancel Reservation">
                            <Button 
                                danger
                                onClick={() => {
                                    setReservationToCancel({
                                        id: record.id,
                                        name: record.title
                                    });
                                    setShowCancelModal(true);
                                }}
                                size="small"
                                className="border-red-300 hover:border-red-400"
                                icon={<FaTags />}
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    useEffect(() => {
              const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
              const decryptedUserLevel = parseInt(encryptedUserLevel);
              if (decryptedUserLevel !== 3 && decryptedUserLevel !== 15 && decryptedUserLevel !== 16 && decryptedUserLevel !== 17) {
                  localStorage.clear();
                  navigate('/gsd');
              }
        }, [navigate]);


    const confirmCancelReservation = async () => {
        try {
            const userId = SecureStorage.getSessionItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                navigate('/gsd');
                return;
            }

            const response = await fetch(`${baseUrl}/process_reservation.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'handleCancelReservation',
                    reservation_id: reservationToCancel.id,
                    user_id: userId
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Update the local state
                setReservations(prevReservations =>
                    prevReservations.map(res =>
                        res.id === reservationToCancel.id
                            ? { ...res, status: 'cancelled' }
                            : res
                    )
                );
                toast.success(result.message || 'Reservation cancelled successfully!');
                setShowCancelModal(false);
                setReservationToCancel(null);
            } else {
                toast.error(result.message || 'Failed to cancel reservation');
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            toast.error('Failed to cancel reservation');
        }
    };

 

    const fetchReservations = useCallback(async () => {
        try {
            const userId = SecureStorage.getSessionItem('user_id');
            console.log('Fetching reservations for user:', userId);
            
            if (!userId) {
                toast.error('User session expired');
                navigate('/gsd');
                return;
            }

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

            const result = await response.json();
            console.log('API response:', result);
            
            if (result.status === 'success' && result.data) {
                const transformedReservations = result.data.map(reservation => {
                    // Format creation date and time
                    const createdAt = new Date(reservation.reservation_created_at);
                    const formattedCreatedAt = format(createdAt, 'MMM dd, yyyy h:mm a');
                    
                    return {
                        id: reservation.reservation_id,
                        title: reservation.reservation_title,
                        description: reservation.reservation_description,
                        startDate: new Date(reservation.reservation_start_date),
                        endDate: new Date(reservation.reservation_end_date),
                        participants: reservation.reservation_participants,
                        createdAt: formattedCreatedAt,
                        status: reservation.reservation_status || 'pending' // Use the status from API
                    };
                });
                setReservations(transformedReservations);
            } else {
                throw new Error(result.message || 'Failed to fetch reservations');
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
            toast.error('Failed to fetch reservations');
        }
    }, [navigate]);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        const isLoggedIn = localStorage.getItem('loggedIn');
        
        if (!userId || !isLoggedIn) {
            toast.error('Please login first');
            navigate('/gsd'); // or wherever your login page is
            return;
        }
        
        console.log('User ID:', userId); // Debug log
        fetchReservations();
    }, [navigate, fetchReservations]);

    const filteredReservations = reservations.filter(reservation => 
        activeFilter === 'all' ? true : reservation.status === activeFilter
    );

    const handleViewReservation = async (reservation) => {
        try {
            // Fetch reservation details
            const detailsResponse = await fetch(`${baseUrl}/faculty&staff.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'fetchMyReservationbyId',
                    reservationId: reservation.id
                })
            });

            // Fetch status history
            const statusResponse = await fetch(`${baseUrl}/faculty&staff.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'fetchStatusById',
                    reservationId: reservation.id
                })
            });

            // Fetch maintenance resources
            const maintenanceResponse = await fetch(`${baseUrl}/faculty&staff.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'displayedMaintenanceResources',
                    reservationId: reservation.id
                })
            });

            const [result, statusResult, maintenanceResult] = await Promise.all([
                detailsResponse.json(),
                statusResponse.json(),
                maintenanceResponse.json()
            ]);
            
            if (result.status === 'success') {
                const details = result.data;
                // Debug status history
                if (statusResult.status === 'success' && statusResult.data) {
                    console.log("Status History:", statusResult.data.map(s => ({
                        status_id: s.status_id,
                        status_name: s.status_name,
                        active: s.active
                    })));
                }
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

        console.log("DetailModal rendering with reservationDetails:", JSON.stringify(reservationDetails, null, 2));

        const getStatusColor = () => {
            if (reservationDetails.active === "0") return "gold";
            switch (reservationDetails.reservation_status?.toLowerCase()) {
                case 'approved': return "green";
                case 'declined': return "red";
                case 'pending': return "blue";
                default: return "blue";
            }
        };

        // Check if reservation is cancelled or completed
        const isCancelled = reservationDetails.statusHistory?.some(
            status => status.status_name === "Cancelled"
        );
        
        // Check if reservation is completed by looking for status_id "4" or status_name "Completed"
        // Modified to specifically check for the structure in the sample data
        const isCompleted = reservationDetails.statusHistory?.some(
            status => {
                // Log each status entry to debug
                console.log("Checking status entry:", status);
                // Check if this is a completed status (status_id 4) and it's the active status (active is 1)
                const completedById = status.status_id === "4";
                const completedByName = status.status_name === "Completed";
                const isActiveStatus = status.active === "1";
                
                console.log(`Status ${status.status_id} (${status.status_name}): completedById=${completedById}, completedByName=${completedByName}, isActiveStatus=${isActiveStatus}`);
                
                return (completedById || completedByName) && isActiveStatus;
            }
        ) || (reservationDetails.reservation_status?.toLowerCase() === "completed");

        console.log("Final isCompleted value:", isCompleted);
        console.log("Reservation status from API:", reservationDetails.reservation_status);

        const handleShowCancelModal = () => {
            setReservationToCancel({
                id: reservationDetails.reservation_id,
                name: reservationDetails.reservation_event_title || reservationDetails.reservation_destination
            });
            setShowCancelModal(true);
            onClose(); // Close the detail modal
        };

        // Function to format status timestamp
        const formatStatusDate = (dateString) => {
            return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
        };

        // Function to handle reservation cancellation
        const handleCancelReservation = async () => {
            try {
                const userId = localStorage.getItem('user_id');
                const response = await fetch(`${baseUrl}/process_reservation.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        operation: 'handleCancelReservation',
                        reservation_id: reservationDetails.reservation_id,
                        user_id: userId
                    })
                });

                const result = await response.json();

                if (result.status === 'success') {
                    toast.success(result.message);
                    onClose();
                    fetchReservations(); // Refresh the list
                } else {
                    toast.error(result.message || 'Failed to cancel reservation');
                }
            } catch (error) {
                console.error('Error cancelling reservation:', error);
                toast.error('Failed to cancel reservation');
            }
        };

        // Table columns definition for resources
        const venueColumns = [
            {
                title: 'Venue Name',
                dataIndex: 'venue_name',
                key: 'venue_name',
                render: (text) => (
                    <div className="flex items-center">
                        <BuildOutlined className="mr-2 text-purple-500" />
                        <span className="font-medium">{text}</span>
                    </div>
                )
            },
            {
                title: 'Capacity',
                dataIndex: 'occupancy',
                key: 'occupancy',
            }
        ];

        const equipmentColumns = [
            {
                title: 'Equipment',
                dataIndex: 'name',
                key: 'name',
                render: (text) => (
                    <div className="flex items-center">
                        <ToolOutlined className="mr-2 text-orange-500" />
                        <span className="font-medium">{text}</span>
                    </div>
                )
            },
            {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity'
            }
        ];

        // Format the maintenance resources if the reservation is completed
        const MaintenanceResourcesSummary = () => {
            // Add console logs for debugging
            console.log("MaintenanceResourcesSummary Debug:");
            console.log("isCompleted:", isCompleted);
            console.log("maintenanceResources:", reservationDetails.maintenanceResources);
            console.log("Status History:", reservationDetails.statusHistory);
            
            // Force the component to render for debugging purposes
            // Remove the conditional check temporarily to see if resources display correctly
            const hasResources = Array.isArray(reservationDetails.maintenanceResources) && 
                                reservationDetails.maintenanceResources.length > 0;
            
            console.log("hasResources:", hasResources);
            console.log("Will show summary:", isCompleted && hasResources);
            
            // Restored original condition, but with better logging
            if (!isCompleted) {
                console.log("Not showing maintenance resources summary because reservation is not completed");
                return null;
            }
            
            if (!hasResources) {
                console.log("Not showing maintenance resources summary because no resources available");
                return null;
            }
    
            return (
                <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-orange-50 p-4 border-b border-orange-100">
                        <h3 className="text-lg font-medium text-orange-800 flex items-center gap-2">
                            <ToolOutlined className="text-orange-500" />
                            Reservation Resources Summary: Completed
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
                    </button>,
                    (!isCancelled && !isCompleted) && (
                        <button
                            key="cancel"
                            onClick={handleShowCancelModal}
                            disabled={reservationDetails.active === "0"}
                            className={`px-4 py-2 text-white rounded-lg ml-2 ${
                                reservationDetails.active === "0"
                                    ? 'bg-red-300 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            Cancel Reservation
                        </button>
                    )
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
                                <div className="flex items-center gap-2">
                                </div>
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

                            {/* Add MaintenanceResourcesSummary to Details tab */}
                            <MaintenanceResourcesSummary />
                        </TabPane>

                        <TabPane tab={<span><AppstoreOutlined /> Resources</span>} key="2">
                            <div className="space-y-8">
                                {reservationDetails.venues?.length > 0 && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-purple-50 p-4 border-b border-purple-100">
                                            <h3 className="text-lg font-medium text-purple-800 flex items-center">
                                                <BuildOutlined className="mr-2" /> Venue Information
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <Table 
                                                dataSource={reservationDetails.venues} 
                                                columns={venueColumns}
                                                pagination={false}
                                                rowKey="venue_id"
                                            />
                                        </div>
                                    </div>
                                )}

                                {reservationDetails.equipment?.length > 0 && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-orange-50 p-4 border-b border-orange-100">
                                            <h3 className="text-lg font-medium text-orange-800 flex items-center">
                                                <ToolOutlined className="mr-2" /> Equipment Information
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <Table 
                                                dataSource={reservationDetails.equipment} 
                                                columns={equipmentColumns}
                                                pagination={false}
                                                rowKey="equipment_id"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabPane>

                        <TabPane tab={<span><CalendarOutlined /> Status Log</span>} key="3">
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
                                                            {formatStatusDate(status.updated_at)}
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
                            <MaintenanceResourcesSummary />
                        </TabPane>
                    </Tabs>
                </div>
            </Modal>
        );
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-100 to-white overflow-hidden">
            <div className="flex-none">
                <Sidebar />
            </div>
            <div className="flex-1 overflow-y-auto bg-white bg-opacity-60 mt-20">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-6 lg:p-10"
                >
                    <h2 className="text-4xl font-bold mb-6 text-blue-800 drop-shadow-sm">My Reservations</h2>
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="relative w-full md:w-64 mb-4 md:mb-0"
                            >
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search reservations..."
                                    className="w-full pl-10 pr-4 py-2 rounded-full border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                />
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                            </motion.div>
                            
                            <div className="flex gap-3">
                                {['all', 'confirmed', 'pending', 'cancelled'].map((filter) => (
                                    <motion.button
                                        key={filter}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-4 py-2 rounded-full capitalize ${
                                            activeFilter === filter
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                        } transition duration-300 ease-in-out shadow-sm`}
                                    >
                                        {filter}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex justify-center items-center h-64"
                            >
                                <div className="loader"></div>
                            </motion.div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table 
                                    columns={columns} 
                                    dataSource={filteredReservations}
                                    rowKey="id"
                                    pagination={{
                                        pageSize: pageSize,
                                        showSizeChanger: true,
                                        pageSizeOptions: ['10', '20', '50'],
                                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                        onChange: (page, pageSize) => {
                                            setPageSize(pageSize);
                                        }
                                    }}
                                    scroll={{ x: 1200 }}
                                    bordered
                                    size="middle"
                                    className="reservation-table"
                                    style={{ backgroundColor: 'white' }}
                                    locale={{
                                        emptyText: (
                                            <div className="text-center py-8">
                                                <FaCalendar className="mx-auto text-6xl text-gray-300 mb-4" />
                                                <p className="text-xl text-gray-500">No reservations found</p>
                                            </div>
                                        )
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && (
                <DetailModal 
                    visible={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setCurrentRequest(null);
                        setReservationDetails(null);
                    }}
                    reservationDetails={reservationDetails}
                />
            )}

            {/* Cancel Reservation Modal */}
            {showCancelModal && reservationToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-2xl p-8 w-full max-w-md transform transition-all duration-300 ease-in-out"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Confirm Cancellation</h2>
                            <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <p>Are you sure you want to cancel the reservation "{reservationToCancel.name}"?</p>
                        <div className="flex justify-end mt-6 gap-4">
                            <button 
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                onClick={() => setShowCancelModal(false)}
                            >
                                No, Keep Reservation
                            </button>
                            <button 
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                onClick={confirmCancelReservation}
                            >
                                Yes, Cancel Reservation
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const InfoField = ({ label, value, className, icon }) => (
    <div>
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        </div>
        <p className={`mt-1 ${className || 'text-gray-900'}`}>{value}</p>
    </div>
);

export default ViewReserve;
