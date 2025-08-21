
import { Modal, Tag, Tabs, Spin, Collapse } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined,
    DownOutlined,
    RightOutlined
} from '@ant-design/icons';

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
    if (!reservationDetails) return null;

    // Detect reschedule and resource changes
    const statusArr = reservationDetails.status_history || reservationDetails.statusHistory || [];
    const pendingRescheduleStatus = statusArr.find(s => {
        const name = (s.status_name || '').toLowerCase();
        const activeVal = Number(s.reservation_active ?? s.is_approved ?? 0);
        return (name.includes('reschedule') || String(s.status_id) === '10') && activeVal === 0;
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
    const hasActiveReschedule = normalizedStatusHistory.some(s => String(s.status_name).toLowerCase() === 'reschedule' && Number(s.reservation_active) === 1);
    const hasRescheduleProposal = !!pendingRescheduleStatus || !!(reservationDetails.reschedule_start_date || reservationDetails.reschedule_end_date) || hasVenueChange || hasVehicleChange;
    const isCancelledActive = normalizedStatusHistory.some(s => String(s.status_name).toLowerCase() === 'cancelled' && Number(s.reservation_active) === 1);
    const showReschedulePendingCard = hasRescheduleProposal && !isReservedActive && !isCancelledActive;

    // Effective dates
    const startDateStr = (hasActiveReschedule && reservationDetails.reschedule_start_date)
        ? reservationDetails.reschedule_start_date
        : reservationDetails.reservation_start_date;
    const endDateStr = (hasActiveReschedule && reservationDetails.reschedule_end_date)
        ? reservationDetails.reschedule_end_date
        : reservationDetails.reservation_end_date;
    // Resources rendered as responsive list cards (no Antd Table columns needed)

    return (
        <Modal
            title={null}
            visible={visible}
            onCancel={onClose}
            width={800}
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
            <div className="p-0">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-green-700 to-lime-500 p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-white">
                                    Reservation #{reservationDetails.reservation_id}
                                </h2>
                              
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
                    <Tabs defaultActiveKey="1" type="card">
                        <Tabs.TabPane tab="Reservation Details" key="1">
                            <div className="space-y-6">
                                {/* Basic Details Section */}
                                <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm mb-6">
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
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reschedule Proposed Section */}
                                {showReschedulePendingCard && (
                                    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 shadow-sm mb-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">Proposed Reschedule Pending Confirmation</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                {/* Resources Section */}
                                <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                                    <h3 className="text-lg font-medium mb-4 text-gray-800">Requested Resources</h3>
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
                                                        const availabilityVenueId = changedCandidate ? (venue.change_venue_id || venue.venue_id) : venue.venue_id;
                                                        return (
                                                            <div key={venue.reservation_venue_id || venue.venue_id} className="p-3 border rounded-lg flex items-start justify-between">
                                                                <div className="flex items-start gap-2 min-w-0">
                                                                    <BuildOutlined className="mt-0.5 text-purple-500" />
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-gray-800 break-words">{displayName}</p>
                                                                    </div>
                                                                </div>
                                                                {showAvailability && (
                                                                    <Tag className="shrink-0" color={checkResourceAvailability('venue', availabilityVenueId, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                                                        {checkResourceAvailability('venue', availabilityVenueId, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Vehicles */}
                                        {reservationDetails.vehicles?.length > 0 && (
                                            <div>
                                                <h4 className="text-base font-medium mb-2 text-gray-800">Vehicles</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {reservationDetails.vehicles.map((vehicle) => {
                                                        const changedCandidate = hasActiveReschedule && (
                                                            (vehicle.change_vehicle_model && vehicle.change_vehicle_model.trim() !== '') ||
                                                            (!!vehicle.change_vehicle_id && String(vehicle.change_vehicle_id) !== String(vehicle.vehicle_id))
                                                        );
                                                        const displayModel = changedCandidate
                                                            ? ((vehicle.change_vehicle_model && vehicle.change_vehicle_model.trim()) || `ID ${vehicle.change_vehicle_id}`)
                                                            : vehicle.model;
                                                        const availabilityVehicleId = changedCandidate ? (vehicle.change_vehicle_id || vehicle.vehicle_id) : vehicle.vehicle_id;
                                                        const assignedDriver = reservationDetails.drivers?.find(d => String(d.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id));
                                                        const displayLicense = (hasActiveReschedule && vehicle.change_vehicle_license && String(vehicle.change_vehicle_license).trim() !== '')
                                                            ? vehicle.change_vehicle_license
                                                            : vehicle.license;
                                                        return (
                                                            <div key={vehicle.reservation_vehicle_id || vehicle.vehicle_id} className="p-3 border rounded-lg">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <CarOutlined className="mt-0.5 text-blue-500" />
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-gray-800 break-words">{displayModel}</p>
                                                                        </div>
                                                                    </div>
                                                                    {showAvailability && (
                                                                        <Tag className="shrink-0" color={checkResourceAvailability('vehicle', availabilityVehicleId, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                                                            {checkResourceAvailability('vehicle', availabilityVehicleId, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                                    <span className="inline-flex items-center">
                                                                        <Tag color="blue" className="mr-2">Plate</Tag>{displayLicense}
                                                                    </span>
                                                                    <span className="inline-flex items-center">
                                                                        <UserOutlined className="mr-2 text-blue-500" />
                                                                        {assignedDriver ? assignedDriver.driver_name : 'No driver assigned'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Equipment */}
                                        {reservationDetails.equipment?.length > 0 && (
                                            <div>
                                                <h4 className="text-base font-medium mb-2 text-gray-800">Equipment</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {reservationDetails.equipment.map((item) => (
                                                        <div key={item.reservation_equipment_id || item.equipment_id || item.name} className="p-3 border rounded-lg flex items-start justify-between">
                                                            <div className="flex items-start gap-2 min-w-0">
                                                                <ToolOutlined className="mt-0.5 text-orange-500" />
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-gray-800 break-words">{item.name}</p>
                                                                </div>
                                                            </div>
                                                            <Tag color="orange" className="shrink-0">Qty: {item.quantity}</Tag>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Trip Passengers Section */}
                                {reservationDetails.passengers && reservationDetails.passengers.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium mb-4 text-gray-800">Trip Passengers</h3>
                                        <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                                            <ul className="divide-y divide-purple-100">
                                                {reservationDetails.passengers.map((passenger, index) => (
                                                    <li key={index} className="py-3 flex items-center gap-3">
                                                        <UserOutlined className="text-purple-400 text-lg" />
                                                        <span className="text-gray-700">{passenger.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                                
                                
                            </div>
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Status History" key="2">
                            <div className="mt-6">
                                {/* Status History Section - Non-collapsable */}
                                {reservationDetails.status_history && reservationDetails.status_history.length > 0 ? (
                                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm mb-6">
                                        <h3 className="text-lg font-medium mb-4 text-gray-800">Status History</h3>
                                        <div className="space-y-3 sm:space-y-4">
                                            {reservationDetails.status_history
                                                .sort((a, b) => new Date(b.reservation_updated_at) - new Date(a.reservation_updated_at))
                                                .map((status, index) => {
                                                    const rawStatus = (status.reservation_active ?? status.is_approved ?? 0);
                                                    const statusVal = Number(rawStatus);
                                                    const dotClass = statusVal === 1 ? 'bg-green-500' : (statusVal === -1 ? 'bg-red-500' : 'bg-yellow-500');
                                                    const lineClass = statusVal === 1 ? 'bg-green-300' : (statusVal === -1 ? 'bg-red-300' : 'bg-yellow-300');
                                                 
                                                    return (
                                                        <div key={status.reservation_status_id} className="flex items-start">
                                                            <div className="flex flex-col items-center mr-4">
                                                                <div className={`w-3 h-3 rounded-full ${dotClass}`}></div>
                                                                {index !== reservationDetails.status_history.length - 1 && (
                                                                    <div className={`w-0.5 flex-1 ${lineClass}`}></div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 mb-4">
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                                                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                                                        <span className="font-medium text-gray-800 break-words">{status.status_name}</span>
                                                                       
                                                                    </div>
                                                                    <span className="text-xs sm:text-sm text-gray-500 w-full sm:w-auto sm:text-right sm:whitespace-nowrap">
                                                                        {new Date(status.reservation_updated_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-600">
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
        </Modal>
    );
};

export default ReservationDetails;