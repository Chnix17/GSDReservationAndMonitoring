import React, { useState, useEffect } from 'react';
import { Modal, Spin, Divider } from 'antd';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { SecureStorage } from '../../utils/encryption';

const Venue_ScheduleCalendar = ({ isOpen, onClose, venId, venueName }) => {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentWeek = dayjs();

  useEffect(() => {
    const fetchScheduleData = async () => {
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
    };

    if (venId && isOpen) {
      console.log('Fetching schedule for venue ID:', venId);
      fetchScheduleData();
    }
  }, [venId, isOpen]);

  const getWeekDays = () => {
    const startOfWeek = currentWeek.startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 22; hour++) {
      slots.push(dayjs().hour(hour).minute(0).second(0));
      slots.push(dayjs().hour(hour).minute(30).second(0));
    }
    return slots;
  };

  const isTimeSlotInSchedule = (day, time) => {
    if (!scheduleData || scheduleData.length === 0) {
      console.log('No schedule data available');
      return false;
    }

    const dayOfWeek = day.format('dddd');
    const timeStr = time.format('HH:mm:ss');
    const nextTimeStr = time.add(30, 'minute').format('HH:mm:ss');
    
    console.log('Checking time slot:', {
      dayOfWeek,
      timeStr,
      nextTimeStr,
      schedules: scheduleData
    });

    return scheduleData.some(schedule => {
      const scheduleStart = schedule.start_time;
      const scheduleEnd = schedule.end_time;
      
      return dayOfWeek === schedule.day_of_week &&
        ((timeStr >= scheduleStart && timeStr < scheduleEnd) ||
         (nextTimeStr > scheduleStart && nextTimeStr <= scheduleEnd) ||
         (timeStr <= scheduleStart && nextTimeStr >= scheduleEnd));
    });
  };

  const getScheduleForTimeSlot = (day, time) => {
    if (!scheduleData || scheduleData.length === 0) return null;

    const dayOfWeek = day.format('dddd');
    const timeStr = time.format('HH:mm:ss');
    const nextTimeStr = time.add(30, 'minute').format('HH:mm:ss');

    return scheduleData.find(schedule => {
      const scheduleStart = schedule.start_time;
      const scheduleEnd = schedule.end_time;
      
      return dayOfWeek === schedule.day_of_week &&
        ((timeStr >= scheduleStart && timeStr < scheduleEnd) ||
         (nextTimeStr > scheduleStart && nextTimeStr <= scheduleEnd) ||
         (timeStr <= scheduleStart && nextTimeStr >= scheduleEnd));
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
            <div className="h-8 border-b border-gray-200"></div>
            {/* Time labels */}
            {timeSlots.map((time, index) => (
              <div
                key={index}
                className="h-8 border-b border-gray-200 text-xs text-gray-700 p-1 flex items-center justify-end pr-3"
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
                  className="p-3 text-center h-8 flex flex-col justify-center"
                >
                  <div className="text-sm font-semibold text-white">{day.format('ddd')}</div>
                  <div className="text-xs text-white/90 mt-0.5">{day.format('MMM D')}</div>
                </div>
              ))}
            </div>

            {/* Time slots grid */}
            <div className="relative">
              {timeSlots.map((time, timeIndex) => (
                <div key={timeIndex} className="grid grid-cols-7 h-8 border-b border-gray-200">
                  {weekDays.map((day, dayIndex) => {
                    const isScheduled = isTimeSlotInSchedule(day, time);
                    const schedule = getScheduleForTimeSlot(day, time);
                    return (
                      <div
                        key={dayIndex}
                        className={`relative border-r border-gray-200 ${
                          isScheduled ? 'bg-[#d4f4dc]' : ''
                        }`}
                      >
                        {isScheduled && schedule && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 bg-[#548e54]/20 flex items-center justify-center"
                          >
                            <div className="text-xs text-[#145414] font-medium px-2 py-0.5 bg-[#83b383] rounded-full shadow-sm">
                              {schedule.section_name}
                            </div>
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
