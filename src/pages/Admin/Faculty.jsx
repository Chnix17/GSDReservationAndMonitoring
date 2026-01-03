import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal as AntModal } from 'antd';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';


import "primereact/resources/themes/lara-light-indigo/theme.css";  // theme
import "primereact/resources/primereact.css";     // core css
import "primeicons/primeicons.css";               // icons
import { Chip } from 'primereact/chip';
import { SecureStorage } from '../../utils/encryption';
import { ExclamationCircleOutlined, EditOutlined, ReloadOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import CreateModal from './lib/Faculty/Create_Modal';
import UpdateModal from './lib/Faculty/Update_Modal';
import { Alert, Empty, Pagination, Input, Tooltip, Space, Card } from 'antd';
import { Button as AntButton } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { FaUsers } from 'react-icons/fa';

// Add custom styles for checkboxes
const customStyles = `
    .p-datatable .p-datatable-tbody > tr > td .p-checkbox {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 0.5rem;
    }
    .p-datatable .p-datatable-tbody > tr > td .p-checkbox .p-checkbox-box {
        border: 2px solid #4CAF50;
        border-radius: 4px;
        transition: all 0.2s;
    }
    .p-datatable .p-datatable-tbody > tr > td .p-checkbox .p-checkbox-box.p-highlight {
        background: #4CAF50;
        border-color: #4CAF50;
    }
    .p-datatable .p-datatable-thead > tr > th .p-checkbox {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 0.5rem;
    }
    .p-datatable .p-datatable-thead > tr > th .p-checkbox .p-checkbox-box {
        border: 2px solid #4CAF50;
        border-radius: 4px;
        transition: all 0.2s;
    }
    .p-datatable .p-datatable-thead > tr > th .p-checkbox .p-checkbox-box.p-highlight {
        background: #4CAF50;
        border-color: #4CAF50;
    }
    .faculty-name-cell {
        display: flex;
        align-items: center;
    }
    .faculty-name-text {
        flex: 1;
    }
    .p-checkbox-box.p-highlight .p-checkbox-icon {
        color: white;
    }
`;

const generateAvatarColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
        '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
        '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12',
        '#d35400', '#c0392b', '#7f8c8d'
    ];
    return colors[Math.abs(hash) % colors.length];
};

