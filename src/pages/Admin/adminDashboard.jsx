    import React, { useEffect, useState, useCallback } from 'react';
    import { useNavigate } from 'react-router-dom';
    import Sidebar from '../Sidebar';
    import {
    FaCar, FaUsers, FaBuilding, FaTools
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
    import ReservationChart from './core/ReservationChart';
    import SimpleAreaChart from './core/Status_Areachart';
    import RecentReservations from './core/RecentReservations';

    import { SecureStorage } from '../../utils/encryption';

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
        const [recentReservationsPage, setRecentReservationsPage] = useState(1);
        const encryptedUrl = SecureStorage.getLocalItem("url");

        useEffect(() => {
            const savedMode = localStorage.getItem('darkMode') === 'true';
            setDarkMode(savedMode);
        }, []);

        useEffect(() => {
            const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');
            const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
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

        useEffect(() => {
            localStorage.setItem('darkMode', darkMode);
            if (darkMode) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }, [darkMode]);

        const fetchReservations = useCallback(async () => {
            try {
                const response = await axios.post(`${encryptedUrl}/user.php`, {
                    operation: 'fetchRecord'
                });

                if (response.data && response.data.status === 'success') {
                    // Set all reservations without filtering by status
                    setOngoingReservations(response.data.data);
                    setCompletedReservations([]); // Clear completed reservations since we're not filtering anymore
                } else {
                    toast.error('Failed to fetch reservations');
                }
            } catch (error) {
                console.error('Error fetching reservations:', error);
                toast.error('Error fetching reservations');
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
      
                fetchTotals();

            }
        }, [loading, fetchReservations, fetchReleaseFacilities,  fetchPersonnel, encryptedUrl, fetchTotals]);

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
      
                fetchTotals();

            }
        }, [loading, fetchReservations, 
            fetchReleaseFacilities, fetchPersonnel, encryptedUrl, fetchTotals]);




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
                className={`flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex-shrink-0">
                    <Sidebar />
                </div>
                <div className="flex-1 overflow-auto">
                    <div className="h-full flex flex-col max-w-[1600px] mx-auto mt-20">
                        <div className="flex-1 py-6 space-y-6 px-4 md:px-6 lg:px-8">
                            {/* Stats Grid - Improved responsiveness */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                <StatCard
                                    title="Venues"
                                    value={totals.venues}
                                    icon={<FaBuilding className="text-xl md:text-3xl" />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                />
                                <StatCard
                                    title="Equipment"
                                    value={totals.equipments}
                                    icon={<FaTools className="text-xl md:text-3xl" />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                />
                                <StatCard
                                    title="Vehicles"
                                    value={totals.vehicles}
                                    icon={<FaCar className="text-xl md:text-3xl" />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                />
                                <StatCard
                                    title="Users"
                                    value={totals.users}
                                    icon={<FaUsers className="text-xl md:text-3xl" />}
                                    color="bg-gradient-to-r from-lime-900 to-green-900"
                                />
                            </div>

                            {/* Charts Grid - Improved responsiveness */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
                            >
                                <div className="w-full">
                                    <ReservationChart />
                                </div>
                                <div className="w-full">
                                    <SimpleAreaChart />
                                </div>
                            </motion.div>

                            {/* Recent Reservations - Full width */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="w-full mt-6"
                            >
                                <RecentReservations 
                                    reservations={[...ongoingReservations, ...completedReservations]}
                                    currentPage={recentReservationsPage}
                                    setCurrentPage={setRecentReservationsPage}
                                    itemsPerPage={5}
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    // Enhanced StatCard component with better responsiveness
    const StatCard = ({ title, value, icon, color }) => (
        <motion.div
            className={`${color} text-white rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-300`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
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

