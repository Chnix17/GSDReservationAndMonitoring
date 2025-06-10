import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Sidebar from './component/sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SecureStorage } from '../../utils/encryption';
import ChecklistModal from './core/checklist_modal';
import { Input, Button, Table, Tag, Empty, Pagination, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { FaEye, FaChartBar } from 'react-icons/fa';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('reservation_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [highlightedId, setHighlightedId] = useState(null);

  const baseUrl = SecureStorage.getLocalItem("url");

  const idMapping = {
    venue: 'reservation_checklist_venue_id',
    vehicle: 'reservation_checklist_vehicle_id',
    equipment: 'reservation_checklist_equipment_id'  // Ensure this matches the backend field
  };

  const lookupField = {
    venue: 'checklist_venue_id',
    vehicle: 'checklist_vehicle_id',
    equipment: 'checklist_equipment_id'
  };

  const needsDefectQuantity = (conditionId) => {
    return ['3', '4'].includes(conditionId);
  };


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




  const fetchPersonnelTasks = async () => {
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
          .filter(task => task.reservation_status === 'Reserved') // Changed from 'Reserve' to 'Reserved'
          .map(task => ({
            ...task,
            formattedStartDate: formatDateTime(task.reservation_start_date),
            formattedEndDate: formatDateTime(task.reservation_end_date)
          }));
        setTasks(tasksWithFormattedDates);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistUpdate = async (type, checklistId, value) => {
    try {
      // Find the checklist item in the appropriate array (venues, vehicles, or equipments)
      let checklist = null;
      let reservationItemId = null;

      switch(type) {
        case 'venue':
          // Search through all venues
          for (const venue of selectedTask.venues || []) {
            const found = venue.checklists?.find(item => item[lookupField[type]] === checklistId);
            if (found) {
              checklist = found;
              reservationItemId = venue.reservation_venue_id;
              break;
            }
          }
          break;
        case 'vehicle':
          // Search through all vehicles
          for (const vehicle of selectedTask.vehicles || []) {
            const found = vehicle.checklists?.find(item => item[lookupField[type]] === checklistId);
            if (found) {
              checklist = found;
              reservationItemId = vehicle.reservation_vehicle_id;
              break;
            }
          }
          break;
        case 'equipment':
          // Search through all equipment
          for (const equipment of selectedTask.equipments || []) {
            const found = equipment.checklists?.find(item => item[lookupField[type]] === checklistId);
            if (found) {
              checklist = found;
              // Use the correct reservation checklist ID field for equipment
              reservationItemId = checklist.reservation_checklist_equipment_id;
              break;
            }
          }
          break;

        default:
          console.error('Invalid checklist type:', type);
          return;
      }

      if (!checklist || !reservationItemId) {
        console.error('Checklist item not found:', { type, checklistId, checklist, reservationItemId });
        toast.error('Checklist item not found');
        return;
      }

      // For equipment, use the reservation_checklist_equipment_id directly
      const reservationChecklistId = type === 'equipment' ? reservationItemId : checklist[idMapping[type]];

      console.log('Updating checklist:', { 
        type, 
        checklistId, 
        reservationChecklistId, 
        value 
      });

      // Update the task status
      await updateTaskStatus(type, reservationChecklistId, value === "1" ? 1 : 0);

      // Update the local state to reflect the change
      setSelectedTask(prevData => {
        if (!prevData) return prevData;
        const updatedData = { ...prevData };

        // Helper function to update checklist items
        const updateChecklistItems = (items) => {
          if (!items) return [];
          return items.map(item => ({
            ...item,
            checklists: item.checklists?.map(cl => 
              cl[lookupField[type]] === checklistId 
                ? { ...cl, isChecked: value }
                : cl
            )
          }));
        };

        // Update the appropriate array based on type
        switch(type) {
          case 'venue':
            updatedData.venues = updateChecklistItems(updatedData.venues);
            break;
          case 'vehicle':
            updatedData.vehicles = updateChecklistItems(updatedData.vehicles);
            break;
          case 'equipment':
            updatedData.equipments = updateChecklistItems(updatedData.equipments);
            break;
        }

        return updatedData;
      });

      
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Error updating task');

      // Revert the checkbox state in case of error
      setSelectedTask(prevData => {
        if (!prevData) return prevData;
        const updatedData = { ...prevData };

        const revertChecklistItems = (items) => {
          if (!items) return [];
          return items.map(item => ({
            ...item,
            checklists: item.checklists?.map(cl => 
              cl[lookupField[type]] === checklistId 
                ? { ...cl, isChecked: "0" }
                : cl
            )
          }));
        };

        switch(type) {
          case 'venue':
            updatedData.venues = revertChecklistItems(updatedData.venues);
            break;
          case 'vehicle':
            updatedData.vehicles = revertChecklistItems(updatedData.vehicles);
            break;
          case 'equipment':
            updatedData.equipments = revertChecklistItems(updatedData.equipments);
            break;
        }

        return updatedData;
      });
    }
};

  const updateTaskStatus = async (type, id, isActive) => {
    try {
      const response = await axios.post(`${baseUrl}personnel.php`, {
        operation: 'updateTask',
        type: type,
        id: id,
        isActive: isActive
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
       
      } else {
        toast.error('Failed to update task');
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

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

  const fetchCompletedTasks = async () => {
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
      } else {
        setTasks([]);
        toast.info('No completed tasks found');
      }
    } catch (err) {
      setError('Failed to fetch completed tasks');
      console.error('Error:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'ongoing') {
      fetchPersonnelTasks();
    } else if (filter === 'completed') {
      fetchCompletedTasks();
    }
  }, [filter]);


  useEffect(() => {
    fetchPersonnelTasks();

  }, []); 

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
    <div className="flex min-h-screen bg-gray-50/50">
      <style>{styles}</style>
      <Sidebar />
      <div className="flex-1 p-3 sm:p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm pt-2 pb-4 mt-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                <div className="flex p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => setFilter('ongoing')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      filter === 'ongoing'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Ongoing
                  </button>
                  <button
                    onClick={() => setFilter('completed')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      filter === 'completed'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size="large"
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder="Search tasks by title"
                    allowClear
                    prefix={<SearchOutlined />}
                    size="large"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                    <tr>
                      <th scope="col" className="px-6 py-3" onClick={() => handleSort('reservation_id')}>
                        <div className="flex items-center cursor-pointer hover:text-gray-900">
                          ID
                          {sortField === 'reservation_id' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center">
                          Title
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center">
                          Start Date
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center">
                          End Date
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center">
                          Status
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center">
                          Progress
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
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
                            className={`bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                              String(task.reservation_id) === String(highlightedId) 
                                ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40 border-l-4 border-l-blue-500 animate-pulse-subtle relative' 
                                : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              {String(task.reservation_id) === String(highlightedId) && (
                                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                              )}
                              {task.reservation_id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FaEye className="mr-2 text-green-900" />
                                <span className="font-medium">{task.reservation_title}</span>
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
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 rounded-full"
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
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-green-500 rounded-full"
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
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-purple-500 rounded-full"
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
                                  className="bg-green-900 hover:bg-lime-900"
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
                              <span className="text-gray-500 dark:text-gray-400">
                                No tasks found
                              </span>
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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