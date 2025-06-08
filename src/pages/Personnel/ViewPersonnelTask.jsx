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

const ViewPersonnelTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState('ongoing'); // 'ongoing' or 'completed'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [venueCondition, setVenueCondition] = useState('');
  const [vehicleCondition, setVehicleCondition] = useState('');
  const [equipmentCondition, setEquipmentCondition] = useState('');
  const [otherVenueCondition, setOtherVenueCondition] = useState('');
  const [otherVehicleCondition, setOtherVehicleCondition] = useState('');
  const [otherEquipmentCondition, setOtherEquipmentCondition] = useState('');
  const [equipmentDefectQty, setEquipmentDefectQty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('reservation_id');
  const [sortOrder, setSortOrder] = useState('desc');

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

  const handleEquipmentConditionChange = (e) => {
    const value = e.target.value;
    setEquipmentCondition(value);
    if (!needsDefectQuantity(value)) {
      setEquipmentDefectQty('');
    }
  };

  const handleEquipmentDefectQtyChange = (e) => {
    const value = e.target.value;
    const totalQuantity = selectedTask?.equipments?.[0]?.quantity || 0;

    if (value < 0) {
      setEquipmentDefectQty('0');
      return;
    }

    if (parseInt(value) > parseInt(totalQuantity)) {
      toast.error(`Defect quantity cannot exceed total quantity (${totalQuantity})`);
      setEquipmentDefectQty(totalQuantity.toString());
      return;
    }

    setEquipmentDefectQty(value);
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

  const isTaskInProgress = (task) => {
    if (!task || !task.reservation_end_date) return false;
    const currentDate = new Date();
    const endDate = new Date(task.reservation_end_date);
    return currentDate >= endDate;  // Changed from > to >= to allow submission exactly at end time
  };

  const isAllChecklistsCompleted = (task) => {
    if (!task) return false;
    
    // Check all venues checklists
    const venuesCompleted = task.venues?.every(venue => 
      venue.checklists?.every(item => item.isChecked === "1" || item.isChecked === 1) ?? true
    ) ?? true;
    
    // Check all vehicles checklists
    const vehiclesCompleted = task.vehicles?.every(vehicle => 
      vehicle.checklists?.every(item => item.isChecked === "1" || item.isChecked === 1) ?? true
    ) ?? true;
    
    // Check all equipments checklists
    const equipmentsCompleted = task.equipments?.every(equipment => 
      equipment.checklists?.every(item => item.isChecked === "1" || item.isChecked === 1) ?? true
    ) ?? true;
    
    return venuesCompleted && vehiclesCompleted && equipmentsCompleted;
  };

  const fetchConditions = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}fetchMaster.php`, new URLSearchParams({ operation: 'fetchConditions' }));
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
      const response = await axios.post(`${baseUrl}personnel.php`, {
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
        operation: 'fetchCompletedTask',
        personnel_id: SecureStorage.getSessionItem('user_id')
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
    if (venueCondition === 'Other' && !otherVenueCondition.trim()) {
      toast.error('Please specify the venue condition');
      return;
    }
    if (vehicleCondition === 'Other' && !otherVehicleCondition.trim()) {
      toast.error('Please specify the vehicle condition');
      return;
    }
    if (equipmentCondition === 'Other' && !otherEquipmentCondition.trim()) {
      toast.error('Please specify the equipment condition');
      return;
    }

    try {
      setIsSubmitting(true);
      const conditionsPayload = {
        operation: 'submitCondition',
        conditions: {}
      };

      const createConditionPayload = (selectedCondition, otherConditionText, reservationId, qty = '0') => {
        const conditionIds = [];
        const otherReasons = [];
        const qtyBad = [];

        if (selectedCondition) {
          conditionIds.push(selectedCondition);
          otherReasons.push(selectedCondition === '6' ? otherConditionText : null);
          qtyBad.push(selectedCondition === '2' ? '0' : (qty || '0'));
        }

        return {
          reservation_ids: [reservationId],
          condition_ids: conditionIds,
          other_reasons: otherReasons,
          qty_bad: qtyBad
        };
      };

      // Handle all venues
      if (selectedTask.venues && selectedTask.venues.length > 0 && venueCondition) {
        const venueConditionId = conditions.find(c => c.condition_name === venueCondition)?.id;
        
        conditionsPayload.conditions.venue = {
          reservation_ids: [],
          condition_ids: [],
          other_reasons: [],
          qty_bad: []
        };
        
        // Add each venue to the payload
        selectedTask.venues.forEach(venue => {
          if (venue.reservation_venue_id && venueConditionId) {
            conditionsPayload.conditions.venue.reservation_ids.push(venue.reservation_venue_id);
            conditionsPayload.conditions.venue.condition_ids.push(venueConditionId);
            conditionsPayload.conditions.venue.other_reasons.push(venueCondition === 'Other' ? otherVenueCondition : null);
            conditionsPayload.conditions.venue.qty_bad.push('0');
          }
        });
      }

      // Handle all vehicles
      if (selectedTask.vehicles && selectedTask.vehicles.length > 0 && vehicleCondition) {
        const vehicleConditionId = conditions.find(c => c.condition_name === vehicleCondition)?.id;
        
        conditionsPayload.conditions.vehicle = {
          reservation_ids: [],
          condition_ids: [],
          other_reasons: [],
          qty_bad: []
        };
        
        // Add each vehicle to the payload
        selectedTask.vehicles.forEach(vehicle => {
          if (vehicle.reservation_vehicle_id && vehicleConditionId) {
            conditionsPayload.conditions.vehicle.reservation_ids.push(vehicle.reservation_vehicle_id);
            conditionsPayload.conditions.vehicle.condition_ids.push(vehicleConditionId);
            conditionsPayload.conditions.vehicle.other_reasons.push(vehicleCondition === 'Other' ? otherVehicleCondition : null);
            conditionsPayload.conditions.vehicle.qty_bad.push('0');
          }
        });
      }

      // Handle all equipment
      if (selectedTask.equipments && selectedTask.equipments.length > 0 && equipmentCondition) {
        conditionsPayload.conditions.equipment = {
          reservation_ids: [],
          condition_ids: [],
          other_reasons: [],
          qty_bad: []
        };
        
        // Add each equipment to the payload
        selectedTask.equipments.forEach(equipment => {
          if (equipment.reservation_equipment_id) {
            conditionsPayload.conditions.equipment.reservation_ids.push(equipment.reservation_equipment_id);
            conditionsPayload.conditions.equipment.condition_ids.push(equipmentCondition);
            conditionsPayload.conditions.equipment.other_reasons.push(equipmentCondition === '6' ? otherEquipmentCondition : null);
            conditionsPayload.conditions.equipment.qty_bad.push(needsDefectQuantity(equipmentCondition) ? (equipmentDefectQty || '0') : '0');
          }
        });
      }

      const conditionResponse = await axios.post(`${baseUrl}personnel.php`, conditionsPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (conditionResponse.data.status === 'success') {
        const updateStatusPayload = {
          operation: 'updateReservationStatus',
          reservation_id: selectedTask.reservation_id
        };

        const statusResponse = await axios.post(`${baseUrl}personnel.php`, updateStatusPayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (statusResponse.data.status === 'success') {
          toast.success('Task completed successfully');
          setIsModalOpen(false);
          setSelectedTask(null);
          fetchPersonnelTasks();
        } else {
          toast.error('Failed to update reservation status');
        }
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
    fetchConditions();
  }, []);

  const canBeReleased = (task, type = null) => {
    if (!task) return false;
    return task.availability_status === "Available";
  };

  const canBeReturned = (task) => {
    // Check if task exists and has end date
    if (!task || !task.reservation_end_date) return false;
    
    // Don't allow return if already returned
    if (task.is_returned === 1 || task.is_returned === "1") return false;
    
    // Parse the end date and current date
    const endTime = new Date(task.reservation_end_date);
    const currentTime = new Date();

    // Check if current time is past the end time
    if (currentTime >= endTime) {
      // Check equipment units if they exist
      if (task.equipments && task.equipments.length > 0) {
        const allEquipmentReleased = task.equipments.every(equipment => 
          !equipment.units?.length || // If no units, consider it released
          equipment.units.every(unit => unit.is_released === 1 || unit.is_released === "1")
        );
        return allEquipmentReleased;
      }

      // Check venues if they exist
      if (task.venues && task.venues.length > 0) {
        return task.venues.every(venue => venue.is_released === 1 || venue.is_released === "1");
      }

      // Check vehicles if they exist
      if (task.vehicles && task.vehicles.length > 0) {
        return task.vehicles.every(vehicle => vehicle.is_released === 1 || vehicle.is_released === "1");
      }
    }
    
    return false;
  };

  const handleReturn = async (task) => {
    try {
      console.log('Return button clicked for task:', task);
      setIsSubmitting(true);

      // Determine type and ID based on what's in the task
      let type, reservation_id;

      if (task.equipments?.length > 0) {
        type = 'equipment';
        const firstEquipment = task.equipments[0];
        const firstUnit = firstEquipment.units?.[0];
        reservation_id = firstUnit?.reservation_unit_id;

        // Check if all equipment units are released
        const hasUnreleasedUnits = task.equipments.some(equipment => 
          equipment.units?.some(unit => unit.is_released !== 1 && unit.is_released !== "1")
        );
        if (hasUnreleasedUnits) {
          toast.error('All equipment units must be released before returning');
          return;
        }
      } else if (task.venues?.length > 0) {
        type = 'venue';
        reservation_id = task.venues[0].reservation_venue_id;
        
        // Check if all venues are released
        const hasUnreleasedVenues = task.venues.some(venue => 
          venue.is_released !== 1 && venue.is_released !== "1"
        );
        if (hasUnreleasedVenues) {
          toast.error('All venues must be released before returning');
          return;
        }
      } else if (task.vehicles?.length > 0) {
        type = 'vehicle';
        reservation_id = task.vehicles[0].reservation_vehicle_id;
        
        // Check if all vehicles are released
        const hasUnreleasedVehicles = task.vehicles.some(vehicle => 
          vehicle.is_released !== 1 && vehicle.is_released !== "1"
        );
        if (hasUnreleasedVehicles) {
          toast.error('All vehicles must be released before returning');
          return;
        }
      }

      if (!reservation_id) {
        toast.error('No items found to return');
        return;
      }

      const payload = {
        operation: 'updateReturn',
        type: type,
        reservation_id: reservation_id,
        status: 1,
      };

      console.log('Return payload:', payload);

      const response = await axios.post(`${baseUrl}personnel.php`, payload);

      if (response.data.status === 'success') {
        toast.success('Successfully returned');
        await fetchPersonnelTasks();
        setSelectedTask(prev => ({ ...prev, is_returned: '1' }));
      } else {
        toast.error(response.data.message || 'Failed to return');
      }
    } catch (error) {
      console.error('Error in handleReturn:', error);
      toast.error('Error returning reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async (type, item) => {
    if (!item) {
      toast.error('Invalid item provided');
      return;
    }

    setIsSubmitting(true);
    try {
      let reservationId;
      switch(type) {
        case 'venue':
          reservationId = item.reservation_venue_venue_id;
          break;
        case 'vehicle':
          reservationId = item.reservation_vehicle_vehicle_id;
          break;
        case 'equipment':
          reservationId = item.reservation_unit_id;
          break;
        default:
          toast.error('Invalid type');
          return;
      }

      if (!reservationId) {
        toast.error('Invalid reservation ID');
        return;
      }

      const payload = {
        operation: 'updateRelease',
        type: type,
        reservation_id: reservationId
      };

      const response = await axios.post(
        `${baseUrl}personnel.php`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success(`Successfully released ${type}`);
        // Refresh the task list to show updated status
        fetchPersonnelTasks();
        
        // Update local state if needed
        setSelectedTask(prevTask => {
          if (!prevTask) return prevTask;

          const updatedTask = { ...prevTask };
          if (type === 'venue' && updatedTask.venues) {
            updatedTask.venues = updatedTask.venues.map(venue => 
              venue.reservation_venue_venue_id === reservationId ? { ...venue, availability_status: 'In Use' } : venue
            );
          } else if (type === 'vehicle' && updatedTask.vehicles) {
            updatedTask.vehicles = updatedTask.vehicles.map(vehicle => 
              vehicle.reservation_vehicle_vehicle_id === reservationId ? { ...vehicle, availability_status: 'In Use' } : vehicle
            );
          } else if (type === 'equipment' && updatedTask.equipments) {
            updatedTask.equipments = updatedTask.equipments.map(equipment => ({
              ...equipment,
              units: equipment.units?.map(unit => 
                unit.reservation_unit_id === reservationId ? { ...unit, availability_status: 'In Use' } : unit
              )
            }));
          }
          return updatedTask;
        });
      } else {
        toast.error(response.data.message || 'Failed to release');
      }
    } catch (error) {
      console.error('Error releasing:', error);
      toast.error('An error occurred while releasing');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                            className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <td className="px-6 py-4">{task.reservation_id}</td>
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
                                {canBeReturned(task) && !task.is_returned && (
                                  <Button
                                    type="default"
                                    icon={<FaChartBar />}
                                    onClick={() => handleReturn(task)}
                                    size="middle"
                                    className="bg-green-50 hover:bg-green-100"
                                  />
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