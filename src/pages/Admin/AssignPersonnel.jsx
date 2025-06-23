import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Sidebar from '../Sidebar';
import {  Button, Input, Tooltip, Empty, Pagination } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserPlus, faEye, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import AssignModal from './core/Assign_Modal';
import AllAssignedPersonnel from './core/allassigned_personnel';
import { SecureStorage } from '../../utils/encryption';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const AssignPersonnel = () => {
  const [activeTab, setActiveTab] = useState('Not Assigned');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");



  const handleAssignSuccess = (updatedReservation) => {
    setReservations(prev => 
      prev.map(res => 
        res.id === updatedReservation.id ? updatedReservation : res
      )
    );
    
    if (activeTab === 'Not Assigned') {
      fetchNotAssignedReservations();
    }
  };


  const fetchNotAssignedReservations = async () => {
    setLoading(true);
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      const response = await axios.post(`${encryptedUrl}records&reports.php`, {
        operation: 'fetchNoAssignedReservation'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => ({
          id: item.reservation_id,
          type: item.venue_form_name ? 'Venue' : 'Vehicle',
          title: item.reservation_title || 'Untitled',
          name: item.reservation_title || 'Untitled',
          requestor: item.requestor_name || 'Unknown',
          details: item.venue_details || item.vehicle_details,
          personnel: 'N/A',
          checklists: [],
          status: 'Not Assigned',
          createdAt: new Date(item.reservation_created_at).toLocaleString()
        }));
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Error fetching unassigned reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedReservations = async () => {
    setLoading(true);
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      const response = await axios.post(`${encryptedUrl}user.php`, {
        operation: 'fetchAllAssignedReleases'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => {
          // Calculate progress based on checklist completion
          let totalChecklists = 0;
          let completedChecklists = 0;

          // Check venues and their checklists
          if (item.venues && item.venues.length > 0) {
            item.venues.forEach(venue => {
              if (venue.checklists) {
                totalChecklists += venue.checklists.length;
                completedChecklists += venue.checklists.filter(checklist => 
                  checklist.isChecked === 1
                ).length;
              }
            });
          }

          // Check vehicles if they exist
          if (item.vehicles && item.vehicles.length > 0) {
            item.vehicles.forEach(vehicle => {
              if (vehicle.checklists) {
                totalChecklists += vehicle.checklists.length;
                completedChecklists += vehicle.checklists.filter(checklist => 
                  checklist.isChecked === 1
                ).length;
              }
            });
          }

          const progress = totalChecklists > 0 ? (completedChecklists / totalChecklists) * 100 : 0;

          return {
            id: item.reservation_id,
            title: item.reservation_title,
            name: item.reservation_title,
            requestor: item.user_details?.full_name || 'Unknown',
            startDate: item.reservation_start_date,
            endDate: item.reservation_end_date,
            personnel: item.venues?.[0]?.checklists?.[0]?.personnel_name || 'Not Assigned',
            progress: Math.round(progress),
            status: 'Assigned',
            rawData: item
          };
        });
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching assigned reservations:', error);
      toast.error('Error fetching assigned reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedReservations = async () => {
    setLoading(true);
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      const response = await axios.post(`${encryptedUrl}records&reports.php`, {
        operation: 'fetchCompletedRelease'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => {
          const masterData = item.master_data;
          return {
            id: masterData.reservation_id,
            type: masterData.venue_form_name ? 'Venue' : 'Vehicle',
            name: masterData.venue_form_name || masterData.vehicle_form_name,
            details: '',
            personnel: masterData.personnel_name || 'Unknown',
            checklists: masterData.venue_form_name 
              ? item.venue_equipment.map(eq => ({
                  name: eq.release_checklist_name,
                  status: masterData.status_checklist_name || 'Completed'
                }))
              : item.vehicle_checklist.map(vc => ({
                  name: vc.release_checklist_name,
                  status: masterData.status_checklist_name || 'Completed'
                })),
            status: 'Completed',
            createdAt: masterData.reservation_date
          };
        });
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching completed reservations:', error);
      toast.error('Error fetching completed reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    if (activeTab === 'Not Assigned') {
      fetchNotAssignedReservations();
    } else if (activeTab === 'Assigned') {
      fetchAssignedReservations();
    } else if (activeTab === 'Completed') {
      fetchCompletedReservations();
    }
  }, [activeTab]);

  // Filter reservations based on search term and active tab
  const filteredReservations = reservations
    .filter(res => res.status === activeTab)
    .filter(res => {
      const searchableText = res.name || res.title || '';
      return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Table columns configuration
  const columns = [
    {
      title: 'Reservation Title',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      sortOrder: sortField === 'title' ? sortOrder : null,
      render: (text) => <span className="font-medium text-green-800">{text}</span>
    },
    {
      title: 'Requestor',
      dataIndex: 'requestor',
      key: 'requestor',
      sorter: true,
      sortOrder: sortField === 'requestor' ? sortOrder : null,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: true,
      sortOrder: sortField === 'startDate' ? sortOrder : null,
      render: (text) => dayjs(text).format('MMM D, YYYY HH:mm')
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      sorter: true,
      sortOrder: sortField === 'endDate' ? sortOrder : null,
      render: (text) => dayjs(text).format('MMM D, YYYY HH:mm')
    },
    {
      title: 'Assigned Personnel',
      dataIndex: 'personnel',
      key: 'personnel',
      sorter: true,
      sortOrder: sortField === 'personnel' ? sortOrder : null,
      render: (text) => {
        if (text === 'Not Assigned') {
          return <span className="text-gray-500 italic">Not Assigned</span>;
        }
        return (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2 text-green-600 font-medium">
              {text.charAt(0)}
            </div>
            <span>{text}</span>
          </div>
        );
      }
    },
    ...(activeTab !== 'Not Assigned' ? [{
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      sorter: true,
      sortOrder: sortField === 'progress' ? sortOrder : null,
      render: (progress) => (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )
    }] : []),
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Tooltip title={activeTab === 'Not Assigned' ? "Assign Personnel" : "View Checklists"}>
          <Button
            icon={<FontAwesomeIcon icon={activeTab === 'Not Assigned' ? faUserPlus : faEye} />}
            onClick={() => {
              if (activeTab === 'Not Assigned') {
                setSelectedReservation(record);
                setIsModalOpen(true);
              } else {
                setSelectedReservation(record.rawData);
                setIsChecklistModalOpen(true);
              }
            }}
            size="small"
            className="border-gray-300 text-gray-600"
          >
            {activeTab === 'Not Assigned' ? 'Assign' : 'View'}
          </Button>
        </Tooltip>
      ),
    },
  ];

  const handleRefresh = () => {
    if (activeTab === 'Not Assigned') {
      fetchNotAssignedReservations();
    } else if (activeTab === 'Assigned') {
      fetchAssignedReservations();
    } else if (activeTab === 'Completed') {
      fetchCompletedReservations();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="p-[2.5rem] lg:p-12 min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-custom-font font-bold text-green-900 mt-5">
                Assign Personnel
              </h2>
            </div>
          </motion.div>
          
          {/* Tabs */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex">
                {[
                  {
                    key: 'Not Assigned',
                    label: 'Not Assigned',
                    icon: <ClockCircleOutlined />,
                    count: reservations.filter(r => r.status === 'Not Assigned').length,
                    color: 'blue'
                  },
                  {
                    key: 'Assigned',
                    label: 'Assigned',
                    icon: <CheckCircleOutlined />,
                    count: reservations.filter(r => r.status === 'Assigned').length,
                    color: 'amber'
                  }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-colors duration-200 ${
                      activeTab === tab.key
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <span className={`text-base ${activeTab === tab.key ? 'text-green-600' : `text-${tab.color}-500`}`}>
                      {tab.icon}
                    </span>
                    <span className="font-medium text-sm">
                      {tab.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.key
                        ? 'bg-green-100 text-green-600'
                        : `bg-${tab.color}-50 text-${tab.color}-600`
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Search & Controls */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder="Search reservations by name"
                    allowClear
                    prefix={<FontAwesomeIcon icon={faSearch} className="text-gray-400" />}
                    size="large"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Tooltip title="Refresh data">
                  <Button
                    icon={<FontAwesomeIcon icon={faSyncAlt} spin={loading} />}
                    onClick={handleRefresh}
                    size="large"
                    loading={loading}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3"
                      onClick={() =>
                        column.sorter && handleSort(column.dataIndex)
                      }
                    >
                      <div className="flex items-center cursor-pointer hover:text-gray-900">
                        {column.title}
                        {sortField === column.dataIndex && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-24 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
                        <span className="ml-3 text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredReservations.length > 0 ? (
                  filteredReservations
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.id}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.id}-${column.key}`}
                            className="px-6 py-4"
                          >
                            {column.render
                              ? column.render(record[column.dataIndex], record)
                              : record[column.dataIndex]}
                          </td>
                        ))}
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-24 text-center"
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className="text-gray-500 dark:text-gray-400">
                            No reservations found
                          </span>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredReservations.length}
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
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <AssignModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReservation(null);
        }}
        selectedReservation={selectedReservation}
        onSuccess={handleAssignSuccess}
      />

      {/* Checklist Modal */}
      <AllAssignedPersonnel
        isOpen={isChecklistModalOpen}
        onClose={() => {
          setIsChecklistModalOpen(false);
          setSelectedReservation(null);
        }}
        reservationData={selectedReservation}
      />
    </div>
  );
};

export default AssignPersonnel;