import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArchive, faSearch, faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
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
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import '../vehicle.css'; // Import vehicle.css which contains loader styles
import { ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';

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
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [userLevels, setUserLevels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useState({ isOpen: false, type: '', user: null });
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

    const navigate = useNavigate();

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", 
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

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchDepartments'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
    
            console.log('Department response:', response.data); // Debug log
    
            if (response.data && Array.isArray(response.data.data)) {
                setDepartments(response.data.data);
            } else {
                console.error('Invalid department data:', response.data);
                toast.error("Invalid department data format");
            }
        } catch (error) {
            console.error('Department fetch error:', error);
            toast.error(error.response?.data?.message || "Failed to fetch departments");
        } finally {
            setLoading(false);
        }
    };
    
    // Add this new function after other fetch functions
    const fetchUserLevels = async () => {
        try {
            const response = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchUserLevels'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && Array.isArray(response.data.data)) {
                setUserLevels(response.data.data);
            } else {
                console.error('Invalid user level data:', response.data);
                toast.error("Invalid user level data format");
            }
        } catch (error) {
            console.error('User level fetch error:', error);
            toast.error("Failed to fetch user levels");
        }
    };

    const getUserDetails = async (userId) => {
        try {
            const response = await axios.post(
                'http://localhost/coc/gsd/fetchMaster.php',
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

    // Add to useEffect
    useEffect(() => {
        const initializePage = async () => {
            await fetchDepartments();
            await fetchUserLevels();
            await fetchUsers();
        };
        initializePage();
    }, []);

    const handleSubmit = async (jsonData) => {
        const operation = jsonData.data.users_id ? "updateUser" : "saveUser";
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/insert_master.php";
            
            const response = await axios.post(url, jsonData, {
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

    const archiveUser = async (userId, userLevelName) => {
        try {
            // Map the user level name to the correct API type
            let apiUserType;
            switch (userLevelName.toLowerCase()) {
                case 'user':
                    apiUserType = 'user';
                    break;
                default:
                    apiUserType = 'user';
            }

            console.log('Sending archive request:', {
                operation: 'archiveUser',
                userType: apiUserType,
                userId: userId
            });

            const response = await axios.post(
                "http://localhost/coc/gsd/delete_master.php",
                {
                    operation: 'archiveUser',
                    userType: apiUserType,
                    userId: userId.toString()
                },
                { 
                    headers: { 'Content-Type': 'application/json' } 
                }
            );

            if (response.data.status === 'success') {
                fetchUsers(); // Refresh the users list
                setModalState({ isOpen: false, type: '', user: null });
            } else {
                throw new Error(response.data.message || "Failed to archive user");
            }
        } catch (error) {
            console.error('Archive Error:', error);
            toast.error("An error occurred while archiving the user: " + error.message);
        }
    };

 // Add null checks and provide empty array fallback

    const handleViewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        setViewImageModal(true);
    };

    const imageBodyTemplate = (rowData) => {
        const imageUrl = rowData.users_pic ? `http://localhost/coc/gsd/${rowData.users_pic}` : null;
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

        const handleArchiveClick = () => {
            setModalState({ 
                isOpen: true, 
                type: 'archive', 
                user: {
                    users_id: rowData.users_id,
                    user_level_name: rowData.user_level_name
                }
            });
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
                    onClick={handleArchiveClick}
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
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Faculty Management
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

            <FacultyModal 
                show={modalState.isOpen} 
                onHide={() => setModalState({ isOpen: false, type: '', user: null })}
                type={modalState.type}
                user={modalState.user}
                departments={departments}
                onSubmit={handleSubmit}
                onDelete={archiveUser}
                userLevels={userLevels}
                getUserDetails={getUserDetails}
                generateAvatarColor={generateAvatarColor}
                fetchUsers={fetchUsers}
            />

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
        </div>
    );
};

const FacultyModal = ({ 
    show, 
    onHide, 
    type, 
    user, 
    departments, 
    onSubmit, 
    onDelete: onArchive,
    userLevels,
    getUserDetails,
    generateAvatarColor,
    fetchUsers
}) => {
    const timeoutRef = useRef(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState(null);

    const [formData, setFormData] = useState({
        users_id: '',
        users_firstname: '',
        users_middlename: '',
        users_lastname: '',
        users_suffix: '',
        users_school_id: '',
        users_contact_number: '',
        users_email: '',
        departments_name: '',
        users_password: '',
        users_role: '',
        users_birthday: '',
    });

    const [imageUrl, setImageUrl] = useState('');
    const [errors, setErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});
    const [duplicateFields, setDuplicateFields] = useState({
        email: false,
        schoolId: false
    });

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]*$/;
    const passwordSingleSpecialCharRegex = /[!@#$%^&*]/g;

    // Modified validation rules
    const validateField = (name, value) => {
        // Skip email and school ID validation in edit mode
        if (type === 'edit' && (name === 'users_email' || name === 'users_school_id')) {
            return '';
        }

        switch (name) {
            case 'users_firstname':
            case 'users_middlename':
            case 'users_lastname':
                if (!value.trim()) {
                    return 'This field is required';
                }
                if (/\d/.test(value)) {
                    return 'Name cannot contain numbers';
                }
                if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
                    return 'Name can only contain letters and spaces';
                }
                return '';
            case 'users_suffix':
                if (value && !/^[a-zA-Z\s.]+$/.test(value.trim())) {
                    return 'Suffix can only contain letters, spaces, and periods';
                }
                return '';
            case 'users_birthday':
                if (!value) {
                    return 'Birthday is required';
                }
                const birthDate = new Date(value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 18) {
                    return 'Must be at least 18 years old';
                }
                if (age > 100) {
                    return 'Invalid birth date';
                }
                return '';
            case 'users_email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email address';
            case 'users_school_id':
                if (!value.trim()) {
                    return 'School ID is required';
                }
                // Regex to ensure the format is something like 'x1-x1-x1', where 'x1' can be alphanumeric
                if (!/^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(value)) {
                    return 'School ID must be in the format x1-x1-x1 (e.g., abc-123-xyz)';
                }
                return '';
                
            case 'users_contact_number':
                return /^\d{11}$/.test(value) ? '' : 'Contact number must be 11 digits';
            case 'users_password':
                if (type === 'add' || (type === 'edit' && value)) {
                    if (!passwordRegex.test(value)) {
                        return 'Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, and 1 number';
                    }
                    // Check for exactly one special character
                    const specialCharCount = (value.match(passwordSingleSpecialCharRegex) || []).length;
                    if (specialCharCount !== 1) {
                        return 'Password must contain exactly 1 special character (!@#$%^&*)';
                    }
                    if (value.length < 8) {
                        return 'Password must be at least 8 characters long';
                    }
                }
                return '';
            case 'users_role':
                return value ? '' : 'Please select a role';
            case 'departments_name':
                return value ? '' : 'Please select a department';
            default:
                return '';
        }
    };

    // Handle field blur
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouchedFields(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));

        // Check duplicates only when field loses focus
        if ((name === 'users_email' || name === 'users_school_id') && value) {
            checkDuplicates(name === 'users_email' ? 'email' : 'schoolId', value);
        }
    };

    // Modified handleChange to handle all input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        
        if (name !== 'users_password') {
            // Sanitize other inputs while allowing spaces
            finalValue = sanitizeInput(value);
            
            // Only validate non-empty values
            if (finalValue && !validateInput(finalValue)) {
                toast.error('Invalid input detected');
                return;
            }
        }
        
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: finalValue
            };
            
            // Check if anything has changed from original data
            if (type === 'edit' && originalData) {
                const hasAnyChange = Object.keys(originalData).some(key => {
                    // Skip password field as it's always empty in originalData
                    if (key === 'users_password') return false;
                    return originalData[key] !== newData[key];
                });
                // Special case for password in edit mode - if there's a password, count it as a change
                const passwordChange = type === 'edit' && newData.users_password !== '';
                setHasChanges(hasAnyChange || passwordChange);
            }
            
            return newData;
        });
        
        // Clear any existing errors while typing
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));
        
        // Reset duplicate fields while typing for email and school ID
        if (name === 'users_email' || name === 'users_school_id') {
            setDuplicateFields(prev => ({
                ...prev,
                [name === 'users_email' ? 'email' : 'schoolId']: false
            }));
            
            // Debounce the duplicate check
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            timeoutRef.current = setTimeout(() => {
                checkDuplicates(
                    name === 'users_email' ? 'email' : 'schoolId',
                    finalValue
                );
            }, 500);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            setHasChanges(false); // Reset changes flag
            
            if (user && type === 'edit') {
                console.log('Fetching user details for ID:', user.users_id);
                const userDetails = await getUserDetails(user.users_id);
                console.log('Fetched user details:', userDetails);
                
                if (userDetails) {
                    const newFormData = {
                        users_id: userDetails.users_id,
                        users_firstname: userDetails.users_fname,
                        users_middlename: userDetails.users_mname,
                        users_lastname: userDetails.users_lname,
                        users_suffix: userDetails.users_suffix || '',
                        users_email: userDetails.users_email,
                        users_school_id: userDetails.users_school_id,
                        users_contact_number: userDetails.users_contact_number,
                        users_role: userDetails.users_user_level_id,
                        departments_name: userDetails.departments_name,
                        users_password: '',
                        users_birthday: userDetails.users_birthdate || '',
                    };
                    setFormData(newFormData);
                    setOriginalData(newFormData); // Save original data for comparison
                    setImageUrl(userDetails.users_pic ? `http://localhost/coc/gsd/${userDetails.users_pic}` : '');
                }
            } else {
                // Reset form for new user
                const newFormData = {
                    users_id: '',
                    users_firstname: '',
                    users_middlename: '',
                    users_lastname: '',
                    users_suffix: '',
                    users_school_id: '',
                    users_contact_number: '',
                    users_email: '',
                    departments_name: '',
                    users_password: '',
                    users_role: '',
                    users_birthday: '',
                };
                setFormData(newFormData);
                setOriginalData(null); // Clear original data in add mode
                setImageUrl('');
            }
        };

        fetchUserData();
    }, [user, type, getUserDetails]);

    // Add function to check unique email and school ID
    const checkUniqueEmailAndSchoolId = async (email, schoolId) => {
        try {
            const response = await axios.post(
                'http://localhost/coc/gsd/user.php',
                {
                    operation: 'checkUniqueEmailAndSchoolId',
                    email: email,
                    schoolId: schoolId
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error checking unique email and school ID:', error);
            throw error;
        }
    };

    // Modified handleSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all form inputs before submission (except password)
        const isValid = Object.entries(formData).every(([key, value]) => {
            if (key === 'users_middlename' || key === 'users_password') return true; // Skip password and optional fields
            return validateInput(value);
        });

        if (!isValid) {
            toast.error('Please check your inputs for invalid characters or patterns.');
            return;
        }

        // Email format validation
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(formData.users_email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        // Name validation
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.users_firstname) || 
            (formData.users_middlename && !nameRegex.test(formData.users_middlename)) || 
            !nameRegex.test(formData.users_lastname)) {
            toast.error('Names can only contain letters and spaces');
            return;
        }

        // Check unique email and school ID
        if (type === 'add' || 
            (type === 'edit' && 
             (formData.users_email !== originalData.users_email || 
              formData.users_school_id !== originalData.users_school_id))
        ) {
            const uniqueCheckResult = await checkUniqueEmailAndSchoolId(
                formData.users_email,
                formData.users_school_id
            );

            // In edit mode, only check for duplicates if the field has changed
            if (uniqueCheckResult && uniqueCheckResult.email_exists &&
                (type === 'add' || formData.users_email !== originalData.users_email)
            ) {
                setErrors(prev => ({
                    ...prev,
                    users_email: 'This email is already in use'
                }));
                toast.error('Email is already registered');
                return;
            }

            if (uniqueCheckResult && uniqueCheckResult.school_id_exists &&
                (type === 'add' || formData.users_school_id !== originalData.users_school_id)
            ) {
                setErrors(prev => ({
                    ...prev,
                    users_school_id: 'This school ID is already in use'
                }));
                toast.error('School ID is already registered');
                return;
            }
        }

        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (key !== 'users_middlename') {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTouchedFields(
                Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
            toast.error('Please fix the validation errors');
            return;
        }

        const selectedDepartment = departments.find(
            dept => dept.departments_name === formData.departments_name
        );
        
        if (!selectedDepartment) {
            console.error('Department not found:', formData.departments_name);
            return;
        }

        let jsonData;
        if (type === 'edit') {
            // Handle update
            let userType;
            switch (formData.users_role) {
                case '1':
                    userType = 'admin';
                    break;
                case '5':
                case '6':
                    userType = 'dean_sec';
                    break;
                case '13':
                    userType = 'driver';
                    break;
                default:
                    userType = 'user';
            }

            jsonData = {
                operation: 'updateUsers',
                type: userType,
                id: user.users_id,
                fname: formData.users_firstname,
                mname: formData.users_middlename || '',
                lname: formData.users_lastname,
                email: formData.users_email,
                school_id: formData.users_school_id,
                contact: formData.users_contact_number,
                user_level_id: formData.users_role,
                department_id: selectedDepartment?.departments_id,
                pic: user.users_pic || '',
                is_active: 1,
                suffix: formData.users_suffix || '',
                birthdate: formData.users_birthday || ''
            };

            if (formData.users_password) {
                jsonData.password = formData.users_password;
            }
        } else {
            // Handle insert (existing code for new user)
            let operation;
            if (formData.users_role === '13') {
                operation = 'saveUser';
            } else {
                operation = 'saveUser';
            }

            if (formData.users_role === '13') {
                jsonData = {
                    operation: operation,
                    data: {
                        fullName: `${formData.users_firstname} ${formData.users_middlename} ${formData.users_lastname}`.trim(),
                        email: formData.users_email,
                        schoolId: formData.users_school_id,
                        contact: formData.users_contact_number,
                        userLevelId: formData.users_role,
                        password: formData.users_password,
                        departmentId: selectedDepartment.departments_id,
                        pic: "",
                        suffix: formData.users_suffix || "",
                        birthdate: formData.users_birthday || ""
                    }
                };
            } else {
                jsonData = {
                    operation: operation,
                    data: {
                        fname: formData.users_firstname,
                        mname: formData.users_middlename,
                        lname: formData.users_lastname,
                        email: formData.users_email,
                        schoolId: formData.users_school_id,
                        contact: formData.users_contact_number,
                        userLevelId: formData.users_role,
                        password: formData.users_password,
                        departmentId: selectedDepartment.departments_id,
                        suffix: formData.users_suffix || "",
                        birthdate: formData.users_birthday || ""
                    }
                };
            }
        }

        console.log('Sending data:', jsonData);
        try {
            let response;
            if (type === 'edit') {
                response = await axios.post(
                    'http://localhost/coc/gsd/update_master.php',
                    jsonData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                response = await onSubmit(jsonData);
            }

            if (response && response.data.status === 'success') {
                toast.success(response.data.message || 'Operation successful');
                onHide();
                fetchUsers(); // Now using the prop
            } else {
                throw new Error(response.data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        
        }
    };

    // Add new state for duplicate checks


    // Modified checkDuplicates function
    const checkDuplicates = async (field, value) => {
        // Don't check if the field is empty
        if (!value) {
            setDuplicateFields(prev => ({
                ...prev,
                [field]: false
            }));
            setErrors(prev => ({
                ...prev,
                [field === 'email' ? 'users_email' : 'users_school_id']: ''
            }));
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost/coc/gsd/user.php',
                {
                    operation: 'checkUniqueEmailAndSchoolId',
                    email: field === 'email' ? value : '',
                    schoolId: field === 'schoolId' ? value : ''
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                const { status, exists, duplicates } = response.data;
                
                if (status === 'success' && exists && Array.isArray(duplicates)) {
                    // Find if there's a duplicate for the current field
                    const duplicate = duplicates.find(d => 
                        (field === 'email' && d.field === 'email') || 
                        (field === 'schoolId' && d.field === 'school_id')
                    );

                    if (duplicate) {
                        setDuplicateFields(prev => ({
                            ...prev,
                            [field]: true
                        }));
                        setErrors(prev => ({
                            ...prev,
                            [field === 'email' ? 'users_email' : 'users_school_id']: duplicate.message
                        }));
                    } else {
                        setDuplicateFields(prev => ({
                            ...prev,
                            [field]: false
                        }));
                        setErrors(prev => ({
                            ...prev,
                            [field === 'email' ? 'users_email' : 'users_school_id']: ''
                        }));
                    }
                } else {
                    // No duplicates found
                    setDuplicateFields(prev => ({
                        ...prev,
                        [field]: false
                    }));
                    setErrors(prev => ({
                        ...prev,
                        [field === 'email' ? 'users_email' : 'users_school_id']: ''
                    }));
                }
            }
        } catch (error) {
            console.error('Error checking duplicates:', error);
            toast.error('Error checking for duplicates');
        }
    };

    // Clean up the timeout on component unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Modal show={show} onHide={onHide} centered size="lg" className="rounded-xl faculty-modal">
            <Modal.Header closeButton className="bg-green-900 text-white">
                <Modal.Title className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-xl" />
                    <span className="font-bold">
                        {type === 'add' ? 'Add New Faculty' : type === 'edit' ? 'Edit Faculty Details' : 'Archive Faculty'}
                    </span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-[#fafff4] p-4">
                {type === 'archive' ? (
                    <div className="text-center p-4">
                        <div className="mb-4">
                            <ExclamationCircleOutlined className="text-5xl text-yellow-500" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Confirm Archive</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to archive this faculty member? This action cannot be undone and will move the faculty member to the archive.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button variant="outline-secondary" onClick={onHide} className="px-4 py-2">
                                Cancel
                            </Button>
                            <Button 
                                variant="warning" 
                                onClick={() => onArchive(user.users_id, user.user_level_name)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 flex items-center gap-2"
                            >
                                <i className="fas fa-archive"></i> Archive
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Form onSubmit={handleSubmit} noValidate className="p-2">
                        {/* Image Preview */}
                        {type === 'edit' && (
                            <div className="flex justify-center mb-6">
                                <div className="relative w-32 h-32">
                                    {imageUrl ? (
                                        <div className="w-full h-full">
                                            <img
                                                src={imageUrl}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover border-4 border-green-500"
                                                onError={() => {
                                                    const initials = `${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`.toUpperCase();
                                                    const bgColor = generateAvatarColor(initials);
                                                    const container = document.getElementById('profile-image-container');
                                                    if (container) {
                                                        container.innerHTML = `
                                                            <div
                                                                class="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-3xl"
                                                                style="background-color: ${bgColor}"
                                                            >
                                                                ${initials}
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-3xl"
                                            style={{ 
                                                backgroundColor: generateAvatarColor(
                                                    `${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`
                                                )
                                            }}
                                        >
                                            {`${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Form Groups */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <Form.Group>
                                <Form.Label className="font-semibold">First Name <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="users_firstname"
                                    value={formData.users_firstname}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_firstname && errors.users_firstname}
                                    className="border-green-200 focus:border-green-400 focus:ring focus:ring-green-200"
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_firstname}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className="font-semibold">Middle Name</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    name="users_middlename" 
                                    value={formData.users_middlename} 
                                    onChange={handleChange}
                                    className="border-green-200 focus:border-green-400 focus:ring focus:ring-green-200" 
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className="font-semibold">Last Name <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="users_lastname"
                                    value={formData.users_lastname}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_lastname && errors.users_lastname}
                                    className="border-green-200 focus:border-green-400 focus:ring focus:ring-green-200"
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_lastname}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Group>
                                <Form.Label>School ID <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="users_school_id"
                                    value={formData.users_school_id}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={!!errors.users_school_id}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_school_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Phone Number <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="users_contact_number"
                                    value={formData.users_contact_number}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_contact_number && errors.users_contact_number}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_contact_number}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Email Address <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="email"
                                    name="users_email"
                                    value={formData.users_email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={!!errors.users_email}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_email}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Role <span className="text-red-500">*</span></Form.Label>
                                <Form.Select
                                    name="users_role"
                                    value={formData.users_role}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_role && errors.users_role}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {userLevels.map((level) => (
                                        <option key={level.user_level_id} value={level.user_level_id}>
                                            {level.user_level_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_role}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Department <span className="text-red-500">*</span></Form.Label>
                                <Form.Select
                                    name="departments_name"
                                    value={formData.departments_name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.departments_name && errors.departments_name}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments && departments.map((department) => (
                                        <option key={department.departments_id} value={department.departments_name}>
                                            {department.departments_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.departments_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>{type === 'edit' ? 'New Password (leave blank to keep current)' : 'Password'} {type === 'add' && <span className="text-red-500">*</span>}</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="users_password"
                                    value={formData.users_password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_password && errors.users_password}
                                    required={type === 'add'}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_password}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 
                                    1 number, and exactly 1 special character (!@#$%^&*).
                                </Form.Text>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Suffix</Form.Label>
                                <Form.Select
                                    name="users_suffix"
                                    value={formData.users_suffix}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_suffix && errors.users_suffix}
                                >
                                    <option value="">Select Suffix</option>
                                    <option value="Jr.">Jr.</option>
                                    <option value="Sr.">Sr.</option>
                                    <option value="II">II</option>
                                    <option value="III">III</option>
                                    <option value="IV">IV</option>
                                    <option value="V">V</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_suffix}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Birthday*</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="users_birthday"
                                    value={formData.users_birthday}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_birthday && errors.users_birthday}
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_birthday}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </Form>
                )}
            </Modal.Body>
            {!type.includes('archive') && (
                <Modal.Footer className="bg-[#fafff4] border-t border-green-100">
                    <Button variant="outline-secondary" onClick={onHide} className="px-4">
                        Cancel
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={handleSubmit} 
                        className="bg-green-900 hover:bg-lime-900 border-green-900 px-4"
                        disabled={
                            (type === 'edit' && !hasChanges) || // Disable if in edit mode with no changes
                            (duplicateFields && (duplicateFields.email || duplicateFields.schoolId))
                        }
                    >
                        {type === 'add' ? 'Add Faculty' : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
};

export default Faculty;