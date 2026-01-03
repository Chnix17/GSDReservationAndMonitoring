import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Modal, Spin, Divider, Table, Button, Drawer, Form, Select, TimePicker, AutoComplete, message } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { SecureStorage } from '../../../utils/encryption';

const Venue_ScheduleCalendar = ({ isOpen, onClose, venId, venueName, semesterId }) => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentWeek = dayjs();
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [venues, setVenues] = useState([]);
  const [form] = Form.useForm();
  const [updating, setUpdating] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [addDrawerVisible, setAddDrawerVisible] = useState(false);
  const [addForm] = Form.useForm();
  const [sections, setSections] = useState([]);
  const [adding, setAdding] = useState(false);

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
      } else {
        message.error('Failed to fetch schedule: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      message.error('Failed to load schedule data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [venId]);

  const fetchVenues = useCallback(async () => {
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      const response = await fetch(`${baseUrl}/Admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "fetchVenue"
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setVenues(result.data);
      } else {
        message.error('Failed to fetch venues: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      message.error('Error loading venues. Please try again.');
    }
  }, []);

  const fetchSections = useCallback(async () => {
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      const response = await fetch(`${baseUrl}/Department_Dean.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "fetchSections"
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setSections(result.data);
      } else {
        message.error('Failed to fetch sections: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      message.error('Error loading sections. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (venId && isOpen) {
      console.log('Fetching schedule for venue ID:', venId);
      fetchScheduleData();
      fetchVenues();
      fetchSections();
    }
  }, [venId, isOpen, fetchScheduleData, fetchVenues, fetchSections]);

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

  const handleEdit = (record) => {
    try {
      setEditingSchedule(record);
      form.setFieldsValue({
        ven_id: record.ven_id,
        day_of_week: record.day_of_week,
        start_time: dayjs(record.start_time, 'HH:mm:ss'),
        end_time: dayjs(record.end_time, 'HH:mm:ss')
      });
      setEditDrawerVisible(true);
    } catch (error) {
      console.error('Error opening edit form:', error);
      message.error('Failed to open edit form. Please try again.');
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      setUpdating(true);

      const baseUrl = SecureStorage.getLocalItem("url");
      const response = await fetch(`${baseUrl}/Department_Dean.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "updateClassSchedule",
          schedule_id: editingSchedule.schedule_id,
          ven_id: values.ven_id,
          day_of_week: values.day_of_week,
          start_time: values.start_time.format('HH:mm:ss'),
          end_time: values.end_time.format('HH:mm:ss')
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        message.success('Schedule updated successfully');
        setEditDrawerVisible(false);
        form.resetFields();
        setEditingSchedule(null);
        fetchScheduleData();
      } else {
        message.error(result.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      if (error.message) {
        message.error('Update failed: ' + error.message);
      } else {
        message.error('Network error. Please check your connection and try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDrawerVisible(false);
    form.resetFields();
    setEditingSchedule(null);
  };

  const handleAdd = () => {
    if (!semesterId) {
      message.error('Please select a semester first');
      return;
    }
    addForm.resetFields();
    setAddDrawerVisible(true);
  };

  const handleAddSchedule = async () => {
    try {
      const values = await addForm.validateFields();
      setAdding(true);

      const baseUrl = SecureStorage.getLocalItem("url");
      const response = await fetch(`${baseUrl}/Department_Dean.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "addClassSchedule",
          semester_id: semesterId,
          section_name: values.section_name.trim(),
          ven_id: venId,
          day_of_week: values.day_of_week,
          start_time: values.start_time.format('HH:mm:ss'),
          end_time: values.end_time.format('HH:mm:ss')
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        message.success('Schedule added successfully');
        setAddDrawerVisible(false);
        addForm.resetFields();
        fetchScheduleData();
        fetchSections(); // Refresh sections list
      } else {
        message.error(result.message || 'Failed to add schedule');
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      if (error.name === 'ValidationError') {
        message.error('Please fill in all required fields correctly');
      } else if (error.message) {
        message.error('Add failed: ' + error.message);
      } else {
        message.error('Network error. Please check your connection and try again.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setAddDrawerVisible(false);
    addForm.resetFields();
  };

  const dayOfWeekOptions = [
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' }
  ];

  const columns = [
    {
      title: 'Section',
      dataIndex: 'section_name',
      key: 'section_name',
      width: 150,
    },
    {
      title: 'Venue',
      dataIndex: 'ven_name',
      key: 'ven_name',
      width: 200,
    },
    {
      title: 'Day',
      dataIndex: 'day_of_week',
      key: 'day_of_week',
      width: 120,
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 120,
      render: (time) => dayjs(time, 'HH:mm:ss').format('h:mm A')
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 120,
      render: (time) => dayjs(time, 'HH:mm:ss').format('h:mm A')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          className="bg-green-900 hover:bg-lime-900"
          onClick={() => handleEdit(record)}
        >
          Edit
        </Button>
      )
    }
  ];

  // const renderVenueInfo = () => {
  //   if (!scheduleData || scheduleData.length === 0) return null;
    
  //   return (
  //     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-8">
  //       <div className="flex items-center justify-between mb-4">
  //         <div>
  //           <h2 className="text-2xl font-bold text-gray-900 mb-1">{venueName}</h2>
  //           <p className="text-sm text-gray-600">Venue Schedule Details</p>
  //         </div>
  //       </div>
  //       <div className="grid grid-cols-2 gap-6">
  //         <div className="bg-white p-4 rounded-lg shadow-sm">
  //           <h4 className="text-sm font-medium text-gray-500 mb-1">Schedule Period</h4>
  //           <p className="text-lg font-semibold text-gray-900">
  //             {dayjs(scheduleData[0].semester_start).format('MMM D, YYYY')} - {dayjs(scheduleData[0].semester_end).format('MMM D, YYYY')}
  //           </p>
  //         </div>
  //         <div className="bg-white p-4 rounded-lg shadow-sm">
  //           <h4 className="text-sm font-medium text-gray-500 mb-1">Total Schedules</h4>
  //           <p className="text-lg font-semibold text-gray-900">
  //             {scheduleData.length} Schedule(s)
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  const renderTimeGrid = () => {
    const weekDays = getWeekDays();
    const timeSlots = getTimeSlots();

    return (
      <div className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${isMobile ? 'overflow-x-auto' : ''}`}>
        <div className="flex">
          {/* Time labels column */}
          <div className={`${isMobile ? 'w-16' : 'w-28'} bg-[#d4f4dc] border-r border-gray-200 flex-shrink-0`}>
            {/* Empty space for header alignment */}
            <div className={`${isMobile ? 'h-14' : 'h-20'} border-b border-gray-200`}></div>
            {/* Time labels */}
            {timeSlots.map((time, index) => (
              <div
                key={index}
                className={`${isMobile ? 'h-14 text-[10px]' : 'h-20 text-xs'} border-b border-gray-200 text-gray-700 p-2 flex items-center justify-end ${isMobile ? 'pr-1' : 'pr-3'}`}
              >
                {isMobile ? time.format('h A') : time.format('h:mm A')}
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
                  className={`${isMobile ? 'p-1 h-14' : 'p-3 h-20'} text-center flex flex-col justify-center`}
                >
                  <div className={`${isMobile ? 'text-[10px]' : 'text-sm'} font-semibold text-white`}>{day.format('ddd')}</div>
                  <div className={`${isMobile ? 'text-[9px]' : 'text-xs'} text-white/90 mt-0.5`}>{day.format(isMobile ? 'M/D' : 'MMM D')}</div>
                </div>
              ))}
            </div>

            {/* Time slots grid */}
            <div className="relative">
              {timeSlots.map((time, timeIndex) => (
                <div key={timeIndex} className={`grid grid-cols-7 ${isMobile ? 'h-14' : 'h-20'} border-b border-gray-200`}>
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
                        className={`relative border-r border-gray-200 ${isMobile ? 'min-w-[50px]' : ''}`}
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
                                className={`${isMobile ? 'text-[9px] px-1 py-1' : 'text-sm px-4 py-2'} text-[#145414] font-medium bg-[#83b383] rounded-full shadow-sm`}
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  whiteSpace: isMobile ? 'normal' : 'nowrap',
                                  zIndex: 10,
                                  maxWidth: isMobile ? '45px' : 'none',
                                  textAlign: 'center',
                                  lineHeight: isMobile ? '1.1' : 'normal'
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

  const renderContent = () => (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <div className={isMobile ? "mt-2" : "mt-4"}>
            {/* Header with Venue Name and Add Button */}
            <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 ${isMobile ? 'p-4' : 'p-6'} rounded-xl shadow-sm ${isMobile ? 'mb-4' : 'mb-8'}`}>
              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
                <div>
                  <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'mb-0' : 'mb-1'}`}>{venueName}</h2>
                  <p className="text-xs text-gray-600">Venue Schedule Details</p>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  className="bg-lime-900 hover:bg-green-600"
                  size={isMobile ? "middle" : "large"}
                  block={isMobile}
                >
                  {isMobile ? 'Add Schedule' : 'Add Schedule'}
                </Button>
              </div>
            </div>

            {scheduleData && scheduleData.length > 0 ? (
              <>
                {/* Schedule Info */}
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-3 mb-4' : 'grid-cols-2 gap-6 mb-6'}`}>
                  <div className={`bg-white ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm`}>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Schedule Period</h4>
                    <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>
                      {dayjs(scheduleData[0].semester_start).format('MMM D, YYYY')} - {dayjs(scheduleData[0].semester_end).format('MMM D, YYYY')}
                    </p>
                  </div>
                  <div className={`bg-white ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm`}>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Total Schedules</h4>
                    <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>
                      {scheduleData.length} Schedule(s)
                    </p>
                  </div>
                </div>
                
                {/* View Mode Toggle */}
                <div className={`flex ${isMobile ? 'justify-center mb-3' : 'justify-end mb-4'}`}>
                  <Button.Group size={isMobile ? "small" : "default"}>
                    <Button
                      type={viewMode === 'list' ? 'primary' : 'default'}
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'bg-green-900' : ''}
                    >
                      List View
                    </Button>
                    <Button
                      type={viewMode === 'calendar' ? 'primary' : 'default'}
                      onClick={() => setViewMode('calendar')}
                      className={viewMode === 'calendar' ? 'bg-green-900' : ''}
                    >
                      Calendar View
                    </Button>
                  </Button.Group>
                </div>

                <Divider className={isMobile ? 'my-2' : 'my-4'} />
                
                {/* Content based on view mode */}
                {viewMode === 'list' ? (
                  <Table
                    columns={columns}
                    dataSource={scheduleData}
                    rowKey="schedule_id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} schedules`
                    }}
                    scroll={{ x: 800 }}
                  />
                ) : (
                  renderTimeGrid()
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No schedules found for this venue.</p>
                <p className="text-gray-400">Click "Add Schedule" to create the first schedule.</p>
              </div>
            )}
          </div>
        )}
    </>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          open={isOpen}
          onClose={onClose}
          placement="bottom"
          height="95%"
          className="venue-schedule-drawer"
          title={null}
          footer={null}
          bodyStyle={{ padding: '16px' }}
        >
          {renderContent()}
        </Drawer>
      ) : (
        <Modal
          open={isOpen}
          onCancel={onClose}
          width={isTablet ? 900 : 1200}
          className="venue-schedule-modal"
          title={null}
          footer={null}
          centered
        >
          {renderContent()}
        </Modal>
      )}

      {/* Edit Drawer */}
      <Drawer
        title="Edit Schedule"
        placement={isMobile ? "bottom" : "right"}
        onClose={handleCancelEdit}
        open={editDrawerVisible}
        width={isMobile ? undefined : 400}
        height={isMobile ? "80%" : undefined}
        footer={
          isMobile ? (
            <div className="flex flex-col gap-2">
              <Button onClick={handleCancelEdit} block size="large">
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleUpdate}
                loading={updating}
                className="bg-green-900 hover:bg-lime-900"
                block
                size="large"
              >
                Update
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleUpdate}
                loading={updating}
                className="bg-green-900 hover:bg-lime-900"
              >
                Update
              </Button>
            </div>
          )
        }
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="ven_id"
            label="Venue"
            rules={[{ required: true, message: 'Please select a venue' }]}
          >
            <Select
              placeholder="Select venue"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {venues.map((venue) => (
                <Select.Option key={venue.ven_id} value={venue.ven_id}>
                  {venue.ven_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="day_of_week"
            label="Day of Week"
            rules={[{ required: true, message: 'Please select a day' }]}
          >
            <Select placeholder="Select day" options={dayOfWeekOptions} />
          </Form.Item>

          <Form.Item
            name="start_time"
            label="Start Time"
            rules={[{ required: true, message: 'Please select start time' }]}
          >
            <TimePicker
              format="h:mm A"
              use12Hours
              className="w-full"
              minuteStep={30}
            />
          </Form.Item>

          <Form.Item
            name="end_time"
            label="End Time"
            rules={[
              { required: true, message: 'Please select end time' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startTime = getFieldValue('start_time');
                  if (!value || !startTime) {
                    return Promise.resolve();
                  }
                  if (value.isAfter(startTime)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('End time must be after start time'));
                },
              }),
            ]}
          >
            <TimePicker
              format="h:mm A"
              use12Hours
              className="w-full"
              minuteStep={30}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Add Schedule Drawer */}
      <Drawer
        title="Add New Schedule"
        placement={isMobile ? "bottom" : "right"}
        onClose={handleCancelAdd}
        open={addDrawerVisible}
        width={isMobile ? undefined : 400}
        height={isMobile ? "80%" : undefined}
        footer={
          isMobile ? (
            <div className="flex flex-col gap-2">
              <Button onClick={handleCancelAdd} block size="large">
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleAddSchedule}
                loading={adding}
                className="bg-green-900 hover:bg-lime-900"
                block
                size="large"
              >
                Add Schedule
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button onClick={handleCancelAdd}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleAddSchedule}
                loading={adding}
                className="bg-green-900 hover:bg-lime-900"
              >
                Add Schedule
              </Button>
            </div>
          )
        }
      >
        <Form
          form={addForm}
          layout="vertical"
        >
          <Form.Item
            name="section_name"
            label="Section Name"
            rules={[
              { required: true, message: 'Please enter a section name' },
              { 
                validator: (_, value) => {
                  if (value && value.trim() === '') {
                    return Promise.reject(new Error('Section name cannot be empty or whitespace only'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <AutoComplete
              placeholder="Type to create new or select existing section"
              options={sections.map((section) => ({
                value: section.section_name,
                label: section.section_name
              }))}
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="day_of_week"
            label="Day of Week"
            rules={[{ required: true, message: 'Please select a day' }]}
          >
            <Select placeholder="Select day" options={dayOfWeekOptions} />
          </Form.Item>

          <Form.Item
            name="start_time"
            label="Start Time"
            rules={[{ required: true, message: 'Please select start time' }]}
          >
            <TimePicker
              format="h:mm A"
              use12Hours
              className="w-full"
              minuteStep={30}
            />
          </Form.Item>

          <Form.Item
            name="end_time"
            label="End Time"
            rules={[
              { required: true, message: 'Please select end time' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startTime = getFieldValue('start_time');
                  if (!value || !startTime) {
                    return Promise.resolve();
                  }
                  if (value.isAfter(startTime)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('End time must be after start time'));
                },
              }),
            ]}
          >
            <TimePicker
              format="h:mm A"
              use12Hours
              className="w-full"
              minuteStep={30}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default Venue_ScheduleCalendar;
