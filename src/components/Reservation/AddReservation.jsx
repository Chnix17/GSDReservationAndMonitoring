import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {  TeamOutlined, PlusOutlined,  CheckCircleOutlined } from '@ant-design/icons';
import {  Form, Input, Card, Result,  Modal, Empty, Spin, Pagination, Drawer } from 'antd';
import { format } from 'date-fns';
import { BsTools,  } from 'react-icons/bs';
import { MdInventory } from 'react-icons/md';
import { SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';

import ReservationCalendar from './reservation_components/reservation_calendar';
import { Button as AntButton } from 'antd';
import { SecureStorage } from '../../utils/encryption';

import './StepIndicator.css';

// Import the new SelectType component at the top of the file
import SelectType from './reservation_components/select_type';

// Add missing component imports
import ResourceVenue from './reservation_components/resource/resource_venue';
import ResourceVehicle from './reservation_components/resource/resource_vehicle';
import ResourceEquipment from './reservation_components/resource/resource_equipment';

// Import the new form component
import BasicInformationForm from './reservation_components/form';
import ReviewSection from './reservation_components/review';

const fadeInAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: "easeInOut" }
};

const parseLooseJson = (data) => {
  if (data === null || data === undefined || data === 0 || data === '0') return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getLocationCategoryIdFromLocation = (loc) => (
  loc?.locCateg_id ??
  loc?.locCategId ??
  loc?.locCategID ??
  loc?.location_categoryId ??
  loc?.location_locCateg_id ??
  loc?.locationCategoryId ??
  loc?.locationCategoryID ??
  loc?.loc_category_id ??
  null
);



const AddReservation = () => {
  // Add encryptedUrl at the top of the component
  const encryptedUrl = SecureStorage.getLocalItem("url");

  const navigate = useNavigate();
  const location = useLocation();

  // Responsive breakpoints
  const isMobileDevice = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  // const [vehicleCategories, setVehicleCategories] = useState([]);
  // const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [resourceType, setResourceType] = useState(''); // 'vehicle', 'venue', or 'equipment'
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedVenueEquipment, setSelectedVenueEquipment] = useState({});
  const [equipmentQuantities, setEquipmentQuantities] = useState({});
  const [localEquipmentQuantities, setLocalEquipmentQuantities] = useState({ ...equipmentQuantities });

  // Add new state for calendar data
  const [calendarData, setCalendarData] = useState({
    reservations: [],
    holidays: [],
    equipmentAvailability: [],
    networkError: false
  });
  
  // Add state for immediate calendar locking
  const [isCalendarLocked, setIsCalendarLocked] = useState(false);

  const [formData, setFormData] = useState({
    startDate: null,
    endDate: null,
    selectedTime: null,
    eventTitle: '',
    description: '',
    participants: '',
    venues: [], 
    purpose: '',
    destination: '',
    owner: '', // Add owner field
    passengers: [],
    driverType: 'default',
    driverName: '',
    tripTicketDriver: null,
    driverShortage: false, // Flag to indicate driver shortage
    availableDrivers: 0, // Number of available drivers
    totalVehicles: 0, // Total number of vehicles
    additionalNote: '', // Add this line for additional note
    workRequestLocationCategoryId: '',
    workRequestLocationId: '',
    workRequestSubject: '',
    workRequestDescription: '',
    workRequestEndDate: null,
    workRequestImageFile: null,
  });

  const [workRequestLocationCategories, setWorkRequestLocationCategories] = useState([]);
  const [workRequestLocations, setWorkRequestLocations] = useState([]);
  const [workRequestLoading, setWorkRequestLoading] = useState(false);

  useEffect(() => {
    if (resourceType !== 'work_request') return;

    const fetchWorkRequestData = async () => {
      setWorkRequestLoading(true);
      try {
        const [categoriesRes, locationsRes] = await Promise.all([
          axios.post(
            `${encryptedUrl}/Admin.php`,
            { operation: 'getLocationCategory' },
            { headers: { 'Content-Type': 'application/json' } }
          ),
          axios.post(
            `${encryptedUrl}/Admin.php`,
            { operation: 'getAllLocation' },
            { headers: { 'Content-Type': 'application/json' } }
          )
        ]);

        setWorkRequestLocationCategories(parseLooseJson(categoriesRes.data));
        setWorkRequestLocations(parseLooseJson(locationsRes.data));
      } catch (error) {
        console.error('Error fetching work request data:', error);
        toast.error('Failed to load work request data');
      } finally {
        setWorkRequestLoading(false);
      }
    };

    fetchWorkRequestData();
  }, [resourceType, encryptedUrl]);

  const renderWorkRequestForm = () => {
    const categoryId = formData.workRequestLocationCategoryId;
    const filteredLocations = categoryId
      ? workRequestLocations.filter((loc) => String(getLocationCategoryIdFromLocation(loc) ?? '') === String(categoryId))
      : workRequestLocations;

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BsTools className="text-green-700" />
            <h3 className="text-lg font-semibold text-gray-900">Ticket Form</h3>
          </div>

          {workRequestLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spin />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Category</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.workRequestLocationCategoryId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        workRequestLocationCategoryId: value,
                        workRequestLocationId: ''
                      }));
                    }}
                  >
                    <option value="">Open this select menu</option>
                    {workRequestLocationCategories.map((c) => (
                      <option
                        key={String(c.locCateg_id ?? c.locCategId ?? c.locationCategoryId ?? '')}
                        value={String(c.locCateg_id ?? c.locCategId ?? c.locationCategoryId ?? '')}
                      >
                        {c.locCateg_name ?? c.locationCategoryName ?? c.name ?? 'Unnamed'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.workRequestLocationId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        workRequestLocationId: value
                      }));
                    }}
                    disabled={!formData.workRequestLocationCategoryId}
                  >
                    <option value="">Open this select menu</option>
                    {filteredLocations.map((l) => (
                      <option
                        key={String(l.location_id ?? l.locationId ?? l.id ?? '')}
                        value={String(l.location_id ?? l.locationId ?? l.id ?? '')}
                      >
                        {l.location_name ?? l.locationName ?? l.name ?? 'Unnamed'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Input
                  value={formData.workRequestSubject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, workRequestSubject: e.target.value }))}
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input.TextArea
                  value={formData.workRequestDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, workRequestDescription: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach Image (100KB - 1MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData((prev) => ({ ...prev, workRequestImageFile: file }));
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected finish date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={formData.workRequestEndDate ? format(new Date(formData.workRequestEndDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      workRequestEndDate: value ? new Date(value) : null
                    }));
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // State for per-venue participants
  const [venueParticipants, setVenueParticipants] = useState({});
  
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState(null);

  // Keep isMobile for backward compatibility with existing code
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  const [equipment, setEquipment] = useState([]);
  const [venues, setVenues] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Handle filter toggle for selected resources
  const handleFilterToggle = () => {
    setShowSelectedOnly(prev => !prev);
  };

  // Clean up selectedVenueEquipment when equipment data changes
  useEffect(() => {
    if ((resourceType === 'venue' || resourceType === 'vehicle') && 
        selectedVenueEquipment && 
        Object.keys(selectedVenueEquipment).length > 0 && 
        equipment?.length > 0) {
      
      const updatedEquipment = { ...selectedVenueEquipment };
      let hasChanges = false;
      let removedItems = [];
      
      // Check each selected equipment
      Object.entries(selectedVenueEquipment).forEach(([equipId, quantity]) => {
        const equip = equipment.find(e => 
          String(e.equip_id) === equipId || 
          String(e.equipment_id) === equipId
        );
        
        // If equipment doesn't exist or is unavailable, or quantity is <= 0, remove it
        if (!equip) {
          const itemName = `Equipment (ID: ${equipId})`;
          removedItems.push(`${itemName} - No longer available`);
          delete updatedEquipment[equipId];
          hasChanges = true;
        } 
        else if (quantity <= 0) {
          const itemName = equip.equip_name || equip.equipment_name || `Equipment (ID: ${equipId})`;
          removedItems.push(`${itemName} - Invalid quantity (${quantity})`);
          delete updatedEquipment[equipId];
          hasChanges = true;
        }
        // If quantity exceeds available, adjust it
        else if (quantity > (equip.available_quantity || 0)) {
          const itemName = equip.equip_name || equip.equipment_name || `Equipment (ID: ${equipId})`;
          removedItems.push(`${itemName} - Quantity reduced from ${quantity} to ${equip.available_quantity} (available)`);
          updatedEquipment[equipId] = equip.available_quantity || 0;
          hasChanges = true;
        }
      });

      // If there were changes, update the state and show toast
      if (hasChanges) {
        // Show toast with removed items
        if (removedItems.length > 0) {
          const message = (
            <div>
              <div>Some equipment was adjusted:</div>
              <ul className="mt-1 list-disc pl-4">
                {removedItems.map((item, idx) => (
                  <li key={idx} className="text-sm">{item}</li>
                ))}
              </ul>
            </div>
          );
          
          toast(message, {
            duration: 5000,
            icon: '⚠️',
            style: {
              maxWidth: '400px',
              padding: '12px 16px',
            },
          });
        }
        
        setSelectedVenueEquipment(updatedEquipment);
        setFormData(prev => ({
          ...prev,
          selectedVenueEquipment: updatedEquipment
        }));
      }
    }
  }, [equipment, resourceType, selectedVenueEquipment]);

  // Store request again data to apply after resources are loaded
  const [requestAgainDataPending, setRequestAgainDataPending] = useState(null);
  const [pendingEquipmentData, setPendingEquipmentData] = useState(null);

  // Handle request again data from navigation state
  useEffect(() => {
    if (location.state?.requestAgainData) {
      const { requestAgainData, type, skipToDateSelection } = location.state;
      
      console.log('Request Again Data:', requestAgainData);
      console.log('Type:', type);
      
      // Set the resource type
      setResourceType(type);
      
      // For equipment-only, set temporary dates so equipment can be fetched
      const tempDates = type === 'equipment' ? {
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      } : {};

      // Pre-fill form data with title, description, and other fields
      setFormData(prev => ({
        ...prev,
        eventTitle: requestAgainData.reservation_title || '',
        description: requestAgainData.reservation_description || '',
        participants: requestAgainData.participants || '',
        purpose: requestAgainData.purpose || '',
        destination: requestAgainData.destination || '',
        ...tempDates
      }));

      // Store the request again data to apply after resources are loaded
      setRequestAgainDataPending({ requestAgainData, type, skipToDateSelection });

      // Clear the navigation state to prevent re-processing
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Apply request again data after resources are loaded
  useEffect(() => {
    if (requestAgainDataPending && 
        ((requestAgainDataPending.type === 'venue' && venues.length > 0) ||
         (requestAgainDataPending.type === 'vehicle' && vehicles.length > 0) ||
         (requestAgainDataPending.type === 'equipment' && equipment.length > 0))) {
      
      const { requestAgainData, type, skipToDateSelection } = requestAgainDataPending;

      // Set selected resources based on type
      if (type === 'venue') {
        // Set venues if available - venue_id from reservation should match ven_id in fetched venues
        if (requestAgainData.venue_id && Array.isArray(requestAgainData.venue_id)) {
          const normalizedVenueIds = requestAgainData.venue_id
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id));
          setFormData(prev => ({ ...prev, venues: normalizedVenueIds }));
          console.log('Set venues for request again (after venues loaded):', normalizedVenueIds);
          console.log('Available venues:', venues.map(v => ({ ven_id: v.ven_id, name: v.ven_name })));
        }
        
        // Store equipment data for later matching (after dates are selected and equipment is fetched)
        if (requestAgainData.equipment_id && requestAgainData.quantity) {
          console.log('[Request Again - Venue] Storing equipment for later matching:', {
            equipment_ids: requestAgainData.equipment_id,
            quantities: requestAgainData.quantity
          });
          setPendingEquipmentData({
            equipment_ids: requestAgainData.equipment_id,
            quantities: requestAgainData.quantity,
            type: 'venue'
          });
        }
      } else if (type === 'vehicle') {
        // Set vehicles if available
        if (requestAgainData.vehicle_id && Array.isArray(requestAgainData.vehicle_id)) {
          const normalizedVehicleIds = requestAgainData.vehicle_id
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id));
          setSelectedModels(normalizedVehicleIds);
          console.log('Set vehicles (after vehicles loaded):', normalizedVehicleIds);
        }
        
        // Store equipment data for later matching (after dates are selected and equipment is fetched)
        if (requestAgainData.equipment_id && requestAgainData.quantity) {
          console.log('[Request Again - Vehicle] Storing equipment for later matching:', {
            equipment_ids: requestAgainData.equipment_id,
            quantities: requestAgainData.quantity
          });
          setPendingEquipmentData({
            equipment_ids: requestAgainData.equipment_id,
            quantities: requestAgainData.quantity,
            type: 'vehicle'
          });
        }
      } else if (type === 'equipment') {
        // Store equipment data for later matching (after dates are selected and equipment is fetched)
        if (requestAgainData.equipment_id && requestAgainData.quantity) {
          console.log('[Request Again - Equipment Only] Storing equipment data for later matching:', {
            equipment_ids: requestAgainData.equipment_id,
            quantities: requestAgainData.quantity
          });
          setPendingEquipmentData({
            equipment_ids: requestAgainData.equipment_id,
            quantities: requestAgainData.quantity,
            type: 'equipment'
          });
        }
      }

      // Skip to date selection step if requested - use setTimeout to ensure states are updated
      if (skipToDateSelection) {
        setTimeout(() => {
          console.log('[Request Again] Navigating to calendar (no equipment)');
          setCurrentStep(2);
        }, 100);
      } else {
        // If not skipping (has equipment), go to resource selection step
        setTimeout(() => {
          console.log('[Request Again] Staying on resource selection (has equipment)');
          setCurrentStep(1);
        }, 100);
      }

      // Clear the pending data
      setRequestAgainDataPending(null);
    }
  }, [requestAgainDataPending, venues, vehicles, equipment, selectedVenueEquipment, equipmentQuantities, localEquipmentQuantities, formData]);

  // Debug venue matching for request again functionality
  useEffect(() => {
    if (venues.length > 0 && formData.venues.length > 0) {
      console.log('Available venues:', venues.map(v => ({ ven_id: v.ven_id, name: v.ven_name })));
      console.log('Selected venue IDs:', formData.venues);
      const matchedVenues = venues.filter(v => formData.venues.includes(v.ven_id));
      console.log('Matched venues:', matchedVenues.map(v => ({ ven_id: v.ven_id, name: v.ven_name })));
    }
  }, [venues, formData.venues]);

  // Match pending equipment data after equipment is fetched
  useEffect(() => {
    if (pendingEquipmentData && equipment.length > 0) {
      console.log('[Equipment Matching] Starting to match pending equipment:', {
        pending: pendingEquipmentData,
        available_equipment_count: equipment.length
      });

      const equipmentData = {};
      const matchedEquipment = [];
      const notFoundEquipment = [];

      pendingEquipmentData.equipment_ids.forEach((id, index) => {
        const equipId = parseInt(id, 10);
        const qty = parseInt(pendingEquipmentData.quantities[index], 10) || 1;

        // Find equipment in fetched equipment list
        const foundEquip = equipment.find(e => 
          parseInt(e.equip_id, 10) === equipId || 
          parseInt(e.equipment_id, 10) === equipId
        );

        if (foundEquip) {
          equipmentData[equipId] = qty;
          matchedEquipment.push({
            id: equipId,
            name: foundEquip.equip_name || foundEquip.equipment_name,
            quantity: qty
          });
        } else {
          notFoundEquipment.push({ id: equipId, quantity: qty });
        }
      });

      console.log('[Equipment Matching] Results:', {
        matched: matchedEquipment,
        not_found: notFoundEquipment,
        equipmentData
      });

      // Only set equipment if we found matches
      if (Object.keys(equipmentData).length > 0) {
        // Update all equipment-related states for proper visibility
        setSelectedVenueEquipment(equipmentData);
        setEquipmentQuantities(equipmentData);
        setLocalEquipmentQuantities(equipmentData);
        // Also update formData for consistency
        setFormData(prev => ({
          ...prev,
          selectedVenueEquipment: equipmentData
        }));
        console.log('[Equipment Matching] Successfully set equipment states:', equipmentData);
      }

      // Show warning if some equipment not found
      if (notFoundEquipment.length > 0) {
        toast.warning(`Some equipment from the original reservation is no longer available (${notFoundEquipment.length} items)`);
      }

      // Clear pending data after matching
      setPendingEquipmentData(null);
    }
  }, [pendingEquipmentData, equipment]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add these new functions


const handleRemovePassenger = (passengerId) => {
  setFormData(prev => ({
    ...prev,
    passengers: prev.passengers.filter(p => p.id !== passengerId)
  }));
};


  useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
          const decryptedUserLevel = parseInt(encryptedUserLevel);
          console.log("this is encryptedUserLevel", encryptedUserLevel);
          if (decryptedUserLevel !== 3 && decryptedUserLevel !== 15 && decryptedUserLevel !== 16 && decryptedUserLevel !== 17 && decryptedUserLevel !== 18 && decryptedUserLevel !== 5 && decryptedUserLevel !== 6 && decryptedUserLevel !== 20) {
    
              navigate('/gsd');
          }
        } catch (error) {
          toast.error("An error occurred while fetching data.");
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [navigate]);

  


  


// Update useEffect to only handle date changes
useEffect(() => {
  console.log('Date change detected:', {
    startDate: formData.startDate,
    endDate: formData.endDate,
    resourceType: resourceType
  });
}, [formData.startDate, formData.endDate, resourceType]);
  

  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     try {
  //       const vehicleResponse = await axios.post(
  //         `${encryptedUrl}/fetch2.php`,
  //         new URLSearchParams({ operation: 'fetchVehicleCategories' })
  //       );
  //       if (vehicleResponse.data.status === 'success') {
  //         setVehicleCategories(vehicleResponse.data.data);
  //       }

  //       const equipResponse = await axios.post(
  //         `${encryptedUrl}/fetch2.php`,
  //         new URLSearchParams({ operation: 'fetchEquipmentCategories' })
  //       );
  //       if (equipResponse.data.status === 'success') {
  //         setEquipmentCategories(equipResponse.data.data);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching categories:', error);
  //     }
  //   };

  //   fetchCategories();
  // }, [encryptedUrl]);



const handleNext = async () => {
  if (!validateCurrentStep()) {
    return;
  }

  if (resourceType === 'work_request' && currentStep === 1) {
    const success = await handleAddReservation();
    if (success) {
      setCurrentStep(5);
    }
    return;
  }

  // Add console logging for selected resources
  if (currentStep === 1) {
    if (resourceType === 'venue') {
      console.log('Selected Venue IDs:', formData.venues);
    } else if (resourceType === 'vehicle') {
      console.log('Selected Vehicle IDs:', selectedModels);
    } else if (resourceType === 'equipment') {
      console.log('Selected Equipment IDs:', Object.entries(equipmentQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ id, quantity: qty }))
      );
    }
  }

  // For equipment selection, ensure the state is updated before moving to review
  if (currentStep === 3 && resourceType === 'venue') {
    // First update the equipment state
    const newEquipment = {};
    Object.entries(equipmentQuantities).forEach(([equipId, quantity]) => {
      if (quantity > 0) {
        newEquipment[equipId.toString()] = quantity;
      }
    });
    
    // Update the selected equipment state
    setSelectedVenueEquipment(newEquipment);
    
    // Use a callback to ensure state is updated before moving to next step
    setTimeout(() => {
      setCurrentStep(4);
    }, 0);
    return;
  }

  if (currentStep === 4) { // Review step
    const success = await handleAddReservation();
    if (success) {
      setCurrentStep(5); // Move to success state
      resetForm(); // Optional: reset form after successful submission
    }
    return;
  }

  setCurrentStep(prev => prev + 1);
};

// Update validateCurrentStep to check for complete date/time selection
const validateCurrentStep = () => {
  switch (currentStep) {
    case 0:
      if (!resourceType) {
        toast.error('Please select a resource type (Venue, Vehicle, Equipment, or Work Request)');
        return false;
      }
      return true;

    case 1:
      if (resourceType === 'work_request') {
        const subject = String(formData.workRequestSubject || '').trim();
        const locationCategoryId = formData.workRequestLocationCategoryId;
        const locationId = formData.workRequestLocationId;
        const endDate = formData.workRequestEndDate;

        if (!locationCategoryId || !locationId || !subject || !endDate) {
          toast.error('Please fill in all required work request fields');
          return false;
        }
        return true;
      }
      if (resourceType === 'venue' && (!formData.venues || formData.venues.length === 0)) {
        toast.error('Please select at least one venue');
        return false;
      }
      if (resourceType === 'vehicle' && selectedModels.length === 0) {
        toast.error('Please select at least one vehicle');
        return false;
      }
      if (resourceType === 'equipment' && Object.keys(equipmentQuantities).length === 0) {
        toast.error('Please select at least one equipment item');
        return false;
      }
      return true;

    case 2: // Calendar step
      if (!formData.startDate || !formData.endDate) {
        toast.error('Please select both start and end date/time');
        return false;
      }
      
      // Validate business hours (8 AM - 5 PM)
      const startHour = formData.startDate.getHours();
      const endHour = formData.endDate.getHours();
      if (startHour < 8 || startHour >= 17 || endHour < 8 || endHour >= 17) {
        toast.error('Please select times between 8 AM and 5 PM');
        return false;
      }

      // Validate that end time is after start time
      if (formData.endDate <= formData.startDate) {
        toast.error('End time must be after start time');
        return false;
      }
      
      return true;

    case 3:
      if (resourceType === 'venue') {
        if (!formData.eventTitle || !formData.description || formData.venues.length === 0) {
          toast.error('Please fill in all required venue reservation fields');
          return false;
        }
        // Whitespace validation for event title
        if (formData.eventTitle.trim() === '') {
          toast.error('Event title cannot contain only whitespace!');
          return false;
        }
        // Whitespace validation for description
        if (formData.description.trim() === '') {
          toast.error('Description cannot contain only whitespace!');
          return false;
        }
        // Whitespace validation for additional note (if provided)
        if (formData.additionalNote && formData.additionalNote.trim() === '') {
          toast.error('Additional note cannot contain only whitespace!');
          return false;
        }
        
        // Validate per-venue participants
        const selectedVenueIds = (formData.venues || [])
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
        
        if (selectedVenueIds.length === 0) {
          toast.error('Please select at least one venue');
          return false;
        }
        
        // Check each venue has participants entered
        for (const venueId of selectedVenueIds) {
          const venue = venues.find(v => parseInt(v.ven_id, 10) === venueId);
          if (!venue) continue;
          
          const participantCount = venueParticipants[venueId];
          const minCapacity = venue.ven_minimum || 1;
          const maxCapacity = venue.ven_occupancy || 0;
          
          // Check if participants entered
          if (!participantCount || participantCount === '' || parseInt(participantCount) <= 0) {
            toast.error(`Please enter number of participants for ${venue.ven_name}`);
            return false;
          }
          
          // Check minimum capacity
          if (parseInt(participantCount) < minCapacity) {
            toast.error(`${venue.ven_name} requires minimum ${minCapacity} participant${minCapacity > 1 ? 's' : ''}`);
            return false;
          }
          
          // Check maximum capacity
          if (maxCapacity > 0 && parseInt(participantCount) > maxCapacity) {
            toast.error(`${venue.ven_name} allows maximum ${maxCapacity} participant${maxCapacity > 1 ? 's' : ''}`);
            return false;
          }
        }
        
        return true;
      } else if (resourceType === 'equipment') {
        if (!formData.eventTitle || !formData.description) {
          toast.error('Please fill in all required equipment reservation fields');
          return false;
        }
        // Whitespace validation for title
        if (formData.eventTitle.trim() === '') {
          toast.error('Title cannot contain only whitespace!');
          return false;
        }
        // Whitespace validation for description
        if (formData.description.trim() === '') {
          toast.error('Description cannot contain only whitespace!');
          return false;
        }
        // Whitespace validation for additional note (if provided)
        if (formData.additionalNote && formData.additionalNote.trim() === '') {
          toast.error('Additional note cannot contain only whitespace!');
          return false;
        }
        return true;
      } else { // Vehicle validation
        if (!formData.purpose || !formData.purpose.trim()) {
          toast.error('Please enter a purpose');
          return false;
        }
        // Enhanced whitespace validation for purpose
        if (formData.purpose.trim() === '') {
          toast.error('Purpose cannot contain only whitespace!');
          return false;
        }
        if (!formData.destination || !formData.destination.trim()) {
          toast.error('Please enter a destination');
          return false;
        }
        // Enhanced whitespace validation for destination
        if (formData.destination.trim() === '') {
          toast.error('Destination cannot contain only whitespace!');
          return false;
        }
        // Whitespace validation for additional note (if provided)
        if (formData.additionalNote && formData.additionalNote.trim() === '') {
          toast.error('Additional note cannot contain only whitespace!');
          return false;
        }
        
        if (!formData.passengers || formData.passengers.length === 0) {
          toast.error('Please add at least one passenger');
          return false;
        }
        return true;
      }

    default:
      return true;
  }
};

const handleBack = () => {
  if (currentStep > 0) {
    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    
    // If going back from review step (step 4) to step 3, refetch and validate equipment
    if (currentStep === 4) {
      // Refetch equipment to get latest availability
      const refetchAndValidate = async () => {
        try {
          // Prepare the API payload with date range
          if (!formData.startDate || !formData.endDate) {
            // If no dates, just return without fetching
            return;
          }
          
          let start = formData.startDate;
          let end = formData.endDate;
          if (start && end && start > end) {
            [start, end] = [end, start];
          }
          const startDateTime = start ? format(start, 'yyyy-MM-dd HH:mm:ss') : format(new Date(), 'yyyy-MM-dd HH:mm:ss');
          const endDateTime = end ? format(end, 'yyyy-MM-dd HH:mm:ss') : format(new Date(), 'yyyy-MM-dd HH:mm:ss');
          
          const payload = {
            operation: 'fetchEquipments',
            startDateTime: startDateTime,
            endDateTime: endDateTime
          };

          const response = await axios({
            method: 'post',
            url: `${encryptedUrl}reservation.php`,
            headers: {
              'Content-Type': 'application/json'
            },
            data: payload
          });

          if (response.data.status === 'success') {
            const equipmentData = response.data.data || [];
            const transformedEquipment = equipmentData.map(item => ({
              ...item,
              available: item.available_quantity || 0,
              equip_name: item.equip_name || item.equipment_name || 'Equipment Name Not Available',
              equip_id: item.equip_id || item.equipment_id,
              category_name: item.category_name || '',
              equipments_category_id: item.equipments_category_id || item.equipment_category_id
            }));
            
            // Force update equipment state - clear first then set to ensure re-render
            setEquipment([]);
            
            // Use setTimeout to ensure state updates are processed
            setTimeout(() => {
              setEquipment(transformedEquipment);
              
              // Validate equipment quantities for equipment-only reservations
              if (resourceType === 'equipment') {
                const updatedQuantities = { ...equipmentQuantities };
                let hasChanges = false;
                let removedItems = [];

                Object.entries(equipmentQuantities).forEach(([equipId, quantity]) => {
                  const equip = transformedEquipment.find(e => 
                    String(e.equip_id) === equipId || 
                    String(e.equipment_id) === equipId
                  );

                  // If equipment doesn't exist or is unavailable
                  if (!equip) {
                    const itemName = `Equipment (ID: ${equipId})`;
                    removedItems.push(`${itemName} - No longer available`);
                    delete updatedQuantities[equipId];
                    hasChanges = true;
                  } 
                  else if (quantity <= 0) {
                    const itemName = equip.equip_name || equip.equipment_name || `Equipment (ID: ${equipId})`;
                    removedItems.push(`${itemName} - Invalid quantity (${quantity})`);
                    delete updatedQuantities[equipId];
                    hasChanges = true;
                  }
                  // If quantity exceeds available, adjust it
                  else if (quantity > (equip.available_quantity || 0)) {
                    const itemName = equip.equip_name || equip.equipment_name || `Equipment (ID: ${equipId})`;
                    removedItems.push(`${itemName} - Quantity reduced from ${quantity} to ${equip.available_quantity} (available)`);
                    updatedQuantities[equipId] = equip.available_quantity || 0;
                    hasChanges = true;
                  }
                });

                // If there were changes, update the state and show toast
                if (hasChanges) {
                  if (removedItems.length > 0) {
                    const message = (
                      <div>
                        <div>Some equipment was adjusted:</div>
                        <ul className="mt-1 list-disc pl-4">
                          {removedItems.map((item, idx) => (
                            <li key={idx} className="text-sm">{item}</li>
                          ))}
                        </ul>
                      </div>
                    );
                    
                    toast(message, {
                      duration: 5000,
                      icon: '⚠️',
                      style: {
                        maxWidth: '400px',
                        padding: '12px 16px',
                      },
                    });
                  }
                  
                  setEquipmentQuantities(updatedQuantities);
                  setLocalEquipmentQuantities(updatedQuantities);
                }
              }
              
              // For venue/vehicle with equipment, the existing useEffect will handle validation
            }, 0);
            
          } else {
            console.error('Failed to fetch equipment:', response.data);
            toast.error('Failed to verify equipment availability');
          }
        } catch (error) {
          console.error('Error fetching equipment:', error);
          toast.error('Failed to verify equipment availability');
        }
      };

      refetchAndValidate();
    }
    
    // If going back to step 0 (select resource type), clear all form data
    if (newStep === 0) {
      // Reset all form-related state
      setFormData({
        startDate: null,
        endDate: null,
        selectedTime: null,
        eventTitle: '',
        description: '',
        participants: '',
        venues: [],
        purpose: '',
        destination: '',
        owner: '', // Reset owner field
        passengers: [],
        driverType: 'default',
        driverName: '',
        tripTicketDriver: null,
        driverShortage: false
      });
      
      // Reset resource selection state
      setSelectedModels([]);
      setResourceType('');
      setSelectedCategory('all');
      setSelectedVenueEquipment({});
      setEquipmentQuantities({});
      setLocalEquipmentQuantities({});
      setVenueParticipants({}); // Reset per-venue participants
      
      // Reset modal states
      setShowEquipmentModal(false);
      setShowPassengerModal(false);
      
      // Reset calendar data
      setCalendarData({
        reservations: [],
        holidays: [],
        equipmentAvailability: []
      });
      
      // Reset driver-related state
      setAvailableDrivers([]);
   
      
      // Show confirmation toast
      toast.success('Form data cleared. You can start a new reservation.');
    }
  }
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};





const renderVenues = () => (
  <ResourceVenue
    selectedVenues={(formData.venues || [])
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))}
    onVenueSelect={(venueId) => {
      const id = parseInt(venueId, 10);
      if (isNaN(id)) return;
      setFormData(prev => {
        const prevIds = (prev.venues || [])
          .map(v => parseInt(v, 10))
          .filter(v => !isNaN(v));
        const exists = prevIds.includes(id);
        const nextIds = exists
          ? prevIds.filter(v => v !== id)
          : Array.from(new Set([...prevIds, id]));
        return { ...prev, venues: nextIds };
      });
    }}
    isMobile={isMobile}
    showSelectedOnly={showSelectedOnly}
    onFilterToggle={handleFilterToggle}
  />
);


