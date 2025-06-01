    import React, { useEffect, useState, useCallback } from 'react';
    import { useNavigate } from 'react-router-dom';
    import Sidebar from './Sidebar';
    import {
    FaCar, FaUsers, FaBuilding, FaTools,  FaClock,  FaCalendar, FaArrowLeft, FaArrowRight
    } from 'react-icons/fa';
    import { motion } from 'framer-motion';
    import axios from 'axios';
    import { toast } from 'react-toastify';
    import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    DoughnutController,
    Title,
    Tooltip,
    Legend
    } from 'chart.js';

    import { SecureStorage } from '../utils/encryption';

    // Register ChartJS components
    ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    DoughnutController,
    Title,
    Tooltip,
    Legend
    );




    const Dashboard = () => {
        const navigate = useNavigate();
        const user_level = localStorage.getItem('user_level');
        const [loading, setLoading] = useState(true);
        const [fadeIn, setFadeIn] = useState(false);
        const [darkMode, setDarkMode] = useState(false); // Dark mode state
        const [totals, setTotals] = useState({
            reservations: 0,
            pending_requests: 0,
            vehicles: 0,
            venues: 0,
            equipments: 0,
            users: 0
        });
        const [setReservationStats] = useState({
            daily: [],
            weekly: [],
            monthly: []
        });
        const [setReleaseFacilities] = useState([]);
        const [setPersonnel] = useState([]);
        const [ongoingReservations, setOngoingReservations] = useState([]);
        const [completedReservations, setCompletedReservations] = useState([]);
        const [inUseFacilities, setInUseFacilities] = useState([]);
        const [venuesPage, setVenuesPage] = useState(1);
        const [vehiclesPage, setVehiclesPage] = useState(1);
        const [equipmentPage, setEquipmentPage] = useState(1);
        const itemsPerPage = 5;
        const [setReturnFacilities] = useState([]);

        const encryptedUrl = SecureStorage.getLocalItem("url");

        // Function to check if current time is within reservation period

        const fetchInUseFacilities = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/user.php`, {
                    operation: 'getInUse'
                });

                if (response.data && response.data.status === 'success') {
                    setInUseFacilities(response.data.data);
                } else {
                    console.error('Failed to fetch in-use facilities');
                }
            } catch (error) {
                console.error('Error fetching in-use facilities:', error);
            }
        }, [encryptedUrl]);






        // Read dark mode preference from localStorage
        useEffect(() => {
            const savedMode = localStorage.getItem('darkMode') === 'true';
            setDarkMode(savedMode);
        }, []);

        useEffect(() => {
            const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');
            const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
            const decryptedUserLevel = parseInt(encryptedUserLevel); 
            console.log('Decrypted User Level:', decryptedUserLevel);

            if (decryptedUserLevel !== 1 && decryptedUserLevel !== 4) { // Check for Super Admin (1) or specific role (4)
                localStorage.clear(); 
                navigate('/');
            } else {
                if (!hasLoadedBefore) {
                    const timeoutId = setTimeout(() => {
                        setLoading(false);
                        setFadeIn(true);
                        localStorage.setItem('hasLoadedDashboard', 'true');
                    }, 2000);

                    return () => clearTimeout(timeoutId);
                } else {
                    setLoading(false);
                    setFadeIn(true);
                }
            }
        }, [navigate]);

        useEffect(() => {
            if (!loading) {
                import('../dashboard.css'); 
            }
        }, [loading]);

        useEffect(() => {
            const fetchReservationStats = async () => {
                try {
                    const response = await axios.post(`${encryptedUrl}/user.php`, {
                        operation: 'getReservationStats'
                    });
                    if (response.data.status === 'success') {
                        setTotals(response.data.totals);
                        setReservationStats(response.data.stats);
                    }
                } catch (error) {
                    console.error('Error fetching reservation stats:', error);
                }
            };

            fetchReservationStats();
        }, [setReservationStats, encryptedUrl]);

        // Fix dark mode implementation after useEffect
        useEffect(() => {
            // Save dark mode preference to localStorage
            localStorage.setItem('darkMode', darkMode);
            // Apply dark mode class to body
            if (darkMode) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }, [darkMode]);



        const fetchReservations = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/user.php`, {
                    operation: 'fetchAllReservations',
                });

                if (response.data && response.data.status === 'success') {
                    // Filter and update ongoing reservations
                    const currentDate = new Date();
                    const ongoing = response.data.data.filter(reservation => {
                        const startDate = new Date(reservation.reservation_start_date);
                        const endDate = new Date(reservation.reservation_end_date);
                        return startDate <= currentDate && currentDate <= endDate && reservation.reservation_status === 'Reserved';
                    });
                    setOngoingReservations(ongoing);

                    // Filter and update completed reservations
                    const completed = response.data.data.filter(reservation => 
                        reservation.reservation_status === 'Completed'
                    );
                    setCompletedReservations(completed);
                } else {
                }
            } catch (error) {
                toast.error('Error fetching reservations.');
            }
        }, [encryptedUrl]);


        const fetchReleaseFacilities = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/fetch_reserve.php`, {
                    operation: 'fetchReleaseFacilities'
                });

                if (response.data && response.data.status === 'success') {
                    console.log('Release Facilities Data:', response.data.data);
                    setReleaseFacilities(response.data.data);
                } else {
                }
            } catch (error) {
                console.error('Fetch release facilities error:', error);
            }
        }, [setReleaseFacilities, encryptedUrl]);

        const fetchPersonnel = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/user.php`, 
                    new URLSearchParams({ operation: "fetchPersonnelActive" }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
                if (response.data.status === 'success') {
                    setPersonnel(response.data.data);
                } else {
                }
            } catch (error) {
                toast.error("An error occurred while fetching personnel.");
            }
        }, [setPersonnel, encryptedUrl]);

        const fetchReturnFacilities = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/fetch_reserve.php`, {
                    operation: 'fetchReturnFacilities'
                });

                if (response.data && response.data.status === 'success') {
                    console.log('Return Facilities Data:', response.data.data);
                    setReturnFacilities(response.data.data);
                } else {
                }
            } catch (error) {
                toast.error('An error occurred while fetching return facilities.');
                console.error('Fetch return facilities error:', error);
            }
        }, [setReturnFacilities, encryptedUrl]);

        const fetchTotals = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/get_totals.php`, {
                    operation: 'getTotals'
                });

                if (response.data.status === 'success') {
                    setTotals(response.data.data);
                } else {
                    toast.error('Error fetching dashboard statistics');
                }
            } catch (error) {
                console.error('Error fetching totals:', error);
                toast.error('Error fetching dashboard statistics');
            }
        }, [encryptedUrl]); 



        

        useEffect(() => {
            if (!loading) {

                fetchReservations();
                fetchReleaseFacilities();
                fetchPersonnel(); // Add this line
                fetchReturnFacilities();
                fetchTotals();

            }
        }, [loading, fetchReservations, fetchReleaseFacilities, fetchReturnFacilities,  fetchPersonnel, encryptedUrl, fetchTotals]);

        // Handle back navigation behavior
        useEffect(() => {
            const handlePopState = (event) => {
                if (user_level === '100') {
                    event.preventDefault();
                    navigate('/dashboard');
                }
            };

            window.addEventListener('popstate', handlePopState);
            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }, [navigate, user_level]);

    

        const containerVariants = {
            hidden: { opacity: 0 },
            visible: { 
                opacity: 1,
                transition: { 
                    when: "beforeChildren",
                    staggerChildren: 0.1,
                    duration: 0.5
                }
            }
        };

        const itemVariants = {
            hidden: { y: 20, opacity: 0 },
            visible: { 
                y: 0, 
                opacity: 1,
                transition: { type: 'spring', stiffness: 100 }
            }
        };

        const svgVariants = {
            hidden: { pathLength: 0, opacity: 0 },
            visible: { 
                pathLength: 1, 
                opacity: 1,
                transition: { duration: 2, ease: "easeInOut" }
            }
        };

        useEffect(() => {
            if (!loading) {
                fetchReservations();
                fetchReleaseFacilities();
                fetchPersonnel();
                fetchReturnFacilities();
                fetchTotals();

                fetchInUseFacilities(); // Add this line
            }
        }, [loading, fetchReservations, 
            fetchReleaseFacilities, fetchReturnFacilities, fetchPersonnel, fetchInUseFacilities, encryptedUrl, fetchTotals]);




        const getReservationStatusBadge = (startDate, endDate) => {
            const now = new Date();
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (now < start) {
                return (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Upcoming
                    </span>
                );
            } else if (now >= start && now <= end) {
                return (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Ongoing
                    </span>
                );
            }
            return null;
        };

        if (loading) {
            return (
                <div className="flex items-center justify-center h-screen bg-gray-100">
                    <motion.svg 
                        width="100" 
                        height="100" 
                        viewBox="0 0 100 100"
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="#10B981"
                            strokeWidth="10"
                            fill="none"
                            variants={svgVariants}
                        />
                        <motion.path
                            d="M25 50 L40 65 L75 30"
                            stroke="#10B981"
                            strokeWidth="10"
                            fill="none"
                            variants={svgVariants}
                        />
                    </motion.svg>
                </div>
            );
        }

        return (
            <motion.div 
                className={`dashboard-container flex min-h-screen bg-gradient-to-br from-green-100 to-white ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Sidebar />
                <div className="flex-1 mt-20">
                    <div className="h-full flex flex-col">
                        {/* Enhanced Header with Welcome Banner */}
                    

                        {/* Main Content with scrollable area */}
                        <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-white to-green-100">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Venues"
                                value={totals.venues}
                                icon={<FaBuilding />}
                                color="bg-gradient-to-r from-lime-900 to-green-900"
                            />
                            <StatCard
                                title="Equipment"
                                value={totals.equipments}
                                icon={<FaTools />}
                                color="bg-gradient-to-r from-lime-900 to-green-900"
                            />
                            <StatCard
                                title="Vehicles"
                                value={totals.vehicles}
                                icon={<FaCar />}
                                color="bg-gradient-to-r from-lime-900 to-green-900"
                            />
                                <StatCard
                                    title="Users"
                                    value={totals.users}
                                    icon={<FaUsers />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                />
                            </div>
                            {/* Top Row with Active Reservations only */}
                            <div className="grid grid-cols-1 gap-6">
                                {/* Active Reservations Section */}
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700"
                                >
                                    <div className="bg-gradient-to-r from-lime-900 to-green-900 p-4 flex justify-between items-center">
                                        <h2 className="text-white text-lg font-semibold flex items-center">
                                            <FaClock className="mr-2" /> Active Reservations
                                        </h2>
                                        <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                                            {ongoingReservations.length} Active
                                        </div>
                                    </div>
                                    <div className="p-4" style={{ maxHeight: 'none' }}>
                                        {ongoingReservations.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requestor</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Schedule</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                                                        {ongoingReservations.slice(0, 5).map((reservation, index) => (
                                                            <motion.tr 
                                                                key={index}
                                                                variants={itemVariants}
                                                                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{reservation.reservation_title}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.reservation_description}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.user_full_name}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.department_name}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm text-gray-500 dark:text-gray-300">
                                                                        {new Date(reservation.reservation_start_date).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: '2-digit',
                                                                            hour12: true
                                                                        })}
                                                                        <br />
                                                                        to
                                                                        <br />
                                                                        {new Date(reservation.reservation_end_date).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: '2-digit',
                                                                            hour12: true
                                                                        })}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {getReservationStatusBadge(
                                                                        reservation.reservation_start_date,
                                                                        reservation.reservation_end_date
                                                                    )}
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <FaCalendar className="mx-auto text-gray-300 dark:text-gray-600 text-5xl mb-4" />
                                                <p className="text-gray-500 dark:text-gray-400">No ongoing reservations at the moment</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Completed Reservations Section */}
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700"
                                >
                                    <div className="bg-gradient-to-r from-lime-900 to-green-900 p-4 flex justify-between items-center">
                                        <h2 className="text-white text-lg font-semibold flex items-center">
                                            <FaCalendar className="mr-2" /> Completed Reservations
                                        </h2>
                                        <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                                            {completedReservations.length} Completed
                                        </div>
                                    </div>
                                    <div className="p-4" style={{ maxHeight: 'none' }}>
                                        {completedReservations.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requestor</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Schedule</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                                                        {completedReservations.slice(0, 5).map((reservation, index) => (
                                                            <motion.tr 
                                                                key={index}
                                                                variants={itemVariants}
                                                                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{reservation.reservation_title}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.reservation_description}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.user_full_name}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.department_name}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm text-gray-500 dark:text-gray-300">
                                                                        {new Date(reservation.reservation_start_date).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: '2-digit',
                                                                            hour12: true
                                                                        })}
                                                                        <br />
                                                                        to
                                                                        <br />
                                                                        {new Date(reservation.reservation_end_date).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: '2-digit',
                                                                            hour12: true
                                                                        })}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                                                        Completed
                                                                    </span>
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <FaCalendar className="mx-auto text-gray-300 dark:text-gray-600 text-5xl mb-4" />
                                                <p className="text-gray-500 dark:text-gray-400">No completed reservations found</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* In Use Facility Lists */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible" 
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                            >
                                {/* Venues In Use */}
                                <motion.div variants={itemVariants} className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700">
                                    <div className="bg-gradient-to-r from-lime-900 to-green-900 p-4 flex justify-between items-center">
                                        <h2 className="text-white text-lg font-semibold flex items-center">
                                            <FaBuilding className="mr-2" /> Venues In Use
                                        </h2>
                                        <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                                            {inUseFacilities.filter(facility => facility.resource_type === 'venue').length} Active
                                        </div>
                                    </div>
                                    <div className="p-4 divide-y divide-gray-100 dark:divide-gray-700">
                                        {inUseFacilities
                                            .filter(facility => facility.resource_type === 'venue')
                                            .slice((venuesPage - 1) * itemsPerPage, venuesPage * itemsPerPage)
                                            .map((facility, index) => (
                                            <div key={index} className="py-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{facility.resource_name}</h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Currently in use by {facility.user_full_name}</p>
                                                    </div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        In Use
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Until {new Date(facility.reservation_end_date).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}</p>
                                            </div>
                                        ))}
                                        {inUseFacilities.filter(facility => facility.resource_type === 'venue').length === 0 && (
                                            <div className="text-center py-6">
                                                <FaBuilding className="mx-auto text-gray-300 dark:text-gray-600 text-4xl mb-2" />
                                                <p className="text-gray-500 dark:text-gray-400">No venues currently in use</p>
                                            </div>
                                        )}
                                        
                                        {/* Pagination for Venues */}
                                        {inUseFacilities.filter(facility => facility.resource_type === 'venue').length > itemsPerPage && (
                                            <div className="flex justify-center pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                                                <nav className="flex items-center space-x-1">
                                                    <button 
                                                        onClick={() => setVenuesPage(p => Math.max(1, p - 1))}
                                                        disabled={venuesPage === 1}
                                                        className={`px-3 py-1 rounded-md ${venuesPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`}
                                                    >
                                                        <FaArrowLeft className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        Page {venuesPage} of {Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'venue').length / itemsPerPage)}
                                                    </span>
                                                    <button 
                                                        onClick={() => setVenuesPage(p => p + 1)}
                                                        disabled={venuesPage >= Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'venue').length / itemsPerPage)}
                                                        className={`px-3 py-1 rounded-md ${venuesPage >= Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'venue').length / itemsPerPage) ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`}
                                                    >
                                                        <FaArrowRight className="w-4 h-4" />
                                                    </button>
                                                </nav>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Vehicles In Use */}
                                <motion.div variants={itemVariants} className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700">
                                    <div className="bg-gradient-to-r from-lime-900 to-green-900 p-4 flex justify-between items-center">
                                        <h2 className="text-white text-lg font-semibold flex items-center">
                                            <FaCar className="mr-2" /> Vehicles In Use
                                        </h2>
                                        <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                                            {inUseFacilities.filter(facility => facility.resource_type === 'vehicle').length} Active
                                        </div>
                                    </div>
                                    <div className="p-4 divide-y divide-gray-100 dark:divide-gray-700">
                                        {inUseFacilities
                                            .filter(facility => facility.resource_type === 'vehicle')
                                            .slice((vehiclesPage - 1) * itemsPerPage, vehiclesPage * itemsPerPage)
                                            .map((facility, index) => (
                                            <div key={index} className="py-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{facility.resource_name}</h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Driven by {facility.user_full_name}</p>
                                                    </div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        On Trip
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Expected return: {new Date(facility.reservation_end_date).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}</p>
                                            </div>
                                        ))}
                                        {inUseFacilities.filter(facility => facility.resource_type === 'vehicle').length === 0 && (
                                            <div className="text-center py-6">
                                                <FaCar className="mx-auto text-gray-300 dark:text-gray-600 text-4xl mb-2" />
                                                <p className="text-gray-500 dark:text-gray-400">No vehicles currently in use</p>
                                            </div>
                                        )}
                                        
                                        {/* Pagination for Vehicles */}
                                        {inUseFacilities.filter(facility => facility.resource_type === 'vehicle').length > itemsPerPage && (
                                            <div className="flex justify-center pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                                                <nav className="flex items-center space-x-1">
                                                    <button 
                                                        onClick={() => setVehiclesPage(p => Math.max(1, p - 1))}
                                                        disabled={vehiclesPage === 1}
                                                        className={`px-3 py-1 rounded-md ${vehiclesPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`}
                                                    >
                                                        <FaArrowLeft className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        Page {vehiclesPage} of {Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'vehicle').length / itemsPerPage)}
                                                    </span>
                                                    <button 
                                                        onClick={() => setVehiclesPage(p => p + 1)}
                                                        disabled={vehiclesPage >= Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'vehicle').length / itemsPerPage)}
                                                        className={`px-3 py-1 rounded-md ${vehiclesPage >= Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'vehicle').length / itemsPerPage) ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`}
                                                    >
                                                        <FaArrowRight className="w-4 h-4" />
                                                    </button>
                                                </nav>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Equipment In Use */}
                                <motion.div variants={itemVariants} className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700">
                                    <div className="bg-gradient-to-r from-lime-900 to-green-900 p-4 flex justify-between items-center">
                                        <h2 className="text-white text-lg font-semibold flex items-center">
                                            <FaTools className="mr-2" /> Equipment In Use
                                        </h2>
                                        <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                                            {inUseFacilities.filter(facility => facility.resource_type === 'equipment').length} Active
                                        </div>
                                    </div>
                                    <div className="p-4 divide-y divide-gray-100 dark:divide-gray-700">
                                        {inUseFacilities
                                            .filter(facility => facility.resource_type === 'equipment')
                                            .slice((equipmentPage - 1) * itemsPerPage, equipmentPage * itemsPerPage)
                                            .map((facility, index) => (
                                            <div key={index} className="py-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{facility.resource_name}</h3>
                                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-200">
                                                                Qty: {facility.quantity || 1}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Used by {facility.user_full_name}</p>
                                                    </div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        In Use
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Expected return: {new Date(facility.reservation_end_date).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}</p>
                                            </div>
                                        ))}
                                        {inUseFacilities.filter(facility => facility.resource_type === 'equipment').length === 0 && (
                                            <div className="text-center py-6">
                                                <FaTools className="mx-auto text-gray-300 dark:text-gray-600 text-4xl mb-2" />
                                                <p className="text-gray-500 dark:text-gray-400">No equipment currently in use</p>
                                            </div>
                                        )}
                                        
                                        {/* Pagination for Equipment */}
                                        {inUseFacilities.filter(facility => facility.resource_type === 'equipment').length > itemsPerPage && (
                                            <div className="flex justify-center pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                                                <nav className="flex items-center space-x-1">
                                                    <button 
                                                        onClick={() => setEquipmentPage(p => Math.max(1, p - 1))}
                                                        disabled={equipmentPage === 1}
                                                        className={`px-3 py-1 rounded-md ${equipmentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`}
                                                    >
                                                        <FaArrowLeft className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        Page {equipmentPage} of {Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'equipment').length / itemsPerPage)}
                                                    </span>
                                                    <button 
                                                        onClick={() => setEquipmentPage(p => p + 1)}
                                                        disabled={equipmentPage >= Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'equipment').length / itemsPerPage)}
                                                        className={`px-3 py-1 rounded-md ${equipmentPage >= Math.ceil(inUseFacilities.filter(facility => facility.resource_type === 'equipment').length / itemsPerPage) ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`}
                                                    >
                                                        <FaArrowRight className="w-4 h-4" />
                                                    </button>
                                                </nav>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </div>


            </motion.div>
        );
    };

    // Enhanced StatCard component
    const StatCard = ({ title, value, icon, color }) => (
        <motion.div
            className={`${color} text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-center justify-between">
                <div className="text-4xl">{icon}</div>
                <div className="text-3xl font-bold">{value}</div>
            </div>
            <div className="mt-3 text-sm font-medium opacity-90">{title}</div>
        </motion.div>
    );

    export default Dashboard;

