import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { format, isSameDay, isPast, endOfDay, isBefore, isWithinInterval } from 'date-fns';
import { toast } from 'react-toastify';
import { DatePicker, TimePicker, Spin } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SecureStorage } from '../../../utils/encryption';

dayjs.extend(utc);
dayjs.extend(timezone);

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
    hoverClass: 'hover:shadow-md hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20 hover:scale-[1.02] hover:z-10 transition-all duration-200 cursor-pointer', // Always pointer
    textClass: 'text-rose-800 dark:text-rose-300'
  },
  holiday: {
    className: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-violet-200 dark:border-violet-800/30',
    hoverClass: 'cursor-not-allowed select-none',
    textClass: 'text-purple-800 dark:text-violet-300'
  },
  outside: {
    className: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/70 dark:to-gray-800/80 opacity-60 shadow-inner',
    hoverClass: 'cursor-not-allowed select-none',
    textClass: 'text-gray-400 dark:text-gray-500 line-through'
  }
};

const ReservationCalendar = ({ onDateSelect, selectedResource, initialData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  // const [selectedStartDate, setSelectedStartDate] = useState(null);
  // const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [reservations, setReservations] = useState(initialData?.reservations || []);
  const [view, setView] = useState('month');
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState({
    startTime: null,
    endTime: null,
    startMinute: null,
    endMinute: null
  });
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [baseUrl, setBaseUrl] = useState('');
  const [holidays, setHolidays] = useState(initialData?.holidays || []);
  const [equipmentAvailability, setEquipmentAvailability] = useState(initialData?.equipmentAvailability || []);
  const [driverAvailability, setDriverAvailability] = useState([]);
  const [showDriverWarningModal, setShowDriverWarningModal] = useState(false);
  const [pendingDateSelection, setPendingDateSelection] = useState(null);
  const userLevel = SecureStorage.getSessionItem('user_level');
  const userDepartment = SecureStorage.getSessionItem('Department Name');
  const [allDriversAvailable, setAllDriversAvailable] = useState(false); // NEW

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


  // Define now and today as constants that are used throughout the component
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Business hours from 8 AM to 10 PM
  const businessHours = [...Array(14)].map((_, i) => i + 8); // 8 to 21 (8 AM to 10 PM)

  const [isLoading, setIsLoading] = useState(false);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  // const [selectionMode, setSelectionMode] = useState('full');

  // const isSelectionValid = () => {
  //   if (selectionMode === 'full') {
  //     return (
  //       dateRange.start && 
  //       dateRange.end && 
  //       selectedTimes.startTime !== null && 
  //       selectedTimes.endTime !== null &&
  //       selectedTimes.startTime >= 5 &&
  //       selectedTimes.endTime <= 19 &&
  //       setSelectionMode('full')
  //     );
  //   } else {
  //     return (
  //       dateRange.start && 
  //       dateRange.end &&
  //       selectedTimes.endTime !== null &&
  //       selectedTimes.endTime <= 19 &&
  //       setSelectionMode('partial')
  //     );
  //   }
  // };




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

        console.log('Holidays response:', response.data);

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

  const fetchReservations = useCallback(async () => {
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
        const formattedReservations = (response.data.data || []).map(res => {
          // Debug logging for each reservation
          console.log('Processing reservation:', {
            startDate: res.reservation_start_date,
            endDate: res.reservation_end_date,
            statusId: res.reservation_status_status_id,
            statusType: typeof res.reservation_status_status_id,
            isStatus6: res.reservation_status_status_id === '6',
            isStatus1: res.reservation_status_status_id === '1',
            isStatus6Num: res.reservation_status_status_id === 6,
            isStatus1Num: res.reservation_status_status_id === 1
          });
          
          return {
            startDate: res.reservation_start_date,
            endDate: res.reservation_end_date,
            status: res.reservation_status_status_id,
            isReserved: res.reservation_status_status_id === 6 || res.reservation_status_status_id === 1,
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
          };
        });
        console.log('Formatted reservations:', formattedReservations);
        setReservations(formattedReservations);
      }
    } catch (error) {
      toast.error('Failed to fetch reservations');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, selectedResource]);

  const fetchEquipmentAvailability = useCallback(async () => {
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
  }, [baseUrl, selectedResource]);

  const fetchDriverAvailability = useCallback(async () => {
    if (!baseUrl || selectedResource.type !== 'vehicle') return;
    
    try {
      const response = await axios.post(
        `${baseUrl}/user.php`,
        {
          operation: 'fetchAvailableDrivers'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Driver availability response:', response.data);
      console.log('Driver availability data structure:', {
        status: response.data.status,
        dataLength: response.data.data?.length || 0,
        sampleDriver: response.data.data?.[0] || null
      });
      
      if (response.data.status === 'success') {
        if (Array.isArray(response.data.data) && response.data.data.length === 0) {
          setAllDriversAvailable(true); // All dates available
          setDriverAvailability([]);
        } else {
          setAllDriversAvailable(false);
          setDriverAvailability(response.data.data || []);
        }
      } else {
        setAllDriversAvailable(false);
        setDriverAvailability([]);
      }
    } catch (error) {
      setAllDriversAvailable(false);
      setDriverAvailability([]);
    }
  }, [baseUrl, selectedResource]);



  const isHoliday = (date) => {
    if (!date || !holidays.length) return false;
    // Format both dates consistently as 'YYYY-MM-DD' for comparison
    const formattedDate = format(date, 'yyyy-MM-dd');
    return holidays.some(holiday => holiday.date === formattedDate);
  };

  // Helper to get the max selectable date (today + 7 days)


  // Helper to get the minimum selectable date (today + 7 days)
  const getMinSelectableDate = () => {
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + 7);
    return minDate;
  };

  const handleDateClick = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minSelectableDate = getMinSelectableDate();

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
  
    // Check if date is before min selectable date
    if (compareDate < minSelectableDate) {
      toast.error('You must book at least 1 week in advance', {
        position: 'top-center',
        icon: '⏰',
        className: 'font-medium'
      });
      return;
    }
    

    
    // Check if it's today but after business hours
    if (compareDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      if (currentHour >= 22) {
        toast.error('Bookings for today are closed (after 10:00 PM)', {
          position: 'top-center',
          icon: '⏱️',
          className: 'font-medium'
        });
        return;
      }
    }
  
    // If we already have a start date selected
    if (dateRange.start && !dateRange.end) {
      // Check if the new date is before start date
      if (isBefore(date, dateRange.start)) {
        toast.error('End date cannot be before start date', {
          position: 'top-center',
          icon: '❌',
          className: 'font-medium'
        });
        return;
      }
    }
  
    // Skip reservation status check for COO Department Head
    const isCooDepartmentHead = userLevel === 'Department Head' && userDepartment === 'COO';
    if (!isCooDepartmentHead) {
      const status = getAvailabilityStatus(date, reservations);
      if (status === 'reserved') {
        toast.error('This date is already fully reserved for the business hours (8AM-5PM)', {
          position: 'top-center',
          icon: '❌',
          className: 'font-medium'
        });
        return;
      }
    }
    
    // Set the selected dates
    if (!dateRange.start) {
      setDateRange({ start: date, end: null });
      // Clear times when selecting first date
      setSelectedTimes({
        startTime: null,
        endTime: null,
        startMinute: null,
        endMinute: null
      });
    } else {
      setDateRange({ ...dateRange, end: date });
      // Clear times when selecting end date
      setSelectedTimes({
        startTime: null,
        endTime: null,
        startMinute: null,
        endMinute: null
      });
    }
    
    // Set default times based on current time if it's today
    if (isSameDay(date, new Date())) {
      const currentHour = now.getHours();
      const defaultStartHour = Math.max(currentHour + 1, 8); // Start at next hour, minimum 8 AM
      
      if (defaultStartHour < 22) { // Only set if within business hours
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
        startTime: 8, // Default to 8 AM
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

    // Check if date is before min selectable date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minSelectableDate = getMinSelectableDate();
    if (compareDate < minSelectableDate) {
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
        
        // Check if the reservation spans the whole business day (8AM to 10PM)
        const startsBeforeOrAt8AM = itemStart.getHours() <= 8;
        const endsAtOrAfter10PM = itemEnd.getHours() >= 22;
        const spansWholeDay = startsBeforeOrAt8AM && endsAtOrAfter10PM;
        
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
            (itemStart.getHours() > 8 || itemEnd.getHours() < 17)) ||
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

    // Check if this date has any reservations
    const dateReservations = allReservations.filter(res => {
      if (!res.isReserved) return false;

      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      // Check if this date falls within the reservation period
      const dateStart = new Date(compareDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(compareDate);
      dateEnd.setHours(23, 59, 59, 999);
      
      return resStart <= dateEnd && resEnd >= dateStart;
    });

    if (dateReservations.length === 0) {
      return 'available';
    }

    // Check if any reservation blocks the entire business day
    const hasFullDayBlock = dateReservations.some(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      if (isSameDay(resStart, resEnd) && isSameDay(resStart, compareDate)) {
        // Single day reservation - check if it spans the entire business day
        const startsBeforeOrAt8AM = resStart.getHours() <= 8;
        const endsAtOrAfter10PM = resEnd.getHours() >= 22;
        const spansWholeDay = startsBeforeOrAt8AM && endsAtOrAfter10PM;
        console.log(`Availability check - Single day ${format(compareDate, 'yyyy-MM-dd')}: ${spansWholeDay ? 'FULL DAY BLOCKED' : 'PARTIAL'} (${resStart.getHours()}:${resStart.getMinutes()}-${resEnd.getHours()}:${resEnd.getMinutes()})`);
        return spansWholeDay;
      } else if (isSameDay(resStart, compareDate)) {
        // First day of multi-day reservation - check if it starts at or before 8 AM
        const isFullDay = resStart.getHours() <= 8;
        console.log(`Availability check - First day ${format(compareDate, 'yyyy-MM-dd')}: ${isFullDay ? 'FULL DAY BLOCKED' : 'PARTIAL'} (start hour: ${resStart.getHours()})`);
        return isFullDay;
      } else if (isSameDay(resEnd, compareDate)) {
        // Last day of multi-day reservation - check if it ends at or after 10 PM
        const isFullDay = resEnd.getHours() >= 22;
        console.log(`Availability check - Last day ${format(compareDate, 'yyyy-MM-dd')}: ${isFullDay ? 'FULL DAY BLOCKED' : 'PARTIAL'} (end hour: ${resEnd.getHours()})`);
        return isFullDay;
      } else {
        // Middle day of multi-day reservation - always blocks full day
        console.log(`Availability check - Middle day ${format(compareDate, 'yyyy-MM-dd')}: FULL DAY BLOCKED (middle day)`);
        return true;
      }
    });

    if (hasFullDayBlock) {
      return 'reserved';
    }

    // Check if there are any partial reservations
    const hasPartialReservations = dateReservations.some(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      if (isSameDay(resStart, resEnd) && isSameDay(resStart, compareDate)) {
        // Single day reservation - check if it doesn't span the entire business day
        const startsAfter8AM = resStart.getHours() > 8;
        const endsBefore10PM = resEnd.getHours() < 22;
        return startsAfter8AM || endsBefore10PM;
      } else if (isSameDay(resStart, compareDate)) {
        // First day - check if it starts after 8 AM
        return resStart.getHours() > 8;
      } else if (isSameDay(resEnd, compareDate)) {
        // Last day - check if it ends before 10 PM
        return resEnd.getHours() < 22;
      } else {
        // Middle day - should not happen if we already checked for full day block
        return false;
      }
    });

    return hasPartialReservations ? 'partial' : 'available';
};

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
      } else {
        // Debug: Log what's in initialData
        console.log('Using initialData:', {
          reservations: initialData?.reservations,
          equipmentAvailability: initialData?.equipmentAvailability,
          selectedResourceType: selectedResource.type
        });
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to fetch initial calendar data');
    }
  };

  fetchInitialData();
}, [baseUrl, selectedResource, initialData, fetchEquipmentAvailability, fetchReservations]);