// Modify renderResources to only show vehicles without equipment options
const renderResources = () => (
  <ResourceVehicle
    selectedVehicles={(selectedModels || [])
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))}
    onVehicleSelect={(vehicleId) => {
      const id = parseInt(vehicleId, 10);
      if (isNaN(id)) return;
      setSelectedModels(prevSelected => {
        const prevIds = (prevSelected || [])
          .map(v => parseInt(v, 10))
          .filter(v => !isNaN(v));
        const updated = prevIds.includes(id)
          ? prevIds.filter(v => v !== id)
          : Array.from(new Set([...prevIds, id]));
        console.log('Vehicle selection changed:', updated);
        return updated;
      });
    }}
    isMobile={isMobile}
    showSelectedOnly={showSelectedOnly}
    onFilterToggle={handleFilterToggle}
  />
);

// Replace the renderBasicInformation function with:
const renderBasicInformation = () => {
  console.log('renderBasicInformation: selectedModels', selectedModels);
  return (
    <>
      {formData.resourceType === 'vehicle' && selectedModels.length === 0 && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          <b>Warning:</b> No vehicles selected. Please select at least one vehicle to see driver options.
        </div>
      )}
      <BasicInformationForm
        formData={formData}
        handleInputChange={handleInputChange}
        isMobile={isMobile}
        showEquipmentModal={showEquipmentModal}
        setShowEquipmentModal={(show) => {
          if (show) setLocalEquipmentQuantities({ ...equipmentQuantities });
          setShowEquipmentModal(show);
        }}
        selectedVenueEquipment={selectedVenueEquipment}
        equipment={equipment}
        showPassengerModal={showPassengerModal}
        setShowPassengerModal={setShowPassengerModal}
        handleRemovePassenger={handleRemovePassenger}
        renderDriverDropdown={(sm, v, setFD) => {
          console.log('Calling renderDriverDropdown with:', sm, v);
          return renderDriverDropdown(sm, v, setFD);
        }}
        selectedModels={selectedModels}
        vehicles={vehicles}
        setFormData={setFormData}
        venues={venues} // Pass venues here
        venueParticipants={venueParticipants} // Pass per-venue participants
        setVenueParticipants={setVenueParticipants} // Pass setter function
      />
    </>
  );
};


