import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../../components/core/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SecureStorage } from '../../utils/encryption';
import ChecklistModal from './core/checklist_modal';
import ChecklistCompleted from './core/checklist_completed';
import { Input, Button, Tag, Empty, Pagination, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';

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
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState('ongoing'); // 'ongoing' or 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('reservation_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [highlightedId, setHighlightedId] = useState(null);
  const [releasingAll, setReleasingAll] = useState(false);

  const baseUrl = SecureStorage.getLocalItem("url");

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
        personnel_id: SecureStorage.getSessionItem('user_id')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const tasksWithFormattedDates = response.data.data
          .filter(task => task.reservation_status === 'Reserved' || task.reservation_status === 'Reschedule Confirmed')
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
      toast.error(errorMessage);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  // Helper to release all resources for a task
  const releaseAllResources = async (task) => {
    setReleasingAll(true);
    try {
      // Helper to call release API for a resource
      const releaseResource = async (type, reservation_id, resource_id, quantity) => {
        const payload = {
          operation: 'updateRelease',
          type,
          reservation_id,
          resource_id,
          user_personnel_id: SecureStorage.getSessionItem('user_id'),
        };
        if (quantity) payload.quantity = quantity;
        await axios.post(`${baseUrl}personnel.php`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
      };
      // Venues
      if (task.venues && Array.isArray(task.venues)) {
        for (const venue of task.venues) {
          if (venue.availability_status !== 'In Use' && venue.active !== -1) {
            await releaseResource('venue', venue.reservation_venue_id, venue.reservation_venue_venue_id);
          }
        }
      }
      // Vehicles
      if (task.vehicles && Array.isArray(task.vehicles)) {
        for (const vehicle of task.vehicles) {
          if (vehicle.availability_status !== 'In Use' && vehicle.active !== -1) {
            await releaseResource('vehicle', vehicle.reservation_vehicle_id, vehicle.reservation_vehicle_vehicle_id);
          }
        }
      }
      // Equipments
      if (task.equipments && Array.isArray(task.equipments)) {
        for (const equipment of task.equipments) {
          // Consumable equipment (no units)
          if ((!equipment.units || equipment.units.length === 0) && equipment.availability_status !== 'In Use' && equipment.active !== -1) {
            await releaseResource('equipment_bulk', equipment.reservation_equipment_id, equipment.quantity_id, equipment.quantity);
          }
          // Equipment with units
          if (equipment.units && Array.isArray(equipment.units)) {
            for (const unit of equipment.units) {
              if (unit.availability_status !== 'In Use' && unit.active !== -1) {
                await releaseResource('equipment', unit.reservation_unit_id, unit.unit_id);
              }
            }
          }
        }
      }
      
    } catch (err) {
      toast.error('Failed to release all resources');
      console.error('Release all error:', err);
    } finally {
      setReleasingAll(false);
    }
  };

  const handleModalOpen = async (task) => {
    setReleasingAll(true);
    await releaseAllResources(task);
    // Refetch the latest data for the task
    try {
      const response = await axios.post(`${baseUrl}personnel.php`, {
        operation: 'fetchAssignedRelease',
        personnel_id: SecureStorage.getSessionItem('user_id')
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
      toast.error('Failed to refresh task after release');
    } finally {
      setReleasingAll(false);
    }
  };

  const handleOpenCompleted = (task) => {
    setSelectedTask(task);
    setIsCompletedModalOpen(true);
  };

  const handleRefresh = () => {
    fetchPersonnelTasks();

  };

  const fetchCompletedTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}personnel.php`, {
        operation: 'fetchAssignedRelease',
        personnel_id: SecureStorage.getSessionItem('user_id')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const completedTasks = response.data.data
          .filter(task => task.reservation_status === 'Completed')
          .map(task => ({
            ...task,
            formattedStartDate: formatDateTime(getEffectiveStart(task)),
            formattedEndDate: formatDateTime(getEffectiveEnd(task))
          }));
        setTasks(completedTasks);
        setError(null);
      } else {
        setTasks([]);
        toast.info('No completed tasks found');
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch completed tasks';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (filter === 'ongoing') {
      fetchPersonnelTasks();
    } else if (filter === 'completed') {
      fetchCompletedTasks();
    }
  }, [filter, fetchPersonnelTasks, fetchCompletedTasks]);

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

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Helper: Only allow opening from 1 hour before start date (Asia/Manila) and onwards
  const canOpenTask = (task) => {
    const start = getEffectiveStart(task);
    if (!task || !start) return false;
    const now = dayjs().tz('Asia/Manila');
    const openTime = dayjs(start).tz('Asia/Manila').subtract(1, 'hour');
    return now.isAfter(openTime) || now.isSame(openTime);
  };

  // Helper: Get minutes until checklist can be opened
  const getMinutesUntilOpen = (task) => {
    const start = getEffectiveStart(task);
    if (!task || !start) return null;
    const now = dayjs().tz('Asia/Manila');
    const openTime = dayjs(start).tz('Asia/Manila').subtract(1, 'hour');
    const diff = openTime.diff(now, 'minute');
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-100 to-white">
      <style>{styles}</style>
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="pt-24 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-green-900">My Tasks</h1>
              <div className="flex gap-2">
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
                  onClick={() => setFilter('completed')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    filter === 'completed'
                      ? 'bg-gradient-to-r from-lime-900 to-green-900 text-white shadow-md'
                      : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search tasks by title"
                  allowClear
                  prefix={<SearchOutlined className="text-gray-400" />}
                  size="large"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 !border-gray-300 !rounded-lg hover:!border-green-500 focus:!border-green-600"
                />
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined className='text-white'/>}
                    onClick={handleRefresh}
                    size="large"
                    className="!bg-gradient-to-r !from-lime-900 !to-green-900 hover:!from-lime-950 hover:!to-green-950 !border-none !rounded-lg shadow-sm"
                  />
                </Tooltip>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading || releasingAll ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
                {releasingAll && <span className="ml-3 text-green-700 font-semibold">Releasing all resources...</span>}
              </div>
            ) : (
              <>
                <table className="w-full text-sm text-left rtl:text-right text-gray-700">
                  <thead className="text-xs text-white uppercase bg-gradient-to-r from-lime-900 to-green-900 tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-semibold" onClick={() => handleSort('reservation_id')}>
                        <div className="flex items-center cursor-pointer hover:text-green-200">
                          ID
                          {sortField === 'reservation_id' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        <div className="flex items-center">
                          Title
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        <div className="flex items-center">
                          Start Date
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        <div className="flex items-center">
                          End Date
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        <div className="flex items-center">
                          Status
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        <div className="flex items-center">
                          Progress
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        <div className="flex items-center">
                          Actions
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks && tasks.length > 0 ? (
                      tasks
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
                            <td className="px-6 py-4 relative">
                              {String(task.reservation_id) === String(highlightedId) && (
                                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-600 rounded-full animate-ping"></div>
                              )}
                              {task.reservation_id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                              
                                <span className="font-semibold text-gray-900">{task.reservation_title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{task.formattedStartDate}</td>
                            <td className="px-6 py-4 text-gray-600">{task.formattedEndDate}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {filter === 'completed' ? (
                                  <Tag color="success">Completed</Tag>
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
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {task.venues?.length > 0 && (
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Venue</span>
                                      <span>{Math.round(calculateProgress(task.venues))}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-lime-700 to-green-600 rounded-full"
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
                                        className="h-full bg-gradient-to-r from-lime-600 to-green-500 rounded-full"
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
                                        className="h-full bg-gradient-to-r from-lime-500 to-green-400 rounded-full"
                                        style={{ width: `${calculateProgress(task.equipments)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button
                                  type="primary"
                                  icon={<EditOutlined />}
                                  onClick={() => (filter === 'completed' ? handleOpenCompleted(task) : handleModalOpen(task))}
                                  size="middle"
                                  className="!bg-gradient-to-r !from-lime-900 !to-green-900 hover:!from-lime-950 hover:!to-green-950 !border-none shadow-md hover:shadow-lg transition-all"
                                  disabled={filter !== 'completed' && !canOpenTask(task)}
                                >
                                </Button>
                                {filter !== 'completed' && !canOpenTask(task) && (
                                  <Tooltip title="You can only open this task within 5 minutes before its start time (Asia/Manila)">
                                    <span className="text-xs text-gray-400 ml-2">Locked</span>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
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

                <div className="px-6 py-4 border-t border-gray-200 bg-white">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={tasks ? tasks.length : 0}
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
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </div>
    </div>
  );
};

export default ViewPersonnelTask;