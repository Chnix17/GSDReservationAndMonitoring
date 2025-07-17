import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Sidebar from './component/sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SecureStorage } from '../utils/encryption';

const ViewPersonnelTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState('ongoing'); // 'ongoing' or 'completed'
  const [conditions, setConditions] = useState([]);
  const [venueCondition, setVenueCondition] = useState('');
  const [vehicleCondition, setVehicleCondition] = useState('');
  const [equipmentCondition, setEquipmentCondition] = useState('');

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

  const isTaskInProgress = (task) => {
    if (!task || !task.reservation_end_date) return false;
    const currentDate = new Date();
    const endDate = new Date(task.reservation_end_date);
    return currentDate > endDate;  // Changed to only check if current time is past end time
  };

  const isAllChecklistsCompleted = (task) => {
    const venueCompleted = task.venue?.checklists?.every(item => item.isChecked === "1") ?? true;
    const vehicleCompleted = task.vehicle?.checklists?.every(item => item.isChecked === "1") ?? true;
    const equipmentCompleted = task.equipment?.checklists?.every(item => item.isChecked === "1") ?? true;
    return venueCompleted && vehicleCompleted && equipmentCompleted;
  };

      const fetchConditions = async () => {
          setLoading(true);
          try {
              const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', new URLSearchParams({ operation: 'fetchConditions' }));
              if (response.data.status === 'success') {
                  setConditions(response.data.data);
              } else {
                  toast.error(response.data.message);
              }
          } catch (error) {
              toast.error('Error fetching conditions');
          } finally {
              setLoading(false);
          }
      };

  const fetchPersonnelTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'fetchAssignedRelease',
        personnel_id: SecureStorage.getSessionItem('user_id')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const tasksWithFormattedDates = response.data.data.map(task => ({
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
    // Determine the correct ID field for the item
    const idMapping = {
      venue: 'reservation_checklist_venue_id',
      vehicle: 'reservation_checklist_vehicle_id',
      equipment: 'reservation_checklist_equipment_id'
    };

    const lookupField = {
      venue: 'checklist_venue_id',
      vehicle: 'checklist_vehicle_id',
      equipment: 'checklist_equipment_id'
    };

    // Find the checklist item using the original checklist ID
    const checklist = selectedTask[type]?.checklists?.find(
      item => item[lookupField[type]] === checklistId
    );

    if (!checklist) {
      console.error('Checklist item not found');
      return;
    }

    // Get the reservation checklist ID
    const reservationChecklistId = checklist[idMapping[type]];

    const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
      operation: 'updateTask',
      type: type,
      id: reservationChecklistId,
      isActive: value === "1" ? 1 : 0
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      // Update local state
      setSelectedTask(prevData => {
        if (!prevData) return prevData;
        const updatedData = { ...prevData };
        
        if (updatedData[type]?.checklists) {
          updatedData[type].checklists = updatedData[type].checklists.map(item =>
            item[lookupField[type]] === checklistId
              ? { ...item, isChecked: value }
              : item
          );
        }
        
        return updatedData;
      });
    } else {
      // Revert to unchecked state on failure
      setSelectedTask(prevData => {
        if (!prevData) return prevData;
        const updatedData = { ...prevData };
        
        if (updatedData[type]?.checklists) {
          updatedData[type].checklists = updatedData[type].checklists.map(item =>
            item[lookupField[type]] === checklistId
              ? { ...item, isChecked: "0" }
              : item
          );
        }
        
        return updatedData;
      });

      toast.error('Failed to update task');
    }
  } catch (err) {
    console.error('Error updating task:', err);
    toast.error('Error updating task');
  }
};

  const updateTaskStatus = async (type, id, isActive) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
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
        
        
        // Update modalTaskData immediately
        setSelectedTask(prevData => ({
          ...prevData,
          venue_tasks: prevData.venue_tasks?.map(task => 
            task.release_venue_id === id 
              ? { ...task, release_isActive: isActive }
              : task
          ) || [],
          vehicle_tasks: prevData.vehicle_tasks?.map(task => 
            task.release_vehicle_id === id 
              ? { ...task, release_isActive: isActive }
              : task
          ) || []
        }));

        // Refresh the main tasks list
        fetchPersonnelTasks();
      } else {
        toast.error('Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Error updating task');
    }
  };

  const handleModalOpen = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleRefresh = () => {
    fetchPersonnelTasks();
    toast.info('Refreshing tasks...');
  };
  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'fetchCompletedTask',
        personnel_id: localStorage.getItem('user_id')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.status === 'success') {
        setTasks(response.data.data || []);
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

  

const handleSubmitTask = async () => {
  // Check if we can submit the task
  if (!selectedTask || !isTaskInProgress(selectedTask)) {
    toast.error('This task can only be submitted during its scheduled time');
    return;
  }

  if (!isAllChecklistsCompleted(selectedTask)) {
    toast.error('Please complete all checklist items before submitting.');
    return;
  }

  try {
    setIsSubmitting(true);

    // Build conditions payload
    const conditionsPayload = {
      operation: 'submitCondition',
      conditions: {}
    };

    // Add venue conditions if venue exists and condition is selected
    if (selectedTask.venue && venueCondition) {
      const conditionId = conditions.find(c => c.condition_name === venueCondition)?.id;
      if (conditionId && selectedTask.venue.reservation_venue_id) {
        conditionsPayload.conditions.venue = {
          reservation_ids: [selectedTask.venue.reservation_venue_id],
          condition_ids: [conditionId]
        };
      }
    }

    // Add vehicle conditions if vehicle exists and condition is selected
    if (selectedTask.vehicle && vehicleCondition) {
      const conditionId = conditions.find(c => c.condition_name === vehicleCondition)?.id;
      if (conditionId && selectedTask.vehicle.reservation_vehicle_id) {
        conditionsPayload.conditions.vehicle = {
          reservation_ids: [selectedTask.vehicle.reservation_vehicle_id],
          condition_ids: [conditionId]
        };
      }
    }

    // Add equipment conditions if equipment exists and condition is selected
    if (selectedTask.equipment && equipmentCondition) {
      const conditionId = conditions.find(c => c.condition_name === equipmentCondition)?.id;
      if (conditionId && selectedTask.equipment.reservation_equipment_id) {
        conditionsPayload.conditions.equipment = {
          reservation_ids: [selectedTask.equipment.reservation_equipment_id],
          condition_ids: [conditionId]
        };
      }
    }

    // Check if at least one condition is selected
    if (Object.keys(conditionsPayload.conditions).length === 0) {
      toast.error('Please select at least one condition before submitting');
      return;
    }

    console.log('Submitting conditions:', conditionsPayload); // For debugging

    // Submit conditions
    const conditionResponse = await axios.post('http://localhost/coc/gsd/personnel.php', conditionsPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (conditionResponse.data.status === 'success') {
      // Update reservation status
      const updateStatusPayload = {
        operation: 'updateReservationStatus',
        reservation_id: selectedTask.reservation_id
      };

      const statusResponse = await axios.post('http://localhost/coc/gsd/personnel.php', updateStatusPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (statusResponse.data.status === 'success') {
        toast.success('Task completed successfully');
      } else {
        toast.error('Failed to update reservation status');
      }

      setIsModalOpen(false);
      setSelectedTask(null);
      fetchPersonnelTasks(); // Refresh the task list
    } else {
      toast.error(conditionResponse.data.message || 'Failed to submit task');
    }
  } catch (err) {
    console.error('Error submitting task:', err);
    toast.error('Error submitting task');
  } finally {
    setIsSubmitting(false);
  }
};

  const isAllTasksCompleted = (tasks) => {
    return tasks.every(task => task.release_isActive === '1');
  };

  useEffect(() => {
    fetchPersonnelTasks();
    fetchConditions(); // Add this line to fetch conditions
  }, []);

  // Calculate pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  // Calculate progress helper function
  const calculateProgress = (task) => {
    const items = task.venue_tasks?.length > 0 ? task.venue_tasks : task.vehicle_tasks;
    if (!items || items.length === 0) return 0;
    const completed = items.filter(item => item.release_isActive === '1').length;
    return Math.round((completed / items.length) * 100);
  };

  // Enhanced task card rendering with status
  const renderTaskCard = (task) => (
    <motion.div
      key={task.master_data?.checklist_id || task.reservation_title}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border border-gray-100"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start space-x-3">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
            {task.reservation_title || 'Untitled Task'}
          </h3>
          <div className="flex flex-col gap-2">
            <span className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full whitespace-nowrap">
              {task.venue?.name || task.vehicle?.vehicle_license || 'General Task'}
            </span>
            <span className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
              filter === 'completed' 
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {filter === 'completed' ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 text-sm text-gray-600">
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Starts: {task.formattedStartDate}</span>
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ends: {task.formattedEndDate}</span>
            </p>
          </div>
          {task.venue && <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {task.venue.name}
          </span>}
          {task.vehicle && <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            {task.vehicle.vehicle_license}
          </span>}
        </div>
        
        <button
          onClick={() => handleModalOpen(task)}
          className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
            filter === 'completed'
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
          }`}
        >
          <span>{filter === 'completed' ? 'View Details' : 'Manage Task'}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );

  const renderListItem = (task) => (
    <motion.div
      key={task.master_data?.checklist_id || task.reservation_title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm p-4 mb-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between"> 
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {task.reservation_title || 'Untitled Task'}
          </h3>
          <div className="flex flex-col gap-1">
            {task.venue && <p className="text-sm text-gray-500">Venue: {task.venue.name}</p>}
            {task.vehicle && <p className="text-sm text-gray-500">Vehicle: {task.vehicle.vehicle_license}</p>}
          </div>
        </div>
        <div className="flex items-center mt-2 md:mt-0 gap-3">
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
            {task.master_data.checklist_type || 'Task'}
          </span>
          {filter === 'completed' ? (
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              Completed
            </span>
          ) : (
            <button
              onClick={() => handleModalOpen(task)}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Manage
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Enhanced modal content
  const renderSubmitButton = () => {
    const canSubmit = selectedTask && 
      isTaskInProgress(selectedTask) && 
      isAllChecklistsCompleted(selectedTask);

    const getButtonTooltip = () => {
      if (!selectedTask) return '';
      if (!isTaskInProgress(selectedTask)) {
        return 'This task can only be submitted after the reservation time';
      }
      if (!isAllChecklistsCompleted(selectedTask)) {
        return 'Complete all checklist items before submitting';
      }
      return '';
    };

    return (
      <div className="flex justify-end gap-2 pt-3 border-t">
        <button
          onClick={() => setIsModalOpen(false)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <div className="relative" title={getButtonTooltip()}>
          <button
            onClick={handleSubmitTask}
            disabled={isSubmitting || !canSubmit}
            className={`px-3 py-1.5 text-sm font-medium text-white rounded-lg flex items-center gap-2
              ${canSubmit 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'}
              disabled:opacity-50`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderModalContent = () => (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
      <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
        {selectedTask ? (
          <div className="space-y-6">
            {/* Event Details Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Event Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Title</label>
                      <p className="mt-1 text-base text-gray-900">{selectedTask.reservation_title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Description</label>
                      <p className="mt-1 text-base text-gray-900">{selectedTask.reservation_description || 'No description provided'}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Start Date</label>
                        <p className="mt-1 text-base text-gray-900">{formatDateTime(selectedTask.reservation_start_date)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">End Date</label>
                        <p className="mt-1 text-base text-gray-900">{formatDateTime(selectedTask.reservation_end_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Requester Information</h3>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{selectedTask.user_details?.full_name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{selectedTask.user_details?.department || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{selectedTask.user_details?.role || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isTaskInProgress(selectedTask) && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-700">
                      This task can only be submitted during its scheduled time
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Checklists Sections */}
            {selectedTask.venue?.checklists?.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Venue Inspection</h3>
                    <p className="text-sm text-gray-500">Location: {selectedTask.venue.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={venueCondition}
                      onChange={(e) => setVenueCondition(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select condition</option>
                      {conditions.map((condition) => (
                        <option key={condition.id} value={condition.condition_name}>
                          {condition.condition_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedTask.venue.checklists.map((item) => (
                    <div key={item.checklist_venue_id} 
                         className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{item.checklist_name || 'Unnamed Item'}</p>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`venue-${item.checklist_venue_id}`}
                              value="1"
                              checked={item.isChecked === "1"}
                              onChange={() => handleChecklistUpdate('venue', item.checklist_venue_id, "1")}
                              className="form-radio h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-green-600">Pass</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`venue-${item.checklist_venue_id}`}
                              value="0"
                              checked={item.isChecked === "0"}
                              onChange={() => handleChecklistUpdate('venue', item.checklist_venue_id, "0")}
                              className="form-radio h-4 w-4 text-red-600 focus:ring-red-500"
                            />
                            <span className="ml-2 text-sm text-red-600">Fail</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar enhanced styling for Vehicle and Equipment sections */}
            {selectedTask.vehicle?.checklists?.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold">
                    Vehicle Inspection
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Condition:</label>
                    <select
                      value={vehicleCondition}
                      onChange={(e) => setVehicleCondition(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg p-1.5"
                    >
                      <option value="">Select condition</option>
                      {conditions.map((condition) => (
                        <option key={condition.id} value={condition.condition_name}>
                          {condition.condition_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedTask.vehicle.checklists.map((item) => (
                    <div key={item.checklist_vehicle_id} 
                         className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.checklist_name || 'Unnamed Item'}</p>
                        </div>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`vehicle-${item.checklist_vehicle_id}`}
                              value="1"
                              checked={item.isChecked === "1"}
                              onChange={() => handleChecklistUpdate('vehicle', item.checklist_vehicle_id, "1")}
                              className="form-radio h-4 w-4 text-green-600"
                            />
                            <span className="ml-2 text-sm text-green-600">Pass</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`vehicle-${item.checklist_vehicle_id}`}
                              value="0"
                              checked={item.isChecked === "0"}
                              onChange={() => handleChecklistUpdate('vehicle', item.checklist_vehicle_id, "0")}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2 text-sm text-red-600">Fail</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Checklist Section */}
            {selectedTask.equipment?.checklists?.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Equipment Inspection</h3>
                    <p className="text-sm text-gray-500">Equipment: {selectedTask.equipment.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={equipmentCondition}
                      onChange={(e) => setEquipmentCondition(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select condition</option>
                      {conditions.map((condition) => (
                        <option key={condition.id} value={condition.condition_name}>
                          {condition.condition_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedTask.equipment.checklists.map((item) => (
                    <div key={item.checklist_equipment_id} 
                         className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.checklist_name || 'Unnamed Item'}</p>
                        </div>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`equipment-${item.checklist_equipment_id}`}
                              value="1"
                              checked={item.isChecked === "1"}
                              onChange={() => handleChecklistUpdate('equipment', item.checklist_equipment_id, "1")}
                              className="form-radio h-4 w-4 text-green-600"
                            />
                            <span className="ml-2 text-sm text-green-600">Pass</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`equipment-${item.checklist_equipment_id}`}
                              value="0"
                              checked={item.isChecked === "0"}
                              onChange={() => handleChecklistUpdate('equipment', item.checklist_equipment_id, "0")}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2 text-sm text-red-600">Fail</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 14h.01M12 16h.01M12 18h.01M10 20h4a8 8 0 10-16 0h4a4 4 0 118 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Failed to load checklist details</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200">
        {renderSubmitButton()}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 p-3 sm:p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm pt-2 pb-4">
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
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="flex p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content grid with better responsive design */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4" 
              : "space-y-4"
            }>
              {currentTasks.map(task => viewMode === 'grid' ? renderTaskCard(task) : renderListItem(task))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded bg-white border disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded bg-white border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isModalOpen && selectedTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              >
                {renderModalContent()}
              </motion.div>
            )}
          </AnimatePresence>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </div>
    </div>
  );
};

export default ViewPersonnelTask;