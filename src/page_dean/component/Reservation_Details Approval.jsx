import React, { useEffect, useState } from 'react';
import { Modal, Tag, Table, Button, Space } from 'antd';
import { 
    UserOutlined, 
    TeamOutlined, 
    CalendarOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined,

    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { SecureStorage } from '../../utils/encryption';
import { message } from 'antd';

const formatDateRange = (startDate, endDate) => {
    const start = new Date(new Date(startDate).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const end = new Date(new Date(endDate).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

    const isSameDay = start.toDateString() === end.toDateString();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila'
        });
    };

    if (isSameDay) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} ${formatTime(start)} to ${formatTime(end)}`;
    } else {
        return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}\n${formatTime(start)} to ${formatTime(end)}`;
    }
};

const dayOfWeekMap = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

function getDaysBetween(startDate, endDate) {
    // Returns an array of day names between two dates (inclusive), using Asia/Manila timezone
    const days = [];
    let current = new Date(new Date(startDate).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const end = new Date(new Date(endDate).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    while (current <= end) {
        days.push(dayOfWeekMap[current.getDay()]);
        current.setDate(current.getDate() + 1);
    }
    return [...new Set(days)]; // Unique days
}

function timeToMinutes(timeStr) {
    // '08:00:00' => 480
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function checkVenueAvailability(venueId, reservationDetails) {
    // If no availabilityData, assume available
    const scheduleData = reservationDetails.availabilityData || [];
    const venueIdStr = String(venueId);
    const venueSchedules = scheduleData.filter(s => String(s.ven_id) === venueIdStr);
    if (!venueSchedules.length) return true;

    const resStart = new Date(new Date(reservationDetails.reservation_start_date).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const resEnd = new Date(new Date(reservationDetails.reservation_end_date).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const resDays = getDaysBetween(resStart, resEnd);
    const resStartMinutes = resStart.getHours() * 60 + resStart.getMinutes();
    const resEndMinutes = resEnd.getHours() * 60 + resEnd.getMinutes();

    for (const day of resDays) {
        for (const sched of venueSchedules) {
            if (sched.day_of_week === day) {
                const schedStart = timeToMinutes(sched.start_time);
                const schedEnd = timeToMinutes(sched.end_time);
                if (
                    (resStartMinutes < schedEnd && resEndMinutes > schedStart)
                ) {
                    // Return conflict details
                    return {
                        section_name: sched.section_name,
                        start_time: sched.start_time,
                        end_time: sched.end_time
                    };
                }
            }
        }
    }
    return true;
}

// Helper to format 24-hour time string to '8am'/'10pm' format in Asia/Manila timezone
function formatTo12Hour(timeStr) {
    // Use a fixed date to avoid DST issues
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date(Date.UTC(2000, 0, 1, h, m));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'Asia/Manila' }).replace(' ', '').toLowerCase();
}

const ReservationDetails = ({ 
    visible, 
    onClose, 
    reservationDetails,
    showAvailability = false,
    checkResourceAvailability,
    onApprove,
    onDecline,
    isApprovalView = false,
    onActionComplete
}) => {
    const [availabilityData, setAvailabilityData] = useState([]);
    // Track if any venue is not available
    const [anyVenueNotAvailable, setAnyVenueNotAvailable] = useState(false);
    // Track if reservation is expired
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const response = await fetch('http://localhost/coc/gsd/Department_Dean.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'fetchVenueScheduledCheck' })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    setAvailabilityData(result.data);
                } else {
                    setAvailabilityData([]);
                }
            } catch (error) {
                setAvailabilityData([]);
            }
        };
        if (visible) {
            fetchAvailability();
        }
    }, [visible]);

    useEffect(() => {
        if (visible && reservationDetails && reservationDetails.venues && availabilityData.length > 0) {
            let foundUnavailable = false;
            reservationDetails.venues.forEach(venue => {
                const available = checkVenueAvailability(venue.venue_id, { ...reservationDetails, availabilityData });
                if (available !== true) foundUnavailable = true;
            });
            setAnyVenueNotAvailable(foundUnavailable);
        } else {
            setAnyVenueNotAvailable(false);
        }
    }, [visible, availabilityData, reservationDetails]);

    useEffect(() => {
        // Check if reservation is expired (end date in the past)
        if (reservationDetails && reservationDetails.reservation_end_date) {
            const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
            const end = new Date(new Date(reservationDetails.reservation_end_date).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
            setIsExpired(end < now);
        } else {
            setIsExpired(false);
        }
    }, [reservationDetails]);

    // Updated checkResourceAvailability to use local availabilityData
    const localCheckResourceAvailability = (type, id) => {
        if (type === 'venue') {
            return checkVenueAvailability(id, { ...reservationDetails, availabilityData });
        }
        return true;
    };

    // Approve/Decline API handler
    const handleAction = async (isApprove) => {
        try {
            const user_id = SecureStorage.getSessionItem('user_id');
            if (!user_id) throw new Error('User not logged in');
            const payload = {
                operation: 'handleReviewUpdated',
                reservation_id: reservationDetails.reservation_id,
                user_id: user_id,
                is_available: isApprove
            };
            const response = await axios.post('http://localhost/coc/gsd/Department_Dean.php', payload);
            if (response.data && response.data.status === 'success') {
                message.success(isApprove ? 'Reservation approved!' : 'Reservation declined!');
                if (onActionComplete) {
                    onActionComplete();
                } else {
                    onClose();
                }
            } else {
                message.error(response.data.message || 'Action failed');
            }
        } catch (error) {
            message.error(error.message || 'Network error');
        }
    };

    if (!reservationDetails) return null;

    // Resource table columns definitions
    const columns = {
        venue: [
            {
                title: 'Venue Name',
                dataIndex: 'venue_name',
                key: 'venue_name',
                render: (text, record) => {
                    const availability = localCheckResourceAvailability('venue', record.venue_id);
                    const isAvailable = availability === true;
                    // Debug log
                    console.log('Venue:', text, 'Availability:', availability);
                    return (
                        <div className="flex items-center justify-between w-full">
                            {/* Left: Venue name, icon, and tag */}
                            <div className="flex items-center gap-2">
                                <BuildOutlined className="text-purple-500" />
                                <span className="font-medium">{text}</span>

                                    <Tag color={isAvailable ? 'green' : 'red'}>
                                        {isAvailable ? 'Available' : 'Not Available'}
                                    </Tag>
                        
                            </div>
                            {/* Right: Conflict info if not available */}
                            <div className="flex flex-col items-end min-w-[180px]">
                                {!isAvailable && availability && (
                                    <span className="text-xs text-gray-600 font-normal text-right">
                                        In use by: <b>{availability.section_name}</b><br />
                                        Time: <b>From {formatTo12Hour(availability.start_time)} to {formatTo12Hour(availability.end_time)}</b>
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }
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
                        {showAvailability && (
                            <Tag color={localCheckResourceAvailability('vehicle', record.vehicle_id) ? 'green' : 'red'}>
                                {localCheckResourceAvailability('vehicle', record.vehicle_id) ? 'Available' : 'Not Available'}
                            </Tag>
                        )}
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
                        {showAvailability && (
                            <Tag color={localCheckResourceAvailability('equipment', record.equipment_id) ? 'green' : 'red'}>
                                {localCheckResourceAvailability('equipment', record.equipment_id) ? 'Available' : 'Not Available'}
                            </Tag>
                        )}
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

    return (
        <Modal
            title={null}
            visible={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <>
                    {isExpired && (
                        <div className="w-full text-center mb-2">
                            <span className="text-red-600 font-semibold">This reservation has expired and cannot be approved.</span>
                        </div>
                    )}
                    <Space key="footer" className="w-full justify-end">
                        {isApprovalView && (
                            <>
                                <Button 
                                    icon={<CloseOutlined />}
                                    onClick={() => handleAction(false)}
                                    danger
                                    className="px-4 py-2"
                                    disabled={false}
                                >
                                    Decline
                                </Button>
                                <Button 
                                    icon={<CheckOutlined />}
                                    type="primary"
                                    onClick={() => handleAction(true)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700"
                                    disabled={anyVenueNotAvailable || isExpired}
                                >
                                    Approve
                                </Button>
                            </>
                        )}
                        <Button key="close" onClick={onClose} className="px-4 py-2">
                            Close
                        </Button>
                    </Space>
                </>
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
                                <Tag color={reservationDetails.active === "0" ? "gold" : "blue"} className="text-sm px-3 py-1">
                                    {reservationDetails.active === "0" ? "Final Confirmation" : "Pending Department Approval"}
                                </Tag>
                            </div>
                        </div>
                        <div className="text-white text-right">
                            <p className="text-white opacity-90 text-sm">Created on</p>
                            <p className="font-semibold">{new Date(new Date(reservationDetails.reservation_created_at).toLocaleString('en-US', { timeZone: 'Asia/Manila' })).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    {/* Current Request Section */}
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                            <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                                <UserOutlined className="text-blue-600" />
                                Reservation Details
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Requester Information */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-4 text-gray-800">Requester Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <UserOutlined className="text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Name</p>
                                                <p className="font-medium">{reservationDetails.requester_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TeamOutlined className="text-green-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Role</p>
                                                <p className="font-medium">{reservationDetails.user_level_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium mb-4 text-gray-800">Schedule</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <CalendarOutlined className="text-orange-500" />
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
                            </div>

                            {/* Resources Section */}
                            <div className="mt-6">
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
                                                driver: reservationDetails.drivers?.[0]?.name || 'No driver assigned'
                                            }))} 
                                            columns={[
                                                ...columns.vehicle,
                                                {
                                                    title: 'Driver',
                                                    dataIndex: 'driver',
                                                    key: 'driver',
                                                    render: (text, record) => (
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <UserOutlined className="mr-2 text-blue-500" />
                                                                <span className="font-medium">{text}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            ]}
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

                            {/* Description */}
                            {reservationDetails.reservation_description && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium mb-2 text-gray-800">Description</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-gray-700">{reservationDetails.reservation_description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ReservationDetails;
