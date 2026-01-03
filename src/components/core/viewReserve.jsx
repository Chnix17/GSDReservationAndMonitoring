import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
// Removed FaEye import - using EyeOutlined instead
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';
import {  Input, Button, Tooltip,  Pagination, Empty, Dropdown, Menu, Card, Typography } from 'antd';
import { SecureStorage } from '../../utils/encryption';
import {  SearchOutlined, ReloadOutlined, FilterOutlined, EyeOutlined } from '@ant-design/icons';
import ReservationDetails from './my_reservation_details';
import { useMediaQuery } from 'react-responsive';

const { Text } = Typography;



const ViewReserve = () => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [reservations, setReservations] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const baseUrl = SecureStorage.getLocalItem("url");

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [reservationDetails, setReservationDetails] = useState(null);

    const [sortField, setSortField] = useState('title');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);



    const filterOptions = [
        { value: 'all', label: 'All Reservations' },
        { value: 'pending', label: 'Pending' },
        { value: 'reserve', label: 'Reserve' },
        { value: 'declined', label: 'Declined' },
        { value: 'completed', label: 'Completed' },
        { value: 'approved', label: 'Approved' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    // Table columns configuration

    // Update page size based on screen size
    useEffect(() => {
        if (isMobile) {
            setPageSize(5);
        } else if (isTablet) {
            setPageSize(8);
        } else {
            setPageSize(10);
        }
    }, [isMobile, isTablet]);

    useEffect(() => {
        const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 5 && decryptedUserLevel !== 6 && decryptedUserLevel !== 18 && decryptedUserLevel !== 17 && decryptedUserLevel !== 16 && decryptedUserLevel !== 20 && decryptedUserLevel !== 3) {
  
            navigate('/');
        }
  }, [navigate]);


    const confirmCancelReservation = async () => {
        try {
            const userId = SecureStorage.getLocalItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                navigate('/');
                return;
            }

            const response = await fetch(`${baseUrl}faculty&staff.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'handleCancelReservation',
                    reservation_id: reservationToCancel.id,
                    user_id: userId
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Update the local state
                setReservations(prevReservations =>
                    prevReservations.map(res =>
                        res.id === reservationToCancel.id
                            ? { ...res, status: 'cancelled' }
                            : res
                    )
                );
                toast.success(result.message || 'Reservation cancelled successfully!');
                setShowCancelModal(false);
                setReservationToCancel(null);
            } else {
                toast.error(result.message || 'Failed to cancel reservation');
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            toast.error('Failed to cancel reservation');
        }
    };

 

    const fetchReservations = useCallback(async () => {
        try {
            setLoading(true);
            const userId = SecureStorage.getLocalItem('user_id');
            console.log('Fetching reservations for user:', userId);
            
            if (!userId) {
                toast.error('User session expired');
                navigate('/');
                return;
            }

            const response = await fetch(`${baseUrl}faculty&staff.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'fetchMyReservation',
                    userId: userId
                })
            });

            const result = await response.json();
            console.log('API response:', result);
            
            if (result.status === 'success' && result.data) {
                const transformedReservations = result.data.map(reservation => {
                    // Format creation date and time
                    const createdAt = new Date(reservation.reservation_created_at);
                    const formattedCreatedAt = format(createdAt, 'MMM dd, yyyy h:mm a');

                    return {
                        id: reservation.reservation_id,
                        title: reservation.reservation_title,
                        description: reservation.reservation_description,
                        startDate: new Date(reservation.reservation_start_date),
                        endDate: new Date(reservation.reservation_end_date),
                        rescheduleStartDate: reservation.reschedule_start_date ? new Date(reservation.reschedule_start_date) : null,
                        rescheduleEndDate: reservation.reschedule_end_date ? new Date(reservation.reschedule_end_date) : null,
                        createdAt: formattedCreatedAt,
                        status: reservation.reservation_status_name || reservation.reservation_status || 'pending' // Use the correct status property
                    };
                });
                setReservations(transformedReservations);
            } else {
                throw new Error(result.message || 'Failed to fetch reservations');
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
            toast.error('Failed to fetch reservations');
        } finally {
            setLoading(false);
        }
    }, [navigate, baseUrl]);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        const isLoggedIn = localStorage.getItem('loggedIn');
        
        if (!userId || !isLoggedIn) {
            toast.error('Please login first');
            navigate('/'); // or wherever your login page is
            return;
        }
        
        console.log('User ID:', userId); // Debug log
        fetchReservations();
    }, [navigate, fetchReservations]);

    const filteredReservations = reservations.filter(reservation => 
        activeFilter === 'all' ? true : reservation.status === activeFilter
    );

    const handleViewReservation = async (reservation) => {
        try {
            setLoading(true);
            console.log("Starting to fetch details for reservation:", reservation);

            // Fetch reservation details (includes maintenance conditions)
            const detailsResponse = await fetch(`${baseUrl}reservation.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'fetchRequestById',
                    reservation_id: reservation.id
                })
            });

            const result = await detailsResponse.json();
            console.log("Details API Response:", result);

            if (result.status === 'success' && result.data) {
                // Fetch status history
                const statusResponse = await fetch(`${baseUrl}faculty&staff.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        operation: 'fetchStatusById',
                        reservationId: reservation.id
                    })
                });

                const statusResult = await statusResponse.json();
                console.log("Status API Response:", statusResult);

                const reservationData = {
                    ...result.data,
                    statusHistory: statusResult.status === 'success' ? statusResult.data : []
                };

                console.log("Setting reservation details:", reservationData);
                setReservationDetails(reservationData);
                setIsDetailModalOpen(true);
            } else {
                throw new Error(result.message || 'Failed to fetch reservation details');
            }
        } catch (error) {
            console.error('Error fetching reservation details:', error);
            toast.error('Failed to fetch reservation details');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleRefresh = () => {
        fetchReservations();
        setSearchTerm('');
    };

    // Get status color and styling
    const getStatusStyle = (status) => {
        const normalizedStatus = status.toLowerCase();
        
        switch (normalizedStatus) {
            case 'pending admin approval':
            case 'pending':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    border: 'border-yellow-200'
                };
            case 'decline':
            case 'declined':
            case 'admin declined':
            case 'department head declined':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    border: 'border-red-200'
                };
            case 'approved':
            case 'admin approved':
            case 'department head approved':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    border: 'border-green-200'
                };
            case 'completed':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-800',
                    border: 'border-blue-200'
                };
            case 'cancelled':
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    border: 'border-gray-200'
                };
            case 'reserved':
                return {
                    bg: 'bg-purple-100',
                    text: 'text-purple-800',
                    border: 'border-purple-200'
                };
            case 'pending department approval':
                return {
                    bg: 'bg-orange-100',
                    text: 'text-orange-800',
                    border: 'border-orange-200'
                };
            case 'reschedule':
            case 'reschedule confirmed':
                return {
                    bg: 'bg-indigo-100',
                    text: 'text-indigo-800',
                    border: 'border-indigo-200'
                };
            case 'change request':
                return {
                    bg: 'bg-cyan-100',
                    text: 'text-cyan-800',
                    border: 'border-cyan-200'
                };
            case 'processed':
                return {
                    bg: 'bg-teal-100',
                    text: 'text-teal-800',
                    border: 'border-teal-200'
                };
            case 'on going':
            case 'ongoing':
                return {
                    bg: 'bg-lime-100',
                    text: 'text-lime-800',
                    border: 'border-lime-200'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    border: 'border-gray-200'
                };
        }
    };

    // Compact, readable date range (single line)
    const formatDateRange = (reservation) => {
        // Use reschedule dates if status is "Reschedule Confirmed" and reschedule dates exist
        const isRescheduleConfirmed = reservation.status === 'Reschedule Confirmed';
        const start = isRescheduleConfirmed && reservation.rescheduleStartDate ? reservation.rescheduleStartDate : reservation.startDate;
        const end = isRescheduleConfirmed && reservation.rescheduleEndDate ? reservation.rescheduleEndDate : reservation.endDate;
        
        if (!start || !end) return '-';
        try {
            const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
            if (sameDay) {
                return `${format(start, 'MMM dd, yyyy h:mm a')} – ${format(end, 'h:mm a')}`;
            }
            return `${format(start, 'MMM dd, yyyy h:mm a')} – ${format(end, 'MMM dd, yyyy h:mm a')}`;
        } catch (e) {
            return '-';
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            {/* Fixed Sidebar */}
            <div className="flex-shrink-0">
                <Sidebar />
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto">
                <div className={`${isMobile ? 'px-4 py-4 mt-5' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`${isMobile ? 'mb-3' : 'mb-4'}`}
                    >
                        <div className="mb-2 sm:mb-4 mt-10">
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                My Reservation Request
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Input
                                    placeholder={isMobile ? "Search reservations..." : "Search by title, status, or date"}
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                                <Dropdown
                                    overlay={
                                        <Menu
                                            onClick={({ key }) => setActiveFilter(key)}
                                            selectedKeys={[activeFilter]}
                                        >
                                            {filterOptions.map(option => (
                                                <Menu.Item key={option.value} style={option.value === activeFilter ? { fontWeight: 'bold', background: '#e6f7ff' } : {}}>
                                                    {option.label}
                                                </Menu.Item>
                                            ))}
                                        </Menu>
                                    }
                                    trigger={["click"]}
                                    placement="bottomRight"
                                >
                                    <Button
                                        icon={<FilterOutlined />}
                                        size={isMobile ? "middle" : "large"}
                                    />
                                </Dropdown>
                                <Tooltip title="Refresh data">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        size={isMobile ? "middle" : "large"}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Responsive Table / Cards */}
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                {isMobile ? (
                                    // Mobile Card View
                                    <div className="p-3">
                                        {filteredReservations && filteredReservations.length > 0 ? (
                                            filteredReservations
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((reservation) => {
                                                    const statusStyle = getStatusStyle(reservation.status);
                                                    return (
                                                        <Card
                                                            key={reservation.id}
                                                            className="mb-3 shadow-sm"
                                                            size="small"
                                                        >
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center min-w-0">
                                                                        <EyeOutlined className="mr-2 text-green-900 flex-shrink-0" />
                                                                        <Text strong className="text-sm truncate">{reservation.title}</Text>
                                                                    </div>
                                                                    <div className="flex gap-1 flex-shrink-0">
                                                                        <Button
                                                                            icon={<EyeOutlined />}
                                                                            onClick={() => handleViewReservation(reservation)}
                                                                            size="small"
                                                                            type="primary"
                                                                            className="bg-green-600 hover:bg-green-700 border-green-600"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary" className="text-xs">Created:</Text>
                                                                    <div className="text-xs text-gray-600">{reservation.createdAt}</div>
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary" className="text-xs">Date & Time:</Text>
                                                                    <div className="text-xs text-gray-600">{formatDateRange(reservation)}</div>
                                                                </div>
                                                                <div className="flex justify-end items-center">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    );
                                                })
                                        ) : (
                                            <div className="text-center py-12">
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description={
                                                        <span className="text-gray-500">
                                                            No reservations found
                                                        </span>
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Desktop/Tablet Table View
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                                            <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                                                <tr>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('title')}>
                                                        <div className="flex items-center">
                                                            TITLE
                                                            {sortField === 'title' && (
                                                                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4 cursor-pointer" onClick={() => handleSort('createdAt')}>
                                                            <div className="flex items-center">
                                                                CREATED AT
                                                                {sortField === 'createdAt' && (
                                                                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                                )}
                                                            </div>
                                                        </th>
                                                    )}
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('startDate')}>
                                                        <div className="flex items-center">
                                                            DATE RANGE
                                                            {sortField === 'startDate' && (
                                                                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>STATUS</th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>ACTIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredReservations && filteredReservations.length > 0 ? (
                                                    filteredReservations
                                                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                        .map((reservation) => (
                                                            <tr key={reservation.id} className="bg-white border-b last:border-b-0 border-gray-200">
                                                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'} font-semibold`}>
                                                                    <span className="truncate block max-w-[200px]">{reservation.title}</span>
                                                                </td>
                                                                {!isTablet && (
                                                                    <td className="px-4 py-5 whitespace-nowrap">{reservation.createdAt}</td>
                                                                )}
                                                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'} whitespace-nowrap`}>{formatDateRange(reservation)}</td>
                                                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'}`}>
                                                                    {(() => {
                                                                        const statusStyle = getStatusStyle(reservation.status);
                                                                        return (
                                                                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'}`}>
                                                                    <div className="flex justify-center">
                                                                        <Tooltip title="View Details">
                                                                            <Button
                                                                                shape="circle"
                                                                                icon={<EyeOutlined />}
                                                                                onClick={() => handleViewReservation(reservation)}
                                                                                size={isTablet ? "middle" : "large"}
                                                                                className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                                                            />
                                                                        </Tooltip>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={isTablet ? 4 : 5} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                                            <Empty
                                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                description={<span className="text-gray-500 dark:text-gray-400">No reservations found</span>}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredReservations ? filteredReservations.length : 0}
                                        onChange={(page, size) => {
                                            setCurrentPage(page);
                                            setPageSize(size);
                                        }}
                                        showSizeChanger={!isMobile}
                                        showTotal={!isMobile ? (total, range) =>
                                            `${range[0]}-${range[1]} of ${total} items` : false
                                        }
                                        size={isMobile ? "small" : "default"}
                                        className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                                        simple={isMobile}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && reservationDetails && (
                <ReservationDetails 
                    visible={isDetailModalOpen}
                    onClose={() => {
                        console.log("Closing modal");
                        setIsDetailModalOpen(false);
                        setReservationDetails(null);
                    }}
                    reservationDetails={reservationDetails}
                    onRefresh={fetchReservations}
                />
            )}

            {/* Cancel Reservation Modal */}
            {showCancelModal && reservationToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-2xl p-8 w-full max-w-md transform transition-all duration-300 ease-in-out"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Confirm Cancellation</h2>
                            <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <p>Are you sure you want to cancel the reservation "{reservationToCancel.name}"?</p>
                        <div className="flex justify-end mt-6 gap-4">
                            <button 
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                onClick={() => setShowCancelModal(false)}
                            >
                                No, Keep Reservation
                            </button>
                            <button 
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                onClick={confirmCancelReservation}
                            >
                                Yes, Cancel Reservation
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};



export default ViewReserve;
