import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { Button, Input, Tooltip, Empty, Pagination, Card, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { SearchOutlined, ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, TagOutlined, WarningOutlined } from '@ant-design/icons';
import { FaUsers } from 'react-icons/fa';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import AssignModal from './core/Assign_Modal';
import AllAssignedPersonnel from './core/allassigned_personnel';
import ReAssignModal from './core/ReAssignModal';
import { SecureStorage } from '../../utils/encryption';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// const { Text } = Typography;

const AssignPersonnel = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

  const [activeTab, setActiveTab] = useState('Not Assigned');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");


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

  // Network status monitoring

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

  const fetchNotAssignedReservations = useCallback(async () => {
    setLoading(true);
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      const response = await axios.post(`${encryptedUrl}Assigned&Records.php`, {
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
      
      // Check for network errors
      if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {

 
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else if (error.response) {
        // Server responded with error
        toast.error(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response

        toast.error('Unable to reach the server. Please try again later.');
      } else {
        toast.error('Error fetching unassigned reservations');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssignedReservations = useCallback(async () => {
    setLoading(true);
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      const response = await axios.post(`${encryptedUrl}Assigned&Records.php`, {
        operation: 'fetchAllAssignedReleases'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => {
          // Defensive filtering: Ensure venues, vehicles, and equipments arrays contain correct items
          if (item.venues) {
            item.venues = item.venues.filter(v => 
              v.reservation_venue_id && v.name && !v.vehicle_license && !v.vehicle_model_id
            );
          }
          if (item.vehicles) {
            item.vehicles = item.vehicles.filter(v => 
              v.reservation_vehicle_id && v.vehicle_license && v.vehicle_model_id && !v.name
            );
          }
          if (item.equipments) {
            item.equipments = item.equipments.filter(e => 
              e.reservation_equipment_id && e.quantity !== undefined && !e.vehicle_license && !e.reservation_venue_id
            );
          }

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

          // Check equipments if they exist
          if (item.equipments && item.equipments.length > 0) {
            item.equipments.forEach(equipment => {
              if (equipment.checklists) {
                totalChecklists += equipment.checklists.length;
                completedChecklists += equipment.checklists.filter(checklist => 
                  checklist.isChecked === 1
                ).length;
              }
            });
          }

          const progress = totalChecklists > 0 ? (completedChecklists / totalChecklists) * 100 : 0;

          // Check if all resources are released and returned
          let allReleased = true;
          let allReturned = true;
          let hasResources = false;

          // Check venues
          if (item.venues && item.venues.length > 0) {
            hasResources = true;
            item.venues.forEach(venue => {
              if (venue.active !== -1 && (venue.is_released !== 1 && venue.is_released !== '1')) {
                allReleased = false;
              }
              if (venue.active !== -1 && (venue.is_returned !== 1 && venue.is_returned !== '1')) {
                allReturned = false;
              }
            });
          }

          // Check vehicles
          if (item.vehicles && item.vehicles.length > 0) {
            hasResources = true;
            item.vehicles.forEach(vehicle => {
              if (vehicle.active !== -1 && (vehicle.is_released !== 1 && vehicle.is_released !== '1')) {
                allReleased = false;
              }
              if (vehicle.active !== -1 && (vehicle.is_returned !== 1 && vehicle.is_returned !== '1')) {
                allReturned = false;
              }
            });
          }

          // Check equipments
          if (item.equipments && item.equipments.length > 0) {
            hasResources = true;
            item.equipments.forEach(equipment => {
              // For consumable equipment (no units)
              if (!equipment.units || equipment.units.length === 0) {
                if (equipment.active !== -1 && (equipment.is_released !== 1 && equipment.is_released !== '1')) {
                  allReleased = false;
                }
                if (equipment.active !== -1 && (equipment.is_returned !== 1 && equipment.is_returned !== '1')) {
                  allReturned = false;
                }
              } else {
                // For equipment with units, check each unit
                equipment.units.forEach(unit => {
                  if (unit.active !== -1 && (unit.is_released !== 1 && unit.is_released !== '1')) {
                    allReleased = false;
                  }
                  if (unit.active !== -1 && (unit.is_returned !== 1 && unit.is_returned !== '1')) {
                    allReturned = false;
                  }
                });
              }
            });
          }

          const needsMarkingAsDone = hasResources && allReleased && allReturned;

          // Extract assigned personnel from checklists
          let assignedPersonnel = 'Not Assigned';
          
          // Check venues for assigned personnel
          if (item.venues && item.venues.length > 0) {
            for (const venue of item.venues) {
              if (venue.checklists && venue.checklists.length > 0) {
                for (const checklist of venue.checklists) {
                  if (checklist.personnel_name) {
                    assignedPersonnel = checklist.personnel_name;
                    break;
                  }
                }
                if (assignedPersonnel !== 'Not Assigned') break;
              }
            }
          }
          
          // Check vehicles for assigned personnel if not found in venues
          if (assignedPersonnel === 'Not Assigned' && item.vehicles && item.vehicles.length > 0) {
            for (const vehicle of item.vehicles) {
              if (vehicle.checklists && vehicle.checklists.length > 0) {
                for (const checklist of vehicle.checklists) {
                  if (checklist.personnel_name) {
                    assignedPersonnel = checklist.personnel_name;
                    break;
                  }
                }
                if (assignedPersonnel !== 'Not Assigned') break;
              }
            }
          }
          
          // Check equipments for assigned personnel if not found in venues or vehicles
          if (assignedPersonnel === 'Not Assigned' && item.equipments && item.equipments.length > 0) {
            for (const equipment of item.equipments) {
              if (equipment.checklists && equipment.checklists.length > 0) {
                for (const checklist of equipment.checklists) {
                  if (checklist.personnel_name) {
                    assignedPersonnel = checklist.personnel_name;
                    break;
                  }
                }
                if (assignedPersonnel !== 'Not Assigned') break;
              }
            }
          }

          return {
            id: item.reservation_id,
            title: item.reservation_title,
            name: item.reservation_title,
            requestor: item.user_details?.full_name || 'Unknown',
            startDate: item.reservation_start_date,
            endDate: item.reservation_end_date,
            personnel: assignedPersonnel,
            progress: Math.round(progress),
            status: 'Assigned',
            statusName: item.status_name || 'N/A',
            statusId: item.status_id,
            active: item.active,
            needsMarkingAsDone: needsMarkingAsDone,
            reservationType: item.reservation_type || 'Unknown',
            rawData: item
          };
        });
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching assigned reservations:', error);
      
      // Check for network errors
      if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {


        toast.error('Unable to connect to server. Please check your internet connection.');
      } else if (error.response) {
        // Server responded with error
        toast.error(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response
 
        toast.error('Unable to reach the server. Please try again later.');
      } else {
        toast.error('Error fetching assigned reservations');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // const fetchReassignReservations = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const encryptedUrl = SecureStorage.getLocalItem("url");
  //     const response = await axios.post(`${encryptedUrl}Assigned&Records.php`, {
  //       operation: 'fetchAllReassign'
  //     }, {
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (response.data.status === 'success' && Array.isArray(response.data.data)) {
  //       const formattedData = response.data.data.map(item => ({
  //         id: item.reservation_id,
  //         title: item.reservation_title,
  //         name: item.reservation_title,
  //         requestor: item.requestor_name || 'Unknown',
  //         startDate: item.reservation_start_date,
  //         endDate: item.reservation_end_date,
  //         personnel: item.assigned_personnel || 'Needs Reassignment',
  //         status: 'Reassign',
  //         rawData: item
  //       }));
  //       setReservations(formattedData);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching reassign reservations:', error);
  //     
  //     // Check for network errors
  //     if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {

  //       toast.error('Unable to connect to server. Please check your internet connection.');
  //     } else if (error.response) {
  //       // Server responded with error
  //       toast.error(`Server error: ${error.response.status}`);
  //     } else if (error.request) {

  //       toast.error('Unable to reach the server. Please try again later.');
  //     } else {
  //       toast.error('Error fetching reassign reservations');
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);
  const fetchReassignReservations = useCallback(async () => {
    setLoading(true);
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      const response = await axios.post(`${encryptedUrl}Assigned&Records.php`, {
        operation: 'fetchAllReassign'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => ({
          id: item.reservation_id,
          title: item.reservation_title,
          name: item.reservation_title,
          requestor: item.requestor_name || 'Unknown',
          startDate: item.reservation_start_date,
          endDate: item.reservation_end_date,
          personnel: item.assigned_personnel || 'Needs Reassignment',
          status: 'Reassign',
          rawData: item
        }));
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching reassign reservations:', error);
      if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else if (error.response) {
        toast.error(`Server error: ${error.response.status}`);
      } else if (error.request) {
        toast.error('Unable to reach the server. Please try again later.');
      } else {
        toast.error('Error fetching reassign reservations');
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
    } 
    else if (activeTab === 'Reassign') {
      fetchReassignReservations();
    }
  }, [activeTab, fetchNotAssignedReservations, fetchAssignedReservations, fetchReassignReservations]);

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
    ...(activeTab === 'Assigned' ? [{
      title: 'Type',
      dataIndex: 'reservationType',
      key: 'reservationType',
      sorter: true,
      sortOrder: sortField === 'reservationType' ? sortOrder : null,
      render: (type) => (
        <Tag color={
          type === 'Trip' ? 'blue' :
          type === 'Activity/Event' ? 'purple' :
          type === 'EQ' ? 'orange' : 'default'
        }>
          {type}
        </Tag>
      )
    }] : []),
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
      render: (text, record) => {
        if (text === 'Not Assigned') {
          return <span className="text-gray-500 italic">Not Assigned</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
              {text.charAt(0)}
            </div>
            <span>{text}</span>
            {activeTab === 'Assigned' && record.needsMarkingAsDone && record.statusName !== 'Completed' && (
              <Tooltip title="All resources released and returned. Ready to mark as done.">
                <WarningOutlined className="text-amber-500" />
              </Tooltip>
            )}
          </div>
        );
      }
    },
    ...(activeTab === 'Assigned' ? [{
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      sorter: true,
      sortOrder: sortField === 'progress' ? sortOrder : null,
      render: (progress, record) => {
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
            {record.needsMarkingAsDone && record.statusName !== 'Completed' && (
              <Tooltip title="All resources released and returned. Ready to mark as done.">
                <WarningOutlined className="text-amber-500" />
              </Tooltip>
            )}
          </div>
        );
      }
    }] : []),
    ...(activeTab === 'Assigned' ? [{
      title: 'Status',
      dataIndex: 'statusName',
      key: 'statusName',
      sorter: true,
      sortOrder: sortField === 'statusName' ? sortOrder : null,
      render: (statusName, record) => (
        <div className="flex items-center">
          <TagOutlined className="mr-2 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">{statusName}</span>
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
              } 
              else if (activeTab === 'Reassign') {
                setSelectedReservation(record);
                setIsReassignModalOpen(true);
              } 
              else {
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

const handleRefresh = useCallback(() => {
  if (!navigator.onLine) {
    toast.error('Cannot refresh while offline. Please check your internet connection.');
    return;
  }

  if (activeTab === 'Not Assigned') {
    fetchNotAssignedReservations();
  } else if (activeTab === 'Assigned') {
    fetchAssignedReservations();
  } 
  else if (activeTab === 'Reassign') {
    fetchReassignReservations();
  }
}, [
  activeTab, 
  fetchNotAssignedReservations, 
  fetchAssignedReservations
]);

    useEffect(() => {
    const handleOnline = () => {


      toast.success('Connection restored');
      // Refresh data when connection is restored
      handleRefresh();
    };

    const handleOffline = () => {

      toast.error('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleRefresh]);


  // // Mobile card rendering function
  // const renderMobileCards = (reservations) => {
  //   return (
  //     <div className="space-y-3">
  //       {reservations.map((record) => (
  //         <Card 
  //           key={record.id}
  //           className="shadow-sm border border-gray-200"
  //           bodyStyle={{ padding: isMobile ? '12px' : '16px' }}
  //         >
  //           <div className="space-y-3">
  //             {/* Header with title and status */}
  //             <div className="flex justify-between items-start">
  //               <div className="flex-1 min-w-0">
  //                 <h3 className="text-sm font-semibold text-green-800 truncate">
  //                   {record.title}
  //                 </h3>
  //                 <p className="text-xs text-gray-600 mt-1">
  //                   Requestor: {record.requestor}
  //                 </p>
  //               </div>
  //               <Badge 
  //                 color={
  //                   activeTab === 'Not Assigned' ? 'blue' : 
  //                   activeTab === 'Assigned' ? 'green' : 'orange'
  //                 }
  //                 text={activeTab}
  //                 className="ml-2 flex-shrink-0"
  //               />
  //             </div>

  //             {/* Dates */}
  //             <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
  //               {record.startDate && (
  //                 <div>
  //                   <span className="font-medium">Start:</span> {dayjs(record.startDate).format('MMM D, YYYY HH:mm')}
  //                 </div>
  //               )}
  //               {record.endDate && (
  //                 <div>
  //                   <span className="font-medium">End:</span> {dayjs(record.endDate).format('MMM D, YYYY HH:mm')}
  //                 </div>
  //               )}
  //             </div>

  //             {/* Personnel */}
  //             <div className="flex items-center justify-between">
  //               <div className="flex items-center flex-1">
  //                 {record.personnel === 'Not Assigned' ? (
  //                   <span className="text-xs text-gray-500 italic">Not Assigned</span>
  //                 ) : (
  //                   <div className="flex items-center">
  //                     <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2 text-green-600 text-xs font-medium">
  //                       {record.personnel.charAt(0)}
  //                     </div>
  //                     <span className="text-xs text-gray-700">{record.personnel}</span>
  //                   </div>
  //                 )}
  //               </div>

  //               {/* Progress bar for assigned items */}
  //               {activeTab !== 'Not Assigned' && record.progress !== undefined && (
  //                 <div className="flex items-center ml-3">
  //                   <div className="w-16 bg-gray-200 rounded-full h-1.5">
  //                     <div
  //                       className="bg-green-600 h-1.5 rounded-full"
  //                       style={{ width: `${record.progress}%` }}
  //                     ></div>
  //                   </div>
  //                   <span className="text-xs text-gray-500 ml-2">{record.progress}%</span>
  //                 </div>
  //               )}
  //             </div>

  //             {/* Action button */}
  //             <div className="flex justify-end pt-2 border-t border-gray-100">
  //               <Button
  //                 size="small"
  //                 type="primary"
  //                 className="bg-green-600 hover:bg-green-700 border-green-600"
  //                 icon={<FontAwesomeIcon icon={activeTab === 'Not Assigned' || activeTab === 'Reassign' ? faUserPlus : faEye} />}
  //                 onClick={() => {
  //                   if (activeTab === 'Not Assigned') {
  //                     setSelectedReservation(record);
  //                     setIsModalOpen(true);
  //                   } else if (activeTab === 'Reassign') {
  //                     setSelectedReservation(record);
  //                     setIsReassignModalOpen(true);
  //                   } else {
  //                     setSelectedReservation(record.rawData);
  //                     setIsChecklistModalOpen(true);
  //                   }
  //                 }}
  //               >
  //                 {activeTab === 'Not Assigned' ? 'Assign' : activeTab === 'Reassign' ? 'Reassign' : 'View'}
  //               </Button>
  //             </div>
  //           </div>
  //         </Card>
  //       ))}
  //     </div>
  //   );
  // };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      
      <div className={`flex-grow overflow-y-auto`}>
        <div className={`${isMobile ? 'px-4 py-4 mt-15' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4 mt-mt-10">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
              
                Assign Personnel
              </h2>
            </div>
          </motion.div>
          
          {/* Tabs */}
          <div className={isMobile ? "mb-4" : "mb-6"}>
            <div className="bg-white rounded-lg shadow-sm">
              <div className={`flex ${isMobile ? 'flex-col' : ''}`}>
                {[
                  {
                    key: 'Not Assigned',
                    label: isMobile ? 'Not Assigned' : 'Not Assigned',
                    shortLabel: 'Unassigned',
                    icon: <ClockCircleOutlined />,
                    count: reservations.filter(r => r.status === 'Not Assigned').length,
                    color: 'blue'
                  },
                  {
                    key: 'Assigned',
                    label: 'Assigned',
                    shortLabel: 'Assigned',
                    icon: <CheckCircleOutlined />,
                    count: reservations.filter(r => r.status === 'Assigned').length,
                    color: 'amber'
                  },
                  {
                    key: 'Reassign',
                    label: 'Reassign',
                    shortLabel: 'Reassign',
                    icon: <FontAwesomeIcon icon={faUserPlus} />,
                    count: reservations.filter(r => r.status === 'Reassign').length,
                    color: 'red'
                  }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 transition-colors duration-200 ${
                      isMobile 
                        ? 'px-3 py-2 border-l-4' 
                        : 'px-4 py-3 border-b-2'
                    } ${
                      activeTab === tab.key
                        ? isMobile 
                          ? 'border-green-600 text-green-600 bg-green-50'
                          : 'border-green-600 text-green-600'
                        : isMobile
                          ? 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <span className={`${isMobile ? 'text-sm' : 'text-base'} ${
                      activeTab === tab.key ? 'text-green-600' : `text-${tab.color}-500`
                    }`}>
                      {tab.icon}
                    </span>
                    <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {isMobile && isSmallScreen ? tab.shortLabel : tab.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      isMobile ? 'text-xs' : 'text-xs'
                    } ${
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
          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  placeholder={isMobile ? "Search..." : "Search reservations by name"}
                  allowClear
                  prefix={<SearchOutlined />}
                  size={isMobile ? "middle" : "large"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-wrap gap-2' : 'gap-2'}`}>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size={isMobile ? "middle" : "large"}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {isMobile && 'Refresh'}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className={`relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100`}>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                {isMobile ? (
                  // Mobile Card View
                  <div className="space-y-3 p-3">
                    {filteredReservations && filteredReservations.length > 0 ? (
                      filteredReservations
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((record) => (
                          <Card
                            key={record.id}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm"
                            size="small"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FaUsers className="text-green-900 text-sm" />
                                  <span className="font-medium text-sm truncate max-w-[150px]">
                                    {record.title}
                                  </span>
                                </div>
                                <Button
                                  size="small"
                                  type="primary"
                                  className="bg-green-600 hover:bg-green-700 border-green-600"
                                  icon={<FontAwesomeIcon icon={activeTab === 'Not Assigned' ? faUserPlus : faEye} />}
                                  onClick={() => {
                                    if (activeTab === 'Not Assigned') {
                                      setSelectedReservation(record);
                                      setIsModalOpen(true);
                                    } 
                                    else if (activeTab === 'Reassign') {
                                      setSelectedReservation(record);
                                      setIsReassignModalOpen(true);
                                    } 
                                    else {
                                      setSelectedReservation(record.rawData);
                                      setIsChecklistModalOpen(true);
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Requestor:</span>
                                <span className="text-xs text-gray-700">{record.requestor}</span>
                              </div>
                              {activeTab === 'Assigned' && record.reservationType && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Type:</span>
                                  <Tag color={
                                    record.reservationType === 'Trip' ? 'blue' :
                                    record.reservationType === 'Activity/Event' ? 'purple' :
                                    record.reservationType === 'EQ' ? 'orange' : 'default'
                                  } className="text-xs">
                                    {record.reservationType}
                                  </Tag>
                                </div>
                              )}
                              {record.startDate && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Start: </span>
                                  {dayjs(record.startDate).format('MMM D, YYYY HH:mm')}
                                </div>
                              )}
                              {record.endDate && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">End: </span>
                                  {dayjs(record.endDate).format('MMM D, YYYY HH:mm')}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                  {record.personnel === 'Not Assigned' ? (
                                    <span className="text-xs text-gray-500 italic">Not Assigned</span>
                                  ) : (
                                    <div className="flex items-center">
                                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2 text-green-600 text-xs font-medium">
                                        {record.personnel.charAt(0)}
                                      </div>
                                      <span className="text-xs text-gray-700">{record.personnel}</span>
                                    </div>
                                  )}
                                </div>
                                {activeTab !== 'Not Assigned' && record.progress !== undefined && (
                                  <div className="flex items-center ml-3">
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className="bg-green-600 h-1.5 rounded-full"
                                        style={{ width: `${record.progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2">{record.progress}%</span>
                                  </div>
                                )}
                              </div>
                              {activeTab === 'Assigned' && record.statusName && (
                                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                                  <TagOutlined className="text-blue-500 text-xs" />
                                  <span className="text-xs text-gray-700">
                                    <span className="font-medium">Status: </span>
                                    {record.statusName}
                                  </span>
                                </div>
                              )}
                              {activeTab === 'Assigned' && record.needsMarkingAsDone && record.statusName !== 'Completed' && (
                                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 bg-amber-50 -mx-3 px-3 py-2 rounded-b-lg">
                                  <WarningOutlined className="text-amber-600 text-xs" />
                                  <span className="text-xs text-amber-700 font-medium">
                                    Ready to mark as done
                                  </span>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-gray-500">
                              No reservations found
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
                          {columns
                            .filter(col => {
                              // Hide some columns on tablet
                              if (isTablet && (col.key === 'startDate' || col.key === 'endDate')) {
                                return false;
                              }
                              return true;
                            })
                            .map((column) => (
                              <th
                                key={column.key}
                                scope="col"
                                className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`}
                                onClick={() =>
                                  column.sorter && handleSort(column.dataIndex)
                                }
                              >
                                <div className="flex items-center">
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
                        {filteredReservations && filteredReservations.length > 0 ? (
                          filteredReservations
                            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                            .map((record) => (
                              <tr
                                key={record.id}
                                className="bg-white border-b last:border-b-0 border-gray-200"
                              >
                                {columns
                                  .filter(col => {
                                    // Hide some columns on tablet
                                    if (isTablet && (col.key === 'startDate' || col.key === 'endDate')) {
                                      return false;
                                    }
                                    return true;
                                  })
                                  .map((column) => (
                                    <td
                                      key={`${record.id}-${column.key}`}
                                      className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}
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
                            <td colSpan={columns.filter(col => {
                              if (isTablet && (col.key === 'startDate' || col.key === 'endDate')) {
                                return false;
                              }
                              return true;
                            }).length} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
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
                  </div>
                )}

                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredReservations ? filteredReservations.length : 0}
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
        onStatusUpdate={() => {
          fetchAssignedReservations();
          toast.success('Reservation list updated');
        }}
      />

      {/* Reassign Modal */}
      <ReAssignModal
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setSelectedReservation(null);
        }}
        selectedReservation={selectedReservation}
        onSuccess={() => {
          fetchReassignReservations();
          toast.success('Personnel reassigned successfully');
        }}
      />
    </div>
  );
};

export default AssignPersonnel;