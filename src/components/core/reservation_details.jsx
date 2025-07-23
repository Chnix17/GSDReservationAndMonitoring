import React from 'react';
import { Modal, Tag, Table } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined
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
    checkResourceAvailability = () => true
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
                                            reservationDetails.reservation_start_date,
                                            reservationDetails.reservation_end_date
                                        )}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
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
                                        // Always use driver_name for each driver
                                        let driverNames = 'No driver assigned';
                                        if (reservationDetails.drivers && reservationDetails.drivers.length > 0) {
                                            driverNames = reservationDetails.drivers.map(driver => driver.driver_name).join(', ');
                                        }
                                        return {
                                            ...vehicle,
                                            driver: driverNames
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
                                                        {/* Remove leading comma and space if present */}
                                                        <span className="font-medium">{text.replace(/^,\s*/, '')}</span>
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
                    
                </div>
            </div>
        </Modal>
    );
};

export default ReservationDetails;
