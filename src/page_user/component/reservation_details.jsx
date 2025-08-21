import React, { useState, useEffect } from 'react';
import { Modal, Tag, Tabs, Button } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined,
    BuildOutlined,
    CarOutlined,
    ToolOutlined,
    InfoCircleOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { SecureStorage } from '../../utils/encryption';
import { generateGatePassPdf } from '../../components/Reservation/Gate_Pass';
import GatePass from '../../components/Reservation/Gate_Pass';

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

    // Helper: Check if both vehicle and equipment are present
    const hasVehicleAndEquipment = reservationDetails.vehicles?.length > 0 && reservationDetails.equipment?.length > 0;

    // Resource table columns definitions

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
                                <div className="space-y-6">
                                    {/* Venues */}
                                    {reservationDetails.venues?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Venues</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.venues.map((record) => (
                                                    <div key={record.venue_id} className="p-3 border rounded-lg flex items-start justify-between">
                                                        <div className="flex items-start gap-2 min-w-0">
                                                            <BuildOutlined className="mt-0.5 text-purple-500" />
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-800 break-words">{record.venue_name}</p>
                                                            </div>
                                                        </div>
                                                        {showAvailability && (
                                                            <Tag className="shrink-0" color={checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                                                {checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
                                                            </Tag>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vehicles */}
                                    {reservationDetails.vehicles?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Vehicles</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.vehicles.map((vehicle) => {
                                                    const assignedDriver = reservationDetails.drivers?.find(
                                                        (driver) => String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                                                    );
                                                    const availability = checkResourceAvailability('vehicle', vehicle.vehicle_id, reservationDetails.availabilityData);
                                                    return (
                                                        <div key={vehicle.reservation_vehicle_id || vehicle.vehicle_id} className="p-3 border rounded-lg">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-2 min-w-0">
                                                                    <CarOutlined className="mt-0.5 text-blue-500" />
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-gray-800 break-words">{vehicle.model}</p>
                                                                    </div>
                                                                </div>
                                                                {showAvailability && (
                                                                    <Tag className="shrink-0" color={availability ? 'green' : 'red'}>
                                                                        {availability ? 'Available' : 'Not Available'}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                                <span className="inline-flex items-center">
                                                                    <Tag color="blue" className="mr-2">Plate</Tag>{vehicle.license}
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
                                                    <div key={item.equipment_id || item.name} className="p-3 border rounded-lg flex items-start justify-between">
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
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 p-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                        <HistoryOutlined className="text-blue-500" /> Status History
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {reservationDetails.statusHistory && reservationDetails.statusHistory.map((status, index) => (
                                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start">
                                                <div className={`mt-1 w-2 h-2 rounded-full ${
                                                    status.status_name?.toLowerCase() === 'approved' ? 'bg-green-500' :
                                                    status.status_name?.toLowerCase() === 'declined' ? 'bg-red-500' :
                                                    'bg-yellow-500'
                                                }`} />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                                        <p className="font-medium text-gray-900 break-words">{status.status_name}</p>
                                                        <span className="text-xs sm:text-sm text-gray-500 sm:whitespace-nowrap">
                                                            {format(new Date(status.updated_at), 'MMM dd, yyyy h:mm a')}
                                                        </span>
                                                    </div>
                                                    {status.updated_by_full_name && status.status_name !== 'Pending' && (
                                                        <p className="text-xs sm:text-sm text-gray-500 break-words">
                                                            Updated by {status.updated_by_full_name}
                                                        </p>
                                                    )}
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
