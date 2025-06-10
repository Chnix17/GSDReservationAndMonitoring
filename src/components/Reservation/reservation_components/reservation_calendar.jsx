import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { format, isSameDay, isPast, endOfDay, isBefore, isWithinInterval, differenceInCalendarDays } from 'date-fns';
import { toast } from 'react-toastify';
import { DatePicker, TimePicker, Spin } from 'antd';
import dayjs from 'dayjs';
import { SecureStorage } from '../../../utils/encryption';


const availabilityStatus = {
  past: {
    className: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/70 dark:to-gray-800/80 opacity-60 shadow-inner',
    hoverClass: 'cursor-not-allowed select-none',
    textClass: 'text-gray-400 dark:text-gray-500 line-through'
  },
  available: {
    className: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30 border-emerald-200 dark:border-emerald-800/30',
    hoverClass: 'hover:shadow-md hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 hover:scale-[1.02] hover:z-10 transition-all duration-200 cursor-pointer',
    textClass: 'text-emerald-800 dark:text-emerald-300'
  },
  partial: {
    className: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/30 border-amber-200 dark:border-amber-800/30',
    hoverClass: 'hover:shadow-md hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 hover:scale-[1.02] hover:z-10 transition-all duration-200 cursor-pointer',
    textClass: 'text-amber-800 dark:text-amber-300'
  },
  reserved: {
    className: 'bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/30 border-rose-200 dark:border-rose-800/30',
    hoverClass: 'cursor-not-allowed select-none',
    textClass: 'text-rose-800 dark:text-rose-300'
  },
  holiday: {
    className: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-violet-200 dark:border-violet-800/30',
    hoverClass: 'cursor-not-allowed select-none',
    textClass: 'text-purple-800 dark:text-violet-300'
  }
};

