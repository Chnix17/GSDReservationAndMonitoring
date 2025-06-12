import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';

import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import "primereact/resources/themes/lara-light-indigo/theme.css";  // theme
import "primereact/resources/primereact.css";     // core css
import "primeicons/primeicons.css";               // icons
import { Chip } from 'primereact/chip';
import { SecureStorage } from '../../utils/encryption';
import { ExclamationCircleOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import CreateModal from './lib/Faculty/Create_Modal';
import UpdateModal from './lib/Faculty/Update_Modal';
import { Alert, Empty, Pagination, Select } from 'antd';
import { Button as AntButton } from 'antd';

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
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        'departments_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [selectedRole, setSelectedRole] = useState('');
    const [viewImageModal, setViewImageModal] = useState(false);

    const [showConfirmArchive, setShowConfirmArchive] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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

    // Modify the DataTable value prop to include role filtering
    const filteredData = selectedRole 
        ? users.filter(user => user.user_level_name === selectedRole)
        : users;
        
    // Add custom styling to match Venue.jsx table
   
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <style>{customStyles}</style>
            <div className="flex-shrink-0">
                <Sidebar />
            </div>
            <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
                <div className="p-[2.5rem] lg:p-12 min-h-screen">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="mb-4 mt-20">
                           
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Faculty
                            </h2>
                        </div>
                    </motion.div>

                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1">
                                    <InputText
                                        value={filters.global.value || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            let _filters = { ...filters };
                                            _filters['global'].value = value;
                                            setFilters(_filters);
                                        }}
                                        placeholder="Search faculty..."
                                        className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                    />
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                                </div>
                                <div className="w-full md:w-48">
                                    <Select
                                        placeholder="Filter by role"
                                        allowClear
                                        value={selectedRole}
                                        onChange={setSelectedRole}
                                        className="w-full"
                                        options={[
                                            { value: '', label: 'All Roles' },
                                            { value: 'Admin', label: 'Admin' },
                                            { value: 'Dean', label: 'Dean' },
                                            { value: 'Secretary', label: 'Secretary' },
                                            { value: 'Personnel', label: 'Personnel' },
                                            { value: 'user', label: 'User' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {selectedUsers.length > 0 && (
                                    <AntButton
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleArchiveClick(selectedUsers)}
                                        size="large"
                                    >
                                        Archive Selected ({selectedUsers.length})
                                    </AntButton>
                                )}
                                <AntButton
                                    icon={<ReloadOutlined />}
                                    onClick={fetchUsers}
                                    size="large"
                                />
                                <AntButton
                                    type="primary"
                                    icon={<FontAwesomeIcon icon={faPlus} />}
                                    size="large"
                                    onClick={() => setModalState({ isOpen: true, type: 'add', user: null })}
                                    className="bg-lime-900 hover:bg-green-600"
                                >
                                    Add Faculty
                                </AntButton>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedUsers(filteredData.map(user => user.users_id));
                                                            } else {
                                                                setSelectedUsers([]);
                                                            }
                                                        }}
                                                        checked={selectedUsers.length === filteredData.length}
                                                    />
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    School ID
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Full Name
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Department
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Role
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Contact
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Actions
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData && filteredData.length > 0 ? (
                                            filteredData.map((user) => (
                                                <tr
                                                    key={user.users_id}
                                                    className={`bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                                                        selectedUsers.includes(user.users_id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                    }`}
                                                >
                                                    <td className="px-6 py-4">
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
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <span className="font-medium">{user.users_school_id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <span className="font-medium">
                                                                {`${user.title_abbreviation ? user.title_abbreviation + ' ' : ''}${user.users_fname} ${user.users_mname ? user.users_mname + ' ' : ''}${user.users_lname}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {departmentTemplate(user)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {userLevelTemplate(user)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <i className="pi pi-phone text-green-500" />
                                                            {user.users_contact_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex space-x-2">
                                                            <AntButton
                                                                type="primary"
                                                                icon={<EditOutlined />}
                                                                onClick={() => handleEditClick(user)}
                                                                size="middle"
                                                                className="bg-green-900 hover:bg-lime-900"
                                                            />
                                                            <AntButton
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => handleArchiveClick(user.users_id)}
                                                                size="middle"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-24 text-center">
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