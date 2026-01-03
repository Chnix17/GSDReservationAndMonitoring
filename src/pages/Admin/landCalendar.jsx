import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { Drawer } from 'antd';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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
import { SecureStorage } from '../../utils/encryption';
import ReservationDetails from '../../components/core/reservation_details';
import JobOrderDetailsModal from '../../components/core/JobOrderDetailsModal';

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

const ticketStatusColors = {
  pending: '#F59E0B',
  ongoing: '#3B82F6',
  completed: '#10B981',
  declined: '#EF4444',
  default: '#6B7280'
};

const getTicketColor = (statusName) => {
  const statusLower = String(statusName || '').toLowerCase();
  if (statusLower.includes('pending')) return ticketStatusColors.pending;
  if (statusLower.includes('ongoing') || statusLower.includes('on-going') || statusLower.includes('in progress')) return ticketStatusColors.ongoing;
  if (statusLower.includes('complete') || statusLower.includes('done') || statusLower.includes('closed')) return ticketStatusColors.completed;
  if (statusLower.includes('decline') || statusLower.includes('reject') || statusLower.includes('cancel')) return ticketStatusColors.declined;
  return ticketStatusColors.default;
};

// Reservation type and status color mapping
const reservationColors = {
  // Trip colors
  'Trip': {
    pending: '#F59E0B',    // Amber-500
    approved: '#A855F7',   // Purple-500
    reserved: '#14B8A6',   // Teal-500
    processed: '#3B82F6',  // Blue-500
    declined: '#EF4444',   // Red-500
    completed: '#10B981',  // Green-500
    cancelled: '#6B7280',  // Gray-500
    default: '#A855F7'     // Purple-500
  },
  // Activity/Events colors
  'Activity/Events': {
    pending: '#F59E0B',    // Amber-500
    approved: '#A855F7',   // Purple-500
    reserved: '#14B8A6',   // Teal-500
    processed: '#3B82F6',  // Blue-500
    declined: '#EF4444',   // Red-500
    completed: '#10B981',  // Green-500
    cancelled: '#6B7280',  // Gray-500
    default: '#A855F7'     // Purple-500
  },
  // Equipment colors
  'EQ': {
    pending: '#F59E0B',    // Amber-500
    approved: '#A855F7',   // Purple-500
    reserved: '#14B8A6',   // Teal-500
    processed: '#3B82F6',  // Blue-500
    declined: '#EF4444',   // Red-500
    completed: '#10B981',  // Green-500
    cancelled: '#6B7280',  // Gray-500
    default: '#A855F7'     // Purple-500
  },
  // Unknown/fallback
  'Unknown': {
    pending: '#6B7280',    // Gray-500
    approved: '#A855F7',   // Purple-500
    reserved: '#14B8A6',   // Teal-500
    processed: '#3B82F6',  // Blue-500
    declined: '#EF4444',   // Red-500
    completed: '#10B981',  // Green-500
    cancelled: '#6B7280',  // Gray-500
    default: '#6B7280'     // Gray-500
  }
};

