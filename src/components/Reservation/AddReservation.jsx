import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../pages/Sidebar';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Tag } from 'primereact/tag';
import { UserOutlined, TeamOutlined,  DashboardOutlined, PlusOutlined,  CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {  Form, Input,  Select, Card,  Radio, Result, Alert, Modal, Empty, Spin, Tooltip,  Pagination } from 'antd';
import { format } from 'date-fns';
import { BsTools,  } from 'react-icons/bs';
import { MdInventory } from 'react-icons/md';
import { SearchOutlined } from '@ant-design/icons';

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



const AddReservation = () => {
  // Add encryptedUrl at the top of the component
  const encryptedUrl = SecureStorage.getLocalItem("url");

  const navigate = useNavigate();
  const [userLevel] = useState(localStorage.getItem('user_level') || '');
  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [resourceType, setResourceType] = useState(''); // 'vehicle' or 'venue'
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedVenueEquipment, setSelectedVenueEquipment] = useState({});
  const [equipmentQuantities, setEquipmentQuantities] = useState({});
  const [localEquipmentQuantities, setLocalEquipmentQuantities] = useState({ ...equipmentQuantities });

  // Add new state for calendar data
  const [calendarData, setCalendarData] = useState({
    reservations: [],
    holidays: [],
    equipmentAvailability: []
  });

  const [formData, setFormData] = useState({
    resourceType: '',
    startDate: null,
    endDate: null,
    selectedTime: null,
    eventTitle: '',
    description: '',
    participants: '',
    venues: [], 
    purpose: '',
    destination: '',
    passengers: [],
    driverType: 'default',
    driverName: '',
    tripTicketDriver: null,
  });

  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);

  const [equipment, setEquipment] = useState([]);
  const [venues, setVenues] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 375);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add these new functions
