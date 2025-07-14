import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Grid,
  useTheme,
  styled,
} from '@mui/material';
import { 
  EditOutlined,
  CameraOutlined,
  SaveOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Modal, Input, message, Spin, Tooltip, Tabs, Switch } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

const StyledInput = styled(Input)`
  &.ant-input-affix-wrapper {
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    padding: 8px 12px;
    
    &:hover, &:focus {
      border-color: #4caf50;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
    }
  }
`;

const ProfileModal = ({ visible, onClose }) => {
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    schoolId: '',
    email: '',
    phoneNumber: '',
    department: '',
    userLevel: ''
  });
  const [activeTab, setActiveTab] = useState('1');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAdminData();
    }
  }, [visible]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'fetchPersonnelById',
          id: localStorage.getItem('user_id')
        })
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.data.length > 0) {
        const userData = result.data[0];
        setPersonalInfo({
          firstName: userData.jo_personel_fname,
          middleName: userData.jo_personel_mname,
          lastName: userData.jo_personel_lname,
          schoolId: userData.jo_personel_school_id,
          email: userData.jo_personel_contact,
          phoneNumber: userData.jo_personel_contact_number || '',
          department: userData.departments_name,
          userLevel: userData.user_level_name
        });
        if (userData.users_pic) {
          setProfileImage(`data:image/jpeg;base64,${userData.users_pic}`);
        }
        setTwoFactorEnabled(userData.is_2FAactive === "1");
      }
    } catch (err) {
      message.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
      message.success('Profile picture updated successfully');
    }
  };

  const handleSave = () => {
    message.success('Profile updated successfully');
    setEditMode(false);
  };

  const handleInfoChange = (field, e) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }
    // Add your password change logic here
    message.success('Password updated successfully');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleTwoFactorToggle = async (checked) => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: checked ? 'enable2FA' : 'unenable2FA',
          id: userId,
          userType: 'personnel'
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        setTwoFactorEnabled(checked);
        message.success(`Two-factor authentication ${checked ? 'enabled' : 'disabled'}`);
      } else {
        message.error('Failed to update 2FA status');
        setTwoFactorEnabled(!checked);
      }
    } catch (error) {
      console.error('Error updating 2FA:', error);
      message.error('Failed to update 2FA status');
      setTwoFactorEnabled(!checked);
    }
  };

  const renderSettingsTab = () => {
    const isPasswordValid = 
      passwordForm.currentPassword && 
      passwordForm.newPassword && 
      passwordForm.confirmPassword && 
      passwordForm.newPassword === passwordForm.confirmPassword;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" className="mb-4">Change Password</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <StyledInput
                type="password"
                placeholder="Current Password"
                prefix={<LockOutlined />}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledInput
                type="password"
                placeholder="New Password"
                prefix={<LockOutlined />}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledInput
                type="password"
                placeholder="Confirm New Password"
                prefix={<LockOutlined />}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <button
                className={`${isPasswordValid ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-lg`}
                onClick={handlePasswordChange}
                disabled={!isPasswordValid}
              >
                Update Password
              </button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" className="mb-4">Two-Factor Authentication</Typography>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body1">Enable 2FA</Typography>
                <Typography variant="body2" className="text-gray-500">
                  Add an extra layer of security to your account
                </Typography>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onChange={handleTwoFactorToggle}
                className="bg-gray-300"
              />
            </div>
          </Box>
        </Box>
      </motion.div>
    );
  };

  const renderInformationTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <Avatar
            src={profileImage}
            size={180}
            style={{
              border: '6px solid white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          />
          <Tooltip title="Change Profile Picture">
            <label htmlFor="profile-upload" className="absolute bottom-2 right-2">
              <div className="bg-green-500 p-2 rounded-full cursor-pointer hover:bg-green-600 transition-colors">
                <CameraOutlined style={{ color: 'white', fontSize: '20px' }} />
              </div>
              <input
                type="file"
                id="profile-upload"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </Tooltip>
        </div>
        
        <Typography variant="h5" className="mt-4 font-semibold text-gray-800">
          {`${personalInfo.firstName} ${personalInfo.lastName}`}
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          {personalInfo.department} - {personalInfo.userLevel}
        </Typography>
      </div>

      <Grid container spacing={3}>
        {[
          { icon: <UserOutlined />, label: 'First Name', value: personalInfo.firstName },
          { icon: <UserOutlined />, label: 'Middle Name', value: personalInfo.middleName },
          { icon: <UserOutlined />, label: 'Last Name', value: personalInfo.lastName },
          { icon: <IdcardOutlined />, label: 'School ID', value: personalInfo.schoolId },
          { icon: <MailOutlined />, label: 'Email', value: personalInfo.email },
          { icon: <PhoneOutlined />, label: 'Phone', value: personalInfo.phoneNumber },
        ].map((field, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="text-green-500">{field.icon}</div>
                <div className="flex-1">
                  <Typography variant="caption" className="text-gray-500">
                    {field.label}
                  </Typography>
                  {editMode ? (
                    <StyledInput
                      value={field.value}
                      onChange={(e) => handleInfoChange(field.label.toLowerCase(), e)}
                    />
                  ) : (
                    <Typography variant="body1" className="font-medium">
                      {field.value}
                    </Typography>
                  )}
                </div>
              </div>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      title={
        <div className="flex justify-between items-center">
          <Typography variant="h6" className="text-gray-800">
            Profile Settings
          </Typography>
          {activeTab === '1' && (
            <Tooltip title={editMode ? "Save Changes" : "Edit Profile"}>
              <IconButton
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                style={{ color: editMode ? '#4caf50' : '#666' }}
              >
                {editMode ? <SaveOutlined /> : <EditOutlined />}
              </IconButton>
            </Tooltip>
          )}
        </div>
      }
      centered
    >
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: '1',
              label: 'Information',
              children: renderInformationTab(),
            },
            {
              key: '2',
              label: 'Settings',
              children: renderSettingsTab(),
            },
          ]}
        />
      )}
    </Modal>
  );
};

export default ProfileModal;