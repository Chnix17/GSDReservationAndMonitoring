import React, { useState, useEffect, useCallback } from 'react';
import { FaUser, FaLock, FaShieldAlt, FaEdit, FaTimes, FaCheck, FaToggleOn, FaIdCard, FaBuilding, FaEnvelope, FaPhone, FaChevronDown, FaEye, FaEyeSlash, FaInfoCircle, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { SecureStorage } from '../../utils/encryption';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useMediaQuery } from 'react-responsive';

const ProfileAdminModal = ({ isOpen, onClose, onProfileUpdate }) => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  
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
    user_level_name: '',
    users_user_level_id: '',
    license_number: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Add a state for departments
  const [departments, setDepartments] = useState([]);
  // Add a state for titles
  const [titles, setTitles] = useState([]);
  // Add a state for user levels
  const [userLevels, setUserLevels] = useState([]);
  const [driverRestrictions, setDriverRestrictions] = useState([]);

  // Add a state for loading 2FA status
  const [is2FALoading, setIs2FALoading] = useState(false);

  // Add state for disabling 2FA
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // Fetch user data from API
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = SecureStorage.getLocalItem('user_id'); // Use the stored user ID or default to 42
      
      console.log('Fetching user data for ID:', userId);
      
      const response = await fetch(`${baseUrl}/Admin.php`, {
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
          setDriverRestrictions(responseData.driver_restrictions || []);
          console.log('User state updated with fetched data');
        } else {
          console.error('User data array is empty or not an array', responseData.data);
        }
      } else {
        console.error('Failed to fetch user details or invalid data format', responseData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to load profile data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Function to fetch departments from API
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/Admin.php`, {
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
      if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to load departments.');
      }
    }
  }, [baseUrl]);

  // Function to fetch titles from API
  const fetchTitles = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/Admin.php`, {
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
      if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to load titles.');
      }
      setTitles([]);
    }
  }, [baseUrl]);

  // Function to fetch user levels from API
  const fetchUserLevels = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/Admin.php`, {
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
      if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to load user levels.');
      }
      setUserLevels([]);
    }
  }, [baseUrl]);

  // Function to fetch 2FA status
  const fetch2FAStatus = useCallback(async () => {
    try {
      setIs2FALoading(true);
      const userId = SecureStorage.getLocalItem('user_id') || '42';
      
      const response = await fetch(`${baseUrl}/login.php`, {
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
      if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to load 2FA status.');
      }
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
      const userLevelId = SecureStorage.getLocalItem('user_level_id');
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
  // Removed email verification states - no longer needed

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
          users_contact_number: editedData.users_contact_number,
          users_suffix: editedData.users_suffix || '',
          title_id: titles.find(t => t.abbreviation === editedData.title_abbreviation)?.id || null,
          users_user_level_id: editedData.user_level_id || userData.user_level_id,
        };
        
        // Only include restricted fields if user is admin
        if (isAdmin) {
          updateData.users_email = editedData.users_email;
          updateData.users_school_id = editedData.users_school_id;
          updateData.users_department_id = editedData.departments_id || editedData.users_department_id;
        } else {
          // For non-admin users, use original values for restricted fields
          updateData.users_email = userData.users_email;
          updateData.users_school_id = userData.users_school_id;
          updateData.users_department_id = userData.users_department_id || userData.departments_id;
        }
        
        // Make API call to update user data
        const response = await fetch(`${baseUrl}/Admin.php`, {
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
          // Call the callback to refresh user details in Sidebar
          if (onProfileUpdate) {
            onProfileUpdate();
          }
        } else {
          alert('Failed to update profile: ' + (responseData.message || 'Unknown error'));
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
          toast.error('Network connection lost. Unable to update profile.');
        } else {
          alert('An error occurred while updating your profile. Please try again.');
        }
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
        const response = await fetch(`${baseUrl}/Admin.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: "updatePassword",
            userId: SecureStorage.getLocalItem('user_id') || 'user_id_here',
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
        if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
          toast.error('Network connection lost. Unable to update password.');
        } else {
          alert('An error occurred while updating your password. Please try again.');
        }
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
        const userId = SecureStorage.getLocalItem('user_id');
        
        const response = await fetch(`${baseUrl}/login.php`, {
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
        if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
          toast.error('Network connection lost. Unable to disable 2FA.');
        } else {
          toast.error('An error occurred while disabling two-factor authentication.', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } finally {
        setIsDisabling2FA(false);
      }
    } else {
      // Handle enabling 2FA directly
      setShowTwoFactorSetup(!showTwoFactorSetup);
    }
  };

  // Function to enable 2FA directly without email verification
  const handleEnable2FA = async () => {
    try {
      setIs2FALoading(true);
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await fetch(`${baseUrl}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "enable2FA",
          json: {
            user_id: userId,
            duration_days: twoFactorDuration
          }
        })
      });
      
      const responseData = await response.json();
      
      if (responseData && responseData.status === 'success') {
        toast.success('Two-factor authentication enabled successfully!', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        setTwoFactorEnabled(true);
        setTwoFactorData({
          is_active: true,
          expires_at: responseData.expires_at,
          requires_verification: false
        });
        setShowTwoFactorSetup(false);
        
        // Refresh 2FA status
        fetch2FAStatus();
      } else {
        toast.error('Failed to enable two-factor authentication: ' + (responseData.message || 'Unknown error'), {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to enable 2FA.');
      } else {
        toast.error('An error occurred while enabling two-factor authentication.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } finally {
      setIs2FALoading(false);
    }
  };

  // Function to extend 2FA duration
  const handleExtend2FA = async () => {
    try {
      setIs2FALoading(true);
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await fetch(`${baseUrl}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: "enable2FA",
          json: {
            user_id: userId,
            duration_days: twoFactorDuration
          }
        })
      });
      
      const responseData = await response.json();
      
      if (responseData && responseData.status === 'success') {
        toast.success(`Two-factor authentication extended by ${twoFactorDuration} ${twoFactorDuration === 1 ? 'day' : 'days'}!`, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        setTwoFactorData({
          ...twoFactorData,
          expires_at: responseData.expires_at
        });
        setShowTwoFactorSetup(false);
        
        // Refresh 2FA status
        fetch2FAStatus();
      } else {
        toast.error('Failed to extend two-factor authentication: ' + (responseData.message || 'Unknown error'), {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error extending 2FA:", error);
      if (!error.response || error.message === 'Network Error' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Unable to extend 2FA.');
      } else {
        toast.error('An error occurred while extending two-factor authentication.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } finally {
      setIs2FALoading(false);
    }
  };

  // Calculate days remaining for 2FA
  const calculateDaysRemaining = () => {
    if (!twoFactorData.expires_at) return 0;
    
    const now = new Date();
    const expiryDate = new Date(twoFactorData.expires_at);
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };


  // Render a restricted field with appropriate styling
  const renderRestrictedField = (label, icon, value, fieldName, isSelectField = false) => {
    const isRestrictedField = !isAdmin && (fieldName === 'users_school_id' || fieldName === 'departments_id' || fieldName === 'user_level_name');
    const isRoleField = fieldName === 'user_level_name';
    
    return (
      <div>
        <label className={`flex items-center space-x-2 font-medium text-gray-500 dark:text-gray-400 mb-2 ${
          isMobile ? 'text-xs' : 'text-sm'
        }`}>
          {React.cloneElement(icon, { size: isMobile ? 12 : 14 })}
          <span>{label}</span>
          {isRestrictedField && isEditing && (
            <div className={`ml-2 text-gray-400 dark:text-gray-500 flex items-center ${
              isMobile ? 'text-[10px]' : 'text-xs'
            }`}>
              <FaInfoCircle size={isMobile ? 10 : 12} className="mr-1" />
              <span>Admin only</span>
            </div>
          )}
        </label>
        
        {isEditing && !isRestrictedField && isSelectField && fieldName === 'departments_id' ? (
          <select
            name={fieldName}
            value={editedData[fieldName] || editedData.users_department_id || ''}
            onChange={handleInputChange}
            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
              isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
            }`}
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
            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
              isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
            }`}
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
            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
              isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
            }`}
          />
        ) : (
          <p className={`${isRoleField ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-800 dark:text-white'} ${isRestrictedField && isEditing ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white/70 dark:bg-gray-800/70'} rounded-lg border border-gray-200 dark:border-gray-700 ${isRestrictedField && isEditing ? 'cursor-not-allowed' : ''} ${
            isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
          }`}>
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
          className={`bg-white dark:bg-gray-900 shadow-2xl w-full overflow-hidden flex flex-col ${
            isMobile ? 'max-w-full max-h-full rounded-none' : isTablet ? 'max-w-3xl max-h-[95vh] rounded-2xl' : 'max-w-4xl max-h-[95vh] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className={`relative border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-500 via-green-600 to-green-700 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 ${
            isMobile ? 'px-4 py-4' : 'px-6 sm:px-8 py-6'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`bg-white/20 backdrop-blur-sm rounded-xl ${
                  isMobile ? 'p-2' : 'p-3'
                }`}>
                  <FaUser className="text-white" size={isMobile ? 20 : 24} />
                </div>
                <div>
                  <h2 className={`font-bold text-white ${
                    isMobile ? 'text-lg' : 'text-xl sm:text-2xl'
                  }`}>My Profile</h2>
                  {!isMobile && <p className="text-green-100 text-sm">Manage your account settings</p>}
                </div>
              </div>
              <button 
                onClick={onClose}
                className={`text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 ${
                  isMobile ? 'p-1.5' : 'p-2'
                }`}
              >
                <FaTimes size={isMobile ? 18 : 20} />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className={`flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 ${
            isMobile ? 'px-2' : 'px-4 sm:px-8'
          }`}>
            <button
              className={`flex-1 sm:flex-none font-medium flex items-center justify-center sm:justify-start space-x-2 transition-all relative ${
                isMobile ? 'px-3 py-3 text-xs' : 'px-4 sm:px-6 py-4 text-sm'
              } ${
                activeTab === 'profile' 
                  ? 'text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <FaIdCard size={isMobile ? 14 : 16} />
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
              className={`flex-1 sm:flex-none font-medium flex items-center justify-center sm:justify-start space-x-2 transition-all relative ${
                isMobile ? 'px-3 py-3 text-xs' : 'px-4 sm:px-6 py-4 text-sm'
              } ${
                activeTab === 'security' 
                  ? 'text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => setActiveTab('security')}
            >
              <FaLock size={isMobile ? 14 : 16} />
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
          <div className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 ${
            isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-4 sm:p-6 lg:p-8'
          }`}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className={`flex items-center ${
                  isMobile ? 'flex-col space-y-2' : 'justify-between'
                }`}>
                  <h3 className={`font-semibold text-gray-800 dark:text-white ${
                    isMobile ? 'text-base' : 'text-lg'
                  }`}>Personal Information</h3>
                  <button 
                    onClick={handleEditToggle} 
                    className={`flex items-center space-x-2 rounded-lg font-medium transition-all ${
                      isMobile ? 'px-3 py-1.5 text-xs w-full justify-center' : 'px-4 py-2 text-sm'
                    } ${
                      isEditing 
                        ? 'bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <FaCheck size={isMobile ? 12 : 14} />
                        <span>{isMobile ? 'Save' : 'Save Changes'}</span>
                      </>
                    ) : (
                      <>
                        <FaEdit size={isMobile ? 12 : 14} />
                        <span>{isMobile ? 'Edit' : 'Edit Profile'}</span>
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
                    <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                      <div className={`bg-gray-50 dark:bg-gray-700/40 rounded-xl shadow-sm ${
                        isMobile ? 'p-4' : 'p-6'
                      }`}>
                        <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                          {/* Full Name Fields - split into first, middle, last when editing */}
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              <FaUser size={14} />
                              <span>Full Name</span>
                            </label>
                            {isEditing ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                                    <span>Title</span>
                                    {!isAdmin && (
                                      <div className="ml-2 text-gray-400 dark:text-gray-500 flex items-center text-[10px]">
                                        <FaInfoCircle size={10} className="mr-1" />
                                        <span>Admin only</span>
                                      </div>
                                    )}
                                  </label>
                                  <select
                                    name="title_abbreviation"
                                    value={editedData.title_abbreviation || ''}
                                    onChange={handleInputChange}
                                    disabled={!isAdmin}
                                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                                      !isAdmin ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800'
                                    }`}
                                  >
                                    <option value="">None</option>
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
                              {!isAdmin && isEditing && (
                                <div className="ml-2 text-gray-400 dark:text-gray-500 flex items-center text-xs">
                                  <FaInfoCircle size={12} className="mr-1" />
                                  <span>Admin only</span>
                                </div>
                              )}
                            </label>
                            {isEditing && isAdmin ? (
                              <input
                                type="email"
                                name="users_email"
                                value={editedData.users_email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                              />
                            ) : (
                              <p className={`text-gray-800 dark:text-white px-4 py-3 rounded-lg border ${
                                !isAdmin && isEditing 
                                  ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed border-gray-300 dark:border-gray-600' 
                                  : 'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700'
                              }`}>
                                {userData.users_email || ''}
                              </p>
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
                          {(userData.users_user_level_id === 19 || (userData.user_level_name && userData.user_level_name.toLowerCase() === 'driver')) && (
                            <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                              <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'p-4' : 'p-6'}`}>
                                <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                                  <h4>Driver info</h4>
                                  <div>
                                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                      <FaIdCard size={14} />
                                      <span>License Number</span>
                                    </label>
                                    <p className="text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700/40 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                      {userData.license_number || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                      <FaShieldAlt size={14} />
                                      <span>Restriction Codes</span>
                                    </label>
                                    {driverRestrictions && driverRestrictions.length > 0 ? (
                                      <div className="space-y-3">
                                        {driverRestrictions.map((restriction) => (
                                          <div key={restriction.driver_restriction_id} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                                {restriction.restriction_code}
                                              </span>
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {restriction.vehicle_category}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                              {restriction.restriction_desc}
                                            </p>
                                            
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                        No restriction codes assigned.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
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
                className={isMobile ? 'space-y-4' : 'space-y-6'}
              >
                {/* Two-Factor Authentication Section */}
                <div className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/40 dark:to-gray-800/40 rounded-xl shadow-sm ${
                  isMobile ? 'p-4' : 'p-6'
                }`}>
                  <div className={`flex items-center mb-4 ${
                    isMobile ? 'flex-col space-y-2' : 'justify-between'
                  }`}>
                    <div className={`flex items-center ${
                      isMobile ? 'space-x-2 w-full' : 'space-x-3'
                    }`}>
                      <div className={`bg-green-100 dark:bg-green-800/30 rounded-lg ${
                        isMobile ? 'p-1.5' : 'p-2'
                      }`}>
                        <FaShieldAlt className="text-green-600 dark:text-green-400" size={isMobile ? 16 : 18} />
                      </div>
                      <h3 className={`font-semibold text-gray-800 dark:text-white ${
                        isMobile ? 'text-base' : 'text-lg'
                      }`}>Two-Factor Authentication</h3>
                      {is2FALoading && (
                        <div className={`animate-spin border-2 border-green-500 border-t-transparent rounded-full ${
                          isMobile ? 'ml-1 h-3 w-3' : 'ml-2 h-4 w-4'
                        }`}></div>
                      )}
                    </div>
                    {!twoFactorEnabled && (
                      <button 
                        onClick={() => setShowTwoFactorSetup(!showTwoFactorSetup)}
                        className={`rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                          isMobile ? 'p-1.5 w-full mt-2' : 'p-2'
                        }`}
                        aria-label={showTwoFactorSetup ? "Collapse 2FA setup" : "Expand 2FA setup"}
                      >
                        <FaChevronDown 
                          className={`text-gray-600 dark:text-gray-300 transform transition-transform ${showTwoFactorSetup ? 'rotate-180' : ''} ${
                            isMobile ? 'mx-auto' : ''
                          }`} 
                          size={isMobile ? 14 : 16} 
                        />
                      </button>
                    )}
                  </div>
                  
                  <p className={`text-gray-600 dark:text-gray-300 mb-3 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>
                    {twoFactorEnabled 
                      ? "Two-factor authentication is currently enabled for your account. This adds an extra layer of security." 
                      : "Add an extra layer of security to your account by enabling two-factor authentication."}
                  </p>
                  
                  {twoFactorEnabled && (
                    <div className={isMobile ? 'space-y-2 mb-3' : 'space-y-3 mb-4'}>
                      <div className={`flex items-center ${
                        isMobile ? 'flex-col space-y-2' : 'justify-between'
                      }`}>
                        <div className={`flex items-center space-x-2 bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full font-medium ${
                          isMobile ? 'text-xs w-full justify-center' : 'text-sm'
                        }`}>
                          <FaToggleOn size={isMobile ? 16 : 20} />
                          <span>Enabled</span>
                        </div>
                        <button 
                          onClick={handleToggle2FA}
                          disabled={isDisabling2FA}
                          className={`text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center space-x-1 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors ${
                            isMobile ? 'text-xs w-full justify-center' : 'text-sm'
                          } ${isDisabling2FA ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {isDisabling2FA ? (
                            <>
                              <div className={`animate-spin border-2 border-red-500 border-t-transparent rounded-full mr-1 ${
                                isMobile ? 'h-3 w-3' : 'h-4 w-4'
                              }`}></div>
                              <span>Disabling...</span>
                            </>
                          ) : (
                            <>
                              <FaTimes size={isMobile ? 12 : 14} />
                              <span>Disable 2FA</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {twoFactorData.expires_at && (
                        <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
                          <div className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg ${
                            isMobile ? 'text-xs flex-col items-start space-y-1' : 'text-sm'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <FaClock className="text-gray-500 dark:text-gray-400" size={isMobile ? 12 : 14} />
                              <span className="font-medium">Expires on:</span>
                            </div>
                            <span className={isMobile ? 'ml-5 text-[10px]' : ''}>
                              {new Date(twoFactorData.expires_at).toLocaleString()}
                            </span>
                          </div>
                          <div className={`bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg ${
                            isMobile ? 'space-y-2' : 'flex items-center justify-between'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <FaClock className="text-blue-500 dark:text-blue-400" size={isMobile ? 14 : 16} />
                              <span className={`text-blue-700 dark:text-blue-300 ${
                                isMobile ? 'text-xs' : 'text-sm'
                              }`}>
                                <span className={`font-bold ${
                                  isMobile ? 'text-base' : 'text-lg'
                                }`}>{calculateDaysRemaining()}</span> {calculateDaysRemaining() === 1 ? 'day' : 'days'} remaining
                              </span>
                            </div>
                            <button 
                              onClick={() => setShowTwoFactorSetup(!showTwoFactorSetup)}
                              className={`text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium bg-blue-100 dark:bg-blue-800/30 px-3 py-1.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors flex items-center space-x-1 ${
                                isMobile ? 'text-xs w-full justify-center' : 'text-sm'
                              }`}
                            >
                              <span>+ Add Days</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {showTwoFactorSetup && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`border border-green-200 dark:border-green-800/50 rounded-xl bg-white dark:bg-gray-800 shadow-sm ${
                        isMobile ? 'mt-3 p-3' : 'mt-4 p-5'
                      }`}
                    >
                      <h4 className={`font-medium text-gray-800 dark:text-white mb-3 ${
                        isMobile ? 'text-sm' : 'text-base'
                      }`}>
                        {twoFactorEnabled ? 'Extend Two-Factor Authentication' : 'Set up Two-Factor Authentication'}
                      </h4>
                      
                      {!twoFactorEnabled && (
                        <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 ${
                          isMobile ? 'mb-4 p-3' : 'mb-6 p-4'
                        }`}>
                          <h5 className={`font-medium text-blue-800 dark:text-blue-400 mb-2 ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}>What is Two-Factor Authentication?</h5>
                          <p className={`text-gray-700 dark:text-gray-300 mb-2 ${
                            isMobile ? 'text-[10px]' : 'text-sm'
                          }`}>
                            Two-Factor Authentication (2FA) adds an extra layer of security to your account by requiring:
                          </p>
                          <ol className={`list-decimal ml-5 text-gray-700 dark:text-gray-300 space-y-1 ${
                            isMobile ? 'text-[10px]' : 'text-sm'
                          }`}>
                            <li><span className="font-medium">Something you know</span> - your password</li>
                            <li><span className="font-medium">Something you have</span> - a temporary verification code from your authenticator app</li>
                          </ol>
                          <p className={`text-gray-700 dark:text-gray-300 mt-2 ${
                            isMobile ? 'text-[10px]' : 'text-sm'
                          }`}>
                            This means that even if someone gets your password, they still can't access your account without your personal device.
                          </p>
                        </div>
                      )}
                      
                      <div className={isMobile ? 'mb-4' : 'mb-5'}>
                        <label className={`block font-medium text-gray-700 dark:text-gray-300 mb-2 ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          {twoFactorEnabled ? 'Add Days to 2FA Session' : '2FA Session Duration'}
                        </label>
                        <p className={`text-gray-500 dark:text-gray-400 mb-3 ${
                          isMobile ? 'text-[10px]' : 'text-xs'
                        }`}>
                          {twoFactorEnabled 
                            ? `Add additional days to your current 2FA session. Current expiry: ${new Date(twoFactorData.expires_at).toLocaleDateString()}`
                            : 'Choose how long you\'ll be able to use the application before being asked for a new 2FA code.'
                          }
                        </p>
                        <div className={`grid grid-cols-4 ${
                          isMobile ? 'gap-1.5' : 'gap-2'
                        }`}>
                          {[1, 3, 5, 7].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setTwoFactorDuration(days)}
                              className={`rounded-lg font-medium border transition-colors flex flex-col items-center justify-center ${
                                isMobile ? 'py-1.5 px-1 text-xs' : 'py-2 px-2 text-sm'
                              } ${
                                twoFactorDuration === days
                                  ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-800/30 dark:border-green-600 dark:text-green-400'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              <span className={`font-bold ${
                                isMobile ? 'text-sm' : 'text-base'
                              }`}>{twoFactorEnabled ? '+' : ''}{days}</span>
                              <span className={isMobile ? 'text-[10px]' : 'text-xs'}>{days === 1 ? 'Day' : 'Days'}</span>
                            </button>
                          ))}
                        </div>
                        <p className={`text-gray-500 dark:text-gray-400 mt-2 ${
                          isMobile ? 'text-[10px]' : 'text-xs'
                        }`}>
                          {twoFactorEnabled 
                            ? `Add ${twoFactorDuration} ${twoFactorDuration === 1 ? 'day' : 'days'} to your current 2FA session.`
                            : `Your 2FA session will expire after ${twoFactorDuration} ${twoFactorDuration === 1 ? 'day' : 'days'}, requiring re-verification for enhanced security.`
                          }
                        </p>
                      </div>
                      
                      <button
                        onClick={twoFactorEnabled ? handleExtend2FA : handleEnable2FA}
                        disabled={is2FALoading}
                        className={`w-full rounded-lg font-medium transition-all flex items-center justify-center ${
                          isMobile ? 'px-4 py-2 text-sm mb-3' : 'px-6 py-3 mb-4'
                        } ${is2FALoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
                      >
                        {is2FALoading ? (
                          <>
                            <div className={`border-2 border-white border-t-transparent rounded-full animate-spin ${
                              isMobile ? 'w-4 h-4 mr-2' : 'w-5 h-5 mr-3'
                            }`}></div>
                            {twoFactorEnabled ? 'Extending...' : 'Enabling...'}
                          </>
                        ) : (
                          <>
                            <FaShieldAlt className="mr-2" size={isMobile ? 14 : 16} /> 
                            {twoFactorEnabled ? `Add ${twoFactorDuration} ${twoFactorDuration === 1 ? 'Day' : 'Days'}` : isMobile ? 'Enable 2FA' : 'Enable Two-Factor Authentication'}
                          </>
                        )}
                      </button>
                      
                      {!twoFactorEnabled && (
                        <div className={`text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg ${
                          isMobile ? 'mt-3 text-[10px]' : 'mt-4 text-xs'
                        }`}>
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Important:</p>
                          <ul className={`list-disc space-y-1 ${
                            isMobile ? 'ml-3' : 'ml-4'
                          }`}>
                            <li>Store backup codes in a secure location in case you lose access to your device.</li>
                            <li>If you change or lose your device, you'll need to reconfigure 2FA.</li>
                            <li>Without access to your 2FA device or backup codes, account recovery may be difficult.</li>
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                
                {/* Change Password Section */}
                <div className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/40 dark:to-gray-800/40 rounded-xl shadow-sm ${
                  isMobile ? 'p-4' : 'p-6'
                }`}>
                  <div className={`flex items-center mb-5 ${
                    isMobile ? 'space-x-2' : 'space-x-3'
                  }`}>
                    <div className={`bg-green-100 dark:bg-green-800/30 rounded-lg ${
                      isMobile ? 'p-1.5' : 'p-2'
                    }`}>
                      <FaLock className="text-green-600 dark:text-green-400" size={isMobile ? 16 : 18} />
                    </div>
                    <h3 className={`font-semibold text-gray-800 dark:text-white ${
                      isMobile ? 'text-base' : 'text-lg'
                    }`}>Change Password</h3>
                  </div>
                  
                  <form onSubmit={handlePasswordSubmit} className={isMobile ? 'space-y-3' : 'space-y-4'}>
                    <div>
                      <label className={`flex items-center space-x-2 font-medium text-gray-500 dark:text-gray-400 mb-2 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span>Current Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.currentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className={`w-full border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all pr-10 ${
                            isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
                          } ${
                            passwordErrors.currentPassword 
                              ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                          }`}
                        />
                        <button 
                          type="button"
                          onClick={() => togglePasswordVisibility('currentPassword')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {passwordVisibility.currentPassword ? <FaEyeSlash size={isMobile ? 16 : 18} /> : <FaEye size={isMobile ? 16 : 18} />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className={`text-red-500 mt-2 flex items-center space-x-1 ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          <FaTimes size={isMobile ? 10 : 12} />
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
                      className={`w-full bg-gradient-to-r rounded-lg font-medium transition-all shadow-sm hover:shadow flex items-center justify-center ${
                        isMobile ? 'mt-4 px-4 py-2 text-sm' : 'mt-5 px-6 py-3 text-sm'
                      } ${
                        isSubmittingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword
                          ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                          : 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      } text-white`}
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
