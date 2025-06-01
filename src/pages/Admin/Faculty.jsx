import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArchive, faSearch, faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import "primereact/resources/themes/lara-light-indigo/theme.css";  // theme
import "primereact/resources/primereact.css";     // core css
import "primeicons/primeicons.css";               // icons
import { Chip } from 'primereact/chip';
import { Tooltip } from 'primereact/tooltip';
import { sanitizeInput, validateInput } from '../../utils/sanitize';
import { SecureStorage } from '../../utils/encryption';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import Create_Modal from './lib/Faculty/Create_Modal';
import Update_Modal from './lib/Faculty/Update_Modal';
import { Alert } from 'antd';

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
        'users_fname': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        'users_lname': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        'departments_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'users_school_id': { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [selectedRole, setSelectedRole] = useState('');
    const [viewImageModal, setViewImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [showConfirmArchive, setShowConfirmArchive] = useState(false);
    const [userToArchive, setUserToArchive] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const decryptedUserLevel = parseInt(user_level_id);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const fetchUsers = async () => {
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
    };

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
                };
            }
            throw new Error('User not found');
        } catch (error) {
            console.error('Error fetching user details:', error);
            toast.error("Failed to fetch user details");
            return null;
        }
    };

    const fetchDepartments = async () => {
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
    };

    const fetchUserLevels = async () => {
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
    };

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
    }, []);

    const handleSubmit = async (jsonData) => {
        const operation = jsonData.data.users_id ? "updateUser" : "saveUser";
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}insert_master.php`, jsonData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Server Response:', response.data);

            if (response.data.status === 'success') {
                toast.success(`Faculty successfully ${operation === 'updateUser' ? 'updated' : 'added'}!`);
                fetchUsers();
                setModalState({ isOpen: false, type: '', user: null });
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(`Failed to ${operation === 'updateUser' ? 'update' : 'add'} faculty: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveClick = (user) => {
        setUserToArchive(user);
        setShowConfirmArchive(true);
    };

    const confirmArchive = async () => {
        if (!userToArchive) return;
        
        try {
            const response = await axios.post(
                `${encryptedUrl}delete_master.php`,
                {
                    operation: 'archiveUser',
                    userType: 'user',
                    userId: userToArchive.users_id.toString()
                },
                { 
                    headers: { 'Content-Type': 'application/json' } 
                }
            );

            if (response.data.status === 'success') {
                toast.success('Faculty member archived successfully');
                fetchUsers(); // Refresh the users list
            } else {
                throw new Error(response.data.message || "Failed to archive user");
            }
        } catch (error) {
            console.error('Archive Error:', error);
            toast.error("An error occurred while archiving the faculty member: " + error.message);
        } finally {
            setShowConfirmArchive(false);
            setUserToArchive(null);
        }
    };

    const handleViewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        setViewImageModal(true);
    };

    const imageBodyTemplate = (rowData) => {
        const imageUrl = rowData.users_pic ? `${encryptedUrl}${rowData.users_pic}` : null;
        const initials = `${rowData.users_fname?.[0] || ''}${rowData.users_lname?.[0] || ''}`.toUpperCase();
        const bgColor = generateAvatarColor(initials);
        
        return (
            <div className="flex justify-center">
                {imageUrl ? (
                    <div 
                        className="cursor-pointer w-12 h-12 overflow-hidden rounded-full shadow-sm hover:opacity-80 transition-opacity"
                        onClick={() => handleViewImage(imageUrl)}
                    >
                        <img 
                            src={imageUrl} 
                            alt={`${rowData.users_fname} ${rowData.users_lname}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                    <div
                                        class="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg"
                                        style="background-color: ${bgColor}"
                                    >
                                        ${initials}
                                    </div>
                                `;
                            }}
                        />
                    </div>
                ) : (
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: bgColor }}
                    >
                        {initials}
                    </div>
                )}
            </div>
        );
    };

    const actionsBodyTemplate = (rowData) => {
        const handleEditClick = async () => {
            const userDetails = await getUserDetails(rowData.users_id);
            if (userDetails) {
                setModalState({ isOpen: true, type: 'edit', user: userDetails });
            }
        };

        return (
            <div className="flex space-x-2">
                <Tooltip target=".edit-btn" />
                <Tooltip target=".archive-btn" />

                <Button 
                    type="button"
                    onClick={handleEditClick}
                    className="edit-btn bg-green-900 hover:bg-lime-900 text-white"
                    data-pr-tooltip="Edit Faculty"
                    data-pr-position="top"
                >
                    <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button 
                    type="button"
                    onClick={() => handleArchiveClick(rowData)}
                    className="archive-btn bg-red-600 hover:bg-red-700 text-white"
                    data-pr-tooltip="Archive Faculty"
                    data-pr-position="top"
                >
                    <FontAwesomeIcon icon={faArchive} />
                </Button>
            </div>
        );
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
    const tableStyle = {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
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
                            <Button
                                type="primary"
                                icon={<FaArrowLeft />}
                                onClick={() => navigate('/master')}
                                className="bg-green-900 hover:bg-lime-900"
                            >
                                Back to Master
                            </Button>
                           
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Users 
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
                                <div className="flex items-center gap-4">
                                    <select
                                        className="p-2 border rounded-lg"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    >
                                        <option value="">All Roles</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Faculty">Faculty</option>
                                        <option value="Staff">Staff</option>
                                    </select>
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setModalState({ isOpen: true, type: 'add', user: null })}
                                        className="bg-lime-900 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Faculty
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center items-center h-64"
                        >
                            <div className="loader"></div>
                        </motion.div>
                    ) : (
                        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
                            <DataTable
                                value={filteredData}
                                paginator
                                rows={10}
                                rowsPerPageOptions={[10, 20, 50]}
                                dataKey="users_id"
                                filters={filters}
                                filterDisplay="row"
                                loading={loading}
                                emptyMessage={
                                    <div className="text-center py-8">
                                        <i className="pi pi-search text-6xl text-gray-300 mb-4"></i>
                                        <p className="text-xl text-gray-500">No faculty members found</p>
                                    </div>
                                }
                                className="p-datatable-users"
                                responsiveLayout="scroll"
                                showGridlines
                                stripedRows
                                size="small"
                                tableStyle={tableStyle}
                                rowClassName="hover:bg-gray-50 transition-colors duration-200"
                            >
                                <Column 
                                    header="Photo" 
                                    body={imageBodyTemplate} 
                                    style={{ width: '100px' }}
                                    className="text-center"
                                />
                                <Column 
                                    field="users_school_id" 
                                    header="School ID" 
                                    filter 
                                    filterPlaceholder="Search ID"
                                    sortable 
                                    className="font-semibold"
                                />
                                <Column 
                                    field="users_name" 
                                    header="Full Name" 
                                    body={(rowData) => `${rowData.users_fname} ${rowData.users_mname ? rowData.users_mname + ' ' : ''}${rowData.users_lname}`}
                                    filter
                                    filterField="global"
                                    filterPlaceholder="Search name"
                                    sortable
                                />
                                <Column 
                                    field="departments_name" 
                                    header="Department" 
                                    body={departmentTemplate}
                                    filter 
                                    filterPlaceholder="Search department"
                                    sortable 
                                />
                                <Column 
                                    field="user_level_name" 
                                    header="Role" 
                                    body={userLevelTemplate}
                                    sortable 
                                    style={{ width: '150px' }}
                                />
                                <Column 
                                    field="users_contact_number" 
                                    header="Contact" 
                                    sortable 
                                    body={(rowData) => (
                                        <div className="flex items-center gap-2">
                                            <i className="pi pi-phone text-green-500" />
                                            {rowData.users_contact_number}
                                        </div>
                                    )}
                                />
                                <Column 
                                    header="Actions" 
                                    body={actionsBodyTemplate} 
                                    style={{ width: '150px' }}
                                    className="text-center"
                                />
                            </DataTable>
                        </div>
                    )}
                </div>
            </div>

            {modalState.type === 'add' && (
                <Create_Modal
                    show={modalState.isOpen}
                    onHide={() => setModalState({ isOpen: false, type: '', user: null })}
                    generateAvatarColor={generateAvatarColor}
                    fetchUsers={fetchUsers}
                />
            )}

            {modalState.type === 'edit' && (
                <Update_Modal
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
                <Modal.Body className="text-center">
                    {currentImage && (
                        <img
                            src={currentImage}
                            alt="Faculty"
                            className="max-w-full max-h-[70vh] object-contain"
                        />
                    )}
                </Modal.Body>
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
                    setUserToArchive(null);
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
                        description={`Are you sure you want to archive ${userToArchive?.users_fname} ${userToArchive?.users_lname}? This action cannot be undone.`}
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
                            setUserToArchive(null);
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