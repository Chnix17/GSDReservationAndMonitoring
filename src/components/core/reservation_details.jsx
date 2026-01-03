import React, { useMemo, useState } from 'react';
import { Modal, Tag, Tabs, Spin, Collapse, Button, Drawer } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined,
    DownOutlined,
    RightOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import DriversTicket from './trip_ticket';

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
    checkResourceAvailability = () => true
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

    // Trip Ticket export state
    const [isExporting, setIsExporting] = useState(false);
    const [showTripTicketPreview, setShowTripTicketPreview] = useState(false);
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
                
                return {
                    driver: driverNameForVehicle,
                    plate: vehiclePlate
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
        return (name === 'reschedule confirmed' || String(s.status_id) === '14') && activeVal === 1;
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
    const hasRescheduleProposal = !!pendingRescheduleStatus || !!(reservationDetails.reschedule_start_date || reservationDetails.reschedule_end_date) || hasVenueChange || hasVehicleChange;
    const isCancelledActive = normalizedStatusHistory.some(s => String(s.status_name).toLowerCase() === 'cancelled' && Number(s.reservation_active) === 1);
    const showReschedulePendingCard = hasRescheduleProposal && !isReservedActive && !isCancelledActive && !rescheduleConfirmedStatus;

    // Effective dates
    const startDateStr = (hasActiveReschedule && reservationDetails.reschedule_start_date)
        ? reservationDetails.reschedule_start_date
        : reservationDetails.reservation_start_date;
    const endDateStr = (hasActiveReschedule && reservationDetails.reschedule_end_date)
        ? reservationDetails.reschedule_end_date
        : reservationDetails.reservation_end_date;
    // Resources rendered as responsive list cards (no Antd Table columns needed)

    // Responsive modal/drawer content
    const modalContent = (
        <div className={`${isMobile ? 'h-full' : ''}`}>
            <div className={`${isMobile ? 'p-0 h-full flex flex-col' : 'p-0'}`}>
                {/* Header Section */}
                <div className={`bg-gradient-to-r from-green-700 to-lime-500 ${isMobile ? 'p-3 relative' : 'p-4'} ${isMobile ? 'rounded-none' : 'rounded-t-lg'}`}>
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
                            <h2 className={`text-white font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                                Reservation Details
                            </h2>
                            {isMobile && (
                                <p className="text-white/80 text-xs mt-0.5">
                                    {new Date(reservationDetails.reservation_created_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        
                        {!isMobile && (
                            <div className="text-white text-right">
                                <p className="text-white opacity-90 text-sm">Created on</p>
                                <p className="font-semibold">{new Date(reservationDetails.reservation_created_at).toLocaleString()}</p>
                                {canShowTripTicket && (reservationDetails.vehicles?.length || 0) > 0 && (
                                    <div className="mt-3">
                                        <Button 
                                            onClick={() => setShowTripTicketPreview(true)}
                                            loading={isExporting}
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
                        <div className="mt-2 flex justify-center">
                            <Button 
                                onClick={() => setShowTripTicketPreview(true)}
                                loading={isExporting}
                                size="small"
                                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                            >
                                {isExporting ? 'Preparing...' : 'Trip Ticket'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className={`${isMobile ? 'p-4 flex-1 overflow-auto' : 'p-6'}`}>
                    <Tabs defaultActiveKey="1" type="card" size={isMobile ? 'small' : 'default'}>
                        <Tabs.TabPane tab="Reservation Details" key="1">
                            <div className="space-y-6">
                                {/* Basic Details Section */}
                                <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-lg border border-blue-200 shadow-sm mb-6`}>
                                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isTablet ? 'grid-cols-1 gap-5' : 'grid-cols-2 gap-6'}`}>
                                        {/* Requester Information */}
                                        <div className="space-y-4">
                                            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-800 flex items-center gap-2`}>
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
                                            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-800 flex items-center gap-2`}>
                                                <CalendarOutlined className="text-orange-500" />
                                                Schedule & Details
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500">Title</p>
                                                    <p className="font-medium">{reservationDetails.reservation_title}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Description</p>
                                                    <p className="font-medium">{reservationDetails.reservation_description}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Date & Time</p>
                                                    <p className="font-medium">{formatDateRange(
                                                        startDateStr,
                                                        endDateStr
                                                    )}</p>
                                                </div>
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
                    width={isTablet ? 700 : 800}
                    footer={[
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