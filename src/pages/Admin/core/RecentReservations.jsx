import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaList, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReservationDetails from '../../../components/core/reservation_details';
import { SecureStorage } from '../../../utils/encryption';

// Helper function for status badges
const getReservationStatusBadge = (status) => {
    switch(status) {
        case 'Pending':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Pending
                </span>
            );
        case 'Approved':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Approved
                </span>
            );
        case 'Rejected':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Rejected
                </span>
            );
        case 'Reserved':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Reserve
                </span>
            );
        case 'Cancelled':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    Cancelled
                </span>
            );
        case 'Completed':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Completed
                </span>
            );
        default:
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    {status}
                </span>
            );
    }
};

const RecentReservations = ({ reservations, currentPage, setCurrentPage, itemsPerPage }) => {
    const [filteredReservations, setFilteredReservations] = useState([]);
    const [dateFilter, setDateFilter] = useState('7days');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const encryptedUrl = SecureStorage.getLocalItem("url");

    useEffect(() => {
        const now = new Date();
        const filterDate = new Date();
        
        switch(dateFilter) {
            case '1day':
                filterDate.setDate(now.getDate() - 1);
                break;
            case '3days':
                filterDate.setDate(now.getDate() - 3);
                break;
            case '7days':
                filterDate.setDate(now.getDate() - 7);
                break;
            default:
                filterDate.setDate(now.getDate() - 7);
        }

        // Display all reservations without filtering
        setFilteredReservations(reservations);
    }, [reservations, dateFilter]);

    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReservations = filteredReservations.slice(startIndex, endIndex);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDuration = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end - start;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHrs}h ${diffMins}m`;
    };

    const handleViewReservation = async (reservationId) => {
        try {
            const response = await axios.post(`${encryptedUrl}/process_reservation.php`, {
                operation: 'fetchRequestById',
                reservation_id: reservationId
            });

            if (response.data && response.data.status === 'success') {
                setSelectedReservation(response.data.data);
                setIsModalVisible(true);
            } else {
                toast.error('Failed to fetch reservation details');
            }
        } catch (error) {
            console.error('Error fetching reservation details:', error);
            toast.error('Error fetching reservation details');
        }
    };

    return (
        <div className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700">
            <div className="bg-gradient-to-r from-lime-900 to-green-900 p-3 md:p-4 flex justify-between items-center">
                <h2 className="text-white text-base md:text-lg font-semibold flex items-center">
                    <FaList className="mr-2 text-sm md:text-base" /> Recent Reservation Requests
                </h2>
                <div className="flex items-center space-x-2">
                    <select 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white border-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer hover:bg-white/40"
                        style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none'
                        }}
                    >
                        <option value="1day" className="bg-lime-900 text-white">Last 24 Hours</option>
                        <option value="3days" className="bg-lime-900 text-white">Last 3 Days</option>
                        <option value="7days" className="bg-lime-900 text-white">Last 7 Days</option>
                    </select>
                    <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                        {currentReservations.length} Requests
                    </div>
                </div>
            </div>
            <div className="p-3 md:p-4">
                <div className="overflow-x-auto -mx-3 md:-mx-4">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Title</th>
                                        <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Requestor</th>
                                        <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Schedule</th>
                                        <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/50 divide-y divide-gray-200">
                                    {currentReservations.map((reservation, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors duration-150">
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="font-medium">{reservation.reservation_title}</div>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="font-medium">{reservation.user_full_name}</div>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="space-y-0.5">
                                                    <div className="font-medium">{formatDate(reservation.reservation_start_date)} - {formatDate(reservation.reservation_end_date)}</div>
                                                    <div className="text-xs text-gray-500">Duration: {calculateDuration(reservation.reservation_start_date, reservation.reservation_end_date)}</div>
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                {getReservationStatusBadge(reservation.reservation_status_name)}
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                                                <button
                                                    onClick={() => handleViewReservation(reservation.reservation_id)}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-lime-700 bg-lime-100 hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
                                                >
                                                    <FaEye className="mr-1" /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-6 py-3 bg-white/50 border-t border-gray-200">
                        <div className="flex items-center">
                            <span className="text-sm text-gray-700">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredReservations.length)} of {filteredReservations.length} entries
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md ${
                                    currentPage === 1 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-lime-50 text-lime-600 hover:bg-lime-100'
                                }`}
                            >
                                <FaArrowLeft className="inline-block mr-1" />
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded-md ${
                                    currentPage === totalPages 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-lime-50 text-lime-600 hover:bg-lime-100'
                                }`}
                            >
                                Next
                                <FaArrowRight className="inline-block ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add ReservationDetails Modal */}
            <ReservationDetails
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                reservationDetails={selectedReservation}
            />
        </div>
    );
};

export default RecentReservations; 