const renderCalendarGrid = () => {
  // Debug logging for reservations
  console.log('Current reservations state:', reservations);
  console.log('Current date:', currentDate);
  
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
   
        const formattedDate = format(day, 'yyyy-MM-dd');
        const holidayInfo = holidays.find(h => h.date === formattedDate);
        const compareDate = new Date(day);
        compareDate.setHours(0, 0, 0, 0);
        const isPastDate = compareDate < today;
        const isPresentDate = isSameDay(day, today);
        const currentTime = now.getHours();
        const isAfterBusinessHours = isPresentDate && currentTime >= 17;
        // const isBeforeBusinessHours = isPresentDate && currentTime < 5;
        const isUnavailable = isPastDate || isAfterBusinessHours;
        const isSelected = dateRange.start && day >= dateRange.start && 
                         (dateRange.end ? day <= dateRange.end : day === dateRange.start);
        let status = isPastDate ? 'past' : getAvailabilityStatus(day, reservations);
        
        if (isPresentDate && isAfterBusinessHours) {
          status = 'past';
        }
        
        const statusStyle = availabilityStatus[status] || availabilityStatus['past'];

        // Check if user is COO Department Head
        const isCooDepartmentHead = userLevel === 'Department Head' && userDepartment === 'COO';

        // Get reservations for this day
        const dayReservations = reservations.filter(res => {
          // Debug logging for filtering
          console.log(`Filtering reservation for ${format(day, 'yyyy-MM-dd')}:`, {
            isReserved: res.isReserved,
            startDate: res.startDate,
            endDate: res.endDate,
            status: res.status,
            dayDate: day.toISOString(),
            reservationStartDate: res.startDate,
            reservationEndDate: res.endDate
          });
          
          if (!res.isReserved) {
            console.log('Reservation filtered out - not reserved');
            return false;
          }
          
          const resStart = new Date(res.startDate);
          const resEnd = new Date(res.endDate);
          // Set the time to midnight for date comparison
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);
          
          // Check if the reservation overlaps with this day (single or multi-day)
          const overlaps = (
            (resStart <= dayEnd && resEnd >= dayStart) ||
            isSameDay(resStart, day) ||
            isSameDay(resEnd, day)
          );
          
          console.log('Reservation overlap check:', {
            resStart: resStart.toISOString(),
            resEnd: resEnd.toISOString(),
            dayStart: dayStart.toISOString(),
            dayEnd: dayEnd.toISOString(),
            overlaps: overlaps
          });
          
          return overlaps;
        }).map(res => {
          // Calculate the actual start and end times for this specific day
          const resStart = new Date(res.startDate);
          const resEnd = new Date(res.endDate);
          const currentDate = new Date(day);
          currentDate.setHours(0, 0, 0, 0);
          
          let dayStartTime, dayEndTime;
          
          // If this is the first day of the reservation
          if (isSameDay(resStart, currentDate)) {
            dayStartTime = resStart;
            // If it's a multi-day reservation, end at business hours (10 PM)
            if (!isSameDay(resStart, resEnd)) {
              dayEndTime = new Date(currentDate);
              dayEndTime.setHours(22, 0, 0, 0);
            } else {
              // Single day reservation - use actual end time
              dayEndTime = resEnd;
            }
          } else if (isSameDay(resEnd, currentDate)) {
            // If this is the last day of the reservation
            dayStartTime = new Date(currentDate);
            dayStartTime.setHours(8, 0, 0, 0); // Start at business hours (8 AM)
            dayEndTime = resEnd;
          } else {
            // For days in between (multi-day reservations)
            dayStartTime = new Date(currentDate);
            dayStartTime.setHours(8, 0, 0, 0); // Start at business hours (8 AM)
            dayEndTime = new Date(currentDate);
            dayEndTime.setHours(22, 0, 0, 0); // End at business hours (10 PM)
          }
          
          return {
            ...res,
            dayStartTime,
            dayEndTime
          };
        });

        // Get equipment availability for this day
        const dayEquipment = selectedResource.type === 'equipment' ? equipmentAvailability.filter(item => {
          const itemStart = new Date(item.startDate);
          const itemEnd = new Date(item.endDate);
          // Check if the equipment reservation overlaps with this day (single or multi-day)
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);
          return (
            (itemStart <= dayEnd && itemEnd >= dayStart) ||
            isSameDay(itemStart, day) ||
            isSameDay(itemEnd, day)
          );
        }) : [];

        // Determine how many items to show and if we need a "more" button
        const maxVisibleItems = isPresentDate ? 2 : 3;
    
        const visibleEquipment = dayEquipment.slice(0, maxVisibleItems);
        const hasMoreItems = selectedResource.type === 'equipment'
          ? dayEquipment.length > maxVisibleItems
          : dayReservations.length > maxVisibleItems;
        const extraItemsCount = selectedResource.type === 'equipment'
          ? dayEquipment.length - maxVisibleItems
          : dayReservations.length - maxVisibleItems;

        // Utility to deduplicate by a key
        

        // In renderCalendarGrid, before mapping visibleReservations
       

        // Determine cursor style based on user level and availability
        let cursorClass = '';
        if (isCooDepartmentHead) {
          // COO Department Head can always click unless it's a past date
          if (!isPastDate) {
            cursorClass = 'cursor-pointer hover:shadow-md hover:scale-[1.02] hover:z-10 transition-all duration-200';
          } else {
            cursorClass = 'cursor-not-allowed select-none';
          }
        } else {
          // Regular users get the standard availability-based cursor
          // Check if the status is 'reserved' (full day blocked) or if it's unavailable
          if (status === 'reserved' || isUnavailable) {
            cursorClass = 'cursor-not-allowed select-none';
          } else {
            cursorClass = statusStyle.hoverClass;
          }
        }

        return (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.01 }}
            onClick={() => {
              const isCooDepartmentHead = userLevel === 'Department Head' && userDepartment === 'COO';
              if (isCooDepartmentHead || !isUnavailable) {
                handleDateClick(day);
              }
            }}
            className={`
              relative min-h-[80px] sm:min-h-[120px] p-2 sm:p-3
              border dark:border-gray-700/50 rounded-xl
              backdrop-blur-sm
              ${isCurrentMonth ? statusStyle.className : 'opacity-40 bg-gray-50 dark:bg-gray-800/40'}
              ${cursorClass}
              ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}

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
                          break-words leading-tight bg-blue-50 dark:bg-blue-900/20 
                          text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30
                        `}
                      >
                        {/* {item.name}: {item.totalAvailable}/{item.currentQuantity} */}
                      </div>
                    ))}
                  </>
                ) : (
                  // Reservations display
                  <>
                    
                    {hasMoreItems && (
                      <button
                        onClick={() => handleShowMoreItems(day, dayReservations, visibleEquipment)}
                        className="text-[8px] sm:text-xs px-1.5 py-0.5 
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

              {/* Driver availability indicator - only show for vehicle resources when enabled */}
              {selectedResource.type === 'vehicle' && (
                <div className="absolute top-2 right-2">
                  {(() => {
                    const driverInfo = getDriverAvailabilityForDate(day);
                    return (
                      <div className={`
                        px-1.5 py-0.5 rounded-full text-[8px] font-medium
                        ${driverInfo.isSufficient 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }
                      `}>
                        {driverInfo.available}/{driverInfo.numberOfVehicles}
                      </div>
                    );
                  })()}
                </div>
              )}
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

  setDayDetails({
    reservations,
    equipment,
    date: day
  });
  setShowDayDetailsModal(true);
};

// Add state for the day details modal
const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
// const [selectedDate, setSelectedDate] = useState(null);
const [dayDetails, setDayDetails] = useState(null);

// Add this new component for the day details modal
const DayDetailsModal = () => {
  if (!dayDetails) return null;

  // Utility to deduplicate by a key
  const dedupeById = (arr, idKey = 'reservation_id', fallbackKeyFn) => {
    const seen = new Set();
    return arr.filter(item => {
      const key = item[idKey] || (fallbackKeyFn ? fallbackKeyFn(item) : undefined);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // In DayDetailsModal, before mapping dayDetails.reservations
  const uniqueDayDetailsReservations = dedupeById(
    dayDetails?.reservations || [],
    'reservation_id',
    (item) => `${item.startDate}_${item.venueName || item.vehicleMake + '_' + item.vehicleModel || ''}`
  );

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
                      {format(new Date(item.startDate), 'h:mm a')} - {format(new Date(item.endDate), 'h:mm a')}
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
                {uniqueDayDetailsReservations.map((res, idx) => (
                  <div
                    key={res.reservation_id || `${res.startDate}_${res.venueName || res.vehicleMake + '_' + res.vehicleModel || ''}`}
                    className="p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="space-y-1">
                      {/* <div className="font-medium text-gray-900 dark:text-gray-100 break-words leading-tight">
                        {res.venueName || (res.vehicleMake ? `${res.vehicleMake} ${res.vehicleModel}` : res.equipName)}
                      </div> */}
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {format(res.dayStartTime, 'h:mm a')} - {format(res.dayEndTime, 'h:mm a')}
                      </div>
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
    if (hour < 8 || hour >= 17) {
      return 'outside';
    }
    
    // Check if it's a holiday
    if (holidays.some(holiday => format(date, 'yyyy-MM-dd') === holiday.date)) {
      return 'holiday';
    }

    // Check if date is before min selectable date
    const minSelectableDate = getMinSelectableDate();
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);
    if (slotDate < minSelectableDate) {
      return 'past';
    }

    // If user is Department Head from COO, all slots are available
    if (userLevel === 'Department Head' && userDepartment === 'COO') {
      return 'available';
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
  
      // Check if the date falls within the reservation period
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      
      // First check if this date is within the reservation period
      if (resStart <= dateEnd && resEnd >= dateStart) {
        // Now check the specific time slot with proper day-specific time ranges
        if (isSameDay(resStart, resEnd) && isSameDay(resStart, date)) {
          // Single day reservation - check if hour is within the specific time range
          const startHour = resStart.getHours();
          const endHour = resEnd.getHours();
          const isReserved = hour >= startHour && hour < endHour;
          console.log(`Single day reservation check ${format(date, 'yyyy-MM-dd')} hour ${hour}: ${isReserved ? 'RESERVED' : 'AVAILABLE'} (${startHour}-${endHour})`);
          return isReserved;
        } else if (isSameDay(resStart, date)) {
          // First day of multi-day reservation - check if hour is after start time
          const isReserved = hour >= resStart.getHours();
          console.log(`Multi-day reservation check - First day ${format(date, 'yyyy-MM-dd')} hour ${hour}: ${isReserved ? 'RESERVED' : 'AVAILABLE'} (start hour: ${resStart.getHours()})`);
          return isReserved;
        } else if (isSameDay(resEnd, date)) {
          // Last day of multi-day reservation - check if hour is before end time
          const isReserved = hour < resEnd.getHours();
          console.log(`Multi-day reservation check - Last day ${format(date, 'yyyy-MM-dd')} hour ${hour}: ${isReserved ? 'RESERVED' : 'AVAILABLE'} (end hour: ${resEnd.getHours()})`);
          return isReserved;
        } else {
          // Middle day of multi-day reservation - all business hours are blocked
          console.log(`Multi-day reservation check - Middle day ${format(date, 'yyyy-MM-dd')} hour ${hour}: RESERVED (middle day)`);
          return true;
        }
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

  useEffect(() => {
    if (selectedResource.type === 'equipment') {
      fetchEquipmentAvailability();
    } else {
      // Ensure selectedResource.id is always an array
      // const itemIds = Array.isArray(selectedResource.id) ? selectedResource.id : [selectedResource.id].filter(Boolean);
      
      fetchReservations();
    }
    // Fetch driver availability when resource type is vehicle
    if (selectedResource.type === 'vehicle') {
      fetchDriverAvailability();
    }
  }, [selectedResource, fetchEquipmentAvailability, fetchReservations, fetchDriverAvailability]);

  // Clear times when modal opens
  useEffect(() => {
    if (isDatePickerModalOpen) {
      setSelectedTimes({
        startTime: null,
        endTime: null,
        startMinute: null,
        endMinute: null
      });
    }
  }, [isDatePickerModalOpen]);

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

                  ${isHoliday ? 'bg-violet-100 dark:bg-violet-900/40' : ''}
                  ${isPastDate ? 'bg-gray-100 dark:bg-gray-800/40 opacity-60' : ''}
                `}
              >
                <div className={`
                  text-center rounded-lg py-1
                  ${isToday ? 'bg-blue-200 dark:bg-blue-900/60' : ''}

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
                    {format(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, 0, 0, 0), 'h:mm a')}
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
                  ${isPastDate ? 'bg-gray-100 dark:bg-gray-800/40' : ''}
                `}>
                  {businessHours.map((hour) => {
                    const isPastHour = isBefore(
                      new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour),
                      new Date()
                    );
                    const currentHour = new Date().getHours() === hour && isToday;
                    
                    // Get the availability status for this time slot
                    const status = isPastDate ? 'past' : getTimeSlotAvailability(day, hour);
                    const statusStyle = availabilityStatus[status] || availabilityStatus['past'];
                    
                    // Check if user is COO Department Head
                    const isCooDepartmentHead = userLevel === 'Department Head' && userDepartment === 'COO';
                    
                    // Determine cursor style based on user level and availability
                    let cursorClass = '';
                    if (isCooDepartmentHead) {
                      // COO Department Head can always click unless it's a past hour, holiday, or past date
                      if (!isPastHour && !isHoliday && !isPastDate) {
                        cursorClass = 'cursor-pointer hover:shadow-md hover:scale-[1.02] hover:z-10 transition-all duration-200';
                      } else {
                        cursorClass = 'cursor-not-allowed select-none';
                      }
                    } else {
                      // Regular users get the standard availability-based cursor
                      // Check if the status is 'reserved' (full day blocked) or if it's unavailable
                      if (status === 'reserved' || isPastHour || isHoliday || isPastDate) {
                        cursorClass = 'cursor-not-allowed select-none';
                      } else {
                        cursorClass = statusStyle.hoverClass;
                      }
                    }
                    
                    // Get reservations for this time slot with proper time range calculation
                    const timeSlotReservations = selectedResource.type === 'equipment' ? [] : reservations.filter(res => {
                      if (!res.isReserved) return false;
                      
                      const resStart = new Date(res.startDate);
                      const resEnd = new Date(res.endDate);
                      const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
                      const slotEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1);
                      
                      // Check if this date falls within the reservation period
                      const dateStart = new Date(day);
                      dateStart.setHours(0, 0, 0, 0);
                      const dateEnd = new Date(day);
                      dateEnd.setHours(23, 59, 59, 999);
                      
                      if (resStart <= dateEnd && resEnd >= dateStart) {
                        // Calculate the actual time range for this specific day
                        let dayStartTime, dayEndTime;
                        
                        if (isSameDay(resStart, day)) {
                          // First day of reservation - use actual start time
                          dayStartTime = resStart;
                          if (!isSameDay(resStart, resEnd)) {
                            // Multi-day reservation - end at business hours (10 PM)
                            dayEndTime = new Date(day);
                            dayEndTime.setHours(22, 0, 0, 0);
                          } else {
                            // Single day reservation - use actual end time
                            dayEndTime = resEnd;
                          }
                        } else if (isSameDay(resEnd, day)) {
                          // Last day of reservation - start at business hours (8 AM)
                          dayStartTime = new Date(day);
                          dayStartTime.setHours(8, 0, 0, 0);
                          dayEndTime = resEnd;
                        } else {
                          // Middle day of multi-day reservation - full business hours
                          dayStartTime = new Date(day);
                          dayStartTime.setHours(8, 0, 0, 0);
                          dayEndTime = new Date(day);
                          dayEndTime.setHours(22, 0, 0, 0);
                        }
                        
                        // Check if the time slot overlaps with the actual reserved window for that day
                        return (dayStartTime < slotEnd && dayEndTime > slotStart);
                      }
                      
                      return false;
                    }).map(res => {
                      const resStart = new Date(res.startDate);
                      const resEnd = new Date(res.endDate);
                      
                      let dayStartTime, dayEndTime;
                      
                      if (isSameDay(resStart, day)) {
                        dayStartTime = resStart;
                        if (!isSameDay(resStart, resEnd)) {
                          dayEndTime = new Date(day);
                          dayEndTime.setHours(22, 0, 0, 0);
                        } else {
                          dayEndTime = resEnd;
                        }
                      } else if (isSameDay(resEnd, day)) {
                        dayStartTime = new Date(day);
                        dayStartTime.setHours(8, 0, 0, 0);
                        dayEndTime = resEnd;
                      } else {
                        dayStartTime = new Date(day);
                        dayStartTime.setHours(8, 0, 0, 0);
                        dayEndTime = new Date(day);
                        dayEndTime.setHours(22, 0, 0, 0);
                      }
                      
                      return {
                        ...res,
                        dayStartTime,
                        dayEndTime
                      };
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
                          ${cursorClass}
                          ${borderClass}
                          transition-colors duration-200 ease-in-out
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
                                  {/* {item.name}: {item.totalAvailable}/{item.currentQuantity} */}
                                </div>
                              ))}
                              {extraItemsCount > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowMoreItems(day, [], timeSlotEquipment);
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
                              {visibleReservations.map((res, idx) => (
                                <div
                                  key={res.reservation_id || `${res.startDate}_${res.venueName || res.vehicleMake + '_' + res.vehicleModel || ''}`}
                                  className="p-2 rounded-lg bg-rose-200 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/30"
                                >
                                  <div className="flex items-center justify-between">
                                    {/* <span className="font-medium text-rose-800 dark:text-rose-300 break-words leading-tight">
                                      {res.venueName || (res.vehicleMake ? `${res.vehicleMake} ${res.vehicleModel}` : res.equipName)}
                                    </span> */}
                                    <span className="text-xs text-rose-600 dark:text-rose-400 ml-2 flex-shrink-0">
                                      {format(res.dayStartTime, 'h:mm a')} - {format(res.dayEndTime, 'h:mm a')}
                                    </span>
                                  </div>
                                  {res.venueOccupancy && (
                                    <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                                      Capacity: {res.venueOccupancy}
                                    </div>
                                  )}
                                  {res.vehicleLicense && (
                                    <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                                      License: {res.vehicleLicense}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {extraItemsCount > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowMoreItems(day, timeSlotReservations, []);
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

                        {/* Driver availability indicator for weekly view */}
                        {selectedResource.type === 'vehicle' && (
                          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(() => {
                              const driverInfo = getDriverAvailabilityForTimeSlot(day, hour);
                              const numberOfVehicles = selectedResource.id ? selectedResource.id.length : 1;
                              const isSufficient = driverInfo.available >= numberOfVehicles;
                              return (
                                <div className={`
                                  px-1 py-0.5 rounded text-[8px] font-medium
                                  ${isSufficient 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  }
                                `}>
                                  {driverInfo.available}/{numberOfVehicles}
                                </div>
                              );
                            })()}
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
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 10 PM
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
          ${isPastDay ? 'bg-gray-100 dark:bg-gray-800/60' : ''}
          ${holidayInfo ? 'bg-violet-100 dark:bg-violet-900/40' : ''}
        `}>
          <div className="flex items-center justify-between">
            <h3 className={`
              text-lg font-semibold
              ${isToday ? 'text-blue-700 dark:text-blue-300' : ''}
              ${isPastDay ? 'text-gray-500 dark:text-gray-400' : ''}
              ${holidayInfo ? 'text-violet-700 dark:text-violet-300' : ''}
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
            const status = isPastDay ? 'past' : getTimeSlotAvailability(currentDate, hour);
            const statusStyle = availabilityStatus[status] || availabilityStatus['past'];
            
            // Check if user is COO Department Head
            const isCooDepartmentHead = userLevel === 'Department Head' && userDepartment === 'COO';
            
            // Determine cursor style based on user level and availability
            let cursorClass = '';
            if (isCooDepartmentHead) {
              // COO Department Head can always click unless it's a past hour, holiday, or past day
              if (!isPastHour && !holidayInfo && !isPastDay) {
                cursorClass = 'cursor-pointer hover:shadow-md hover:scale-[1.02] hover:z-10 transition-all duration-200';
              } else {
                cursorClass = 'cursor-not-allowed select-none';
              }
            } else {
              // Regular users get the standard availability-based cursor
              // Check if the status is 'reserved' (full day blocked) or if it's unavailable
              if (status === 'reserved' || isPastHour || holidayInfo || isPastDay) {
                cursorClass = 'cursor-not-allowed select-none';
              } else {
                cursorClass = statusStyle.hoverClass;
              }
            }
            
            // Get reservations for this hour with proper time range calculation
            const hourReservations = selectedResource.type === 'equipment' ? [] : reservations.filter(res => {
              if (!res.isReserved) return false;
              
              const resStart = new Date(res.startDate);
              const resEnd = new Date(res.endDate);
              const slotStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour);
              const slotEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour + 1);
              
              // Check if this date falls within the reservation period
              const dateStart = new Date(currentDate);
              dateStart.setHours(0, 0, 0, 0);
              const dateEnd = new Date(currentDate);
              dateEnd.setHours(23, 59, 59, 999);
              
              if (resStart <= dateEnd && resEnd >= dateStart) {
                // Calculate the actual time range for this specific day
                let dayStartTime, dayEndTime;
                
                if (isSameDay(resStart, currentDate)) {
                  // First day of reservation - use actual start time
                  dayStartTime = resStart;
                  if (!isSameDay(resStart, resEnd)) {
                    // Multi-day reservation - end at business hours (10 PM)
                    dayEndTime = new Date(currentDate);
                    dayEndTime.setHours(22, 0, 0, 0);
                  } else {
                    // Single day reservation - use actual end time
                    dayEndTime = resEnd;
                  }
                } else if (isSameDay(resEnd, currentDate)) {
                  // Last day of reservation - start at business hours (8 AM)
                  dayStartTime = new Date(currentDate);
                  dayStartTime.setHours(8, 0, 0, 0);
                  dayEndTime = resEnd;
                } else {
                  // Middle day of multi-day reservation - full business hours
                  dayStartTime = new Date(currentDate);
                  dayStartTime.setHours(8, 0, 0, 0);
                  dayEndTime = new Date(currentDate);
                  dayEndTime.setHours(22, 0, 0, 0);
                }
                
                // Check if the time slot overlaps with the actual reserved window for that day
                return (dayStartTime < slotEnd && dayEndTime > slotStart);
              }
              
              return false;
            }).map(res => {
              const resStart = new Date(res.startDate);
              const resEnd = new Date(res.endDate);
              
              let dayStartTime, dayEndTime;
              
              if (isSameDay(resStart, currentDate)) {
                dayStartTime = resStart;
                if (!isSameDay(resStart, resEnd)) {
                  dayEndTime = new Date(currentDate);
                  dayEndTime.setHours(22, 0, 0, 0);
                } else {
                  dayEndTime = resEnd;
                }
              } else if (isSameDay(resEnd, currentDate)) {
                dayStartTime = new Date(currentDate);
                dayStartTime.setHours(8, 0, 0, 0);
                dayEndTime = resEnd;
              } else {
                dayStartTime = new Date(currentDate);
                dayStartTime.setHours(8, 0, 0, 0);
                dayEndTime = new Date(currentDate);
                dayEndTime.setHours(22, 0, 0, 0);
              }
              
              return {
                ...res,
                dayStartTime,
                dayEndTime
              };
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
                  ${cursorClass}
                  transition-colors duration-200
                  ${borderClass}
                `}
                onClick={() => {
                  if (!isPastHour && !holidayInfo && !isPastDay) {
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
                      {format(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, 0, 0, 0), 'h:mm a')}
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
                          {/* <div className="flex items-center justify-between">
                            <span className="font-medium break-words leading-tight">{item.name}</span>
                            <span className="text-sm ml-2 flex-shrink-0">
                              {item.totalAvailable}/{item.currentQuantity} available
                            </span>
                          </div> */}
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
                          key={res.reservation_id || `${res.startDate}_${res.venueName || res.vehicleMake + '_' + res.vehicleModel || ''}`}
                          className="p-2 rounded-lg bg-rose-200 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/30"
                        >
                          <div className="flex items-center justify-between">
                            {/* <span className="font-medium text-rose-800 dark:text-rose-300">
                              {res.venueName || (res.vehicleMake ? `${res.vehicleMake} ${res.vehicleModel}` : res.equipName)}
                            </span> */}
                            <span className="text-xs text-rose-600 dark:text-rose-400">
                              {format(res.dayStartTime, 'h:mm a')} - {format(res.dayEndTime, 'h:mm a')}
                            </span>
                          </div>
                          {res.venueOccupancy && (
                            <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                              Capacity: {res.venueOccupancy}
                            </div>
                          )}
                          {res.vehicleLicense && (
                            <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
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

                  {/* Driver availability indicator for daily view */}
                  {selectedResource.type === 'vehicle' && (
                    <div className="mt-2">
                      {(() => {
                        const driverInfo = getDriverAvailabilityForTimeSlot(currentDate, hour);
                        const numberOfVehicles = selectedResource.id ? selectedResource.id.length : 1;
                        const isSufficient = driverInfo.available >= numberOfVehicles;
                        return (
                          <div className={`
                            px-2 py-1 rounded text-xs font-medium text-center
                            ${isSufficient 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }
                          `}>
                            Drivers: {driverInfo.available}/{numberOfVehicles} available
                          </div>
                        );
                      })()}
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
const handleTimeSelection = (isOverride = false) => {
  if (!selectedTimes.startTime || !selectedTimes.endTime) {
    return;
  }

  const startDate = new Date(dateRange.start || new Date());
  startDate.setHours(selectedTimes.startTime, selectedTimes.startMinute || 0, 0);

  // Use dateRange.end if available, otherwise use dateRange.start (for single day reservations)
  const endDate = new Date(dateRange.end || dateRange.start || new Date());
  endDate.setHours(selectedTimes.endTime, selectedTimes.endMinute || 0, 0);

  // Check for conflicts only if not overriding
  if (!isOverride) {
    const conflicts = checkConflicts(startDate, endDate);
    if (conflicts.length > 0) {
      setConflictDetails({
        attemptedBooking: {
          start: startDate,
          end: endDate
        },
        conflicts
      });
      setShowConflictModal(true);
      return;
    }
  }

  // For vehicle type, check driver availability based on selected time period only
  if (selectedResource.type === 'vehicle' && !isOverride) {
    console.log('=== VEHICLE RESERVATION - CHECKING DRIVER AVAILABILITY ===');
    console.log('Selected time period:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateLocal: startDate.toLocaleString(),
      endDateLocal: endDate.toLocaleString()
    });
    console.log('Resource type: vehicle - checking driver availability for selected time period only');
    
    // Fetch driver availability first
    fetchDriverAvailability().then(() => {
      console.log('Driver availability fetched, checking sufficiency for selected time period...');
      
      // Check if available drivers are sufficient for the number of vehicles
      const sufficiencyCheck = checkDriverSufficiency(startDate, endDate);
      
      console.log('Driver sufficiency check result:', {
        totalDrivers: driverAvailability.length,
        availableDrivers: sufficiencyCheck.availableDrivers.length,
        numberOfVehicles: sufficiencyCheck.numberOfVehicles,
        isSufficient: sufficiencyCheck.isSufficient,
        shortfall: sufficiencyCheck.shortfall,
        availableDriverNames: sufficiencyCheck.availableDrivers.map(d => [d.users_fname, d.users_mname, d.users_lname].filter(Boolean).join(' '))
      });
      
      if (sufficiencyCheck.availableDrivers.length === 0) {
        console.log(`❌ NO AVAILABLE DRIVERS: Need ${sufficiencyCheck.numberOfVehicles}, have 0 - Showing warning modal`);
        // No available drivers, show warning modal and force own drivers
        setPendingDateSelection({
          startDate,
          endDate,
          isOverride
        });
        setShowDriverWarningModal(true);
        return;
      } else if (!sufficiencyCheck.isSufficient) {
        console.log(`⚠️ PARTIAL DRIVER AVAILABILITY: Need ${sufficiencyCheck.numberOfVehicles}, have ${sufficiencyCheck.availableDrivers.length} - Showing mixed mode warning modal`);
        // Some drivers available but not enough, show warning modal for mixed mode
        setPendingDateSelection({
          startDate,
          endDate,
          isOverride
        });
        setShowDriverWarningModal(true);
        return;
      } else {
        console.log('✅ SUFFICIENT DRIVERS FOUND for selected time period - Proceeding with reservation');
        // Have sufficient drivers, proceed with selection
        onDateSelect({
          startDate,
          endDate,
          isOverride
        });
      }
    });
  } else {
    console.log('Non-vehicle resource or override mode, proceeding without driver check');
    // If we're overriding or there are no conflicts, proceed with selection
    onDateSelect({
      startDate,
      endDate,
      isOverride
    });
  }

  // Reset time selection
  setSelectedTimes({
    startTime: null,
    endTime: null,
    startMinute: null,
    endMinute: null
  });
  setDateRange({ start: null, end: null });
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
        return (attemptedStart < availEnd && attemptedEnd > availStart);
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

    // Check if date ranges overlap first
    const resStartDay = new Date(resStart);
    resStartDay.setHours(0, 0, 0, 0);
    const resEndDay = new Date(resEnd);
    resEndDay.setHours(23, 59, 59, 999);

    const attemptedStartDay = new Date(attemptedStart);
    attemptedStartDay.setHours(0, 0, 0, 0);
    const attemptedEndDay = new Date(attemptedEnd);
    attemptedEndDay.setHours(23, 59, 59, 999);

    // Check if date ranges overlap
    const datesOverlap = attemptedStartDay <= resEndDay && attemptedEndDay >= resStartDay;

    if (!datesOverlap) return false;

    // For multi-day bookings, any overlap is a conflict
    const isMultiDayAttempt = !isSameDay(attemptedStart, attemptedEnd);
    const isMultiDayExisting = !isSameDay(resStart, resEnd);

    if (isMultiDayAttempt || isMultiDayExisting) {
      // If either booking is multi-day, any date overlap is a conflict
      return true;
    }

    // For single-day bookings, check time window overlap
    const timeWindowStart = resStart.getHours();
    const timeWindowStartMinutes = resStart.getMinutes();
    const timeWindowEnd = resEnd.getHours();
    const timeWindowEndMinutes = resEnd.getMinutes();

    const attemptedTimeWindowStart = attemptedStart.getHours();
    const attemptedTimeWindowStartMinutes = attemptedStart.getMinutes();
    const attemptedTimeWindowEnd = attemptedEnd.getHours();
    const attemptedTimeWindowEndMinutes = attemptedEnd.getMinutes();

    // Check if the time windows overlap
    const timeWindowsOverlap = (
      (attemptedTimeWindowStart < timeWindowEnd || 
       (attemptedTimeWindowStart === timeWindowEnd && attemptedTimeWindowStartMinutes < timeWindowEndMinutes)) &&
      (attemptedTimeWindowEnd > timeWindowStart || 
       (attemptedTimeWindowEnd === timeWindowStart && attemptedTimeWindowEndMinutes > timeWindowStartMinutes))
    );

    return timeWindowsOverlap;
  }).map(res => ({
    ...res,
    conflictType: getConflictType(attemptedStart, attemptedEnd, new Date(res.startDate), new Date(res.endDate))
  }));
};

// Add function to check driver availability for specific time period
const checkDriverAvailabilityForTime = (startDate, endDate) => {
  if (allDriversAvailable) {
    // If all drivers are available, return a dummy array with enough drivers
    const numberOfVehicles = selectedResource.id ? selectedResource.id.length : 1;
    return Array(numberOfVehicles).fill({});
  }
  if (!driverAvailability || driverAvailability.length === 0) {
    return [];
  }
  console.log('=== CHECKING DRIVER AVAILABILITY FOR SELECTED TIME PERIOD ===');
  console.log('Time period to check:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateLocal: startDate.toLocaleString(),
    endDateLocal: endDate.toLocaleString()
  });
  console.log('Total drivers to check:', driverAvailability?.length || 0);

  const availableDrivers = driverAvailability.filter(driver => {
    console.log('Checking driver:', {
      name: [driver.users_fname, driver.users_mname, driver.users_lname].filter(Boolean).join(' '),
      reservations: driver.reservations
    });

    // If driver has no reservations, they are available
    if (!driver.reservations || driver.reservations.length === 0) {
      console.log('Driver has no reservations, available: true');
      return true;
    }

    // Check if any of the driver's reservations conflict with the selected time period
    const hasConflict = driver.reservations.some(reservation => {
      const reservationStart = new Date(reservation.reservation_start_date);
      const reservationEnd = new Date(reservation.reservation_end_date);
      
      // Check if the time periods overlap
      const timeConflict = (
        startDate < reservationEnd && 
        endDate > reservationStart
      );
      
      console.log('Reservation conflict check:', {
        reservation: reservation.reservation_title,
        reservationStart: reservationStart.toISOString(),
        reservationEnd: reservationEnd.toISOString(),
        timeConflict: timeConflict
      });
      
      return timeConflict;
    });

    // Driver is available if they have no conflicts (regardless of is_available status)
    const isAvailable = !hasConflict;
    console.log('Driver final availability:', isAvailable, 'hasConflict:', hasConflict);
    return isAvailable;
  });

  console.log('Available drivers:', availableDrivers.length);
  return availableDrivers;
};

// Add function to check if available drivers are sufficient for the number of vehicles
const checkDriverSufficiency = (startDate, endDate) => {
  if (allDriversAvailable) {
    const numberOfVehicles = selectedResource.id ? selectedResource.id.length : 1;
    return {
      availableDrivers: Array(numberOfVehicles).fill({}),
      numberOfVehicles,
      isSufficient: true,
      shortfall: 0
    };
  }
  const availableDrivers = checkDriverAvailabilityForTime(startDate, endDate);
  const numberOfVehicles = selectedResource.id ? selectedResource.id.length : 1;
  
  console.log('Driver sufficiency check:', {
    availableDrivers: availableDrivers.length,
    numberOfVehicles: numberOfVehicles,
    isSufficient: availableDrivers.length >= numberOfVehicles
  });
  
  return {
    availableDrivers: availableDrivers,
    numberOfVehicles: numberOfVehicles,
    isSufficient: availableDrivers.length >= numberOfVehicles,
    shortfall: Math.max(0, numberOfVehicles - availableDrivers.length)
  };
};



// Add function to get driver availability for a specific date
const getDriverAvailabilityForDate = (date) => {
  if (allDriversAvailable) {
    const numberOfVehicles = selectedResource.id ? selectedResource.id.length : 1;
    return {
      available: numberOfVehicles,
      total: numberOfVehicles,
      drivers: Array(numberOfVehicles).fill({}),
      isSufficient: true,
      shortfall: 0,
      numberOfVehicles
    };
  }
  if (!driverAvailability || driverAvailability.length === 0) {
    return { available: 0, total: 0, drivers: [], isSufficient: false, shortfall: 0 };
  }

  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const availableDrivers = driverAvailability.filter(driver => {
    // If driver has no reservations, they are available
    if (!driver.reservations || driver.reservations.length === 0) {
      return true;
    }

    // Check if any of the driver's reservations conflict with this date
    const hasConflict = driver.reservations.some(reservation => {
      const reservationStart = new Date(reservation.reservation_start_date);
      const reservationEnd = new Date(reservation.reservation_end_date);
      
      // Check if the date falls within the reservation period
      return (reservationStart <= dateEnd && reservationEnd >= dateStart);
    });

    return !hasConflict;
  });

  const numberOfVehicles = selectedResource.id ? selectedResource.id.length : 1;
  const isSufficient = availableDrivers.length >= numberOfVehicles;
  const shortfall = Math.max(0, numberOfVehicles - availableDrivers.length);

  return {
    available: availableDrivers.length,
    total: driverAvailability.length,
    drivers: availableDrivers,
    isSufficient: isSufficient,
    shortfall: shortfall,
    numberOfVehicles: numberOfVehicles
  };
};

// Add function to get driver availability for a specific time slot
const getDriverAvailabilityForTimeSlot = (date, hour) => {
  if (allDriversAvailable) {
    const numberOfVehicles = selectedResource.id ? selectedResource.id.length : 1;
    return {
      available: numberOfVehicles,
      total: numberOfVehicles,
      drivers: Array(numberOfVehicles).fill({})
    };
  }
  if (!driverAvailability || driverAvailability.length === 0) {
    return { available: 0, total: 0, drivers: [] };
  }

  const slotStart = new Date(date);
  slotStart.setHours(hour, 0, 0, 0);
  const slotEnd = new Date(date);
  slotEnd.setHours(hour + 1, 0, 0, 0);

  const availableDrivers = driverAvailability.filter(driver => {
    // If driver has no reservations, they are available
    if (!driver.reservations || driver.reservations.length === 0) {
      return true;
    }

    // Check if any of the driver's reservations conflict with this time slot
    const hasConflict = driver.reservations.some(reservation => {
      const reservationStart = new Date(reservation.reservation_start_date);
      const reservationEnd = new Date(reservation.reservation_end_date);
      
      // Check if the time slot overlaps with the reservation
      return (slotStart < reservationEnd && slotEnd > reservationStart);
    });

    return !hasConflict;
  });

  return {
    available: availableDrivers.length,
    total: driverAvailability.length,
    drivers: availableDrivers
  };
};

  // Add this function to check if user can override
  const canOverrideReservation = () => {
    return userLevel === 'Department Head' && userDepartment === 'COO';
  };

  // Update the renderConflictModal function
  const renderConflictModal = () => (
  <Dialog
    open={showConflictModal}
    onClose={() => setShowConflictModal(false)}
    className="relative z-50"
  >
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
      <Dialog.Panel className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white dark:bg-gray-800 p-4 shadow-xl border border-gray-200 dark:border-gray-700/30">
        {/* Close button */}
        <button
          onClick={() => setShowConflictModal(false)}
          className="absolute right-2 top-2 rounded-lg p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-shrink-0 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-red-600 dark:text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
            </svg>
          </div>
          <div>
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              Scheduling Conflict
            </Dialog.Title>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The selected time conflicts with existing reservations
            </p>
          </div>
        </div>

        {conflictDetails && (
          <div className="space-y-3">
            {/* Your booking */}
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <p className="mb-1 text-xs font-medium text-red-800 dark:text-red-200">Your booking:</p>
              <div className="text-xs text-red-700 dark:text-red-300">
                {(() => {
                  const start = dayjs(conflictDetails.attemptedBooking.start).tz('Asia/Manila');
                  const end = dayjs(conflictDetails.attemptedBooking.end).tz('Asia/Manila');
                  if (start.isSame(end, 'day')) {
                    return `${start.format('MMM D, YYYY h:mm A')} - ${end.format('h:mm A')}`;
                  } else {
                    return `${start.format('MMM D, YYYY h:mm A')} - ${end.format('MMM D, YYYY h:mm A')}`;
                  }
                })()}
              </div>
            </div>

            {/* Override message */}
            {canOverrideReservation() && (
              <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <span className="font-medium">Note:</span> As COO Department Head, you can override this conflict.
                </p>
              </div>
            )}

            {/* Existing reservations */}
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
              <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                Conflicts with:
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {conflictDetails.conflicts.map((conflict, index) => {
                  const startDate = dayjs(conflict.startDate).tz('Asia/Manila');
                  const endDate = dayjs(conflict.endDate).tz('Asia/Manila');
                  let resourceName = '';
                  if (conflict.venueName) resourceName = conflict.venueName;
                  else if (conflict.vehicleMake) resourceName = `${conflict.vehicleMake} ${conflict.vehicleModel}`;
                  else if (conflict.equipmentName) resourceName = conflict.equipmentName;
                  
                  return (
                    <div key={index} className="text-xs text-amber-700 dark:text-amber-300 p-2 bg-white/50 dark:bg-gray-700/50 rounded border border-amber-100 dark:border-amber-800/30">
                      <div className="font-medium break-words leading-tight">
                        {resourceName}
                        {conflict.venueOccupancy && (
                          <span className="ml-1 text-gray-500 dark:text-gray-400">(Capacity: {conflict.venueOccupancy})</span>
                        )}
                        {conflict.vehicleLicense && (
                          <span className="ml-1 text-gray-500 dark:text-gray-400">(License: {conflict.vehicleLicense})</span>
                        )}
                      </div>
                      <div className="mt-1">
                        {startDate.format('MMM D, h:mm A')} - {endDate.format('MMM D, h:mm A')}
                      </div>
                      {conflict.title && (
                        <div className="text-gray-500 dark:text-gray-400 mt-1">Title: {conflict.title}</div>
                      )}
                      {conflict.requested && (
                        <div className="text-gray-500 dark:text-gray-400">Requested: {conflict.requested}</div>
                      )}
                      {conflict.available !== undefined && (
                        <div className="text-gray-500 dark:text-gray-400">Available: {conflict.available}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {canOverrideReservation() && (
            <button
              type="button"
              className="flex-1 rounded-lg bg-yellow-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-yellow-600"
              onClick={() => {
                if (conflictDetails && conflictDetails.attemptedBooking) {
                  const startDate = new Date(conflictDetails.attemptedBooking.start);
                  const endDate = new Date(conflictDetails.attemptedBooking.end);
                  
                  setDateRange({
                    start: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
                    end: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                  });
                  
                  setSelectedTimes({
                    startTime: startDate.getHours(),
                    startMinute: startDate.getMinutes(),
                    endTime: endDate.getHours(),
                    endMinute: endDate.getMinutes()
                  });
                }
                
                setShowConflictModal(false);
                setTimeout(() => {
                  handleTimeSelection(true);
                }, 0);
              }}
            >
              Override
            </button>
          )}
          <button
            type="button"
            className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-600"
            onClick={() => {
              setShowConflictModal(false);
              setSelectedTimes({
                startTime: null,
                endTime: null,
                startMinute: null,
                endMinute: null
              });
              setDateRange({ start: null, end: null });
            }}
          >
            Choose Another Time
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>
);

  // Update the RangePicker in renderEnhancedDateTimeSelection
  
  // const getBusinessHoursStatus = (date) => {
  //   const now = new Date();
  //   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  //   const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
  //   if (compareDate < today) return 'past';
  //   if (compareDate.getTime() === today.getTime()) {
  //     const currentHour = now.getHours();
  //     if (currentHour >= 19) return 'past'; // After business hours
  //     if (currentHour < 5) return 'upcoming'; // Before business hours
  //     return 'current';
  //   }
  //   return 'upcoming';
  // };
  // Update renderAvailabilityLegend to include driver availability
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

      {/* Driver availability legend - only show for vehicle resources */}
      {selectedResource.type === 'vehicle' && (
        <>
          <div className="border-l border-gray-300 dark:border-gray-600 h-4 mx-1"></div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
            <span className="text-green-700 dark:text-green-300">Drivers Available</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
            <span className="text-red-700 dark:text-red-300">Insufficient Drivers</span>
          </div>
        </>
      )}
    </div>
  );

  // Add this new function to handle day clicks
  // const handleDayClick = (day) => {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const compareDate = new Date(day);
  //   compareDate.setHours(0, 0, 0, 0);
    
  //   // Only prevent dates before today (midnight)
  //   if (compareDate < today) {
  //     toast.error('Cannot select past dates');
  //     return;
  //   }
  
  //   const status = getAvailabilityStatus(day, reservations);
  //   const holidayInfo = holidays.find(h => h.date === day.toISOString().split('T')[0]);
  
  //   if (status === 'full') {
  //     toast.error('This date is already fully reserved');
  //     return;
  //   }
    
  //   if (holidayInfo) {
  //     toast.error(`Reservations not allowed on ${holidayInfo.name}`);
  //     return;
  //   }
  
  //   // Set only start date and open modal directly
  //   setDateRange({ start: day, end: null });
  //   setEndDate(date);
  //   setIsDatePickerModalOpen(true);
  //   setSelectionMode('full');
  // };

  // Add new handler for weekly/daily time slot clicks
  const handleTimeSlotClick = (day, hour) => {
   
    const selectedDateTime = new Date(day);
    selectedDateTime.setHours(hour, 0, 0, 0);
    const minSelectableDate = getMinSelectableDate();

    // Check if the selected time is before min selectable date
    if (selectedDateTime < minSelectableDate) {
      toast.error('You must book at least 1 week in advance');
      return;
    }
  
    // Check if it's a holiday
    if (holidays.some(holiday => format(day, 'yyyy-MM-dd') === holiday.date)) {
      toast.error('Cannot select holiday dates');
      return;
    }
  
    // For Department Head from COO, allow selecting any time slot
    const isDepartmentHeadCOO = userLevel === 'Department Head' && userDepartment === 'COO';
  
    // Check for existing reservations only if not Department Head from COO
    if (!isDepartmentHeadCOO) {
      const status = getTimeSlotAvailability(day, hour);
      if (status === 'reserved' || status === 'partial') {
        toast.error('This time slot is already reserved');
        return;
      }
    }
  
    // Set the date range and open the modal
    setDateRange({ start: day, end: day });
    setSelectedTimes({
      startTime: hour,
      endTime: null,
      startMinute: 0,
      endMinute: null
    });
    setIsDatePickerModalOpen(true);
  };

  // Add this new function to render the date range modal
  // const renderDateRangeModal = () => {
  //   // Get blocked time slots for the entire date range
  //   const getBlockedTimeSlotsForRange = (startDate, endDate) => {
  //     const blockedSlots = {
  //       hours: [],
  //       minutes: {}
  //     };

  //     if (!startDate) return blockedSlots;

  //     // If no end date, just check start date
  //     const endDateToCheck = endDate || startDate;
      
  //     // Generate all dates in the range
  //     const datesToCheck = [];
  //     const currentDate = new Date(startDate);
  //     const endDateObj = new Date(endDateToCheck);
      
  //     while (currentDate <= endDateObj) {
  //       datesToCheck.push(new Date(currentDate));
  //       currentDate.setDate(currentDate.getDate() + 1);
  //     }

  //     // Check each date in the range
  //     datesToCheck.forEach(date => {
  //       const dateBlockedSlots = getBlockedTimeSlots(date);
  //       blockedSlots.hours.push(...dateBlockedSlots.hours);
        
  //       // Merge minutes
  //       Object.keys(dateBlockedSlots.minutes).forEach(hour => {
  //         if (!blockedSlots.minutes[hour]) {
  //           blockedSlots.minutes[hour] = [];
  //         }
  //         blockedSlots.minutes[hour].push(...dateBlockedSlots.minutes[hour]);
  //       });
  //     });

  //     // Remove duplicates
  //     blockedSlots.hours = [...new Set(blockedSlots.hours)];
  //     Object.keys(blockedSlots.minutes).forEach(hour => {
  //       blockedSlots.minutes[hour] = [...new Set(blockedSlots.minutes[hour])];
  //     });

  //     return blockedSlots;
  //   };

  //   const blockedSlots = getBlockedTimeSlotsForRange(dateRange.start, dateRange.end);
  //   const now = new Date();
  //   const isToday = dateRange.start && isSameDay(dateRange.start, now);
  //   const currentHour = now.getHours();
  //   const currentMinute = now.getMinutes();

  //   // Debug logging
  //   console.log('Date Range:', dateRange);
  //   console.log('Blocked Slots:', blockedSlots);
  //   console.log('Reservations:', reservations);

  //   // Clear times when dates change
  //   const handleDateChange = (newEndDate) => {
  //     setDateRange({ ...dateRange, end: newEndDate });
  //     // Clear times when date range changes
  //     setSelectedTimes({
  //       startTime: null,
  //       endTime: null,
  //       startMinute: null,
  //       endMinute: null
  //     });
  //   };

  //   return (
  //     <Dialog
  //       open={isDatePickerModalOpen}
  //       onClose={() => setIsDatePickerModalOpen(false)}
  //       className="relative z-50"
  //     >
  //       <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

  //       <div className="fixed inset-0 flex items-center justify-center p-4">
  //         <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
  //           <Dialog.Title className="text-lg font-medium mb-4">
  //             Select Date and Time Range
  //           </Dialog.Title>

  //           <div className="space-y-4">
  //             <div className="mb-4">
  //               <p className="text-sm text-gray-600">Start Date:</p>
  //               <p className="font-medium">{dayjs(dateRange.start).format('MMMM D, YYYY')}</p>
  //               {dateRange.end && (
  //                 <>
  //                   <p className="text-sm text-gray-600 mt-2">End Date:</p>
  //                   <p className="font-medium">{dayjs(dateRange.end).format('MMMM D, YYYY')}</p>
  //                 </>
  //               )}
  //               {blockedSlots.hours.length > 0 && (
  //                 <div className="text-xs text-rose-600 mt-1 p-2 bg-rose-50 rounded border border-rose-200">
  //                   <div className="flex items-center mb-1">
  //                     <span className="mr-1">⚠️</span>
                  
  //                   </div>
                  
  //                 </div>
  //               )}
  //             </div>
              
  //             <div>
  //               <label className="block text-sm mb-2">Start Time</label>
  //               <TimePicker
  //                 className="w-full"
  //                 format="HH:mm"
  //                 minuteStep={30}
  //                 placeholder="Select start time"
  //                 value={selectedTimes.startTime !== null ? 
  //                   dayjs().hour(selectedTimes.startTime).minute(selectedTimes.startMinute || 0) : 
  //                   null
  //                 }
  //                 disabledTime={() => ({
  //                   disabledHours: () => {
  //                     // Always disable hours outside business hours (before 5am or after 7pm)
  //                     const baseDisabled = [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 19);
                      
  //                     // Add blocked hours from existing reservations
  //                     baseDisabled.push(...blockedSlots.hours);
                      
  //                     // If it's today, disable hours before current hour
  //                     if (isToday) {
  //                       for (let h = 5; h < currentHour; h++) {
  //                         baseDisabled.push(h);
  //                       }
  //                     }
                      
  //                     const result = [...new Set(baseDisabled)]; // Remove duplicates
  //                     console.log('Disabled hours for start time:', result);
  //                     return result;
  //                   },
  //                   disabledMinutes: (selectedHour) => {
  //                     const disabledMinutes = [];
                      
  //                     // Add blocked minutes from existing reservations
  //                     if (blockedSlots.minutes[selectedHour]) {
  //                       disabledMinutes.push(...blockedSlots.minutes[selectedHour]);
  //                     }
                      
  //                     // If today and selecting current hour, disable minutes before current minute
  //                     if (isToday && selectedHour === currentHour) {
  //                       for (let m = 0; m < currentMinute; m++) {
  //                         disabledMinutes.push(m);
  //                       }
  //                     }
                      
  //                     const result = [...new Set(disabledMinutes)]; // Remove duplicates
  //                     console.log(`Disabled minutes for hour ${selectedHour}:`, result);
  //                     return result;
  //                   }
  //                 })}
  //                 onChange={(time) => {
  //                   if (time) {
  //                     setSelectedTimes(prev => ({
  //                       ...prev,
  //                       startTime: time.hour(),
  //                       startMinute: time.minute()
  //                     }));
  //                   } else {
  //                     setSelectedTimes(prev => ({
  //                       ...prev,
  //                       startTime: null,
  //                       startMinute: null
  //                     }));
  //                   }
  //                 }}
  //               />
  //             </div>

  //             <div>
  //               <label className="block text-sm mb-2">End Time</label>
  //               <TimePicker
  //                 className="w-full"
  //                 format="HH:mm"
  //                 minuteStep={30}
  //                 placeholder="Select end time"
  //                 value={selectedTimes.endTime !== null ? 
  //                   dayjs().hour(selectedTimes.endTime).minute(selectedTimes.endMinute || 0) : 
  //                   null
  //                 }
  //                 disabledTime={() => ({
  //                   disabledHours: () => {
  //                     const baseDisabled = [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 20);
                      
  //                     // Add blocked hours from existing reservations
  //                     baseDisabled.push(...blockedSlots.hours);
                      
  //                     // If start time is selected, disable all hours before and including start hour
  //                     if (selectedTimes.startTime !== null) {
  //                       for (let h = 8; h <= selectedTimes.startTime; h++) {
  //                         baseDisabled.push(h);
  //                       }
  //                     }
                      
  //                     const result = [...new Set(baseDisabled)]; // Remove duplicates
  //                     console.log('Disabled hours for end time:', result);
  //                     return result;
  //                   },
  //                   disabledMinutes: (selectedHour) => {
  //                     const disabledMinutes = [];
                      
  //                     // Add blocked minutes from existing reservations
  //                     if (blockedSlots.minutes[selectedHour]) {
  //                       disabledMinutes.push(...blockedSlots.minutes[selectedHour]);
  //                     }
                      
  //                     // If same hour as start time, disable minutes <= start minute
  //                     if (selectedTimes.startTime !== null && selectedHour === selectedTimes.startTime) {
  //                       for (let m = 0; m <= (selectedTimes.startMinute || 0); m++) {
  //                         disabledMinutes.push(m);
  //                       }
  //                     }
                      
  //                     const result = [...new Set(disabledMinutes)]; // Remove duplicates
  //                     console.log(`Disabled minutes for end time hour ${selectedHour}:`, result);
  //                     return result;
  //                   }
  //                 })}
  //                 onChange={(time) => {
  //                   if (time) {
  //                     setSelectedTimes(prev => ({
  //                       ...prev,
  //                       endTime: time.hour(),
  //                       endMinute: time.minute()
  //                     }));
  //                   } else {
  //                     setSelectedTimes(prev => ({
  //                       ...prev,
  //                       endTime: null,
  //                       endMinute: null
  //                     }));
  //                   }
  //                 }}
  //               />
  //             </div>
  //           </div>

  //           <div className="mt-6 flex justify-end space-x-3">
  //             <button
  //               className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
  //               onClick={() => setIsDatePickerModalOpen(false)}
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  //               onClick={() => {
  //                 if (!selectedTimes.startTime || !selectedTimes.endTime) {
  //                   toast.error('Please select both start and end times');
  //                   return;
  //                 }

  //                 // Only check blocked times if not Department Head from COO
  //                 const isDepartmentHeadCOO = userLevel === 'Department Head' && userDepartment === 'COO';
  //                 if (!isDepartmentHeadCOO) {
  //                   // Check if selected times are blocked
  //                   const startTimeBlocked = blockedSlots.hours.includes(selectedTimes.startTime);
  //                   const endTimeBlocked = blockedSlots.hours.includes(selectedTimes.endTime);
                    
  //                   if (startTimeBlocked || endTimeBlocked) {
  //                     toast.error('Selected time slots are blocked due to existing reservations. Please choose different times.');
  //                     return;
  //                   }
  //                 }

  //                 const startDateTime = dayjs(dateRange.start)
  //                   .hour(selectedTimes.startTime)
  //                   .minute(selectedTimes.startMinute || 0)
  //                   .toDate();

  //                 const endDateTime = dayjs(dateRange.end || dateRange.start)
  //                   .hour(selectedTimes.endTime)
  //                   .minute(selectedTimes.endMinute || 0)
  //                   .toDate();

  //                 if (endDateTime <= startDateTime) {
  //                   toast.error('End time must be after start time');
  //                   return;
  //                 }

  //                 const conflicts = checkTimeSlotConflicts(startDateTime, endDateTime, reservations);
                  
  //                 if (conflicts.length > 0) {
  //                   setConflictDetails({
  //                     conflicts,
  //                     attemptedBooking: {
  //                       start: dayjs(startDateTime).format('MMM DD, YYYY h:mm a'),
//                       end: dayjs(endDateTime).format('MMM DD, YYYY h:mm a')
  //                     }
  //                   });
  //                   setShowConflictModal(true);
  //                   return;
  //                 }

  //                 onDateSelect(startDateTime, endDateTime);
  //                 setIsDatePickerModalOpen(false);
  //               }}
  //             >
  //               Confirm
  //             </button>
  //           </div>
  //         </Dialog.Panel>
  //       </div>
  //     </Dialog>
  //   );
  // };

  // Add this new date-time selection modal component
  const renderDateTimeSelectionModal = () => {
  // Get current time for validation
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isToday = dateRange.start && isSameDay(dateRange.start, now);
  const blockedSlots = dateRange.start ? getBlockedTimeSlotsForRange(dateRange.start, dateRange.end) : { hours: [], minutes: {} };
  
  const mustSelectEndDate = !dateRange.end && dateRange.start;
  let hasRangeConflict = false;
  let allHoursBlocked = false;
  let disableReason = '';
  
  if (dateRange.start && dateRange.end) {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    // Check if there are any existing reservations that completely block the selected range
    if (selectedResource.type !== 'equipment' && reservations.length > 0) {
      const hasCompleteConflict = reservations.some(res => {
        if (!res.isReserved) return false;
        
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        
        // Check if the existing reservation completely overlaps with the selected date range
        const rangeStart = new Date(start);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(end);
        rangeEnd.setHours(23, 59, 59, 999);
        
        // Check if the existing reservation completely covers the selected range
        return (resStart <= rangeStart && resEnd >= rangeEnd);
      });
      
      if (hasCompleteConflict) {
        hasRangeConflict = true;
        disableReason = 'Existing reservations conflict with selected date range';
      }
    }
    
    // For equipment, check if there's insufficient availability for the entire range
    if (selectedResource.type === 'equipment' && equipmentAvailability.length > 0) {
      const hasCompleteConflict = equipmentAvailability.some(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        
        // Check if the equipment reservation completely overlaps with the selected date range
        const rangeStart = new Date(start);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(end);
        rangeEnd.setHours(23, 59, 59, 999);
        
        if (itemStart <= rangeStart && itemEnd >= rangeEnd) {
          // Check if there's insufficient availability for the entire range
          const available = parseInt(item.totalAvailable);
          const requested = parseInt(item.requestedQuantity);
          return available < requested;
        }
        
        return false;
      });
      
      if (hasCompleteConflict) {
        hasRangeConflict = true;
        disableReason = 'Insufficient equipment availability for selected date range';
      }
    }
    
    // Check if all business hours are blocked
    const businessHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const availableHours = businessHours.filter(hour => !blockedSlots.hours.includes(hour));
    allHoursBlocked = availableHours.length === 0;
    
    if (allHoursBlocked) {
      disableReason = 'All business hours are blocked for the selected date range';
    }
  }

  const handleCloseModal = () => {
    setIsDatePickerModalOpen(false);
    setDateRange({ start: null, end: null });
    setSelectedTimes({
      startTime: null,
      endTime: null,
      startMinute: null,
      endMinute: null
    });
  };

  if (!dateRange.start) {
    return null;
  }

  // Time Presets
  const presetsEnabled = !!dateRange.start && !!dateRange.end;
  const presetConfigs = [
    { label: 'Morning', startHour: 8, endHour: 12 },
    { label: 'Afternoon', startHour: 13, endHour: 17 },
    { label: 'Full Day', startHour: 8, endHour: 22 },
  ];

  const getPresetDisabled = (preset) => {
    if (!presetsEnabled) return true;
    if (allHoursBlocked) return true;
    
    const blockedSlots = getBlockedTimeSlotsForRange(dateRange.start, dateRange.end);
    
    for (let hour = preset.startHour; hour <= preset.endHour; hour++) {
      if (blockedSlots.hours.includes(hour)) {
        return true;
      }
    }
    
    return false;
  };

  const presetButtons = presetConfigs.map(preset => {
    const disabled = getPresetDisabled(preset);
    return {
      ...preset,
      disabled,
      onClick: () => {
        setSelectedTimes({
          startTime: preset.startHour,
          startMinute: 0,
          endTime: preset.endHour,
          endMinute: 0
        });
      }
    };
  });

  // Check if all hours are disabled for start time
  const startTimeDisabledHours = (() => {
    // Only allow 8am to 4pm (start time cannot be 5pm or later)
    const baseDisabled = [...Array(24)].map((_, i) => i).filter(h => h < 8 || h > 16);
    if (blockedSlots && blockedSlots.hours) {
      blockedSlots.hours.forEach(h => {
        if (!baseDisabled.includes(h) && h >= 8 && h <= 16) baseDisabled.push(h);
      });
    }
    if (isToday) {
      for (let h = 8; h < Math.max(currentHour, 8); h++) {
        if (h <= 16 && !baseDisabled.includes(h)) {
          baseDisabled.push(h);
        }
      }
    }
    return [...new Set(baseDisabled)].sort((a,b)=>a-b);
  })();

  // Check if all hours are disabled for end time
  const endTimeDisabledHours = (() => {
    // Allow end time up to 10pm (22:00)
    const baseDisabled = [...Array(24)].map((_, i) => i).filter(h => h < 9 || h > 22);
    if (blockedSlots && blockedSlots.hours) {
      blockedSlots.hours.forEach(h => {
        if (!baseDisabled.includes(h) && h >= 9 && h <= 22) baseDisabled.push(h);
      });
    }
    if (isToday) {
      for (let h = 9; h < Math.max(currentHour+1, 9); h++) {
        if (h <= 22 && !baseDisabled.includes(h)) {
          baseDisabled.push(h);
        }
      }
    }
    if (selectedTimes.startTime !== null) {
      for (let h = 9; h <= selectedTimes.startTime; h++) {
        if (!baseDisabled.includes(h)) baseDisabled.push(h);
      }
    }
    return [...new Set(baseDisabled)].sort((a,b)=>a-b);
  })();

  const allStartHoursDisabled = startTimeDisabledHours.length === 24;
  const allEndHoursDisabled = endTimeDisabledHours.length === 24;

  return (
    <Dialog
      open={isDatePickerModalOpen}
      onClose={handleCloseModal}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-4">
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
          
          <div className="space-y-4">
            {/* Selected Date Display */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <label className="block text-xs sm:text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">
                Selected Date
              </label>
              <div className="text-sm sm:text-base font-medium text-blue-800 dark:text-blue-200">
                {dayjs(dateRange.start).format('ddd, MMM D, YYYY')}
                {dateRange.end && ` - ${dayjs(dateRange.end).format('ddd, MMM D, YYYY')}`}
              </div>
              <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 011-2 0 1 1-2 0 1 1 012 0zM9 9a1 1 000 2v3a1 1 001 1h1a1 1 100-2v-3a1 1 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Business hours: 8AM - 5PM
              </div>
              {isToday && (
                <div className="mt-1 text-xs text-blue-700 dark:text-blue-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Current time: {format(now, 'h:mm a')}
                </div>
              )}
              {hasRangeConflict && (
                <div className="mt-2 p-2 bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded text-xs font-medium">
                  {disableReason}
                </div>
              )}
              {allHoursBlocked && (
                <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>{disableReason}</span>
                  </div>
                </div>
              )}
            </div>

            {/* End Date Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <DatePicker
                className="w-full text-xs sm:text-sm"
                value={dateRange.end ? dayjs(dateRange.end) : null}
                onChange={(date) => setDateRange({ ...dateRange, end: date ? date.toDate() : null })}
                disabledDate={(current) => {
                  const formattedDate = current.format('YYYY-MM-DD');
                  if (holidays.some(holiday => holiday.date === formattedDate)) {
                    return true;
                  }
                  
                  // Check if date is before start date or today
                  if (current < dayjs(dateRange.start).startOf('day') ||
                      current < dayjs().startOf('day')) {
                    return true;
                  }
                  
               
                  
                  // Check if the date has full-day reservations (for non-COO users)
                  if (userLevel !== 'Department Head' || userDepartment !== 'COO') {
                    const currentDate = current.toDate();
                    const status = getAvailabilityStatus(currentDate, reservations);
                    if (status === 'reserved') {
                      return true;
                    }
                  }
                  
                  return false;
                }}
                inputReadOnly={true}
                size="small"
              />
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1 ${allStartHoursDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  Start Time
                </label>
                <TimePicker
                  className="w-full text-xs sm:text-sm"
                  format="h:mm a"
                  minuteStep={60}
                  hourStep={1}
                  showNow={false}
                  hideDisabledOptions={false}
                  use12Hours={true}
                  popupClassName="text-xs sm:text-sm"
                  value={selectedTimes.startTime ? 
                    dayjs().hour(selectedTimes.startTime).minute(0) : 
                    null
                  }
                  disabled={hasRangeConflict || mustSelectEndDate || allStartHoursDisabled}
                  disabledTime={() => {
                    return {
                      disabledHours: () => startTimeDisabledHours,
                      disabledMinutes: (selectedHour) => {
                        const disabledMinutes = [];
                        if (blockedSlots.minutes[selectedHour]) {
                          disabledMinutes.push(...blockedSlots.minutes[selectedHour]);
                        }
                        if (isToday && selectedHour === currentHour) {
                          for (let m = 0; m < currentMinute; m++) {
                            disabledMinutes.push(m);
                          }
                        }
                        return [...new Set(disabledMinutes)];
                      }
                    };
                  }}
                  onChange={(time) => {
                    if (time) {
                      setSelectedTimes(prev => ({
                        ...prev,
                        startTime: time.hour(),
                        startMinute: 0
                      }));
                    }
                  }}
                  placeholder={allStartHoursDisabled ? "No available times" : "Start time"}
                  inputReadOnly={true}
                  size="small"
                />
    
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1 ${allEndHoursDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  End Time
                </label>
                <TimePicker
                  className="w-full text-xs sm:text-sm"
                  format="h:mm a"
                  minuteStep={60}
                  hourStep={1}
                  hideDisabledOptions={false}
                  use12Hours={true}
                  popupClassName="text-xs sm:text-sm"
                  value={selectedTimes.endTime ? 
                    dayjs().hour(selectedTimes.endTime).minute(0) : 
                    null
                  }
                  disabled={hasRangeConflict || mustSelectEndDate || allEndHoursDisabled}
                  disabledTime={() => {
                    return {
                      disabledHours: () => endTimeDisabledHours,
                      disabledMinutes: (selectedHour) => {
                        const disabledMinutes = [];
                        if (blockedSlots.minutes[selectedHour]) {
                          disabledMinutes.push(...blockedSlots.minutes[selectedHour]);
                        }
                        if (selectedTimes.startTime !== null && selectedHour === selectedTimes.startTime) {
                          for (let m = 0; m <= (selectedTimes.startMinute || 0); m++) {
                            disabledMinutes.push(m);
                          }
                        }
                        return [...new Set(disabledMinutes)];
                      }
                    };
                  }}
                  onChange={(time) => {
                    if (time) {
                      setSelectedTimes(prev => ({
                        ...prev,
                        endTime: time.hour(),
                        endMinute: 0
                      }));
                    }
                  }}
                  placeholder={allEndHoursDisabled ? "No available times" : "End time"}
                  inputReadOnly={true}
                  size="small"
                />

              </div>
            </div>

            {/* Time Presets */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${allHoursBlocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                Quick Time Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presetButtons.map(preset => (
                  <button
                    key={preset.label}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors border shadow-sm
                      ${preset.disabled 
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600' 
                        : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                      }`}
                    disabled={preset.disabled}
                    onClick={preset.onClick}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {!presetsEnabled && (
                <div className="text-[10px] text-gray-400 mt-1">Select both dates to enable presets</div>
              )}

            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                       hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
              onClick={handleCloseModal}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-blue-500 
                       hover:bg-blue-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (!dateRange.start) {
                  toast.error('Please select a start date');
                  return;
                }
                if (!selectedTimes.startTime || !selectedTimes.endTime) {
                  toast.error('Please select both start and end times');
                  return;
                }
                const startDateTime = dayjs(dateRange.start)
                  .hour(selectedTimes.startTime)
                  .minute(0)
                  .toDate();
                const endDateTime = dayjs(dateRange.end || dateRange.start)
                  .hour(selectedTimes.endTime)
                  .minute(0)
                  .toDate();
                if (endDateTime <= startDateTime) {
                  toast.error('End time must be after start time');
                  return;
                }
                const conflicts = checkConflicts(startDateTime, endDateTime);
                if (conflicts.length > 0 || hasRangeConflict) {
                  setConflictDetails({
                    conflicts,
                    attemptedBooking: {
                      start: startDateTime,
                      end: endDateTime
                    }
                  });
                  setShowConflictModal(true);
                  return;
                }
                
                // For vehicle type, check driver availability based on selected time period only
                if (selectedResource.type === 'vehicle') {
                  console.log('=== DATE-TIME MODAL - VEHICLE RESERVATION ===');
                  console.log('Selected time period from modal:', {
                    startDateTime: startDateTime.toISOString(),
                    endDateTime: endDateTime.toISOString(),
                    startDateTimeLocal: startDateTime.toLocaleString(),
                    endDateTimeLocal: endDateTime.toLocaleString()
                  });
                  console.log('Resource type: vehicle - checking driver availability for selected time period only');
                  
                  fetchDriverAvailability().then(() => {
                    console.log('Driver availability fetched from modal, checking sufficiency for selected time period...');
                    
                    // Check if available drivers are sufficient for the number of vehicles
                    const sufficiencyCheck = checkDriverSufficiency(startDateTime, endDateTime);
                    
                    console.log('Modal driver sufficiency check result:', {
                      totalDrivers: driverAvailability.length,
                      availableDrivers: sufficiencyCheck.availableDrivers.length,
                      numberOfVehicles: sufficiencyCheck.numberOfVehicles,
                      isSufficient: sufficiencyCheck.isSufficient,
                      shortfall: sufficiencyCheck.shortfall,
                      availableDriverNames: sufficiencyCheck.availableDrivers.map(d => [d.users_fname, d.users_mname, d.users_lname].filter(Boolean).join(' '))
                    });
                    
                    if (!sufficiencyCheck.isSufficient) {
                      console.log(`❌ MODAL: INSUFFICIENT DRIVERS: Need ${sufficiencyCheck.numberOfVehicles}, have ${sufficiencyCheck.availableDrivers.length} - Showing warning modal`);
                      // Insufficient drivers, show warning modal
                      setPendingDateSelection({
                        startDate: startDateTime,
                        endDate: endDateTime,
                        isOverride: false
                      });
                      setShowDriverWarningModal(true);
                      setIsDatePickerModalOpen(false);
                      return;
                    } else {
                      console.log('✅ MODAL: SUFFICIENT DRIVERS FOUND for selected time period - Proceeding with reservation');
                      // Have sufficient drivers, proceed
                      onDateSelect(startDateTime, endDateTime);
                      setIsDatePickerModalOpen(false);
                    }
                  });
                } else {
                  console.log('Non-vehicle resource, proceeding without driver check from modal');
                  // For non-vehicle types, proceed normally
                  onDateSelect(startDateTime, endDateTime);
                  setIsDatePickerModalOpen(false);
                }
              }}
              disabled={!dateRange.start || !selectedTimes.startTime || !selectedTimes.endTime || hasRangeConflict || mustSelectEndDate || allHoursBlocked}
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

  // Add this new function to render the driver warning modal
  const renderDriverWarningModal = () => {
    // Check driver sufficiency for the pending selection
    const sufficiencyCheck = pendingDateSelection ? checkDriverSufficiency(pendingDateSelection.startDate, pendingDateSelection.endDate) : null;
    const hasAvailableDrivers = sufficiencyCheck && sufficiencyCheck.availableDrivers.length > 0;
   
    
    return (
    <Dialog
      open={showDriverWarningModal}
      onClose={() => setShowDriverWarningModal(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white dark:bg-gray-800 p-4 shadow-xl border border-gray-200 dark:border-gray-700/30">
          {/* Close button */}
          <button
            onClick={() => setShowDriverWarningModal(false)}
            className="absolute right-2 top-2 rounded-lg p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className={`flex-shrink-0 rounded-full p-2 ${
              hasAvailableDrivers ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-5 w-5 ${
                hasAvailableDrivers ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
              </svg>
            </div>
            <div>
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                {hasAvailableDrivers ? 'Driver Shortage' : 'No Drivers Available'}
              </Dialog.Title>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {hasAvailableDrivers 
                  ? 'Some drivers are available but not enough for all vehicles'
                  : 'No drivers available for the selected vehicles and time period'
                }
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Selected time period */}
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
              <p className="mb-1 text-xs font-medium text-amber-800 dark:text-amber-200">Selected time period:</p>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                {pendingDateSelection && (() => {
                  const start = dayjs(pendingDateSelection.startDate).tz('Asia/Manila');
                  const end = dayjs(pendingDateSelection.endDate).tz('Asia/Manila');
                  if (start.isSame(end, 'day')) {
                    return `${start.format('MMM D, YYYY h:mm A')} - ${end.format('h:mm A')}`;
                  } else {
                    return `${start.format('MMM D, YYYY h:mm A')} - ${end.format('MMM D, YYYY h:mm A')}`;
                  }
                })()}
              </div>
              {pendingDateSelection && (() => {
                const sufficiencyCheck = checkDriverSufficiency(pendingDateSelection.startDate, pendingDateSelection.endDate);
                return !sufficiencyCheck.isSufficient ? (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    <span className="font-medium">Driver shortage:</span> Need {sufficiencyCheck.numberOfVehicles} driver{sufficiencyCheck.numberOfVehicles !== 1 ? 's' : ''}, have {sufficiencyCheck.availableDrivers.length} available
                  </div>
                ) : null;
              })()}
            </div>

            {/* Driver availability info */}
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/10 border border-gray-100 dark:border-gray-900/20">
              <p className="mb-2 text-xs font-medium text-gray-800 dark:text-gray-200">
                Driver Status:
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {driverAvailability.length > 0 ? (
                  driverAvailability.map((driver, index) => {
                    // Check if this driver has conflicts with the selected time
                    const hasConflict = pendingDateSelection && driver.reservations && driver.reservations.some(reservation => {
                      const reservationStart = new Date(reservation.reservation_start_date);
                      const reservationEnd = new Date(reservation.reservation_end_date);
                      return (
                        pendingDateSelection.startDate < reservationEnd && 
                        pendingDateSelection.endDate > reservationStart
                      );
                    });

                    return (
                      <div key={index} className={`text-xs p-2 rounded border ${
                        hasConflict 
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/30' 
                          : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-800/30'
                      }`}>
                        <div className="font-medium break-words leading-tight">
                          {[driver.users_fname, driver.users_mname, driver.users_lname].filter(Boolean).join(' ')}
                        </div>
                        <div className="mt-1">
                          Status: <span className={`font-medium ${
                            hasConflict ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {hasConflict ? 'Conflicts with selected time' : 'Available for selected time'}
                          </span>
                        </div>
                        {driver.reservations && driver.reservations.length > 0 && (
                          <div className="mt-1">
                            <div className="text-gray-500 dark:text-gray-400">
                              Existing reservations: {driver.reservations.length}
                            </div>
                            {hasConflict && (
                              <div className="mt-1 space-y-1">
                                {driver.reservations.map((reservation, resIndex) => {
                                  const reservationStart = new Date(reservation.reservation_start_date);
                                  const reservationEnd = new Date(reservation.reservation_end_date);
                                  const conflictsWithSelected = (
                                    pendingDateSelection.startDate < reservationEnd && 
                                    pendingDateSelection.endDate > reservationStart
                                  );
                                  
                                  if (conflictsWithSelected) {
                                    return (
                                      <div key={resIndex} className="text-xs bg-red-100 dark:bg-red-900/30 p-1 rounded border border-red-200 dark:border-red-800/30">
                                        <div className="font-medium text-red-800 dark:text-red-200">
                                          {reservation.reservation_title || 'Reservation'}
                                        </div>
                                        <div className="text-red-700 dark:text-red-300">
                                          {dayjs(reservationStart).format('MMM D, h:mm A')} - {dayjs(reservationEnd).format('h:mm A')}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    No driver data available
                  </div>
                )}
              </div>
            </div>

            {/* Warning message */}
            <div className={`rounded-lg p-3 border ${
              hasAvailableDrivers 
                ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20' 
                : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
            }`}>
              <p className={`text-xs ${
                hasAvailableDrivers 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                <span className="font-medium">
                  {hasAvailableDrivers ? 'Mixed Driver Mode:' : 'Warning:'}
                </span> 
                {hasAvailableDrivers 
                  ? ` You can use ${sufficiencyCheck.availableDrivers.length} default driver(s) for the first ${sufficiencyCheck.availableDrivers.length} vehicle(s) and provide your own drivers for the remaining ${sufficiencyCheck.numberOfVehicles - sufficiencyCheck.availableDrivers.length} vehicle(s).`
                  : ' Proceeding without available drivers will require you to provide your own drivers for all vehicles.'
                }
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-lg bg-gray-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-gray-600"
              onClick={() => setShowDriverWarningModal(false)}
            >
              Choose Different Time
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-white ${
                hasAvailableDrivers 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
              onClick={() => {
                if (pendingDateSelection) {
                  onDateSelect({
                    startDate: pendingDateSelection.startDate,
                    endDate: pendingDateSelection.endDate,
                    isOverride: pendingDateSelection.isOverride,
                    forceOwnDrivers: !hasAvailableDrivers, // Force own drivers only if no drivers available
                    forceMixedDrivers: hasAvailableDrivers, // Force mixed drivers if some drivers available
                    availableDrivers: hasAvailableDrivers ? sufficiencyCheck.availableDrivers.length : 0,
                    totalVehicles: hasAvailableDrivers ? sufficiencyCheck.numberOfVehicles : 0
                  });
                }
                setShowDriverWarningModal(false);
                setPendingDateSelection(null);
              }}
            >
              {hasAvailableDrivers ? 'Proceed with Mixed Mode' : 'Proceed Anyway'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
  };

  // Add this new function before the return statement
  const renderTimeSelectionModal = () => {
  // Define business hours
  const businessHours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 to 21 (8 AM to 10 PM)

  // Helper to render hour buttons
  const renderHourButtons = (type) => (
    <div className="flex flex-col gap-2">
      {businessHours.map(hour => (
        <button
          key={hour}
          className={`w-full py-2 rounded text-base font-medium border transition-colors
            ${type === 'start' && selectedTimes.startTime === hour ? 'bg-blue-500 text-white border-blue-500' : ''}
            ${type === 'end' && selectedTimes.endTime === hour ? 'bg-blue-500 text-white border-blue-500' : ''}
            ${type === 'start' && selectedTimes.endTime !== null && hour >= selectedTimes.endTime ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-100'}
            ${type === 'end' && selectedTimes.startTime !== null && hour <= selectedTimes.startTime ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-100'}
          `}
          disabled={
            (type === 'start' && selectedTimes.endTime !== null && hour >= selectedTimes.endTime) ||
            (type === 'end' && selectedTimes.startTime !== null && hour <= selectedTimes.startTime)
          }
          onClick={() => {
            if (type === 'start') {
              setSelectedTimes(prev => ({ ...prev, startTime: hour, startMinute: 0 }));
              setTimeModalOpen(false);
              setTimeout(() => handleTimeSelection(), 0);
            } else {
              setSelectedTimes(prev => ({ ...prev, endTime: hour, endMinute: 0 }));
              setTimeModalOpen(false);
              setTimeout(() => handleTimeSelection(), 0);
            }
          }}
        >
          {hour}:00
        </button>
      ))}
    </div>
  );

  return (
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
                {renderHourButtons('start')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                {renderHourButtons('end')}
              </div>
            </div>
          </div>

          {/* No OK/Cancel buttons, selection is instant */}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

  // Add this new function to handle day clicks

  // Update the checkTimeSlotConflicts function
  // const checkTimeSlotConflicts = (start, end) => {
  //   if (selectedResource.type === 'equipment') {
  //     const conflicts = [];
      
  //     selectedResource.id.forEach(equipment => {
  //       const overlappingItems = equipmentAvailability.filter(item => {
  //         const itemStart = new Date(item.startDate);
  //         const itemEnd = new Date(item.endDate);
          
  //         // Check if the time slot overlaps with the equipment reservation period
  //         return (start <= itemEnd && end >= itemStart);
  //       });
        
  //       overlappingItems.forEach(item => {
  //         const available = parseInt(item.totalAvailable);
  //         const requested = parseInt(equipment.quantity);
          
  //         // Add conflict if requested quantity exceeds available quantity
  //         if (available < requested) {
  //           conflicts.push({
  //             equipId: item.equipId,
  //             name: item.name,
  //             available: available,
  //             requested: requested,
  //             startDate: new Date(item.startDate),
  //             endDate: new Date(item.endDate)
  //           });
  //         }
  //       });
  //     });
      
  //     return conflicts;
  //   }

  //   // Original conflict checking for venues/vehicles
  //   return reservations.filter(res => {
  //     if (!res.isReserved) return false;

  //     const resStart = new Date(res.startDate);
  //     const resEnd = new Date(res.endDate);
      
  //     // Check if time periods overlap
  //     return (start < resEnd && end > resStart);
  //   });
  // };

  // Add helper function to get blocked time slots from existing reservations
  const getBlockedTimeSlots = (date) => {
  const blockedSlots = {
    hours: [],
    minutes: {}
  };

  // Return empty blocked slots if date is null or invalid
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return blockedSlots;
  }

  // Return empty blocked slots for Department Head from COO
  if (userLevel === 'Department Head' && userDepartment === 'COO') {
    return blockedSlots;
  }

  // Check if it's a holiday
  const formattedDate = format(date, 'yyyy-MM-dd');
  if (holidays.some(h => h.date === formattedDate)) {
    // Block all hours for holidays (0-23)
    for (let hour = 0; hour < 24; hour++) {
      blockedSlots.hours.push(hour);
    }
    return blockedSlots;
  }

  // Check if date is before min selectable date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  const minSelectableDate = getMinSelectableDate();
  if (compareDate < minSelectableDate) {
    // Block all hours for past or not allowed dates (0-23)
    for (let hour = 0; hour < 24; hour++) {
      blockedSlots.hours.push(hour);
    }
    return blockedSlots;
  }

  // For equipment resources
  if (selectedResource.type === 'equipment') {
    // Filter equipment availability for this date (same logic as getAvailabilityStatus)
      const dayEquipment = equipmentAvailability.filter(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        const itemStartDay = new Date(itemStart.getFullYear(), itemStart.getMonth(), itemStart.getDate());
        const itemEndDay = new Date(itemEnd.getFullYear(), itemEnd.getMonth(), itemEnd.getDate());
        
        return compareDate >= itemStartDay && compareDate <= itemEndDay;
      });

      if (dayEquipment.length === 0) {
        // No equipment reservations for this date, all hours available
        return blockedSlots;
      }

      // Check if any equipment is completely unavailable for the whole business day
      const hasCompletelyUnavailable = dayEquipment.some(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        
        // Check if the reservation spans the whole business day (8AM to 10PM)
        const startsBeforeOrAt8AM = itemStart.getHours() <= 8;
        const endsAtOrAfter10PM = itemEnd.getHours() >= 22;
        const spansWholeDay = startsBeforeOrAt8AM && endsAtOrAfter10PM;
        
        return spansWholeDay && (
          parseInt(item.totalAvailable) < parseInt(item.requestedQuantity) ||
          parseInt(item.totalAvailable) === 0
        );
      });

      if (hasCompletelyUnavailable) {
        // Block all hours if any equipment is completely unavailable
        for (let hour = 0; hour < 24; hour++) {
          blockedSlots.hours.push(hour);
        }
        return blockedSlots;
      }

      // Check for partial availability - block hours where equipment is insufficient
      for (let hour = 8; hour < 22; hour++) {
        const hourEquipment = dayEquipment.filter(item => {
          const itemStart = new Date(item.startDate);
          const itemEnd = new Date(item.endDate);
          const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
          const slotEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1);
          return (itemStart < slotEnd && itemEnd > slotStart);
        });

        // If any equipment is unavailable for this hour, block it
        const hasUnavailableEquipment = hourEquipment.some(item => {
          const available = parseInt(item.totalAvailable);
          const requested = parseInt(item.requestedQuantity);
          return available < requested;
        });

        if (hasUnavailableEquipment) {
          blockedSlots.hours.push(hour);
        }
      }
  } else {
    // For venue/vehicle resources
    if (!reservations.length) {
      return blockedSlots;
    }

    reservations.forEach(res => {
      if (!res.isReserved) return;

      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      // Check if this date falls within the reservation period
      const dateStart = new Date(compareDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(compareDate);
      dateEnd.setHours(23, 59, 59, 999);
      
      if (resStart <= dateEnd && resEnd >= dateStart) {
        // This date is within the reservation period
        if (isSameDay(resStart, resEnd) && isSameDay(resStart, compareDate)) {
          // Single day reservation - block the specific time range
          const startHour = resStart.getHours();
          const startMinute = resStart.getMinutes();
          const endHour = resEnd.getHours();
          const endMinute = resEnd.getMinutes();

          // Block all hours from startHour to endHour (inclusive)
          for (let hour = startHour; hour <= endHour; hour++) {
            if (!blockedSlots.hours.includes(hour)) {
              blockedSlots.hours.push(hour);
            }
          }

          // Handle minutes for the start and end hour
          if (startHour === endHour) {
            // Same hour reservation - block specific minutes
            if (!blockedSlots.minutes[startHour]) {
              blockedSlots.minutes[startHour] = [];
            }
            for (let minute = startMinute; minute < endMinute; minute += 30) {
              if (!blockedSlots.minutes[startHour].includes(minute)) {
                blockedSlots.minutes[startHour].push(minute);
              }
            }
          } else {
            // Block start hour from startMinute to 59
            if (startMinute > 0) {
              if (!blockedSlots.minutes[startHour]) {
                blockedSlots.minutes[startHour] = [];
              }
              for (let minute = startMinute; minute < 60; minute += 30) {
                if (!blockedSlots.minutes[startHour].includes(minute)) {
                  blockedSlots.minutes[startHour].push(minute);
                }
              }
            }
            // Block end hour from 0 to endMinute
            if (endMinute > 0 && endMinute < 60) {
              if (!blockedSlots.minutes[endHour]) {
                blockedSlots.minutes[endHour] = [];
              }
              for (let minute = 0; minute < endMinute; minute += 30) {
                if (!blockedSlots.minutes[endHour].includes(minute)) {
                  blockedSlots.minutes[endHour].push(minute);
                }
              }
            }
          }
        } else {
          // Multi-day reservation - block specific time ranges based on the actual reservation
          if (isSameDay(resStart, compareDate)) {
            // First day of multi-day reservation - block from start time to end of business day
            const startHour = resStart.getHours();
            const startMinute = resStart.getMinutes();
            
            // Block all hours from startHour to end of business day (17)
            for (let hour = startHour; hour < 17; hour++) {
              if (!blockedSlots.hours.includes(hour)) {
                blockedSlots.hours.push(hour);
              }
            }
            
            // Handle minutes for the start hour
            if (startMinute > 0) {
              if (!blockedSlots.minutes[startHour]) {
                blockedSlots.minutes[startHour] = [];
              }
              for (let minute = startMinute; minute < 60; minute += 30) {
                if (!blockedSlots.minutes[startHour].includes(minute)) {
                  blockedSlots.minutes[startHour].push(minute);
                }
              }
            }
          } else if (isSameDay(resEnd, compareDate)) {
            // Last day of multi-day reservation - block from start of business day to end time
            const endHour = resEnd.getHours();
            const endMinute = resEnd.getMinutes();
            
            // Block all hours from start of business day (8) to endHour
            for (let hour = 8; hour <= endHour; hour++) {
              if (!blockedSlots.hours.includes(hour)) {
                blockedSlots.hours.push(hour);
              }
            }
            
            // Handle minutes for the end hour
            if (endMinute > 0 && endMinute < 60) {
              if (!blockedSlots.minutes[endHour]) {
                blockedSlots.minutes[endHour] = [];
              }
              for (let minute = 0; minute < endMinute; minute += 30) {
                if (!blockedSlots.minutes[endHour].includes(minute)) {
                  blockedSlots.minutes[endHour].push(minute);
                }
              }
            }
          } else {
            // Middle day of multi-day reservation - block all hours
            for (let hour = 0; hour < 24; hour++) {
              if (!blockedSlots.hours.includes(hour)) {
                blockedSlots.hours.push(hour);
              }
            }
          }
        }
      }
    });
  }

  // Remove duplicate hours and sort
  blockedSlots.hours = [...new Set(blockedSlots.hours)].sort((a, b) => a - b);
  
  // Remove duplicate minutes and sort for each hour
  Object.keys(blockedSlots.minutes).forEach(hour => {
    blockedSlots.minutes[hour] = [...new Set(blockedSlots.minutes[hour])].sort((a, b) => a - b);
  });

  console.log('Blocked slots for', format(date, 'yyyy-MM-dd'), ':', {
    hours: blockedSlots.hours,
    minutes: blockedSlots.minutes
  });

  return blockedSlots;
};

  // Helper: Aggregate blocked slots for a date range
  const getBlockedTimeSlotsForRange = (start, end) => {
  const blockedSlots = {
    hours: [],
    minutes: {}
  };
  
  if (!start) return blockedSlots;
  
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : startDate;
  
  // For single day selection, just return the blocked slots for that day
  if (isSameDay(startDate, endDate)) {
    return getBlockedTimeSlots(startDate);
  }
  
  // For multi-day selection, check for overbooking conflicts
  // If any existing reservation falls within the selected range, block all times
  if (selectedResource.type !== 'equipment' && reservations.length > 0) {
    const hasConflict = reservations.some(res => {
      if (!res.isReserved) return false;
      
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      // Check if the existing reservation overlaps with the selected date range
      const rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
      
      return (resStart <= rangeEnd && resEnd >= rangeStart);
    });
    
    if (hasConflict) {
      // Block all hours for the entire range due to overbooking
      for (let hour = 0; hour < 24; hour++) {
        blockedSlots.hours.push(hour);
      }
      return blockedSlots;
    }
  }
  
  // For equipment resources, check availability across the range
  if (selectedResource.type === 'equipment' && equipmentAvailability.length > 0) {
    const hasConflict = equipmentAvailability.some(item => {
      const itemStart = new Date(item.startDate);
      const itemEnd = new Date(item.endDate);
      
      // Check if the equipment reservation overlaps with the selected date range
      const rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
      
      if (itemStart <= rangeEnd && itemEnd >= rangeStart) {
        // Check if there's insufficient availability
        const available = parseInt(item.totalAvailable);
        const requested = parseInt(item.requestedQuantity);
        return available < requested;
      }
      
      return false;
    });
    
    if (hasConflict) {
      // Block all hours for the entire range due to insufficient equipment
      for (let hour = 0; hour < 24; hour++) {
        blockedSlots.hours.push(hour);
      }
      return blockedSlots;
    }
  }
  
  // If no conflicts, collect blocked slots from each day normally
  const allBlockedHours = new Set();
  const allBlockedMinutes = {};
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const daySlots = getBlockedTimeSlots(new Date(d));
    
    // Add all blocked hours from this day
    daySlots.hours.forEach(hour => allBlockedHours.add(hour));
    
    // Add all blocked minutes from this day
    Object.keys(daySlots.minutes).forEach(hour => {
      if (!allBlockedMinutes[hour]) {
        allBlockedMinutes[hour] = new Set();
      }
      daySlots.minutes[hour].forEach(minute => {
        allBlockedMinutes[hour].add(minute);
      });
    });
  }
  
  // Convert sets back to arrays
  blockedSlots.hours = Array.from(allBlockedHours).sort((a, b) => a - b);
  
  Object.keys(allBlockedMinutes).forEach(hour => {
    blockedSlots.minutes[hour] = Array.from(allBlockedMinutes[hour]).sort((a, b) => a - b);
  });
  
  return blockedSlots;
};
  // Helper function to get reservations for a specific time slot with proper time ranges
  // const getReservationsForTimeSlot = (date, hour) => {
  //   if (selectedResource.type === 'equipment') {
  //     return equipmentAvailability.filter(item => {
  //       const itemStart = new Date(item.startDate);
  //       const itemEnd = new Date(item.endDate);
  //       const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
  //       const slotEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1);
  //       return (itemStart < slotEnd && itemEnd > slotStart);
  //     });
  //   }

  //   const filtered = reservations.filter(res => {
  //     if (!res.isReserved) return false;
  //     const resStart = new Date(res.startDate);
  //     const resEnd = new Date(res.endDate);
  //     const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  //     currentDate.setHours(0, 0, 0, 0);
      
  //     let dayStartTime, dayEndTime;
      
  //     // Calculate the actual time range for this specific day
  //     if (isSameDay(resStart, currentDate)) {
  //       // First day of the reservation - use actual start time
  //       dayStartTime = resStart;
  //       // If it's a multi-day reservation, end at business hours (8 PM)
  //       if (!isSameDay(resStart, resEnd)) {
  //         dayEndTime = new Date(currentDate);
  //         dayEndTime.setHours(20, 0, 0, 0);
  //       } else {
  //         // Single day reservation - use actual end time
  //         dayEndTime = resEnd;
  //       }
  //     } else if (isSameDay(resEnd, currentDate)) {
  //       // Last day of the reservation - start at business hours (8 AM), use actual end time
  //       dayStartTime = new Date(currentDate);
  //       dayStartTime.setHours(8, 0, 0, 0);
  //       dayEndTime = resEnd;
  //     } else {
  //       // Day in between multi-day reservation - full business hours
  //       dayStartTime = new Date(currentDate);
  //       dayStartTime.setHours(8, 0, 0, 0);
  //       dayEndTime = new Date(currentDate);
  //       dayEndTime.setHours(20, 0, 0, 0);
  //     }
      
  //     const slotStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour);
  //     const slotEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour + 1);
      
  //     // Only include if the slot overlaps with the actual reserved window for that day
  //     return (dayStartTime < slotEnd && dayEndTime > slotStart);
  //   });

  //   // Console log for debugging
  //   if (filtered.length > 0) {
  //     const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
  //     const slotEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1);
  //     console.log(`Slot: ${slotStart.toLocaleString()} - ${slotEnd.toLocaleString()}`);
  //     filtered.forEach(res => {
  //       const resStartDbg = new Date(res.startDate);
  //       const resEndDbg = new Date(res.endDate);
  //       const currentDateDbg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  //       currentDateDbg.setHours(0, 0, 0, 0);
        
  //       let dayStartTimeDbg, dayEndTimeDbg;
        
  //       if (isSameDay(resStartDbg, currentDateDbg)) {
  //         dayStartTimeDbg = resStartDbg;
  //         if (!isSameDay(resStartDbg, resEndDbg)) {
  //           dayEndTimeDbg = new Date(currentDateDbg);
  //           dayEndTimeDbg.setHours(20, 0, 0, 0);
  //         } else {
  //           dayEndTimeDbg = resEndDbg;
  //         }
  //       } else if (isSameDay(resEndDbg, currentDateDbg)) {
  //         dayStartTimeDbg = new Date(currentDateDbg);
  //         dayStartTimeDbg.setHours(8, 0, 0, 0);
  //         dayEndTimeDbg = resEndDbg;
  //       } else {
  //         dayStartTimeDbg = new Date(currentDateDbg);
  //         dayStartTimeDbg.setHours(8, 0, 0, 0);
  //         dayEndTimeDbg = new Date(currentDateDbg);
  //         dayEndTimeDbg.setHours(20, 0, 0, 0);
  //       }
        
  //       console.log(`  Reservation: ${res.venueName || res.title || 'N/A'} | ${resStartDbg.toLocaleString()} - ${resEndDbg.toLocaleString()} | Actual window: ${dayStartTimeDbg.toLocaleString()} - ${dayEndTimeDbg.toLocaleString()}`);
  //     });
  //   }

  //   return filtered.map(res => {
  //     const resStartMap = new Date(res.startDate);
  //     const resEndMap = new Date(res.endDate);
  //     const currentDateMap = new Date(date);
  //     currentDateMap.setHours(0, 0, 0, 0);
      
  //     let dayStartTimeMap, dayEndTimeMap;
      
  //     if (isSameDay(resStartMap, currentDateMap)) {
  //       dayStartTimeMap = resStartMap;
  //       if (!isSameDay(resStartMap, resEndMap)) {
  //         dayEndTimeMap = new Date(currentDateMap);
  //         dayEndTimeMap.setHours(20, 0, 0, 0);
  //       } else {
  //         dayEndTimeMap = resEndMap;
  //       }
  //     } else if (isSameDay(resEndMap, currentDateMap)) {
  //       dayStartTimeMap = new Date(currentDateMap);
  //       dayStartTimeMap.setHours(8, 0, 0, 0);
  //       dayEndTimeMap = resEndMap;
  //     } else {
  //       dayStartTimeMap = new Date(currentDateMap);
  //       dayStartTimeMap.setHours(8, 0, 0, 0);
  //       dayEndTimeMap = new Date(currentDateMap);
  //       dayEndTimeMap.setHours(20, 0, 0, 0);
  //     }
      
  //     const slotStart = new Date(currentDateMap.getFullYear(), currentDateMap.getMonth(), currentDateMap.getDate(), hour);
  //     const slotEnd = new Date(currentDateMap.getFullYear(), currentDateMap.getMonth(), currentDateMap.getDate(), hour + 1);
      
  //     return {
  //       ...res,
  //       dayStartTime: dayStartTimeMap,
  //       dayEndTime: dayEndTimeMap,
  //       isReservedInHour: (dayStartTimeMap < slotEnd && dayEndTimeMap > slotStart)
  //     };
  //   }).filter(res => res.isReservedInHour);
  // };

  useEffect(() => {
    if (selectedResource.type === 'equipment') {
      fetchEquipmentAvailability();
    } else {
      // Ensure selectedResource.id is always an array
      // const itemIds = Array.isArray(selectedResource.id) ? selectedResource.id : [selectedResource.id].filter(Boolean);
      
      fetchReservations();
    }
    // Fetch driver availability when resource type is vehicle
    if (selectedResource.type === 'vehicle') {
      fetchDriverAvailability();
    }
  }, [selectedResource, fetchEquipmentAvailability, fetchReservations, fetchDriverAvailability]);

  // Enhanced calendar view with loading state
  return (
    <div className="mt-16 p-1.5 sm:p-4 space-y-2 sm:space-y-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      {/* Unique advance booking reminder */}
      <div className="mb-3 p-3 rounded-lg bg-yellow-100 border-l-4 border-yellow-400 flex items-center gap-3 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <div>
          <div className="font-semibold text-yellow-800">Advance Booking Required</div>
          <div className="text-yellow-700 text-sm">Reservations must be submitted at least <span className="font-bold">1 week before the start date of your event</span>. Dates within 7 days from today are not available for booking.</div>
        </div>
      </div>
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
        {renderConflictModal()}
        {renderDateTimeSelectionModal()}
        <DayDetailsModal />
        {renderDriverWarningModal()}
      </div>
    </div>
  );
};

export default ReservationCalendar;
