import React, { useState, useEffect, useMemo } from 'react';
import { Button, Space, Modal, Select, Input, List, Tooltip, Pagination, Card, Drawer, Empty } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, AppstoreOutlined, ToolOutlined, CarOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { motion } from 'framer-motion';
import Sidebar from '../../components/core/Sidebar';
import { SecureStorage } from '../../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function Checklist() {
  const storedUrl = SecureStorage.getLocalItem("url");
  
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

  const [currentTab, setCurrentTab] = useState('Venue');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [resourceType, setResourceType] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [venueData, setVenueData] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewChecklistItems, setViewChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("checklistCount");
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();

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
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${storedUrl}Checklist.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ operation: 'fetchChecklist' })
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        if (result.status === 'success') {
          // Transform data for venues
          const venueList = Object.values(result.data.venues || {}).map(item => ({
            key: `v${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setVenueData(venueList);

          // Transform data for equipment
          const equipmentList = Object.values(result.data.equipment || {}).map(item => ({
            key: `e${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setEquipmentData(equipmentList);

          // Transform data for vehicles
          const vehicleList = Object.values(result.data.vehicles || {}).map(item => ({
            key: `vh${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setVehicleData(vehicleList);
        }
      } catch (error) {
        console.error('Error fetching checklists:', error);
        if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
          toast.error('Network connection lost. Please check your internet connection.');
        } else if (error.message === 'Network response was not ok') {
          toast.error('Unable to reach the server. Please try again later.');
        } else {
          toast.error('Failed to fetch checklists');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [storedUrl]);

  const fetchChecklistById = async (type, id) => {
    try {
      console.log('Sending request with:', { type, id });
      
      const response = await fetch(`${storedUrl}Checklist.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'fetchChecklistById',
          type,
          id
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const result = await response.json();
      console.log('Response received:', result);      if (result.status === 'success') {
        console.log('Checklist items:', result.data);
        setViewChecklistItems(result.data);
        setSelectedResource(id); // Store the resource ID
        setIsViewModalVisible(true);
      } else {
        console.error('Error response:', result);
        toast.error('Failed to fetch checklist items');
      }
    } catch (error) {
      console.error('Error details:', error);
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        toast.error('Network connection lost. Please check your internet connection.');
      } else if (error.message === 'Network response was not ok') {
        toast.error('Unable to reach the server. Please try again later.');
      } else {
        toast.error('Failed to fetch checklist items');
      }
    }
  };
  const handleEditChecklist = async (item, resourceId) => {
    console.log('Editing checklist item:', item, 'Resource ID:', resourceId); // Debug log
    if (!item || !resourceId) {
      toast.error('Missing required information for editing checklist');
      return;
    }
    if (!editItemName || !editItemName.trim()) {
      toast.error('Please enter a checklist name to update');
      return;
    }
    
    try {
      const response = await fetch(`${storedUrl}Checklist.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'updateChecklist',
          user_personnel_id: SecureStorage.getLocalItem("user_id"),
          data: {
            checklist_updates: [{
              type: currentTab.toLowerCase(),
              id: item.checklist_id,
              checklist_name: editItemName,
              resource_id: resourceId // Add resource_id to the request
            }]
          }
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.status === 'success') {
        toast.success('Checklist item updated successfully');
        setEditItemName('');
        setIsEditMode(false);
        setCurrentEditItem(null);
        // Refresh the checklist view with the correct resource ID
        const type = currentTab.toLowerCase();
        await fetchChecklistById(type, resourceId);
      } else {
        toast.error(result.message || 'Failed to update checklist item');
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        toast.error('Network connection lost. Please check your internet connection.');
      } else if (error.message === 'Network response was not ok') {
        toast.error('Unable to reach the server. Please try again later.');
      } else {
        toast.error('Failed to update checklist item. Please try again.');
      }
    }
  };

  const startEdit = (item) => {
    setIsEditMode(true);
    setCurrentEditItem(item);
    setEditItemName(item.checklist_name);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setCurrentEditItem(null);
    setEditItemName('');
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // const columns = [
  //   {
  //     title: 'Name of Resource',
  //     dataIndex: 'name',
  //     key: 'name',
  //     sorter: true,
  //     sortOrder: sortField === 'name' ? sortOrder : null,
  //     render: (text) => <span className="font-medium">{text}</span>
  //   },
  //   {
  //     title: 'No. Checklist',
  //     dataIndex: 'checklistCount',
  //     key: 'checklistCount',
  //     sorter: true,
  //     sortOrder: sortField === 'checklistCount' ? sortOrder : null,
  //           render: (count) => <span className="font-medium">{count}</span>
  //   },
  //   {
  //     title: 'Action',
  //     key: 'action',
  //     render: (_, record) => (
  //       <Space>
  //         <Tooltip title="View Checklist">
  //           <Button
  //             type="primary"
  //             icon={<EyeOutlined />}
  //             onClick={() => {
  //               const type = currentTab === '1' ? 'venue' : 
  //                           currentTab === '2' ? 'equipment' : 
  //                           'vehicle';
  //               console.log('View Checklist - Type:', type);
  //               console.log('View Checklist - ID:', record.id);
  //               fetchChecklistById(type, record.id);
  //             }}
  //             size="small"
  //             className="bg-green-900 hover:bg-lime-900"
  //           />
  //         </Tooltip>
  //       </Space>
  //     ),
  //   },
  // ];

  const fetchResources = async (type) => {
    try {
      const response = await fetch(`${storedUrl}Checklist.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ operation: 'fetchAllResources', type })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const result = await response.json();
      if (result.status === 'success') {
        switch (type) {
          case 'venue':
            setResources(result.data.venues.map(v => ({ 
              value: v.ven_id,
              label: v.ven_name 
            })));
            break;
          case 'vehicle':
            setResources(result.data.vehicles.map(v => ({ 
              value: v.vehicle_id, 
              label: `${v.vehicle_model_title} (${v.vehicle_registration})` 
            })));
            break;
          case 'equipment':
            setResources(result.data.equipment.map(e => ({ 
              value: e.equip_id, 
              label: e.equip_name 
            })));
            break;
          default:
            setResources([]);
            console.warn(`Unknown resource type: ${type}`);
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        toast.error('Network connection lost. Please check your internet connection.');
      } else if (error.message === 'Network response was not ok') {
        toast.error('Unable to reach the server. Please try again later.');
      } else {
        toast.error('Failed to fetch resources');
      }
    }
  };

  const handleTypeChange = (value) => {
    setResourceType(value);
    setSelectedResource(null);
    fetchResources(value);
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setChecklistItems([...checklistItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleSaveChecklist = async () => {
    if (!resourceType || !selectedResource || checklistItems.length === 0) {
      toast.error('Please fill in all required fields and add at least one checklist item');
      return;
    }

    // Validate resource type
    if (!['venue', 'equipment', 'vehicle'].includes(resourceType)) {
      toast.error('Invalid resource type');
      return;
    }

    try {
      const response = await fetch(`${storedUrl}Checklist.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'saveMasterChecklist',
          checklistNames: checklistItems,
          type: resourceType,
          id: selectedResource,
          user_personnel_id: SecureStorage.getLocalItem("user_id")
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.status === 'success') {
        toast.success(result.message || 'Checklist saved successfully');
        // Don't close the modal on successful save
        // setIsModalVisible(false);
        
        // Clear all form fields and dropdowns
        setChecklistItems([]);
        setResourceType(null);
        setSelectedResource(null);
        setNewItem('');
        setResources([]); // Clear the resources dropdown options
        
        // Refresh the data after saving without page reload
        const fetchChecklists = async () => {
          try {
            const response = await fetch(`${storedUrl}Checklist.php`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ operation: 'fetchChecklist' })
            });
            
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            
            const result = await response.json();
            if (result.status === 'success') {
              // Transform data for venues
              const venueList = Object.values(result.data.venues || {}).map(item => ({
                key: `v${item.id}`,
                id: item.id,
                name: item.name,
                checklistCount: item.count
              }));
              setVenueData(venueList);

              // Transform data for equipment
              const equipmentList = Object.values(result.data.equipment || {}).map(item => ({
                key: `e${item.id}`,
                id: item.id,
                name: item.name,
                checklistCount: item.count
              }));
              setEquipmentData(equipmentList);

              // Transform data for vehicles
              const vehicleList = Object.values(result.data.vehicles || {}).map(item => ({
                key: `vh${item.id}`,
                id: item.id,
                name: item.name,
                checklistCount: item.count
              }));
              setVehicleData(vehicleList);
            }
          } catch (error) {
            console.error('Error refreshing checklists:', error);
            if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
              toast.error('Network connection lost. Please check your internet connection.');
            } else if (error.message === 'Network response was not ok') {
              toast.error('Unable to reach the server. Please try again later.');
            }
          }
        };

        await fetchChecklists();
      } else {
        toast.error(result.message || 'Failed to save checklist');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        toast.error('Network connection lost. Please check your internet connection.');
      } else if (error.message === 'Network response was not ok') {
        toast.error('Unable to reach the server. Please try again later.');
      } else {
        toast.error('Failed to save checklist. Please try again.');
      }
    }
  };

  const handleViewModalClose = () => {
    setIsViewModalVisible(false);
    setSelectedResource(null);
    setNewItem('');
    setIsEditMode(false);
    setCurrentEditItem(null);
    setEditItemName('');
  };

  const handleAddModalOpen = () => {
    setIsModalVisible(true);
    setResourceType(null);
    setSelectedResource(null);
    setChecklistItems([]);
    setNewItem('');
    setResources([]);
  };

  const handleRefresh = () => {
    const fetchChecklists = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${storedUrl}Checklist.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ operation: 'fetchChecklist' })
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        if (result.status === 'success') {
          // Transform data for venues
          const venueList = Object.values(result.data.venues || {}).map(item => ({
            key: `v${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setVenueData(venueList);

          // Transform data for equipment
          const equipmentList = Object.values(result.data.equipment || {}).map(item => ({
            key: `e${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setEquipmentData(equipmentList);

          // Transform data for vehicles
          const vehicleList = Object.values(result.data.vehicles || {}).map(item => ({
            key: `vh${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setVehicleData(vehicleList);
          
          toast.success('Data refreshed successfully');
        }
      } catch (error) {
        console.error('Error fetching checklists:', error);
        if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
          toast.error('Network connection lost. Please check your internet connection.');
        } else if (error.message === 'Network response was not ok') {
          toast.error('Unable to reach the server. Please try again later.');
        } else {
          toast.error('Failed to refresh data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  };

  const handleAddToExistingChecklist = async () => {
    if (!newItem.trim() || !selectedResource) {
      toast.error('Please enter a checklist item');
      return;
    }

    try {
      const response = await fetch(`${storedUrl}Checklist.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'saveMasterChecklist',
          checklistNames: [newItem.trim()],
          type: currentTab.toLowerCase(),
          id: selectedResource,
          user_personnel_id: SecureStorage.getLocalItem("user_id")
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.status === 'success') {
        toast.success('New checklist item added successfully');
        setNewItem('');
        // Refresh the checklist view
        const type = currentTab.toLowerCase();
        await fetchChecklistById(type, selectedResource);
      } else {
        toast.error(result.message || 'Failed to add checklist item');
      }
    } catch (error) {
      console.error('Error adding checklist item:', error);
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        toast.error('Network connection lost. Please check your internet connection.');
      } else if (error.message === 'Network response was not ok') {
        toast.error('Unable to reach the server. Please try again later.');
      } else {
        toast.error('Failed to add checklist item. Please try again.');
      }
    }
  };

  // Memoized filtered data for performance
  const filteredVenueData = useMemo(() => 
    venueData.filter(venue => 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [venueData, searchTerm]
  );
  
  const filteredEquipmentData = useMemo(() => 
    equipmentData.filter(equipment => 
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [equipmentData, searchTerm]
  );
  
  const filteredVehicleData = useMemo(() => 
    vehicleData.filter(vehicle => 
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [vehicleData, searchTerm]
  );

  const renderTabContent = (data) => {
    let sortedData = [...data];
    if (sortField) {
      sortedData.sort((a, b) => {
        let compareA = a[sortField];
        let compareB = b[sortField];
        
        if (typeof compareA === 'string') {
          compareA = compareA.toLowerCase();
          compareB = compareB.toLowerCase();
          return sortOrder === 'asc' ? compareA.localeCompare(compareB) : compareB.localeCompare(compareA);
        } else {
          return sortOrder === 'asc' ? compareA - compareB : compareB - compareA;
        }
      });
    }
    
    const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Search and Filters */}
        <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
          <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
            <div className="flex-grow">
              <Input
                placeholder={isMobile ? "Search..." : "Search resources..."}
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size={isMobile ? "middle" : "large"}
                onClick={handleAddModalOpen}
                className={`bg-lime-900 hover:bg-green-600 ${isMobile ? 'w-full' : ''}`}
              >
                <span className={isMobile ? '' : 'hidden sm:inline'}>Add Checklist</span>
                {!isMobile && <span className="sm:hidden">Add</span>}
              </Button>
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
                  {paginatedData && paginatedData.length > 0 ? (
                    paginatedData.map((record) => (
                      <Card
                        key={record.key}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                        size="small"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <EyeOutlined className="text-green-900 text-sm" />
                              <span className="font-medium text-sm truncate max-w-[150px]">
                                {record.name}
                              </span>
                            </div>
                            <Button
                              size="small"
                              type="primary"
                              className="bg-green-600 hover:bg-green-700 border-green-600"
                              icon={<EyeOutlined />}
                              onClick={() => {
                                const type = currentTab === 'Venue' ? 'venue' : 
                                            currentTab === 'Equipment' ? 'equipment' : 
                                            'vehicle';
                                console.log('View Checklist - Type:', type);
                                console.log('View Checklist - ID:', record.id);
                                fetchChecklistById(type, record.id);
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Checklists:</span>
                            <span className="text-xs text-gray-700 font-medium">{record.checklistCount || 0}</span>
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
                            No checklists found
                          </span>
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Desktop/Tablet Table View
                <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                  <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                    <tr>
                      <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('name')}>
                        <div className="flex items-center">
                          NAME OF RESOURCE
                          {sortField === 'name' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('checklistCount')}>
                        <div className="flex items-center">
                          NO. CHECKLIST
                          {sortField === 'checklistCount' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                        <div className="flex items-center justify-center">
                          ACTIONS
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((record) => (
                        <tr key={record.key} className="bg-white border-b last:border-b-0 border-gray-200">
                          <td className={isTablet ? 'px-3 py-4' : 'px-4 py-6'}>
                            <div className="flex items-center">
                              <span className="font-bold truncate block max-w-[140px]">{record.name}</span>
                            </div>
                          </td>
                          <td className={`${isTablet ? 'px-3 py-4' : 'px-4 py-6'} font-medium`}>
                            {record.checklistCount || 0}
                          </td>
                          <td className={isTablet ? 'px-3 py-4' : 'px-4 py-6'}>
                            <div className="flex justify-center space-x-2">
                              <Tooltip title="View Checklist">
                                <Button
                                  shape="circle"
                                  icon={<EyeOutlined />}
                                  onClick={() => {
                                    const type = currentTab === 'Venue' ? 'venue' : 
                                                currentTab === 'Equipment' ? 'equipment' : 
                                                'vehicle';
                                    console.log('View Checklist - Type:', type);
                                    console.log('View Checklist - ID:', record.id);
                                    fetchChecklistById(type, record.id);
                                  }}
                                  size={isTablet ? "middle" : "large"}
                                  className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                />
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                              <span className="text-gray-500 dark:text-gray-400">
                                No checklists found
                              </span>
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              
              <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={data.length}
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
      </motion.div>
    );
  };

  // Get current tab data based on active tab
  const getCurrentTabData = () => {
    switch (currentTab) {
      case 'Venue':
        return filteredVenueData;
      case 'Equipment':
        return filteredEquipmentData;
      case 'Vehicle':
        return filteredVehicleData;
      default:
        return [];
    }
  };


  // Add Checklist Modal
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Responsive Sidebar */}        
      {!isMobile && (
        <div className="flex-shrink-0">     
          <Sidebar />
        </div>
      )}
            {isMobile && (
        <div className="flex-shrink-0">     
          <Sidebar />
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className={`flex-grow overflow-y-auto`}>
        <div className={`${isMobile ? 'px-4 py-4 mt-15' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-900 mt-5`}>
                Checklist 
              </h2>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className={isMobile ? "mb-4" : "mb-6"}>
            <div className="bg-white rounded-lg shadow-sm">
              <div className={`flex ${isMobile ? 'flex-col' : ''}`}>
                {[
                  {
                    key: 'Venue',
                    label: 'Venue',
                    icon: <AppstoreOutlined />,
                    count: venueData.length,
                    color: 'blue'
                  },
                  {
                    key: 'Equipment',
                    label: 'Equipment',
                    icon: <ToolOutlined />,
                    count: equipmentData.length,
                    color: 'amber'
                  },
                  {
                    key: 'Vehicle',
                    label: 'Vehicle',
                    icon: <CarOutlined />,
                    count: vehicleData.length,
                    color: 'red'
                  }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setCurrentTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 transition-colors duration-200 ${
                      isMobile 
                        ? 'px-3 py-2 border-l-4' 
                        : 'px-4 py-3 border-b-2'
                    } ${
                      currentTab === tab.key
                        ? isMobile 
                          ? 'border-green-600 text-green-600 bg-green-50'
                          : 'border-green-600 text-green-600'
                        : isMobile
                          ? 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <span className={`${isMobile ? 'text-sm' : 'text-base'} ${
                      currentTab === tab.key ? 'text-green-600' : `text-${tab.color}-500`
                    }`}>
                      {tab.icon}
                    </span>
                    <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {tab.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      isMobile ? 'text-xs' : 'text-xs'
                    } ${
                      currentTab === tab.key
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

          {/* Tab Content */}
          {renderTabContent(getCurrentTabData())}
        </div>
      </div>

      {/* Add Checklist Modal/Drawer */}
      {isMobile ? (
        <Drawer
          title={
            <div className="text-green-700 font-bold">
              Add Checklist
            </div>
          }
          placement="bottom"
          height="90%"
          open={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          footer={
            <div className="flex flex-col gap-2 p-4">
              <Button 
                type="primary" 
                onClick={handleSaveChecklist}
                disabled={!resourceType || !selectedResource || checklistItems.length === 0}
                className="bg-green-900 hover:bg-lime-900 w-full"
                size="large"
              >
                Save Checklist
              </Button>
              <Button 
                onClick={() => setIsModalVisible(false)}
                className="w-full"
                size="large"
              >
                Cancel
              </Button>
            </div>
          }
          bodyStyle={{ paddingBottom: '120px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Select
              style={{ width: '100%' }}
              placeholder="Select Type"
              value={resourceType}
              onChange={handleTypeChange}
              className="rounded-md"
              size="large"
              allowClear
              options={[
                { value: 'venue', label: 'Venue' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'vehicle', label: 'Vehicle' }
              ]}
            />
            
            <Select
              style={{ width: '100%' }}
              placeholder="Select Resource"
              value={selectedResource}
              onChange={setSelectedResource}
              options={resources}
              disabled={!resourceType}
              className="rounded-md"
              size="large"
              allowClear
            />
            
            <div className="flex flex-col gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add checklist item"
                onPressEnter={handleAddItem}
                className="w-full"
                size="large"
              />
              <Button 
                type="primary" 
                onClick={handleAddItem} 
                className="bg-green-900 hover:bg-lime-900 w-full"
                size="large"
              >
                Add
              </Button>
            </div>
            
            <List
              bordered
              className="rounded-md max-h-60 overflow-y-auto bg-[#fafff4]"
              dataSource={checklistItems}
              renderItem={(item, index) => (
                <List.Item className="flex justify-between items-center border-b border-green-100">
                  <div className="flex items-center">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-3 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-green-800">{item}</span>
                  </div>
                  <Button 
                    type="text" 
                    danger 
                    size="small" 
                    onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </List.Item>
              )}
              locale={{ emptyText: 'No items added yet' }}
            />
          </Space>
        </Drawer>
      ) : (
        <Modal
          title={
            <div className="text-green-700 font-bold">
              Add Checklist
            </div>
          }
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={handleSaveChecklist}
          okButtonProps={{
            disabled: !resourceType || !selectedResource || checklistItems.length === 0,
            className: 'bg-green-900 hover:bg-lime-900'
          }}
          okText="Save Checklist"
          width={isTablet ? 700 : 800}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Select
              style={{ width: '100%' }}
              placeholder="Select Type"
              value={resourceType}
              onChange={handleTypeChange}
              className="rounded-md"
              allowClear
              options={[
                { value: 'venue', label: 'Venue' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'vehicle', label: 'Vehicle' }
              ]}
            />
            
            <Select
              style={{ width: '100%' }}
              placeholder="Select Resource"
              value={selectedResource}
              onChange={setSelectedResource}
              options={resources}
              disabled={!resourceType}
              className="rounded-md"
              allowClear
            />
            
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add checklist item"
                onPressEnter={handleAddItem}
                className="rounded-l-md"
              />
              <Button 
                type="primary" 
                onClick={handleAddItem} 
                className="bg-green-900 hover:bg-lime-900"
              >
                Add
              </Button>
            </Space.Compact>
            
            <List
              bordered
              className="rounded-md max-h-60 overflow-y-auto bg-[#fafff4]"
              dataSource={checklistItems}
              renderItem={(item, index) => (
                <List.Item className="flex justify-between items-center border-b border-green-100">
                  <div className="flex items-center">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-3 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-green-800">{item}</span>
                  </div>
                  <Button 
                    type="text" 
                    danger 
                    size="small" 
                    onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </List.Item>
              )}
              locale={{ emptyText: 'No items added yet' }}
            />
          </Space>
        </Modal>
      )}

      {/* View Checklist Modal/Drawer */}
      {isMobile ? (
        <Drawer
          title={
            <div className="flex items-center text-green-700 font-bold">
              <EyeOutlined className="mr-2" />
              <span>View Checklist</span>
            </div>
          }
          placement="bottom"
          height="90%"
          open={isViewModalVisible}
          onClose={handleViewModalClose}
          footer={
            <div className="p-4">
              <Button 
                onClick={handleViewModalClose} 
                className="bg-green-900 hover:bg-lime-900 text-white w-full"
                size="large"
              >
                Close
              </Button>
            </div>
          }
          bodyStyle={{ paddingBottom: '80px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div className="flex flex-col gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add item"
                disabled={isEditMode}
                onPressEnter={() => {
                  if (newItem.trim()) {
                    handleAddToExistingChecklist();
                  }
                }}
                className="w-full"
                size="large"
              />
              <Button 
                type="primary" 
                onClick={handleAddToExistingChecklist}
                disabled={isEditMode || !newItem.trim() || loading} 
                className="bg-green-900 hover:bg-lime-900 w-full"
                size="large"
              >
                {loading ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </Space>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
            </div>
          ) : (
            <List
              bordered
              className="mt-4 rounded-md bg-[#fafff4]"
              dataSource={viewChecklistItems}
              renderItem={(item, index) => (
                <List.Item className="border-b border-green-100 py-3">
                  <div className="flex items-center w-full">
                    <span className="bg-green-500 text-white rounded-full w-7 h-7 inline-flex items-center justify-center mr-3 text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-green-800">{item.checklist_name}</span>
                    <div className="ml-auto flex gap-2">
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={() => startEdit(item)} 
                        className="bg-green-900 hover:bg-lime-900"
                        size="small"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No checklist items found</p>
                  </div>
                )
              }}
            />
          )}
          {isEditMode && (
            <div className="mt-4">
              <Input
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                placeholder="Edit checklist item"
                className="rounded-md mb-2"
                size="large"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  type="primary" 
                  onClick={() => handleEditChecklist(currentEditItem, selectedResource)} 
                  className="bg-green-900 hover:bg-lime-900 w-full"
                  size="large"
                >
                  Save
                </Button>
                <Button 
                  onClick={cancelEdit} 
                  className="bg-gray-300 hover:bg-gray-400 w-full"
                  size="large"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Drawer>
      ) : (
        <Modal
          title={
            <div className="flex items-center text-green-700 font-bold">
              <EyeOutlined className="mr-2" />
              <span>View Checklist</span>
            </div>
          }
          open={isViewModalVisible}
          onCancel={handleViewModalClose}
          footer={[
            <Button key="close" onClick={handleViewModalClose} className="bg-green-900 hover:bg-lime-900 text-white">
              Close
            </Button>
          ]}
          width={isTablet ? 700 : 800}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new checklist item"
                disabled={isEditMode}
                onPressEnter={() => {
                  if (newItem.trim()) {
                    handleAddToExistingChecklist();
                  }
                }}
                className="rounded-l-md"
              />
              <Button 
                type="primary" 
                onClick={handleAddToExistingChecklist}
                disabled={isEditMode || !newItem.trim() || loading} 
                className="bg-green-900 hover:bg-lime-900"
              >
                {loading ? 'Adding...' : 'Add'}
              </Button>
            </Space.Compact>
          </Space>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
            </div>
          ) : (
            <List
              bordered
              className="mt-4 rounded-md bg-[#fafff4]"
              dataSource={viewChecklistItems}
              renderItem={(item, index) => (
                <List.Item className="border-b border-green-100 py-3">
                  <div className="flex items-center w-full">
                    <span className="bg-green-500 text-white rounded-full w-7 h-7 inline-flex items-center justify-center mr-3 text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-green-800">{item.checklist_name}</span>
                    <div className="ml-auto flex gap-2">
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={() => startEdit(item)} 
                        className="bg-green-900 hover:bg-lime-900"
                        size="small"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No checklist items found</p>
                  </div>
                )
              }}
            />
          )}
          {isEditMode && (
            <div className="mt-4">
              <Input
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                placeholder="Edit checklist item"
                className="rounded-md mb-2"
              />
              <Space>
                <Button 
                  type="primary" 
                  onClick={() => handleEditChecklist(currentEditItem, selectedResource)} 
                  className="bg-green-900 hover:bg-lime-900"
                >
                  Save
                </Button>
                <Button 
                  onClick={cancelEdit} 
                  className="bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </Button>
              </Space>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export default Checklist;
