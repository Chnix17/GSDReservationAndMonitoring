
import { Modal, Tag, Table, Tabs, Spin, Collapse } from 'antd';
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
                                                columns={[...columns.vehicle, {
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
                                                }]}
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
                                
                                
                            </div>
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Status History" key="2">
                            <div className="mt-6">
                                {/* Status History Section - Non-collapsable */}
                                {reservationDetails.status_history && reservationDetails.status_history.length > 0 ? (
                                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm mb-6">
                                        <h3 className="text-lg font-medium mb-4 text-gray-800">Status History</h3>
                                        <div className="space-y-4">
                                            {reservationDetails.status_history
                                                .sort((a, b) => new Date(b.reservation_updated_at) - new Date(a.reservation_updated_at))
                                                .map((status, index) => {
                                                    const rawStatus = (status.reservation_active ?? status.is_approved ?? 0);
                                                    const statusVal = Number(rawStatus);
                                                    const dotClass = statusVal === 1 ? 'bg-green-500' : (statusVal === -1 ? 'bg-red-500' : 'bg-yellow-500');
                                                    const lineClass = statusVal === 1 ? 'bg-green-300' : (statusVal === -1 ? 'bg-red-300' : 'bg-yellow-300');
                                                    const tagColor = statusVal === 1 ? 'green' : (statusVal === -1 ? 'red' : 'gold');
                                                    const tagLabel = statusVal === 1 ? 'Approved' : (statusVal === -1 ? 'Declined' : 'Pending');
                                                    return (
                                                        <div key={status.reservation_status_id} className="flex">
                                                            <div className="flex flex-col items-center mr-4">
                                                                <div className={`w-3 h-3 rounded-full ${dotClass}`}></div>
                                                                {index !== reservationDetails.status_history.length - 1 && (
                                                                    <div className={`w-0.5 h-full ${lineClass}`}></div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 mb-4">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-gray-800">{status.status_name}</span>
                                                                        <Tag color={tagColor}>{tagLabel}</Tag>
                                                                    </div>
                                                                    <span className="text-sm text-gray-500">
                                                                        {new Date(status.reservation_updated_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    Updated by: {status.updated_by_name}
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