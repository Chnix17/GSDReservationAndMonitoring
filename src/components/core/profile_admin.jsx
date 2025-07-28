import React, { useState, useEffect, useCallback } from 'react';
import { FaUser, FaLock, FaShieldAlt, FaEdit, FaTimes, FaCheck, FaToggleOn, FaIdCard, FaBuilding, FaEnvelope, FaPhone, FaChevronDown, FaEye, FaEyeSlash, FaInfoCircle, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { SecureStorage } from '../../utils/encryption';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProfileAdminModal = ({ isOpen, onClose }) => {
  // Get base URL from SecureStorage
  const baseUrl = SecureStorage.getLocalItem("url");
  
  // User data states
  const [userData, setUserData] = useState({
    title_abbreviation: '', // Added
    users_fname: '',
    users_mname: '',
    users_lname: '',
    users_suffix: '', // Added
    users_email: '',
    users_school_id: '',
    users_contact_number: '',
    departments_name: '',
    user_level_name: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Add a state for departments
  const [departments, setDepartments] = useState([]);
  // Add a state for titles
  const [titles, setTitles] = useState([]);
  // Add a state for user levels
  const [userLevels, setUserLevels] = useState([]);

  // Add a state for loading 2FA status
  const [is2FALoading, setIs2FALoading] = useState(false);

  // Add state for disabling 2FA
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // Fetch user data from API
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = SecureStorage.getSessionItem('user_id'); // Use the stored user ID or default to 42
      
      console.log('Fetching user data for ID:', userId);
      
      const response = await fetch(`${baseUrl}/user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "fetchUsersById",
          id: userId
        })
      });
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      // Check if the response has status success and data property
      if (responseData && responseData.status === 'success' && responseData.data) {
        // Check if data is an array with at least one element
        if (Array.isArray(responseData.data) && responseData.data.length > 0) {
          // Get the first user from the data array
          const userData = responseData.data[0];
          console.log('User data fetched successfully:', userData);
          
          // Set the user data state
          setUserData(userData);
          console.log('User state updated with fetched data');
        } else {
          console.error('User data array is empty or not an array', responseData.data);
        }
      } else {
        console.error('Failed to fetch user details or invalid data format', responseData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Function to fetch departments from API
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "fetchDepartments"
        })
      });
      
      const responseData = await response.json();
      console.log('Departments Response:', responseData);
      
      if (responseData && responseData.status === 'success' && responseData.data) {
        setDepartments(responseData.data);
        console.log('Departments loaded:', responseData.data);
      } else {
        console.error('Failed to fetch departments', responseData);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, [baseUrl]);

  // Function to fetch titles from API
  const fetchTitles = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "fetchTitle"
        })
      });
      const responseData = await response.json();
      if (responseData && responseData.status === 'success' && responseData.data) {
        setTitles(responseData.data);
      } else {
        setTitles([]);
      }
    } catch (error) {
      setTitles([]);
    }
  }, [baseUrl]);

  // Function to fetch user levels from API
  const fetchUserLevels = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "fetchUserLevels"
        })
      });
      const responseData = await response.json();
      if (responseData && responseData.status === 'success' && responseData.data) {
        setUserLevels(responseData.data);
      } else {
        setUserLevels([]);
      }
    } catch (error) {
      setUserLevels([]);
    }
  }, [baseUrl]);

  // Function to fetch 2FA status
  const fetch2FAStatus = useCallback(async () => {
    try {
      setIs2FALoading(true);
      const userId = SecureStorage.getSessionItem('user_id') || '42';
      
      const response = await fetch(`${baseUrl}/update_master2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "fetch2FA",
          json: {
            user_id: userId
          }
        })
      });
      
      const responseData = await response.json();
      console.log('2FA Status Response:', responseData);
      
      if (responseData && responseData.status === 'success') {
        setTwoFactorData(responseData);
        setTwoFactorEnabled(responseData.is_active);
      } else {
        console.error('Failed to fetch 2FA status', responseData);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
    } finally {
      setIs2FALoading(false);
    }
  }, [baseUrl]);

  // Fetch user data, departments, and 2FA status when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserData();
      fetchDepartments();
      fetch2FAStatus();
      fetchTitles();
      fetchUserLevels();
      // Check if user is admin
      const userLevelId = SecureStorage.getSessionItem('user_level_id');
      setIsAdmin(userLevelId === 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fetchUserData, fetchDepartments, fetch2FAStatus, fetchTitles, fetchUserLevels]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({...userData});
  const [activeTab, setActiveTab] = useState('profile');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState({
    is_active: false,
    expires_at: '',
    requires_verification: false
  });
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorDuration, setTwoFactorDuration] = useState(1); // Default to 1 day
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // State for loading indicators
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // Handle modal close with ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        // Save changes
        console.log('Saving profile changes:', editedData);
        
        // Prepare data for API call, ensuring non-admin users can't change restricted fields
        const updateData = {
          operation: "updateProfile",
          users_id: editedData.users_id,
          users_fname: editedData.users_fname,
          users_mname: editedData.users_mname,
          users_lname: editedData.users_lname,
          users_email: editedData.users_email,
          users_contact_number: editedData.users_contact_number,
          users_suffix: editedData.users_suffix || '',
          title_id: titles.find(t => t.abbreviation === editedData.title_abbreviation)?.id || null,
          users_user_level_id: editedData.user_level_id || userData.user_level_id,
        };
        
        // Only include restricted fields if user is admin
        if (isAdmin) {
          updateData.users_school_id = editedData.users_school_id;
          updateData.users_department_id = editedData.departments_id || editedData.users_department_id;
        } else {
          // For non-admin users, use original values for restricted fields
          updateData.users_school_id = userData.users_school_id;
          updateData.users_department_id = userData.users_department_id || userData.departments_id;
        }
        
        // Make API call to update user data
        const response = await fetch(`${baseUrl}/user.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        const responseData = await response.json();
        console.log('Update response:', responseData);
        
        if (responseData && responseData.status === 'success') {
          alert('Profile updated successfully!');
          // Refresh user data
          fetchUserData();
        } else {
          alert('Failed to update profile: ' + (responseData.message || 'Unknown error'));
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        alert('An error occurred while updating your profile. Please try again.');
      }
    } else {
      // Start editing - make a copy of the current userData
      setEditedData({
        ...userData,
        user_level_id: userData.user_level_id || userData.users_user_level_id || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    setEditedData({
      ...editedData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Update password strength indicators in real-time
    if (name === 'newPassword') {
      setPasswordStrength({
        hasLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecial: /[^A-Za-z0-9]/.test(value)
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility({
      ...passwordVisibility,
      [field]: !passwordVisibility[field]
    });
  };

  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      errors.newPassword = 'New password cannot be the same as current password';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one number';
    } else if (!/[^A-Za-z0-9]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one special character';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (validatePassword()) {
      setIsSubmittingPassword(true);
      try {
        // Make API call to change the password
        const response = await fetch(`${baseUrl}/user.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: "updatePassword",
            userId: SecureStorage.getSessionItem('user_id') || 'user_id_here',
            oldPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });
        
        const data = await response.json();
        
        // Check for success message in both success and error responses
        if (data.success || (data.message && data.message.includes("Password updated successfully"))) {
          alert('Password changed successfully');
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        } else {
          // Handle specific error messages from the backend
          if (data.message === "Current password is incorrect") {
            setPasswordErrors({
              ...passwordErrors,
              currentPassword: 'Current password is incorrect'
            });
          } else if (data.message === "New password cannot be the same as current password") {
            setPasswordErrors({
              ...passwordErrors,
              newPassword: 'New password cannot be the same as current password'
            });
          } else {
            alert(`Failed to update password: ${data.message || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error("Error updating password:", error);
        alert('An error occurred while updating your password. Please try again.');
      } finally {
        setIsSubmittingPassword(false);
      }
    }
  };

  const handleToggle2FA = async () => {
    if (twoFactorEnabled) {
      // Handle disabling 2FA
      try {
        setIsDisabling2FA(true);
        const userId = SecureStorage.getSessionItem('user_id') || '42';
        
        const response = await fetch(`${baseUrl}/update_master2.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: "disable2FA",
            json: {
              user_id: userId
            }
          })
        });
        
        const responseData = await response.json();
        if (responseData && responseData.status === 'success') {
          setTwoFactorEnabled(false);
          setTwoFactorData({
            is_active: false,
            expires_at: '',
            requires_verification: false
          });
          toast.success('Two-factor authentication disabled successfully!', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          toast.error('Failed to disable two-factor authentication.', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } catch (error) {
        console.error("Error disabling 2FA:", error);
        toast.error('An error occurred while disabling two-factor authentication.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setIsDisabling2FA(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.trim() === '') {
      setVerificationError('Please enter the verification code');
      return;
    }
    
    try {
      setIsVerifying(true);
      const userId = SecureStorage.getSessionItem('user_id') || userData.users_id;
      
      const response = await fetch(`${baseUrl}/update_master2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "validateEmailVerification",
          json: {
            user_id: userId,
            token: verificationCode,
            duration: twoFactorDuration.toString()
          }
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Two-factor authentication enabled successfully!', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setTwoFactorEnabled(true);
        setShowTwoFactorSetup(false);
        setIsVerifyingEmail(false);
        // Save the duration setting to SecureStorage
        SecureStorage.setSessionItem('2faDuration', twoFactorDuration.toString());
      } else {
        setVerificationError(data.message || 'Invalid verification code. Please try again.');
        toast.error('Invalid verification code. Please try again.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error validating verification code:", error);
      setVerificationError('An error occurred while validating the verification code.');
      toast.error('An error occurred while validating the verification code.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const sendEmailVerification = async () => {
    setIsVerifyingEmail(true);
    setVerificationError('');
    try {
      setIsSendingVerification(true);
      const userId = SecureStorage.getSessionItem('user_id') || userData.users_id;

      console.log("userId", userId);
      const response = await fetch(`${baseUrl}/update_master2.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "sendEmailVerification",
          json: {
            user_id: userId
          }
        })
      });
      
      const data = await response.json();
      if (data.status !== 'success') {
        setVerificationError(data.message || 'Failed to send verification email. Please try again.');
        toast.error('Failed to send verification email. Please try again.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.info('Verification email sent! Please check your inbox.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      setVerificationError('An error occurred while sending verification email. Please try again.');
      toast.error('An error occurred while sending verification email.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handle2FAVerification = () => {
    sendEmailVerification();
  };

  // Render a restricted field with appropriate styling
  const renderRestrictedField = (label, icon, value, fieldName, isSelectField = false) => {
    const isRestrictedField = !isAdmin && (fieldName === 'users_school_id' || fieldName === 'departments_id' || fieldName === 'user_level_name');
    const isRoleField = fieldName === 'user_level_name';
    
    return (
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          {icon}
          <span>{label}</span>
          {isRestrictedField && isEditing && (
            <div className="ml-2 text-gray-400 dark:text-gray-500 flex items-center text-xs">
              <FaInfoCircle size={12} className="mr-1" />
              <span>Admin only</span>
            </div>
          )}
        </label>
        
        {isEditing && !isRestrictedField && isSelectField && fieldName === 'departments_id' ? (
          <select
            name={fieldName}
            value={editedData[fieldName] || editedData.users_department_id || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept.departments_id} value={dept.departments_id}>
                {dept.departments_name}
              </option>
            ))}
          </select>
        ) : isEditing && !isRestrictedField && isRoleField ? (
          <select
            name="user_level_id"
            value={editedData.user_level_id || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          >
            <option value="">Select Role</option>
            {userLevels.map(level => (
              <option key={level.user_level_id} value={level.user_level_id}>{level.user_level_name}</option>
            ))}
          </select>
        ) : isEditing && !isRestrictedField ? (
          <input
            type="text"
            name={fieldName}
            value={editedData[fieldName] || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        ) : (
          <p className={`${isRoleField ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-800 dark:text-white'} ${isRestrictedField && isEditing ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white/70 dark:bg-gray-800/70'} px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 ${isRestrictedField && isEditing ? 'cursor-not-allowed' : ''}`}>
            {value || (isRoleField ? 'Administrator' : '')}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <ToastContainer />
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="relative px-6 sm:px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-500 via-green-600 to-green-700 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <FaUser className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">My Profile</h2>
                  <p className="text-green-100 text-sm hidden sm:block">Manage your account settings</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 sm:px-8 bg-gray-50 dark:bg-gray-800/50">
            <button
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-4 text-sm font-medium flex items-center justify-center sm:justify-start space-x-2 transition-all relative ${
                activeTab === 'profile' 
                  ? 'text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <FaIdCard size={16} />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">Info</span>
              {activeTab === 'profile' && (
                <motion.div 
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                  initial={false}
                />
              )}
            </button>
            <button
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-4 text-sm font-medium flex items-center justify-center sm:justify-start space-x-2 transition-all relative ${
                activeTab === 'security' 
                  ? 'text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => setActiveTab('security')}
            >
              <FaLock size={16} />
              <span>Security</span>
              {activeTab === 'security' && (
                <motion.div 
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                  initial={false}
                />
              )}
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Personal Information</h3>
                  <button 
                    onClick={handleEditToggle} 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isEditing 
                        ? 'bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <FaCheck size={14} />
                        <span>Save Changes</span>
                      </>
                    ) : (
                      <>
                        <FaEdit size={14} />
                        <span>Edit Profile</span>
                      </>
                    )}
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : (
                  <div className="w-full">
                    {/* Profile Details */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700/40 p-6 rounded-xl shadow-sm">
                        <div className="space-y-4">
                          {/* Full Name Fields - split into first, middle, last when editing */}
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              <FaUser size={14} />
                              <span>Full Name</span>
                            </label>
                            {isEditing ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Title</label>
                                  <select
                                    name="title_abbreviation"
                                    value={editedData.title_abbreviation || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                  >
                                    <option value="">Select Title</option>
                                    {titles.map((title) => (
                                      <option key={title.id} value={title.abbreviation}>{title.abbreviation}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">First Name</label>
                                  <input
                                    type="text"
                                    name="users_fname"
                                    value={editedData.users_fname || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Middle Name</label>
                                  <input
                                    type="text"
                                    name="users_mname"
                                    value={editedData.users_mname || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Last Name</label>
                                  <input
                                    type="text"
                                    name="users_lname"
                                    value={editedData.users_lname || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Suffix</label>
                                  <select
                                    name="users_suffix"
                                    value={editedData.users_suffix || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                  >
                                    <option value="">No Suffix</option>
                                    <option value="Jr.">Jr.</option>
                                    <option value="Sr.">Sr.</option>
                                    <option value="II">II</option>
                                    <option value="III">III</option>
                                    <option value="IV">IV</option>
                                    <option value="V">V</option>
               
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-800 dark:text-white bg-white/70 dark:bg-gray-800/70 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                {`
                                  ${userData.title_abbreviation ? userData.title_abbreviation + ' ' : ''}
                                  ${userData.users_fname || ''} ${userData.users_mname || ''} ${userData.users_lname || ''}${userData.users_suffix ? ' ' + userData.users_suffix : ''}
                                `.replace(/\s+/g, ' ').trim()}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              <FaEnvelope size={14} />
                              <span>Email</span>
                            </label>
                            {isEditing ? (
                              <input
                                type="email"
                                name="users_email"
                                value={editedData.users_email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                              />
                            ) : (
                              <p className="text-gray-800 dark:text-white bg-white/70 dark:bg-gray-800/70 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">{userData.users_email || ''}</p>
                            )}
                          </div>
                          
                          {/* School ID - Restricted for non-admins */}
                          {renderRestrictedField('School ID', <FaIdCard size={14} />, userData.users_school_id, 'users_school_id')}
                          
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              <FaPhone size={14} />
                              <span>Phone</span>
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                name="users_contact_number"
                                value={editedData.users_contact_number}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                              />
                            ) : (
                              <p className="text-gray-800 dark:text-white bg-white/70 dark:bg-gray-800/70 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">{userData.users_contact_number || ''}</p>
                            )}
                          </div>
                          
                          {/* Department Field with Dropdown - Restricted for non-admins */}
                          {renderRestrictedField('Department', <FaBuilding size={14} />, userData.departments_name, 'departments_id', true)}
                          
                          {/* User Level - Always display only */}
                          {renderRestrictedField('User Role', <FaIdCard size={14} />, userData.user_level_name, 'user_level_name')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Two-Factor Authentication Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/40 dark:to-gray-800/40 p-6 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 dark:bg-green-800/30 p-2 rounded-lg">
                        <FaShieldAlt className="text-green-600 dark:text-green-400" size={18} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Two-Factor Authentication</h3>
                      {is2FALoading && (
                        <div className="ml-2 animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowTwoFactorSetup(!showTwoFactorSetup)}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      aria-label={showTwoFactorSetup ? "Collapse 2FA setup" : "Expand 2FA setup"}
                    >
                      <FaChevronDown 
                        className={`text-gray-600 dark:text-gray-300 transform transition-transform ${showTwoFactorSetup ? 'rotate-180' : ''}`} 
                        size={16} 
                      />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {twoFactorEnabled 
                      ? "Two-factor authentication is currently enabled for your account. This adds an extra layer of security." 
                      : "Add an extra layer of security to your account by enabling two-factor authentication."}
                  </p>
                  
                  {twoFactorEnabled && (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
                          <FaToggleOn size={20} />
                          <span>Enabled</span>
                        </div>
                        <button 
                          onClick={handleToggle2FA}
                          disabled={isDisabling2FA}
                          className={`text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center space-x-1 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors ${isDisabling2FA ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {isDisabling2FA ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full mr-1"></div>
                              <span>Disabling...</span>
                            </>
                          ) : (
                            <>
                              <FaTimes size={14} />
                              <span>Disable 2FA</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {twoFactorData.expires_at && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                          <FaClock className="text-gray-500 dark:text-gray-400" />
                          <span>
                            Expires on: <span className="font-medium">{new Date(twoFactorData.expires_at).toLocaleString()}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {showTwoFactorSetup && !twoFactorEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-5 border border-green-200 dark:border-green-800/50 rounded-xl bg-white dark:bg-gray-800 shadow-sm"
                    >
                      <h4 className="font-medium text-gray-800 dark:text-white mb-3">Set up Two-Factor Authentication</h4>
                      
                      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                        <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-2">What is Two-Factor Authentication?</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Two-Factor Authentication (2FA) adds an extra layer of security to your account by requiring:
                        </p>
                        <ol className="list-decimal ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <li><span className="font-medium">Something you know</span> - your password</li>
                          <li><span className="font-medium">Something you have</span> - a temporary verification code from your authenticator app</li>
                        </ol>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          This means that even if someone gets your password, they still can't access your account without your personal device.
                        </p>
                      </div>
                      
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          2FA Session Duration
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Choose how long you'll be able to use the application before being asked for a new 2FA code.
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 3, 5, 7].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setTwoFactorDuration(days)}
                              className={`py-2 px-2 rounded-lg text-sm font-medium border ${
                                twoFactorDuration === days
                                  ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-800/30 dark:border-green-600 dark:text-green-400'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                              } transition-colors flex flex-col items-center justify-center`}
                            >
                              <span className="font-bold">{days}</span>
                              <span className="text-xs">{days === 1 ? 'Day' : 'Days'}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Your 2FA session will expire after <span className="font-medium text-green-600 dark:text-green-400">{twoFactorDuration} {twoFactorDuration === 1 ? 'day' : 'days'}</span>, requiring re-verification for enhanced security.
                        </p>
                      </div>
                      
                      {isVerifyingEmail ? (
                        <div className="mb-5 border border-blue-200 dark:border-blue-800 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-3 flex items-center space-x-2">
                            <FaShieldAlt className="text-blue-600 dark:text-blue-400" />
                            <span>Email Verification</span>
                          </h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            A verification code has been sent to your email. Please enter it below to continue.
                          </p>
                          <div className="mb-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter verification code"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                              />
                            </div>
                            <div className="flex items-center mt-2 text-xs text-blue-600 dark:text-blue-400">
                              <FaInfoCircle className="mr-1" />
                              <span>This code will enable 2FA for {twoFactorDuration} {twoFactorDuration === 1 ? 'day' : 'days'}.</span>
                            </div>
                            {verificationError && (
                              <p className="text-red-500 text-sm mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800/50 flex items-center">
                                <FaTimes className="mr-2 text-red-500" />
                                {verificationError}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={handleVerifyCode}
                              disabled={isVerifying || !verificationCode}
                              className={`flex-1 px-4 py-2 ${isVerifying || !verificationCode ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg font-medium transition-all flex items-center justify-center`}
                            >
                              {isVerifying ? (
                                <>
                                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <FaCheck className="mr-2" /> Verify Code
                                </>
                              )}
                            </button>
                            <button
                              onClick={sendEmailVerification}
                              disabled={isSendingVerification}
                              className={`px-4 py-2 ${isSendingVerification ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'} text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all flex items-center`}
                            >
                              {isSendingVerification ? (
                                <>
                                  <div className="w-4 h-4 mr-2 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <FaEnvelope className="mr-2" /> Resend Code
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handle2FAVerification}
                          disabled={isSendingVerification}
                          className={`w-full px-6 py-3 mb-4 ${isSendingVerification ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg font-medium transition-all flex items-center justify-center`}
                        >
                          {isSendingVerification ? (
                            <>
                              <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Sending Verification...
                            </>
                          ) : (
                            <>
                              <FaShieldAlt className="mr-2" /> Enable Two-Factor Authentication
                            </>
                          )}
                        </button>
                      )}
                      
                      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Important:</p>
                        <ul className="list-disc ml-4 space-y-1">
                          <li>Store backup codes in a secure location in case you lose access to your device.</li>
                          <li>If you change or lose your device, you'll need to reconfigure 2FA.</li>
                          <li>Without access to your 2FA device or backup codes, account recovery may be difficult.</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Change Password Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/40 dark:to-gray-800/40 p-6 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="bg-green-100 dark:bg-green-800/30 p-2 rounded-lg">
                      <FaLock className="text-green-600 dark:text-green-400" size={18} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Change Password</h3>
                  </div>
                  
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        <span>Current Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.currentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-3 border ${
                            passwordErrors.currentPassword 
                              ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                          } rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all pr-10`}
                        />
                        <button 
                          type="button"
                          onClick={() => togglePasswordVisibility('currentPassword')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {passwordVisibility.currentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                          <FaTimes size={12} />
                          <span>{passwordErrors.currentPassword}</span>
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        <span>New Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.newPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-3 border ${
                            passwordErrors.newPassword 
                              ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                          } rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all pr-10`}
                        />
                        <button 
                          type="button"
                          onClick={() => togglePasswordVisibility('newPassword')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {passwordVisibility.newPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">Password Requirements:</p>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-center space-x-2">
                            <span className={`flex-shrink-0 p-0.5 rounded-full ${passwordStrength.hasLength ? 'bg-green-100 text-green-600 dark:bg-green-800/30 dark:text-green-400' : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                              {passwordStrength.hasLength ? <FaCheck size={10} /> : <FaTimes size={10} />}
                            </span>
                            <span className={passwordStrength.hasLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                              At least 8 characters long
                            </span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className={`flex-shrink-0 p-0.5 rounded-full ${passwordStrength.hasUppercase ? 'bg-green-100 text-green-600 dark:bg-green-800/30 dark:text-green-400' : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                              {passwordStrength.hasUppercase ? <FaCheck size={10} /> : <FaTimes size={10} />}
                            </span>
                            <span className={passwordStrength.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                              At least one uppercase letter (A-Z)
                            </span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className={`flex-shrink-0 p-0.5 rounded-full ${passwordStrength.hasLowercase ? 'bg-green-100 text-green-600 dark:bg-green-800/30 dark:text-green-400' : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                              {passwordStrength.hasLowercase ? <FaCheck size={10} /> : <FaTimes size={10} />}
                            </span>
                            <span className={passwordStrength.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                              At least one lowercase letter (a-z)
                            </span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className={`flex-shrink-0 p-0.5 rounded-full ${passwordStrength.hasNumber ? 'bg-green-100 text-green-600 dark:bg-green-800/30 dark:text-green-400' : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                              {passwordStrength.hasNumber ? <FaCheck size={10} /> : <FaTimes size={10} />}
                            </span>
                            <span className={passwordStrength.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                              At least one number (0-9)
                            </span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className={`flex-shrink-0 p-0.5 rounded-full ${passwordStrength.hasSpecial ? 'bg-green-100 text-green-600 dark:bg-green-800/30 dark:text-green-400' : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                              {passwordStrength.hasSpecial ? <FaCheck size={10} /> : <FaTimes size={10} />}
                            </span>
                            <span className={passwordStrength.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                              At least one special character (!@#$%^&*)
                            </span>
                          </li>
                        </ul>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                          <FaTimes size={12} />
                          <span>{passwordErrors.newPassword}</span>
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        <span>Confirm New Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.confirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-3 border ${
                            passwordErrors.confirmPassword 
                              ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                          } rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all pr-10`}
                        />
                        <button 
                          type="button"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {passwordVisibility.confirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                          <FaTimes size={12} />
                          <span>{passwordErrors.confirmPassword}</span>
                        </p>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmittingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className={`mt-5 w-full px-6 py-3 bg-gradient-to-r ${
                        isSubmittingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword
                          ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                          : 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      } text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow flex items-center justify-center`}
                    >
                      {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileAdminModal;
