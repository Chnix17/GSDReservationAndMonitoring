/**
 * RescheduleModal Component
 * 
 * Enhanced with comprehensive fetchAvailability functionality from reservation_calendar.jsx
 * 
 * Features:
 * - Fetches availability for venues, vehicles, equipment, and drivers
 * - Supports date range filtering for availability checks
 * - Handles Change Request status with both original and change resource IDs
 * - Real-time availability blocking with color-coded calendar dates
 * - Business hours validation (4 AM - 10 PM)
 * - Advance booking rules for venues (1-2 weeks based on event type)
 * - Responsive design (Modal for desktop, Drawer for mobile)
 * 
 * API Integration:
 * - fetchAvailability: Gets reservation conflicts for resources
 * - fetchAvailableVenues: Gets available venues for date range
 * - fetchAvailableVehicles: Gets available vehicles for date range
 * - fetchAvailableDrivers: Gets driver availability and schedules
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Drawer, Form, Button, DatePicker, TimePicker, Select, Spin, message, Alert } from 'antd';
import { useMediaQuery } from 'react-responsive';
// import { CloseOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import axios from 'axios';
import { SecureStorage } from '../../../utils/encryption';
import './reschedule_modal.css';

const { Option } = Select;

// Separate memoized component for custom driver input to prevent focus loss
const CustomDriverInput = React.memo(({ 
  vehicleId, 
  value, 
  onChange, 
  disabled, 
  placeholder,
  isMobile 
}) => {
  return (
    <div style={{ marginTop: 8 }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(vehicleId, e.target.value)}
        style={{
          width: '100%',
          padding: isMobile ? '10px 12px' : '8px 11px',
          fontSize: isMobile ? 14 : 13,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          outline: 'none',
          backgroundColor: disabled ? '#f3f4f6' : 'white',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
});

CustomDriverInput.displayName = 'CustomDriverInput';

const RescheduleModal = ({ 
  visible, 
  onCancel, 
  onReschedule, 
  reservation,
  resources,
  originalStart, // ISO string or parseable datetime
  originalEnd,   // ISO string or parseable datetime
  onRequestAgain, // New prop for handling "Request Again to Reschedule"
  showRequestAgainButton = false, // New prop to control visibility of "Request Again to Reschedule" button
  hideRescheduleButton = false // New prop to hide the regular "Reschedule" button
}) => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [availabilityBlocks, setAvailabilityBlocks] = useState([]); // [{start: dayjs, end: dayjs}]
  const [dayStatuses, setDayStatuses] = useState({}); // { 'YYYY-MM-DD': 'available'|'partial'|'reserved' }
  const [conflictInfo, setConflictInfo] = useState(null); // { hasConflict: bool, message: string }
  const [vehicleDriverAssignments, setVehicleDriverAssignments] = useState({}); // { vehicle_id: driver_id or 'custom' or null }
  const [customDriverNames, setCustomDriverNames] = useState({}); // { vehicle_id: custom_driver_name }
  // Watch form fields so component re-renders when they change
  const startDateVal = Form.useWatch('startDate', form);
  const startTimeVal = Form.useWatch('startTime', form);
  const endDateVal = Form.useWatch('endDate', form);
  const endTimeVal = Form.useWatch('endTime', form);
  
  // Get user info for advance booking rules
  const userLevel = SecureStorage.getLocalItem('user_level');
  const userDepartment = SecureStorage.getLocalItem('Department Name');

  // Helper to get venue advance booking days
  // All venues require 2-3 days advance booking
  const getVenueAdvanceDays = useCallback(() => {
    if (!resources?.venueIds || !Array.isArray(resources.venueIds)) return 2;
    // All venues require 2 days advance booking
    return 2;
  }, [resources]);

  // Helper to get minimum selectable date based on venue advance booking rules
  const getMinSelectableDate = useCallback(() => {
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    
    // COO Department Head and GSD Secretary can book up to 1 day before
    if ((userLevel === '#' && userDepartment === '#') ||
        (userLevel === '#' && userDepartment === '#')) {
      minDate.setDate(minDate.getDate() + 1);
    } else {
      // For venues, apply advance booking rules based on event type
      if (resources?.venueIds && Array.isArray(resources.venueIds) && resources.venueIds.length > 0) {
        const advDays = getVenueAdvanceDays();
        minDate.setDate(minDate.getDate() + advDays);
      } else {
        // For non-venue resources (vehicles, equipment), use 1 day advance
        minDate.setDate(minDate.getDate() + 1);
      }
    }
    return minDate;
  }, [userLevel, userDepartment, resources, getVenueAdvanceDays]);

  // Ready state: enable resource dropdowns only when full valid range is selected
  const isDateTimeRangeReady = (() => {
    try {
      const s = dayjs(startDateVal).hour(dayjs(startTimeVal).hour()).minute(0).second(0);
      const e = dayjs(endDateVal).hour(dayjs(endTimeVal).hour()).minute(0).second(0);
      return s.isValid() && e.isValid() && e.isAfter(s);
    } catch (_) { return false; }
  })();

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return;
      }

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
      } else {
        toast.error("Error fetching venues: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("An error occurred while fetching venues.");
    } finally {
      setLoading(false);
    }
  }, []);


   const fetchVehicles = useCallback(async () => {
      try {
        setLoading(true);
        const encryptedUrl = SecureStorage.getLocalItem("url");
        if (!encryptedUrl) {
          toast.error("API URL configuration is missing");
          return;
        }
  
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
        } else {
          toast.error("Error fetching vehicles: " + response.data.message);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        toast.error("An error occurred while fetching vehicles.");
      } finally {
        setLoading(false);
      }
    }, []);

  // Helpers
  const parseBlocks = useCallback((items = [], itemType = null) => {
    // Handle equipment data structure differently
    if (itemType === 'equipment') {
      const equipmentBlocks = [];
      
      items.forEach(equipItem => {
        // Equipment has a different structure with nested reservations array
        if (equipItem.reservations && Array.isArray(equipItem.reservations)) {
          equipItem.reservations.forEach(reservation => {
            // Handle reschedule logic based on status (matching reservation_calendar.jsx)
            const statusId = parseInt(reservation.reservation_status_status_id);
            const reservationActive = parseInt(reservation.reservation_active);
            const hasReschedule = reservation.reschedule_start_date && reservation.reschedule_end_date;
            
            // Status 14 + active=1: Use ONLY reschedule dates (confirmed reschedule)
            if (statusId === 14 && reservationActive === 1 && hasReschedule) {
              equipmentBlocks.push({
                start: dayjs(reservation.reschedule_start_date),
                end: dayjs(reservation.reschedule_end_date),
                reservation_id: reservation.reservation_id,
                equip_id: equipItem.equip_id,
                current_quantity: equipItem.current_quantity ? parseInt(equipItem.current_quantity) : null,
                reserved_quantity: reservation.reserved_quantity ? parseInt(reservation.reserved_quantity) : null,
                total_available: equipItem.total_available ? parseInt(equipItem.total_available) : null,
                requested_quantity: equipItem.inputted_quantity ? parseInt(equipItem.inputted_quantity) : null,
                equipment_id: equipItem.equip_id
              });
            }
            // Status 10: Use BOTH original and reschedule dates (pending reschedule)
            else if (statusId === 10 && hasReschedule) {
              // Add original dates entry
              equipmentBlocks.push({
                start: dayjs(reservation.reservation_start_date),
                end: dayjs(reservation.reservation_end_date),
                reservation_id: reservation.reservation_id,
                equip_id: equipItem.equip_id,
                current_quantity: equipItem.current_quantity ? parseInt(equipItem.current_quantity) : null,
                reserved_quantity: reservation.reserved_quantity ? parseInt(reservation.reserved_quantity) : null,
                total_available: equipItem.total_available ? parseInt(equipItem.total_available) : null,
                requested_quantity: equipItem.inputted_quantity ? parseInt(equipItem.inputted_quantity) : null,
                equipment_id: equipItem.equip_id
              });
              
              // Also add reschedule dates entry
              equipmentBlocks.push({
                start: dayjs(reservation.reschedule_start_date),
                end: dayjs(reservation.reschedule_end_date),
                reservation_id: reservation.reservation_id,
                equip_id: equipItem.equip_id,
                current_quantity: equipItem.current_quantity ? parseInt(equipItem.current_quantity) : null,
                reserved_quantity: reservation.reserved_quantity ? parseInt(reservation.reserved_quantity) : null,
                total_available: equipItem.total_available ? parseInt(equipItem.total_available) : null,
                requested_quantity: equipItem.inputted_quantity ? parseInt(equipItem.inputted_quantity) : null,
                equipment_id: equipItem.equip_id
              });
            }
            // Default: Use original dates only (status 3, 11, etc.)
            else if (reservation.reservation_start_date && reservation.reservation_end_date) {
              equipmentBlocks.push({
                start: dayjs(reservation.reservation_start_date),
                end: dayjs(reservation.reservation_end_date),
                reservation_id: reservation.reservation_id,
                equip_id: equipItem.equip_id,
                current_quantity: equipItem.current_quantity ? parseInt(equipItem.current_quantity) : null,
                reserved_quantity: reservation.reserved_quantity ? parseInt(reservation.reserved_quantity) : null,
                total_available: equipItem.total_available ? parseInt(equipItem.total_available) : null,
                requested_quantity: equipItem.inputted_quantity ? parseInt(equipItem.inputted_quantity) : null,
                equipment_id: equipItem.equip_id
              });
            }
          });
        }
      });
      
      return equipmentBlocks.filter(b => b.start.isValid() && b.end.isValid() && b.end.isAfter(b.start));
    }
    
    // For venues and vehicles, use the original logic
    return items
      .filter(it => it.reservation_start_date && it.reservation_end_date)
      .map(it => ({
        start: dayjs(it.reservation_start_date),
        end: dayjs(it.reservation_end_date),
        reservation_id: it.reservation_id,
        // Include resource IDs for exclusion logic
        ven_id: it.ven_id,
        vehicle_id: it.vehicle_id,
        equipment_id: it.equipment_id
      }))
      .filter(b => b.start.isValid() && b.end.isValid() && b.end.isAfter(b.start));
  }, []);

  // Enhanced fetchAvailability function similar to reservation_calendar.jsx
  const fetchAvailabilityFor = useCallback(async (itemType, ids = [], quantities = []) => {
    if (!ids || ids.length === 0) return [];
    
    try {
      console.log(`[RescheduleModal] Fetching availability for ${itemType}:`, { ids, quantities });
      
      const payload = {
        operation: 'fetchAvailability',
        itemType,
        itemId: ids,
      };
      
      // Add quantity for equipment
      if (itemType === 'equipment' && quantities && quantities.length === ids.length) {
        payload.quantity = quantities;
      }
      
      // Add date range if available from form values
      const startDateVal = form.getFieldValue('startDate');
      const startTimeVal = form.getFieldValue('startTime');
      const endDateVal = form.getFieldValue('endDate');
      const endTimeVal = form.getFieldValue('endTime');
      
      if (startDateVal && startTimeVal && endDateVal && endTimeVal) {
        const start = dayjs(startDateVal).hour(dayjs(startTimeVal).hour()).minute(0).second(0);
        const end = dayjs(endDateVal).hour(dayjs(endTimeVal).hour()).minute(0).second(0);
        
        if (start.isValid() && end.isValid() && end.isAfter(start)) {
          payload.startDate = start.format('YYYY-MM-DD HH:mm:ss');
          payload.endDate = end.format('YYYY-MM-DD HH:mm:ss');
          console.log(`[RescheduleModal] Adding date range to availability check:`, {
            startDate: payload.startDate,
            endDate: payload.endDate
          });
        }
      }
      
      const url = `${SecureStorage.getLocalItem('url')}/reservation.php`;
      const resp = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[RescheduleModal] ${itemType} availability response:`, resp.data);
      
      if (resp.data?.status !== 'success') {
        console.warn(`[RescheduleModal] Failed to fetch ${itemType} availability:`, resp.data?.message);
        return [];
      }
      
      // The response structure is assumed to be an array or an object with data array
      const items = Array.isArray(resp.data.data) ? resp.data.data : (resp.data.data?.items || []);
      const blocks = parseBlocks(items, itemType);
      
      console.log(`[RescheduleModal] Parsed ${blocks.length} availability blocks for ${itemType}`);
      console.log(`[RescheduleModal] Equipment blocks detail:`, itemType === 'equipment' ? blocks : 'Not equipment');
      
      return blocks;
    } catch (error) {
      console.error(`[RescheduleModal] Error fetching availability for ${itemType}:`, error);
      return [];
    }
  }, [parseBlocks, form]);

  // Handler for custom driver name input (prevents input focus loss)
  const handleCustomDriverName = useCallback((vehicleId, driverName) => {
    setCustomDriverNames(prev => ({ ...prev, [vehicleId]: driverName }));
  }, []);

  // Fetch available resources by selected date-time range
  const fetchAvailableVenuesByRange = useCallback(async (startDateTimeStr, endDateTimeStr, excludeIds = []) => {
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return [];
      }
      const resp = await axios.post(`${encryptedUrl}/reservation.php`, {
        operation: 'fetchAvailableVenues',
        startDateTime: startDateTimeStr,
        endDateTime: endDateTimeStr,
        excludeIds: excludeIds
      }, { headers: { 'Content-Type': 'application/json' } });
      if (resp?.data?.status === 'success') {
        return Array.isArray(resp.data.data) ? resp.data.data : [];
      }
      toast.error('Error fetching available venues');
      return [];
    } catch (e) {
      console.error('Error fetchAvailableVenues:', e);
      toast.error('An error occurred while fetching available venues.');
      return [];
    }
  }, []);

  const fetchAvailableVehiclesByRange = useCallback(async (startDateTimeStr, endDateTimeStr, excludeIds = []) => {
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return [];
      }
      const resp = await axios.post(`${encryptedUrl}/reservation.php`, {
        operation: 'fetchAvailableVehicles',
        startDateTime: startDateTimeStr,
        endDateTime: endDateTimeStr,
        excludeIds: excludeIds
      }, { headers: { 'Content-Type': 'application/json' } });
      if (resp?.data?.status === 'success') {
        return Array.isArray(resp.data.data) ? resp.data.data : [];
      }
      toast.error('Error fetching available vehicles');
      return [];
    } catch (e) {
      console.error('Error fetchAvailableVehicles:', e);
      toast.error('An error occurred while fetching available vehicles.');
      return [];
    }
  }, []);

  const fetchAvailableDriversByRange = useCallback(async (startDateTimeStr = null, endDateTimeStr = null) => {
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return [];
      }
      const resp = await axios.post(`${encryptedUrl}/reservation.php`, {
        operation: 'fetchAvailableDrivers'
      }, { headers: { 'Content-Type': 'application/json' } });
      if (resp?.data?.status === 'success') {
        let allDrivers = Array.isArray(resp.data.data) ? resp.data.data : [];
        
        // If date range is provided, filter drivers based on conflicts
        if (startDateTimeStr && endDateTimeStr) {
          const rangeStart = dayjs(startDateTimeStr);
          const rangeEnd = dayjs(endDateTimeStr);
          
          console.log('[RescheduleModal] Filtering drivers for date range:', {
            start: rangeStart.format('YYYY-MM-DD HH:mm:ss'),
            end: rangeEnd.format('YYYY-MM-DD HH:mm:ss')
          });
          
          // Filter out drivers with conflicting reservations in the selected date range
          allDrivers = allDrivers.map(driver => {
            // Filter reservations that overlap with the selected date range
            const conflictingReservations = (driver.reservations || []).filter(reservation => {
              // Use reschedule dates if available (status 10, 11, 14), otherwise use regular dates
              const resStart = reservation.reschedule_start_date 
                ? dayjs(reservation.reschedule_start_date)
                : dayjs(reservation.reservation_start_date);
              const resEnd = reservation.reschedule_end_date
                ? dayjs(reservation.reschedule_end_date)
                : dayjs(reservation.reservation_end_date);
              
              // Check if reservations overlap: (StartA < EndB) and (EndA > StartB)
              const hasOverlap = rangeStart.isBefore(resEnd) && rangeEnd.isAfter(resStart);
              
              if (hasOverlap) {
                console.log('[RescheduleModal] Driver conflict found:', {
                  driverName: `${driver.users_fname} ${driver.users_lname}`,
                  reservationId: reservation.reservation_id,
                  reservationDates: {
                    start: resStart.format('YYYY-MM-DD HH:mm:ss'),
                    end: resEnd.format('YYYY-MM-DD HH:mm:ss')
                  }
                });
              }
              
              return hasOverlap;
            });
            
            return {
              ...driver,
              reservations: conflictingReservations,
              is_available: conflictingReservations.length === 0
            };
          });
        }
        
        return allDrivers;
      }
      toast.error('Error fetching available drivers');
      return [];
    } catch (e) {
      console.error('Error fetchAvailableDrivers:', e);
      toast.error('An error occurred while fetching available drivers.');
      return [];
    }
  }, []);

  const refetchBlocks = useCallback(async (formValues = {}) => {
    try {
      // Extract resource IDs directly from reservation prop (fetchRequestById data)
      // This is more reliable than depending on resources prop
      const extractedVenueIds = (reservation?.venues || []).map(v => v.venue_id || v.ven_id).filter(id => id);
      const extractedVehicleIds = (reservation?.vehicles || []).map(v => v.vehicle_id).filter(id => id);
      const extractedEquipment = (reservation?.equipment || []).map(eq => ({
        equipment_id: eq.equipment_id || eq.equip_id,
        name: eq.name || eq.equipment_name,
        quantity: parseInt(eq.quantity, 10) || 0
      })).filter(eq => eq.equipment_id);
      
      if (!extractedVenueIds.length && !extractedVehicleIds.length && !extractedEquipment.length) { 
        console.log('[RescheduleModal] No resources found in reservation, clearing availability blocks');
        setAvailabilityBlocks([]); 
        return; 
      }
      
      console.log('[RescheduleModal] ===== REFETCHING AVAILABILITY BLOCKS =====');
      console.log('[RescheduleModal] Extracted from reservation:', {
        venueIds: extractedVenueIds,
        vehicleIds: extractedVehicleIds,
        equipment: extractedEquipment
      });
      console.log('[RescheduleModal] Resources prop (may be undefined):', resources);
      console.log('[RescheduleModal] Form values:', formValues);
      
      setCheckingAvailability(true);
      const toNums = (arr) => (arr || []).map(v => Number(v)).filter(v => !Number.isNaN(v));
      const selectedVenueIds = Array.isArray(formValues.venueIds)
        ? toNums(formValues.venueIds.filter(Boolean))
        : (Array.isArray(form.getFieldValue('venueIds')) ? toNums(form.getFieldValue('venueIds').filter(Boolean)) : null);
      const selectedVehicleIds = Array.isArray(formValues.vehicleIds)
        ? toNums(formValues.vehicleIds.filter(Boolean))
        : (Array.isArray(form.getFieldValue('vehicleIds')) ? toNums(form.getFieldValue('vehicleIds').filter(Boolean)) : null);
      
      console.log('[RescheduleModal] Selected IDs from form:', { selectedVenueIds, selectedVehicleIds });

      // Use selected IDs from form if available, otherwise use extracted IDs from reservation
      const venueIds = (selectedVenueIds && selectedVenueIds.length) 
        ? selectedVenueIds 
        : extractedVenueIds;

      // Use selected IDs from form if available, otherwise use extracted IDs from reservation
      const vehicleIds = (selectedVehicleIds && selectedVehicleIds.length) 
        ? selectedVehicleIds 
        : extractedVehicleIds;
        
      const equipIds = extractedEquipment.map(e => e.equipment_id);
      const quantities = extractedEquipment.map(e => parseInt(e.quantity || 0, 10));

      console.log('[RescheduleModal] Fetching availability for:', {
        venues: venueIds,
        vehicles: vehicleIds,
        equipment: equipIds.map((id, i) => ({ id, quantity: quantities[i] }))
      });
      
      const [venBlocks, vehBlocks, eqBlocks] = await Promise.all([
        fetchAvailabilityFor('venue', venueIds),
        fetchAvailabilityFor('vehicle', vehicleIds),
        fetchAvailabilityFor('equipment', equipIds, quantities)
      ]);
      
      console.log('[RescheduleModal] Fetched blocks:', {
        venueBlocks: venBlocks.length,
        vehicleBlocks: vehBlocks.length,
        equipmentBlocks: eqBlocks.length
      });

      // Use ALL blocks from fetchAvailability - no filtering based on reservation ID
      // This will block all hours/days that have any existing reservations
      const allBlocks = [...(venBlocks || []), ...(vehBlocks || []), ...(eqBlocks || [])];
      const filtered = allBlocks;
      
      console.log('[RescheduleModal] All availability blocks (no filtering):', {
        totalBlocks: allBlocks.length,
        blockedPeriods: filtered.map(b => ({
          start: b.start.format('YYYY-MM-DD HH:mm:ss'),
          end: b.end.format('YYYY-MM-DD HH:mm:ss'),
          reservation_id: b.reservation_id,
          ven_id: b.ven_id,
          vehicle_id: b.vehicle_id,
          equipment_id: b.equipment_id
        }))
      });
      
      setAvailabilityBlocks(filtered);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailabilityBlocks([]);
    } finally {
      setCheckingAvailability(false);
    }
  }, [form, reservation, resources, fetchAvailabilityFor]);

  // Compute per-day status (available / partial / reserved) - SIMPLIFIED APPROACH
  useEffect(() => {
    const BUSINESS_START_HOUR = 4;  // 4 AM
    const BUSINESS_END_HOUR = 22;   // 10 PM
    const totalBusinessMinutes = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60; // 1080

    // Build a window of dates around now and around the existing blocks
    const dateKeys = new Set();
    
    // Include days spanning all availability blocks
    availabilityBlocks.forEach(b => {
      const startDay = b.start.startOf('day');
      const endDay = b.end.startOf('day');
      let d = startDay.clone();
      while (d.isSame(endDay) || d.isBefore(endDay)) {
        dateKeys.add(d.format('YYYY-MM-DD'));
        d = d.add(1, 'day');
      }
    });
    
    // Also include a month span around today to color empty days as available
    const today = dayjs().startOf('month');
    for (let i = -1; i <= 2; i++) {
      const month = today.add(i, 'month');
      const daysInMonth = month.daysInMonth();
      for (let d = 1; d <= daysInMonth; d++) {
        dateKeys.add(month.date(d).format('YYYY-MM-DD'));
      }
    }

    const next = {};
    
    dateKeys.forEach(dateKey => {
      const currentDay = dayjs(dateKey).startOf('day');
      const dayStart = currentDay.hour(BUSINESS_START_HOUR).minute(0).second(0);
      const dayEnd = currentDay.hour(BUSINESS_END_HOUR).minute(0).second(0);
      
      // Separate equipment blocks from venue/vehicle blocks
      const equipmentBlocksForDate = [];
      const nonEquipmentBlocksForDate = [];
      
      availabilityBlocks.forEach(block => {
        const blockStartDay = block.start.startOf('day');
        const blockEndDay = block.end.startOf('day');
        
        // Check if block overlaps with current date
        const overlapsDate = (currentDay.isSame(blockStartDay) || currentDay.isAfter(blockStartDay)) &&
                            (currentDay.isSame(blockEndDay) || currentDay.isBefore(blockEndDay));
        
        if (!overlapsDate) return;
        
        if (block.equip_id) {
          equipmentBlocksForDate.push(block);
        } else {
          nonEquipmentBlocksForDate.push(block);
        }
      });
      
      // Calculate venue/vehicle time blocking (minutes overlapped)
      const intervals = nonEquipmentBlocksForDate
        .map(b => {
          const s = b.start.isAfter(dayStart) ? b.start : dayStart;
          const e = b.end.isBefore(dayEnd) ? b.end : dayEnd;
          return (e.isAfter(s)) ? { s, e } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.s.valueOf() - b.s.valueOf());
      
      // Merge overlapping intervals
      const merged = [];
      intervals.forEach(cur => {
        if (merged.length === 0) {
          merged.push({ ...cur });
        } else {
          const last = merged[merged.length - 1];
          if (cur.s.isSame(last.e) || cur.s.isBefore(last.e)) {
            if (cur.e.isAfter(last.e)) last.e = cur.e;
          } else {
            merged.push({ ...cur });
          }
        }
      });
      
      const blockedMinutes = merged.reduce((acc, it) => acc + (it.e.diff(it.s, 'minute')), 0);
      
      // Check equipment availability
      let equipmentStatus = 'available'; // Default: available
      
      if (equipmentBlocksForDate.length > 0) {
        // Group by equipment ID
        const equipByIdMap = {};
        
        equipmentBlocksForDate.forEach(block => {
          const equipId = block.equip_id;
          if (!equipByIdMap[equipId]) {
            equipByIdMap[equipId] = {
              currentQuantity: block.current_quantity,
              requestedQuantity: block.requested_quantity,
              reservedQuantity: 0,
              blocks: []
            };
          }
          equipByIdMap[equipId].reservedQuantity += (block.reserved_quantity || 0);
          equipByIdMap[equipId].blocks.push(block);
        });
        
        // Check each equipment
        let hasFullBlock = false;
        let hasPartial = false;
        
        Object.values(equipByIdMap).forEach(equip => {
          const availableQty = equip.currentQuantity - equip.reservedQuantity;
          const requestedQty = equip.requestedQuantity;
          
          console.log(`[RescheduleModal] ${dateKey} - Equipment check:`, {
            currentQty: equip.currentQuantity,
            reservedQty: equip.reservedQuantity,
            availableQty,
            requestedQty,
            blocks: equip.blocks.length
          });
          
          if (availableQty >= requestedQty) {
            // Enough available - mark as partial (yellow)
            hasPartial = true;
          } else {
            // Not enough available - check if it's full day
            const allBlocksFullDay = equip.blocks.every(b => {
              return b.start.hour() <= 4 && b.end.hour() >= 22;
            });
            
            if (allBlocksFullDay) {
              hasFullBlock = true; // RED
            } else {
              hasPartial = true; // YELLOW
            }
          }
        });
        
        if (hasFullBlock) {
          equipmentStatus = 'reserved'; // RED
        } else if (hasPartial) {
          equipmentStatus = 'partial'; // YELLOW
        }
      }
      
      // Determine final status
      if (equipmentStatus === 'reserved' || blockedMinutes >= totalBusinessMinutes) {
        next[dateKey] = 'reserved'; // RED
      } else if (equipmentStatus === 'partial' || blockedMinutes > 0) {
        next[dateKey] = 'partial'; // YELLOW
      } else {
        next[dateKey] = 'available'; // GREEN
      }
    });
    
    setDayStatuses(next);
  }, [availabilityBlocks]);

    useEffect(() => {
    if (visible) {
      console.log('[RescheduleModal] 🚀 MODAL OPENED - Starting initial data fetch');
      console.log('[RescheduleModal] Resources prop:', resources);
      console.log('[RescheduleModal] Reservation prop:', reservation);
      
      // Extract resource IDs directly from reservation (fetchRequestById data)
      // This is more reliable than depending on resources prop being passed correctly
      const extractedResources = {
        venueIds: (reservation?.venues || []).map(v => v.venue_id || v.ven_id).filter(id => id),
        vehicleIds: (reservation?.vehicles || []).map(v => v.vehicle_id).filter(id => id),
        equipment: (reservation?.equipment || []).map(eq => ({
          equipment_id: eq.equipment_id || eq.equip_id,
          name: eq.name || eq.equipment_name,
          quantity: parseInt(eq.quantity, 10) || 0
        })).filter(eq => eq.equipment_id)
      };
      
      console.log('[RescheduleModal] 📦 Extracted resources from reservation:', extractedResources);
      
      // Initialize driver assignments from existing vehicle data
      const initialDriverAssignments = {};
      const initialCustomDriverNames = {};
      
      if (reservation?.vehicles && Array.isArray(reservation.vehicles)) {
        reservation.vehicles.forEach(vehicle => {
          const vehicleId = vehicle.vehicle_id;
          const reservationVehicleId = vehicle.reservation_vehicle_id;
          
          // Find the driver assigned to this vehicle from the drivers array
          const assignedDriver = (reservation.drivers || []).find(driver => 
            driver.reservation_vehicle_id && 
            String(driver.reservation_vehicle_id) === String(reservationVehicleId)
          );
          
          console.log('[RescheduleModal] Checking vehicle for driver:', {
            vehicleId,
            reservationVehicleId,
            assignedDriver,
            vehicleDriverId: vehicle.driver_id,
            vehicleDriverName: vehicle.driver_name
          });
          
          // Check if driver exists in the drivers array
          if (assignedDriver) {
            const driverId = assignedDriver.driver_id;
            const driverName = assignedDriver.driver_name;
            
            console.log('[RescheduleModal] Found driver in drivers array:', {
              vehicleId,
              driverId,
              driverName
            });
            
            // If there's a driver_id, it's a system driver from fetchDriver
            if (driverId && String(driverId).trim() !== '') {
              initialDriverAssignments[vehicleId] = String(driverId);
              console.log('[RescheduleModal] Set system driver from drivers array:', { vehicleId, driverId });
            }
            // If there's only a driver_name (no driver_id), it's a custom/default driver
            else if (driverName && String(driverName).trim() !== '') {
              initialDriverAssignments[vehicleId] = 'custom';
              initialCustomDriverNames[vehicleId] = driverName;
              console.log('[RescheduleModal] Set custom driver from drivers array:', { vehicleId, driverName });
            }
          }
          // Fallback: Check vehicle object directly (in case data structure is different)
          else if (vehicle.driver_id || vehicle.driver_name) {
            const driverId = vehicle.driver_id;
            const driverName = vehicle.driver_name;
            
            console.log('[RescheduleModal] Found driver on vehicle object:', {
              vehicleId,
              driverId,
              driverName
            });
            
            // If there's a driver_id, use it (system driver)
            if (driverId && String(driverId).trim() !== '') {
              initialDriverAssignments[vehicleId] = String(driverId);
              console.log('[RescheduleModal] Set system driver from vehicle:', { vehicleId, driverId });
            }
            // If there's only a driver_name (no driver_id), it's a custom driver
            else if (driverName && String(driverName).trim() !== '') {
              initialDriverAssignments[vehicleId] = 'custom';
              initialCustomDriverNames[vehicleId] = driverName;
              console.log('[RescheduleModal] Set custom driver from vehicle:', { vehicleId, driverName });
            }
          }
        });
      }
      
      console.log('[RescheduleModal] 🚗 Initialized driver assignments:', {
        initialDriverAssignments,
        initialCustomDriverNames
      });
      
      setVehicleDriverAssignments(initialDriverAssignments);
      setCustomDriverNames(initialCustomDriverNames);
      
      form.resetFields();
      // Explicitly clear values so inputs render empty
      form.setFieldsValue({
        startDate: null,
        startTime: null,
        endDate: null,
        endTime: null,
        // Set to undefined so Select shows placeholder (no default selection)
        venueIds: (reservation?.venues || []).map(() => undefined),
        vehicleIds: (reservation?.vehicles || []).map(() => undefined),
      });
      // Clear lists initially; will fetch available ones once full date-time range is selected
      setVenues([]);
      setVehicles([]);
      
      // Immediately fetch availability blocks when modal opens
      console.log('[RescheduleModal] 📊 Calling refetchBlocks() to fetch availability for all resources...');
      // Don't fetch drivers on initial modal open - wait for date range selection
      refetchBlocks();
    }
  }, [visible, resources, form, refetchBlocks, fetchVenues, fetchVehicles, reservation]);

  // When full date-time range is selected, fetch available venues and vehicles
  useEffect(() => {
    if (!visible) return;
    if (!isDateTimeRangeReady) {
      setVenues([]);
      setVehicles([]);
      setDrivers([]); // Clear drivers when date range is not ready
      return;
    }
    const start = dayjs(startDateVal).hour(dayjs(startTimeVal).hour()).minute(0).second(0);
    const end = dayjs(endDateVal).hour(dayjs(endTimeVal).hour()).minute(0).second(0);
    const startStr = start.format('YYYY-MM-DD HH:mm:ss');
    const endStr = end.format('YYYY-MM-DD HH:mm:ss');
    
    // Use the same resource IDs that are being checked for availability
    const toNums = (arr) => (arr || []).map(v => Number(v)).filter(v => !Number.isNaN(v));
    const selectedVenueIds = Array.isArray(form.getFieldValue('venueIds')) 
      ? toNums(form.getFieldValue('venueIds').filter(Boolean)) 
      : null;
    const selectedVehicleIds = Array.isArray(form.getFieldValue('vehicleIds')) 
      ? toNums(form.getFieldValue('vehicleIds').filter(Boolean)) 
      : null;

    // Extract IDs for exclude list - only send original IDs, not change IDs
    // const extractVenueIds = (venueData) => {
    //   if (!Array.isArray(venueData)) return [];
    //   return venueData.map(v => {
    //     if (typeof v === 'object' && v !== null) {
    //       // Only return the original venue_id, not change_venue_id
    //       return v.venue_id;
    //     }
    //     return v;
    //   }).filter(id => id != null);
    // };

    // const extractVehicleIds = (vehicleData) => {
    //   if (!Array.isArray(vehicleData)) return [];
    //   return vehicleData.map(v => {
    //     if (typeof v === 'object' && v !== null) {
    //       // Only return the original vehicle_id, not change_vehicle_id
    //       return v.vehicle_id;
    //     }
    //     return v;
    //   }).filter(id => id != null);
    // };

    // Extract IDs directly from reservation prop instead of relying on resources prop
    const reservationVenueIds = (reservation?.venues || []).map(v => v.venue_id || v.ven_id).filter(id => id);
    const reservationVehicleIds = (reservation?.vehicles || []).map(v => v.vehicle_id).filter(id => id);
    
    const venueExcludeIds = (selectedVenueIds && selectedVenueIds.length) 
      ? selectedVenueIds 
      : reservationVenueIds;
    const vehicleExcludeIds = (selectedVehicleIds && selectedVehicleIds.length) 
      ? selectedVehicleIds 
      : reservationVehicleIds;
    
    let cancelled = false;
    const run = async () => {
      setResourceLoading(true);
      try {
        const [v1, v2, d1] = await Promise.all([
          fetchAvailableVenuesByRange(startStr, endStr, venueExcludeIds),
          fetchAvailableVehiclesByRange(startStr, endStr, vehicleExcludeIds),
          fetchAvailableDriversByRange(startStr, endStr) // Pass date range to filter drivers
        ]);
        if (!cancelled) {
          setVenues(v1 || []);
          setVehicles(v2 || []);
          setDrivers(d1 || []);
          
          // Auto-select change_venue_id and change_vehicle_id if they exist and are available
          const autoSelectValues = {};
          
          // Handle venue auto-selection
          if (resources?.venueIds && Array.isArray(resources.venueIds)) {
            const venueSelections = [];
            resources.venueIds.forEach((venueResource, index) => {
              if (typeof venueResource === 'object' && venueResource !== null) {
                const changeVenueId = venueResource.change_venue_id;
                if (changeVenueId && String(changeVenueId).trim() !== '') {
                  // Check if change_venue_id is available in the fetched venues (compare as strings)
                  const isAvailable = (v1 || []).some(venue => String(venue.ven_id) === String(changeVenueId));
                  console.log('[RescheduleModal] Venue auto-selection check:', {
                    changeVenueId,
                    availableVenues: (v1 || []).map(v => ({ id: v.ven_id, name: v.ven_name })),
                    isAvailable
                  });
                  if (isAvailable) {
                    venueSelections[index] = String(changeVenueId);
                  }
                }
              }
            });
            if (venueSelections.length > 0) {
              autoSelectValues.venueIds = venueSelections;
              console.log('[RescheduleModal] Auto-selecting venues:', venueSelections);
            }
          }
          
          // Handle vehicle auto-selection
          if (resources?.vehicleIds && Array.isArray(resources.vehicleIds)) {
            const vehicleSelections = [];
            resources.vehicleIds.forEach((vehicleResource, index) => {
              if (typeof vehicleResource === 'object' && vehicleResource !== null) {
                const changeVehicleId = vehicleResource.change_vehicle_id;
                if (changeVehicleId && String(changeVehicleId).trim() !== '') {
                  // Check if change_vehicle_id is available in the fetched vehicles (compare as strings)
                  const isAvailable = (v2 || []).some(vehicle => String(vehicle.vehicle_id) === String(changeVehicleId));
                  console.log('[RescheduleModal] Vehicle auto-selection check:', {
                    changeVehicleId,
                    availableVehicles: (v2 || []).map(v => ({ id: v.vehicle_id, name: v.vehicle_name })),
                    isAvailable
                  });
                  if (isAvailable) {
                    vehicleSelections[index] = String(changeVehicleId);
                  }
                }
              }
            });
            if (vehicleSelections.length > 0) {
              autoSelectValues.vehicleIds = vehicleSelections;
              console.log('[RescheduleModal] Auto-selecting vehicles:', vehicleSelections);
            }
          }
          
          // Apply auto-selections to form
          if (Object.keys(autoSelectValues).length > 0) {
            console.log('[RescheduleModal] Applying auto-selections to form:', autoSelectValues);
            form.setFieldsValue(autoSelectValues);
            console.log('[RescheduleModal] Form values after auto-selection:', form.getFieldsValue());
          }
        }
      } catch (_) {
        if (!cancelled) {
          setVenues([]);
          setVehicles([]);
          setDrivers([]);
        }
      } finally {
        if (!cancelled) setResourceLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [visible, isDateTimeRangeReady, startDateVal, startTimeVal, endDateVal, endTimeVal, fetchAvailableVenuesByRange, fetchAvailableVehiclesByRange, fetchAvailableDriversByRange, form, resources, resources?.vehicleIds, resources?.venueIds, reservation?.vehicles, reservation?.venues]);

  const checkAvailability = async (values) => {
    const { startDate, startTime, endDate, endTime } = values;
    const start = dayjs(startDate).hour(dayjs(startTime).hour()).minute(0).second(0);
    const end = dayjs(endDate).hour(dayjs(endTime).hour()).minute(0).second(0);
    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return false;
    
    // Check advance booking rules for venues
    const hasVenues = reservation?.venues && Array.isArray(reservation.venues) && reservation.venues.length > 0;
    if (hasVenues) {
      const minSelectableDate = getMinSelectableDate();
      if (start.isBefore(dayjs(minSelectableDate).startOf('day'))) {
        const advanceMsg = 'You must book this venue at least 2-3 days in advance';
        
        // Only show error if user doesn't have bypass privileges
        if (!((userLevel === '#' && userDepartment === '#') ||
              (userLevel === '#' && userDepartment === '#'))) {
          message.error(advanceMsg);
          return false;
        }
      }
    }
    
    const oStart = dayjs(originalStart);
    const oEnd = dayjs(originalEnd);
    const blocks = (oStart.isValid() && oEnd.isValid())
      ? availabilityBlocks.filter(b => !(b.start.isSame(oStart) && b.end.isSame(oEnd)))
      : availabilityBlocks;
    
    // Check for overlaps
    const overlappingBlocks = blocks.filter(b => start.isBefore(b.end) && end.isAfter(b.start));
    
    if (overlappingBlocks.length > 0) {
      // Check if all conflicts are equipment with sufficient quantity
      const equipmentConflicts = overlappingBlocks.filter(b => b.equip_id);
      const nonEquipmentConflicts = overlappingBlocks.filter(b => !b.equip_id);
      
      // If there are venue/vehicle conflicts, block it
      if (nonEquipmentConflicts.length > 0) {
        message.error('Selected time conflicts with existing reservations.');
        return false;
      }
      
      // Check equipment availability
      if (equipmentConflicts.length > 0) {
        const equipMap = {};
        
        equipmentConflicts.forEach(block => {
          const equipId = block.equip_id;
          if (!equipMap[equipId]) {
            equipMap[equipId] = {
              currentQuantity: block.current_quantity,
              requestedQuantity: block.requested_quantity,
              reservedQuantity: 0
            };
          }
          equipMap[equipId].reservedQuantity += (block.reserved_quantity || 0);
        });
        
        // Check if any equipment doesn't have enough available
        const insufficientEquipment = Object.values(equipMap).some(equip => {
          const available = equip.currentQuantity - equip.reservedQuantity;
          return available < equip.requestedQuantity;
        });
        
        if (insufficientEquipment) {
          message.error('Selected time conflicts with existing reservations - insufficient equipment quantity.');
          return false;
        }
        
        // All equipment has enough quantity - allow the reschedule
        console.log('[RescheduleModal] Equipment conflicts but sufficient quantity available');
      }
    }
    
    return true;
  };

  const handleFormValuesChange = (_, allValues) => {
    try {
      const { startDate, startTime, endDate, endTime } = allValues || {};
      const start = dayjs(startDate).hour(dayjs(startTime).hour()).minute(0).second(0);
      const end = dayjs(endDate).hour(dayjs(endTime).hour()).minute(0).second(0);
      if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
        setConflictInfo(null);
        return;
      }
      const oStart = dayjs(originalStart);
      const oEnd = dayjs(originalEnd);
      const blocks = (oStart.isValid() && oEnd.isValid())
        ? availabilityBlocks.filter(b => !(b.start.isSame(oStart) && b.end.isSame(oEnd)))
        : availabilityBlocks;
      
      const overlappingBlocks = blocks.filter(b => start.isBefore(b.end) && end.isAfter(b.start));
      
      if (overlappingBlocks.length > 0) {
        // Separate equipment from venue/vehicle conflicts
        const equipmentConflicts = overlappingBlocks.filter(b => b.equip_id);
        const nonEquipmentConflicts = overlappingBlocks.filter(b => !b.equip_id);
        
        // If there are venue/vehicle conflicts, show error
        if (nonEquipmentConflicts.length > 0) {
          setConflictInfo({ hasConflict: true, message: 'Selected time conflicts with existing reservations.' });
          return;
        }
        
        // Check equipment availability
        if (equipmentConflicts.length > 0) {
          const equipMap = {};
          
          equipmentConflicts.forEach(block => {
            const equipId = block.equip_id;
            if (!equipMap[equipId]) {
              equipMap[equipId] = {
                currentQuantity: block.current_quantity,
                requestedQuantity: block.requested_quantity,
                reservedQuantity: 0
              };
            }
            equipMap[equipId].reservedQuantity += (block.reserved_quantity || 0);
          });
          
          // Check if any equipment doesn't have enough available
          const insufficientEquipment = Object.values(equipMap).some(equip => {
            const available = equip.currentQuantity - equip.reservedQuantity;
            return available < equip.requestedQuantity;
          });
          
          if (insufficientEquipment) {
            setConflictInfo({ hasConflict: true, message: 'Selected time conflicts with existing reservations - insufficient equipment quantity.' });
          } else {
            setConflictInfo(null);
          }
        }
      } else {
        setConflictInfo(null);
      }
    } catch (e) {
      setConflictInfo(null);
    }
  };

  // Immediate conflict checking when all date/time fields are filled
  useEffect(() => {
    console.log('[RescheduleModal] Conflict check useEffect triggered:', {
      visible,
      startDateVal: startDateVal ? dayjs(startDateVal).format('YYYY-MM-DD') : null,
      startTimeVal: startTimeVal ? dayjs(startTimeVal).format('h A') : null,
      endDateVal: endDateVal ? dayjs(endDateVal).format('YYYY-MM-DD') : null,
      endTimeVal: endTimeVal ? dayjs(endTimeVal).format('h A') : null,
      availabilityBlocksCount: availabilityBlocks.length
    });
    
    if (!visible) {
      console.log('[RescheduleModal] Modal not visible, skipping conflict check');
      return;
    }
    
    try {
      // Check if all date/time fields are filled
      if (!startDateVal || !startTimeVal || !endDateVal || !endTimeVal) {
        console.log('[RescheduleModal] Not all date/time fields filled, clearing conflict');
        setConflictInfo(null);
        return;
      }

      const start = dayjs(startDateVal).hour(dayjs(startTimeVal).hour()).minute(0).second(0);
      const end = dayjs(endDateVal).hour(dayjs(endTimeVal).hour()).minute(0).second(0);
      
      console.log('[RescheduleModal] Checking conflict for range:', {
        start: start.format('YYYY-MM-DD HH:mm:ss'),
        end: end.format('YYYY-MM-DD HH:mm:ss'),
        isStartValid: start.isValid(),
        isEndValid: end.isValid(),
        endAfterStart: end.isAfter(start)
      });
      
      if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
        console.log('[RescheduleModal] Invalid date range, clearing conflict');
        setConflictInfo(null);
        return;
      }

      // Check for conflicts
      const oStart = dayjs(originalStart);
      const oEnd = dayjs(originalEnd);
      const blocks = (oStart.isValid() && oEnd.isValid())
        ? availabilityBlocks.filter(b => !(b.start.isSame(oStart) && b.end.isSame(oEnd)))
        : availabilityBlocks;
      
      console.log('[RescheduleModal] Availability blocks to check:', {
        totalBlocks: availabilityBlocks.length,
        blocksAfterFilter: blocks.length,
        originalStart: oStart.isValid() ? oStart.format('YYYY-MM-DD HH:mm:ss') : null,
        originalEnd: oEnd.isValid() ? oEnd.format('YYYY-MM-DD HH:mm:ss') : null
      });
      
      const overlappingBlocks = blocks.filter(b => start.isBefore(b.end) && end.isAfter(b.start));
      
      if (overlappingBlocks.length > 0) {
        console.log('[RescheduleModal] ⚠️ OVERLAPS DETECTED:', {
          selectedStart: start.format('YYYY-MM-DD HH:mm:ss'),
          selectedEnd: end.format('YYYY-MM-DD HH:mm:ss'),
          conflictingBlocks: overlappingBlocks.map(b => ({
            start: b.start.format('YYYY-MM-DD HH:mm:ss'),
            end: b.end.format('YYYY-MM-DD HH:mm:ss'),
            reservation_id: b.reservation_id,
            equip_id: b.equip_id
          }))
        });
        
        // Separate equipment from venue/vehicle conflicts
        const equipmentConflicts = overlappingBlocks.filter(b => b.equip_id);
        const nonEquipmentConflicts = overlappingBlocks.filter(b => !b.equip_id);
        
        // If there are venue/vehicle conflicts, show error
        if (nonEquipmentConflicts.length > 0) {
          console.log('[RescheduleModal] ❌ Venue/Vehicle conflicts detected');
          setConflictInfo({ hasConflict: true, message: 'Selected time conflicts with existing reservations.' });
          return;
        }
        
        // Check equipment availability
        if (equipmentConflicts.length > 0) {
          const equipMap = {};
          
          equipmentConflicts.forEach(block => {
            const equipId = block.equip_id;
            if (!equipMap[equipId]) {
              equipMap[equipId] = {
                currentQuantity: block.current_quantity,
                requestedQuantity: block.requested_quantity,
                reservedQuantity: 0
              };
            }
            equipMap[equipId].reservedQuantity += (block.reserved_quantity || 0);
          });
          
          console.log('[RescheduleModal] Equipment availability check:', equipMap);
          
          // Check if any equipment doesn't have enough available
          const insufficientEquipment = Object.values(equipMap).some(equip => {
            const available = equip.currentQuantity - equip.reservedQuantity;
            console.log('[RescheduleModal] Equipment check:', {
              available,
              requested: equip.requestedQuantity,
              sufficient: available >= equip.requestedQuantity
            });
            return available < equip.requestedQuantity;
          });
          
          if (insufficientEquipment) {
            console.log('[RescheduleModal] ❌ Insufficient equipment quantity');
            setConflictInfo({ hasConflict: true, message: 'Selected time conflicts with existing reservations - insufficient equipment quantity.' });
          } else {
            console.log('[RescheduleModal] ✅ Equipment has sufficient quantity, allowing reschedule');
            setConflictInfo(null);
          }
        }
      } else {
        console.log('[RescheduleModal] ✅ No conflicts detected, clearing conflictInfo');
        setConflictInfo(null);
      }
    } catch (e) {
      console.error('[RescheduleModal] Error checking conflicts:', e);
      setConflictInfo(null);
    }
  }, [visible, startDateVal, startTimeVal, endDateVal, endTimeVal, availabilityBlocks, originalStart, originalEnd]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('[RescheduleModal] handleSubmit started');
      const values = await form.validateFields();
      console.log('[RescheduleModal] Form values validated:', values);
      
      const isAvailable = await checkAvailability(values);
      console.log('[RescheduleModal] Availability check result:', isAvailable);
      
      if (!isAvailable) {
        console.log('[RescheduleModal] Time slot not available, stopping submission');
        message.error('Selected time slot is not available. Please choose another time.');
        return;
      }

      const start = dayjs(values.startDate).hour(dayjs(values.startTime).hour()).minute(0).second(0);
      const end = dayjs(values.endDate).hour(dayjs(values.endTime).hour()).minute(0).second(0);
      
      // Process venue IDs - preserve null/undefined for cleared selections
      const processedVenueIds = Array.isArray(values.venueIds) 
        ? values.venueIds.map(v => {
            if (v === null || v === undefined || v === '') return null;
            const num = Number(v);
            return Number.isNaN(num) ? null : num;
          })
        : [];
      
      // Process vehicle IDs - preserve null/undefined for cleared selections  
      const processedVehicleIds = Array.isArray(values.vehicleIds)
        ? values.vehicleIds.map(v => {
            if (v === null || v === undefined || v === '') return null;
            const num = Number(v);
            return Number.isNaN(num) ? null : num;
          })
        : [];
      
      console.log('[RescheduleModal] Processing form data:', {
        rawVenueIds: values.venueIds,
        rawVehicleIds: values.vehicleIds,
        processedVenueIds,
        processedVehicleIds,
        startDate: start.format('YYYY-MM-DD HH:mm:ss'),
        endDate: end.format('YYYY-MM-DD HH:mm:ss')
      });
      
      const rescheduleData = {
        ...values,
        startDate: start.format('YYYY-MM-DD HH:mm:ss'),
        endDate: end.format('YYYY-MM-DD HH:mm:ss'),
        newVenueIds: processedVenueIds,
        newVehicleIds: processedVehicleIds,
        driverAssignments: vehicleDriverAssignments,
        customDriverNames: customDriverNames,
      };
      
      console.log('[RescheduleModal] Calling onReschedule with data:', rescheduleData);
      await onReschedule(rescheduleData);
    } catch (error) {
      console.error('[RescheduleModal] Error submitting form:', error);
      setLoading(false);
    }
  };

  const handleRequestAgain = async () => {
    try {
      setLoading(true);
      console.log('[RescheduleModal] handleRequestAgain started');
      const values = await form.validateFields();
      console.log('[RescheduleModal] Form values validated for request again:', values);

      const start = dayjs(values.startDate).hour(dayjs(values.startTime).hour()).minute(0).second(0);
      const end = dayjs(values.endDate).hour(dayjs(values.endTime).hour()).minute(0).second(0);
      
      // Process venue IDs - preserve null/undefined for cleared selections
      const processedVenueIds = Array.isArray(values.venueIds) 
        ? values.venueIds.map(v => {
            if (v === null || v === undefined || v === '') return null;
            const num = Number(v);
            return Number.isNaN(num) ? null : num;
          })
        : [];
      
      // Process vehicle IDs - preserve null/undefined for cleared selections  
      const processedVehicleIds = Array.isArray(values.vehicleIds)
        ? values.vehicleIds.map(v => {
            if (v === null || v === undefined || v === '') return null;
            const num = Number(v);
            return Number.isNaN(num) ? null : num;
          })
        : [];
      
      const requestAgainData = {
        ...values,
        startDate: start.format('YYYY-MM-DD HH:mm:ss'),
        endDate: end.format('YYYY-MM-DD HH:mm:ss'),
        newVenueIds: processedVenueIds,
        newVehicleIds: processedVehicleIds,
        driverAssignments: vehicleDriverAssignments,
        customDriverNames: customDriverNames,
        isRequestAgain: true // Flag to indicate this is a "request again" action
      };
      
      console.log('[RescheduleModal] Calling onRequestAgain with data:', requestAgainData);
      if (onRequestAgain) {
        onRequestAgain(requestAgainData);
      } else {
        message.warning('Request Again functionality not implemented yet.');
      }
    } catch (error) {
      console.error('[RescheduleModal] Error in handleRequestAgain:', error);
      message.error('Please fill in all required fields before requesting again.');
    } finally {
      setLoading(false);
    }
  };

  // Disable logic for Start/End with venue advance booking rules
  const disabledDateStart = (current) => {
    if (!current) return false;
    const cur = dayjs(current);
    if (!cur.isValid()) return false;
    const key = cur.format('YYYY-MM-DD');
    const isFull = dayStatuses[key] === 'reserved';
    
    // Apply advance booking rules
    const minSelectableDate = getMinSelectableDate();
    const isBeforeMinDate = cur.isBefore(dayjs(minSelectableDate).startOf('day'));
    
    return isBeforeMinDate || isFull;
  };

  const disabledDateEnd = (current) => {
    if (!current) return false;
    const cur = dayjs(current);
    if (!cur.isValid()) return false;
    const start = form.getFieldValue('startDate');
    const key = cur.format('YYYY-MM-DD');
    const isFull = dayStatuses[key] === 'reserved';
    if (isFull) return true;
    if (!start) return cur.isBefore(dayjs().startOf('day'));
    return cur.startOf('day').isBefore(dayjs(start).startOf('day'));
  };

  // Common time disabling + business hours + conflict blocking
  const BUSINESS_START_HOUR = 4; // 4 AM
  const BUSINESS_END_HOUR = 22; // 10 PM

  const disabledHoursForDate = (dateValue, extraBlockAfterHour = null) => {
    const date = dateValue ? dayjs(dateValue) : null;
    const toLabel = (h) => dayjs().hour(h).minute(0).second(0).format('h A');
    const blocksForDate = date
      ? availabilityBlocks.filter(b =>
          dayjs(date).endOf('day').isAfter(b.start) && dayjs(date).startOf('day').isBefore(b.end)
        )
      : [];
    const isHourBlocked = (hour) => {
      if (!date) return false;
      const startOfHour = dayjs(date).hour(hour).minute(0).second(0);
      const endOfHour = startOfHour.add(1, 'hour');
      // Default: block if the hour slot [startOfHour, endOfHour) overlaps any block
      const overlaps = availabilityBlocks.some(b => startOfHour.isBefore(b.end) && endOfHour.isAfter(b.start));
      if (overlaps) return true;
      // Inclusive end-hour rule: if a block ends exactly at the top of an hour (e.g., 17:00),
      // also disable that hour (e.g., 5 PM) so 13:00–17:00 blocks 1 PM through 5 PM (5 hours).
      const inclusiveEndHit = availabilityBlocks.some(b =>
        b.end.minute() === 0 && b.end.second() === 0 && startOfHour.isSame(b.end, 'hour')
      );
      return inclusiveEndHit;
    };
    const arr = [];
    const businessDisabled = [];
    const conflictDisabled = [];
    const extraDisabled = [];
    for (let h = 0; h < 24; h++) {
      if (h < BUSINESS_START_HOUR || h >= BUSINESS_END_HOUR) { arr.push(h); businessDisabled.push(h); continue; }
      if (isHourBlocked(h)) { arr.push(h); conflictDisabled.push(h); continue; }
      if (extraBlockAfterHour != null && h <= extraBlockAfterHour) { arr.push(h); extraDisabled.push(h); continue; }
    }
    const result = Array.from(new Set(arr)).sort((a, b) => a - b);
    try {
      // Debug log: show which hours are disabled and why
      console.log('[RescheduleModal] disabledHoursForDate', {
        date: date ? date.format('YYYY-MM-DD') : null,
        extraBlockAfterHour,
        overlappingBlocks: blocksForDate.map(b => ({ start: b.start.format('YYYY-MM-DD HH:mm'), end: b.end.format('YYYY-MM-DD HH:mm') })),
        businessDisabled,
        businessDisabledLabels: businessDisabled.map(toLabel),
        conflictDisabled,
        conflictDisabledLabels: conflictDisabled.map(toLabel),
        extraDisabled,
        extraDisabledLabels: extraDisabled.map(toLabel),
        result,
        resultLabels: result.map(toLabel),
      });
    } catch(e) { /* noop */ }
    return result;
  };

  // Color date cells: green (available), yellow (partial), grey (reserved)
  const dateCellRender = (current) => {
    const cur = dayjs(current);
    if (!cur.isValid()) {
      return <div className="ant-picker-cell-inner">&nbsp;</div>;
    }
    const key = cur.format('YYYY-MM-DD');
    const status = dayStatuses[key];
    let bg = null;
    if (status === 'available') bg = '#ECFDF5'; // green-50
    else if (status === 'partial') bg = '#FEF3C7'; // amber-100
    else if (status === 'reserved') bg = '#E5E7EB'; // gray-200
    const style = bg ? { backgroundColor: bg, borderRadius: 6 } : undefined;
    return (
      <div className="ant-picker-cell-inner" style={style}>{cur.date()}</div>
    );
  };

  // Helper function to check if all vehicles have driver assignments
  const areAllVehiclesAssigned = () => {
    // If no vehicles, return true (no validation needed)
    if (!reservation?.vehicles || reservation.vehicles.length === 0) {
      return true;
    }
    
    // Check each vehicle for driver assignment
    for (const vehicle of reservation.vehicles) {
      const vehicleId = vehicle.vehicle_id;
      const driverAssignment = vehicleDriverAssignments[vehicleId];
      
      // If no driver assignment, return false
      if (!driverAssignment) {
        console.log('[RescheduleModal] Vehicle missing driver assignment:', vehicleId);
        return false;
      }
      
      // If driver assignment is 'custom', check if custom name is filled
      if (driverAssignment === 'custom') {
        const customName = customDriverNames[vehicleId];
        if (!customName || customName.trim() === '') {
          console.log('[RescheduleModal] Custom driver name missing for vehicle:', vehicleId);
          return false;
        }
      }
    }
    
    console.log('[RescheduleModal] All vehicles have valid driver assignments');
    return true;
  };

  // Mobile footer for Drawer
  const getMobileFooter = () => {
    const allVehiclesAssigned = areAllVehiclesAssigned();
    const isButtonDisabled = !isDateTimeRangeReady || conflictInfo?.hasConflict || !allVehiclesAssigned;
    
    console.log('[RescheduleModal] Mobile button state:', {
      isDateTimeRangeReady,
      hasConflict: conflictInfo?.hasConflict,
      conflictInfo,
      allVehiclesAssigned,
      isButtonDisabled
    });
    
    const buttons = [
      <Button 
        key="cancel" 
        onClick={onCancel}
        block
        size="large"
        style={{ marginBottom: '8px' }}
      >
        Cancel
      </Button>,
      ...(showRequestAgainButton ? [
        <Button 
          key="request-again" 
          type="default" 
          onClick={handleRequestAgain}
          loading={loading || checkingAvailability}
          disabled={isButtonDisabled}
          block
          size="large"
          style={{ marginBottom: '8px' }}
        >
          Request Again to Reschedule
        </Button>
      ] : []),
      ...(!hideRescheduleButton ? [
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={loading || checkingAvailability}
          disabled={isButtonDisabled}
          block
          size="large"
        >
          {checkingAvailability ? 'Checking Availability...' : 'Reschedule'}
        </Button>
      ] : []),
    ];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {buttons}
      </div>
    );
  };

  // Desktop footer for Modal
  const getDesktopFooter = () => {
    const allVehiclesAssigned = areAllVehiclesAssigned();
    const isButtonDisabled = !isDateTimeRangeReady || conflictInfo?.hasConflict || !allVehiclesAssigned;
    
    console.log('[RescheduleModal] Desktop button state:', {
      isDateTimeRangeReady,
      hasConflict: conflictInfo?.hasConflict,
      conflictInfo,
      allVehiclesAssigned,
      isButtonDisabled
    });
    
    return [
      <Button key="cancel" onClick={onCancel} size={isTablet ? "middle" : "default"}>
        Cancel
      </Button>,
      ...(showRequestAgainButton ? [
        <Button 
          key="request-again" 
          type="default" 
          onClick={handleRequestAgain}
          loading={loading || checkingAvailability}
          disabled={isButtonDisabled}
          size={isTablet ? "middle" : "default"}
        >
          Request Again to Reschedule
        </Button>
      ] : []),
      ...(!hideRescheduleButton ? [
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={loading || checkingAvailability}
          disabled={isButtonDisabled}
          size={isTablet ? "middle" : "default"}
        >
          {checkingAvailability ? 'Checking Availability...' : 'Reschedule'}
        </Button>
      ] : []),
    ];
  };

  // Responsive title
  const getTitle = () => (
    <div>
      <span className={isMobile ? 'text-base font-semibold' : 'text-lg font-semibold'}>
        Reschedule Reservation
      </span>
      {reservation && (
        <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-normal text-gray-600 mt-1`}>
          {reservation.reservation_title || reservation.title || `Reservation ID: ${reservation.reservation_id}`}
          {reservation.reservation_start_date && reservation.reservation_end_date && (
            <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-0.5`}>
              Current: {dayjs(reservation.reservation_start_date).format('MMM DD, YYYY HH:mm')} - {dayjs(reservation.reservation_end_date).format('MMM DD, YYYY HH:mm')}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Form content JSX to avoid duplication
  // Using direct JSX instead of component function to prevent input focus loss
  const formContentJSX = (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startDate: null,
          startTime: null,
          endDate: null,
          endTime: null,
        }}
        onValuesChange={handleFormValuesChange}
      >
          {/* <Alert
            type="info"
            showIcon
            message={(() => {
              let baseMessage = "Select new date and time to reschedule. Changing venue and vehicle is optional — leave selectors empty to keep current assignments.";
              
              // Add venue advance booking notice if applicable
              if (resources?.venueIds && Array.isArray(resources.venueIds) && resources.venueIds.length > 0) {
                const advanceMsg = " Note: This venue requires 2-3 days advance booking.";
                
                // Only show notice if user doesn't have bypass privileges
                if (!((userLevel === 'Department Head' && userDepartment === 'COO') ||
                      (userLevel === 'Secretary' && userDepartment === 'GSD'))) {
                  baseMessage += advanceMsg;
                }
              }
              
              return baseMessage;
            })()
            }
            style={{ marginBottom: isMobile ? 12 : 16, fontSize: isMobile ? '12px' : '14px' }}
          /> */}
          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            size={isMobile ? "large" : "default"}
            disabledDate={disabledDateStart}
            showNow={false}
            allowClear
            placeholder="Select start date"
            cellRender={dateCellRender}
            popupClassName="reschedule-modal-popup"
            getPopupContainer={(trigger) => trigger.parentNode}
            onChange={(newStartDate) => {
              // If the new start date is greater than the current end date, clear the end date
              const currentEndDate = form.getFieldValue('endDate');
              if (newStartDate && currentEndDate) {
                const startDay = dayjs(newStartDate).startOf('day');
                const endDay = dayjs(currentEndDate).startOf('day');
                if (startDay.isAfter(endDay)) {
                  console.log('[RescheduleModal] Start date is after end date, clearing end date');
                  form.setFieldsValue({ endDate: null, endTime: null });
                }
              }
            }}
          />
          </Form.Item>

          <Form.Item
            label="Start Time"
            name="startTime"
            dependencies={["startDate"]}
            rules={[{ required: true, message: 'Please select start time' }]}
          >
            <TimePicker
              use12Hours
              format="h A"
              minuteStep={60}
              showNow={false}
              style={{ width: '100%' }}
              size={isMobile ? "large" : "default"}
              allowClear
              defaultOpenValue={dayjs().hour(4).minute(0).second(0)}
              placeholder="Select start time"
              onSelect={(val) => {
                // Apply immediately so validation passes and OK is enabled
                form.setFieldsValue({ startTime: val });
              }}
              onChange={(val) => {
                form.setFieldsValue({ startTime: val });
              }}
              disabledHours={() => {
                const d = form.getFieldValue('startDate');
                return disabledHoursForDate(d);
              }}
              getPopupContainer={(trigger) => trigger.parentNode}
              />
          </Form.Item>

          <Form.Item shouldUpdate={(prev, cur) => prev.startDate !== cur.startDate || prev.startTime !== cur.startTime} noStyle>
            {() => {
              const endDateDisabled = !startDateVal || !startTimeVal;
              return (
                <Form.Item
                  label="End Date"
                  name="endDate"
                  rules={[
                    { required: true, message: 'Please select end date' },
                    {
                      validator: (_, value) => {
                        const start = form.getFieldValue('startDate');
                        if (!value || !start || dayjs(value).isAfter(dayjs(start)) || dayjs(value).isSame(dayjs(start), 'day')) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('End date must be on/after start date'));
                      }
                    }
                  ]}
                >
                  <DatePicker
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                    size={isMobile ? "large" : "default"}
                    disabled={endDateDisabled}
                    disabledDate={disabledDateEnd}
                    showNow={false}
                    allowClear
                    placeholder="Select end date"
                    cellRender={dateCellRender}
                    popupClassName="reschedule-modal-popup"
                    getPopupContainer={(trigger) => trigger.parentNode}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item shouldUpdate={(prev, cur) => prev.startDate !== cur.startDate || prev.startTime !== cur.startTime || prev.endDate !== cur.endDate} noStyle>
            {() => {
              const endTimeDisabled = !startDateVal || !startTimeVal || !endDateVal;
              return (
                <Form.Item
                  label="End Time"
                  name="endTime"
                  rules={[{ required: true, message: 'Please select end time' }]}
                >
                  <TimePicker
                    use12Hours
                    format="h A"
                    minuteStep={60}
                    showNow={false}
                    style={{ width: '100%' }}
                    size={isMobile ? "large" : "default"}
                    disabled={endTimeDisabled}
                    allowClear
                    defaultOpenValue={dayjs().hour(4).minute(0).second(0)}
                    placeholder="Select end time"
                    onSelect={(val) => {
                      form.setFieldsValue({ endTime: val });
                    }}
                    onChange={(val) => {
                      form.setFieldsValue({ endTime: val });
                    }}
                    disabledHours={() => {
                      const endDateVal = form.getFieldValue('endDate');
                      const startDateVal = form.getFieldValue('startDate');
                      const startTimeVal = form.getFieldValue('startTime');
                      const extra = (endDateVal && startDateVal && dayjs(endDateVal).isSame(dayjs(startDateVal), 'day'))
                        ? dayjs(startTimeVal || null).isValid() ? dayjs(startTimeVal).hour() : null
                        : null;
                      return disabledHoursForDate(endDateVal, extra);
                    }}
                    getPopupContainer={(trigger) => trigger.parentNode}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          {/* Guidance: resource changes optional */}
          <div style={{ 
            marginBottom: isMobile ? 6 : 8, 
            marginTop: -4, 
            color: '#6B7280', 
            fontSize: isMobile ? 11 : 12 
          }}>
            Note: Changing venue and vehicle is optional. Leave the fields below empty to keep the current assignments.
          </div>

          {conflictInfo?.hasConflict && (
            <Alert
              type="error"
              showIcon
              message={conflictInfo.message || 'Selected time conflicts with other reservations.'}
              style={{ marginBottom: isMobile ? 12 : 16, fontSize: isMobile ? '12px' : '14px' }}
            />
          )}

          {(reservation?.vehicles || []).length > 0 && !areAllVehiclesAssigned() && (
            <Alert
              type="warning"
              showIcon
              message="Please assign a driver to all vehicles before rescheduling."
              style={{ marginBottom: isMobile ? 12 : 16, fontSize: isMobile ? '12px' : '14px' }}
            />
          )}

          {(reservation?.venues || []).length > 0 && (
            <>
              {(reservation.venues || []).map((v, idx) => (
                <Form.Item
                  key={`venue-${idx}`}
                  label={`${v.venue_name || v.ven_name || 'Venue'} ->`}
                  name={['venueIds', idx]}
                  extra="Optional — leave empty to keep current venue"
                >
                  <Select 
                    placeholder={
                      conflictInfo?.hasConflict 
                        ? "Resolve time conflict first" 
                        : !isDateTimeRangeReady 
                          ? "Select date & time first" 
                          : "Select a venue"
                    }
                    disabled={!isDateTimeRangeReady || resourceLoading || conflictInfo?.hasConflict}
                    value={form.getFieldValue(['venueIds', idx])}
                    size={isMobile ? "large" : "default"}
                    allowClear
                    onSelect={(val, option) => {
                      const derivedId = (val && typeof val === 'object') ? (val.value ?? option?.value ?? null) : (val ?? option?.value ?? null);
                      try {
                        console.log('[RescheduleModal] Venue onSelect', {
                          idx,
                          val,
                          valType: typeof val,
                          optionValue: option?.value,
                          derivedId,
                          currentFormVenueIds: form.getFieldValue('venueIds'),
                          allFormValues: form.getFieldsValue()
                        });
                      } catch (_) {}
                    }}
                    onChange={(val, option) => {
                      const derivedId = (val && typeof val === 'object') ? (val.value ?? option?.value ?? null) : (val ?? option?.value ?? null);
                      const idStr = derivedId != null ? String(derivedId) : null;
                      const currentVenueIds = [...(form.getFieldValue('venueIds') || [])];
                      currentVenueIds[idx] = idStr;
                      form.setFieldsValue({ venueIds: currentVenueIds });
                      try {
                        console.log('[RescheduleModal] Venue onChange commit', {
                          idx,
                          raw: val,
                          rawType: typeof val,
                          optionValue: option?.value,
                          derivedId,
                          committed: idStr,
                          selectedArray: currentVenueIds,
                          formAfterUpdate: form.getFieldsValue()
                        });
                      } catch (_) {}
                      refetchBlocks({ venueIds: currentVenueIds });
                    }}
                    getPopupContainer={(trigger) => trigger.parentNode}
                    showSearch
                    optionFilterProp="children"
                  >
                    {venues.map(venue => (
                      <Option key={String(venue.ven_id)} value={String(venue.ven_id)}>
                        {venue.ven_name} (Capacity: {venue.ven_occupancy || 'N/A'})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ))}
            </>
          )}

          {(reservation?.vehicles || []).length > 0 && (
            <>
              {(reservation.vehicles || []).map((veh, idx) => {
                const vehicleId = veh.vehicle_id;
                const currentDriver = veh.driver_id || veh.driver_name;
                const driverAssignment = vehicleDriverAssignments[vehicleId];
                const customDriverName = customDriverNames[vehicleId] || '';
                
                return (
                  <div key={`vehicle-container-${vehicleId}-${idx}`} style={{ 
                    marginBottom: isMobile ? 16 : 20,
                    padding: isMobile ? 12 : 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    backgroundColor: '#f9fafb'
                  }}>
                    <Form.Item
                      label={`${veh.model || veh.vehicle_model_name || 'Vehicle'} ->`}
                      name={['vehicleIds', idx]}
                      extra="Optional — leave empty to keep current vehicle"
                      style={{ marginBottom: isMobile ? 12 : 16 }}
                    >
                      <Select 
                        placeholder={
                          conflictInfo?.hasConflict 
                            ? "Resolve time conflict first" 
                            : !isDateTimeRangeReady 
                              ? "Select date & time first" 
                              : "Select a vehicle"
                        }
                        disabled={!isDateTimeRangeReady || resourceLoading || conflictInfo?.hasConflict}
                        value={form.getFieldValue(['vehicleIds', idx])}
                        size={isMobile ? "large" : "default"}
                        allowClear
                        onSelect={(val, option) => {
                          const derivedId = (val && typeof val === 'object') ? (val.value ?? option?.value ?? null) : (val ?? option?.value ?? null);
                          try {
                            console.log('[RescheduleModal] Vehicle onSelect', {
                              idx,
                              val,
                              valType: typeof val,
                              optionValue: option?.value,
                              derivedId,
                              currentFormVehicleIds: form.getFieldValue('vehicleIds'),
                              allFormValues: form.getFieldsValue()
                            });
                          } catch (_) {}
                        }}
                        onChange={(val, option) => {
                          const derivedId = (val && typeof val === 'object') ? (val.value ?? option?.value ?? null) : (val ?? option?.value ?? null);
                          const idStr = derivedId != null ? String(derivedId) : null;
                          const currentVehicleIds = [...(form.getFieldValue('vehicleIds') || [])];
                          currentVehicleIds[idx] = idStr;
                          form.setFieldsValue({ vehicleIds: currentVehicleIds });
                          try {
                            console.log('[RescheduleModal] Vehicle onChange commit', {
                              idx,
                              raw: val,
                              rawType: typeof val,
                              optionValue: option?.value,
                              derivedId,
                              committed: idStr,
                              selectedArray: currentVehicleIds,
                              formAfterUpdate: form.getFieldsValue()
                            });
                          } catch (_) {}
                          refetchBlocks({ vehicleIds: currentVehicleIds });
                        }}
                        getPopupContainer={(trigger) => trigger.parentNode}
                        showSearch
                        optionFilterProp="children"
                      >
                        {vehicles.map(vehicle => (
                          <Option 
                            key={String(vehicle.vehicle_id)} 
                            value={String(vehicle.vehicle_id)}
                          >
                            {vehicle.vehicle_name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* Driver Assignment Section */}
                    <div style={{ marginTop: isMobile ? 8 : 12 }}>
                      <div style={{ 
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 500,
                        marginBottom: 8,
                        color: '#374151'
                      }}>
                        Driver Assignment {(() => {
                          // Find driver from reservation.drivers array
                          const assignedDriver = (reservation.drivers || []).find(driver => 
                            driver.reservation_vehicle_id && 
                            String(driver.reservation_vehicle_id) === String(veh.reservation_vehicle_id)
                          );
                          
                          if (assignedDriver && assignedDriver.driver_name) {
                            return `(Current: ${assignedDriver.driver_name})`;
                          } else if (currentDriver && veh.driver_name) {
                            return `(Current: ${veh.driver_name})`;
                          } else {
                            return '(No driver assigned)';
                          }
                        })()}
                      </div>
                      
                      <Select
                        placeholder={
                          conflictInfo?.hasConflict 
                            ? "Resolve time conflict first" 
                            : !isDateTimeRangeReady 
                              ? "Select date & time first" 
                              : "Select driver type"
                        }
                        value={driverAssignment || undefined}
                        size={isMobile ? "large" : "default"}
                        style={{ width: '100%' }}
                        disabled={!isDateTimeRangeReady || resourceLoading || conflictInfo?.hasConflict}
                        allowClear
                        onChange={(val) => {
                          console.log('[RescheduleModal] Driver assignment changed:', { vehicleId, val });
                          setVehicleDriverAssignments(prev => ({
                            ...prev,
                            [vehicleId]: val || undefined
                          }));
                          // Clear custom driver name if switching away from custom
                          if (val !== 'custom') {
                            setCustomDriverNames(prev => {
                              const updated = { ...prev };
                              delete updated[vehicleId];
                              return updated;
                            });
                          }
                        }}
                        getPopupContainer={(trigger) => trigger.parentNode}
                      >
                        <Option value="custom">Custom Driver Name</Option>
                        {drivers && drivers.length > 0 && (
                          <>
                            {drivers
                              .filter(driver => {
                                const driverUserId = String(driver.users_id);
                                
                                // Check if driver is already assigned to another vehicle in the form
                                const isAssignedToOtherVehicle = Object.entries(vehicleDriverAssignments).some(
                                  ([assignedVehicleId, assignedDriverId]) => {
                                    // Skip the current vehicle
                                    if (String(assignedVehicleId) === String(vehicleId)) return false;
                                    // Check if this driver is assigned to another vehicle
                                    return String(assignedDriverId) === driverUserId;
                                  }
                                );
                                
                                // Don't show drivers already assigned to other vehicles
                                if (isAssignedToOtherVehicle) {
                                  console.log('[RescheduleModal] Filtering out driver already assigned to another vehicle:', {
                                    driverName: `${driver.users_fname} ${driver.users_lname}`,
                                    driverId: driverUserId,
                                    currentVehicle: vehicleId
                                  });
                                  return false;
                                }
                                
                                // Show available drivers and drivers already assigned to this vehicle
                                const isAvailable = !driver.reservations || driver.reservations.length === 0;
                                const isAssignedToThis = currentDriver && String(driver.users_id) === String(veh.driver_id);
                                return isAvailable || isAssignedToThis;
                              })
                              .map(driver => (
                                <Option key={driver.users_id} value={String(driver.users_id)}>
                                  {`${driver.users_fname} ${driver.users_lname}`.trim()} 
                                  {driver.reservations && driver.reservations.length > 0 && ` (Reserved)`}
                                </Option>
                              ))}
                          </>
                        )}
                      </Select>

                      {/* Custom Driver Name Input */}
                      {driverAssignment === 'custom' && (
                        <CustomDriverInput
                          vehicleId={vehicleId}
                          value={customDriverName}
                          onChange={handleCustomDriverName}
                          disabled={!isDateTimeRangeReady || resourceLoading || conflictInfo?.hasConflict}
                          placeholder={conflictInfo?.hasConflict ? "Resolve time conflict first" : "Enter custom driver name"}
                          isMobile={isMobile}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </Form>
      </Spin>
  );

  return isMobile ? (
    <Drawer
      title={getTitle()}
      placement="bottom"
      height="90%"
      visible={visible}
      onClose={onCancel}
      destroyOnClose={true}
      className="reschedule-modal-drawer"
      footer={getMobileFooter()}
      bodyStyle={{ paddingBottom: '120px' }}
    >
      {formContentJSX}
    </Drawer>
  ) : (
    <Modal
      title={getTitle()}
      visible={visible}
      onCancel={onCancel}
      destroyOnClose={true}
      centered
      width={isTablet ? 600 : 700}
      getContainer={() => document.body}
      className="reschedule-modal"
      footer={getDesktopFooter()}
    >
      {formContentJSX}
    </Modal>
  );
};

export default RescheduleModal;
