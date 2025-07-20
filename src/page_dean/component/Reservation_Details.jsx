import React from 'react';
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
    showAvailability = false,
    checkResourceAvailability = () => true,
    onApprove,
    onDecline,
    isApprovalView = false
}) => {
    if (!reservationDetails) return null;

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
                        {showAvailability && (
                            <Tag color={checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                {checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                            </Tag>
                        )}
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
                        {showAvailability && (
                            <Tag color={checkResourceAvailability('vehicle', record.vehicle_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                {checkResourceAvailability('vehicle', record.vehicle_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
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
                            <Tag color={checkResourceAvailability('equipment', record.equipment_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                {checkResourceAvailability('equipment', record.equipment_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
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
                <Space key="footer" className="w-full justify-end">
                    {isApprovalView && (
                        <>
                            <Button 
                                icon={<CloseOutlined />}
                                onClick={onDecline}
                                danger
                                className="px-4 py-2"
                            >
                                Decline
                            </Button>
                            <Button 
                                icon={<CheckOutlined />}
                                type="primary"
                                onClick={onApprove}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700"
                            >
                                Approve
                            </Button>
                        </>
                    )}
                    <Button key="close" onClick={onClose} className="px-4 py-2">
                        Close
                    </Button>
                </Space>
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
                            <p className="font-semibold">{new Date(reservationDetails.reservation_created_at).toLocaleString()}</p>
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
                                            dataSource={reservationDetails.vehicles.map(vehicle => {
                                                let driverName = 'No driver assigned';
                                                if (reservationDetails.drivers && reservationDetails.drivers.length > 0) {
                                                    // Find drivers assigned to this vehicle by reservation_vehicle_id
                                                    const assignedDrivers = reservationDetails.drivers.filter(driver =>
                                                        String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                                                    );
                                                    if (assignedDrivers.length > 0) {
                                                        driverName = assignedDrivers.map(driver => driver.name).join(', ');
                                                    }
                                                }
                                                return {
                                                    ...vehicle,
                                                    driver: driverName
                                                };
                                            })} 
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
