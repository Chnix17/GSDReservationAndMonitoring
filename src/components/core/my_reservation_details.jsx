import React, { useState, useEffect } from 'react';
import { Modal, Tag, Tabs, Button, Spin, Collapse } from 'antd';
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
    const [isProcessingReschedule, setIsProcessingReschedule] = useState(false);

    useEffect(() => {
        console.log("ReservationDetails mounted with props:", {
            visible,
            reservationDetails,
            showAvailability,
            onRefresh
        });
        
        // Log conditions data specifically
        if (reservationDetails?.conditions) {
            console.log("Conditions data:", reservationDetails.conditions);
            console.log("Equipment conditions:", reservationDetails.conditions.equipment);
            console.log("Vehicle conditions:", reservationDetails.conditions.vehicle);
            console.log("Venue conditions:", reservationDetails.conditions.venue);
            console.log("Unit conditions:", reservationDetails.conditions.unit);
        }
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
    const statusHistory = reservationDetails.status_history || reservationDetails.statusHistory || [];
    
    const isCancelled = statusHistory.some(
        status => status.status_name === "Cancelled"
    );
    
    const isCompleted = statusHistory.some(
        status => {
            const completedById = status.status_id === 4;
            const completedByName = status.status_name === "Completed";
            const isActiveStatus = status.reservation_active === 1;
            return (completedById || completedByName) && isActiveStatus;
        }
    ) || (reservationDetails.status_name?.toLowerCase() === "completed");

    console.log(isCompleted);

    // Helper: Check if both vehicle and equipment are present
    const hasVehicleAndEquipment = reservationDetails.vehicles?.length > 0 && reservationDetails.equipment?.length > 0;

    // Detect pending reschedule from status history or presence of reschedule fields
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
    const hasRescheduleProposal = !!pendingRescheduleStatus || !!(reservationDetails.reschedule_start_date || reservationDetails.reschedule_end_date) || hasVenueChange || hasVehicleChange;

    // Status-based visibility controls
    const normalizedStatusHistory = Array.isArray(reservationDetails.status_history)
        ? reservationDetails.status_history
        : (Array.isArray(reservationDetails.statusHistory) ? reservationDetails.statusHistory : []);
        
    // Check if there's any Reschedule status (active or inactive)
    // const hasRescheduleStatus = normalizedStatusHistory.some(s => 
    //     String(s.status_name).toLowerCase() === 'reschedule'
    // );
    
    // Check if there's an active Reschedule status
    const hasActiveReschedule = normalizedStatusHistory.some(s => 
        String(s.status_name).toLowerCase() === 'reschedule' && Number(s.reservation_active) === 1
    );
    
    // Check if there's a pending Reschedule status (active: 0)
    const hasPendingReschedule = normalizedStatusHistory.some(s => 
        String(s.status_name).toLowerCase() === 'reschedule' && Number(s.reservation_active) === 0
    );
    
    const isReservedActive = normalizedStatusHistory.some(s => 
        String(s.status_name).toLowerCase() === 'reserved' && Number(s.reservation_active) === 1
    );
    
    const isCancelledActive = normalizedStatusHistory.some(s => 
        String(s.status_name).toLowerCase() === 'cancelled' && Number(s.reservation_active) === 1
    );
    
    // Show reschedule card if there's a pending reschedule OR if there's a reschedule proposal
    const showReschedulePendingCard = hasPendingReschedule || (hasRescheduleProposal && !isReservedActive && !isCancelledActive);

    // Effective schedule window: if there's an active reschedule, use reschedule dates; otherwise use original
    const startDateStr = (hasActiveReschedule && reservationDetails.reschedule_start_date)
        ? reservationDetails.reschedule_start_date
        : reservationDetails.reservation_start_date;
    const endDateStr = (hasActiveReschedule && reservationDetails.reschedule_end_date)
        ? reservationDetails.reschedule_end_date
        : reservationDetails.reservation_end_date;
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;
    const now = new Date();
    const isDuringReservationWindow = (startDate && endDate) ? (now >= startDate && now < endDate) : false;
    const isActiveRecord = String(reservationDetails.active) === "1";
    // Final disable logic for Cancel button
    const disableCancel = (!isActiveRecord) || showReschedulePendingCard || isDuringReservationWindow;

    const handleRespondReschedule = async (isAccept) => {
        try {
            const userId = SecureStorage.getLocalItem('user_id') || SecureStorage.getSessionItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                return;
            }
            setIsProcessingReschedule(true);
            const response = await axios.post(`${baseUrl}faculty&staff.php`, {
                operation: 'updateReschedule',
                reservationId: reservationDetails.reservation_id,
                confirm: !!isAccept,
                userId: Number(userId)
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data?.status === 'success') {
                toast.success(isAccept ? 'Reschedule confirmed.' : 'Reschedule declined.');
                if (onRefresh) {
                    await onRefresh();
                }
                onClose();
            } else {
                toast.error(response.data?.message || 'Failed to process reschedule.');
            }
        } catch (error) {
            console.error('Error processing reschedule response:', error);
            toast.error('Error processing reschedule. Please try again.');
        } finally {
            setIsProcessingReschedule(false);
        }
    };

    // Resources rendered as responsive list cards (no Antd Table columns needed)

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
                            disabled={disableCancel}
                            className={`px-4 py-2 text-white rounded-lg ml-2 ${
                                disableCancel
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
                                                    {format(new Date((hasActiveReschedule && reservationDetails.reschedule_start_date) ? reservationDetails.reschedule_start_date : reservationDetails.reservation_start_date), 'MMM dd, yyyy h:mm a')} - 
                                                    {format(new Date((hasActiveReschedule && reservationDetails.reschedule_end_date) ? reservationDetails.reschedule_end_date : reservationDetails.reservation_end_date), 'h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reschedule Applied details are now reflected within Schedule & Resources sections */}

                            {/* Reschedule Confirmation Section */}
                            {showReschedulePendingCard && (
                                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 shadow-sm mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">Proposed Reschedule Pending Confirmation</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500">Original Date & Time</p>
                                            <p className="font-medium">
                                                {format(new Date(reservationDetails.reservation_start_date), 'MMM dd, yyyy h:mm a')} -
                                                {format(new Date(reservationDetails.reservation_end_date), 'h:mm a')}
                                            </p>
                                        </div>
                                        {(reservationDetails.reschedule_start_date || reservationDetails.reschedule_end_date) && (
                                            <div>
                                                <p className="text-sm text-gray-500">Proposed Date & Time</p>
                                                <p className="font-medium">
                                                    {reservationDetails.reschedule_start_date ? format(new Date(reservationDetails.reschedule_start_date), 'MMM dd, yyyy h:mm a') : '-'} -
                                                    {reservationDetails.reschedule_end_date ? format(new Date(reservationDetails.reschedule_end_date), 'h:mm a') : '-'}
                                                </p>
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
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <Button
                                            type="primary"
                                            loading={isProcessingReschedule}
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleRespondReschedule(true)}
                                        >
                                            Confirm Reschedule
                                        </Button>
                                        <Button
                                            danger
                                            loading={isProcessingReschedule}
                                            onClick={() => handleRespondReschedule(false)}
                                        >
                                            Decline Reschedule
                                        </Button>
                                    </div>
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
                                                {reservationDetails.venues.map((record) => {
                                                    const changedCandidate = hasActiveReschedule && (
                                                        (record.change_venue_name && record.change_venue_name.trim() !== '') ||
                                                        (!!record.change_venue_id && String(record.change_venue_id) !== String(record.venue_id))
                                                    );
                                                    const displayName = changedCandidate
                                                        ? ((record.change_venue_name && record.change_venue_name.trim()) || `ID ${record.change_venue_id}`)
                                                        : record.venue_name;
                                                    return (
                                                        <div key={record.reservation_venue_id || record.venue_id} className="p-3 border rounded-lg flex items-start justify-between">
                                                            <div className="flex items-start gap-2 min-w-0">
                                                                <BuildOutlined className="mt-0.5 text-purple-500" />
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-gray-800 break-words">{displayName}</p>
                                                                </div>
                                                            </div>
                                                            {showAvailability && (
                                                                <Tag className="shrink-0" color={checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'green' : 'red'}>
                                                                    {checkResourceAvailability('venue', record.venue_id, reservationDetails.availabilityData) ? 'Available' : 'Not Available'}
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
                                                    const assignedDriver = reservationDetails.drivers?.find(
                                                        (driver) => String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                                                    );
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
                                                    const availability = checkResourceAvailability('vehicle', availabilityVehicleId, reservationDetails.availabilityData);
                                                    return (
                                                        <div key={vehicle.reservation_vehicle_id || vehicle.vehicle_id} className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-blue-100 p-2 rounded-lg">
                                                                        <CarOutlined className="text-blue-600 text-lg" />
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-semibold text-gray-900 text-lg">{displayModel}</h5>
                                                                        <p className="text-gray-600 text-sm">{displayMake} • {displayYear}</p>
                                                                    </div>
                                                                </div>
                                                                {showAvailability && (
                                                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                        availability 
                                                                            ? 'bg-green-100 text-green-700' 
                                                                            : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                        {availability ? 'Available' : 'Not Available'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-500">Category:</span>
                                                                    <span className="text-sm text-gray-800 font-medium break-words">{displayCategory}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {assignedDriver && (
                                                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                                                    <UserOutlined className="text-gray-400" />
                                                                    <span className="text-sm text-gray-600">Driver: </span>
                                                                    <span className="text-sm font-medium text-gray-800">{assignedDriver.driver_name}</span>
                                                                </div>
                                                            )}
                                                            {!assignedDriver && (
                                                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                                                    <UserOutlined className="text-gray-300" />
                                                                    <span className="text-sm text-gray-400 italic">No driver assigned</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Equipment Conditions */}
                                    {reservationDetails.conditions?.equipment?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Equipment Conditions</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.conditions.equipment
                                                    .map((condition, index) => {
                                                        // Find matching equipment by reservation_equipment_id
                                                        const matchingEquipment = reservationDetails.equipment?.find(
                                                            eq => String(eq.reservation_equipment_id) === String(condition.reservation_equipment_id)
                                                        );
                                                        
                                                        return (
                                                            <div key={`equipment-condition-${condition.id || index}`} className="p-3 border rounded-lg">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <ToolOutlined className={`mt-0.5 ${
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'text-green-500' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'text-red-500' :
                                                                            condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'text-orange-500' :
                                                                            condition.condition_name?.toLowerCase() === 'minor issues' ? 'text-yellow-500' : 'text-blue-500'
                                                                        }`} />
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-gray-800 break-words">
                                                                                {matchingEquipment?.name || `Equipment ID: ${condition.reservation_equipment_id}`}
                                                                            </p>
                                                                            
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Condition:</span> {condition.condition_name}
                                                                            </p>
                                                                            
                                                                            {condition.qty_bad && condition.qty_bad !== "0" && (
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <span className="font-medium">Damaged Quantity:</span> {condition.qty_bad}
                                                                                </p>
                                                                            )}
                                                                            
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Personnel:</span> {condition.personnel_name}
                                                                            </p>
                                                                            
                                                                            {condition.remarks && (
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <span className="font-medium">Remarks:</span> {condition.remarks}
                                                                                </p>
                                                                            )}
                                                                            
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                Recorded on: {new Date(condition.created_at).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Tag 
                                                                        color={
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'green' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'red' :
                                                                            condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'orange' :
                                                                            condition.condition_name?.toLowerCase() === 'minor issues' ? 'yellow' : 'blue'
                                                                        }
                                                                        className="shrink-0"
                                                                    >
                                                                        {condition.condition_name}
                                                                    </Tag>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vehicle Conditions */}
                                    {reservationDetails.conditions?.vehicle?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Vehicle Conditions</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.conditions.vehicle
                                                    .map((condition, index) => {
                                                        // Find matching vehicle by reservation_vehicle_id
                                                        const matchingVehicle = reservationDetails.vehicles?.find(
                                                            vehicle => String(vehicle.reservation_vehicle_id) === String(condition.reservation_vehicle_id)
                                                        );
                                                        
                                                        return (
                                                            <div key={`vehicle-condition-${condition.id || index}`} className="p-3 border rounded-lg">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <CarOutlined className={`mt-0.5 ${
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'text-green-500' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'text-red-500' :
                                                                            condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'text-orange-500' :
                                                                            condition.condition_name?.toLowerCase() === 'minor issues' ? 'text-yellow-500' : 'text-blue-500'
                                                                        }`} />
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-gray-800 break-words">
                                                                                {matchingVehicle ? `${matchingVehicle.model} (${matchingVehicle.license})` : `Vehicle ID: ${condition.reservation_vehicle_id}`}
                                                                            </p>
                                                                            
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Condition:</span> {condition.condition_name}
                                                                            </p>
                                                                            
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Personnel:</span> {condition.personnel_name}
                                                                            </p>
                                                                            
                                                                            {condition.remarks && (
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <span className="font-medium">Remarks:</span> {condition.remarks}
                                                                                </p>
                                                                            )}
                                                                            
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                Recorded on: {new Date(condition.created_at).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Tag 
                                                                        color={
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'green' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'red' :
                                                                            condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'orange' :
                                                                            condition.condition_name?.toLowerCase() === 'minor issues' ? 'yellow' : 'blue'
                                                                        }
                                                                        className="shrink-0"
                                                                    >
                                                                        {condition.condition_name}
                                                                    </Tag>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Venue Conditions */}
                                    {reservationDetails.conditions?.venue?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Venue Conditions</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.conditions.venue
                                                    .map((condition, index) => {
                                                        // Find matching venue by reservation_venue_id
                                                        const matchingVenue = reservationDetails.venues?.find(
                                                            venue => String(venue.reservation_venue_id) === String(condition.reservation_venue_id)
                                                        );
                                                        
                                                        return (
                                                            <div key={`venue-condition-${condition.id || index}`} className="p-3 border rounded-lg">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <BuildOutlined className={`mt-0.5 ${
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'text-green-500' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'text-red-500' :
                                                                            condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'text-orange-500' :
                                                                            condition.condition_name?.toLowerCase() === 'minor issues' ? 'text-yellow-500' : 'text-blue-500'
                                                                        }`} />
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-gray-800 break-words">
                                                                                {matchingVenue?.venue_name || `Venue ID: ${condition.reservation_venue_id}`}
                                                                            </p>
                                                                            
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Condition:</span> {condition.condition_name}
                                                                            </p>
                                                                            
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Personnel:</span> {condition.personnel_name}
                                                                            </p>
                                                                            
                                                                            {condition.remarks && (
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <span className="font-medium">Remarks:</span> {condition.remarks}
                                                                                </p>
                                                                            )}
                                                                            
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                Recorded on: {new Date(condition.created_at).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Tag 
                                                                        color={
                                                                            condition.condition_name?.toLowerCase() === 'good condition' ? 'green' :
                                                                            condition.condition_name?.toLowerCase() === 'damaged' ? 'red' :
                                                                            condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'orange' :
                                                                            condition.condition_name?.toLowerCase() === 'minor issues' ? 'yellow' : 'blue'
                                                                        }
                                                                        className="shrink-0"
                                                                    >
                                                                        {condition.condition_name}
                                                                    </Tag>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Unit Conditions - Always display if available */}
                                    {reservationDetails.conditions?.unit?.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-medium mb-2 text-gray-800">Unit Conditions</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {reservationDetails.conditions.unit
                                                    .map((condition, index) => (
                                                        <div key={`unit-condition-${condition.id || index}`} className="p-3 border rounded-lg">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-2 min-w-0">
                                                                    <ToolOutlined className={`mt-0.5 ${
                                                                        condition.condition_name?.toLowerCase() === 'good condition' ? 'text-green-500' :
                                                                        condition.condition_name?.toLowerCase() === 'damaged' ? 'text-red-500' :
                                                                        condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'text-orange-500' :
                                                                        condition.condition_name?.toLowerCase() === 'minor issues' ? 'text-yellow-500' : 'text-blue-500'
                                                                    }`} />
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-gray-800 break-words">
                                                                            Unit ID: {condition.reservation_unit_id}
                                                                        </p>
                                                                        
                                                                        <p className="text-sm text-gray-600 mt-1">
                                                                            <span className="font-medium">Condition:</span> {condition.condition_name}
                                                                        </p>
                                                                        
                                                                        <p className="text-sm text-gray-600 mt-1">
                                                                            <span className="font-medium">Personnel:</span> {condition.personnel_name}
                                                                        </p>
                                                                        
                                                                        {condition.remarks && (
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Remarks:</span> {condition.remarks}
                                                                            </p>
                                                                        )}
                                                                        
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Recorded on: {new Date(condition.created_at).toLocaleString()}
                                                                        </p>
                                                                        
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Status: {condition.is_active === "1" ? "Active" : "Inactive"} (is_active: {condition.is_active})
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Tag 
                                                                    color={
                                                                        condition.condition_name?.toLowerCase() === 'good condition' ? 'green' :
                                                                        condition.condition_name?.toLowerCase() === 'damaged' ? 'red' :
                                                                        condition.condition_name?.toLowerCase() === 'needs maintenance' ? 'orange' :
                                                                        condition.condition_name?.toLowerCase() === 'minor issues' ? 'yellow' : 'blue'
                                                                    }
                                                                    className="shrink-0"
                                                                >
                                                                    {condition.condition_name}
                                                                </Tag>
                                                            </div>
                                                        </div>
                                                    ))}
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
                                        <div className="space-y-3 sm:space-y-4">
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
                                                        <div key={status.reservation_status_id || index} className="flex items-start">
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
                                                                        <Tag color={tagColor} className="shrink-0">{tagLabel}</Tag>
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
