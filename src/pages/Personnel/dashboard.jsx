import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiCheck,
  FiInfo,
  FiClock,
  FiClipboard,
  FiFilter,
  FiMapPin,
  FiCalendar
} from 'react-icons/fi';
import ReservationCalendar from '../../components/ReservationCalendar';
import Sidebar from './component/sidebar';  // Updated import path
import { format } from 'timeago.js';
import { SecureStorage } from '../../utils/encryption'; // Ensure this path is correct

const Dashboard = () => {
  const navigate = useNavigate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [recentActivities, setRecentActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    if (decryptedUserLevel !== 2 && decryptedUserLevel !== 2) {
      localStorage.clear();
      navigate('/gsd');
    }
    // Set the base URL from SecureStorage
    const url = SecureStorage.getLocalItem("url");
    setBaseUrl(url);
  }, [navigate]);

  const formatTimeAgo = (date) => {
    return format(new Date(date));
  };

  const fetchRecentActivities = useCallback(async () => {
    try {
      const url = SecureStorage.getLocalItem("url");
      if (!url) {
        console.error('Base URL is not set in SecureStorage');
        return;
      }

      // Ensure the URL doesn't end with a slash
      const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      console.log('Making request to:', `${baseUrl}/personnel.php`);

      const response = await fetch(`${baseUrl}/personnel.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchAssignedRelease',
          personnel_id: SecureStorage.getSessionItem('user_id')
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const transformedActivities = result.data
          .filter(task => task.reservation_status === 'Reserved')
          .map(item => ({
            type: 'Task',
            message: item.reservation_title,
            time: item.reservation_start_date,
            timeAgo: formatTimeAgo(item.reservation_start_date),
            reservation_id: item.reservation_id,
            user_details: item.user_details,
            start_date: item.reservation_start_date,
            end_date: item.reservation_end_date
          }))
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date)); // Sort by start date
        setRecentActivities(transformedActivities);
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    }
  }, []);

  useEffect(() => {
    fetchRecentActivities();
  }, [fetchRecentActivities]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = recentActivities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(recentActivities.length / itemsPerPage);

  const handleViewTask = (reservationId) => {
    navigate('/Personnel/ViewTask', { state: { reservationId } });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-green-100">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-x-hidden mt-20">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
           
          </div>
        </div>

        {/* Recent Tasks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100"
        >
          <div className="bg-gradient-to-r from-lime-900 to-green-900 p-3 md:p-4 flex justify-between items-center">
            <h2 className="text-white text-base md:text-lg font-semibold flex items-center">
              <FiCalendar className="mr-2 text-sm md:text-base" /> Recent Tasks
            </h2>
            <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
              {recentActivities.length} Tasks
            </div>
          </div>
          <div className="p-3 md:p-4">
            <div className="space-y-4">
              {currentItems.length > 0 ? (
                currentItems.map((activity, index) => (
                  <motion.div
                    key={index}
                    className="p-4 bg-white/50 border border-gray-100 rounded-xl hover:border-green-200 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleViewTask(activity.reservation_id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{activity.message}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {activity.user_details?.full_name} - {activity.user_details?.department}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {activity.timeAgo}
                      </span>
                    </div>
                    <div className="flex items-center mt-3 text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <FiClock className="w-4 h-4 mr-2" />
                        {new Date(activity.start_date).toLocaleString()} - {new Date(activity.end_date).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 bg-white/50 rounded-xl">
                  <FiCalendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No recent tasks found</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-white/50 border border-gray-200 text-gray-700 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-white/50 border border-gray-200 text-gray-700 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <ReservationCalendar 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
