import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button, DatePicker, TimePicker, Select, Spin, message, Alert } from 'antd';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import axios from 'axios';
import { SecureStorage } from '../../../utils/encryption';
import './reschedule_modal.css';

const { Option } = Select;

const RescheduleModal = ({ 
  visible, 
  onCancel, 
  onReschedule, 
  reservation,
  resourceType,
  resourceId,
  resources,
  originalStart, // ISO string or parseable datetime
  originalEnd    // ISO string or parseable datetime
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [availabilityBlocks, setAvailabilityBlocks] = useState([]); // [{start: dayjs, end: dayjs}]
  const [dayStatuses, setDayStatuses] = useState({}); // { 'YYYY-MM-DD': 'available'|'partial'|'reserved' }
  const [conflictInfo, setConflictInfo] = useState(null); // { hasConflict: bool, message: string }
  // Watch form fields so component re-renders when they change
  const startDateVal = Form.useWatch('startDate', form);
  const startTimeVal = Form.useWatch('startTime', form);
  const endDateVal = Form.useWatch('endDate', form);
  const endTimeVal = Form.useWatch('endTime', form);

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
        url: `${encryptedUrl}/user.php`,
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
          url: `${encryptedUrl}/user.php`,
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
  const parseBlocks = useCallback((items = []) => {
    // Expecting items with reservation_start_date and reservation_end_date
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

  const fetchAvailabilityFor = useCallback(async (itemType, ids = [], quantities = []) => {
    if (!ids || ids.length === 0) return [];
    const payload = {
      operation: 'fetchAvailability',
      itemType,
      itemId: ids,
    };
    if (itemType === 'equipment' && quantities && quantities.length === ids.length) {
      payload.quantity = quantities;
    }
    const url = `${SecureStorage.getLocalItem('url')}/user.php`;
    const resp = await axios.post(url, payload);
    if (resp.data?.status !== 'success') return [];
    // The response structure is assumed to be an array or an object with data array
    const items = Array.isArray(resp.data.data) ? resp.data.data : (resp.data.data?.items || []);
    return parseBlocks(items);
  }, [parseBlocks]);

  // Fetch available resources by selected date-time range
  const fetchAvailableVenuesByRange = useCallback(async (startDateTimeStr, endDateTimeStr, excludeIds = []) => {
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return [];
      }
      const resp = await axios.post(`${encryptedUrl}/user.php`, {
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
      const resp = await axios.post(`${encryptedUrl}/user.php`, {
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

  const refetchBlocks = useCallback(async (formValues = {}) => {
    try {
      if (!resources) { setAvailabilityBlocks([]); return; }
      setCheckingAvailability(true);
      const toNums = (arr) => (arr || []).map(v => Number(v)).filter(v => !Number.isNaN(v));
      const selectedVenueIds = Array.isArray(formValues.venueIds)
        ? toNums(formValues.venueIds.filter(Boolean))
        : (Array.isArray(form.getFieldValue('venueIds')) ? toNums(form.getFieldValue('venueIds').filter(Boolean)) : null);
      const selectedVehicleIds = Array.isArray(formValues.vehicleIds)
        ? toNums(formValues.vehicleIds.filter(Boolean))
        : (Array.isArray(form.getFieldValue('vehicleIds')) ? toNums(form.getFieldValue('vehicleIds').filter(Boolean)) : null);

      const venueIds = (selectedVenueIds && selectedVenueIds.length) ? selectedVenueIds : (resources.venueIds || []);
      const vehicleIds = (selectedVehicleIds && selectedVehicleIds.length) ? selectedVehicleIds : (resources.vehicleIds || []);
      const equipIds = (resources.equipment || []).map(e => e.equipment_id);
      const quantities = (resources.equipment || []).map(e => parseInt(e.quantity || 0, 10));

      const [venBlocks, vehBlocks, eqBlocks] = await Promise.all([
        fetchAvailabilityFor('venue', venueIds),
        fetchAvailabilityFor('vehicle', vehicleIds),
        fetchAvailabilityFor('equipment', equipIds, quantities)
      ]);

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
  }, [form, resources, originalStart, originalEnd, fetchAvailabilityFor]);

  // Compute per-day status (available / partial / reserved) similar to reservation_calendar.jsx
  useEffect(() => {
    const BUSINESS_START_HOUR = 4;  // 4 AM
    const BUSINESS_END_HOUR = 22;   // 10 PM
    const totalBusinessMinutes = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60; // 1080



    // For a date, compute total overlapped minutes of blocks within business hours
    const overlapMinutesForDate = (dateKey) => {
      const base = dayjs(dateKey);
      const dayStart = base.hour(BUSINESS_START_HOUR).minute(0).second(0);
      const dayEnd = base.hour(BUSINESS_END_HOUR).minute(0).second(0);
      // Collect overlapping intervals within [dayStart, dayEnd)
      const intervals = availabilityBlocks
        .map(b => {
          const s = b.start.isAfter(dayStart) ? b.start : dayStart;
          const e = b.end.isBefore(dayEnd) ? b.end : dayEnd;
          return (e.isAfter(s)) ? { s, e } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.s.valueOf() - b.s.valueOf());
      // Merge intervals and sum minutes
      let merged = [];
      intervals.forEach(cur => {
        if (merged.length === 0) { merged.push({ ...cur }); return; }
        const last = merged[merged.length - 1];
        if (cur.s.isSame(last.e) || cur.s.isBefore(last.e)) {
          if (cur.e.isAfter(last.e)) last.e = cur.e;
        } else {
          merged.push({ ...cur });
        }
      });
      const minutes = merged.reduce((acc, it) => acc + (it.e.diff(it.s, 'minute')), 0);
      return minutes;
    };

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
    dateKeys.forEach(k => {
      const minutes = overlapMinutesForDate(k);
      if (minutes <= 0) next[k] = 'available';
      else if (minutes >= totalBusinessMinutes) next[k] = 'reserved';
      else next[k] = 'partial';
    });
    setDayStatuses(next);
  }, [availabilityBlocks]);

    useEffect(() => {
    if (visible) {
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
      refetchBlocks();
    }
  }, [visible, resources, form, refetchBlocks, fetchVenues, fetchVehicles, reservation?.vehicles, reservation?.venues]);

  // When full date-time range is selected, fetch available venues and vehicles
  useEffect(() => {
    if (!visible) return;
    if (!isDateTimeRangeReady) {
      setVenues([]);
      setVehicles([]);
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

    const venueIds = (selectedVenueIds && selectedVenueIds.length) ? selectedVenueIds : (resources.venueIds || []);
    const vehicleIds = (selectedVehicleIds && selectedVehicleIds.length) ? selectedVehicleIds : (resources.vehicleIds || []);
    
    let cancelled = false;
    const run = async () => {
      setResourceLoading(true);
      try {
        const [v1, v2] = await Promise.all([
          fetchAvailableVenuesByRange(startStr, endStr, venueIds),
          fetchAvailableVehiclesByRange(startStr, endStr, vehicleIds),
        ]);
        if (!cancelled) {
          setVenues(v1 || []);
          setVehicles(v2 || []);
        }
      } catch (_) {
        if (!cancelled) {
          setVenues([]);
          setVehicles([]);
        }
      } finally {
        if (!cancelled) setResourceLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [visible, isDateTimeRangeReady, startDateVal, startTimeVal, endDateVal, endTimeVal, fetchAvailableVenuesByRange, fetchAvailableVehiclesByRange, availabilityBlocks]);

  const checkAvailability = async (values) => {
    const { startDate, startTime, endDate, endTime } = values;
    const start = dayjs(startDate).hour(dayjs(startTime).hour()).minute(0).second(0);
    const end = dayjs(endDate).hour(dayjs(endTime).hour()).minute(0).second(0);
    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return false;
    const oStart = dayjs(originalStart);
    const oEnd = dayjs(originalEnd);
    const blocks = (oStart.isValid() && oEnd.isValid())
      ? availabilityBlocks.filter(b => !(b.start.isSame(oStart) && b.end.isSame(oEnd)))
      : availabilityBlocks;
    // Overlap check: if any block intersects [start, end)
    const overlaps = blocks.some(b => start.isBefore(b.end) && end.isAfter(b.start));
    if (overlaps) {
      message.error('Selected time conflicts with existing reservations.');
      return false;
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
      const overlaps = blocks.some(b => start.isBefore(b.end) && end.isAfter(b.start));
      if (overlaps) {
        setConflictInfo({ hasConflict: true, message: 'Selected time conflicts with other reservations.' });
      } else {
        setConflictInfo(null);
      }
    } catch (e) {
      setConflictInfo(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const isAvailable = await checkAvailability(values);
      
      if (!isAvailable) {
        message.error('Selected time slot is not available. Please choose another time.');
        return;
      }

      const start = dayjs(values.startDate).hour(dayjs(values.startTime).hour()).minute(0).second(0);
      const end = dayjs(values.endDate).hour(dayjs(values.endTime).hour()).minute(0).second(0);
      onReschedule({
        ...values,
        startDate: start.format('YYYY-MM-DD HH:mm:ss'),
        endDate: end.format('YYYY-MM-DD HH:mm:ss'),
        newVenueIds: (Array.isArray(values.venueIds) ? values.venueIds.filter(Boolean).map(v => Number(v)).filter(v => !Number.isNaN(v)) : []),
        newVehicleIds: (Array.isArray(values.vehicleIds) ? values.vehicleIds.filter(Boolean).map(v => Number(v)).filter(v => !Number.isNaN(v)) : []),
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Disable logic for Start/End
  const disabledDateStart = (current) => {
    if (!current) return false;
    const cur = dayjs(current);
    if (!cur.isValid()) return false;
    const key = cur.format('YYYY-MM-DD');
    const isPast = cur.isBefore(dayjs().startOf('day'));
    const isFull = dayStatuses[key] === 'reserved';
    return isPast || isFull;
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

  return (
    <Modal
      title="Reschedule Reservation"
      visible={visible}
      onCancel={onCancel}
      destroyOnClose={true}
      centered
      getContainer={() => document.body}
      className="reschedule-modal"
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={loading || checkingAvailability}
        >
          {checkingAvailability ? 'Checking Availability...' : 'Reschedule'}
        </Button>,
      ]}
    >
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
          <Alert
            type="info"
            showIcon
            message="Select new date and time to reschedule. Changing venue and vehicle is optional — leave selectors empty to keep current assignments."
            style={{ marginBottom: 16 }}
          />
          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            disabledDate={disabledDateStart}
            showNow={false}
            allowClear
            placeholder="Select start date"
            cellRender={dateCellRender}
            popupClassName="reschedule-modal-popup"
            getPopupContainer={(trigger) => trigger.parentNode}
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
          <div style={{ marginBottom: 8, marginTop: -4, color: '#6B7280', fontSize: 12 }}>
            Note: Changing venue and vehicle is optional. Leave the fields below empty to keep the current assignments.
          </div>

          {conflictInfo?.hasConflict && (
            <Alert
              type="error"
              showIcon
              message={conflictInfo.message || 'Selected time conflicts with other reservations.'}
              style={{ marginBottom: 16 }}
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
                    placeholder="Select a venue"
                    disabled={!isDateTimeRangeReady || resourceLoading}
                    value={form.getFieldValue(['venueIds', idx])}
                    onSelect={(val, option) => {
                      const derivedId = (val && typeof val === 'object') ? (val.value ?? option?.value ?? null) : (val ?? option?.value ?? null);
                      try {
                        console.log('[RescheduleModal] Venue onSelect', {
                          idx,
                          val,
                          valType: typeof val,
                          optionValue: option?.value,
                          derivedId,
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
              {(reservation.vehicles || []).map((veh, idx) => (
                <Form.Item
                  key={`vehicle-${idx}`}
                  label={`${veh.model || veh.vehicle_model_name || 'Vehicle'} ->`}
                  name={['vehicleIds', idx]}
                  extra="Optional — leave empty to keep current vehicle"
                >
                  <Select 
                    placeholder="Select a vehicle"
                    disabled={!isDateTimeRangeReady || resourceLoading}
                    value={form.getFieldValue(['vehicleIds', idx])}
                    onSelect={(val, option) => {
                      const derivedId = (val && typeof val === 'object') ? (val.value ?? option?.value ?? null) : (val ?? option?.value ?? null);
                      try {
                        console.log('[RescheduleModal] Vehicle onSelect', {
                          idx,
                          val,
                          valType: typeof val,
                          optionValue: option?.value,
                          derivedId,
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
                        disabled={String(vehicle.status_availability_name).toLowerCase() !== 'available'}
                      >
                        {vehicle.vehicle_make_name} {vehicle.vehicle_model_name} - {vehicle.vehicle_license}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ))}
            </>
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export default RescheduleModal;