import React from 'react';
import { FaArrowLeft, FaArrowRight, FaList } from 'react-icons/fa';

// Helper function for status badges
const getReservationStatusBadge = (status, startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // First check the explicit status
    switch(status) {
        case 'Pending':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Pending
                </span>
            );
        case 'Approved':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Approved
                </span>
            );
        case 'Rejected':
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Rejected
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
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Completed
                </span>
            );
    }

    // If no explicit status, check the date-based status
    if (now < start) {
        return (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Upcoming
            </span>
        );
    } else if (now >= start && now <= end) {
        return (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                Ongoing
            </span>
        );
    } else if (now > end) {
        return (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                Expired
            </span>
        );
    }

    return null;
};

const RecentReservations = ({ reservations, currentPage, setCurrentPage, itemsPerPage }) => {
    const totalPages = Math.ceil(reservations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReservations = reservations.slice(startIndex, endIndex);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700">
            <div className="bg-gradient-to-r from-lime-900 to-green-900 p-3 md:p-4 flex justify-between items-center">
                <h2 className="text-white text-base md:text-lg font-semibold flex items-center">
                    <FaList className="mr-2 text-sm md:text-base" /> Recent Reservation Requests
                </h2>
                <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                    {currentReservations.length} Requests
                </div>
            </div>
            <div className="p-3 md:p-4">
                <div className="overflow-x-auto -mx-3 md:-mx-4">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Requestor</th>
                                        <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Facility</th>
                                        <th scope="col" className="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Start Date</th>
                                        <th scope="col" className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">End Date</th>
                                        <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/50 divide-y divide-gray-200">
                                    {currentReservations.map((reservation, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors duration-150">
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="font-medium">{reservation.requestor_name}</div>
                                                <div className="sm:hidden text-xs text-gray-500 mt-1">
                                                    {formatDate(reservation.reservation_start_date)}
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                                                {reservation.facility_name}
                                            </td>
                                            <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(reservation.reservation_start_date)}
                                            </td>
                                            <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(reservation.reservation_end_date)}
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                {getReservationStatusBadge(
                                                    reservation.reservation_status,
                                                    reservation.reservation_start_date,
                                                    reservation.reservation_end_date
                                                )}
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
                                Showing {startIndex + 1} to {Math.min(endIndex, reservations.length)} of {reservations.length} entries
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
        </div>
    );
};

export default RecentReservations; 