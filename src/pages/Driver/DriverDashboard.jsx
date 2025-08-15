import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/core/Sidebar';
import axios from 'axios';
import { SecureStorage } from '../../utils/encryption';
import { FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';

// Helper to format date
const formatDateTime = (dateString) => {
    const date = new Date(dateString.replace(' ', 'T'));
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const getStatus = (start, end) => {
    // Get current time in Asia/Manila
    const now = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
    );
    const startDate = new Date(start.replace(' ', 'T'));
    const endDate = new Date(end.replace(' ', 'T'));
    if (now < startDate) return 'Upcoming';
    if (now >= startDate && now <= endDate) return 'Ongoing';
    return 'Ended';
};

const DriverDashboard = () => {
    const [trips, setTrips] = useState([]);
    const encryptedUrl = SecureStorage.getLocalItem('url');
    const driverId = SecureStorage.getSessionItem('user_id');

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/driver.php`, {
                    operation: 'fetchActiveTrips',
                    driver_id: driverId,
                });
                if (response.data.status === 'success') {
                    setTrips(response.data.data);
                }
            } catch (error) {
                setTrips([]);
            }
        };
        fetchTrips();
    }, [encryptedUrl, driverId]);

    // Pagination (optional, for future)
    // const [page, setPage] = useState(1);
    // const pageSize = 3;
    // const paginatedTrips = trips.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-white to-green-100 transition-all duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-auto mt-20 p-8">
                <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
                   
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 flex-1 flex flex-col"
                    >
                        <div className="bg-gradient-to-r from-lime-900 to-green-900 p-4 flex justify-between items-center rounded-t-xl">
                            <h2 className="text-white text-lg font-semibold flex items-center">
                                <FiCalendar className="mr-2" /> Active Trips
                            </h2>
                            <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                                {trips.length} Active
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="space-y-4 flex-1" style={{ minHeight: '320px', maxHeight: '420px', overflowY: 'auto' }}>
                                {trips.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 bg-white/50 rounded-xl">
                                        <FiCalendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p>No active trips found</p>
                                    </div>
                                ) : (
                                    trips.map(trip => {
                                        const status = getStatus(trip.reservation_start_date, trip.reservation_end_date);
                                        return (
                                            <motion.div
                                                key={trip.reservation_id}
                                                className="p-4 bg-white/50 border border-gray-100 rounded-xl hover:border-green-200 transition-colors"
                                                whileHover={{ scale: 1.02 }}
                                                style={{ minHeight: '120px' }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800">{trip.reservation_title}</h3>
                                                        <p className="text-gray-500 text-sm mt-1">{trip.reservation_description}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        status === 'Ongoing'
                                                            ? 'bg-green-100 text-green-800'
                                                            : status === 'Upcoming'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center mt-3 text-sm text-gray-500 space-x-4">
                                                    <div className="flex items-center">
                                                        <FiCalendar className="w-4 h-4 mr-2" />
                                                        {formatDateTime(trip.reservation_start_date)} to {formatDateTime(trip.reservation_end_date)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                                    <div><b>Vehicle:</b> {trip.vehicle_make_name} {trip.vehicle_model_name} ({trip.vehicle_category_name})</div>
                                                    <div><b>License:</b> {trip.vehicle_license}</div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;
