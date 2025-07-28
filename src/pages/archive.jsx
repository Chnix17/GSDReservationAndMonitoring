import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Empty, Skeleton, Input, Tooltip } from 'antd';
import { UndoOutlined, UserOutlined, CarOutlined, HomeOutlined, ToolOutlined, DeleteOutlined, SearchOutlined, IdcardOutlined, ReloadOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Archive = () => {
  const [value, setValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const encryptedUrl = SecureStorage.getLocalItem("url");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [navigate]);

  const handleChange = (newValue) => {
    setValue(newValue);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const convertUserType = (userType) => {
    const typeMapping = {
      'Dean': 'dept',
      'Admin': 'admin',
      'Driver': 'driver',
      'Personnel': 'personel',
      'User': 'user'
    };
    return typeMapping[userType] || userType.toLowerCase();
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`,
        { operation: "fetchAllUserTypes" },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.status === 'success') {
        const allUsers = response.data.data.map(user => ({
          users_id: user.id,
          users_fname: user.fname,
          users_mname: user.mname,
          users_lname: user.lname,
          users_email: user.email,
          users_school_id: user.school_id,
          users_contact_number: user.contact_number,
          users_pic: user.pic,
          departments_name: user.departments_name,
          user_level_name: user.user_level_name,
          role: convertUserType(user.user_level_desc),
          user_type: user.type
        }));
        setUsers(allUsers);
      } else {
        
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`,
        { operation: "fetchAllVehicles" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVehicles(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching vehicles");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`,
        { operation: "fetchVenue" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVenues(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching venues");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`,
        { operation: "fetchEquipmentAndInactiveUnits" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        console.log('Equipment Details:', response.data.data);
        setEquipment(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching equipment");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchInactiveDriver" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setDrivers(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching drivers");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  useEffect(() => {
    // Fetch data based on selected tab
    switch (value) {
      case 0:
        fetchUsers();
        break;
      case 1:
        fetchVehicles();
        break;
      case 2:
        fetchVenues();
        break;
      case 3:
        fetchEquipment();
        break;
      case 4:
        fetchDrivers();
        break;
      default:
        break;
    }
  }, [value, fetchUsers, fetchVehicles, fetchVenues, fetchEquipment, fetchDrivers]);

  const handleRestoreUsers = async () => {
    const payload = {
      operation: "unarchiveUser",
      userType: "user",
      userId: selectedRowKeys
    };
    console.log('Restore Users Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} users restored successfully`);
        setSelectedRowKeys([]);
        fetchUsers();
      } else {
        message.error(`Failed to restore users`);
      }
    } catch (error) {
      console.error('Error restoring users:', error);
      message.error(`An error occurred while restoring users`);
    }
  };

  const handleRestoreVehicles = async () => {
    const payload = {
      operation: "unarchiveResource",
      resourceType: "vehicle",
      resourceId: selectedRowKeys
    };
    console.log('Restore Vehicles Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} vehicles restored successfully`);
        setSelectedRowKeys([]);
        fetchVehicles();
      } else {
        message.error(`Failed to restore vehicles`);
      }
    } catch (error) {
      console.error('Error restoring vehicles:', error);
      message.error(`An error occurred while restoring vehicles`);
    }
  };

  const handleRestoreVenues = async () => {
    const payload = {
      operation: "unarchiveResource",
      resourceType: "venue",
      resourceId: selectedRowKeys
    };
    console.log('Restore Venues Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} venues restored successfully`);
        setSelectedRowKeys([]);
        fetchVenues();
      } else {
        message.error(`Failed to restore venues`);
      }
    } catch (error) {
      console.error('Error restoring venues:', error);
      message.error(`An error occurred while restoring venues`);
    }
  };

  const handleRestoreEquipment = async (record) => {
    let resourceIds;
    if (record) {
      if (record.unit_id) {
        resourceIds = [record.unit_id];
      } else if (record.equip_id) {
        resourceIds = [record.equip_id];
      } else {
        message.error('No valid equipment ID found.');
        return;
      }
    } else {
      resourceIds = selectedRowKeys;
    }
    const payload = {
      operation: "unarchiveResource",
      resourceType: "equipment",
      resourceId: resourceIds
    };
    console.log('Restore Equipment Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);
      if (response.data.status === 'success') {
        message.success(`${resourceIds.length} equipment items restored successfully`);
        setSelectedRowKeys([]);
        fetchEquipment();
      } else {
        message.error(`Failed to restore equipment`);
      }
    } catch (error) {
      console.error('Error restoring equipment:', error);
      message.error(`An error occurred while restoring equipment`);
    }
  };

  const handleRestoreDrivers = async () => {
    const payload = {
      operation: "unarchiveUser",
      userType: "driver",
      userId: selectedRowKeys
    };
    console.log('Restore Drivers Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} drivers restored successfully`);
        setSelectedRowKeys([]);
        fetchDrivers();
      } else {
        message.error(`Failed to restore drivers`);
      }
    } catch (error) {
      console.error('Error restoring drivers:', error);
      message.error(`An error occurred while restoring drivers`);
    }
  };

  const handleDeleteUser = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteUser",
        userId: record.users_id
      });

      if (response.data.status === 'success') {
        message.success(`User deleted successfully`);
        fetchUsers();
      } else {
        message.error(`Failed to delete user`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(`An error occurred while deleting user`);
    }
  };

  const handleDeleteVehicle = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteVehicle",
        vehicleId: record.vehicle_id
      });

      if (response.data.status === 'success') {
        message.success(`Vehicle deleted successfully`);
        fetchVehicles();
      } else {
        message.error(`Failed to delete vehicle`);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      message.error(`An error occurred while deleting vehicle`);
    }
  };

  const handleDeleteVenue = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteVenue",
        venueId: record.ven_id
      });

      if (response.data.status === 'success') {
        message.success(`Venue deleted successfully`);
        fetchVenues();
      } else {
        message.error(`Failed to delete venue`);
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      message.error(`An error occurred while deleting venue`);
    }
  };

  const handleDeleteEquipment = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteEquipment",
        equipmentId: record.equip_id
      });

      if (response.data.status === 'success') {
        message.success(`Equipment deleted successfully`);
        fetchEquipment();
      } else {
        message.error(`Failed to delete equipment`);
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      message.error(`An error occurred while deleting equipment`);
    }
  };

  const handleDeleteDriver = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteDriver",
        driverId: record.driver_id
      });

      if (response.data.status === 'success') {
        message.success(`Driver deleted successfully`);
        fetchDrivers();
      } else {
        message.error(`Failed to delete driver`);
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      message.error(`An error occurred while deleting driver`);
    }
  };

  // Add global search function
  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter data based on search text
  const getFilteredData = (data) => {
    if (!searchText) return data;
    
    return data.filter(item => {
      return Object.values(item).some(val => 
        val && val.toString().toLowerCase().includes(searchText.toLowerCase())
      );
    });
  };

  const handleRefresh = () => {
    switch (value) {
      case 0:
        fetchUsers();
        break;
      case 1:
        fetchVehicles();
        break;
      case 2:
        fetchVenues();
        break;
      case 3:
        fetchEquipment();
        break;
      case 4:
        fetchDrivers();
        break;
      default:
        break;
    }
    setSearchText('');
    setCurrentPage(1);
  };

  const userColumns = [
    { 
      title: 'School ID', 
      dataIndex: 'users_school_id', 
      key: 'school_id',
      sorter: (a, b) => a.users_school_id.localeCompare(b.users_school_id),
      responsive: ['md'],
    },
    {
      title: 'Name',
      key: 'name',
      render: (text, record) => `${record.users_fname} ${record.users_mname} ${record.users_lname}`,
      sorter: (a, b) => `${a.users_fname} ${a.users_lname}`.localeCompare(`${b.users_fname} ${b.users_lname}`),
    },
    { 
      title: 'Email', 
      dataIndex: 'users_email', 
      key: 'email',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'Department',
      dataIndex: 'departments_name',
      key: 'department',
      render: (text) => (
        <Tag color="blue">
          {text}
        </Tag>
      ),
      filters: [...new Set(users.map(user => user.departments_name))].map(dept => ({
        text: dept,
        value: dept,
      })),
      onFilter: (value, record) => record.departments_name === value,
      responsive: ['md'],
    },
    {
      title: 'User Level',
      dataIndex: 'user_level_name',
      key: 'userLevel',
      render: (text) => (
        <Tag color="green">
          {text}
        </Tag>
      ),
      filters: [...new Set(users.map(user => user.user_level_name))].map(level => ({
        text: level,
        value: level,
      })),
      onFilter: (value, record) => record.user_level_name === value,
    },
    { 
      title: 'Contact', 
      dataIndex: 'users_contact_number', 
      key: 'contact',
      responsive: ['lg'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Restore this user?"
            description="This will move the user back to active status."
            onConfirm={() => handleRestoreUsers(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this user permanently?"
            description="This will permanently delete this user and cannot be undone."
            onConfirm={() => handleDeleteUser(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const vehicleColumns = [
    { 
      title: 'License', 
      dataIndex: 'vehicle_license', 
      key: 'license',
      sorter: (a, b) => a.vehicle_license.localeCompare(b.vehicle_license),
    },
    { 
      title: 'Make', 
      dataIndex: 'vehicle_make_name', 
      key: 'make',
      filters: [...new Set(vehicles.map(vehicle => vehicle.vehicle_make_name))].map(make => ({
        text: make,
        value: make,
      })),
      onFilter: (value, record) => record.vehicle_make_name === value,
      responsive: ['md'],
    },
    { 
      title: 'Model', 
      dataIndex: 'vehicle_model_name', 
      key: 'model',
      responsive: ['lg'],
    },
    { 
      title: 'Category', 
      dataIndex: 'vehicle_category_name', 
      key: 'category',
      render: (text) => (
        <Tag color="purple">
          {text}
        </Tag>
      ),
      responsive: ['md'],
    },
    { 
      title: 'Year', 
      dataIndex: 'year', 
      key: 'year',
      sorter: (a, b) => a.year - b.year,
      responsive: ['lg'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Restore this vehicle?"
            description="This will move the vehicle back to active status."
            onConfirm={() => handleRestoreVehicles(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this vehicle permanently?"
            description="This will permanently delete this vehicle and cannot be undone."
            onConfirm={() => handleDeleteVehicle(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const venueColumns = [
    { 
      title: 'Name', 
      dataIndex: 'ven_name', 
      key: 'name',
      sorter: (a, b) => a.ven_name.localeCompare(b.ven_name),
    },
    { 
      title: 'Occupancy', 
      dataIndex: 'ven_occupancy', 
      key: 'occupancy',
      sorter: (a, b) => a.ven_occupancy - b.ven_occupancy,
      render: (text) => `${text} people`,
      responsive: ['md'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Restore this venue?"
            description="This will move the venue back to active status."
            onConfirm={() => handleRestoreVenues(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this venue permanently?"
            description="This will permanently delete this venue and cannot be undone."
            onConfirm={() => handleDeleteVenue(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const equipmentColumns = [
    { 
      title: 'Name', 
      dataIndex: 'equip_name', 
      key: 'name',
      sorter: (a, b) => a.equip_name.localeCompare(b.equip_name),
    },
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
      render: (text) => text || 'Not Applicable',
      responsive: ['md'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Restore this equipment?"
            description="This will move the equipment back to active status."
            onConfirm={() => handleRestoreEquipment(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this equipment permanently?"
            description="This will permanently delete this equipment and cannot be undone."
            onConfirm={() => handleDeleteEquipment(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const driverColumns = [
    { 
      title: 'Employee ID', 
      dataIndex: 'employee_id', 
      key: 'employeeId',
      sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
    },
    {
      title: 'Name',
      key: 'name',
      render: (text, record) => {
        const fullName = [
          record.driver_first_name,
          record.driver_middle_name,
          record.driver_last_name,
          record.driver_suffix
        ].filter(Boolean).join(' ');
        return fullName;
      },
      sorter: (a, b) => {
        const nameA = `${a.driver_first_name} ${a.driver_last_name}`;
        const nameB = `${b.driver_first_name} ${b.driver_last_name}`;
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Restore this driver?"
            description="This will move the driver back to active status."
            onConfirm={() => handleRestoreDrivers(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this driver permanently?"
            description="This will permanently delete this driver and cannot be undone."
            onConfirm={() => handleDeleteDriver(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <p className="text-gray-500">No archived items found</p>
      }
    />
  );

  const renderSkeletonLoader = () => (
    <div className="p-4">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );

  // Tab components
  const tabItems = [
    { key: 0, label: 'Users', icon: <UserOutlined /> },
    { key: 1, label: 'Vehicles', icon: <CarOutlined /> },
    { key: 2, label: 'Venues', icon: <HomeOutlined /> },
    { key: 3, label: 'Equipment', icon: <ToolOutlined /> },
    { key: 4, label: 'Drivers', icon: <IdcardOutlined /> }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const renderBulkActions = () => {
    if (selectedRowKeys.length === 0) return null;

    const handleRestore = () => {
      switch (value) {
        case 0:
          handleRestoreUsers();
          break;
        case 1:
          handleRestoreVehicles();
          break;
        case 2:
          handleRestoreVenues();
          break;
        case 3:
          handleRestoreEquipment();
          break;
        case 4:
          handleRestoreDrivers();
          break;
        default:
          break;
      }
    };

    return (
      <div className="mb-4">
        <Button
          type="primary"
          icon={<UndoOutlined />}
          onClick={handleRestore}
          className="bg-green-900 hover:bg-lime-900"
        >
          Restore Selected ({selectedRowKeys.length})
        </Button>
      </div>
    );
  };

  const getCurrentData = () => {
    const filteredData = getFilteredData(
      value === 0 ? users :
      value === 1 ? vehicles :
      value === 2 ? venues :
      value === 3 ? equipment :
      value === 4 ? drivers : []
    );
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  };

  const getCurrentColumns = () => {
    switch (value) {
      case 0: return userColumns;
      case 1: return vehicleColumns;
      case 2: return venueColumns;
      case 3: return equipmentColumns;
      case 4: return driverColumns;
      default: return [];
    }
  };

  const getCurrentRowKey = () => {
    switch (value) {
      case 0: return 'users_id';
      case 1: return 'vehicle_id';
      case 2: return 'ven_id';
      case 3: return 'equip_id';
      case 4: return 'driver_id';
      default: return 'id';
    }
  };

  const getFilteredDataLength = () => {
    return getFilteredData(
      value === 0 ? users :
      value === 1 ? vehicles :
      value === 2 ? venues :
      value === 3 ? equipment :
      value === 4 ? drivers : []
    ).length;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-none">
        <Sidebar />
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-10">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-8"
          >
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-5">
                Archive   
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-row items-center gap-2 w-full">
              <div className="flex-grow">
                <Input
                  placeholder="Search across all fields..."
                  allowClear
                  prefix={<SearchOutlined />}
                  size="large"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <Tooltip title="Refresh data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="large"
                  style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Tooltip>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px space-x-2 sm:space-x-8 overflow-x-auto">
                {tabItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleChange(item.key)}
                    className={`py-2 sm:py-4 px-1 flex items-center space-x-1 sm:space-x-2 font-medium text-xs sm:text-sm border-b-2 transition-colors duration-200 whitespace-nowrap ${
                      value === item.key 
                        ? 'border-green-900 text-green-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm sm:text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {loading ? (
                renderSkeletonLoader()
              ) : (
                <div>
                  {renderBulkActions()}
                  
                  {/* Table */}
                  <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100" style={{ minWidth: '100%' }}>
                    <Table 
                      rowSelection={rowSelection}
                      columns={getCurrentColumns()} 
                      dataSource={getCurrentData()}
                      rowKey={getCurrentRowKey()}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      bordered
                      size="middle"
                      className="archive-table"
                      locale={{ emptyText: renderEmptyState() }}
                    />
                    
                    {/* Custom Pagination */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, getFilteredDataLength())} of {getFilteredDataLength()} items
                        </span>
                        <div className="flex items-center space-x-2">
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                          <span className="text-sm text-gray-600">per page</span>
                        </div>
                      </div>
                      <div className="flex justify-center mt-4">
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            size="small"
                          >
                            Previous
                          </Button>
                          {Array.from({ length: Math.ceil(getFilteredDataLength() / pageSize) }, (_, i) => i + 1)
                            .filter(page => page === 1 || page === Math.ceil(getFilteredDataLength() / pageSize) || Math.abs(page - currentPage) <= 1)
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="px-2 py-1">...</span>
                                )}
                                <Button
                                  onClick={() => setCurrentPage(page)}
                                  type={currentPage === page ? 'primary' : 'default'}
                                  size="small"
                                  className={currentPage === page ? 'bg-green-900 hover:bg-lime-900' : ''}
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            ))
                          }
                          <Button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage >= Math.ceil(getFilteredDataLength() / pageSize)}
                            size="small"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
