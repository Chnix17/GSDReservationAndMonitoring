import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Spin, Divider } from 'antd';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { SecureStorage } from '../../utils/encryption';

const Venue_ScheduleCalendar = ({ isOpen, onClose, venId, venueName }) => {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentWeek = dayjs();

  const fetchScheduleData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      console.log('Making API request with venId:', venId);
      const response = await fetch(`${baseUrl}/Department_Dean.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "fetchVenueByVenId",
          ven_id: venId
        })
      });
      const result = await response.json();
      console.log('API Response:', result);
      if (result.status === 'success') {
        setScheduleData(result.data);
        console.log('Schedule data set:', result.data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [venId]);

  useEffect(() => {
    if (venId && isOpen) {
      console.log('Fetching schedule for venue ID:', venId);
      fetchScheduleData();
    }
  }, [venId, isOpen, fetchScheduleData]);

  const getWeekDays = () => {
    const startOfWeek = currentWeek.startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 22; hour++) {
      slots.push(dayjs().hour(hour).minute(0).second(0));
    }
    return slots;
  };

  const getSchedulePosition = (schedule, time) => {
    if (!schedule) return { top: 0, height: '100%' };
    
 
    const scheduleStart = schedule.start_time;
    const scheduleEnd = schedule.end_time;
    const currentHour = time.hour();
    
    // Check if this is the last hour of the schedule
    const scheduleEndHour = parseInt(scheduleEnd.split(':')[0]);
    const scheduleEndMinute = scheduleEnd.split(':')[1];
    
    // If this is the last hour and it ends at :30
    if (currentHour === scheduleEndHour && scheduleEndMinute === '30') {
      return { top: 0, height: '50%' };
    }
    
    // If this is the first hour and it starts at :30
    const scheduleStartHour = parseInt(scheduleStart.split(':')[0]);
    const scheduleStartMinute = scheduleStart.split(':')[1];
    if (currentHour === scheduleStartHour && scheduleStartMinute === '30') {
      return { top: '50%', height: '50%' };
    }
    
    // Full hour schedule
    return { top: 0, height: '100%' };
  };

  const isTimeSlotInSchedule = (day, time) => {
    if (!scheduleData || scheduleData.length === 0) {
      console.log('No schedule data available');
      return false;
    }

    const dayOfWeek = day.format('dddd');
    const timeStr = time.format('HH:mm:ss');
    const nextHour = time.add(1, 'hour').format('HH:mm:ss');
    
    return scheduleData.some(schedule => {
      const scheduleStart = schedule.start_time;
      const scheduleEnd = schedule.end_time;
      
      // Check if the schedule overlaps with the current hour slot
      return dayOfWeek === schedule.day_of_week &&
        ((scheduleStart >= timeStr && scheduleStart < nextHour) ||
         (scheduleEnd > timeStr && scheduleEnd <= nextHour) ||
         (scheduleStart <= timeStr && scheduleEnd >= nextHour));
    });
  };

  const getScheduleForTimeSlot = (day, time) => {
    if (!scheduleData || scheduleData.length === 0) return null;

    const dayOfWeek = day.format('dddd');
    const timeStr = time.format('HH:mm:ss');
    const nextHour = time.add(1, 'hour').format('HH:mm:ss');

    return scheduleData.find(schedule => {
      const scheduleStart = schedule.start_time;
      const scheduleEnd = schedule.end_time;
      
      return dayOfWeek === schedule.day_of_week &&
        ((scheduleStart >= timeStr && scheduleStart < nextHour) ||
         (scheduleEnd > timeStr && scheduleEnd <= nextHour) ||
         (scheduleStart <= timeStr && scheduleEnd >= nextHour));
    });
  };

  const getScheduleBlocks = (day) => {
    if (!scheduleData || scheduleData.length === 0) return [];
    
    const dayOfWeek = day.format('dddd');
    const daySchedules = scheduleData.filter(schedule => schedule.day_of_week === dayOfWeek);
    
    return daySchedules.map(schedule => {
      const startHour = parseInt(schedule.start_time.split(':')[0]);
      const startMinute = schedule.start_time.split(':')[1];
      const endHour = parseInt(schedule.end_time.split(':')[0]);
      const endMinute = schedule.end_time.split(':')[1];
      
      return {
        ...schedule,
        startHour,
        startMinute,
        endHour,
        endMinute
      };
    });
  };

  const renderVenueInfo = () => {
    if (!scheduleData || scheduleData.length === 0) return null;
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{venueName}</h2>
            <p className="text-sm text-gray-600">Venue Schedule Details</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Schedule Period</h4>
            <p className="text-lg font-semibold text-gray-900">
              {dayjs(scheduleData[0].semester_start).format('MMM D, YYYY')} - {dayjs(scheduleData[0].semester_end).format('MMM D, YYYY')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Total Schedules</h4>
            <p className="text-lg font-semibold text-gray-900">
              {scheduleData.length} Schedule(s)
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderTimeGrid = () => {
    const weekDays = getWeekDays();
    const timeSlots = getTimeSlots();

    return (
      <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex">
          {/* Time labels column */}
          <div className="w-28 bg-[#d4f4dc] border-r border-gray-200">
            {/* Empty space for header alignment */}
            <div className="h-20 border-b border-gray-200"></div>
            {/* Time labels */}
            {timeSlots.map((time, index) => (
              <div
                key={index}
                className="h-20 border-b border-gray-200 text-xs text-gray-700 p-2 flex items-center justify-end pr-3"
              >
                {time.format('h:mm A')}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-[#83b383] sticky top-0 z-20">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className="p-3 text-center h-20 flex flex-col justify-center"
                >
                  <div className="text-sm font-semibold text-white">{day.format('ddd')}</div>
                  <div className="text-xs text-white/90 mt-0.5">{day.format('MMM D')}</div>
                </div>
              ))}
            </div>

            {/* Time slots grid */}
            <div className="relative">
              {timeSlots.map((time, timeIndex) => (
                <div key={timeIndex} className="grid grid-cols-7 h-20 border-b border-gray-200">
                  {weekDays.map((day, dayIndex) => {
                    const isScheduled = isTimeSlotInSchedule(day, time);
                    const schedule = getScheduleForTimeSlot(day, time);
                    const position = getSchedulePosition(schedule, time);
                    const currentHour = time.hour();
                    
                    // Get all schedule blocks for this day
                    const scheduleBlocks = getScheduleBlocks(day);
                    
                    // Find if this is the start of a schedule block
                    const isStartOfBlock = schedule && 
                      scheduleBlocks.some(block => 
                        block.startHour === currentHour && 
                        block.section_name === schedule.section_name
                      );
                    
                    return (
                      <div
                        key={dayIndex}
                        className="relative border-r border-gray-200"
                      >
                        {isScheduled && schedule && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              position: 'absolute',
                              top: position.top,
                              height: position.height,
                              width: '100%',
                              backgroundColor: '#548e54',
                              opacity: 0.3,
                              borderRight: '1px solid #83b383',
                              borderLeft: '1px solid #83b383'
                            }}
                          >
                            {isStartOfBlock && (
                              <div 
                                className="text-sm text-[#145414] font-medium px-4 py-2 bg-[#83b383] rounded-full shadow-sm"
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  whiteSpace: 'nowrap',
                                  zIndex: 10
                                }}
                              >
                                {schedule.section_name}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={1200}
      className="venue-schedule-modal"
      title={null}
      footer={null}
    >
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <div className="mt-4">
          {scheduleData && scheduleData.length > 0 && (
            <>
              {renderVenueInfo()}
              <Divider className="my-8" />
              {renderTimeGrid()}
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default Venue_ScheduleCalendar;
