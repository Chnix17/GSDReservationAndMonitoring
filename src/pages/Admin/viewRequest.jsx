import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import {FaCar, FaBuilding, FaTools} from 'react-icons/fa';
import { motion } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { Modal,  Tag, Button, Alert, Table, Tooltip, Input, Radio, Space, Empty, Pagination } from 'antd';
import { 
    CarOutlined, 
    BuildOutlined, 
    ToolOutlined,
    UserOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    ReloadOutlined,
    SearchOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { SecureStorage } from '../../utils/encryption';
import AssignModal from './core/Assign_Modal';

const { Search } = Input;

const ReservationRequests = () => {
    const [reservations, setReservations] = useState([]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [isPriorityConflictModalOpen, setIsPriorityConflictModalOpen] = useState(false);
    const [conflictingReservations, setConflictingReservations] = useState([]);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [reservationDetails, setReservationDetails] = useState(null);
    const [filter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [sortField, setSortField] = useState('reservation_created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        declined: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const [declineReason, setDeclineReason] = useState('');
    const [isDeclineReasonModalOpen, setIsDeclineReasonModalOpen] = useState(false);
    const [customReason, setCustomReason] = useState('');

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const declineReasons = [
        { value: 'schedule_conflict', label: 'Schedule Conflict' },
        { value: 'resource_unavailable', label: 'Resource Unavailable' },
        { value: 'invalid_request', label: 'Invalid Request' },
        { value: 'no_driver', label: 'No available driver' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    const updateStats = useCallback((data) => {
        const computed = {
          total:    data.length,
          pending:  data.filter(item => item.active === "0" || item.active == null).length,
          approved: data.filter(item => item.reservation_status === "Approved").length,
          declined: data.filter(item => item.reservation_status === "Declined").length
        };
        setStats(computed);
      }, [setStats]);
    

    // const autoDeclineExpired = async (reservationsList) => {
    //     const now = new Date();
    //     for (const reservation of reservationsList) {
    //         const isExpired = new Date(reservation.reservation_end_date) < now;
    //         const isWaiting = reservation.active === "0" || reservation.active == null;
    //         const isPending = reservation.reservation_status === "Pending";
    //         if (isExpired && isWaiting && isPending) {
    //             try {
    //                 await axios.post(`${encryptedUrl}/process_reservation.php`, {
    //                     operation: 'handleRequest',
    //                     reservation_id: reservation.reservation_id,
    //                     is_accepted: false,
    //                     user_id: SecureStorage.getSessionItem('user_id'),
    //                     notification_message: 'Your reservation request has been automatically declined because it has expired.',
    //                     notification_user_id: reservation.user_id
    //                 }, {
    //                     headers: { 'Content-Type': 'application/json' }
    //                 });
    //             } catch (error) {
    //                 // Optionally log error
    //             }
    //         }
    //     }
    // };

    const fetchReservations = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/user.php`, {
                operation: 'fetchRequestReservation'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data?.status === 'success') {
                // await autoDeclineExpired(response.data.data);
                setReservations(response.data.data);
                updateStats(response.data.data);
            } else {
                toast.error('No pending reservations found.');
            }
        } catch (error) {
        }
    }, [updateStats, encryptedUrl]); 

    const fetchVenueSchedules = async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/user.php`, {
                operation: 'fetchVenueScheduled'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
            if (response.data?.status === 'success') {
                return response.data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching venue schedules:', error);
            return [];
        }
    };

    const fetchReservationDetails = async (reservationId) => {
        if (!reservationId) {
            console.error('No reservation ID provided');
            toast.error('Invalid reservation ID');
            return;
        }
        
        // Reset modal state first
        setIsDetailModalOpen(false);
        setReservationDetails(null);
        setCurrentRequest(null);
        
        setIsLoadingDetails(true);
        try {
            console.log('Fetching reservation details for ID:', reservationId);
            
            const response = await axios.post(`${encryptedUrl}/user.php`, 
                {
                    operation: 'fetchRequestById',  
                    reservation_id: reservationId  
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 second timeout
                }
            );

            if (response.data?.status === 'success' && response.data.data) {
                // Get the reservation details
                const details = response.data.data;
                console.log('Basic reservation details fetched:', details);

                let availabilityData = null;
                let scheduledVenues = [];
                let venuesWithClassSchedule = details.venues || [];

                // Fetch availability data - handle errors gracefully
                try {
                    const availabilityResponse = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                        operation: 'doubleCheckAvailability',
                        start_datetime: details.reservation_start_date,
                        end_datetime: details.reservation_end_date
                    }, {
                        timeout: 10000 // 10 second timeout
                    });
                    
                    if (availabilityResponse.data?.status === 'success') {
                        availabilityData = availabilityResponse.data.data;
                        console.log('Availability data fetched:', availabilityData);
                    }
                } catch (availabilityError) {
                    console.error('Error fetching availability data:', availabilityError);
                    // Continue without availability data
                }

                // Fetch venue schedules for class schedule check - handle errors gracefully
                try {
                    scheduledVenues = await fetchVenueSchedules();
                    console.log('Venue schedules fetched:', scheduledVenues);
                } catch (venueError) {
                    console.error('Error fetching venue schedules:', venueError);
                    // Continue without venue schedules
                }

                // Mark venues that have a class schedule
                try {
                    venuesWithClassSchedule = details.venues?.map(venue => ({
                        ...venue,
                        hasClassSchedule: scheduledVenues.some(sv => sv.ven_id === venue.venue_id)
                    })) || [];
                } catch (mappingError) {
                    console.error('Error mapping venues with class schedule:', mappingError);
                    venuesWithClassSchedule = details.venues || [];
                }

                // If active === "1" and any venue has a class schedule, set a flag for registrar approval required
                const registrarApprovalRequired = details.active === "1" && venuesWithClassSchedule.some(v => v.hasClassSchedule);

                // Combine the details with availability data and class schedule info
                const detailsWithAvailability = {
                    ...details,
                    venues: venuesWithClassSchedule,
                    availabilityData: availabilityData,
                    registrarApprovalRequired
                };

                console.log('Setting reservation details:', detailsWithAvailability);
                setReservationDetails(detailsWithAvailability);
                setCurrentRequest({
                    reservation_id: details.reservation_id,
                    isUnderReview: details.active === "0" || details.active === "1"
                });
                setIsDetailModalOpen(true);
            } else {
                console.error('No data received from fetchRequestById');
                toast.error('No reservation details found');
            }
        } catch (error) {
            console.error('API Error in fetchReservationDetails:', error);
            toast.error('Error fetching reservation details. Please try again.');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);
    
    const handlePriorityCheck = async () => {
        try {
            const checkResponse = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'doubleCheckAvailability',
                start_datetime: reservationDetails.reservation_start_date,
                end_datetime: reservationDetails.reservation_end_date
            });

            if (checkResponse.data?.status === 'success') {
                const data = checkResponse.data.data;
                const conflictingUsers = data.reservation_users || [];
                
                // Check if any of the requested resources are actually in conflict
                const hasVenueConflict = reservationDetails.venues?.some(requestedVenue => 
                    data.unavailable_venues?.some(unavailableVenue => 
                        String(requestedVenue.venue_id) === String(unavailableVenue.ven_id)
                    )
                );

                const hasVehicleConflict = reservationDetails.vehicles?.some(requestedVehicle => 
                    data.unavailable_vehicles?.some(unavailableVehicle => 
                        String(requestedVehicle.vehicle_id) === String(unavailableVehicle.vehicle_id)
                    )
                );

                const hasEquipmentConflict = reservationDetails.equipment?.some(requestedEquipment => 
                    data.unavailable_equipment?.some(unavailableEquipment => 
                        String(requestedEquipment.equipment_id) === String(unavailableEquipment.equip_id)
                    )
                );

                console.log("this is hasVenueConflict", hasVenueConflict);
                console.log("this is hasVehicleConflict", hasVehicleConflict);
                console.log("this is hasEquipmentConflict", hasEquipmentConflict);

                const hasAnyConflict = hasVenueConflict || hasVehicleConflict || hasEquipmentConflict;

                // If no actual conflicts found, return success
                if (!hasAnyConflict) {
                    return { 
                        hasPriority: true, 
                        conflictingUsers: [], 
                        message: '', 
                        needsOverride: false 
                    };
                }

                // If there are conflicts, check priority
                if (hasAnyConflict && conflictingUsers.length > 0) {
                    // Get current user's level and department from reservation details
                    const currentUserLevel = reservationDetails.user_level_name;
                    const currentUserDepartment = reservationDetails.department_name;

                    console.log("This is the current user level and department", currentUserLevel, currentUserDepartment);

                    // Check if user is a Department Head from COO department
                    const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
                    console.log("Can override reservation:", isDepartmentHeadFromCOO);

                    // If user is Department Head from COO, they can override any reservation
                    if (isDepartmentHeadFromCOO) {
                        return {
                            hasPriority: true,
                            conflictingUsers,
                            message: `As Department Head from COO department, you can override any existing reservation.`,
                            needsOverride: true
                        };
                    }

                    // For other users, use the original priority logic
                    const userPriorities = {
                        'COO': 4,
                        'Department Head': 3,
                        'Dean': 2,
                        'Faculty&Staff': 1
                    };

                    const currentPriority = userPriorities[currentUserLevel] || 0;

                    const canOverride = conflictingUsers.every(conflictUser => {
                        const conflictingPriority = userPriorities[conflictUser.user_level_name] || 0;
                        return currentPriority > conflictingPriority;
                    });

                    if (canOverride) {
                        return {
                            hasPriority: true,
                            conflictingUsers,
                            message: `The resources are currently reserved by users with lower priority. As a ${currentUserLevel}, you can bump this reservation.`,
                            needsOverride: true
                        };
                    } else {
                        const highestConflictingLevel = conflictingUsers.reduce((highest, user) => {
                            const priority = userPriorities[user.user_level_name] || 0;
                            return priority > (userPriorities[highest] || 0) ? user.user_level_name : highest;
                        }, '');

                        return { 
                            hasPriority: false, 
                            conflictingUsers,
                            message: `Cannot accept this reservation. The resources are currently reserved by ${highestConflictingLevel} who has equal or higher priority.`
                        };
                    }
                }
                
                // If we have conflicts but no conflicting users (shouldn't happen, but just in case)
                return { hasPriority: true, conflictingUsers: [], message: '', needsOverride: false };
            }
            return { hasPriority: true, conflictingUsers: [], message: '', needsOverride: false };
        } catch (error) {
            console.error('Priority check error:', error);
            throw error;
        }
    };

    const handleAccept = async (vehicleDriverAssignments = {}) => {
        setIsAccepting(true);
        try {
            const priorityCheckResult = await handlePriorityCheck();

            console.log("this is priorityCheckResult", priorityCheckResult);
            
            // If no priority, show error
            if (!priorityCheckResult.hasPriority) {
                Modal.error({
                    title: 'Cannot Accept Reservation',
                    content: priorityCheckResult.message,
                    centered: true,
                });
                setIsAccepting(false);
                return;
            }

            // If there are conflicts, show conflict modal
            if (priorityCheckResult.needsOverride && priorityCheckResult.conflictingUsers.length > 0) {
                setConflictingReservations(priorityCheckResult.conflictingUsers);
                setIsPriorityConflictModalOpen(true);
                setIsAccepting(false);
                return;
            }

            // First, prepare equipment units if equipment exists in reservation details
            if (reservationDetails?.equipment && reservationDetails.equipment.length > 0) {
                try {
                    // Format the data to match backend expectations
                    const equipIds = reservationDetails.equipment.map(eq => parseInt(eq.equipment_id));
                    const quantities = reservationDetails.equipment.map(eq => parseInt(eq.quantity));
                    const startDate = new Date(reservationDetails.reservation_start_date).toISOString().split('T')[0];
                    const endDate = new Date(reservationDetails.reservation_end_date).toISOString().split('T')[0];

                    const insertResponse = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                        operation: 'insertUnits',
                        equip_ids: equipIds,
                        quantities: quantities,
                        reservation_id: parseInt(currentRequest.reservation_id),
                        start_date: startDate,
                        end_date: endDate
                    });

                    if (insertResponse.data?.status !== 'success') {
                        throw new Error('Failed to prepare equipment units');
                    }
                } catch (error) {
                    console.error('Error preparing equipment units:', error);
                    toast.error('Failed to prepare equipment units for reservation');
                    setIsAccepting(false);
                    return;
                }
            }

            // Only proceed with handleRequest if equipment units were successfully inserted (or if no equipment needed)
            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: true,
                user_id: SecureStorage.getSessionItem("user_id"),
                override_lower_priority: false,
                notification_message: "Your Reservation Request Has Been Approved By GSD",
                notification_user_id: reservationDetails.reservation_user_id,
                driver_assignments: vehicleDriverAssignments
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation accepted successfully!', {
                    icon: '✅',
                    duration: 3000,
                });
                await fetchReservations();
                setIsDetailModalOpen(false);
                
                // Show assign personnel modal
                Modal.confirm({
                    title: 'Assign Personnel',
                    content: 'Would you like to assign personnel to this reservation now?',
                    okText: 'Assign Now',
                    cancelText: 'Later',
                    onOk: () => {
                        setIsAssignModalOpen(true);
                    },
                    onCancel: () => {
                        // Do nothing, just close the modal
                    }
                });
            } else {
                toast.error('Failed to accept reservation.');
            }
        } catch (error) {
            toast.error(`Error accepting reservation: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsAccepting(false);
        }
    };

    // Handler for accepting with override
    const handleAcceptWithOverride = async () => {
        setIsAccepting(true);
        try {
            // Process to cancel existing lower priority reservations
            if (reservationDetails.availabilityData?.reservation_users) {
                for (const user of reservationDetails.availabilityData.reservation_users) {
                    try {
                        await axios.post(`${encryptedUrl}/process_reservation.php`, {
                            operation: 'handleCancelReservation',
                            reservation_id: user.reservation_id,
                            user_id: SecureStorage.getSessionItem('user_id')
                        });
                    } catch (cancelError) {
                        console.error('Error canceling reservation:', cancelError);
                        throw new Error('Failed to cancel existing reservations');
                    }
                }
            }

            // Now proceed with the acceptance
            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: true,
                user_id: SecureStorage.getSessionItem("user_id"),
                override_lower_priority: true
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation accepted successfully!', {
                    icon: '✅',
                    duration: 3000,
                });
                await fetchReservations();
                setIsDetailModalOpen(false);
                setIsPriorityConflictModalOpen(false);
            } else {
                toast.error('Failed to accept reservation.');
            }
        } catch (error) {
            toast.error(`Error: ${error.message || 'Failed to process reservation'}`);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        setIsDeclining(true);
        try {
            const finalReason = declineReason === 'other' ? customReason : 
                declineReasons.find(r => r.value === declineReason)?.label || '';

            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: false,
                user_id: SecureStorage.getSessionItem('user_id'),
                notification_message: `Your reservation request has been declined. Reason: ${finalReason}`,
                notification_user_id: reservationDetails.user_id
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation declined successfully!', {
                    icon: '❌',
                    duration: 3000,
                });
                await fetchReservations();
                setIsDeclineReasonModalOpen(false);
                setIsDeclineModalOpen(false);
                setIsDetailModalOpen(false);
                setDeclineReason('');
                setCustomReason('');
            } else {
                toast.error('Failed to decline reservation.');
            }
        } catch (error) {
            console.error('Decline error:', error);
            toast.error('Error declining reservation. Please try again.');
        } finally {
            setIsDeclining(false);
        }
    };

    const getIconForType = (type) => {
        const icons = {
            Equipment: <FaTools className="mr-2 text-orange-500" />,
            Venue: <FaBuilding className="mr-2 text-green-500" />,
            Vehicle: <FaCar className="mr-2 text-blue-500" />,
        };
        return icons[type] || null;
    };



    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Define filteredReservations before it's used in sortedReservations
    const filteredReservations = reservations.filter(reservation => 
        (filter === 'All' || (reservation.type && reservation.type === filter)) &&
        (searchTerm === '' || 
         reservation.reservation_id.toString().includes(searchTerm) || 
         (reservation.reservations_users_id && reservation.reservations_users_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
         (reservation.reservation_title && reservation.reservation_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
         (reservation.requester_name && reservation.requester_name.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        (!startDate || new Date(reservation.reservation_start_date) >= startDate) &&
        (!endDate || new Date(reservation.reservation_end_date) <= endDate)
    );

  

    // Add new fetch functions for different request types
    const fetchPendingRequests = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'fetchRequestReservation'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
    
            if (response.data?.status === 'success') {
                // await autoDeclineExpired(response.data.data);
                const pendingRequests = response.data.data.filter(request => request.active === "0" || request.active == null);
                setReservations(pendingRequests);
                updateStats(response.data.data);
            }
        } catch (error) {
        }
    }, [updateStats, encryptedUrl]);

    const fetchReviewRequests = async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'fetchRequestReservation'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data?.status === 'success') {
                // Filter for active === "1"
                const reviewRequests = response.data.data.filter(request => request.active === "1");
                setReservations(reviewRequests);
                updateStats(response.data.data);
            }
        } catch (error) {
        }
    };

    const fetchHistoryRequests = async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'fetchHistoryRequests'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data?.status === 'success') {
                setReservations(response.data.data);
                updateStats(response.data.data);
            }
        } catch (error) {
            toast.error('Error fetching history');
        }
    };

    // Update tab change handler
    const handleTabChange = (key) => {
        setActiveTab(key);
        setReservations([]);
        setCurrentPage(1);
        switch (key) {
            case '1':
                fetchPendingRequests();
                break;
            case '2':
                fetchReviewRequests();
                break;
            case '3':
                fetchHistoryRequests();
                break;
            default:
                break;
        }
    };


    useEffect(() => {
        fetchPendingRequests();
    }, [fetchPendingRequests]);

    const handleRefresh = () => {
        fetchReservations();
    };


  
    // Add this new Table component
    const RequestTable = ({ data, onView }) => {
        const columns = [
            {
                title: 'Title',
                dataIndex: 'reservation_title',
                key: 'reservation_title',
                sorter: true,
                sortOrder: sortField === 'reservation_title' ? sortOrder : null,
                render: (text, record) => (
                    <div className="flex items-center">
                        {getIconForType(record.type)}
                        <span className="ml-2 font-medium">{text || record.reservation_destination || 'Untitled'}</span>
                    </div>
                ),
            },
            {
                title: 'Description',
                dataIndex: 'reservation_description',
                key: 'reservation_description',
                ellipsis: true,
                width: '20%',
            },
            {
                title: 'Start Date',
                dataIndex: 'reservation_start_date',
                key: 'reservation_start_date',
                sorter: true,
                sortOrder: sortField === 'reservation_start_date' ? sortOrder : null,
                render: (text) => new Date(text).toLocaleString(),
            },
            {
                title: 'End Date',
                dataIndex: 'reservation_end_date',
                key: 'reservation_end_date',
                sorter: true,
                sortOrder: sortField === 'reservation_end_date' ? sortOrder : null,
                render: (text) => new Date(text).toLocaleString(),
            },
            {
                title: 'Requester',
                dataIndex: 'requester_name',
                key: 'requester_name',
                sorter: true,
                sortOrder: sortField === 'requester_name' ? sortOrder : null,
            },
            {
                title: 'Created At',
                dataIndex: 'reservation_created_at',
                key: 'reservation_created_at',
                sorter: true,
                sortOrder: sortField === 'reservation_created_at' ? sortOrder : null,
                render: (text) => new Date(text).toLocaleString(),
            },
            {
                title: 'Status',
                dataIndex: 'reservation_status',
                key: 'reservation_status',
                render: (status, record) => {
                    const isExpired = new Date(record.reservation_end_date) < new Date();
                    return (
                        <Tag color={
                            isExpired ? 'red' :
                            (record.active === "1") ? 'gold' :
                            status === 'Pending' ? 'blue' :
                            status === 'Approved' ? 'green' :
                            status === 'Declined' ? 'red' : 'default'
                        }
                        className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
                        >
                        {isExpired ? "Expired" :
                         (record.active === "1") ? "Final Confirmation" : "Waiting for Approval"}
                        </Tag>
                    );
                },
            },
            {
                title: 'Action',
                key: 'action',
                render: (_, record) => {
                    const isExpired = new Date(record.reservation_end_date) < new Date();
                    return (
                        <Button 
                            type="primary"
                            loading={isLoadingDetails}
                            disabled={isLoadingDetails}
                            onClick={() => {
                                console.log('View button clicked for reservation ID:', record.reservation_id);
                                try {
                                    onView(record.reservation_id);
                                } catch (error) {
                                    console.error('Error in View button click:', error);
                                    toast.error('Error opening reservation details');
                                }
                            }}
                            icon={<EyeOutlined />}
                            className="bg-green-900 hover:bg-lime-900"
                            title={isExpired ? "This reservation has expired" : "View details"}
                        >
                            View
                        </Button>
                    );
                },
            },
        ];

        return (
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className="px-6 py-3"
                                    onClick={() => column.sorter && handleSort(column.dataIndex)}
                                >
                                    <div className="flex items-center cursor-pointer hover:text-gray-900">
                                        {column.title}
                                        {sortField === column.dataIndex && (
                                            <span className="ml-1">
                                                {sortOrder === "asc" ? "↑" : "↓"}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                .map((record) => (
                                    <tr
                                        key={record.reservation_id}
                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                        {columns.map((column) => (
                                            <td
                                                key={`${record.reservation_id}-${column.key}`}
                                                className="px-6 py-4"
                                            >
                                                {column.render
                                                    ? column.render(record[column.dataIndex], record)
                                                    : record[column.dataIndex]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-24 text-center">
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <span className="text-gray-500 dark:text-gray-400">
                                                No reservations found
                                            </span>
                                        }
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={data.length}
                        onChange={(page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        }}
                        showSizeChanger={true}
                        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                        className="flex justify-end"
                    />
                </div>
            </div>
        );
    };


    // Replace the existing card rendering code in the return statement
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <Sidebar />
            <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
                <div className="p-[2.5rem] lg:p-12 min-h-screen">
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <h2 className="text-2xl font-custom-font font-bold text-green-900 mt-5">
                                Reservation Requests
                            </h2>
                        </div>
                    </motion.div>
                    
                    {/* Tabs */}
                    <div className="mb-6">
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="flex">
                                {[
                                    {
                                        key: '1',
                                        label: 'Waiting',
                                        icon: <ClockCircleOutlined />,
                                        count: reservations.filter(r => r.active === "0" || r.active == null).length,
                                        color: 'blue'
                                    },
                                    {
                                        key: '2',
                                        label: 'Final',
                                        icon: <CheckCircleOutlined />,
                                        count: reservations.filter(r => r.active === "1").length,
                                        color: 'amber'
                                    }
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-colors duration-200 ${
                                            activeTab === tab.key
                                                ? 'border-green-600 text-green-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                                        }`}
                                    >
                                        <span className={`text-base ${activeTab === tab.key ? 'text-green-600' : `text-${tab.color}-500`}`}>
                                            {tab.icon}
                                        </span>
                                        <span className="font-medium text-sm">
                                            {tab.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            activeTab === tab.key
                                                ? 'bg-green-100 text-green-600'
                                                : `bg-${tab.color}-50 text-${tab.color}-600`
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Search & Controls */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1">
                                    <Search
                                        placeholder="Search by ID, title, or requester"
                                        allowClear
                                        enterButton={<SearchOutlined />}
                                        size="large"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full"
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

                    <div className="mt-4">
                        <RequestTable 
                            data={filteredReservations}
                            onView={fetchReservationDetails}
                        />
                    </div>

                    {/* Detail Modal for Accepting */}
                    <DetailModal 
                        visible={isDetailModalOpen}
                        onClose={() => {
                            setIsDetailModalOpen(false);
                            setCurrentRequest(null);
                            setReservationDetails(null);
                        }}
                        reservationDetails={reservationDetails}
                        setReservationDetails={setReservationDetails}
                        onAccept={handleAccept}
                        onDecline={() => setIsDeclineModalOpen(true)}
                        isAccepting={isAccepting}
                        isDeclining={isDeclining}
                        setIsDeclineReasonModalOpen={setIsDeclineReasonModalOpen}
                        declineReason={declineReason}
                        setDeclineReason={setDeclineReason}
                    />

                    {/* Decline Reason Modal */}
                    <Modal
                        title="Select Decline Reason"
                        visible={isDeclineReasonModalOpen}
                        onCancel={() => setIsDeclineReasonModalOpen(false)}
                        maskClosable={false}
                        zIndex={1002}
                        footer={[
                            <Button key="back" onClick={() => setIsDeclineReasonModalOpen(false)}>
                                Cancel
                            </Button>,
                            <Button 
                                key="submit" 
                                type="primary" 
                                danger
                                loading={isDeclining}
                                onClick={handleDecline}
                                disabled={!declineReason || (declineReason === 'other' && !customReason)}
                            >
                                Decline
                            </Button>,
                        ]}
                    >
                        <Radio.Group 
                            onChange={(e) => setDeclineReason(e.target.value)} 
                            value={declineReason}
                        >
                            <Space direction="vertical">
                                {declineReasons.map(reason => (
                                    <Radio key={reason.value} value={reason.value}>
                                        {reason.label}
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                        {declineReason === 'other' && (
                            <Input.TextArea 
                                rows={4} 
                                value={customReason} 
                                onChange={(e) => setCustomReason(e.target.value)} 
                                placeholder="Enter custom reason"
                                className="mt-4"
                            />
                        )}
                    </Modal>

                    {/* Priority Conflict Modal */}
                    <PriorityConflictModal
                        visible={isPriorityConflictModalOpen}
                        onClose={() => setIsPriorityConflictModalOpen(false)}
                        conflictingReservations={conflictingReservations}
                        onConfirm={handleAcceptWithOverride}
                    />

                    {/* Assign Personnel Modal */}
                    <AssignModal
                        isOpen={isAssignModalOpen}
                        onClose={() => setIsAssignModalOpen(false)}
                        selectedReservation={{
                            id: currentRequest?.reservation_id,
                            name: reservationDetails?.reservation_title
                        }}
                        onSuccess={() => {
                            setIsAssignModalOpen(false);
                            fetchReservations();
                        }}
                    />

                    {/* Decline Confirmation Modal */}
                    <Modal
                        title="Confirm Decline"
                        visible={isDeclineModalOpen}
                        onCancel={() => setIsDeclineModalOpen(false)}
                        onOk={() => setIsDeclineReasonModalOpen(true)}
                        okText="Continue"
                        cancelText="Cancel"
                    >
                        <p>Are you sure you want to decline this reservation?</p>
                    </Modal>
                </div>
            </div>
        </div>
    );
};

// Add this utility function before the DetailModal component
const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const isSameDay = start.toDateString() === end.toDateString();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (isSameDay) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} ${formatTime(start)} to ${formatTime(end)}`;
    } else {
        return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}\n${formatTime(start)} to ${formatTime(end)}`;
    }
};

