import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Tag, Tabs, Spin, Collapse, Button, Drawer, Form, Input, DatePicker, TimePicker, Select } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined,
    DownOutlined,
    RightOutlined,
    CloseOutlined,
    EditOutlined,
    SaveOutlined
} from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import DriversTicket from './trip_ticket';
import { toast } from 'react-toastify';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import dayjs from 'dayjs';

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

const ReservationDetails = ({ 
    visible, 
    onClose, 
    reservationDetails,
    deansApproval = [],
    isLoadingDeans = false,
    showAvailability = false,
    checkResourceAvailability = () => true,
    onRefresh
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

    // Trip Ticket export state
    const [isExporting, setIsExporting] = useState(false);
    const [showTripTicketPreview, setShowTripTicketPreview] = useState(false);

    const baseUrl = SecureStorage.getLocalItem('url');
    const [localReservationDetails, setLocalReservationDetails] = useState(reservationDetails);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm] = Form.useForm();
    const [isUpdating, setIsUpdating] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);
    const [availabilityBlocks, setAvailabilityBlocks] = useState([]);
    const [dayStatuses, setDayStatuses] = useState({});
    const [venueOptions, setVenueOptions] = useState([]);
    const [vehicleOptions, setVehicleOptions] = useState([]);
    const [isLoadingResourceOptions, setIsLoadingResourceOptions] = useState(false);
    const availabilityDebounceRef = useRef(null);
    const isAutoAdjustingScheduleRef = useRef(false);

    useEffect(() => {
        return () => {
            if (availabilityDebounceRef.current) {
                clearTimeout(availabilityDebounceRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setLocalReservationDetails(reservationDetails);
    }, [reservationDetails]);

    useEffect(() => {
        const fetchResourceOptions = async () => {
            try {
                setIsLoadingResourceOptions(true);
                const [venueResp, vehicleResp] = await Promise.all([
                    axios.post(`${baseUrl}Admin.php`, {
                        operation: 'fetchVenue'
                    }),
                    axios.post(`${baseUrl}Admin.php`, {
                        operation: 'fetchVehicles'
                    })
                ]);

                if (venueResp?.data?.status === 'success' && Array.isArray(venueResp.data.data)) {
                    setVenueOptions(venueResp.data.data);
                } else {
                    setVenueOptions([]);
                }

                if (vehicleResp?.data?.status === 'success' && Array.isArray(vehicleResp.data.data)) {
                    setVehicleOptions(vehicleResp.data.data);
                } else {
                    setVehicleOptions([]);
                }
            } catch (error) {
                if (!error?.response || error?.message === 'Network Error' || error?.name === 'TypeError' || !navigator.onLine) {
                    toast.error('Network connection lost. Unable to fetch resources.');
                }
                setVenueOptions([]);
                setVehicleOptions([]);
            } finally {
                setIsLoadingResourceOptions(false);
            }
        };

        if (!isEditMode) return;
        fetchResourceOptions();
    }, [isEditMode, baseUrl]);
    useEffect(() => {
        if (!isEditMode) return;

        const BUSINESS_START_HOUR = 4;
        const BUSINESS_END_HOUR = 22;
        const totalBusinessMinutes = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60;

        const dateKeys = new Set();
        availabilityBlocks.forEach(b => {
            const startDay = b.start.startOf('day');
            const endDay = b.end.startOf('day');
            let d = startDay.clone();
            while (d.isSame(endDay) || d.isBefore(endDay)) {
                dateKeys.add(d.format('YYYY-MM-DD'));
                d = d.add(1, 'day');
            }
        });

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

            const intervals = availabilityBlocks
                .map(b => {
                    const s = b.start.isAfter(dayStart) ? b.start : dayStart;
                    const e = b.end.isBefore(dayEnd) ? b.end : dayEnd;
                    return (e.isAfter(s)) ? { s, e } : null;
                })
                .filter(Boolean)
                .sort((a, b) => a.s.valueOf() - b.s.valueOf());

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

            const blockedMinutes = merged.reduce((acc, it) => acc + it.e.diff(it.s, 'minute'), 0);
            if (blockedMinutes >= totalBusinessMinutes) {
                next[dateKey] = 'reserved';
            } else if (blockedMinutes > 0) {
                next[dateKey] = 'partial';
            } else {
                next[dateKey] = 'available';
            }
        });

        setDayStatuses(next);
    }, [availabilityBlocks, isEditMode]);
    const ticketInitialData = useMemo(() => {
        const details = reservationDetails || {};
        // Map destination (from title) and purpose (from description)
        const destination = details.reservation_title || details.title || details.destination || details.reservation_destination || '';
        const purpose = details.reservation_description || details.description || details.purpose || details.reservation_purpose || '';

        // Align drivers with their assigned vehicles using reservation_vehicle_id
        let driverName = '';
        let plateNo = '';
        
        if (Array.isArray(details.vehicles) && details.vehicles.length > 0) {
            const alignedPairs = details.vehicles.map(vehicle => {
                // Find the driver assigned to this vehicle
                const assignedDriver = Array.isArray(details.drivers) 
                    ? details.drivers.find(d => String(d.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id))
                    : null;
                
                // Get driver name
                const driverNameForVehicle = assignedDriver 
                    ? (assignedDriver.driver_name || assignedDriver.name || 'N/A')
                    : 'N/A';
                
                // Get vehicle plate number (prefer change_vehicle_license if provided)
                const vehiclePlate = (vehicle.change_vehicle_license && String(vehicle.change_vehicle_license).trim() !== '') 
                    ? vehicle.change_vehicle_license 
                    : (vehicle.license || 'N/A');

                // Build vehicle display name (MAKE MODEL - PLATE)
                const makeName = (
                    vehicle.make_name ||
                    vehicle.vehicle_make_name ||
                    vehicle.make ||
                    vehicle.brand_name ||
                    vehicle.brand ||
                    ''
                );
                const modelName = (
                    vehicle.change_vehicle_model ||
                    vehicle.model_name ||
                    vehicle.vehicle_model_name ||
                    vehicle.model ||
                    ''
                );
                const vehicleName = `${String(makeName || '').trim()} ${String(modelName || '').trim()}`.trim();
                const vehicleDisplay = vehicleName
                    ? `${vehicleName} - ${vehiclePlate}`
                    : vehiclePlate;
                
                return {
                    driver: driverNameForVehicle,
                    plate: vehicleDisplay
                };
            });
            
            // Join aligned pairs
            driverName = alignedPairs.map(pair => pair.driver).join(', ');
            plateNo = alignedPairs.map(pair => pair.plate).join(', ');
        }

        // Passengers: join names
        const authorizedPassenger = Array.isArray(details.passengers)
            ? details.passengers.map(p => p.name || p).filter(Boolean).join(', ')
            : '';

        return {
            date: '',
            driverName: driverName || 'N/A',
            plateNo: plateNo || 'N/A',
            authorizedPassenger: authorizedPassenger || 'N/A',
            destination: destination || 'N/A',
            purpose: purpose || 'N/A',
        };
    }, [reservationDetails]);

    if (!reservationDetails) return null;

    // Detect reschedule and resource changes
    const statusArr = reservationDetails.status_history || reservationDetails.statusHistory || [];
    const pendingRescheduleStatus = statusArr.find(s => {
        const name = (s.status_name || '').toLowerCase();
        const activeVal = Number(s.reservation_active ?? s.is_approved ?? 0);
        return (name.includes('reschedule') || String(s.status_id) === '10') && activeVal === 0;
    });
    const rescheduleConfirmedStatus = statusArr.find(s => {
        const name = (s.status_name || '').toLowerCase();
        const activeVal = Number(s.reservation_active ?? s.is_approved ?? 0);
        return (name === 'Reschedule' || String(s.status_id) === '10') && activeVal === 1;
    });
    const venueChanges = Array.isArray(reservationDetails.venues)
        ? reservationDetails.venues.filter(v => (
            (v.change_venue_name && v.change_venue_name.trim() !== '') ||
            (v.change_venue_id && String(v.change_venue_id) !== String(v.venue_id))
        ))
        : [];
    const hasVenueChange = venueChanges.length > 0;
    const vehicleChanges = Array.isArray(reservationDetails.vehicles)
        ? reservationDetails.vehicles.filter(v => (
            (v.change_vehicle_model && v.change_vehicle_model.trim() !== '') ||
            (v.change_vehicle_id && String(v.change_vehicle_id) !== String(v.vehicle_id)) ||
            (v.change_vehicle_license && String(v.change_vehicle_license).trim() !== '' && String(v.change_vehicle_license) !== String(v.license))
        ))
        : [];
    const hasVehicleChange = vehicleChanges.length > 0;
    const normalizedStatusHistory = Array.isArray(reservationDetails.status_history)
        ? reservationDetails.status_history
        : (Array.isArray(reservationDetails.statusHistory) ? reservationDetails.statusHistory : []);
    const isReservedActive = normalizedStatusHistory.some(s => String(s.status_name).toLowerCase() === 'reserved' && Number(s.reservation_active) === 1);
    const isOnGoing = normalizedStatusHistory.some(s => String(s.status_name).toLowerCase() === 'on going' && Number(s.reservation_active) === 1);
    const isCompleted = normalizedStatusHistory.some(s => String(s.status_name).toLowerCase() === 'completed' && Number(s.reservation_active) === 1);
    const canShowTripTicket = isReservedActive || isOnGoing || isCompleted;
    const hasActiveReschedule = normalizedStatusHistory.some(s => String(s.status_name).toLowerCase() === 'reschedule' && Number(s.reservation_active) === 1);
    const hasRescheduleProposal = false;
    const isCancelledActive = normalizedStatusHistory.some(s => String(s.status_name).toLowerCase() === 'cancelled' && Number(s.reservation_active) === 1);
    const showReschedulePendingCard = false;

    // Effective dates
    const startDateStr = (hasActiveReschedule && reservationDetails.reschedule_start_date)
        ? reservationDetails.reschedule_start_date
        : reservationDetails.reservation_start_date;
    const endDateStr = (hasActiveReschedule && reservationDetails.reschedule_end_date)
        ? reservationDetails.reschedule_end_date
        : reservationDetails.reservation_end_date;
    // Resources rendered as responsive list cards (no Antd Table columns needed)

    const currentStatusName = String(localReservationDetails?.status_name || reservationDetails?.status_name || '').toLowerCase();
    const allowsCancellation = currentStatusName === 'pending' || currentStatusName === 'reserved' || currentStatusName === 'rescheduled';
    const allowsEditSchedule = currentStatusName === 'reserved' || isReservedActive;

    const cellRender = (current, info) => {
        if (info?.type !== 'date') return info?.originNode;
        const dateKey = dayjs(current).format('YYYY-MM-DD');
        const status = dayStatuses[dateKey];

        let bg = '';
        let color = '';
        if (status === 'reserved') {
            bg = '#FEE2E2';
            color = '#991B1B';
        } else if (status === 'partial') {
            bg = '#FEF3C7';
            color = '#92400E';
        }

        if (!bg) return info.originNode;

        return (
            <div style={{ background: bg, color, borderRadius: 6, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {current.date()}
            </div>
        );
    };

    const isRedDay = (date) => {
        if (!date) return false;
        const dateKey = dayjs(date).format('YYYY-MM-DD');
        return dayStatuses[dateKey] === 'reserved';
    };

    const disabledDate = (current) => {
        if (!current) return false;
        return isRedDay(current);
    };

    const getBlockedHoursForDate = (date) => {
        if (!date) return [];
        const BUSINESS_START_HOUR = 4;
        const BUSINESS_END_HOUR = 22;

        const day = dayjs(date).startOf('day');
        const dayStart = day.hour(BUSINESS_START_HOUR).minute(0).second(0);
        const dayEnd = day.hour(BUSINESS_END_HOUR).minute(0).second(0);

        const blocked = new Set();

        availabilityBlocks.forEach(b => {
            const s = b.start.isAfter(dayStart) ? b.start : dayStart;
            const e = b.end.isBefore(dayEnd) ? b.end : dayEnd;
            if (!e.isAfter(s)) return;

            // Convert interval [s, e) into blocked hour indices.
            // Example: 08:00–10:00 blocks hours 8 and 9.
            const startHour = Math.max(BUSINESS_START_HOUR, s.hour());
            const endHourInclusive = Math.min(BUSINESS_END_HOUR, e.hour());

            // Include the end boundary hour as blocked too.
            // Example: 08:00–10:00 blocks 8, 9, and 10.
            for (let h = startHour; h <= endHourInclusive; h++) {
                blocked.add(h);
            }
        });

        return Array.from(blocked);
    };

    const disabledHoursForDate = (date, extraBlockUpToHour = null) => {
        const BUSINESS_START_HOUR = 4;
        const BUSINESS_END_HOUR = 22;

        // Always block non-business hours
        const hours = [];
        for (let h = 0; h < 24; h++) {
            if (h < BUSINESS_START_HOUR || h >= BUSINESS_END_HOUR) hours.push(h);
        }

        // If red day, block all business hours too
        if (date && isRedDay(date)) {
            for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) hours.push(h);
            return Array.from(new Set(hours));
        }

        // Yellow day: block only the hours overlapping reservations
        if (date) {
            getBlockedHoursForDate(date).forEach(h => hours.push(h));
        }

        // Additional rule (e.g. end time on same day): block hours <= extraBlockUpToHour
        if (extraBlockUpToHour !== null && extraBlockUpToHour !== undefined) {
            for (let h = BUSINESS_START_HOUR; h <= extraBlockUpToHour; h++) {
                hours.push(h);
            }
        }

        return Array.from(new Set(hours));
    };

    const checkAvailability = async (startDateTime, endDateTime) => {
        try {
            setCheckingAvailability(true);
            setAvailabilityError(null);

            const selectedVenueIds = (isEditMode ? editForm.getFieldValue('venueIds') : null);
            const selectedVehicleIds = (isEditMode ? editForm.getFieldValue('vehicleIds') : null);

            const venueIds = (Array.isArray(selectedVenueIds) && selectedVenueIds.length)
                ? selectedVenueIds.filter(Boolean)
                : (localReservationDetails?.venues || []).map(v => v.venue_id || v.ven_id).filter(Boolean);
            const vehicleIds = (Array.isArray(selectedVehicleIds) && selectedVehicleIds.length)
                ? selectedVehicleIds.filter(Boolean)
                : (localReservationDetails?.vehicles || []).map(v => v.vehicle_id).filter(Boolean);
            const reservationId = localReservationDetails?.reservation_id || reservationDetails?.reservation_id;

            const allBlocks = [];
            const start = dayjs(startDateTime);
            const end = dayjs(endDateTime);
            let conflictMessage = null;

            if (venueIds.length > 0) {
                const venueResp = await axios.post(`${baseUrl}reservation.php`, {
                    operation: 'fetchAvailability',
                    itemType: 'venue',
                    itemId: venueIds
                });

                if (venueResp.data?.status === 'success' && Array.isArray(venueResp.data.data)) {
                    venueResp.data.data.forEach(res => {
                        if (String(res.reservation_id) === String(reservationId)) return;

                        const statusId = parseInt(res.reservation_status_status_id);
                        const reservationActive = parseInt(res.reservation_active);
                        const hasReschedule = res.reschedule_start_date && res.reschedule_end_date;

                        if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                            allBlocks.push({ start: dayjs(res.reschedule_start_date), end: dayjs(res.reschedule_end_date) });
                        } else if (statusId === 10 && hasReschedule) {
                            allBlocks.push(
                                { start: dayjs(res.reservation_start_date), end: dayjs(res.reservation_end_date) },
                                { start: dayjs(res.reschedule_start_date), end: dayjs(res.reschedule_end_date) }
                            );
                        } else if (res.reservation_start_date && res.reservation_end_date) {
                            allBlocks.push({ start: dayjs(res.reservation_start_date), end: dayjs(res.reservation_end_date) });
                        }

                        let resStart;
                        let resEnd;
                        if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                            resStart = dayjs(res.reschedule_start_date);
                            resEnd = dayjs(res.reschedule_end_date);
                        } else if (statusId === 10 && hasReschedule) {
                            const origStart = dayjs(res.reservation_start_date);
                            const origEnd = dayjs(res.reservation_end_date);
                            const reschedStart = dayjs(res.reschedule_start_date);
                            const reschedEnd = dayjs(res.reschedule_end_date);
                            const origOverlap = start.isBefore(origEnd) && end.isAfter(origStart);
                            const reschedOverlap = start.isBefore(reschedEnd) && end.isAfter(reschedStart);
                            if (origOverlap || reschedOverlap) {
                                conflictMessage = 'Venue conflict detected';
                                setAvailabilityError('Venue conflict detected');
                            }
                            return;
                        } else if (res.reservation_start_date && res.reservation_end_date) {
                            resStart = dayjs(res.reservation_start_date);
                            resEnd = dayjs(res.reservation_end_date);
                        }

                        if (resStart && resEnd && start.isBefore(resEnd) && end.isAfter(resStart)) {
                            conflictMessage = 'Venue conflict detected';
                            setAvailabilityError('Venue conflict detected');
                        }
                    });
                }
            }

            if (vehicleIds.length > 0) {
                const vehicleResp = await axios.post(`${baseUrl}reservation.php`, {
                    operation: 'fetchAvailability',
                    itemType: 'vehicle',
                    itemId: vehicleIds
                });

                if (vehicleResp.data?.status === 'success' && Array.isArray(vehicleResp.data.data)) {
                    vehicleResp.data.data.forEach(res => {
                        if (String(res.reservation_id) === String(reservationId)) return;

                        const statusId = parseInt(res.reservation_status_status_id);
                        const reservationActive = parseInt(res.reservation_active);
                        const hasReschedule = res.reschedule_start_date && res.reschedule_end_date;

                        if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                            allBlocks.push({ start: dayjs(res.reschedule_start_date), end: dayjs(res.reschedule_end_date) });
                        } else if (statusId === 10 && hasReschedule) {
                            allBlocks.push(
                                { start: dayjs(res.reservation_start_date), end: dayjs(res.reservation_end_date) },
                                { start: dayjs(res.reschedule_start_date), end: dayjs(res.reschedule_end_date) }
                            );
                        } else if (res.reservation_start_date && res.reservation_end_date) {
                            allBlocks.push({ start: dayjs(res.reservation_start_date), end: dayjs(res.reservation_end_date) });
                        }

                        let resStart;
                        let resEnd;
                        if (statusId === 10 && reservationActive === 1 && hasReschedule) {
                            resStart = dayjs(res.reschedule_start_date);
                            resEnd = dayjs(res.reschedule_end_date);
                        } else if (statusId === 10 && hasReschedule) {
                            const origStart = dayjs(res.reservation_start_date);
                            const origEnd = dayjs(res.reservation_end_date);
                            const reschedStart = dayjs(res.reschedule_start_date);
                            const reschedEnd = dayjs(res.reschedule_end_date);
                            const origOverlap = start.isBefore(origEnd) && end.isAfter(origStart);
                            const reschedOverlap = start.isBefore(reschedEnd) && end.isAfter(reschedStart);
                            if (origOverlap || reschedOverlap) {
                                conflictMessage = 'Vehicle conflict detected';
                                setAvailabilityError('Vehicle conflict detected');
                            }
                            return;
                        } else if (res.reservation_start_date && res.reservation_end_date) {
                            resStart = dayjs(res.reservation_start_date);
                            resEnd = dayjs(res.reservation_end_date);
                        }

                        if (resStart && resEnd && start.isBefore(resEnd) && end.isAfter(resStart)) {
                            conflictMessage = 'Vehicle conflict detected';
                            setAvailabilityError('Vehicle conflict detected');
                        }
                    });
                }
            }

            setAvailabilityBlocks(allBlocks);
            return {
                ok: true,
                hasConflict: !!conflictMessage,
                message: conflictMessage,
                blocks: allBlocks
            };
        } catch (error) {
            if (!error?.response || error?.message === 'Network Error' || error?.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to check availability.');
            }
            return { ok: false, hasConflict: false, message: null, blocks: [] };
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleEditClick = async () => {
        if (!allowsEditSchedule) {
            toast.error('You can only edit the schedule once the reservation is Reserved');
            return;
        }

        setIsEditMode(true);
        setAvailabilityError(null);

        const startDateTime = dayjs(localReservationDetails?.reservation_start_date || reservationDetails?.reservation_start_date);
        const endDateTime = dayjs(localReservationDetails?.reservation_end_date || reservationDetails?.reservation_end_date);

        editForm.setFieldsValue({
            title: localReservationDetails?.reservation_title || reservationDetails?.reservation_title,
            description: localReservationDetails?.reservation_description || reservationDetails?.reservation_description,
            startDate: startDateTime,
            startTime: startDateTime,
            endDate: endDateTime,
            endTime: endDateTime,
            venueIds: (localReservationDetails?.venues || reservationDetails?.venues || []).map(v => v.venue_id || v.ven_id).filter(Boolean).map(v => String(v)),
            vehicleIds: (localReservationDetails?.vehicles || reservationDetails?.vehicles || []).map(v => v.vehicle_id).filter(Boolean).map(v => String(v))
        });

        await checkAvailability(
            startDateTime.format('YYYY-MM-DD HH:mm:ss'),
            endDateTime.format('YYYY-MM-DD HH:mm:ss')
        );
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        editForm.resetFields();
        setAvailabilityError(null);
        setAvailabilityBlocks([]);

        if (availabilityDebounceRef.current) {
            clearTimeout(availabilityDebounceRef.current);
            availabilityDebounceRef.current = null;
        }
    };

    const handleEditFormValuesChange = (changedValues, allValues) => {
        if (!isEditMode) return;
        if (isAutoAdjustingScheduleRef.current) return;

        // Requirement: when user selects a new Start Date, clear the dependent fields
        // so user is forced to reselect Start Time, End Date, and End Time.
        if (Object.prototype.hasOwnProperty.call(changedValues, 'startDate')) {
            isAutoAdjustingScheduleRef.current = true;
            editForm.setFieldsValue({
                startTime: null,
                endDate: null,
                endTime: null
            });
            setAvailabilityError(null);
            setTimeout(() => {
                isAutoAdjustingScheduleRef.current = false;
            }, 0);
            return;
        }

        const affectsSchedule = Object.prototype.hasOwnProperty.call(changedValues, 'startDate')
            || Object.prototype.hasOwnProperty.call(changedValues, 'startTime')
            || Object.prototype.hasOwnProperty.call(changedValues, 'endDate')
            || Object.prototype.hasOwnProperty.call(changedValues, 'endTime')
            || Object.prototype.hasOwnProperty.call(changedValues, 'venueIds')
            || Object.prototype.hasOwnProperty.call(changedValues, 'vehicleIds');

        if (!affectsSchedule) return;

        const { startDate, startTime, endDate, endTime } = allValues || {};
        if (!startDate || !startTime || !endDate || !endTime) return;

        const start = dayjs(startDate).hour(dayjs(startTime).hour()).minute(0).second(0);
        const end = dayjs(endDate).hour(dayjs(endTime).hour()).minute(0).second(0);
        if (!end.isAfter(start)) return;

        if (availabilityDebounceRef.current) {
            clearTimeout(availabilityDebounceRef.current);
        }

        availabilityDebounceRef.current = setTimeout(() => {
            checkAvailability(start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss'));
        }, 350);
    };

    const handleSaveEdit = async () => {
        try {
            const values = await editForm.validateFields();
            setIsUpdating(true);

            const userId = SecureStorage.getLocalItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                return;
            }

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

            const availabilityResult = await checkAvailability(startDateTime, endDateTime);
            if (!availabilityResult?.ok) {
                toast.error('Unable to check availability. Please try again.');
                return;
            }
            if (availabilityResult?.hasConflict) {
                toast.error(availabilityResult.message || 'Schedule conflict detected');
                return;
            }

            const reservationId = localReservationDetails?.reservation_id || reservationDetails?.reservation_id;

            // Determine which venue/vehicle IDs to include for conflict checking on backend
            const currentVenues = Array.isArray(reservationDetails?.venues) ? reservationDetails.venues : [];
            const currentVehicles = Array.isArray(reservationDetails?.vehicles) ? reservationDetails.vehicles : [];
            const newVenueIds = Array.isArray(values?.venueIds) ? values.venueIds : [];
            const newVehicleIds = Array.isArray(values?.vehicleIds) ? values.vehicleIds : [];
            const venueIdsForCheck = (newVenueIds && newVenueIds.length > 0)
                ? newVenueIds
                : currentVenues.map(v => v.venue_id || v.ven_id).filter(Boolean);
            const vehicleIdsForCheck = (newVehicleIds && newVehicleIds.length > 0)
                ? newVehicleIds
                : currentVehicles.map(v => v.vehicle_id).filter(Boolean);

            // Update only reschedule dates, do not overwrite original reservation_start_date/end_date
            const response = await axios.post(`${baseUrl}reservation.php`, {
                operation: 'updateReservationReschedule',
                reservation_id: reservationId,
                reschedule_start_date: startDateTime,
                reschedule_end_date: endDateTime,
                user_admin_id: SecureStorage.getLocalItem('user_id'),
                venue_ids: venueIdsForCheck,
                vehicle_ids: vehicleIdsForCheck
            });

            if (response.data?.status === 'success') {

                // Optimistically update local details so UI reflects new reschedule dates
                setLocalReservationDetails(prev => ({
                    ...(prev || {}),
                    reschedule_start_date: startDateTime,
                    reschedule_end_date: endDateTime
                }));

                const venueChangesToApply = currentVenues
                    .map((v, idx) => {
                        const newId = newVenueIds[idx];
                        if (newId == null || newId === undefined || String(newId) === String(v.venue_id || v.ven_id)) return null;
                        return {
                            reservation_venue_id: v.reservation_venue_id,
                            reservation_change_venue_id: Number(newId)
                        };
                    })
                    .filter(Boolean);

                const vehicleChangesToApply = currentVehicles
                    .map((v, idx) => {
                        const newId = newVehicleIds[idx];
                        if (newId == null || newId === undefined || String(newId) === String(v.vehicle_id)) return null;
                        return {
                            reservation_vehicle_id: v.reservation_vehicle_id,
                            reservation_change_vehicle_id: Number(newId)
                        };
                    })
                    .filter(Boolean);

                if (venueChangesToApply.length > 0) {
                    const results = await Promise.allSettled(
                        venueChangesToApply.map(change => axios.post(`${baseUrl}reservation.php`, {
                            operation: 'updateVenueReschedule',
                            reservation_venue_id: change.reservation_venue_id,
                            reservation_change_venue_id: change.reservation_change_venue_id,
                            reservation_id: reservationId
                        }))
                    );
                    const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                    if (!allOk) {
                        const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                            || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                            || 'Failed to update venue during reschedule';
                        toast.error(firstError);
                        return;
                    }
                }

                if (vehicleChangesToApply.length > 0) {
                    const results = await Promise.allSettled(
                        vehicleChangesToApply.map(change => axios.post(`${baseUrl}reservation.php`, {
                            operation: 'updateVehicleReschedule',
                            reservation_vehicle_id: change.reservation_vehicle_id,
                            reservation_change_vehicle_id: change.reservation_change_vehicle_id,
                            reservation_id: reservationId
                        }))
                    );
                    const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                    if (!allOk) {
                        const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                            || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                            || 'Failed to update vehicle during reschedule';
                        toast.error(firstError);
                        return;
                    }
                }

                toast.success('Reservation rescheduled successfully!');
                setIsEditMode(false);
                if (onRefresh) {
                    try { await onRefresh(); } catch (_) { /* noop */ }
                }
            } else {
                toast.error(response.data?.message || 'Failed to update reservation details');
            }
        } catch (error) {
            if (!error?.response || error?.message === 'Network Error' || error?.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to update details.');
            } else if (error?.errorFields) {
                toast.error('Please fix the form errors');
            } else {
                toast.error('Failed to update reservation details');
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelReservation = async () => {
        try {
            const userId = SecureStorage.getLocalItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                return;
            }

            const reservationId = localReservationDetails?.reservation_id || reservationDetails?.reservation_id;
            if (!reservationId) {
                toast.error('Invalid reservation ID');
                return;
            }

            const response = await fetch(`${baseUrl}faculty&staff.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'handleCancelReservation',
                    reservation_id: reservationId,
                    user_id: userId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result?.status === 'success') {
                toast.success(result.message || 'Reservation cancelled successfully!');
                setShowCancelModal(false);
                onClose();
                if (onRefresh) onRefresh();
            } else {
                toast.error(result?.message || 'Failed to cancel reservation');
            }
        } catch (error) {
            if (!error?.response || error?.message === 'Network Error' || error?.name === 'TypeError' || !navigator.onLine) {
                toast.error('Network connection lost. Unable to cancel reservation.');
            } else {
                toast.error(`Failed to cancel reservation: ${error.message}`);
            }
        }
    };

    // Responsive modal/drawer content
    const modalContent = (
        <div className={`${isMobile ? 'h-full' : ''}`}>
            <div className={`${isMobile ? 'p-0 h-full flex flex-col' : 'p-0'}`}>
                {/* Header Section */}
                <div className={`bg-gradient-to-r from-green-700 to-lime-500 ${isMobile ? 'px-4 py-3 relative' : 'px-6 py-4'} ${isMobile ? 'rounded-none' : 'rounded-t-2xl'} shadow-md`}>
                    {/* Close button for mobile */}
                    {isMobile && (
                        <button 
                            onClick={onClose}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <CloseOutlined className="text-white text-sm" />
                        </button>
                    )}
                    
                    <div className={`${isMobile ? 'flex items-center justify-between pr-8' : 'flex justify-between items-center'}`}>
                        <div>
                            <h2 className={`text-white font-bold tracking-wide ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                                Reservation Details
                            </h2>
                            {isMobile && (
                                <p className="text-white/90 text-xs mt-1">
                                    {new Date(reservationDetails.reservation_created_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        
                        {!isMobile && (
                            <div className="text-white text-right">
                                <p className="text-white/90 text-sm font-medium">Created on</p>
                                <p className="font-semibold text-base mt-1">
                                    {new Date(reservationDetails.reservation_created_at).toLocaleString()}
                                </p>
                                {canShowTripTicket && (reservationDetails.vehicles?.length || 0) > 0 && (
                                    <div className="mt-3">
                                        <Button 
                                            onClick={() => setShowTripTicketPreview(true)}
                                            loading={isExporting}
                                            type="primary"
                                            className="bg-white text-green-700 border-none font-semibold shadow-sm hover:bg-white hover:text-green-800"
                                        >
                                            {isExporting ? 'Preparing Ticket...' : 'Generate Trip Ticket'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Trip Ticket button for mobile - moved to bottom of header */}
                    {isMobile && canShowTripTicket && (reservationDetails.vehicles?.length || 0) > 0 && (
                        <div className="mt-3 flex justify-center">
                            <Button 
                                onClick={() => setShowTripTicketPreview(true)}
                                loading={isExporting}
                                size="small"
                                type="primary"
                                className="bg-white text-green-700 border-none font-semibold hover:bg-white hover:text-green-800 px-4"
                            >
                                {isExporting ? 'Preparing...' : 'Trip Ticket'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className={`${isMobile ? 'p-4 flex-1 overflow-auto' : 'p-6'} bg-gray-50 ${isMobile ? '' : 'rounded-b-2xl'}`}>
                    <Tabs 
                        defaultActiveKey="1" 
                        type="card" 
                        size={isMobile ? 'middle' : 'large'}
                        className="advanced-reservation-tabs"
                    >
                        <Tabs.TabPane tab="Reservation Details" key="1">
                            <div className="space-y-6">
                                {/* Basic Details Section */}
                                <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-2xl border border-blue-100 shadow-sm mb-6`}>
                                     <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: isMobile ? 'column' : 'row',
                                            gap: isMobile ? 16 : 40
                                        }}
                                     >
                                        {/* Requester Information - always on the left on larger screens */}
                                        <div className="space-y-4" style={{ flex: 1, minWidth: 0 }}>
                                            <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-semibold text-gray-800 flex items-center gap-2`}>
                                                <UserOutlined className="text-blue-500" />
                                                Requester Details
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm md:text-base text-gray-500">Name</p>
                                                    <p className="font-medium text-gray-900 text-base md:text-lg">{reservationDetails.requester_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm md:text-base text-gray-500">Role</p>
                                                    <p className="font-medium text-gray-900 text-base md:text-lg">{reservationDetails.user_level_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm md:text-base text-gray-500">Department</p>
                                                    <p className="font-medium text-gray-900 text-base md:text-lg">{reservationDetails.department_name}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Schedule and Details - always on the right on larger screens */}
                                         <div className="space-y-4" style={{ flex: 1, minWidth: 0 }}>
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-semibold text-gray-800 flex items-center gap-2`}>
                                                    <CalendarOutlined className="text-orange-500" />
                                                    Schedule & Details
                                                </h3>
                                                {!isEditMode && allowsEditSchedule && (
                                                    <Button
                                                        type="text"
                                                        icon={<EditOutlined />}
                                                        onClick={handleEditClick}
                                                        size="small"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        Reschedule
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {isEditMode ? (
                                                    <Form form={editForm} layout="vertical" className="space-y-3" onValuesChange={handleEditFormValuesChange}>
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
                                                            <Input.TextArea rows={3} placeholder="Enter reservation description" />
                                                        </Form.Item>

                                                        {(reservationDetails.venues?.length > 0) && (
                                                            <div className="space-y-2">
                                                                {reservationDetails.venues.map((v, idx) => (
                                                                    <Form.Item
                                                                        key={v.reservation_venue_id || v.venue_id || idx}
                                                                        name={['venueIds', idx]}
                                                                        label={<span className="text-sm text-gray-500">Venue {idx + 1}</span>}
                                                                        rules={[{ required: true, message: 'Venue is required' }]}
                                                                    >
                                                                        <Select
                                                                            showSearch
                                                                            className="w-full"
                                                                            loading={isLoadingResourceOptions}
                                                                            optionFilterProp="label"
                                                                            options={(venueOptions || []).map(opt => ({
                                                                                value: String(opt.ven_id || opt.venue_id),
                                                                                label: opt.ven_name || opt.venue_name
                                                                            }))}
                                                                        />
                                                                    </Form.Item>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {(reservationDetails.vehicles?.length > 0) && (
                                                            <div className="space-y-2">
                                                                {reservationDetails.vehicles.map((v, idx) => (
                                                                    <Form.Item
                                                                        key={v.reservation_vehicle_id || v.vehicle_id || idx}
                                                                        name={['vehicleIds', idx]}
                                                                        label={<span className="text-sm text-gray-500">Vehicle {idx + 1}</span>}
                                                                        rules={[{ required: true, message: 'Vehicle is required' }]}
                                                                    >
                                                                        <Select
                                                                            showSearch
                                                                            className="w-full"
                                                                            loading={isLoadingResourceOptions}
                                                                            optionFilterProp="label"
                                                                            options={(vehicleOptions || []).map(opt => ({
                                                                                value: String(opt.vehicle_id),
                                                                                label: opt.vehicle_name || opt.vehicle_model_name || opt.model_name || opt.model || `Vehicle ${opt.vehicle_id}`
                                                                            }))}
                                                                        />
                                                                    </Form.Item>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-3'}`}>
                                                            <Form.Item
                                                                name="startDate"
                                                                label={<span className="text-sm text-gray-500">Start Date</span>}
                                                                rules={[{ required: true, message: 'Start date is required' }]}
                                                            >
                                                                <DatePicker
                                                                    format="YYYY-MM-DD"
                                                                    className="w-full"
                                                                    cellRender={cellRender}
                                                                    disabledDate={disabledDate}
                                                                />
                                                            </Form.Item>
                                                            <Form.Item
                                                                name="startTime"
                                                                label={<span className="text-sm text-gray-500">Start Time</span>}
                                                                rules={[{ required: true, message: 'Start time is required' }]}
                                                            >
                                                                <TimePicker
                                                                    format="h:mm A"
                                                                    className="w-full"
                                                                    use12Hours
                                                                    minuteStep={60}
                                                                    disabledHours={() => {
                                                                        const startDate = editForm.getFieldValue('startDate');
                                                                        return disabledHoursForDate(startDate);
                                                                    }}
                                                                />
                                                            </Form.Item>
                                                            <Form.Item
                                                                name="endDate"
                                                                label={<span className="text-sm text-gray-500">End Date</span>}
                                                                rules={[{ required: true, message: 'End date is required' }]}
                                                            >
                                                                <DatePicker
                                                                    format="YYYY-MM-DD"
                                                                    className="w-full"
                                                                    cellRender={cellRender}
                                                                    disabledDate={disabledDate}
                                                                />
                                                            </Form.Item>
                                                            <Form.Item
                                                                name="endTime"
                                                                label={<span className="text-sm text-gray-500">End Time</span>}
                                                                rules={[{ required: true, message: 'End time is required' }]}
                                                            >
                                                                <TimePicker
                                                                    format="h:mm A"
                                                                    className="w-full"
                                                                    use12Hours
                                                                    minuteStep={60}
                                                                    disabledHours={() => {
                                                                        const endDate = editForm.getFieldValue('endDate');
                                                                        const startDate = editForm.getFieldValue('startDate');
                                                                        const startTime = editForm.getFieldValue('startTime');

                                                                        let extraBlockUpToHour = null;
                                                                        if (endDate && startDate && startTime && dayjs(endDate).isSame(dayjs(startDate), 'day')) {
                                                                            extraBlockUpToHour = dayjs(startTime).hour();
                                                                        }

                                                                        return disabledHoursForDate(endDate, extraBlockUpToHour);
                                                                    }}
                                                                />
                                                            </Form.Item>
                                                        </div>

                                                        {availabilityError && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                                <p className="text-sm text-yellow-800 font-medium">⚠️ Availability Notice</p>
                                                                <p className="text-sm text-yellow-700 mt-1">{availabilityError}</p>
                                                            </div>
                                                        )}

                                                        {checkingAvailability && (
                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Spin size="small" />
                                                                    <p className="text-sm text-blue-800">Checking availability...</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <Button onClick={handleCancelEdit} size="small">
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                type="primary"
                                                                icon={<SaveOutlined />}
                                                                onClick={handleSaveEdit}
                                                                loading={isUpdating}
                                                                disabled={!!availabilityError}
                                                                size="small"
                                                            >
                                                                Save
                                                            </Button>
                                                        </div>
                                                    </Form>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Title</p>
                                                            <p className="font-semibold text-gray-900 text-base md:text-lg">{reservationDetails.reservation_title}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Description</p>
                                                            <p className="font-medium text-gray-900 text-sm md:text-base leading-relaxed">
                                                                {reservationDetails.reservation_description}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Date & Time</p>
                                                            <p className="font-semibold text-gray-900 text-base md:text-lg">
                                                                {formatDateRange(
                                                                    startDateStr,
                                                                    endDateStr
                                                                )}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                                {/* Show decline reason if available */}
                                                {reservationDetails.decline_reason && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <p className="text-sm text-red-700 font-medium mb-1">❌ Decline Reason</p>
                                                        <p className="text-sm text-red-900">{reservationDetails.decline_reason}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile actions */}
                                {isMobile && !isEditMode && (allowsCancellation || allowsEditSchedule) && (
                                    <div className="mt-4 space-y-2">
                                        {allowsEditSchedule && (
                                            <Button
                                                block
                                                size="large"
                                                onClick={handleEditClick}
                                            >
                                                Reschedule
                                            </Button>
                                        )}
                                        {allowsCancellation && (
                                            <Button
                                                danger
                                                block
                                                size="large"
                                                onClick={() => setShowCancelModal(true)}
                                            >
                                                Cancel Reservation
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Reschedule Proposed Section */}
                                {showReschedulePendingCard && (
                                    <div className={`bg-yellow-50 ${isMobile ? 'p-4' : 'p-6'} rounded-lg border border-yellow-200 shadow-sm mb-6`}>
                                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-800 mb-4`}>Proposed Reschedule Pending Confirmation</h3>
                                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isTablet ? 'grid-cols-1 gap-5' : 'grid-cols-2 gap-6'}`}>
                                            <div>
                                                <p className="text-sm text-gray-500">Original Date & Time</p>
                                                <p className="font-medium">{formatDateRange(
                                                    reservationDetails.reservation_start_date,
                                                    reservationDetails.reservation_end_date
                                                )}</p>
                                            </div>
                                            {(reservationDetails.reschedule_start_date || reservationDetails.reschedule_end_date) && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Proposed Date & Time</p>
                                                    <p className="font-medium">{formatDateRange(
                                                        reservationDetails.reschedule_start_date || reservationDetails.reservation_start_date,
                                                        reservationDetails.reschedule_end_date || reservationDetails.reservation_end_date
                                                    )}</p>
                                                </div>
                                            )}
                                        </div>
                                        {hasVenueChange && (
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
                                        {hasVehicleChange && (
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
                                    </div>
                                )}

                                {/* Reschedule Confirmed Section */}
                                {rescheduleConfirmedStatus && (
                                    <div className={`bg-green-50 ${isMobile ? 'p-4' : 'p-6'} rounded-lg border border-green-200 shadow-sm mb-6`}>
                                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-800 mb-4`}>Reschedule Confirmed</h3>
                                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isTablet ? 'grid-cols-1 gap-5' : 'grid-cols-2 gap-6'}`}>
                                            <div>
                                                <p className="text-sm text-gray-500">Original Date & Time</p>
                                                <p className="font-medium">{formatDateRange(
                                                    reservationDetails.reservation_start_date,
                                                    reservationDetails.reservation_end_date
                                                )}</p>
                                            </div>
                                            {(reservationDetails.reschedule_start_date || reservationDetails.reschedule_end_date) && (
                                                <div>
                                                    <p className="text-sm text-gray-500">New Date & Time</p>
                                                    <p className="font-medium">{formatDateRange(
                                                        reservationDetails.reschedule_start_date || reservationDetails.reservation_start_date,
                                                        reservationDetails.reschedule_end_date || reservationDetails.reservation_end_date
                                                    )}</p>
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

                                {/* Resources Section */}
                                <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-lg border border-blue-200 shadow-sm`}>
                                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-4 text-gray-800`}>Requested Resources</h3>
                                    <div className="space-y-6">
                                        {/* Venues */}
                                        {reservationDetails.venues?.length > 0 && (
                                            <div>
                                                <h4 className="text-base font-medium mb-2 text-gray-800">Venues</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {reservationDetails.venues.map((venue) => {
                                                        const changedCandidate = hasActiveReschedule && (
                                                            (venue.change_venue_name && venue.change_venue_name.trim() !== '') ||
                                                            (!!venue.change_venue_id && String(venue.change_venue_id) !== String(venue.venue_id))
                                                        );
                                                        const displayName = changedCandidate
                                                            ? ((venue.change_venue_name && venue.change_venue_name.trim()) || `ID ${venue.change_venue_id}`)
                                                            : venue.venue_name;
                                                        const displayBuildingName = changedCandidate
                                                            ? (venue.change_venue_building_name || 'Location not specified')
                                                            : (venue.venue_building_name || 'Location not specified');
                                                        const availabilityVenueId = changedCandidate ? (venue.change_venue_id || venue.venue_id) : venue.venue_id;
                                                        return (
                                                            <div key={venue.reservation_venue_id || venue.venue_id} className={`${isMobile ? 'p-2' : 'p-3'} border rounded-lg`}>
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <BuildOutlined className="mt-0.5 text-purple-500" />
                                                                        <div className="min-w-0">
                                                                            <p className={`font-medium text-gray-800 break-words ${isMobile ? 'text-sm' : ''}`}>{displayName}</p>
                                                                            <p className={`text-xs text-gray-500 mt-0.5`}>📍 {displayBuildingName}</p>
                                                                        </div>
                                                                    </div>
                                                                    {showAvailability && (
                                                                        <Tag className="shrink-0" color={checkResourceAvailability('venue', availabilityVenueId, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                                                            {checkResourceAvailability('venue', availabilityVenueId, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-gray-600 ml-6">
                                                                    <UserOutlined className="text-gray-500" />
                                                                    <span>Participants: <span className="font-medium text-gray-800">{venue.participants || 'Not specified'}</span></span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Vehicles */}
                                        {reservationDetails.vehicles?.length > 0 && (
                                            <div>
                                                <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-800`}>Vehicles</h4>
                                                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 gap-3'}`}>
                                                    {reservationDetails.vehicles.map((vehicle) => {
                                                        // const changedCandidate = hasActiveReschedule && (
                                                        //     (vehicle.change_vehicle_model && vehicle.change_vehicle_model.trim() !== '') ||
                                                        //     (!!vehicle.change_vehicle_id && String(vehicle.change_vehicle_id) !== String(vehicle.vehicle_id))
                                                        // );
                                                        const displayModel = (vehicle.change_vehicle_model && vehicle.change_vehicle_model.trim() !== '')
                                                            ? vehicle.change_vehicle_model
                                                            : vehicle.model || `ID ${vehicle.vehicle_id}`;
                                                        const displayMake = (vehicle.change_vehicle_make && vehicle.change_vehicle_make.trim() !== '')
                                                            ? vehicle.change_vehicle_make
                                                            : vehicle.make || 'N/A';
                                                        const displayCategory = (vehicle.change_vehicle_category && vehicle.change_vehicle_category.trim() !== '')
                                                            ? vehicle.change_vehicle_category
                                                            : vehicle.category || 'N/A';
                                                        const displayYear = (vehicle.change_vehicle_year && vehicle.change_vehicle_year.trim() !== '')
                                                            ? vehicle.change_vehicle_year
                                                            : vehicle.year || 'N/A';
                                                        const availabilityVehicleId = (vehicle.change_vehicle_id && String(vehicle.change_vehicle_id) !== '')
                                                            ? vehicle.change_vehicle_id
                                                            : vehicle.vehicle_id;
                                                        const assignedDriver = reservationDetails.drivers?.find(d => String(d.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id));
                                                        const displayLicense = (vehicle.change_vehicle_license && String(vehicle.change_vehicle_license).trim() !== '')
                                                            ? vehicle.change_vehicle_license
                                                            : vehicle.license || 'N/A';
                                                        return (
                                                            <div key={vehicle.reservation_vehicle_id || vehicle.vehicle_id} className={`bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl ${isMobile ? 'p-3' : 'p-4'} hover:shadow-md transition-shadow duration-200`}>
                                                                <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`bg-blue-100 ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg`}>
                                                                            <CarOutlined className={`text-blue-600 ${isMobile ? 'text-base' : 'text-lg'}`} />
                                                                        </div>
                                                                        <div>
                                                                            <h5 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>{displayModel}</h5>
                                                                            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>{displayMake} • {displayYear}</p>
                                                                        </div>
                                                                    </div>
                                                                    {showAvailability && (
                                                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                            checkResourceAvailability('vehicle', availabilityVehicleId, reservationDetails.availabilityData) 
                                                                                ? 'bg-green-100 text-green-700' 
                                                                                : 'bg-red-100 text-red-700'
                                                                        }`}>
                                                                            {checkResourceAvailability('vehicle', availabilityVehicleId, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className={`${isMobile ? 'mb-2' : 'mb-3'} space-y-2`}>
                                                                    <div className={`flex ${isMobile ? 'flex-col gap-1' : 'flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'}`}>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>License Plate:</span>
                                                                            <span className={`font-mono font-semibold text-gray-800 ${isMobile ? 'text-xs' : ''}`}>{displayLicense}</span>
                                                                        </div>
                                                                        <span className={`${isMobile ? 'hidden' : 'hidden sm:inline'} text-sm text-gray-500`}>•</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Category:</span>
                                                                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-800 font-medium break-words`}>{displayCategory}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {assignedDriver && (
                                                                    <div className={`flex items-center gap-2 ${isMobile ? 'pt-1.5' : 'pt-2'} border-t border-gray-200`}>
                                                                        <UserOutlined className="text-gray-400" />
                                                                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Driver: </span>
                                                                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-800`}>{assignedDriver.driver_name}</span>
                                                                    </div>
                                                                )}
                                                                {!assignedDriver && (
                                                                    <div className={`flex items-center gap-2 ${isMobile ? 'pt-1.5' : 'pt-2'} border-t border-gray-200`}>
                                                                        <UserOutlined className="text-gray-300" />
                                                                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400 italic`}>No driver assigned</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Equipment */}
                                        {reservationDetails.equipment?.length > 0 && (
                                            <div>
                                                <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2 text-gray-800`}>Equipment</h4>
                                                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 gap-3'}`}>
                                                    {reservationDetails.equipment.map((item) => (
                                                        <div key={item.reservation_equipment_id || item.equipment_id || item.name} className={`${isMobile ? 'p-3' : 'p-4'} border rounded-lg bg-gradient-to-r from-orange-50 to-amber-50`}>
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-start gap-2 min-w-0">
                                                                    <ToolOutlined className="mt-0.5 text-orange-500" />
                                                                    <div className="min-w-0">
                                                                        <p className={`font-medium text-gray-800 break-words ${isMobile ? 'text-sm' : ''}`}>{item.name}</p>
                                                                    </div>
                                                                </div>
                                                                <Tag color="orange" className="shrink-0" size={isMobile ? 'small' : 'default'}>Qty: {item.quantity}</Tag>
                                                            </div>
                                                            {/* Display units if available */}
                                                            {item.units && item.units.length > 0 && (
                                                                <div className="mt-2 ml-6 space-y-1">
                                                                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-medium mb-1`}>Assigned Units:</p>
                                                                    {item.units.map((unit) => {
                                                                        const activeStatus = Number(unit.active);
                                                                        const statusText = activeStatus === 1 ? 'In Use' : activeStatus === 0 ? 'Not In Use' : 'Returned';
                                                                        const statusColor = activeStatus === 1 ? 'orange' : activeStatus === 0 ? 'default' : 'green';
                                                                        
                                                                        return (
                                                                            <div key={unit.reservation_unit_id || unit.unit_id} className="flex items-center gap-2">
                                                                                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 font-mono`}>
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
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Trip Passengers Section */}
                                {reservationDetails.passengers && reservationDetails.passengers.length > 0 && (
                                    <div className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
                                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-4 text-gray-800`}>Trip Passengers</h3>
                                        <div className={`bg-white ${isMobile ? 'p-3' : 'p-4'} rounded-lg border border-purple-200 shadow-sm`}>
                                            <ul className="divide-y divide-purple-100">
                                                {reservationDetails.passengers.map((passenger, index) => (
                                                    <li key={index} className={`${isMobile ? 'py-2' : 'py-3'} flex items-center gap-3`}>
                                                        <UserOutlined className={`text-purple-400 ${isMobile ? 'text-base' : 'text-lg'}`} />
                                                        <span className={`text-gray-700 ${isMobile ? 'text-sm' : ''}`}>{passenger.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                                
                                
                            </div>
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Status History" key="2">
                            <div className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
                                {/* Status History Section - Non-collapsable */}
                                {reservationDetails.status_history && reservationDetails.status_history.length > 0 ? (
                                    <div className={`bg-white ${isMobile ? 'p-3' : 'p-4'} rounded-lg border border-green-200 shadow-sm mb-6`}>
                                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-4 text-gray-800`}>Status History</h3>
                                        <div className="space-y-3 sm:space-y-4">
                                            {reservationDetails.status_history
                                                
                                                .map((status, index) => {
                                                    return (
                                                        <div key={status.reservation_status_id} className="flex items-start">
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

                                {/* Dean's Approval Section - Collapsable */}
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
                                                                // Determine status from reservation_active with fallback to is_approved
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
                        </Tabs.TabPane>
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
                    visible={visible}
                    onClose={onClose}
                    className="reservation-detail-drawer"
                    bodyStyle={{ padding: 0 }}
                    headerStyle={{ display: 'none' }}
                    closable={true}
                    closeIcon={<CloseOutlined className="text-white" />}
                    maskClosable={false}
                >
                    {modalContent}
                </Drawer>
            ) : (
                <Modal
                    title={null}
                    visible={visible}
                    onCancel={onClose}
                    width={isTablet ? 900 : 1150}
                    style={{ top: 20 }}
                    footer={[
                        (!isEditMode && allowsEditSchedule) ? (
                            <Button
                                key="reschedule"
                                onClick={handleEditClick}
                            >
                                Reschedule
                            </Button>
                        ) : null,
                        (!isEditMode && allowsCancellation) ? (
                            <Button
                                key="cancel"
                                danger
                                onClick={() => setShowCancelModal(true)}
                            >
                                Cancel Reservation
                            </Button>
                        ) : null,
                        <button key="close" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                            Close
                        </button>
                    ]}
                    className="reservation-detail-modal"
                    bodyStyle={{ padding: '0' }}
                    maskClosable={false}
                    zIndex={1000}
                >
                    {modalContent}
                </Modal>
            )}

            <Modal
                visible={showCancelModal}
                title="Cancel Reservation"
                onCancel={() => setShowCancelModal(false)}
                onOk={handleCancelReservation}
                okText="Yes, Cancel"
                okButtonProps={{ danger: true }}
                maskClosable={false}
            >
                <p>Are you sure you want to cancel this reservation?</p>
            </Modal>
            {/* Trip Ticket Preview Modal */}
            <Modal
                title="Trip Ticket Preview"
                visible={showTripTicketPreview}
                onCancel={() => setShowTripTicketPreview(false)}
                width="90%"
                style={{ maxWidth: '1200px' }}
                
                className="trip-ticket-preview-modal"
                bodyStyle={{ padding: '0', maxHeight: '80vh', overflow: 'auto' }}
                maskClosable={false}
                zIndex={1001}
            >
                <div className="p-4">
                    <DriversTicket
                        initialData={ticketInitialData}
                        autoExport={false}
                        onDownloadRequest={() => {
                            setShowTripTicketPreview(false);
                            setIsExporting(true);
                        }}
                    />
                </div>
            </Modal>

            {/* Hidden DriversTicket component for direct export */}
            {isExporting && (
                <div style={{ 
                    position: 'fixed', 
                    top: '-9999px', 
                    left: '0px',
                    zIndex: -1,
                    visibility: 'visible',
                    opacity: 1
                }}>
                    <DriversTicket
                        initialData={ticketInitialData}
                        autoExport
                        onExported={() => setIsExporting(false)}
                    />
                </div>
            )}
        </>
    );
};

export default ReservationDetails;