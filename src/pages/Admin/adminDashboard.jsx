import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/core/Sidebar';
import {
    FaCar, FaUsers, FaBuilding, FaTools, FaExclamationTriangle, FaWifi
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
    LineController,
    BarController,
    DoughnutController,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import ReservationChart from './core/ReservationChart';

import ViewReservationRequest from './core/viewReservationRequest';

import { SecureStorage } from '../../utils/encryption';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    LineController,
    BarController,
    DoughnutController,
    Title,
    Tooltip,
    Legend,
    Filler
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
        const [isOnline, setIsOnline] = useState(true);
        const [showOfflineAlert, setShowOfflineAlert] = useState(false);
        const [retryCount, setRetryCount] = useState(0);
        const [setReservationStats] = useState({
            daily: [],
            weekly: [],
            monthly: []
        });
        
        const [setPersonnel] = useState([]);
        const encryptedUrl = SecureStorage.getLocalItem("url");

        useEffect(() => {
            const savedMode = localStorage.getItem('darkMode') === 'true';
            setDarkMode(savedMode);
        }, []);

        useEffect(() => {
            const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');
            const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
            const decryptedUserLevel = parseInt(encryptedUserLevel); 
            console.log('Decrypted User Level:', decryptedUserLevel);

            if (decryptedUserLevel !== 1 && decryptedUserLevel !== 4) { 
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
                import('../../dashboard.css'); 
            }
        }, [loading]);

        useEffect(() => {
            const fetchReservationStats = async () => {
                try {
                    const response = await axios.post(`${encryptedUrl}/Admin.php`, {
                        operation: 'getReservationStats'
                    });
                    if (response.data.status === 'success') {
                        setTotals(response.data.totals);
                        setReservationStats(response.data.stats);
                        // Reset offline state on successful connection
                        if (!isOnline) {
                            setIsOnline(true);
                            setShowOfflineAlert(false);
                            setRetryCount(0);
                            toast.success('Connection restored!');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching reservation stats:', error);
                    // Check if it's a network error
                    if (error.message === 'Network Error' || !error.response) {
                        setIsOnline(false);
                        setShowOfflineAlert(true);
                    }
                }
            };

            fetchReservationStats();
        }, [setReservationStats, encryptedUrl, isOnline]);

        useEffect(() => {
            localStorage.setItem('darkMode', darkMode);
            if (darkMode) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }, [darkMode]);


  

        const fetchPersonnel = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/Admin.php`, 
                    new URLSearchParams({ operation: "fetchPersonnelActive" }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
                if (response.data.status === 'success') {
                    setPersonnel(response.data.data);
                    // Reset offline state on successful connection
                    if (!isOnline) {
                        setIsOnline(true);
                        setShowOfflineAlert(false);
                        setRetryCount(0);
                        toast.success('Connection restored!');
                    }
                } else {
                }
            } catch (error) {
                console.error('Error fetching personnel:', error);
                // Check if it's a network error
                if (error.message === 'Network Error' || !error.response) {
                    setIsOnline(false);
                    setShowOfflineAlert(true);
                } else {
                    toast.error("An error occurred while fetching personnel.");
                }
            }
        }, [setPersonnel, encryptedUrl, isOnline]);

        const fetchTotals = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/Admin.php`, {
                    operation: 'getTotals'
                });

                if (response.data.status === 'success') {
                    setTotals(response.data.data);
                    // Reset offline state on successful connection
                    if (!isOnline) {
                        setIsOnline(true);
                        setShowOfflineAlert(false);
                        setRetryCount(0);
                        toast.success('Connection restored!');
                    }
                } else {
                    toast.error('Error fetching dashboard statistics');
                }
            } catch (error) {
                console.error('Error fetching totals:', error);
                // Check if it's a network error
                if (error.message === 'Network Error' || !error.response) {
                    setIsOnline(false);
                    setShowOfflineAlert(true);
                } else {
                    toast.error('Error fetching dashboard statistics');
                }
            }
        }, [encryptedUrl, isOnline]); 



        

        useEffect(() => {
            if (!loading) {
                fetchPersonnel(); // Add this line
                fetchTotals();
            }
        }, [loading, fetchPersonnel, encryptedUrl, fetchTotals]);

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

        // Network connectivity monitoring
        useEffect(() => {
            const handleOnline = () => {
                setIsOnline(true);
                setShowOfflineAlert(false);
                setRetryCount(0);
                toast.success('Connection restored!');
                // Retry fetching data
                fetchTotals();
                fetchPersonnel();
            };

            const handleOffline = () => {
                setIsOnline(false);
                setShowOfflineAlert(true);
                toast.error('Network connection lost!');
            };

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }, [fetchTotals, fetchPersonnel]);

        // Auto-retry mechanism when offline
        useEffect(() => {
            if (!isOnline && retryCount < 5) {
                const retryTimer = setTimeout(() => {
                    console.log(`Attempting to reconnect... (Attempt ${retryCount + 1}/5)`);
                    setRetryCount(prev => prev + 1);
                    fetchTotals();
                    fetchPersonnel();
                }, 10000); // Retry every 10 seconds

                return () => clearTimeout(retryTimer);
            }
        }, [isOnline, retryCount, fetchTotals, fetchPersonnel]);

    

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


        const svgVariants = {
            hidden: { pathLength: 0, opacity: 0 },
            visible: { 
                pathLength: 1, 
                opacity: 1,
                transition: { duration: 2, ease: "easeInOut" }
            }
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
                className={`${!darkMode ? 'force-light' : ''} flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex-shrink-0">
                    <Sidebar />
                </div>
                <div className="flex-1 overflow-auto">
                    <div className="h-full flex flex-col max-w-[1600px] mx-auto mt-20">
                        {/* Network Connection Alert */}
                        {showOfflineAlert && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mx-4 md:mx-6 lg:mx-8 mb-4 bg-red-500 text-white rounded-lg shadow-lg overflow-hidden"
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <FaExclamationTriangle className="text-2xl animate-pulse" />
                                        <div>
                                            <h3 className="font-bold text-lg">Network Connection Lost</h3>
                                            <p className="text-sm opacity-90">
                                                Unable to reach the server. Please check your internet connection.
                                                {retryCount > 0 && retryCount < 5 && (
                                                    <span className="ml-2">Retrying... ({retryCount}/5)</span>
                                                )}
                                                {retryCount >= 5 && (
                                                    <span className="ml-2">Max retry attempts reached.</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <FaWifi className="text-3xl opacity-50" />
                                </div>
                                <div className="bg-red-600 h-1">
                                    <motion.div
                                        className="bg-white h-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{
                                            duration: 10,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                        <div className="flex-1 py-6 space-y-6 px-4 md:px-6 lg:px-8">
                            {/* Stats Grid - Improved responsiveness */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                <StatCard
                                    title="Venues"
                                    value={totals.venues}
                                    icon={<FaBuilding className="text-xl md:text-3xl" />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                    onClick={() => navigate('/Admin/Venue')}
                                />
                                <StatCard
                                    title="Equipment"
                                    value={totals.equipments}
                                    icon={<FaTools className="text-xl md:text-3xl" />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                    onClick={() => navigate('/Admin/Equipment')}
                                />
                                <StatCard
                                    title="Vehicles"
                                    value={totals.vehicles}
                                    icon={<FaCar className="text-xl md:text-3xl" />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                    onClick={() => navigate('/Admin/VehicleEntry')}
                                />
                                <StatCard
                                    title="Users"
                                    value={totals.users}
                                    icon={<FaUsers className="text-xl md:text-3xl" />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                    onClick={() => navigate('/Admin/Faculty')}
                                />
                            </div>

                            {/* Reservation Trends Chart - Full width */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="w-full"
                            >
                                <ReservationChart />
                            </motion.div>

                            {/* Reservation Requests - Full width */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="w-full mt-6"
                            >
                                <ViewReservationRequest />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    // Enhanced StatCard component with better responsiveness and navigation
    const StatCard = ({ title, value, icon, color, onClick }) => (
        <motion.div
            className={`${color} text-white rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="p-1.5 md:p-2 bg-white/10 rounded-lg">{icon}</div>
                    <div className="text-xs md:text-base font-medium opacity-90">{title}</div>
                </div>
                <div className="text-lg md:text-3xl font-bold">{value}</div>
            </div>
        </motion.div>
    );

    export default Dashboard;