const Faculty = () => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

    const user_level_id = SecureStorage.getLocalItem('user_level_id');
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useState({ isOpen: false, type: '', user: null });
    const [departments, setDepartments] = useState([]);
    const [userLevels, setUserLevels] = useState([]);
    // const [viewImageModal, setViewImageModal] = useState(false);

    const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

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
        const decryptedUserLevel = parseInt(user_level_id);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/');
        }
    }, [user_level_id, navigate]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}Admin.php`, 
                { operation: "fetchAllUser" },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.status === 'success') {
                // Transform the data to match the DataTable structure
                const transformedUsers = response.data.data.map(user => ({
                    ...user,  // Spread all existing user properties
                    departments_name: user.departments_name || 'No Department'
                }));
                setUsers(transformedUsers);
            } else {
                toast.error("Error fetching users: " + response.data.message);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                toast.error("An error occurred while fetching users.");
            }
        } finally {
            setLoading(false);
        }
    }, [encryptedUrl]);

    const getUserDetails = async (userId) => {
        try {
            const response = await axios.post(
                `${encryptedUrl}Admin.php`,
                { 
                    operation: 'fetchUsersById',
                    id: userId 
                },
                { 
                    headers: { 'Content-Type': 'application/json' } 
                }
            );

            console.log('User details response:', response.data); // Debug log

            if (response.data.status === 'success' && response.data.data.length > 0) {
                const userData = response.data.data[0];
                // Return the exact field names from the API
                return {
                    users_id: userData.users_id,
                    users_fname: userData.users_fname,      // Keep original API field names
                    users_mname: userData.users_mname,      // Keep original API field names
                    users_lname: userData.users_lname,      // Keep original API field names
                    users_email: userData.users_email,
                    users_school_id: userData.users_school_id,
                    users_contact_number: userData.users_contact_number,
                    users_user_level_id: userData.users_user_level_id,
                    departments_name: userData.departments_name,
                    users_pic: userData.users_pic,
                    users_suffix: userData.users_suffix,
                    users_birthdate: userData.users_birthdate,
                    title_abbreviation: userData.title_abbreviation,
                    license_number: userData.license_number,
                };
            }
            throw new Error('User not found');
        } catch (error) {
            console.error('Error fetching user details:', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load user details. Please check your internet connection.');
            } else {
                toast.error("Failed to fetch user details");
            }
            return null;
        }
    };

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}Admin.php`, 
                { operation: "fetchDepartments" },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.status === 'success') {
                setDepartments(response.data.data);
            } else {
                toast.error("Error fetching departments: " + response.data.message);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load departments.');
            } else {
                toast.error("An error occurred while fetching departments.");
            }
        }
    }, [encryptedUrl]);

    const fetchUserLevels = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}Admin.php`, 
                { operation: "fetchUserLevels" },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.status === 'success') {
                setUserLevels(response.data.data);
            } else {
                toast.error("Error fetching user levels: " + response.data.message);
            }
        } catch (error) {
            console.error('Error fetching user levels:', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load user levels.');
            } else {
                toast.error("An error occurred while fetching user levels.");
            }
        }
    }, [encryptedUrl]);

    // Add to useEffect
    useEffect(() => {
        const initializePage = async () => {
            await Promise.all([
                fetchUsers(),
                fetchDepartments(),
                fetchUserLevels()
            ]);
        };
        initializePage();
    }, [fetchUsers, fetchDepartments, fetchUserLevels]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleDeactivateUser = (userIds) => {
        setSelectedUsers(Array.isArray(userIds) ? userIds : [userIds]);
        setShowConfirmDeactivate(true);
    };

    const handleEditClick = async (user) => {
        const userDetails = await getUserDetails(user.users_id);
        if (userDetails) {
            setModalState({ isOpen: true, type: 'edit', user: userDetails });
        }
    };

    const confirmDeactivate = async () => {
        if (!selectedUsers.length) return;
        
        try {
            const userId = SecureStorage.getLocalItem('user_id') ||
                SecureStorage.getLocalItem('user_id') || null;

            const payload = {
                operation: "archiveUser",
                userType: "user",
                userId: selectedUsers,
                userid: userId
            };

            const response = await axios.post(
                `${encryptedUrl}Admin.php`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success(selectedUsers.length > 1 ? 'Faculty members successfully deactivated!' : 'Faculty member successfully deactivated!');
                fetchUsers(); // Refresh the users list
                setShowConfirmDeactivate(false);
                setSelectedUsers([]);
            } else {
                toast.error("Failed to deactivate faculty member(s): " + response.data.message);
            }
        } catch (error) {
            console.error('Error deactivating faculty member(s):', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to deactivate faculty member(s). Please check your internet connection.');
            } else {
                toast.error("An error occurred while deactivating the faculty member(s).");
            }
        } finally {
            setShowConfirmDeactivate(false);
            setSelectedUsers([]);
        }
    };

    const userLevelTemplate = (rowData) => {
        const levelConfig = {
            'Admin': { color: 'bg-purple-500', icon: 'pi pi-star' },
            'Dean': { color: 'bg-orange-500', icon: 'pi pi-briefcase' },
            'Secretary': { color: 'bg-pink-500', icon: 'pi pi-inbox' },
            'Personnel': { color: 'bg-blue-500', icon: 'pi pi-user' },
            'user': { color: 'bg-green-500', icon: 'pi pi-users' }
        };
        
        const config = levelConfig[rowData.user_level_name] || { color: 'bg-gray-500', icon: 'pi pi-user' };
        
        return (
            <Chip
                icon={`${config.icon}`}
                label={rowData.user_level_name}
                className={`${config.color} text-white`}
            />
        );
    };

    const departmentTemplate = (rowData) => {
        return (
            <Chip
                icon="pi pi-building"
                label={rowData.departments_name}
                className="bg-teal-500 text-white"
            />
        );
    };

    // Filter data based on search term only
    const filteredData = users.filter(user => {
        const matchesSearch = searchTerm
            ? (
                (user.users_fname && user.users_fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.users_mname && user.users_mname.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.users_lname && user.users_lname.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.users_school_id && user.users_school_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.departments_name && user.departments_name.toLowerCase().includes(searchTerm.toLowerCase()))
            ) : true;
        return matchesSearch;
    });
    // Pagination logic: slice filteredData for current page
    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <style>{customStyles}</style>
            {/* Sidebar - hidden on mobile */}
            {!isMobile && (
                <div className="flex-shrink-0">
                    <Sidebar />
                </div>
            )}

              {isMobile  && (
                <div className="flex-shrink-0">
                    <Sidebar />
                </div>
            )}
            
            {/* Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto">
                <div className={`${isMobile ? 'px-4 py-4 mt-15' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`${isMobile ? 'mb-3' : 'mb-4'}`}
                    >
                        <div className="mb-2 sm:mb-4 mt-mt-10">
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                User
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Input
                                    placeholder={isMobile ? "Search..." : "Search faculty..."}
                                    allowClear
                                    prefix={<SearchOutlined className="text-gray-400" />}
                                    size={isMobile ? "middle" : "large"}
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); // Reset to first page on search
                                    }}
                                    className="w-full"
                                />
                            </div>
                            <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-wrap gap-2' : 'gap-2'}`}>
                                {selectedUsers.length > 0 && (
                                    <AntButton
                                        danger
                                        icon={<StopOutlined />}
                                        onClick={() => handleDeactivateUser(selectedUsers)}
                                        size={isMobile ? "middle" : "large"}
                                        className={isMobile ? 'w-full' : ''}
                                    >
                                        <span className="hidden sm:inline">Deactivate Selected ({selectedUsers.length})</span>
                                        <span className="sm:hidden">Deactivate ({selectedUsers.length})</span>
                                    </AntButton>
                                )}
                                <Tooltip title="Refresh data">
                                    <AntButton
                                        icon={<ReloadOutlined />}
                                        onClick={fetchUsers}
                                        size={isMobile ? "middle" : "large"}
                                        className={isMobile ? 'w-full' : ''}
                                    >
                                        {isMobile && 'Refresh'}
                                    </AntButton>
                                </Tooltip>
                                <AntButton
                                    type="primary"
                                    size={isMobile ? "middle" : "large"}
                                    className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                                    onClick={() => setModalState({ isOpen: true, type: 'add', user: null })}
                                >
                                    <Space>
                                        <span className="hidden sm:inline">Add User</span>
                                        <span className="sm:hidden">Add</span>
                                        <PlusOutlined />
                                    </Space>
                                </AntButton>
                            </div>
                        </div>
                    </div>

                    {/* Table/Cards */}
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
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
                                            paginatedData.map((user) => (
                                                <Card
                                                    key={user.users_id}
                                                    className="bg-white border border-gray-200 rounded-lg shadow-sm"
                                                    size="small"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                                    checked={selectedUsers.includes(user.users_id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedUsers([...selectedUsers, user.users_id]);
                                                                        } else {
                                                                            setSelectedUsers(selectedUsers.filter(id => id !== user.users_id));
                                                                        }
                                                                    }}
                                                                />
                                                                <FaUsers className="text-green-900 text-sm" />
                                                                <span className="font-medium text-sm truncate max-w-[150px]">
                                                                    {`${user.title_abbreviation ? user.title_abbreviation + ' ' : ''}${user.users_fname} ${user.users_mname ? user.users_mname + ' ' : ''}${user.users_lname}`}
                                                                </span>
                                                            </div>
                                                            <div className="flex space-x-1">
                                                                <AntButton
                                                                    type="primary"
                                                                    icon={<EditOutlined />}
                                                                    onClick={() => handleEditClick(user)}
                                                                    size="small"
                                                                    className="bg-green-900 hover:bg-lime-900"
                                                                />
                                                                <AntButton
                                                                    danger
                                                                    icon={<StopOutlined />}
                                                                    onClick={() => handleDeactivateUser(user.users_id)}
                                                                    size="small"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500">ID:</span>
                                                            <span className="text-xs text-gray-700">{user.users_school_id}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500">Dept:</span>
                                                            <span className="text-xs text-gray-700">{user.departments_name}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs text-gray-500">Role:</span>
                                                                <span className="text-xs text-gray-700">{user.user_level_name}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <i className="pi pi-phone text-green-500 text-xs" />
                                                                <span className="text-xs text-gray-700">{user.users_contact_number}</span>
                                                            </div>
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
                                                            No faculty members found
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
                                                    <th scope="col" className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedUsers(paginatedData.map(user => user.users_id));
                                                                    } else {
                                                                        setSelectedUsers([]);
                                                                    }
                                                                }}
                                                                checked={paginatedData.length > 0 && paginatedData.every(user => selectedUsers.includes(user.users_id))}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                        <div className="flex items-center">
                                                            Student ID / Employee ID
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                        <div className="flex items-center">
                                                            Full Name
                                                        </div>
                                                    </th>
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4">
                                                            <div className="flex items-center">
                                                                Department
                                                            </div>
                                                        </th>
                                                    )}
                                                    <th scope="col" className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                        <div className="flex items-center">
                                                            Role
                                                        </div>
                                                    </th>
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4">
                                                            <div className="flex items-center">
                                                                Contact
                                                            </div>
                                                        </th>
                                                    )}
                                                    <th scope="col" className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                        <div className="flex items-center">
                                                            Actions
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData && paginatedData.length > 0 ? (
                                                    paginatedData.map((user) => (
                                                        <tr
                                                            key={user.users_id}
                                                            className={`bg-white border-b last:border-b-0 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                                                                selectedUsers.includes(user.users_id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                            }`}
                                                        >
                                                            <td className={isTablet ? 'px-3 py-3' : 'px-4 py-6'}>
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                                    checked={selectedUsers.includes(user.users_id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedUsers([...selectedUsers, user.users_id]);
                                                                        } else {
                                                                            setSelectedUsers(selectedUsers.filter(id => id !== user.users_id));
                                                                        }
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className={isTablet ? 'px-3 py-3' : 'px-4 py-6'}>
                                                                <div className="flex items-center">
                                                                    <span className="font-medium truncate block max-w-[120px]">{user.users_school_id}</span>
                                                                </div>
                                                            </td>
                                                            <td className={isTablet ? 'px-3 py-3' : 'px-4 py-6'}>
                                                                <div className="flex items-center">
                                                                    <span className="font-medium truncate block max-w-[200px]">
                                                                        {`${user.title_abbreviation ? user.title_abbreviation + ' ' : ''}${user.users_fname} ${user.users_mname ? user.users_mname + ' ' : ''}${user.users_lname}`}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            {!isTablet && (
                                                                <td className="px-4 py-6">
                                                                    {departmentTemplate(user)}
                                                                </td>
                                                            )}
                                                            <td className={isTablet ? 'px-3 py-3' : 'px-4 py-6'}>
                                                                {userLevelTemplate(user)}
                                                            </td>
                                                            {!isTablet && (
                                                                <td className="px-4 py-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <i className="pi pi-phone text-green-500" />
                                                                        <span className="truncate block max-w-[120px]">{user.users_contact_number}</span>
                                                                    </div>
                                                                </td>
                                                            )}
                                                            <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                <div className="flex space-x-2 justify-center">
                                                                    <AntButton
                                                                        type="primary"
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEditClick(user)}
                                                                        size={isTablet ? "small" : "middle"}
                                                                        className="bg-green-900 hover:bg-lime-900"
                                                                    />
                                                                    <AntButton
                                                                        danger
                                                                        icon={<StopOutlined />}
                                                                        onClick={() => handleDeactivateUser(user.users_id)}
                                                                        size={isTablet ? "small" : "middle"}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={isTablet ? 5 : 7} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                                            <Empty
                                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                description={
                                                                    <span className="text-gray-500 dark:text-gray-400">
                                                                        No faculty members found
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

                                {/* Pagination */}
                                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredData ? filteredData.length : 0}
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

            {modalState.type === 'add' && (
                <CreateModal
                    show={modalState.isOpen}
                    onHide={() => setModalState({ isOpen: false, type: '', user: null })}
                    generateAvatarColor={generateAvatarColor}
                    fetchUsers={fetchUsers}
                />
            )}

            {modalState.type === 'edit' && (
                <UpdateModal
                    show={modalState.isOpen}
                    onHide={() => setModalState({ isOpen: false, type: '', user: null })}
                    user={modalState.user}
                    generateAvatarColor={generateAvatarColor}
                    fetchUsers={fetchUsers}
                    getUserDetails={getUserDetails}
                    departments={departments}
                    userLevels={userLevels}
                />
            )}

            {/* Confirm Deactivate Modal */}
            <AntModal
                open={showConfirmDeactivate}
                onCancel={() => {
                    setShowConfirmDeactivate(false);
                    setSelectedUsers([]);
                }}
                centered
                title={
                    <span className="text-red-600 flex items-center">
                        <ExclamationCircleOutlined className="mr-2" /> Confirm Deactivate
                    </span>
                }
                footer={[
                    <AntButton
                        key="cancel"
                        onClick={() => {
                            setShowConfirmDeactivate(false);
                            setSelectedUsers([]);
                        }}
                    >
                        Cancel
                    </AntButton>,
                    <AntButton
                        key="deactivate"
                        type="primary"
                        danger
                        onClick={confirmDeactivate}
                        icon={<DeleteOutlined />}
                    >
                        Deactivate
                    </AntButton>
                ]}
            >
                <Alert
                    message="Warning"
                    description={`Are you sure you want to deactivate ${selectedUsers.length} faculty member(s)? This action will move them to inactive status.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </AntModal>
        </div>
    );
};

export default Faculty;