const ReservationCalendar = ({ onDateSelect, selectedResource, initialData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [reservations, setReservations] = useState(initialData?.reservations || []);
  const [view, setView] = useState('month');
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState({
    startTime: null,
    endTime: null,
    startMinute: null,
    endMinute: null
  });
  const [dateRange, setDateRange] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [holidays, setHolidays] = useState(initialData?.holidays || []);
  const [equipmentAvailability, setEquipmentAvailability] = useState(initialData?.equipmentAvailability || []);

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setReservations(initialData.reservations || []);
      setHolidays(initialData.holidays || []);
      setEquipmentAvailability(initialData.equipmentAvailability || []);
    }
  }, [initialData]);

  useEffect(() => {
    const encryptedUrl = SecureStorage.getLocalItem("url");
    if (encryptedUrl) {
      setBaseUrl(encryptedUrl);
    }
  }, []);

  // Add immediate data fetch when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!baseUrl) return;

      try {
        // Fetch holidays if not provided in initialData
        if (!initialData?.holidays?.length) {
          const holidayResponse = await axios.post(
            `${baseUrl}/user.php`,
            {
              operation: 'fetchHoliday'
            }
          );

          if (holidayResponse.data.status === 'success') {
            const formattedHolidays = holidayResponse.data.data.map(holiday => ({
              name: holiday.holiday_name,
              date: holiday.holiday_date
            }));
            setHolidays(formattedHolidays);
          }
        }

        // Fetch reservations/equipment availability if not provided in initialData
        if (!initialData?.reservations?.length && !initialData?.equipmentAvailability?.length) {
          if (selectedResource.type === 'equipment') {
            await fetchEquipmentAvailability();
          } else {
            await fetchReservations();
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to fetch initial calendar data');
      }
    };

    fetchInitialData();
  }, [baseUrl, selectedResource, initialData]);

  // Define now and today as constants that are used throughout the component
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Business hours from 5 AM to 7 PM
  const businessHours = [...Array(15)].map((_, i) => i + 5);
  const [isLoading, setIsLoading] = useState(false);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectionMode, setSelectionMode] = useState('full');

  const isSelectionValid = () => {
    if (selectionMode === 'full') {
      return (
        selectedStartDate && 
        selectedEndDate && 
        selectedTimes.startTime !== null && 
        selectedTimes.endTime !== null &&
        selectedTimes.startTime >= 5 &&
        selectedTimes.endTime <= 19
      );
    } else {
      return (
        selectedStartDate && 
        selectedEndDate &&
        selectedTimes.endTime !== null &&
        selectedTimes.endTime <= 19
      );
    }
  };

  const getReservedTimeSlots = (date) => {
    if (!date) return { hours: [], timeRanges: [] };
    
    const timeRanges = [];
    const reservedHours = new Set();
    
    // Get all reservations for this date
    const dayReservations = reservations.filter(res => 
      res.isReserved && isSameDay(new Date(res.startDate), date)
    );

    // Create a Map to track unique time slots by their start and end times
    const uniqueTimeSlots = new Map();
    
    dayReservations.forEach(res => {
      const start = new Date(res.startDate);
      const end = new Date(res.endDate);
      
      // Create a unique key for this time slot
      const timeKey = `${start.getHours()}-${start.getMinutes()}-${end.getHours()}-${end.getMinutes()}`;
      
      // Only add this time range if we haven't seen it before
      if (!uniqueTimeSlots.has(timeKey)) {
        uniqueTimeSlots.set(timeKey, {
          start,
          end,
          reservation: res
        });
        
        // Add hours to the set of reserved hours
        for (let hour = start.getHours(); hour <= end.getHours(); hour++) {
          reservedHours.add(hour);
        }
      }
    });
    
    // Convert the map values to our timeRanges array
    uniqueTimeSlots.forEach(item => {
      timeRanges.push({
        start: item.start,
        end: item.end,
        reservation: item.reservation
      });
    });
    
    return {
      hours: Array.from(reservedHours),
      timeRanges: timeRanges
    };
  };

  useEffect(() => {
    if (selectedResource.type === 'equipment') {
      fetchEquipmentAvailability();
    } else {
      // Ensure selectedResource.id is always an array
      const itemIds = Array.isArray(selectedResource.id) ? selectedResource.id : [selectedResource.id].filter(Boolean);
      
      fetchReservations();
    }
  }, [selectedResource]);

  useEffect(() => {
    const fetchHolidays = async () => {
      if (!baseUrl) return;
      
      try {
        const response = await axios.post(
          `${baseUrl}/user.php`,
          {
            operation: 'fetchHoliday'
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.status === 'success') {
          const formattedHolidays = response.data.data.map(holiday => ({
            name: holiday.holiday_name,
            date: holiday.holiday_date
          }));
          setHolidays(formattedHolidays);
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
        toast.error('Failed to fetch holidays');
      }
    };

    fetchHolidays();
  }, [baseUrl]);

  const fetchReservations = async () => {
    if (!baseUrl) return;
    
    setIsLoading(true);
    try {
      const itemIds = Array.isArray(selectedResource.id) ? selectedResource.id : [selectedResource.id].filter(Boolean);
      
      console.log('Fetching reservations with:', {
        itemType: selectedResource.type,
        itemIds: itemIds
      });

      const response = await axios.post(
        `${baseUrl}/user.php`,
        {
          operation: 'fetchAvailability',
          itemType: selectedResource.type,
          itemId: itemIds
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Reservations response:', response.data);

      if (response.data.status === 'success') {
        const formattedReservations = (response.data.data || []).map(res => ({
          startDate: res.reservation_start_date,
          endDate: res.reservation_end_date,
          status: res.reservation_status_status_id,
          isReserved: res.reservation_status_status_id === '6',
          // Venue details
          venueName: res.ven_name,
          venueOccupancy: res.ven_occupancy,
          // Vehicle details
          vehicleMake: res.vehicle_make_name,
          vehicleModel: res.vehicle_model_name,
          vehicleLicense: res.vehicle_license,
          // Common
          resourceType: selectedResource.type,
          title: res.reservation_title
        }));
        setReservations(formattedReservations);
      }
    } catch (error) {
      toast.error('Failed to fetch reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEquipmentAvailability = async () => {
    if (!baseUrl) return;
    
    setIsLoading(true);
    try {
      const equipments = selectedResource.id.map((item, index) => ({
        id: item.id,
        quantity: item.quantity
      }));

      const response = await axios.post(
        `${baseUrl}/user.php`,
        {
          operation: 'fetchAvailability',
          itemType: 'equipment',
          itemId: equipments.map(e => e.id),
          quantity: equipments.map(e => e.quantity)
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        setEquipmentAvailability(response.data.data.map(item => ({
          equipId: item.equip_id,
          name: item.equip_name,
          currentQuantity: parseInt(item.current_quantity),
          totalReserved: parseInt(item.total_reserved),
          totalAvailable: parseInt(item.total_available),
          startDate: new Date(item.reservation_start_date),
          endDate: new Date(item.reservation_end_date),
          requestedQuantity: item.inputted_quantity
        })));
      }
    } catch (error) {
      toast.error('Failed to fetch equipment availability');
    } finally {
      setIsLoading(false);
    }
  };

  const isDateReserved = (date) => {
    return reservations.some(res => {
      if (!res.isReserved) return false;
      
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      const current = new Date(date);
      
      current.setHours(0, 0, 0, 0);
      const startDay = new Date(resStart).setHours(0, 0, 0, 0);
      const endDay = new Date(resEnd).setHours(0, 0, 0, 0);
  
      return current >= startDay && current <= endDay;
    });
  };

  const isWithinSevenDays = (date, startDate) => {
    if (!startDate || !date) return false;
    const diffInDays = differenceInCalendarDays(date, startDate);
    return diffInDays >= 0 && diffInDays <= 6;
  };

  const isHoliday = (date) => {
    if (!date || !holidays.length) return false;
    // Format both dates consistently as 'YYYY-MM-DD' for comparison
    const formattedDate = format(date, 'yyyy-MM-dd');
    return holidays.some(holiday => holiday.date === formattedDate);
  };

const handleDateClick = (date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Check if it's a holiday first
  if (isHoliday(date)) {
    const holiday = holidays.find(h => h.date === format(date, 'yyyy-MM-dd'));
    toast.error(`Cannot select ${holiday.name} (Holiday)`, {
      position: 'top-center',
      icon: '🎉',
      className: 'font-medium'
    });
    return;
  }

  // Check if date is in the past
  if (compareDate < today) {
    toast.error('Cannot select past dates', {
      position: 'top-center',
      icon: '⏰',
      className: 'font-medium'
    });
    return;
  }
  
  // Check if it's a weekend (Saturday = 6, Sunday = 0)
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    toast.error('Reservations can only be made on working days (Monday to Friday)', {
      position: 'top-center',
      icon: '📅',
      className: 'font-medium'
    });
    return;
  }
  
  // Check if it's today but after business hours
  if (compareDate.getTime() === today.getTime()) {
    const currentHour = now.getHours();
    if (currentHour >= 19) {
      toast.error('Bookings for today are closed (after 7:00 PM)', {
        position: 'top-center',
        icon: '⏱️',
        className: 'font-medium'
      });
      return;
    }
  }

  // If we already have a start date selected
  if (selectedStartDate && !selectedEndDate) {
    // Check if the new date is within 7 days of the start date
    if (!isWithinSevenDays(date, selectedStartDate)) {
      toast.error('End date must be within 7 days of start date', {
        position: 'top-center',
        icon: '📅',
        className: 'font-medium'
      });
      return;
    }
    // Check if the new date is before start date
    if (isBefore(date, selectedStartDate)) {
      toast.error('End date cannot be before start date', {
        position: 'top-center',
        icon: '❌',
        className: 'font-medium'
      });
      return;
    }
  }

  // Check reservation status - only prevent if fully reserved
  const status = getAvailabilityStatus(date, reservations);
  if (status === 'reserved') {
    toast.error('This date is already fully reserved for the business hours (5AM-7PM)', {
      position: 'top-center',
      icon: '❌',
      className: 'font-medium'
    });
    return;
  }
  
  // Set the selected dates
  if (!selectedStartDate) {
    setSelectedStartDate(date);
    setStartDate(date);
    setEndDate(null);
    setSelectedEndDate(null);
  } else {
    setSelectedEndDate(date);
    setEndDate(date);
  }
  
  // Set default times based on current time if it's today
  if (isSameDay(date, new Date())) {
    const currentHour = now.getHours();
    const defaultStartHour = Math.max(currentHour + 1, 5); // Start at next hour, minimum 5 AM
    
    if (defaultStartHour < 19) { // Only set if within business hours
      setSelectedTimes(prev => ({
        ...prev,
        startTime: defaultStartHour,
        startMinute: 0,
        endTime: null,
        endMinute: null
      }));
    } else {
      setSelectedTimes({
        startTime: null,
        endTime: null,
        startMinute: null,
        endMinute: null
      });
    }
  } else {
    // Default times for future dates
    setSelectedTimes({
      startTime: 9, // Default to 9 AM
      startMinute: 0,
      endTime: null,
      endMinute: null
    });
  }
  
  setIsDatePickerModalOpen(true);
};

  const handleDateNavigation = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    } else if (view === 'week') {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    } else {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  const handleReservationClick = (reservation) => {
    console.log('Reservation clicked:', reservation);
  };

  const getAvailabilityStatus = (date, allReservations) => {
    // First create a properly formatted date for comparison
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    // Format date consistently for holiday comparison
    const formattedDate = format(compareDate, 'yyyy-MM-dd');
    
    // Check holidays first - this takes precedence over everything else
    if (holidays.some(h => h.date === formattedDate)) {
      return 'holiday';
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (compareDate < today) {
      return 'past';
    }

    if (selectedResource.type === 'equipment') {
      // Filter equipment availability for this date
      const dayEquipment = equipmentAvailability.filter(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        const itemStartDay = new Date(itemStart.getFullYear(), itemStart.getMonth(), itemStart.getDate());
        const itemEndDay = new Date(itemEnd.getFullYear(), itemEnd.getMonth(), itemEnd.getDate());
        
        return compareDate >= itemStartDay && compareDate <= itemEndDay;
      });

      if (dayEquipment.length === 0) return 'available';

      // Check if any equipment is completely unavailable for the whole business day
      const hasCompletelyUnavailable = dayEquipment.some(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        
        // Check if the reservation spans the whole business day
        const startsBeforeOrAt5AM = itemStart.getHours() <= 5;
        const endsAtOrAfter7PM = itemEnd.getHours() >= 19;
        const spansWholeDay = startsBeforeOrAt5AM && endsAtOrAfter7PM;
        
        return spansWholeDay && (
          parseInt(item.totalAvailable) < parseInt(item.requestedQuantity) ||
          parseInt(item.totalAvailable) === 0
        );
      });

      if (hasCompletelyUnavailable) return 'reserved';

      // Check for partial availability
      const hasPartial = dayEquipment.some(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        const totalAvailable = parseInt(item.totalAvailable);
        const requestedQuantity = parseInt(item.requestedQuantity);
        const currentQuantity = parseInt(item.currentQuantity);

        return (
          // Partial time range reservation
          (totalAvailable < requestedQuantity && 
            (itemStart.getHours() > 5 || itemEnd.getHours() < 19)) ||
          // Partial quantity reservation
          (totalAvailable < currentQuantity && totalAvailable >= requestedQuantity)
        );
      });

      return hasPartial ? 'partial' : 'available';
    }

    // Original logic for non-equipment resources
    if (!allReservations.length) {
      return 'available';
    }

    // Group reservations by venue for the current date
    const venueReservations = new Map();
    
    allReservations.forEach(res => {
      if (!res.isReserved) return;

      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      resStart.setHours(0, 0, 0, 0);
      resEnd.setHours(23, 59, 59, 999);
      
      if (compareDate >= resStart && compareDate <= resEnd) {
        if (!venueReservations.has(res.venueName)) {
          venueReservations.set(res.venueName, []);
        }
        venueReservations.get(res.venueName).push({
          ...res,
          startHour: new Date(res.startDate).getHours(),
          endHour: new Date(res.endDate).getHours()
        });
      }
    });

    // Check for full-day reservations (5AM to 7PM)
    const hasFullDayReservation = Array.from(venueReservations.values()).some(venueRes => 
      venueRes.some(res => 
        res.startHour <= 5 && res.endHour >= 19
      )
    );

    // If any venue has a full-day reservation, mark as reserved
    if (hasFullDayReservation) {
      return 'reserved';
    }

    // Check if there are any partial reservations
    const hasPartialReservations = venueReservations.size > 0;

    return hasPartialReservations ? 'partial' : 'available';
};




const renderCalendarGrid = () => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const days = [];
  const startDay = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();
  
  // Add previous month's days
  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i);
    days.unshift(prevDate);
  }
  
  // Add current month's days
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }
  
  // Add next month's days to complete the grid
  const remainingDays = 42 - days.length; // 6 rows × 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i));
  }

  return (
    <motion.div 
      className="grid grid-cols-7 gap-1 sm:gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {days.map((day, index) => {
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const formattedDate = format(day, 'yyyy-MM-dd');
        const holidayInfo = holidays.find(h => h.date === formattedDate);
        const compareDate = new Date(day);
        compareDate.setHours(0, 0, 0, 0);
        const isPastDate = compareDate < today;
        const isPresentDate = isSameDay(day, today);
        const currentTime = now.getHours();
        const isAfterBusinessHours = isPresentDate && currentTime >= 19;
        const isBeforeBusinessHours = isPresentDate && currentTime < 5;
        const isUnavailable = isPastDate || isAfterBusinessHours || isWeekend;
        const isSelected = selectedStartDate && day >= selectedStartDate && 
                         (selectedEndDate ? day <= selectedEndDate : day === selectedStartDate);
        let status = isPastDate || isWeekend ? 'past' : getAvailabilityStatus(day, reservations);
        
        if (isPresentDate && isAfterBusinessHours) {
          status = 'past';
        }
        
        const statusStyle = availabilityStatus[status];

        // Get reservations for this day
        const dayReservations = reservations.filter(res => {
          if (!res.isReserved) return false;
          const resStart = new Date(res.startDate);
          const resEnd = new Date(res.endDate);
          return isWithinInterval(day, { start: resStart, end: resEnd });
        });

        // Get equipment availability for this day
        const dayEquipment = selectedResource.type === 'equipment' ? equipmentAvailability.filter(item => {
          const itemStart = new Date(item.startDate);
          const itemEnd = new Date(item.endDate);
          return isWithinInterval(day, { start: itemStart, end: itemEnd });
        }) : [];

        // Determine how many items to show and if we need a "more" button
        const maxVisibleItems = isPresentDate ? 2 : 3;
        const hasMoreItems = dayReservations.length > maxVisibleItems || dayEquipment.length > maxVisibleItems;
        const visibleReservations = dayReservations.slice(0, maxVisibleItems);
        const visibleEquipment = dayEquipment.slice(0, maxVisibleItems);
        const extraItemsCount = selectedResource.type === 'equipment' 
          ? dayEquipment.length - maxVisibleItems 
          : dayReservations.length - maxVisibleItems;

        return (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.01 }}
            onClick={() => isUnavailable ? null : handleDateClick(day)}
            className={`
              relative min-h-[80px] sm:min-h-[120px] p-2 sm:p-3
              border dark:border-gray-700/50 rounded-xl
              backdrop-blur-sm
              ${isCurrentMonth ? statusStyle.className : 'opacity-40 bg-gray-50 dark:bg-gray-800/40'}
              ${!isUnavailable ? statusStyle.hoverClass : 'cursor-not-allowed select-none'}
              ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
              ${isWeekend ? 'bg-gray-100 dark:bg-gray-800 opacity-50' : ''}
              transition-all duration-200
              ${isSameDay(day, today) ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''}
              overflow-hidden
            `}
          >
            <div className="flex flex-col h-full">
              {/* Date header */}
              <div className="flex items-center justify-between mb-1">
                <div className={`
                  flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full
                  ${isPresentDate ? 'bg-blue-500 text-white' : ''}
                  ${isCurrentMonth ? statusStyle.textClass : 'text-gray-400'}
                `}>
                  <span className="text-xs sm:text-sm font-medium">
                    {format(day, 'd')}
                  </span>
                </div>
                {holidayInfo && (
                  <span className="text-[8px] sm:text-xs px-1.5 py-0.5 rounded-full 
                                 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300
                                 font-medium truncate max-w-[80px]">
                    {holidayInfo.name.split(' ')[0]}
                  </span>
                )}
              </div>

              {/* Reservations/Equipment list */}
              <div className="flex-1 space-y-1">
                {selectedResource.type === 'equipment' ? (
                  // Equipment display
                  <>
                    {visibleEquipment.map((item, idx) => (
                      <div
                        key={idx}
                        className={`
                          text-[8px] sm:text-xs py-0.5 px-1.5 rounded-md
                          truncate bg-blue-50 dark:bg-blue-900/20 
                          text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30
                        `}
                      >
                        {item.name}: {item.totalAvailable}/{item.currentQuantity}
                      </div>
                    ))}
                  </>
                ) : (
                  // Reservations display
                  <>
                    {visibleReservations.map((res, idx) => (
                      <div
                        key={idx}
                        className={`
                          text-[8px] sm:text-xs py-0.5 px-1.5 rounded-md
                          truncate bg-blue-50 dark:bg-blue-900/20
                          text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30
                        `}
                      >
                        {format(new Date(res.startDate), 'HH:mm')} - {res.venueName || (res.vehicleMake ? `${res.vehicleMake} ${res.vehicleModel}` : res.equipName)}
                      </div>
                    ))}
                  </>
                )}

                {/* More items indicator */}
                {hasMoreItems && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle showing more items - you can implement a modal or popover here
                      handleShowMoreItems(day, dayReservations, dayEquipment);
                    }}
                    className="text-[8px] sm:text-xs px-1.5 py-0.5 mt-1
                             bg-gray-100 dark:bg-gray-800 
                             text-gray-600 dark:text-gray-400
                             rounded-md hover:bg-gray-200 dark:hover:bg-gray-700
                             transition-colors w-full text-center font-medium"
                  >
                    +{extraItemsCount} more
                  </button>
                )}
              </div>

              {/* Status indicator */}
              <div className="absolute bottom-2 right-2">
                <div className={`
                  w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full
                  ${status === 'available' ? 'bg-emerald-400 animate-pulse' : ''}
                  ${status === 'partial' ? 'bg-amber-400' : ''}
                  ${status === 'reserved' ? 'bg-rose-400' : ''}
                  ${status === 'holiday' ? 'bg-violet-400' : ''}
                  ${status === 'past' ? 'bg-gray-400' : ''}
                `}/>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Add this new function to handle showing more items
