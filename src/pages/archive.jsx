import { Box, Paper, Tab, Tabs, Typography, alpha, useTheme } from '@mui/material';
import { Button, Empty, Popconfirm, Skeleton, Space, Table, Tag, message } from 'antd';
import { CarOutlined, FileSearchOutlined, HomeOutlined, ToolOutlined, UndoOutlined, UserOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useState } from 'react';

import { SecureStorage } from '../utils/encryption';
import Sidebar from './Sidebar';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Enhanced styled components
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: 'none',
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: '4px',
    borderRadius: '4px 4px 0 0',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontSize: '1.05rem',
    fontWeight: 600,
    minWidth: 140,
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
    '&:hover': {
      color: theme.palette.primary.light,
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
    },
  },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  height: '100vh',
  overflow: 'auto',
  backgroundColor: theme.palette.background.default,
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  '& .ant-table-wrapper': {
    border: 'none',
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
  },
  '& .ant-table-thead > tr > th': {
    backgroundColor: theme.palette.grey[50],
    color: theme.palette.text.primary,
    fontWeight: 600,
    padding: '16px',
    fontSize: '0.9rem',
  },
  '& .ant-table-tbody > tr > td': {
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    padding: '12px 16px',
    fontSize: '0.9rem',
  },
  '& .ant-table-tbody > tr:hover > td': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '& .ant-empty': {
    margin: '40px 0',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  boxShadow: 'none',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  '&:hover': {
    opacity: 0.9,
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
}));

const StatusTag = styled(Tag)(({ color }) => ({
  borderRadius: '6px',
  padding: '4px 10px',
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  boxShadow: `0 2px 6px ${alpha(color === 'blue' ? '#1890ff' : color === 'green' ? '#52c41a' : '#722ed1', 0.2)}`,
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2, 0),
  gap: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
}));

const TabIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

const CustomTab = ({ label, icon }) => (
  <TabIconWrapper>
    {icon}
    {label}
  </TabIconWrapper>
);

