import React, { useState, useEffect } from 'react';
import { Modal, Tag, Table, Tabs, Button } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined,
    InfoCircleOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { SecureStorage } from '../../utils/encryption';

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

    useEffect(() => {
        console.log("ReservationDetails mounted with props:", {
            visible,
            reservationDetails,
            showAvailability,
            onRefresh
        });
    }, [visible, reservationDetails, showAvailability, onRefresh]);

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
                                </div>
                            </div>
                        </TabPane>

                        <TabPane tab={<span><HistoryOutlined /> Status Log</span>} key="2">
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 p-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                        <HistoryOutlined className="text-blue-500" /> Status History
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {reservationDetails.statusHistory && reservationDetails.statusHistory.map((status, index) => (
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
                                    {(!reservationDetails.statusHistory || reservationDetails.statusHistory.length === 0) && (
                                        <div className="p-4 text-center text-gray-500">
                                            No status history available
                                        </div>
                                    )}
                                </div>
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
