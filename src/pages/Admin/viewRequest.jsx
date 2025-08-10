import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import {FaCar, FaBuilding, FaTools} from 'react-icons/fa';
import { motion } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { Modal, Tag, Alert, Table, Tooltip, Input, Radio, Space, Empty, Pagination, Drawer, Button, Spin, Progress } from 'antd';
import {
    CarOutlined,
    BuildOutlined,
    ToolOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    ReloadOutlined,
    SearchOutlined,
    DownOutlined,
    ClockCircleOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { SecureStorage } from '../../utils/encryption';
import AssignModal from './core/Assign_Modal';
// import '../../styles/EnhancedDetailModal.css';

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
        const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    const updateStats = useCallback((data) => {
        const computed = {
          total:    data.length,
          pending:  data.filter(item => item.active === 0 || item.active == null).length,
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

    const fetchVenueSchedules = async (startDateTime, endDateTime) => {
        try {
            const response = await axios.post(`${encryptedUrl}/Department_Dean.php`, {
                operation: 'fetchVenueScheduledCheck',
                startDateTime,
                endDateTime
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
                    scheduledVenues = await fetchVenueSchedules(details.reservation_start_date, details.reservation_end_date);
                    console.log('Venue schedules fetched:', scheduledVenues);
                } catch (venueError) {
                    console.error('Error fetching venue schedules:', venueError);
                    // Continue without venue schedules
                }

                // Mark venues that have a class schedule (conflict)
                try {
                    venuesWithClassSchedule = (details.venues || []).map(venue => {
                        // Find all class schedules for this venue
                        const classSchedules = scheduledVenues.filter(sv => String(sv.ven_id) === String(venue.venue_id));
                        // Check for any overlap by day and time
                        const reservationStart = new Date(details.reservation_start_date);
                        const reservationEnd = new Date(details.reservation_end_date);
                        const reservationDay = reservationStart.toLocaleString('en-US', { weekday: 'long' });
                        // Helper to check time overlap
                        function timeOverlap(start1, end1, start2, end2) {
                            return (start1 < end2 && end1 > start2);
                        }
                        // Check if any class schedule overlaps with reservation
                        const hasClassScheduleConflict = classSchedules.some(cs => {
                            if (cs.day_of_week !== reservationDay) return false;
                            // Parse class schedule times
                            const [csStartHour, csStartMin] = cs.start_time.split(':').map(Number);
                            const [csEndHour, csEndMin] = cs.end_time.split(':').map(Number);
                            // Build Date objects for the reservation day
                            const classStart = new Date(reservationStart);
                            classStart.setHours(csStartHour, csStartMin, 0, 0);
                            const classEnd = new Date(reservationStart);
                            classEnd.setHours(csEndHour, csEndMin, 0, 0);
                            // Compare with reservation times (on the same day)
                            return timeOverlap(reservationStart, reservationEnd, classStart, classEnd);
                        });
                        return {
                            ...venue,
                            isAvailable: !hasClassScheduleConflict
                        };
                    });
                } catch (mappingError) {
                    console.error('Error mapping venues with class schedule:', mappingError);
                    venuesWithClassSchedule = (details.venues || []).map(v => ({ ...v, isAvailable: true }));
                }

                // Combine the details with availability data and class schedule info
                const detailsWithAvailability = {
                    ...details,
                    venues: venuesWithClassSchedule,
                    availabilityData: availabilityData
                };

                console.log('Setting reservation details:', detailsWithAvailability);
                setReservationDetails(detailsWithAvailability);
                setCurrentRequest({
                    reservation_id: details.reservation_id,
                    isUnderReview: details.active === 0 || details.active === 1
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
                user_id: SecureStorage.getLocalItem("user_id"),
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
                
                // Check if this was an admin approval (first approval in sequence)
                const adminApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending Admin Approval');
                const departmentApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending Department Approval');
                
                if (adminApproval && departmentApproval && adminApproval.reservation_active === 0) {
                    // This was admin approval, refresh reservation details instead of closing modal
                    await fetchReservationDetails(currentRequest.reservation_id);
                } else {
                    // This was department approval, close modal and fetch reservations
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
                }
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
                            user_id: SecureStorage.getLocalItem('user_id')
                        });
                    } catch (cancelError) {
                        console.error('Error canceling reservation:', cancelError);
                        throw new Error('Failed to cancel existing reservations');
                    }
                }
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

            // Now proceed with the acceptance
            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: true,
                user_id: SecureStorage.getLocalItem("user_id"),
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

            // Use user_id or reservation_user_id as fallback
            const notificationUserId = reservationDetails.user_id || reservationDetails.reservation_user_id;
            console.log('Declining reservation:', {
                reservation_id: currentRequest.reservation_id,
                notification_user_id: notificationUserId,
                reservationDetails
            });

            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: false,
                user_id: SecureStorage.getLocalItem('user_id'),
                notification_message: `Your reservation request has been declined. Reason: ${finalReason}`,
                notification_user_id: notificationUserId
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
                const pendingRequests = response.data.data.filter(request => request.active === 0 || request.active == null);
                setReservations(pendingRequests);
                updateStats(response.data.data);
            }
        } catch (error) {
        }
    }, [updateStats, encryptedUrl]);






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
                        <span className="ml-2 font-medium truncate block max-w-[140px]">{text || record.reservation_destination || 'Untitled'}</span>
                    </div>
                ),
            },
            {
                title: 'Description',
                dataIndex: 'reservation_description',
                key: 'reservation_description',
                ellipsis: true,
                render: (text) => (
                    <span className="truncate block max-w-[200px]" title={text}>
                        {text}
                    </span>
                ),
            },
            {
                title: 'Start Date',
                dataIndex: 'reservation_start_date',
                key: 'reservation_start_date',
                sorter: true,
                sortOrder: sortField === 'reservation_start_date' ? sortOrder : null,
                render: (text) => {
                    const date = new Date(text);
                    return (
                        <span className="whitespace-nowrap">
                            {date.toLocaleDateString()} {formatTime(text)}
                        </span>
                    );
                },
            },
            {
                title: 'End Date',
                dataIndex: 'reservation_end_date',
                key: 'reservation_end_date',
                sorter: true,
                sortOrder: sortField === 'reservation_end_date' ? sortOrder : null,
                render: (text) => {
                    const date = new Date(text);
                    return (
                        <span className="whitespace-nowrap">
                            {date.toLocaleDateString()} {formatTime(text)}
                        </span>
                    );
                },
            },
            {
                title: 'Requester',
                dataIndex: 'requester_name',
                key: 'requester_name',
                sorter: true,
                sortOrder: sortField === 'requester_name' ? sortOrder : null,
                render: (text) => (
                    <span className="truncate block max-w-[120px]" title={text}>
                        {text}
                    </span>
                ),
            },
            {
                title: 'Created At',
                dataIndex: 'reservation_created_at',
                key: 'reservation_created_at',
                sorter: true,
                sortOrder: sortField === 'reservation_created_at' ? sortOrder : null,
                render: (text) => (
                    <span className="whitespace-nowrap">
                        {new Date(text).toLocaleDateString()}
                    </span>
                ),
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
                            (record.active === 1) ? 'gold' :
                            status === 'Pending' ? 'blue' :
                            status === 'Approved' ? 'green' :
                            status === 'Declined' ? 'red' : 'default'
                        }
                        className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center whitespace-nowrap"
                        >
                        {isExpired ? "Expired" :
                         (record.active === 1) ? "Final Confirmation" : "Pending Department Approval"}
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
                        <div className="flex justify-center space-x-2">
                            <Tooltip title={isExpired ? "This reservation has expired" : "View details"}>
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
                                    size="large"
                                >
                                    <span className="hidden sm:inline">View</span>
                                    <span className="sm:hidden">View</span>
                                </Button>
                            </Tooltip>
                        </div>
                    );
                },
            },
        ];

        return (
            <>
                <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                    <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className="px-4 py-4"
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
                                        className="bg-white border-b last:border-b-0 border-gray-200 hover:bg-gray-50"
                                    >
                                        {columns.map((column) => (
                                            <td
                                                key={`${record.reservation_id}-${column.key}`}
                                                className="px-4 py-6"
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
                                <td colSpan={columns.length} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
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
            </>
        );
    };


    // Replace the existing card rendering code in the return statement
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            {/* Fixed Sidebar */}
            <div className="flex-none">
                <Sidebar />
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 sm:mb-8"
                    >
                        <div className="mb-2 sm:mb-4 mt-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-5">
                                Reservation Requests
                            </h2>
                        </div>
                    </motion.div>
                    
                    {/* Search & Controls */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-row items-center gap-2 w-full">
                            <div className="flex-grow">
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
                            <Tooltip title="Refresh data">
                                <Button 
                                    icon={<ReloadOutlined />} 
                                    onClick={handleRefresh}
                                    size="large"
                                    style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                />
                            </Tooltip>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100" style={{ minWidth: '100%' }}>
                            <RequestTable 
                                data={filteredReservations}
                                onView={fetchReservationDetails}
                            />
                        </div>
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
// Utility function to format time as '8am' or '10:30pm'
function formatTime(dateInput) {
    const date = new Date(dateInput);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'P.M.' : 'A.M.';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    // If minutes are zero, omit them
    let strTime = minutes === 0
        ? `${hours}${ampm}`
        : `${hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
    return strTime;
}

const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const isSameDay = start.toDateString() === end.toDateString();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (isSameDay) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} ${formatTime(start)} to ${formatTime(end)}`;
    } else {
        return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}\n${formatTime(start)} to ${formatTime(end)}`;
    }
};

const DetailModal = ({ visible, onClose, reservationDetails, setReservationDetails, onAccept, onDecline, isAccepting, isDeclining, setIsDeclineReasonModalOpen, declineReason, setDeclineReason }) => {
    const [deansApproval, setDeansApproval] = useState([]);
    const [isApproverListVisible, setIsApproverListVisible] = useState(false);
        const [isLoadingDeans, setIsLoadingDeans] = useState(false);

    const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
    const adminApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending Admin Approval');
    const departmentApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending Department Approval');
    const encryptedUrl = SecureStorage.getLocalItem("url");

    useEffect(() => {
        const fetchDeansApproval = async () => {
            if (!visible || !reservationDetails?.reservation_id) {
                setDeansApproval([]);
                return;
            }

            setIsLoadingDeans(true);
            try {
                const response = await axios.post(`${encryptedUrl}/user.php`, {
                    operation: 'fetchDeansApproval',
                    reservation_id: reservationDetails.reservation_id
                });
                if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                    setDeansApproval(response.data.data);
                } else {
                    setDeansApproval([]);
                }
            } catch (error) {
                console.error('Error fetching deans approval:', error);
                setDeansApproval([]);
            } finally {
                setIsLoadingDeans(false);
            }
        };

        fetchDeansApproval();

        return () => {
            if (!visible) {
                setDeansApproval([]);
                setIsApproverListVisible(false);
            }
        };
    }, [visible, reservationDetails, encryptedUrl]);
    
    // Count the number of approved deans
    const approvedDeans = deansApproval.filter(approval => approval.is_approved === 1 || approval.is_approved === '1');
    const approvedDeansCount = approvedDeans.length;
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [vehicleDriverAssignments, setVehicleDriverAssignments] = useState({});
    const [driverError, setDriverError] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({
        venues: false,
        vehicles: false,
        equipment: false
    });


    // Mobile detection for modal
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Toggle section collapse
    const toggleSection = (section) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    
    // Fetch available drivers when modal opens
    useEffect(() => {
        setDriverError(""); // Reset driver error when modal opens or reservation changes
        const fetchDrivers = async () => {
            if (!reservationDetails || !reservationDetails.reservation_start_date || !reservationDetails.reservation_end_date) return;
            try {
                const response = await axios.post(`${encryptedUrl}/user.php`, {
                    operation: 'fetchDriver',
                    startDateTime: reservationDetails.reservation_start_date,
                    endDateTime: reservationDetails.reservation_end_date
                });
                if (response.data?.status === 'success') {
                    setAvailableDrivers(
                        response.data.data.map(driver => ({
                            ...driver,
                            full_name: [
                                driver.users_fname,
                                driver.users_mname ? driver.users_mname : '',
                                driver.users_lname
                            ].filter(Boolean).join(' ')
                        }))
                    );
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
                    const assignedDriver = (reservationDetails.drivers || []).find(driver => 
                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                    );
                    if (assignedDriver && assignedDriver.driver_id) {
                        assignments[vehicle.vehicle_id] = assignedDriver.driver_id;
                    }
                });
                setVehicleDriverAssignments(assignments);
            }
            // Check for sufficient drivers immediately
            if (reservationDetails && reservationDetails.vehicles && reservationDetails.vehicles.length > 0) {
                setTimeout(() => {
                    // Check if all vehicles already have a driver assigned with a name (from reservationDetails.drivers)
                    const vehiclesWithExistingDrivers = (reservationDetails.vehicles || []).filter(vehicle => {
                        return (reservationDetails.drivers || []).some(driver => 
                            driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) && driver.driver_name
                        );
                    });
                    
                    // If all vehicles have existing drivers with names, no need for validation
                    if (vehiclesWithExistingDrivers.length === reservationDetails.vehicles.length) {
                        setDriverError(""); // All vehicles have drivers, do not block
                    } else {
                        // Check if there are enough available drivers for the remaining vehicles
                        const vehiclesNeedingDrivers = reservationDetails.vehicles.length - vehiclesWithExistingDrivers.length;
                        if (availableDrivers.length < vehiclesNeedingDrivers) {
                            setDriverError("Not enough available drivers for the requested vehicles. Reservation cannot be approved.");
                        } else {
                            setDriverError("");
                        }
                    }
                }, 200); // slight delay to ensure availableDrivers is set
            }
        }
    }, [visible, reservationDetails, encryptedUrl, availableDrivers.length]);

    // const fetchReservationDetailsForModal = async (reservationId) => {
    //     try {
    //         const response = await axios.post(`${encryptedUrl}/user.php`, 
    //             {
    //                 operation: 'fetchRequestById',  
    //                 reservation_id: reservationId  
    //             },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 timeout: 10000 // 10 second timeout
    //             }
    //         );

    //         if (response.data?.status === 'success' && response.data.data) {
    //             return response.data.data;
    //         }
    //         return null;
    //     } catch (error) {
    //         console.error('Error fetching reservation details:', error);
    //         toast.error('Error fetching reservation details');
    //         return null;
    //     }
    // };
    
    if (!reservationDetails) return null;



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

    // Handler for driver assignment change
    const handleDriverAssign = (vehicleId, driverId) => {
        setVehicleDriverAssignments(prev => ({ ...prev, [vehicleId]: driverId }));
    };

    // Modified Accept handler to check driver assignments and available drivers
    const handleAcceptWithDriverCheck = async () => {
        setDriverError("");
        // If there are vehicles, check assignments
        if (reservationDetails?.vehicles && reservationDetails.vehicles.length > 0) {
            // Check if all vehicles have a driver assigned (either existing or new assignment)
            const vehiclesWithoutDrivers = reservationDetails.vehicles.filter(vehicle => {
                // Check if there's an existing driver assignment with a name
                const existingDriver = (reservationDetails.drivers || []).find(driver => 
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) && driver.driver_name
                );
                
                // Check if there's a new assignment in the current session
                const newAssignment = vehicleDriverAssignments[vehicle.vehicle_id];
                
                // Vehicle needs a driver if there's no existing assignment with name and no new assignment
                return !existingDriver && !newAssignment;
            });
            
            if (vehiclesWithoutDrivers.length > 0) {
                setDriverError("Please assign a driver to each vehicle before approving the reservation.");
                return;
            }
            
            // Insert new driver assignments before approving reservation (only for vehicles that don't have existing drivers)
            try {
                for (const vehicle of reservationDetails.vehicles) {
                    const existingDriver = (reservationDetails.drivers || []).find(driver => 
                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) && driver.driver_name
                    );
                    
                    // Only insert if there's no existing driver with name and there's a new assignment
                    if (!existingDriver) {
                        const driverId = vehicleDriverAssignments[vehicle.vehicle_id];
                        if (driverId) {
                            await axios.post(`${encryptedUrl}/user.php`, {
                                operation: 'insertDriver',
                                reservation_driver_user_id: driverId,
                                reservation_vehicle_id: vehicle.reservation_vehicle_id
                            });
                        }
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
        if (!reservationDetails) {
            return [<Button key="close" onClick={onClose} size="large">Close</Button>];
        }

        const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);

        const adminApproval = reservationDetails.status_history?.find(
            status => status.status_name === 'Pending Admin Approval'
        );
        const departmentApproval = reservationDetails.status_history?.find(
            status => status.status_name === 'Pending Department Approval'
        );

        const priorityCheck = checkPriority();
        const isExpired = new Date(reservationDetails.reservation_end_date) < new Date();
        const anyVenueNotAvailable = reservationDetails.venues && reservationDetails.venues.some(v => v.isAvailable === false);

        // Base case for expired requests
        if (isExpired) {
            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                    Decline
                </Button>
            ];
        }

        // Sequential Approval Logic
        if (adminApproval && departmentApproval) {
            const isAdminApprover = adminApproval.reservation_users_id === currentUserId;
            const isDepartmentApprover = departmentApproval.reservation_users_id === currentUserId;

            // Admin's turn to approve
            if (adminApproval.reservation_active === 0) {
                if (isAdminApprover) {
                    return [
                        <Button
                            key="accept"
                            type="primary"
                            loading={isAccepting}
                            onClick={handleAcceptWithDriverCheck}
                            size="large"
                            icon={<CheckCircleOutlined />}
                            disabled={!!driverError || !priorityCheck.hasPriority || anyVenueNotAvailable}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            Approve
                        </Button>,
                    ];
                } else {
                    return [<Button key="waiting_admin" disabled>Waiting for Admin Approval</Button>];
                }
            }

            // Department's turn to approve
            if (adminApproval.reservation_active === 1 && departmentApproval.reservation_active === 0) {
                if (isDepartmentApprover) {
                    return [
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <Button
                            key="accept"
                            type="primary"
                            loading={isAccepting}
                            onClick={handleAcceptWithDriverCheck}
                            size="large"
                            icon={<CheckCircleOutlined />}
                            disabled={!!driverError || !priorityCheck.hasPriority || anyVenueNotAvailable}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            Approve
                        </Button>,
                    ];
                } else {
                    return [<Button key="waiting_dept" disabled>Waiting for Department Approval</Button>];
                }
            }
        }

        // Fallback for other statuses or if the above logic doesn't apply
        if (reservationDetails.active === 0 || reservationDetails.active === 1) {
            const bothApprovalsActive = adminApproval?.reservation_active === 1 && departmentApproval?.reservation_active === 1;
            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                    Decline
                </Button>,
                <Button
                    key="accept"
                    type="primary"
                    loading={isAccepting}
                    onClick={handleAcceptWithDriverCheck}
                    size="large"
                    icon={<CheckCircleOutlined />}
                    disabled={!bothApprovalsActive || !!driverError || !priorityCheck.hasPriority || anyVenueNotAvailable}
                    className="bg-green-900 hover:bg-lime-900"
                >
                    Approve
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
                            <Tag color={record.isAvailable ? 'green' : 'red'}>
                                {record.isAvailable ? 'Available' : 'Not Available'}
                            </Tag>
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
                // First check if there's already a driver assigned to this vehicle from reservation details
                const existingDriver = (reservationDetails.drivers || []).find(driver => 
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                );
                
                // If there's an existing driver with a name, display it
                if (existingDriver && existingDriver.driver_name) {
                    return <span className="font-medium text-green-600">{existingDriver.driver_name}</span>;
                }
                
                // If there's an existing driver but no name, try to find from available drivers
                if (existingDriver && existingDriver.driver_id) {
                    const assignedDriver = availableDrivers.find(d => String(d.users_id) === String(existingDriver.driver_id));
                    if (assignedDriver) {
                        return <span className="font-medium text-green-600">{assignedDriver.full_name}</span>;
                    }
                }
                
                // Check if there's a manual assignment in the current session
                const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                const assignedDriver = availableDrivers.find(d => String(d.users_id) === String(assignedDriverId));
                if (assignedDriver) {
                    return <span className="font-medium text-blue-600">{assignedDriver.full_name}</span>;
                }
                
                // If no driver is assigned, show dropdown for assignment
                // Exclude drivers already assigned to other vehicles
                const assignedDriverIds = Object.entries(vehicleDriverAssignments)
                    .filter(([vid, did]) => String(vid) !== String(vehicle.vehicle_id))
                    .map(([_, did]) => did)
                    .filter(Boolean);
                const availableForThisVehicle = availableDrivers.filter(driver => !assignedDriverIds.includes(String(driver.users_id)));
                
                return (
                    <select
                        value={vehicleDriverAssignments[vehicle.vehicle_id] || ''}
                        onChange={e => handleDriverAssign(vehicle.vehicle_id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                        <option value="">Select Driver</option>
                        {availableForThisVehicle.map(driver => (
                            <option key={driver.users_id} value={driver.users_id}>
                                {driver.full_name}
                            </option>
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

    // Mobile-optimized resource card component
    const MobileResourceCard = ({ resource, type, isAvailable }) => (
        <div className={`mobile-resource-card ${!isAvailable ? 'unavailable' : ''}`}>
            <div className="resource-card-header">
                <div className="resource-icon-name">
                    {type === 'venue' && <BuildOutlined className="resource-icon venue-icon" />}
                    {type === 'vehicle' && <CarOutlined className="resource-icon vehicle-icon" />}
                    {type === 'equipment' && <ToolOutlined className="resource-icon equipment-icon" />}
                    <span className="resource-name">{resource.venue_name || resource.model || resource.name}</span>
                </div>
                <Tag color={isAvailable ? 'green' : 'red'} className="availability-tag">
                    {isAvailable ? 'Available' : 'Not Available'}
                </Tag>
            </div>
            <div className="resource-card-details">
                {type === 'vehicle' && resource.license && (
                    <div className="resource-detail">
                        <span className="detail-label">License:</span>
                        <Tag color="blue">{resource.license}</Tag>
                    </div>
                )}
                {type === 'equipment' && resource.quantity && (
                    <div className="resource-detail">
                        <span className="detail-label">Quantity:</span>
                        <Tag color="orange">Qty: {resource.quantity}</Tag>
                    </div>
                )}
                {type === 'vehicle' && (
                    <div className="resource-detail driver-assignment">
                        <span className="detail-label">Driver:</span>
                        {(() => {
                            const existingDriver = (reservationDetails.drivers || []).find(driver =>
                                driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(resource.reservation_vehicle_id)
                            );
                            
                            if (existingDriver && existingDriver.driver_name) {
                                return <span className="assigned-driver">{existingDriver.driver_name}</span>;
                            }
                            
                            const assignedDriverId = vehicleDriverAssignments[resource.vehicle_id];
                            const assignedDriver = availableDrivers.find(d => String(d.users_id) === String(assignedDriverId));
                            if (assignedDriver) {
                                return <span className="assigned-driver new">{assignedDriver.full_name}</span>;
                            }
                            
                            const assignedDriverIds = Object.entries(vehicleDriverAssignments)
                                .filter(([vid, did]) => String(vid) !== String(resource.vehicle_id))
                                .map(([_, did]) => did)
                                .filter(Boolean);
                            const availableForThisVehicle = availableDrivers.filter(driver => !assignedDriverIds.includes(String(driver.users_id)));
                            
                            return (
                                <select
                                    value={vehicleDriverAssignments[resource.vehicle_id] || ''}
                                    onChange={e => handleDriverAssign(resource.vehicle_id, e.target.value)}
                                    className="mobile-driver-select"
                                >
                                    <option value="">Select Driver</option>
                                    {availableForThisVehicle.map(driver => (
                                        <option key={driver.users_id} value={driver.users_id}>
                                            {driver.full_name}
                                        </option>
                                    ))}
                                </select>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );

    // Collapsible resource section component
    const CollapsibleResourceSection = ({ title, icon, resources, type, count }) => {
        const sectionKey = type;
        const isCollapsed = collapsedSections[sectionKey];
        
        return (
            <div className="collapsible-resource-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection(sectionKey)}
                >
                    <div className="section-title-wrapper">
                        {icon}
                        <span className="section-title">{title} ({count})</span>
                    </div>
                    <DownOutlined className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`} />
                </div>
                {!isCollapsed && (
                    <div className="section-content">
                        {isMobile ? (
                            <div className="mobile-resource-grid">
                                {resources.map((resource, index) => (
                                    <MobileResourceCard
                                        key={index}
                                        resource={resource}
                                        type={type}
                                        isAvailable={
                                            type === 'venue' ? resource.isAvailable :
                                            checkResourceAvailability(type, resource.venue_id || resource.vehicle_id || resource.equipment_id, reservationDetails.availabilityData)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <Table
                                dataSource={type === 'vehicle' ? resources.map(vehicle => ({
                                    ...vehicle,
                                    driver: vehicleDriverAssignments[vehicle.vehicle_id] || null
                                })) : resources}
                                columns={type === 'vehicle' ? vehicleColumns : columns[type]}
                                pagination={false}
                                size="small"
                                className="border border-gray-200 rounded-lg"
                            />
                        )}
                    </div>
                )}
            </div>
        );
    };



    // Determine if any venue is not available due to class schedule
    const anyVenueNotAvailable = reservationDetails.venues && reservationDetails.venues.some(v => v.isAvailable === false);

    // Mobile modal component
    if (isMobile) {
        return (
            <Drawer
                title={null}
                placement="bottom"
                onClose={onClose}
                visible={visible}
                height="100vh"
                className="mobile-detail-drawer enhanced-detail-modal"
                bodyStyle={{ padding: 0 }}
                headerStyle={{ display: 'none' }}
                maskClosable={false}
                zIndex={1000}
            >
                {/* Mobile Header */}
                <div className="mobile-modal-header">
                    <div className="mobile-header-content">
                        <div className="header-left">
                            <div className="header-icon">
                                <UserOutlined />
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <h2 className="text-xl font-bold text-gray-800">Reservation Details</h2>
                            </div>
                            <p className="header-subtitle">ID: {reservationDetails.reservation_id}</p>
                        </div>
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={onClose}
                            className="mobile-close-btn"
                        />
                    </div>
                </div>

                {/* Mobile Content - Single View */}
                <div className="mobile-modal-content">
                    <div className="tab-content-wrapper">
                        {/* Status Section */}
                        <div className="content-section">
                            <div className="section-header-simple">
                                <h3 className="section-title-simple">Status & Priority</h3>
                            </div>
                            <div className="status-section">
                                {new Date(reservationDetails.reservation_end_date) < new Date() ? (
                                    <Alert
                                        message={<span className="font-semibold">Priority Status: Blocked</span>}
                                        description="This reservation has expired and cannot be approved."
                                        type="error"
                                        showIcon
                                        className="status-alert"
                                    />
                                ) : (
                                    <>
                                        {reservationDetails.status_name === "Venue Approved" && (
                                            <Alert
                                                message={<span className="font-semibold">Venue Approved</span>}
                                                description="The venue for this reservation has been approved. You may now proceed to approve or decline the reservation."
                                                type="success"
                                                showIcon
                                                className="status-alert"
                                            />
                                        )}
                                        {reservationDetails.status_name === "Venue Declined" && (
                                            <Alert
                                                message={<span className="font-semibold">Venue Declined</span>}
                                                description="The venue for this reservation has been declined. You may only decline this reservation."
                                                type="error"
                                                showIcon
                                                className="status-alert"
                                            />
                                        )}
                                        {reservationDetails.status_name === "Registrar Approval" && (
                                            <Alert
                                                message={<span className="font-semibold">Processing Venue Availability</span>}
                                                description="This request is currently being processed for venue availability by the registrar. Please wait for the response."
                                                type="info"
                                                showIcon
                                                className="status-alert"
                                            />
                                        )}
                                        {(reservationDetails.active === 0 || reservationDetails.active === 1) && (
                                            <Alert
                                                message={
                                                    <span className="font-semibold">
                                                        {anyVenueNotAvailable ? "Priority Status: Blocked" : (priorityCheck.hasPriority ? "Priority Status: Approved" : "Priority Status: Blocked")}
                                                    </span>
                                                }
                                                description={anyVenueNotAvailable ? 'One or more venues are not available due to scheduled classes.' : priorityCheck.message}
                                                type={anyVenueNotAvailable ? "warning" : (priorityCheck.hasPriority ? "success" : "warning")}
                                                showIcon
                                                className="status-alert"
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Request Details Section */}
                        <div className="content-section">
                            <div className="section-header-simple">
                                <h3 className="section-title-simple">Request Information</h3>
                            </div>
                            <div className="info-grid mobile-info-grid">
                                <div className="info-group">
                                    <div className="info-item">
                                        <span className="info-label">Requester</span>
                                        <span className="info-value">{reservationDetails.requester_name}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Role</span>
                                        <span className="info-value">{reservationDetails.user_level_name}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Department</span>
                                        <span className="info-value">{reservationDetails.department_name}</span>
                                    </div>
                                </div>
                                <div className="info-group">
                                    <div className="info-item">
                                        <span className="info-label">Title</span>
                                        <span className="info-value">{reservationDetails.reservation_title}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Description</span>
                                        <span className="info-value">{reservationDetails.reservation_description}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Schedule</span>
                                        <span className="info-value">{formatDateRange(
                                            reservationDetails.reservation_start_date,
                                            reservationDetails.reservation_end_date
                                        )}</span>
                                    </div>
                                </div>
                            </div>
                            {reservationDetails.additional_note && (
                                <div className="additional-note-section">
                                    <span className="info-label">Additional Note</span>
                                    <div className="additional-note-content">
                                        {reservationDetails.additional_note}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resources Section */}
                        <div className="content-section">
                            <div className="section-header-simple">
                                <h3 className="section-title-simple">Requested Resources</h3>
                            </div>
                            <div className="resources-section">
                                {reservationDetails.venues?.length > 0 && (
                                    <CollapsibleResourceSection
                                        title="Venues"
                                        icon={<BuildOutlined className="section-icon venue-icon" />}
                                        resources={reservationDetails.venues}
                                        type="venue"
                                        count={reservationDetails.venues.length}
                                    />
                                )}
                                {reservationDetails.vehicles?.length > 0 && (
                                    <CollapsibleResourceSection
                                        title="Vehicles"
                                        icon={<CarOutlined className="section-icon vehicle-icon" />}
                                        resources={reservationDetails.vehicles}
                                        type="vehicle"
                                        count={reservationDetails.vehicles.length}
                                    />
                                )}
                                {reservationDetails.equipment?.length > 0 && (
                                    <CollapsibleResourceSection
                                        title="Equipment"
                                        icon={<ToolOutlined className="section-icon equipment-icon" />}
                                        resources={reservationDetails.equipment}
                                        type="equipment"
                                        count={reservationDetails.equipment.length}
                                    />
                                )}
                            </div>
                        </div>


                    </div>
                </div>

                {/* Mobile Footer */}
                <div className="mobile-modal-footer">
                    {getModalFooter()}
                </div>

                {/* Driver Error Alert */}
                {driverError && (
                    <div className="mobile-error-alert">
                        <Alert
                            message={driverError}
                            type="error"
                            showIcon
                            className="driver-error-alert"
                        />
                    </div>
                )}
            </Drawer>
        );
    }

    // Desktop modal (enhanced)
    return (
        <Modal
            title={null}
            visible={visible}
            onCancel={onClose}
            width="95%"
            style={{ maxWidth: 900 }}
            footer={getModalFooter()}
            className="reservation-detail-modal enhanced-detail-modal"
            bodyStyle={{ padding: '0' }}
            maskClosable={false}
            zIndex={1000}
        >
            {/* Enhanced Header Section */}
            <div className="bg-gradient-to-r from-green-700 to-lime-500 p-4 sm:p-6 rounded-t-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <UserOutlined className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="text-white text-lg sm:text-xl font-bold">
                                Reservation Details
                            </h1>
                            <p className="text-white/90 text-sm">
                                ID: {reservationDetails.reservation_id}
                            </p>
                        </div>
                    </div>
                    <div className="text-white text-right">
                        <p className="text-white/80 text-xs sm:text-sm">Created on</p>
                        <p className="font-semibold text-sm sm:text-base">
                            {new Date(reservationDetails.reservation_created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Enhanced Main Content */}
            <div className="p-4 sm:p-6 space-y-6">
                {/* Status Alerts Section */}
                {new Date(reservationDetails.reservation_end_date) < new Date() ? (
                    <Alert
                        message={<span className="font-semibold">Priority Status: Blocked</span>}
                        description="This reservation has expired and cannot be approved."
                        type="error"
                        showIcon
                        className="border border-red-400 shadow-sm"
                    />
                ) : (
                    <>
                        {/* Status-specific alerts */}
                        {reservationDetails.status_name === "Venue Approved" && (
                            <Alert
                                message={<span className="font-semibold">Venue Approved</span>}
                                description="The venue for this reservation has been approved. You may now proceed to approve or decline the reservation."
                                type="success"
                                showIcon
                                className="border border-green-200 shadow-sm"
                            />
                        )}
                        {reservationDetails.status_name === "Venue Declined" && (
                            <Alert
                                message={<span className="font-semibold">Venue Declined</span>}
                                description="The venue for this reservation has been declined. You may only decline this reservation."
                                type="error"
                                showIcon
                                className="border border-red-200 shadow-sm"
                            />
                        )}
                        {reservationDetails.status_name === "Registrar Approval" && (
                            <Alert
                                message={<span className="font-semibold">Processing Venue Availability</span>}
                                description="This request is currently being processed for venue availability by the registrar. Please wait for the response."
                                type="info"
                                showIcon
                                className="border border-blue-200 shadow-sm"
                            />
                        )}



                        {/* Priority Status Section */}
                        {(reservationDetails.active === 0 || reservationDetails.active === 1) && (
                            <div className="space-y-4">
                                <Alert
                                    message={
                                        <span className="font-semibold">
                                            {anyVenueNotAvailable ? "Priority Status: Blocked" : (priorityCheck.hasPriority ? "Priority Status: Approved" : "Priority Status: Blocked")}
                                        </span>
                                    }
                                    description={anyVenueNotAvailable ? 'One or more venues are not available due to scheduled classes.' : priorityCheck.message}
                                    type={anyVenueNotAvailable ? "warning" : (priorityCheck.hasPriority ? "success" : "warning")}
                                    showIcon
                                    className="border border-blue-200 shadow-sm"
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
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                                                <InfoCircleOutlined className="text-red-600" />
                                                Existing Reservations
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                {reservationDetails.availabilityData.reservation_users.map((user, index) => (
                                                    <div key={index} className="bg-white p-3 rounded-lg border border-red-100">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-600">Reserved by: <span className="font-medium">{user.full_name}</span></p>
                                                                <p className="text-sm text-gray-600">Department: <span className="font-medium">{user.department_name}</span></p>
                                                                <p className="text-sm text-gray-600">Role: <span className="font-medium">{user.user_level_name}</span></p>
                                                            </div>
                                                            <Tag color="blue" className="shrink-0">
                                                                Priority: High
                                                            </Tag>
                                                        </div>

                                                        <div className="mt-3 space-y-2">
                                                            <h4 className="font-medium text-gray-800">
                                                                {user.reservation_title || 'Untitled Reservation'}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">{user.reservation_description}</p>
                                                        </div>

                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Start Time</p>
                                                                    <p className="font-medium text-sm">
                                                                        {new Date(user.reservation_start_date).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">End Time</p>
                                                                    <p className="font-medium text-sm">
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

                {/* Enhanced Request Details Section */}
                <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
                    <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                        <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                            <UserOutlined className="text-blue-600" />
                            Request Details
                        </h2>
                    </div>
                    
                    <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Requester Information */}
                            <div className="space-y-4">
                                <h3 className="text-md font-semibold text-gray-800 border-b border-blue-200 pb-2">
                                    Requester Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Name</p>
                                        <p className="font-medium text-gray-900">{reservationDetails.requester_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Role</p>
                                        <p className="font-medium text-gray-900">{reservationDetails.user_level_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Department</p>
                                        <p className="font-medium text-gray-900">{reservationDetails.department_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-green-700 mb-1">Additional Note</p>
                                        <p className="font-medium bg-yellow-50 text-green-900 rounded px-3 py-2 border border-yellow-200">
                                         <p className="font-medium text-gray-900">{reservationDetails.additional_note}</p>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule and Details */}
                            <div className="space-y-4">
                                <h3 className="text-md font-semibold text-gray-800 border-b border-blue-200 pb-2">
                                    Reservation Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Title</p>
                                        <p className="font-medium text-gray-900">{reservationDetails.reservation_title}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Description</p>
                                        <p className="font-medium text-gray-900">{reservationDetails.reservation_description}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                                        <p className="font-medium text-gray-900">{formatDateRange(
                                            reservationDetails.reservation_start_date,
                                            reservationDetails.reservation_end_date
                                        )}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resources Section */}
                        <div className="mt-6 pt-6 border-t border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Requested Resources</h3>
                            <div className="space-y-4">
                                {/* Venues */}
                                {reservationDetails.venues?.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <BuildOutlined className="text-purple-500" />
                                            Venues ({reservationDetails.venues.length})
                                        </h4>
                                        <Table 
                                            dataSource={reservationDetails.venues} 
                                            columns={columns.venue}
                                            pagination={false}
                                            size="small"
                                            className="border border-blue-200 rounded-lg"
                                        />
                                    </div>
                                )}

                                {/* Vehicles */}
                                {reservationDetails.vehicles?.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <CarOutlined className="text-blue-500" />
                                            Vehicles ({reservationDetails.vehicles.length})
                                        </h4>
                                        <Table 
                                            dataSource={reservationDetails.vehicles.map(vehicle => ({
                                                ...vehicle,
                                                driver: vehicleDriverAssignments[vehicle.vehicle_id] || null
                                            }))} 
                                            columns={vehicleColumns}
                                            pagination={false}
                                            size="small"
                                            className="border border-blue-200 rounded-lg"
                                        />
                                    </div>
                                )}

                                {/* Equipment */}
                                {reservationDetails.equipment?.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <ToolOutlined className="text-orange-500" />
                                            Equipment ({reservationDetails.equipment.length})
                                        </h4>
                                        <Table 
                                            dataSource={reservationDetails.equipment} 
                                            columns={columns.equipment}
                                            pagination={false}
                                            size="small"
                                            className="border border-blue-200 rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dean Approval Progress Section */}
                        {(isLoadingDeans || deansApproval.length > 0) && (
                            <div className="mt-6 px-4 sm:px-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Department Approval Progress</h3>
                                {isLoadingDeans ? (
                                    <div className="flex items-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                                        <Spin size="small" className="mr-2" />
                                        <span>Loading Approvals...</span>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg border border-gray-200">
                                        <div 
                                            onClick={() => setIsApproverListVisible(!isApproverListVisible)} 
                                            className="flex items-center justify-between cursor-pointer p-4"
                                        >
                                            <div className="flex-grow pr-4">
                                                <Progress 
                                                    percent={deansApproval.length > 0 ? (approvedDeansCount / deansApproval.length) * 100 : 0}
                                                    format={() => `${approvedDeansCount} / ${deansApproval.length} Approved`}
                                                    strokeColor={{ from: '#108ee9', to: '#87d068' }}
                                                    trailColor="rgba(0, 0, 0, 0.06)"
                                                />
                                            </div>
                                            <DownOutlined 
                                                className={`text-gray-600 transition-transform duration-300 ${isApproverListVisible ? 'rotate-180' : ''}`}
                                            />
                                        </div>

                                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isApproverListVisible ? 'max-h-96' : 'max-h-0'}`}>
                                            <div className="border-t border-gray-200 p-4">
                                                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                    {deansApproval.map(dean => (
                                                        <li key={dean.approval_id} className="p-3 bg-white rounded-md border flex items-center justify-between shadow-sm">
                                                            <div className="flex items-center">
                                                                {dean.is_approved === 1 || dean.is_approved === '1' ? (
                                                                    <CheckCircleOutlined className="text-green-500 mr-3 text-lg" />
                                                                ) : (
                                                                    <ClockCircleOutlined className="text-yellow-500 mr-3 text-lg" />
                                                                )}
                                                                <div>
                                                                    <div className="font-medium text-gray-800">{dean.user_name}</div>
                                                                    <div className="text-xs text-gray-500">{dean.department_name}</div>
                                                                </div>
                                                            </div>
                                                            <Tag color={dean.is_approved === 1 || dean.is_approved === '1' ? 'green' : 'gold'}>
                                                                {dean.is_approved === 1 || dean.is_approved === '1' ? 'Approved' : 'Pending'}
                                                            </Tag>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Final Approval Progress Section */}
                        {adminApproval && departmentApproval && (
                            <div className="mt-6 px-4 sm:px-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Final Approval Progress</h3>
                                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4">
                                    {/* Admin Approval */}
                                    <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-300 shadow-sm">
                                        <div className="flex items-center">
                                            {adminApproval.reservation_active === 1 ? (
                                                <CheckCircleOutlined className="text-green-500 text-xl mr-3" />
                                            ) : (
                                                <ClockCircleOutlined className="text-blue-500 text-xl mr-3" />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-800">Pending Admin Approval</div>
                                                <div className="text-sm text-gray-600">
                                                    Approver: {adminApproval.updated_by_name}
                                                    {adminApproval.reservation_users_id === currentUserId && (
                                                        <Tag color="blue" className="ml-2">You</Tag>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Tag 
                                            color={adminApproval.reservation_active === 1 ? 'green' : 'blue'}
                                            className="font-medium"
                                        >
                                            {adminApproval.reservation_active === 1 ? 'Approved' : 'Pending'}
                                        </Tag>
                                    </div>

                                    {/* Department Approval */}
                                    <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-300 shadow-sm">
                                        <div className="flex items-center">
                                            {departmentApproval.reservation_active === 1 ? (
                                                <CheckCircleOutlined className="text-green-500 text-xl mr-3" />
                                            ) : (
                                                <ClockCircleOutlined 
                                                    className={`text-xl mr-3 ${adminApproval.reservation_active === 1 ? 'text-blue-500' : 'text-gray-400'}`} 
                                                />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-800">Pending Department Approval</div>
                                                <div className="text-sm text-gray-600">
                                                    Approver: {departmentApproval.updated_by_name}
                                                    {departmentApproval.reservation_users_id === currentUserId && (
                                                        <Tag color="blue" className="ml-2">You</Tag>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Tag 
                                            color={departmentApproval.reservation_active === 1 ? 'green' : (adminApproval.reservation_active === 1 ? 'blue' : 'default')}
                                            className="font-medium"
                                        >
                                            {departmentApproval.reservation_active === 1 ? 'Approved' : (adminApproval.reservation_active === 1 ? 'Pending' : 'Waiting for Admin')}
                                        </Tag>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Driver Error Alert */}
            {driverError && (
                <div className="px-4 sm:px-6 pb-4">
                    <Alert
                        message={driverError}
                        type="error"
                        showIcon
                        className="border border-red-300"
                    />
                </div>
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
                    user_id: SecureStorage.getLocalItem('user_id')
                });
                // Send notification to the cancelled reservation's requester
                await axios.post(`${encryptedUrl}/user.php`, {
                    operation: 'insertNotificationTouser',
                    notification_message: 'Your reservation has been cancelled due to a higher-priority override.',
                    notification_user_id: reservation.user_id,
                    reservation_id: reservation.reservation_id
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
                    <span className="hidden sm:inline">Cancel Existing & Approve This</span>
                    <span className="sm:hidden">Override</span>
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
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {conflictingReservations.map(res => (
                    <div key={res.reservation_id} className="border p-4 rounded-lg mb-4">
                        <p><strong>Requester:</strong> {res.user_name}</p>
                        <p><strong>Purpose:</strong> {res.title}</p>
                        <p><strong>Schedule:</strong> {formatDateRange(res.reservation_start_date, res.reservation_end_date)}</p>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default ReservationRequests;