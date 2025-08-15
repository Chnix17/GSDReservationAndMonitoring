import React, { useState, useEffect } from 'react';
import { Modal, Tag, Table, Tabs, Button, Spin, Collapse } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined,
    InfoCircleOutlined,
    HistoryOutlined,
    DownOutlined,
    RightOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { SecureStorage } from '../../utils/encryption';
import { generateGatePassPdf } from '../../components/Reservation/Gate_Pass';
import GatePass from '../../components/Reservation/Gate_Pass';
import axios from 'axios';

const { TabPane } = Tabs;



const ReservationDetails = ({ 
    visible, 
    onClose, 
    reservationDetails,
    showAvailability = false,
    checkResourceAvailability = () => true,
    onRefresh
}) => {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const baseUrl = SecureStorage.getLocalItem("url");
    const gatePassRef = React.useRef(); // Ref for hidden GatePass
    const [deansApproval, setDeansApproval] = useState([]);
    const [isLoadingDeans, setIsLoadingDeans] = useState(false);

    useEffect(() => {
        console.log("ReservationDetails mounted with props:", {
            visible,
            reservationDetails,
            showAvailability,
            onRefresh
        });
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
                const response = await axios.post(`${baseUrl}user.php`, {
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
    }, [visible, reservationDetails, baseUrl]);

    if (!reservationDetails) {
        console.log("No reservation details provided");
        return null;
    }

    console.log("Rendering ReservationDetails with:", reservationDetails);

    const handleCancelReservation = async () => {
        try {
            const userId = SecureStorage.getSessionItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                return;
            }

            const response = await fetch(`${baseUrl}process_reservation.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'handleCancelReservation',
                    reservation_id: reservationDetails.reservation_id,
                    user_id: userId
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                toast.success(result.message || 'Reservation cancelled successfully!');
                setShowCancelModal(false);
                onClose();
                if (onRefresh) onRefresh();
            } else {
                toast.error(result.message || 'Failed to cancel reservation');
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            toast.error('Failed to cancel reservation');
        }
    };

    // Check if reservation is cancelled or completed
    const isCancelled = reservationDetails.statusHistory?.some(
        status => status.status_name === "Cancelled"
    );
    
    const isCompleted = reservationDetails.statusHistory?.some(
        status => {
            const completedById = status.status_id === "4";
            const completedByName = status.status_name === "Completed";
            const isActiveStatus = status.active === "1";
            return (completedById || completedByName) && isActiveStatus;
        }
    ) || (reservationDetails.reservation_status?.toLowerCase() === "completed");

    // Helper: Check if both vehicle and equipment are present
    const hasVehicleAndEquipment = reservationDetails.vehicles?.length > 0 && reservationDetails.equipment?.length > 0;

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
        <>
            <Modal
                open={visible}
                onCancel={onClose}
                width={900}
                footer={[
                    <Button key="close" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        Close
                    </Button>,
                    (!isCancelled && !isCompleted) && (
                        <Button
                            key="cancel"
                            onClick={() => setShowCancelModal(true)}
                            disabled={reservationDetails.active === "0"}
                            className={`px-4 py-2 text-white rounded-lg ml-2 ${
                                reservationDetails.active === "0"
                                    ? 'bg-red-300 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            Cancel Reservation
                        </Button>
                    )
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

                    {/* Tabs Section */}
                    <Tabs defaultActiveKey="1" className="p-6">
                        <TabPane tab={<span><InfoCircleOutlined /> Details</span>} key="1">
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
                                                <p className="font-medium">
                                                    {format(new Date(reservationDetails.reservation_start_date), 'MMM dd, yyyy h:mm a')} - 
                                                    {format(new Date(reservationDetails.reservation_end_date), 'h:mm a')}
                                                </p>
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
                                                // Find the driver assigned to this vehicle by reservation_vehicle_id (compare as strings)
                                                const assignedDriver = reservationDetails.drivers?.find(driver => String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id));
                                                return {
                                                    ...vehicle,
                                                    driver: assignedDriver ? assignedDriver.driver_name : 'No driver assigned'
                                                };
                                            })} 
                                            columns={[
                                                ...columns.vehicle,
                                                {
                                                    title: 'Driver',
                                                    dataIndex: 'driver',
                                                    key: 'driver',
                                                    render: (text) => (
                                                        <div className="flex items-center">
                                                            <UserOutlined className="mr-2 text-blue-500" />
                                                            <span className="font-medium">{text}</span>
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

                                    {/* Gate Pass Download Button (if both vehicle and equipment) */}
                                    {hasVehicleAndEquipment && (
                                        <>
                                            <Button type="primary" onClick={() => generateGatePassPdf(gatePassRef.current)} style={{ marginTop: 16 }}>
                                                Download Gate Pass (PDF)
                                            </Button>
                                            {/* Hidden GatePass for PDF generation */}
                                            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                                                <GatePass ref={gatePassRef} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </TabPane>

                        <TabPane tab={<span><HistoryOutlined /> Status Log</span>} key="2">
                            <div className="mt-6">
                                {/* Status History Section - mirror reservation_details.jsx */}
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
                                                        <div key={status.reservation_status_id || index} className="flex">
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
                                        {/* Fallback to previous statusHistory shape if present */}
                                        {reservationDetails.statusHistory && reservationDetails.statusHistory.length > 0 ? (
                                            <div className="divide-y divide-gray-200">
                                                {reservationDetails.statusHistory.map((status, index) => (
                                                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`w-2 h-2 rounded-full ${
                                                                    status.status_name?.toLowerCase() === 'approved' ? 'bg-green-500' :
                                                                    status.status_name?.toLowerCase() === 'declined' ? 'bg-red-500' :
                                                                    'bg-yellow-500'
                                                                }`} />
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{status.status_name}</p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {format(new Date(status.updated_at), 'MMM dd, yyyy h:mm a')}
                                                                        {status.updated_by_full_name && status.status_name !== 'Pending' && (
                                                                            <span className="ml-2 text-gray-400">
                                                                                • Updated by {status.updated_by_full_name}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">No status history available</p>
                                        )}
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
            </Modal>

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
        </>
    );
};

export default ReservationDetails;
