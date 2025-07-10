import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SecureStorage } from '../../../utils/encryption';
import { FaList, FaMapMarkerAlt, FaCar, FaTools } from 'react-icons/fa';

const BASE_URL = SecureStorage.getLocalItem("url") || "http://localhost/coc/gsd/";

const ReturnConditionModal = ({ isOpen, onClose, onSubmit, isSubmitting, item, type }) => {
  const [selectedCondition, setSelectedCondition] = useState('');
  const [badQuantity, setBadQuantity] = useState('');
  const totalQuantity = parseInt(item?.quantity || 0);
  const isEquipmentConsumable = type === 'equipment_consumable';

  const handleSubmit = () => {
    if (!selectedCondition) {
      toast.error('Please select a return condition');
      return;
    }

    if (isEquipmentConsumable && selectedCondition !== 'good') {
      if (!badQuantity) {
        toast.error('Please specify the quantity of damaged/missing items');
        return;
      }
      
      // Calculate good quantity as remaining items
      const badQty = parseInt(badQuantity);
      const goodQty = totalQuantity - badQty;
      
      if (badQty > totalQuantity) {
        toast.error(`Bad quantity cannot exceed total quantity (${totalQuantity})`);
        return;
      }

      if (badQty < 0) {
        toast.error('Bad quantity cannot be negative');
        return;
      }

      onSubmit(selectedCondition, goodQty, badQty);
    } else if (isEquipmentConsumable) {
      // For 'good' condition, all items are in good condition
      onSubmit(selectedCondition, totalQuantity, 0);
    } else {
      // For non-equipment items (venues, vehicles), just submit the condition
      onSubmit(selectedCondition, null, null);
    }
  };

  const handleBadQuantityChange = (e) => {
    const value = e.target.value;
    if (value < 0) {
      setBadQuantity('0');
      return;
    }
    if (parseInt(value) > totalQuantity) {
      setBadQuantity(totalQuantity.toString());
      return;
    }
    setBadQuantity(value);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#fafff4] border border-gray-100 rounded-xl shadow-sm w-full max-w-sm"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Return Condition</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-lime-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">Please select the condition of the returned item:</p>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'good', label: 'Good', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                { value: 'damage', label: 'Damage', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                { value: 'missing', label: 'Missing', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' }
              ].map((condition) => (
                <button
                  key={condition.value}
                  onClick={() => setSelectedCondition(condition.value)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    selectedCondition === condition.value
                      ? 'border-lime-500 bg-lime-50'
                      : 'border-gray-200 hover:border-lime-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedCondition === condition.value
                      ? 'bg-lime-100 text-lime-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={condition.icon} />
                    </svg>
                  </div>
                  <span className={`font-medium ${
                    selectedCondition === condition.value
                      ? 'text-lime-700'
                      : 'text-gray-700'
                  }`}>
                    {condition.label}
                  </span>
                </button>
              ))}
            </div>

            {isEquipmentConsumable && selectedCondition !== 'good' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity {selectedCondition === 'damage' ? 'Damaged' : 'Missing'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={badQuantity}
                      onChange={handleBadQuantityChange}
                      placeholder="Enter quantity"
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                    <span className="text-sm text-gray-500">
                      of {totalQuantity} total
                    </span>
                  </div>
                </div>
                {badQuantity && (
                  <div className="bg-lime-50 p-3 rounded-lg">
                    <p className="text-sm text-lime-700">
                      Good quantity: {totalQuantity - parseInt(badQuantity || 0)} items
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedCondition || (isEquipmentConsumable && selectedCondition !== 'good' && !badQuantity)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${
                selectedCondition && (!isEquipmentConsumable || selectedCondition === 'good' || badQuantity)
                  ? 'bg-lime-600 hover:bg-lime-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Returning...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Confirm Return</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ChecklistModal = ({ isOpen, onClose, selectedTask, onTaskUpdate, refreshTasks }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [venueCondition, setVenueCondition] = useState('');
  const [vehicleCondition, setVehicleCondition] = useState('');
  const [equipmentCondition, setEquipmentCondition] = useState('');
  const [otherVenueCondition, setOtherVenueCondition] = useState('');
  const [otherVehicleCondition, setOtherVehicleCondition] = useState('');
  const [otherEquipmentCondition, setOtherEquipmentCondition] = useState('');
  const [equipmentDefectQty, setEquipmentDefectQty] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    venues: true,
    vehicles: true,
    equipment: true
  });
 
  const [selectedItemForReturn, setSelectedItemForReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

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

  const needsDefectQuantity = (conditionId) => {
    return ['3', '4'].includes(conditionId);
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
    return currentDate >= endDate;
  };

  const isAllChecklistsCompleted = (task) => {
    if (!task) return false;
    
    const venuesCompleted = task.venues?.every(venue => 
      venue.checklists?.every(item => item.isChecked === "1" || item.isChecked === 1) ?? true
    ) ?? true;
    
    const vehiclesCompleted = task.vehicles?.every(vehicle => 
      vehicle.checklists?.every(item => item.isChecked === "1" || item.isChecked === 1) ?? true
    ) ?? true;
    
    const equipmentsCompleted = task.equipments?.every(equipment => 
      equipment.checklists?.every(item => item.isChecked === "1" || item.isChecked === 1) ?? true
    ) ?? true;
    
    return venuesCompleted && vehiclesCompleted && equipmentsCompleted;
  };

  const areAllResourcesDone = (task) => {
    if (!task) return false;

    // Check if there are any resources at all
    const hasVenues = task.venues && task.venues.length > 0;
    const hasVehicles = task.vehicles && task.vehicles.length > 0;
    const hasEquipments = task.equipments && task.equipments.length > 0;

    // If no resources at all, return false
    if (!hasVenues && !hasVehicles && !hasEquipments) return false;

    // Check venues if they exist
    const venuesDone = !hasVenues || task.venues.every(venue => venue.active === -1);
    
    // Check vehicles if they exist
    const vehiclesDone = !hasVehicles || task.vehicles.every(vehicle => vehicle.active === -1);
    
    // Check equipment units if they exist
    const equipmentsDone = !hasEquipments || task.equipments.every(equipment => {
      // For consumable equipment (no units)
      if (!equipment.units || equipment.units.length === 0) {
        return equipment.active === -1;
      }
      // For equipment with units, check each unit
      return equipment.units.every(unit => unit.active === -1);
    });

    // Return true if all existing resource types are done
    return venuesDone && vehiclesDone && equipmentsDone;
  };

  const fetchConditions = async () => {
    try {
      const response = await axios.post(`${BASE_URL}fetchMaster.php`, new URLSearchParams({ operation: 'fetchConditions' }));
      if (response.data.status === 'success') {
        setConditions(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error fetching conditions');
    }
  };

  const handleChecklistUpdate = async (type, checklistId, value) => {
    try {
      let checklist = null;
      let reservationItemId = null;

      switch(type) {
        case 'venue':
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
          for (const equipment of selectedTask.equipments || []) {
            const found = equipment.checklists?.find(item => item[lookupField[type]] === checklistId);
            if (found) {
              checklist = found;
              reservationItemId = checklist.reservation_checklist_equipment_id;
              break;
            }
          }
          break;

        default:
          break;
      }

      if (!checklist || !reservationItemId) {
        toast.error('Checklist item not found');
        return;
      }

      const reservationChecklistId = type === 'equipment' ? reservationItemId : checklist[idMapping[type]];
      const newValue = checklist.isChecked === "1" || checklist.isChecked === 1 ? "0" : "1";

      // Update the local state first for immediate feedback
      onTaskUpdate(prevData => {
        if (!prevData) return prevData;
        const updatedData = { ...prevData };

        const updateChecklistItems = (items) => {
          if (!items) return [];
          return items.map(item => ({
            ...item,
            checklists: item.checklists?.map(cl => 
              cl[lookupField[type]] === checklistId 
                ? { ...cl, isChecked: newValue }
                : cl
            )
          }));
        };

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
          default:
            break;
        }

        return updatedData;
      });

      // Then update the backend
      const response = await axios.post(`${BASE_URL}personnel.php`, {
        operation: 'updateTask',
        type: type,
        id: reservationChecklistId,
        isActive: newValue === 1 ? 1 : 0
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status !== 'success') {
        toast.error('Failed to update task');
        throw new Error('Update failed');
      }

      if (refreshTasks) {
        refreshTasks();
      }
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Error updating task');
    }
  };


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

    // Check if all resources are done/returned
    if (!areAllResourcesDone(selectedTask)) {
      toast.error('All resources must be done or returned before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      const conditionsPayload = {
        operation: 'submitCondition',
        conditions: {}
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
        
        selectedTask.equipments.forEach(equipment => {
          if (equipment.reservation_equipment_id) {
            conditionsPayload.conditions.equipment.reservation_ids.push(equipment.reservation_equipment_id);
            conditionsPayload.conditions.equipment.condition_ids.push(equipmentCondition);
            conditionsPayload.conditions.equipment.other_reasons.push(equipmentCondition === '6' ? otherEquipmentCondition : null);
            conditionsPayload.conditions.equipment.qty_bad.push(needsDefectQuantity(equipmentCondition) ? (equipmentDefectQty || '0') : '0');
          }
        });
      }

      const conditionResponse = await axios.post(`${BASE_URL}personnel.php`, conditionsPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (conditionResponse.data.status === 'success') {
        const updateStatusPayload = {
          operation: 'updateReservationStatus',
          reservation_id: selectedTask.reservation_id
        };

        const statusResponse = await axios.post(`${BASE_URL}personnel.php`, updateStatusPayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (statusResponse.data.status === 'success') {
          toast.success('Task completed successfully');
          onClose();
          onTaskUpdate(null);
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

  const handleRelease = async (type, item) => {
    if (!item) {
      toast.error('Invalid item provided');
      return;
    }

    setIsReleasing(true);
    try {
      let reservationId;
      let resourceId;
      let quantity;

      switch(type) {
        case 'venue':
          reservationId = item.reservation_venue_id;
          resourceId = item.reservation_venue_venue_id;
          setVenueCondition('In Use');
          break;
        case 'vehicle':
          reservationId = item.reservation_vehicle_id;
          resourceId = item.reservation_vehicle_vehicle_id;
          setVehicleCondition('In Use');
          break;
        case 'equipment':
          reservationId = item.reservation_unit_id;
          resourceId = item.unit_id;
          setEquipmentCondition('In Use');
          break;
        case 'equipment_consumable':
          reservationId = item.reservation_equipment_id;
          resourceId = item.quantity_id;
          quantity = item.quantity;
          setEquipmentCondition('In Use');
          break;
        default:
          toast.error('Invalid type');
          return;
      }

      console.log('Release details:', {
        type,
        reservationId,
        resourceId,
        quantity,
        item
      });

      if (!reservationId || !resourceId) {
        toast.error('Invalid reservation or resource ID');
        return;
      }

      const payload = {
        operation: 'updateRelease',
        type: type,
        reservation_id: reservationId,
        resource_id: resourceId,
        ...(quantity && { quantity: quantity })
      };

      console.log('Release payload:', payload);

      const response = await axios.post(
        `${BASE_URL}personnel.php`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success(`Successfully released ${type}`);
        
        // Update the local state immediately to show checklists
        onTaskUpdate(prevTask => {
          if (!prevTask) return prevTask;

          const updatedTask = { ...prevTask };
          if (type === 'venue' && updatedTask.venues) {
            updatedTask.venues = updatedTask.venues.map(venue => 
              venue.reservation_venue_id === reservationId 
                ? { 
                    ...venue, 
                    availability_status: "In Use", 
                    active: 1,
                    is_released: 1
                  } 
                : venue
            );
          } else if (type === 'vehicle' && updatedTask.vehicles) {
            updatedTask.vehicles = updatedTask.vehicles.map(vehicle => 
              vehicle.reservation_vehicle_id === reservationId 
                ? { 
                    ...vehicle, 
                    availability_status: "In Use", 
                    active: 1,
                    is_released: 1
                  } 
                : vehicle
            );
          } else if (type === 'equipment' && updatedTask.equipments) {
            updatedTask.equipments = updatedTask.equipments.map(equipment => ({
              ...equipment,
              units: equipment.units?.map(unit => 
                unit.reservation_unit_id === reservationId 
                  ? { 
                      ...unit, 
                      availability_status: "In Use", 
                      active: 1,
                      is_released: 1
                    } 
                  : unit
              )
            }));
          } else if (type === 'equipment_consumable' && updatedTask.equipments) {
            updatedTask.equipments = updatedTask.equipments.map(equipment => 
              equipment.reservation_equipment_id === reservationId 
                ? { 
                    ...equipment, 
                    availability_status: "In Use", 
                    active: 1,
                    is_released: 1
                  } 
                : equipment
            );
          }
          return updatedTask;
        });

        // Refresh the task data
        if (refreshTasks) {
          await refreshTasks();
        }
      } else {
        toast.error(response.data.message || 'Failed to release');
      }
    } catch (error) {
      console.error('Error releasing:', error);
      toast.error('An error occurred while releasing');
    } finally {
      setIsReleasing(false);
    }
  };

  const canBeReleased = (item, type = null) => {
    if (!item) return {
      canRelease: false,
      message: "Invalid item"
    };
    
    // If active is -1, prevent any release
    if (item.active === -1) {
      return {
        canRelease: false,
        message: "This item is already done or returned"
      };
    }

    // Special case for Available Stock - always allow release
    if (item.availability_status === "Available Stock" && item.active === 0) {
      return {
        canRelease: true,
        message: ""
      };
    }
    
    // Check if the specific item is in use and not active
    if (item.availability_status === "In Use" && item.active === 0) {
      return {
        canRelease: false,
        message: "This item is currently in use"
      };
    }

    // For equipment units, check their individual status
    if (type === 'equipment' && item.availability_status === "In Use" && item.active === 0) {
      return {
        canRelease: false,
        message: "This unit is currently in use"
      };
    }

    return {
      canRelease: item.availability_status === "Available",
      message: ""
    };
  };

  const canBeReturned = (item, type) => {
    if (!item) return false;
    
    // If already returned, don't show return button
    if (item.is_returned === 1 || item.is_returned === "1") return false;
    
    // Check if the item is active
    const isActive = item.active === 1 || item.active === "1";
    
    // Get the end time and current time in Manila timezone (GMT+8)
    const endTime = new Date(selectedTask?.reservation_end_date);
    const currentTime = new Date();
    
    // Convert to Manila timezone
    const manilaEndTime = new Date(endTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const manilaCurrentTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    
    // For debugging
    console.log('Return conditions:', {
      item,
      isActive,
      manilaEndTime,
      manilaCurrentTime,
      isPastEndTime: manilaCurrentTime >= manilaEndTime
    });

    // Show return button only if item is active AND reservation has ended in Manila time
    return isActive && manilaCurrentTime >= manilaEndTime;
  };

  const isOverdue = (item) => {
    if (!selectedTask?.reservation_end_date) return false;
    
    const endTime = new Date(selectedTask.reservation_end_date);
    const currentTime = new Date();
    
    return currentTime >= endTime;
  };

  const handleReturnClick = (type, item) => {
    setSelectedItemForReturn({ type, item });
    setShowReturnModal(true);
  };

  const handleReturn = async (condition, goodQuantity, badQuantity) => {
    if (!selectedItemForReturn) return;

    const { type, item } = selectedItemForReturn;
    
    try {
      setIsSubmitting(true);

      let reservation_id;
      let resource_id;

      switch(type) {
        case 'venue':
          reservation_id = item.reservation_venue_id;
          resource_id = item.reservation_venue_venue_id;
          setVenueCondition(condition);
          if (condition === 'Other') {
            setOtherVenueCondition(condition);
          }
          break;
        case 'vehicle':
          reservation_id = item.reservation_vehicle_id;
          resource_id = item.reservation_vehicle_vehicle_id;
          setVehicleCondition(condition);
          if (condition === 'Other') {
            setOtherVehicleCondition(condition);
          }
          break;
        case 'equipment':
          reservation_id = item.reservation_unit_id;
          resource_id = item.unit_id;
          setEquipmentCondition(condition);
          if (condition === 'Other') {
            setOtherEquipmentCondition(condition);
          }
          break;
        case 'equipment_consumable':
          reservation_id = item.reservation_equipment_id;
          resource_id = item.quantity_id;
          setEquipmentCondition(condition);
          if (condition === 'Other') {
            setOtherEquipmentCondition(condition);
          }
          break;
        default:
          toast.error('Invalid type');
          return;
      }

      if (!reservation_id || !resource_id) {
        toast.error('No items found to return');
        return;
      }

      const payload = {
        operation: 'updateReturn',
        type: type,
        reservation_id: reservation_id,
        resource_id: resource_id,
        condition: condition,
        user_personnel_id: SecureStorage.getSessionItem('user_id')
      };

      // Add good and bad quantities for consumable equipment
      if (type === 'equipment_consumable') {
        payload.good_quantity = goodQuantity;
        payload.bad_quantity = badQuantity;
      }

      console.log('Return payload:', payload);

      const response = await axios.post(`${BASE_URL}personnel.php`, payload);

      if (response.data.status === 'success') {
        toast.success(`Successfully returned ${type}`);
        setShowReturnModal(false);
        setSelectedItemForReturn(null);
        
        // Update the local state
        onTaskUpdate(prev => {
          if (!prev) return prev;
          const updatedTask = { ...prev };
          
          switch(type) {
            case 'venue':
              updatedTask.venues = updatedTask.venues.map(venue => 
                venue.reservation_venue_id === reservation_id 
                  ? { ...venue, is_returned: '1', return_condition: condition }
                  : venue
              );
              break;
            case 'vehicle':
              updatedTask.vehicles = updatedTask.vehicles.map(vehicle => 
                vehicle.reservation_vehicle_id === reservation_id 
                  ? { ...vehicle, is_returned: '1', return_condition: condition }
                  : vehicle
              );
              break;
            case 'equipment':
              updatedTask.equipments = updatedTask.equipments.map(equipment => ({
                ...equipment,
                units: equipment.units?.map(unit => 
                  unit.reservation_unit_id === reservation_id 
                    ? { ...unit, is_returned: '1', return_condition: condition }
                    : unit
                )
              }));
              break;
            case 'equipment_consumable':
              updatedTask.equipments = updatedTask.equipments.map(equipment => 
                equipment.reservation_equipment_id === reservation_id 
                  ? { 
                      ...equipment, 
                      is_returned: '1', 
                      return_condition: condition,
                      good_quantity: goodQuantity,
                      bad_quantity: badQuantity
                    }
                  : equipment
              );
              break;
            default:
              break;
          }
          return updatedTask;
        });
      } else {
        toast.error(response.data.message || 'Failed to return');
      }
    } catch (error) {
      console.error('Error in handleReturn:', error);
      toast.error('Error returning resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReturnButton = (type, item) => {
    const isReturned = item.is_returned === '1' || item.is_returned === 1;
    
    if (isReturned) {
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-lg">
            Returned
          </span>
          {item.return_condition && (
            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg capitalize">
              {item.return_condition}
            </span>
          )}
        </div>
      );
    }
    
    return (
      <button
        onClick={() => handleReturnClick(type, item)}
        className="px-3 py-1.5 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 transition-colors flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Return
      </button>
    );
  };

  const renderChecklistItem = (item, type) => {
    const isChecked = item.isChecked === "1" || item.isChecked === 1;
    
    return (
      <motion.div
        key={item[`checklist_${type}_id`]}
        className="group relative bg-white/40 backdrop-blur-sm p-2.5 rounded-lg border border-gray-100/50 hover:border-lime-400/50 hover:shadow-sm transition-all duration-200"
        whileHover={{ scale: 1.002 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleChecklistUpdate(type, item[`checklist_${type}_id`])}
            className={`flex-shrink-0 w-4 h-4 rounded transition-all duration-200 ${
              isChecked 
                ? 'bg-lime-500 text-white' 
                : 'bg-white border-2 border-gray-300 hover:border-lime-400'
            }`}
          >
            <AnimatePresence mode="wait">
              {isChecked && (
                <motion.svg
                  key="checked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-full h-full p-px"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
          <div className="flex-1">
            <p className={`text-xs sm:text-sm ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {item.checklist_name || 'Unnamed Item'}
            </p>
            {isChecked && (
              <p className="text-xs text-green-600 mt-0.5">Completed</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSection = (title, content, sectionKey) => {
    console.log('Rendering section:', title);
    console.log('Selected task venues:', selectedTask?.venues);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/50 backdrop-blur rounded-lg overflow-hidden"
      >
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-lime-900 to-green-900 rounded-t-lg transition-colors group"
        >
          <span className="flex items-center gap-2">
            {title === 'Event Information' && <FaList className="text-white text-base" />}
            {title === 'Venues' && <FaMapMarkerAlt className="text-white text-base" />}
            {title === 'Vehicles' && <FaCar className="text-white text-base" />}
            {title === 'Equipment' && <FaTools className="text-white text-base" />}
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </span>
          <motion.svg
            animate={{ rotate: expandedSections[sectionKey] ? 180 : 0 }}
            className="w-3.5 h-3.5 text-white group-hover:text-lime-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
        <AnimatePresence>
          {expandedSections[sectionKey] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 space-y-2.5">
                {title === 'Event Information' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                        <p className="text-xs sm:text-sm text-gray-700">{selectedTask?.reservation_title}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                        <p className="text-xs sm:text-sm text-gray-700">{selectedTask?.reservation_description || 'No description provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                        <p className="text-xs sm:text-sm text-gray-700">{formatDateTime(selectedTask?.reservation_start_date)}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                        <p className="text-xs sm:text-sm text-gray-700">{formatDateTime(selectedTask?.reservation_end_date)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {title === 'Venues' && selectedTask?.venues?.map(venue => (
                  <div key={venue.reservation_venue_id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">{venue.name}</p>
                        {isOverdue(venue) && !venue.is_returned && (
                          <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const releaseStatus = canBeReleased(venue);
                          if (!releaseStatus.canRelease) {
                            return (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                {releaseStatus.message}
                              </span>
                            );
                          }
                          return (
                            <button
                              onClick={() => handleRelease('venue', venue)}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Releasing...' : 'Release'}
                            </button>
                          );
                        })()}
                        {canBeReturned(venue, 'venue') && !venue.is_returned && renderReturnButton('venue', venue)}
                      </div>
                    </div>
                    {/* Show venue checklists if in use and active */}
                    {venue.checklists?.length > 0 && venue.availability_status === "In Use" && venue.active === 1 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Checklist Items</h4>
                        {venue.checklists.map(item => renderChecklistItem(item, 'venue'))}
                      </div>
                    )}
                  </div>
                ))}
                
                {title === 'Vehicles' && selectedTask?.vehicles?.map(vehicle => (
                  <div key={vehicle.reservation_vehicle_id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">{vehicle.vehicle_license}</p>
                        {isOverdue(vehicle) && !vehicle.is_returned && (
                          <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const releaseStatus = canBeReleased(vehicle);
                          if (!releaseStatus.canRelease) {
                            return (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                {releaseStatus.message}
                              </span>
                            );
                          }
                          return (
                            <button
                              onClick={() => handleRelease('vehicle', vehicle)}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Releasing...' : 'Release'}
                            </button>
                          );
                        })()}
                        {canBeReturned(vehicle, 'vehicle') && !vehicle.is_returned && renderReturnButton('vehicle', vehicle)}
                      </div>
                    </div>
                    {/* Show vehicle checklists if in use and active */}
                    {vehicle.checklists?.length > 0 && vehicle.availability_status === "In Use" && vehicle.active === 1 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Checklist Items</h4>
                        {vehicle.checklists.map(item => renderChecklistItem(item, 'vehicle'))}
                      </div>
                    )}
                  </div>
                ))}
                
                {title === 'Equipment' && selectedTask?.equipments?.map((equipment, index) => (
                  <div key={equipment.reservation_equipment_id} className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-700 font-medium">{equipment.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          {selectedTask.equipments.length > 1 && (
                            <>
                             
                            </>
                          )}
                          <span>Quantity: {equipment.quantity || '0'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(!equipment.units || equipment.units.length === 0) ? (
                          // Show release button for consumable equipment
                          <>
                            {(() => {
                              const releaseStatus = canBeReleased(equipment);
                              if (!releaseStatus.canRelease) {
                                return (
                                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    {releaseStatus.message}
                                  </span>
                                );
                              }
                              return (
                                <button
                                  onClick={() => {
                                    console.log('Equipment data:', equipment); // Debug log
                                    handleRelease('equipment_consumable', {
                                      ...equipment,
                                      quantity_id: equipment.quantity_id // Ensure quantity_id is included
                                    });
                                  }}
                                  disabled={isSubmitting}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 disabled:opacity-50"
                                >
                                  {isSubmitting ? 'Releasing...' : 'Release'}
                                </button>
                              );
                            })()}
                            {equipment.active === 1 && canBeReturned(equipment, 'equipment_consumable') && !equipment.is_returned && 
                              renderReturnButton('equipment_consumable', equipment)}
                          </>
                        ) : (
                          // Show condition dropdown for non-consumable equipment with units
                          <>
                           
                            {equipmentCondition && needsDefectQuantity(equipmentCondition) && (
                              <input
                                type="number"
                                min="1"
                                value={equipmentDefectQty}
                                onChange={handleEquipmentDefectQtyChange}
                                placeholder="Qty"
                                className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white/80 backdrop-blur-sm focus:ring-1 focus:ring-lime-400 focus:border-lime-400 flex-1 min-w-[150px]"
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {/* Show equipment checklists if active */}
                    {equipment.checklists?.length > 0 && equipment.active === 1 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Checklist Items</h4>
                        {equipment.checklists.map((item) => renderChecklistItem(item, 'equipment'))}
                      </div>
                    )}
                    {equipment.units && equipment.units.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-400 mb-3">Units</h4>
                        <div className="space-y-2">
                          {(() => {
                            // Check if all units are in use and active
                            const allUnitsInUse = equipment.units.every(unit => 
                              unit.availability_status === "In Use" && unit.active === 1
                            );

                            // If all units are in use and active, show checklists at equipment level
                            if (allUnitsInUse && equipment.checklists?.length > 0) {
                              return (
                                <div className="space-y-3">
                                  <div className="bg-lime-50/50 p-3 rounded-lg border border-lime-100">
                                    <h4 className="text-xs font-medium text-lime-600 mb-2">Equipment Checklist Items (All Units In Use)</h4>
                                    <div className="space-y-2">
                                      {equipment.checklists.map((item) => renderChecklistItem(item, 'equipment'))}
                                    </div>
                                  </div>
                                  {equipment.units.map(unit => (
                                    <div key={unit.unit_id} className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-100">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm text-gray-600">SN: {unit.unit_serial_number}</span>
                                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-lime-100 text-lime-700">
                                            In Use
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {canBeReturned(unit, 'equipment') && !unit.is_returned && renderReturnButton('equipment', unit)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            // Otherwise show individual units with their own checklists
                            return equipment.units.map(unit => (
                              <div key={unit.unit_id} className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">SN: {unit.unit_serial_number}</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                      unit.availability_status === "In Use" && unit.active === 1
                                        ? 'bg-lime-100 text-lime-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {unit.availability_status === "In Use" && unit.active === 1 ? 'In Use' : 'Not In Use'}
                                    </span>
                                    {isOverdue(unit) && !unit.is_returned && (
                                      <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                                        Overdue
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const releaseStatus = canBeReleased(unit);
                                      if (!releaseStatus.canRelease) {
                                        return (
                                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                            {releaseStatus.message}
                                          </span>
                                        );
                                      }
                                      return (
                                        <button
                                          onClick={() => handleRelease('equipment', unit)}
                                          disabled={isSubmitting}
                                          className="px-3 py-1 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 disabled:opacity-50 transition-colors"
                                        >
                                          {isSubmitting ? 'Releasing...' : 'Release'}
                                        </button>
                                      );
                                    })()}
                                    {canBeReturned(unit, 'equipment') && !unit.is_returned && renderReturnButton('equipment', unit)}
                                  </div>
                                </div>
                                {/* Show unit checklists if in use and active */}
                                {unit.checklists?.length > 0 && unit.availability_status === "In Use" && unit.active === 1 && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <h4 className="text-xs font-medium text-gray-400 mb-2">Unit Checklist Items</h4>
                                    <div className="space-y-2">
                                      {unit.checklists.map((item) => renderChecklistItem(item, 'equipment'))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (isOpen) {
      fetchConditions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedTask) {
      console.log('Modal opened with task:', selectedTask);
      console.log('Venues:', selectedTask.venues);
      console.log('Venue statuses:', selectedTask.venues?.map(v => v.availability_status));
    }
  }, [isOpen, selectedTask]);

  if (!isOpen || !selectedTask) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#fafff4] border border-gray-100 rounded-xl shadow-sm w-full max-w-3xl max-h-[95vh] overflow-hidden"
        >
          {isReleasing ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-lime-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-700">Releasing items...</p>
            </div>
          ) : (
            <>
              <div className="sticky top-0 bg-gradient-to-r from-lime-900 to-green-900 px-4 py-3 border-b border-gray-100 z-10 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-white flex items-center">
                      <svg className="w-5 h-5 mr-2 text-lime-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" /></svg>
                      Task Details
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-lime-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(95vh-120px)]">
                {renderSection('Event Information', (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                        <p className="text-xs sm:text-sm text-gray-700">{selectedTask?.reservation_title}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                        <p className="text-xs sm:text-sm text-gray-700">{selectedTask?.reservation_description || 'No description provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                        <p className="text-xs sm:text-sm text-gray-700">{formatDateTime(selectedTask?.reservation_start_date)}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                        <p className="text-xs sm:text-sm text-gray-700">{formatDateTime(selectedTask?.reservation_end_date)}</p>
                      </div>
                    </div>
                  </div>
                ), 'info')}

                {selectedTask.venues?.length > 0 && renderSection('Venues', (
                  <div className="space-y-3">
                    {selectedTask.venues.map((venue, index) => (
                      <div key={venue.reservation_venue_id} className="bg-white/40 backdrop-blur-sm p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-700">{venue.name}</p>
                            {isOverdue(venue) && !venue.is_returned && (
                              <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const releaseStatus = canBeReleased(venue);
                              if (!releaseStatus.canRelease) {
                                return (
                                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    {releaseStatus.message}
                                  </span>
                                );
                              }
                              return (
                                <button
                                  onClick={() => handleRelease('venue', venue)}
                                  disabled={isSubmitting}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 disabled:opacity-50"
                                >
                                  {isSubmitting ? 'Releasing...' : 'Release'}
                                </button>
                              );
                            })()}
                            {canBeReturned(venue, 'venue') && !venue.is_returned && renderReturnButton('venue', venue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ), 'venues')}

                {selectedTask.vehicles?.length > 0 && renderSection('Vehicles', (
                  <div className="space-y-3">
                    {selectedTask.vehicles.map((vehicle, index) => (
                      <div key={vehicle.reservation_vehicle_id} className="bg-white/40 backdrop-blur-sm rounded-lg p-3 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-700 font-medium">{vehicle.vehicle_license}</p>
                        
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const releaseStatus = canBeReleased(vehicle);
                              if (!releaseStatus.canRelease) {
                                return (
                                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    {releaseStatus.message}
                                  </span>
                                );
                              }
                              return (
                                <button
                                  onClick={() => handleRelease('vehicle', vehicle)}
                                  disabled={isSubmitting}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 disabled:opacity-50"
                                >
                                  {isSubmitting ? 'Releasing...' : 'Release'}
                                </button>
                              );
                            })()}
                            {canBeReturned(vehicle, 'vehicle') && !vehicle.is_returned && renderReturnButton('vehicle', vehicle)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ), 'vehicles')}

                {selectedTask.equipments?.length > 0 && renderSection('Equipment', (
                  <div className="space-y-3">
                    {selectedTask.equipments.map((equipment, index) => (
                      <div key={equipment.reservation_equipment_id} className="bg-white/40 backdrop-blur-sm rounded-lg p-3 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-700 font-medium">{equipment.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                              {selectedTask.equipments.length > 1 && (
                                <>
                                  <span>Equipment {index + 1} of {selectedTask.equipments.length}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>Quantity: {equipment.quantity || '0'}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {(!equipment.units || equipment.units.length === 0) ? (
                              // Show release button for consumable equipment
                              <>
                                {(() => {
                                  const releaseStatus = canBeReleased(equipment);
                                  if (!releaseStatus.canRelease) {
                                    return (
                                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                        {releaseStatus.message}
                                      </span>
                                    );
                                  }
                                  return (
                                    <button
                                      onClick={() => {
                                        console.log('Equipment data:', equipment); // Debug log
                                        handleRelease('equipment_consumable', {
                                          ...equipment,
                                          quantity_id: equipment.quantity_id // Ensure quantity_id is included
                                        });
                                      }}
                                      disabled={isSubmitting}
                                      className="px-3 py-1.5 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 disabled:opacity-50"
                                    >
                                      {isSubmitting ? 'Releasing...' : 'Release'}
                                    </button>
                                  );
                                })()}
                                {equipment.active === 1 && canBeReturned(equipment, 'equipment_consumable') && !equipment.is_returned && 
                                  renderReturnButton('equipment_consumable', equipment)}
                              </>
                            ) : (
                              // Show condition dropdown for non-consumable equipment with units
                              <>
                              
                                {equipmentCondition && needsDefectQuantity(equipmentCondition) && (
                                  <input
                                    type="number"
                                    min="1"
                                    value={equipmentDefectQty}
                                    onChange={handleEquipmentDefectQtyChange}
                                    placeholder="Qty"
                                    className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white/80 backdrop-blur-sm focus:ring-1 focus:ring-lime-400 focus:border-lime-400 flex-1 min-w-[150px]"
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {/* Show equipment checklists if active */}
                        {equipment.checklists?.length > 0 && equipment.active === 1 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-400 mb-2">Checklist Items</h4>
                            {equipment.checklists.map((item) => renderChecklistItem(item, 'equipment'))}
                          </div>
                        )}
                        {equipment.units && equipment.units.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-medium text-gray-400 mb-3">Units</h4>
                            <div className="space-y-2">
                              {(() => {
                                // Check if all units are in use and active
                                const allUnitsInUse = equipment.units.every(unit => 
                                  unit.availability_status === "In Use" && unit.active === 1
                                );

                                // If all units are in use and active, show checklists at equipment level
                                if (allUnitsInUse && equipment.checklists?.length > 0) {
                                  return (
                                    <div className="space-y-3">
                                      <div className="bg-lime-50/50 p-3 rounded-lg border border-lime-100">
                                        <h4 className="text-xs font-medium text-lime-600 mb-2">Equipment Checklist Items (All Units In Use)</h4>
                                        <div className="space-y-2">
                                          {equipment.checklists.map((item) => renderChecklistItem(item, 'equipment'))}
                                        </div>
                                      </div>
                                      {equipment.units.map(unit => (
                                        <div key={unit.unit_id} className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-100">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <span className="text-sm text-gray-600">SN: {unit.unit_serial_number}</span>
                                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-lime-100 text-lime-700">
                                                In Use
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {canBeReturned(unit, 'equipment') && !unit.is_returned && renderReturnButton('equipment', unit)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }

                                // Otherwise show individual units with their own checklists
                                return equipment.units.map(unit => (
                                  <div key={unit.unit_id} className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">SN: {unit.unit_serial_number}</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                          unit.availability_status === "In Use" && unit.active === 1
                                            ? 'bg-lime-100 text-lime-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {unit.availability_status === "In Use" && unit.active === 1 ? 'In Use' : 'Not In Use'}
                                        </span>
                                        {isOverdue(unit) && !unit.is_returned && (
                                          <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                                            Overdue
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {(() => {
                                          const releaseStatus = canBeReleased(unit);
                                          if (!releaseStatus.canRelease) {
                                            return (
                                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                {releaseStatus.message}
                                              </span>
                                            );
                                          }
                                          return (
                                            <button
                                              onClick={() => handleRelease('equipment', unit)}
                                              disabled={isSubmitting}
                                              className="px-3 py-1 text-xs font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-600 disabled:opacity-50 transition-colors"
                                            >
                                              {isSubmitting ? 'Releasing...' : 'Release'}
                                            </button>
                                          );
                                        })()}
                                        {canBeReturned(unit, 'equipment') && !unit.is_returned && renderReturnButton('equipment', unit)}
                                      </div>
                                    </div>
                                    {/* Show unit checklists if in use and active */}
                                    {unit.checklists?.length > 0 && unit.availability_status === "In Use" && unit.active === 1 && (
                                      <div className="mt-3 pt-3 border-t border-gray-100">
                                        <h4 className="text-xs font-medium text-gray-400 mb-2">Unit Checklist Items</h4>
                                        <div className="space-y-2">
                                          {unit.checklists.map((item) => renderChecklistItem(item, 'equipment'))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ), 'equipment')}
              </div>

              <div className="sticky bottom-0 bg-white/70 backdrop-blur-sm px-4 py-3 border-t border-gray-100/80">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTask}
                    disabled={isSubmitting || !isTaskInProgress(selectedTask) || !isAllChecklistsCompleted(selectedTask) || !areAllResourcesDone(selectedTask)}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-colors
                      ${isTaskInProgress(selectedTask) && isAllChecklistsCompleted(selectedTask) && areAllResourcesDone(selectedTask)
                        ? 'bg-lime-500 hover:bg-lime-600'
                        : 'bg-gray-300 cursor-not-allowed'}
                      disabled:opacity-50`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mark Reservation As Done</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
      
      <ReturnConditionModal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setSelectedItemForReturn(null);
        }}
        onSubmit={handleReturn}
        isSubmitting={isSubmitting}
        item={selectedItemForReturn?.item}
        type={selectedItemForReturn?.type}
      />
    </>
  );
};

export default ChecklistModal;