const handleAddPassenger = (passengerName) => {
  if (!passengerName) {
    passengerName = newPassenger;
  }
  
  if (!passengerName.trim()) {
    toast.error('Please enter a passenger name');
    return;
  }

  // Check if passenger already exists
  if (formData.passengers.some(p => p.name.toLowerCase() === passengerName.trim().toLowerCase())) {
    toast.error('This passenger is already in the list');
    return;
  }

  setFormData(prev => ({
    ...prev,
    passengers: [
      ...prev.passengers,
      { id: Date.now(), name: passengerName.trim() }
    ]
  }));

  // Clear the new passenger input
  setNewPassenger('');
};

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
          const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
          const decryptedUserLevel = parseInt(encryptedUserLevel);
          console.log("this is encryptedUserLevel", encryptedUserLevel);
          if (decryptedUserLevel !== 3 && decryptedUserLevel !== 15 && decryptedUserLevel !== 16 && decryptedUserLevel !== 17 && decryptedUserLevel !== 18 && decryptedUserLevel !== 5 && decryptedUserLevel !== 6) {
              localStorage.clear();
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
    resourceType: formData.resourceType
  });
}, [formData.startDate, formData.endDate, formData.resourceType]);
  

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const vehicleResponse = await axios.post(
          `${encryptedUrl}/fetch2.php`,
          new URLSearchParams({ operation: 'fetchVehicleCategories' })
        );
        if (vehicleResponse.data.status === 'success') {
          setVehicleCategories(vehicleResponse.data.data);
        }

        const equipResponse = await axios.post(
          `${encryptedUrl}/fetch2.php`,
          new URLSearchParams({ operation: 'fetchEquipmentCategories' })
        );
        if (equipResponse.data.status === 'success') {
          setEquipmentCategories(equipResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [encryptedUrl]);



const handleNext = async () => {
  if (!validateCurrentStep()) {
    return;
  }

  // Add console logging for selected resources
  if (currentStep === 1) {
    if (formData.resourceType === 'venue') {
      console.log('Selected Venue IDs:', formData.venues);
    } else if (formData.resourceType === 'vehicle') {
      console.log('Selected Vehicle IDs:', selectedModels);
    } else if (formData.resourceType === 'equipment') {
      console.log('Selected Equipment IDs:', Object.entries(equipmentQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ id, quantity: qty }))
      );
    }
  }

  // For equipment selection, ensure the state is updated before moving to review
  if (currentStep === 3 && formData.resourceType === 'venue') {
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
      if (!formData.resourceType) {
        toast.error('Please select a resource type (Venue, Vehicle, or Equipment)');
        return false;
      }
      return true;

    case 1:
      if (formData.resourceType === 'venue' && (!formData.venues || formData.venues.length === 0)) {
        toast.error('Please select at least one venue');
        return false;
      }
      if (formData.resourceType === 'vehicle' && selectedModels.length === 0) {
        toast.error('Please select at least one vehicle');
        return false;
      }
      if (formData.resourceType === 'equipment' && Object.keys(equipmentQuantities).length === 0) {
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
      if (startHour < 5 || startHour > 20 || endHour < 5 || endHour > 20) {
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
      if (formData.resourceType === 'venue') {
        if (!formData.eventTitle || !formData.description || formData.venues.length === 0) {
          toast.error('Please fill in all required venue reservation fields');
          return false;
        }
        return true;
      } else if (formData.resourceType === 'equipment') {
        if (!formData.eventTitle || !formData.description) {
          toast.error('Please fill in all required equipment reservation fields');
          return false;
        }
        return true;
      } else { // Vehicle validation
        if (!formData.purpose || !formData.purpose.trim()) {
          toast.error('Please enter a purpose');
          return false;
        }
        if (!formData.destination || !formData.destination.trim()) {
          toast.error('Please enter a destination');
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
    
    // If going back to step 0 (select resource type), clear all form data
    if (newStep === 0) {
      // Reset all form-related state
      setFormData({
        resourceType: '',
        startDate: null,
        endDate: null,
        selectedTime: null,
        eventTitle: '',
        description: '',
        participants: '',
        venues: [],
        purpose: '',
        destination: '',
        passengers: [],
        driverType: 'default',
        driverName: '',
        tripTicketDriver: null,
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
      setNewPassenger('');
      
      // Reset calendar data
      setCalendarData({
        reservations: [],
        holidays: [],
        equipmentAvailability: []
      });
      
      // Reset driver-related state
      setAvailableDrivers([]);
      setIsLoadingDrivers(false);
      
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
    selectedVenues={formData.venues}
    onVenueSelect={(venueId) => {
      setFormData(prev => ({
        ...prev,
        venues: prev.venues.includes(venueId)
          ? prev.venues.filter(id => id !== venueId)
          : [...prev.venues, venueId]
      }));
    }}
    isMobile={isMobile}
  />
);


// Modify renderResources to only show vehicles without equipment options
const renderResources = () => (
  <ResourceVehicle
    selectedVehicles={selectedModels}
    onVehicleSelect={handleVehicleSelect}
    vehicleCategories={vehicleCategories}
    selectedCategory={selectedCategory}
    onCategoryChange={setSelectedCategory}
    isMobile={isMobile}
  />
);

// Replace the renderBasicInformation function with:
const renderBasicInformation = () => {
  return (
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
      renderDriverDropdown={renderDriverDropdown}
    />
  );
};


const handleAddReservation = async () => {
  try {
    setLoading(true);
    const userId = SecureStorage.getSessionItem('user_id');

    // Common validation for dates
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return false;
    }

    // Resource type specific validation and submission
    if (formData.resourceType === 'venue') {
      if (!formData.eventTitle || !formData.description || formData.venues.length === 0) {
        toast.error('Please fill in all required venue reservation fields');
        return false;
      }

      const venuePayload = {
        operation: 'venuereservation',
        form_data: {
          title: formData.eventTitle.trim(),
          description: formData.description.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          participants: formData.participants ? formData.participants.toString() : "0",
          user_id: userId,
          venues: formData.venues,
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: equipId,
            quantity: parseInt(quantity)
          })).filter(item => item.quantity > 0)
        }
      };

      // Proceed with venue reservation
      const response = await axios.post(
        `${encryptedUrl}/insert_reservation.php`,
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

    } else if (formData.resourceType === 'vehicle') {
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

      const vehiclePayload = {
        operation: 'vehiclereservation',
        form_data: {
          destination: formData.destination.trim(),
          purpose: formData.purpose.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          user_id: userId,
          vehicles: selectedModels,
          passengers: formData.passengers.map(p => p.name.trim()),
          driver_id: formData.driverName || null,
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: equipId,
            quantity: parseInt(quantity)
          })).filter(item => item.quantity > 0)
        }
      };

      // Proceed with vehicle reservation
      const response = await axios.post(
        `${encryptedUrl}/insert_reservation.php`,
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

    } else if (formData.resourceType === 'equipment') {
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
          equipment: selectedEquipment
        }
      };

      console.log('Equipment Payload:', JSON.stringify(equipmentPayload, null, 2));

      // Proceed with equipment reservation
      const response = await axios.post(
        `${encryptedUrl}/insert_reservation.php`,
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
    toast.error(error.message || 'An error occurred while submitting the reservation');
    return false;
  } finally {
    setLoading(false);
  }
};



const resetForm = () => {
  // Reset all form-related state
  setFormData({
    resourceType: '',
    startDate: null,
    endDate: null,
    selectedTime: null,
    eventTitle: '',
    description: '',
    participants: '',
    venues: [],
    purpose: '',
    destination: '',
    passengers: [],
    driverType: 'default',
    driverName: '',
    tripTicketDriver: null,
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
  setNewPassenger('');
  
  // Reset calendar data
  setCalendarData({
    reservations: [],
    holidays: [],
    equipmentAvailability: []
  });
  
  // Reset driver-related state
  setAvailableDrivers([]);
  setIsLoadingDrivers(false);
  
  // Reset step
  setCurrentStep(0);
  
  // Show confirmation toast
  toast.success('Form reset successfully. You can start a new reservation.');
};



const renderReviewSection = () => {
  const selectedVenues = venues.filter(v => formData.venues.includes(v.ven_id));
  const selectedVehicleDetails = vehicles.filter(v => selectedModels.includes(v.vehicle_id));

  // Add debug logging for equipment
  console.log('Selected Equipment in AddReservation:', {
    selectedVenueEquipment,
    equipmentQuantities,
    equipment,
    formData
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
    />
  );
};


const handleVehicleSelect = (vehicleId) => {
  setSelectedModels(prevSelected => {
    if (prevSelected.includes(vehicleId)) {
      return prevSelected.filter(id => id !== vehicleId);
    } else {
      return [...prevSelected, vehicleId];
    }
  });
};



// Enhanced success state with better visuals
const renderSuccessState = () => (
  <motion.div
    {...fadeInAnimation}
    className="min-h-[400px] flex items-center justify-center"
  >
    <Result
      status="success"
      title="Reservation Successfully Created!"
      subTitle="Your reservation has been submitted and is pending approval. You'll receive a notification once it's approved."
      extra={[
        <AntButton 
          type="primary" 
          key="dashboard"
          onClick={() => navigate('/dean/reservation')}
          icon={<DashboardOutlined />}
          className="bg-green-500 hover:bg-green-600 border-green-500"
        >
          View All Reservations
        </AntButton>,
        <AntButton 
          key="new" 
          onClick={resetForm}
          icon={<PlusOutlined />}
        >
          Create Another Reservation
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
        resourceType={formData.resourceType}
        onResourceTypeSelect={(type) => {
          setResourceType(type);
          setFormData(prev => ({ ...prev, resourceType: type }));
        }}
      />
    ),
    1: () => {
      if (resourceType === 'venue') {
        return renderVenues();
      } else if (resourceType === 'vehicle') {
        return renderResources();
      } else if (resourceType === 'equipment') {
        return renderEquipmentSelection();
      }
    },
    2: () => (
      <div className="space-y-4">
      
        
        <ReservationCalendar
          onDateSelect={(startDate, endDate) => {
            setFormData((prev) => ({
              ...prev,
              startDate: startDate,
              endDate: endDate,
            }));
            // Automatically advance to step 3 (details step) when date is selected successfully
            setCurrentStep(3);
            // Show success message
            toast.success('Date and time selected successfully! Please fill in the required details.');
          }}
          selectedResource={{
            type: formData.resourceType,
            id: formData.resourceType === 'equipment' 
              ? Object.entries(equipmentQuantities)
                  .filter(([_, qty]) => qty > 0)
                  .map(([id, qty]) => ({
                    id: parseInt(id),
                    quantity: qty
                  }))
              : formData.resourceType === 'venue' 
                ? formData.venues
                : selectedModels
          }}
          initialData={calendarData} // Pass the fetched calendar data
        />
      </div>
    ),
    3: renderBasicInformation,
    4: renderReviewSection,
    5: renderSuccessState,
  };

  return (
    <div className="min-h-[400px]">
      {steps[currentStep] && steps[currentStep]()}
    </div>
  );
};

const renderEquipmentSelection = () => (
  <ResourceEquipment
    equipmentCategories={equipmentCategories}
    selectedCategory={selectedCategory}
    onCategoryChange={setSelectedCategory}
    equipmentQuantities={equipmentQuantities}
    onQuantityChange={(equipId, value) => {
      setEquipmentQuantities(prev => ({
        ...prev,
        [equipId]: value
      }));
      
      if (formData.resourceType === 'venue' || formData.resourceType === 'vehicle') {
        setSelectedVenueEquipment(prev => {
          const newSelection = { ...prev };
          if (value <= 0) {
            delete newSelection[equipId];
          } else {
            newSelection[equipId] = value;
          }
          return newSelection;
        });
      }
    }}
    isMobile={isMobile}
    startDate={formData.startDate}
    endDate={formData.endDate}
  />
);





const StepIndicator = ({ currentStep, resourceType, isMobile }) => {
  const steps = [
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
          <i className="pi pi-tools" />
    },
    { 
      title: 'Schedule',
      description: 'Pick dates & times',
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
      title: 'Complete',
      description: 'Confirmation',
      icon: <i className="pi pi-check-circle" />
    }
  ];

  const progressPercentage = (currentStep / (steps.length - 1)) * 100;
  const circumference = 2 * Math.PI * (isMobile ? 40 : 45); // Smaller radius for mobile
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
              {currentStep + 1}/{steps.length}
            </span>
            <span className={`
              ${isMobile ? 'text-xs' : 'text-sm'}
              text-gray-500 font-medium
            `}>
              Step
            </span>
          </div>

          {/* Completion Animation */}
          {currentStep === steps.length - 1 && (
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
              {steps[currentStep].icon}
            </span>
            {steps[currentStep].title}
          </div>
          <p className={`
            ${isMobile ? 'text-sm' : 'text-base'}
            text-gray-500 mt-1
          `}>
            {steps[currentStep].description}
          </p>

          {/* Mini Steps Indicator */}
          <div className="flex gap-1.5 mt-4 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`
                  rounded-full transition-all duration-300
                  ${index === currentStep
                    ? 'w-6 h-2 bg-green-500'
                    : index < currentStep
                    ? 'w-2 h-2 bg-green-500'
                    : 'w-2 h-2 bg-gray-200'
                  }
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
  const selectedDriver = drivers.find(d => d.driver_id.toString() === formData.driverName?.toString());
  
  const printContent = document.createElement('div');
  printContent.innerHTML = `
    <div style="padding: 20px;">
      <h2 style="text-align: center; margin-bottom: 20px;">Reservation Request Details</h2>
      
      <div style="margin-bottom: 20px;">
        <h3>Basic Information</h3>
        <p><strong>Reservation Name:</strong> ${formData.reservationName}</p>
        <p><strong>Resource Type:</strong> ${formData.resourceType}</p>
        <p><strong>Date:</strong> ${format(new Date(formData.startDate), 'PPP')} - ${format(new Date(formData.endDate), 'PPP')}</p>
        <p><strong>Time:</strong> ${format(new Date(formData.startDate), 'p')} - ${format(new Date(formData.endDate), 'p')}</p>
      </div>

      ${formData.resourceType === 'venue' ? `
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


const [drivers] = useState([]);
const [showPassengerModal, setShowPassengerModal] = useState(false);
const [newPassenger, setNewPassenger] = useState('');

// Add fetchDrivers function
const fetchDrivers = useCallback(async (startDate, endDate) => {
  setIsLoadingDrivers(true);

  try {
    const response = await axios.post(`${encryptedUrl}/user.php`, {
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
    toast.error('Failed to fetch available drivers');
  } finally {
    setIsLoadingDrivers(false);
  }
}, [encryptedUrl]);

// Add useEffect to fetch drivers
useEffect(() => {
  if (formData.startDate && formData.endDate && formData.resourceType === 'vehicle') {
    fetchDrivers(formData.startDate, formData.endDate);
  }
}, [formData.startDate, formData.endDate, formData.resourceType, fetchDrivers]);

// Add PassengerModal component
const PassengerModal = ({ visible, onHide }) => {
  const [newPassengerName, setNewPassengerName] = useState('');
  const [passengerError, setPassengerError] = useState('');

  const resetModal = () => {
    setNewPassengerName('');
    setPassengerError('');
  };

  const handleSubmit = () => {
    if (!newPassengerName.trim()) {
      setPassengerError('Passenger name cannot be empty');
      return;
    }
    
    // Check if passenger name already exists
    if (formData.passengers.some(p => p.name.toLowerCase() === newPassengerName.trim().toLowerCase())) {
      setPassengerError('This passenger is already in the list');
      return;
    }
    
    handleAddPassenger(newPassengerName.trim());
    resetModal();
    onHide();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <TeamOutlined />
          <span>Add Passenger</span>
        </div>
      }
      open={visible}
      onCancel={() => {
        resetModal();
        onHide();
      }}
      footer={[
        <Button key="cancel" onClick={onHide}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
        >
          Add Passenger
        </Button>
      ]}
    >
      <div className="mb-4">
        <Alert
          message="Passenger Guidelines"
          description="Add each passenger who will be traveling in the vehicle. Make sure to include all passengers for accurate capacity planning."
          type="info"
          showIcon
          className="mb-4"
        />
        
        <Form layout="vertical">
          <Form.Item 
            label="Passenger Name" 
            required
            validateStatus={passengerError ? "error" : ""}
            help={passengerError}
          >
            <Input
              placeholder="Enter passenger's full name"
              value={newPassengerName}
              onChange={e => {
                setNewPassengerName(e.target.value);
                if (passengerError) setPassengerError('');
              }}
              onPressEnter={handleSubmit}
              suffix={
                <GuidelineTooltip 
                  title="Passenger Name"
                  content="Enter the full name of the passenger. This information will be used for the travel manifest."
                />
              }
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

// Enhanced Equipment Selection Modal with search, filtering and better UI
const EquipmentSelectionModal = ({ localEquipmentQuantities, setLocalEquipmentQuantities }) => {
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localState, setLocalState] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
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
    const maxAvailable = Number(equip.available_quantity) || 0;
    
    // Ensure quantity doesn't exceed available amount and is not negative
    const constrainedValue = Math.max(0, Math.min(numericValue, maxAvailable));
    
    console.log('Updating equipment quantity:', {
      equipmentId: equipmentKey,
      equipmentName: equip.equipment_name,
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
  };
  
  const handleConfirm = () => {
    // Update both states to ensure consistency
    setEquipmentQuantities(localState);
    setSelectedVenueEquipment(localState);
    setShowEquipmentModal(false);
  };
  
  const handleCancel = () => {
    // Reset local state when cancelling
    setLocalState({});
    setShowEquipmentModal(false);
  };
  


  // Equipment Card Component for list view only
  const EquipmentCard = ({ item, isSelected, onClick, currentQuantity, onQuantityChange }) => {
    const availableQuantity = parseInt(item.available_quantity) || 0;
    const isAvailable = availableQuantity > 0;

    // Debug logging to check equipment data structure
    console.log('Equipment item:', item);

    return (
      <Card
        className={`
          overflow-hidden border-0 shadow-sm hover:shadow-md transition-all
          ${currentQuantity > 0 ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}
          flex h-full p-4
        `}
        onClick={onClick}
      >
        <div className="flex flex-row items-center gap-3 w-full">
          {/* Equipment Icon/Placeholder */}
          <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-50 w-16 h-16 flex-shrink-0">
            <BsTools className="text-green-500 text-3xl" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-gray-800 truncate text-base">
                  {item.equipment_name || item.equip_name || item.name || 'Equipment Name Not Available'}
                </h3>
                {currentQuantity > 0 && (
                  <Tag 
                    color="green"
                    className="flex items-center font-medium whitespace-nowrap text-xs px-2 py-0.5"
                  >
                    {currentQuantity} selected
                  </Tag>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1 text-gray-600">
                  <MdInventory className="text-green-500 text-base" />
                  <span className="text-sm">
                    qty: {availableQuantity}
                  </span>
                </div>
                {/* Add equipment category if available */}
                {item.equipment_category_name && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <span className="text-sm">
                      Category: {item.equipment_category_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Controls */}
            {isAvailable && (
              <div className="flex items-center justify-center gap-2 mt-auto pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newQty = Math.max(0, currentQuantity - 1);
                    console.log('Decreasing quantity for equipment:', item.equip_id, 'from', currentQuantity, 'to', newQty);
                    onQuantityChange(item.equip_id, newQty);
                  }}
                  disabled={currentQuantity === 0}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${currentQuantity > 0 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    transition-colors
                  `}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={availableQuantity}
                  value={currentQuantity}
                  onChange={(e) => {
                    e.stopPropagation();
                    const value = parseInt(e.target.value) || 0;
                    const clampedValue = Math.min(Math.max(0, value), availableQuantity);
                    console.log('Input change for equipment:', item.equip_id, 'value:', value, 'clamped:', clampedValue);
                    onQuantityChange(item.equip_id, clampedValue);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 h-6 text-center border border-gray-300 rounded text-xs font-medium
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newQty = currentQuantity + 1;
                    console.log('Increasing quantity for equipment:', item.equip_id, 'from', currentQuantity, 'to', newQty);
                    onQuantityChange(item.equip_id, newQty);
                  }}
                  disabled={currentQuantity >= availableQuantity}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${currentQuantity < availableQuantity 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    transition-colors
                  `}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };
  
  // Filter equipment by search term and category
  const filteredEquipment = equipment.filter(item => {
    if (!item) return false;
    
    const searchTerm = equipmentSearch?.toLowerCase() || '';
    const itemName = item.equipment_name?.toLowerCase() || '';
    const categoryId = item.equipment_category_id?.toString() || '';
    
    const matchesSearch = itemName.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || categoryId === selectedCategory.toString();
    
    return matchesSearch && matchesCategory;
  });

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
  
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <BsTools />
          <span>Select Equipment</span>
        </div>
      }
      open={showEquipmentModal}
      onCancel={handleCancel}
      width={1000}
      footer={[
        <AntButton key="cancel" onClick={handleCancel}>
          Cancel
        </AntButton>,
        <AntButton
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          className="bg-green-500 hover:bg-green-600 border-green-500"
        >
          Confirm Selection
        </AntButton>
      ]}
    >
      <div className="space-y-4">

        
        {/* Header with Search and Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4">
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

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
            <Input.Search
              placeholder="Search equipment by name..."
              prefix={<SearchOutlined className="text-gray-400" />}
              onChange={(e) => handleSearch(e.target.value)}
              value={equipmentSearch}
              className="w-full max-w-md"
              size="large"
            />
            
            <Select
              placeholder="Filter by category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="w-full sm:w-60"
              options={[
                { value: 'all', label: 'All Categories' },
                ...equipmentCategories.map(cat => ({
                  value: cat.equipment_category_id.toString(),
                  label: cat.equipment_category_name
                }))
              ]}
            />
          </div>
        </div>

        {/* Equipment List */}
        <div className="max-h-[500px] overflow-y-auto">
          <div className="flex flex-col gap-2">
            {currentEquipment.map((item) => {
              const equipmentKey = String(item.equip_id);
              const currentQty = localState[equipmentKey] || 0;
              
              console.log('Rendering equipment card:', {
                equipmentId: equipmentKey,
                equipmentName: item.equipment_name,
                currentQty: currentQty,
                localState: localState
              });
              
              return (
                <EquipmentCard
                  key={equipmentKey}
                  item={item}
                  isSelected={currentQty > 0}
                  onClick={() => {
                    const availableQty = parseInt(item.available_quantity) || 0;
                    if (currentQty === 0 && availableQty > 0) {
                      console.log('Clicking to add equipment:', equipmentKey);
                      handleLocalQuantityChange(equipmentKey, 1);
                    } else if (currentQty > 0) {
                      console.log('Clicking to remove equipment:', equipmentKey);
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

          {/* Pagination */}
          {filteredEquipment.length > 0 && (
            <div className="flex justify-center mt-4 bg-white rounded-lg shadow-sm p-4">
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
                size="default"
                showSizeChanger={false}
                showQuickJumper={true}
              />
            </div>
          )}
        </div>
        
        {/* Summary Footer */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="text-sm font-medium">
            Selected Items: <span className="text-green-500">
              {Object.values(localState).filter(qty => qty > 0).length}
            </span>
          </div>
          <div className="text-sm font-medium">
            Total Quantity: <span className="text-green-500">
              {Object.values(localState).reduce((sum, qty) => sum + qty, 0)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Add this with other function declarations
const renderDriverDropdown = () => {
  return (
    <Form.Item
      label={<span className="text-sm">Driver Information <span className="text-red-500">*</span></span>}
      required
    >
      <div className="space-y-3">
        <Radio.Group
          value={formData.driverType}
          onChange={(e) => {
            setFormData(prev => ({
              ...prev,
              driverType: e.target.value,
              driverName: e.target.value === 'trip_ticket' ? null : '', // Set null for trip ticket
              tripTicketDriver: null
            }));
          }}
          className="mb-4"
        >
          <Radio value="default">Default Driver</Radio>
          <Radio value="trip_ticket">Trip Ticket Driver</Radio>
        </Radio.Group>

        {formData.driverType === 'default' ? (
          isLoadingDrivers ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Spin size="small" />
              <span className="text-gray-500">Loading available drivers...</span>
            </div>
          ) : (
            <>
              <Select
                value={formData.driverName}
                onChange={(value) => {
                  setFormData(prevState => ({
                    ...prevState,
                    driverName: value,
                    tripTicketDriver: null
                  }));
                }}
                placeholder="Select a default driver"
                className="w-full"
                disabled={availableDrivers.length === 0}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                }
              >
                {availableDrivers.map(driver => (
                  <Select.Option 
                    key={driver.users_id} 
                    value={driver.driver_id}
                  >
                    {driver.driver_full_name}
                  </Select.Option>
                ))}
              </Select>

              {formData.driverName && (
                <Card className="bg-green-50 border-green-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <UserOutlined className="text-xl text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium text-green-700">
                        {availableDrivers.find(d => d.driver_id === formData.driverName)?.driver_full_name}
                      </div>
                      <div className="text-sm text-green-600">
                        {availableDrivers.find(d => d.driver_id === formData.driverName)?.departments_name || 'Driver'}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              Trip ticket driver will be assigned later
            </div>
          </div>
        )}
      </div>
    </Form.Item>
  );
};

// Add a new guidelines component that can be reused across the form
const GuidelineTooltip = ({ title, content }) => (
  <Tooltip
    title={
      <div className="p-1">
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-xs">{content}</p>
      </div>
    }
    color="#fff"
    overlayInnerStyle={{ 
      color: '#555', 
      boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
      border: '1px solid #eee'
    }}
  >
    <QuestionCircleOutlined className="ml-1 text-gray-400 cursor-help" />
  </Tooltip>
);

// Add fetch functions for resources
const fetchVenues = useCallback(async () => {
  try {
    const response = await axios({
      method: 'post',
      url: `${encryptedUrl}/fetch2.php`,
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
    toast.error('Failed to fetch venues');
  }
}, [encryptedUrl]);

const fetchVehicles = useCallback(async () => {
  try {
    const response = await axios({
      method: 'post',
      url: `${encryptedUrl}/fetch2.php`,
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
    toast.error('Failed to fetch vehicles');
  }
}, [encryptedUrl]);

const fetchEquipment = useCallback(async () => {
  try {
    const response = await axios({
      method: 'post',
      url: `${encryptedUrl}/fetch2.php`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        operation: 'fetchEquipments'
      }
    });
    if (response.data.status === 'success') {
      setEquipment(response.data.data);
    }
  } catch (error) {
    console.error('Error fetching equipment:', error);
    toast.error('Failed to fetch equipment');
  }
}, [encryptedUrl]);

// Add useEffect to fetch resources when component mounts
useEffect(() => {
  fetchVenues();
  fetchVehicles();
  fetchEquipment();
}, [fetchVenues, fetchVehicles, fetchEquipment]);

// Add useEffect to handle calendar data fetching
useEffect(() => {
  if (currentStep === 2) { // Calendar step
    const fetchCalendarData = async () => {
      try {
        // Fetch holidays
        const holidayResponse = await axios.post(
          `${encryptedUrl}/user.php`,
          {
            operation: 'fetchHoliday'
          }
        );

        if (holidayResponse.data.status === 'success') {
          const formattedHolidays = holidayResponse.data.data.map(holiday => ({
            name: holiday.holiday_name,
            date: holiday.holiday_date
          }));
          setCalendarData(prev => ({ ...prev, holidays: formattedHolidays }));
        }

        // Fetch reservations based on resource type
        if (formData.resourceType === 'equipment') {
          const equipmentResponse = await axios.post(
            `${encryptedUrl}/user.php`,
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
              equipmentAvailability: equipmentResponse.data.data
            }));
          }
        } else {
          const reservationResponse = await axios.post(
            `${encryptedUrl}/user.php`,
            {
              operation: 'fetchReservations',
              resourceType: formData.resourceType,
              resourceIds: formData.resourceType === 'venue' 
                ? formData.venues 
                : selectedModels
            }
          );

          if (reservationResponse.data.status === 'success') {
            setCalendarData(prev => ({
              ...prev,
              reservations: reservationResponse.data.data
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        toast.error('Failed to fetch calendar data');
      }
    };

    fetchCalendarData();
  }
}, [currentStep, formData.resourceType, formData.venues, selectedModels, equipmentQuantities, encryptedUrl]);

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="hidden md:block">
      {userLevel === '100' && <Sidebar />}
    </div>
    <div className={`w-full transition-all duration-300 ${isMobile ? 'px-2 py-3' : 'p-6'}`}>
      <div className={`mx-auto ${isMobile ? 'max-w-full' : 'max-w-6xl'}`}>
        <div className={`bg-white rounded-xl shadow-sm p-4 border border-gray-100 ${isMobile ? 'mb-2' : 'mb-6'}`}>
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
            <Button
              onClick={() => navigate(-1)}
              className="p-button-text flex items-center gap-2 hover:bg-green-50 transition-colors"
              icon={<i className="pi pi-arrow-left text-green-500" />}
            >
              <span className="font-medium text-green-600">Back to Dashboard</span>
            </Button>
          </div>
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl mt-2' : 'text-3xl'}`}>
            Create Reservation
          </h1>
          <p className="text-gray-600 text-sm">
            Complete the steps below to make your reservation
          </p>
        </div>

        {/* Enhanced steps indicator */}
        <div className={`bg-white rounded-xl shadow-sm p-4 border border-gray-100 ${isMobile ? 'mb-2' : 'mb-6'}`}>
          <StepIndicator 
            currentStep={currentStep} 
            resourceType={formData.resourceType} 
            isMobile={isMobile}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`px-4 py-3 bg-gradient-to-r from-lime-900 to-green-900 border-b border-gray-100 ${isMobile ? 'p-3' : 'px-6 py-4'}`}>
            <h2 className={`font-semibold text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {currentStep === 0 && "Select Resource Type"}
              {currentStep === 1 && `Select ${formData.resourceType === 'venue' ? 'Venue' : formData.resourceType === 'vehicle' ? 'Vehicle' : 'Equipment'}`}
              {currentStep === 2 && "Choose Date & Time"}
              {currentStep === 3 && "Enter Details"}
              {currentStep === 4 && "Review Reservation"}
              {currentStep === 5 && "Reservation Complete"}
            </h2>
          </div>

          <div className={isMobile ? 'p-3' : 'p-6'}>
            <div className={`mx-auto ${isMobile ? 'max-w-full' : 'max-w-4xl'}`}>
              {renderStepContent()}
            </div>
          </div>

          {currentStep !== 5 && (
            <div className={`px-4 py-3 bg-gray-50 border-t border-gray-100 ${isMobile ? 'p-3' : 'px-6 py-4'}`}>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
                <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                  <AntButton
                    type="default"
                    icon={<i className="pi pi-arrow-left" />}
                    onClick={handleBack}
                    size={isMobile ? "middle" : "large"}
                    className={`p-button-outlined ${isMobile ? 'w-full' : ''}`}
                    disabled={currentStep === 0}
                  >
                    {isMobile ? 'Back' : 'Previous'}
                  </AntButton>
                  {currentStep === 4 ? (
                    <AntButton
                      type="primary"
                      icon={loading ? <Spin className="mr-2" /> : <CheckCircleOutlined />}
                      onClick={handleAddReservation}
                      size={isMobile ? "middle" : "large"}
                      className={`${isMobile ? 'w-full' : ''} p-button-success bg-green-500 hover:bg-green-600 border-green-500`}
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit'}
                    </AntButton>
                  ) : (
                    <AntButton
                      type="primary"
                      icon={<i className="pi pi-arrow-right" />}
                      onClick={handleNext}
                      size={isMobile ? "middle" : "large"}
                      className={`${isMobile ? 'w-full' : ''} p-button-primary bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 border-lime-600 text-white`}
                    >
                      Next
                    </AntButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Rest of the components */}
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

    <PassengerModal
      visible={showPassengerModal}
      onHide={() => {
        setShowPassengerModal(false);
        setNewPassenger('');
      }}
    />
    <EquipmentSelectionModal 
      localEquipmentQuantities={localEquipmentQuantities}
      setLocalEquipmentQuantities={setLocalEquipmentQuantities}
    />
    

  </div>
);
};



export default AddReservation;



