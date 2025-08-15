import React, { useState, useRef, useEffect } from 'react';
import {  Download, MapPin,FileText} from 'lucide-react';
import Papa from 'papaparse';
import { SecureStorage } from '../utils/encryption';
import { Modal, Input, Button, Tooltip, Empty, Pagination, Select, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import dayjs from 'dayjs';
import VenueScheduleCalendar from './component/Venue_ScheduleCalendar';

import Sidebar from '../components/core/Sidebar';



const VenueSchedule = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [availableSchoolYears, setAvailableSchoolYears] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [selectedVenueName, setSelectedVenueName] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const baseUrl = SecureStorage.getLocalItem("url");
        const response = await fetch(`${baseUrl}/Department_Dean.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: "fetchSchoolYear"
          })
        });
        const result = await response.json();
        if (result.status === 'success') {
          setAvailableSchoolYears(result.data.map(year => ({
            value: year.school_year_name,
            label: year.school_year_name,
            id: year.school_year_id
          })));
        }
      } catch (err) {
        console.error('Error fetching school years:', err);
      }
    };
    fetchSchoolYears();
  }, []);

  useEffect(() => {
    const fetchSemesters = async () => {
      if (!selectedSchoolYearId) {
        setAvailableSemesters([]);
        return;
      }

      try {
        const baseUrl = SecureStorage.getLocalItem("url");
        const response = await fetch(`${baseUrl}/Department_Dean.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: "fetchSemester",
            school_year_id: selectedSchoolYearId
          })
        });
        const result = await response.json();
        if (result.status === 'success') {
          setAvailableSemesters(result.data.map(semester => ({
            value: semester.semester_id,
            label: semester.semester_name
          })));
        }
      } catch (err) {
        console.error('Error fetching semesters:', err);
      }
    };

    fetchSemesters();
  }, [selectedSchoolYearId]);

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!selectedSemesterId) return;
      
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
            semester_id: selectedSemesterId
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
  }, [selectedSemesterId]);

  useEffect(() => {
    const filtered = scheduleData.filter(item => 
      Object.values(item).some(val => 
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [searchTerm, scheduleData]);

  const uploadToDatabase = async (file, schoolYear, semester, startDate, endDate) => {
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

          // Prepare the final payload
          const payload = {
            operation: "uploadClassroomCSV",
            school_year_name: schoolYear,
            semester_name: semester === '1' ? 'First Semester' : 
                         semester === '2' ? 'Second Semester' : 'Summer',
            semester_start: startDate.format('YYYY-MM-DD'),
            semester_end: endDate.format('YYYY-MM-DD'),
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
            setScheduleData(transformedData);
            setFilteredData(transformedData);
            
            // Create success message with skipped entries info
            let successMessage = `Successfully uploaded ${result.message}`;
            if (result.skipped_count > 0) {
              successMessage += `\n\n${result.skipped_count} entry(ies) were skipped:`;
              result.skipped.forEach(skip => {
                successMessage += `\n- ${skip.section_name} in ${skip.venue_name} (${skip.day} ${skip.start_time}-${skip.end_time}): ${skip.reason}`;
              });
            }
            
            setSuccess(successMessage);
            setError('');
            setShowUploadModal(false);
            setShowFileUpload(false);
            setSelectedFile(null);
            setSelectedSchoolYear('');
            setSelectedSemester('');
            setStartDate(null);
            setEndDate(null);
          } else {
            setError(result.message || 'Failed to upload schedule to database');
          }
        } catch (err) {
          console.error('CSV Processing Error:', err);
          setError('Error processing CSV file: ' + err.message);
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file');
        setIsLoading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      console.error('Upload Error:', err);
      setError('Error uploading to database: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    setSelectedFile(file);
    setShowFileUpload(true);
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
    setShowFileUpload(false);
  };

  const handleProceedToFileUpload = () => {
    if (!selectedSchoolYear || !selectedSemester || !startDate || !endDate) {
      setError('Please fill in all fields');
      return;
    }
    setShowFileUpload(true);
  };

  const handleFinalUpload = () => {
    if (selectedFile && selectedSchoolYear && selectedSemester && startDate && endDate) {
      uploadToDatabase(selectedFile, selectedSchoolYear, selectedSemester, startDate, endDate);
    } else {
      setError('Please fill in all required fields and select a file');
    }
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



  const handleSchoolYearChange = (value) => {
    const selectedYear = availableSchoolYears.find(year => year.value === value);
    setSelectedSchoolYear(value);
    setSelectedSchoolYearId(selectedYear?.id || '');
    setSelectedSemester(''); // Reset semester when school year changes
    setSelectedSemesterId(''); // Reset semester ID
  };

  const handleSemesterChange = (value) => {
    setSelectedSemester(value);
    // Find the selected semester object to get its ID
    const selectedSem = availableSemesters.find(sem => sem.value === value);
    setSelectedSemesterId(selectedSem?.value || '');
  };

  const handleViewSchedule = (venId, venueName) => {
    console.log('View schedule clicked:', { venId, venueName });
    setSelectedScheduleId(venId);
    setSelectedVenueName(venueName);
    setShowCalendar(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <Sidebar />
      <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="p-[2.5rem] lg:p-12 min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="mb-4 mt-20">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Venue Schedule Management
              </h2>
            </div>
          </motion.div>

          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder="Search schedules..."
                    allowClear
                    prefix={<SearchOutlined />}
                    size="large"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-4">
                  <Select
                    placeholder="Select School Year"
                    value={selectedSchoolYear}
                    onChange={handleSchoolYearChange}
                    className="w-48"
                    options={[
                      { value: '', label: 'Select School Year' },
                      ...availableSchoolYears
                    ]}
                  />
                  <Select
                    placeholder="Select Semester"
                    value={selectedSemester}
                    onChange={handleSemesterChange}
                    className="w-48"
                    options={[
                      { value: '', label: 'Select Semester' },
                      ...availableSemesters
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Tooltip title="Download Template">
                  <Button
                    icon={<Download />}
                    onClick={downloadTemplate}
                    size="large"
                  />
                </Tooltip>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setSearchTerm('');
                      // Refresh data by re-fetching
                      if (selectedSchoolYear && selectedSemester) {
                        setSelectedSchoolYear(selectedSchoolYear);
                        setSelectedSemester(selectedSemester);
                      }
                    }}
                    size="large"
                  />
                </Tooltip>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={handleUploadClick}
                  className="bg-lime-900 hover:bg-green-600"
                >
                  Upload Schedule
                </Button>
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

          {!selectedSchoolYear || !selectedSemester ? (
            <div className="text-center p-8 bg-[#fafff4] rounded-lg">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-gray-500">
                    Please select a School Year and Semester to view schedules
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
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                      <tr>
                        <th scope="col" className="px-6 py-3">Venue</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData && filteredData.length > 0 ? (
                        filteredData
                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                          .map((row, index) => (
                            <tr
                              key={index}
                              className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 text-green-900 mr-2" />
                                  <span className="font-medium">{row.ven_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    size="middle"
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
                          <td colSpan={2} className="px-6 py-24 text-center">
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

                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={filteredData ? filteredData.length : 0}
                      onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                      }}
                      showSizeChanger={true}
                      showTotal={(total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`
                      }
                      className="flex justify-end"
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
        title={showFileUpload ? "Upload Schedule File" : "Select Academic Period"}
        open={showUploadModal}
        onCancel={() => {
          setShowUploadModal(false);
          setShowFileUpload(false);
          setSelectedFile(null);
          setSelectedSchoolYear('');
          setSelectedSemester('');
          setStartDate(null);
          setEndDate(null);
        }}
        footer={showFileUpload ? [
          <Button
            key="back"
            onClick={() => setShowFileUpload(false)}
          >
            Back
          </Button>,
          <Button
            key="cancel"
            onClick={() => {
              setShowUploadModal(false);
              setShowFileUpload(false);
              setSelectedFile(null);
              setSelectedSchoolYear('');
              setSelectedSemester('');
              setStartDate(null);
              setEndDate(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            className="bg-lime-900 hover:bg-green-600"
            onClick={handleFinalUpload}
          >
            Upload
          </Button>
        ] : [
          <Button
            key="cancel"
            onClick={() => {
              setShowUploadModal(false);
              setSelectedSchoolYear('');
              setSelectedSemester('');
              setStartDate(null);
              setEndDate(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="proceed"
            type="primary"
            className="bg-lime-900 hover:bg-green-600"
            onClick={handleProceedToFileUpload}
          >
            Proceed
          </Button>
        ]}
      >
        {!showFileUpload ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Year
              </label>
              <DatePicker.RangePicker
                className="w-full"
                picker="year"
                placeholder={['Start Year', 'End Year']}
                value={selectedSchoolYear ? [
                  dayjs(selectedSchoolYear.split('-')[0]),
                  dayjs(selectedSchoolYear.split('-')[1])
                ] : [null, null]}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    const startYear = dates[0].year();
                    const endYear = dates[1].year();
                    setSelectedSchoolYear(`${startYear}-${endYear}`);
                  } else {
                    setSelectedSchoolYear('');
                  }
                }}
                format="YYYY"
                allowClear
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <Select
                className="w-full"
                placeholder="Select semester"
                value={selectedSemester}
                onChange={handleSemesterChange}
                options={[
                  { value: '1', label: 'First Semester' },
                  { value: '2', label: 'Second Semester' },
                  { value: '3', label: 'Summer' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DatePicker
                className="w-full"
                value={startDate}
                onChange={setStartDate}
                format="YYYY-MM-DD"
                placeholder="Select start date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <DatePicker
                className="w-full"
                value={endDate}
                onChange={setEndDate}
                format="YYYY-MM-DD"
                placeholder="Select end date"
                disabledDate={(current) => {
                  return startDate && current && current < startDate;
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selected Academic Period
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">School Year: {selectedSchoolYear}</p>
                <p className="text-sm text-gray-600">
                  Semester: {
                    selectedSemester === '1' ? 'First Semester' :
                    selectedSemester === '2' ? 'Second Semester' :
                    'Summer'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  Period: {startDate?.format('MMM DD, YYYY')} - {endDate?.format('MMM DD, YYYY')}
                </p>
              </div>
            </div>
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
                    setError('Please upload a CSV file');
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    {selectedFile ? (
                      <span className="text-green-600">{selectedFile.name}</span>
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
        )}
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
      />
    </div>
  );
};

export default VenueSchedule;