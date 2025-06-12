import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Empty, Skeleton, Input } from 'antd';
import { UndoOutlined, FileSearchOutlined, UserOutlined, CarOutlined, HomeOutlined, ToolOutlined, CaretRightOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
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
  const navigate = useNavigate();
  const encryptedUrl = SecureStorage.getLocalItem("url");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [navigate]);

  const handleChange = (newValue) => {
    setValue(newValue);
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
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveUser",
        userType: "user",
        userId: selectedRowKeys
      });

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
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveResource",
        resourceType: "vehicle",
        resourceId: selectedRowKeys
      });

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
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveResource",
        resourceType: "venue",
        resourceId: selectedRowKeys
      });

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

  const handleRestoreEquipment = async () => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveResource",
        resourceType: "equipment",
        resourceId: selectedRowKeys
      });

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} equipment items restored successfully`);
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
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveUser",
        userType: "driver",
        userId: selectedRowKeys
      });

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

  const userColumns = [
    { 
      title: 'School ID', 
      dataIndex: 'users_school_id', 
      key: 'school_id',
      sorter: (a, b) => a.users_school_id.localeCompare(b.users_school_id),
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
        <Space>
          <Popconfirm
            title="Restore this user?"
            description="This will move the user back to active status."
            onConfirm={() => handleRestoreUsers(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-500 hover:bg-green-600">
              Restore
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
            <Button danger icon={<DeleteOutlined />}>
              Delete
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
    },
    { 
      title: 'Model', 
      dataIndex: 'vehicle_model_name', 
      key: 'model',
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
    },
    { 
      title: 'Year', 
      dataIndex: 'year', 
      key: 'year',
      sorter: (a, b) => a.year - b.year,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Restore this vehicle?"
            description="This will move the vehicle back to active status."
            onConfirm={() => handleRestoreVehicles(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-500 hover:bg-green-600">
              Restore
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
            <Button danger icon={<DeleteOutlined />}>
              Delete
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
    },
    
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Restore this venue?"
            description="This will move the venue back to active status."
            onConfirm={() => handleRestoreVenues(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-500 hover:bg-green-600">
              Restore
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
            <Button danger icon={<DeleteOutlined />}>
              Delete
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
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Restore this equipment?"
            description="This will move the equipment back to active status."
            onConfirm={() => handleRestoreEquipment(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-500 hover:bg-green-600">
              Restore
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
            <Button danger icon={<DeleteOutlined />}>
              Delete
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
        <Space>
          <Popconfirm
            title="Restore this driver?"
            description="This will move the driver back to active status."
            onConfirm={() => handleRestoreDrivers(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-500 hover:bg-green-600">
              Restore
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
            <Button danger icon={<DeleteOutlined />}>
              Delete
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
    { key: 4, label: 'Drivers', icon: <CaretRightOutlined /> }
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
          className="bg-green-500 hover:bg-green-600"
        >
          Restore Selected ({selectedRowKeys.length})
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row bg-gradient-to-br from-white to-green-100 min-h-screen">
      <div className="flex-none">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto mt-20 p-8 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-sm flex items-center">
            <FileSearchOutlined className="mr-4 text-3xl text-green-600" /> 
            Archive Management
          </h2>
          <p className="mb-6 text-gray-600 max-w-3xl">
            View and restore archived items across the system. All items can be restored back to active status.
          </p>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px space-x-8">
                {tabItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleChange(item.key)}
                    className={`py-4 px-1 flex items-center space-x-2 font-medium text-sm border-b-2 transition-colors duration-200 ${
                      value === item.key 
                        ? 'border-green-500 text-green-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Global Search Bar */}
            <div className="mb-4">
              <Input
                placeholder="Search across all fields..."
                prefix={<SearchOutlined className="text-gray-400" />}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: '100%', maxWidth: '500px' }}
                allowClear
              />
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {loading ? (
                renderSkeletonLoader()
              ) : (
                <div>
                  {renderBulkActions()}
                  {/* Users Tab */}
                  {value === 0 && (
                    <Table 
                      rowSelection={rowSelection}
                      columns={userColumns} 
                      dataSource={getFilteredData(users)}
                      rowKey="users_id"
                      pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        onChange: (page, pageSize) => {
                          setPageSize(pageSize);
                        }
                      }}
                      scroll={{ x: 1200 }}
                      bordered
                      size="middle"
                      className="archive-table"
                      locale={{ emptyText: renderEmptyState() }}
                    />
                  )}

                  {/* Vehicles Tab */}
                  {value === 1 && (
                    <Table 
                      rowSelection={rowSelection}
                      columns={vehicleColumns} 
                      dataSource={getFilteredData(vehicles)}
                      rowKey="vehicle_id"
                      pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                      }}
                      scroll={{ x: 1000 }}
                      bordered
                      size="middle"
                      className="archive-table"
                      locale={{ emptyText: renderEmptyState() }}
                    />
                  )}

                  {/* Venues Tab */}
                  {value === 2 && (
                    <Table 
                      rowSelection={rowSelection}
                      columns={venueColumns} 
                      dataSource={getFilteredData(venues)}
                      rowKey="ven_id"
                      pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                      }}
                      scroll={{ x: 800 }}
                      bordered
                      size="middle"
                      className="archive-table"
                      locale={{ emptyText: renderEmptyState() }}
                    />
                  )}

                  {/* Equipment Tab */}
                  {value === 3 && (
                    <Table 
                      rowSelection={rowSelection}
                      columns={equipmentColumns} 
                      dataSource={getFilteredData(equipment)}
                      rowKey="equip_id"
                      pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                      }}
                      scroll={{ x: 800 }}
                      bordered
                      size="middle"
                      className="archive-table"
                      locale={{ emptyText: renderEmptyState() }}
                    />
                  )}

                  {/* Drivers Tab */}
                  {value === 4 && (
                    <Table 
                      rowSelection={rowSelection}
                      columns={driverColumns} 
                      dataSource={getFilteredData(drivers)}
                      rowKey="driver_id"
                      pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                      }}
                      scroll={{ x: 800 }}
                      bordered
                      size="middle"
                      className="archive-table"
                      locale={{ emptyText: renderEmptyState() }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Archive;