const DetailModal = ({ visible, onClose, reservationDetails, setReservationDetails, onAccept, onDecline, isAccepting, isDeclining, setIsDeclineReasonModalOpen, declineReason, setDeclineReason }) => {
    const [tripTicketApproved, setTripTicketApproved] = useState(false);
    const [isCheckingRegistrar, setIsCheckingRegistrar] = useState(false);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [vehicleDriverAssignments, setVehicleDriverAssignments] = useState({});
    const [driverError, setDriverError] = useState("");
    const encryptedUrl = SecureStorage.getLocalItem("url");
    
    // Fetch available drivers when modal opens
    useEffect(() => {
        const fetchDrivers = async () => {
            if (!reservationDetails || !reservationDetails.reservation_start_date || !reservationDetails.reservation_end_date) return;
            try {
                const response = await axios.post(`${encryptedUrl}/user.php`, {
                    operation: 'fetchDriver',
                    startDateTime: reservationDetails.reservation_start_date,
                    endDateTime: reservationDetails.reservation_end_date
                });
                if (response.data?.status === 'success') {
                    setAvailableDrivers(response.data.data);
                } else {
                    setAvailableDrivers([]);
                }
            } catch (error) {
                setAvailableDrivers([]);
            }
        };
        if (visible) {
            fetchDrivers();
            // Initialize assignments from reservationDetails
            if (reservationDetails && reservationDetails.vehicles) {
                const assignments = {};
                (reservationDetails.vehicles || []).forEach(vehicle => {
                    // Try to find assigned driver for this vehicle
                    const assignedDriver = (reservationDetails.drivers || []).find(driver => driver.assigned_vehicle && String(driver.assigned_vehicle.vehicle_id) === String(vehicle.vehicle_id));
                    if (assignedDriver) {
                        assignments[vehicle.vehicle_id] = assignedDriver.driver_id;
                    }
                });
                setVehicleDriverAssignments(assignments);
            }
            // Check for sufficient drivers immediately
            if (reservationDetails && reservationDetails.vehicles && reservationDetails.vehicles.length > 0) {
                setTimeout(() => {
                    // Check if all vehicles already have a driver assigned (from reservationDetails.drivers)
                    const assignedCount = (reservationDetails.vehicles || []).filter(vehicle => {
                        return (reservationDetails.drivers || []).some(driver => driver.assigned_vehicle && String(driver.assigned_vehicle.vehicle_id) === String(vehicle.vehicle_id));
                    }).length;
                    if (assignedCount === reservationDetails.vehicles.length) {
                        setDriverError(""); // All vehicles have drivers, do not block
                    } else if (availableDrivers.length < reservationDetails.vehicles.length) {
                        setDriverError("Not enough available drivers for the requested vehicles. Reservation cannot be approved.");
                    } else {
                        setDriverError("");
                    }
                }, 200); // slight delay to ensure availableDrivers is set
            }
        }
    }, [visible, reservationDetails, encryptedUrl, availableDrivers.length]);

    const fetchReservationDetailsForModal = async (reservationId) => {
        try {
            const response = await axios.post(`${encryptedUrl}/user.php`, 
                {
                    operation: 'fetchRequestById',  
                    reservation_id: reservationId  
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 second timeout
                }
            );

            if (response.data?.status === 'success' && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching reservation details:', error);
            toast.error('Error fetching reservation details');
            return null;
        }
    };
    
    if (!reservationDetails) return null;

    // Add trip ticket verification
    const needsTripTicketApproval = () => {
        if (!reservationDetails.drivers || reservationDetails.drivers.length === 0) return false;
        const driver = reservationDetails.drivers[0];
        
        // Case 1: If driver and name have values but is_accepted_trip is null - No trip ticket required
        if (driver && driver.driver_id && driver.name && driver.is_accepted_trip === null) {
            return false;
        }
        
        // Case 2: If driver and name are null but is_accepted_trip is 0 - Trip ticket required
        if (driver && !driver.driver_id && !driver.name && driver.is_accepted_trip === "0") {
            return true;
        }
        
        // Case 3: If all values are null - No trip ticket required
        if (driver && !driver.driver_id && !driver.name && driver.is_accepted_trip === null) {
            return false;
        }

        // Default case
        return false;
    };

    const hasPendingTripTicket = () => {
        if (!reservationDetails.drivers || reservationDetails.drivers.length === 0) return false;
        const driver = reservationDetails.drivers[0];
        return driver.is_accepted_trip === "0";
    };

    const isTripApproved = () => {
        if (!reservationDetails.drivers || reservationDetails.drivers.length === 0) return false;
        const driver = reservationDetails.drivers[0];
        return driver.is_accepted_trip === "1";
    };

    const handleTripTicketApproval = async () => {
        try {
            const driver = reservationDetails.drivers[0];
            if (!driver || !driver.reservation_driver_id) {
                throw new Error('No driver information found');
            }

            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'updateTripTicket',
                reservation_driver_id: driver.reservation_driver_id
            });

            if (response.data?.status === 'success') {
                toast.success('Trip ticket approved successfully');
                setTripTicketApproved(true);
                const updatedDetails = await fetchReservationDetailsForModal(reservationDetails.reservation_id);
                if (updatedDetails) {
                    setReservationDetails(updatedDetails);
                }
            } else {
                throw new Error(response.data?.message || 'Failed to update trip ticket');
            }
        } catch (error) {
            console.error('Trip ticket update error:', error);
            toast.error(error.message || 'Failed to update trip ticket');
            setTripTicketApproved(false);
        }
    };

    // Add priority checking logic
    const checkPriority = () => {
        // First check if the reservation is expired
        const isExpired = new Date(reservationDetails.reservation_end_date) < new Date();
        if (isExpired) {
            return {
                hasPriority: false,
                message: "This reservation has expired and cannot be approved."
            };
        }

        // First check if there are any actual resource conflicts
        const hasVenueConflict = reservationDetails.venues?.some(requestedVenue => 
            reservationDetails.availabilityData?.unavailable_venues?.some(unavailableVenue => 
                String(requestedVenue.venue_id) === String(unavailableVenue.ven_id)
            )
        );

        const hasVehicleConflict = reservationDetails.vehicles?.some(requestedVehicle => 
            reservationDetails.availabilityData?.unavailable_vehicles?.some(unavailableVehicle => 
                String(requestedVehicle.vehicle_id) === String(unavailableVehicle.vehicle_id)
            )
        );

        const hasEquipmentConflict = reservationDetails.equipment?.some(requestedEquipment => {
            const unavailableEquipment = reservationDetails.availabilityData?.unavailable_equipment?.find(
                e => String(e.equip_id) === String(requestedEquipment.equipment_id)
            );
            
            if (!unavailableEquipment) return false;
            
            const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
            return parseInt(requestedEquipment.quantity) > remainingQuantity;
        });

        const hasAnyResourceConflict = hasVenueConflict || hasVehicleConflict || hasEquipmentConflict;

        // If no resource conflicts, approve immediately
        if (!hasAnyResourceConflict) {
            return { 
                hasPriority: true, 
                message: "No conflicting reservations found." 
            };
        }

        // Get current user's level and department from reservation details
        const currentUserLevel = reservationDetails.user_level_name;
        const currentUserDepartment = reservationDetails.department_name;

        console.log("This is the current user level and department", currentUserLevel, currentUserDepartment);

        // Check if user is a Department Head from COO department
        const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
        console.log("Can override reservation:", isDepartmentHeadFromCOO);

        // If user is Department Head from COO, they can override any reservation
        if (isDepartmentHeadFromCOO) {
            return {
                hasPriority: true,
                message: "As Department Head from COO department, you can override any existing reservation."
            };
        }

        // Check against conflicting reservations
        const hasConflicts = reservationDetails.availabilityData?.reservation_users?.length > 0;
        
        if (!hasConflicts) {
            return { 
                hasPriority: true, 
                message: "No conflicting reservations found." 
            };
        }

        // Remove the department priority check since COO Department Head can override any reservation
        return {
            hasPriority: true,
            message: "You have permission to override this reservation."
        };
    };

    const checkResourceAvailability = (type, id, data) => {
        if (!data) return true;
        
        switch (type) {
            case 'venue':
                return !data.unavailable_venues?.some(v => String(v.ven_id) === String(id));
            case 'vehicle':
                return !data.unavailable_vehicles?.some(v => String(v.vehicle_id) === String(id));
            case 'equipment':
                const unavailableEquipment = data.unavailable_equipment?.find(e => String(e.equip_id) === String(id));
                if (!unavailableEquipment) return true;
                
                // Find the requested equipment quantity from reservationDetails
                const requestedEquipment = reservationDetails.equipment?.find(e => String(e.equipment_id) === String(id));
                if (!requestedEquipment) return true;
                
                // Calculate remaining quantity
                const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
                
                // Check if requested quantity can be accommodated
                return parseInt(requestedEquipment.quantity) <= remainingQuantity;
            case 'driver':
                return !data.unavailable_drivers?.some(d => String(d.driver_id) === String(id));
            default:
                return true;
        }
    };

    // Handler for checking registrar availability
    const handleCheckRegistrarAvailability = async () => {
        setIsCheckingRegistrar(true);
        try {
            const response = await axios.post(`${encryptedUrl}/user.php`, {
                operation: 'handleReview',
                reservationId: reservationDetails.reservation_id,
                userId: SecureStorage.getSessionItem('user_id')
            });

            if (response.data?.status === 'success') {
                // Fetch updated details
                const updatedDetails = await fetchReservationDetailsForModal(reservationDetails.reservation_id);
                if (updatedDetails) {
                    setReservationDetails(updatedDetails);
                }
                toast.success('Registrar has approved the reservation!');
            } else {
                toast.error(response.data?.message || 'Registrar did not approve the reservation.');
            }
        } catch (error) {
            toast.error('Failed to check registrar availability.');
        } finally {
            setIsCheckingRegistrar(false);
        }
    };

    // Handler for driver assignment change
    const handleDriverAssign = (vehicleId, driverId) => {
        setVehicleDriverAssignments(prev => ({ ...prev, [vehicleId]: driverId }));
    };

    // Modified Accept handler to check driver assignments and available drivers
    const handleAcceptWithDriverCheck = async () => {
        setDriverError("");
        // If there are vehicles, check assignments
        if (reservationDetails?.vehicles && reservationDetails.vehicles.length > 0) {
            // Check if enough available drivers for the number of vehicles
            if (availableDrivers.length < reservationDetails.vehicles.length) {
                setDriverError("Not enough available drivers for the requested vehicles. Reservation cannot be approved.");
                return;
            }
            // Check if all vehicles have a driver assigned
            const assignedDrivers = Object.values(vehicleDriverAssignments).filter(Boolean);
            if (assignedDrivers.length < reservationDetails.vehicles.length) {
                setDriverError("Please assign a driver to each vehicle before approving the reservation.");
                return;
            }
            // Insert assigned drivers before approving reservation
            try {
                for (const vehicle of reservationDetails.vehicles) {
                    const driverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    if (driverId) {
                        await axios.post(`${encryptedUrl}/user.php`, {
                            operation: 'insertDriver',
                            reservation_reservation_id: reservationDetails.reservation_id,
                            reservation_driver_user_id: driverId,
                            reservation_vehicle_id: vehicle.reservation_vehicle_id
                        });
                    }
                }
            } catch (error) {
                setDriverError("Failed to assign driver(s). Please try again.");
                return;
            }
        }
        // Call the original onAccept, passing assignments if needed
        if (typeof onAccept === 'function') {
            await onAccept(vehicleDriverAssignments);
        }
    };

    const getModalFooter = () => {
        // If status is Registrar Approval, show waiting message and disable actions
        if (reservationDetails.status_name === "Registrar Approval") {
            return [
                <Button key="waiting" disabled>
                    Waiting For Venue Availability and response to registrar
                </Button>
            ];
        }
        // Custom logic for Venue Approved/Declined
        if (reservationDetails.status_name === "Venue Approved") {
            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDeclineReasonModal();
                }} size="large" icon={<CloseCircleOutlined />}> 
                    Decline
                </Button>,
                <Button 
                    key="accept" 
                    type="primary" 
                    loading={isAccepting} 
                    onClick={handleAcceptWithDriverCheck} 
                    size="large" 
                    icon={<CheckCircleOutlined />} 
                    className="bg-green-900 hover:bg-lime-900"
                >
                    Accept
                </Button>,
            ];
        }
        if (reservationDetails.status_name === "Venue Declined") {
            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDeclineReasonModal();
                }} size="large" icon={<CloseCircleOutlined />}> 
                    Decline
                </Button>
            ];
        }
        if (reservationDetails.active === "0" || reservationDetails.active === "1") {
            const priorityCheck = checkPriority();
            const isDisabled = needsTripTicketApproval() ? !tripTicketApproved : hasPendingTripTicket();
            const isExpired = new Date(reservationDetails.reservation_end_date) < new Date();
            // Disable Accept if registrar approval is required and not yet confirmed
            const registrarApprovalRequired = reservationDetails.registrarApprovalRequired;
            // Placeholder: registrar approval confirmation logic (e.g., reservationDetails.registrarApproved)
            const registrarApproved = reservationDetails.registrarApproved || false;
            if (isExpired) {
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeclineReasonModal();
                    }} size="large" icon={<CloseCircleOutlined />}> 
                        Decline
                    </Button>
                ];
            }
            // If registrar approval required and not yet approved, show Check Availability button
            if (registrarApprovalRequired && !registrarApproved) {
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeclineReasonModal();
                    }} size="large" icon={<CloseCircleOutlined />}> 
                        Decline
                    </Button>,
                    <Button 
                        key="check-registrar" 
                        type="primary" 
                        loading={isCheckingRegistrar} 
                        onClick={handleCheckRegistrarAvailability} 
                        size="large" 
                        icon={<InfoCircleOutlined />} 
                        className="bg-yellow-600 hover:bg-yellow-700"
                    >
                        Check Availability
                    </Button>,
                ];
            }
            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDeclineReasonModal();
                }} size="large" icon={<CloseCircleOutlined />}> 
                    Decline
                </Button>,
                <Button 
                    key="accept" 
                    type="primary" 
                    loading={isAccepting} 
                    onClick={handleAcceptWithDriverCheck} 
                    size="large" 
                    icon={<CheckCircleOutlined />} 
                    disabled={!!driverError || !priorityCheck.hasPriority || isDisabled || (registrarApprovalRequired && !registrarApproved)}
                    className="bg-green-900 hover:bg-lime-900"
                >
                    Accept
                </Button>,
            ];
        }
        return [
            <Button key="close" onClick={onClose} size="large">
                Close
            </Button>
        ];
    };

    // Resource table columns definitions
    const columns = {
        venue: [
            {
                title: 'Venue Name',
                dataIndex: 'venue_name',
                key: 'venue_name',
                render: (text, record) => (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <BuildOutlined className="mr-2 text-purple-500" />
                            <span className="font-medium">{text}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <Tag color={checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                {checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                            </Tag>
                            {record.hasClassSchedule && (
                                <Tag color="orange" className="mt-1">Class Schedule: Registrar Approval Needed</Tag>
                            )}
                        </div>
                    </div>
                )
            }
        ],
        vehicle: [
            {
                title: 'Vehicle',
                dataIndex: 'model',
                key: 'model',
                render: (text, record) => (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <CarOutlined className="mr-2 text-blue-500" />
                            <span className="font-medium">{text}</span>
                        </div>
                        <Tag color={checkResourceAvailability('vehicle', record.vehicle_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                            {checkResourceAvailability('vehicle', record.vehicle_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                        </Tag>
                    </div>
                )
            },
            {
                title: 'License Plate',
                dataIndex: 'license',
                key: 'license',
                render: (text) => <Tag color="blue">{text}</Tag>
            }
            
        ],
        equipment: [
            {
                title: 'Equipment',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <ToolOutlined className="mr-2 text-orange-500" />
                            <span className="font-medium">{text}</span>
                        </div>
                        <Tag color={checkResourceAvailability('equipment', record.equipment_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                            {checkResourceAvailability('equipment', record.equipment_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                        </Tag>
                    </div>
                )
            },
            {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity',
                render: (text) => <Tag color="orange">Qty: {text}</Tag>
            }
        ],
    };

    const priorityCheck = checkPriority();

    // Update vehicle table columns to show dropdown if no driver assigned
    const vehicleColumns = [
        ...columns.vehicle,
        {
            title: 'Driver',
            dataIndex: 'driver',
            key: 'driver',
            render: (_, vehicle) => {
                // Find assigned driver
                const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                const assignedDriver = availableDrivers.find(d => String(d.driver_id) === String(assignedDriverId)) || (reservationDetails.drivers || []).find(driver => driver.assigned_vehicle && String(driver.assigned_vehicle.vehicle_id) === String(vehicle.vehicle_id));
                if (assignedDriver) {
                    return <span>{assignedDriver.driver_full_name || assignedDriver.name}</span>;
                }
                // Exclude drivers already assigned to other vehicles
                const assignedDriverIds = Object.entries(vehicleDriverAssignments)
                    .filter(([vid, did]) => String(vid) !== String(vehicle.vehicle_id))
                    .map(([_, did]) => did)
                    .filter(Boolean);
                const availableForThisVehicle = availableDrivers.filter(driver => !assignedDriverIds.includes(String(driver.driver_id)));
                return (
                    <select
                        value={vehicleDriverAssignments[vehicle.vehicle_id] || ''}
                        onChange={e => handleDriverAssign(vehicle.vehicle_id, e.target.value)}
                    >
                        <option value="">Select Driver</option>
                        {availableForThisVehicle.map(driver => (
                            <option key={driver.driver_id} value={driver.driver_id}>{driver.driver_full_name}</option>
                        ))}
                    </select>
                );
            }
        }
    ];

    // When opening the Decline Reason Modal, pre-select 'no_driver' if driverError is present
    const handleOpenDeclineReasonModal = () => {
        if (driverError) {
            setDeclineReason('no_driver');
        }
        setIsDeclineReasonModalOpen(true);
    };

    return (
        <Modal
            title={null}
            visible={visible}
            onCancel={onClose}
            width={800}
            footer={getModalFooter()}
            className="reservation-detail-modal"
            bodyStyle={{ padding: '0' }}
            maskClosable={false}
            zIndex={1000}
        >
            <div className="p-0">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-green-700 to-lime-500 p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                              
                            </div>
                        </div>
                        <div className="text-white text-right">
                            <p className="text-white opacity-90 text-sm">Created on</p>
                            <p className="font-semibold">{new Date(reservationDetails.reservation_created_at).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    {/* Expired reservation: Only show blocked status in red */}
                    {new Date(reservationDetails.reservation_end_date) < new Date() ? (
                        <Alert
                            message={<span className="font-semibold">Priority Status: Blocked</span>}
                            description={"This reservation has expired and cannot be approved."}
                            type="error"
                            showIcon
                            className="mb-6 border border-red-400 shadow-sm"
                        />
                    ) : (
                        <>
                            {/* Custom messages for Venue Approved/Declined */}
                            {reservationDetails.status_name === "Venue Approved" && (
                                <Alert
                                    message={<span className="font-semibold">Venue Approved</span>}
                                    description="The venue for this reservation has been approved. You may now proceed to approve or decline the reservation."
                                    type="success"
                                    showIcon
                                    className="mb-6 border border-green-200 shadow-sm"
                                />
                            )}
                            {reservationDetails.status_name === "Venue Declined" && (
                                <Alert
                                    message={<span className="font-semibold">Venue Declined</span>}
                                    description="The venue for this reservation has been declined. You may only decline this reservation."
                                    type="error"
                                    showIcon
                                    className="mb-6 border border-red-200 shadow-sm"
                                />
                            )}
                            {/* Show processing message if status is Registrar Approval */}
                            {reservationDetails.status_name === "Registrar Approval" && (
                                <Alert
                                    message={<span className="font-semibold">Processing Venue Availability</span>}
                                    description="This request is currently being processed for venue availability by the registrar. Please wait for the response."
                                    type="info"
                                    showIcon
                                    className="mb-6 border border-blue-200 shadow-sm"
                                />
                            )}

                            {/* Trip Ticket Approval Section - Only show if there are drivers */}
                            {reservationDetails.drivers && reservationDetails.drivers.length > 0 && (
                                <>
                                    {needsTripTicketApproval() && (
                                        <div className="mb-6">
                                            <Alert
                                                message="Trip Ticket Approval Required"
                                                description="This reservation requires trip ticket approval before it can be accepted."
                                                type="info"
                                                showIcon
                                                className="mb-4"
                                            />
                                            <Radio.Group 
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleTripTicketApproval();
                                                    }
                                                }} 
                                                value={tripTicketApproved}
                                            >
                                                <Space direction="vertical">
                                                    <Radio value={true}>Approve Trip Ticket</Radio>
                                                </Space>
                                            </Radio.Group>
                                        </div>
                                    )}

                                    {isTripApproved() && (
                                        <div className="mb-6">
                                            <Alert
                                                message="Trip Ticket Status"
                                                description="Trip ticket has been approved."
                                                type="success"
                                                showIcon
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Priority and Existing Reservations Section - Moved to Top */}
                            {(reservationDetails.active === "0" || reservationDetails.active === "1") && (
                                <div className="mb-6 space-y-4">
                                    {/* Registrar approval warning - only show if not expired */}
                                    {!(new Date(reservationDetails.reservation_end_date) < new Date()) && reservationDetails.registrarApprovalRequired &&
                                        !reservationDetails.registrarApproved &&
                                        reservationDetails.status_name !== "Registrar Approval" &&
                                        reservationDetails.status_name !== "Venue Approved" &&
                                        reservationDetails.status_name !== "Venue Declined" && (
                                        <Alert
                                            message={<span className="font-semibold">Registrar Approval Required</span>}
                                            description={"This reservation includes a venue with a class schedule. Please process with the registrar to check availability before approval."}
                                            type="warning"
                                            showIcon
                                            className="border border-orange-200 shadow-sm"
                                        />
                                    )}
                                    {/* Priority Status Alert */}
                                    <Alert
                                        message={
                                            <span className="font-semibold">
                                                {priorityCheck.hasPriority ? "Priority Status: Approved" : "Priority Status: Blocked"}
                                            </span>
                                        }
                                        description={priorityCheck.message}
                                        type={priorityCheck.hasPriority ? "success" : "warning"}
                                        showIcon
                                        className="border border-gray-200 shadow-sm"
                                    />
                                    {/* Existing Reservations - Only show if there are actual resource conflicts */}
                                    {(() => {
                                        const hasVenueConflict = reservationDetails.venues?.some(requestedVenue => 
                                            reservationDetails.availabilityData?.unavailable_venues?.some(unavailableVenue => 
                                                String(requestedVenue.venue_id) === String(unavailableVenue.ven_id)
                                            )
                                        );
                                        const hasVehicleConflict = reservationDetails.vehicles?.some(requestedVehicle => 
                                            reservationDetails.availabilityData?.unavailable_vehicles?.some(unavailableVehicle => 
                                                String(requestedVehicle.vehicle_id) === String(unavailableVehicle.vehicle_id)
                                            )
                                        );
                                        const hasEquipmentConflict = reservationDetails.equipment?.some(requestedEquipment => {
                                            const unavailableEquipment = reservationDetails.availabilityData?.unavailable_equipment?.find(
                                                e => String(e.equip_id) === String(requestedEquipment.equipment_id)
                                            );
                                            if (!unavailableEquipment) return false;
                                            const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
                                            return parseInt(requestedEquipment.quantity) > remainingQuantity;
                                        });
                                        const hasResourceConflicts = hasVenueConflict || hasVehicleConflict || hasEquipmentConflict;
                                        
                                        return hasResourceConflicts && reservationDetails.availabilityData?.reservation_users?.length > 0 && (
                                            <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                                                <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
                                                    <InfoCircleOutlined className="text-red-600" />
                                                    Existing Reservations
                                                </h2>
                                                
                                                <div className="space-y-4">
                                                    {reservationDetails.availabilityData.reservation_users.map((user, index) => (
                                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-sm text-gray-500">Reserved by: {user.full_name}</p>
                                                                    <p className="text-sm text-gray-500">Department: {user.department_name}</p>
                                                                    <p className="text-sm text-gray-500">Role: {user.user_level_name}</p>
                                                                </div>
                                                                <Tag color="blue">
                                                                    Priority: High
                                                                </Tag>
                                                            </div>

                                                            <div className="mt-3">
                                                                    <h4 className="font-medium text-gray-800">
                                                                        Reservation Title: {user.reservation_title || 'Untitled Reservation'}
                                                                    </h4>
                                                                    <h4>Reservation Description: {user.reservation_description}</h4>
                                                            </div>

                                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Start Time</p>
                                                                        <p className="font-medium">
                                                                            {new Date(user.reservation_start_date).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">End Time</p>
                                                                        <p className="font-medium">
                                                                            {new Date(user.reservation_end_date).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </>
                    )}

                    {/* Current Request Section - Moved Below */}
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                            <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                                <UserOutlined className="text-blue-600" />
                                Current Request Details
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Requester Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                        <UserOutlined className="text-blue-500" />
                                        Requester Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="font-medium">{reservationDetails.requester_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Role</p>
                                            <p className="font-medium">{reservationDetails.user_level_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Department</p>
                                            <p className="font-medium">{reservationDetails.department_name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule and Details */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                        <CalendarOutlined className="text-orange-500" />
                                        Schedule & Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Description</p>
                                            <p className="font-medium">{reservationDetails.reservation_description}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Date & Time</p>
                                            <p className="font-medium">{formatDateRange(
                                                reservationDetails.reservation_start_date,
                                                reservationDetails.reservation_end_date
                                            )}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resources Section */}
                            <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm mt-6">
                                <h3 className="text-lg font-medium mb-4 text-gray-800">Requested Resources</h3>
                                <div className="space-y-4">
                                    {/* Venues */}
                                    {reservationDetails.venues?.length > 0 && (
                                        <Table 
                                            title={() => "Venues"}
                                            dataSource={reservationDetails.venues} 
                                            columns={columns.venue}
                                            pagination={false}
                                            size="small"
                                        />
                                    )}

                                    {/* Vehicles */}
                                    {reservationDetails.vehicles?.length > 0 && (
                                        <Table 
                                            title={() => "Vehicles"}
                                            dataSource={reservationDetails.vehicles.map(vehicle => ({
                                                ...vehicle,
                                                driver: vehicleDriverAssignments[vehicle.vehicle_id] || null
                                            }))} 
                                            columns={vehicleColumns}
                                            pagination={false}
                                            size="small"
                                        />
                                    )}

                                    {/* Equipment */}
                                    {reservationDetails.equipment?.length > 0 && (
                                        <Table 
                                            title={() => "Equipment"}
                                            dataSource={reservationDetails.equipment} 
                                            columns={columns.equipment}
                                            pagination={false}
                                            size="small"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Show driver error if any */}
            {driverError && (
                <Alert
                    message={driverError}
                    type="error"
                    showIcon
                    className="mb-4"
                />
            )}
        </Modal>
    );
};

const PriorityConflictModal = ({ visible, onClose, conflictingReservations, onConfirm }) => {
    const encryptedUrl = SecureStorage.getLocalItem("url");

    const handleCancelAndReserve = async () => {
        try {
            // First cancel the existing reservations
            for (const reservation of conflictingReservations) {
                await axios.post(`${encryptedUrl}/process_reservation.php`, {
                    operation: 'handleCancelReservation',
                    reservation_id: reservation.reservation_id,
                    user_id: SecureStorage.getSessionItem('user_id')
                });
            }
            
            // After cancelling, proceed with the new reservation
            onConfirm();
            toast.success('Successfully cancelled existing reservations and created new reservation.');
        } catch (error) {
            console.error('Error in cancel and reserve process:', error);
            toast.error('Failed to process the request. Please try again.');
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2 text-green-800">
                    <InfoCircleOutlined />
                    <span>Existing Reservation Details</span>
                </div>
            }
            visible={visible}
            onCancel={onClose}
            width={700}
            footer={[
                <Button key="close" onClick={onClose}>
                    Close
                </Button>,
                <Button
                    key="cancelAndReserve"
                    type="primary"
                    danger
                    onClick={handleCancelAndReserve}
                    icon={<CloseCircleOutlined />}
                >
                    Cancel Existing & And Approve This
                </Button>,
            ]}
        >
            <Alert
                message="Warning"
                description="The following reservation is currently using these resources for the requested time slot. You can override this reservation based on priority level."
                type="warning"
                showIcon
                className="mb-4"
            />
            
           
        </Modal>
    );
};

export default ReservationRequests;