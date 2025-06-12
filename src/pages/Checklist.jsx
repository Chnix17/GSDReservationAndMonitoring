import React, { useState, useEffect } from 'react';
import { Tabs,  Button,  Space,  Modal, Select, Input, List, message, Tooltip, Pagination } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';

import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';

function Checklist() {
  const storedUrl = SecureStorage.getLocalItem("url") || "http://localhost/coc/gsd/";

  const [currentTab, setCurrentTab] = useState('1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [resourceType, setResourceType] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [newItem, setNewItem] = useState('');
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

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${storedUrl}fetch2.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ operation: 'fetchChecklist' })
        });
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
        message.error('Failed to fetch checklists');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [storedUrl]);

  const fetchChecklistById = async (type, id) => {
    try {
      console.log('Sending request with:', { type, id });
      
      const response = await fetch(`${storedUrl}fetch2.php`, {
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
      
      const result = await response.json();
      console.log('Response received:', result);      if (result.status === 'success') {
        console.log('Checklist items:', result.data);
        setViewChecklistItems(result.data);
        setSelectedResource(id); // Store the resource ID
        setIsViewModalVisible(true);
      } else {
        console.error('Error response:', result);
        message.error('Failed to fetch checklist items');
      }
    } catch (error) {
      console.error('Error details:', error);
      message.error('Failed to fetch checklist items');
    }
  };
  const handleEditChecklist = async (item, resourceId) => {
    console.log('Editing checklist item:', item, 'Resource ID:', resourceId); // Debug log
    if (!item || !resourceId) {
      message.error('Missing required information for editing checklist');
      return;
    }
    
    try {
      const response = await fetch(`${storedUrl}fetch2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'updateChecklist',
          data: {
            checklist_updates: [{
              type: currentTab === '1' ? 'venue' : currentTab === '2' ? 'equipment' : 'vehicle',
              id: item.checklist_id,
              checklist_name: newItem,
              resource_id: resourceId // Add resource_id to the request
            }]
          }
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        message.success('Checklist item updated successfully');
        setNewItem('');
        setIsEditMode(false);
        setCurrentEditItem(null);
        // Refresh the checklist view with the correct resource ID
        const type = currentTab === '1' ? 'venue' : currentTab === '2' ? 'equipment' : 'vehicle';
        await fetchChecklistById(type, resourceId);
      } else {
        message.error(result.message || 'Failed to update checklist item');
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      message.error('Failed to update checklist item. Please try again.');
    }
  };

  const startEdit = (item) => {
    setIsEditMode(true);
    setCurrentEditItem(item);
    setNewItem(item.checklist_name);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setCurrentEditItem(null);
    setNewItem('');
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const columns = [
    {
      title: 'Name of Resource',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: sortField === 'name' ? sortOrder : null,
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: 'No. Checklist',
      dataIndex: 'checklistCount',
      key: 'checklistCount',
      sorter: true,
      sortOrder: sortField === 'checklistCount' ? sortOrder : null,
            render: (count) => <span className="font-medium">{count}</span>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Checklist">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => {
                const type = currentTab === '1' ? 'venue' : 
                            currentTab === '2' ? 'equipment' : 
                            'vehicle';
                console.log('View Checklist - Type:', type);
                console.log('View Checklist - ID:', record.id);
                fetchChecklistById(type, record.id);
              }}
              size="small"
              className="bg-green-900 hover:bg-lime-900"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const fetchResources = async (type) => {
    try {
      const response = await fetch(`${storedUrl}fetch2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ operation: 'fetchAllResources', type })
      });
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
      message.error('Please fill in all required fields and add at least one checklist item');
      return;
    }

    // Validate resource type
    if (!['venue', 'equipment', 'vehicle'].includes(resourceType)) {
      message.error('Invalid resource type');
      return;
    }

    try {
      const response = await fetch(`${storedUrl}fetch2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'saveMasterChecklist',
          checklistNames: checklistItems,
          type: resourceType,
          id: selectedResource
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        message.success(result.message || 'Checklist saved successfully');
        setIsModalVisible(false);
        setChecklistItems([]);
        setResourceType(null);
        setSelectedResource(null);
        setNewItem('');
        
        // Refresh the data after saving
        const updatedType = resourceType === 'venue' ? 'venue' :
                          resourceType === 'equipment' ? 'equipment' :
                          'vehicle';
        await fetchResources(updatedType);
        window.location.reload(); // Refresh to show updated counts
      } else {
        message.error(result.message || 'Failed to save checklist');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      message.error('Failed to save checklist. Please try again.');
    }
  };

  const handleRefresh = () => {
    const fetchChecklists = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${storedUrl}fetch2.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ operation: 'fetchChecklist' })
        });
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
          
          message.success('Data refreshed successfully');
        }
      } catch (error) {
        console.error('Error fetching checklists:', error);
        message.error('Failed to refresh data');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  };

  const handleAddToExistingChecklist = async () => {
    if (!newItem.trim() || !selectedResource) {
      message.error('Please enter a checklist item');
      return;
    }

    try {
      const response = await fetch(`${storedUrl}fetch2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'saveMasterChecklist',
          checklistNames: [newItem.trim()],
          type: currentTab === '1' ? 'venue' : currentTab === '2' ? 'equipment' : 'vehicle',
          id: selectedResource
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        message.success('New checklist item added successfully');
        setNewItem('');
        // Refresh the checklist view
        const type = currentTab === '1' ? 'venue' : currentTab === '2' ? 'equipment' : 'vehicle';
        await fetchChecklistById(type, selectedResource);
      } else {
        message.error(result.message || 'Failed to add checklist item');
      }
    } catch (error) {
      console.error('Error adding checklist item:', error);
      message.error('Failed to add checklist item. Please try again.');
    }
  };

  const filteredVenueData = venueData.filter(venue => 
    venue.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredEquipmentData = equipmentData.filter(equipment => 
    equipment.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredVehicleData = vehicleData.filter(vehicle => 
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EnhancedFilters = () => (
    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Input
              placeholder="Search resources..."
              allowClear
              prefix={<SearchOutlined />}
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
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              size="large"
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalVisible(true)}
            className="bg-lime-900 hover:bg-green-600"
          >
            Add Checklist
          </Button>
        </div>
      </div>
    </div>
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
        <EnhancedFilters />
        
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
            </div>
          ) : (
            <>
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className="px-6 py-3"
                        onClick={() => column.sorter && handleSort(column.dataIndex)}
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
                  {paginatedData.length > 0 ? (
                    paginatedData.map((record) => (
                      <tr
                        key={record.key}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.key}-${column.key}`}
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
                      <td colSpan={columns.length} className="px-6 py-24 text-center">
                        <div className="text-center py-6">
                          <PlusOutlined className="text-5xl text-gray-300 mb-4" />
                          <p className="text-xl text-gray-500">No checklists found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={data.length}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger={true}
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} of ${total} items`
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  const items = [
    {
      key: '1',
      label: <span className="text-lg font-medium">Venue</span>,
      children: renderTabContent(filteredVenueData),
    },
    {
      key: '2',
      label: <span className="text-lg font-medium">Equipment</span>,
      children: renderTabContent(filteredEquipmentData),
    },
    {
      key: '3',
      label: <span className="text-lg font-medium">Vehicle</span>,
      children: renderTabContent(filteredVehicleData),
    },
  ];

  const handleDeleteChecklist = async (item) => {
    try {
      const response = await fetch(`${storedUrl}fetch2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'deleteChecklist',
          type: currentTab === '1' ? 'venue' : currentTab === '2' ? 'equipment' : 'vehicle',
          id: item.checklist_id
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        message.success('Checklist item deleted successfully');
        // Refresh the checklist view
        const type = currentTab === '1' ? 'venue' : currentTab === '2' ? 'equipment' : 'vehicle';
        await fetchChecklistById(type, selectedResource);
      } else {
        message.error(result.message || 'Failed to delete checklist item');
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
      message.error('Failed to delete checklist item');
    }
  };

  // Add Checklist Modal
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}        
      <div className="flex-shrink-0">     
        <Sidebar />
      </div>

      {/* Scrollable Content Area */}
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
                Checklist Management
              </h2>
            </div>
          </motion.div>

          <Tabs
            activeKey={currentTab}
            onChange={setCurrentTab}
            items={items}
            type="card"
            className="checklist-tabs"
            size="large"
            tabBarStyle={{ marginBottom: '1rem', fontWeight: 'bold' }}
          />
        </div>
      </div>

      {/* Add Checklist Modal */}
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
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Select
            style={{ width: '100%' }}
            placeholder="Select Type"
            onChange={handleTypeChange}
            className="rounded-md"
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
          />
          
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add checklist item"
              onPressEnter={handleAddItem}
              className="rounded-l-md"
            />
            <Button type="primary" onClick={handleAddItem} className="bg-green-900 hover:bg-lime-900">Add</Button>
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

      {/* View Checklist Modal */}
      <Modal
        title={
          <div className="flex items-center text-green-700 font-bold">
            <EyeOutlined className="mr-2" />
            <span>View Checklist</span>
          </div>
        }
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)} className="bg-green-900 hover:bg-lime-900 text-white">
            Close
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add new checklist item"
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
              disabled={!newItem.trim() || loading} 
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
                      type="link" 
                      icon={<EditOutlined />} 
                      onClick={() => startEdit(item)} 
                      className="text-green-700 hover:text-green-900"
                      disabled={loading}
                    />
                    <Button 
                      type="link" 
                      danger
                      icon={<DeleteOutlined />} 
                      onClick={() => {
                        Modal.confirm({
                          title: 'Delete Checklist Item',
                          content: 'Are you sure you want to delete this checklist item?',
                          okText: 'Yes',
                          okType: 'danger',
                          cancelText: 'No',
                          onOk() {
                            handleDeleteChecklist(item);
                          },
                        });
                      }}
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
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Edit checklist item"
              className="rounded-md mb-2"
            />
            <Space>              <Button type="primary" onClick={() => handleEditChecklist(currentEditItem, selectedResource)} className="bg-green-900 hover:bg-lime-900">
                Save
              </Button>
              <Button onClick={cancelEdit} className="bg-gray-300 hover:bg-gray-400">
                Cancel
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Checklist;
