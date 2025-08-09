import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
    FaEye,
} from 'react-icons/fa';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './component/user_sidebar';
import {  Input, Button, Tooltip,  Pagination, Empty, Dropdown, Menu } from 'antd';
import { SecureStorage } from '../utils/encryption';
import {  SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import ReservationDetails from './component/reservation_details';



const ViewReserve = () => {
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

    const [sortField, setSortField] = useState('id');
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

 
    useEffect(() => {
        const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 3 && decryptedUserLevel !== 15 && decryptedUserLevel !== 16 && decryptedUserLevel !== 17) {
            localStorage.clear();
            navigate('/gsd');
        }
  }, [navigate]);



    const confirmCancelReservation = async () => {
        try {
            const userId = SecureStorage.getLocalItem('user_id');
            if (!userId) {
                toast.error('User session expired');
                navigate('/gsd');
                return;
            }

            const response = await fetch(`${baseUrl}process_reservation.php`, {
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
                navigate('/gsd');
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
                        participants: reservation.reservation_participants,
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
            navigate('/gsd'); // or wherever your login page is
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

            // Fetch reservation details
            const detailsResponse = await fetch(`${baseUrl}user.php`, {
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

                // Fetch maintenance resources
                const maintenanceResponse = await fetch(`${baseUrl}faculty&staff.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        operation: 'displayedMaintenanceResources',
                        reservationId: reservation.id
                    })
                });

                const maintenanceResult = await maintenanceResponse.json();
                console.log("Maintenance API Response:", maintenanceResult);

                const reservationData = {
                    ...result.data,
                    statusHistory: statusResult.status === 'success' ? statusResult.data : [],
                    maintenanceResources: maintenanceResult.status === 'success' ? maintenanceResult.data : []
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

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <div className="flex-none">
                <Sidebar />
            </div>
            <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-20">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 sm:mb-8"
                    >
                        <div className="mb-2 sm:mb-4 mt-20">
    
                            
                        </div>
                    </motion.div>

                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-row items-center gap-2 w-full">
                            <div className="flex-grow">
                                <Input
                                    placeholder="Search reservations..."
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size="large"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
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
                                    size="large"
                                    style={{ background: 'white', border: '1px solid #d9d9d9', borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}
                                />
                            </Dropdown>
                            <div>
                                <Tooltip title="Refresh data">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        size="large"
                                        style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                                    <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                                        <tr>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('title')}>
                                                <div className="flex items-center cursor-pointer">
                                                    TITLE
                                                    {sortField === 'title' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('createdAt')}>
                                                <div className="flex items-center cursor-pointer">
                                                    CREATED AT
                                                    {sortField === 'createdAt' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('startDate')}>
                                                <div className="flex items-center cursor-pointer">
                                                    START DATE
                                                    {sortField === 'startDate' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('endDate')}>
                                                <div className="flex items-center cursor-pointer">
                                                    END DATE
                                                    {sortField === 'endDate' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    PARTICIPANTS
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    STATUS
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    ACTIONS
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReservations && filteredReservations.length > 0 ? (
                                            filteredReservations
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((reservation) => (
                                                    <tr
                                                        key={reservation.id}
                                                        className="bg-white border-b last:border-b-0 border-gray-200"
                                                    >
                                                        <td className="px-4 py-6 font-bold">
                                                            <span className="truncate block max-w-[140px]">{reservation.title}</span>
                                                        </td>
                                                        <td className="px-4 py-6">{reservation.createdAt}</td>
                                                        <td className="px-4 py-6">{format(new Date(reservation.startDate), 'MMM dd, yyyy h:mm a')}</td>
                                                        <td className="px-4 py-6">{format(new Date(reservation.endDate), 'MMM dd, yyyy h:mm a')}</td>
                                                        <td className="px-4 py-6">{reservation.participants || 'Not specified'}</td>
                                                        <td className="px-4 py-6">
                                                            <span className="inline-flex items-center px-6 py-2 rounded-full text-base font-semibold bg-gray-100 text-gray-600">
                                                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <div className="flex justify-center">
                                                                <Tooltip title="View Details">
                                                                    <Button
                                                                        shape="circle"
                                                                        icon={<FaEye />}
                                                                        onClick={() => handleViewReservation(reservation)}
                                                                        size="large"
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
                                                                    />
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No reservations found
                                                            </span>
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredReservations ? filteredReservations.length : 0}
                                        onChange={(page, size) => {
                                            setCurrentPage(page);
                                            setPageSize(size);
                                        }}
                                        showSizeChanger={true}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} of ${total} items`
                                        }
                                        className="flex justify-end"
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
