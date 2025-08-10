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
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
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

    // State for day events modal
  const [dayEventsModal, setDayEventsModal] = useState({
    isOpen: false,
    date: null,
    events: []
  });

  // Handle day cell click to show events
  const handleDayClick = (day, dayReservations) => {
    if (dayReservations.length > 0) {
      setDayEventsModal({
        isOpen: true,
        date: day,
        events: dayReservations
      });
    }
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
        className="grid grid-cols-7 gap-0.5 md:gap-1 w-full"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayReservations = getReservationForDate(day);
          const isToday = isSameDay(day, new Date());
          const hasEvents = dayReservations.length > 0;
          
          return (
            <motion.div
              key={day.toString()}
              className={`
                relative min-h-[120px] md:min-h-[160px] p-2 md:p-4 rounded-none
                transition-all duration-200 ease-in-out cursor-pointer
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
                ${isToday ? 'ring-2 ring-green-500' : 'border border-gray-200'}
                hover:bg-gray-50 hover:shadow-inner
                focus-within:ring-2 focus-within:ring-green-500
                flex flex-col
                border-r border-b border-gray-100
              `}
              variants={scaleUp}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDayClick(day, dayReservations)}
            >
              <div className="flex items-center justify-between">
                <span className={`
                  text-sm md:text-base font-medium rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center
                  ${isToday ? 'bg-green-500 text-white' : ''}
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                `}>
                  {format(day, 'd')}
                </span>
                {hasEvents && (
                  <span className="text-xs font-medium text-white bg-green-500 rounded-full px-2 py-1">
                    {dayReservations.length} event{dayReservations.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Empty state with subtle animation when no events */}
              {!hasEvents && (
                <motion.div 
                  className="flex-1 flex items-center justify-center opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-xs text-gray-400">No events</span>
                </motion.div>
              )}

              {/* Event indicators (small dots) */}
              {hasEvents && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  {dayReservations.slice(0, 3).map((reservation, idx) => (
                    <div 
                      key={`event-${reservation.approval_id}-${idx}`}
                      className={`h-1.5 rounded-full ${reservation.displayInfo.type === 'venue' ? 'bg-green-400' : 'bg-purple-400'}`}
                      style={{
                        width: `${Math.min(100, (idx + 1) * 25)}%`,
                        opacity: 1 - (idx * 0.2)
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Day Events Modal */}
        <Dialog
          open={dayEventsModal.isOpen}
          onClose={() => setDayEventsModal(prev => ({ ...prev, isOpen: false }))}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Dialog.Panel>
                <div className="p-6">
                  <Dialog.Title className="text-xl font-bold text-gray-900">
                    {dayEventsModal.date && format(dayEventsModal.date, 'EEEE, MMMM d, yyyy')}
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {dayEventsModal.events.length > 0 ? (
                      dayEventsModal.events.map((event, idx) => (
                        <motion.div
                          key={`modal-event-${event.approval_id}-${idx}`}
                          className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            setDayEventsModal(prev => ({ ...prev, isOpen: false }));
                            handleReservationClick(event);
                          }}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-12 w-1 rounded-full ${
                              event.displayInfo.type === 'venue' ? 'bg-green-500' : 'bg-purple-500'
                            }`} />
                            <div className="ml-4 flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {event.displayInfo.title}
                                </h3>
                                
                              </div>
                              <p className="mt-1 text-sm text-gray-500">
                                {event.displayInfo.user}
                              </p>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {format(event.displayInfo.startDate, 'h:mm a')} - {format(event.displayInfo.endDate, 'h:mm a')}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                        <p className="mt-1 text-sm text-gray-500">There are no events scheduled for this day.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setDayEventsModal(prev => ({ ...prev, isOpen: false }))}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      </motion.div>
    );
  };

  const handleReservationClick = async (reservation) => {
    try {
      console.log('Fetching details for reservation:', reservation.reservation_id);
      const response = await axios({
        method: 'POST',
        url: `${encryptedUrl}/user.php`,
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
      <div className="flex-1 overflow-auto mt-16 md:mt-20 px-0 md:px-0">
        <div className="w-full mx-auto">
          <motion.div 
            className="rounded-none md:rounded-xl bg-white shadow-xl p-4 md:p-8"
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

            <div className="grid grid-cols-7 w-full bg-gray-50 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div 
                  key={day} 
                  className="text-center text-sm md:text-base font-semibold py-3 md:py-4 px-2"
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


