import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tag, Tabs, Button, Spin, Collapse, Table, Progress, Input, Form, Drawer, DatePicker, TimePicker } from 'antd';
import { useMediaQuery } from 'react-responsive';
import {
    UserOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined,
    InfoCircleOutlined,
    HistoryOutlined,
    DownOutlined,
    RightOutlined,
    RedoOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    
    SaveOutlined,
    CloseOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { SecureStorage } from '../../utils/encryption';
import dayjs from 'dayjs';
// import { generateGatePassPdf } from '../../components/Reservation/Gate_Pass';
import GatePass from '../../components/Reservation/Gate_Pass';
import RescheduleModal from '../../pages/Admin/core/reschedule_modal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;



const ReservationDetails = ({
    visible,
    onClose,
    reservationDetails,
    showAvailability = false,
    checkResourceAvailability = () => true,
    onRefresh
}) => {
    const navigate = useNavigate();

    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showAdminProcessingModal, setShowAdminProcessingModal] = useState(false);
    const [adminProcessingReason, setAdminProcessingReason] = useState('');
    const baseUrl = SecureStorage.getLocalItem("url");

    // Local state for reservation details to enable real-time updates
    const [localReservationDetails, setLocalReservationDetails] = useState(reservationDetails);

    // Update local state when prop changes
    useEffect(() => {
        setLocalReservationDetails(reservationDetails);
    }, [reservationDetails]);

    // Create a refresh function that doesn't re-open the modal
    // const refreshWithoutModal = useCallback(() => {
    //     if (onRefresh) {
    //         onRefresh();
    //     }
    // }, [onRefresh]);
    const gatePassRef = React.useRef(); // Ref for hidden GatePass
    const [deansApproval, setDeansApproval] = useState([]);
    const [isLoadingDeans, setIsLoadingDeans] = useState(false);
    const [isProcessingReschedule, setIsProcessingReschedule] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [isRescheduleDecisionModalOpen, setIsRescheduleDecisionModalOpen] = useState(false);
    const [rescheduleDecisionAction, setRescheduleDecisionAction] = useState(null);
    const [rescheduleDecisionReason, setRescheduleDecisionReason] = useState('');
    // const [rescheduleResources, setRescheduleResources] = useState(null);

    // Edit functionality state
    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm] = Form.useForm();
    const [isUpdating, setIsUpdating] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);
    const [availabilityBlocks, setAvailabilityBlocks] = useState([]); // [{start: dayjs, end: dayjs, ...}]
    const [dayStatuses, setDayStatuses] = useState({}); // { 'YYYY-MM-DD': 'available'|'partial'|'reserved' }
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);

    useEffect(() => {
        console.log("ReservationDetails mounted with props:", {
            visible,
            reservationDetails,
            showAvailability,
            onRefresh
        });

        // Log conditions data specifically
        if (reservationDetails?.conditions) {
            console.log("Conditions data:", reservationDetails.conditions);
            console.log("Equipment conditions:", reservationDetails.conditions.equipment);
            console.log("Vehicle conditions:", reservationDetails.conditions.vehicle);
            console.log("Venue conditions:", reservationDetails.conditions.venue);
            console.log("Unit conditions:", reservationDetails.conditions.unit);
        }
    }, [visible, reservationDetails, showAvailability, onRefresh]);

    // Fetch Department Approval (Dean's) similar to Admin/Record.jsx DetailModal
    useEffect(() => {
        const fetchDeansApproval = async () => {
            if (!visible || !reservationDetails?.reservation_id || !baseUrl) {
                setDeansApproval([]);
                return;
            }

            setIsLoadingDeans(true);
            try {
                const response = await axios.post(`${baseUrl}Admin.php`, {
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
                if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                    toast.error('Network connection lost. Unable to load approval details.');
                }
                setDeansApproval([]);
            } finally {
                setIsLoadingDeans(false);
            }
        };
        fetchDeansApproval();
    }, [visible, reservationDetails, baseUrl]);

    const openRescheduleDecisionModal = (action) => {
        setRescheduleDecisionAction(action);
        setRescheduleDecisionReason('');
        setIsRescheduleDecisionModalOpen(true);
    };

    const handleSubmitRescheduleDecision = async () => {
        try {
            const userId = SecureStorage.getLocalItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                return;
            }

            const isAccepted = rescheduleDecisionAction === 'accept';
            const resp = await axios.post(`${baseUrl}reservation.php`, {
                operation: 'respondToRescheduleProposal',
                reservation_id: reservationDetails?.reservation_id,
                is_accepted: isAccepted,
                user_id: Number(userId),
                reason: rescheduleDecisionReason || null
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (resp.data?.status === 'success') {
                toast.success(resp.data?.message || 'Response submitted');
                setIsRescheduleDecisionModalOpen(false);
                if (onRefresh) {
                    await onRefresh();
                }
                onClose();
            } else {
                toast.error(resp.data?.message || 'Failed to submit response');
            }
        } catch (error) {
            console.error('Error submitting reschedule proposal response:', error);
            if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to submit response.');
            } else {
                toast.error('Failed to submit response. Please try again.');
            }
        }
    };

    // Function to fetch request by ID (similar to viewReserve.jsx)
    const fetchRequestById = useCallback(async () => {
        if (!localReservationDetails?.reservation_id || !baseUrl) {
            console.log('No reservation ID or base URL available for fetchRequestById');
            return;
        }

        try {
            console.log('Fetching updated reservation details for ID:', localReservationDetails.reservation_id);

            const response = await fetch(`${baseUrl}reservation.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'fetchRequestById',
                    reservation_id: localReservationDetails.reservation_id
                })
            });

            const result = await response.json();
            console.log("fetchRequestById API Response:", result);

            if (result.status === 'success' && result.data) {
                // Update local state with new data immediately
                setLocalReservationDetails(result.data);

                // Also call onRefresh to update the parent component
                if (onRefresh) {
                    onRefresh();
                }
            } else {
                console.error('Failed to fetch updated reservation details:', result.message);
            }
        } catch (error) {
            console.error('Error fetching updated reservation details:', error);
            if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to refresh details.');
            }
        }
    }, [localReservationDetails?.reservation_id, baseUrl, onRefresh]);

    // Compute per-day status (available / partial / reserved) - matching reschedule_modal.jsx
    useEffect(() => {
        if (!isEditMode) return; // Only compute when in edit mode

        const BUSINESS_START_HOUR = 4;  // 4 AM
        const BUSINESS_END_HOUR = 22;   // 10 PM
        const totalBusinessMinutes = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60; // 1080

        // Build a window of dates around now and around the existing blocks
        const dateKeys = new Set();

        // Include days spanning all availability blocks
        availabilityBlocks.forEach(b => {
            const startDay = b.start.startOf('day');
            const endDay = b.end.startOf('day');
            let d = startDay.clone();
            while (d.isSame(endDay) || d.isBefore(endDay)) {
                dateKeys.add(d.format('YYYY-MM-DD'));
                d = d.add(1, 'day');
            }
        });

        // Also include a month span around today to color empty days as available
        const today = dayjs().startOf('month');
        for (let i = -1; i <= 2; i++) {
            const month = today.add(i, 'month');
            const daysInMonth = month.daysInMonth();
            for (let d = 1; d <= daysInMonth; d++) {
                dateKeys.add(month.date(d).format('YYYY-MM-DD'));
            }
        }

        const next = {};

        dateKeys.forEach(dateKey => {
            const currentDay = dayjs(dateKey).startOf('day');
            const dayStart = currentDay.hour(BUSINESS_START_HOUR).minute(0).second(0);
            const dayEnd = currentDay.hour(BUSINESS_END_HOUR).minute(0).second(0);

            // Separate equipment blocks from venue/vehicle blocks
            const equipmentBlocksForDate = [];
            const nonEquipmentBlocksForDate = [];

            availabilityBlocks.forEach(block => {
                const blockStartDay = block.start.startOf('day');
                const blockEndDay = block.end.startOf('day');

                // Check if block overlaps with current date
                const overlapsDate = (currentDay.isSame(blockStartDay) || currentDay.isAfter(blockStartDay)) &&
                    (currentDay.isSame(blockEndDay) || currentDay.isBefore(blockEndDay));

                if (!overlapsDate) return;

                if (block.equip_id) {
                    equipmentBlocksForDate.push(block);
                } else {
                    nonEquipmentBlocksForDate.push(block);
                }
            });

            // Calculate venue/vehicle time blocking (minutes overlapped)
            const intervals = nonEquipmentBlocksForDate
                .map(b => {
                    const s = b.start.isAfter(dayStart) ? b.start : dayStart;
                    const e = b.end.isBefore(dayEnd) ? b.end : dayEnd;
                    return (e.isAfter(s)) ? { s, e } : null;
                })
                .filter(Boolean)
                .sort((a, b) => a.s.valueOf() - b.s.valueOf());

            // Merge overlapping intervals
            const merged = [];
            intervals.forEach(cur => {
                if (merged.length === 0) {
                    merged.push({ ...cur });
                } else {
                    const last = merged[merged.length - 1];
                    if (cur.s.isSame(last.e) || cur.s.isBefore(last.e)) {
                        if (cur.e.isAfter(last.e)) last.e = cur.e;
                    } else {
                        merged.push({ ...cur });
                    }
                }
            });

            const blockedMinutes = merged.reduce((acc, it) => acc + (it.e.diff(it.s, 'minute')), 0);

            // Check equipment availability
            let equipmentStatus = 'available'; // Default: available

            if (equipmentBlocksForDate.length > 0) {
                // Group by equipment ID
                const equipByIdMap = {};

                equipmentBlocksForDate.forEach(block => {
                    const equipId = block.equip_id;
                    if (!equipByIdMap[equipId]) {
                        equipByIdMap[equipId] = {
                            currentQuantity: block.current_quantity,
                            requestedQuantity: block.requested_quantity,
                            reservedQuantity: 0,
                            blocks: []
                        };
                    }
                    equipByIdMap[equipId].reservedQuantity += (block.reserved_quantity || 0);
                    equipByIdMap[equipId].blocks.push(block);
                });

                // Check each equipment
                let hasFullBlock = false;
                let hasPartial = false;

                Object.values(equipByIdMap).forEach(equip => {
                    const availableQty = equip.currentQuantity - equip.reservedQuantity;
                    const requestedQty = equip.requestedQuantity;

                    if (availableQty >= requestedQty) {
                        // Enough available - mark as partial (yellow)
                        hasPartial = true;
                    } else {
                        // Not enough available - check if it's full day
                        const allBlocksFullDay = equip.blocks.every(b => {
                            return b.start.hour() <= 4 && b.end.hour() >= 22;
                        });

                        if (allBlocksFullDay) {
                            hasFullBlock = true; // RED
                        } else {
                            hasPartial = true; // YELLOW
                        }
                    }
                });

                if (hasFullBlock) {
                    equipmentStatus = 'reserved'; // RED
                } else if (hasPartial) {
                    equipmentStatus = 'partial'; // YELLOW
                }
            }

            // Determine final status
            if (equipmentStatus === 'reserved' || blockedMinutes >= totalBusinessMinutes) {
                next[dateKey] = 'reserved'; // RED
            } else if (equipmentStatus === 'partial' || blockedMinutes > 0) {
                next[dateKey] = 'partial'; // YELLOW
            } else {
                next[dateKey] = 'available'; // GREEN
            }
        });

        setDayStatuses(next);
    }, [availabilityBlocks, isEditMode]);

    // Check availability for selected date range - matching reservation_calendar.jsx logic
    const checkAvailability = useCallback(async (startDateTime, endDateTime) => {
        try {
            setCheckingAvailability(true);
            setAvailabilityError(null);

            // Extract resource IDs from reservation
            const venueIds = (localReservationDetails.venues || []).map(v => v.venue_id || v.ven_id).filter(id => id);
            const vehicleIds = (localReservationDetails.vehicles || []).map(v => v.vehicle_id).filter(id => id);
            const equipment = (localReservationDetails.equipment || []).map(eq => ({
                equipment_id: eq.equipment_id || eq.equip_id,
                quantity: parseInt(eq.quantity, 10) || 0
            })).filter(eq => eq.equipment_id);

            console.log('[Edit Availability] Checking for resources:', {
                venues: venueIds,
                vehicles: vehicleIds,
                equipment: equipment,
                currentReservationId: localReservationDetails.reservation_id
            });

            if (!venueIds.length && !vehicleIds.length && !equipment.length) {
                console.log('[Edit Availability] No resources to check');
                return true;
            }

            const conflicts = [];
            const allBlocks = []; // Collect all blocks for calendar rendering
            const start = dayjs(startDateTime);
            const end = dayjs(endDateTime);

            // Check venue availability - matching reservation_calendar.jsx logic
            if (venueIds.length > 0) {
                const venueResp = await axios.post(`${baseUrl}reservation.php`, {
                    operation: 'fetchAvailability',
                    itemType: 'venue',
                    itemId: venueIds
                });

                if (venueResp.data?.status === 'success' && Array.isArray(venueResp.data.data)) {
                    // Parse blocks for calendar
                    venueResp.data.data.forEach(res => {
                        // Skip current reservation
                        if (res.reservation_id === localReservationDetails.reservation_id) return;

                        const statusId = parseInt(res.reservation_status_status_id);
                        const reservationActive = parseInt(res.reservation_active);
                        const hasReschedule = res.reschedule_start_date && res.reschedule_end_date;

                        // Add blocks based on status
                        if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                            allBlocks.push({
                                start: dayjs(res.reschedule_start_date),
                                end: dayjs(res.reschedule_end_date),
                                reservation_id: res.reservation_id,
                                ven_id: res.ven_id
                            });
                        } else if (statusId === 10 && hasReschedule) {
                            allBlocks.push(
                                {
                                    start: dayjs(res.reservation_start_date),
                                    end: dayjs(res.reservation_end_date),
                                    reservation_id: res.reservation_id,
                                    ven_id: res.ven_id
                                },
                                {
                                    start: dayjs(res.reschedule_start_date),
                                    end: dayjs(res.reschedule_end_date),
                                    reservation_id: res.reservation_id,
                                    ven_id: res.ven_id
                                }
                            );
                        } else if (res.reservation_start_date && res.reservation_end_date) {
                            allBlocks.push({
                                start: dayjs(res.reservation_start_date),
                                end: dayjs(res.reservation_end_date),
                                reservation_id: res.reservation_id,
                                ven_id: res.ven_id
                            });
                        }
                    });

                    // Check for conflicts
                    venueResp.data.data.forEach(res => {
                        // Skip current reservation
                        if (res.reservation_id === localReservationDetails.reservation_id) return;

                        // Handle reschedule logic based on status (matching reservation_calendar.jsx)
                        const statusId = parseInt(res.reservation_status_status_id);
                        const reservationActive = parseInt(res.reservation_active);
                        const hasReschedule = res.reschedule_start_date && res.reschedule_end_date;

                        let resStart, resEnd;

                        // Status 10 + active=1: Use ONLY reschedule dates (confirmed reschedule)
                        if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                            resStart = dayjs(res.reschedule_start_date);
                            resEnd = dayjs(res.reschedule_end_date);
                        }
                        // Status 10: Use BOTH original and reschedule dates (pending reschedule)
                        else if (statusId === 10 && hasReschedule) {
                            // Check both original and reschedule dates for overlap
                            const origStart = dayjs(res.reservation_start_date);
                            const origEnd = dayjs(res.reservation_end_date);
                            const reschedStart = dayjs(res.reschedule_start_date);
                            const reschedEnd = dayjs(res.reschedule_end_date);

                            // Check if either date range overlaps with selected dates
                            const origOverlap = start.isBefore(origEnd) && end.isAfter(origStart);
                            const reschedOverlap = start.isBefore(reschedEnd) && end.isAfter(reschedStart);

                            if (origOverlap || reschedOverlap) {
                                conflicts.push(`Venue "${res.ven_name}" has pending reschedule conflict`);
                                console.log('[Edit Availability] Venue conflict (status 10):', res);
                            }
                            return;
                        }
                        // Default: Use original dates only
                        else if (res.reservation_start_date && res.reservation_end_date) {
                            resStart = dayjs(res.reservation_start_date);
                            resEnd = dayjs(res.reservation_end_date);
                        } else {
                            return; // No valid dates
                        }

                        // Check for overlap: (StartA < EndB) and (EndA > StartB)
                        if (start.isBefore(resEnd) && end.isAfter(resStart)) {
                            conflicts.push(`Venue "${res.ven_name}" conflict from ${resStart.format('MMM D, h:mm A')} to ${resEnd.format('MMM D, h:mm A')}`);
                            console.log('[Edit Availability] Venue conflict:', res);
                        }
                    });
                }
            }

            // Check vehicle availability - matching reservation_calendar.jsx logic
            if (vehicleIds.length > 0) {
                const vehicleResp = await axios.post(`${baseUrl}reservation.php`, {
                    operation: 'fetchAvailability',
                    itemType: 'vehicle',
                    itemId: vehicleIds
                });

                if (vehicleResp.data?.status === 'success' && Array.isArray(vehicleResp.data.data)) {
                    // Parse blocks for calendar
                    vehicleResp.data.data.forEach(res => {
                        if (res.reservation_id === localReservationDetails.reservation_id) return;

                        const statusId = parseInt(res.reservation_status_status_id);
                        const reservationActive = parseInt(res.reservation_active);
                        const hasReschedule = res.reschedule_start_date && res.reschedule_end_date;

                        if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                            allBlocks.push({
                                start: dayjs(res.reschedule_start_date),
                                end: dayjs(res.reschedule_end_date),
                                reservation_id: res.reservation_id,
                                vehicle_id: res.vehicle_id
                            });
                        } else if (statusId === 10 && hasReschedule) {
                            allBlocks.push(
                                {
                                    start: dayjs(res.reservation_start_date),
                                    end: dayjs(res.reservation_end_date),
                                    reservation_id: res.reservation_id,
                                    vehicle_id: res.vehicle_id
                                },
                                {
                                    start: dayjs(res.reschedule_start_date),
                                    end: dayjs(res.reschedule_end_date),
                                    reservation_id: res.reservation_id,
                                    vehicle_id: res.vehicle_id
                                }
                            );
                        } else if (res.reservation_start_date && res.reservation_end_date) {
                            allBlocks.push({
                                start: dayjs(res.reservation_start_date),
                                end: dayjs(res.reservation_end_date),
                                reservation_id: res.reservation_id,
                                vehicle_id: res.vehicle_id
                            });
                        }
                    });

                    // Check for conflicts
                    vehicleResp.data.data.forEach(res => {
                        // Skip current reservation
                        if (res.reservation_id === localReservationDetails.reservation_id) return;

                        const statusId = parseInt(res.reservation_status_status_id);
                        const reservationActive = parseInt(res.reservation_active);
                        const hasReschedule = res.reschedule_start_date && res.reschedule_end_date;

                        let resStart, resEnd;

                        // Status 10 + active=1: Use ONLY reschedule dates
                        if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                            resStart = dayjs(res.reschedule_start_date);
                            resEnd = dayjs(res.reschedule_end_date);
                        }
                        // Status 10: Check BOTH date ranges
                        else if (statusId === 10 && hasReschedule) {
                            const origStart = dayjs(res.reservation_start_date);
                            const origEnd = dayjs(res.reservation_end_date);
                            const reschedStart = dayjs(res.reschedule_start_date);
                            const reschedEnd = dayjs(res.reschedule_end_date);

                            const origOverlap = start.isBefore(origEnd) && end.isAfter(origStart);
                            const reschedOverlap = start.isBefore(reschedEnd) && end.isAfter(reschedStart);

                            if (origOverlap || reschedOverlap) {
                                const vehicleName = `${res.vehicle_make_name || ''} ${res.vehicle_model_name || ''}`.trim();
                                conflicts.push(`Vehicle "${vehicleName}" has pending reschedule conflict`);
                                console.log('[Edit Availability] Vehicle conflict (status 10):', res);
                            }
                            return;
                        }
                        // Default: Use original dates
                        else if (res.reservation_start_date && res.reservation_end_date) {
                            resStart = dayjs(res.reservation_start_date);
                            resEnd = dayjs(res.reservation_end_date);
                        } else {
                            return;
                        }

                        // Check for overlap
                        if (start.isBefore(resEnd) && end.isAfter(resStart)) {
                            const vehicleName = `${res.vehicle_make_name || ''} ${res.vehicle_model_name || ''}`.trim();
                            conflicts.push(`Vehicle "${vehicleName}" conflict from ${resStart.format('MMM D, h:mm A')} to ${resEnd.format('MMM D, h:mm A')}`);
                            console.log('[Edit Availability] Vehicle conflict:', res);
                        }
                    });
                }
            }

            // Check equipment availability - matching reservation_calendar.jsx logic with quantity validation
            if (equipment.length > 0) {
                const equipIds = equipment.map(e => e.equipment_id);
                const quantities = equipment.map(e => e.quantity);

                const equipResp = await axios.post(`${baseUrl}reservation.php`, {
                    operation: 'fetchAvailability',
                    itemType: 'equipment',
                    itemId: equipIds,
                    quantity: quantities
                });

                if (equipResp.data?.status === 'success' && Array.isArray(equipResp.data.data)) {
                    equipResp.data.data.forEach(equipItem => {
                        if (!equipItem.reservations || !Array.isArray(equipItem.reservations)) return;

                        // Parse blocks for calendar and group reservations by date range
                        const dateRangeMap = {};

                        equipItem.reservations.forEach(reservation => {
                            // Skip current reservation
                            if (reservation.reservation_id === localReservationDetails.reservation_id) return;

                            const statusId = parseInt(reservation.reservation_status_status_id);
                            const reservationActive = parseInt(reservation.reservation_active);
                            const hasReschedule = reservation.reschedule_start_date && reservation.reschedule_end_date;

                            // Status 10 + active=1: Use ONLY reschedule dates
                            if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                                const rescheduleRangeKey = `${reservation.reschedule_start_date}_${reservation.reschedule_end_date}`;

                                if (!dateRangeMap[rescheduleRangeKey]) {
                                    dateRangeMap[rescheduleRangeKey] = {
                                        startDate: reservation.reschedule_start_date,
                                        endDate: reservation.reschedule_end_date,
                                        totalReservedQty: 0
                                    };
                                }
                                dateRangeMap[rescheduleRangeKey].totalReservedQty += parseInt(reservation.reserved_quantity);

                                // Add to calendar blocks
                                allBlocks.push({
                                    start: dayjs(reservation.reschedule_start_date),
                                    end: dayjs(reservation.reschedule_end_date),
                                    reservation_id: reservation.reservation_id,
                                    equip_id: equipItem.equip_id,
                                    current_quantity: parseInt(equipItem.current_quantity) || 0,
                                    reserved_quantity: parseInt(reservation.reserved_quantity) || 0,
                                    requested_quantity: equipment.find(e => e.equipment_id === equipItem.equip_id)?.quantity || 0
                                });
                            }
                            // Status 10: Use BOTH original and reschedule dates
                            else if (statusId === 10 && hasReschedule) {
                                // Add original dates entry
                                const originalRangeKey = `${reservation.reservation_start_date}_${reservation.reservation_end_date}`;
                                if (!dateRangeMap[originalRangeKey]) {
                                    dateRangeMap[originalRangeKey] = {
                                        startDate: reservation.reservation_start_date,
                                        endDate: reservation.reservation_end_date,
                                        totalReservedQty: 0
                                    };
                                }
                                dateRangeMap[originalRangeKey].totalReservedQty += parseInt(reservation.reserved_quantity);

                                // Add to calendar blocks
                                allBlocks.push({
                                    start: dayjs(reservation.reservation_start_date),
                                    end: dayjs(reservation.reservation_end_date),
                                    reservation_id: reservation.reservation_id,
                                    equip_id: equipItem.equip_id,
                                    current_quantity: parseInt(equipItem.current_quantity) || 0,
                                    reserved_quantity: parseInt(reservation.reserved_quantity) || 0,
                                    requested_quantity: equipment.find(e => e.equipment_id === equipItem.equip_id)?.quantity || 0
                                });

                                // Also add reschedule dates entry
                                const rescheduleRangeKey = `${reservation.reschedule_start_date}_${reservation.reschedule_end_date}`;
                                if (!dateRangeMap[rescheduleRangeKey]) {
                                    dateRangeMap[rescheduleRangeKey] = {
                                        startDate: reservation.reschedule_start_date,
                                        endDate: reservation.reschedule_end_date,
                                        totalReservedQty: 0
                                    };
                                }
                                dateRangeMap[rescheduleRangeKey].totalReservedQty += parseInt(reservation.reserved_quantity);

                                // Add to calendar blocks
                                allBlocks.push({
                                    start: dayjs(reservation.reschedule_start_date),
                                    end: dayjs(reservation.reschedule_end_date),
                                    reservation_id: reservation.reservation_id,
                                    equip_id: equipItem.equip_id,
                                    current_quantity: parseInt(equipItem.current_quantity) || 0,
                                    reserved_quantity: parseInt(reservation.reserved_quantity) || 0,
                                    requested_quantity: equipment.find(e => e.equipment_id === equipItem.equip_id)?.quantity || 0
                                });
                            }
                            // Default: Use original dates only
                            else if (reservation.reservation_start_date && reservation.reservation_end_date) {
                                const originalRangeKey = `${reservation.reservation_start_date}_${reservation.reservation_end_date}`;
                                if (!dateRangeMap[originalRangeKey]) {
                                    dateRangeMap[originalRangeKey] = {
                                        startDate: reservation.reservation_start_date,
                                        endDate: reservation.reservation_end_date,
                                        totalReservedQty: 0
                                    };
                                }
                                dateRangeMap[originalRangeKey].totalReservedQty += parseInt(reservation.reserved_quantity);

                                // Add to calendar blocks
                                allBlocks.push({
                                    start: dayjs(reservation.reservation_start_date),
                                    end: dayjs(reservation.reservation_end_date),
                                    reservation_id: reservation.reservation_id,
                                    equip_id: equipItem.equip_id,
                                    current_quantity: parseInt(equipItem.current_quantity) || 0,
                                    reserved_quantity: parseInt(reservation.reserved_quantity) || 0,
                                    requested_quantity: equipment.find(e => e.equipment_id === equipItem.equip_id)?.quantity || 0
                                });
                            }
                        });

                        // Check each date range for overlap and quantity availability
                        Object.values(dateRangeMap).forEach(rangeData => {
                            const rangeStart = dayjs(rangeData.startDate);
                            const rangeEnd = dayjs(rangeData.endDate);

                            // Check if date ranges overlap
                            if (start.isBefore(rangeEnd) && end.isAfter(rangeStart)) {
                                const requestedQty = equipment.find(e => e.equipment_id === equipItem.equip_id)?.quantity || 0;
                                const currentQty = parseInt(equipItem.current_quantity) || 0;
                                const available = currentQty - rangeData.totalReservedQty;

                                console.log('[Edit Availability] Equipment check:', {
                                    equipment: equipItem.equip_name,
                                    currentQty,
                                    reservedQty: rangeData.totalReservedQty,
                                    available,
                                    requested: requestedQty,
                                    dateRange: `${rangeStart.format('MMM D')} - ${rangeEnd.format('MMM D')}`
                                });

                                if (available < requestedQty) {
                                    conflicts.push(`Equipment "${equipItem.equip_name}" insufficient: ${available}/${requestedQty} available (${rangeStart.format('MMM D')} - ${rangeEnd.format('MMM D')})`);
                                }
                            }
                        });
                    });
                }
            }

            if (conflicts.length > 0) {
                const errorMessage = conflicts.join('. ');
                setAvailabilityError(errorMessage);
                return false;
            }

            console.log('[Edit Availability] No conflicts found');

            // Update availability blocks for calendar rendering
            setAvailabilityBlocks(allBlocks.filter(b => b.start && b.end && b.start.isValid() && b.end.isValid()));
            console.log('[Edit Availability] Set availability blocks:', allBlocks.length);

            return true;

        } catch (error) {
            console.error('[Edit Availability] Error checking availability:', error);
            toast.error('Failed to check availability. Please try again.');
            return false;
        } finally {
            setCheckingAvailability(false);
        }
    }, [localReservationDetails, baseUrl]);

    if (!localReservationDetails) {
        console.log("No reservation details provided");
        return null;
    }

    console.log("Rendering ReservationDetails with:", localReservationDetails);

    // Disable logic for DatePicker - matching reschedule_modal.jsx
    const disabledDateStart = (current) => {
        if (!current) return false;
        const cur = dayjs(current);
        if (!cur.isValid()) return false;
        const key = cur.format('YYYY-MM-DD');
        const isFull = dayStatuses[key] === 'reserved';

        // Get original reservation start date
        const originalStartDate = localReservationDetails?.reservation_start_date;
        if (!originalStartDate) {
            // If no original date, disable past dates
            const isPast = cur.isBefore(dayjs().startOf('day'));
            return isPast || isFull;
        }

        // Disable all dates before the original reservation start date
        const originalStartDay = dayjs(originalStartDate).startOf('day');
        const isBeforeOriginalStart = cur.isBefore(originalStartDay);

        return isBeforeOriginalStart || isFull;
    };

    const disabledDateEnd = (current) => {
        if (!current) return false;
        const cur = dayjs(current);
        if (!cur.isValid()) return false;
        const start = editForm.getFieldValue('startDate');
        const key = cur.format('YYYY-MM-DD');
        const isFull = dayStatuses[key] === 'reserved';
        if (isFull) return true;
        
        // If no start date selected, disable all dates
        if (!start) return true;
        
        const startDate = dayjs(start);
        
        // Limit end date to 3 days after start date
        const maxAllowedDate = startDate.add(3, 'days').endOf('day');
        
        // Also limit to the end of the month of the selected start date
        const endOfMonth = startDate.endOf('month');
        
        // Use whichever comes first: 3 days after start or end of month
        const finalMaxDate = maxAllowedDate.isAfter(endOfMonth) ? endOfMonth : maxAllowedDate;
        
        const isBeforeStart = cur.startOf('day').isBefore(startDate.startOf('day'));
        const isAfterMaxDate = cur.startOf('day').isAfter(finalMaxDate);
        
        return isBeforeStart || isAfterMaxDate;
    };

    // Custom cell renderer for DatePicker calendar - matching reschedule_modal.jsx
    const cellRender = (current) => {
        if (!current) return <div className="ant-picker-cell-inner">&nbsp;</div>;
        const cur = dayjs(current);
        if (!cur.isValid()) {
            return <div className="ant-picker-cell-inner">&nbsp;</div>;
        }
        const key = cur.format('YYYY-MM-DD');
        const status = dayStatuses[key];
        let bg = null;
        if (status === 'available') bg = '#ECFDF5'; // green-50
        else if (status === 'partial') bg = '#FEF3C7'; // amber-100
        else if (status === 'reserved') bg = '#FEE2E2'; // red-100

        return (
            <div
                className="ant-picker-cell-inner"
                style={{
                    backgroundColor: bg || 'transparent',
                    borderRadius: '4px',
                    ...(bg && { fontWeight: '500' })
                }}
            >
                {cur.date()}
            </div>
        );
    };

    // Time disabling logic with conflict blocking - matching reschedule_modal.jsx
    const BUSINESS_START_HOUR = 4; // 4 AM
    const BUSINESS_END_HOUR = 22; // 10 PM

    const disabledHoursForDate = (dateValue, extraBlockAfterHour = null) => {
        const date = dateValue ? dayjs(dateValue) : null;
        // const toLabel = (h) => dayjs().hour(h).minute(0).second(0).format('h A');

        const isHourBlocked = (hour) => {
            if (!date) return false;
            const startOfHour = dayjs(date).hour(hour).minute(0).second(0);
            const endOfHour = startOfHour.add(1, 'hour');

            // Check if the hour slot [startOfHour, endOfHour) overlaps any block
            const overlaps = availabilityBlocks.some(b => {
                // Only check blocks that overlap with this date
                const blockStart = b.start;
                const blockEnd = b.end;
                const dayStart = dayjs(date).startOf('day');
                const dayEnd = dayjs(date).endOf('day');

                // Check if block overlaps with this date
                if (blockEnd.isAfter(dayStart) && blockStart.isBefore(dayEnd)) {
                    // Check if this hour overlaps with the block
                    return startOfHour.isBefore(blockEnd) && endOfHour.isAfter(blockStart);
                }
                return false;
            });

            if (overlaps) return true;

            // Inclusive end-hour rule: if a block ends exactly at the top of an hour (e.g., 17:00),
            // also disable that hour (e.g., 5 PM) so 13:00–17:00 blocks 1 PM through 5 PM (5 hours).
            const inclusiveEndHit = availabilityBlocks.some(b => {
                const dayStart = dayjs(date).startOf('day');
                const dayEnd = dayjs(date).endOf('day');

                // Only check blocks overlapping this date
                if (b.end.isAfter(dayStart) && b.start.isBefore(dayEnd)) {
                    return b.end.minute() === 0 && b.end.second() === 0 && startOfHour.isSame(b.end, 'hour');
                }
                return false;
            });

            return inclusiveEndHit;
        };

        const arr = [];
        for (let h = 0; h < 24; h++) {
            // Block business hours
            if (h < BUSINESS_START_HOUR || h >= BUSINESS_END_HOUR) {
                arr.push(h);
                continue;
            }
            // Block conflicting hours
            if (isHourBlocked(h)) {
                arr.push(h);
                continue;
            }
            // Extra blocking (e.g., for end time based on start time)
            if (extraBlockAfterHour != null && h <= extraBlockAfterHour) {
                arr.push(h);
                continue;
            }
        }

        return Array.from(new Set(arr)).sort((a, b) => a - b);
    };

    const checkCancelEligibility = async () => {
        try {
            const userId = SecureStorage.getLocalItem('user_id');
            console.log('Check cancel eligibility - User ID:', userId);
            console.log('Check cancel eligibility - Reservation ID:', localReservationDetails.reservation_id);
            console.log('Check cancel eligibility - Base URL:', baseUrl);

            if (!userId) {
                toast.error('User session expired');
                return;
            }

            if (!localReservationDetails.reservation_id) {
                toast.error('Invalid reservation ID');
                return;
            }

            // First, check if reservation is being processed by admin
            const checkRequestData = {
                operation: 'checkCancelEligibility',
                reservation_id: localReservationDetails.reservation_id,
                user_id: userId
            };

            console.log('Check cancel eligibility - Request data:', checkRequestData);
            console.log('Check cancel eligibility - Full URL:', `${baseUrl}faculty&staff.php`);

            const response = await fetch(`${baseUrl}faculty&staff.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkRequestData)
            });

            console.log('Check cancel eligibility - Response status:', response.status);
            console.log('Check cancel eligibility - Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Check cancel eligibility - Response data:', result);

            if (result.status === 'error' && result.message && result.message.includes('already being processed by admin')) {
                // Show admin processing modal
                setAdminProcessingReason('admin_processing');
                setShowAdminProcessingModal(true);
                return;
            }

            if (result.status === 'error' && result.message && result.message.includes('currently active and within its scheduled time range')) {
                // Show admin processing modal for time range restriction
                setAdminProcessingReason('time_range');
                setShowAdminProcessingModal(true);
                return;
            }

            // If not being processed, show confirmation modal
            setShowCancelModal(true);

        } catch (error) {
            console.error('Error checking cancel eligibility:', error);
            if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to check cancellation eligibility.');
                return;
            }
            // On network errors, show confirmation modal
            setShowCancelModal(true);
        }
    };

    const handleCancelReservation = async () => {
        try {
            const userId = SecureStorage.getLocalItem('user_id');
            console.log('Cancel reservation - User ID:', userId);
            console.log('Cancel reservation - Reservation ID:', localReservationDetails.reservation_id);
            console.log('Cancel reservation - Base URL:', baseUrl);

            if (!userId) {
                toast.error('User session expired');
                return;
            }

            if (!localReservationDetails.reservation_id) {
                toast.error('Invalid reservation ID');
                return;
            }

            const requestData = {
                operation: 'handleCancelReservation',
                reservation_id: localReservationDetails.reservation_id,
                user_id: userId
            };

            console.log('Cancel reservation - Request data:', requestData);
            console.log('Cancel reservation - Full URL:', `${baseUrl}faculty&staff.php`);

            const response = await fetch(`${baseUrl}faculty&staff.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            console.log('Cancel reservation - Response status:', response.status);
            console.log('Cancel reservation - Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Cancel reservation - Response data:', result);

            if (result.status === 'success') {
                toast.success(result.message || 'Reservation cancelled successfully!');
                setShowCancelModal(false);
                onClose();
                if (onRefresh) onRefresh();
            } else if (result.status === 'error' && result.message && result.message.includes('already being processed by admin')) {
                // Show admin processing modal if reservation is being processed
                setShowCancelModal(false);
                setAdminProcessingReason('admin_processing');
                setShowAdminProcessingModal(true);
            } else if (result.status === 'error' && result.message && result.message.includes('currently active and within its scheduled time range')) {
                // Show admin processing modal for time range restriction
                setShowCancelModal(false);
                setAdminProcessingReason('time_range');
                setShowAdminProcessingModal(true);
            } else {
                console.error('Cancel reservation failed:', result);
                toast.error(result.message || 'Failed to cancel reservation');
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to cancel reservation.');
            } else {
                toast.error(`Failed to cancel reservation: ${error.message}`);
            }
        }
    };

    // Check if reservation is cancelled or completed
    const statusHistory = localReservationDetails.status_history || localReservationDetails.statusHistory || [];

    const isCancelled = statusHistory.some(
        status => status.status_name === "Cancelled"
    );

    const isReservationDeclined = statusHistory.some(
        status => {
            const declinedById = status.status_id === 2;
            const declinedByName = status.status_name === "Decline";
            const isActiveStatus = status.reservation_active === 1;
            return (declinedById || declinedByName) && isActiveStatus;
        }
    ) || (localReservationDetails.status_name?.toLowerCase() === "decline");

    const isRescheduleDeclined = statusHistory.some(
        status => {
            const reschedDeclinedById = Number(status.status_id) === 13;
            const name = String(status.status_name || '').toLowerCase();
            const reschedDeclinedByName = name.includes('reschedule') && name.includes('declin');
            return reschedDeclinedById || reschedDeclinedByName;
        }
    );

    const isCompleted = statusHistory.some(
        status => {
            const completedById = status.status_id === 4;
            const completedByName = status.status_name === "Completed";
            const isActiveStatus = status.reservation_active === 1;
            return (completedById || completedByName) && isActiveStatus;
        }
    ) || (localReservationDetails.status_name?.toLowerCase() === "completed");

    console.log(isCompleted);

    // Helper: Check if both vehicle and equipment are present
    const hasVehicleAndEquipment = localReservationDetails.vehicles?.length > 0 && localReservationDetails.equipment?.length > 0;

    // Detect reschedule confirmed status from status history
    const statusArr = localReservationDetails.status_history || localReservationDetails.statusHistory || [];
    const rescheduleConfirmedStatus = statusArr.find(s => {
        const activeVal = Number(s.reservation_active ?? s.is_approved ?? 0);
        return (String(s.status_id) === '10' && activeVal === 1) || String(s.status_id) === '14';
    });
    const pendingRescheduleStatus = statusArr.find(s => {
        const name = (s.status_name || '').toLowerCase();
        const activeVal = Number(s.reservation_active ?? s.is_approved ?? 0);
        return name.includes('reschedule') && activeVal === 0;
    });

    const latestRescheduleUpdate = (() => {
        const toDateValue = (val) => {
            if (!val) return null;
            const d = new Date(val);
            return Number.isNaN(d.getTime()) ? null : d;
        };

        const candidates = (statusArr || [])
            .filter(s => [10, 11, 13, 14].includes(Number(s.status_id)))
            .map(s => {
                const updatedAt = toDateValue(s.reservation_updated_at || s.updated_at || s.created_at);
                return {
                    ...s,
                    __updatedAt: updatedAt,
                    __fallbackId: Number(s.reservation_status_id || s.id || 0)
                };
            });

        if (!candidates.length) return null;

        candidates.sort((a, b) => {
            const at = a.__updatedAt ? a.__updatedAt.getTime() : 0;
            const bt = b.__updatedAt ? b.__updatedAt.getTime() : 0;
            if (bt !== at) return bt - at;
            return (b.__fallbackId || 0) - (a.__fallbackId || 0);
        });

        const latest = candidates[0];
        const sid = Number(latest.status_id);

        if (sid === 10 || sid === 14) {
            const acceptedReasonEntry = (candidates.find(c => Number(c.status_id) === 14 && c.reservation_reason && String(c.reservation_reason).trim() !== '')) || null;
            return { kind: 'accepted', entry: latest, reasonEntry: acceptedReasonEntry };
        }
        if (sid === 13) {
            return { kind: 'declined', entry: latest };
        }
        return { kind: 'pending', entry: latest };
    })();
    const venueChanges = Array.isArray(localReservationDetails.venues)
        ? localReservationDetails.venues.filter(v => (
            (v.change_venue_name && v.change_venue_name.trim() !== '') ||
            (v.change_venue_id && String(v.change_venue_id) !== String(v.venue_id)) ||
            (v.change_venue_id !== null && v.change_venue_id !== undefined)
        ))
        : [];
    const hasVenueChange = venueChanges.length > 0;
    const vehicleChanges = Array.isArray(localReservationDetails.vehicles)
        ? localReservationDetails.vehicles.filter(v => (
            (v.change_vehicle_model && v.change_vehicle_model.trim() !== '') ||
            (v.change_vehicle_id && String(v.change_vehicle_id) !== String(v.vehicle_id)) ||
            (v.change_vehicle_license && String(v.change_vehicle_license).trim() !== '' && String(v.change_vehicle_license) !== String(v.license)) ||
            (v.change_vehicle_id !== null && v.change_vehicle_id !== undefined) ||
            (v.change_vehicle_model !== null && v.change_vehicle_model !== undefined)
        ))
        : [];
    const hasVehicleChange = vehicleChanges.length > 0;
    // const hasRescheduleProposal = !!pendingRescheduleStatus || (!!(localReservationDetails.reschedule_start_date || localReservationDetails.reschedule_end_date) && !rescheduleConfirmedStatus) || (hasVenueChange && !rescheduleConfirmedStatus) || (hasVehicleChange && !rescheduleConfirmedStatus);
    // New: proposal exists regardless of card visibility – used to force-enable actions
    const hasAnyProposal = !!pendingRescheduleStatus || !!(localReservationDetails.reschedule_start_date || localReservationDetails.reschedule_end_date) || hasVenueChange || hasVehicleChange;

    // Status-based visibility controls
    const normalizedStatusHistory = Array.isArray(localReservationDetails.status_history)
        ? localReservationDetails.status_history
        : (Array.isArray(localReservationDetails.statusHistory) ? localReservationDetails.statusHistory : []);

    // Check if there's any Reschedule status (active or inactive)
    // const hasRescheduleStatus = normalizedStatusHistory.some(s => 
    //     String(s.status_name).toLowerCase() === 'reschedule'
    // );

    // Check if there's an active Reschedule status
    const hasActiveReschedule = normalizedStatusHistory.some(s =>
        String(s.status_name).toLowerCase() === 'reschedule' && Number(s.reservation_active) === 1
    );

    // New approach: Only show reschedule card if there's an active pending reschedule that needs user response
    // Check if there's a pending Reschedule status (active: 0) AND no newer finalized status after it
    // const pendingRescheduleEntry = normalizedStatusHistory.find(s =>
    //     String(s.status_name).toLowerCase() === 'reschedule' && Number(s.reservation_active) === 0
    // );

    // If there's a pending reschedule, check if there's any newer status that would override it
    const showReschedulePendingCard = false;

    // Effective schedule window: if there's an active reschedule, use reschedule dates; otherwise use original
    const startDateStr = (hasActiveReschedule && localReservationDetails.reschedule_start_date)
        ? localReservationDetails.reschedule_start_date
        : localReservationDetails.reservation_start_date;
    const endDateStr = (hasActiveReschedule && localReservationDetails.reschedule_end_date)
        ? localReservationDetails.reschedule_end_date
        : localReservationDetails.reservation_end_date;
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;
    const now = new Date();
    const isDuringReservationWindow = (startDate && endDate) ? (now >= startDate && now < endDate) : false;
    const isPastEndDate = (endDate) ? (now > endDate) : false;
    const isActiveRecord = String(localReservationDetails.active) === "1";
    const isActiveRecordEffective = isActiveRecord || isRescheduleDeclined;

    // Status-based button logic based on requirements:
    // - If status is "Proccessed" (status_id 7): disable both Request Reschedule and Cancel Reservation
    // - Enable Request Reschedule if status is "Reschedule" or "Reserved" (but NOT "Reschedule Confirmed")
    // - Enable Cancel Reservation if status is "Pending" or "Reserved" or "Reschedule" or "Reschedule Confirmed"

    const currentStatusId = localReservationDetails.status_id;
    const currentStatusName = localReservationDetails.status_name?.toLowerCase();
    // const currentUserLevelId = parseInt(SecureStorage.getLocalItem('user_level_id'), 10);
    const adminLevelIds = [1, 2, 4];

    const pendingRescheduleEntry = normalizedStatusHistory.find(s => Number(s.status_id) === 11 && Number(s.reservation_active) === 0);
    const pendingInitiatorLevelId = pendingRescheduleEntry?.updated_by_level_id;
    const isPendingReschedule = !!pendingRescheduleEntry;
    const isPendingRescheduleFromAdmin = isPendingReschedule && pendingInitiatorLevelId != null && adminLevelIds.includes(Number(pendingInitiatorLevelId));

    // Check if status is being processed (status_id 7 or status_name "proccessed")
    const isBeingProcessed = currentStatusId === 7 || currentStatusName === 'proccessed';

    const isRescheduleDeclinedStatusName = !!currentStatusName && currentStatusName.includes('reschedule') && currentStatusName.includes('declin');
    const allowsRescheduleRequest = (currentStatusName === 'reserved' || currentStatusName === 'reschedule' || isRescheduleDeclinedStatusName || isRescheduleDeclined)
        && !isBeingProcessed
        && !rescheduleConfirmedStatus;

    // Check if status allows reschedule (Reschedule or Reserved, but not Processed, and NOT Reschedule Confirmed)
    // const allowsReschedule = (currentStatusName === 'reschedule' || currentStatusName === 'reserved') && !isBeingProcessed && !rescheduleConfirmedStatus;

    // Check if status allows cancellation (Pending, Reserved, Reschedule, but not Processed, OR Reschedule Confirmed)
    const allowsCancellation = ((currentStatusName === 'pending' || currentStatusName === 'reserved' || currentStatusName === 'reschedule' || isRescheduleDeclinedStatusName || isRescheduleDeclined) && !isBeingProcessed) || !!rescheduleConfirmedStatus;

    // Final disable logic for Cancel and Reschedule buttons
    // For Pending status, allow cancellation even if active is 0 (not yet processed)
    // For Reschedule Confirmed status, allow cancellation but disable reschedule
    const baseDisableCancel = ((currentStatusName !== 'pending' && !isActiveRecordEffective) && !rescheduleConfirmedStatus) || isDuringReservationWindow || isBeingProcessed || !allowsCancellation;
    // const baseDisableReschedule = (!isActiveRecord) || isDuringReservationWindow || isBeingProcessed || !allowsReschedule;

    // If there's any proposal, allow actions unless being processed
    const allowNewActionsWithProposal = hasAnyProposal && !isDuringReservationWindow && !isPastEndDate && !isBeingProcessed;
    const effectiveDisableCancel = allowNewActionsWithProposal ? !allowsCancellation : baseDisableCancel;
    // const effectiveDisableReschedule = allowNewActionsWithProposal ? !allowsReschedule : baseDisableReschedule;

    // Hide buttons completely if reservation is past end date
    const hideButtons = isPastEndDate;

    const handleRespondReschedule = async () => {
        toast.error('Reschedule confirmation is no longer required. Reschedules are applied automatically.');
    };

    // const handleRequestReschedule = () => {
    //     // Check if this is a Change Request status
    //     const isChangeRequest = reservationDetails.status_name === "Change Request";

    //     console.log('[MyReservationDetails] Opening RescheduleModal:', {
    //         isChangeRequest,
    //         venues: reservationDetails.venues,
    //         vehicles: reservationDetails.vehicles,
    //         equipment: reservationDetails.equipment
    //     });

    //     // Extract resource IDs and quantities from reservationDetails
    //     const resources = {
    //         venueIds: (reservationDetails.venues || []).map(v => {
    //             if (isChangeRequest) {
    //                 // For Change Request: return full object with change IDs
    //                 return {
    //                     venue_id: v.venue_id || v.ven_id,
    //                     change_venue_id: v.change_venue_id || null,
    //                     reservation_venue_id: v.reservation_venue_id,
    //                     change_venue_event_type: v.change_venue_event_type || v.event_type
    //                 };
    //             }
    //             // For normal reservations: return just the ID
    //             return v.venue_id || v.ven_id;
    //         }),
    //         vehicleIds: (reservationDetails.vehicles || []).map(v => {
    //             if (isChangeRequest) {
    //                 // For Change Request: return full object with change IDs
    //                 return {
    //                     vehicle_id: v.vehicle_id,
    //                     change_vehicle_id: v.change_vehicle_id || null,
    //                     reservation_vehicle_id: v.reservation_vehicle_id
    //                 };
    //             }
    //             // For normal reservations: return just the ID
    //             return v.vehicle_id;
    //         }),
    //         equipment: (reservationDetails.equipment || []).map(eq => ({
    //             equipment_id: eq.equipment_id || eq.equip_id,
    //             name: eq.name || eq.equipment_name,
    //             quantity: parseInt(eq.quantity, 10) || 0
    //         }))
    //     };

    //     console.log('[MyReservationDetails] Extracted resources:', resources);
    //     setRescheduleResources(resources);
    //     setIsRescheduleModalOpen(true);
    // };

    const handleRescheduleSubmit = async (rescheduleData) => {
        try {
            console.log('[MyReservationDetails] Reschedule request submitted:', rescheduleData);

            // Handle reschedule request submission
            const userId = SecureStorage.getLocalItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                return;
            }

            const response = await axios.post(`${baseUrl}reservation.php`, {
                operation: 'requestReschedule',
                reservation_id: reservationDetails.reservation_id,
                reschedule_start_date: rescheduleData.startDate,
                reschedule_end_date: rescheduleData.endDate,
                user_id: Number(userId),
                reason: rescheduleData.reason || null
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data?.status === 'success') {
                toast.success('Reschedule request submitted successfully!');
                setIsRescheduleModalOpen(false);
                if (onRefresh) {
                    await onRefresh();
                }
                onClose();
            } else {
                toast.error(response.data?.message || 'Failed to submit reschedule request.');
            }
        } catch (error) {
            console.error('Error submitting reschedule request:', error);
            if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to submit reschedule request.');
            } else {
                toast.error('Error submitting reschedule request. Please try again.');
            }
        }
    };

    const handleRequestAgain = async (requestAgainData) => {
        try {
            console.log('[MyReservationDetails] Request again submitted:', requestAgainData);
            setIsProcessingReschedule(true);

            const encryptedUrl = SecureStorage.getLocalItem("url");
            if (!encryptedUrl) {
                toast.error("API URL configuration is missing");
                return;
            }

            const { startDate, endDate, venueIds: newVenueIds, vehicleIds: newVehicleIds } = requestAgainData;

            // Step 1: Update reservation dates if provided
            let didUpdateSomething = false;
            console.log('[MyReservationDetails] Checking if dates provided:', { startDate, endDate });
            if (startDate && endDate) {
                const dateResp = await axios.post(`${encryptedUrl}/faculty&staff.php`, {
                    operation: 'updateReservationReschedule',
                    reservation_id: reservationDetails?.reservation_id,
                    reschedule_start_date: startDate,
                    reschedule_end_date: endDate,
                    user_admin_id: SecureStorage.getLocalItem('user_id')
                }, { headers: { 'Content-Type': 'application/json' } });

                if (!(dateResp?.data?.status === 'success')) {
                    const msg = dateResp?.data?.message || 'Failed to update reservation dates';
                    toast.error(msg);
                    return;
                }
                didUpdateSomething = true;
            }

            // Step 2: Process venue changes
            const currentVenues = Array.isArray(reservationDetails?.venues) ? reservationDetails.venues : [];

            const venue_changes = currentVenues
                .map((v, idx) => {
                    const newId = Array.isArray(newVenueIds) ? newVenueIds[idx] : undefined;

                    // Skip if newId is undefined (not provided in array)
                    if (newId === undefined) return null;

                    // Process if newId is different from current (including null for removal)
                    if (String(newId) === String(v.venue_id)) return null;

                    return {
                        reservation_venue_id: v.reservation_venue_id,
                        reservation_change_venue_id: newId === null ? null : Number(newId)
                    };
                })
                .filter(change => change !== null);

            if (venue_changes.length > 0) {
                const requests = venue_changes.map(change => {
                    return axios.post(`${encryptedUrl}/faculty&staff.php`, {
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
                        || 'Failed to reschedule reservation venues';
                    toast.error(firstError);
                    return;
                }
                didUpdateSomething = true;
            }

            // Step 3: Process vehicle changes
            const currentVehicles = Array.isArray(reservationDetails?.vehicles) ? reservationDetails.vehicles : [];

            const vehicle_changes = currentVehicles
                .map((v, idx) => {
                    const newId = Array.isArray(newVehicleIds) ? newVehicleIds[idx] : undefined;

                    // Skip if newId is undefined (not provided in array)
                    if (newId === undefined) return null;

                    // Process if newId is different from current (including null for removal)
                    if (String(newId) === String(v.vehicle_id)) return null;

                    return {
                        reservation_vehicle_id: v.reservation_vehicle_id,
                        reservation_change_vehicle_id: newId === null ? null : Number(newId)
                    };
                })
                .filter(change => change !== null);

            if (vehicle_changes.length > 0) {
                const requests = vehicle_changes.map(change => {
                    return axios.post(`${encryptedUrl}/faculty&staff.php`, {
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
                        || 'Failed to reschedule reservation vehicles';
                    toast.error(firstError);
                    return;
                }
                didUpdateSomething = true;
            }

            if (!didUpdateSomething) {
                toast.info('No changes to update.');
                return;
            }

            toast.success('Reservation rescheduled successfully');
            setIsRescheduleModalOpen(false);
            if (onRefresh) {
                await onRefresh();
            }
            onClose();

        } catch (error) {
            console.error('Error submitting reschedule request:', error);
            if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to submit reschedule request.');
            } else {
                toast.error('Error submitting reschedule request. Please try again.');
            }
        } finally {
            setIsProcessingReschedule(false);
        }
    };

    const handleRequestAgainClick = () => {
        try {
            // Extract reservation data for re-request
            const requestAgainData = {
                reservation_title: reservationDetails.reservation_title,
                reservation_description: reservationDetails.reservation_description,
                participants: reservationDetails.participants || '',
                purpose: reservationDetails.purpose || '',
                destination: reservationDetails.destination || '',
                venue_id: reservationDetails.venues?.length > 0 ? reservationDetails.venues.map(v => v.venue_id) : null,
                vehicle_id: reservationDetails.vehicles?.length > 0 ? reservationDetails.vehicles.map(v => v.vehicle_id) : null,
                equipment_id: reservationDetails.equipment?.length > 0 ? reservationDetails.equipment.map(e => parseInt(e.equipment_id, 10)) : null,
                quantity: reservationDetails.equipment?.length > 0 ? reservationDetails.equipment.map(e => parseInt(e.quantity, 10)) : null,
            };

            console.log('[Request Again] Extracted data:', {
                venues: requestAgainData.venue_id,
                vehicles: requestAgainData.vehicle_id,
                equipment: requestAgainData.equipment_id,
                quantities: requestAgainData.quantity,
                rawEquipment: reservationDetails.equipment
            });

            // Determine reservation type (priority: venue > vehicle > equipment)
            let type = '';
            if (Array.isArray(requestAgainData.venue_id) && requestAgainData.venue_id.length > 0) {
                type = 'venue';
            } else if (Array.isArray(requestAgainData.vehicle_id) && requestAgainData.vehicle_id.length > 0) {
                type = 'vehicle';
            } else if (Array.isArray(requestAgainData.equipment_id) && requestAgainData.equipment_id.length > 0) {
                type = 'equipment';
            }

            console.log('[Request Again] Determined type:', type);

            // Determine navigation path based on user role
            const userLevelId = SecureStorage.getLocalItem('user_level_id');
            const userLevel = parseInt(userLevelId);

            let navigationPath = '';
            // Faculty users (level 3, 15, 18)
            if (userLevel === 3 || userLevel === 15) {
                navigationPath = '/Faculty/addReservation';
            }
            // Department users (level 5, 6, 16, 17)
            else if (userLevel === 5 || userLevel === 6 || userLevel === 16 || userLevel === 17 || userLevel === 18) {
                navigationPath = '/Department/addReservation';
            }

            // Determine if we should skip to date selection
            // Only skip if there's NO equipment (pure venue or pure vehicle)
            const hasEquipment = requestAgainData.equipment_id && requestAgainData.equipment_id.length > 0;
            const skipToDateSelection = !hasEquipment; // Only skip if no equipment

            console.log('[Request Again] Navigation decision:', {
                type,
                hasEquipment,
                skipToDateSelection,
                equipment_count: requestAgainData.equipment_id?.length || 0
            });

            // Navigate to AddReservation with the data
            navigate(navigationPath, {
                state: {
                    requestAgainData,
                    type,
                    skipToDateSelection
                }
            });

            // Close the modal
            onClose();
        } catch (error) {
            console.error('Error preparing request again data:', error);
            if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to prepare request.');
            } else {
                toast.error('Failed to prepare request again data');
            }
        }
    };

    // Edit functionality handlers
    // const handleEditClick = async () => {
    //     // Only allow editing if status is Pending (status_id = 1)
    //     if (localReservationDetails.status_id !== 1) {
    //         toast.error('You can only edit reservations that are in Pending status');
    //         return;
    //     }

    //     setIsEditMode(true);

    //     // Parse existing dates
    //     const startDateTime = dayjs(localReservationDetails.reservation_start_date);
    //     const endDateTime = dayjs(localReservationDetails.reservation_end_date);

    //     editForm.setFieldsValue({
    //         title: localReservationDetails.reservation_title,
    //         description: localReservationDetails.reservation_description,
    //         startDate: startDateTime,
    //         startTime: startDateTime,
    //         endDate: endDateTime,
    //         endTime: endDateTime
    //     });

    //     // Check current availability immediately when entering edit mode
    //     console.log('[Edit] Checking current date availability on edit open...');
    //     const currentStartDateTime = startDateTime.format('YYYY-MM-DD HH:mm:ss');
    //     const currentEndDateTime = endDateTime.format('YYYY-MM-DD HH:mm:ss');

    //     await checkAvailability(currentStartDateTime, currentEndDateTime);
    // };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        editForm.resetFields();
        setAvailabilityError(null);
    };

    const handleSaveEdit = async () => {
        try {
            const values = await editForm.validateFields();
            setIsUpdating(true);
            setAvailabilityError(null);

            const userId = SecureStorage.getLocalItem('user_id');

            // Combine date and time for start and end
            const startDateTime = dayjs(values.startDate)
                .hour(dayjs(values.startTime).hour())
                .minute(0)
                .second(0)
                .format('YYYY-MM-DD HH:mm:ss');

            const endDateTime = dayjs(values.endDate)
                .hour(dayjs(values.endTime).hour())
                .minute(0)
                .second(0)
                .format('YYYY-MM-DD HH:mm:ss');

            // Check if dates have changed
            const originalStart = dayjs(localReservationDetails.reservation_start_date).format('YYYY-MM-DD HH:mm:ss');
            const originalEnd = dayjs(localReservationDetails.reservation_end_date).format('YYYY-MM-DD HH:mm:ss');
            const datesChanged = startDateTime !== originalStart || endDateTime !== originalEnd;

            // Check availability if dates changed
            if (datesChanged) {
                console.log('[Edit] Dates changed, checking availability...');
                const isAvailable = await checkAvailability(startDateTime, endDateTime);

                if (!isAvailable) {
                    setIsUpdating(false);
                    toast.error('Cannot update: Selected dates have conflicts with existing reservations');
                    return;
                }
            }

            const response = await axios.post(`${baseUrl}faculty&staff.php`, {
                operation: 'updateReservationDetails',
                reservation_id: reservationDetails.reservation_id,
                title: values.title,
                description: values.description,
                start_date: startDateTime,
                end_date: endDateTime,
                userId: parseInt(userId)
            });

            if (response.data.status === 'success') {
                toast.success('Reservation details updated successfully!');

                // Exit edit mode
                setIsEditMode(false);
                setAvailabilityError(null);

                // Fetch updated reservation details from backend
                await fetchRequestById();

                // Refresh parent component if callback provided
                if (onRefresh) {
                    onRefresh();
                }
            } else {
                // Show backend-provided error message if available and block further flow
                const msg = response?.data?.message || 'Failed to update reservation details';
                try { toast.dismiss(); } catch (e) {}
                toast.error(msg);
                Modal.error({
                    title: 'Update Blocked',
                    content: msg,
                });
                return;
            }
        } catch (error) {
            console.error('Error updating reservation details:', error);
            if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
                try { toast.dismiss(); } catch (e) {}
                toast.error('Network connection lost. Unable to update details.');
                Modal.error({
                    title: 'Network Error',
                    content: 'Network connection lost. Unable to update details.',
                });
            } else if (error.errorFields) {
                // Form validation errors
                try { toast.dismiss(); } catch (e) {}
                toast.error('Please fix the form errors');
            } else {
                // Surface server error message when available
                const serverMsg = error.response?.data?.message;
                const msg = serverMsg || 'Failed to update reservation details';
                try { toast.dismiss(); } catch (e) {}
                toast.error(msg);
                Modal.error({
                    title: 'Update Failed',
                    content: msg,
                });
            }
        } finally {
            setIsUpdating(false);
        }
    };

    // Resources rendered as responsive list cards (no Antd Table columns needed)

    // Mobile-friendly footer for Drawer
    const getMobileFooter = () => {
        const buttons = [];

        if (!isReservationDeclined) {
            buttons.push(
                <Button
                    key="close"
                    onClick={onClose}
                    size="large"
                    block
                    className="mb-2"
                >
                    Close
                </Button>
            );
        }

        if (isCompleted || isReservationDeclined) {
            buttons.push(
                <Button
                    key="request-again"
                    onClick={handleRequestAgainClick}
                    icon={<RedoOutlined />}
                    type="primary"
                    size="large"
                    block
                    className="bg-green-600 hover:bg-green-700 mb-2"
                >
                    Request Again
                </Button>
            );
        }

        if (!isCancelled && !isCompleted && !isReservationDeclined && !hideButtons) {
            if (allowsRescheduleRequest) {
                buttons.push(
                    <Button
                        key="request-reschedule"
                        onClick={() => setIsRescheduleModalOpen(true)}
                        disabled={isBeingProcessed}
                        size="large"
                        block
                        className="mb-2"
                    >
                        Request Reschedule
                    </Button>
                );
            }

            if (isPendingRescheduleFromAdmin) {
                buttons.push(
                    <Button
                        key="accept-proposal"
                        type="primary"
                        onClick={() => openRescheduleDecisionModal('accept')}
                        size="large"
                        block
                        className="mb-2"
                    >
                        Accept Reschedule
                    </Button>
                );
                buttons.push(
                    <Button
                        key="decline-proposal"
                        danger
                        onClick={() => openRescheduleDecisionModal('decline')}
                        size="large"
                        block
                        className="mb-2"
                    >
                        Decline Reschedule
                    </Button>
                );
            }
            buttons.push(
                // <Button
                //     key="request-reschedule"
                //     onClick={handleRequestReschedule}
                //     disabled={effectiveDisableReschedule}
                //     icon={<ScheduleOutlined />}
                //     size="large"
                //     block
                //     className={`mb-2 ${effectiveDisableReschedule ? 'opacity-50' : ''}`}
                // >
                //     {showReschedulePendingCard ? 'Request New Reschedule' : 'Request Reschedule'}
                // </Button>
            );

            buttons.push(
                <Button
                    key="cancel"
                    onClick={checkCancelEligibility}
                    disabled={effectiveDisableCancel}
                    danger
                    size="large"
                    block
                >
                    Cancel Reservation
                </Button>
            );
        }

        return <div className="flex flex-col">{buttons}</div>;
    };

    // Main modal content
    const modalContent = (
        <div className={`${isMobile ? 'h-full' : ''}`}>
            <div className={`${isMobile ? 'p-0 h-full flex flex-col' : 'p-0'}`}>
                {/* Enhanced Header Section - aligned with main reservation_details modal */}
                <div className={`bg-gradient-to-r from-green-700 to-lime-500 ${isMobile ? 'px-4 py-3 relative' : 'px-6 py-4'} ${isMobile ? 'rounded-none' : 'rounded-t-2xl'} shadow-md`}>
                    {/* Close button for mobile */}
                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
                        >
                            <CloseOutlined className="text-white text-sm" />
                        </button>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <UserOutlined className={`text-white ${isMobile ? 'text-base' : 'text-lg sm:text-xl'}`} />
                            </div>
                            <div>
                                <h1 className={`text-white font-bold tracking-wide ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                                    Reservation Details
                                </h1>
                            </div>
                        </div>
                        <div className="text-white text-left sm:text-right">
                            <p className="text-white/90 text-xs sm:text-sm font-medium">Created on</p>
                            <p className={`font-semibold break-words ${isMobile ? 'text-xs' : 'text-sm mt-1'}`}>
                                {new Date(reservationDetails.reservation_created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Enhanced Main Content */}
                <div className={`${isMobile ? 'p-3 pb-4 flex-1 overflow-auto' : 'p-6'} bg-gray-50 ${isMobile ? '' : 'rounded-b-2xl'}`}>
                    {/* Tabs Section */}
                    <Tabs defaultActiveKey="1" className="reservation-tabs" size={isMobile ? 'small' : 'default'}>
                        <TabPane tab={<span><InfoCircleOutlined /> {isMobile ? 'Info' : 'Details'}</span>} key="1">
                            {/* Enhanced Request Details Section */}
                            <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden mb-6">
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
                                            </div>
                                        </div>

                                        {/* Schedule and Details */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                                                <h3 className="text-md font-semibold text-gray-800">
                                                    Reservation Details
                                                </h3>
                                                {/* {!isEditMode && localReservationDetails.status_id === 1 && (
                                                    <Button
                                                        type="text"
                                                        icon={<EditOutlined />}
                                                        onClick={handleEditClick}
                                                        size="small"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        Edit
                                                    </Button>
                                                )} */}
                                            </div>

                                            {isEditMode ? (
                                                <Form
                                                    form={editForm}
                                                    layout="vertical"
                                                    className="space-y-3"
                                                    onValuesChange={() => {
                                                        try {
                                                            const values = editForm.getFieldsValue();
                                                            const titleChanged = (values.title ?? '').trim() !== (localReservationDetails?.reservation_title ?? '').trim();
                                                            const descChanged = (values.description ?? '').trim() !== (localReservationDetails?.reservation_description ?? '').trim();

                                                            const originalStart = dayjs(localReservationDetails?.reservation_start_date).format('YYYY-MM-DD HH:mm:ss');
                                                            const originalEnd = dayjs(localReservationDetails?.reservation_end_date).format('YYYY-MM-DD HH:mm:ss');

                                                            const composedStart = values.startDate && values.startTime
                                                                ? dayjs(values.startDate)
                                                                    .hour(dayjs(values.startTime).hour())
                                                                    .minute(0)
                                                                    .second(0)
                                                                    .format('YYYY-MM-DD HH:mm:ss')
                                                                : originalStart;

                                                            const composedEnd = values.endDate && values.endTime
                                                                ? dayjs(values.endDate)
                                                                    .hour(dayjs(values.endTime).hour())
                                                                    .minute(0)
                                                                    .second(0)
                                                                    .format('YYYY-MM-DD HH:mm:ss')
                                                                : originalEnd;

                                                            const datesChanged = composedStart !== originalStart || composedEnd !== originalEnd;
                                                            const dirty = titleChanged || descChanged || datesChanged;
                                                            setIsSaveDisabled(!dirty);
                                                        } catch (e) {
                                                            setIsSaveDisabled(true);
                                                        }
                                                    }}
                                                >
                                                    <Form.Item
                                                        name="title"
                                                        label={<span className="text-sm text-gray-500">Title</span>}
                                                        rules={[
                                                            { required: true, message: 'Title is required' },
                                                            {
                                                                validator: (_, value) => {
                                                                    if (value && value.trim() === '') {
                                                                        return Promise.reject(new Error('Title cannot contain only whitespace'));
                                                                    }
                                                                    return Promise.resolve();
                                                                }
                                                            }
                                                        ]}
                                                    >
                                                        <Input placeholder="Enter reservation title" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        name="description"
                                                        label={<span className="text-sm text-gray-500">Description</span>}
                                                        rules={[
                                                            { required: true, message: 'Description is required' },
                                                            {
                                                                validator: (_, value) => {
                                                                    if (value && value.trim() === '') {
                                                                        return Promise.reject(new Error('Description cannot contain only whitespace'));
                                                                    }
                                                                    return Promise.resolve();
                                                                }
                                                            }
                                                        ]}
                                                    >
                                                        <Input.TextArea
                                                            rows={3}
                                                            placeholder="Enter reservation description"
                                                        />
                                                    </Form.Item>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <Form.Item
                                                            name="startDate"
                                                            label={<span className="text-sm text-gray-500">Start Date</span>}
                                                            rules={[
                                                                { required: true, message: 'Start date is required' },
                                                                {
                                                                    validator: (_, value) => {
                                                                        if (!value) return Promise.resolve();
                                                                        const originalStartDate = localReservationDetails?.reservation_start_date;
                                                                        if (!originalStartDate) return Promise.resolve();
                                                                        
                                                                        // Validate that start date is not before original reservation start date
                                                                        const originalStartDay = dayjs(originalStartDate).startOf('day');
                                                                        if (value.isBefore(originalStartDay)) {
                                                                            return Promise.reject(new Error('Start date cannot be before the original reservation start date'));
                                                                        }
                                                                        return Promise.resolve();
                                                                    }
                                                                }
                                                            ]}
                                                        >
                                                            <DatePicker
                                                                format="YYYY-MM-DD"
                                                                className="w-full"
                                                                disabledDate={disabledDateStart}
                                                                cellRender={cellRender}
                                                                onChange={(date) => {
                                                                    // Reset end date and end time when start date changes
                                                                    if (date) {
                                                                        editForm.setFieldsValue({
                                                                            endDate: null,
                                                                            endTime: null
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            name="startTime"
                                                            label={<span className="text-sm text-gray-500">Start Time</span>}
                                                            rules={[
                                                                { required: true, message: 'Start time is required' },
                                                                {
                                                                    validator: (_, value) => {
                                                                        if (!value) return Promise.resolve();
                                                                        const hour = value.hour();
                                                                        if (hour < 4 || hour >= 22) {
                                                                            return Promise.reject(new Error('Time must be between 4:00 AM and 10:00 PM'));
                                                                        }
                                                                        return Promise.resolve();
                                                                    }
                                                                }
                                                            ]}
                                                        >
                                                            <TimePicker
                                                                format="h:mm A"
                                                                use12Hours
                                                                minuteStep={60}
                                                                className="w-full"
                                                                disabledHours={() => {
                                                                    const startDate = editForm.getFieldValue('startDate');
                                                                    return disabledHoursForDate(startDate);
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <Form.Item
                                                            name="endDate"
                                                            label={<span className="text-sm text-gray-500">End Date (Max 3 days, within same month)</span>}
                                                            rules={[
                                                                { required: true, message: 'End date is required' },
                                                                ({ getFieldValue }) => ({
                                                                    validator(_, value) {
                                                                        if (!value) return Promise.resolve();
                                                                        const startDate = getFieldValue('startDate');
                                                                        const startTime = getFieldValue('startTime');
                                                                        const endTime = getFieldValue('endTime');

                                                                        if (!startDate) {
                                                                            return Promise.reject(new Error('Please select start date first'));
                                                                        }

                                                                        const startDayjs = dayjs(startDate);
                                                                        
                                                                        // Validate max 3 days from start
                                                                        const maxAllowedDate = startDayjs.add(3, 'days').endOf('day');
                                                                        
                                                                        // Also validate within same month
                                                                        const endOfMonth = startDayjs.endOf('month');
                                                                        const finalMaxDate = maxAllowedDate.isAfter(endOfMonth) ? endOfMonth : maxAllowedDate;
                                                                        
                                                                        if (value.isAfter(finalMaxDate)) {
                                                                            if (maxAllowedDate.isAfter(endOfMonth)) {
                                                                                return Promise.reject(new Error('End date must be within the same month as start date'));
                                                                            } else {
                                                                                return Promise.reject(new Error('End date cannot be more than 3 days after start date'));
                                                                            }
                                                                        }

                                                                        if (startDate && startTime && endTime) {
                                                                            const start = dayjs(startDate).hour(dayjs(startTime).hour());
                                                                            const end = dayjs(value).hour(dayjs(endTime).hour());

                                                                            if (end.isBefore(start) || end.isSame(start)) {
                                                                                return Promise.reject(new Error('End date/time must be after start date/time'));
                                                                            }
                                                                        }
                                                                        return Promise.resolve();
                                                                    },
                                                                }),
                                                            ]}
                                                            dependencies={['startDate', 'startTime', 'endTime']}
                                                        >
                                                            <DatePicker
                                                                key={editForm.getFieldValue('startDate')?.format('YYYY-MM-DD') || 'no-start'}
                                                                format="YYYY-MM-DD"
                                                                className="w-full"
                                                                disabledDate={disabledDateEnd}
                                                                cellRender={cellRender}
                                                                placeholder="Select start date first"
                                                                defaultPickerValue={editForm.getFieldValue('startDate') || dayjs()}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            name="endTime"
                                                            label={<span className="text-sm text-gray-500">End Time</span>}
                                                            rules={[
                                                                { required: true, message: 'End time is required' },
                                                                {
                                                                    validator: (_, value) => {
                                                                        if (!value) return Promise.resolve();
                                                                        const hour = value.hour();
                                                                        if (hour < 4 || hour > 22) {
                                                                            return Promise.reject(new Error('Time must be between 4:00 AM and 10:00 PM'));
                                                                        }
                                                                        return Promise.resolve();
                                                                    }
                                                                },
                                                                ({ getFieldValue }) => ({
                                                                    validator(_, value) {
                                                                        if (!value) return Promise.resolve();
                                                                        const startDate = getFieldValue('startDate');
                                                                        const startTime = getFieldValue('startTime');
                                                                        const endDate = getFieldValue('endDate');

                                                                        if (startDate && startTime && endDate) {
                                                                            const start = dayjs(startDate).hour(dayjs(startTime).hour());
                                                                            const end = dayjs(endDate).hour(value.hour());

                                                                            if (end.isBefore(start) || end.isSame(start)) {
                                                                                return Promise.reject(new Error('End time must be after start time'));
                                                                            }
                                                                        }
                                                                        return Promise.resolve();
                                                                    },
                                                                }),
                                                            ]}
                                                            dependencies={['startDate', 'startTime', 'endDate']}
                                                        >
                                                            <TimePicker
                                                                format="h:mm A"
                                                                use12Hours
                                                                minuteStep={60}
                                                                className="w-full"
                                                                disabledHours={() => {
                                                                    const endDate = editForm.getFieldValue('endDate');
                                                                    const startDate = editForm.getFieldValue('startDate');
                                                                    const startTime = editForm.getFieldValue('startTime');

                                                                    // If same day, block hours before or equal to start hour
                                                                    let extraBlockAfterHour = null;
                                                                    if (endDate && startDate && startTime &&
                                                                        dayjs(endDate).isSame(dayjs(startDate), 'day')) {
                                                                        extraBlockAfterHour = dayjs(startTime).hour();
                                                                    }

                                                                    return disabledHoursForDate(endDate, extraBlockAfterHour);
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    </div>

                                                    {/* Availability Error Alert */}
                                                    {availabilityError && (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                            <p className="text-sm text-red-800 font-medium">⚠️ Availability Conflict</p>
                                                            <p className="text-sm text-red-600 mt-1">{availabilityError}</p>
                                                        </div>
                                                    )}

                                                    {/* Checking Availability Indicator */}
                                                    {checkingAvailability && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                            <div className="flex items-center gap-2">
                                                                <Spin size="small" />
                                                                <p className="text-sm text-blue-800">Checking availability...</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="primary"
                                                            icon={<SaveOutlined />}
                                                            onClick={handleSaveEdit}
                                                            loading={isUpdating}
                                                            disabled={isSaveDisabled || isUpdating}
                                                            size="small"
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            icon={<CloseOutlined />}
                                                            onClick={handleCancelEdit}
                                                            size="small"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </Form>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Title</p>
                                                        <p className="font-medium text-gray-900">{localReservationDetails.reservation_title}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Description</p>
                                                        <p className="font-medium text-gray-900">{localReservationDetails.reservation_description}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {!isEditMode && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                                                        <p className="font-medium text-gray-900">
                                                            {format(new Date((hasActiveReschedule && localReservationDetails.reschedule_start_date) ? localReservationDetails.reschedule_start_date : localReservationDetails.reservation_start_date), 'MMM dd, yyyy h:mm a')} -
                                                            {format(new Date((hasActiveReschedule && localReservationDetails.reschedule_end_date) ? localReservationDetails.reschedule_end_date : localReservationDetails.reservation_end_date), 'h:mm a')}
                                                        </p>
                                                    </div>
                                                    {/* Show participants if available */}
                                                    {reservationDetails.participants && (
                                                        <div>
                                                            <p className="text-sm text-gray-500 mb-1">Participants</p>
                                                            <p className="font-medium text-gray-900">{reservationDetails.participants}</p>
                                                        </div>
                                                    )}
                                                    {/* Show purpose if available */}
                                                    {reservationDetails.purpose && (
                                                        <div>
                                                            <p className="text-sm text-gray-500 mb-1">Purpose</p>
                                                            <p className="font-medium text-gray-900">{reservationDetails.purpose}</p>
                                                        </div>
                                                    )}
                                                    {/* Show destination if available */}
                                                    {reservationDetails.destination && (
                                                        <div>
                                                            <p className="text-sm text-gray-500 mb-1">Destination</p>
                                                            <p className="font-medium text-gray-900">{reservationDetails.destination}</p>
                                                        </div>
                                                    )}
                                                    {/* Show decline reason if available */}
                                                    {reservationDetails.decline_reason && (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                            <p className="text-sm text-red-700 font-medium mb-1">❌ Decline Reason</p>
                                                            <p className="text-sm text-red-900">{reservationDetails.decline_reason}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reschedule Confirmation Section */}
                            {showReschedulePendingCard && (
                                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 shadow-sm mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">Proposed Reschedule Pending Confirmation</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500">Original Date & Time</p>
                                            <p className="font-medium">
                                                {format(new Date(localReservationDetails.reservation_start_date), 'MMM dd, yyyy h:mm a')} -
                                                {format(new Date(localReservationDetails.reservation_end_date), 'h:mm a')}
                                            </p>
                                        </div>
                                        {(localReservationDetails.reschedule_start_date || localReservationDetails.reschedule_end_date) && (
                                            <div>
                                                <p className="text-sm text-gray-500">Proposed Date & Time</p>
                                                <p className="font-medium">
                                                    {localReservationDetails.reschedule_start_date ? format(new Date(localReservationDetails.reschedule_start_date), 'MMM dd, yyyy h:mm a') : '-'} -
                                                    {localReservationDetails.reschedule_end_date ? format(new Date(localReservationDetails.reschedule_end_date), 'h:mm a') : '-'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {hasVenueChange && !rescheduleConfirmedStatus && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500">Venue Change</p>
                                            <div className="space-y-2">
                                                {venueChanges.map(vc => (
                                                    <div key={vc.reservation_venue_id} className="flex items-center gap-2 text-sm">
                                                        <Tag color="default">{vc.venue_name}</Tag>
                                                        <span className="text-gray-500">→</span>
                                                        <Tag color="gold">{(vc.change_venue_name && vc.change_venue_name.trim()) || `ID ${vc.change_venue_id}`}</Tag>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {hasVehicleChange && !rescheduleConfirmedStatus && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500">Vehicle Change</p>
                                            <div className="space-y-2">
                                                {vehicleChanges.map(vc => (
                                                    <div key={vc.reservation_vehicle_id} className="flex items-center gap-2 text-sm">
                                                        <Tag color="default">{vc.model} ({vc.license})</Tag>
                                                        <span className="text-gray-500">→</span>
                                                        <Tag color="gold">{(vc.change_vehicle_model && vc.change_vehicle_model.trim()) || `ID ${vc.change_vehicle_id}`}{vc.change_vehicle_license ? ` (${vc.change_vehicle_license})` : ''}</Tag>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <Button
                                            type="primary"
                                            loading={isProcessingReschedule}
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => {
                                                Modal.confirm({
                                                    title: 'Confirm Reschedule',
                                                    content: 'Are you sure you want to confirm this reschedule? This will update your reservation with the new dates and details.',
                                                    okText: 'Yes, Confirm',
                                                    cancelText: 'No, Cancel',
                                                    okType: 'primary',
                                                    okButtonProps: { className: 'bg-green-600 hover:bg-green-700 border-green-600' },
                                                    onOk: () => handleRespondReschedule(true),
                                                });
                                            }}
                                        >
                                            Confirm Reschedule
                                        </Button>
                                        <Button
                                            type="primary"
                                            danger
                                            loading={isProcessingReschedule}
                                            onClick={() => {
                                                Modal.confirm({
                                                    title: 'Cancel Reschedule',
                                                    content: 'Are you sure you want to cancel this reschedule? This will reject the proposed changes and may result in your reservation being cancelled.',
                                                    okText: 'Yes, Cancel Reschedule',
                                                    cancelText: 'No, Keep Pending',
                                                    okType: 'danger',
                                                    onOk: () => handleRespondReschedule(false),
                                                });
                                            }}
                                        >
                                            Cancel Reschedule
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Reschedule Confirmed Section - Show venue/vehicle changes and reschedule dates */}
                            {/* {latestRescheduleUpdate && (
                                <div className={`p-4 rounded-lg border shadow-sm mb-6 ${
                                    latestRescheduleUpdate.kind === 'accepted'
                                        ? 'bg-green-50 border-green-200'
                                        : latestRescheduleUpdate.kind === 'declined'
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-orange-50 border-orange-200'
                                }`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-md font-medium text-gray-800">Latest Reschedule Request Update</h3>
                                            <div className="mt-1 text-sm text-gray-700">
                                                {latestRescheduleUpdate.kind === 'accepted' && (
                                                    <span>Your reschedule request has been accepted.</span>
                                                )}
                                                {latestRescheduleUpdate.kind === 'declined' && (
                                                    <span>Your reschedule request has been declined.</span>
                                                )}
                                                {latestRescheduleUpdate.kind === 'pending' && (
                                                    <span>Your reschedule request is pending review.</span>
                                                )}
                                            </div>
                                            {(() => {
                                                const rawReason = latestRescheduleUpdate.entry?.reservation_reason;
                                                const acceptedFallbackReason = latestRescheduleUpdate.reasonEntry?.reservation_reason;
                                                const finalReason = (rawReason && String(rawReason).trim() !== '')
                                                    ? String(rawReason).trim()
                                                    : (acceptedFallbackReason && String(acceptedFallbackReason).trim() !== '')
                                                        ? String(acceptedFallbackReason).trim()
                                                        : null;

                                                if (!finalReason) return null;

                                                return (
                                                    <div className="mt-2 text-sm text-gray-700">
                                                        <span className="font-medium">Reason:</span> <span className="italic">"{finalReason}"</span>
                                                    </div>
                                                );
                                            })()}
                                            {latestRescheduleUpdate.entry?.reservation_updated_at && (
                                                <div className="mt-1 text-xs text-gray-500">
                                                    {new Date(latestRescheduleUpdate.entry.reservation_updated_at).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <Tag color={
                                            latestRescheduleUpdate.kind === 'accepted'
                                                ? 'green'
                                                : latestRescheduleUpdate.kind === 'declined'
                                                    ? 'red'
                                                    : 'orange'
                                        }>
                                            {latestRescheduleUpdate.kind === 'accepted'
                                                ? 'Accepted'
                                                : latestRescheduleUpdate.kind === 'declined'
                                                    ? 'Declined'
                                                    : 'Pending'}
                                        </Tag>
                                    </div>
                                </div>
                            )} */}

                            {rescheduleConfirmedStatus && (
                                <div className="bg-green-50 p-6 rounded-lg border border-green-200 shadow-sm mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">Reschedule Confirmed</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500">Original Date & Time</p>
                                            <p className="font-medium">
                                                {format(new Date(localReservationDetails.reservation_start_date), 'MMM dd, yyyy h:mm a')} -
                                                {format(new Date(localReservationDetails.reservation_end_date), 'h:mm a')}
                                            </p>
                                        </div>
                                        {(localReservationDetails.reschedule_start_date || localReservationDetails.reschedule_end_date) && (
                                            <div>
                                                <p className="text-sm text-gray-500">New Date & Time</p>
                                                <p className="font-medium">
                                                    {localReservationDetails.reschedule_start_date ? format(new Date(localReservationDetails.reschedule_start_date), 'MMM dd, yyyy h:mm a') : '-'} -
                                                    {localReservationDetails.reschedule_end_date ? format(new Date(localReservationDetails.reschedule_end_date), 'h:mm a') : '-'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {hasVenueChange && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500">Venue Changes Applied</p>
                                            <div className="space-y-2">
                                                {venueChanges.map(vc => (
                                                    <div key={vc.reservation_venue_id} className="flex items-center gap-2 text-sm">
                                                        <Tag color="default">{vc.venue_name}</Tag>
                                                        <span className="text-gray-500">→</span>
                                                        <Tag color="green">{(vc.change_venue_name && vc.change_venue_name.trim()) || `ID ${vc.change_venue_id}`}</Tag>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {hasVehicleChange && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500">Vehicle Changes Applied</p>
                                            <div className="space-y-2">
                                                {vehicleChanges.map(vc => (
                                                    <div key={vc.reservation_vehicle_id} className="flex items-center gap-2 text-sm">
                                                        <Tag color="default">{vc.model} ({vc.license})</Tag>
                                                        <span className="text-gray-500">→</span>
                                                        <Tag color="green">{(vc.change_vehicle_model && vc.change_vehicle_model.trim()) || `ID ${vc.change_vehicle_id}`}{vc.change_vehicle_license ? ` (${vc.change_vehicle_license})` : ''}</Tag>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* To Be Reschedule Section - Show proposed reschedule info for status_id 11 */}
                            {isPendingReschedule && (
                                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 shadow-sm mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <InfoCircleOutlined className="text-orange-500 text-lg" />
                                        <h3 className="text-lg font-medium text-gray-800">Reschedule Proposal</h3>
                                    </div>
                                    <p className="text-sm text-orange-700 mb-4">
                                        An administrator has proposed changes to your reservation. Please review and accept or decline the proposal.
                                    </p>

                                 

                                    {/* Proposed Dates */}
                                    {localReservationDetails?.reschedule_start_date && localReservationDetails?.reschedule_end_date && (
                                        <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
                                            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                                <CalendarOutlined />
                                                Proposed Schedule
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600 mb-1">Original Dates:</p>
                                                    <p className="font-medium text-gray-800">
                                                        {format(new Date(localReservationDetails.reservation_start_date), 'MMM dd, yyyy h:mm a')} -
                                                        {format(new Date(localReservationDetails.reservation_end_date), 'h:mm a')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-blue-600 mb-1">Proposed Dates:</p>
                                                    <p className="font-medium text-blue-800">
                                                        {format(new Date(localReservationDetails.reschedule_start_date), 'MMM dd, yyyy h:mm a')} -
                                                        {format(new Date(localReservationDetails.reschedule_end_date), 'h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Venue Changes */}
                                    {localReservationDetails?.venues?.some(v => v.change_venue_id || v.change_venue_name) && (
                                        <div className="bg-white border border-orange-200 rounded-lg p-4 mb-4">
                                            <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                                <BuildOutlined />
                                                Venue Changes
                                            </h4>
                                            <div className="space-y-3">
                                                {localReservationDetails.venues
                                                    .filter(v => v.change_venue_id || v.change_venue_name)
                                                    .map((venue, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 text-sm">
                                                            <Tag color="default">{venue.venue_name}</Tag>
                                                            <span className="text-gray-500">→</span>
                                                            <Tag color="gold">{venue.change_venue_name || 'Unknown'}</Tag>
                                                            {venue.change_venue_building_name && (
                                                                <span className="text-xs text-gray-500">({venue.change_venue_building_name})</span>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vehicle Changes */}
                                    {localReservationDetails?.vehicles?.some(v => v.change_vehicle_id || v.change_vehicle_model) && (
                                        <div className="bg-white border border-purple-200 rounded-lg p-4 mb-4">
                                            <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                                <CarOutlined />
                                                Vehicle Changes
                                            </h4>
                                            <div className="space-y-3">
                                                {localReservationDetails.vehicles
                                                    .filter(v => v.change_vehicle_id || v.change_vehicle_model)
                                                    .map((vehicle, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 text-sm">
                                                            <Tag color="default">{vehicle.model} ({vehicle.license})</Tag>
                                                            <span className="text-gray-500">→</span>
                                                            <Tag color="purple">{vehicle.change_vehicle_model || 'Unknown'} {vehicle.change_vehicle_license ? `(${vehicle.change_vehicle_license})` : ''}</Tag>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

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
                                                dataSource={reservationDetails.venues.map((venue, index) => ({
                                                    ...venue,
                                                    key: venue.reservation_venue_id || venue.venue_id || index
                                                }))}
                                                columns={[
                                                    {
                                                        title: 'Venue Name',
                                                        dataIndex: 'venue_name',
                                                        key: 'venue_name',
                                                        render: (text, record) => {
                                                            const changedCandidate = hasActiveReschedule && (
                                                                (record.change_venue_name && record.change_venue_name.trim() !== '') ||
                                                                (!!record.change_venue_id && String(record.change_venue_id) !== String(record.venue_id))
                                                            );
                                                            const displayName = changedCandidate
                                                                ? ((record.change_venue_name && record.change_venue_name.trim()) || `ID ${record.change_venue_id}`)
                                                                : record.venue_name;
                                                            const displayBuildingName = changedCandidate
                                                                ? (record.change_venue_building_name || 'Location not specified')
                                                                : (record.venue_building_name || 'Location not specified');
                                                            return (
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <BuildOutlined className="mr-2 text-purple-500" />
                                                                        <div>
                                                                            {changedCandidate ? (
                                                                                <div>
                                                                                    <span className="font-medium">
                                                                                        <span className="text-red-600 line-through">{text}</span>
                                                                                        <span className="text-gray-500 mx-2">→</span>
                                                                                        <span className="text-green-600">{displayName}</span>
                                                                                    </span>
                                                                                    <div className="text-xs text-gray-500 mt-0.5">📍 {displayBuildingName}</div>
                                                                                </div>
                                                                            ) : (
                                                                                <div>
                                                                                    <span className="font-medium">{text}</span>
                                                                                    <div className="text-xs text-gray-500 mt-0.5">📍 {displayBuildingName}</div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {showAvailability && (
                                                                        <div className="flex flex-col items-end">
                                                                            <Tag color={checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                                                                {checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                                                                            </Tag>
                                                                        </div>
                                                                    )}
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
                                                ]}
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
                                                dataSource={reservationDetails.vehicles.map((vehicle, index) => ({
                                                    ...vehicle,
                                                    key: vehicle.reservation_vehicle_id || vehicle.vehicle_id || index
                                                }))}
                                                columns={[
                                                    {
                                                        title: 'Vehicle',
                                                        dataIndex: 'model',
                                                        key: 'model',
                                                        render: (text, record) => {
                                                            const displayModel = (record.change_vehicle_model && record.change_vehicle_model.trim() !== '')
                                                                ? record.change_vehicle_model
                                                                : record.model || `ID ${record.vehicle_id}`;
                                                            const displayMake = (record.change_vehicle_make && record.change_vehicle_make.trim() !== '')
                                                                ? record.change_vehicle_make
                                                                : record.make || 'N/A';
                                                            const displayYear = (record.change_vehicle_year && record.change_vehicle_year.trim() !== '')
                                                                ? record.change_vehicle_year
                                                                : record.year || 'N/A';
                                                            const availabilityVehicleId = (record.change_vehicle_id && String(record.change_vehicle_id) !== '')
                                                                ? record.change_vehicle_id
                                                                : record.vehicle_id;
                                                            const availability = checkResourceAvailability('vehicle', availabilityVehicleId, reservationDetails.availabilityData);
                                                            return (
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <CarOutlined className="mr-2 text-blue-500" />
                                                                        <div className="leading-tight">
                                                                            <div className="font-medium">{displayModel}</div>
                                                                            <div className="text-xs text-gray-600">
                                                                                {[
                                                                                    record.license || null,
                                                                                    displayMake || null,
                                                                                    displayYear || null,
                                                                                    record.category || null
                                                                                ].filter(Boolean).join(' • ')}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {showAvailability && (
                                                                        <Tag color={availability ? 'green' : 'red'}>
                                                                            {availability ? 'Available' : 'Not Available'}
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                    },
                                                    {
                                                        title: 'Driver',
                                                        dataIndex: 'driver',
                                                        key: 'driver',
                                                        render: (text, record) => {
                                                            const assignedDriver = reservationDetails.drivers?.find(
                                                                (driver) => String(driver.reservation_vehicle_id) === String(record.reservation_vehicle_id)
                                                            );
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <UserOutlined className={assignedDriver ? "text-green-500" : "text-gray-400"} />
                                                                    <span className={`text-sm ${assignedDriver ? "text-gray-800 font-medium" : "text-gray-400 italic"}`}>
                                                                        {assignedDriver ? assignedDriver.driver_name : 'No driver assigned'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                ]}
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
                                                dataSource={reservationDetails.equipment.map((equipment, index) => ({
                                                    ...equipment,
                                                    key: equipment.reservation_equipment_id || equipment.equipment_id || index
                                                }))}
                                                columns={[
                                                    {
                                                        title: 'Equipment',
                                                        dataIndex: 'name',
                                                        key: 'name',
                                                        render: (text, record) => {
                                                            const availability = checkResourceAvailability('equipment', record.equipment_id, reservationDetails.availabilityData);
                                                            return (
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <ToolOutlined className="mr-2 text-orange-500" />
                                                                        <div>
                                                                            <span className="font-medium">{text}</span>
                                                                            {record.units && record.units.length > 0 && (
                                                                                <span className="ml-2 text-xs text-gray-500">
                                                                                    ({record.units.length} unit{record.units.length > 1 ? 's' : ''} assigned)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {showAvailability && (
                                                                        <Tag color={availability ? 'green' : 'red'}>
                                                                            {availability ? 'Available' : 'Not Available'}
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                    },
                                                    {
                                                        title: 'Quantity',
                                                        dataIndex: 'quantity',
                                                        key: 'quantity',
                                                        render: (text) => (
                                                            <div className="flex flex-col items-center">
                                                                <Tag color="orange">Requested: {text}</Tag>
                                                            </div>
                                                        )
                                                    }
                                                ]}
                                                expandable={{
                                                    expandedRowRender: (record) => {
                                                        if (!record.units || record.units.length === 0) {
                                                            return <p className="text-gray-500 text-sm m-0 p-2">No units assigned yet</p>;
                                                        }
                                                        return (
                                                            <div className="p-2">
                                                                <p className="text-sm font-medium text-gray-700 mb-2">Assigned Units:</p>
                                                                <div className="space-y-1">
                                                                    {record.units.map((unit) => {
                                                                        const activeStatus = Number(unit.active);
                                                                        const statusText = activeStatus === 1 ? 'In Use' : activeStatus === 0 ? 'Not In Use' : 'Returned';
                                                                        const statusColor = activeStatus === 1 ? 'orange' : activeStatus === 0 ? 'default' : 'green';

                                                                        return (
                                                                            <div key={unit.reservation_unit_id || unit.unit_id} className="flex items-center gap-2 text-sm">
                                                                                <span className="font-mono text-gray-700">
                                                                                    {unit.unit_serial_number}
                                                                                </span>
                                                                                <Tag
                                                                                    size="small"
                                                                                    color={statusColor}
                                                                                >
                                                                                    {statusText}
                                                                                </Tag>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                    rowExpandable: (record) => record.units && record.units.length > 0,
                                                }}
                                                pagination={false}
                                                size="small"
                                                className="border border-blue-200 rounded-lg"
                                            />
                                        </div>
                                    )}

                                    {/* Equipment Conditions */}
                                    {reservationDetails.conditions?.equipment?.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <ToolOutlined className="text-red-500" />
                                                Equipment Conditions ({reservationDetails.conditions.equipment.length})
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.conditions.equipment
                                                    .map((condition, index) => {
                                                        // Find matching equipment by reservation_equipment_id
                                                        const matchingEquipment = reservationDetails.equipment?.find(
                                                            eq => String(eq.reservation_equipment_id) === String(condition.reservation_equipment_id)
                                                        );

                                                        return (
                                                            <div key={`equipment-condition-${condition.id || index}`} className="p-3 border rounded-lg">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <ToolOutlined className={`mt-0.5 ${condition.condition_name?.toLowerCase() === 'good condition' ? 'text-green-500' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'text-red-500' :
                                                                                condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'text-orange-500' :
                                                                                    condition.condition_name?.toLowerCase() === 'minor issues' ? 'text-yellow-500' : 'text-blue-500'
                                                                            }`} />
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-gray-800 break-words">
                                                                                {matchingEquipment?.name || `Equipment ID: ${condition.reservation_equipment_id}`}
                                                                            </p>

                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Condition:</span> {condition.condition_name}
                                                                            </p>

                                                                            {condition.qty_bad && condition.qty_bad !== "0" && (
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <span className="font-medium">Damaged Quantity:</span> {condition.qty_bad}
                                                                                </p>
                                                                            )}

                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Personnel:</span> {condition.personnel_name}
                                                                            </p>

                                                                            {condition.remarks && (
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <span className="font-medium">Remarks:</span> {condition.remarks}
                                                                                </p>
                                                                            )}

                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                Recorded on: {new Date(condition.created_at).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Tag
                                                                        color={
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'green' :
                                                                                condition.condition_name?.toLowerCase() === 'damaged' ? 'red' :
                                                                                    condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'orange' :
                                                                                        condition.condition_name?.toLowerCase() === 'minor issues' ? 'yellow' : 'blue'
                                                                        }
                                                                        className="shrink-0"
                                                                    >
                                                                        {condition.condition_name}
                                                                    </Tag>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vehicle Conditions */}
                                    {reservationDetails.conditions?.vehicle?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Vehicle Conditions</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.conditions.vehicle
                                                    .map((condition, index) => {
                                                        // Find matching vehicle by reservation_vehicle_id
                                                        const matchingVehicle = reservationDetails.vehicles?.find(
                                                            vehicle => String(vehicle.reservation_vehicle_id) === String(condition.reservation_vehicle_id)
                                                        );

                                                        return (
                                                            <div key={`vehicle-condition-${condition.id || index}`} className="p-3 border rounded-lg">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <CarOutlined className={`mt-0.5 ${condition.condition_name?.toLowerCase() === 'good condition' ? 'text-green-500' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'text-red-500' :
                                                                                condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'text-orange-500' :
                                                                                    condition.condition_name?.toLowerCase() === 'minor issues' ? 'text-yellow-500' : 'text-blue-500'
                                                                            }`} />
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-gray-800 break-words">
                                                                                {matchingVehicle ? `${matchingVehicle.model} (${matchingVehicle.license})` : `Vehicle ID: ${condition.reservation_vehicle_id}`}
                                                                            </p>

                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Condition:</span> {condition.condition_name}
                                                                            </p>

                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Personnel:</span> {condition.personnel_name}
                                                                            </p>

                                                                            {condition.remarks && (
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <span className="font-medium">Remarks:</span> {condition.remarks}
                                                                                </p>
                                                                            )}

                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                Recorded on: {new Date(condition.created_at).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Tag
                                                                        color={
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'green' :
                                                                                condition.condition_name?.toLowerCase() === 'damaged' ? 'red' :
                                                                                    condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'orange' :
                                                                                        condition.condition_name?.toLowerCase() === 'minor issues' ? 'yellow' : 'blue'
                                                                        }
                                                                        className="shrink-0"
                                                                    >
                                                                        {condition.condition_name}
                                                                    </Tag>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Venue Conditions */}
                                    {reservationDetails.conditions?.venue?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Venue Conditions</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.conditions.venue
                                                    .map((condition, index) => {
                                                        // Find matching venue by reservation_venue_id
                                                        const matchingVenue = reservationDetails.venues?.find(
                                                            venue => String(venue.reservation_venue_id) === String(condition.reservation_venue_id)
                                                        );

                                                        return (
                                                            <div key={`venue-condition-${condition.id || index}`} className="p-3 border rounded-lg">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <BuildOutlined className={`mt-0.5 ${condition.condition_name?.toLowerCase() === 'good condition' ? 'text-green-500' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'text-red-500' :
                                                                                condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'text-orange-500' :
                                                                                    condition.condition_name?.toLowerCase() === 'minor issues' ? 'text-yellow-500' : 'text-blue-500'
                                                                            }`} />
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-gray-800 break-words">
                                                                                {matchingVenue?.venue_name || `Venue ID: ${condition.reservation_venue_id}`}
                                                                            </p>

                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Condition:</span> {condition.condition_name}
                                                                            </p>

                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Personnel:</span> {condition.personnel_name}
                                                                            </p>

                                                                            {condition.remarks && (
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <span className="font-medium">Remarks:</span> {condition.remarks}
                                                                                </p>
                                                                            )}

                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                Recorded on: {new Date(condition.created_at).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Tag
                                                                        color={
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'green' :
                                                                                condition.condition_name?.toLowerCase() === 'damaged' ? 'red' :
                                                                                    condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'orange' :
                                                                                        condition.condition_name?.toLowerCase() === 'minor issues' ? 'yellow' : 'blue'
                                                                        }
                                                                        className="shrink-0"
                                                                    >
                                                                        {condition.condition_name}
                                                                    </Tag>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Unit Conditions - Always display if available */}
                                    {reservationDetails.conditions?.unit?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Unit Conditions</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.conditions.unit
                                                    .map((condition, index) => (
                                                        <div key={`unit-condition-${condition.id || index}`} className="p-3 border rounded-lg">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-2 min-w-0">
                                                                    <ToolOutlined className={`mt-0.5 ${condition.condition_name?.toLowerCase() === 'good condition' ? 'text-green-500' :
                                                                        condition.condition_name?.toLowerCase() === 'damaged' ? 'text-red-500' :
                                                                            condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'text-orange-500' :
                                                                                condition.condition_name?.toLowerCase() === 'minor issues' ? 'text-yellow-500' : 'text-blue-500'
                                                                        }`} />
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-gray-800 break-words">
                                                                            Unit ID: {condition.reservation_unit_id}
                                                                        </p>

                                                                        <p className="text-sm text-gray-600 mt-1">
                                                                            <span className="font-medium">Condition:</span> {condition.condition_name}
                                                                        </p>

                                                                        <p className="text-sm text-gray-600 mt-1">
                                                                            <span className="font-medium">Personnel:</span> {condition.personnel_name}
                                                                        </p>

                                                                        {condition.remarks && (
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Remarks:</span> {condition.remarks}
                                                                            </p>
                                                                        )}

                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Recorded on: {new Date(condition.created_at).toLocaleString()}
                                                                        </p>

                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Status: {condition.is_active === "1" ? "Active" : "Inactive"} (is_active: {condition.is_active})
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Tag
                                                                    color={
                                                                        condition.condition_name?.toLowerCase() === 'good condition' ? 'green' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'red' :
                                                                                condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'orange' :
                                                                                    condition.condition_name?.toLowerCase() === 'minor issues' ? 'yellow' : 'blue'
                                                                    }
                                                                    className="shrink-0"
                                                                >
                                                                    {condition.condition_name}
                                                                </Tag>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Equipment
                                    {reservationDetails.equipment?.length > 0 && (
                                        // <div>
                                        //     <h4 className="text-base font-medium mb-2 text-gray-800">Equipment</h4>
                                        //     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        //         {reservationDetails.equipment.map((item) => (
                                        //             <div key={item.reservation_equipment_id || item.equipment_id || item.name} className="p-3 border rounded-lg flex items-start justify-between">
                                        //                 <div className="flex items-start gap-2 min-w-0">
                                        //                     <ToolOutlined className="mt-0.5 text-orange-500" />
                                        //                     <div className="min-w-0">
                                        //                         <p className="font-medium text-gray-800 break-words">{item.name}</p>
                                        //                     </div>
                                        //                 </div>
                                        //                 <Tag color="orange" className="shrink-0">Qty: {item.quantity}</Tag>
                                        //             </div>
                                        //         ))}
                                        //     </div>
                                        // </div>
                                    )} */}

                                    {/* Gate Pass Download Button (if both vehicle and equipment) */}
                                    {hasVehicleAndEquipment && (
                                        <>
                                            {/* Hidden GatePass for PDF generation */}
                                            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                                                <GatePass ref={gatePassRef} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Department Approval Progress Section */}
                            {(isLoadingDeans || deansApproval.length > 0) && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Department Approval Progress</h3>
                                    {isLoadingDeans ? (
                                        <div className="flex items-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                                            <Spin size="small" className="mr-2" />
                                            <span>Loading Approvals...</span>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="p-4">
                                                <div className="flex-grow pr-4">
                                                    <Progress
                                                        percent={deansApproval.length > 0 ? (deansApproval.filter(dean => dean.is_approved === 1 || dean.is_approved === '1').length / deansApproval.length) * 100 : 0}
                                                        format={() => `${deansApproval.filter(dean => dean.is_approved === 1 || dean.is_approved === '1').length} / ${deansApproval.length} Approved`}
                                                        strokeColor={{ from: '#108ee9', to: '#87d068' }}
                                                        trailColor="rgba(0, 0, 0, 0.06)"
                                                    />
                                                </div>
                                            </div>

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
                                    )}
                                </div>
                            )}
                        </TabPane>

                        <TabPane tab={<span><ToolOutlined /> {isMobile ? 'Summary' : 'Summary Record'}</span>} key="2">
                            <div className="mt-6">
                                {/* Summary Records Section - All Resource Types */}
                                {reservationDetails.maintenance_conditions && reservationDetails.maintenance_conditions.length > 0 ? (
                                    <div className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm mb-6">
                                        <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                                            <ToolOutlined className="text-orange-500" />
                                            Resource Summary Records
                                        </h3>
                                        <div className="space-y-4">
                                            {reservationDetails.maintenance_conditions.map((record, index) => {
                                                // Determine icon based on resource type
                                                const getResourceIcon = (resourceType) => {
                                                    switch (resourceType?.toLowerCase()) {
                                                        case 'venue':
                                                            return <BuildOutlined className={getConditionColor(record.condition_name)} />;
                                                        case 'vehicle':
                                                            return <CarOutlined className={getConditionColor(record.condition_name)} />;
                                                        case 'equipment_bulk':
                                                        case 'equipment_unit':
                                                        default:
                                                            return <ToolOutlined className={getConditionColor(record.condition_name)} />;
                                                    }
                                                };

                                                const getConditionColor = (conditionName) => {
                                                    switch (conditionName?.toLowerCase()) {
                                                        case 'good condition':
                                                            return 'text-green-500';
                                                        case 'damaged':
                                                            return 'text-red-500';
                                                        case 'needs maintenance':
                                                        case 'under maintenance':
                                                            return 'text-orange-500';
                                                        case 'minor issues':
                                                            return 'text-yellow-500';
                                                        default:
                                                            return 'text-blue-500';
                                                    }
                                                };

                                                const getConditionTagColor = (conditionName) => {
                                                    switch (conditionName?.toLowerCase()) {
                                                        case 'good condition':
                                                            return 'green';
                                                        case 'damaged':
                                                            return 'red';
                                                        case 'needs maintenance':
                                                        case 'under maintenance':
                                                            return 'orange';
                                                        case 'minor issues':
                                                            return 'yellow';
                                                        default:
                                                            return 'blue';
                                                    }
                                                };

                                                const getResourceTypeLabel = (resourceType) => {
                                                    switch (resourceType?.toLowerCase()) {
                                                        case 'equipment_bulk':
                                                            return 'Equipment (Bulk)';
                                                        case 'equipment_unit':
                                                            return 'Equipment (Unit)';
                                                        case 'venue':
                                                            return 'Venue';
                                                        case 'vehicle':
                                                            return 'Vehicle';
                                                        default:
                                                            return resourceType || 'Unknown';
                                                    }
                                                };

                                                return (
                                                    <div key={record.record_id || index} className="p-4 border rounded-lg bg-gray-50">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    {getResourceIcon(record.resource_type)}
                                                                    <h4 className="font-semibold text-gray-800">{record.resource_name}</h4>
                                                                </div>
                                                                <div className="space-y-1 text-sm">
                                                                    <p><span className="font-medium text-gray-600">Type:</span> {getResourceTypeLabel(record.resource_type)}</p>
                                                                    {record.quantity && (
                                                                        <p><span className="font-medium text-gray-600">Quantity:</span> {record.quantity}</p>
                                                                    )}
                                                                    <p><span className="font-medium text-gray-600">Condition:</span>
                                                                        <Tag
                                                                            color={getConditionTagColor(record.condition_name)}
                                                                            className="ml-2"
                                                                        >
                                                                            {record.condition_name}
                                                                        </Tag>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="space-y-1 text-sm">
                                                                    <p><span className="font-medium text-gray-600">Recorded:</span> {new Date(record.created_at).toLocaleString()}</p>

                                                                    <p><span className="font-medium text-gray-600">Reported by:</span> {record.reported_by_name}</p>

                                                                    {record.remarks && (
                                                                        <p><span className="font-medium text-gray-600">Remarks:</span> {record.remarks}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm mb-6">
                                        <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                                            <ToolOutlined className="text-orange-500" />
                                            Resource Summary Records
                                        </h3>
                                        <p className="text-gray-500 text-center py-8">No summary records found for this reservation</p>
                                    </div>
                                )}
                            </div>
                        </TabPane>

                        <TabPane tab={<span><HistoryOutlined /> {isMobile ? 'Status' : 'Status Log'}</span>} key="3">
                            <div className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
                                {/* Status History Section - Timeline visualization matching reservation_details.jsx */}
                                {localReservationDetails.status_history && localReservationDetails.status_history.length > 0 ? (
                                    <div className={`bg-white ${isMobile ? 'p-3' : 'p-4'} rounded-lg border border-green-200 shadow-sm mb-6`}>
                                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-4 text-gray-800`}>Status History</h3>
                                        <div className="space-y-3 sm:space-y-4">
                                            {localReservationDetails.status_history
                                                .map((status, index) => {
                                                    const rawStatus = (status.reservation_active ?? status.is_approved ?? 0);
                                                    const statusVal = Number(rawStatus);
                                                    const lineClass = statusVal === 1 ? 'bg-green-300' : (statusVal === -1 ? 'bg-red-300' : 'bg-yellow-300');

                                                    return (
                                                        <div key={status.reservation_status_id} className="flex items-start">
                                                            <div className={`flex flex-col items-center ${isMobile ? 'mr-3' : 'mr-4'}`}>
                                                                {index !== localReservationDetails.status_history.length - 1 && (
                                                                    <div className={`w-0.5 flex-1 ${lineClass} ${isMobile ? 'min-h-[20px]' : ''}`}></div>
                                                                )}
                                                            </div>
                                                            <div className={`flex-1 ${isMobile ? 'mb-3' : 'mb-4'}`}>
                                                                <div className={`flex ${isMobile ? 'flex-col gap-1' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-1'} mb-1`}>
                                                                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                                                        <span className={`font-medium text-gray-800 break-words ${isMobile ? 'text-sm' : ''}`}>{status.status_name}</span>
                                                                    </div>
                                                                    <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-gray-500 w-full sm:w-auto sm:text-right sm:whitespace-nowrap`}>
                                                                        {new Date(status.reservation_updated_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-gray-600`}>
                                                                    Updated by: {status.updated_by_name || '—'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm mb-6">
                                        <h3 className="text-lg font-medium mb-4 text-gray-800">Status History</h3>
                                        <p className="text-gray-500 text-center py-4">No status history available</p>
                                    </div>
                                )}

                                {/* Department Approval Section - Collapsable */}
                                {deansApproval && deansApproval.length > 0 && (
                                    <div>
                                        <Collapse
                                            bordered={false}
                                            className="bg-white rounded-lg border border-blue-200 shadow-sm"
                                            expandIcon={({ isActive }) => isActive ? <DownOutlined /> : <RightOutlined />}>
                                            <Collapse.Panel header="Department Approval" key="1">
                                                <div className="p-4">
                                                    {isLoadingDeans ? (
                                                        <div className="flex justify-center items-center h-32">
                                                            <Spin size="large" />
                                                        </div>
                                                    ) : (
                                                        <ul className="divide-y divide-blue-100">
                                                            {deansApproval.map((approval, index) => {
                                                                const rawStatus = (approval.reservation_active ?? approval.is_approved ?? 0);
                                                                const statusVal = Number(rawStatus);
                                                                const statusLabel = statusVal === 1 ? 'Approved' : (statusVal === -1 ? 'Declined' : 'Pending');
                                                                const statusColor = statusVal === 1 ? 'green' : (statusVal === -1 ? 'red' : 'gold');

                                                                const departmentName = approval.department_name || 'Unknown Department';
                                                                const approverName = approval.user_name && approval.user_name.trim() !== ''
                                                                    ? approval.user_name
                                                                    : null;

                                                                return (
                                                                    <li key={index} className="py-3 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <UserOutlined className="text-blue-400 text-lg" />
                                                                            <div>
                                                                                <div className="text-gray-800 font-medium">{departmentName}</div>
                                                                                <div className="text-gray-600 text-sm">
                                                                                    {statusVal === 1
                                                                                        ? (approverName
                                                                                            ? `Approved by ${approverName}`
                                                                                            : 'Approved (no approver name on record)')
                                                                                        : statusVal === -1
                                                                                            ? (approverName
                                                                                                ? `Declined by ${approverName}`
                                                                                                : 'Declined (no approver name on record)')
                                                                                            : (approverName
                                                                                                ? `Pending (assigned to ${approverName})`
                                                                                                : 'Pending (no approver name on record)')}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <Tag color={statusColor}>
                                                                            {statusLabel}
                                                                        </Tag>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}
                                                </div>
                                            </Collapse.Panel>
                                        </Collapse>
                                    </div>
                                )}
                            </div>
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {isMobile ? (
                <Drawer
                    title={null}
                    placement="bottom"
                    height="95%"
                    open={visible}
                    onClose={onClose}
                    className="reservation-detail-drawer"
                    bodyStyle={{ padding: 0 }}
                    headerStyle={{ display: 'none' }}
                    closable={false}
                    maskClosable={false}
                    footer={getMobileFooter()}
                    footerStyle={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}
                >
                    {modalContent}
                </Drawer>
            ) : (
                <Modal
                    title={null}
                    open={visible}
                    onCancel={onClose}
                    width={isTablet ? 900 : 1150}
                    style={{ top: 20 }}
                    footer={[
                        !isReservationDeclined && (
                            <Button key="close" onClick={onClose} size="large">
                                Close
                            </Button>
                        ),
                        (isCompleted || isReservationDeclined) && (
                            <Button
                                key="request-again"
                                onClick={handleRequestAgainClick}
                                icon={<RedoOutlined />}
                                type="primary"
                                size="large"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Request Again
                            </Button>
                        ),
                        // (!isCancelled && !isCompleted && !hideButtons) && (
                        //     <Button
                        //         key="request-reschedule"
                        //         onClick={handleRequestReschedule}
                        //         disabled={effectiveDisableReschedule}
                        //         icon={<ScheduleOutlined />}
                        //         size="large"
                        //         className={effectiveDisableReschedule ? 'opacity-50' : ''}
                        //     >
                        //         {showReschedulePendingCard ? 'Request New Reschedule' : 'Request Reschedule'}
                        //     </Button>
                        // ),
                        (!isCancelled && !isCompleted && !isReservationDeclined && !hideButtons) && (
                            <Button
                                key="cancel"
                                onClick={checkCancelEligibility}
                                disabled={effectiveDisableCancel}
                                danger
                                size="large"
                            >
                                Cancel Reservation
                            </Button>
                        ),
                        (!isCancelled && !isCompleted && !isReservationDeclined && !hideButtons && allowsRescheduleRequest) && (
                            <Button
                                key="request-reschedule"
                                onClick={() => setIsRescheduleModalOpen(true)}
                                disabled={isBeingProcessed}
                                size="large"
                            >
                                Request Reschedule
                            </Button>
                        ),
                        // Accept/Decline buttons for "To be reschedule" status (status_id 11)
                        // Hide buttons if reschedule is declined (status_id: 13)
                        isPendingRescheduleFromAdmin && !isRescheduleDeclined && (
                            <Button
                                key="accept-proposal"
                                type="primary"
                                onClick={() => openRescheduleDecisionModal('accept')}
                                size="large"
                            >
                                Accept Reschedule
                            </Button>
                        ),
                        isPendingRescheduleFromAdmin && !isRescheduleDeclined && (
                            <Button
                                key="decline-proposal"
                                danger
                                onClick={() => openRescheduleDecisionModal('decline')}
                                size="large"
                            >
                                Decline Reschedule
                            </Button>
                        )
                    ]}
                    className="reservation-detail-modal"
                    bodyStyle={{ padding: '0' }}
                    maskClosable={false}
                    zIndex={1000}
                >
                    {modalContent}
                </Modal>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <Modal
                    title="Confirm Cancellation"
                    open={showCancelModal}
                    onCancel={() => setShowCancelModal(false)}
                    footer={[
                        <Button key="back" onClick={() => setShowCancelModal(false)}>
                            No, Keep Reservation
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            danger
                            onClick={handleCancelReservation}
                        >
                            Yes, Cancel Reservation
                        </Button>
                    ]}
                >
                    <p>Are you sure you want to cancel the reservation "{reservationDetails.reservation_title}"?</p>
                </Modal>
            )}

            {/* Admin Processing Modal */}
            {showAdminProcessingModal && (
                <Modal
                    title={
                        <div className="flex items-center gap-2">
                            <InfoCircleOutlined className="text-orange-500" />
                            <span>Cannot Cancel Reservation</span>
                        </div>
                    }
                    open={showAdminProcessingModal}
                    onCancel={() => {
                        setShowAdminProcessingModal(false);
                        setAdminProcessingReason('');
                        fetchRequestById();
                    }}
                    footer={[

                    ]}
                    centered
                >
                    <div className="py-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <InfoCircleOutlined className="text-orange-500 text-xl mt-1" />
                                <div>
                                    {adminProcessingReason === 'admin_processing' ? (
                                        <>
                                            <h4 className="font-semibold text-orange-800 mb-2">
                                                Reservation is Being Processed
                                            </h4>
                                            <p className="text-orange-700 mb-2">
                                                This reservation cannot be cancelled because it is already being processed by an administrator.
                                            </p>
                                            <p className="text-orange-600 text-sm">
                                                Please contact the administrator if you need to make changes to this reservation.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h4 className="font-semibold text-orange-800 mb-2">
                                                Reservation is Currently Active
                                            </h4>
                                            <p className="text-orange-700 mb-2">
                                                This reservation cannot be cancelled because it is currently active and within its scheduled time range.
                                            </p>
                                            <p className="text-orange-600 text-sm">
                                                Please wait until the reservation period ends before attempting to cancel.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </Modal>
            )}

            {/* Reschedule Modal */}
            <RescheduleModal
                visible={isRescheduleModalOpen}
                onCancel={() => {
                    setIsRescheduleModalOpen(false);
                }}
                onReschedule={handleRescheduleSubmit}
                onRequestAgain={handleRequestAgain}
                reservation={reservationDetails}
                // resources={rescheduleResources}
                originalStart={reservationDetails?.reservation_start_date}
                originalEnd={reservationDetails?.reservation_end_date}
                disableDriverAssignment={true}
                showRequestAgainButton={true} // Always show "Request Again to Reschedule" button
                hideRescheduleButton={true} // Always hide regular "Reschedule" button
            />

            {isRescheduleDecisionModalOpen && (
                <Modal
                    title={rescheduleDecisionAction === 'accept' ? 'Accept Reschedule' : 'Decline Reschedule'}
                    open={isRescheduleDecisionModalOpen}
                    onCancel={() => setIsRescheduleDecisionModalOpen(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setIsRescheduleDecisionModalOpen(false)}>
                            Cancel
                        </Button>,
                        <Button
                            key="confirm"
                            type="primary"
                            danger={rescheduleDecisionAction !== 'accept'}
                            onClick={handleSubmitRescheduleDecision}
                            disabled={rescheduleDecisionAction === 'decline' && !rescheduleDecisionReason.trim()}
                        >
                            Confirm
                        </Button>
                    ]}
                    width={600}
                >
                    <div className="space-y-4">
                        {/* Proposed Dates Section */}
                        {localReservationDetails?.reschedule_start_date && localReservationDetails?.reschedule_end_date && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    <CalendarOutlined />
                                    Proposed Schedule
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-600 mb-1">Original Dates:</p>
                                        <p className="font-medium text-gray-800">
                                            {new Date(localReservationDetails.reservation_start_date).toLocaleString()} - {new Date(localReservationDetails.reservation_end_date).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-blue-600 mb-1">Proposed Dates:</p>
                                        <p className="font-medium text-blue-800">
                                            {new Date(localReservationDetails.reschedule_start_date).toLocaleString()} - {new Date(localReservationDetails.reschedule_end_date).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Venue Changes Section */}
                        {localReservationDetails?.venues?.some(v => v.change_venue_id || v.change_venue_name) && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                    <BuildOutlined />
                                    Venue Changes
                                </h4>
                                <div className="space-y-2">
                                    {localReservationDetails.venues
                                        .filter(v => v.change_venue_id || v.change_venue_name)
                                        .map((venue, idx) => (
                                            <div key={idx} className="text-sm">
                                                <p className="text-gray-600">
                                                    From: <span className="font-medium text-gray-800">{venue.venue_name}</span>
                                                </p>
                                                <p className="text-orange-600">
                                                    To: <span className="font-medium text-orange-800">{venue.change_venue_name || 'Unknown'}</span>
                                                </p>
                                                {venue.change_venue_event_type && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Event Type: {venue.change_venue_event_type}
                                                    </p>
                                                )}
                                                {venue.change_venue_area_type && (
                                                    <p className="text-xs text-gray-500">
                                                        Area Type: {venue.change_venue_area_type}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Vehicle Changes Section */}
                        {localReservationDetails?.vehicles?.some(v => v.change_vehicle_id || v.change_vehicle_model) && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                    <CarOutlined />
                                    Vehicle Changes
                                </h4>
                                <div className="space-y-2">
                                    {localReservationDetails.vehicles
                                        .filter(v => v.change_vehicle_id || v.change_vehicle_model)
                                        .map((vehicle, idx) => (
                                            <div key={idx} className="text-sm">
                                                <p className="text-gray-600">
                                                    From: <span className="font-medium text-gray-800">{vehicle.model} ({vehicle.license})</span>
                                                </p>
                                                <p className="text-purple-600">
                                                    To: <span className="font-medium text-purple-800">{vehicle.change_vehicle_model || 'Unknown'} {vehicle.change_vehicle_license ? `(${vehicle.change_vehicle_license})` : ''}</span>
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Reschedule Reason Section */}
                        {(() => {
                            const pendingRescheduleEntry = localReservationDetails?.status_history?.find(
                                s => Number(s.status_id) === 11 && Number(s.reservation_active) === 0
                            );
                            if (pendingRescheduleEntry?.reservation_reason) {
                                return (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-800 mb-2">
                                            Reason for Reschedule
                                        </h4>
                                        <p className="text-sm text-gray-700 italic">
                                            "{pendingRescheduleEntry.reservation_reason}"
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Proposed by: {pendingRescheduleEntry.updated_by_name} on {new Date(pendingRescheduleEntry.reservation_updated_at).toLocaleString()}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Reason Input Section - Only show for decline */}
                        {rescheduleDecisionAction === 'decline' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Declining (Required)
                                </label>
                                <Input.TextArea
                                    rows={4}
                                    value={rescheduleDecisionReason}
                                    onChange={(e) => setRescheduleDecisionReason(e.target.value)}
                                    placeholder="Please provide a reason for declining..."
                                />
                                {!rescheduleDecisionReason.trim() && (
                                    <p className="text-xs text-red-500 mt-1">
                                        * Reason is required when declining
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
};

export default ReservationDetails;
