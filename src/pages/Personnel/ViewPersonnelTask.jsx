import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SecureStorage } from '../../utils/encryption';
import ChecklistModal from './core/checklist_modal';
import ChecklistCompleted from './core/checklist_completed';
import { Input, Button, Tag, Empty, Pagination, Tooltip, Modal, Card } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

// Add custom styles for animations
const styles = `
  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }
  
  .animate-pulse-subtle {
    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-ping {
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  
  @keyframes ping {
    75%, 100% {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }
  }
`;

const ViewPersonnelTask = () => {
  // ========================================
  // TASK LOCKING CONFIGURATION
  // ========================================
  // Set to true: Task is locked until 1 hour before start time
  // Set to false: Task can be opened anytime (no time-based locking)
  const ENABLE_TASK_LOCKING = false;
  // ========================================

  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState('ongoing'); // 'ongoing' or 'closed'
  const [searchTerm, setSearchTerm] = useState('');
  // const [sortField, setSortField] = useState('reservation_id');
  // const [sortOrder, setSortOrder] = useState('desc');
  const [highlightedId, setHighlightedId] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const baseUrl = SecureStorage.getLocalItem("url");

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

  // Filtered tasks with search functionality
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    return tasks.filter(task => 
      task.reservation_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.reservation_id?.toString().includes(searchTerm)
    );
  }, [tasks, searchTerm]);

  // Safely parse and format date strings like "YYYY-MM-DD HH:mm:ss"
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    // Ensure cross-browser parse (Safari fix) by using ISO-like format
    const isoLike = String(dateString).replace(' ', 'T');
    const date = new Date(isoLike);
    if (isNaN(date.getTime())) return '-';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${month} ${day}, ${year} at ${formattedHours}:${minutes} ${ampm}`;
  };

  // Determine effective dates: prefer reschedule_* when present, else reservation_*
  const getEffectiveStart = (task) => task?.reschedule_start_date || task?.reservation_start_date;
  const getEffectiveEnd = (task) => task?.reschedule_end_date || task?.reservation_end_date;

  const fetchPersonnelTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}personnel.php`, {
        operation: 'fetchAssignedRelease',
        personnel_id: SecureStorage.getLocalItem('user_id')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const tasksWithFormattedDates = response.data.data
          .filter(task => task.reservation_status === 'Reserved' || task.reservation_status === 'Reschedule' || task.reservation_status === 'Reschedule Confirmed' || task.reservation_status === 'On Going')
          .map(task => ({
            ...task,
            formattedStartDate: formatDateTime(getEffectiveStart(task)),
            formattedEndDate: formatDateTime(getEffectiveEnd(task))
          }));
        setTasks(tasksWithFormattedDates);
        setError(null);
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch tasks';
      setError(errorMessage);
      if (!err.response || err.message === 'Network Error' || err.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to load tasks.');
      } else {
        toast.error(errorMessage);
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);


  const handleModalOpen = async (task) => {
    // First, check if the task can be opened based on time constraints
    if (!canOpenTask(task)) {
      const minutesUntilOpen = getMinutesUntilOpen(task);
      setErrorMessage(`This task is locked. You can only open it within 1 hour before its start time. Time remaining: ${minutesUntilOpen} minute(s).`);
      setErrorModalVisible(true);
      return;
    }

    // Fetch the latest data for the task
    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}personnel.php`, {
        operation: 'fetchAssignedRelease',
        personnel_id: SecureStorage.getLocalItem('user_id')
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      let updatedTask = null;
      if (response.data.status === 'success') {
        updatedTask = response.data.data.find(t => String(t.reservation_id) === String(task.reservation_id));
        if (updatedTask) {
          updatedTask = {
            ...updatedTask,
            formattedStartDate: formatDateTime(getEffectiveStart(updatedTask)),
            formattedEndDate: formatDateTime(getEffectiveEnd(updatedTask)),
          };
        }
      }

      // Check if the reservation status is valid for opening
      if (updatedTask && updatedTask.reservation_status) {
        const status = updatedTask.reservation_status.toLowerCase();
        if (status === 'cancelled' || status === 'declined' || status === 'rejected' || status === 'completed') {
          setErrorMessage(`Cannot open this task. The reservation has been ${status}.`);
          setErrorModalVisible(true);
          return;
        }
      }

      // Transform data structure to match the code's expectations
      const transformedTask = {
        ...updatedTask,
        venues: updatedTask?.venues?.map(venue => ({
          ...venue,
          availability_status: venue.availability_status
        })) || [],
        vehicles: updatedTask?.vehicles?.map(vehicle => ({
          ...vehicle,
          availability_status: vehicle.availability_status
        })) || [],
        equipments: updatedTask?.equipments?.map(equipment => ({
          ...equipment,
          availability_status: equipment.availability_status,
          units: equipment.units?.map(unit => ({
            ...unit,
            availability_status: unit.availability_status
          }))
        })) || []
      };
      setSelectedTask(transformedTask);
      setIsModalOpen(true);
    } catch (err) {
      if (!err.response || err.message === 'Network Error' || err.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to load task.');
      } else {
        toast.error('Failed to load task details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleted = (task) => {
    setSelectedTask(task);
    setIsCompletedModalOpen(true);
  };

  const handleErrorModalClose = () => {
    setErrorModalVisible(false);
    setErrorMessage('');
    // Refresh the data after closing the error modal
    if (filter === 'ongoing') {
      fetchPersonnelTasks();
    } else if (filter === 'closed') {
      fetchClosedTasks();
    }
  };

  const handleRefresh = () => {
    if (filter === 'ongoing') {
      fetchPersonnelTasks();
    } else if (filter === 'closed') {
      fetchClosedTasks();
    }
  };

  const fetchClosedTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}personnel.php`, {
        operation: 'fetchAssignedRelease',
        personnel_id: SecureStorage.getLocalItem('user_id')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const closedTasks = response.data.data
          .filter(task => task.reservation_status === 'Completed' || task.reservation_status === 'Cancelled' || task.reservation_status === 'Declined')
          .map(task => ({
            ...task,
            formattedStartDate: formatDateTime(getEffectiveStart(task)),
            formattedEndDate: formatDateTime(getEffectiveEnd(task))
          }));
        setTasks(closedTasks);
        setError(null);
      } else {
        setTasks([]);
        toast.info('No closed tasks found');
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch closed tasks';
      setError(errorMessage);
      if (!err.response || err.message === 'Network Error' || err.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to load closed tasks.');
      } else {
        toast.error(errorMessage);
      }
      console.error('Error:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (filter === 'ongoing') {
      fetchPersonnelTasks();
    } else if (filter === 'closed') {
      fetchClosedTasks();
    }
  }, [filter, fetchPersonnelTasks, fetchClosedTasks]);

  useEffect(() => {
    fetchPersonnelTasks();
  }, [fetchPersonnelTasks]);

  // Set highlightedId from navigation state
  useEffect(() => {
    const reservationId = location.state?.reservationId;
    if (reservationId) {
      setHighlightedId(String(reservationId));
      console.log('Highlighted ID set:', String(reservationId));
    }
  }, [location.state]);

  // Set the current page to show the highlighted row
  useEffect(() => {
    if (highlightedId && tasks.length > 0) {
      const taskIndex = tasks.findIndex(task => String(task.reservation_id) === String(highlightedId));
      if (taskIndex !== -1) {
        const page = Math.floor(taskIndex / pageSize) + 1;
        setCurrentPage(page);
        console.log('Highlighted row found at index:', taskIndex, 'on page:', page);
      } else {
        console.log('Highlighted row not found in tasks');
      }
    }
  }, [highlightedId, tasks, pageSize]);

  const calculateProgress = (items) => {
    if (!items) return 0;
    const total = items.reduce((acc, item) => acc + (item.checklists?.length || 0), 0);
    const completed = items.reduce((acc, item) => 
      acc + (item.checklists?.filter(c => c.isChecked === "1" || c.isChecked === 1).length || 0), 0);
    return total > 0 ? (completed / total) * 100 : 0;
  };

    // const handleSort = (field) => {
    //   if (field === sortField) {
    //     setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    //   } else {
    //     setSortField(field);
    //     setSortOrder("asc");
    //   }
    // };

  // Helper: Only allow opening from 1 hour before start date (Asia/Manila) and onwards
  const canOpenTask = (task) => {
    // If task locking is disabled, allow opening anytime
    if (!ENABLE_TASK_LOCKING) return true;
    
    const start = getEffectiveStart(task);
    if (!task || !start) return false;
    const now = dayjs().tz('Asia/Manila');
    const openTime = dayjs(start).tz('Asia/Manila').subtract(1, 'hour');
    return now.isAfter(openTime) || now.isSame(openTime);
  };

  // Helper: Get minutes until checklist can be opened
  const getMinutesUntilOpen = (task) => {
    // If task locking is disabled, return 0 (no wait time)
    if (!ENABLE_TASK_LOCKING) return 0;
    
    const start = getEffectiveStart(task);
    if (!task || !start) return null;
    const now = dayjs().tz('Asia/Manila');
    const openTime = dayjs(start).tz('Asia/Manila').subtract(1, 'hour');
    const diff = openTime.diff(now, 'minute');
    return diff > 0 ? diff : 0;
  };

  // Mobile card rendering function
  const renderMobileCards = () => {
    const currentTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    
    if (!currentTasks || currentTasks.length === 0) {
      return (
        <div className="p-6 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="text-green-500">No tasks found</span>}
          />
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        {currentTasks.map((task) => (
          <Card
            key={task.reservation_id}
            className={`shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${
              String(task.reservation_id) === String(highlightedId) 
                ? 'border-l-4 border-l-green-600 bg-green-50/50 animate-pulse-subtle' 
                : ''
            }`}
            size="small"
          >
            <div className="space-y-3">
              {/* Title and Status */}
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {task.reservation_title}
                </h3>
                <div className="flex flex-col gap-1 ml-2">
                  {filter === 'closed' ? (
                    <Tag color={task.reservation_status === 'Completed' ? 'success' : 'error'} className="text-xs">
                      {task.reservation_status}
                    </Tag>
                  ) : (
                    <>
                      {canOpenTask(task) ? (
                        <Tag color={task.venues?.some(v => v.availability_status === "In Use") ? 'processing' : 'success'} className="text-xs">
                          {task.venues?.some(v => v.availability_status === "In Use") ? 'In Progress' : 'Available'}
                        </Tag>
                      ) : (
                        <Tooltip title={`Checklist will open in ${getMinutesUntilOpen(task)} minute(s)`}>
                          <Tag color="default" className="text-xs">Locked</Tag>
                        </Tooltip>
                      )}
                      {task.is_returned === 1 && (
                        <Tag color="success" className="text-xs">Returned</Tag>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Type */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Type:</span>
                <Tag color={
                  task.reservation_type === 'Trip' ? 'blue' :
                  task.reservation_type === 'Activity/Event' ? 'purple' :
                  task.reservation_type === 'EQ' ? 'orange' : 'default'
                } className="text-xs">
                  {task.reservation_type || 'Unknown'}
                </Tag>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">Start:</span> {task.formattedStartDate}
                </div>
                <div>
                  <span className="font-medium text-gray-700">End:</span> {task.formattedEndDate}
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-2">
                {task.venues?.length > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Venue</span>
                      <span className="font-medium">{Math.round(calculateProgress(task.venues))}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-lime-700 to-green-600 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(task.venues)}%` }}
                      />
                    </div>
                  </div>
                )}
                {task.vehicles?.length > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Vehicle</span>
                      <span className="font-medium">{Math.round(calculateProgress(task.vehicles))}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-lime-600 to-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(task.vehicles)}%` }}
                      />
                    </div>
                  </div>
                )}
                {task.equipments?.length > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Equipment</span>
                      <span className="font-medium">{Math.round(calculateProgress(task.equipments))}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-lime-500 to-green-400 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(task.equipments)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-gray-100">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => (filter === 'closed' ? handleOpenCompleted(task) : handleModalOpen(task))}
                  size="small"
                  className="!bg-gradient-to-r !from-lime-900 !to-green-900 hover:!from-lime-950 hover:!to-green-950 !border-none shadow-md hover:shadow-lg transition-all w-full"
                  disabled={filter !== 'closed' && !canOpenTask(task)}
                >
                  {filter === 'closed' ? 'View Details' : 'Open Checklist'}
                </Button>
                {filter !== 'closed' && !canOpenTask(task) && (
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Locked - Opens {getMinutesUntilOpen(task)} min(s) before start
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-100 to-white">
      <style>{styles}</style>
      {!isMobile && <Sidebar />}
        {isMobile && <Sidebar />}
      <div className="flex-1 overflow-x-hidden">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-2' : 'px-4 sm:px-6 lg:px-8'}`}>
          {/* Header Section */}
          <div className="pt-24 pb-6">
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between gap-4'}`}>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold text-green-900`}>My Tasks</h1>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
                <button
                  onClick={() => setFilter('ongoing')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    filter === 'ongoing'
                      ? 'bg-gradient-to-r from-lime-900 to-green-900 text-white shadow-md'
                      : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
                  }`}
                >
                  Ongoing
                </button>
                <button
                  onClick={() => setFilter('closed')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    filter === 'closed'
                      ? 'bg-gradient-to-r from-lime-900 to-green-900 text-white shadow-md'
                      : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
                  }`}
                >
                  Closed Task
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center gap-3'}`}>
                <Input
                  placeholder={isMobile ? "Search tasks..." : "Search tasks by title"}
                  allowClear
                  prefix={<SearchOutlined className="text-gray-400" />}
                  size={isMobile ? "middle" : "large"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 !border-gray-300 !rounded-lg hover:!border-green-500 focus:!border-green-600"
                />
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined className='text-white'/>}
                    onClick={handleRefresh}
                    size={isMobile ? "middle" : "large"}
                    className={`!bg-gradient-to-r !from-lime-900 !to-green-900 hover:!from-lime-950 hover:!to-green-950 !border-none !rounded-lg shadow-sm !text-white ${isMobile ? 'w-full' : ''}`}
                  >
                    {isMobile && 'Refresh'}
                  </Button>
                </Tooltip>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : isMobile ? (
              renderMobileCards()
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-700">
                    <thead className="text-xs text-white uppercase bg-gradient-to-r from-lime-900 to-green-900 tracking-wider">
                      <tr>
                        <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'} font-semibold`}>
                          <div className="flex items-center">
                            Title
                          </div>
                        </th>
                        {!isTablet && (
                          <th scope="col" className="px-6 py-4 font-semibold">
                            <div className="flex items-center">
                              Type
                            </div>
                          </th>
                        )}
                        {!isTablet && (
                          <th scope="col" className="px-6 py-4 font-semibold">
                            <div className="flex items-center">
                              Start Date
                            </div>
                          </th>
                        )}
                        {!isTablet && (
                          <th scope="col" className="px-6 py-4 font-semibold">
                            <div className="flex items-center">
                              End Date
                            </div>
                          </th>
                        )}
                        <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'} font-semibold`}>
                          <div className="flex items-center">
                            Status
                          </div>
                        </th>
                        <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'} font-semibold`}>
                          <div className="flex items-center">
                            Progress
                          </div>
                        </th>
                        <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'} font-semibold`}>
                          <div className="flex items-center">
                            Actions
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks && filteredTasks.length > 0 ? (
                        filteredTasks
                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                          .map((task) => (
                            <tr
                              key={task.reservation_id}
                              className={`bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                                String(task.reservation_id) === String(highlightedId) 
                                  ? 'bg-green-50/50 hover:bg-green-50 border-l-4 border-l-green-600 animate-pulse-subtle relative' 
                                  : ''
                              }`}
                            >
                              <td className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'}`}>
                                <div className="flex items-center">
                                  <span className="font-semibold text-gray-900">{task.reservation_title}</span>
                                </div>
                              </td>
                              {!isTablet && (
                                <td className="px-6 py-4">
                                  <Tag color={
                                    task.reservation_type === 'Trip' ? 'blue' :
                                    task.reservation_type === 'Activity/Event' ? 'purple' :
                                    task.reservation_type === 'EQ' ? 'orange' : 'default'
                                  }>
                                    {task.reservation_type || 'Unknown'}
                                  </Tag>
                                </td>
                              )}
                              {!isTablet && (
                                <td className="px-6 py-4 text-gray-600">{task.formattedStartDate}</td>
                              )}
                              {!isTablet && (
                                <td className="px-6 py-4 text-gray-600">{task.formattedEndDate}</td>
                              )}
                              <td className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'}`}>
                                <div className="flex flex-col gap-1">
                                  {filter === 'closed' ? (
                                    <Tag color={task.reservation_status === 'Completed' ? 'success' : 'error'}>
                                      {task.reservation_status}
                                    </Tag>
                                  ) : (
                                    <>
                                      {canOpenTask(task) ? (
                                        <Tag color={task.venues?.some(v => v.availability_status === "In Use") ? 'processing' : 'success'}>
                                          {task.venues?.some(v => v.availability_status === "In Use") ? 'In Progress' : 'Available'}
                                        </Tag>
                                      ) : (
                                        <Tooltip title={`Checklist will open in ${getMinutesUntilOpen(task)} minute(s)`}>
                                          <Tag color="default">
                                            Locked
                                          </Tag>
                                        </Tooltip>
                                      )}
                                      {task.is_returned === 1 && (
                                        <Tag color="success">Returned</Tag>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'}`}>
                                <div className="space-y-2">
                                  {task.venues?.length > 0 && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Venue</span>
                                        <span>{Math.round(calculateProgress(task.venues))}%</span>
                                      </div>
                                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-lime-700 to-green-600 rounded-full transition-all duration-300"
                                          style={{ width: `${calculateProgress(task.venues)}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {task.vehicles?.length > 0 && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Vehicle</span>
                                        <span>{Math.round(calculateProgress(task.vehicles))}%</span>
                                      </div>
                                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-lime-600 to-green-500 rounded-full transition-all duration-300"
                                          style={{ width: `${calculateProgress(task.vehicles)}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {task.equipments?.length > 0 && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Equipment</span>
                                        <span>{Math.round(calculateProgress(task.equipments))}%</span>
                                      </div>
                                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-lime-500 to-green-400 rounded-full transition-all duration-300"
                                          style={{ width: `${calculateProgress(task.equipments)}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'}`}>
                                <div className="flex space-x-2">
                                  <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => (filter === 'closed' ? handleOpenCompleted(task) : handleModalOpen(task))}
                                    size={isTablet ? "small" : "middle"}
                                    className="!bg-gradient-to-r !from-lime-900 !to-green-900 hover:!from-lime-950 hover:!to-green-950 !border-none shadow-md hover:shadow-lg transition-all"
                                    disabled={filter !== 'closed' && !canOpenTask(task)}
                                  >
                                  </Button>
                                  {filter !== 'closed' && !canOpenTask(task) && (
                                    <Tooltip title="You can only open this task within 1 hour before its start time (Asia/Manila)">
                                      <span className="text-xs text-gray-400 ml-2">Locked</span>
                                    </Tooltip>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={isTablet ? 4 : 7} className="px-6 py-24 text-center">
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description={
                                <span className="text-green-500">
                                  No tasks found
                                </span>
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'} border-t border-gray-200 bg-white`}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredTasks ? filteredTasks.length : 0}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger={!isMobile}
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} of ${total} items`
                    }
                    className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                    simple={isMobile}
                    size={isSmallScreen ? "small" : "default"}
                  />
                </div>
              </>
            )}
          </div>

          <ChecklistModal 
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTask(null);
            }}
            selectedTask={selectedTask}
            onTaskUpdate={(updatedTask) => {
              if (updatedTask === null) {
                fetchPersonnelTasks();
              } else {
                setSelectedTask(updatedTask);
              }
            }}
            refreshTasks={fetchPersonnelTasks}
          />
          <ChecklistCompleted
            isOpen={isCompletedModalOpen}
            onClose={() => {
              setIsCompletedModalOpen(false);
              setSelectedTask(null);
            }}
            selectedTask={selectedTask}
          />
          
          {/* Error Modal */}
          <Modal
            title={
              <div className="flex items-center gap-2">
                <ExclamationCircleOutlined className="text-red-500" />
                <span className="text-red-600">Cannot Open Task</span>
              </div>
            }
            open={errorModalVisible}
            onOk={handleErrorModalClose}
            onCancel={handleErrorModalClose}
            okText="OK"
            cancelButtonProps={{ style: { display: 'none' } }}
            okButtonProps={{
              className: '!bg-gradient-to-r !from-lime-900 !to-green-900 hover:!from-lime-950 hover:!to-green-950 !border-none'
            }}
            centered
            width={500}
          >
            <div className="py-4">
              <p className="text-gray-700 text-base leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </Modal>
          
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </div>
    </div>
  );
};

export default ViewPersonnelTask;