const handleShowMoreItems = (day, reservations, equipment) => {
  // Create and show a modal with all items for the selected day
  setSelectedDate(day);
  setDayDetails({
    reservations,
    equipment,
    date: day
  });
  setShowDayDetailsModal(true);
};

// Add state for the day details modal
const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
const [selectedDate, setSelectedDate] = useState(null);
const [dayDetails, setDayDetails] = useState(null);

// Add this new component for the day details modal
const DayDetailsModal = () => {
  if (!dayDetails) return null;

  return (
    <Dialog
      open={showDayDetailsModal}
      onClose={() => setShowDayDetailsModal(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-md border border-gray-200 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg sm:text-xl font-semibold">
              {format(dayDetails.date, 'MMMM d, yyyy')}
            </Dialog.Title>
            <button
              onClick={() => setShowDayDetailsModal(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {selectedResource.type === 'equipment' ? (
              // Equipment list
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipment Availability
                </h3>
                {dayDetails.equipment.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.totalAvailable}/{item.currentQuantity} available
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(item.startDate), 'HH:mm')} - {format(new Date(item.endDate), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Reservations list
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reservations
                </h3>
                {dayDetails.reservations.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {res.venueName || (res.vehicleMake ? `${res.vehicleMake} ${res.vehicleModel}` : res.equipName)}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {format(new Date(res.startDate), 'HH:mm')} - {format(new Date(res.endDate), 'HH:mm')}
                      </span>
                    </div>
                    {res.venueOccupancy && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Capacity: {res.venueOccupancy}
                      </div>
                    )}
                    {res.vehicleLicense && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        License: {res.vehicleLicense}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

  // Helper function to get time slot availability
  const getTimeSlotAvailability = (date, hour) => {
    // Check if outside business hours
    if (hour < 5 || hour > 19) {
      return 'outside';
    }
    
    // Check if it's a holiday
    if (holidays.some(holiday => format(date, 'yyyy-MM-dd') === holiday.date)) {
      return 'holiday';
    }
    
    // For equipment resources
    if (selectedResource.type === 'equipment') {
      const relevantEquipment = equipmentAvailability.filter(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        const slotDate = new Date(date);
        slotDate.setHours(hour, 0, 0, 0);
      
        // If it's a multi-day reservation
        if (!isSameDay(itemStart, itemEnd)) {
          const itemStartHour = itemStart.getHours();
      
          if (isWithinInterval(slotDate, { start: itemStart, end: itemEnd })) {
            return hour >= itemStartHour && hour < itemEnd.getHours();
          }
        } else {
          // Same day reservation
          return isSameDay(slotDate, itemStart) &&
                 hour >= itemStart.getHours() &&
                 hour < itemEnd.getHours();
        }
      
        return false;
      });
      
      // If no equipment is found for this time slot, it's available
      if (relevantEquipment.length === 0) {
        return 'available';
      }
      
      // If any fully booked equipment
      if (relevantEquipment.some(item => !item.isPartial)) {
        return 'reserved';
      }
      

      
      // Check if any equipment has insufficient availability for the requested quantity
      const hasUnavailableEquipment = relevantEquipment.some(item => {
        const available = parseInt(item.totalAvailable);
        const requested = parseInt(item.requestedQuantity);
        console.log(`Slot availability check for ${item.name}: Available=${available}, Requested=${requested}`);
        return available < requested;
      });
      
      if (hasUnavailableEquipment) {
        return 'reserved';
      }
      
      // Check if any equipment has partial availability (less than total but enough for request)
      const hasPartialAvailability = relevantEquipment.some(item => {
        const available = parseInt(item.totalAvailable);
        const total = parseInt(item.currentQuantity);
        const requested = parseInt(item.requestedQuantity);
        return available < total && available >= requested;
      });
      
      if (hasPartialAvailability) {
        return 'partial';
      }
      
      return 'available';
    }
    
    // For venue/vehicle resources
    const matchingReservations = reservations.filter(res => {
      if (!res.isReserved) return false;
  
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      const slotDate = new Date(date);
      slotDate.setHours(hour, 0, 0, 0);
  
      // If it's a multi-day reservation
      if (!isSameDay(resStart, resEnd)) {
        const resStartHour = resStart.getHours();
        
        // For all days in the reservation period, use the same time range (start hour to end hour)
        if (isWithinInterval(slotDate, { start: resStart, end: resEnd })) {
          return hour >= resStartHour && hour < resEnd.getHours();
        }
      } else {
        // Same day reservation
        return isSameDay(slotDate, resStart) && 
               hour >= resStart.getHours() && 
               hour < resEnd.getHours();
      }
  
      return false;
    });
  
    if (matchingReservations.length > 0) {
      // If any fully booked slots exist
      if (matchingReservations.some(res => !res.isPartial)) {
        return 'reserved';
      }
      // If only partially booked slots exist
      return 'partial';
    }
  
    return 'available';
  };

  // Update the renderWeekView function
  const renderWeekView = () => {
    const daysOfWeek = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Generate days of the week
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      daysOfWeek.push(day);
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
        {/* Week header showing dates */}
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 font-medium text-gray-600 dark:text-gray-300 text-center text-xs sm:text-sm">
            Time
          </div>
          {daysOfWeek.map((day, index) => {
            const isToday = isSameDay(day, new Date());
            const isPastDate = isPast(endOfDay(day));
            const isHoliday = holidays.some(holiday => 
              format(day, 'yyyy-MM-dd') === holiday.date
            );
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            
            return (
              <div 
                key={index} 
                className={`
                  py-3 px-1 sm:px-2 
                  ${isToday ? 'bg-blue-100 dark:bg-blue-900/40' : ''}
                  ${isWeekend ? 'bg-gray-100 dark:bg-gray-800/40' : ''}
                  ${isHoliday ? 'bg-violet-100 dark:bg-violet-900/40' : ''}
                  ${isPastDate ? 'bg-gray-100 dark:bg-gray-800/40 opacity-60' : ''}
                `}
              >
                <div className={`
                  text-center rounded-lg py-1
                  ${isToday ? 'bg-blue-200 dark:bg-blue-900/60' : ''}
                  ${isWeekend ? 'bg-gray-200 dark:bg-gray-800/60' : ''}
                  ${isPastDate ? 'bg-gray-200 dark:bg-gray-800/60' : ''}
                `}>
                  <div className={`
                    font-medium text-sm sm:text-base
                    ${isToday ? 'text-blue-700 dark:text-blue-300' : ''}
                    ${isPastDate ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}
                    ${isHoliday ? 'text-violet-700 dark:text-violet-300' : ''}
                    ${isWeekend ? 'text-gray-500 dark:text-gray-400' : ''}
                  `}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`
                    text-xs sm:text-sm mt-0.5
                    ${isToday ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}
                    ${isPastDate ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}
                    ${isWeekend ? 'text-gray-500 dark:text-gray-400' : ''}
                  `}>
                    {format(day, 'MMM d')}
                  </div>
                </div>
                {isHoliday && (
                  <div className="text-[10px] text-violet-600 dark:text-violet-400 font-medium mt-1 text-center">
                    {holidays.find(holiday => format(day, 'yyyy-MM-dd') === holiday.date)?.name || 'Holiday'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Time slots grid */}
        <div className="flex-grow">
          <div className="grid grid-cols-8 h-full divide-x divide-gray-200 dark:divide-gray-700">
            {/* Time column */}
            <div className="bg-gray-50 dark:bg-gray-800/30">
              {businessHours.map((hour) => (
                <div 
                  key={hour} 
                  className="h-16 sm:h-24 border-b border-gray-200 dark:border-gray-700 px-2 flex items-center justify-center"
                >
                  <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {format(new Date().setHours(hour, 0, 0), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Days columns */}
            {daysOfWeek.map((day, dayIndex) => {
              const isPastDate = isPast(endOfDay(day));
              const isToday = isSameDay(day, new Date());
              const isHoliday = holidays.some(holiday => 
                format(day, 'yyyy-MM-dd') === holiday.date
              );
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <div key={dayIndex} className={`
                  relative
                  ${isWeekend || isPastDate ? 'bg-gray-100 dark:bg-gray-800/40' : ''}
                `}>
                  {businessHours.map((hour) => {
                    const isPastHour = isBefore(
                      new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour),
                      new Date()
                    );
                    const currentHour = new Date().getHours() === hour && isToday;
                    
                    // Get the availability status for this time slot
                    const status = isWeekend || isPastDate ? 'past' : getTimeSlotAvailability(day, hour);
                    const statusStyle = availabilityStatus[status];
                    
                    // Get reservations for this time slot
                    const timeSlotReservations = reservations.filter(res => {
                      if (!res.isReserved) return false;
                      const resStart = new Date(res.startDate);
                      const resEnd = new Date(res.endDate);
                      const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
                      const slotEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1);
                      return (resStart < slotEnd && resEnd > slotStart);
                    });

                    // Get equipment for this time slot
                    const timeSlotEquipment = selectedResource.type === 'equipment' ? 
                      equipmentAvailability.filter(item => {
                        const itemStart = new Date(item.startDate);
                        const itemEnd = new Date(item.endDate);
                        const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
                        const slotEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1);
                        return (itemStart < slotEnd && itemEnd > slotStart);
                      }) : [];

                    // Limit visible items to 1
                    const maxVisibleItems = 1;
                    const visibleReservations = timeSlotReservations.slice(0, maxVisibleItems);
                    const visibleEquipment = timeSlotEquipment.slice(0, maxVisibleItems);
                    const extraItemsCount = selectedResource.type === 'equipment' 
                      ? timeSlotEquipment.length - maxVisibleItems 
                      : timeSlotReservations.length - maxVisibleItems;
                    
                    let borderClass = "border-b border-gray-200 dark:border-gray-700";
                    if (currentHour) {
                      borderClass += " border-t-2 border-t-blue-500 dark:border-t-blue-400";
                    }
                    
                    return (
                      <div
                        key={hour}
                        className={`
                          h-16 sm:h-24 p-1 relative group
                          ${statusStyle.className}
                          ${!isPastHour && !isHoliday && !isWeekend && !isPastDate ? statusStyle.hoverClass : ''}
                          ${borderClass}
                          transition-colors duration-200 ease-in-out
                          ${(isWeekend || isPastDate) ? 'cursor-not-allowed select-none' : ''}
                        `}
                        onClick={() => {
                          if (!isPastHour && !isHoliday && !isWeekend && !isPastDate) {
                            handleTimeSlotClick(day, hour);
                          }
                        }}
                      >
                        {/* Current time indicator */}
                        {currentHour && (
                          <div className="absolute -top-[2px] left-0 w-full">
                            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                          </div>
                        )}

                        {/* Reservations/Equipment display */}
                        <div className="h-full space-y-1">
                          {selectedResource.type === 'equipment' ? (
                            <>
                              {visibleEquipment.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={`
                                    text-[10px] sm:text-xs p-1 rounded
                                    ${item.totalAvailable < item.requestedQuantity
                                      ? 'bg-rose-200 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
                                      : item.totalAvailable < item.currentQuantity
                                        ? 'bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                        : 'bg-emerald-200 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                                    }
                                  `}
                                >
                                  <div className="font-medium truncate">{item.name}</div>
                                  <div>{item.totalAvailable}/{item.currentQuantity}</div>
                                </div>
                              ))}
                              {extraItemsCount > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowMoreItems(currentDate, [], timeSlotEquipment);
                                  }}
                                  className="text-[10px] sm:text-xs px-1.5 py-0.5 mt-1
                                           bg-gray-100 dark:bg-gray-800 
                                           text-gray-600 dark:text-gray-400
                                           rounded-md hover:bg-gray-200 dark:hover:bg-gray-700
                                           transition-colors w-full text-center font-medium"
                                >
                                  +{extraItemsCount} more
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {status === 'reserved' && visibleReservations.map((res, idx) => (
                                <div
                                  key={idx}
                                  className="text-[10px] sm:text-xs p-1 rounded bg-rose-200 dark:bg-rose-900/40 
                                           text-rose-800 dark:text-rose-300"
                                >
                                  <div className="font-medium truncate">
                                    {res.venueName || (res.vehicleMake ? `${res.vehicleMake} ${res.vehicleModel}` : res.equipName)}
                                  </div>
                                  <div className="text-[9px] sm:text-[11px] opacity-75">
                                    {format(new Date(res.startDate), 'h:mm a')} - {format(new Date(res.endDate), 'h:mm a')}
                                  </div>
                                </div>
                              ))}
                              {status === 'reserved' && extraItemsCount > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowMoreItems(currentDate, timeSlotReservations, []);
                                  }}
                                  className="text-[10px] sm:text-xs px-1.5 py-0.5 mt-1
                                           bg-gray-100 dark:bg-gray-800 
                                           text-gray-600 dark:text-gray-400
                                           rounded-md hover:bg-gray-200 dark:hover:bg-gray-700
                                           transition-colors w-full text-center font-medium"
                                >
                                  +{extraItemsCount} more
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Status indicator */}
                        {!isPastHour && !isHoliday && !isWeekend && !isPastDate && (
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className={`
                              w-2 h-2 rounded-full
                              ${status === 'available' ? 'bg-emerald-400 animate-pulse' : ''}
                              ${status === 'partial' ? 'bg-amber-400' : ''}
                              ${status === 'reserved' ? 'bg-rose-400' : ''}
                            `}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 5);
    const now = new Date();
    const isPastDay = isPast(endOfDay(currentDate));
    const isToday = isSameDay(currentDate, new Date());
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    const holidayInfo = holidays.find(h => h.date === formattedDate);
    const currentHour = new Date().getHours();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

    return (
      <motion.div 
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/30 overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`
          p-4 border-b dark:border-gray-700/50
          ${isToday ? 'bg-blue-100 dark:bg-blue-900/40' : ''}
          ${isWeekend || isPastDay ? 'bg-gray-100 dark:bg-gray-800/60' : ''}
          ${holidayInfo ? 'bg-violet-100 dark:bg-violet-900/40' : ''}
        `}>
          <div className="flex items-center justify-between">
            <h3 className={`
              text-lg font-semibold
              ${isToday ? 'text-blue-700 dark:text-blue-300' : ''}
              ${isPastDay ? 'text-gray-500 dark:text-gray-400' : ''}
              ${holidayInfo ? 'text-violet-700 dark:text-violet-300' : ''}
              ${isWeekend ? 'text-gray-500 dark:text-gray-400' : ''}
            `}>
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            
            <div className="flex gap-2">
              {isToday && (
                <div className="px-2 py-1 bg-blue-200 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 
                              text-xs rounded-full font-medium">
                  Today
                </div>
              )}
              
              {isPastDay && (
                <div className="px-2 py-1 bg-gray-200 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 
                              text-xs rounded-full font-medium">
                  Past Date
                </div>
              )}

              {isWeekend && (
                <div className="px-2 py-1 bg-gray-200 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 
                              text-xs rounded-full font-medium">
                  Weekend
                </div>
              )}
            </div>
          </div>
          
          {holidayInfo && (
            <div className="mt-2 px-3 py-1.5 bg-violet-200 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 
                           text-sm rounded-lg inline-block font-medium">
              Holiday: {holidayInfo.name}
            </div>
          )}

          {isToday && (
            <div className="mt-2 flex items-center text-blue-600 dark:text-blue-400 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Current time: {format(now, 'h:mm a')}
            </div>
          )}
        </div>

        <div className="divide-y dark:divide-gray-700/50">
          {timeSlots.map((hour) => {
            const isPastHour = isPastDay || (isToday && hour < currentHour);
            const isCurrentHour = isToday && hour === currentHour;
            const status = isWeekend || isPastDay ? 'past' : getTimeSlotAvailability(currentDate, hour);
            const statusStyle = availabilityStatus[status];
            
            // Get reservations for this hour
            const hourReservations = reservations.filter(res => {
              if (!res.isReserved) return false;
              const resStart = new Date(res.startDate);
              const resEnd = new Date(res.endDate);
              const slotStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour);
              const slotEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour + 1);
              return (resStart < slotEnd && resEnd > slotStart);
            });

            // Get equipment for this hour
            const hourEquipment = selectedResource.type === 'equipment' ? 
              equipmentAvailability.filter(item => {
                const itemStart = new Date(item.startDate);
                const itemEnd = new Date(item.endDate);
                const slotStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour);
                const slotEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour + 1);
                return (itemStart < slotEnd && itemEnd > slotStart);
              }) : [];

            // Limit visible items to 1
            const maxVisibleItems = 1;
            const visibleReservations = hourReservations.slice(0, maxVisibleItems);
            const visibleEquipment = hourEquipment.slice(0, maxVisibleItems);
            const extraItemsCount = selectedResource.type === 'equipment' 
              ? hourEquipment.length - maxVisibleItems 
              : hourReservations.length - maxVisibleItems;

            let borderClass = 'border-gray-200 dark:border-gray-700';
            if (isCurrentHour) {
              borderClass += ' shadow-[0_0_0_1px] shadow-blue-500 dark:shadow-blue-400';
            }

            return (
              <div
                key={hour}
                className={`
                  flex items-stretch relative group
                  ${statusStyle.className}
                  ${!isPastHour && !holidayInfo && !isWeekend && !isPastDay ? statusStyle.hoverClass : ''}
                  transition-colors duration-200
                  ${borderClass}
                  ${(isWeekend || isPastDay) ? 'cursor-not-allowed select-none' : ''}
                `}
                onClick={() => {
                  if (!isPastHour && !holidayInfo && !isWeekend && !isPastDay) {
                    handleTimeSlotClick(currentDate, hour);
                  }
                }}
              >
                {/* Time column */}
                <div className="w-32 py-4 px-4 bg-gray-50 dark:bg-gray-800/30 border-r border-gray-200 dark:border-gray-700 
                              flex items-center">
                  <div className="flex items-center space-x-2">
                    <span className={`
                      text-sm font-medium
                      ${isPastHour ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}
                      ${isCurrentHour ? 'text-blue-600 dark:text-blue-400' : ''}
                    `}>
                      {format(new Date().setHours(hour), 'h:mm a')}
                    </span>
                    
                    {isCurrentHour && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"/>
                    )}
                  </div>
                </div>
                
                {/* Content area */}
                <div className="flex-1 p-3 space-y-2">
                  {selectedResource.type === 'equipment' ? (
                    <>
                      {visibleEquipment.map((item, idx) => (
                        <div
                          key={idx}
                          className={`
                            p-2 rounded-lg border
                            ${item.totalAvailable < item.requestedQuantity
                              ? 'bg-rose-200 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/30'
                              : item.totalAvailable < item.currentQuantity
                                ? 'bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/30'
                                : 'bg-emerald-200 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm">
                              {item.totalAvailable}/{item.currentQuantity} available
                            </span>
                          </div>
                        </div>
                      ))}
                      {extraItemsCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowMoreItems(currentDate, [], hourEquipment);
                          }}
                          className="text-[10px] sm:text-xs px-1.5 py-0.5 mt-1
                                   bg-gray-100 dark:bg-gray-800 
                                   text-gray-600 dark:text-gray-400
                                   rounded-md hover:bg-gray-200 dark:hover:bg-gray-700
                                   transition-colors w-full text-center font-medium"
                        >
                          +{extraItemsCount} more
                        </button>
                      )}
                    </>
                  ) : (
                    // Reservations display
                    <>
                      {visibleReservations.map((res, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-blue-200 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-blue-800 dark:text-blue-300">
                              {res.venueName || (res.vehicleMake ? `${res.vehicleMake} ${res.vehicleModel}` : res.equipName)}
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {format(new Date(res.startDate), 'h:mm a')} - {format(new Date(res.endDate), 'h:mm a')}
                            </span>
                          </div>
                          {res.venueOccupancy && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Capacity: {res.venueOccupancy}
                            </div>
                          )}
                          {res.vehicleLicense && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              License: {res.vehicleLicense}
                            </div>
                          )}
                        </div>
                      ))}
                      {extraItemsCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowMoreItems(currentDate, hourReservations, []);
                          }}
                          className="text-[10px] sm:text-xs px-1.5 py-0.5 mt-1
                                   bg-gray-100 dark:bg-gray-800 
                                   text-gray-600 dark:text-gray-400
                                   rounded-md hover:bg-gray-200 dark:hover:bg-gray-700
                                   transition-colors w-full text-center font-medium"
                        >
                          +{extraItemsCount} more
                        </button>
                      )}
                    </>
                  )}

                  {/* Empty state */}
                  {!isPastHour && !holidayInfo && hourReservations.length === 0 && hourEquipment.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-sm text-gray-400 dark:text-gray-500">
                        Available for booking
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Add this new time conflict check utility function

  // Add helper function to determine conflict type
  const getConflictType = (newStart, newEnd, existingStart, existingEnd) => {
  if (newStart < existingStart && newEnd > existingEnd) {
    return 'COMPLETE_OVERLAP';
  } else if (newStart >= existingStart && newEnd <= existingEnd) {
    return 'WITHIN_EXISTING';
  } else if (newStart < existingStart && newEnd > existingStart) {
    return 'OVERLAP_START';
  } else if (newStart < existingEnd && newEnd > existingEnd) {
    return 'OVERLAP_END';
  } else {
    return 'ADJACENT';
  }
  };

// Update the handleTimeSelection function
const handleTimeSelection = () => {
  if (!isSelectionValid()) {
    toast.error('Please select both start and end times');
    return;
  }

  try {
    // Create safe Date objects
    const startDateTime = new Date(selectedStartDate);
    const endDateTime = new Date(selectedEndDate || selectedStartDate);

    // Validate end time is not equal to start time
    if (selectedTimes.startTime === selectedTimes.endTime && 
        selectedTimes.startMinute === selectedTimes.endMinute) {
      toast.error('End time cannot be the same as start time');
      return;
    }

    // Set hours and minutes
    startDateTime.setHours(selectedTimes.startTime || 0);
    startDateTime.setMinutes(selectedTimes.startMinute || 0);
    endDateTime.setHours(selectedTimes.endTime || 0);
    endDateTime.setMinutes(selectedTimes.endMinute || 0);

    // Check if it's a weekend
    const dayOfWeek = startDateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast.error('Reservations can only be made on working days (Monday to Friday)');
      return;
    }

    // Validate the base dates
    if (!isValidDate(startDateTime) || !isValidDate(endDateTime)) {
      toast.error('Invalid date selection');
      return;
    }

    // Validate business hours
    if (startDateTime.getHours() < 5 || endDateTime.getHours() > 19) {
      toast.error('Reservations must be between 5 AM and 7 PM');
      return;
    }

    // Check for valid chronological order
    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time');
      return;
    }

    // Check for conflicts
    const conflicts = checkConflicts(startDateTime, endDateTime);
    
    if (conflicts.length > 0) {
      setConflictDetails({
        conflicts,
        attemptedBooking: {
          start: format(startDateTime, 'MMM dd, yyyy HH:mm'),
          end: format(endDateTime, 'MMM dd, yyyy HH:mm')
        }
      });
      setShowConflictModal(true);
      return;
    }

    // If all validations pass, proceed with the reservation
    onDateSelect(startDateTime, endDateTime);
    setIsDatePickerModalOpen(false);
  } catch (error) {
    console.error('Error in handleTimeSelection:', error);
    toast.error('An error occurred while processing your selection');
  }
};

// Add utility function to validate dates
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const checkConflicts = (attemptedStart, attemptedEnd) => {
  if (!attemptedStart || !attemptedEnd) return [];

  if (selectedResource.type === 'equipment') {
    const conflicts = [];

    selectedResource.id.forEach(selectedEquip => {
      // Find overlapping availability records
      const overlappingAvailability = equipmentAvailability.filter(item => {
        const availStart = new Date(item.startDate);
        const availEnd = new Date(item.endDate);
        return (attemptedStart <= availEnd && attemptedEnd >= availStart);
      });

      overlappingAvailability.forEach(avail => {
        const available = parseInt(avail.totalAvailable);
        const requested = parseInt(selectedEquip.quantity);
        
        if (requested > available) {
          conflicts.push({
            equipmentName: avail.name,
            available: available,
            requested: requested,
            startDate: new Date(avail.startDate),
            endDate: new Date(avail.endDate)
          });
        }
      });
    });

    return conflicts;
  }

  // For venue/vehicle resources
  return reservations.filter(res => {
    if (!res.isReserved) return false;

    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);

    // Validate reservation dates
    if (!isValidDate(resStart) || !isValidDate(resEnd)) return false;

    // For multi-day reservations, we need to check each day's time slots
    const attemptedStartDay = new Date(attemptedStart).setHours(0, 0, 0, 0);
    const attemptedEndDay = new Date(attemptedEnd).setHours(23, 59, 59, 999);
    const resStartDay = new Date(resStart).setHours(0, 0, 0, 0);
    const resEndDay = new Date(resEnd).setHours(23, 59, 59, 999);

    // First check if the days overlap at all
    const daysOverlap = !(attemptedEndDay < resStartDay || attemptedStartDay > resEndDay);

    if (!daysOverlap) return false;

    // If days overlap, check time slots
    // Case 1: Same day reservation
    if (isSameDay(attemptedStart, attemptedEnd) && isSameDay(resStart, resEnd)) {
      return (
        (attemptedStart < resEnd && attemptedEnd > resStart) ||
        (resStart < attemptedEnd && resEnd > attemptedStart)
      );
    }

    // Case 2: Multi-day reservation
    // Check each day's business hours (5 AM - 7 PM)
    const startTimeOnDay = (date) => {
      const dayStart = new Date(date);
      dayStart.setHours(5, 0, 0, 0);
      return dayStart;
    };

    const endTimeOnDay = (date) => {
      const dayEnd = new Date(date);
      dayEnd.setHours(19, 0, 0, 0);
      return dayEnd;
    };

    // For the start day, check from the attempted/reserved start time until 7 PM
    // For the end day, check from 5 AM until the attempted/reserved end time
    // For days in between, the entire business hours (5 AM - 7 PM) are considered

    // Check start day overlap
    if (isSameDay(attemptedStart, resStart)) {
      if (attemptedStart < resEnd && attemptedEnd > resStart) return true;
    }

    // Check end day overlap
    if (isSameDay(attemptedEnd, resEnd)) {
      if (resStart < attemptedEnd && resEnd > attemptedStart) return true;
    }

    // Check if any full day is overlapping
    const isFullDayOverlap = () => {
      const start = new Date(Math.max(attemptedStartDay, resStartDay));
      const end = new Date(Math.min(attemptedEndDay, resEndDay));
      
      // Iterate through each day between start and end
      for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        if (!isSameDay(day, attemptedStart) && !isSameDay(day, attemptedEnd) &&
            !isSameDay(day, resStart) && !isSameDay(day, resEnd)) {
          // If we find a day that's fully within both reservations, it's a conflict
          return true;
        }
      }
      return false;
    };

    if (isFullDayOverlap()) return true;

    return false;
  }).filter(Boolean).map(res => ({
    ...res,
    conflictType: getConflictType(attemptedStart, attemptedEnd, new Date(res.startDate), new Date(res.endDate))
  }));
};

  const renderConflictModal = () => (
  <Dialog
    open={showConflictModal}
    onClose={() => setShowConflictModal(false)}
    className="relative z-50"
  >
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700/30">
        <div className="mb-5">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <Dialog.Title className="text-lg sm:text-xl font-semibold text-red-700 dark:text-red-400">
              Scheduling Conflict Detected
            </Dialog.Title>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 pl-1">
            Your selected time slot conflicts with existing reservations:
          </p>

          {conflictDetails && (
            <>
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl mb-4 border border-red-100 dark:border-red-900/20">
                <p className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Your attempted booking:
                </p>
                <p className="text-red-600 dark:text-red-300 pl-7">
                  <span className="font-medium">From:</span> {dayjs(conflictDetails.attemptedBooking.start).format('MMMM D, YYYY h:mm A')}
                  <br/>
                  <span className="font-medium">To:</span> {dayjs(conflictDetails.attemptedBooking.end).format('MMMM D, YYYY h:mm A')}
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                <p className="font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 5.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                  </svg>
                  Existing reservations:
                </p>
                <ul className="space-y-3 pl-7">
                {conflictDetails.conflicts.map((conflict, index) => {
                  const startDate = dayjs(conflict.startDate);
                  const endDate = dayjs(conflict.endDate);
                  const isSameDay = startDate.isSame(endDate, 'day');
                  
                  // Determine what to display based on resource type
                  let resourceDetails = '';
                  if (conflict.venueName) {
                    resourceDetails = conflict.venueName;
                  } else if (conflict.vehicleMake) {
                    resourceDetails = `${conflict.vehicleMake} ${conflict.vehicleModel}`;
                    if (conflict.vehicleLicense) {
                      resourceDetails += ` (${conflict.vehicleLicense})`;
                    }
                  }

                  return (
                    <li key={index} className="text-amber-700 dark:text-amber-300 border-l-2 border-amber-300 dark:border-amber-600 pl-3 py-1">
                      {resourceDetails && (
                        <div className="font-medium mb-1 text-amber-800 dark:text-amber-200">
                          {resourceDetails}
                        </div>
                      )}
                      <div className="text-sm">
                        {isSameDay ? (
                          <>
                            <span className="inline-block w-16">Date:</span> {startDate.format('MMMM D, YYYY')}
                            <br />
                            <span className="inline-block w-16">Time:</span> {startDate.format('h:mm A')} - {endDate.format('h:mm A')}
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-16">From:</span> {startDate.format('MMMM D, h:mm A')}
                            <br />
                            <span className="inline-block w-16">To:</span> {endDate.format('MMMM D, YYYY h:mm A')}
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            onClick={() => setShowConflictModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            onClick={() => {
              setShowConflictModal(false);
              setSelectedTimes({
                startTime: null,
                endTime: null,
                startMinute: null,
                endMinute: null
              });
              setDateRange(null);
            }}
          >
            Choose Different Time
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>
  );
  // Update the RangePicker in renderEnhancedDateTimeSelection
  
  const getBusinessHoursStatus = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (compareDate < today) return 'past';
    if (compareDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      if (currentHour >= 19) return 'past'; // After business hours
      if (currentHour < 5) return 'upcoming'; // Before business hours
      return 'current';
    }
    return 'upcoming';
  };
  // Update renderAvailabilityLegend to include yellow option
  const renderAvailabilityLegend = () => (
    <div className="flex flex-wrap gap-2 items-center mb-3 sm:mb-4 p-2 sm:p-3 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 shadow-sm text-[10px] sm:text-xs">
      <div className="font-medium mr-1 text-gray-700 dark:text-gray-300">Status:</div>
      
      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 animate-pulse"></div>
        <span className="text-emerald-700 dark:text-emerald-300">Available</span>
      </div>
      
      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400"></div>
        <span className="text-amber-700 dark:text-amber-300">Partially Reserved</span>
      </div>
      
      <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400"></div>
        <span className="text-rose-700 dark:text-rose-300">Fully Reserved</span>
      </div>
      
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800/70 rounded-lg">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-400"></div>
        <span className="text-gray-700 dark:text-gray-400">Past</span>
      </div>
      
      <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-violet-400"></div>
        <span className="text-violet-700 dark:text-violet-300">Holiday</span>
      </div>
    </div>
  );

  // Add this new function to handle day clicks
  const handleDayClick = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(day);
    compareDate.setHours(0, 0, 0, 0);
    
    // Only prevent dates before today (midnight)
    if (compareDate < today) {
      toast.error('Cannot select past dates');
      return;
    }
  
    const status = getAvailabilityStatus(day, reservations);
    const holidayInfo = holidays.find(h => h.date === day.toISOString().split('T')[0]);
  
    if (status === 'full') {
      toast.error('This date is already fully reserved');
      return;
    }
    
    if (holidayInfo) {
      toast.error(`Reservations not allowed on ${holidayInfo.name}`);
      return;
    }
  
    // Set only start date and open modal directly
    setSelectedStartDate(day);
    setStartDate(day);
    setEndDate(null);
    setSelectedEndDate(null);
    setIsDatePickerModalOpen(true);
    setSelectionMode('full');
  };

  // Add new handler for weekly/daily time slot clicks
  const handleTimeSlotClick = (day, hour) => {
    const now = new Date();
    const selectedDateTime = new Date(day);
    selectedDateTime.setHours(hour, 0, 0, 0);
  
    // Check if the selected time is in the past
    if (selectedDateTime < now) {
      toast.error('Cannot select past time slots', {
        position: 'top-center',
        icon: '⏰',
        className: 'font-medium'
      });
      return;
    }
    
    // Check if it's today but we're trying to book for earlier than the next hour
    if (isSameDay(day, now) && hour <= now.getHours()) {
      toast.error('Please select a future time slot', {
        position: 'top-center',
        icon: '⏱️',
        className: 'font-medium'
      });
      return;
    }
    
    // Check if the time slot is already reserved
    const status = getTimeSlotAvailability(day, hour, reservations);
    if (status === 'reserved') {
      toast.error('This time slot is already reserved', {
        position: 'top-center',
        icon: '❌',
        className: 'font-medium'
      });
      return;
    }
    
    // Check if it's a holiday
    const formattedDate = format(day, 'yyyy-MM-dd');
    const holidayInfo = holidays.find(h => h.date === formattedDate);
    if (holidayInfo) {
      toast.error(`Reservations not allowed on ${holidayInfo.name} (Holiday)`, {
        position: 'top-center',
        icon: '🏖️',
        className: 'font-medium'
      });
      return;
    }
  
    // Set start date and initial time
    setSelectedStartDate(day);
    setStartDate(day);
    setSelectedTimes(prev => ({
      ...prev,
      startTime: hour,
      startMinute: 0,
      endTime: hour + 1 >= 19 ? 19 : hour + 1, // Default end time to 1 hour later, capped at 7 PM
      endMinute: 0
    }));
    
    // Reset end date
    setEndDate(null);
    setSelectedEndDate(day); // Set same day as default end date
    
    // Show modal
    setIsDatePickerModalOpen(true);
  };

  // Add this new function to render the date range modal
  const renderDateRangeModal = () => (
    <Dialog
      open={isDatePickerModalOpen}
      onClose={() => setIsDatePickerModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-lg font-medium mb-4">
            Select Date and Time Range
          </Dialog.Title>

          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Start Date:</p>
              <p className="font-medium">{dayjs(startDate).format('MMMM D, YYYY')}</p>
            </div>
            
            <div>
              <label className="block text-sm mb-2">Start Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                placeholder="Select start time"
                disabledTime={() => ({
                  disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 19),
                })}
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      startTime: time.hour(),
                      startMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm mb-2">End Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                placeholder="Select end time"
                disabledTime={() => ({
                  disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 19),
                })}
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      endTime: time.hour(),
                      endMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => setIsDatePickerModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                if (!selectedTimes.startTime || !selectedTimes.endTime) {
                  toast.error('Please select both start and end times');
                  return;
                }

                const startDateTime = dayjs(startDate)
                  .hour(selectedTimes.startTime)
                  .minute(selectedTimes.startMinute || 0)
                  .toDate();

                const endDateTime = dayjs(startDate)
                  .hour(selectedTimes.endTime)
                  .minute(selectedTimes.endMinute || 0)
                  .toDate();

                if (endDateTime <= startDateTime) {
                  toast.error('End time must be after start time');
                  return;
                }

                const conflicts = checkTimeSlotConflicts(startDateTime, endDateTime, reservations);
                
                if (conflicts.length > 0) {
                  setConflictDetails({
                    conflicts,
                    attemptedBooking: {
                      start: dayjs(startDateTime).format('MMM DD, YYYY HH:mm'),
                      end: dayjs(endDateTime).format('MMM DD, YYYY HH:mm')
                    }
                  });
                  setShowConflictModal(true);
                  return;
                }

                onDateSelect(startDateTime, endDateTime);
                setIsDatePickerModalOpen(false);
              }}
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  // Add this new date-time selection modal component
  const renderDateTimeSelectionModal = () => {
    // Get current time for validation
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isToday = selectedStartDate && isSameDay(selectedStartDate, now);
    
    // Function to reset all selection state when modal is closed
    const handleCloseModal = () => {
      setIsDatePickerModalOpen(false);
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setStartDate(null);
      setEndDate(null);
      setSelectedTimes({
        startTime: null,
        endTime: null,
        startMinute: null,
        endMinute: null
      });
    };
    
    return (
      <Dialog
        open={isDatePickerModalOpen}
        onClose={handleCloseModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-md border border-gray-200 dark:border-gray-700/30">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg sm:text-xl font-semibold">
                Schedule Reservation
              </Dialog.Title>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 01.414 0L10 8.586l4.293-4.293a1 1 014.14 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              {/* Start Date Display (not editable) */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <label className="block text-xs sm:text-sm font-medium mb-2 text-blue-700 dark:text-blue-300">Selected Date</label>
                <div className="text-base sm:text-lg font-medium text-blue-800 dark:text-blue-200">
                  {dayjs(selectedStartDate).format('dddd, MMMM D, YYYY')}
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 011-2 0 1 1-2 0 1 1 012 0zM9 9a1 1 000 2v3a1 1 001 1h1a1 1 100-2v-3a1 1 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Business hours: 5:00 AM - 7:00 PM
                </div>
                {isToday && (
                  <div className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Current time: {format(now, 'h:mm a')}
                  </div>
                )}
              </div>

              {/* End Date Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Date</label>
                <DatePicker
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  value={selectedEndDate ? dayjs(selectedEndDate) : null}
                  onChange={(date) => setSelectedEndDate(date.toDate())}
                  disabledDate={(current) => {
                    // Disable weekends
                    if (current && (current.day() === 0 || current.day() === 6)) {
                      return true;
                    }
                    
                    // Check if it's a holiday
                    const formattedDate = current.format('YYYY-MM-DD');
                    if (holidays.some(holiday => holiday.date === formattedDate)) {
                      return true;
                    }
                    
                    // Disable dates before start date or past dates
                    return current < dayjs(selectedStartDate).startOf('day') ||
                           current < dayjs().startOf('day') ||
                           !isWithinSevenDays(current.toDate(), selectedStartDate);
                  }}
                />
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Start Time</label>
                  <TimePicker
                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    format="HH:mm"
                    minuteStep={30}
                    popupClassName="text-xs sm:text-sm"
                    value={selectedTimes.startTime ? 
                      dayjs().hour(selectedTimes.startTime).minute(selectedTimes.startMinute || 0) : 
                      null
                    }
                    disabledTime={() => {
                      const now = new Date();
                      const isToday = selectedStartDate && isSameDay(selectedStartDate, now);
                      const currentHour = now.getHours();
                      const currentMinute = now.getMinutes();

                      return {
                        disabledHours: () => {
                          // Always disable hours outside business hours (before 5am or after 7pm)
                          const baseDisabled = [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 19);
                          
                          // If it's today, disable hours before current hour
                          if (isToday) {
                            // Disable all hours before current hour
                            for (let h = 5; h < currentHour; h++) {
                              baseDisabled.push(h);
                            }
                            
                            // For current hour, we'll handle minutes separately
                          }
                          
                          return [...new Set(baseDisabled)]; // Remove duplicates
                        },
                        disabledMinutes: (selectedHour) => {
                          const disabledMinutes = [];
                          
                          // If today and selecting current hour, disable minutes before current minute
                          if (isToday && selectedHour === currentHour) {
                            for (let m = 0; m < currentMinute; m++) {
                              disabledMinutes.push(m);
                            }
                          }
                          
                          return disabledMinutes;
                        }
                      };
                    }}
                    onChange={(time) => {
                      if (time) {
                        setSelectedTimes(prev => ({
                          ...prev,
                          startTime: time.hour(),
                          startMinute: time.minute()
                        }));
                      }
                    }}
                    placeholder="5:00 AM - 7:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Time</label>
                  <TimePicker
                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    format="HH:mm"
                    minuteStep={30}
                    popupClassName="text-xs sm:text-sm"
                    value={selectedTimes.endTime ? 
                      dayjs().hour(selectedTimes.endTime).minute(selectedTimes.endMinute || 0) : 
                      null
                    }
                    disabledTime={() => ({
                      disabledHours: () => {
                        const baseDisabled = [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 20);
                        
                        // If start time is selected, disable all hours before and including start hour
                        if (selectedTimes.startTime !== null && isSameDay(selectedStartDate, selectedEndDate)) {
                          // Disable all hours <= start hour
                          for (let h = 5; h <= selectedTimes.startTime; h++) {
                            baseDisabled.push(h);
                          }
                        }
                        
                        return [...new Set(baseDisabled)]; // Remove duplicates
                      },
                      disabledMinutes: (selectedHour) => {
                        const disabledMinutes = [];
                        
                        // If same hour as start time, disable minutes <= start minute
                        if (selectedTimes.startTime !== null && 
                            isSameDay(selectedStartDate, selectedEndDate) && 
                            selectedHour === selectedTimes.startTime) {
                          // Disable all minutes <= start minute
                          for (let m = 0; m <= selectedTimes.startMinute; m++) {
                            disabledMinutes.push(m);
                          }
                        }
                        
                        return disabledMinutes;
                      }
                    })}
                    onChange={(time) => {
                      if (time) {
                        setSelectedTimes(prev => ({
                          ...prev,
                          endTime: time.hour(),
                          endMinute: time.minute()
                        }));
                      }
                    }}
                    placeholder="5:00 AM - 7:00 PM"
                  />
                </div>
              </div>
              
              {/* Validation guidelines */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600/30 text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 010 1.414l-8 8a1 1 01-1.414 0l-4-4a1 1 011.414-1.414L8 12.586l7.293-7.293a1 1 011.414 1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Select a time between 5:00 AM and 7:00 PM</span>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 010 1.414l-8 8a1 1 01-1.414 0l-4-4a1 1 011.414-1.414L8 12.586l7.293-7.293a1 1 011.414 1.414z" clipRule="evenodd" />
                  </svg>
                  <span>End time must be after start time</span>
                </div>
                {isToday && (
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-amber-700 dark:text-amber-300">Times before {format(now, 'h:mm a')} are disabled for today</span>
                  </div>
                )}
                {selectedStartDate !== selectedEndDate && (
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 010 1.414l-8 8a1 1 01-1.414 0l-4-4a1 1 011.414-1.414L8 12.586l7.293-7.293a1 1 011.414 1.414z" clipRule="evenodd" />
                    </svg>
                    <span>You've selected a multi-day reservation</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                className="w-1/3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className="w-2/3 px-3 py-2.5 text-sm font-medium text-white bg-blue-500 
                         hover:bg-blue-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  // Validate date selection
                  if (!selectedStartDate || !selectedEndDate) {
                    toast.error('Please select both start and end dates');
                    return;
                  }

                  // Validate time selection
                  if (!selectedTimes.startTime || !selectedTimes.endTime) {
                    toast.error('Please select both start and end times');
                    return;
                  }

                  const startDateTime = dayjs(selectedStartDate)
                    .hour(selectedTimes.startTime)
                    .minute(selectedTimes.startMinute || 0)
                    .toDate();

                  const endDateTime = dayjs(selectedEndDate)
                    .hour(selectedTimes.endTime)
                    .minute(selectedTimes.endMinute || 0)
                    .toDate();

                  // Validate date-time combination
                  if (endDateTime <= startDateTime) {
                    toast.error('End date-time must be after start date-time');
                    return;
                  }

                  // Check for conflicts
                  const conflicts = checkConflicts(startDateTime, endDateTime);
                  if (conflicts.length > 0) {
                    setConflictDetails({
                      conflicts,
                      attemptedBooking: {
                        start: dayjs(startDateTime).format('MMM DD, YYYY HH:mm'),
                        end: dayjs(endDateTime).format('MMM DD, YYYY HH:mm')
                      }
                    });
                    setShowConflictModal(true);
                    return;
                  }

                  // If all validations pass, proceed with the selection
                  onDateSelect(startDateTime, endDateTime);
                  setIsDatePickerModalOpen(false);
                }}
                disabled={!selectedStartDate || !selectedEndDate || !selectedTimes.startTime || !selectedTimes.endTime}
              >
                Confirm Reservation
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  };

  // Add this new function before the return statement
  const renderTimeSelectionModal = () => (
  <Dialog
    open={timeModalOpen}
    onClose={() => setTimeModalOpen(false)}
    className="relative z-50"
  >
    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
        <Dialog.Title className="text-lg font-medium mb-4">
          Select Time Range
        </Dialog.Title>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                value={selectedTimes.startTime ? 
                  dayjs().hour(selectedTimes.startTime).minute(selectedTimes.startMinute || 0) : 
                  null
                }
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      startTime: time.hour(),
                      startMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                value={selectedTimes.endTime ? 
                  dayjs().hour(selectedTimes.endTime).minute(selectedTimes.endMinute || 0) : 
                  null
                }
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      endTime: time.hour(),
                      endMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            onClick={() => setTimeModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleTimeSelection}
          >
            Confirm
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>
  );

  // Update the checkTimeSlotConflicts function
  const checkTimeSlotConflicts = (start, end) => {
    if (selectedResource.type === 'equipment') {
      const conflicts = [];
      
      selectedResource.id.forEach(equipment => {
        const overlappingItems = equipmentAvailability.filter(item => {
          const itemStart = new Date(item.startDate);
          const itemEnd = new Date(item.endDate);
          
          // Check if the time slot overlaps with the equipment reservation period
          return (start <= itemEnd && end >= itemStart);
        });
        
        overlappingItems.forEach(item => {
          const available = parseInt(item.totalAvailable);
          const requested = parseInt(equipment.quantity);
          
          // Add conflict if requested quantity exceeds available quantity
          if (available < requested) {
            conflicts.push({
              equipId: item.equipId,
              name: item.name,
              available: available,
              requested: requested,
              startDate: new Date(item.startDate),
              endDate: new Date(item.endDate)
            });
          }
        });
      });
      
      return conflicts;
    }

    // Original conflict checking for venues/vehicles
    return reservations.filter(res => {
      if (!res.isReserved) return false;

      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      // Check if time periods overlap
      return (start < resEnd && end > resStart);
    });
  };

  // Enhanced calendar view with loading state
  return (
    <div className="p-1.5 sm:p-4 space-y-2 sm:space-y-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      <div className="relative">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 z-10 flex items-center justify-center"
            >
              <Spin size="small" />
            </motion.div>
          )}
        </AnimatePresence>

        {renderAvailabilityLegend()}

  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handleDateNavigation('prev')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ←
              </button>
              <h2 className="text-sm sm:text-lg font-semibold">
                {format(currentDate, 'MMM yyyy')}
              </h2>
              <button
                onClick={() => handleDateNavigation('next')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                →
              </button>
            </div>
          </div>
          
          {/* View toggles */}
          <div className="flex gap-0.5 sm:gap-2">
            {['month', 'week', 'day'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md
                  ${view === viewType 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {view === 'month' && (
          <>
            <div className="mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="text-center font-medium text-gray-500 text-[10px] sm:text-sm">
                  {day}
                </div>
              ))}
            </div>
            {renderCalendarGrid()}
          </>
        )}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}

        {renderTimeSelectionModal()}
        {renderDateRangeModal()}
        {renderConflictModal()}
        {renderDateTimeSelectionModal()}
        <DayDetailsModal />
      </div>
    </div>
  );
};



export default ReservationCalendar;