// const checkResourceAvailability = async (resourceType, resourceIds, quantities = []) => {
//   try {
//     // Get availability information including existing reservations
//     const response = await axios.post(
//       `${encryptedUrl}/user.php`,
//       {
//         operation: 'fetchAvailability',
//         itemType: resourceType,
//         itemId: resourceIds,
//         ...(resourceType === 'equipment' && { quantity: quantities }),
//         startDateTime: format(formData.startDate, 'yyyy-MM-dd HH:mm:ss'),
//         endDateTime: format(formData.endDate, 'yyyy-MM-dd HH:mm:ss')
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     if (response.data.status !== 'success') {
//       throw new Error('Failed to check availability');
//     }

//     // Check for existing reservations with status_id = 1 in the response
//     const existingReservations = response.data.data.filter(item => 
//       item.reservation_status_status_id === 1 && 
//       item.reservation_start_date && 
//       item.reservation_end_date
//     );

//     // If there are existing reservations with status_id 1, check for overlaps
//     if (existingReservations.length > 0) {
//       const selectedStart = new Date(formData.startDate);
//       const selectedEnd = new Date(formData.endDate);
      
//       // Check if the selected date range overlaps with any existing reservation
//       const hasOverlap = existingReservations.some(reservation => {
//         const resStart = new Date(reservation.reservation_start_date);
//         const resEnd = new Date(reservation.reservation_end_date);
        
//         // Check for overlap
//         return (
//           (selectedStart >= resStart && selectedStart < resEnd) || // New start is during existing reservation
//           (selectedEnd > resStart && selectedEnd <= resEnd) ||    // New end is during existing reservation
//           (selectedStart <= resStart && selectedEnd >= resEnd)     // New range completely contains existing reservation
//         );
//       });

//       if (hasOverlap) {
//         return {
//           isAvailable: false,
//           unavailableItems: [{
//             message: 'The selected date range overlaps with an existing active reservation.'
//           }]
//         };
//       }
//     }

//     // Check if any items are not available based on quantity or availability
//     const unavailableItems = response.data.data.filter(item => {
//       if (resourceType === 'equipment') {
//         return item.available_quantity < (quantities[resourceIds.indexOf(item.equip_id)] || 0);
//       }
//       return !item.is_available;
//     });

//     return {
//       isAvailable: unavailableItems.length === 0,
//       unavailableItems
//     };
//   } catch (error) {
//     console.error('Error checking availability:', error);
//     throw error;
//   }
// };

const handleAddReservation = async () => {
  try {
    setLoading(true);
    const userId = SecureStorage.getLocalItem('user_id');

    if (resourceType === 'work_request') {
      const subject = String(formData.workRequestSubject || '').trim();
      const description = String(formData.workRequestDescription || '').trim();
      const locationCategoryId = formData.workRequestLocationCategoryId;
      const locationId = formData.workRequestLocationId;
      const endDate = formData.workRequestEndDate
        ? format(new Date(formData.workRequestEndDate), 'yyyy-MM-dd')
        : null;

      if (!subject || !locationCategoryId || !locationId || !endDate) {
        toast.error('Please fill in all required work request fields');
        return false;
      }

      const payload = {
        subject,
        description,
        clientId: userId,
        userId: userId,
        locationId,
        locationCategoryId,
        endDate,
      };

      const requestBody = new FormData();
      requestBody.append('operation', 'addComplaint');
      requestBody.append('json', JSON.stringify(payload));
      if (formData.workRequestImageFile instanceof File) {
        requestBody.append('image', formData.workRequestImageFile);
      }

      const response = await axios.post(
        `${encryptedUrl}/faculty&staff.php`,
        requestBody,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const result = response.data;
      const numericResult = typeof result === 'string' && /^\d+$/.test(result)
        ? parseInt(result, 10)
        : (typeof result === 'number' ? result : null);

      if (numericResult === 1) {
        toast.success('Work request submitted successfully!');
        setCurrentStep(5);
        return true;
      }
      if (numericResult === 2) {
        toast.error('Invalid image type. Please upload JPG, PNG, GIF, or WEBP.');
        return false;
      }
      if (numericResult === 3) {
        toast.error('Image upload failed. Please try again.');
        return false;
      }
      if (numericResult === 4) {
        toast.error('Image is too large. Maximum allowed is 1MB.');
        return false;
      }
      if (numericResult === 5) {
        toast.error('Expected finish date cannot be earlier than today.');
        return false;
      }

      if (result?.status === 'success') {
        toast.success('Work request submitted successfully!');
        setCurrentStep(5);
        return true;
      }

      throw new Error(result?.message || 'Failed to submit work request');
    }

    // Common validation for dates
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return false;
    }

    if (resourceType === 'venue') {
      if (!formData.eventTitle || !formData.description || formData.venues.length === 0) {
        toast.error('Please fill in all required venue reservation fields');
        return false;
      }

      console.log('[Venue Submission] Current state:', {
        selectedVenueEquipment,
        equipmentQuantities,
        formData_selectedVenueEquipment: formData.selectedVenueEquipment
      });

      // Map venues with their participant counts
      const venuesWithParticipants = formData.venues.map(venueId => ({
        venue_id: venueId,
        participants: parseInt(venueParticipants[venueId]) || 0
      }));

      const venuePayload = {
        operation: 'venuereservation',
        form_data: {
          title: formData.eventTitle.trim(),
          description: formData.description.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          user_id: userId,
          venues: venuesWithParticipants, // Now includes participants per venue
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: equipId,
            quantity: parseInt(quantity)
          })).filter(item => item.quantity > 0),
          additional_note: formData.additionalNote || '',
        }
      };

      console.log('[Venue Submission] Payload:', JSON.stringify(venuePayload, null, 2));

      // Proceed with venue reservation
      const response = await axios.post(
        `${encryptedUrl}/faculty&staff.php`,
        venuePayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Venue reservation submitted successfully!');
        setCurrentStep(5);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to submit venue reservation');
      }

    } else if (resourceType === 'vehicle') {
      if (!selectedModels || selectedModels.length === 0) {
        toast.error('Please select at least one vehicle');
        return false;
      }
      if (!formData.purpose || !formData.destination) {
        toast.error('Please fill in both purpose and destination');
        return false;
      }
      if (!formData.passengers || formData.passengers.length === 0) {
        toast.error('Please add at least one passenger');
        return false;
      }

      console.log('[Vehicle Submission] Current state:', {
        selectedVenueEquipment,
        equipmentQuantities,
        formData_selectedVenueEquipment: formData.selectedVenueEquipment
      });

      // Drivers will always be null - admin will assign during approval
      const vehiclePayload = {
        operation: 'vehicleReservation',
        form_data: {
          destination: formData.destination.trim(),
          purpose: formData.purpose.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          user_id: userId,
          vehicles: selectedModels,
          passengers: formData.passengers.map(p => p.name.trim()),
          drivers: null, // Always null - admin assigns during approval
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: equipId,
            quantity: parseInt(quantity)
          })).filter(item => item.quantity > 0),
          additional_note: formData.additionalNote || '', // Add this line
        }
      };

      console.log('[Vehicle Submission] Payload:', JSON.stringify(vehiclePayload, null, 2));

      // Proceed with vehicle reservation
      const response = await axios.post(
        `${encryptedUrl}/faculty&staff.php`,
        vehiclePayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Vehicle reservation submitted successfully!');
        setCurrentStep(5);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to submit vehicle reservation');
      }

    } else if (resourceType === 'equipment') {
      // Equipment specific validation
      if (!formData.eventTitle || !formData.description) {
        toast.error('Please fill in all required equipment reservation fields');
        return false;
      }

      // Check if any equipment is selected for equipment reservation
      const selectedEquipment = Object.entries(equipmentQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({
          equipment_id: parseInt(id),
          quantity: parseInt(qty)
        }));

      if (selectedEquipment.length === 0) {
        toast.error('Please select at least one equipment item');
        return false;
      }

      const equipmentPayload = {
        operation: 'equipmentreservation',
        form_data: {
          title: formData.eventTitle.trim(),
          description: formData.description.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          user_id: userId,
          participants: formData.participants ? formData.participants.toString() : "0",
          equipment: selectedEquipment,
          additional_note: formData.additionalNote || '', // Add this line
        }
      };

      console.log('Equipment Payload:', JSON.stringify(equipmentPayload, null, 2));

      // Proceed with equipment reservation
      const response = await axios.post(
        `${encryptedUrl}/faculty&staff.php`,
        equipmentPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Equipment Response:', response.data);

      if (response.data.status === 'success') {
        toast.success('Equipment reservation submitted successfully!');
        setCurrentStep(5);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to submit equipment reservation');
      }
    }
  } catch (error) {
    console.error('Submission error:', error);
    if (error.message === 'Network Error' || error.name === 'TypeError') {
      toast.error('Network connection lost. Please check your internet connection.');
    } else {
      // Check if error message contains conflict details (starts with "The following resources have conflicts:")
      const errorMsg = error.message || 'An error occurred while submitting the reservation';
      if (errorMsg.includes('The following resources have conflicts:')) {
        // Parse and display in modal
        setConflictDetails(errorMsg);
        setShowConflictModal(true);
      } else {
        // Show regular toast for other errors
        toast.error(errorMsg);
      }
    }
    return false;
  } finally {
    setLoading(false);
  }
};



