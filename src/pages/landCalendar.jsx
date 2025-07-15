import React, { useState, useEffect, useCallback } from 'react';
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
import ReservationDetails from '../components/core/reservation_details';

// Updated theme constants
const themeColors = {
  primary: '#10B981',
  secondary: '#059669',
  light: '#D1FAE5',
  white: '#FFFFFF',
  success: '#34a853',
  warning: '#fbbc04',
  error: '#ea4335',
  text: '#1F2937',
  border: '#E5E7EB',
  gradient: 'from-green-100 to-white'
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

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const encryptedUrl = SecureStorage.getLocalItem("url");

  const fetchReservations = useCallback(async () => {
    try {
      console.log('Fetching reservations from:', `${encryptedUrl}/user.php`);
      const response = await axios({
        method: 'POST',
        url: `${encryptedUrl}/user.php`,
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
          
          // Ensure dates are properly parsed
          const parsedReservation = {
            ...reservation,
            // Keep the original date strings as they are
            reservation_start_date: reservation.reservation_start_date,
            reservation_end_date: reservation.reservation_end_date
          };

          console.log('Parsed Reservation:', parsedReservation);
          return parsedReservation;
        });

        console.log('All Parsed Reservations:', parsedReservations);
        setReservations(parsedReservations);
      } else {
        console.error('API returned unsuccessful status:', response.data.status);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status); 
    }
  }, [encryptedUrl]);

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
    }
}, [navigate]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

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
    console.log('Getting reservations for date:', date);
    const filteredReservations = reservations.filter(reservation => {
      // Check if reservation is active and has "Reserved" status
      if (reservation.reservation_status_name !== "Reserved" || reservation.reservation_active !== 1) {
        return false;
      }

      // Use reservation_start_date and reservation_end_date directly
      const startDate = new Date(reservation.reservation_start_date);
      const endDate = new Date(reservation.reservation_end_date);
      
      console.log('Reservation dates:', {
        startDate,
        endDate,
        rawStart: reservation.reservation_start_date,
        rawEnd: reservation.reservation_end_date
      });

      const isInRange = isDateInRange(date, startDate, endDate);
      console.log('Is date in range:', isInRange);
      return isInRange;
    });

    console.log('Filtered reservations for date:', filteredReservations);
    return filteredReservations.map(reservation => {
      const displayInfo = {
        title: reservation.reservation_title || 'Untitled Reservation',
        user: reservation.user_full_name || 'Unknown User',
        type: reservation.venue_details ? 'venue' : 'vehicle',
        startDate: new Date(reservation.reservation_start_date),
        endDate: new Date(reservation.reservation_end_date)
      };
      console.log('Created display info:', displayInfo);
      return {
        ...reservation,
        displayInfo
      };
    });
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
            <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto ">
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
        className="grid grid-cols-7 gap-2 md:gap-3"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayReservations = getReservationForDate(day);
          const isToday = isSameDay(day, new Date());
          const visibleReservations = dayReservations.slice(0, 2);
          const remainingCount = Math.max(0, dayReservations.length - 2);
          
          return (
            <motion.div
              key={day.toString()}
              className={`
                relative min-h-[120px] md:min-h-[140px] p-2 md:p-3 rounded-lg
                transition-all duration-200 ease-in-out
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
                ${isToday ? 'ring-2 ring-green-500 ring-offset-2' : 'border border-gray-200'}
                hover:shadow-lg hover:border-green-500
                focus-within:ring-2 focus-within:ring-green-500
              `}
              variants={scaleUp}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-sm md:text-base font-medium rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center
                  ${isToday ? 'bg-green-500 text-white' : ''}
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                `}>
                  {format(day, 'd')}
                </span>
                {dayReservations.length > 0 && (
                  <span className="text-xs font-medium text-green-600">
                    {dayReservations.length} events
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {visibleReservations.map((reservation, idx) => (
                  <motion.div
                    key={`${reservation.approval_id}-${idx}`}
                    className="group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleReservationClick(reservation)}
                  >
                    <div
                      className={`
                        p-2 rounded-md text-xs font-medium
                        ${reservation.displayInfo.type === 'venue' 
                          ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-l-4 border-green-500' 
                          : 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-l-4 border-purple-500'}
                        group-hover:shadow-md transition-all
                      `}
                    >
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold truncate">
                          {reservation.displayInfo.title}
                        </span>
                        <span className="text-xs opacity-75 truncate">
                          {reservation.displayInfo.user}
                        </span>
                        <div className="flex items-center space-x-1 text-xs opacity-60">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            {format(reservation.displayInfo.startDate, 'HH:mm')} - 
                            {format(reservation.displayInfo.endDate, 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {remainingCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full p-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                    onClick={() => {
                      // Handle showing all events for this day
                      const allEvents = dayReservations.map(r => ({
                        title: r.displayInfo.title,
                        user: r.displayInfo.user,
                        time: `${format(r.displayInfo.startDate, 'h:mm a')} - ${format(r.displayInfo.endDate, 'h:mm a')}`
                      }));
                      alert(JSON.stringify(allEvents, null, 2));
                    }}
                  >
                    +{remainingCount} more events
                  </motion.button>
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
      console.log('Fetching details for reservation:', reservation.reservation_id);
      const response = await axios({
        method: 'POST',
        url: `${encryptedUrl}/process_reservation.php`,
        data: JSON.stringify({
          operation: 'fetchRequestById',
          reservation_id: reservation.reservation_id
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Reservation details response:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        setSelectedReservation(response.data.data);
        setIsDetailsModalOpen(true);
      } else {
        console.error('Invalid response format:', response.data);
        alert('Could not fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      alert('Error fetching reservation details');
    }
  };




  useKeyboardNavigation(currentDate, setCurrentDate);

  return (
    <div className={`flex min-h-screen bg-gradient-to-br ${themeColors.gradient}`}>
      <Sidebar />
      <div className="flex-1 overflow-auto mt-16 md:mt-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6">
          <motion.div 
            className="rounded-xl bg-white shadow-xl p-4 md:p-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 md:p-3 rounded-full hover:bg-gray-100 transition-colors"
                  style={{ color: themeColors.primary }}
                  onClick={() => handleDateNavigation('prev')}
                >
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <div className="relative">
                  <h2 
                    className="text-xl md:text-2xl font-bold cursor-pointer hover:text-green-600 transition-colors" 
                    style={{ color: themeColors.primary }}
                    onClick={() => setIsYearModalOpen(true)}
                  > 
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 md:p-3 rounded-full hover:bg-gray-100 transition-colors"
                  style={{ color: themeColors.primary }}
                  onClick={() => handleDateNavigation('next')}
                >
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div 
                  key={day} 
                  className="text-center text-sm md:text-base font-semibold py-2"
                  style={{ color: themeColors.primary }}
                >
                  {day}
                </div>
              ))}
            </div>
            {renderCalendarGrid()}
            {renderYearModal()}
          </motion.div>
        </div>
      </div>

      <ReservationDetails
        visible={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedReservation(null);
        }}
        reservationDetails={selectedReservation}
      />
    </div>
  );
};

       
export default Calendar;


