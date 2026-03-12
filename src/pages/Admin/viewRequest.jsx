import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/core/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import {FaCar, FaBuilding, FaTools, FaQuestionCircle} from 'react-icons/fa';
import { motion } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/mobile-modal.css';
import { useNavigate } from 'react-router-dom';
import { Modal, Tag, Alert, Table, Tooltip, Input, Empty, Pagination, Button, Spin, Progress, Drawer, Card, Typography } from 'antd';
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
    ScheduleOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { SecureStorage } from '../../utils/encryption';
import AssignModal from './core/Assign_Modal';
import AssignOptionModal from './core/AssignOptionModal';
import RescheduleModal from './core/reschedule_modal';

const { Search } = Input;
const { Text } = Typography;

const ReservationRequests = () => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    
    const [reservations, setReservations] = useState([]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [isPriorityConflictModalOpen, setIsPriorityConflictModalOpen] = useState(false);
    const [conflictingReservations, setConflictingReservations] = useState([]);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isRescheduleErrorModalOpen, setIsRescheduleErrorModalOpen] = useState(false);
    const [rescheduleErrorMessage, setRescheduleErrorMessage] = useState('');
    const [isRescheduleDecisionModalOpen, setIsRescheduleDecisionModalOpen] = useState(false);
    const [rescheduleDecisionAction, setRescheduleDecisionAction] = useState(null);
    const [rescheduleDecisionReason, setRescheduleDecisionReason] = useState('');
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
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
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
    const navigate = useNavigate();
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const [declineReason, setDeclineReason] = useState('');
    const [isDeclineReasonModalOpen, setIsDeclineReasonModalOpen] = useState(false);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAssignOptionModalOpen, setIsAssignOptionModalOpen] = useState(false);
    const [loadingReservationId, setLoadingReservationId] = useState(null);

    useEffect(() => {
        const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/');
        }
    }, [navigate]);

    // Helper function to handle reschedule errors and refresh data
    async function handleRescheduleError(errorResponse, reservationId = null, closeRescheduleModal = null) {
        // Prevent multiple error modals from opening
        if (isRescheduleErrorModalOpen) {
            return;
        }
        
        const message = errorResponse?.data?.message || 'Failed to update reservation dates';
        
        // Close the reschedule modal first if callback provided
        if (closeRescheduleModal && typeof closeRescheduleModal === 'function') {
            closeRescheduleModal();
        }
        
        setRescheduleErrorMessage(message);
        setIsRescheduleErrorModalOpen(true);
        
        // Refresh data after showing error
        if (reservationId) {
            // Refresh the specific reservation details
            await fetchReservationDetails(reservationId);
        }
        // Also refresh the main reservations list
        await fetchReservations();
    }

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
            const response = await axios.post(`${encryptedUrl}reservation.php`, {
                operation: 'fetchRequestReservation'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data?.status === 'success') {
                // await autoDeclineExpired(response.data.data);
                setReservations(response.data.data);
              
            } else {
                toast.error('No pending reservations found.');
            }
        } catch (error) {
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            }
        }
    }, [encryptedUrl]); 

    const fetchVenueSchedules = useCallback(async (startDateTime, endDateTime) => {
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
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            }
            return [];
        }
    }, [encryptedUrl]);

    const handleProcessed = useCallback(async (reservationId) => {
        try {
            const userId = SecureStorage.getLocalItem('user_id');
            
            if (!userId) {
                return { status: 'error', message: 'User session expired' };
            }

            console.log("Processing reservation:", reservationId);

            const response = await axios.post(`${encryptedUrl}reservation.php`, {
                operation: 'handleProcessed',
                reservation_id: reservationId,
                user_id: userId
            });

            const result = response.data;
            console.log("Process API Response:", result);

            if (result.status === 'success') {
                toast.success(result.message || 'Reservation processed successfully!');
                // Refresh the reservations list to show updated status
                fetchReservations();
                return { status: 'success', message: result.message };
            } else {
                return { status: 'error', message: result.message || 'Failed to process reservation' };
            }
        } catch (error) {
            console.error('Error processing reservation:', error);
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            }
            return { status: 'error', message: 'Failed to process reservation' };
        }
    }, [encryptedUrl, fetchReservations]);

    const fetchReservationDetails = useCallback(async (reservationId) => {
        if (!reservationId) {
            console.error('No reservation ID provided');
            toast.error('Invalid reservation ID');
            return;
        }
        
        // Reset modal state first
        setIsDetailModalOpen(false);
        setReservationDetails(null);
        setCurrentRequest(null);
        
        setLoadingReservationId(reservationId);
        try {
            console.log('Fetching reservation details for ID:', reservationId);
            
            // First, handle processing if needed
            const processResult = await handleProcessed(reservationId);
            
            // Check if processing failed with a final state error
            if (processResult.status === 'error') {
                setLoadingReservationId(null);
                setErrorMessage(processResult.message);
                setIsErrorModalOpen(true);
                return;
            }
            
            const response = await axios.post(`${encryptedUrl}reservation.php`, 
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
                    // Prefer reschedule dates when present or when status is Change Request
                    const hasRescheduleDates = !!(details.reschedule_start_date && details.reschedule_end_date);
                    const isChangeRequest = details.status_name === "Change Request";
                    const startDateTime = (hasRescheduleDates || isChangeRequest) && details.reschedule_start_date
                        ? details.reschedule_start_date
                        : details.reservation_start_date;
                    const endDateTime = (hasRescheduleDates || isChangeRequest) && details.reschedule_end_date
                        ? details.reschedule_end_date
                        : details.reservation_end_date;

                    const availabilityResponse = await axios.post(`${encryptedUrl}reservation.php`, {
                        operation: 'doubleCheckAvailability',
                        start_datetime: startDateTime,
                        end_datetime: endDateTime,
                        reservation_id: reservationId
                    }, {
                        timeout: 10000 // 10 second timeout
                    });
                    
                    if (availabilityResponse.data?.status === 'success') {
                        availabilityData = availabilityResponse.data.data;
                        console.log('Availability data fetched:', availabilityData);
                    }
                } catch (availabilityError) {
                    console.error('Error fetching availability data:', availabilityError);
                    if (!availabilityError.response) {
                        toast.error('Network error: Unable to connect to server. Please check your internet connection.');
                    }
                    // Continue without availability data
                }

                // Fetch venue schedules for class schedule check - handle errors gracefully
                try {
                    // Prefer reschedule dates when present or when status is Change Request
                    const hasRescheduleDates = !!(details.reschedule_start_date && details.reschedule_end_date);
                    const isChangeRequest = details.status_name === "Change Request";
                    const startDateTime = (hasRescheduleDates || isChangeRequest) && details.reschedule_start_date
                        ? details.reschedule_start_date
                        : details.reservation_start_date;
                    const endDateTime = (hasRescheduleDates || isChangeRequest) && details.reschedule_end_date
                        ? details.reschedule_end_date
                        : details.reservation_end_date;

                    scheduledVenues = await fetchVenueSchedules(startDateTime, endDateTime);
                    console.log('Venue schedules fetched:', scheduledVenues);
                } catch (venueError) {
                    console.error('Error fetching venue schedules:', venueError);
                    if (!venueError.response) {
                        toast.error('Network error: Unable to connect to server. Please check your internet connection.');
                    }
                    // Continue without venue schedules
                }

                // Mark venues that have a class schedule (conflict)
                try {
                    venuesWithClassSchedule = (details.venues || []).map(venue => {
                        // Find all class schedules for this venue
                        const classSchedules = scheduledVenues.filter(sv => String(sv.ven_id) === String(venue.venue_id));
                        
                        console.log(`\n========================================`);
                        console.log(`[Class Schedule Check] Venue: ${venue.venue_name} (ID: ${venue.venue_id})`);
                        console.log(`[Class Schedule Check] Found ${classSchedules.length} class schedule(s) for this venue`);
                        
                        // Check for any overlap by day and time
                        // Prefer reschedule dates when present or when status is Change Request
                        const hasRescheduleDates = !!(details.reschedule_start_date && details.reschedule_end_date);
                        const isChangeRequest = details.status_name === "Change Request";
                        const startDateTime = (hasRescheduleDates || isChangeRequest) && details.reschedule_start_date
                            ? details.reschedule_start_date
                            : details.reservation_start_date;
                        const endDateTime = (hasRescheduleDates || isChangeRequest) && details.reschedule_end_date
                            ? details.reschedule_end_date
                            : details.reservation_end_date;
                        
                        const reservationStart = new Date(startDateTime);
                        const reservationEnd = new Date(endDateTime);
                        
                        console.log(`[Class Schedule Check] Reservation Period: ${reservationStart.toLocaleString()} - ${reservationEnd.toLocaleString()}`);
                        
                        // Helper to check time overlap
                        function timeOverlap(start1, end1, start2, end2) {
                            return (start1 < end2 && end1 > start2);
                        }
                        
                        // Track conflicting schedules for detailed reporting
                        const conflictingSchedules = [];
                        
                        // Check if any class schedule overlaps with reservation
                        const hasClassScheduleConflict = classSchedules.some(cs => {
                            // Get all days in the reservation period
                            const reservationDays = [];
                            const currentDate = new Date(reservationStart);
                            
                            while (currentDate <= reservationEnd) {
                                reservationDays.push({
                                    date: new Date(currentDate),
                                    dayName: currentDate.toLocaleString('en-US', { weekday: 'long' })
                                });
                                currentDate.setDate(currentDate.getDate() + 1);
                            }
                            
                            console.log(`\n  → Checking schedule: ${cs.day_of_week} ${cs.start_time}-${cs.end_time} (${cs.section_name})`);
                            
                            // Check if any reservation day matches the class schedule day and has time overlap
                            const hasConflict = reservationDays.some(resDay => {
                                if (cs.day_of_week !== resDay.dayName) return false;
                                
                                console.log(`    ✓ Day match found: ${resDay.dayName} ${resDay.date.toLocaleDateString()}`);
                                
                                // Parse class schedule times
                                const [csStartHour, csStartMin] = cs.start_time.split(':').map(Number);
                                const [csEndHour, csEndMin] = cs.end_time.split(':').map(Number);
                                
                                // Build class schedule time for this specific day
                                const classStart = new Date(resDay.date);
                                classStart.setHours(csStartHour, csStartMin, 0, 0);
                                const classEnd = new Date(resDay.date);
                                classEnd.setHours(csEndHour, csEndMin, 0, 0);
                                
                                // Build reservation time boundaries for this specific day
                                const dayStart = new Date(resDay.date);
                                dayStart.setHours(0, 0, 0, 0);
                                const dayEnd = new Date(resDay.date);
                                dayEnd.setHours(23, 59, 59, 999);
                                
                                // Get actual reservation time boundaries for this day
                                const actualReservationStart = new Date(Math.max(reservationStart.getTime(), dayStart.getTime()));
                                const actualReservationEnd = new Date(Math.min(reservationEnd.getTime(), dayEnd.getTime()));
                                
                                // Check time overlap between class schedule and reservation on this day
                                const hasOverlap = timeOverlap(actualReservationStart, actualReservationEnd, classStart, classEnd);
                                
                                console.log(`    Time overlap check:`);
                                console.log(`      Reservation: ${actualReservationStart.toLocaleTimeString()} - ${actualReservationEnd.toLocaleTimeString()}`);
                                console.log(`      Class:       ${classStart.toLocaleTimeString()} - ${classEnd.toLocaleTimeString()}`);
                                console.log(`      Result: ${hasOverlap ? '❌ CONFLICT DETECTED' : '✓ No conflict'}`);
                                
                                if (hasOverlap) {
                                    // Helper function to format time to 12-hour with AM/PM
                                    const formatTime = (timeStr) => {
                                        const [hours, minutes] = timeStr.split(':').map(Number);
                                        const period = hours >= 12 ? 'PM' : 'AM';
                                        const hour12 = hours % 12 || 12;
                                        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
                                    };
                                    
                                    conflictingSchedules.push({
                                        day: resDay.dayName,
                                        date: resDay.date.toLocaleDateString(),
                                        section: cs.section_name,
                                        time: `${formatTime(cs.start_time)} - ${formatTime(cs.end_time)}`,
                                        semester: cs.semester_name,
                                        schoolYear: cs.school_year_name
                                    });
                                }
                                
                                return hasOverlap;
                            });
                            
                            if (!hasConflict) {
                                console.log(`    ✓ No conflict with this schedule`);
                            }
                            
                            return hasConflict;
                        });
                        
                        // Also check for resource conflicts from availability data
                        const hasResourceConflict = availabilityData?.unavailable_venues?.some(unavailableVenue => 
                            String(unavailableVenue.ven_id) === String(venue.venue_id)
                        ) || false;
                        
                        console.log(`\n[Result] ${venue.venue_name}:`);
                        console.log(`  - Class Schedule Conflict: ${hasClassScheduleConflict ? '❌ YES' : '✓ NO'}`);
                        console.log(`  - Resource Conflict: ${hasResourceConflict ? '❌ YES' : '✓ NO'}`);
                        console.log(`  - Available: ${!hasClassScheduleConflict && !hasResourceConflict ? '✓ YES' : '❌ NO'}`);
                        
                        if (conflictingSchedules.length > 0) {
                            console.log(`\n  ⚠️ CONFLICTING SCHEDULES (${conflictingSchedules.length}):`);
                            conflictingSchedules.forEach((conflict, idx) => {
                                console.log(`    ${idx + 1}. ${conflict.day} ${conflict.date} | ${conflict.time} | ${conflict.section} | ${conflict.semester} ${conflict.schoolYear}`);
                            });
                        }
                        console.log(`========================================\n`);
                        
                        return {
                            ...venue,
                            isAvailable: !hasClassScheduleConflict && !hasResourceConflict,
                            hasClassScheduleConflict,
                            hasResourceConflict,
                            conflictingSchedules // Store the details for potential UI display
                        };
                    });
                } catch (mappingError) {
                    console.error('Error mapping venues with class schedule:', mappingError);
                    if (!mappingError.response) {
                        toast.error('Network error: Unable to connect to server. Please check your internet connection.');
                    }
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
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            } else {
                toast.error('Error fetching reservation details. Please try again.');
            }
        } finally {
            setLoadingReservationId(null);
        }
    }, [encryptedUrl, handleProcessed, fetchVenueSchedules]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    // Listen for push notification refresh messages from service worker
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            console.log('[ViewRequest] Received message from service worker:', event.data);
            
            if (event.data && event.data.type === 'REFRESH_DATA') {
                console.log('[ViewRequest] Refreshing reservation data due to push notification');
                
                // Show a toast notification about the refresh
                toast.info('New reservation request received. Refreshing data...', {
                    icon: '🔄',
                    duration: 2000,
                });
                
                // Refresh the reservations list
                fetchReservations();
                
                // If detail modal is open, refresh the modal data without closing it
                if (isDetailModalOpen && currentRequest?.reservation_id) {
                    console.log('[ViewRequest] Refreshing modal data for reservation:', currentRequest.reservation_id);
                    fetchReservationDetails(currentRequest.reservation_id);
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
    }, [fetchReservations, fetchReservationDetails, isDetailModalOpen, currentRequest]);
    
    const handlePriorityCheck = async (reservationId) => {
        try {
            // Prefer reschedule dates when present or when status is Change Request
            const hasRescheduleDates = !!(reservationDetails?.reschedule_start_date && reservationDetails?.reschedule_end_date);
            const isChangeRequest = reservationDetails?.status_name === "Change Request";
            const startDateTime = (hasRescheduleDates || isChangeRequest) && reservationDetails?.reschedule_start_date
                ? reservationDetails.reschedule_start_date
                : reservationDetails?.reservation_start_date;
            const endDateTime = (hasRescheduleDates || isChangeRequest) && reservationDetails?.reschedule_end_date
                ? reservationDetails.reschedule_end_date
                : reservationDetails?.reservation_end_date;

            const checkResponse = await axios.post(`${encryptedUrl}reservation.php`, {
                operation: 'doubleCheckAvailability',
                start_datetime: startDateTime,
                end_datetime: endDateTime,
                reservation_id: reservationId
            });

            if (checkResponse.data?.status === 'success') {
                const data = checkResponse.data.data;
                const conflictingUsers = data.reservation_users || [];
                
                // Check if any of the requested resources are actually in conflict
                const hasVenueConflict = reservationDetails?.venues?.some(requestedVenue => 
                    data.unavailable_venues?.some(unavailableVenue => 
                        String(requestedVenue.venue_id) === String(unavailableVenue.ven_id)
                    )
                );

                const hasVehicleConflict = reservationDetails?.vehicles?.some(requestedVehicle => 
                    data.unavailable_vehicles?.some(unavailableVehicle => 
                        String(requestedVehicle.vehicle_id) === String(unavailableVehicle.vehicle_id)
                    )
                );

                const hasEquipmentConflict = reservationDetails?.equipment?.some(requestedEquipment => {
                    const unavailableEquipment = data.unavailable_equipment?.find(
                        e => String(e.equip_id) === String(requestedEquipment.equipment_id)
                    );
                    
                    if (!unavailableEquipment) return false;
                    
                    const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
                    return parseInt(requestedEquipment.quantity) > remainingQuantity;
                });

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
                    const currentUserLevel = reservationDetails?.user_level_name || '';
                    const currentUserDepartment = reservationDetails?.department_name || '';

                    console.log("This is the current user level and department", currentUserLevel, currentUserDepartment);

                    // Check if user is a Department Head from COO department or Secretary from GSD department
                    const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
                    const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
                    console.log("Can override reservation:", isDepartmentHeadFromCOO || isSecretaryFromGSD);

                    // If user is Department Head from COO or Secretary from GSD, they can override any reservation
                    if (isDepartmentHeadFromCOO || isSecretaryFromGSD) {
                        return {
                            hasPriority: true,
                            conflictingUsers,
                            message: `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override any existing reservation.`,
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
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            }
            throw error;
        }
    };

    const handleAccept = async (vehicleDriverAssignments = {}) => {
        setIsAccepting(true);
        try {
            const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
            if (reservationDetails?.status_name === "Change Request") {
                const isFinalApproverForChange = Boolean(reservationDetails?.approval_sequence) && (() => {
                    const approvers = reservationDetails?.approval_sequence;
                    if (!Array.isArray(approvers) || approvers.length === 0) return false;
                    const sequences = approvers.map(a => parseInt(a.approval_sequence, 10)).filter(n => !Number.isNaN(n));
                    const maxSequence = Math.max(...sequences);
                    const finalApprover = approvers.find(a => parseInt(a.approval_sequence, 10) === maxSequence);
                    const allPreviousApproved = approvers
                        .filter(a => parseInt(a.approval_sequence, 10) < maxSequence)
                        .every(a => a.has_approved === true);
                    return (
                        !!finalApprover &&
                        String(finalApprover.users_id) === String(currentUserId) &&
                        allPreviousApproved
                    );
                })();

                if (isFinalApproverForChange) {
                    const response = await axios.post(`${encryptedUrl}reservation.php`, {
                        operation: 'updateChangeReschedule',
                        reservation_id: currentRequest.reservation_id,
                        is_accepted: true,
                        user_id: currentUserId
                    });

                    if (response.data?.status === 'success') {
                        toast.success('Change request confirmed successfully!', {
                            icon: '✅',
                            duration: 3000,
                        });
                        await fetchReservations();
                        setIsDetailModalOpen(false);
                    } else {
                        toast.error('Failed to confirm change request.');
                    }
                    return;
                }
                // Not the last approver: fall through to normal handleRequest approval
            }

            // Check if current stage is Pending and if user is current approver
            const adminApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending');
            const currentApprover = reservationDetails?.approval_sequence?.find(approver => !approver.has_approved);
            const isCurrentSequenceApprover = currentApprover && String(currentApprover.users_id) === String(currentUserId);
            const isAdminApprover = isCurrentSequenceApprover || !!(adminApproval && String(adminApproval.reservation_users_id) === String(currentUserId));
            const isAdminApprovalPending = adminApproval?.reservation_active === 0;

            // Determine if current user is the FINAL approver in the approval sequence
            const isFinalApprover = reservationDetails?.approval_sequence && (() => {
                const approvers = reservationDetails?.approval_sequence;
                if (!approvers || approvers.length === 0) return true;
                const maxSequence = Math.max(...approvers.map(a => a.approval_sequence));
                const finalApprover = approvers.find(a => a.approval_sequence === maxSequence);
                return finalApprover && String(finalApprover.users_id) === String(currentUserId);
            })();

            // If it's an intermediate approval stage, you can skip the conflict priority check.
            // For the FINAL approver, we MUST run the priority check to surface the conflict modal.
            if (!(isAdminApprover && isAdminApprovalPending) || isFinalApprover) {
                // For other stages, perform priority check
                const priorityCheckResult = await handlePriorityCheck(currentRequest.reservation_id);

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

                console.log("this is priorityCheckResult", priorityCheckResult);
                console.log("needs override", priorityCheckResult.needsOverride);
                console.log("conflicting users", priorityCheckResult.conflictingUsers);

                // If there are conflicts, determine how to handle them
                if (priorityCheckResult.needsOverride && priorityCheckResult.conflictingUsers && priorityCheckResult.conflictingUsers.length > 0) {
                    // Check if user is Department Head COO or Secretary GSD who can bypass completely
                    const currentUserLevel = reservationDetails?.user_level_name || '';
                    const currentUserDepartment = reservationDetails?.department_name || '';
                    const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
                    const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
                    
                    // Check if current user is the final approver
                    const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
                    const isCurrentUserFinalApprover = reservationDetails?.approval_sequence && (() => {
                        const approvers = reservationDetails?.approval_sequence;
                        if (!approvers || approvers.length === 0) return true;
                        const maxSequence = Math.max(...approvers.map(a => a.approval_sequence));
                        const finalApprover = approvers.find(a => a.approval_sequence === maxSequence);
                        return finalApprover && String(finalApprover.users_id) === String(currentUserId);
                    })();
                    
                    // If user is final approver, always show modal for "Accept and Reschedule"
                    // If user is Department Head COO or Secretary GSD but NOT final approver, they can bypass completely
                    if (isCurrentUserFinalApprover) {
                        console.log('Final approver - showing conflict modal with Accept and Reschedule option');
                        setConflictingReservations(priorityCheckResult.conflictingUsers);
                        setIsPriorityConflictModalOpen(true);
                        setIsAccepting(false);
                        return;
                    } else if (isDepartmentHeadFromCOO || isSecretaryFromGSD) {
                        console.log(`${isDepartmentHeadFromCOO ? 'Department Head COO' : 'Secretary GSD'} (not final approver) bypassing conflict modal`);
                        // Continue with the approval process without showing modal
                    } else {
                        // For other users, show conflict modal 
                        console.log('Showing conflict modal for other users');
                        setConflictingReservations(priorityCheckResult.conflictingUsers);
                        setIsPriorityConflictModalOpen(true);
                        setIsAccepting(false);
                        return;
                    }
                }
            }

            // Determine if current action is Department Approval (only then insert units)
            // const departmentApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending');
            // const currentApproverForDept = reservationDetails?.approval_sequence?.find(approver => !approver.has_approved);
            // const isCurrentSequenceApproverForDept = currentApproverForDept && String(currentApproverForDept.users_id) === String(currentUserId);
            // const isDepartmentApprover = isCurrentSequenceApproverForDept || !!(departmentApproval && String(departmentApproval.reservation_users_id) === String(currentUserId));
            // const isDeptApprovalPending = departmentApproval?.reservation_active === 0;

            // Check if user can bypass conflicts for override parameter
            const currentUserLevel = reservationDetails?.user_level_name || '';
            const currentUserDepartment = reservationDetails?.department_name || '';
            const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
            const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
            const canBypassConflicts = isDepartmentHeadFromCOO || isSecretaryFromGSD;

            const response = await axios.post(`${encryptedUrl}/Admin.php`, {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: true,
                user_id: SecureStorage.getLocalItem("user_id"),
                override_lower_priority: canBypassConflicts,
                notification_message: "Your Reservation Request Has Been Approved By GSD",
                notification_user_id: reservationDetails?.reservation_user_id || reservationDetails?.user_id,
                driver_assignments: vehicleDriverAssignments
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation accepted successfully!', {
                    icon: '✅',
                    duration: 3000,
                });
                
                // Check if this was the FINAL approver to show assign modal
                const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
                
                // Check if current user is the final approver in sequence
                const isFinalApprover = reservationDetails?.approval_sequence && (() => {
                    const approvers = reservationDetails?.approval_sequence;
                    if (!approvers || approvers.length === 0) return true;
                    
                    // Find the highest sequence number
                    const maxSequence = Math.max(...approvers.map(a => a.approval_sequence));
                    const finalApprover = approvers.find(a => a.approval_sequence === maxSequence);
                    
                    return finalApprover && String(finalApprover.users_id) === String(currentUserId);
                })();
                
                console.log('Assignment Modal Debug:', {
                    currentUserId,
                    approvalSequence: reservationDetails?.approval_sequence,
                    isFinalApprover,
                    shouldShowAssignModal: isFinalApprover
                });
                
                await fetchReservations();
                setIsDetailModalOpen(false);
                
                // Only show assign option modal if this was the FINAL approver
                if (isFinalApprover) {
                    console.log('Showing assignment modal - final approver completed approval');
                    setIsAssignOptionModalOpen(true);
                } else {
                    console.log('Skipping assignment modal - not department head approval');
                }
            } else {
                toast.error('Failed to accept reservation.');
            }
        } catch (error) {
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            } else {
                toast.error(`Error accepting reservation: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setIsAccepting(false);
        }
    };

    // Handler for accepting with override
    const handleAcceptWithOverride = async () => {
        setIsAccepting(true);
        try {
            // First, prepare equipment units if equipment exists in reservation details
            // Only insert units when Department approver is approving and department is pending
            // const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
            // // const departmentApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending');
            // const currentApproverOverride = reservationDetails?.approval_sequence?.find(approver => !approver.has_approved);
            // const isCurrentSequenceApproverOverride = currentApproverOverride && String(currentApproverOverride.users_id) === String(currentUserId);
            // const isDepartmentApprover = isCurrentSequenceApproverOverride || !!(departmentApproval && String(departmentApproval.reservation_users_id) === String(currentUserId));
            // const isDeptApprovalPending = departmentApproval?.reservation_active === 0;

            // Determine if current user is the FINAL approver in the approval sequence
            // const isFinalApproverOverride = reservationDetails?.approval_sequence && (() => {
            //     const approvers = reservationDetails.approval_sequence;
            //     if (!approvers || approvers.length === 0) return true;
            //     const maxSequence = Math.max(...approvers.map(a => a.approval_sequence));
            //     const finalApprover = approvers.find(a => a.approval_sequence === maxSequence);
            //     return finalApprover && String(finalApprover.users_id) === String(currentUserId);
            // })();

            // Now proceed with the acceptance
            const response = await axios.post(`${encryptedUrl}/Admin.php`, {
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
                
                // Check if this was the FINAL approver to show assign modal
                const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
                
                // Check if current user is the final approver in sequence
                const isFinalApprover = reservationDetails?.approval_sequence && (() => {
                    const approvers = reservationDetails?.approval_sequence;
                    if (!approvers || approvers.length === 0) return true;
                    
                    // Find the highest sequence number
                    const maxSequence = Math.max(...approvers.map(a => a.approval_sequence));
                    const finalApprover = approvers.find(a => a.approval_sequence === maxSequence);
                    
                    return finalApprover && String(finalApprover.users_id) === String(currentUserId);
                })();
                
                await fetchReservations();
                setIsDetailModalOpen(false);
                setIsPriorityConflictModalOpen(false);
                
                // Only show assign option modal if this was the FINAL approver
                if (isFinalApprover) {
                    console.log('Showing assignment modal - final approver completed approval (override)');
                    setIsAssignOptionModalOpen(true);
                } else {
                    console.log('Skipping assignment modal - not final approver (override)');
                }
            } else {
                toast.error('Failed to accept reservation.');
            }
        } catch (error) {
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            } else {
                toast.error(`Error: ${error.message || 'Failed to process reservation'}`);
            }
        } finally {
            setIsAccepting(false);
        }
    };

    // Handler for assign now option
    const handleAssignNow = () => {
        setIsAssignOptionModalOpen(false);
        setIsAssignModalOpen(true);
    };

    // Handler for assign later option
    const handleAssignLater = () => {
        setIsAssignOptionModalOpen(false);
        // Just close the modal, no further action needed
    };

    const handleDecline = async () => {
        setIsDeclining(true);
        try {
            const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
            
            // Handle Change Request status with specific API
            if (reservationDetails?.status_name === "Change Request") {
                const response = await axios.post(`${encryptedUrl}reservation.php`, {
                    operation: 'updateChangeReschedule',
                    reservation_id: currentRequest.reservation_id,
                    is_accepted: false,
                    user_id: currentUserId
                });

                if (response.data?.status === 'success') {
                    toast.success('Change request declined successfully!', {
                        icon: '❌',
                        duration: 3000,
                    });
                    await fetchReservations();
                    setIsDeclineReasonModalOpen(false);
                    setIsDeclineModalOpen(false);
                    setIsDetailModalOpen(false);
                    setDeclineReason('');
                } else {
                    toast.error('Failed to decline change request.');
                }
                return;
            }

            const finalReason = declineReason.trim();

            // Use user_id or reservation_user_id as fallback
            const notificationUserId = reservationDetails?.user_id || reservationDetails?.reservation_user_id;
            console.log('Declining reservation:', {
                reservation_id: currentRequest.reservation_id,
                notification_user_id: notificationUserId,
                reservationDetails
            });

            const response = await axios.post(`${encryptedUrl}/Admin.php`, {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: false,
                user_id: SecureStorage.getLocalItem('user_id'),
                decline_reason: finalReason,
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
            } else {
                toast.error('Failed to decline reservation.');
            }
        } catch (error) {
            console.error('Decline error:', error);
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            } else {
                toast.error('Error declining reservation. Please try again.');
            }
        } finally {
            setIsDeclining(false);
        }
    };

    // Reschedule decision handlers for parent component
    const openRescheduleDecisionModal = (action) => {
        setRescheduleDecisionAction(action);
        setRescheduleDecisionReason('');
        setIsRescheduleDecisionModalOpen(true);
    };

    const submitRescheduleDecision = async () => {
        try {
            const userId = SecureStorage.getLocalItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                return;
            }

            const isAccepted = rescheduleDecisionAction === 'accept';
            const reasonToSend = isAccepted ? null : (rescheduleDecisionReason && rescheduleDecisionReason.trim() ? rescheduleDecisionReason.trim() : null);
            const resp = await axios.post(`${encryptedUrl}reservation.php`, {
                operation: 'respondToRescheduleRequest',
                reservation_id: currentRequest?.reservation_id,
                is_accepted: isAccepted,
                user_id: Number(userId),
                reason: reasonToSend
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (resp.data?.status === 'success') {
                toast.success(resp.data?.message || 'Response submitted');
                setIsRescheduleDecisionModalOpen(false);
                setRescheduleDecisionReason('');
                await fetchReservations();
                setIsDetailModalOpen(false);
            } else {
                toast.error(resp.data?.message || 'Failed to submit response');
            }
        } catch (error) {
            console.error('Error submitting reschedule decision:', error);
            toast.error('Failed to submit response. Please try again.');
        }
    };

    const getIconForType = (type) => {
        const icons = {
            // Legacy types (if still used)
            Equipment: <FaTools className="mr-2 text-orange-500" />,
            Venue: <FaBuilding className="mr-2 text-green-500" />,
            Vehicle: <FaCar className="mr-2 text-blue-500" />,
            // New reservation types from backend
            'EQ': <FaTools className="mr-2 text-orange-500" />,
            'Activity/Events': <FaBuilding className="mr-2 text-green-500" />,
            'Activity/Event': <FaBuilding className="mr-2 text-green-500" />,
            'Trip': <FaCar className="mr-2 text-blue-500" />,
            'Unknown': <FaQuestionCircle className="mr-2 text-gray-500" />,
        };
        return icons[type] || <FaQuestionCircle className="mr-2 text-gray-500" />;
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

  


    const handleRefresh = () => {
        fetchReservations();
    };

  
    // Helper function to get status style
    const getStatusStyle = (status, isExpired, record) => {
        if (isExpired) {
            return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
        }
        if (record.active === -1) {
            return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
        }
        
        const normalizedStatus = status?.toLowerCase() || '';
        switch (normalizedStatus) {
            case 'pending':
                return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
            case 'declined':
            case 'department declined':
                return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
            case 'approved':
            case 'department head approved':
                return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
            case 'processed':
                return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
        }
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
                    <span className="font-medium truncate block max-w-[140px]">{text || record.reservation_destination || 'Untitled'}</span>
                ),
            },
            {
                title: 'Duration',
                dataIndex: 'reservation_start_date',
                key: 'duration',
                sorter: true,
                sortOrder: sortField === 'reservation_start_date' ? sortOrder : null,
                render: (text, record) => {
                    const startDate = new Date(record.reservation_start_date);
                    const endDate = new Date(record.reservation_end_date);
                    const startDateStr = startDate.toLocaleDateString();
                    const endDateStr = endDate.toLocaleDateString();
                    const startTime = formatTime(record.reservation_start_date);
                    const endTime = formatTime(record.reservation_end_date);
                    
                    // Check if it's the same day
                    if (startDateStr === endDateStr) {
                        // Single day reservation
                        return (
                            <div className="whitespace-nowrap">
                                <div className="font-medium">{startDateStr}</div>
                                <div className="text-sm text-gray-600">{startTime} - {endTime}</div>
                            </div>
                        );
                    } else {
                        // Multi-day reservation
                        return (
                            <div className="whitespace-nowrap">
                                <div className="font-medium">{startDateStr} - {endDateStr}</div>
                                <div className="text-sm text-gray-600">{startTime} - {endTime}</div>
                            </div>
                        );
                    }
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
                title: 'Type',
                dataIndex: 'reservation_type',
                key: 'reservation_type',
                sorter: true,
                sortOrder: sortField === 'reservation_type' ? sortOrder : null,
                render: (type) => (
                    <div className="flex items-center">
                        {getIconForType(type)}
                        <span className="ml-1 font-medium text-sm">
                            {type || 'Unknown'}
                        </span>
                    </div>
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
                        {new Intl.DateTimeFormat('default', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(text))}
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
                            (record.active === -1) ? 'red' :
                            status === 'Pending' ? 'gold' :

                            status === 'Department Head Approved' ? 'green' :
                            status === 'Approved' ? 'green' :
                            status === 'Processed' ? 'blue' :
                            status === 'Declined' ? 'red' :

                            status === 'Department Declined' ? 'red' : 'default'
                        }
                        className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center whitespace-nowrap"
                        >
                        {isExpired ? "Expired" :
                         (record.active === -1) ? "Declined" :
                         status || "Unknown"}
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
                                    loading={loadingReservationId === record.reservation_id}
                                    disabled={loadingReservationId === record.reservation_id}
                                    onClick={() => {
                                        console.log('View button clicked for reservation ID:', record.reservation_id);
                                        try {
                                            onView(record.reservation_id);
                                        } catch (error) {
                                            console.error('Error in View button click:', error);
                                            if (!error.response) {
                                                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
                                            } else {
                                                toast.error('Error opening reservation details');
                                            }
                                        }
                                    }}
                                    icon={<EyeOutlined />}
                                    className="bg-green-900 hover:bg-lime-900"
                                    size="large"
                                >
                                    <span className="hidden sm:inline">
                                        {record.reservation_status === 'Pending' ? 'Process' : 'View'}
                                    </span>
                                    <span className="sm:hidden">
                                        {record.reservation_status === 'Pending' ? 'Process' : 'View'}
                                    </span>
                                </Button>
                            </Tooltip>
                        </div>
                    );
                },
            },
        ];

        return (
            <>
                {isMobile ? (
                    // Mobile Card View
                    <div className="p-3">
                        {data.length > 0 ? (
                            data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                .map((record) => {
                                    const isExpired = new Date(record.reservation_end_date) < new Date();
                                    const statusStyle = getStatusStyle(record.reservation_status, isExpired, record);
                                    const startDate = new Date(record.reservation_start_date);
                                    const endDate = new Date(record.reservation_end_date);
                                    const startDateStr = startDate.toLocaleDateString();
                                    const endDateStr = endDate.toLocaleDateString();
                                    const startTime = formatTime(record.reservation_start_date);
                                    const endTime = formatTime(record.reservation_end_date);
                                    
                                    return (
                                        <Card
                                            key={record.reservation_id}
                                            className="mb-3 shadow-sm"
                                            size="small"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center min-w-0">
                                                        {getIconForType(record.reservation_type)}
                                                        <Text strong className="text-sm truncate ml-2">
                                                            {record.reservation_title || record.reservation_destination || 'Untitled'}
                                                        </Text>
                                                    </div>
                                                    <Button
                                                        icon={<EyeOutlined />}
                                                        onClick={() => onView(record.reservation_id)}
                                                        size="small"
                                                        type="primary"
                                                        className="bg-green-900 hover:bg-lime-900 flex-shrink-0"
                                                        loading={loadingReservationId === record.reservation_id}
                                                        disabled={loadingReservationId === record.reservation_id}
                                                    />
                                                </div>
                                                <div>
                                                    <Text type="secondary" className="text-xs">Requester:</Text>
                                                    <div className="text-sm font-medium">{record.requester_name}</div>
                                                </div>
                                                <div>
                                                    <Text type="secondary" className="text-xs">Date & Time:</Text>
                                                    <div className="text-xs text-gray-600">
                                                        {startDateStr === endDateStr ? (
                                                            <>
                                                                <div>{startDateStr}</div>
                                                                <div>{startTime} - {endTime}</div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div>{startDateStr} - {endDateStr}</div>
                                                                <div>{startTime} - {endTime}</div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                        {isExpired ? "Expired" : (record.active === -1) ? "Declined" : record.reservation_status || "Unknown"}
                                                    </span>
                                                    <Text type="secondary" className="text-xs">
                                                        {new Intl.DateTimeFormat('default', { month: 'short', day: 'numeric' }).format(new Date(record.reservation_created_at))}
                                                    </Text>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                        ) : (
                            <div className="text-center py-12">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={<span className="text-gray-500">No reservations found</span>}
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
                                    {columns.map((column) => {
                                        // Hide certain columns on tablet
                                        if (isTablet && (column.key === 'reservation_created_at')) {
                                            return null;
                                        }
                                        return (
                                            <th
                                                key={column.key}
                                                scope="col"
                                                className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`}
                                                onClick={() => column.sorter && handleSort(column.dataIndex)}
                                            >
                                                <div className="flex items-center hover:text-gray-900">
                                                    {column.title}
                                                    {sortField === column.dataIndex && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
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
                                                {columns.map((column) => {
                                                    // Hide certain columns on tablet
                                                    if (isTablet && (column.key === 'reservation_created_at')) {
                                                        return null;
                                                    }
                                                    return (
                                                        <td
                                                            key={`${record.reservation_id}-${column.key}`}
                                                            className={`${isTablet ? 'px-3 py-3' : 'px-4 py-6'}`}
                                                        >
                                                            {column.render
                                                                ? column.render(record[column.dataIndex], record)
                                                                : record[column.dataIndex]}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan={isTablet ? columns.length - 1 : columns.length} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description={<span className="text-gray-500 dark:text-gray-400">No reservations found</span>}
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
                        total={data.length}
                        onChange={(page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        }}
                        showSizeChanger={!isMobile}
                        showTotal={!isMobile ? (total, range) => `${range[0]}-${range[1]} of ${total} items` : false}
                        size={isMobile ? "small" : "default"}
                        className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                        simple={isMobile}
                    />

                    {/* Error Modal */}
                    <ErrorModal
                        visible={isErrorModalOpen}
                        onClose={() => {
                            setIsErrorModalOpen(false);
                            setErrorMessage('');
                            // Refresh the reservations data
                            fetchReservations();
                        }}
                        message={errorMessage}
                    />

                    {/* Reschedule Error Modal */}
                    <RescheduleErrorModal
                        visible={isRescheduleErrorModalOpen}
                        onClose={() => {
                            setIsRescheduleErrorModalOpen(false);
                            setRescheduleErrorMessage('');
                        }}
                        message={rescheduleErrorMessage}
                    />
                </div>
            </>
        );
    };


    // Replace the existing card rendering code in the return statement
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            {/* Fixed Sidebar - Hide on mobile */}
            {!isMobile && (
                <div className="flex-shrink-0">
                    <Sidebar />
                </div>
            )}

                {isMobile && (
                <div className="flex-shrink-0">
                    <Sidebar />
                </div>
            )}
            
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
                                Reservation Requests
                            </h2>
                        </div>
                    </motion.div>
                    
                    {/* Search & Controls */}
                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Search
                                    placeholder={isMobile ? "Search requests..." : "Search by ID, title, or requester"}
                                    allowClear
                                    enterButton={<SearchOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <Tooltip title="Refresh data">
                                <Button 
                                    icon={<ReloadOutlined />} 
                                    onClick={handleRefresh}
                                    size={isMobile ? "middle" : "large"}
                                    className={isMobile ? 'w-full' : ''}
                                >
                                    {isMobile && 'Refresh'}
                                </Button>
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
                        fetchReservationDetails={fetchReservationDetails}
                        currentRequest={currentRequest}
                        setErrorMessage={setErrorMessage}
                        setIsErrorModalOpen={setIsErrorModalOpen}
                        fetchReservations={fetchReservations}
                        handleRescheduleError={handleRescheduleError}
                        openRescheduleDecisionModal={openRescheduleDecisionModal}
                    />

                    {/* Reschedule Decision Modal */}
                    <Modal
                        title={rescheduleDecisionAction === 'accept' ? 'Accept Reschedule Request' : 'Reject Reschedule Request'}
                        open={isRescheduleDecisionModalOpen}
                        onCancel={() => {
                            setIsRescheduleDecisionModalOpen(false);
                            setRescheduleDecisionReason('');
                        }}
                        footer={[
                            <Button key="cancel" onClick={() => {
                                setIsRescheduleDecisionModalOpen(false);
                                setRescheduleDecisionReason('');
                            }}>
                                Cancel
                            </Button>,
                            <Button
                                key="submit"
                                type="primary"
                                danger={rescheduleDecisionAction !== 'accept'}
                                onClick={submitRescheduleDecision}
                            >
                                {rescheduleDecisionAction === 'accept' ? 'Accept' : 'Reject'}
                            </Button>
                        ]}
                    >
                        {rescheduleDecisionAction === 'accept' ? (
                            <div>
                                Are you sure you want to accept this reschedule request?
                            </div>
                        ) : (
                            <Input.TextArea
                                rows={4}
                                value={rescheduleDecisionReason}
                                onChange={(e) => setRescheduleDecisionReason(e.target.value)}
                                placeholder="Reason (optional)"
                            />
                        )}
                    </Modal>

                    {/* Decline Reason Modal */}
                    <Modal
                        title="Enter Decline Reason"
                        visible={isDeclineReasonModalOpen}
                        onCancel={() => {
                            setIsDeclineReasonModalOpen(false);
                            setDeclineReason('');
                        }}
                        maskClosable={false}
                        getContainer={false}
                        zIndex={1002}
                        footer={[
                            <Button key="back" onClick={() => {
                                setIsDeclineReasonModalOpen(false);
                                setDeclineReason('');
                            }}>
                                Cancel
                            </Button>,
                            <Button 
                                key="submit" 
                                type="primary" 
                                danger
                                loading={isDeclining}
                                onClick={handleDecline}
                                disabled={!declineReason || !declineReason.trim()}
                            >
                                Decline
                            </Button>,
                        ]}
                    >
                        <Input.TextArea 
                            rows={4} 
                            value={declineReason} 
                            onChange={(e) => setDeclineReason(e.target.value)} 
                            placeholder="Enter reason for declining this reservation"
                            maxLength={500}
                            showCount
                        />
                    </Modal>

                    {/* Priority Conflict Modal */}
                    <PriorityConflictModal
                        visible={isPriorityConflictModalOpen}
                        onClose={() => setIsPriorityConflictModalOpen(false)}
                        conflictingReservations={conflictingReservations}
                        onConfirm={handleAcceptWithOverride}
                        reservationDetails={reservationDetails}
                        setErrorMessage={setErrorMessage}
                        setIsErrorModalOpen={setIsErrorModalOpen}
                        fetchReservations={fetchReservations}
                        handleRescheduleError={handleRescheduleError}
                    />

                    {/* Assign Option Modal */}
                    <AssignOptionModal
                        isOpen={isAssignOptionModalOpen}
                        onClose={() => setIsAssignOptionModalOpen(false)}
                        onAssignNow={handleAssignNow}
                        onAssignLater={handleAssignLater}
                        selectedReservation={{
                            id: currentRequest?.reservation_id,
                            name: reservationDetails?.reservation_title
                        }}
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
                        getContainer={false}
                        zIndex={1002}
                        onOk={() => {
                            // Determine if the current user is the Admin approver
                            const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
                            const adminApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending');
                            const isAdminApprover = !!(adminApproval && String(adminApproval.reservation_users_id) === String(currentUserId));

                            if (isAdminApprover) {
                                // Admin declines should bypass the reason modal
                                if (typeof handleDecline === 'function') {
                                    handleDecline();
                                }
                                setIsDeclineModalOpen(false);
                            } else {
                                // Department declines should show the reason modal
                                setIsDeclineReasonModalOpen(true);
                            }
                        }}
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

const DetailModal = ({ 
    visible, 
    onClose, 
    reservationDetails, 
    setReservationDetails, 
    onAccept, 
    onDecline, 
    isAccepting, 
    isDeclining, 
    setIsDeclineReasonModalOpen, 
    declineReason, 
    setDeclineReason, 
    fetchReservationDetails, 
    currentRequest, 
    setErrorMessage, 
    setIsErrorModalOpen, 
    fetchReservations,
    handleRescheduleError,
    openRescheduleDecisionModal
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    
    const [deansApproval, setDeansApproval] = useState([]);
    const [isLoadingDeans, setIsLoadingDeans] = useState(false);
    const [isApproverListVisible, setIsApproverListVisible] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleResources, setRescheduleResources] = useState(null);
    const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
    
    // Find the current approver from approval sequence
    // const currentApprover = reservationDetails?.approval_sequence?.find(approver => !approver.has_approved);
    // const isCurrentApprover = currentApprover && String(currentApprover.users_id) === String(currentUserId);
    
    // // Find the current pending approval from status history
    // const currentPendingApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending' && s.reservation_active === 0);
    
    // For backward compatibility, keep these variables but point to the same pending approval
    // However, we'll modify the logic to use approval sequence for determining approver
    // const adminApprovalStage = currentPendingApproval;
    // const departmentApproval = currentPendingApproval;
    const encryptedUrl = SecureStorage.getLocalItem("url");
   
    // const isDepartmentStageForCurrentUser = isCurrentApprover || !!(departmentApproval && String(departmentApproval.reservation_users_id) === String(currentUserId) && departmentApproval.reservation_active === 0);
    // const isAdminStageForCurrentUser = isCurrentApprover || !!(adminApprovalStage && String(adminApprovalStage.reservation_users_id) === String(currentUserId) && adminApprovalStage.reservation_active === 0);

    useEffect(() => {
        const fetchDeansApproval = async () => {
            if (!visible || !reservationDetails?.reservation_id) {
                setDeansApproval([]);
                return;
            }

            setIsLoadingDeans(true);
            try {
                const response = await axios.post(`${encryptedUrl}/Admin.php`, {
                    operation: 'fetchDeansApproval',
                    reservation_id: reservationDetails?.reservation_id
                });
                if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                    setDeansApproval(response.data.data);
                } else {
                    setDeansApproval([]);
                }
            } catch (error) {
                console.error('Error fetching deans approval:', error);
                if (!error.response) {
                    toast.error('Network error: Unable to connect to server. Please check your internet connection.');
                }
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
    const [customDriverNames, setCustomDriverNames] = useState({});
    const [driverError, setDriverError] = useState("");
    // const [collapsedSections, setCollapsedSections] = useState({
    //     venues: false,
    //     vehicles: false,
    //     equipment: false
    // });

    // // Toggle section collapse
    // const toggleSection = (section) => {
    //     setCollapsedSections(prev => ({
    //         ...prev,
    //         [section]: !prev[section]
    //     }));
    // };
    
    // Fetch available drivers when modal opens
    useEffect(() => {
        setDriverError(""); // Reset driver error when modal opens or reservation changes
        const fetchDrivers = async () => {
            if (!reservationDetails || !reservationDetails?.reservation_start_date || !reservationDetails?.reservation_end_date) {
                console.log('Missing reservation details or dates:', {
                    hasReservationDetails: !!reservationDetails,
                    startDate: reservationDetails?.reservation_start_date,
                    endDate: reservationDetails?.reservation_end_date
                });
                return;
            }
            try {
                // Extract unique restriction IDs from vehicles
                const restrictionIds = reservationDetails?.vehicles && reservationDetails?.vehicles.length > 0
                    ? [...new Set(
                        reservationDetails?.vehicles
                            .map(v => v.restriction_id)
                            .filter(id => id !== null && id !== undefined)
                    )]
                    : [];
                
                const requestPayload = {
                    operation: 'fetchDriver',
                    startDateTime: reservationDetails?.reservation_start_date,
                    endDateTime: reservationDetails?.reservation_end_date,
                    userId: reservationDetails?.reservation_user_id || reservationDetails?.user_id,
                    reservationId: reservationDetails?.reservation_id,
                    restrictionIds: restrictionIds
                };
                
                console.log('Fetching drivers with params:', requestPayload);
                console.log('Date format check:', {
                    startDateTime: reservationDetails?.reservation_start_date,
                    endDateTime: reservationDetails?.reservation_end_date,
                    startType: typeof reservationDetails?.reservation_start_date,
                    endType: typeof reservationDetails?.reservation_end_date
                });
                console.log('Restriction IDs from vehicles:', restrictionIds);
                
                const response = await axios.post(`${encryptedUrl}/Admin.php`, requestPayload);
                
                console.log('Driver fetch response:', response.data);
                
                if (response.data?.status === 'success') {
                    const drivers = response.data.data || [];
                    const formattedDrivers = drivers.map(driver => ({
                        ...driver,
                        full_name: [
                            driver.users_fname,
                            driver.users_mname ? driver.users_mname : '',
                            driver.users_lname
                        ].filter(Boolean).join(' ')
                    }));
                    console.log('Setting available drivers:', formattedDrivers);
                    console.log('Driver count:', formattedDrivers.length);
                    setAvailableDrivers(formattedDrivers);
                    
                    if (formattedDrivers.length === 0) {
                        console.warn('No drivers available for the selected dates');
                    }
                } else {
                    console.log('Driver fetch failed:', response.data);
                    console.error('Response error message:', response.data?.message);
                    setAvailableDrivers([]);
                }
            } catch (error) {
                console.error('Error fetching drivers:', error);
                console.error('Error details:', error.response?.data);
                if (!error.response) {
                    toast.error('Network error: Unable to connect to server. Please check your internet connection.');
                }
                setAvailableDrivers([]);
            }
        };
        if (visible) {
            fetchDrivers();
            // Initialize assignments from reservationDetails
            if (reservationDetails && reservationDetails?.vehicles) {
                const assignments = {};
                (reservationDetails?.vehicles || []).forEach(vehicle => {
                    // Try to find assigned driver for this vehicle
                    const assignedDriver = (reservationDetails?.drivers || [])?.find(driver => 
                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                    );
                    if (assignedDriver && assignedDriver.driver_id) {
                        assignments[vehicle.vehicle_id] = assignedDriver.driver_id;
                    }
                });
                setVehicleDriverAssignments(assignments);
            }
            // Check for sufficient drivers immediately
            if (reservationDetails && reservationDetails?.vehicles && reservationDetails?.vehicles?.length > 0) {
                setTimeout(() => {
                    setDriverError("");
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
    
    // if (!reservationDetails) return null;



    // Add priority checking logic
    const checkPriority = () => {
        // First check if reservationDetails exists
        if (!reservationDetails) {
            return {
                hasPriority: true,
                message: ""
            };
        }
        
        // First check if the reservation is expired
        const isExpired = new Date(reservationDetails?.reservation_end_date) < new Date();
        if (isExpired) {
            return {
                hasPriority: false,
                message: "This reservation has expired and cannot be approved."
            };
        }

        // First check if there are any actual resource conflicts
        const hasVenueConflict = reservationDetails?.venues?.some(requestedVenue => 
            reservationDetails?.availabilityData?.unavailable_venues?.some(unavailableVenue => 
                String(requestedVenue.venue_id) === String(unavailableVenue.ven_id)
            )
        );

        const hasVehicleConflict = reservationDetails?.vehicles?.some(requestedVehicle => 
            reservationDetails?.availabilityData?.unavailable_vehicles?.some(unavailableVehicle => 
                String(requestedVehicle.vehicle_id) === String(unavailableVehicle.vehicle_id)
            )
        );

        const hasEquipmentConflict = reservationDetails?.equipment?.some(requestedEquipment => {
            const unavailableEquipment = reservationDetails?.availabilityData?.unavailable_equipment?.find(
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
        const currentUserLevel = reservationDetails?.user_level_name || '';
        const currentUserDepartment = reservationDetails?.department_name || '';

        console.log("This is the current user level and department", currentUserLevel, currentUserDepartment);

        // Check if user is a Department Head from COO department or Secretary from GSD department
        const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
        const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
        console.log("Can override reservation:", isDepartmentHeadFromCOO || isSecretaryFromGSD);

        // If user is Department Head from COO or Secretary from GSD, they can override any reservation
        if (isDepartmentHeadFromCOO || isSecretaryFromGSD) {
            return {
                hasPriority: true,
                message: `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override any existing reservation.`
            };
        }

        // Check against conflicting reservations
        const hasConflicts = reservationDetails?.availabilityData?.reservation_users?.length > 0;
        
        if (!hasConflicts) {
            return { 
                hasPriority: true, 
                message: "No conflicting reservations found." 
            };
        }

        // Check if user is a Department Head from COO department or Secretary from GSD department
        
        // Only these roles can override reservations
        if (isDepartmentHeadFromCOO || isSecretaryFromGSD) {
            return {
                hasPriority: true,
                message: `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override any existing reservation.`
            };
        } else {
            // For other users, check if they have higher priority than conflicting users
            const userPriorities = {
                'COO': 4,
                'Department Head': 3
            };

            const currentPriority = userPriorities[currentUserLevel] || 0;
            
            const canOverride = reservationDetails?.availabilityData?.reservation_users?.every(conflictUser => {
                const conflictingPriority = userPriorities[conflictUser.user_level_name] || 0;
                return currentPriority > conflictingPriority;
            });
            
            if (canOverride) {
                return {
                    hasPriority: true,
                    message: `You have permission to override this reservation as ${currentUserLevel}.`
                };
            } else {
                return {
                    hasPriority: false,
                    message: "You do not have permission to override this reservation."
                };
            }
        }
    };

    // // Determine if the proposed new date range is within the original reservation range
    // const isProposedWithinOriginalRange = () => {
    // 	try {
    // 		const originalStart = reservationDetails?.reservation_start_date ? new Date(reservationDetails.reservation_start_date) : null;
    // 		const originalEnd = reservationDetails?.reservation_end_date ? new Date(reservationDetails.reservation_end_date) : null;
    // 		if (!originalStart || !originalEnd) return true;

    // 		// Prefer reschedule dates when in Change Request; otherwise use effective dates if present
    // 		const useReschedule = reservationDetails?.status_name === "Change Request" && reservationDetails?.reschedule_start_date && reservationDetails?.reschedule_end_date;
    // 		const proposedStartStr = useReschedule ? reservationDetails.reschedule_start_date : reservationDetails?.effective_start_date;
    // 		const proposedEndStr = useReschedule ? reservationDetails.reschedule_end_date : reservationDetails?.effective_end_date;
    // 		if (!proposedStartStr || !proposedEndStr) return true;

    // 		const proposedStart = new Date(proposedStartStr);
    // 		const proposedEnd = new Date(proposedEndStr);

    // 		return proposedStart >= originalStart && proposedEnd <= originalEnd;
    // 	} catch (e) {
    // 		return true;
    // 	}
    // };

    // const checkResourceAvailability = (type, id, data) => {
    //     if (!data) return true;
        
    //     switch (type) {
    //         case 'venue':
    //             return !data.unavailable_venues?.some(v => String(v.ven_id) === String(id));
    //         case 'vehicle':
    //             return !data.unavailable_vehicles?.some(v => String(v.vehicle_id) === String(id));
    //         case 'equipment':
    //             const unavailableEquipment = data.unavailable_equipment?.find(e => String(e.equip_id) === String(id));
    //             if (!unavailableEquipment) return true;
                
    //             // Find the requested equipment quantity from reservationDetails
    //             const requestedEquipment = reservationDetails.equipment?.find(e => String(e.equipment_id) === String(id));
    //             if (!requestedEquipment) return true;
                
    //             // Calculate remaining quantity
    //             const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
                
    //             // Check if requested quantity can be accommodated
    //             return parseInt(requestedEquipment.quantity) <= remainingQuantity;
    //         case 'driver':
    //             return !data.unavailable_drivers?.some(d => String(d.driver_id) === String(id));
    //         default:
    //             return true;
    //     }
    // };

    // Handler for driver assignment change
    const handleDriverAssign = (vehicleId, driverId) => {
        // Handle empty string (unselect) by removing the assignment
        if (driverId === '' || driverId === 'existing_custom') {
            setVehicleDriverAssignments(prev => {
                const newState = { ...prev };
                delete newState[vehicleId];
                return newState;
            });
            
            // Clear custom driver name when unselecting
            setCustomDriverNames(prev => {
                const newState = { ...prev };
                delete newState[vehicleId];
                return newState;
            });
        } else {
            // Handle null assignment (No Driver Available option)
            const assignmentValue = driverId === 'null' ? null : driverId;
            setVehicleDriverAssignments(prev => ({ ...prev, [vehicleId]: assignmentValue }));
            
            // Clear custom driver name when selecting a real driver
            if (driverId !== 'custom') {
                setCustomDriverNames(prev => {
                    const newState = { ...prev };
                    delete newState[vehicleId];
                    return newState;
                });
            }
        }
        
        // Clear driver error when assignment is made
        if (driverError) {
            setDriverError("");
        }
    };

    // Handler for custom driver name input
    const handleCustomDriverName = (vehicleId, driverName) => {
        setCustomDriverNames(prev => ({ ...prev, [vehicleId]: driverName }));

        if (driverName && driverName.trim()) {
            setVehicleDriverAssignments(prev => ({ ...prev, [vehicleId]: 'custom' }));
        }

        if (driverError) {
            setDriverError("");
        }
    };

    // Accept handler without driver checks (used by admin approvers)
    const handleAcceptWithoutDriverCheck = async () => {
        // For Admin stage: if any drivers are selected by Admin, insert them before approval, but do not require all
        try {
            if (reservationDetails?.vehicles && reservationDetails?.vehicles?.length > 0) {
                for (const vehicle of reservationDetails?.vehicles || []) {
                    const driverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    if (driverId !== undefined) {
                        // Insert driver assignment (null for no driver available, or actual driver ID)
                        let driverName = null;
                        if (driverId === null) {
                            // Calculate driver number for "No Driver Available" cases
                            const vehicleIndex = reservationDetails?.vehicles?.findIndex(v => String(v.vehicle_id) === String(vehicle.vehicle_id));
                            if (vehicleIndex !== -1) {
                                driverName = `driver ${vehicleIndex + 1}`;
                            } else {
                                console.error('Failed to find vehicle index for "No Driver Available" case');
                                continue;
                            }
                        } else if (driverId === 'custom') {
                            // Use custom driver name
                            driverName = customDriverNames[vehicle.vehicle_id] || null;
                        }
                        
                        // Check if there's an existing driver assignment for this vehicle
                        const existingDriver = (reservationDetails?.drivers || [])?.find(driver => 
                            driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                        );
                        
                        // Prepare payload
                        const payload = {
                            operation: 'insertDriver',
                            reservation_driver_user_id: driverId, // This can be null
                            reservation_vehicle_id: vehicle.reservation_vehicle_id,
                            driver_name: driverName
                        };
                        
                        // If there's an existing driver assignment, include the reservation_driver_id for update
                        if (existingDriver && existingDriver.reservation_driver_id) {
                            payload.reservation_driver_id = existingDriver.reservation_driver_id;
                        }
                        
                        // Debug logging
                        console.log('Frontend insertDriver payload (admin path):', payload);
                        
                        await axios.post(`${encryptedUrl}/Admin.php`, payload);
                    }
                }
            }
        } catch (error) {
            // Soft-fail: still allow admin approval to proceed
            console.error('Optional driver insert failed (admin stage):', error);
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            }
        }
        if (typeof onAccept === 'function') {
            await onAccept(vehicleDriverAssignments);
        }
    };

    // Modified Accept handler to check driver assignments and available drivers
    const handleAcceptWithDriverCheck = async () => {
        setDriverError("");
        // If there are vehicles, check assignments
        if (reservationDetails?.vehicles && reservationDetails?.vehicles?.length > 0) {
            // Check if all vehicles have a driver assigned (either existing, new assignment, or explicitly set to null)
            const vehiclesWithoutDrivers = reservationDetails?.vehicles?.filter(vehicle => {
                // Check if there's an existing driver assignment with a name
                const existingDriver = (reservationDetails?.drivers || [])?.find(driver => 
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) && driver.driver_name
                );
                
                // Check if there's a new assignment in the current session using vehicle_id
                const newAssignment = vehicleDriverAssignments[vehicle.vehicle_id];
                
                // Check if there's a custom driver name
                const customDriverName = customDriverNames[vehicle.vehicle_id];
                
                // Vehicle needs a driver if there's no existing assignment with name and no new assignment (including null, custom)
                // and no custom driver name provided
                return !existingDriver && newAssignment === undefined && !customDriverName;
            });
            
            if (vehiclesWithoutDrivers.length > 0) {
                setDriverError("Please assign a driver to each vehicle before approving the reservation.");
                return;
            }
            
            // Insert/update driver assignments before approving reservation
            try {
                for (const vehicle of reservationDetails?.vehicles || []) {
                    // const existingDriver = (reservationDetails?.drivers || [])?.find(driver => 
                    //     driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) && driver.driver_name
                    // );
                    
                    // Check if there's a new assignment in the current session
                    const driverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    
                    // If there's a new assignment (including reassignment), process it
                    if (driverId !== undefined) {
                        // Insert/update driver assignment (null for no driver available, or actual driver ID)
                        let driverName = null;
                        if (driverId === null) {
                            // Calculate driver number for "No Driver Available" cases
                            const vehicleIndex = reservationDetails?.vehicles?.findIndex(v => String(v.vehicle_id) === String(vehicle.vehicle_id));
                            if (vehicleIndex !== -1) {
                                driverName = `driver ${vehicleIndex + 1}`;
                            } else {
                                console.error('Failed to find vehicle index for "No Driver Available" case');
                                continue;
                            }
                        } else if (driverId === 'custom') {
                            // Use custom driver name
                            driverName = customDriverNames[vehicle.vehicle_id] || null;
                        }
                        
                        // Check if there's an existing driver assignment for this vehicle
                        const existingDriver = (reservationDetails?.drivers || [])?.find(driver => 
                            driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                        );
                        
                        // Prepare payload
                        const payload = {
                            operation: 'insertDriver',
                            reservation_driver_user_id: driverId, // This can be null
                            reservation_vehicle_id: vehicle.reservation_vehicle_id,
                            driver_name: driverName
                        };
                        
                        // If there's an existing driver assignment, include the reservation_driver_id for update
                        if (existingDriver && existingDriver.reservation_driver_id) {
                            payload.reservation_driver_id = existingDriver.reservation_driver_id;
                        }
                        
                        // Debug logging
                        console.log('Frontend insertDriver payload:', payload);
                        
                        await axios.post(`${encryptedUrl}/Admin.php`, payload);
                    }
                }
            } catch (error) {
            // Soft-fail: still allow admin approval to proceed
            console.error('Optional driver insert failed (admin stage):', error);
            if (!error.response) {
                toast.error('Network error: Unable to connect to server. Please check your internet connection.');
            }
        }
        }
        if (typeof onAccept === 'function') {
            await onAccept(vehicleDriverAssignments);
        }
    };

    // Helper function to get current approver from approval sequence
    const getCurrentApproverFromSequence = () => {
        if (!reservationDetails?.approval_sequence || reservationDetails?.approval_sequence?.length === 0) {
            return null;
        }

        const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
        
        // Find the first approver who hasn't approved yet
        for (let i = 0; i < reservationDetails?.approval_sequence?.length; i++) {
            const approver = reservationDetails?.approval_sequence[i];
            
            // If this approver hasn't approved yet
            if (!approver.has_approved) {
                // Check if all previous approvers have approved
                const previousApprovers = reservationDetails?.approval_sequence?.slice(0, i);
                const allPreviousApproved = previousApprovers.every(prev => prev.has_approved);
                
                // If all previous approved and current user is this approver
                if (allPreviousApproved && String(approver.users_id) === String(currentUserId)) {
                    return {
                        approver: approver,
                        isCurrentUser: true,
                        isPending: true,
                        sequence: approver.approval_sequence
                    };
                }
                
                // If all previous approved but current user is not this approver
                if (allPreviousApproved) {
                    return {
                        approver: approver,
                        isCurrentUser: false,
                        isPending: true,
                        sequence: approver.approval_sequence
                    };
                }
                
                // If not all previous approved, this approver is waiting
                return {
                    approver: approver,
                    isCurrentUser: approver.users_id === currentUserId,
                    isPending: false,
                    sequence: approver.approval_sequence
                };
            }
        }
        
        // All approvers have approved
        return {
            approver: null,
            isCurrentUser: false,
            isPending: false,
            sequence: null,
            allApproved: true
        };
    };

    // Helper used by last-approver reschedule flow
    // const handleReschedule = async ({ startDate, endDate, newVenueIds, newVehicleIds, driverAssignments, customDriverNames } = {}) => {
    //     try {
    //         let didUpdateSomething = false;

    //         // Update dates if provided
    //         if (startDate && endDate) {
    //             // Use NEW venue/vehicle IDs if changing resources, otherwise use current ones
    //             const venueIds = newVenueIds && newVenueIds.length > 0 
    //                 ? newVenueIds 
    //                 : (reservationDetails?.venues?.map(v => v.venue_id) || []);
    //             const vehicleIds = newVehicleIds && newVehicleIds.length > 0 
    //                 ? newVehicleIds 
    //                 : (reservationDetails?.vehicles?.map(v => v.vehicle_id) || []);
                
    //             console.log('[handleReschedule] Sending conflict check with:', { venueIds, vehicleIds, newVenueIds, newVehicleIds });
                
    //             const dateResp = await axios.post(`${encryptedUrl}reservation.php`, {
    //                 operation: 'updateReservationReschedule',
    //                 reservation_id: reservationDetails?.reservation_id,
    //                 reschedule_start_date: startDate,
    //                 reschedule_end_date: endDate,
    //                 user_admin_id: SecureStorage.getLocalItem('user_id'),
    //                 venue_ids: venueIds,
    //                 vehicle_ids: vehicleIds
    //             }, { headers: { 'Content-Type': 'application/json' } });
    //             if (!(dateResp?.data?.status === 'success')) {
    //                 await handleRescheduleError(dateResp, reservationDetails?.reservation_id, () => setIsRescheduleModalOpen(false));
    //                 return;
    //             }
    //             didUpdateSomething = true;
    //         }

    //         // Update venues if selection provided
    //         if (Array.isArray(newVenueIds) && newVenueIds.length > 0 && Array.isArray(reservationDetails?.venues)) {
    //             const venueChanges = reservationDetails?.venues
    //                 .map((v, idx) => {
    //                     const newId = newVenueIds[idx];
    //                     if (newId == null || String(newId) === String(v.venue_id)) return null;
    //                     return {
    //                         reservation_venue_id: v.reservation_venue_id,
    //                         reservation_change_venue_id: Number(newId)
    //                     };
    //                 })
    //                 .filter(Boolean);
    //             if (venueChanges.length > 0) {
    //                 const results = await Promise.allSettled(venueChanges.map(change => axios.post(`${encryptedUrl}reservation.php`, {
    //                     operation: 'updateVenueReschedule',
    //                     reservation_venue_id: change.reservation_venue_id,
    //                     reservation_change_venue_id: change.reservation_change_venue_id,
    //                     reservation_id: reservationDetails?.reservation_id
    //                 }, { headers: { 'Content-Type': 'application/json' } })));
                    
    //                 // Check for errors and handle them appropriately
    //                 const failedResults = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.data?.status !== 'success'));
    //                 if (failedResults.length > 0) {
    //                     const firstError = failedResults[0].status === 'rejected' 
    //                         ? failedResults[0].reason?.message
    //                         : failedResults[0].value?.data?.message;
                        
    //                     // Check if it's a status-related error that should show error modal
    //                     if (firstError && (firstError.includes('cancelled') || firstError.includes('declined') || 
    //                         firstError.includes('completed') || firstError.includes('already been rescheduled') || 
    //                         firstError.includes('pending reschedule'))) {
    //                         setErrorMessage(firstError);
    //                         setIsErrorModalOpen(true);
    //                         // Refresh data to show updated status
    //                         await fetchReservations();
    //                         return;
    //                     } else {
    //                         toast.error(firstError || 'Failed to reschedule venue');
    //                         return;
    //                     }
    //                 }
    //                 didUpdateSomething = true;
    //             }
    //         }

    //         // Update vehicles if selection provided
    //         if (Array.isArray(newVehicleIds) && newVehicleIds.length > 0 && Array.isArray(reservationDetails?.vehicles)) {
    //             const vehicleChanges = reservationDetails?.vehicles
    //                 .map((v, idx) => {
    //                     const newId = newVehicleIds[idx];
    //                     if (newId == null || String(newId) === String(v.vehicle_id)) return null;
    //                     return {
    //                         reservation_vehicle_id: v.reservation_vehicle_id,
    //                         reservation_change_vehicle_id: Number(newId)
    //                     };
    //                 })
    //                 .filter(Boolean);
    //             if (vehicleChanges.length > 0) {
    //                 const results = await Promise.allSettled(vehicleChanges.map(change => axios.post(`${encryptedUrl}reservation.php`, {
    //                     operation: 'updateVehicleReschedule',
    //                     reservation_vehicle_id: change.reservation_vehicle_id,
    //                     reservation_change_vehicle_id: change.reservation_change_vehicle_id,
    //                     reservation_id: reservationDetails?.reservation_id
    //                 }, { headers: { 'Content-Type': 'application/json' } })));
                    
    //                 // Check for errors and handle them appropriately
    //                 const failedResults = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.data?.status !== 'success'));
    //                 if (failedResults.length > 0) {
    //                     const firstError = failedResults[0].status === 'rejected' 
    //                         ? failedResults[0].reason?.message
    //                         : failedResults[0].value?.data?.message;
                        
    //                     // Check if it's a status-related error that should show error modal
    //                     if (firstError && (firstError.includes('cancelled') || firstError.includes('declined') || 
    //                         firstError.includes('completed') || firstError.includes('already been rescheduled') || 
    //                         firstError.includes('pending reschedule'))) {
    //                         setErrorMessage(firstError);
    //                         setIsErrorModalOpen(true);
    //                         // Refresh data to show updated status
    //                         await fetchReservations();
    //                         return;
    //                     } else {
    //                         toast.error(firstError || 'Failed to reschedule vehicle');
    //                         return;
    //                     }
    //                 }
    //                 didUpdateSomething = true;
    //             }
    //         }

    //         // Update driver assignments if provided
    //         if (driverAssignments && Object.keys(driverAssignments).length > 0 && Array.isArray(reservationDetails?.vehicles)) {
    //             console.log('[ViewRequest] Processing driver assignments:', driverAssignments);
    //             console.log('[ViewRequest] Custom driver names:', customDriverNames);
                
    //             for (const vehicle of reservationDetails?.vehicles || []) {
    //                 const vehicleId = vehicle.vehicle_id;
    //                 const driverAssignment = driverAssignments[vehicleId];
                    
    //                 // Only process if there's a driver assignment for this vehicle
    //                 if (driverAssignment !== undefined) {
    //                     const isCustomDriver = driverAssignment === 'custom';
    //                     const customDriverName = isCustomDriver ? customDriverNames[vehicleId] : null;
    //                     const driverUserId = isCustomDriver ? 'custom' : driverAssignment;
                        
    //                     console.log('[ViewRequest] Updating driver for vehicle:', {
    //                         vehicleId,
    //                         reservation_vehicle_id: vehicle.reservation_vehicle_id,
    //                         reservation_driver_id: vehicle.reservation_driver_id,
    //                         driverUserId,
    //                         customDriverName,
    //                         isCustomDriver
    //                     });
                        
    //                     try {
    //                         const driverResp = await axios.post(`${encryptedUrl}/Admin.php`, {
    //                             operation: 'insertDriver',
    //                             reservation_driver_user_id: driverUserId,
    //                             reservation_vehicle_id: vehicle.reservation_vehicle_id,
    //                             driver_name: customDriverName,
    //                             reservation_driver_id: vehicle.reservation_driver_id // This will trigger update if exists
    //                         }, { headers: { 'Content-Type': 'application/json' } });
                            
    //                         if (driverResp?.data?.status === 'success') {
    //                             console.log('[ViewRequest] Driver updated successfully for vehicle', vehicleId);
    //                             didUpdateSomething = true;
    //                         } else {
    //                             console.error('[ViewRequest] Failed to update driver for vehicle', vehicleId, driverResp?.data);
    //                             toast.error(`Failed to update driver for vehicle ${vehicle.vehicle_name || vehicleId}`);
    //                         }
    //                     } catch (driverError) {
    //                         console.error('[ViewRequest] Error updating driver:', driverError);
    //                         if (!driverError.response) {
    //                             toast.error('Network error: Unable to connect to server. Please check your internet connection.');
    //                         } else {
    //                             toast.error(`Error updating driver for vehicle ${vehicle.vehicle_name || vehicleId}`);
    //                         }
    //                     }
    //                 }
    //             }
    //         }

    //         // Equipment units handling removed

    //         if (!didUpdateSomething && (!startDate || !endDate)) {
    //             toast.info('No changes to update.');
    //         } else {
    //             toast.success('Reservation rescheduled successfully');
    //              onClose();
             
    //         }

         
    //     } catch (error) {
    //         console.error('[ViewRequest] Error in handleReschedule:', error);
    //         if (!error.response) {
    //             toast.error('Network error: Unable to connect to server. Please check your internet connection.');
    //         } else {
    //             toast.error('Error processing reschedule');
    //         }
    //     }
    // };

        const getModalFooter = () => {
        if (!reservationDetails) {
            return [<Button key="close" onClick={onClose} size="large">Close</Button>];
        }

        // Pending reschedule request handling (status 11 active=0)
        const pendingResched = reservationDetails?.status_history?.find(s => Number(s.status_id) === 11 && Number(s.reservation_active) === 0);
        const isPendingReschedule = !!pendingResched;
        const pendingInitiatorLevelId = pendingResched?.updated_by_level_id;
        const isPendingFromAdmin = pendingInitiatorLevelId != null && [1, 2, 4].includes(Number(pendingInitiatorLevelId));
        const isPendingFromSecretary = isPendingReschedule && !isPendingFromAdmin;

        if (isPendingFromSecretary) {
            return [
                <Button key="reject" danger onClick={() => openRescheduleDecisionModal('reject')} size="large">
                    Reject Reschedule
                </Button>,
                <Button key="accept" type="primary" onClick={() => openRescheduleDecisionModal('accept')} size="large">
                    Accept Reschedule
                </Button>,
                <Button key="close" onClick={onClose} size="large">Close</Button>
            ];
        }
        
        // Admin-initiated reschedule request - VIEW MODE ONLY for everyone
        // No Accept/Reject buttons should appear when admin reschedules
        // Accept/Reject buttons only appear when requestor (from my_reservation_details.jsx) initiates reschedule
        if (isPendingFromAdmin) {
            return [<Button key="close" onClick={onClose} size="large">Close</Button>];
        }
        
        // Check if reschedule request is pending department approval
        // If true, hide all action buttons (decline, approve, reschedule) and show only Close
        const isReschedulePendingDeptApproval = reservationDetails?.status_name === "Reschedule" && (() => {
            const departmentApproval = reservationDetails?.status_history?.find(
                status => status.status_name === 'Pending'
            );
            return departmentApproval && departmentApproval.reservation_active === 0;
        })();
        
        if (isReschedulePendingDeptApproval) {
            return [<Button key="close" onClick={onClose} size="large">Close</Button>];
        }
        
        // Debug logging for Change Request - in getModalFooter
        const footerCurrentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
        if (reservationDetails?.status_name === "Change Request") {
            console.log('=== GET MODAL FOOTER DEBUG ===');
            console.log('getModalFooter called for Change Request');
            console.log('Current User ID:', footerCurrentUserId);
            console.log('Reservation Details:', reservationDetails);
        }
        const currentApproverInfo = getCurrentApproverFromSequence();

        // Debug logging for approval sequence
        console.log('Approval Sequence Debug:', {
            currentUserId: footerCurrentUserId,
            currentApproverInfo,
            approvalSequence: reservationDetails?.approval_sequence
        });

        // Use approval sequence logic if available
        if (currentApproverInfo) {
            // Check if this is a change request and current user is the last approver
            const isChangeRequest = reservationDetails?.status_name === "Change Request";
            
            // Determine if current user is the last approver in the sequence
            const isLastApprover = Array.isArray(reservationDetails?.approval_sequence) &&
                reservationDetails?.approval_sequence?.length > 0 && (() => {
                    const maxSequence = Math.max(...reservationDetails?.approval_sequence?.map(a => parseInt(a.approval_sequence, 10)));
                    const lastApprover = reservationDetails?.approval_sequence?.find(a => parseInt(a.approval_sequence, 10) === maxSequence);
                    return lastApprover && String(lastApprover.users_id) === String(footerCurrentUserId);
                })();
            
            // Debug logging for change request logic
            const maxSequence = reservationDetails?.approval_sequence?.length > 0 ? Math.max(...reservationDetails?.approval_sequence?.map(a => parseInt(a.approval_sequence, 10))) : null;
            const lastApproverInSequence = reservationDetails?.approval_sequence?.find(a => parseInt(a.approval_sequence, 10) === maxSequence);
            
            console.log('Change Request Debug:', {
                statusName: reservationDetails?.status_name,
                isChangeRequest,
                allApproved: currentApproverInfo.allApproved,
                isLastApprover,
                currentSequence: currentApproverInfo.sequence,
                approvalSequence: reservationDetails?.approval_sequence,
                maxSequence,
                lastApproverInSequence,
                currentUserId: footerCurrentUserId,
                lastApproverUserId: lastApproverInSequence?.users_id
            });
            
            // If it's a change request AND current user is last approver,
            // show decline, reschedule, and approve buttons (regardless of all approvers approved status)
            if (isChangeRequest && isLastApprover) {
                const priorityCheck = checkPriority();
                const isExpired = new Date(reservationDetails?.reservation_end_date) < new Date();
                
                // Check if current user can bypass venue availability restrictions
                const currentUserLevel = reservationDetails?.user_level_name || '';
                const currentUserDepartment = reservationDetails?.department_name || '';
                const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
                const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
                const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
                
                const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails?.venues && reservationDetails?.venues?.some(v => v.isAvailable === false);
                
                // Department Approval Progress gating
                const hasDeptProgress = Array.isArray(deansApproval) && deansApproval.length > 0;
                const allDeptProgressApproved = !hasDeptProgress || deansApproval.every(a => a.is_approved === 1 || a.is_approved === '1');
                
                // For expired requests, only show decline
                if (isExpired) {
                    return [
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <Button key="close" onClick={onClose} size="large">Close</Button>
                    ];
                }
                
                // Show all three buttons for change request final approval
                // Change request: don't enforce driver requirement
                // Require driver selection before rescheduling when vehicles exist
                const hasVehicles = Array.isArray(reservationDetails?.vehicles) && reservationDetails?.vehicles?.length > 0;
                // Check if there are no available drivers when vehicles exist
                const noDriversAvailable = hasVehicles && availableDrivers.length === 0;
                const shouldDisableApprove = (!priorityCheck.hasPriority && !(isDepartmentHeadFromCOO || isSecretaryFromGSD)) || anyVenueNotAvailable || (hasDeptProgress && !allDeptProgressApproved) || noDriversAvailable;
                const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails?.vehicles?.every(vehicle => {
                    const existingDriver = (reservationDetails?.drivers || [])?.find(driver =>
                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                        (driver.driver_id || driver.driver_name)
                    );
                    if (existingDriver) return true;
                    const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    const customDriverName = customDriverNames[vehicle.vehicle_id];
                    // If 'custom' is selected, check if custom name is filled; otherwise check if driver is assigned
                    return assignedDriverId === 'custom' 
                        ? (customDriverName && customDriverName.trim() !== '')
                        : !!assignedDriverId;
                });
                
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                        Decline
                    </Button>,
                    <Button
                        key="reschedule"
                        type="default"
                        onClick={() => {
                            const resources = {
                                venueIds: (reservationDetails?.venues || [])?.map(v => ({
                                    venue_id: v.venue_id,
                                    change_venue_id: v.change_venue_id || null,
                                    reservation_venue_id: v.reservation_venue_id
                                })),
                                vehicleIds: (reservationDetails?.vehicles || [])?.map(v => ({
                                    vehicle_id: v.vehicle_id,
                                    change_vehicle_id: v.change_vehicle_id || null,
                                    reservation_vehicle_id: v.reservation_vehicle_id
                                })),
                                equipment: (reservationDetails?.equipment || [])?.map(eq => ({
                                    equipment_id: eq.equipment_id,
                                    quantity: parseInt(eq.quantity, 10) || 0
                                }))
                            };
                            setRescheduleResources(resources);
                            setIsRescheduleModalOpen(true);
                        }}
                        size="large"
                        className="mr-2"
                        icon={<ScheduleOutlined />}
                        disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                    >
                        Reschedule
                    </Button>,
                    <Button 
                        key="approve" 
                        type="primary" 
                        loading={isAccepting} 
                        disabled={shouldDisableApprove}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleAcceptWithoutDriverCheck(); 
                        }} 
                        size="large" 
                        icon={<CheckCircleOutlined />}
                    >
                        Approve
                    </Button>,
                    <Button key="close" onClick={onClose} size="large">Close</Button>,
                    <RescheduleModal
                        visible={isRescheduleModalOpen}
                        onCancel={() => setIsRescheduleModalOpen(false)}
                        reservation={reservationDetails}
                        originalStart={reservationDetails?.reservation_start_date}
                        originalEnd={reservationDetails?.reservation_end_date}
                        resources={rescheduleResources}
                        onReschedule={async (newDates) => {
                            try {
                                const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts, driverAssignments, customDriverNames, reason } = newDates || {};
                                alert('DEBUG viewRequest: newVenueIds = ' + JSON.stringify(newVenueIds));
                                console.log('[ViewRequest] ===== RescheduleModal#1 onReschedule RECEIVED =====');
                                console.log('[ViewRequest] Raw newDates:', newDates);
                                console.log('[ViewRequest] Extracted newVenueIds:', newVenueIds);
                                console.log('[ViewRequest] Extracted newVehicleIds:', newVehicleIds);
                                console.log('[ViewRequest] reservationDetails.venues:', reservationDetails?.venues);
                                console.log('[ViewRequest] reservationDetails.vehicles:', reservationDetails?.vehicles);
                                
                                if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                    try {
                                        await axios.post(`${encryptedUrl}/Admin.php`, {
                                            operation: 'handleRequest',
                                            reservation_id: reservationDetails?.reservation_id,
                                            is_accepted: true,
                                            user_id: SecureStorage.getLocalItem("user_id"),
                                            override_lower_priority: true,
                                            reschedule_mode: true,
                                            new_start_datetime: startDate,
                                            new_end_datetime: endDate
                                        });
                                    } catch (error) {
                                        console.error('[ViewRequest] Error overriding conflicts:', error);
                                        toast.error(`Error overriding conflicts: ${error.response?.data?.message || error.message}`);
                                        return;
                                    }
                                }
                                // Admin action becomes a proposal, not an immediate reschedule
                                // Prepare venue_ids and vehicle_ids for change venue/vehicle
                                console.log('[ViewRequest] Mapping venue/vehicle IDs...');
                                const venueIdsForProposal = (reservationDetails?.venues || []).map((v, index) => {
                                    const changeId = Array.isArray(newVenueIds) ? newVenueIds[index] || null : null;
                                    console.log(`[ViewRequest] Venue ${index}: reservation_venue_id=${v.reservation_venue_id}, change_venue_id=${changeId}, raw_newVenueIds[${index}]=${newVenueIds?.[index]}`);
                                    return {
                                        reservation_venue_id: v.reservation_venue_id,
                                        change_venue_id: changeId
                                    };
                                });
                                const vehicleIdsForProposal = (reservationDetails?.vehicles || []).map((v, index) => {
                                    const changeId = Array.isArray(newVehicleIds) ? newVehicleIds[index] || null : null;
                                    console.log(`[ViewRequest] Vehicle ${index}: reservation_vehicle_id=${v.reservation_vehicle_id}, change_vehicle_id=${changeId}, raw_newVehicleIds[${index}]=${newVehicleIds?.[index]}`);
                                    return {
                                        reservation_vehicle_id: v.reservation_vehicle_id,
                                        change_vehicle_id: changeId
                                    };
                                });
                                
                                const proposalPayload = {
                                    operation: 'proposeReschedule',
                                    reservation_id: reservationDetails?.reservation_id,
                                    reschedule_start_date: startDate,
                                    reschedule_end_date: endDate,
                                    user_id: currentUserId,
                                    reason: reason || null,
                                    venue_ids: venueIdsForProposal,
                                    vehicle_ids: vehicleIdsForProposal
                                };
                             
                                
                                const proposeResp = await axios.post(`${encryptedUrl}reservation.php`, proposalPayload, { headers: { 'Content-Type': 'application/json' } });

                                if (proposeResp.data?.status === 'success') {
                                    // Update venue changes using separate API calls (following reservation_details.jsx pattern)
                                    const venueChangesToApply = venueIdsForProposal.filter(v => v.change_venue_id !== null);
                                    if (venueChangesToApply.length > 0) {
                                       
                                        const venueResults = await Promise.allSettled(
                                            venueChangesToApply.map(change => axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateVenueReschedule',
                                                reservation_venue_id: change.reservation_venue_id,
                                                reservation_change_venue_id: change.change_venue_id,
                                                reservation_id: reservationDetails?.reservation_id
                                            }))
                                        );
                                        console.log('[ViewRequest] Venue update results:', venueResults);
                                    }

                                    // Update vehicle changes using separate API calls
                                    const vehicleChangesToApply = vehicleIdsForProposal.filter(v => v.change_vehicle_id !== null);
                                    if (vehicleChangesToApply.length > 0) {
                                        console.log('[ViewRequest] Applying vehicle changes:', vehicleChangesToApply);
                                        const vehicleResults = await Promise.allSettled(
                                            vehicleChangesToApply.map(change => axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateVehicleReschedule',
                                                reservation_vehicle_id: change.reservation_vehicle_id,
                                                reservation_change_vehicle_id: change.change_vehicle_id,
                                                reservation_id: reservationDetails?.reservation_id
                                            }))
                                        );
                                        console.log('[ViewRequest] Vehicle update results:', vehicleResults);
                                    }

                                    // Update driver assignments if provided
                                    if (driverAssignments && Object.keys(driverAssignments).length > 0) {
                                        console.log('[ViewRequest] Processing driver assignments:', driverAssignments);
                                        console.log('[ViewRequest] Custom driver names:', customDriverNames);
                                        
                                        for (const vehicle of reservationDetails?.vehicles || []) {
                                            const vehicleId = vehicle.vehicle_id;
                                            const driverAssignment = driverAssignments[vehicleId];
                                            
                                            if (driverAssignment !== undefined) {
                                                const isCustomDriver = driverAssignment === 'custom';
                                                const customDriverName = isCustomDriver ? customDriverNames[vehicleId] : null;
                                                const driverUserId = isCustomDriver ? null : driverAssignment;
                                                
                                                console.log('[ViewRequest] Inserting/updating driver for vehicle:', {
                                                    vehicleId,
                                                    reservation_vehicle_id: vehicle.reservation_vehicle_id,
                                                    driverUserId,
                                                    customDriverName
                                                });
                                                
                                                try {
                                                    await axios.post(`${encryptedUrl}Admin.php`, {
                                                        operation: 'insertDriver',
                                                        reservation_driver_user_id: driverUserId,
                                                        reservation_vehicle_id: vehicle.reservation_vehicle_id,
                                                        driver_name: customDriverName
                                                    });
                                                } catch (driverError) {
                                                    console.error('[ViewRequest] Error inserting driver:', driverError);
                                                }
                                            }
                                        }
                                    }

                                    toast.success('Reschedule proposal sent');
                                    setIsRescheduleModalOpen(false);
                                    await fetchReservationDetails(reservationDetails?.reservation_id);
                                    await fetchReservations();
                                } else {
                                    toast.error(proposeResp.data?.message || 'Failed to send reschedule proposal');
                                }
                            } catch (error) {
                                console.error('[ViewRequest] Error in onReschedule:', error);
                                toast.error(`Error rescheduling reservation: ${error.response?.data?.message || error.message}`);
                            }
                        }}
                    />
                ];
            }
            
            // Alternative condition: If it's a change request and all approvers have approved,
            // show decline, reschedule, and approve buttons for any approver in the sequence
            if (isChangeRequest && currentApproverInfo.allApproved && currentApproverInfo.isCurrentUser) {
                const priorityCheck = checkPriority();
                const isExpired = new Date(reservationDetails?.reservation_end_date) < new Date();
                
                // Check if current user can bypass venue availability restrictions
                const currentUserLevel = reservationDetails?.user_level_name || '';
                const currentUserDepartment = reservationDetails?.department_name || '';
                const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
                const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
                const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
                
                const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails?.venues && reservationDetails?.venues?.some(v => v.isAvailable === false);
                
                // Department Approval Progress gating
                const hasDeptProgress = Array.isArray(deansApproval) && deansApproval.length > 0;
                const allDeptProgressApproved = !hasDeptProgress || deansApproval.every(a => a.is_approved === 1 || a.is_approved === '1');
                
                // For expired requests, only show decline
                if (isExpired) {
                    return [
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <Button key="close" onClick={onClose} size="large">Close</Button>
                    ];
                }
                
                // Show all three buttons for change request final approval
                // Change request: don't enforce driver requirement
                const shouldDisableApprove = (!priorityCheck.hasPriority && !(isDepartmentHeadFromCOO || isSecretaryFromGSD)) || anyVenueNotAvailable || (hasDeptProgress && !allDeptProgressApproved);
                
                // Require driver selection before rescheduling when vehicles exist
                const hasVehicles = Array.isArray(reservationDetails?.vehicles) && reservationDetails?.vehicles?.length > 0;
                const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails?.vehicles?.every(vehicle => {
                    const existingDriver = (reservationDetails?.drivers || [])?.find(driver =>
                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                        (driver.driver_id || driver.driver_name)
                    );
                    if (existingDriver) return true;
                    const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    const customDriverName = customDriverNames[vehicle.vehicle_id];
                    // If 'custom' is selected, check if custom name is filled; otherwise check if driver is assigned
                    return assignedDriverId === 'custom' 
                        ? (customDriverName && customDriverName.trim() !== '')
                        : !!assignedDriverId;
                });
                
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                        Decline
                    </Button>,
                    <Button
                        key="reschedule"
                        type="default"
                        onClick={() => {
                            const isChangeRequest = reservationDetails?.status_name === "Change Request";
                            console.log('[ViewRequest] Opening RescheduleModal - Button 3:', {
                                isChangeRequest,
                                venues: reservationDetails?.venues,
                                vehicles: reservationDetails?.vehicles,
                                equipment: reservationDetails?.equipment
                            });
                            
                            const resources = {
                                venueIds: (reservationDetails?.venues || [])?.map(v => {
                                    if (isChangeRequest) {
                                        return {
                                            venue_id: v.venue_id || v.ven_id,
                                            change_venue_id: v.change_venue_id || null,
                                            reservation_venue_id: v.reservation_venue_id,
                                            change_venue_event_type: v.change_venue_event_type || v.event_type
                                        };
                                    }
                                    return v.venue_id || v.ven_id;
                                }),
                                vehicleIds: (reservationDetails?.vehicles || [])?.map(v => {
                                    if (isChangeRequest) {
                                        return {
                                            vehicle_id: v.vehicle_id,
                                            change_vehicle_id: v.change_vehicle_id || null,
                                            reservation_vehicle_id: v.reservation_vehicle_id
                                        };
                                    }
                                    return v.vehicle_id;
                                }),
                                equipment: (reservationDetails?.equipment || [])?.map(eq => ({
                                    equipment_id: eq.equipment_id || eq.equip_id,
                                    name: eq.name || eq.equipment_name,
                                    quantity: parseInt(eq.quantity, 10) || 0
                                }))
                            };
                            
                            console.log('[ViewRequest] Button 3 - Extracted resources:', resources);
                            setRescheduleResources(resources);
                            setIsRescheduleModalOpen(true);
                        }}
                        size="large"
                        className="mr-2"
                        icon={<ScheduleOutlined />}
                        disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                    >
                        Reschedule
                    </Button>,
                    <Button 
                        key="approve" 
                        type="primary" 
                        loading={isAccepting} 
                        disabled={shouldDisableApprove}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleAcceptWithoutDriverCheck(); 
                        }} 
                        size="large" 
                        icon={<CheckCircleOutlined />}
                    >
                        Approve
                    </Button>,
                    <Button key="close" onClick={onClose} size="large">Close</Button>,
                    <RescheduleModal
                        visible={isRescheduleModalOpen}
                        onCancel={() => setIsRescheduleModalOpen(false)}
                        reservation={reservationDetails}
                        originalStart={reservationDetails?.reservation_start_date}
                        originalEnd={reservationDetails?.reservation_end_date}
                        resources={rescheduleResources}
                        onReschedule={async (newDates) => {
                            try {
                                const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts, driverAssignments, customDriverNames, reason } = newDates || {};
                                alert('DEBUG viewRequest#2: newVenueIds = ' + JSON.stringify(newVenueIds));
                                console.log('[ViewRequest] RescheduleModal#2 onReschedule received:', { startDate, endDate, newVenueIds, newVehicleIds, driverAssignments, customDriverNames });
                                
                                if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                    try {
                                        await axios.post(`${encryptedUrl}/Admin.php`, {
                                            operation: 'handleRequest',
                                            reservation_id: reservationDetails?.reservation_id,
                                            is_accepted: true,
                                            user_id: SecureStorage.getLocalItem("user_id"),
                                            override_lower_priority: true,
                                            reschedule_mode: true,
                                            new_start_datetime: startDate,
                                            new_end_datetime: endDate
                                        });
                                    } catch (error) {
                                        console.error('[ViewRequest] Error overriding conflicts:', error);
                                        toast.error(`Error overriding conflicts: ${error.response?.data?.message || error.message}`);
                                        return;
                                    }
                                }
                                // Prepare venue_ids and vehicle_ids for change venue/vehicle
                                const venueIdsForProposal = (reservationDetails?.venues || []).map((v, index) => ({
                                    reservation_venue_id: v.reservation_venue_id,
                                    change_venue_id: Array.isArray(newVenueIds) ? newVenueIds[index] || null : null
                                }));
                                const vehicleIdsForProposal = (reservationDetails?.vehicles || []).map((v, index) => ({
                                    reservation_vehicle_id: v.reservation_vehicle_id,
                                    change_vehicle_id: Array.isArray(newVehicleIds) ? newVehicleIds[index] || null : null
                                }));
                                
                                const proposeResp = await axios.post(`${encryptedUrl}reservation.php`, {
                                    operation: 'proposeReschedule',
                                    reservation_id: reservationDetails?.reservation_id,
                                    reschedule_start_date: startDate,
                                    reschedule_end_date: endDate,
                                    user_id: currentUserId,
                                    reason: reason || null,
                                    venue_ids: venueIdsForProposal,
                                    vehicle_ids: vehicleIdsForProposal
                                }, { headers: { 'Content-Type': 'application/json' } });

                                if (proposeResp.data?.status === 'success') {
                                    // Update venue changes using separate API calls (following reservation_details.jsx pattern)
                                    const venueChangesToApply = venueIdsForProposal.filter(v => v.change_venue_id !== null);
                                    if (venueChangesToApply.length > 0) {
                                        console.log('[ViewRequest] Applying venue changes:', venueChangesToApply);
                                        await Promise.allSettled(
                                            venueChangesToApply.map(change => axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateVenueReschedule',
                                                reservation_venue_id: change.reservation_venue_id,
                                                reservation_change_venue_id: change.change_venue_id,
                                                reservation_id: reservationDetails?.reservation_id
                                            }))
                                        );
                                    }

                                    // Update vehicle changes using separate API calls
                                    const vehicleChangesToApply = vehicleIdsForProposal.filter(v => v.change_vehicle_id !== null);
                                    if (vehicleChangesToApply.length > 0) {
                                        console.log('[ViewRequest] Applying vehicle changes:', vehicleChangesToApply);
                                        await Promise.allSettled(
                                            vehicleChangesToApply.map(change => axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateVehicleReschedule',
                                                reservation_vehicle_id: change.reservation_vehicle_id,
                                                reservation_change_vehicle_id: change.change_vehicle_id,
                                                reservation_id: reservationDetails?.reservation_id
                                            }))
                                        );
                                    }

                                    // Update driver assignments if provided
                                    if (driverAssignments && Object.keys(driverAssignments).length > 0) {
                                        console.log('[ViewRequest] Processing driver assignments:', driverAssignments);
                                        console.log('[ViewRequest] Custom driver names:', customDriverNames);
                                        
                                        for (const vehicle of reservationDetails?.vehicles || []) {
                                            const vehicleId = vehicle.vehicle_id;
                                            const driverAssignment = driverAssignments[vehicleId];
                                            
                                            if (driverAssignment !== undefined) {
                                                const isCustomDriver = driverAssignment === 'custom';
                                                const customDriverName = isCustomDriver ? customDriverNames[vehicleId] : null;
                                                const driverUserId = isCustomDriver ? null : driverAssignment;
                                                
                                                console.log('[ViewRequest] Inserting/updating driver for vehicle:', {
                                                    vehicleId,
                                                    reservation_vehicle_id: vehicle.reservation_vehicle_id,
                                                    driverUserId,
                                                    customDriverName
                                                });
                                                
                                                try {
                                                    await axios.post(`${encryptedUrl}Admin.php`, {
                                                        operation: 'insertDriver',
                                                        reservation_driver_user_id: driverUserId,
                                                        reservation_vehicle_id: vehicle.reservation_vehicle_id,
                                                        driver_name: customDriverName
                                                    });
                                                } catch (driverError) {
                                                    console.error('[ViewRequest] Error inserting driver:', driverError);
                                                }
                                            }
                                        }
                                    }

                                    toast.success('Reschedule proposal sent');
                                    setIsRescheduleModalOpen(false);
                                    await fetchReservationDetails(reservationDetails?.reservation_id);
                                    await fetchReservations();
                                } else {
                                    toast.error(proposeResp.data?.message || 'Failed to send reschedule proposal');
                                }
                            } catch (error) {
                                console.error('[ViewRequest] Error in onReschedule:', error);
                                toast.error(`Error rescheduling reservation: ${error.response?.data?.message || error.message}`);
                            }
                        }}
                    />
                ];
            }
            
            // If all approvers have approved but not a change request, show only close button
            if (currentApproverInfo.allApproved) {
                return [
                    <Button key="close" onClick={onClose} size="large">Close</Button>
                ];
            }

            // If current user is not the pending approver, show only close button
            if (!currentApproverInfo.isCurrentUser || !currentApproverInfo.isPending) {
                return [
                    <Button key="close" onClick={onClose} size="large">Close</Button>
                ];
            }

            // Current user is the pending approver - show approval buttons
            const priorityCheck = checkPriority();
            const isExpired = new Date(reservationDetails?.reservation_end_date) < new Date();
            
            // Check if current user can bypass venue availability restrictions
            const currentUserLevel = reservationDetails?.user_level_name || '';
            const currentUserDepartment = reservationDetails?.department_name || '';
            const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
            const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
            const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
            
            const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails?.venues && reservationDetails?.venues?.some(v => v.isAvailable === false);
            
            // Department Approval Progress gating
            const hasDeptProgress = Array.isArray(deansApproval) && deansApproval.length > 0;
            const allDeptProgressApproved = !hasDeptProgress || deansApproval.every(a => a.is_approved === 1 || a.is_approved === '1');

            // For expired requests, only show decline
            if (isExpired) {
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                        Decline
                    </Button>,
                    <Button key="close" onClick={onClose} size="large">Close</Button>
                ];
            }

            // If current approver is the last in sequence, also show Reschedule
            const isLastInSequence = Array.isArray(reservationDetails?.approval_sequence) &&
                reservationDetails?.approval_sequence?.length > 0 &&
                parseInt(currentApproverInfo.sequence, 10) === Math.max(
                    ...reservationDetails?.approval_sequence?.map(a => parseInt(a.approval_sequence, 10))
                );

            // Require driver selection before rescheduling when vehicles exist
            const hasVehicles = Array.isArray(reservationDetails?.vehicles) && reservationDetails?.vehicles?.length > 0;
            const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails?.vehicles?.every(vehicle => {
                const existingDriver = (reservationDetails?.drivers || [])?.find(driver =>
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                    (driver.driver_id || driver.driver_name)
                );
                if (existingDriver) return true;
                const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                const customDriverName = customDriverNames[vehicle.vehicle_id];
                // If 'custom' is selected, check if custom name is filled; otherwise check if driver is assigned
                return assignedDriverId === 'custom' 
                    ? (customDriverName && customDriverName.trim() !== '')
                    : !!assignedDriverId;
            });
            
            // Show approve and decline buttons for current approver
            // Fix: When there's no department approval progress (hasDeptProgress = false), 
            // allDeptProgressApproved should be true, so the button should be enabled
            // For regular approval: Last approver must assign drivers before approving
            const isRegularApproval = reservationDetails?.status_name !== "Change Request";
            
            // Check if there are no available drivers when vehicles exist
            const noDriversAvailable = hasVehicles && availableDrivers.length === 0;
            
            const shouldDisableApprove = (!priorityCheck.hasPriority && !(isDepartmentHeadFromCOO || isSecretaryFromGSD)) || anyVenueNotAvailable || (hasDeptProgress && !allDeptProgressApproved) || (isLastInSequence && isRegularApproval && hasVehicles && !allVehiclesHaveDriverAssigned) || noDriversAvailable;
            
            // Debug logging for button disable conditions
            console.log('Approve Button Debug:', {
                priorityCheck,
                hasPriority: priorityCheck.hasPriority,
                anyVenueNotAvailable,
                hasDeptProgress,
                allDeptProgressApproved,
                isLastInSequence,
                isRegularApproval,
                hasVehicles,
                allVehiclesHaveDriverAssigned,
                noDriversAvailable,
                availableDriversCount: availableDrivers.length,
                shouldDisableApprove
            });

            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                    Decline
                </Button>,
                isLastInSequence && (
                    <>
                        <Button
                            key="reschedule"
                            type="default"
                            onClick={() => {
                                const isChangeRequest = reservationDetails?.status_name === "Change Request";
                                console.log('[ViewRequest] Opening RescheduleModal - Button 2:', {
                                    isChangeRequest,
                                    venues: reservationDetails?.venues,
                                    vehicles: reservationDetails?.vehicles,
                                    equipment: reservationDetails?.equipment
                                });

                                const resources = {
                                    venueIds: (reservationDetails?.venues || [])?.map(v => {
                                        if (isChangeRequest) {
                                            return {
                                                venue_id: v.venue_id || v.ven_id,
                                                change_venue_id: v.change_venue_id || null,
                                                reservation_venue_id: v.reservation_venue_id,
                                                change_venue_event_type: v.change_venue_event_type || v.event_type
                                            };
                                        }
                                        return v.venue_id || v.ven_id;
                                    }),
                                    vehicleIds: (reservationDetails?.vehicles || [])?.map(v => {
                                        if (isChangeRequest) {
                                            return {
                                                vehicle_id: v.vehicle_id,
                                                change_vehicle_id: v.change_vehicle_id || null,
                                                reservation_vehicle_id: v.reservation_vehicle_id
                                            };
                                        }
                                        return v.vehicle_id;
                                    }),
                                    equipment: (reservationDetails?.equipment || [])?.map(eq => ({
                                        equipment_id: eq.equipment_id || eq.equip_id,
                                        name: eq.name || eq.equipment_name,
                                        quantity: parseInt(eq.quantity, 10) || 0
                                    }))
                                };

                                console.log('[ViewRequest] Button 2 - Extracted resources:', resources);
                                setRescheduleResources(resources);
                                setIsRescheduleModalOpen(true);
                            }}
                            size="large"
                            className="mr-2"
                            icon={<ScheduleOutlined />}
                            disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                        >
                            Reschedule
                        </Button>
                        <RescheduleModal
                            visible={isRescheduleModalOpen}
                            onCancel={() => setIsRescheduleModalOpen(false)}
                            reservation={reservationDetails}
                            resources={rescheduleResources}
                            onReschedule={async (newDates) => {
                                alert('DEBUG viewRequest#3: newVenueIds = ' + JSON.stringify(newDates.newVenueIds));
                                try {
                                    const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts, reason, driverAssignments, customDriverNames } = newDates || {};
                                    console.log('[ViewRequest] RescheduleModal#3 onReschedule received:', { startDate, endDate, newVenueIds, newVehicleIds });

                                    if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                        try {
                                            await axios.post(`${encryptedUrl}/Admin.php`, {
                                                operation: 'handleRequest',
                                                reservation_id: reservationDetails?.reservation_id,
                                                is_accepted: true,
                                                user_id: SecureStorage.getLocalItem("user_id"),
                                                override_lower_priority: true,
                                                reschedule_mode: true,
                                                new_start_datetime: startDate,
                                                new_end_datetime: endDate
                                            });
                                        } catch (overrideErr) {
                                            console.error('[ViewRequest] Error overriding conflicts:', overrideErr);
                                            toast.error(`Error overriding conflicts: ${overrideErr.response?.data?.message || overrideErr.message}`);
                                            return;
                                        }
                                    }

                                    // Prepare venue_ids and vehicle_ids for change venue/vehicle
                                    const venueIdsForProposal = (reservationDetails?.venues || []).map((v, index) => ({
                                        reservation_venue_id: v.reservation_venue_id,
                                        change_venue_id: Array.isArray(newVenueIds) ? newVenueIds[index] || null : null
                                    }));
                                    const vehicleIdsForProposal = (reservationDetails?.vehicles || []).map((v, index) => ({
                                        reservation_vehicle_id: v.reservation_vehicle_id,
                                        change_vehicle_id: Array.isArray(newVehicleIds) ? newVehicleIds[index] || null : null
                                    }));

                                    const proposeResp = await axios.post(`${encryptedUrl}reservation.php`, {
                                        operation: 'proposeReschedule',
                                        reservation_id: reservationDetails?.reservation_id,
                                        reschedule_start_date: startDate,
                                        reschedule_end_date: endDate,
                                        user_id: currentUserId,
                                        reason: reason || null,
                                        venue_ids: venueIdsForProposal,
                                        vehicle_ids: vehicleIdsForProposal
                                    }, { headers: { 'Content-Type': 'application/json' } });

                                    if (proposeResp.data?.status === 'success') {
                                        // Update venue changes using separate API calls (following reservation_details.jsx pattern)
                                        const venueChangesToApply = venueIdsForProposal.filter(v => v.change_venue_id !== null);
                                        if (venueChangesToApply.length > 0) {
                                            console.log('[ViewRequest] Applying venue changes:', venueChangesToApply);
                                            await Promise.allSettled(
                                                venueChangesToApply.map(change => axios.post(`${encryptedUrl}reservation.php`, {
                                                    operation: 'updateVenueReschedule',
                                                    reservation_venue_id: change.reservation_venue_id,
                                                    reservation_change_venue_id: change.change_venue_id,
                                                    reservation_id: reservationDetails?.reservation_id
                                                }))
                                            );
                                        }

                                        // Update vehicle changes using separate API calls
                                        const vehicleChangesToApply = vehicleIdsForProposal.filter(v => v.change_vehicle_id !== null);
                                        if (vehicleChangesToApply.length > 0) {
                                            console.log('[ViewRequest] Applying vehicle changes:', vehicleChangesToApply);
                                            await Promise.allSettled(
                                                vehicleChangesToApply.map(change => axios.post(`${encryptedUrl}reservation.php`, {
                                                    operation: 'updateVehicleReschedule',
                                                    reservation_vehicle_id: change.reservation_vehicle_id,
                                                    reservation_change_vehicle_id: change.change_vehicle_id,
                                                    reservation_id: reservationDetails?.reservation_id
                                                }))
                                            );
                                        }

                                        // Update driver assignments if provided
                                        if (driverAssignments && Object.keys(driverAssignments).length > 0) {
                                            console.log('[ViewRequest] Processing driver assignments:', driverAssignments);
                                            console.log('[ViewRequest] Custom driver names:', customDriverNames);
                                            
                                            for (const vehicle of reservationDetails?.vehicles || []) {
                                                const vehicleId = vehicle.vehicle_id;
                                                const driverAssignment = driverAssignments[vehicleId];
                                                
                                                if (driverAssignment !== undefined) {
                                                    const isCustomDriver = driverAssignment === 'custom';
                                                    const customDriverName = isCustomDriver ? customDriverNames[vehicleId] : null;
                                                    const driverUserId = isCustomDriver ? null : driverAssignment;
                                                    
                                                    console.log('[ViewRequest] Inserting/updating driver for vehicle:', {
                                                        vehicleId,
                                                        reservation_vehicle_id: vehicle.reservation_vehicle_id,
                                                        driverUserId,
                                                        customDriverName
                                                    });
                                                    
                                                    try {
                                                        await axios.post(`${encryptedUrl}Admin.php`, {
                                                            operation: 'insertDriver',
                                                            reservation_driver_user_id: driverUserId,
                                                            reservation_vehicle_id: vehicle.reservation_vehicle_id,
                                                            driver_name: customDriverName
                                                        });
                                                    } catch (driverError) {
                                                        console.error('[ViewRequest] Error inserting driver:', driverError);
                                                    }
                                                }
                                            }
                                        }

                                        toast.success('Reschedule proposal sent');
                                        setIsRescheduleModalOpen(false);
                                        await fetchReservationDetails(reservationDetails?.reservation_id);
                                        await fetchReservations();
                                    } else {
                                        toast.error(proposeResp.data?.message || 'Failed to send reschedule proposal');
                                    }
                                } catch (error) {
                                    console.error('[ViewRequest] Error in onReschedule:', error);
                                    toast.error(`Error rescheduling reservation: ${error.response?.data?.message || error.message}`);
                                }
                            }}
                        />
                    </>
                ),
                <Button 
                    key="approve" 
                    type="primary" 
                    loading={isAccepting} 
                    disabled={shouldDisableApprove}
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        handleAcceptWithoutDriverCheck(); 
                    }} 
                    size="large" 
                    icon={<CheckCircleOutlined />}
                >
                    Approve
                </Button>,
                <Button key="close" onClick={onClose} size="large">Close</Button>
            ];
        }

        // Check for reschedule request waiting for department approval confirmation
        const isRescheduleStatus = reservationDetails?.status_name === "Reschedule";
        const isChangeRequestStatus = reservationDetails?.status_name === "Change Request";
        const rescheduleApproval = reservationDetails?.status_history?.find(
            status => status.status_name === 'Pending'
        );
        const isRescheduleWaitingConfirmation = isRescheduleStatus && 
            rescheduleApproval && 
            rescheduleApproval.reservation_active === 0;

        // If reschedule is waiting for department approval confirmation, disable all buttons
        // BUT if it's Change Request status, allow department approval buttons
        if (isRescheduleWaitingConfirmation && !isChangeRequestStatus) {
            return [
                <div key="reschedule-waiting" className="flex flex-col space-y-2">
        
                    {/* <div className="flex justify-center">
                        <Button key="close" onClick={onClose} size="large">Close</Button>
                    </div> */}
                </div>
            ];
        }

        // Find the current pending approval
        const currentPendingApproval = reservationDetails?.status_history?.find(
            status => status.status_name === 'Pending' && status.reservation_active === 0
        );
        
        // Find the current approver from approval sequence
        const currentApprover = reservationDetails?.approval_sequence?.find(approver => !approver.has_approved);
        const isCurrentSequenceApprover = currentApprover && String(currentApprover.users_id) === String(currentUserId);
        
        const adminApproval = currentPendingApproval;
        const departmentApproval = currentPendingApproval;

        // Use approval sequence to determine if user is current approver, fallback to old logic
        const isAdminApprover = isCurrentSequenceApprover || !!(adminApproval && String(adminApproval.reservation_users_id) === String(currentUserId));
        const isDepartmentApprover = isCurrentSequenceApprover || !!(departmentApproval && String(departmentApproval.reservation_users_id) === String(currentUserId));
        const isAdminPending = adminApproval?.reservation_active === 0;
        const isDepartmentPending = departmentApproval?.reservation_active === 0;
        
        // Check if current user is part of the current pending approval stage
        // Fixed logic to ensure buttons show for both admin and department approvers
        // Now also check if admin has already approved or declined based on status names
        // For Change Request status, enable department approval buttons again
        const isAdminAlreadyApproved = false;
        const isAdminAlreadyDeclined = false;
        const isChangeRequestForApproval = reservationDetails?.status_name === "Change Request";
        // Check if current user is the last approver in the sequence
        const isLastSequenceApproverForPending = reservationDetails?.approval_sequence && 
            reservationDetails?.approval_sequence?.length > 0 && 
            parseInt(reservationDetails?.approval_sequence[reservationDetails?.approval_sequence?.length - 1]?.users_id, 10) === currentUserId;
        console.log("isLastSequenceApproverForPending", isLastSequenceApproverForPending);
        
        // Check if all approvers in the sequence have approved for Change Request
        const allSequenceApproversApprovedForPending = reservationDetails?.approval_sequence && 
            reservationDetails?.approval_sequence?.length > 0 && 
            reservationDetails?.approval_sequence?.every(approver => approver.has_approved === true);
        
        // Check if current user is in the approval sequence for Change Request (for pending stage)
        const isCurrentUserInApprovalSequenceForPending = reservationDetails?.approval_sequence && 
            reservationDetails?.approval_sequence?.some(approver => parseInt(approver.users_id, 10) === currentUserId);
        
        const isCurrentUserPartOfPendingStage = (
            (isAdminPending && isAdminApprover) || 
            (isDepartmentPending && isDepartmentApprover && (isAdminAlreadyApproved || isAdminAlreadyDeclined)) ||
            (isChangeRequestForApproval && isLastSequenceApproverForPending)
        );
        
        // Debug logging for pending stage logic
        if (isChangeRequestForApproval) {
            console.log('Pending Stage Debug:', {
                isCurrentUserPartOfPendingStage,
                isAdminPending,
                isAdminApprover,
                isDepartmentPending,
                isDepartmentApprover,
                isAdminAlreadyApproved,
                isAdminAlreadyDeclined,
                isLastSequenceApproverForPending,
                allSequenceApproversApprovedForPending,
                isCurrentUserInApprovalSequenceForPending
            });
        }

        const priorityCheck = checkPriority();
        const isExpired = new Date(reservationDetails?.reservation_end_date) < new Date();
        
        // Check if current user can bypass venue availability restrictions
        const currentUserLevel = reservationDetails?.user_level_name || '';
        const currentUserDepartment = reservationDetails?.department_name || '';
        const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
        const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
        const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
        
        const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails.venues && reservationDetails.venues.some(v => v.isAvailable === false);
        // Department Approval Progress gating: Admin waits until all department approvers finish
        const hasDeptProgress = Array.isArray(deansApproval) && deansApproval.length > 0;
        const allDeptProgressApproved = !hasDeptProgress || deansApproval.every(a => a.is_approved === 1 || a.is_approved === '1');
        
        // If the logged-in approver has already taken action (Approved), do not show action buttons again
        // EXCEPTION: For Change Request status, always show buttons since it's a new proposal
        const hasUserAlreadyApproved = !isChangeRequestForApproval && (
            (adminApproval && String(adminApproval.reservation_users_id) === String(currentUserId) && adminApproval.reservation_active === 1) ||
            (departmentApproval && String(departmentApproval.reservation_users_id) === String(currentUserId) && departmentApproval.reservation_active === 1)
        );
        if (hasUserAlreadyApproved) {
            return [
                <Button key="close" onClick={onClose} size="large">Close</Button>
            ];
        }

        // If current user is not part of the pending approval stage, hide action buttons
        // Exception: If admin has already approved/declined and it's department approver's turn, show only decline button
        // Exception: For Change Request, if user is last approver in sequence or part of the approval sequence, always allow buttons
        if (!isCurrentUserPartOfPendingStage && !(isChangeRequestForApproval && (isLastSequenceApproverForPending || isCurrentUserInApprovalSequenceForPending))) {

            
            // If admin already approved or declined and current user is department approver, show only decline button
            if ((isAdminAlreadyApproved || isAdminAlreadyDeclined) && isDepartmentApprover) {
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                        Decline
                    </Button>,
                    <Button key="close" onClick={onClose} size="large">Close</Button>
                ];
            }
            
            return [
                <Button key="close" onClick={onClose} size="large">Close</Button>
            ];
        }

        // Base case for expired requests
        if (isExpired) {
            return [
                isAdminApprover
                    ? (
                        isAdminPending
                            ? (
                                <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); if (typeof onDecline === 'function') { onDecline(); } }} size="large" icon={<CloseCircleOutlined />}>
                                    Decline
                                </Button>
                            )
                            : (
                                <Button key="close" onClick={onClose} size="large">Close</Button>
                            )
                    )
                    : (
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>
                    )
            ];
        }

        // Handle Change Request status specifically
        const isLastSequenceApprover = reservationDetails?.approval_sequence && 
            reservationDetails?.approval_sequence?.length > 0 && 
            parseInt(reservationDetails?.approval_sequence[reservationDetails?.approval_sequence?.length - 1]?.users_id, 10) === footerCurrentUserId;
        
        // Check if all approvers in the sequence have approved
        const allSequenceApproversApproved = reservationDetails?.approval_sequence && 
            reservationDetails?.approval_sequence?.length > 0 && 
            reservationDetails?.approval_sequence?.every(approver => approver.has_approved === true);
        
        // Check if current user is in the approval sequence for Change Request
        const isCurrentUserInApprovalSequence = reservationDetails?.approval_sequence && 
            reservationDetails?.approval_sequence?.some(approver => parseInt(approver.users_id, 10) === footerCurrentUserId);
            
        
        // Debug logging for Change Request button logic
        if (isChangeRequestForApproval) {
            console.log('Change Request Debug:', {
                isChangeRequestForApproval,
                currentUserId: footerCurrentUserId,
                approvalSequence: reservationDetails?.approval_sequence,
                isLastSequenceApprover,
                allSequenceApproversApproved,
                isCurrentUserInApprovalSequence,
                shouldShowButtons: isLastSequenceApprover
            });
        }

        console.log("The last approver", isLastSequenceApprover)
        
        // Always show buttons for the last approver in the sequence
        // For Change Request, show for any user in the approval sequence
        if (isLastSequenceApprover) {
            // Require driver selection before rescheduling when vehicles exist
            const hasVehicles = Array.isArray(reservationDetails?.vehicles) && reservationDetails?.vehicles?.length > 0;
            const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails?.vehicles?.every(vehicle => {
                // Check existing assignment
                const existingDriver = (reservationDetails?.drivers || [])?.find(driver =>
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                    (driver.driver_id || driver.driver_name)
                );
                if (existingDriver) return true;
                // Check new assignment in current session
                const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                const customDriverName = customDriverNames[vehicle.vehicle_id];
                // If 'custom' is selected, check if custom name is filled; otherwise check if driver is assigned
                return assignedDriverId === 'custom' 
                    ? (customDriverName && customDriverName.trim() !== '')
                    : !!assignedDriverId;
            });

            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                    Decline
                </Button>,
                <>
                    <Button
                        key="reschedule"
                        type="default"
                        onClick={() => {
                            // Extract resource IDs and quantities from reservationDetails (from fetchRequestById)
                            // For Change Request status, include both original and change IDs
                            // This data will be passed to RescheduleModal for fetchAvailability calls
                            const isChangeRequest = reservationDetails?.status_name === "Change Request";
                            
                            console.log('[ViewRequest] Opening RescheduleModal with fetchRequestById data:', {
                                isChangeRequest,
                                venues: reservationDetails?.venues,
                                vehicles: reservationDetails?.vehicles,
                                equipment: reservationDetails?.equipment
                            });
                            
                            // Extract venue_id from venues array
                            const resources = {
                                venueIds: (reservationDetails?.venues || [])?.map(v => {
                                    if (isChangeRequest) {
                                        // For Change Request, create object with both original and change IDs
                                        // RescheduleModal will check availability for BOTH venue_id and change_venue_id
                                        return {
                                            venue_id: v.venue_id || v.ven_id, // Support both field names
                                            change_venue_id: v.change_venue_id || null,
                                            reservation_venue_id: v.reservation_venue_id,
                                            change_venue_event_type: v.change_venue_event_type || v.event_type
                                        };
                                    }
                                    // Return just the venue_id for fetchAvailability
                                    return v.venue_id || v.ven_id;
                                }),
                                // Extract vehicle_id from vehicles array
                                vehicleIds: (reservationDetails?.vehicles || [])?.map(v => {
                                    if (isChangeRequest) {
                                        // For Change Request, create object with both original and change IDs
                                        // RescheduleModal will check availability for BOTH vehicle_id and change_vehicle_id
                                        return {
                                            vehicle_id: v.vehicle_id,
                                            change_vehicle_id: v.change_vehicle_id || null,
                                            reservation_vehicle_id: v.reservation_vehicle_id
                                        };
                                    }
                                    // Return just the vehicle_id for fetchAvailability
                                    return v.vehicle_id;
                                }),
                                // Extract equipment_id and quantity from equipment array
                                equipment: (reservationDetails?.equipment || [])?.map(eq => ({
                                    equipment_id: eq.equipment_id || eq.equip_id, // Support both field names
                                    name: eq.name || eq.equipment_name,
                                    quantity: parseInt(eq.quantity, 10) || 0
                                }))
                            };
                            
                            console.log('[ViewRequest] Extracted resource IDs for fetchAvailability:', {
                                venueIds: resources.venueIds,
                                vehicleIds: resources.vehicleIds,
                                equipment: resources.equipment.map(e => ({ id: e.equipment_id, name: e.name, qty: e.quantity }))
                            });
                            
                            setRescheduleResources(resources);
                            setIsRescheduleModalOpen(true);
                        }}
                        size="large"
                        className="mr-2"
                        icon={<ScheduleOutlined />}
                        disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                    >
                        Reschedule
                    </Button>
                    <RescheduleModal
                        visible={isRescheduleModalOpen}
                        onCancel={() => setIsRescheduleModalOpen(false)}
                        reservation={reservationDetails}
                        resources={rescheduleResources}
                        onReschedule={async (newDates) => {
                            console.log('[ViewRequest] ===== onReschedule ENTRY POINT =====');
                            console.log('[ViewRequest] onReschedule called with:', newDates);
                            try {
                                const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts } = newDates || {};
                                console.log('[ViewRequest] Destructured values:', { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts });

                                // Step 0: If overriding conflicts, handle conflicting reservations first
                                if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                    console.log('Processing conflict override for COO Department Head', {
                                        conflictingUsers: conflictData.reservation_users,
                                        unavailableVenues: conflictData.unavailable_venues,
                                        unavailableVehicles: conflictData.unavailable_vehicles
                                    });
                                    
                                    // Handle conflicting reservations by rescheduling them
                                    try {
                                        const overrideResponse = await axios.post(`${encryptedUrl}/Admin.php`, {
                                            operation: 'handleRequest',
                                            reservation_id: reservationDetails?.reservation_id,
                                            is_accepted: true,
                                            user_id: SecureStorage.getLocalItem("user_id"),
                                            override_lower_priority: true,
                                            reschedule_mode: true,
                                            new_start_datetime: startDate,
                                            new_end_datetime: endDate
                                        });

                                        if (overrideResponse.data?.status !== 'success') {
                                            toast.error('Failed to override conflicting reservations');
                                            return;
                                        }
                                    } catch (overrideError) {
                                        console.error('Error overriding conflicts:', overrideError);
                                        toast.error('Failed to override conflicting reservations');
                                        return;
                                    }
                                }

                                // Step 1: If dates provided, update reservation dates only
                                let didUpdateSomething = false;
                                console.log('[ViewRequest] Checking if dates provided:', { startDate, endDate, hasStartDate: !!startDate, hasEndDate: !!endDate });
                                if (startDate && endDate) {
                                    // Use NEW venue/vehicle IDs if changing resources, otherwise use current ones
                                    const venueIds = newVenueIds && newVenueIds.length > 0 
                                        ? newVenueIds 
                                        : (reservationDetails?.venues?.map(v => v.venue_id) || []);
                                    const vehicleIds = newVehicleIds && newVehicleIds.length > 0 
                                        ? newVehicleIds 
                                        : (reservationDetails?.vehicles?.map(v => v.vehicle_id) || []);
                                    
                                    console.log('[Sequential Approval] Sending conflict check with:', { venueIds, vehicleIds, newVenueIds, newVehicleIds });
                                    
                                    const dateResp = await axios.post(`${encryptedUrl}reservation.php`, {
                                        operation: 'updateReservationReschedule',
                                        reservation_id: reservationDetails?.reservation_id,
                                        reschedule_start_date: startDate,
                                        reschedule_end_date: endDate,
                                        user_admin_id: SecureStorage.getLocalItem('user_id'),
                                        venue_ids: venueIds,
                                        vehicle_ids: vehicleIds
                                    }, { headers: { 'Content-Type': 'application/json' } });
                                    if (!(dateResp?.data?.status === 'success')) {
                                        await handleRescheduleError(dateResp, reservationDetails?.reservation_id, () => setIsRescheduleModalOpen(false));
                                        return;
                                    }
                                    didUpdateSomething = true;
                                }

                                // Step 1.5: Handle equipment units insertion for non-Change Request reschedules
                                const isChangeRequest = reservationDetails?.status_name === "Change Request";
                                console.log('[ViewRequest] Checking equipment handling:', {
                                    isChangeRequest,
                                    hasEquipment: !!(reservationDetails?.equipment && reservationDetails?.equipment?.length > 0),
                                    equipment: reservationDetails?.equipment
                                });
                                
                                // Equipment units handling removed

                                // Step 2: Process venue changes with minimal payload per change (no dates)
                                const currentVenues = Array.isArray(reservationDetails?.venues) ? reservationDetails?.venues : [];
                                
                                console.log('[ViewRequest] Processing venue changes:', {
                                    currentVenues,
                                    newVenueIds,
                                    hasNewVenueIds: !!(newVenueIds && Array.isArray(newVenueIds) && newVenueIds.length > 0)
                                });
                                
                                if (newVenueIds && Array.isArray(newVenueIds) && newVenueIds.length > 0) {
                                    const venue_changes = currentVenues
                                        .map((v, idx) => {
                                            const newId = newVenueIds[idx];
                                            // Only process if newId is explicitly provided and different from current
                                            if (newId == null || newId === undefined || String(newId) === String(v.venue_id)) return null;
                                            return {
                                                reservation_venue_id: v.reservation_venue_id,
                                                reservation_change_venue_id: Number(newId)
                                            };
                                        })
                                        .filter(Boolean);

                                    console.log('[ViewRequest] Venue changes to process:', venue_changes);
                                    if (venue_changes.length > 0) {
                                        console.log('[ViewRequest] Executing updateVenueReschedule');
                                        const requests = venue_changes.map(change => {
                                            console.log('[ViewRequest] Making venue reschedule request:', change);
                                            return axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateVenueReschedule',
                                                reservation_venue_id: change.reservation_venue_id,
                                                reservation_change_venue_id: change.reservation_change_venue_id
                                            }, { headers: { 'Content-Type': 'application/json' } });
                                        });
                                        
                                        const results = await Promise.allSettled(requests);
                                        const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                                        if (!allOk) {
                                            const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                                                || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                                                || 'Failed to reschedule venue';
                                            toast.error(firstError);
                                            return;
                                        }
                                        didUpdateSomething = true;
                                    }
                                }

                                // Step 3: Process vehicle changes with minimal payload per change (no dates)
                                const currentVehicles = Array.isArray(reservationDetails?.vehicles) ? reservationDetails?.vehicles : [];
                                
                                console.log('[ViewRequest] Processing vehicle changes:', {
                                    currentVehicles,
                                    newVehicleIds,
                                    hasNewVehicleIds: !!(newVehicleIds && Array.isArray(newVehicleIds) && newVehicleIds.length > 0)
                                });
                                
                                if (newVehicleIds && Array.isArray(newVehicleIds) && newVehicleIds.length > 0) {
                                    const vehicle_changes = currentVehicles
                                        .map((v, idx) => {
                                            const newId = newVehicleIds[idx];
                                            // Only process if newId is explicitly provided and different from current
                                            if (newId == null || newId === undefined || String(newId) === String(v.vehicle_id)) return null;
                                            return {
                                                reservation_vehicle_id: v.reservation_vehicle_id,
                                                reservation_change_vehicle_id: Number(newId)
                                            };
                                        })
                                        .filter(Boolean);

                                    console.log('[ViewRequest] Vehicle changes to process:', vehicle_changes);
                                    if (vehicle_changes.length > 0) {
                                        console.log('[ViewRequest] Executing updateVehicleReschedule');
                                        const requests = vehicle_changes.map(change => {
                                            console.log('[ViewRequest] Making vehicle reschedule request:', change);
                                            return axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateVehicleReschedule',
                                                reservation_vehicle_id: change.reservation_vehicle_id,
                                                reservation_change_vehicle_id: change.reservation_change_vehicle_id
                                            }, { headers: { 'Content-Type': 'application/json' } });
                                        });
                                        
                                        const results = await Promise.allSettled(requests);
                                        const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                                        if (!allOk) {
                                            const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                                                || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                                                || 'Failed to reschedule vehicle';
                                            toast.error(firstError);
                                            return;
                                        }
                                        didUpdateSomething = false;
                                    }
                                }

                                // Final success handling
                                if (didUpdateSomething) {
                                    toast.success('Reservation rescheduled successfully!', {
                                        icon: '✅',
                                        duration: 3000,
                                    });
                                  
                                } else {
                                    console.log('[ViewRequest] No changes were made during reschedule');
                                    toast.info('No changes were made to the reservation.');
                                    setIsRescheduleModalOpen(false);
                                }
                            } catch (error) {
                                console.error('[ViewRequest] Error in onReschedule:', error);
                                toast.error(`Error rescheduling reservation: ${error.response?.data?.message || error.message}`);
                            }
                        }}
                        reservationId={reservationDetails?.reservation_id}
                        currentStartDate={reservationDetails?.reschedule_start_date || reservationDetails?.reservation_start_date}
                        currentEndDate={reservationDetails?.reschedule_end_date || reservationDetails?.reservation_end_date}
                    
                    />
                </>,
                <Button
                    key="accept"
                    type="primary"
                    loading={isAccepting}
                    onClick={handleAcceptWithDriverCheck}
                    size="large"
                    icon={<CheckCircleOutlined />}
                    disabled={!priorityCheck.hasPriority || anyVenueNotAvailable || (hasVehicles && !allVehiclesHaveDriverAssigned) || !allDeptProgressApproved}
                    className="bg-green-900 hover:bg-lime-900"
                >
                    Confirm
                </Button>,
            ];
        }

        // Sequential Approval Logic
        if (adminApproval && departmentApproval) {

            // Admin must approve first
            if (adminApproval.reservation_active === 0) {
                if (isAdminApprover) {
                    // If department progress is not fully approved, admin must wait
                    if (!allDeptProgressApproved) {
                        return [
                            <Button key="waiting_dept_progress" disabled>Waiting for Department Approval Progress</Button>
                        ];
                    }
                    return [
                        // Admin decline should NOT open the decline reason modal
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); if (typeof onDecline === 'function') { onDecline(); } }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <Button
                            key="accept"
                            type="primary"
                            loading={isAccepting}
                            onClick={handleAcceptWithoutDriverCheck}
                            size="large"
                            icon={<CheckCircleOutlined />}
                            disabled={!priorityCheck.hasPriority || anyVenueNotAvailable || !allDeptProgressApproved}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            Approve
                        </Button>,
                    ];
                }
                return [<Button key="waiting_admin" disabled>Waiting for Admin Approval</Button>];
            }

            // After admin approval is complete, it's Department's turn
            // Check if admin has approved based on status history
            const isAdminApproved = false;
            const isAdminDeclined = false;
            
            if ((isAdminApproved || isAdminDeclined) && departmentApproval.reservation_active === 0) {
                if (isDepartmentApprover) {
                    // When admin has already approved or declined, department approver should only see decline button
                    const isAdminDeclined = false;
                    
                    if (isAdminDeclined) {
                        // If admin declined, department approver should only see decline button
                        return [
                            <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                                Decline
                            </Button>,
                            <Button key="close" onClick={onClose} size="large">Close</Button>
                        ];
                    }
                    
                    // Require driver selection before rescheduling when vehicles exist
                    const hasVehicles = Array.isArray(reservationDetails?.vehicles) && reservationDetails?.vehicles?.length > 0;
                    const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails?.vehicles?.every(vehicle => {
                        // Check existing assignment
                        const existingDriver = (reservationDetails?.drivers || [])?.find(driver =>
                            driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                            (driver.driver_id || driver.driver_name)
                        );
                        if (existingDriver) return true;
                        // Check new assignment in current session
                        const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                        const customDriverName = customDriverNames[vehicle.vehicle_id];
                        // If 'custom' is selected, check if custom name is filled; otherwise check if driver is assigned
                        return assignedDriverId === 'custom' 
                            ? (customDriverName && customDriverName.trim() !== '')
                            : !!assignedDriverId;
                    });
                    return [
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <>
                            <Button
                                key="reschedule"
                                type="default"
                                onClick={() => {
                                    // Extract resource IDs and quantities from reservationDetails
                                    // For Change Request status, include both original and change IDs
                                    const isChangeRequest = reservationDetails?.status_name === "Change Request";
                                    
                                    const resources = {
                                        venueIds: (reservationDetails?.venues || [])?.map(v => {
                                            if (isChangeRequest) {
                                                // For Change Request, create object with both original and change IDs
                                                return {
                                                    venue_id: v.venue_id,
                                                    change_venue_id: v.change_venue_id || null,
                                                    reservation_venue_id: v.reservation_venue_id
                                                };
                                            }
                                            return v.venue_id;
                                        }),
                                        vehicleIds: (reservationDetails?.vehicles || [])?.map(v => {
                                            if (isChangeRequest) {
                                                // For Change Request, create object with both original and change IDs
                                                return {
                                                    vehicle_id: v.vehicle_id,
                                                    change_vehicle_id: v.change_vehicle_id || null,
                                                    reservation_vehicle_id: v.reservation_vehicle_id
                                                };
                                            }
                                            return v.vehicle_id;
                                        }),
                                        equipment: (reservationDetails?.equipment || [])?.map(eq => ({
                                            equipment_id: eq.equipment_id,
                                            quantity: parseInt(eq.quantity, 10) || 0
                                        }))
                                    };
                                    setRescheduleResources(resources);
                                    setIsRescheduleModalOpen(true);
                                }}
                                size="large"
                                className="mr-2"
                                icon={<ScheduleOutlined />}
                                disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                            >
                                Reschedule
                            </Button>
                            <RescheduleModal
                                visible={isRescheduleModalOpen}
                                onCancel={() => setIsRescheduleModalOpen(false)}
                                reservation={reservationDetails}
                                onReschedule={async (newDates) => {
                                    console.log('[ViewRequest] ===== onReschedule ENTRY POINT =====');
                                    console.log('[ViewRequest] onReschedule called with:', newDates);
                                    try {
                                        const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts } = newDates || {};
                                        console.log('[ViewRequest] Destructured values:', { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts });

                                        // Step 0: If overriding conflicts, handle conflicting reservations first
                                        if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                            console.log('Processing conflict override for COO Department Head', {
                                                conflictingUsers: conflictData.reservation_users,
                                                unavailableVenues: conflictData.unavailable_venues,
                                                unavailableVehicles: conflictData.unavailable_vehicles
                                            });
                                            
                                            // Handle conflicting reservations by rescheduling them
                                            try {
                                                const overrideResponse = await axios.post(`${encryptedUrl}/Admin.php`, {
                                                    operation: 'handleRequest',
                                                    reservation_id: reservationDetails?.reservation_id,
                                                    is_accepted: true,
                                                    user_id: SecureStorage.getLocalItem("user_id"),
                                                    override_lower_priority: true,
                                                    reschedule_mode: true,
                                                    new_start_datetime: startDate,
                                                    new_end_datetime: endDate
                                                });

                                                if (overrideResponse.data?.status !== 'success') {
                                                    toast.error('Failed to override conflicting reservations');
                                                    return;
                                                }
                                            } catch (overrideError) {
                                                console.error('Error overriding conflicts:', overrideError);
                                                toast.error('Failed to override conflicting reservations');
                                                return;
                                            }
                                        }

                                        // Step 1: If dates provided, update reservation dates only
                                        let didUpdateSomething = false;
                                        console.log('[ViewRequest] Checking if dates provided:', { startDate, endDate, hasStartDate: !!startDate, hasEndDate: !!endDate });
                                        if (startDate && endDate) {
                                            // Use NEW venue/vehicle IDs if changing resources, otherwise use current ones
                                            const venueIds = newVenueIds && newVenueIds.length > 0 
                                                ? newVenueIds 
                                                : (reservationDetails?.venues?.map(v => v.venue_id) || []);
                                            const vehicleIds = newVehicleIds && newVehicleIds.length > 0 
                                                ? newVehicleIds 
                                                : (reservationDetails?.vehicles?.map(v => v.vehicle_id) || []);
                                            
                                            console.log('[Department Approval] Sending conflict check with:', { venueIds, vehicleIds, newVenueIds, newVehicleIds });
                                            
                                            const dateResp = await axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateReservationReschedule',
                                                reservation_id: reservationDetails?.reservation_id,
                                                reschedule_start_date: startDate,
                                                reschedule_end_date: endDate,
                                                user_admin_id: SecureStorage.getLocalItem('user_id'),
                                                venue_ids: venueIds,
                                                vehicle_ids: vehicleIds
                                            }, { headers: { 'Content-Type': 'application/json' } });
                                            if (!(dateResp?.data?.status === 'success')) {
                                                await handleRescheduleError(dateResp, reservationDetails?.reservation_id, () => setIsRescheduleModalOpen(false));
                                                return;
                                            }
                                            didUpdateSomething = true;
                                        }

                                        // Step 1.5: Handle equipment units insertion for non-Change Request reschedules
                                        const isChangeRequest = reservationDetails?.status_name === "Change Request";
                                        console.log('[ViewRequest] Checking equipment handling:', {
                                            isChangeRequest,
                                            hasEquipment: !!(reservationDetails?.equipment && reservationDetails.equipment.length > 0),
                                            equipment: reservationDetails?.equipment
                                        });
                                        
                                        // Equipment units handling removed

                                        // Step 2: Process venue changes with minimal payload per change (no dates)
                                        const currentVenues = Array.isArray(reservationDetails?.venues) ? reservationDetails.venues : [];
                                        
                                        console.log('[ViewRequest] Processing venue changes:', {
                                            currentVenues: currentVenues.map(v => ({ venue_id: v.venue_id, venue_name: v.venue_name, reservation_venue_id: v.reservation_venue_id })),
                                            newVenueIds,
                                            newVenueIdsType: typeof newVenueIds,
                                            isArray: Array.isArray(newVenueIds),
                                            newVenueIdsLength: Array.isArray(newVenueIds) ? newVenueIds.length : 'N/A',
                                            newVenueIdsContent: newVenueIds
                                        });
                                        
                                        const venue_changes = currentVenues
                                            .map((v, idx) => {
                                                const newId = Array.isArray(newVenueIds) ? newVenueIds[idx] : null;
                                                
                                                console.log(`[ViewRequest] Venue ${idx}:`, {
                                                    currentVenueId: v.venue_id,
                                                    currentVenueName: v.venue_name,
                                                    reservationVenueId: v.reservation_venue_id,
                                                    newId,
                                                    newIdType: typeof newId,
                                                    isNull: newId == null,
                                                    isUndefined: newId === undefined,
                                                    isSame: String(newId) === String(v.venue_id),
                                                    willProcess: newId != null && newId !== undefined && String(newId) !== String(v.venue_id)
                                                });
                                                
                                                // Only process if newId is explicitly provided and different from current
                                                if (newId == null || newId === undefined || String(newId) === String(v.venue_id)) return null;
                                                return {
                                                    reservation_venue_id: v.reservation_venue_id,
                                                    reservation_change_venue_id: Number(newId)
                                                };
                                            })
                                            .filter(Boolean);

                                        console.log('[ViewRequest] Venue changes to process:', venue_changes);

                                        if (venue_changes.length > 0) {
                                            console.log('[ViewRequest] Executing updateVenueReschedule for', venue_changes.length, 'venues');
                                            const requests = venue_changes.map(change => {
                                                console.log('[ViewRequest] Making updateVenueReschedule request:', change);
                                                return axios.post(`${encryptedUrl}reservation.php`, {
                                                    operation: 'updateVenueReschedule',
                                                    reservation_venue_id: change.reservation_venue_id,
                                                    reservation_change_venue_id: change.reservation_change_venue_id
                                                }, { headers: { 'Content-Type': 'application/json' } });
                                            });
                                            const results = await Promise.allSettled(requests);
                                            console.log('[ViewRequest] updateVenueReschedule results:', results.map(r => ({
                                                status: r.status,
                                                data: r.status === 'fulfilled' ? r.value?.data : r.reason
                                            })));
                                            const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                                            if (!allOk) {
                                                const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                                                    || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                                                    || 'Failed to reschedule reservation';
                                                console.error('[ViewRequest] updateVenueReschedule failed:', firstError);
                                                toast.error(firstError);
                                                return;
                                            }
                                            console.log('[ViewRequest] updateVenueReschedule completed successfully');
                                            didUpdateSomething = true;
                                        } else {
                                            console.log('[ViewRequest] No venue changes to process');
                                        }

                                        // Step 3: Process vehicle changes (map reservation_vehicle_id -> selected vehicle_id)
                                        const currentVehicles = Array.isArray(reservationDetails?.vehicles) ? reservationDetails.vehicles : [];
                                        
                                        console.log('[ViewRequest] Processing vehicle changes:', {
                                            currentVehicles: currentVehicles.map(v => ({ vehicle_id: v.vehicle_id, vehicle_model_name: v.vehicle_model_name, reservation_vehicle_id: v.reservation_vehicle_id })),
                                            newVehicleIds,
                                            newVehicleIdsType: typeof newVehicleIds,
                                            isArray: Array.isArray(newVehicleIds),
                                            newVehicleIdsLength: Array.isArray(newVehicleIds) ? newVehicleIds.length : 'N/A',
                                            newVehicleIdsContent: newVehicleIds
                                        });
                                        
                                        const vehicle_changes = currentVehicles
                                            .map((v, idx) => {
                                                const newId = Array.isArray(newVehicleIds) ? newVehicleIds[idx] : null;
                                                
                                                console.log(`[ViewRequest] Vehicle ${idx}:`, {
                                                    currentVehicleId: v.vehicle_id,
                                                    currentVehicleName: v.vehicle_model_name,
                                                    reservationVehicleId: v.reservation_vehicle_id,
                                                    newId,
                                                    newIdType: typeof newId,
                                                    isNull: newId == null,
                                                    isUndefined: newId === undefined,
                                                    isSame: String(newId) === String(v.vehicle_id),
                                                    willProcess: newId != null && newId !== undefined && String(newId) !== String(v.vehicle_id)
                                                });
                                                
                                                // Only process if newId is explicitly provided and different from current
                                                if (newId == null || newId === undefined || String(newId) === String(v.vehicle_id)) return null;
                                                return {
                                                    reservation_vehicle_id: v.reservation_vehicle_id,
                                                    // Use vehicle_id as reservation_change_vehicle_id per backend contract
                                                    reservation_change_vehicle_id: Number(newId)
                                                };
                                            })
                                            .filter(Boolean);

                                        console.log('[ViewRequest] Vehicle changes to process:', vehicle_changes);
                                        
                                        if (vehicle_changes.length > 0) {
                                            console.log('[ViewRequest] Executing updateVehicleReschedule for', vehicle_changes.length, 'vehicles');
                                            const requests = vehicle_changes.map(change => {
                                                console.log('[ViewRequest] Making updateVehicleReschedule request:', change);
                                                return axios.post(`${encryptedUrl}reservation.php`, {
                                                    operation: 'updateVehicleReschedule',
                                                    reservation_vehicle_id: change.reservation_vehicle_id,
                                                    reservation_change_vehicle_id: change.reservation_change_vehicle_id
                                                }, { headers: { 'Content-Type': 'application/json' } });
                                            });
                                            const results = await Promise.allSettled(requests);
                                            console.log('[ViewRequest] updateVehicleReschedule results:', results.map(r => ({
                                                status: r.status,
                                                data: r.status === 'fulfilled' ? r.value?.data : r.reason
                                            })));
                                            const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                                            if (!allOk) {
                                                const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                                                    || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                                                    || 'Failed to reschedule reservation vehicles';
                                                console.error('[ViewRequest] updateVehicleReschedule failed:', firstError);
                                                toast.error(firstError);
                                                return;
                                            }
                                            console.log('[ViewRequest] updateVehicleReschedule completed successfully');
                                            didUpdateSomething = true;
                                        } else {
                                            console.log('[ViewRequest] No vehicle changes to process');
                                        }

                                        if (!didUpdateSomething) {
                                            toast.info('No changes to update.');
                                            return;
                                        }

                                        // After reschedule, persist driver assignments if vehicles exist
                                        if (Array.isArray(reservationDetails.vehicles) && reservationDetails.vehicles.length > 0) {
                                            try {
                                                for (const vehicle of reservationDetails.vehicles) {
                                                    const existingDriver = (reservationDetails.drivers || []).find(driver =>
                                                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                                                        (driver.driver_id || driver.driver_name)
                                                    );
                                                    if (!existingDriver) {
                                                        const driverId = vehicleDriverAssignments[vehicle.vehicle_id];
                                                        if (driverId !== undefined) {
                                                            let driverName = null;
                                                            if (driverId === null) {
                                                                // Calculate driver number for "No Driver Available" cases
                                                                const vehicleIndex = reservationDetails.vehicles.findIndex(v => String(v.vehicle_id) === String(vehicle.vehicle_id));
                                                                driverName = `driver ${vehicleIndex + 1}`;
                                                            } else if (driverId === 'custom') {
                                                                // Use custom driver name
                                                                driverName = customDriverNames[vehicle.vehicle_id] || null;
                                                            }
                                                            
                                                            // Check if there's an existing driver assignment for this vehicle
                                                            const existingDriverForUpdate = (reservationDetails.drivers || []).find(driver => 
                                                                driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                                                            );
                                                            
                                                            // Prepare payload
                                                            const payload = {
                                                                operation: 'insertDriver',
                                                                reservation_driver_user_id: driverId,
                                                                reservation_vehicle_id: vehicle.reservation_vehicle_id,
                                                                driver_name: driverName
                                                            };
                                                            
                                                            // If there's an existing driver assignment, include the reservation_driver_id for update
                                                            if (existingDriverForUpdate && existingDriverForUpdate.reservation_driver_id) {
                                                                payload.reservation_driver_id = existingDriverForUpdate.reservation_driver_id;
                                                            }
                                                            
                                                            // Debug logging
                                                            console.log('Frontend insertDriver payload (reschedule):', payload);
                                                            
                                                            await axios.post(`${encryptedUrl}/Admin.php`, payload);
                                                        }
                                                    }
                                                }
                                            } catch (err) {
                                                console.error('Error assigning drivers after reschedule:', err);
                                                toast.error('Failed to assign driver(s) after reschedule');
                                                return;
                                            }
                                        }

                                        // Success path
                                        toast.success('Reservation rescheduled successfully');
                                        
                                    } catch (error) {
                                        console.error('[ViewRequest] ===== ERROR IN onReschedule =====');
                                        console.error('[ViewRequest] Error during reschedule:', error);
                                        console.error('[ViewRequest] Error stack:', error.stack);
                                        toast.error('Error processing reschedule');
                                    }
                                    console.log('[ViewRequest] ===== onReschedule EXIT POINT =====');
                                }}
                            
                                resourceType={
                                    reservationDetails.venues?.length ? 'venue' : (
                                        reservationDetails.vehicles?.length ? 'vehicle' : 'equipment'
                                    )
                                }
                                resourceId={reservationDetails.venues?.[0]?.venue_id || reservationDetails.vehicles?.[0]?.vehicle_id}
                                resources={rescheduleResources}
                                originalStart={reservationDetails?.reservation_start_date}
                                originalEnd={reservationDetails?.reservation_end_date}
                            />
                        </>,
                        <Button
                            key="accept"
                            type="primary"
                            loading={isAccepting}
                            onClick={handleAcceptWithDriverCheck}
                            size="large"
                            icon={<CheckCircleOutlined />}
                            disabled={adminApproval?.reservation_active === -1 || !priorityCheck.hasPriority || anyVenueNotAvailable || !allDeptProgressApproved}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            Approve
                        </Button>,
                    ];
                }
                return [
                    <Button key="waiting dept" danger disabled={isDepartmentPending} onClick={(e) => { e.stopPropagation(); if (typeof onDecline === 'function') { onDecline(); } }} size="large" icon={<CloseCircleOutlined />}>
                        Waiting for Department Approval
                    </Button>
                ];
            }
        }

        // Fallback for other statuses or if the above logic doesn't apply
        if (reservationDetails.active === 0 || reservationDetails.active === 1) {
            // For admin approval: if current user is the admin approver and it's pending, allow approval
            // Otherwise, check if admin approval is already completed
            const adminSatisfied = adminApproval 
                ? (isAdminApprover && isAdminPending) || adminApproval.reservation_active === 1
                : true;
            
            // For department approval: if current user is the department approver and it's pending, allow approval
            // Otherwise, check if department approval is already completed or not required
            const departmentSatisfied = departmentApproval
                ? (isDepartmentApprover && isDepartmentPending) || (deansApproval.length === 0 ? true : departmentApproval.reservation_active === 1)
                : true;
            
            const approvalsSatisfied = adminSatisfied && departmentSatisfied;
            return [
                // Show decline: Admin (only if pending) skips modal; Department opens modal
                isAdminApprover
                    ? (isAdminPending ? (
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); if (typeof onDecline === 'function') { onDecline(); } }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>
                    ) : null)
                    : (
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>
                    ),
                (!isAdminApprover || isAdminPending) && (
                <Button
                    key="accept"
                    type="primary"
                    loading={isAccepting}
                    onClick={isAdminApprover ? handleAcceptWithoutDriverCheck : handleAcceptWithDriverCheck}
                    size="large"
                    icon={<CheckCircleOutlined />}
                    disabled={!approvalsSatisfied || !priorityCheck.hasPriority || anyVenueNotAvailable || !allDeptProgressApproved}
                    className="bg-green-900 hover:bg-lime-900"
                >
                    Approve
                </Button>
                ),
            ];
        }

        return [
            <Button key="close" onClick={onClose} size="large">
                Close
            </Button>
        ];
    };

    // Enhanced resource availability checking
    const getResourceAvailabilityInfo = (type, resourceId, resourceData = null) => {
        const availabilityData = reservationDetails.availabilityData;
        if (!availabilityData) return { isAvailable: true, conflictInfo: null };
        
        switch (type) {
            case 'venue':
                const unavailableVenue = availabilityData.unavailable_venues?.find(v => 
                    String(v.ven_id) === String(resourceId)
                );
                // Also check for class schedule conflicts
                const venueWithSchedule = reservationDetails.venues?.find(v => 
                    String(v.venue_id) === String(resourceId)
                );
                const hasClassScheduleConflict = venueWithSchedule?.hasClassScheduleConflict || false;
                
                return {
                    isAvailable: !unavailableVenue && !hasClassScheduleConflict,
                    conflictInfo: unavailableVenue ? {
                        reservedBy: unavailableVenue.reserved_by,
                        reservationTitle: unavailableVenue.reservation_title,
                        reservationId: unavailableVenue.reservation_id
                    } : (hasClassScheduleConflict ? {
                        conflictType: 'class_schedule'
                    } : null)
                };
            case 'vehicle':
                const unavailableVehicle = availabilityData.unavailable_vehicles?.find(v => 
                    String(v.vehicle_id) === String(resourceId)
                );
                return {
                    isAvailable: !unavailableVehicle,
                    conflictInfo: unavailableVehicle ? {
                        reservedBy: unavailableVehicle.reserved_by,
                        reservationTitle: unavailableVehicle.reservation_title,
                        reservationId: unavailableVehicle.reservation_id,
                        vehicleLicense: unavailableVehicle.vehicle_license,
                        vehicleMake: unavailableVehicle.vehicle_make_name,
                        vehicleModel: unavailableVehicle.vehicle_model_name
                    } : null
                };
            case 'equipment':
                const unavailableEquipment = availabilityData.unavailable_equipment?.find(e => 
                    String(e.equip_id) === String(resourceId)
                );
                if (!unavailableEquipment) return { isAvailable: true, conflictInfo: null };
                
                const requestedEquipment = reservationDetails.equipment?.find(e => 
                    String(e.equipment_id) === String(resourceId)
                );
                const requestedQuantity = requestedEquipment ? parseInt(requestedEquipment.quantity) : 0;
                const totalQuantity = parseInt(unavailableEquipment.total_quantity);
                const reservedQuantity = parseInt(unavailableEquipment.reserved_quantity);
                const availableQuantity = totalQuantity - reservedQuantity;
                const isAvailable = requestedQuantity <= availableQuantity;
                
                return {
                    isAvailable,
                    conflictInfo: {
                        totalQuantity,
                        reservedQuantity,
                        availableQuantity,
                        requestedQuantity,
                        reservationsInfo: unavailableEquipment.reservations_info
                    }
                };
            case 'driver':
                const unavailableDriver = availabilityData.unavailable_drivers?.find(d => 
                    String(d.users_id) === String(resourceId)
                );
                return {
                    isAvailable: !unavailableDriver,
                    conflictInfo: unavailableDriver ? {
                        driverName: unavailableDriver.full_name
                    } : null
                };
            default:
                return { isAvailable: true, conflictInfo: null };
        }
    };

    // Resource table columns definitions
    const columns = {
        venue: [
            {
                title: 'Venue Name',
                dataIndex: 'venue_name',
                key: 'venue_name',
                render: (text, record) => {
                    const availabilityInfo = getResourceAvailabilityInfo('venue', record.venue_id);
                    const hasVenueChange = record.change_venue_id && reservationDetails?.status_name === "Reschedule";
                    
                    return (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                                <BuildOutlined className="mr-3 text-purple-500" />
                                <div className="flex-1">
                                    {hasVenueChange ? (
                                        // Change request: show old -> new venue name with building
                                        <div className="space-y-2">
                                           
                                            <div className="flex items-center gap-3 py-1">
                                                <div className="text-xs text-gray-500 line-through">
                                                    <div>{record.ven_name || text}</div>
                                                    {record.venue_building_name && (
                                                        <div className="text-[10px] text-gray-400">
                                                            📍 {record.venue_building_name}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-gray-400">→</span>
                                                <div className="text-sm font-semibold text-green-700">
                                                    <div>{record.change_venue_name}</div>
                                                    {record.change_venue_building_name && (
                                                        <div className="text-xs text-green-600">
                                                            📍 {record.change_venue_building_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Regular request: show venue name with building
                                        <div>
                                            <span className="font-medium">{record.ven_name || text}</span>
                                            {record.venue_building_name && (
                                                <div className="text-xs text-gray-500">
                                                    📍 {record.venue_building_name}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                   
                                </div>
                            </div>
                            <div className="flex flex-col items-end ml-2">
                                <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'}>
                                    {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                                </Tag>
                            </div>
                        </div>
                    );
                }
            },
            {
                title: 'Participants',
                dataIndex: 'participants',
                key: 'participants',
                width: 120,
                render: (text) => (
                    <div className="flex items-center">
                        <UserOutlined className="mr-2 text-gray-500" />
                        <span className="font-medium">{text || 'Not specified'}</span>
                    </div>
                )
            }
        ],
        vehicle: [
            {
                title: 'Vehicle',
                dataIndex: 'model',
                key: 'model',
                render: (text, record) => {
                    const availabilityInfo = getResourceAvailabilityInfo('vehicle', record.vehicle_id);
                    const hasVehicleChange = record.change_vehicle_id && reservationDetails.status_name === "Reschedule";
                    
                    return (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                                <CarOutlined className="mr-3 text-blue-500" />
                                <div className="flex-1">
                                    {hasVehicleChange ? (
                                        // Show vehicle change: Original -> New
                                        <div className="space-y-2">
                                            <Tag color="orange" className="text-xs">
                                                ⚠️ Pending Change
                                            </Tag>
                                            <div className="flex items-center gap-3 py-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="font-mono line-through">{record.license}</span>
                                                    <span className="line-through">{record.model}</span>
                                                </div>
                                                <span className="text-gray-400">→</span>
                                                <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                                                    <span className="font-mono">{record.change_vehicle_license}</span>
                                                    <span>{record.change_vehicle_model}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Regular display
                                        <div className="flex items-center gap-2 text-sm text-gray-800">
                                            <span className="font-mono font-medium">{record.license}</span>
                                            <span className="font-medium">{record.model}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="ml-2">
                                <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'}>
                                    {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                                </Tag>
                            </div>
                        </div>
                    );
                }
            }
            
        ],
        equipment: [
            {
                title: 'Equipment',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => {
                    const availabilityInfo = getResourceAvailabilityInfo('equipment', record.equipment_id);
                    return (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <ToolOutlined className="mr-2 text-orange-500" />
                                <div>
                                    <span className="font-medium">{text}</span>
                                    {!availabilityInfo.isAvailable && availabilityInfo.conflictInfo && (
                                        <div className="text-xs text-red-600 mt-1">
                                            Available: {availabilityInfo.conflictInfo.availableQuantity} / {availabilityInfo.conflictInfo.totalQuantity}
                                            <br />
                                            Requested: {availabilityInfo.conflictInfo.requestedQuantity}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'}>
                                {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                            </Tag>
                        </div>
                    );
                }
            },
            {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity',
                render: (text, record) => {
                    const availabilityInfo = getResourceAvailabilityInfo('equipment', record.equipment_id);
                    return (
                        <div className="flex flex-col items-center">
                            <Tag color="orange">Requested: {text}</Tag>
                            {availabilityInfo.conflictInfo && (
                                <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'} className="mt-1">
                                    Available: {availabilityInfo.conflictInfo.availableQuantity}
                                </Tag>
                            )}
                        </div>
                    );
                }
            }
        ],
    };

    // Update vehicle table columns to show dropdown if no driver assigned
    const vehicleColumns = [
        ...columns.vehicle,
        {
            title: 'Driver',
            dataIndex: 'driver',
            key: 'driver',
            render: (_, vehicle) => {
                // First, check if there's already an assigned driver for this vehicle
                const existingDriver = (reservationDetails.drivers || []).find(driver => 
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                );
                
                // Always show dropdown for approvers, even if there's an existing driver
                // This allows reassignment of existing drivers
                
                // Check if current user is the CURRENT approver (their turn) or if driver is already assigned
                const getCurrentApproverInfo = () => {
                    if (!reservationDetails?.approval_sequence) return { isCurrentApprover: true, hasExistingDriver: false };
                    
                    const currentApprover = reservationDetails?.approval_sequence?.find(approver => !approver.has_approved);
                    const isCurrentApprover = currentApprover && String(currentApprover.users_id) === String(currentUserId);
                    const hasExistingDriver = existingDriver && existingDriver.driver_name;
                    
                    return { isCurrentApprover, hasExistingDriver };
                };
                
                const { isCurrentApprover, hasExistingDriver } = getCurrentApproverInfo();
                // Show dropdown only if user is current approver OR if there's already a driver assigned (allowing modification)
                const canAssignDriver = isCurrentApprover || hasExistingDriver;
                
                // Debug logging for driver dropdown
                console.log('Driver Dropdown Debug:', {
                    currentUserId,
                    approvalSequence: reservationDetails?.approval_sequence,
                    isCurrentApprover,
                    hasExistingDriver,
                    canAssignDriver,
                    availableDrivers: availableDrivers.length,
                    existingDriver,
                    vehicleId: vehicle.vehicle_id,
                    status: reservationDetails?.status_name
                });
                
                // If status is Reschedule, always show driver as read-only (no dropdown)
                if (reservationDetails.status_name === "Reschedule") {
                    if (existingDriver && existingDriver.driver_name) {
                        return (
                            <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                                <span className="font-medium">Driver:</span> {existingDriver.driver_name}
                            </div>
                        );
                    }
                    return <span className="text-gray-500">No driver assigned</span>;
                }
                
                // Only current approver or users with existing driver assignments can assign drivers, others see read-only
                if (!canAssignDriver) {
                    // For non-approvers, show existing driver if assigned, otherwise dash
                    if (existingDriver && existingDriver.driver_name) {
                        return (
                            <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                                <span className="font-medium">Driver:</span> {existingDriver.driver_name}
                            </div>
                        );
                    }
                    return <span className="text-gray-500">—</span>;
                }
                
                // For approvers, always show dropdown to allow reassignment
                // Check if there's a manual assignment in the current session
                const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                
                // Determine current selection value
                let currentValue = '';
                if (assignedDriverId !== undefined) {
                    currentValue = assignedDriverId === null ? 'null' : assignedDriverId;
                } else if (existingDriver) {
                    // If there's an existing driver, set it as current value
                    if (existingDriver.driver_id) {
                        currentValue = existingDriver.driver_id;
                    } else if (existingDriver.driver_name) {
                        // For custom driver names, we need to handle this differently
                        currentValue = 'existing_custom';
                    }
                }
                
                // Exclude drivers already assigned to other vehicles (but include current vehicle's driver)
                // Collect driver IDs from new assignments in current session
                const newAssignedDriverIds = Object.entries(vehicleDriverAssignments)
                    .filter(([vid, did]) => String(vid) !== String(vehicle.vehicle_id))
                    .map(([_, did]) => did)
                    .filter(Boolean);
                
                // Collect driver IDs from existing assignments in database
                const existingAssignedDriverIds = (reservationDetails.drivers || [])
                    .filter(driver => 
                        driver.driver_id && 
                        driver.reservation_vehicle_id && 
                        String(driver.reservation_vehicle_id) !== String(vehicle.reservation_vehicle_id)
                    )
                    .map(driver => String(driver.driver_id));
                
                // Combine both lists of assigned driver IDs
                const allAssignedDriverIds = [...new Set([...newAssignedDriverIds, ...existingAssignedDriverIds])];
                
                // Filter out drivers that are already assigned
                const availableForThisVehicle = availableDrivers.filter(driver => 
                    !allAssignedDriverIds.includes(String(driver.users_id))
                );
                
                console.log('Dropdown Rendering Debug:', {
                    newAssignedDriverIds,
                    existingAssignedDriverIds,
                    allAssignedDriverIds,
                    availableForThisVehicle: availableForThisVehicle.length,
                    availableDrivers: availableDrivers.length,
                    vehicleDriverAssignments,
                    currentValue,
                    existingDriver
                });
                
                return (
                    <div className="space-y-2">
                        <select
                            value={currentValue}
                            onChange={e => handleDriverAssign(vehicle.vehicle_id, e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Driver</option>
                            {/* Show existing custom driver as an option if present */}
                            {currentValue === 'existing_custom' && existingDriver?.driver_name && (
                                <option value="existing_custom" className="text-green-600">
                                    {existingDriver.driver_name} (Current)
                                </option>
                            )}
                            {availableForThisVehicle.map(driver => (
                                <option key={driver.users_id} value={driver.users_id}>
                                    {driver.full_name}
                                </option>
                            ))}
                            <option value="custom" className="text-blue-600">
                                Custom Driver Name
                            </option>
                        </select>
                        
                        {/* Custom Driver Name Input */}
                        {vehicleDriverAssignments[vehicle.vehicle_id] === 'custom' && (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    placeholder="Enter driver name"
                                    value={customDriverNames[vehicle.vehicle_id] || ''}
                                    onChange={e => handleCustomDriverName(vehicle.vehicle_id, e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter the name of the driver for this vehicle</p>
                            </div>
                        )}
                        
                        {availableForThisVehicle.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">No drivers available for assignment</p>
                        )}
                    </div>
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

    // Collapsible resource section component
    // const CollapsibleResourceSection = ({ title, icon, resources, type, count }) => {
    //     const sectionKey = type;
    //     const isCollapsed = collapsedSections[sectionKey];
        
    //     return (
    //         <div className="collapsible-resource-section">
    //             <div
    //                 className="section-header"
    //                 onClick={() => toggleSection(sectionKey)}
    //             >
    //                 <div className="section-title-wrapper">
    //                     {icon}
    //                     <span className="section-title">{title} ({count})</span>
    //                 </div>
    //                 <DownOutlined className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`} />
    //             </div>
    //             {!isCollapsed && (
    //                 <div className="section-content">
    //                     <Table
    //                         dataSource={type === 'vehicle' ? resources.map(vehicle => ({
    //                             ...vehicle,
    //                             driver: vehicleDriverAssignments[vehicle.vehicle_id] || null
    //                         })) : resources}
    //                         columns={type === 'vehicle' ? vehicleColumns : columns[type]}
    //                         pagination={false}
    //                         size="small"
    //                         className="border border-gray-200 rounded-lg"
    //                     />
    //                 </div>
    //             )}
    //         </div>
    //     );
    // };


    // Determine if any venue is not available due to class schedule
    // Check if current user can bypass venue availability restrictions
    const currentUserLevel = reservationDetails?.user_level_name || '';
    const currentUserDepartment = reservationDetails?.department_name || '';
    const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
    const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
    const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
    
    const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails?.venues && reservationDetails.venues.some(v => v.isAvailable === false);
    
    // Get priority check result
    const priorityCheck = checkPriority();
    
    // Responsive modal/drawer content
    const modalContent = (
        <div className={`${isMobile ? 'h-full' : ''}`}>
            <div className={`${isMobile ? 'p-0 flex flex-col h-full' : 'p-0'}`}>
                {/* Enhanced Header Section */}
                <div className={`bg-gradient-to-r from-green-700 to-lime-500 ${isMobile ? 'p-3 relative mb-0' : 'p-4'} ${isMobile ? 'rounded-none' : 'rounded-t-lg'}`}>
                    {/* Close button for mobile */}
                    {isMobile && (
                        <button 
                            onClick={onClose}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <CloseOutlined className="text-white text-sm" />
                        </button>
                    )}
                    
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <UserOutlined className={`text-white ${isMobile ? 'text-base' : 'text-lg sm:text-xl'}`} />
                            </div>
                            <div>
                                <h1 className={`text-white font-bold ${isMobile ? 'text-base' : 'text-base sm:text-xl'}`}>
                                    Reservation Details
                                </h1>
                              
                            </div>
                        </div>
                        <div className="text-white">
                            <p className="text-white/80 text-xs">Created on</p>
                            <p className={`font-semibold break-words ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                                {reservationDetails?.reservation_created_at ? new Date(reservationDetails.reservation_created_at).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`${isMobile ? 'px-4 pt-0 pb-4 flex-1 overflow-auto -mt-1' : 'p-6'}`}>
                {/* Status Alerts Section */}
                {reservationDetails?.reservation_end_date && new Date(reservationDetails.reservation_end_date) < new Date() ? (
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
                        {reservationDetails?.status_name === "Venue Approved" && (
                            <Alert
                                message={<span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Venue Approved</span>}
                                description={<span className={isMobile ? 'text-xs' : 'text-sm'}>The venue for this reservation has been approved. You may now proceed to approve or decline the reservation.</span>}
                                type="success"
                                showIcon
                                className="border border-green-200 shadow-sm"
                            />
                        )}
                        {reservationDetails?.status_name === "Venue Declined" && (
                            <Alert
                                message={<span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Venue Declined</span>}
                                description={<span className={isMobile ? 'text-xs' : 'text-sm'}>The venue for this reservation has been declined. You may only decline this reservation.</span>}
                                type="error"
                                showIcon
                                className="border border-red-200 shadow-sm"
                            />
                        )}
                        {reservationDetails?.status_name === "Registrar Approval" && (
                            <Alert
                                message={<span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Processing Venue Availability</span>}
                                description={<span className={isMobile ? 'text-xs' : 'text-sm'}>This request is currently being processed for venue availability by the registrar. Please wait for the response.</span>}
                                type="info"
                                showIcon
                                className="border border-blue-200 shadow-sm"
                            />
                        )}
                        {reservationDetails?.status_name === "Reschedule" && (() => {
                            const departmentApproval = reservationDetails?.status_history?.find(
                                status => status.status_name === 'Pending'
                            );
                            return departmentApproval && departmentApproval.reservation_active === 0;
                        })() && (
                            <Alert
                                message={<span className="font-semibold">Reschedule Request Pending</span>}
                                description="This reschedule request is waiting for department approval confirmation. All actions are temporarily disabled until the department responds."
                                type="warning"
                                showIcon
                                className="border border-orange-200 shadow-sm"
                            />
                        )}
                        {(() => {
                            const hasPendingChangeRequest =
                                reservationDetails?.status_name === "Change Request" ||
                                (Array.isArray(reservationDetails?.status_history) &&
                                 reservationDetails.status_history.some(s => s.status_name === 'Change Request' && s.reservation_active === 0));
                            return hasPendingChangeRequest;
                        })() && (
                            <Alert
                                message={<span className="font-semibold">Change Request - New Schedule Proposed</span>}
                                description="The requester has proposed a new schedule for this reservation. Please review the proposed dates and approve or decline accordingly."
                                type="info"
                                showIcon
                                className="border border-blue-200 shadow-sm"
                            />
                        )}

                        {/* Priority Status Section */}
                        {(reservationDetails?.active === 0 || reservationDetails?.active === 1) && (
                            <div className={isMobile ? "space-y-2" : "space-y-4"}>
                                {reservationDetails?.status_name !== "Reschedule" && (
                                    <Alert
                                        message={
                                            <span className="font-semibold">
                                                {anyVenueNotAvailable ? "Priority Status: Blocked" : (priorityCheck.hasPriority ? "Priority Status: Approved" : "Priority Status: Blocked")}
                                            </span>
                                        }
                                        description={(() => {
                                            // Check for different types of conflicts
                                            const venuesWithClassConflict = reservationDetails?.venues?.filter(v => v.hasClassScheduleConflict) || [];
                                            const venuesWithResourceConflict = reservationDetails?.venues?.filter(v => v.hasResourceConflict) || [];
                                            
                                            if (venuesWithClassConflict.length > 0 && venuesWithResourceConflict.length > 0) {
                                                if (canBypassVenueRestrictions) {
                                                    return `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override and reschedule existing reservations. Venue class schedule conflicts can be bypassed, and resource conflicts can be rescheduled.`;
                                                }
                                                return `Venues have both class schedule conflicts and resource conflicts with other reservations.`;
                                            } else if (venuesWithClassConflict.length > 0) {
                                                if (canBypassVenueRestrictions) {
                                                    return `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override and reschedule existing reservations (venue class schedule conflicts can be bypassed).`;
                                                }
                                                return `One or more venues are not available due to scheduled classes.`;
                                            } else if (venuesWithResourceConflict.length > 0) {
                                                if (canBypassVenueRestrictions) {
                                                    return `One or more resources are already reserved during this time period. As ${isDepartmentHeadFromCOO ? 'Department Head (COO)' : 'Secretary (GSD)'}, you can override and reschedule the existing reservation.`;
                                                }
                                                return `One or more venues are already reserved by other users during this time period.`;
                                            } else {
                                                return priorityCheck.message;
                                            }
                                        })()}
                                        type={anyVenueNotAvailable ? "warning" : (priorityCheck.hasPriority ? "success" : "warning")}
                                        showIcon
                                        className={`border border-blue-200 shadow-sm ${isMobile ? 'mb-3' : 'mb-4'}`}
                                    />
                                )}
                                
                                {/* Reschedule Status Message - Show when status is Reschedule */}
                                {reservationDetails?.status_name === "Reschedule" && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                                            <InfoCircleOutlined className="text-blue-600" />
                                            Reschedule Proposal
                                        </h3>
                                        
                                        <div className="space-y-3">
                                            <div className="bg-white p-3 rounded-lg border border-blue-100">
                                              
                                                
                                          
                                                    <div className="flex items-center gap-2">
                                                        <Tag color="orange" className="shrink-0">
                                                            Proposal Pending
                                                        </Tag>
                                                        <p className="text-sm text-gray-600">
                                                            The reschedule proposal for the requester is now pending approval.
                                                        </p>
                                                    </div>
                                              
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Existing Reservations - Only show if there are actual resource conflicts AND status is NOT Reschedule */}
                                {reservationDetails?.status_name !== "Reschedule" && (() => {
                                    const hasVenueConflict = reservationDetails?.venues?.some(requestedVenue => 
                                        reservationDetails?.availabilityData?.unavailable_venues?.some(unavailableVenue => 
                                            String(requestedVenue.venue_id) === String(unavailableVenue.ven_id)
                                        )
                                    );
                                    const hasVehicleConflict = reservationDetails?.vehicles?.some(requestedVehicle => 
                                        reservationDetails?.availabilityData?.unavailable_vehicles?.some(unavailableVehicle => 
                                            String(requestedVehicle.vehicle_id) === String(unavailableVehicle.vehicle_id)
                                        )
                                    );
                                    const hasEquipmentConflict = reservationDetails?.equipment?.some(requestedEquipment => {
                                        const unavailableEquipment = reservationDetails?.availabilityData?.unavailable_equipment?.find(
                                            e => String(e.equip_id) === String(requestedEquipment.equipment_id)
                                        );
                                        if (!unavailableEquipment) return false;
                                        const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
                                        return parseInt(requestedEquipment.quantity) > remainingQuantity;
                                    });
                                    const hasResourceConflicts = hasVenueConflict || hasVehicleConflict || hasEquipmentConflict;
                                    
                                    return hasResourceConflicts && reservationDetails?.availabilityData?.reservation_users?.length > 0 && (
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                                                <InfoCircleOutlined className="text-red-600" />
                                                Existing Reservations
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                {reservationDetails?.availabilityData?.reservation_users?.map((user, index) => (
                                                    <div key={index} className="bg-white p-3 rounded-lg border border-red-100">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-600">Reserved by: <span className="font-medium">{user.full_name}</span></p>
                                                                <p className="text-sm text-gray-600">Department: <span className="font-medium">{user.departments_name}</span></p>
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
                                                                    <p className="font-medium text-sm text-gray-900">
                                                                        {user.reservation_start_date ? new Date(user.reservation_start_date).toLocaleString() : 'Not specified'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">End Time</p>
                                                                    <p className="font-medium text-sm text-gray-900">
                                                                        {user.reservation_end_date ? new Date(user.reservation_end_date).toLocaleString() : 'Not specified'}
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
                <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-lg border border-blue-200 shadow-sm overflow-hidden`}>
                    <div className={`bg-blue-50 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} border-b border-blue-200`}>
                        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-blue-800 flex items-center gap-2`}>
                            <UserOutlined className="text-blue-600" />
                            Request Details
                        </h2>
                    </div>
                    
                    <div className={`${isMobile ? 'p-3' : 'p-4 sm:p-6'}`}>
                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isTablet ? 'grid-cols-1 gap-5' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
                            {/* Requester Information */}
                            <div className="space-y-4">
                                <h3 className={`${isMobile ? 'text-sm' : 'text-md'} font-semibold text-gray-800 border-b border-blue-200 pb-2`}>
                                    Requester Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Name</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails?.requester_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Role</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails?.user_level_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Department</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails?.department_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-green-700 mb-1`}>Additional Note</p>
                                        <p className={`font-medium bg-yellow-50 text-green-900 rounded ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2'} border border-yellow-200`}>
                                         {reservationDetails?.additional_note || 'No additional note'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule and Details */}
                            <div className="space-y-4">
                                <h3 className={`${isMobile ? 'text-sm' : 'text-md'} font-semibold text-gray-800 border-b border-blue-200 pb-2`}>
                                    Reservation Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Title</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails?.reservation_title || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Description</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails?.reservation_description || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Original Date & Time</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails?.reservation_start_date && reservationDetails?.reservation_end_date ? formatDateRange(
                                            reservationDetails.reservation_start_date,
                                            reservationDetails.reservation_end_date
                                        ) : 'N/A'}</p>
                                    </div>
                                {(() => {
                                    // Only show "Proposed New Date & Time" for Change Request status
                                    const isChangeRequest = reservationDetails?.status_name === "Change Request";
                                    const hasRescheduleData = reservationDetails?.reschedule_start_date && reservationDetails?.reschedule_end_date;
                                    
                                    return (isChangeRequest && hasRescheduleData) ? (
                                        <div>
                                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Proposed New Date & Time</p>
                                            <p className={`font-medium text-blue-600 ${isMobile ? 'text-sm' : ''}`}>{formatDateRange(
                                                reservationDetails?.reschedule_start_date,
                                                reservationDetails?.reschedule_end_date
                                            )}</p>
                                        </div>
                                    ) : null;
                                })()}
                                </div>
                            </div>
                        </div>

                        {/* Resources Section */}
                        <div className="mt-6 pt-6 border-t border-blue-200">
                            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-4`}>Requested Resources</h3>
                            <div className="space-y-4">
                                {/* Venues */}
                                {reservationDetails?.venues?.length > 0 && (
                                    <div>
                                        <h4 className={`${isMobile ? 'text-sm' : 'text-md'} font-medium text-gray-700 mb-2 flex items-center gap-2`}>
                                            <BuildOutlined className="text-purple-500" />
                                            Venues ({reservationDetails?.venues?.length})
                                        </h4>
                                        {isMobile ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {reservationDetails?.venues?.map((venue) => {
                                                    const availabilityInfo = getResourceAvailabilityInfo('venue', venue.venue_id);
                                                    const hasVenueChange = venue.change_venue_id && reservationDetails?.status_name === "Reschedule";
                                                    const hasClassConflict = venue.hasClassScheduleConflict && venue.conflictingSchedules?.length > 0;
                                                    
                                                    return (
                                                        <div key={venue.reservation_venue_id || venue.venue_id} className={`p-3 rounded-lg ${hasVenueChange ? 'bg-orange-50 border-2 border-orange-300' : 'bg-white border border-gray-200'}`}>
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                                    <BuildOutlined className="mt-0.5 text-purple-500 shrink-0" />
                                                                    <div className="min-w-0 flex-1">
                                                                        {hasVenueChange ? (
                                                                            <div className="space-y-2">
                                                                                <Tag color="orange" size="small">
                                                                                    ⚠️ Pending Change
                                                                                </Tag>
                                                                                <div className="space-y-1">
                                                                                    <div className="text-xs text-gray-500 line-through break-words">
                                                                                        <p>{venue.ven_name}</p>
                                                                                        {venue.venue_building_name && (
                                                                                            <p className="text-[10px] text-gray-400">📍 {venue.venue_building_name}</p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-400">↓</div>
                                                                                    <div className="text-sm font-semibold text-green-700 break-words">
                                                                                        <p>{venue.change_venue_name}</p>
                                                                                        {venue.change_venue_building_name && (
                                                                                            <p className="text-xs text-green-600">📍 {venue.change_venue_building_name}</p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <p className="font-medium text-sm text-gray-800 break-words">{venue.ven_name || venue.venue_name}</p>
                                                                                {venue.venue_building_name && (
                                                                                    <p className="text-xs text-gray-500 break-words">📍 {venue.venue_building_name}</p>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'} className="shrink-0 text-xs ml-2">
                                                                    {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                                                                </Tag>
                                                            </div>
                                                            
                                                            {/* Participants */}
                                                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                                                <UserOutlined className="text-gray-500" />
                                                                <span>Participants: <span className="font-medium text-gray-800">{venue.participants || 'Not specified'}</span></span>
                                                            </div>
                                                            
                                                            {/* Show class schedule conflicts */}
                                                            {hasClassConflict && (
                                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                                    <div className="flex items-center gap-1 mb-1">
                                                                        <ScheduleOutlined className="text-rose-500 text-xs" />
                                                                        <span className="text-xs font-semibold text-rose-800">Class Schedule Conflicts:</span>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        {venue.conflictingSchedules.map((conflict, idx) => (
                                                                            <div key={idx} className="bg-white p-2 rounded text-xs border border-rose-100">
                                                                                <div className="font-medium text-gray-700">{conflict.section}</div>
                                                                                <div className="text-gray-600">{conflict.day}, {conflict.date} • {conflict.time}</div>
                                                                                <div className="text-gray-500 text-[10px]">{conflict.semester} {conflict.schoolYear}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div>
                                                <Table 
                                                    dataSource={reservationDetails?.venues || []} 
                                                    columns={columns.venue}
                                                    pagination={false}
                                                    size="small"
                                                    className="border border-blue-200 rounded-lg"
                                                />
                                                {/* Show class schedule conflicts for desktop */}
                                                {(reservationDetails?.venues || []).some(v => v.hasClassScheduleConflict && v.conflictingSchedules?.length > 0) && (
                                                    <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <ScheduleOutlined className="text-rose-500" />
                                                            <span className="font-medium text-rose-800">Conflicts with Class Schedules</span>
                                                        </div>
                                                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                            {(reservationDetails?.venues || [])
                                                                .filter(v => v.hasClassScheduleConflict && v.conflictingSchedules?.length > 0)
                                                                .map((venue) => (
                                                                    <div key={venue.venue_id}>
                                                                        <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                                            <BuildOutlined className="text-purple-500" />
                                                                            {venue.ven_name || venue.venue_name}
                                                                        </div>
                                                                        <div className="space-y-1 ml-5">
                                                                            {venue.conflictingSchedules.map((conflict, idx) => (
                                                                                <div key={idx} className="bg-white p-2 rounded text-xs border border-rose-100">
                                                                                    <div className="font-medium text-gray-700">{conflict.section}</div>
                                                                                    <div className="text-gray-600 mt-0.5">
                                                                                        {conflict.day}, {conflict.date} • {conflict.time}
                                                                                    </div>
                                                                                    <div className="text-gray-500">{conflict.semester} {conflict.schoolYear}</div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Vehicles */}
                                {reservationDetails?.vehicles?.length > 0 && (
                                    <div>
                                        <h4 className={`${isMobile ? 'text-sm' : 'text-md'} font-medium text-gray-700 mb-2 flex items-center gap-2`}>
                                            <CarOutlined className="text-blue-500" />
                                            Vehicles ({reservationDetails?.vehicles?.length || 0})
                                        </h4>
                                        {isMobile ? (
                                            <div className="grid grid-cols-1 gap-3">
                                                {(reservationDetails?.vehicles || []).map((vehicle) => {
                                                    const availabilityInfo = getResourceAvailabilityInfo('vehicle', vehicle.vehicle_id);
                                                    const existingDriver = (reservationDetails?.drivers || []).find(driver => 
                                                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                                                    );
                                                    // Check if current user is the CURRENT approver (their turn) or if driver is already assigned
                                                    const getCurrentApproverInfo = () => {
                                                        if (!reservationDetails?.approval_sequence) return { isCurrentApprover: true, hasExistingDriver: false };
                                                        
                                                        const currentApprover = reservationDetails.approval_sequence.find(approver => !approver.has_approved);
                                                        const isCurrentApprover = currentApprover && String(currentApprover.users_id) === String(currentUserId);
                                                        const hasExistingDriver = existingDriver && existingDriver.driver_name;
                                                        
                                                        return { isCurrentApprover, hasExistingDriver };
                                                    };
                                                    
                                                    const { isCurrentApprover, hasExistingDriver } = getCurrentApproverInfo();
                                                    // Show dropdown only if user is current approver OR if there's already a driver assigned (allowing modification)
                                                    const canAssignDriver = isCurrentApprover || hasExistingDriver;
                                                    const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                                                    let currentValue = '';
                                                    if (assignedDriverId !== undefined) {
                                                        currentValue = assignedDriverId === null ? 'null' : assignedDriverId;
                                                    } else if (existingDriver) {
                                                        if (existingDriver.driver_id) {
                                                            currentValue = existingDriver.driver_id;
                                                        } else if (existingDriver.driver_name) {
                                                            currentValue = 'existing_custom';
                                                        }
                                                    }
                                                    // Collect driver IDs from new assignments in current session
                                                    const newAssignedDriverIds = Object.entries(vehicleDriverAssignments)
                                                        .filter(([vid, did]) => String(vid) !== String(vehicle.vehicle_id))
                                                        .map(([_, did]) => did)
                                                        .filter(Boolean);
                                                    
                                                    // Collect driver IDs from existing assignments in database
                                                    const existingAssignedDriverIds = (reservationDetails?.drivers || [])
                                                        .filter(driver => 
                                                            driver.driver_id && 
                                                            driver.reservation_vehicle_id && 
                                                            String(driver.reservation_vehicle_id) !== String(vehicle.reservation_vehicle_id)
                                                        )
                                                        .map(driver => String(driver.driver_id));
                                                    
                                                    // Combine both lists of assigned driver IDs
                                                    const allAssignedDriverIds = [...new Set([...newAssignedDriverIds, ...existingAssignedDriverIds])];
                                                    
                                                    // Filter out drivers that are already assigned
                                                    const availableForThisVehicle = availableDrivers.filter(driver => 
                                                        !allAssignedDriverIds.includes(String(driver.users_id))
                                                    );
                                                    
                                                    // Check if this vehicle has pending changes
                                                    const hasVehicleChange = vehicle.change_vehicle_id && reservationDetails.status_name === "Reschedule";
                                                    
                                                    return (
                                                        <div key={vehicle.reservation_vehicle_id || vehicle.vehicle_id} className={`${hasVehicleChange ? 'bg-orange-50 border-2 border-orange-300' : 'bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200'} rounded-xl p-3`}>
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-start gap-2 flex-1">
                                                                    <div className="bg-blue-100 p-1.5 rounded-lg shrink-0">
                                                                        <CarOutlined className="text-blue-600 text-base" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        {hasVehicleChange ? (
                                                                            <>
                                                                                <Tag color="orange" size="small" className="mb-2">
                                                                                    ⚠️ Pending Change
                                                                                </Tag>
                                                                                <div className="text-xs leading-relaxed">
                                                                                    <span className="text-gray-500 line-through">
                                                                                        <span className="font-mono">{vehicle.license}</span> {vehicle.model}
                                                                                    </span>
                                                                                    {' → '}
                                                                                    <span className="font-semibold text-green-700">
                                                                                        <span className="font-mono">{vehicle.change_vehicle_license}</span> {vehicle.change_vehicle_model}
                                                                                    </span>
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <h5 className="font-semibold text-gray-900 text-sm">{vehicle.model}</h5>
                                                                                <p className="text-gray-600 text-xs font-mono">{vehicle.license}</p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'} className="shrink-0 text-xs">
                                                                    {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                                                                </Tag>
                                                            </div>
                                                            
                                                            {/* Driver Assignment Section */}
                                                            <div className="pt-2 border-t border-gray-200">
                                                                <p className="text-xs text-gray-500 mb-2">Driver Assignment</p>
                                                                {reservationDetails.status_name === "Reschedule" ? (
                                                                    // For Reschedule status, show driver as read-only
                                                                    existingDriver && existingDriver.driver_name ? (
                                                                        <div className="text-xs text-gray-700 bg-white p-2 rounded border">
                                                                            <span className="font-medium">Driver:</span> {existingDriver.driver_name}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500">No driver assigned</span>
                                                                    )
                                                                ) : (
                                                                    // For other statuses, show normal driver assignment logic
                                                                    canAssignDriver ? (
                                                                        <div className="space-y-2">
                                                                            <select
                                                                                value={currentValue}
                                                                                onChange={e => handleDriverAssign(vehicle.vehicle_id, e.target.value)}
                                                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                            >
                                                                                <option value="">Select Driver</option>
                                                                                {/* Show existing custom driver as an option if present */}
                                                                                {currentValue === 'existing_custom' && existingDriver?.driver_name && (
                                                                                    <option value="existing_custom" className="text-green-600">
                                                                                        {existingDriver.driver_name} (Current)
                                                                                    </option>
                                                                                )}
                                                                                {availableForThisVehicle.map(driver => (
                                                                                    <option key={driver.users_id} value={driver.users_id}>
                                                                                        {driver.full_name}
                                                                                    </option>
                                                                                ))}
                                                                                <option value="custom" className="text-blue-600">
                                                                                    Custom Driver Name
                                                                                </option>
                                                                            </select>
                                                                            
                                                                            {vehicleDriverAssignments[vehicle.vehicle_id] === 'custom' && (
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Enter driver name"
                                                                                    value={customDriverNames[vehicle.vehicle_id] || ''}
                                                                                    onChange={e => handleCustomDriverName(vehicle.vehicle_id, e.target.value)}
                                                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ) : existingDriver && existingDriver.driver_name ? (
                                                                        <div className="text-xs text-gray-700 bg-white p-2 rounded border">
                                                                            <span className="font-medium">Driver:</span> {existingDriver.driver_name}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500">—</span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Table 
                                                dataSource={(reservationDetails?.vehicles || []).map(vehicle => ({
                                                    ...vehicle,
                                                    driver: vehicleDriverAssignments[vehicle.vehicle_id] || null
                                                }))} 
                                                columns={vehicleColumns}
                                                pagination={false}
                                                size="small"
                                                className="border border-blue-200 rounded-lg"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Equipment */}
                                {reservationDetails?.equipment?.length > 0 && (
                                    <div>
                                        <h4 className={`${isMobile ? 'text-sm' : 'text-md'} font-medium text-gray-700 mb-2 flex items-center gap-2`}>
                                            <ToolOutlined className="text-orange-500" />
                                            Equipment ({reservationDetails?.equipment?.length || 0})
                                        </h4>
                                        {isMobile ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {(reservationDetails?.equipment || []).map((item) => {
                                                    const availabilityInfo = getResourceAvailabilityInfo('equipment', item.equipment_id);
                                                    return (
                                                        <div key={item.reservation_equipment_id || item.equipment_id} className="p-2 border rounded-lg bg-white">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                                    <ToolOutlined className="mt-0.5 text-orange-500 shrink-0" />
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-medium text-sm text-gray-800 break-words">{item.name}</p>
                                                                        {!availabilityInfo.isAvailable && availabilityInfo.conflictInfo && (
                                                                            <div className="text-xs text-red-600 mt-1">
                                                                                Available: {availabilityInfo.conflictInfo.availableQuantity} / {availabilityInfo.conflictInfo.totalQuantity}
                                                                                <br />
                                                                                Requested: {availabilityInfo.conflictInfo.requestedQuantity}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                                                    <Tag color="orange" size="small">Qty: {item.quantity}</Tag>
                                                                    <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'} size="small">
                                                                        {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                                                                    </Tag>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Table 
                                                dataSource={reservationDetails?.equipment || []} 
                                                columns={columns.equipment}
                                                pagination={false}
                                                size="small"
                                                className="border border-blue-200 rounded-lg"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Final Approval Section - Based on Approval Sequence */}
                        <div className={`mt-6 ${isMobile ? 'px-0' : 'px-4 sm:px-6'}`}>
                            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-3`}>Approval Sequence</h3>
                            <div className={`bg-gray-50 rounded-lg border border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
                                <div className={`space-y-${isMobile ? '3' : '4'}`}>
                                    {/* Display Approval Sequence */}
                                    {reservationDetails?.approval_sequence && reservationDetails?.approval_sequence?.length > 0 ? (
                                        reservationDetails?.approval_sequence?.map((approver, index) => {
                                            const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
                                            const isCurrentUser = currentUserId === approver.users_id;
                                            
                                            // Determine if this is the last approver in the sequence
                                            const isLastApprover = index === reservationDetails?.approval_sequence?.length - 1;
                                            
                                            // Determine status based on approval data
                                            // Check if all approvers in the sequence have approved
                                            const allApproversApproved = reservationDetails?.approval_sequence?.every(app => app.has_approved);
                                            
                                            let statusInfo;
                                            if (approver.has_approved) {
                                                statusInfo = {
                                                    isApproved: true,
                                                    isPending: false,
                                                    isDeclined: false,
                                                    statusName: 'Approved',
                                                    updatedBy: approver.approver_name,
                                                    updatedAt: approver.approval_date,
                                                    allApproversApproved: allApproversApproved,
                                                    isLastApprover: isLastApprover
                                                };
                                            } else {
                                                // Check if this approver should be active (previous approvers have approved)
                                                const previousApprovers = reservationDetails?.approval_sequence?.slice(0, index);
                                                const allPreviousApproved = previousApprovers.every(prev => prev.has_approved);
                                                
                                                statusInfo = {
                                                    isApproved: false,
                                                    isPending: allPreviousApproved,
                                                    isDeclined: false,
                                                    statusName: allPreviousApproved ? 'Pending' : 'Waiting',
                                                    updatedBy: null,
                                                    updatedAt: null,
                                                    allApproversApproved: allApproversApproved,
                                                    isLastApprover: isLastApprover
                                                };
                                            }
                                            
                                            return (
                                                <div key={approver.approval_order_id} className={`${isMobile ? 'p-2.5' : 'p-3'} bg-white rounded-md border shadow-sm`}>
                                                    <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
                                                        <div className="flex items-center">
                                                            <div className={`flex items-center ${isMobile ? 'mr-2' : 'mr-3'}`}>
                                                                <div className={`${isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium ${isMobile ? 'mr-1.5' : 'mr-2'}`}>
                                                                    {approver.approval_sequence}
                                                                </div>
                                                                {statusInfo.isApproved ? (
                                                                    <CheckCircleOutlined className={`text-green-500 ${isMobile ? 'text-base' : 'text-lg'}`} />
                                                                ) : statusInfo.isPending ? (
                                                                    <ClockCircleOutlined className={`text-yellow-500 ${isMobile ? 'text-base' : 'text-lg'}`} />
                                                                ) : (
                                                                    <ClockCircleOutlined className={`text-gray-400 ${isMobile ? 'text-base' : 'text-lg'}`} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className={`font-medium text-gray-800 ${isMobile ? 'text-sm' : ''}`}>
                                                                    {approver.approver_name} {isCurrentUser && '(You)'} 
                                                                    {statusInfo.isLastApprover && <span className={`ml-1 ${isMobile ? 'text-[10px]' : 'text-xs'} bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full`}>Last</span>}
                                                                </div>
                                                                <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                                                                    {approver.user_level_name} - {approver.departments_name}
                                                                </div>
                                                                <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-400 ${isMobile ? 'mt-0.5' : ''}`}>
                                                                    {statusInfo.updatedAt ? 
                                                                        new Date(statusInfo.updatedAt).toLocaleString() : 
                                                                        statusInfo.isPending ? 'Waiting for action' : 
                                                                        statusInfo.allApproversApproved ? 'Approved' : 'Waiting for previous'
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-2 ${isMobile ? 'ml-8' : ''}`}>
                                                            <Tag color={
                                                                statusInfo.isApproved ? 'green' : 
                                                                statusInfo.isPending ? 'gold' : 
                                                                'default'
                                                            } size={isMobile ? 'small' : 'default'}>
                                                                {statusInfo.statusName}
                                                            </Tag>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">
                                            <InfoCircleOutlined className="text-2xl mb-2" />
                                            <div>No approval sequence configured for this reservation</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dean Approval Progress Section */}
                        {(isLoadingDeans || deansApproval.length > 0) && (
                            <div className={`mt-6 ${isMobile ? 'px-0' : 'px-4 sm:px-6'}`}>
                                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-3`}>Department Approval Progress</h3>
                                {isLoadingDeans ? (
                                    <div className="flex items-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                                        <Spin size="small" className="mr-2" />
                                        <span>Loading Approvals...</span>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg border border-gray-200">
                                        <div 
                                            onClick={() => setIsApproverListVisible(!isApproverListVisible)} 
                                            className={`flex items-center justify-between cursor-pointer ${isMobile ? 'p-3' : 'p-4'}`}
                                        >
                                            <div className="flex-grow pr-4">
                                                <Progress 
                                                    percent={deansApproval.length > 0 ? (approvedDeansCount / deansApproval.length) * 100 : 0}
                                                    format={() => `${approvedDeansCount} / ${deansApproval.length} Approved`}
                                                    strokeColor={{ from: '#108ee9', to: '#87d068' }}
                                                    trailColor="rgba(0, 0, 0, 0.06)"
                                                    size={isMobile ? 'small' : 'default'}
                                                />
                                            </div>
                                            <DownOutlined 
                                                className={`text-gray-600 transition-transform duration-300 ${isApproverListVisible ? 'rotate-180' : ''} ${isMobile ? 'text-xs' : ''}`}
                                            />
                                        </div>

                                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isApproverListVisible ? 'max-h-96' : 'max-h-0'}`}>
                                            <div className={`border-t border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
                                                <ul className={`space-y-${isMobile ? '2' : '3'} max-h-60 overflow-y-auto pr-2`}>
                                                    {deansApproval.map(dean => (
                                                        <li key={dean.approval_id} className={`${isMobile ? 'p-2' : 'p-3'} bg-white rounded-md border flex items-center justify-between shadow-sm`}>
                                                            <div className="flex items-center">
                                                                {dean.is_approved === 1 || dean.is_approved === '1' ? (
                                                                    <CheckCircleOutlined className={`text-green-500 ${isMobile ? 'mr-2 text-base' : 'mr-3 text-lg'}`} />
                                                                ) : (
                                                                    <ClockCircleOutlined className={`text-yellow-500 ${isMobile ? 'mr-2 text-base' : 'mr-3 text-lg'}`} />
                                                                )}
                                                                <div>
                                                                    <div className={`font-medium text-gray-800 ${isMobile ? 'text-sm' : ''}`}>{dean.user_name}</div>
                                                                    <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500`}>{dean.department_name}</div>
                                                                </div>
                                                            </div>
                                                            <Tag color={dean.is_approved === 1 || dean.is_approved === '1' ? 'green' : 'gold'} size={isMobile ? 'small' : 'default'}>
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

                    </div>
                </div>
            </div>
                    
                    {/* Driver Error Alert */}
                    {driverError && (
                        <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-4'}`}>
                            <Alert
                                message={driverError}
                                type="error"
                                showIcon
                                className="border border-red-300"
                            />
                        </div>
                    )}
                </div>
            </div>
    
    );

    const getMobileFooter = () => {
        // Get buttons from the same logic as desktop footer
        const footerButtons = getModalFooter() || [];
        if (!footerButtons || footerButtons.length === 0) return null;
        
        return (
            <div className="flex flex-col gap-2 p-4 bg-white border-t">
                {footerButtons.map((button, index) => {
                    // Skip RescheduleModal component in footer
                    if (!button || button?.type?.name === 'RescheduleModal') return null;
                    
                    // Clone button with mobile-friendly props
                    const existingClassName = button.props?.className || '';
                    return React.cloneElement(button, {
                        key: button.key || index,
                        block: true,
                        size: "large",
                        className: `${existingClassName} mb-2`.trim()
                    });
                }).filter(Boolean)}
            </div>
        );
    };

    return (
        <>
            {isMobile ? (
                <Drawer
                    title={null}
                    placement="bottom"
                    height="90%"
                    visible={visible}
                    onClose={onClose}
                    className="reservation-detail-drawer"
                    bodyStyle={{ padding: 0 }}
                    headerStyle={{ display: 'none' }}
                    closable={true}
                    closeIcon={<CloseOutlined className="text-white" />}
                    maskClosable={false}
                    footer={getMobileFooter()}
                >
                    {modalContent}
                </Drawer>
            ) : (
                <Modal
                    title={null}
                    visible={visible}
                    onCancel={onClose}
                    width={isTablet ? 700 : 800}
                    footer={getModalFooter()}
                    className="reservation-detail-modal"
                    bodyStyle={{ padding: '0' }}
                    maskClosable={false}
                    zIndex={1000}
                >
                    {modalContent}
                </Modal>
            )}
        </>
    );
};

const PriorityConflictModal = ({ visible, onClose, conflictingReservations, onConfirm, reservationDetails, setErrorMessage, setIsErrorModalOpen, fetchReservations, handleRescheduleError }) => {
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [currentRescheduleIndex, setCurrentRescheduleIndex] = useState(0);
    const [rescheduledReservations, setRescheduledReservations] = useState([]);

    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

    // Check if current user is Department Head from COO or Secretary from GSD and if reservation is in Pending Department Approval stage
    const isDepartmentHeadFromCOO = reservationDetails?.user_level_name === "Department Head" && reservationDetails?.department_name === "COO";
    const isSecretaryFromGSD = reservationDetails?.user_level_name === "Secretary" && reservationDetails?.department_name === "GSD";
    
    // Check if the reservation is currently in Pending approval stage
    const currentPendingApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending' && s.reservation_active === 0);
    const isPendingApproval = !!currentPendingApproval;

    // Ensure action only at the final approver in the approval sequence
    const currentUserIdForConflict = parseInt(SecureStorage.getLocalItem('user_id'), 10);
    const approvalSeq = reservationDetails?.approval_sequence || [];
    const maxSeq = approvalSeq.length > 0 ? Math.max(...approvalSeq.map(a => parseInt(a.approval_sequence, 10))) : null;
    const currentUserSeqEntry = approvalSeq.find(a => parseInt(a.users_id, 10) === currentUserIdForConflict);
    const isLastApprover = !!(currentUserSeqEntry && parseInt(currentUserSeqEntry.approval_sequence, 10) === maxSeq);
    
    // Show "Approve and Reschedule" for the final/last approver when there are conflicts
    // Also maintain existing bypass capability for Department Head COO and Secretary GSD
    console.log('PriorityConflictModal Debug:', {
        isLastApprover,
        isPendingApproval,
        isDepartmentHeadFromCOO,
        isSecretaryFromGSD,
        currentUserIdForConflict,
        approvalSeq,
        maxSeq,
        currentUserSeqEntry,
        currentPendingApproval
    });
    
    const showApproveAndReschedule = isLastApprover || isDepartmentHeadFromCOO || isSecretaryFromGSD;
    
    console.log('showApproveAndReschedule:', showApproveAndReschedule);

    const validateConflictQueue = useCallback(async () => {
        try {
            console.log('Validating conflict queue for reservations:', conflictingReservations);
            
            const response = await fetch(`${encryptedUrl}reservation.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'filterActiveConflicts',
                    conflicting_reservations: conflictingReservations
                })
            });

            const result = await response.json();
            console.log('Conflict validation result:', result);

            if (result.status === 'success') {
                const { already_rescheduled, suggested_index } = result.data;
                
                // Set the current index to the number of already rescheduled reservations
                setCurrentRescheduleIndex(suggested_index);
                
                // Mark already rescheduled reservations in our state
                const alreadyRescheduledIds = conflictingReservations
                    .slice(0, already_rescheduled)
                    .map(r => r.reservation_id);
                    
                setRescheduledReservations(alreadyRescheduledIds);
                
                console.log(`Queue validation: ${already_rescheduled} already rescheduled, starting at index ${suggested_index}`);
                
                if (already_rescheduled > 0) {
                    toast.info(`${already_rescheduled} reservation(s) already rescheduled. Continuing from ${suggested_index + 1}/${conflictingReservations.length}`);
                }
            } else {
                console.error('Failed to validate conflicts:', result.message);
                // Fallback to original behavior
                setCurrentRescheduleIndex(0);
                setRescheduledReservations([]);
            }
        } catch (error) {
            console.error('Error validating conflict queue:', error);
            // Fallback to original behavior
            setCurrentRescheduleIndex(0);
            setRescheduledReservations([]);
        }
    }, [conflictingReservations, encryptedUrl, setCurrentRescheduleIndex, setRescheduledReservations]);

    // Reset state and validate conflicts when modal opens
    useEffect(() => {
        if (visible && conflictingReservations.length > 0) {
            validateConflictQueue();
        }
    }, [visible, conflictingReservations, validateConflictQueue]);

    // const handleCancelAndReserve = async () => {
    //     try {
    //         // First cancel the existing reservations
    //         for (const reservation of conflictingReservations) {
    //             await axios.post(`${encryptedUrl}/process_reservation.php`, {
    //                 operation: 'handleCancelReservation',
    //                 reservation_id: reservation.reservation_id,
    //                 user_id: SecureStorage.getLocalItem('user_id')
    //             });
    //             // Send notification to the cancelled reservation's requester
    //             await axios.post(`${encryptedUrl}/user.php`, {
    //                 operation: 'insertNotificationTouser',
    //                 notification_message: 'Your reservation has been cancelled due to a higher-priority override.',
    //                 notification_user_id: reservation.user_id,
    //                 reservation_id: reservation.reservation_id
    //             });
    //         }
            
    //         // After cancelling, proceed with the new reservation
    //         onConfirm();
    //         toast.success('Successfully cancelled existing reservations and created new reservation.');
    //     } catch (error) {
    //         console.error('Error in cancel and reserve process:', error);
    //         toast.error('Failed to process the request. Please try again.');
    //     }
    // };

    const handleApproveAndReschedule = async () => {
        // Re-validate conflicts before opening reschedule modal
        console.log('Re-validating conflicts before rescheduling...');
        
        try {
            const response = await fetch(`${encryptedUrl}reservation.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'filterActiveConflicts',
                    conflicting_reservations: conflictingReservations
                })
            });

            const result = await response.json();
            console.log('Re-validation result:', result);

            if (result.status === 'success') {
                const { already_rescheduled, remaining_conflicts, suggested_index } = result.data;
                
                if (remaining_conflicts === 0) {
                    // All reservations have been rescheduled, proceed with approval
                    console.log('All conflicting reservations have been rescheduled, proceeding with approval');
                    toast.success('All conflicting reservations have been rescheduled. Proceeding with approval.');
                    onConfirm();
                    return;
                }
                
                // Update our state with the latest validation
                setCurrentRescheduleIndex(suggested_index);
                
                // Mark already rescheduled reservations
                const alreadyRescheduledIds = conflictingReservations
                    .slice(0, already_rescheduled)
                    .map(r => r.reservation_id);
                setRescheduledReservations(alreadyRescheduledIds);
                
                console.log(`Opening reschedule modal: ${remaining_conflicts} remaining, starting at index ${suggested_index}`);
                console.log('Current conflicting reservation:', conflictingReservations[suggested_index]);
                
                if (suggested_index < conflictingReservations.length) {
                    setIsRescheduleModalOpen(true);
                } else {
                    console.log('All conflicting reservations have been rescheduled, proceeding with approval');
                    onConfirm();
                }
            } else {
                console.error('Failed to re-validate conflicts:', result.message);
                // Fallback to original behavior
                if (currentRescheduleIndex < conflictingReservations.length) {
                    setIsRescheduleModalOpen(true);
                } else {
                    onConfirm();
                }
            }
        } catch (error) {
            console.error('Error re-validating conflicts:', error);
            // Fallback to original behavior
            if (currentRescheduleIndex < conflictingReservations.length) {
                setIsRescheduleModalOpen(true);
            } else {
                onConfirm();
            }
        }
    };

    const handleRescheduleComplete = async (rescheduleData) => {
        console.log('[ViewRequest] ===== handleRescheduleComplete ENTRY =====');
        console.log('[ViewRequest] handleRescheduleComplete called with:', rescheduleData);
        try {
            const conflictingReservation = conflictingReservations[currentRescheduleIndex]; // Get current reservation being rescheduled
            const { startDate, endDate, newVenueIds, newVehicleIds, driverAssignments, customDriverNames } = rescheduleData || {};
            console.log('[ViewRequest] Conflict reschedule - destructured:', { startDate, endDate, newVenueIds, newVehicleIds });
            console.log('[ViewRequest] Conflicting reservation:', conflictingReservation);

            let didUpdateSomething = false;

            // Step 1: Update reservation dates if provided
            if (startDate && endDate) {
                // Use NEW venue/vehicle IDs if changing resources, otherwise use current ones
                const venueIds = newVenueIds && newVenueIds.length > 0 
                    ? newVenueIds 
                    : (conflictingReservation?.venues?.map(v => v.venue_id) || []);
                const vehicleIds = newVehicleIds && newVehicleIds.length > 0 
                    ? newVehicleIds 
                    : (conflictingReservation?.vehicles?.map(v => v.vehicle_id) || []);
                
                console.log('[Priority Conflict] Sending conflict check with:', { venueIds, vehicleIds, newVenueIds, newVehicleIds });
                
                const dateResp = await axios.post(`${encryptedUrl}reservation.php`, {
                    operation: 'updateReservationReschedule',
                    reservation_id: conflictingReservation.reservation_id,
                    reschedule_start_date: startDate,
                    reschedule_end_date: endDate,
                    user_admin_id: SecureStorage.getLocalItem('user_id'),
                    venue_ids: venueIds,
                    vehicle_ids: vehicleIds
                }, { headers: { 'Content-Type': 'application/json' } });
                
                if (!(dateResp?.data?.status === 'success')) {
                    await handleRescheduleError(dateResp, conflictingReservation.reservation_id, () => setIsRescheduleModalOpen(false));
                    return;
                }
                didUpdateSomething = true;
            }

            // Step 2: Process venue changes (optional)
            console.log('[ViewRequest] Checking venue changes in conflict reschedule:', { newVenueIds, hasNewVenueIds: !!(newVenueIds && Array.isArray(newVenueIds) && newVenueIds.length > 0) });
            if (newVenueIds && Array.isArray(newVenueIds) && newVenueIds.length > 0) {
                // Get venues from doubleCheckAvailability response instead of conflicting reservation
                const unavailableVenues = reservationDetails?.availabilityData?.unavailable_venues || [];
                const currentVenues = unavailableVenues.map(venue => ({
                    venue_id: venue.ven_id,
                    venue_name: venue.ven_name,
                    reservation_venue_id: venue.reservation_venue_id // Use the actual reservation_venue_id from response
                }));
                console.log('[ViewRequest] Conflict reschedule - current venues from unavailable_venues:', currentVenues);
                console.log('[ViewRequest] Conflict reschedule - unavailable_venues raw:', unavailableVenues);
                const venue_changes = currentVenues
                    .map((v, idx) => {
                        const newId = newVenueIds[idx];
                        // Only process if newId is explicitly provided and different from current
                        if (newId == null || newId === undefined || String(newId) === String(v.venue_id)) return null;
                        return {
                            reservation_venue_id: v.reservation_venue_id,
                            reservation_change_venue_id: Number(newId)
                        };
                    })
                    .filter(Boolean);

                console.log('[ViewRequest] Conflict reschedule - venue changes to process:', venue_changes);
                if (venue_changes.length > 0) {
                    console.log('[ViewRequest] Executing updateVenueReschedule for conflict reschedule');
                    const requests = venue_changes.map(change => {
                        console.log('[ViewRequest] Making conflict venue reschedule request:', change);
                        return axios.post(`${encryptedUrl}reservation.php`, {
                            operation: 'updateVenueReschedule',
                            reservation_venue_id: change.reservation_venue_id,
                            reservation_change_venue_id: change.reservation_change_venue_id,
                            reservation_id: conflictingReservation.reservation_id
                        }, { headers: { 'Content-Type': 'application/json' } });
                    });
                    
                    const results = await Promise.allSettled(requests);
                    const failedResults = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.data?.status !== 'success'));
                    if (failedResults.length > 0) {
                        const firstError = failedResults[0].status === 'rejected' 
                            ? failedResults[0].reason?.message
                            : failedResults[0].value?.data?.message;
                        
                        // Check if it's a status-related error that should show error modal
                        if (firstError && (firstError.includes('cancelled') || firstError.includes('declined') || 
                            firstError.includes('completed') || firstError.includes('already been rescheduled') || 
                            firstError.includes('pending reschedule'))) {
                            setErrorMessage(firstError);
                            setIsErrorModalOpen(true);
                            // Refresh data to show updated status
                            await fetchReservations();
                            return;
                        } else {
                            toast.error(firstError || 'Failed to reschedule venue');
                            return;
                        }
                    }
                    didUpdateSomething = true;
                }
            }

            // Step 3: Process vehicle changes (optional)
            console.log('[ViewRequest] Checking vehicle changes in conflict reschedule:', { newVehicleIds, hasNewVehicleIds: !!(newVehicleIds && Array.isArray(newVehicleIds) && newVehicleIds.length > 0) });
            if (newVehicleIds && Array.isArray(newVehicleIds) && newVehicleIds.length > 0) {
                // Get vehicles from doubleCheckAvailability response instead of conflicting reservation
                const unavailableVehicles = reservationDetails?.availabilityData?.unavailable_vehicles || [];
                const currentVehicles = unavailableVehicles.map(vehicle => ({
                    vehicle_id: vehicle.vehicle_id,
                    vehicle_model_name: vehicle.vehicle_model_name || vehicle.model,
                    reservation_vehicle_id: vehicle.reservation_vehicle_id // Use the actual reservation_vehicle_id from response
                }));
                console.log('[ViewRequest] Conflict reschedule - current vehicles from unavailable_vehicles:', currentVehicles);
                console.log('[ViewRequest] Conflict reschedule - unavailable_vehicles raw:', unavailableVehicles);
                const vehicle_changes = currentVehicles
                    .map((v, idx) => {
                        const newId = newVehicleIds[idx];
                        // Only process if newId is explicitly provided and different from current
                        if (newId == null || newId === undefined || String(newId) === String(v.vehicle_id)) return null;
                        return {
                            reservation_vehicle_id: v.reservation_vehicle_id,
                            reservation_change_vehicle_id: Number(newId)
                        };
                    })
                    .filter(Boolean);

                console.log('[ViewRequest] Conflict reschedule - vehicle changes to process:', vehicle_changes);
                if (vehicle_changes.length > 0) {
                    console.log('[ViewRequest] Executing updateVehicleReschedule for conflict reschedule');
                    const requests = vehicle_changes.map(change => {
                        console.log('[ViewRequest] Making conflict vehicle reschedule request:', change);
                        return axios.post(`${encryptedUrl}reservation.php`, {
                            operation: 'updateVehicleReschedule',
                            reservation_vehicle_id: change.reservation_vehicle_id,
                            reservation_change_vehicle_id: change.reservation_change_vehicle_id,
                            reservation_id: conflictingReservation.reservation_id
                        }, { headers: { 'Content-Type': 'application/json' } });
                    });
                    
                    const results = await Promise.allSettled(requests);
                    const failedResults = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.data?.status !== 'success'));
                    if (failedResults.length > 0) {
                        const firstError = failedResults[0].status === 'rejected' 
                            ? failedResults[0].reason?.message
                            : failedResults[0].value?.data?.message;
                        
                        // Check if it's a status-related error that should show error modal
                        if (firstError && (firstError.includes('cancelled') || firstError.includes('declined') || 
                            firstError.includes('completed') || firstError.includes('already been rescheduled') || 
                            firstError.includes('pending reschedule'))) {
                            setErrorMessage(firstError);
                            setIsErrorModalOpen(true);
                            // Refresh data to show updated status
                            await fetchReservations();
                            return;
                        } else {
                            toast.error(firstError || 'Failed to reschedule vehicle');
                            return;
                        }
                    }
                    didUpdateSomething = true;
                }
            }

            // Step 4: Process driver assignments if provided
            if (driverAssignments && Object.keys(driverAssignments).length > 0) {
                console.log('[ViewRequest] Processing driver assignments for conflict reschedule:', driverAssignments);
                console.log('[ViewRequest] Custom driver names:', customDriverNames);
                
                // Get vehicles from conflicting reservation
                const unavailableVehicles = reservationDetails?.availabilityData?.unavailable_vehicles || [];
                
                for (const unavailableVehicle of unavailableVehicles) {
                    const vehicleId = unavailableVehicle.vehicle_id;
                    const driverAssignment = driverAssignments[vehicleId];
                    
                    // Only process if there's a driver assignment for this vehicle
                    if (driverAssignment !== undefined) {
                        const isCustomDriver = driverAssignment === 'custom';
                        const customDriverName = isCustomDriver ? customDriverNames[vehicleId] : null;
                        const driverUserId = isCustomDriver ? 'custom' : driverAssignment;
                        
                        console.log('[ViewRequest] Updating driver for conflict vehicle:', {
                            vehicleId,
                            reservation_vehicle_id: unavailableVehicle.reservation_vehicle_id,
                            reservation_driver_id: unavailableVehicle.reservation_driver_id,
                            driverUserId,
                            customDriverName,
                            isCustomDriver
                        });
                        
                        try {
                            const driverResp = await axios.post(`${encryptedUrl}/Admin.php`, {
                                operation: 'insertDriver',
                                reservation_driver_user_id: driverUserId,
                                reservation_vehicle_id: unavailableVehicle.reservation_vehicle_id,
                                driver_name: customDriverName,
                                reservation_driver_id: unavailableVehicle.reservation_driver_id // This will trigger update if exists
                            }, { headers: { 'Content-Type': 'application/json' } });
                            
                            if (driverResp?.data?.status === 'success') {
                                console.log('[ViewRequest] Driver updated successfully for conflict vehicle', vehicleId);
                                didUpdateSomething = true;
                            } else {
                                console.error('[ViewRequest] Failed to update driver for conflict vehicle', vehicleId, driverResp?.data);
                                toast.error(`Failed to update driver for vehicle ${unavailableVehicle.vehicle_name || vehicleId}`);
                            }
                        } catch (driverError) {
                            console.error('[ViewRequest] Error updating driver:', driverError);
                            toast.error(`Error updating driver for vehicle ${unavailableVehicle.vehicle_name || vehicleId}`);
                        }
                    }
                }
            }

            // Step 5: Equipment units handling removed

            // If no changes were made, still proceed with approval
            if (!didUpdateSomething && (!startDate || !endDate)) {
                toast.info('No changes made to the existing reservation.');
            } else {
                // Refresh the reservations data to show updated status
                await fetchReservations();
            }

            // Send notification about rescheduling
            await axios.post(`${encryptedUrl}/Admin.php`, {
                operation: 'insertNotificationTouser',
                notification_message: 'Your reservation has been rescheduled due to a higher-priority request.',
                notification_user_id: conflictingReservation.user_id,
                reservation_id: conflictingReservation.reservation_id
            });

            // Close reschedule modal
            setIsRescheduleModalOpen(false);
            
            // Mark current reservation as rescheduled
            const newRescheduledReservations = [...rescheduledReservations, conflictingReservation.reservation_id];
            setRescheduledReservations(newRescheduledReservations);
            
            // Move to next reservation
            const nextIndex = currentRescheduleIndex + 1;
            setCurrentRescheduleIndex(nextIndex);
            
            if (nextIndex < conflictingReservations.length) {
                // There are more reservations to reschedule
                toast.success(`Reservation ${currentRescheduleIndex + 1} of ${conflictingReservations.length} rescheduled. Please reschedule the next conflicting reservation.`);
                // Automatically open reschedule modal for next reservation
                setTimeout(() => setIsRescheduleModalOpen(true), 500);
            } else {
                // All reservations have been rescheduled, now approve the current request
                toast.success('All conflicting reservations have been rescheduled. Approving new request...');
                onConfirm();
            }
        } catch (error) {
            console.error('Error in reschedule and approve process:', error);
            toast.error('Failed to reschedule and approve. Please try again.');
        }
    };

    const modalContent = (
        <>
            <Alert
                message={showApproveAndReschedule ? "Priority Status: Approved" : "Conflict Information"}
                description={showApproveAndReschedule ? 
                    `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : isSecretaryFromGSD ? 'Secretary from GSD department' : 'the final approver'}, you can override any existing reservation. The conflicting reservation will be rescheduled to a new time slot.` :
                    "The following reservation is currently using these resources for the requested time slot. Please review the conflict and use the main Approve/Decline buttons to proceed."
                }
                type={showApproveAndReschedule ? "success" : "info"}
                showIcon
                className={isMobile ? "mx-4 mt-2 mb-4" : "mb-4"}
            />
          
            
            {/* Reschedule Modal for conflicting reservation */}
            {isRescheduleModalOpen && conflictingReservations.length > 0 && (
                <RescheduleModal
                    visible={isRescheduleModalOpen}
                    onCancel={() => {
                        console.log('Reschedule modal cancelled, preserving queue state');
                        setIsRescheduleModalOpen(false);
                        // Queue state is preserved - currentRescheduleIndex and rescheduledReservations remain unchanged
                    }}
                    onReschedule={handleRescheduleComplete}
                    reservation={{
                        reservation_id: conflictingReservations[currentRescheduleIndex]?.reservation_id,
                        reservation_title: conflictingReservations[currentRescheduleIndex]?.reservation_title || conflictingReservations[currentRescheduleIndex]?.title,
                        reservation_start_date: conflictingReservations[currentRescheduleIndex]?.reservation_start_date,
                        reservation_end_date: conflictingReservations[currentRescheduleIndex]?.reservation_end_date,
                        // Map venues from current conflicting reservation only
                        venues: reservationDetails?.availabilityData?.unavailable_venues?.filter(venue => 
                            venue.reservation_id === conflictingReservations[currentRescheduleIndex]?.reservation_id
                        ).map(venue => ({
                            venue_id: venue.ven_id,
                            venue_name: venue.ven_name,
                            ven_name: venue.ven_name,
                            reservation_venue_id: venue.reservation_venue_id || `temp_${venue.ven_id}`
                        })) || [],
                        // Map vehicles from current conflicting reservation only
                        vehicles: reservationDetails?.availabilityData?.unavailable_vehicles?.filter(vehicle => 
                            vehicle.reservation_id === conflictingReservations[currentRescheduleIndex]?.reservation_id
                        ).map(vehicle => ({
                            vehicle_id: vehicle.vehicle_id,
                            model: vehicle.model || vehicle.vehicle_model_name,
                            license: vehicle.license || vehicle.vehicle_license_plate,
                            reservation_vehicle_id: vehicle.reservation_vehicle_id || `temp_${vehicle.vehicle_id}`
                        })) || [],
                        // Map equipment from current conflicting reservation only
                        equipment: reservationDetails?.availabilityData?.unavailable_equipment?.filter(equip => 
                            equip.reservation_id === conflictingReservations[currentRescheduleIndex]?.reservation_id
                        ).map(equip => ({
                            equipment_id: equip.equip_id,
                            name: equip.equip_name,
                            quantity: equip.reserved_quantity || 1
                        })) || []
                    }}
                    resources={{
                        venueIds: reservationDetails?.availabilityData?.unavailable_venues?.filter(venue => 
                            venue.reservation_id === conflictingReservations[currentRescheduleIndex]?.reservation_id
                        ).map(v => v.ven_id) || [],
                        vehicleIds: reservationDetails?.availabilityData?.unavailable_vehicles?.filter(vehicle => 
                            vehicle.reservation_id === conflictingReservations[currentRescheduleIndex]?.reservation_id
                        ).map(v => v.vehicle_id) || [],
                        equipment: reservationDetails?.availabilityData?.unavailable_equipment?.filter(equip => 
                            equip.reservation_id === conflictingReservations[currentRescheduleIndex]?.reservation_id
                        ).map(eq => ({
                            equipment_id: eq.equip_id,
                            quantity: eq.reserved_quantity || 1
                        })) || []
                    }}
                    originalStart={conflictingReservations[currentRescheduleIndex]?.reservation_start_date}
                    originalEnd={conflictingReservations[currentRescheduleIndex]?.reservation_end_date}
                />
            )}
        </>
    );

    const footerButtons = [
        <Button 
            key="close" 
            onClick={onClose}
            block={isMobile}
            size={isMobile ? "large" : "middle"}
        >
            Close
        </Button>,
        showApproveAndReschedule && (
            <Button
                key="approveAndReschedule"
                type="primary"
                onClick={handleApproveAndReschedule}
                icon={<ScheduleOutlined />}
                block={isMobile}
                size={isMobile ? "large" : "middle"}
            >
                {isMobile ? (
                    conflictingReservations.length > 1 
                        ? `Reschedule (${currentRescheduleIndex + 1}/${conflictingReservations.length})`
                        : 'Reschedule'
                ) : (
                    conflictingReservations.length > 1 
                        ? `Reschedule (${currentRescheduleIndex + 1}/${conflictingReservations.length})`
                        : 'Approve and Reschedule'
                )}
            </Button>
        ),
    ].filter(Boolean);

    return (
        <>
            {isMobile ? (
                <Drawer
                    title={
                        <div className="flex items-center gap-2 text-green-800">
                            <InfoCircleOutlined />
                            <span>Existing Reservation Details</span>
                        </div>
                    }
                    placement="bottom"
                    height="90%"
                    visible={visible}
                    onClose={onClose}
                    className="priority-conflict-drawer"
                    bodyStyle={{ padding: 0 }}
                    closable={true}
                    closeIcon={<CloseOutlined />}
                    maskClosable={false}
                    zIndex={1002}
                    footer={
                        <div className="flex flex-col gap-2 p-4 bg-white border-t">
                            {footerButtons}
                        </div>
                    }
                >
                    {modalContent}
                </Drawer>
            ) : (
                <Modal
                    title={
                        <div className="flex items-center gap-2 text-green-800">
                            <InfoCircleOutlined />
                            <span>Existing Reservation Details</span>
                        </div>
                    }
                    visible={visible}
                    onCancel={onClose}
                    getContainer={false}
                    zIndex={1002}
                    width={isTablet ? 600 : 700}
                    footer={footerButtons}
                >
                    {modalContent}
                </Modal>
            )}
        </>
    );
};

// Reschedule Error Modal Component
const RescheduleErrorModal = ({ visible, onClose, message }) => {
    return (
        <Modal
            title="Cannot Update Reschedule Dates"
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="ok" type="primary" onClick={onClose}>
                    OK
                </Button>
            ]}
            centered
            width={500}
            zIndex={2000}
            maskClosable={false}
        >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
                    ⚠️
                </div>
                <h3 style={{ color: '#ff4d4f', marginBottom: '16px' }}>
                    Reschedule Update Failed
                </h3>
                <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#666' }}>
                    {message}
                </p>
            </div>
        </Modal>
    );
};

// Error Modal Component
const ErrorModal = ({ visible, onClose, message }) => {
    return (
        <Modal
            title="Cannot Process Reservation"
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="ok" type="primary" onClick={onClose}>
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
                    Processing Not Allowed
                </h3>
                <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#666' }}>
                    {message}
                </p>
            </div>
        </Modal>
    );
};

export default ReservationRequests;
