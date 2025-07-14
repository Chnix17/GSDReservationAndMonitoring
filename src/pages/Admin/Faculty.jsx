import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';


import "primereact/resources/themes/lara-light-indigo/theme.css";  // theme
import "primereact/resources/primereact.css";     // core css
import "primeicons/primeicons.css";               // icons
import { Chip } from 'primereact/chip';
import { SecureStorage } from '../../utils/encryption';
import { ExclamationCircleOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import CreateModal from './lib/Faculty/Create_Modal';
import UpdateModal from './lib/Faculty/Update_Modal';
import { Alert, Empty, Pagination, Input, Tooltip, Dropdown, Space } from 'antd';
import { Button as AntButton } from 'antd';
import { SearchOutlined, DownOutlined } from '@ant-design/icons';

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
    const user_level_id = SecureStorage.getSessionItem('user_level_id');
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useState({ isOpen: false, type: '', user: null });
    const [departments, setDepartments] = useState([]);
    const [userLevels, setUserLevels] = useState([]);
    const [viewImageModal, setViewImageModal] = useState(false);

    const [showConfirmArchive, setShowConfirmArchive] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const decryptedUserLevel = parseInt(user_level_id);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}user.php`, 
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
            toast.error("An error occurred while fetching users.");
        } finally {
            setLoading(false);
        }
    }, [encryptedUrl]);

    const getUserDetails = async (userId) => {
        try {
            const response = await axios.post(
                `${encryptedUrl}fetchMaster.php`,
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
                };
            }
            throw new Error('User not found');
        } catch (error) {
            console.error('Error fetching user details:', error);
            toast.error("Failed to fetch user details");
            return null;
        }
    };

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}fetchMaster.php`, 
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
            toast.error("An error occurred while fetching departments.");
        }
    }, [encryptedUrl]);

    const fetchUserLevels = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}fetchMaster.php`, 
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
            toast.error("An error occurred while fetching user levels.");
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

    const handleArchiveClick = (userIds) => {
        setSelectedUsers(Array.isArray(userIds) ? userIds : [userIds]);
        setShowConfirmArchive(true);
    };

    const handleEditClick = async (user) => {
        const userDetails = await getUserDetails(user.users_id);
        if (userDetails) {
            setModalState({ isOpen: true, type: 'edit', user: userDetails });
        }
    };

    const confirmArchive = async () => {
        if (!selectedUsers.length) return;
        
        try {
            const response = await axios.post(
                `${encryptedUrl}delete_master.php`,
                {
                    operation: 'archiveUser',
                    userType: 'user',
                    userId: selectedUsers
                },
                { 
                    headers: { 'Content-Type': 'application/json' } 
                }
            );

            if (response.data.status === 'success') {
                toast.success(selectedUsers.length > 1 ? 'Faculty members archived successfully' : 'Faculty member archived successfully');
                fetchUsers(); // Refresh the users list
            } else {
                throw new Error(response.data.message || "Failed to archive user(s)");
            }
        } catch (error) {
            console.error('Archive Error:', error);
            toast.error("An error occurred while archiving the faculty member(s): " + error.message);
        } finally {
            setShowConfirmArchive(false);
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

    const handleMenuClick = (e) => {
        switch (e.key) {
            case 'add':
                setModalState({ isOpen: true, type: 'add', user: null });
                break;
            case 'viewDepartments':
                navigate('/departments');
                break;
            default:
                break;
        }
    };

    const items = [
        {
            key: 'add',
            icon: <FontAwesomeIcon icon={faPlus} />,
            label: 'Add Faculty',
        },
        {
            key: 'viewDepartments',
            icon: <i className="pi pi-building" />,
            label: 'View Departments',
        },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <style>{customStyles}</style>
            {/* Fixed Sidebar */}
            <div className="flex-none">
                <Sidebar />
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-20">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 sm:mb-8"
                    >
                        <div className="mb-2 sm:mb-4 mt-20">
                            <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-5">
                                Faculty
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-row items-center gap-2 w-full">
                            <div className="flex-grow">
                                <Input
                                    placeholder="Search faculty..."
                                    allowClear
                                    prefix={<SearchOutlined className="text-gray-400" />}
                                    size="large"
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); // Reset to first page on search
                                    }}
                                    className="w-full"
                                />
                            </div>
                            {selectedUsers.length > 0 && (
                                <AntButton
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleArchiveClick(selectedUsers)}
                                    size="large"
                                >
                                    <span className="hidden sm:inline">Archive Selected ({selectedUsers.length})</span>
                                    <span className="sm:hidden">Archive ({selectedUsers.length})</span>
                                </AntButton>
                            )}
                            <Tooltip title="Refresh data">
                                <AntButton
                                    icon={<ReloadOutlined />}
                                    onClick={fetchUsers}
                                    size="large"
                                    className="hover:scale-105 transition-transform"
                                    style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                />
                            </Tooltip>
                            <Dropdown
                                menu={{
                                    items,
                                    onClick: handleMenuClick,
                                }}
                            >
                                <AntButton
                                    type="primary"
                                    size="large"
                                    className="bg-lime-900 hover:bg-green-600"
                                >
                                    <Space>
                                        <span className="hidden sm:inline">Add Faculty</span>
                                        <span className="sm:hidden">Add</span>
                                        <DownOutlined />
                                    </Space>
                                </AntButton>
                            </Dropdown>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100" style={{ minWidth: '100%' }}>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                                    <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                                        <tr>
                                            <th scope="col" className="px-4 py-4">
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
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    School ID
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    Full Name
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    Department
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    Role
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    Contact
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
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
                                                    <td className="px-4 py-6">
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
                                                    <td className="px-4 py-6">
                                                        <div className="flex items-center">
                                                            <span className="font-medium truncate block max-w-[120px]">{user.users_school_id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        <div className="flex items-center">
                                                            <span className="font-medium truncate block max-w-[200px]">
                                                                {`${user.title_abbreviation ? user.title_abbreviation + ' ' : ''}${user.users_fname} ${user.users_mname ? user.users_mname + ' ' : ''}${user.users_lname}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        {departmentTemplate(user)}
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        {userLevelTemplate(user)}
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <i className="pi pi-phone text-green-500" />
                                                            <span className="truncate block max-w-[120px]">{user.users_contact_number}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        <div className="flex justify-center space-x-2">
                                                            <Tooltip title="Edit Faculty">
                                                                <AntButton
                                                                    shape="circle"
                                                                    icon={<EditOutlined />}
                                                                    onClick={() => handleEditClick(user)}
                                                                    size="large"
                                                                    className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                                                />
                                                            </Tooltip>
                                                            <Tooltip title="Archive Faculty">
                                                                <AntButton
                                                                    shape="circle"
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => handleArchiveClick(user.users_id)}
                                                                    size="large"
                                                                    className="shadow-lg flex items-center justify-center"
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
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

                                {/* Pagination */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredData ? filteredData.length : 0}
                                        onChange={(page, size) => {
                                            setCurrentPage(page);
                                            setPageSize(size);
                                        }}
                                        showSizeChanger={true}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} of ${total} items`
                                        }
                                        className="flex justify-end"
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

            {/* Image Preview Modal */}
            <Modal
                show={viewImageModal}
                onHide={() => setViewImageModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Profile Image</Modal.Title>
                </Modal.Header>
                
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setViewImageModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Archive Confirmation Modal */}
            <Modal
                show={showConfirmArchive}
                onHide={() => {
                    setShowConfirmArchive(false);
                    setSelectedUsers([]);
                }}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="text-red-600 flex items-center">
                        <ExclamationCircleOutlined className="mr-2" /> Confirm Archive
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert
                        message="Warning"
                        description={`Are you sure you want to archive ${selectedUsers.length} faculty member(s)? This action cannot be undone.`}
                        type="warning"
                        showIcon
                        icon={<ExclamationCircleOutlined />}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => {
                            setShowConfirmArchive(false);
                            setSelectedUsers([]);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={confirmArchive}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Archive
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Faculty;