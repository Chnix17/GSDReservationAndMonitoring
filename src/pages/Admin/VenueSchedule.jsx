import React, { useState, useRef, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import {  Download, MapPin,FileText} from 'lucide-react';
import Papa from 'papaparse';
import { SecureStorage } from '../../utils/encryption';
import { Modal, Input, Button, Tooltip, Empty, Pagination, Select, Card, Badge, message, Form, TimePicker, Drawer, AutoComplete } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, CalendarOutlined, CloseOutlined, UploadOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import VenueScheduleCalendar from './core/Venue_ScheduleCalendar';

import Sidebar from '../../components/core/Sidebar';

const VenueSchedule = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const [scheduleData, setScheduleData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAcademicSession, setSelectedAcademicSession] = useState('');
  const [selectedAcademicSessionId, setSelectedAcademicSessionId] = useState('');
  const [availableAcademicSessions, setAvailableAcademicSessions] = useState([]);
  const [activeAcademicSession, setActiveAcademicSession] = useState(null);
  const [loadingActiveSession, setLoadingActiveSession] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [selectedVenueName, setSelectedVenueName] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // Add Schedule Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm] = Form.useForm();
  const [venues, setVenues] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionSchedules, setSectionSchedules] = useState([
    { 
      id: 1, 
      sectionId: undefined, 
      timeSlots: [{ id: 1, day: undefined, startTime: null, endTime: null }] 
    }
  ]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Update page size based on screen size
  useEffect(() => {
    if (isMobile) {
      setPageSize(5);
    } else if (isTablet) {
      setPageSize(8);
    } else {
      setPageSize(10);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    const fetchVenues = async () => {
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
          setVenues(result.data.map(venue => ({
            value: venue.ven_id,
            label: venue.ven_name
          })));
        }
      } catch (err) {
        console.error('Error fetching venues:', err);
      }
    };

    const fetchSections = async () => {
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
          setSections(result.data.map(section => ({
            value: section.section_id,
            label: section.section_name
          })));
        }
      } catch (err) {
        console.error('Error fetching sections:', err);
      }
    };

    const fetchAcademicSessions = async () => {
      try {
        const baseUrl = SecureStorage.getLocalItem("url");
        const response = await fetch(`${baseUrl}/Admin.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: "fetchAcademicSessions"
          })
        });
        const result = await response.json();
        if (result.status === 'success') {
          setAvailableAcademicSessions(result.data.map(session => ({
            value: session.academic_session_id,
            label: `${session.school_year_name} - ${session.semester_name}`,
            is_active: session.is_active,
            ...session
          })));
        }
      } catch (err) {
        console.error('Error fetching academic sessions:', err);
      }
    };
    
    const fetchActiveAcademicSession = async () => {
      try {
        const baseUrl = SecureStorage.getLocalItem("url");
        const response = await fetch(`${baseUrl}/Admin.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: "getActiveAcademicSession"
          })
        });
        const result = await response.json();
        if (result.status === 'success' && result.hasActive) {
          setActiveAcademicSession(result.data);
        }
      } catch (err) {
        console.error('Error fetching active academic session:', err);
      }
    };
    
    fetchVenues();
    fetchSections();
    fetchAcademicSessions();
    fetchActiveAcademicSession();
  }, []);

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!selectedAcademicSessionId) return;
      
      setIsLoading(true);
      try {
        const baseUrl = SecureStorage.getLocalItem("url");
        const response = await fetch(`${baseUrl}/Department_Dean.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: "fetchVenueScheduled",
            academic_session_id: selectedAcademicSessionId
          })
        });
        const result = await response.json();
        if (result.status === 'success') {
          setScheduleData(result.data);
          setFilteredData(result.data);
        } else {
          setError(result.message || 'Failed to fetch schedule data');
        }
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setError('Error fetching schedule data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduleData();
  }, [selectedAcademicSessionId]);

  useEffect(() => {
    const filtered = scheduleData.filter(item => 
      Object.values(item).some(val => 
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [searchTerm, scheduleData]);

  const uploadToDatabase = async (file) => {
    if (!activeAcademicSession) {
      message.error('No active academic session found. Please set an active academic session first.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Read and parse CSV file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target.result;
          const { data } = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
          });

          // Transform CSV data to required JSON format
          const transformedData = data.map(row => {
            // Log the row data for debugging
            console.log('Processing row:', row);
            
            // Get values using exact column names from CSV
            const section = row['section_name'] || '';
            const venue = row['venue_name'] || '';
            const day = row['day'] || '';
            const startTime = row['start_time'] || '';
            const endTime = row['end_time'] || '';

            // Validate required fields
            if (!section || !venue) {
              console.error('Missing required fields:', { section, venue, row });
            }

            return {
              section_name: section.trim(),
              venue_name: venue.trim(),
              day: day.trim(),
              start_time: startTime.trim(),
              end_time: endTime.trim()
            };
          }).filter(item => item.section_name && item.venue_name); // Filter out entries with missing required fields

          // Log the transformed data for debugging
          console.log('Transformed data:', transformedData);

          // Prepare the final payload using active academic session
          const payload = {
            operation: "uploadClassroomCSV",
            academic_session_id: activeAcademicSession.academic_session_id,
            csv_data: transformedData
          };

          const baseUrl = SecureStorage.getLocalItem("url");
          const response = await fetch(`${baseUrl}/Department_Dean.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();
          
          if (result.status === 'success') {
            message.success('Schedule uploaded successfully!');
            setSuccess('Schedule uploaded successfully!');
            setScheduleData(transformedData);
            setFilteredData(transformedData);
            
            // Show simple skipped count message
            if (result.skipped_count > 0) {
              message.warning(`${result.skipped_count} entry(ies) were skipped (already exist in this academic session)`);
            }
            
            setError('');
            setShowUploadModal(false);
            setSelectedFile(null);

            // Refresh the schedule data
            if (selectedAcademicSessionId) {
              const refreshResponse = await fetch(`${baseUrl}/Department_Dean.php`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  operation: "fetchVenueScheduled",
                  academic_session_id: selectedAcademicSessionId
                })
              });
              const refreshResult = await refreshResponse.json();
              if (refreshResult.status === 'success') {
                setScheduleData(refreshResult.data);
                setFilteredData(refreshResult.data);
              }
            }
          } else {
            message.error(result.message || 'Failed to upload schedule to database');
          }
        } catch (err) {
          console.error('CSV Processing Error:', err);
          message.error('Error processing CSV file: ' + err.message);
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        message.error('Error reading file');
        setIsLoading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      console.error('Upload Error:', err);
      message.error('Error uploading to database: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    if (file.type !== 'text/csv') {
      message.error('Please upload a CSV file');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    if (!activeAcademicSession) {
      message.error('No active academic session found. Please set an active academic session first.');
      return;
    }
    setShowUploadModal(true);
  };

  const handleFinalUpload = () => {
    if (!selectedFile) {
      message.error('Please select a CSV file to upload');
      return;
    }
    uploadToDatabase(selectedFile);
  };

  const downloadTemplate = () => {
    const headers = ['Venue', 'Date', 'Start Time', 'End Time', 'Event', 'Organizer'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'venue_schedule_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleAcademicSessionChange = (value) => {
    const selectedSession = availableAcademicSessions.find(session => session.value === value);
    if (selectedSession) {
      setSelectedAcademicSession(selectedSession.label);
      setSelectedAcademicSessionId(selectedSession.value);
    } else {
      setSelectedAcademicSession('');
      setSelectedAcademicSessionId('');
    }
  };

  const handleSetActiveAcademicSession = async (academicSessionId) => {
    if (!academicSessionId) {
      message.error('Please select an academic session first');
      return;
    }

    setLoadingActiveSession(true);
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      const response = await fetch(`${baseUrl}/Admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "setActiveAcademicSession",
          academic_session_id: academicSessionId
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setActiveAcademicSession(result.data);
        message.success('Academic session marked as active successfully');
        setSuccess('Academic session marked as active successfully');
        // Refresh academic sessions to update active status
        const sessionsResponse = await fetch(`${baseUrl}/Admin.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: "fetchAcademicSessions"
          })
        });
        const sessionsResult = await sessionsResponse.json();
        if (sessionsResult.status === 'success') {
          setAvailableAcademicSessions(sessionsResult.data.map(session => ({
            value: session.academic_session_id,
            label: `${session.school_year_name} - ${session.semester_name}`,
            is_active: session.is_active,
            ...session
          })));
        }
      } else {
        message.error(result.message || 'Failed to set active academic session');
      }
    } catch (err) {
      console.error('Error setting active academic session:', err);
      message.error('Error setting active academic session');
    } finally {
      setLoadingActiveSession(false);
    }
  };

  const handleViewSchedule = (venId, venueName) => {
    console.log('View schedule clicked:', { venId, venueName });
    setSelectedScheduleId(venId);
    setSelectedVenueName(venueName);
    setShowCalendar(true);
  };

  const handleAddScheduleClick = () => {
    if (!activeAcademicSession) {
      message.error('No active academic session found. Please set an active academic session first.');
      return;
    }
    setShowAddModal(true);
  };

  const handleAddSection = () => {
    setSectionSchedules([...sectionSchedules, { 
      id: Date.now(), 
      sectionId: undefined, 
      timeSlots: [{ id: Date.now() + 1, day: undefined, startTime: null, endTime: null }] 
    }]);
  };

  const handleRemoveSection = (sectionId) => {
    if (sectionSchedules.length === 1) {
      message.warning('At least one section is required');
      return;
    }
    setSectionSchedules(sectionSchedules.filter(section => section.id !== sectionId));
  };

  const handleSectionChange = (sectionId, value) => {
    // Trim whitespace from section name/id
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    setSectionSchedules(sectionSchedules.map(section => 
      section.id === sectionId ? { ...section, sectionId: trimmedValue } : section
    ));
  };

  const handleAddTimeSlot = (sectionId) => {
    setSectionSchedules(sectionSchedules.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          timeSlots: [...section.timeSlots, { id: Date.now(), day: undefined, startTime: null, endTime: null }]
        };
      }
      return section;
    }));
  };

  const handleRemoveTimeSlot = (sectionId, timeSlotId) => {
    setSectionSchedules(sectionSchedules.map(section => {
      if (section.id === sectionId) {
        if (section.timeSlots.length === 1) {
          message.warning('At least one time slot is required per section');
          return section;
        }
        return {
          ...section,
          timeSlots: section.timeSlots.filter(slot => slot.id !== timeSlotId)
        };
      }
      return section;
    }));
  };

  const handleTimeSlotChange = (sectionId, timeSlotId, field, value) => {
    setSectionSchedules(sectionSchedules.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          timeSlots: section.timeSlots.map(slot => 
            slot.id === timeSlotId ? { ...slot, [field]: value } : slot
          )
        };
      }
      return section;
    }));
  };

  const handleSubmitSchedule = async () => {
    try {
      const values = await addForm.validateFields();
      
      // Validate all sections have section selected and all time slots filled
      const invalidSections = sectionSchedules.filter(section => 
        !section.sectionId || (typeof section.sectionId === 'string' && section.sectionId.trim() === '')
      );
      if (invalidSections.length > 0) {
        message.error('Please enter or select a section for all entries');
        return;
      }

      let hasInvalidSlots = false;
      sectionSchedules.forEach(section => {
        const invalidSlots = section.timeSlots.filter(slot => 
          !slot.day || !slot.startTime || !slot.endTime
        );
        if (invalidSlots.length > 0) {
          hasInvalidSlots = true;
        }
      });
      
      if (hasInvalidSlots) {
        message.error('Please fill in all time slot fields for all sections');
        return;
      }

      setLoadingSubmit(true);
      const baseUrl = SecureStorage.getLocalItem("url");
      
      // Build schedule data from all sections and their time slots
      const scheduleData = [];
      sectionSchedules.forEach(section => {
        section.timeSlots.forEach(slot => {
          scheduleData.push({
            venue_id: values.venue_id,
            section_identifier: section.sectionId, // Can be ID (number) or name (string)
            day_of_week: slot.day,
            start_time: slot.startTime.format('HH:mm:ss'),
            end_time: slot.endTime.format('HH:mm:ss')
          });
        });
      });

      const response = await fetch(`${baseUrl}/Department_Dean.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "addVenueSchedule",
          academic_session_id: activeAcademicSession.academic_session_id,
          schedules: scheduleData
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        message.success(result.message || 'Schedule added successfully!');
        setSuccess(result.message || 'Schedule added successfully!');
        setShowAddModal(false);
        addForm.resetFields();
        setSectionSchedules([{ 
          id: 1, 
          sectionId: undefined, 
          timeSlots: [{ id: 1, day: undefined, startTime: null, endTime: null }] 
        }]);
        
        // Refresh sections list if new sections were created
        if (result.created_sections && result.created_sections.length > 0) {
          const sectionsResponse = await fetch(`${baseUrl}/Department_Dean.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              operation: "fetchSections"
            })
          });
          const sectionsResult = await sectionsResponse.json();
          if (sectionsResult.status === 'success') {
            setSections(sectionsResult.data.map(section => ({
              value: section.section_id,
              label: section.section_name
            })));
          }
        }
        
        // Refresh schedule data
        if (selectedAcademicSessionId) {
          const refreshResponse = await fetch(`${baseUrl}/Department_Dean.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              operation: "fetchVenueScheduled",
              academic_session_id: selectedAcademicSessionId
            })
          });
          const refreshResult = await refreshResponse.json();
          if (refreshResult.status === 'success') {
            setScheduleData(refreshResult.data);
            setFilteredData(refreshResult.data);
          }
        }
      } else {
        message.error(result.message || 'Failed to add schedule');
      }
    } catch (err) {
      console.error('Error adding schedule:', err);
      message.error('Error adding schedule');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <div className={`${isMobile ? 'px-4 py-4 mt-13' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4 mt-mt-10">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Venue With Schedules
              </h2>
            </div>
          </motion.div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-col md:flex-row md:items-center md:justify-between gap-4'} w-full`}>
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder={isMobile ? "Search..." : "Search schedules..."}
                    allowClear
                    prefix={<SearchOutlined />}
                    size={isMobile ? "middle" : "large"}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-4'}`}>
                  <Select
                    placeholder="Select Academic Session"
                    value={selectedAcademicSessionId || undefined}
                    onChange={handleAcademicSessionChange}
                    onClear={() => {
                      setSelectedAcademicSession('');
                      setSelectedAcademicSessionId('');
                    }}
                    className={isMobile ? 'w-full' : 'w-64'}
                    size={isMobile ? "middle" : "large"}
                    suffixIcon={<CalendarOutlined />}
                    allowClear
                    optionRender={(option) => {
                      const session = availableAcademicSessions.find(s => s.value === option.value);
                      return (
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {session?.is_active === 1 && (
                            <Badge status="success" text="Active" />
                          )}
                        </div>
                      );
                    }}
                    options={availableAcademicSessions.map(session => ({
                      value: session.value,
                      label: session.label
                    }))}
                  />
                  {selectedAcademicSessionId && (
                    <Tooltip title="Mark this academic session as active">
                      <Button
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleSetActiveAcademicSession(selectedAcademicSessionId)}
                        loading={loadingActiveSession}
                        size={isMobile ? "middle" : "large"}
                        className={`${isMobile ? 'w-full' : ''} ${activeAcademicSession?.academic_session_id === selectedAcademicSessionId ? 'bg-green-100 border-green-500' : ''}`}
                        disabled={activeAcademicSession?.academic_session_id === selectedAcademicSessionId}
                      >
                        {isMobile && (activeAcademicSession?.academic_session_id === selectedAcademicSessionId ? 'Active' : 'Set Active')}
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
                <Tooltip title="Download Template">
                  <Button
                    icon={<Download />}
                    onClick={downloadTemplate}
                    size={isMobile ? "middle" : "large"}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {isMobile && 'Download Template'}
                  </Button>
                </Tooltip>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setSearchTerm('');
                      // Refresh data by re-fetching
                      if (selectedAcademicSessionId) {
                        setSelectedAcademicSessionId(selectedAcademicSessionId);
                      }
                    }}
                    size={isMobile ? "middle" : "large"}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {isMobile && 'Refresh'}
                  </Button>
                </Tooltip>
                <Tooltip title={!selectedAcademicSessionId ? "Please select an academic session first" : ""}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size={isMobile ? "middle" : "large"}
                    onClick={handleAddScheduleClick}
                    disabled={!selectedAcademicSessionId}
                    className={`bg-green-700 hover:bg-green-600 ${isMobile ? 'w-full' : ''}`}
                  >
                    {isMobile ? 'Add' : 'Add Schedule'}
                  </Button>
                </Tooltip>
                <Tooltip title={!selectedAcademicSessionId ? "Please select an academic session first" : ""}>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    size={isMobile ? "middle" : "large"}
                    onClick={handleUploadClick}
                    disabled={!selectedAcademicSessionId}
                    className={`bg-lime-900 hover:bg-green-600 ${isMobile ? 'w-full' : ''}`}
                  >
                    {isMobile ? 'Upload' : 'Upload Schedule'}
                  </Button>
                </Tooltip>
              </div>
            </div>
            {error && (
              <div className="mt-2 text-red-600 text-sm whitespace-pre-line">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-2 text-green-600 text-sm whitespace-pre-line">
                {success}
              </div>
            )}
          </div>

          {!selectedAcademicSession ? (
            <div className="text-center p-8 bg-[#fafff4] rounded-lg">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-gray-500">
                    Please select an Academic Session to view schedules
                  </span>
                }
              />
            </div>
          ) : (
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="loader"></div>
                </div>
              ) : (
                <>
                  {isMobile ? (
                    // Mobile Card View
                    <div className="space-y-3 p-3">
                      {filteredData && filteredData.length > 0 ? (
                        filteredData
                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                          .map((row, index) => (
                            <Card
                              key={index}
                              className="bg-white border border-gray-200 rounded-lg shadow-sm"
                              size="small"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-green-900" />
                                    <span className="font-medium text-sm truncate max-w-[200px]">
                                      {row.ven_name}
                                    </span>
                                  </div>
                                  <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    size="small"
                                    className="bg-green-900 hover:bg-lime-900"
                                    onClick={() => {
                                      console.log('Row data:', row);
                                      handleViewSchedule(row.ven_id, row.ven_name);
                                    }}
                                  />
                                </div>
                              </div>
                            </Card>
                          ))
                      ) : (
                        <div className="text-center py-12">
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                              <span className="text-gray-500">
                                No venues found
                              </span>
                            }
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    // Desktop/Tablet Table View
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                        <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                          <tr>
                            <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'}`}>Venue</th>
                            <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-6 py-4'}`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData && filteredData.length > 0 ? (
                            filteredData
                              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                              .map((row, index) => (
                                <tr
                                  key={index}
                                  className="bg-white border-b last:border-b-0 border-gray-200"
                                >
                                  <td className={isTablet ? 'px-3 py-3' : 'px-6 py-4'}>
                                    <div className="flex items-center">
                                      <MapPin className="w-4 h-4 text-green-900 mr-2" />
                                      <span className="font-medium">{row.ven_name}</span>
                                    </div>
                                  </td>
                                  <td className={isTablet ? 'px-3 py-3' : 'px-6 py-4'}>
                                    <div className="flex space-x-2">
                                      <Button
                                        type="primary"
                                        icon={<EyeOutlined />}
                                        size={isTablet ? "small" : "middle"}
                                        className="bg-green-900 hover:bg-lime-900"
                                        onClick={() => {
                                          console.log('Row data:', row);
                                          handleViewSchedule(row.ven_id, row.ven_name);
                                        }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                <Empty
                                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                                  description={
                                    <span className="text-gray-500 dark:text-gray-400">
                                      No venues found
                                    </span>
                                  }
                                />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={filteredData ? filteredData.length : 0}
                      onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                      }}
                      showSizeChanger={!isMobile}
                      showTotal={!isMobile ? (total, range) =>
                        `${range[0]}-${range[1]} of ${total} items` : false
                      }
                      size={isMobile ? "small" : "default"}
                      className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                      simple={isMobile}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        title="Upload Schedule File"
        open={showUploadModal}
        onCancel={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            className="bg-lime-900 hover:bg-green-600"
            onClick={handleFinalUpload}
            loading={isLoading}
            disabled={!selectedFile}
          >
            Upload
          </Button>
        ]}
      >
        <div className="space-y-4">
          {activeAcademicSession && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active Academic Session
              </label>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  {activeAcademicSession.school_year_name} - {activeAcademicSession.semester_name}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Schedule will be uploaded to this academic session
                </p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload CSV File
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file && file.type === 'text/csv') {
                  handleFileUpload(file);
                } else {
                  message.error('Please upload a CSV file');
                }
              }}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <FileText className="w-8 h-8 text-gray-400" />
                <div className="text-sm text-gray-600">
                  {selectedFile ? (
                    <span className="text-green-600 font-medium">{selectedFile.name}</span>
                  ) : (
                    <>
                      <p>Drag and drop your CSV file here, or</p>
                      <p className="text-green-600">click to select file</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".csv"
        onChange={(e) => handleFileUpload(e.target.files[0])}
      />

      {/* Add Calendar Modal */}
      <VenueScheduleCalendar
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        venId={selectedScheduleId}
        venueName={selectedVenueName}
        academicSessionId={selectedAcademicSessionId}
      />

      {/* Add Schedule Modal */}
      {isMobile ? (
        <Drawer
          title="Add Venue Schedule"
          placement="bottom"
          height="90%"
          open={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            addForm.resetFields();
            setSectionSchedules([{ 
              id: 1, 
              sectionId: undefined, 
              timeSlots: [{ id: 1, day: undefined, startTime: null, endTime: null }] 
            }]);
          }}
          footer={
            <div className="flex flex-col gap-2">
              <Button
                type="primary"
                onClick={handleSubmitSchedule}
                loading={loadingSubmit}
                className="bg-lime-900 hover:bg-green-600 w-full"
                size="large"
              >
                Submit Schedule
              </Button>
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  addForm.resetFields();
                  setSectionSchedules([{ 
                    id: 1, 
                    sectionId: undefined, 
                    timeSlots: [{ id: 1, day: undefined, startTime: null, endTime: null }] 
                  }]);
                }}
                size="large"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          }
        >
          <Form form={addForm} layout="vertical">
            {activeAcademicSession && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  {activeAcademicSession.school_year_name} - {activeAcademicSession.semester_name}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Schedule will be added to this academic session
                </p>
              </div>
            )}
            
            <Form.Item
              label="Venue"
              name="venue_id"
              rules={[{ required: true, message: 'Please select a venue' }]}
            >
              <Select
                placeholder="Select venue"
                options={venues}
                size="large"
                showSearch
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700">Sections & Schedules</label>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddSection}
                  size="small"
                  className="bg-green-50"
                >
                  Add Section
                </Button>
              </div>
              
              <div className="space-y-4">
                {sectionSchedules.map((section, sectionIndex) => (
                  <Card key={section.id} size="small" className="bg-green-50 border-green-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-green-900">Section {sectionIndex + 1}</span>
                        {sectionSchedules.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<CloseOutlined />}
                            size="small"
                            onClick={() => handleRemoveSection(section.id)}
                          />
                        )}
                      </div>
                      
                      <AutoComplete
                        placeholder="Type to create new or select existing section"
                        value={section.sectionId}
                        onChange={(value) => handleSectionChange(section.id, value)}
                        options={sections.map((sec) => ({
                          value: sec.label,
                          label: sec.label
                        }))}
                        className="w-full"
                        size="large"
                        filterOption={(inputValue, option) =>
                          option.value.toLowerCase().includes(inputValue.toLowerCase())
                        }
                      />
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-medium text-gray-600">Time Slots</label>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddTimeSlot(section.id)}
                            size="small"
                          >
                            Add Slot
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {section.timeSlots.map((slot, slotIndex) => (
                            <Card key={slot.id} size="small" className="bg-white">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-gray-600">Slot {slotIndex + 1}</span>
                                  {section.timeSlots.length > 1 && (
                                    <Button
                                      type="text"
                                      danger
                                      icon={<CloseOutlined />}
                                      size="small"
                                      onClick={() => handleRemoveTimeSlot(section.id, slot.id)}
                                    />
                                  )}
                                </div>
                                
                                <Select
                                  placeholder="Day of week"
                                  value={slot.day}
                                  onChange={(value) => handleTimeSlotChange(section.id, slot.id, 'day', value)}
                                  className="w-full"
                                  size="large"
                                  options={[
                                    { value: 'Monday', label: 'Monday' },
                                    { value: 'Tuesday', label: 'Tuesday' },
                                    { value: 'Wednesday', label: 'Wednesday' },
                                    { value: 'Thursday', label: 'Thursday' },
                                    { value: 'Friday', label: 'Friday' },
                                    { value: 'Saturday', label: 'Saturday' },
                                    { value: 'Sunday', label: 'Sunday' }
                                  ]}
                                />
                                
                                <div className="flex gap-2">
                                  <TimePicker
                                    placeholder="Start time"
                                    value={slot.startTime}
                                    onChange={(time) => handleTimeSlotChange(section.id, slot.id, 'startTime', time)}
                                    format="HH:mm"
                                    className="flex-1"
                                    size="large"
                                  />
                                  <TimePicker
                                    placeholder="End time"
                                    value={slot.endTime}
                                    onChange={(time) => handleTimeSlotChange(section.id, slot.id, 'endTime', time)}
                                    format="HH:mm"
                                    className="flex-1"
                                    size="large"
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Form>
        </Drawer>
      ) : (
        <Modal
          title="Add Venue Schedule"
          open={showAddModal}
          onCancel={() => {
            setShowAddModal(false);
            addForm.resetFields();
            setSectionSchedules([{ 
              id: 1, 
              sectionId: undefined, 
              timeSlots: [{ id: 1, day: undefined, startTime: null, endTime: null }] 
            }]);
          }}
          width={isTablet ? 600 : 700}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setShowAddModal(false);
                addForm.resetFields();
                setSectionSchedules([{ 
                  id: 1, 
                  sectionId: undefined, 
                  timeSlots: [{ id: 1, day: undefined, startTime: null, endTime: null }] 
                }]);
              }}
            >
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleSubmitSchedule}
              loading={loadingSubmit}
              className="bg-lime-900 hover:bg-green-600"
            >
              Submit Schedule
            </Button>
          ]}
        >
          <Form form={addForm} layout="vertical">
            {activeAcademicSession && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  {activeAcademicSession.school_year_name} - {activeAcademicSession.semester_name}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Schedule will be added to this academic session
                </p>
              </div>
            )}
            
            <Form.Item
              label="Venue"
              name="venue_id"
              rules={[{ required: true, message: 'Please select a venue' }]}
            >
              <Select
                placeholder="Select venue"
                options={venues}
                showSearch
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700">Sections & Schedules</label>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddSection}
                  size="small"
                  className="bg-green-50"
                >
                  Add Section
                </Button>
              </div>
              
              <div className="space-y-4">
                {sectionSchedules.map((section, sectionIndex) => (
                  <Card key={section.id} size="small" className="bg-green-50 border-green-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-green-900">Section {sectionIndex + 1}</span>
                        {sectionSchedules.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<CloseOutlined />}
                            size="small"
                            onClick={() => handleRemoveSection(section.id)}
                          />
                        )}
                      </div>
                      
                      <AutoComplete
                        placeholder="Type to create new or select existing section"
                        value={section.sectionId}
                        onChange={(value) => handleSectionChange(section.id, value)}
                        options={sections.map((sec) => ({
                          value: sec.label,
                          label: sec.label
                        }))}
                        className="w-full"
                        filterOption={(inputValue, option) =>
                          option.value.toLowerCase().includes(inputValue.toLowerCase())
                        }
                      />
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-medium text-gray-600">Time Slots</label>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddTimeSlot(section.id)}
                            size="small"
                          >
                            Add Slot
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {section.timeSlots.map((slot, slotIndex) => (
                            <Card key={slot.id} size="small" className="bg-white">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-gray-600">Slot {slotIndex + 1}</span>
                                  {section.timeSlots.length > 1 && (
                                    <Button
                                      type="text"
                                      danger
                                      icon={<CloseOutlined />}
                                      size="small"
                                      onClick={() => handleRemoveTimeSlot(section.id, slot.id)}
                                    />
                                  )}
                                </div>
                                
                                <Select
                                  placeholder="Select day of week"
                                  value={slot.day}
                                  onChange={(value) => handleTimeSlotChange(section.id, slot.id, 'day', value)}
                                  className="w-full"
                                  options={[
                                    { value: 'Monday', label: 'Monday' },
                                    { value: 'Tuesday', label: 'Tuesday' },
                                    { value: 'Wednesday', label: 'Wednesday' },
                                    { value: 'Thursday', label: 'Thursday' },
                                    { value: 'Friday', label: 'Friday' },
                                    { value: 'Saturday', label: 'Saturday' },
                                    { value: 'Sunday', label: 'Sunday' }
                                  ]}
                                />
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <TimePicker
                                    placeholder="Start time"
                                    value={slot.startTime}
                                    onChange={(time) => handleTimeSlotChange(section.id, slot.id, 'startTime', time)}
                                    format="HH:mm"
                                    className="w-full"
                                  />
                                  <TimePicker
                                    placeholder="End time"
                                    value={slot.endTime}
                                    onChange={(time) => handleTimeSlotChange(section.id, slot.id, 'endTime', time)}
                                    format="HH:mm"
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default VenueSchedule;