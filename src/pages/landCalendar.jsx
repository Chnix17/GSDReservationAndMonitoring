import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import Sidebar from './Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  addWeeks,
  subWeeks
} from 'date-fns';
import { SecureStorage } from '../utils/encryption';

// Updated theme constants
const themeColors = {
  primary: '#1a73e8',
  secondary: '#4285f4',
  light: '#e8f0fe',
  white: '#FFFFFF',
  success: '#34a853',
  warning: '#fbbc04',
  error: '#ea4335',
  text: '#202124',
  border: '#dadce0'
};

// Add animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const scaleUp = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 }
};

// Add custom hook for keyboard navigation
const useKeyboardNavigation = (currentDate, setCurrentDate) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          setCurrentDate(prev => addDays(prev, -1));
          break;
        case 'ArrowRight':
          setCurrentDate(prev => addDays(prev, 1));
          break;
        case 'ArrowUp':
          setCurrentDate(prev => addWeeks(prev, -1));
          break;
        case 'ArrowDown':
          setCurrentDate(prev => addWeeks(prev, 1));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentDate]);
};

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view] = useState('month');
  const [setShowYearSelect] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const user_level_id = localStorage.getItem('user_level_id');
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [venueDetails, setVenueDetails] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [equipmentDetails, setEquipmentDetails] = useState(null);

  const encryptedUrl = SecureStorage.getLocalItem("url");

  // Add venue and vehicle color mapping
  const resourceColors = {
    venue: 'bg-emerald-200 text-emerald-800',
    vehicle: 'bg-purple-200 text-purple-800'
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
    }
}, [navigate]);

  const fetchReservations = async () => {
    try {
      const response = await axios({
        method: 'POST',
        url: `${encryptedUrl}records&reports.php`,
        data: JSON.stringify({ operation: 'fetchRecord' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Raw API Response:', response);
      console.log('Response Data:', response.data);

      if (response.data.status === 'success') {
        // Parse dates before setting state
        const parsedReservations = response.data.data.map(reservation => {
          console.log('Processing reservation:', reservation);
          return {
            ...reservation,
            reservation_start_date: new Date(reservation.approval_created_at),
            // For end date, parse the time from details string or default to same day
            reservation_end_date: reservation.venue_details || reservation.vehicle_details
              ? new Date(new Date(reservation.approval_created_at).setHours(17, 0, 0))
              : new Date(reservation.approval_created_at)
          };
        });
        console.log('Parsed reservations:', parsedReservations);
        setReservations(parsedReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const isDateInRange = (date, startDate, endDate) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return compareDate >= start && compareDate <= end;
  };

  const getReservationForDate = (date) => {
    return reservations.filter(reservation => {
      // Parse the date strings from venue or vehicle details
      let startDate, endDate;

      if (reservation.venue_details) {
        const dates = reservation.venue_details.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) to (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        if (dates) {
          startDate = new Date(dates[1]);
          endDate = new Date(dates[2]);
        }
      } else if (reservation.vehicle_details) {
        const dates = reservation.vehicle_details.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) to (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        if (dates) {
          startDate = new Date(dates[1]);
          endDate = new Date(dates[2]);
        }
      }

      // Fallback to approval_created_at if no dates found in details
      if (!startDate || !endDate) {
        startDate = new Date(reservation.approval_created_at);
        endDate = new Date(reservation.approval_created_at);
      }

      return isDateInRange(date, startDate, endDate);
    }).map(reservation => ({
      ...reservation,
      formattedResources: [
        ...(reservation.venue_form_name ? [{
          type: 'venue',
          name: reservation.venue_form_name,
          details: reservation.venue_details
        }] : []),
        ...(reservation.vehicle_form_name ? [{
          type: 'vehicle',
          name: reservation.vehicle_form_name,
          details: reservation.vehicle_details
        }] : [])
      ]
    }));
  };


  const handleDateNavigation = (direction) => {
    switch (view) {
      case 'month':
        setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate(prev => direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1));
        break;
      default:
        setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
    }
  };

  const handleYearSelect = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setShowYearSelect(false);
  };

  const renderYearModal = () => {
    const currentYear = currentDate.getFullYear();
    const yearsArray = Array.from({ length: 21 }, (_, i) => 
      currentYear - 10 + i
    );

    return (
      <Dialog
        open={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold mb-4">Select Year</Dialog.Title>
            <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {yearsArray.map(year => (
                <motion.button
                  key={year}
                  className={`p-3 rounded-lg ${
                    year === currentYear 
                      ? 'bg-blue-500 text-white' 
                      : 'hover:bg-blue-50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleYearSelect(year);
                    setIsYearModalOpen(false);
                  }}
                >
                  {year}
                </motion.button>
              ))}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  };

  // Enhanced calendar cell rendering
  const renderCalendarGrid = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const start = startOfWeek(firstDayOfMonth);
    const end = endOfWeek(lastDayOfMonth);
    const days = eachDayOfInterval({ start, end });
  
    return (
      <motion.div 
        className="grid grid-cols-7 gap-2"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayReservations = getReservationForDate(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <motion.div
              key={day.toString()}
              className={`
                relative min-h-[120px] p-3 rounded-lg
                transition-all duration-200 ease-in-out
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
                ${isToday ? 'ring-2 ring-primary ring-offset-2' : 'border border-border'}
                hover:shadow-lg hover:border-primary
                focus-within:ring-2 focus-within:ring-primary
              `}
              variants={scaleUp}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center
                  ${isToday ? 'bg-primary text-white' : ''}
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-text'}
                `}>
                  {format(day, 'd')}
                </span>
                {dayReservations.length > 0 && (
                  <span className="text-xs font-medium text-gray-500">
                    {dayReservations.length} events
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayReservations.slice(0, 3).map((reservation, idx) => (
                  <motion.div
                    key={`${reservation.approval_id}-${idx}`}
                    className="group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleReservationClick(reservation)}
                  >
                    {/* Enhanced reservation display */}
                    {reservation.formattedResources.map((resource, resourceIdx) => (
                      <div
                        key={resourceIdx}
                        className={`
                          p-1.5 rounded-md text-xs font-medium
                          ${resourceColors[resource.type]}
                          group-hover:shadow-sm transition-all
                        `}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-current"/>
                          <span className="truncate">{resource.name}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ))}
                {dayReservations.length > 3 && (
                  <div className="text-xs text-gray-500 pl-2">
                    +{dayReservations.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  const handleReservationClick = async (reservation) => {
    try {
      const response = await axios({
        method: 'POST',
        url: `${encryptedUrl}records&reports.php`,
        data: JSON.stringify({
          operation: 'getReservationDetailsById',
          json: {
            reservation_id: reservation.reservation_id
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response from API:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        if (response.data.data.venue && Object.values(response.data.data.venue).some(v => v !== null)) {
          setVenueDetails(response.data.data.venue);
          setIsVenueModalOpen(true);
        }
        if (response.data.data.vehicle && Object.values(response.data.data.vehicle).some(v => v !== null)) {
          setVehicleDetails(response.data.data.vehicle);
          setIsVehicleModalOpen(true);
        }
        if (response.data.data.equipment && Object.values(response.data.data.equipment).some(v => v !== null)) {
          setEquipmentDetails(response.data.data.equipment);
        }
      } else {
        console.error('Invalid response format:', response.data);
        alert('Could not fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      alert('Error fetching reservation details');
    }
  };

  // Enhanced modal rendering with new animations and styling
  const VenueDetailsModal = () => (
    <Dialog
      open={isVenueModalOpen}
      onClose={() => setIsVenueModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl bg-white shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                {venueDetails?.venue_form_name || 'Venue Reservation Details'}
              </Dialog.Title>
              {venueDetails && (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Status: {venueDetails.status_request || 'Reserved'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsVenueModalOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {venueDetails && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Event Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Venue Name</p>
                    <p className="font-medium">{venueDetails.venue_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event Title</p>
                    <p className="font-medium">{venueDetails.venue_form_event_title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p>{venueDetails.venue_form_description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Participants</p>
                    <p>{venueDetails.venue_participants}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p>{new Date(venueDetails.venue_form_start_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p>{new Date(venueDetails.venue_form_end_date).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {equipmentDetails && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Equipment</h3>
                  <div className="flex items-center space-x-2">
                    <p>{equipmentDetails.equipment_name}</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Quantity: {equipmentDetails.reservation_equipment_quantity}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const VehicleDetailsModal = () => (
    <Dialog
      open={isVehicleModalOpen}
      onClose={() => setIsVehicleModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl bg-white shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                {vehicleDetails?.vehicle_form_name || 'Vehicle Reservation Details'}
              </Dialog.Title>
              {vehicleDetails && (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Status: {vehicleDetails.status_request || 'Reserved'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsVehicleModalOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {vehicleDetails && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">License Plate</p>
                    <p className="font-medium">{vehicleDetails.vehicle_license}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Make</p>
                    <p className="font-medium">{vehicleDetails.vehicle_make}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Model</p>
                    <p className="font-medium">{vehicleDetails.vehicle_model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{vehicleDetails.vehicle_category}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Trip Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Purpose</p>
                    <p>{vehicleDetails.vehicle_form_purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p>{vehicleDetails.vehicle_form_destination}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p>{vehicleDetails.vehicle_form_start_date && new Date(vehicleDetails.vehicle_form_start_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p>{vehicleDetails.vehicle_form_end_date && new Date(vehicleDetails.vehicle_form_end_date).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Passengers</h3>
                <div className="space-y-2">
                  {vehicleDetails.passengers && vehicleDetails.passengers.length > 0 ? (
                    vehicleDetails.passengers.map((passenger, index) => (
                      <div key={index} className="px-3 py-2 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-800">{passenger}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No passengers listed</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  useKeyboardNavigation(currentDate, setCurrentDate);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <motion.div 
            className="rounded-xl bg-white shadow-xl"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center justify-between mb-6"> {/* decreased from mb-10 */}
              <div className="flex items-center space-x-4"> {/* decreased from space-x-6 */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full hover:bg-gray-100"
                  style={{ color: themeColors.primary }}
                  onClick={() => handleDateNavigation('prev')}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <div className="relative">
                  <h2 
                    className="text-2xl font-bold cursor-pointer hover:text-blue-500" 
                    style={{ color: themeColors.primary }}
                    onClick={() => setIsYearModalOpen(true)}
                  > 
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full hover:bg-gray-100"
                  onClick={() => handleDateNavigation('next')}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2"> {/* decreased gap and margin */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div 
                  key={day} 
                  className="text-center text-base font-semibold text-gray-600 py-1" /* decreased text and padding */
                  style={{ color: themeColors.primary }}
                >
                  {day}
                </div>
              ))}
            </div>
            {renderCalendarGrid()}
            {renderYearModal()}
            <VenueDetailsModal />
            <VehicleDetailsModal />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

       
export default Calendar;