// Helper function to get reservation color based on type and status
const getReservationColor = (reservationType, statusName) => {
  let type = reservationType || 'Unknown';
  const status = statusName || '';
  
  // Normalize the reservation type to match our color mapping keys
  // Handle "Activity\/Event" or "Activity/Event" from API
  if (type.includes('Activity') || type.includes('Event')) {
    type = 'Activity/Events';
  } else if (type.toLowerCase().includes('trip')) {
    type = 'Trip';
  } else if (type.toLowerCase().includes('eq')) {
    type = 'EQ';
  }
  
  // Map status names to color keys
  let colorKey = 'default';
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('pending')) {
    colorKey = 'pending';
  } else if (statusLower.includes('reserved')) {
    colorKey = 'reserved';
  } else if (statusLower.includes('approved') || statusLower.includes('confirmed')) {
    colorKey = 'approved';
  } else if (statusLower.includes('processed') || statusLower.includes('process')) {
    colorKey = 'processed';
  } else if (statusLower.includes('decline') || statusLower.includes('rejected')) {
    colorKey = 'declined';
  } else if (statusLower.includes('completed') || statusLower.includes('finished')) {
    colorKey = 'completed';
  } else if (statusLower.includes('cancelled') || statusLower.includes('canceled')) {
    colorKey = 'cancelled';
  }
  
  console.log('Status mapping:', { originalType: reservationType, normalizedType: type, statusName, statusLower, colorKey });
  return reservationColors[type]?.[colorKey] || reservationColors[type]?.default || '#6B7280';
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
  
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view] = useState('month');
  const [setShowYearSelect] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [calendarFilter, setCalendarFilter] = useState('all');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);


  const encryptedUrl = SecureStorage.getLocalItem("url");

  const fetchReservations = useCallback(async () => {
    try {
      console.log('Fetching reservations from:', `${encryptedUrl}/Admin.php`);
      const response = await axios({
        method: 'POST',
        url: `${encryptedUrl}/Admin.php`,
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
      
      if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else {
        toast.error('Failed to load reservations. Please try again later.');
      }
    }
  }, [encryptedUrl]);

  const fetchTickets = useCallback(async () => {
    try {
      if (!encryptedUrl) return;
      const response = await axios({
        method: 'POST',
        url: `${encryptedUrl}/Admin.php`,
        data: JSON.stringify({ operation: 'getAllTickets' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        setTickets(response.data.data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else {
        toast.error('Failed to load tickets. Please try again later.');
      }
      setTickets([]);
    }
  }, [encryptedUrl]);

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
 
        navigate('/');
    }
}, [navigate]);

  useEffect(() => {
    fetchReservations();
    fetchTickets();
  }, [fetchReservations, fetchTickets]);

  const isDateInRange = (date, startDate, endDate) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return compareDate >= start && compareDate <= end;
  };

  const getEventsForDate = (date) => {
    const includeReservations = calendarFilter === 'all' || calendarFilter === 'reservations';
    const includeTickets = calendarFilter === 'all' || calendarFilter === 'tickets';

    const filteredReservations = includeReservations ? reservations.filter(reservation => {
      // Display all reservations regardless of status
      // Removed the reservation_active check to show all reservations

      // Determine which dates to use - prioritize effective dates
      let startDate, endDate;
      
      // Always use effective dates if they exist, otherwise fall back to original dates
      if (reservation.effective_start_date && reservation.effective_end_date) {
        // Use effective dates (for rescheduled or confirmed reservations)
        startDate = new Date(reservation.effective_start_date);
        endDate = new Date(reservation.effective_end_date);
      } else {
        // Use original reservation dates as fallback
        startDate = new Date(reservation.reservation_start_date);
        endDate = new Date(reservation.reservation_end_date);
      }
      
      console.log('Reservation dates:', {
        reservation_id: reservation.reservation_id,
        status: reservation.reservation_status_name,
        hasEffectiveDates: !!(reservation.effective_start_date && reservation.effective_end_date),
        startDate,
        endDate,
        effectiveStart: reservation.effective_start_date,
        effectiveEnd: reservation.effective_end_date,
        originalStart: reservation.reservation_start_date,
        originalEnd: reservation.reservation_end_date
      });

      const isInRange = isDateInRange(date, startDate, endDate);
      console.log('Is date in range:', isInRange);
      return isInRange;
    }) : [];

    const filteredTickets = includeTickets ? tickets.filter(ticket => {
      const startDateRaw = ticket.comp_date;
      const endDateRaw = ticket.comp_end_date || ticket.comp_date;
      const startDate = new Date(startDateRaw);
      const endDate = new Date(endDateRaw);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return false;
      return isDateInRange(date, startDate, endDate);
    }) : [];

    const reservationEvents = filteredReservations.map(reservation => {
      // Determine which dates to use for display - prioritize effective dates
      const hasEffectiveDates = reservation.effective_start_date && reservation.effective_end_date;
      const displayStartDate = hasEffectiveDates ? 
        new Date(reservation.effective_start_date) : 
        new Date(reservation.reservation_start_date);
      const displayEndDate = hasEffectiveDates ? 
        new Date(reservation.effective_end_date) : 
        new Date(reservation.reservation_end_date);

      const displayInfo = {
        title: reservation.reservation_title || 'Untitled Reservation',
        user: reservation.user_full_name || 'Unknown User',
        type: reservation.reservation_type || 'Unknown',
        startDate: displayStartDate,
        endDate: displayEndDate,
        status: reservation.reservation_status_name,
        hasEffectiveDates,
        color: getReservationColor(reservation.reservation_type, reservation.reservation_status_name)
      };
      console.log('Created display info:', displayInfo);
      return {
        ...reservation,
        displayInfo
      };
    }).map((ev) => ({ ...ev, __eventType: 'reservation' }));

    const ticketEvents = filteredTickets.map(ticket => {
      const displayStartDate = new Date(ticket.comp_date);
      const displayEndDate = new Date(ticket.comp_end_date || ticket.comp_date);

      const displayInfo = {
        title: ticket.comp_subject || `Ticket #${ticket.comp_id}`,
        user: ticket.client_full_name || 'Unknown User',
        type: ticket.operation_name || 'Ticket',
        startDate: displayStartDate,
        endDate: displayEndDate,
        status: ticket.comp_status,
        hasEffectiveDates: false,
        color: getTicketColor(ticket.comp_status)
      };

      return {
        ...ticket,
        displayInfo,
        __eventType: 'ticket'
      };
    });

    return [...reservationEvents, ...ticketEvents];
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

    const yearContent = (
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2 ${isMobile ? 'max-h-[300px]' : 'max-h-[400px]'} overflow-y-auto`}>
        {yearsArray.map(year => (
          <motion.button
            key={year}
            className={`${isMobile ? 'p-2 text-sm' : 'p-3'} rounded-lg ${
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
    );

    return isMobile ? (
      <Drawer
        title="Select Year"
        placement="bottom"
        height="60%"
        open={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        className="year-drawer"
      >
        <div className="p-4">
          {yearContent}
        </div>
      </Drawer>
    ) : (
      <Dialog
        open={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`mx-auto ${isTablet ? 'max-w-md' : 'max-w-sm'} rounded-xl bg-white p-6 shadow-xl`}>
            <Dialog.Title className={`${isTablet ? 'text-lg' : 'text-xl'} font-semibold mb-4`}>Select Year</Dialog.Title>
            {yearContent}
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
          const dayReservations = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());
          const hasEvents = dayReservations.length > 0;
          
          return (
            <motion.div
              key={day.toString()}
              className={`
                relative ${isMobile ? 'min-h-[100px]' : isTablet ? 'min-h-[140px]' : 'min-h-[180px]'} ${isMobile ? 'p-1' : isTablet ? 'p-2' : 'p-4'} rounded-none
                transition-all duration-200 ease-in-out cursor-pointer
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
                ${isToday ? 'ring-2 ring-green-500' : 'border border-gray-200'}
                hover:bg-gray-50 hover:shadow-inner
                focus-within:ring-2 focus-within:ring-green-500
                flex flex-col
                border-r border-b border-gray-100
              `}
              variants={scaleUp}
              whileHover={{ y: isMobile ? 0 : -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDayClick(day, dayReservations)}
            >
              <div className="flex items-center justify-between">
                <span className={`
                  ${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base'} font-medium rounded-full ${isMobile ? 'w-5 h-5' : isTablet ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center
                  ${isToday ? 'bg-green-500 text-white' : ''}
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                `}>
                  {format(day, 'd')}
                </span>
                {hasEvents && (
                  <span 
                    className={`${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} font-medium text-white rounded-full`}
                    style={{ 
                      backgroundColor: dayReservations.some(r => r.displayInfo.hasEffectiveDates) 
                        ? '#10B981' 
                        : '#F59E0B' 
                    }}
                  >
                    {dayReservations.length}
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
                  <span className="text-xs text-gray-400"></span>
                </motion.div>
              )}

              {/* Event indicators (small dots) */}
              {hasEvents && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  {dayReservations.slice(0, 3).map((reservation, idx) => (
                    <div 
                      key={`event-${reservation.__eventType}-${reservation.reservation_id || reservation.comp_id}-${idx}`}
                      className="h-1.5 rounded-full"
                      style={{
                        backgroundColor: reservation.displayInfo.color,
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

        {/* Day Events Modal/Drawer */}
        {isMobile ? (
          <Drawer
            title={dayEventsModal.date && format(dayEventsModal.date, 'EEEE, MMM d, yyyy')}
            placement="bottom"
            height="90%"
            open={dayEventsModal.isOpen}
            onClose={() => setDayEventsModal(prev => ({ ...prev, isOpen: false }))}
            className="day-events-drawer"
          >
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {dayEventsModal.events.length > 0 ? (
                dayEventsModal.events.map((event, idx) => (
                  <motion.div
                    key={`modal-event-${event.__eventType}-${event.approval_id || event.comp_id}-${idx}`}
                    className="p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer bg-white"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setDayEventsModal(prev => ({ ...prev, isOpen: false }));
                      handleCalendarEventClick(event);
                    }}
                  >
                    <div className="flex items-start">
                      <div 
                        className="flex-shrink-0 h-10 w-1 rounded-full"
                        style={{ backgroundColor: event.displayInfo.color }}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex flex-col space-y-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {event.displayInfo.title}
                          </h3>
                          <span 
                            className="px-2 py-1 text-xs font-medium rounded-full text-white self-start"
                            style={{ backgroundColor: event.displayInfo.color }}
                          >
                            {event.displayInfo.type}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {event.displayInfo.user}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Reservation</h3>
                  <p className="mt-1 text-sm text-gray-500">There are no reservations scheduled for this day.</p>
                </div>
              )}
            </div>
          </Drawer>
        ) : (
          <Dialog
            open={dayEventsModal.isOpen}
            onClose={() => setDayEventsModal(prev => ({ ...prev, isOpen: false }))}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                className={`w-full ${isTablet ? 'max-w-lg' : 'max-w-md'} mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Dialog.Panel>
                  <div className={`${isTablet ? 'p-5' : 'p-6'}`}>
                    <Dialog.Title className={`${isTablet ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                      {dayEventsModal.date && format(dayEventsModal.date, 'EEEE, MMMM d, yyyy')}
                    </Dialog.Title>
                    
                    <div className={`mt-4 space-y-3 ${isTablet ? 'max-h-[50vh]' : 'max-h-[60vh]'} overflow-y-auto pr-2`}>
                      {dayEventsModal.events.length > 0 ? (
                        dayEventsModal.events.map((event, idx) => (
                          <motion.div
                            key={`modal-event-${event.__eventType}-${event.approval_id || event.comp_id}-${idx}`}
                            className={`${isTablet ? 'p-3' : 'p-4'} rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer`}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setDayEventsModal(prev => ({ ...prev, isOpen: false }));
                              handleCalendarEventClick(event);
                            }}
                          >
                            <div className="flex items-start">
                              <div 
                                className={`flex-shrink-0 ${isTablet ? 'h-10 w-1' : 'h-12 w-1'} rounded-full`}
                                style={{ backgroundColor: event.displayInfo.color }}
                              />
                              <div className={`${isTablet ? 'ml-3' : 'ml-4'} flex-1`}>
                                <div className="flex items-center justify-between">
                                  <h3 className={`${isTablet ? 'text-sm' : 'text-sm'} font-semibold text-gray-900`}>
                                    {event.displayInfo.title}
                                  </h3>
                                  <span 
                                    className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                    style={{ backgroundColor: event.displayInfo.color }}
                                  >
                                    {event.displayInfo.type}
                                  </span>
                                </div>
                                <p className={`mt-1 ${isTablet ? 'text-sm' : 'text-sm'} text-gray-500`}>
                                  {event.displayInfo.user}
                                </p>
                                <div className={`mt-2 flex items-center ${isTablet ? 'text-sm' : 'text-sm'} text-gray-500`}>
                                  <svg className={`flex-shrink-0 mr-1.5 ${isTablet ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No Reservation</h3>
                          <p className="mt-1 text-sm text-gray-500">There are no reservations scheduled for this day.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`bg-gray-50 ${isTablet ? 'px-5 py-3' : 'px-6 py-4'} sm:flex sm:flex-row-reverse`}>
                    <button
                      type="button"
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm ${isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base'} bg-green-600 font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm`}
                      onClick={() => setDayEventsModal(prev => ({ ...prev, isOpen: false }))}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </motion.div>
            </div>
          </Dialog>
        )}
      </motion.div>
    );
  };

  const handleReservationClick = async (reservation) => {
    try {
      console.log('Fetching details for reservation:', reservation.reservation_id);
      const response = await axios({
        method: 'POST',
        url: `${encryptedUrl}/reservation.php`,
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

      if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else {
        toast.error('Error fetching reservation details. Please try again.');
      }
    }
  };

  const handleCalendarEventClick = (event) => {
    if (event?.__eventType === 'ticket') {
      setSelectedTicket(event);
      setIsTicketModalOpen(true);
      return;
    }

    handleReservationClick(event);
  };




  useKeyboardNavigation(currentDate, setCurrentDate);

  return (
    <div className={`flex min-h-screen bg-gradient-to-br ${themeColors.gradient}`}>
      <Sidebar />
      <div className={`flex-1 overflow-auto ${isMobile ? 'mt-14' : isTablet ? 'mt-16' : 'mt-20'} ${isMobile ? 'px-2' : isTablet ? 'px-4' : 'px-0'}`}>
        <div className="w-full mx-auto">
          <motion.div 
            className={`${isMobile ? 'rounded-lg' : isTablet ? 'rounded-xl' : 'rounded-xl'} bg-white shadow-xl ${isMobile ? 'p-3' : isTablet ? 'p-6' : 'p-8'}`}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-col md:flex-row'} items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'} ${isMobile ? 'space-y-3' : 'space-y-4 md:space-y-0'}`}>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`${isMobile ? 'p-2' : isTablet ? 'p-2' : 'p-3'} rounded-full hover:bg-gray-100 transition-colors`}
                  style={{ color: themeColors.primary }}
                  onClick={() => handleDateNavigation('prev')}
                >
                  <svg className={`${isMobile ? 'w-5 h-5' : isTablet ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <div className="relative">
                  <h2 
                    className={`${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'} font-bold cursor-pointer hover:text-green-600 transition-colors`}
                    style={{ color: themeColors.primary }}
                    onClick={() => setIsYearModalOpen(true)}
                  > 
                    {format(currentDate, isMobile ? 'MMM yyyy' : 'MMMM yyyy')}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`${isMobile ? 'p-2' : isTablet ? 'p-2' : 'p-3'} rounded-full hover:bg-gray-100 transition-colors`}
                  style={{ color: themeColors.primary }}
                  onClick={() => handleDateNavigation('next')}
                >
                  <svg className={`${isMobile ? 'w-5 h-5' : isTablet ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>

              <div className={`${isMobile ? 'w-full' : ''} flex items-center justify-center`}> 
                <select
                  value={calendarFilter}
                  onChange={(e) => setCalendarFilter(e.target.value)}
                  className={`${isMobile ? 'w-full' : 'w-auto'} px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                >
                  <option value="all">All</option>
                  <option value="reservations">Reservation Requests</option>
                  <option value="tickets">Ticket Requests</option>
                </select>
              </div>
              
              {/* Color Legend */}
              {!isMobile && (
                <motion.div 
                  className="flex flex-wrap items-center gap-2 md:gap-4"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                >
                  <span className={`${isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Legend:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: reservationColors.Trip.approved }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Reservation</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: ticketStatusColors.ongoing }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Ticket</span>
                    </div>
                    {/* Status indicators */}
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: reservationColors.Trip.reserved }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Reserved</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: reservationColors.Trip.approved }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Approved</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: reservationColors.Trip.processed }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Processed</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: reservationColors.Trip.pending }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Pending</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: reservationColors.Trip.completed }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Completed</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: reservationColors.Trip.declined }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Declined</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className={`${isTablet ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: reservationColors.Trip.cancelled }} />
                      <span className={`${isTablet ? 'text-xs' : 'text-xs'} text-gray-600`}>Cancelled</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-7 w-full bg-gray-50 border-b border-gray-200">
              {(isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, index) => (
                <div 
                  key={day} 
                  className={`text-center ${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base'} font-semibold ${isMobile ? 'py-2' : isTablet ? 'py-3' : 'py-4'} px-2`}
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

      <JobOrderDetailsModal
        open={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        baseUrl={encryptedUrl}
      />
    </div>
  );
};

       
export default Calendar;