const resetForm = () => {
  // Reset all form-related state
  setFormData({
    startDate: null,
    endDate: null,
    selectedTime: null,
    eventTitle: '',
    description: '',
    participants: '',
    venues: [], 
    purpose: '',
    destination: '',
    owner: '', // Reset owner field
    passengers: [],
    driverType: 'default',
    driverName: '',
    tripTicketDriver: null,
    driverShortage: false,
    availableDrivers: 0,
    totalVehicles: 0,
    additionalNote: '', // Add this line for reset
    workRequestLocationCategoryId: '',
    workRequestLocationId: '',
    workRequestSubject: '',
    workRequestDescription: '',
    workRequestEndDate: null,
    workRequestImageFile: null,
  });
  
  // Reset resource selection state
  setSelectedModels([]);
  setResourceType('');
  setSelectedCategory('all');
  setSelectedVenueEquipment({});
  setEquipmentQuantities({});
  setLocalEquipmentQuantities({});
  
  // Reset modal states
  setShowEquipmentModal(false);
  setShowPassengerModal(false);
  
  // Reset calendar data
  setCalendarData({
    reservations: [],
    holidays: [],
    equipmentAvailability: []
  });
  
  // Reset driver-related state
  setAvailableDrivers([]);
  
  
  // Reset step to 0 (resource type selection) so user can select a new resource type
  setCurrentStep(0);
  
  // Show confirmation toast
  toast.success('Form reset successfully. You can start a new reservation.');
};



const renderReviewSection = () => {
  const selectedVenueIds = (formData.venues || [])
    .map(id => parseInt(id, 10))
    .filter(id => !isNaN(id));
  const selectedVenues = venues.filter(v => selectedVenueIds.includes(parseInt(v.ven_id, 10)));
  const selectedVehicleDetails = vehicles.filter(v => selectedModels.includes(v.vehicle_id));

  // Add debug logging for equipment
  console.log('Selected Equipment in AddReservation:', {
    selectedVenueEquipment,
    equipmentQuantities,
    equipment,
    formData
  });

  // Add debug logging for dates
  console.log('Date debugging in renderReviewSection:', {
    startDate: formData.startDate,
    endDate: formData.endDate,
    startDateType: typeof formData.startDate,
    endDateType: typeof formData.endDate,
    startDateInstance: formData.startDate instanceof Date,
    endDateInstance: formData.endDate instanceof Date,
    currentStep
  });

  return (
    <ReviewSection
      formData={formData}
      selectedVenues={selectedVenues}
      selectedVehicleDetails={selectedVehicleDetails}
      selectedVenueEquipment={selectedVenueEquipment}
      equipmentQuantities={equipmentQuantities}
      equipment={equipment}
      isMobile={isMobile}
      loading={loading}
      handleBack={handleBack}
      handleAddReservation={handleAddReservation}
      handlePrintRequest={handlePrintRequest}
      availableDrivers={availableDrivers}
    />
  );
};


// const handleVehicleSelect = (vehicleId) => {
//   const id = parseInt(vehicleId, 10);
//   if (isNaN(id)) return;
//   setSelectedModels(prevSelected => {
//     const prevIds = (prevSelected || [])
//       .map(v => parseInt(v, 10))
//       .filter(v => !isNaN(v));
//     const updated = prevIds.includes(id)
//       ? prevIds.filter(v => v !== id)
//       : Array.from(new Set([...prevIds, id]));
//     console.log('Vehicle selection changed:', updated);
//     return updated;
//   });
// };



// Enhanced success state with better visuals
const renderSuccessState = () => (
  <motion.div
    {...fadeInAnimation}
    className="min-h-[400px] flex items-center justify-center"
  >
    <Result
      status="success"
      title={resourceType === 'work_request' ? 'Work Request Submitted!' : 'Reservation Successfully Created!'}
      subTitle={resourceType === 'work_request'
        ? "Your work request has been submitted. You'll receive updates as it is processed."
        : "Your reservation has been submitted and is pending approval. You'll receive a notification once it's approved."}
      extra={[
       
        <AntButton 
          key="new" 
          onClick={resetForm}
          icon={<PlusOutlined />}
        >
          {resourceType === 'work_request' ? 'Create Another Work Request' : 'Create Another Reservation'}
        </AntButton>,
      ]}
    />
  </motion.div>
);



