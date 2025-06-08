import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiCheck,
  FiInfo,
  FiClock,
  FiClipboard,
  FiFilter,
  FiMapPin
} from 'react-icons/fi';
import ReservationCalendar from '../../components/ReservationCalendar';
import Sidebar from './component/sidebar';  // Updated import path
import { format } from 'timeago.js';
import { SecureStorage } from '../../utils/encryption'; // Ensure this path is correct

const Dashboard = () => {
  const navigate = useNavigate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [baseUrl, setBaseUrl] = useState('');

  const [refreshKey, setRefreshKey] = useState(0); // Add this new state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [recentActivities, setRecentActivities] = useState([]);

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

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${baseUrl}/personnel.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchAssignedRelease',
          personnel_id: localStorage.getItem('user_id')
        })
      });

      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Transform the data to match our needs
        const transformedTasks = result.data.map(item => ({
          id: item.master_data.checklist_id,
          title: item.master_data.vehicle_form_name,
          venue: item.master_data.venue_form_name,
          time: new Date(item.master_data.vehicle_form_start_date).toLocaleTimeString(),
          startDate: new Date(item.master_data.vehicle_form_start_date).toLocaleDateString(),
          endDate: new Date(item.master_data.vehicle_form_end_date).toLocaleDateString(),
          status: item.master_data.status_checklist_name,
          priority: item.master_data.checklist_status_id === "4" ? "high" : "medium"
        }));
        setPriorityTasks(transformedTasks);
      } else {
        setPriorityTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setPriorityTasks([]);
    }
  };

  const formatTimeAgo = (date) => {
    return format(new Date(date));
  };

  const fetchRecentActivities = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/personnel.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchRecent'
        })
      });

      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const transformedActivities = result.data.map(item => ({
          type: 'Task Added',
          message: `Task was added`,
          time: item.checklist_updated_at,
          timeAgo: formatTimeAgo(item.checklist_updated_at)
        }));
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
  const currentTasks = priorityTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(priorityTasks.length / itemsPerPage);

  useEffect(() => {
    fetchTasks();
  }, [refreshKey]); // Add refreshKey as dependency

  const handleTaskComplete = async (taskId) => {
    try {
      const response = await fetch(`${baseUrl}/update_master.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateTaskStatus',
          task_id: taskId,
          status: 'completed'
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        // Trigger a refresh of the tasks
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-x-hidden mt-20">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
           
          </div>
        </div>



        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priority Tasks */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Priority Tasks</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <FiFilter className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {currentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <FiInfo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active tasks available</p>
                </div>
              ) : (
                <>
                  {currentTasks.map((item) => (
                    <div key={item.id} className={`p-4 rounded-lg border-l-4 ${
                      item.priority === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                    }`}>
                      <h3 className="font-semibold text-gray-800">{item.title}</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center text-sm text-gray-600 gap-4">
                          <span className="flex items-center gap-1">
                            <FiMapPin className="w-4 h-4" /> {item.venue}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" /> {item.time}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 gap-4">
                          <span>From: {item.startDate}</span>
                          <span>To: {item.endDate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${
                            item.status.toLowerCase() === 'pending' ? 'text-yellow-600' : 'text-blue-600'
                          }`}>
                            Status: {item.status}
                          </span>
                          <button 
                            onClick={() => handleTaskComplete(item.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <FiCheck className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Recent Activities</h2>
              <select className="text-sm border rounded-lg px-2 py-1">
                <option>All Activities</option>
                <option>Approvals</option>
                <option>Rejections</option>
                <option>Updates</option>
              </select>
            </div>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <FiInfo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="p-2 rounded-full shrink-0 bg-blue-100 text-blue-600">
                      <FiClipboard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800">{activity.message}</p>
                        <span className="text-sm text-gray-500">{activity.timeAgo}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: <span className="font-medium text-blue-600">{activity.type}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <ReservationCalendar 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
