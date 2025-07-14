import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './component/sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SecureStorage } from '../../utils/encryption';
import ChecklistModal from './core/checklist_modal';
import { Input, Button, Tag, Empty, Pagination, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { FaEye } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState('ongoing'); // 'ongoing' or 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('reservation_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [highlightedId, setHighlightedId] = useState(null);

  const baseUrl = SecureStorage.getLocalItem("url");

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
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
          .filter(task => task.reservation_status === 'Reserved')
          .map(task => ({
            ...task,
            formattedStartDate: formatDateTime(task.reservation_start_date),
            formattedEndDate: formatDateTime(task.reservation_end_date)
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

  const handleModalOpen = (task) => {
    console.log('Opening modal with task:', task);
    // Transform data structure to match the code's expectations
    const transformedTask = {
      ...task,
      venues: task.venues?.map(venue => ({
        ...venue,
        availability_status: venue.availability_status
      })) || [],
      vehicles: task.vehicles?.map(vehicle => ({
        ...vehicle,
        availability_status: vehicle.availability_status
      })) || [],
      equipments: task.equipments?.map(equipment => ({
        ...equipment,
        availability_status: equipment.availability_status,
        units: equipment.units?.map(unit => ({
          ...unit,
          availability_status: unit.availability_status
        }))
      })) || []
    };
    console.log('Transformed task:', transformedTask);
    setSelectedTask(transformedTask);
    setIsModalOpen(true);
  };

  const handleRefresh = () => {
    fetchPersonnelTasks();
    toast.info('Refreshing tasks...');
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
            formattedStartDate: formatDateTime(task.reservation_start_date),
            formattedEndDate: formatDateTime(task.reservation_end_date)
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 to-white">
      <style>{styles}</style>
      <Sidebar />
      <div className="flex-1 p-3 sm:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 mt-20 sticky top-0 z-10 backdrop-blur-md pt-8 pb-6 rounded-xl shadow-md rounded-xl">
            <div className="flex flex-col gap-4 sm:gap-6">
              <h1 className="text-3xl font-extrabold text-green-900 tracking-tight">My Tasks</h1>
              <div className="flex justify-start">
                <div className="flex p-1 bg-green-50 rounded-lg shadow border border-green-100">
                  <button
                    onClick={() => setFilter('ongoing')}
                    className={`flex-1 px-5 py-2 rounded-md text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-green-400/50 ${
                      filter === 'ongoing'
                        ? 'bg-green-600 text-white shadow'
                        : 'text-green-700 hover:bg-green-100'
                    }`}
                  >
                    Ongoing
                  </button>
                  <button
                    onClick={() => setFilter('completed')}
                    className={`flex-1 px-5 py-2 rounded-md text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-green-400/50 ${
                      filter === 'completed'
                        ? 'bg-green-600 text-white shadow'
                        : 'text-green-700 hover:bg-green-100'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-green-100" />
          </div>

          {/* Search Bar Section */}
          <div className="bg-white p-6 rounded-xl shadow border border-green-100 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    placeholder="Search tasks by title"
                    allowClear
                    prefix={<SearchOutlined className="text-green-700" />}
                    size="large"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full !bg-green-50 !border-green-200 !rounded-lg focus:!border-green-400"
                  />
                  <Tooltip title="Refresh data">
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                      size="large"
                      className="!bg-green-100 !border-green-200 hover:!bg-green-200"
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className="relative overflow-x-auto shadow-lg sm:rounded-2xl bg-white border border-green-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                <table className="w-full text-sm text-left rtl:text-right text-green-900">
                  <thead className="text-xs text-green-800 uppercase bg-green-100/60">
                    <tr>
                      <th scope="col" className="px-6 py-4" onClick={() => handleSort('reservation_id')}>
                        <div className="flex items-center cursor-pointer hover:text-green-900">
                          ID
                          {sortField === 'reservation_id' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4">
                        <div className="flex items-center">
                          Title
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4">
                        <div className="flex items-center">
                          Start Date
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4">
                        <div className="flex items-center">
                          End Date
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4">
                        <div className="flex items-center">
                          Status
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4">
                        <div className="flex items-center">
                          Progress
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4">
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
                            className={`bg-white border-b border-green-50 hover:bg-green-50/60 transition-colors duration-150 ${
                              String(task.reservation_id) === String(highlightedId) 
                                ? 'bg-green-100/80 hover:bg-green-200/80 border-l-4 border-l-green-500 animate-pulse-subtle relative' 
                                : ''
                            }`}
                          >
                            <td className="px-6 py-4 relative">
                              {String(task.reservation_id) === String(highlightedId) && (
                                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                              )}
                              {task.reservation_id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FaEye className="mr-2 text-green-700" />
                                <span className="font-semibold">{task.reservation_title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">{task.formattedStartDate}</td>
                            <td className="px-6 py-4">{task.formattedEndDate}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <Tag color={task.venues?.some(v => v.availability_status === "In Use") ? 'processing' : 'success'}>
                                  {task.venues?.some(v => v.availability_status === "In Use") ? 'In Progress' : 'Available'}
                                </Tag>
                                {task.is_returned === 1 && (
                                  <Tag color="success">Returned</Tag>
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
                                    <div className="h-1.5 bg-green-50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-green-500 rounded-full"
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
                                    <div className="h-1.5 bg-green-50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-green-400 rounded-full"
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
                                    <div className="h-1.5 bg-green-50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-green-300 rounded-full"
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
                                  onClick={() => handleModalOpen(task)}
                                  size="middle"
                                  className="bg-green-700 hover:bg-green-800 border-none"
                                />
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

                <div className="p-6 border-t border-green-100">
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
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </div>
    </div>
  );
};

export default ViewPersonnelTask;