// Update the step content rendering to change the order
const renderStepContent = () => {
  const steps = {
    0: () => (
      <SelectType 
        resourceType={resourceType}
        onResourceTypeSelect={(type) => {
          setResourceType(type);
        }}
        onStepAdvance={() => {
          // Automatically advance to step 1 (resource selection)
          setCurrentStep(1);
    
        }}
      />
    ),
    1: () => {
      // If no resource type is selected, show the resource type selection
      if (!resourceType) {
        return (
          <SelectType 
            resourceType={resourceType}
            onResourceTypeSelect={(type) => {
              setResourceType(type);
            }}
            onStepAdvance={() => {
              // Automatically advance to step 1 (resource selection)
              setCurrentStep(1);
            }}
          />
        );
      }
      
      if (resourceType === 'work_request') {
        return renderWorkRequestForm();
      }

      if (resourceType === 'venue') {
        return renderVenues();
      } else if (resourceType === 'vehicle') {
        return renderResources();
      } else if (resourceType === 'equipment') {
        return renderEquipmentSelection();
      }
    },
    2: () => (
      <div className="space-y-4 pb-20"> {/* Add bottom padding to prevent overlap with navigation */}
        {/* Network Error Overlay - Show above calendar when locked */}
        {isCalendarLocked && (
          <div className="bg-red-50/95 dark:bg-red-900/30 border-2 border-red-500 rounded-lg p-8 mb-4">
            <div className="text-center space-y-3 max-w-lg mx-auto">
              <div className="text-5xl mb-2">🔒</div>
              <div className="text-xl font-bold text-red-700 dark:text-red-300">
                Network Connection Lost
              </div>
              <div className="text-base font-semibold text-red-700 dark:text-red-300 mb-2">
                Unable to Load Calendar Data
              </div>
              <div className="text-sm text-red-600 dark:text-red-400 max-w-md leading-relaxed mx-auto">
                The calendar is locked for security. Please check your internet connection and refresh the page to verify resource availability and prevent booking conflicts.
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg"
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        )}
        
        <div className={`${isCalendarLocked ? 'opacity-30 pointer-events-none' : ''}`}>
          <ReservationCalendar
          onDateSelect={function(dateData, endDateParam) {
            // Prevent date selection if calendar is locked
            if (isCalendarLocked) {
              toast.error('Cannot select dates. Network connection required to verify availability.', {
                position: 'top-center',
                icon: '🔒',
                className: 'font-medium',
                autoClose: 3000
              });
              return;
            }
            
            // Handle both object format and separate parameters for backward compatibility
            const startDate = dateData.startDate || dateData;
            const endDate = dateData.endDate || endDateParam;
            const driverShortage = dateData.driverShortage || false;
            const availableDrivers = dateData.availableDrivers || 0;
            const totalVehicles = dateData.totalVehicles || 0;

            console.log('Date selection received:', {
              dateData,
              startDate,
              endDate,
              driverShortage,
              availableDrivers,
              totalVehicles,
            });

            setFormData((prev) => ({
              ...prev,
              startDate: startDate,
              endDate: endDate,
              driverShortage: driverShortage,
              availableDrivers: availableDrivers,
              totalVehicles: totalVehicles,
            }));
            // Automatically advance to step 3 (details step) when date is selected successfully
            setCurrentStep(3);
            // Show success message
            toast.success('Date and time selected successfully! Please fill in the required details.');
          }}
          selectedResource={(() => {
            const resourceData = {
              type: resourceType,
              id: resourceType === 'equipment' 
                ? Object.entries(equipmentQuantities)
                    .filter(([_, qty]) => qty > 0)
                    .map(([id, qty]) => ({
                      id: parseInt(id),
                      quantity: qty
                    }))
                : resourceType === 'venue' 
                  ? formData.venues
                  : selectedModels
            };
            
            // Debug log
            if (resourceType === 'vehicle') {
              console.log('[AddReservation] Building selectedResource:', {
                selectedModels,
                vehiclesCount: vehicles?.length
              });
            }
            
            return resourceData;
          })()}
          vehicles={vehicles}
          initialData={calendarData} // Pass the fetched calendar data
          venueEventTypeById={Object.fromEntries((venues || []).map(v => [v.ven_id, v.event_type]))}
        />
        </div>
      </div>
    ),
    3: () => renderBasicInformation({
      formData,
      handleInputChange,
      isMobile,
      showEquipmentModal,
      setShowEquipmentModal,
      selectedVenueEquipment,
      equipment,
      showPassengerModal,
      setShowPassengerModal,
      handleRemovePassenger,
      renderDriverDropdown: () => renderDriverDropdown(selectedModels, vehicles, setFormData),
      selectedModels,
      vehicles,
      setFormData
    }),
    4: renderReviewSection,
    5: renderSuccessState,
  };

  return (
    <div className="min-h-[400px]">
      {steps[currentStep] && steps[currentStep]()}
    </div>
  );
};

const renderEquipmentSelection = () => {
  const handleEquipmentQuantityChange = (updatedQuantities) => {
    // Create a new object to ensure state updates are detected
    const newQuantities = { ...updatedQuantities };
    
    // Remove any entries with 0 or negative quantities
    Object.keys(newQuantities).forEach(key => {
      if (newQuantities[key] <= 0) {
        delete newQuantities[key];
      }
    });
    
    // Update all relevant states with the cleaned quantities (replace entirely, don't merge)
    setEquipmentQuantities(newQuantities);
    setSelectedVenueEquipment(newQuantities);
    
    // Update form data with the cleaned quantities
    setFormData(prev => ({
      ...prev,
      selectedVenueEquipment: { ...newQuantities }
    }));
    
    // Log the changes for debugging
    console.log('Equipment quantities updated:', newQuantities);
  };

  return (
    <ResourceEquipment
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      equipmentQuantities={equipmentQuantities}
      onQuantityChange={handleEquipmentQuantityChange}
      isMobile={isMobile}
      startDate={formData.startDate}
      endDate={formData.endDate}
      showSelectedOnly={showSelectedOnly}
      onFilterToggle={handleFilterToggle}
    />
  );
};