const TabPanel = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`archive-tabpanel-${index}`}
      aria-labelledby={`archive-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Archive = () => {
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const encryptedUrl = SecureStorage.getLocalItem("url");

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [navigate]);

  const handleChange = (event, newValue) => {
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
        toast.error("Error fetching users: " + response.data.message);
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
        { operation: "fetchEquipmentsWithStatus" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setEquipment(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching equipment");
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
      default:
        break;
    }
  }, [value, fetchUsers, fetchVehicles, fetchVenues, fetchEquipment]);

  const handleRestoreUser = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveUser",
        userType: convertUserType(record.user_level_name),
        userId: record.users_id
      });

      if (response.data.status === 'success') {
        message.success(`User restored successfully`);
        fetchUsers();
      } else {
        message.error(`Failed to restore user`);
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      message.error(`An error occurred while restoring user`);
    }
  };

  const handleRestoreVehicle = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveResource",
        resourceType: "vehicle",
        resourceId: record.vehicle_id
      });

      if (response.data.status === 'success') {
        message.success(`Vehicle restored successfully`);
        fetchVehicles();
      } else {
        message.error(`Failed to restore vehicle`);
      }
    } catch (error) {
      console.error('Error restoring vehicle:', error);
      message.error(`An error occurred while restoring vehicle`);
    }
  };

  const handleRestoreVenue = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveResource",
        resourceType: "venue",
        resourceId: record.ven_id
      });

      if (response.data.status === 'success') {
        message.success(`Venue restored successfully`);
        fetchVenues();
      } else {
        message.error(`Failed to restore venue`);
      }
    } catch (error) {
      console.error('Error restoring venue:', error);
      message.error(`An error occurred while restoring venue`);
    }
  };

  const handleRestoreEquipment = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "unarchiveResource",
        resourceType: "equipment",
        resourceId: record.equip_id
      });

      if (response.data.status === 'success') {
        message.success(`Equipment restored successfully`);
        fetchEquipment();
      } else {
        message.error(`Failed to restore equipment`);
      }
    } catch (error) {
      console.error('Error restoring equipment:', error);
      message.error(`An error occurred while restoring equipment`);
    }
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
        <StatusTag color="blue">
          {text}
        </StatusTag>
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
        <StatusTag color="green">
          {text}
        </StatusTag>
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
            onConfirm={() => handleRestoreUser(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <StyledButton type="primary" icon={<UndoOutlined />}>
              Restore
            </StyledButton>
          </Popconfirm>
        </Space>
      ),
    },
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
        <StatusTag color="purple">
          {text}
        </StatusTag>
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
            onConfirm={() => handleRestoreVehicle(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <StyledButton type="primary" icon={<UndoOutlined />}>
              Restore
            </StyledButton>
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
      title: 'Operating Hours', 
      dataIndex: 'ven_operating_hours', 
      key: 'hours',
      render: (text) => (
        <StatusTag color="blue">
          {text}
        </StatusTag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Restore this venue?"
            description="This will move the venue back to active status."
            onConfirm={() => handleRestoreVenue(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <StyledButton type="primary" icon={<UndoOutlined />}>
              Restore
            </StyledButton>
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
      title: 'Quantity', 
      dataIndex: 'equip_quantity', 
      key: 'quantity',
      sorter: (a, b) => a.equip_quantity - b.equip_quantity,
    },
    { 
      title: 'Created At', 
      dataIndex: 'equip_created_at', 
      key: 'created',
      responsive: ['md'],
      render: (text) => new Date(text).toLocaleDateString(),
    },
    { 
      title: 'Updated At', 
      dataIndex: 'equip_updated_at', 
      key: 'updated',
      responsive: ['lg'],
      render: (text) => new Date(text).toLocaleDateString(),
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
            <StyledButton type="primary" icon={<UndoOutlined />}>
              Restore
            </StyledButton>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          No archived items found
        </Typography>
      }
    />
  );

  const renderSkeletonLoader = () => (
    <Box sx={{ padding: 2 }}>
      <Skeleton active paragraph={{ rows: 6 }} />
    </Box>
  );

  const tabIconStyle = { fontSize: '18px' };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <ContentWrapper>
        <Box sx={{ 
          p: { xs: 2, md: 3 }, 
          borderRadius: 2,
          background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          mb: 3,
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <FileSearchOutlined style={{ fontSize: '1.7rem', color: theme.palette.primary.main }} />
            Archive Management
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: theme.palette.text.secondary,
              maxWidth: '800px',
            }}
          >
            View and restore archived items across the system. All items can be restored back to active status.
          </Typography>
        </Box>

        <StyledPaper elevation={0} sx={{ width: '100%', bgcolor: 'background.paper' }}>
          <StyledTabs
            value={value}
            onChange={handleChange}
            centered
            aria-label="archive sections"
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Tab 
              label={<CustomTab label="Users" icon={<UserOutlined style={tabIconStyle} />} />} 
              id="archive-tab-0" 
              aria-controls="archive-tabpanel-0" 
            />
            <Tab 
              label={<CustomTab label="Vehicles" icon={<CarOutlined style={tabIconStyle} />} />} 
              id="archive-tab-1" 
              aria-controls="archive-tabpanel-1" 
            />
            <Tab 
              label={<CustomTab label="Venues" icon={<HomeOutlined style={tabIconStyle} />} />} 
              id="archive-tab-2" 
              aria-controls="archive-tabpanel-2" 
            />
            <Tab 
              label={<CustomTab label="Equipment" icon={<ToolOutlined style={tabIconStyle} />} />} 
              id="archive-tab-3" 
              aria-controls="archive-tabpanel-3" 
            />
          </StyledTabs>

          <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: 2 }}>
            <TabPanel value={value} index={0}>
              <HeaderBox>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                 
                </Typography>
                
                
              </HeaderBox>

              {loading ? (
                renderSkeletonLoader()
              ) : (
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="users_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                    style: { marginTop: '16px' }
                  }}
                  scroll={{ x: 'max-content' }}
                  locale={{ emptyText: renderEmptyState() }}
                  rowClassName={(record, index) => index % 2 === 0 ? '' : alpha(theme.palette.primary.main, 0.02)}
                />
              )}
            </TabPanel>

            <TabPanel value={value} index={1}>
              <HeaderBox>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                 
                </Typography>
              
              </HeaderBox>

              {loading ? (
                renderSkeletonLoader()
              ) : (
                <Table
                  columns={vehicleColumns}
                  dataSource={vehicles}
                  loading={loading}
                  rowKey="vehicle_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`
                  }}
                  locale={{ emptyText: renderEmptyState() }}
                  rowClassName={(record, index) => index % 2 === 0 ? '' : alpha(theme.palette.primary.main, 0.02)}
                />
              )}
            </TabPanel>

            <TabPanel value={value} index={2}>
              <HeaderBox>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  
                </Typography>
               
              </HeaderBox>

              {loading ? (
                renderSkeletonLoader()
              ) : (
                <Table
                  columns={venueColumns}
                  dataSource={venues}
                  loading={loading}
                  rowKey="ven_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`
                  }}
                  locale={{ emptyText: renderEmptyState() }}
                  rowClassName={(record, index) => index % 2 === 0 ? '' : alpha(theme.palette.primary.main, 0.02)}
                />
              )}
            </TabPanel>

            <TabPanel value={value} index={3}>
              <HeaderBox>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                 
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
               
              </HeaderBox>

              {loading ? (
                renderSkeletonLoader()
              ) : (
                <Table
                  columns={equipmentColumns}
                  dataSource={equipment}
                  loading={loading}
                  rowKey="equip_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`
                  }}
                  locale={{ emptyText: renderEmptyState() }}
                  rowClassName={(record, index) => index % 2 === 0 ? '' : alpha(theme.palette.primary.main, 0.02)}
                />
              )}
            </TabPanel>
          </Box>
        </StyledPaper>
      </ContentWrapper>
    </Box>
  );
};

export default Archive;