const StepIndicator = ({ currentStep, resourceType, isMobile, isTablet }) => {
  const displayStep = resourceType === 'work_request'
    ? (currentStep === 5 ? 2 : Math.min(currentStep, 2))
    : currentStep;

  const steps = resourceType === 'work_request' ? [
    {
      title: 'Select Type',
      description: 'Choose request type',
      icon: <i className="pi pi-tag" />
    },
    {
      title: 'Ticket Form',
      description: 'Fill required info',
      icon: <i className="pi pi-wrench" />
    },
    {
      title: 'Complete',
      description: 'Submit request',
      icon: <i className="pi pi-check-circle" />
    }
  ] : [
    { 
      title: 'Select Type',
      description: 'Choose resource type',
      icon: <i className="pi pi-tag" />
    },
    { 
      title: 'Select Resource',
      description: `Choose ${resourceType || 'resource'}`,
      icon: resourceType === 'venue' ? 
        <i className="pi pi-building" /> :
        resourceType === 'vehicle' ? 
          <i className="pi pi-car" /> :
          resourceType === 'work_request' ? <i className="pi pi-wrench" /> : <i className="pi pi-tools" />
    },
    { 
      title: 'Select Date',
      description: 'Choose dates & times',
      icon: <i className="pi pi-calendar" />
    },
    { 
      title: 'Details',
      description: 'Fill required info',
      icon: <i className="pi pi-file" />
    },
    { 
      title: 'Review',
      description: 'Check details',
      icon: <i className="pi pi-search" />
    },
    { 
      title: 'Review',
      description: 'Confirm reservation',
      icon: <i className="pi pi-check-circle" />
    }
  ];

  const progressPercentage = (displayStep / (steps.length - 1)) * 100;
  const circumference = 2 * Math.PI * (isMobile ? 40 : isTablet ? 42 : 45); // Responsive radius
  const offset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className={`
      flex flex-col items-center justify-center
      ${isMobile ? 'py-4 px-2' : 'py-8 px-4'}
      bg-gradient-to-b from-white to-gray-50
      rounded-xl shadow-sm border border-gray-100
    `}>
      <div className={`
        flex ${isMobile ? 'flex-col' : 'flex-row gap-8'} 
        items-center justify-center w-full
      `}>
        {/* Circular Progress */}
        <div className={`
          relative ${isMobile ? 'w-28 h-28' : 'w-36 h-36'}
          transform transition-transform duration-500 ease-out
          ${currentStep === steps.length - 1 ? 'scale-110' : 'scale-100'}
        `}>
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx={isMobile ? "56" : "72"}
              cy={isMobile ? "56" : "72"}
              r={isMobile ? "40" : "45"}
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
              className="drop-shadow-sm"
            />
            {/* Progress Circle */}
            <circle
              cx={isMobile ? "56" : "72"}
              cy={isMobile ? "56" : "72"}
              r={isMobile ? "40" : "45"}
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: offset,
                transition: 'stroke-dashoffset 0.5s ease'
              }}
            />
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#548e54" />
                <stop offset="50%" stopColor="#83b383" />
                <stop offset="100%" stopColor="#538c4c" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`
              ${isMobile ? 'text-xl' : 'text-2xl'}
              font-bold text-gray-800
            `}>
              {displayStep + 1}/{steps.length}
            </span>
            <span className={`
              ${isMobile ? 'text-xs' : 'text-sm'}
              text-gray-500 mt-1
            `}>
              Step
            </span>
          </div>

          {/* Completion Animation */}
          {displayStep === steps.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-full h-full animate-ping rounded-full bg-green-500 opacity-20" />
            </div>
          )}
        </div>

        {/* Step Information */}
        <div className={`
          text-center ${isMobile ? 'mt-4' : 'mt-0'}
          max-w-sm transition-all duration-300
        `}>
          <div className={`
            inline-flex items-center gap-2 mb-2
            ${isMobile ? 'text-base' : 'text-lg'}
            font-semibold text-gray-800
          `}>
            <span className={`
              flex items-center justify-center
              ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
              rounded-full bg-green-100 text-green-600
            `}>
              {steps[displayStep].icon}
            </span>
            {steps[displayStep].title}
          </div>
          <p className={`
            ${isMobile ? 'text-sm' : 'text-base'}
            text-gray-500 mt-1
          `}>
            {steps[displayStep].description}
          </p>

          {/* Mini Steps Indicator */}
          <div className="flex gap-1.5 mt-4 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`
                  ${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'}
                  rounded-full transition-all duration-300
                  ${index <= displayStep ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const handlePrintRequest = () => {
  // Find the selected driver using formData.driverName
  const selectedDriver = availableDrivers.find(d => d.driver_id.toString() === formData.driverName?.toString());
  
  const printContent = document.createElement('div');
  printContent.innerHTML = `
    <div style="padding: 20px;">
      <h2 style="text-align: center; margin-bottom: 20px;">Reservation Request Details</h2>
      
      <div style="margin-bottom: 20px;">
        <h3>Basic Information</h3>
        <p><strong>Reservation Name:</strong> ${formData.reservationName}</p>
        <p><strong>Resource Type:</strong> ${resourceType}</p>
        <p><strong>Date:</strong> ${format(new Date(formData.startDate), 'PPP')} - ${format(new Date(formData.endDate), 'PPP')}</p>
        <p><strong>Time:</strong> ${format(new Date(formData.startDate), 'p')} - ${format(new Date(formData.endDate), 'p')}</p>
      </div>

      ${resourceType === 'venue' ? `
        // ...existing venue details code...
      ` : `
        <div style="margin-bottom: 20px;">
          <h3>Vehicle Details</h3>
          <p><strong>Purpose:</strong> ${formData.purpose}</p>
          <p><strong>Destination:</strong> ${formData.destination}</p>
          <p><strong>Driver:</strong> ${selectedDriver?.driver_full_name || 'Not specified'}</p>
          <p><strong>Passengers:</strong></p>
          <ul>
            ${formData.passengers.map(p => `<li>${p.name}</li>`).join('')}
          </ul>
        </div>
      `}
    </div>
  `;


};



const [showPassengerModal, setShowPassengerModal] = useState(false);

// Add fetchDrivers function
const fetchDrivers = useCallback(async (startDate, endDate) => {


  try {
    const response = await axios.post(`${encryptedUrl}/Admin.php`, {
      operation: 'fetchDriver',
      startDateTime: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
      endDateTime: format(endDate, 'yyyy-MM-dd HH:mm:ss')
    });

    console.log('Driver response:', response.data);

    if (response.data.status === 'success') {
      const driversData = response.data.data.map(driver => ({
        ...driver,
        displayName: `${driver.driver_full_name} (${driver.departments_name || 'Department Driver'})`
      }));
      setAvailableDrivers(driversData);
    } else {
      setAvailableDrivers([]);
    }

  } catch (error) {
    console.error('Error fetching drivers:', error);
    setAvailableDrivers([]);
    if (!error.response || error.message === 'Network Error' || error.name === 'TypeError') {
      toast.error('Network connection lost. Unable to fetch drivers.');
    } else {
      toast.error('Failed to fetch available drivers');
    }
  } finally {

  }
}, [encryptedUrl]);

// Add useEffect to fetch drivers
useEffect(() => {
  if (formData.startDate && formData.endDate && resourceType === 'vehicle') {
    fetchDrivers(formData.startDate, formData.endDate);
  }
}, [formData.startDate, formData.endDate, resourceType, fetchDrivers]);

// Add PassengerModal component
const PassengerModal = ({ visible, onHide }) => {
  const [newPassengerName, setNewPassengerName] = useState('');
  const [passengerError, setPassengerError] = useState('');
  const [localPassengers, setLocalPassengers] = useState([]);

  useEffect(() => {
    if (visible) {
      // Load existing passengers from formData when modal opens
      setLocalPassengers(formData.passengers || []);
      setNewPassengerName('');
      setPassengerError('');
    }
  }, [visible]);

  const handleAddLocalPassenger = () => {
    if (!newPassengerName.trim()) {
      setPassengerError('Passenger name cannot be empty');
      return;
    }
    if (
      localPassengers.some(
        p => p.name.toLowerCase() === newPassengerName.trim().toLowerCase()
      )
    ) {
      setPassengerError('This passenger is already in the list');
      return;
    }
    setLocalPassengers(prev => [
      ...prev,
      { id: Date.now() + Math.random(), name: newPassengerName.trim() }
    ]);
    setNewPassengerName('');
    setPassengerError('');
  };

  const handleRemoveLocalPassenger = id => {
    setLocalPassengers(prev => prev.filter(p => p.id !== id));
  };

  const handleConfirm = () => {
    if (localPassengers.length === 0) {
      setPassengerError('Add at least one passenger before confirming');
      return;
    }
    // Update passengers in the main form state
    setFormData(prev => ({
      ...prev,
      passengers: localPassengers
    }));
    onHide();
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#fafff4] border border-gray-100 rounded-xl shadow-sm w-full max-w-sm"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <TeamOutlined className="text-lg text-green-700" />
              <h3 className="text-lg font-medium text-gray-900">Add Passengers</h3>
            </div>
            <button
              onClick={onHide}
              className="p-1 hover:bg-lime-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passenger Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter passenger's full name"
                  value={newPassengerName}
                  onChange={e => {
                    setNewPassengerName(e.target.value);
                    if (passengerError) setPassengerError('');
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddLocalPassenger(); }}
                  className={`flex-1 text-sm border ${passengerError ? 'border-red-400' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-lime-500 focus:border-lime-500`}
                />
                <button
                  onClick={handleAddLocalPassenger}
                  className="px-2 py-1 bg-green-500 text-white rounded"
                  disabled={!newPassengerName.trim()}
                >
                  Add
                </button>
              </div>
              {passengerError && (
                <div className="text-xs text-red-500 mt-1">{passengerError}</div>
              )}
            </div>

            {/* List of passengers to be added */}
            <div>
              {localPassengers.length > 0 ? (
                <ul className="divide-y">
                  {localPassengers.map((p, idx) => (
                    <li key={p.id} className="flex items-center justify-between py-1">
                      <span>{idx + 1}. {p.name}</span>
                      <button
                        onClick={() => handleRemoveLocalPassenger(p.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-400 text-sm">No passengers added yet.</div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onHide}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${localPassengers.length > 0 ? 'bg-lime-600 hover:bg-lime-700' : 'bg-gray-300 cursor-not-allowed'}`}
              disabled={localPassengers.length === 0}
            >
              Confirm
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- EquipmentSelectionModal: Enhanced for mobile and cleanliness ---
const EquipmentSelectionModal = ({ 
  localEquipmentQuantities, 
  setLocalEquipmentQuantities,
  showEquipmentModal,
  setShowEquipmentModal,
  equipment,
  setEquipmentQuantities,
  setSelectedVenueEquipment,
  fetchEquipment,
  formData
}) => {
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [localState, setLocalState] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  
  // Dynamic items per page based on screen size
  const itemsPerPage = isMobile ? 6 : isTablet ? 9 : 12;

  // Responsive modal width and height
  const modalStyle = {
    width: isTablet ? '85vw' : '90vw',
    maxWidth: isTablet ? '600px' : '700px',
    padding: 0,
    top: 24,
    borderRadius: 0,
  };

  // Responsive header styles
  const headerStyle = {
    background: 'linear-gradient(to right, #365314, #14532d)',
    color: 'white',
    padding: isMobile ? '16px 20px' : isTablet ? '18px 24px' : '20px 24px',
    borderRadius: 0,
    marginBottom: 0,
  };

  // Sticky header/footer styles for content
  const stickyHeaderStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background: '#fff',
    borderBottom: '1px solid #f0f0f0',
    padding: isMobile ? '12px 16px 8px 16px' : isTablet ? '14px 20px 10px 20px' : '16px 24px',
  };
  
  const stickyFooterStyle = {
    position: 'sticky',
    bottom: 0,
    zIndex: 2,
    background: '#fafafa',
    borderTop: '1px solid #f0f0f0',
    padding: 0, // Remove padding, will be handled inside
  };

  // Only the equipment list is scrollable
  // Footer now includes pagination (~40px) + buttons (~56px mobile, ~48px tablet/desktop) + padding
  const scrollableListStyle = {
    maxHeight: isMobile ? 'calc(100vh - 380px)' : isTablet ? 'calc(100vh - 420px)' : '320px',
    overflowY: 'auto',
    padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
    paddingBottom: isMobile ? '160px' : isTablet ? '140px' : '120px', // Extra padding so last item is fully visible
    background: '#fff',
    scrollbarWidth: 'thin',
    scrollbarColor: '#b5e0b5 #f0f0f0',
    overflowAnchor: 'none', // Prevent scroll jumps
  };

  // Custom scrollbar for webkit
  const customScrollbar = `
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-thumb { background: #b5e0b5; border-radius: 4px; }
    ::-webkit-scrollbar-track { background: #f0f0f0; }
  `;

  // --- SCROLL PRESERVATION LOGIC ---
  const scrollableListRef = useRef(null);
  const prevScrollTopRef = useRef(0);
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);

  // Reset local state when modal opens - use a ref to track if modal was just opened
  const modalJustOpenedRef = useRef(false);
  const modalOpenRef = useRef(false);
  
  // Update ref when modal state changes
  useEffect(() => {
    modalOpenRef.current = showEquipmentModal;
  });
  
  useEffect(() => {
    if (modalOpenRef.current && !modalJustOpenedRef.current) {
      console.log('Modal opened, resetting local state. Previous state:', localEquipmentQuantities);
      setLocalState({});
      setEquipmentSearch('');
      setSelectedCategory('all');
      setCurrentPage(1);
      modalJustOpenedRef.current = true;
    } else if (!modalOpenRef.current) {
      modalJustOpenedRef.current = false;
    }
  }, [localEquipmentQuantities]);
  
  // Update local state when props change (but only if modal is open and props have data)
  useEffect(() => {
    if (modalOpenRef.current && localEquipmentQuantities && Object.keys(localEquipmentQuantities).length > 0) {
      console.log('Updating local state from props:', localEquipmentQuantities);
      setLocalState({...localEquipmentQuantities});
    }
  }, [localEquipmentQuantities]);
  
  const handleLocalQuantityChange = (equipId, value) => {
    // --- Save scroll position before state update ---
    if (scrollableListRef.current) {
      prevScrollTopRef.current = scrollableListRef.current.scrollTop;
    }
    // Convert value to number and handle empty/undefined cases
    const numericValue = value === '' || value === null || value === undefined ? 0 : Number(value);
    // Ensure equipId is consistently handled as a string for state keys
    const equipmentKey = String(equipId);
    
    console.log('=== handleLocalQuantityChange called ===');
    console.log('equipId:', equipId, 'equipmentKey:', equipmentKey);
    console.log('value:', value, 'numericValue:', numericValue);
    console.log('Current localState before update:', localState);
    
    // Find the equipment
    const equip = equipment.find(e => String(e.equip_id) === equipmentKey);
    
    if (!equip) {
      console.log('Equipment not found:', equipId, 'Available equipment:', equipment.map(e => e.equip_id));
      return;
    }
    
    // Get available quantity
    const maxAvailable = Number(equip.available_quantity || equip.available) || 0;
    
    // Ensure quantity doesn't exceed available amount and is not negative
    const constrainedValue = Math.max(0, Math.min(numericValue, maxAvailable));
    
    console.log('Updating equipment quantity:', {
      equipmentId: equipmentKey,
      equipmentName: equip.equip_name || equip.equipment_name || equip.name || 'Equipment Name Not Available',
      currentValue: value,
      constrainedValue: constrainedValue,
      maxAvailable: maxAvailable,
      currentState: localState
    });
    
    // Update the local state with the new quantity for this specific equipment only
    setLocalState(prev => {
      let newState;
      
      if (constrainedValue === 0) {
        // Remove the equipment from state if quantity is 0
        const { [equipmentKey]: removed, ...rest } = prev;
        newState = rest;
        console.log('Removing equipment from state:', equipmentKey);
      } else {
        // Add or update the equipment quantity
        newState = {
          ...prev,
          [equipmentKey]: constrainedValue
        };
        console.log('Adding/updating equipment in state:', equipmentKey, 'quantity:', constrainedValue);
      }
      
      console.log('New state after update:', newState);
      console.log('=== handleLocalQuantityChange completed ===');
      return newState;
    });
    setShouldRestoreScroll(true); // <-- Add this
  };

  useLayoutEffect(() => {
    if (shouldRestoreScroll && scrollableListRef.current) {
      scrollableListRef.current.scrollTop = prevScrollTopRef.current;
      setShouldRestoreScroll(false);
    }
  }, [localState, shouldRestoreScroll]);
  
  const handleConfirm = () => {
    // Update both states to ensure consistency
    setEquipmentQuantities(localState);
    setSelectedVenueEquipment(localState);
    setLocalEquipmentQuantities(localState);
    setShowEquipmentModal(false);
    
    // Show success message
    const selectedCount = Object.values(localState).filter(qty => qty > 0).length;
    if (selectedCount > 0) {
      toast.success(`${selectedCount} equipment item${selectedCount > 1 ? 's' : ''} selected successfully`);
    }
  };
  
  const handleCancel = () => {
    // Reset local state when cancelling
    setLocalState({});
    setShowEquipmentModal(false);
  };
  


  // Equipment Card Component for list view only
  const EquipmentCard = React.memo(({ item, isSelected, onClick, currentQuantity, onQuantityChange }) => {
    const availableQuantity = parseInt(item.available_quantity || item.available) || 0;
    const isAvailable = availableQuantity > 0;
    const [tempInputValue, setTempInputValue] = useState(currentQuantity?.toString() || '');

    useEffect(() => {
      setTempInputValue(currentQuantity?.toString() || '');
    }, [currentQuantity]);

    const handleInputChange = (e) => {
      e.stopPropagation();
      const inputValue = e.target.value;
      if (inputValue === '' || /^\d+$/.test(inputValue)) {
        setTempInputValue(inputValue);
      }
    };
    const handleInputBlur = () => {
      if (tempInputValue === '') {
        onQuantityChange(item.equip_id, 0);
      } else {
        const value = parseInt(tempInputValue);
        if (!isNaN(value)) {
          const clampedValue = Math.min(Math.max(0, value), availableQuantity);
          onQuantityChange(item.equip_id, clampedValue);
          setTempInputValue(clampedValue.toString());
        }
      }
    };
    return (
      <Card
        className={`
          transition-all duration-200 border-0 shadow-md hover:shadow-lg
          ${currentQuantity > 0 ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}
          ${isMobile ? 'p-3' : isTablet ? 'p-3.5' : 'p-4'} rounded-xl mb-2 cursor-pointer
        `}
        style={{ boxShadow: isSelected ? '0 4px 16px #b5e0b5aa' : undefined, borderRadius: 16, border: '1px solid #e0e0e0' }}
        onClick={onClick}
      >
        <div className={`flex ${(isMobile || isTablet) ? 'flex-col items-center justify-center' : 'flex-row items-center'} gap-3 w-full`}>
          {/* Icon */}
          <div className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-50 ${(isMobile || isTablet) ? 'w-14 h-14' : 'w-16 h-16'} flex-shrink-0`}>
            <BsTools className={`text-green-500 ${(isMobile || isTablet) ? 'text-2xl' : 'text-3xl'}`} />
          </div>
          
          {/* Content */}
          <div className={`flex flex-col ${(isMobile || isTablet) ? 'items-center text-center w-full' : 'flex-1 items-start'} gap-2`}>
            {/* Equipment Name */}
            <h3 className={`font-medium text-gray-800 ${(isMobile || isTablet) ? 'text-sm' : 'text-base'}`}>
              {item.equip_name || 'Equipment Name Not Available'}
            </h3>
            
            {/* Equipment Details */}
            <div className={`flex ${(isMobile || isTablet) ? 'flex-col items-center' : 'flex-row flex-wrap'} gap-${(isMobile || isTablet) ? '1' : '3'}`}>
              <div className="flex items-center gap-1 text-gray-600">
                <MdInventory className="text-green-500 text-base" />
                <span className={`${(isMobile || isTablet) ? 'text-xs' : 'text-sm'}`}>
                  QTY: {availableQuantity}
                </span>
              </div>
              {item.category_name && (
                <div className="flex items-center gap-1 text-gray-600">
                  <span className={`${(isMobile || isTablet) ? 'text-xs' : 'text-sm'}`}>
                    Category: {item.category_name}
                  </span>
                </div>
              )}
            </div>
            
            {/* Quantity Controls */}
            {isAvailable && (
              <div className="flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newQty = Math.max(0, currentQuantity - 1);
                    onQuantityChange(item.equip_id, newQty);
                  }}
                  disabled={currentQuantity === 0}
                  className={`
                    ${isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center text-base font-bold
                    ${currentQuantity > 0 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    transition-colors
                  `}
                  style={{ fontSize: isMobile ? 20 : 16 }}
                >
                  -
                </button>
                <input
                  type="text"
                  pattern="[0-9]*"
                  value={tempInputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="0"
                  className={`${isMobile ? 'w-20 h-10' : 'w-16 h-8'} text-center border border-gray-300 rounded text-base font-medium
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  style={{ background: '#f8fff8', fontSize: isMobile ? 18 : 16 }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newQty = Math.min(currentQuantity + 1, availableQuantity);
                    onQuantityChange(item.equip_id, newQty);
                  }}
                  disabled={currentQuantity >= availableQuantity}
                  className={`
                    ${isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center text-base font-bold
                    ${currentQuantity < availableQuantity 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    transition-colors
                  `}
                  style={{ fontSize: isMobile ? 20 : 16 }}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  });
  
  // Get unique categories from equipment
  const equipmentCategories = Array.from(
    new Set((Array.isArray(equipment) ? equipment : []).map(e => e.category_name).filter(Boolean))
  );

  // Filter equipment by search term and category
  const filteredEquipment = Array.isArray(equipment) ? equipment.filter(item => {
    if (!item) return false;
    const availableQuantity = parseInt(item.available_quantity || item.available) || 0;
    if (availableQuantity <= 0) return false;
    const searchTerm = equipmentSearch?.toLowerCase() || '';
    const itemName = (item.equip_name || item.equipment_name || '').toLowerCase();
    const matchesSearch = itemName.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  // Calculate pagination
  const totalItems = filteredEquipment.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEquipment = filteredEquipment.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = (value) => {
    setEquipmentSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Create header content
  const headerContent = (
    <div className="flex items-center gap-2">
      <BsTools className={`${isMobile ? 'text-xl' : 'text-lg'}`} />
      <span className={`${isMobile ? 'text-lg' : 'text-base'} font-semibold`}>Select Equipment</span>
    </div>
  );

  // Create main content
  const mainContent = (
    <>
      {/* Custom scrollbar style */}
      <style>{customScrollbar}</style>
      {/* Sticky Header */}
      <div style={stickyHeaderStyle}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1">
            <h2 className="font-semibold text-gray-800 text-lg">
              {Object.values(localState).filter(qty => qty > 0).length > 0
                ? `Selected Equipment (${Object.values(localState).filter(qty => qty > 0).length})`
                : 'Available Equipment'}
            </h2>
            <p className="text-gray-500 mt-0.5 text-sm">
              {Object.values(localState).filter(qty => qty > 0).length > 0
                ? 'Equipment availability is calculated based on existing reservations'
                : 'Select equipment to proceed'}
            </p>
          </div>
        </div>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : isTablet ? 'flex-col gap-2' : 'flex-row gap-4'} justify-between items-center mt-4`}>
          <div className={`${isMobile ? 'w-full' : 'flex-1'} flex ${isMobile ? 'flex-col gap-2' : 'gap-2'} items-center`}>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className={`border border-gray-300 rounded px-3 py-2 ${isMobile ? 'text-base w-full' : 'text-sm'} focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white`}
              style={{ minWidth: isMobile ? 'auto' : 120 }}
            >
              <option value="all">All Categories</option>
              {equipmentCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Input.Search
              placeholder={isMobile ? "Search equipment..." : "Search equipment by name..."}
              prefix={<SearchOutlined className="text-gray-400" />}
              onChange={(e) => handleSearch(e.target.value)}
              value={equipmentSearch}
              className={`${isMobile ? 'w-full' : 'w-full max-w-md'}`}
              size={isMobile ? "large" : "large"}
              style={{ borderRadius: 8 }}
            />
          </div>
        </div>
      </div>
      {/* Scrollable Equipment List (no animation wrapper) */}
      <div ref={scrollableListRef} style={scrollableListStyle}>
        <div className="flex flex-col gap-2">
          {currentEquipment.map((item) => {
            const equipmentKey = String(item.equip_id);
            const currentQty = localState[equipmentKey] || 0;
            return (
              <EquipmentCard
                key={equipmentKey}
                item={item}
                isSelected={currentQty > 0}
                onClick={() => {
                  const availableQty = parseInt(item.available_quantity || item.available) || 0;
                  if (currentQty === 0 && availableQty > 0) {
                    handleLocalQuantityChange(equipmentKey, 1);
                  } else if (currentQty > 0) {
                    handleLocalQuantityChange(equipmentKey, 0);
                  }
                }}
                currentQuantity={currentQty}
                onQuantityChange={handleLocalQuantityChange}
              />
            );
          })}
        </div>
        {filteredEquipment.length === 0 && (
          <div className="text-center p-8">
            <Empty
              description={
                <div className="text-center">
                  <h3 className="font-medium text-gray-800 mb-1 text-base">
                    {equipmentSearch 
                      ? 'No equipment matches your search'
                      : 'No Equipment Available'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {equipmentSearch 
                      ? 'Try different keywords or clear the search'
                      : 'Check back later for available equipment'}
                  </p>
                </div>
              }
              className="bg-white rounded-lg shadow-sm p-8"
            />
          </div>
        )}
      </div>
      {/* Sticky Footer with Pagination */}
      <div style={stickyFooterStyle}>
        {/* Pagination - Always visible in footer */}
        {filteredEquipment.length > 0 && (
          <div className={`flex justify-center py-2 px-4 bg-white border-b border-gray-200`}>
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={itemsPerPage}
              onChange={handlePageChange}
              size="small"
              showSizeChanger={false}
              showQuickJumper={false}
              simple={isMobile || isTablet}
              showTotal={(total, range) => 
                (isMobile || isTablet) ? null : `${range[0]}-${range[1]} of ${total}`
              }
            />
          </div>
        )}
        {/* Action Buttons */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 ${isMobile ? 'w-full' : ''} ${isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-4'}`}>
          <AntButton 
            key="cancel" 
            onClick={handleCancel} 
            className={isMobile ? 'w-full text-base py-3' : ''}
            size={isMobile ? 'large' : 'middle'}
          >
            Cancel
          </AntButton>
          <AntButton
            key="confirm"
            type="primary"
            onClick={handleConfirm}
            className={`bg-green-500 hover:bg-green-600 border-green-500 ${isMobile ? 'w-full text-base py-3' : ''}`}
            size={isMobile ? 'large' : 'middle'}
          >
            Confirm Selection
          </AntButton>
        </div>
      </div>
    </>
  );

  // Conditional rendering based on screen size
  if (isMobile) {
    return (
      <Drawer
        title={headerContent}
        placement="bottom"
        onClose={handleCancel}
        open={showEquipmentModal}
        height="95%"
        bodyStyle={{ padding: 0, overflow: 'hidden' }}
        headerStyle={headerStyle}
        destroyOnClose
        maskClosable
        zIndex={1000}
      >
        {mainContent}
      </Drawer>
    );
  }

  return (
    <Modal
      title={headerContent}
      open={showEquipmentModal}
      onCancel={handleCancel}
      footer={null}
      style={modalStyle}
      bodyStyle={{ padding: 0, overflow: 'hidden' }}
      zIndex={1000}
      destroyOnClose
      maskClosable
    >
      {mainContent}
    </Modal>
  );
};

// Simplified driver notice - no selection, drivers always null
const renderDriverDropdown = (selectedModels, vehicles, setFormData) => {
  const safeSelectedModels = selectedModels || [];
  
  // Don't render if no vehicles selected
  if (safeSelectedModels.length === 0) {
    return null;
  }

  // Show driver shortage notice if applicable
  const hasDriverShortage = formData.driverShortage;
  const availableDrivers = formData.availableDrivers || 0;
  const totalVehicles = formData.totalVehicles || safeSelectedModels.length;

  return (
    <Form.Item
     
    >
      <div className="space-y-3">
        {/* Driver assignment notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span className="text-xs font-medium text-blue-800">Driver Assignment</span>
          </div>
          <p className="text-xs text-blue-700">
            Drivers will be assigned by admin during the approval process.
          </p>
        </div>

        {/* Driver shortage warning if applicable */}
        {hasDriverShortage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-amber-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
              </svg>
              <span className="text-xs font-medium text-amber-800">Driver Shortage Notice</span>
            </div>
            <p className="text-xs text-amber-700">
              {availableDrivers > 0 
                ? `Only ${availableDrivers} driver(s) available for ${totalVehicles} vehicle(s). Admin will coordinate driver assignment.`
                : `No drivers available for the selected time. Admin will coordinate driver assignment.`
              }
            </p>
          </div>
        )}
      </div>
    </Form.Item>
  );
};


// Add fetch functions for resources
const fetchVenues = useCallback(async () => {
  try {
    const response = await axios({
      method: 'post',
      url: `${encryptedUrl}/Admin.php`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        operation: 'fetchVenue'
      }
    });
    if (response.data.status === 'success') {
      setVenues(response.data.data);
    }
  } catch (error) {
    console.error('Error fetching venues:', error);
    if (!error.response || error.message === 'Network Error' || error.name === 'TypeError') {
      toast.error('Network connection lost. Unable to fetch venues.');
    } else {
      toast.error('Failed to fetch venues');
    }
  }
}, [encryptedUrl]);

const fetchVehicles = useCallback(async () => {
  try {
    const response = await axios({
      method: 'post',
      url: `${encryptedUrl}/Admin.php`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        operation: 'fetchVehicles'
      }
    });
    if (response.data.status === 'success') {
      setVehicles(response.data.data);
    }
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    if (!error.response || error.message === 'Network Error' || error.name === 'TypeError') {
      toast.error('Network connection lost. Unable to fetch vehicles.');
    } else {
      toast.error('Failed to fetch vehicles');
    }
  }
}, [encryptedUrl]);

const fetchEquipment = useCallback(async (startDate, endDate) => {
  try {
    // Prepare the API payload with date range
    let start = startDate;
    let end = endDate;
    if (start && end && start > end) {
      // Swap to ensure start is before end
      [start, end] = [end, start];
    }
    const startDateTime = start ? format(start, 'yyyy-MM-dd HH:mm:ss') : format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const endDateTime = end ? format(end, 'yyyy-MM-dd HH:mm:ss') : format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    
    const payload = {
      operation: 'fetchEquipments',
      startDateTime: startDateTime,
      endDateTime: endDateTime
    };
    console.log('Equipment payload:', payload);
    
    const response = await axios({
      method: 'post',
      url: `${encryptedUrl}reservation.php`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    });

    console.log('Equipment API Response:', response.data); // Debug log

    if (response.data.status === 'success') {
      const equipmentData = response.data.data || [];
      const transformedEquipment = equipmentData.map(item => ({
        ...item,
        // Map the API response fields to the expected field names
        available: item.available_quantity || 0,
        equip_name: item.equip_name || item.equipment_name || 'Equipment Name Not Available',
        equip_id: item.equip_id || item.equipment_id,
        category_name: item.category_name || '',
        equipments_category_id: item.equipments_category_id || item.equipment_category_id
      }));
      
      console.log('Transformed equipment data:', transformedEquipment);
      setEquipment(transformedEquipment);
    } else {
      console.error('Failed to fetch equipment:', response.data);
      toast.error('Failed to fetch equipment');
    }
  } catch (error) {
    console.error('Error fetching equipment:', error);
    if (!error.response || error.message === 'Network Error' || error.name === 'TypeError') {
      toast.error('Network connection lost. Unable to fetch equipment.');
    } else {
      toast.error('Failed to fetch equipment');
    }
  }
}, [encryptedUrl]);

// Add useEffect to fetch resources when component mounts
useEffect(() => {
  fetchVenues();
  fetchVehicles();
  
  // Fetch equipment if we have dates
  if (formData.startDate && formData.endDate) {
    fetchEquipment(formData.startDate, formData.endDate);
  }
}, [fetchVenues, fetchVehicles, fetchEquipment, formData.startDate, formData.endDate]);

// Add separate useEffect to fetch equipment when dates change
useEffect(() => {
  if (resourceType === 'equipment' && formData.startDate && formData.endDate) {
    // Fetch equipment with date range
    fetchEquipment(formData.startDate, formData.endDate);
  }
}, [formData.startDate, formData.endDate, resourceType, fetchEquipment]);

// Driver logic simplified - no need for complex driver handling

// Add useEffect to handle calendar data fetching
useEffect(() => {
  if (currentStep === 2) { // Calendar step
    // Reset network error state and unlock calendar when entering calendar step
    setIsCalendarLocked(false);
    setCalendarData(prev => ({
      ...prev,
      networkError: false
    }));
    
    const fetchCalendarData = async () => {
      try {
        // Fetch holidays
        const holidayResponse = await axios.post(
          `${encryptedUrl}/Admin.php`,
          {
            operation: 'fetchHoliday'
          }
        );

        if (holidayResponse.data.status === 'success') {
          const formattedHolidays = holidayResponse.data.data.map(holiday => ({
            name: holiday.holiday_name,
            date: holiday.holiday_date
          }));
          setCalendarData(prev => ({ 
            ...prev, 
            holidays: formattedHolidays,
            networkError: false // Clear network error on successful data fetch
          }));
          // Unlock calendar on successful data fetch
          setIsCalendarLocked(false);
        }

        // Fetch reservations based on resource type
        // For venues and vehicles, the calendar component handles its own data fetching
        if (resourceType === 'equipment') {
          const equipmentResponse = await axios.post(
            `${encryptedUrl}/reservation.php`,
            {
              operation: 'fetchAvailability',
              itemType: 'equipment',
              itemId: Object.entries(equipmentQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => ({
                  id: parseInt(id),
                  quantity: qty
                }))
            }
          );

          if (equipmentResponse.data.status === 'success') {
            setCalendarData(prev => ({
              ...prev,
              equipmentAvailability: equipmentResponse.data.data,
              networkError: false // Clear network error on successful data fetch
            }));
            // Unlock calendar on successful data fetch
            setIsCalendarLocked(false);
          }
        } 
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        if (!error.response || error.message === 'Network Error' || error.name === 'TypeError') {
          toast.error('Network connection lost. Unable to load calendar data.');
          // Immediately lock the calendar
          setIsCalendarLocked(true);
          // Set network error state in calendar data
          setCalendarData(prev => ({
            ...prev,
            networkError: true
          }));
        } else {
          toast.error('Failed to fetch calendar data');
          // Immediately lock the calendar for other API failures too
          setIsCalendarLocked(true);
          // Set network error state for other API failures too
          setCalendarData(prev => ({
            ...prev,
            networkError: true
          }));
        }
      }
    };

    fetchCalendarData();
  }
}, [currentStep, resourceType, formData.venues, selectedModels, equipmentQuantities, encryptedUrl]);

// Add useEffect to fetch equipment when modal opens
useEffect(() => {
  if (showEquipmentModal && (!equipment || equipment.length === 0)) {
    // Use dates if available, otherwise use current date
    const now = new Date();
    const start = formData.startDate || now;
    const end = formData.endDate || now;
    fetchEquipment(start, end);
  }
}, [showEquipmentModal, fetchEquipment, equipment, formData.startDate, formData.endDate]);

// Ensure formData.resourceType is always in sync with resourceType
useEffect(() => {
  setFormData(prev => ({
    ...prev,
    resourceType: resourceType
  }));
}, [resourceType]);

return (
  <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 safe-area-top">
  
    
    <section className={`w-full transition-all duration-300 ${isMobileDevice ? 'px-2 py-3 pb-24' : isTablet ? 'px-4 py-4 pb-20' : 'p-6'}`}>
      <article className={`mx-auto ${isMobileDevice ? 'max-w-full' : isTablet ? 'max-w-5xl' : 'max-w-6xl'}`}>
        {/* Header */}
        <header className={`bg-white rounded-xl shadow-sm ${isMobileDevice ? 'p-3 mb-2' : isTablet ? 'p-4 mb-4' : 'p-4 mb-6'} border border-gray-100`}>
          <Button
            onClick={() => navigate(-1)}
            className="p-button-text flex items-center gap-2 hover:bg-green-50 transition-colors"
            icon={<i className="pi pi-arrow-left text-green-500" />}
          >
            <span className={`font-medium text-green-600 ${isMobileDevice ? 'text-sm' : ''}`}>Back Dashboard</span>
          </Button>
          <h1 className={`font-bold text-gray-900 ${isMobileDevice ? 'text-xl mt-2' : isTablet ? 'text-2xl mt-2' : 'text-3xl'}`}>
            Create Reservation
          </h1>
          <p className={`text-gray-600 ${isMobileDevice ? 'text-xs' : 'text-sm'}`}>
            Complete the steps below to make your reservation
          </p>
        </header>

        {/* Step Indicator */}
        <section className={`bg-white rounded-xl shadow-sm ${isMobileDevice ? 'p-3 mb-2' : isTablet ? 'p-4 mb-4' : 'p-4 mb-6'} border border-gray-100 mobile-steps`}>
          <StepIndicator 
            currentStep={currentStep} 
            resourceType={resourceType} 
            isMobile={isMobileDevice}
            isTablet={isTablet}
          />
        </section>

        {/* Main Content */}
        <section className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible${isMobileDevice && currentStep !== 5 ? ' pb-32' : isTablet && currentStep !== 5 ? ' pb-24' : ' pb-8'} reservation-step`}>
          {/* Step Header */}
          <header className={`${isMobileDevice ? 'px-3 py-2' : isTablet ? 'px-4 py-3' : 'px-6 py-4'} bg-gradient-to-r from-lime-900 to-green-900 border-b border-gray-100`}>
            <h2 className={`font-semibold text-white ${isMobileDevice ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'}`}>
              {currentStep === 0 && "Select Resource Type"}
              {currentStep === 1 && (resourceType === 'work_request' ? 'Ticket Form' : `Select ${resourceType === 'venue' ? 'Venue' : resourceType === 'vehicle' ? 'Vehicle' : 'Equipment'}`)}
              {currentStep === 2 && "Choose Date & Time"}
              {currentStep === 3 && "Enter Details"}
              {currentStep === 4 && "Review Reservation"}
              {currentStep === 5 && "Reservation Complete"}
            </h2>
          </header>

          {/* Step Content */}
          <article className={`${isMobileDevice ? 'p-2' : isTablet ? 'p-4' : 'p-6'} form-compact`}>
            <div className={`mx-auto ${isMobileDevice ? 'max-w-full' : isTablet ? 'max-w-3xl' : 'max-w-4xl'}`}>
              {renderStepContent()}
            </div>
          </article>

          {/* Step Navigation - Desktop & Tablet */}
          {currentStep !== 5 && !isMobileDevice && (
            <footer className={`sticky bottom-0 left-0 right-0 ${isTablet ? 'px-4 py-3' : 'px-6 py-4'} bg-gray-50 border-t border-gray-100 z-30`}>
              <nav className={`flex ${isTablet ? 'flex-col gap-2' : 'flex-row'} justify-between items-center reservation-actions`}>
                <div className={`flex gap-2 ${isTablet ? 'w-full' : 'w-auto'}`}>
                  <AntButton
                    type="default"
                    icon={<i className="pi pi-arrow-left" />}
                    onClick={handleBack}
                    size={isTablet ? "middle" : "large"}
                    className={`p-button-outlined ${isTablet ? 'flex-1' : ''}`}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </AntButton>
                  {currentStep > 0 && (
                    <AntButton
                      type="default"
                      icon={<i className="pi pi-refresh" />}
                      onClick={resetForm}
                      size={isTablet ? "middle" : "large"}
                      className={`p-button-outlined border-orange-500 text-orange-600 hover:bg-orange-50 ${isTablet ? 'flex-1' : ''}`}
                    >
                      {isTablet ? 'Reset' : 'Reset Form'}
                    </AntButton>
                  )}
                </div>
                {currentStep === 4 ? (
                  <AntButton
                    type="primary"
                    icon={loading ? <Spin className="mr-2" /> : <CheckCircleOutlined />}
                    onClick={handleAddReservation}
                    size={isTablet ? "middle" : "large"}
                    className={`p-button-success bg-green-500 hover:bg-green-600 border-green-500 ${isTablet ? 'w-full' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit'}
                  </AntButton>
                ) : (
                  <AntButton
                    type="primary"
                    icon={<i className="pi pi-arrow-right" />}
                    onClick={handleNext}
                    size={isTablet ? "middle" : "large"}
                    className={`p-button-primary bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 border-lime-600 text-white ${isTablet ? 'w-full' : ''}`}
                    disabled={currentStep === 2 && isCalendarLocked} // Disable Next button when calendar is locked
                  >
                    {resourceType === 'work_request' && currentStep === 1 ? 'Submit' : 'Next'}
                  </AntButton>
                )}
              </nav>
            </footer>
          )}
        </section>
      </article>
    </section>

    {/* Toaster */}
    <Toaster 
      position="top-right"
      toastOptions={{
        className: 'text-sm',
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
        },
      }}
    />

    {/* Fixed Mobile Navigation */}
    {currentStep !== 5 && isMobileDevice && (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-2 flex flex-col gap-2 safe-area-bottom" style={{minHeight:'70px'}}>
        <nav className="flex flex-col gap-2 w-full reservation-actions">
          <div className="flex gap-2 w-full">
            <AntButton
              type="default"
              icon={<i className="pi pi-arrow-left" />}
              onClick={handleBack}
              size="middle"
              className="flex-1 p-button-outlined"
              disabled={currentStep === 0}
            >
              Back
            </AntButton>
            {currentStep > 0 && (
              <AntButton
                type="default"
                icon={<i className="pi pi-refresh" />}
                onClick={resetForm}
                size="middle"
                className="flex-1 p-button-outlined border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                Reset
              </AntButton>
            )}
          </div>
          {currentStep === 4 ? (
            <AntButton
              type="primary"
              icon={loading ? <Spin className="mr-2" /> : <CheckCircleOutlined />}
              onClick={handleAddReservation}
              size="middle"
              className="w-full p-button-success bg-green-500 hover:bg-green-600 border-green-500"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </AntButton>
          ) : (
            <AntButton
              type="primary"
              icon={<i className="pi pi-arrow-right" />}
              onClick={handleNext}
              size="middle"
              className="w-full p-button-primary bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 border-lime-600 text-white"
            >
              {resourceType === 'work_request' && currentStep === 1 ? 'Submit' : 'Next'}
            </AntButton>
          )}
        </nav>
      </div>
    )}

    {/* Spacer to prevent overlap when mobile footer is visible */}
    {currentStep !== 5 && isMobileDevice && (
      <div className="mobile-footer-spacer" />
    )}

    {/* Modals */}
    <PassengerModal
      visible={showPassengerModal}
      onHide={() => setShowPassengerModal(false)}
    />
    <EquipmentSelectionModal 
      localEquipmentQuantities={localEquipmentQuantities}
      setLocalEquipmentQuantities={setLocalEquipmentQuantities}
      showEquipmentModal={showEquipmentModal}
      setShowEquipmentModal={setShowEquipmentModal}
      equipment={equipment}
      setEquipmentQuantities={setEquipmentQuantities}
      setSelectedVenueEquipment={setSelectedVenueEquipment}
      fetchEquipment={fetchEquipment}
      formData={formData}
    />

    {/* Conflict Details Modal */}
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-600">
          <i className="pi pi-exclamation-triangle text-2xl" />
          <span className="text-lg font-semibold">Reservation Conflicts Detected</span>
        </div>
      }
      open={showConflictModal}
      onCancel={() => {
        setShowConflictModal(false);
        setConflictDetails(null);
      }}
      footer={[
        <AntButton
          key="close"
          type="primary"
          onClick={() => {
            setShowConflictModal(false);
            setConflictDetails(null);
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Close
        </AntButton>
      ]}
      width={isMobileDevice ? '95%' : isTablet ? 600 : 700}
      centered
    >
      <div className="conflict-modal-content py-4">
        {conflictDetails && (
          <div className="space-y-4">
            <p className="text-gray-700 mb-4">
              Your reservation cannot be processed because the following resources have conflicts with existing reservations:
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                {conflictDetails.replace('The following resources have conflicts:\n\n', '')}
              </pre>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800">
                <strong>💡 What to do next:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                <li>Try selecting different dates or times</li>
                <li>Choose alternative resources that are available</li>
                <li>Contact the reservation holders to coordinate</li>
                <li>Reduce the quantity of equipment requested</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  </main>
);
};



export default AddReservation;