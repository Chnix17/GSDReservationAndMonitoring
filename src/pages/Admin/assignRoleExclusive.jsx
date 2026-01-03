import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Form, Tooltip, Input, Empty, Pagination, Typography, Alert, Select, Checkbox, Card, Drawer } from 'antd';
import { toast } from 'sonner';
import Sidebar from '../../components/core/Sidebar';
import { FaUserShield, FaUserTag } from 'react-icons/fa';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
// import { Tag } from 'primereact/tag';
import { SecureStorage } from '../../utils/encryption';
import { useMediaQuery } from 'react-responsive';

const { Text } = Typography;
const { Option } = Select;

const AssignRoleExclusive = () => {
    const navigate = useNavigate();
    
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });
    const [roleExclusives, setRoleExclusives] = useState([]);
    const [filteredRoleExclusives, setFilteredRoleExclusives] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [userLevels, setUserLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('approval_exclusive_id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [form] = Form.useForm();
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
    
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
        const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            navigate('/');
        }
    }, [navigate]);

    const fetchRoleExclusives = useCallback(async () => {
        setLoading(true);
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}Assigned&Records.php`, {
                operation: 'fetchRoleExclusives'
            });
            if (response.data.status === 'success') {
                setRoleExclusives(response.data.data);
                setFilteredRoleExclusives(response.data.data);
            } else {
                toast.error('Failed to fetch role exclusives');
            }
        } catch (error) {
            console.error('Error fetching role exclusives:', error);
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Unable to reach the server.');
            } else {
                toast.error('Error fetching role exclusives');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDepartments = async () => {
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}Admin.php`, {
                operation: 'fetchDepartments'
            });
            if (response.data.status === 'success') {
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Unable to reach the server.');
            }
        }
    };

    const fetchUserLevels = async () => {
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}Assigned&Records.php`, {
                operation: 'fetchUserLevels'
            });
            if (response.data.status === 'success') {
                setUserLevels(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching user levels:', error);
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Unable to reach the server.');
            }
        }
    };

    useEffect(() => {
        fetchRoleExclusives();
        fetchDepartments();
        fetchUserLevels();
    }, [fetchRoleExclusives]);

    const handleRefresh = () => {
        fetchRoleExclusives();
        setSearchTerm('');
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (!value.trim()) {
            setFilteredRoleExclusives(roleExclusives);
        } else {
            const filtered = roleExclusives.filter(exclusive => 
                exclusive.user_level_name?.toLowerCase().includes(value.toLowerCase()) ||
                exclusive.departments_name?.toLowerCase().includes(value.toLowerCase()) ||
                exclusive.users_fname?.toLowerCase().includes(value.toLowerCase()) ||
                exclusive.users_lname?.toLowerCase().includes(value.toLowerCase()) ||
                exclusive.user_level_desc?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredRoleExclusives(filtered);
        }
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        
        const sorted = [...filteredRoleExclusives].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (newOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        setFilteredRoleExclusives(sorted);
    };

    const handleAdd = async () => {
        setEditMode(false);
        setCurrentRecord(null);
        form.resetFields();
        setSelectedDepartments([]);
        
        // Fetch available user levels (excluding already assigned ones)
        await fetchUserLevels();
        setShowModal(true);
    };

    const handleEdit = async (record) => {
        setEditMode(true);
        setCurrentRecord(record);
        
        // For edit mode, we need to fetch all user levels since we might change the assignment
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}Assigned&Records.php`, {
                operation: 'fetchUserLevels'
            });
            if (response.data.status === 'success') {
                // Add the current user level to the list if it's not already there
                const currentUserLevel = {
                    user_level_id: record.approval_exclusive_user_level_id,
                    user_level_name: record.user_level_name,
                    user_level_desc: record.user_level_desc
                };
                
                const existingUserLevels = response.data.data;
                const isCurrentInList = existingUserLevels.some(ul => ul.user_level_id === currentUserLevel.user_level_id);
                
                if (!isCurrentInList) {
                    existingUserLevels.unshift(currentUserLevel);
                }
                
                setUserLevels(existingUserLevels);
            }
        } catch (error) {
            console.error('Error fetching user levels for edit:', error);
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Unable to reach the server.');
            }
        }
        
        // Get all departments currently assigned to this user level
        const userLevelDepartments = roleExclusives
            .filter(exclusive => exclusive.approval_exclusive_user_level_id === record.approval_exclusive_user_level_id)
            .map(exclusive => exclusive.approval_exclusive_department_id);
        
        // Set both form values and state
        setSelectedDepartments(userLevelDepartments);
        form.setFieldsValue({
            user_level_id: record.approval_exclusive_user_level_id,
            department_ids: userLevelDepartments
        });
        setShowModal(true);
    };

    const handleDelete = (record) => {
        // Get all departments for this user level
        const userLevelDepartments = roleExclusives
            .filter(exclusive => exclusive.approval_exclusive_user_level_id === record.approval_exclusive_user_level_id)
            .map(exclusive => exclusive.departments_name)
            .join(', ');
            
        Modal.confirm({
            title: 'Delete Role Exclusive Assignment',
            content: `Are you sure you want to delete all exclusive assignments for ${record.user_level_name}? This will remove assignments to: ${userLevelDepartments}`,
            icon: <ExclamationCircleOutlined />,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                const url = SecureStorage.getLocalItem("url");
                
                try {
                    const response = await axios.post(`${url}Assigned&Records.php`, {
                        operation: 'deleteRoleExclusive',
                        user_level_id: record.approval_exclusive_user_level_id
                    });
                    
                    if (response.data.status === 'success') {
                        toast.success(response.data.message);
                        fetchRoleExclusives();
                        fetchUserLevels(); // Refresh available user levels
                    } else {
                        toast.error(response.data.message || 'Failed to delete role exclusive assignment');
                    }
                } catch (error) {
                    console.error('Error deleting role exclusive:', error);
                    if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                        toast.error('Network connection lost. Unable to reach the server.');
                    } else {
                        toast.error('Error deleting role exclusive assignment');
                    }
                }
            }
        });
    };

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        const url = SecureStorage.getLocalItem("url");
        const userId = SecureStorage.getLocalItem("user_id");
        
        try {
            const operation = editMode ? 'updateRoleExclusive' : 'addRoleExclusive';
            const payload = {
                operation,
                user_level_id: values.user_level_id,
                department_ids: values.department_ids,
                user_id: parseInt(userId)
            };
            
            const response = await axios.post(`${url}Assigned&Records.php`, payload);
            
            if (response.data.status === 'success') {
                toast.success(response.data.message);
                setShowModal(false);
                form.resetFields();
                fetchRoleExclusives();
                fetchUserLevels(); // Refresh available user levels
            } else {
                toast.error(response.data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error submitting role exclusive:', error);
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Unable to reach the server.');
            } else {
                toast.error('Error submitting role exclusive assignment');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalClose = async () => {
        setShowModal(false);
        form.resetFields();
        setCurrentRecord(null);
        setSelectedDepartments([]);
        
        // Reset user levels to default (available only)
        await fetchUserLevels();
        
        // Reset department filters
        setDepartmentSearchTerm('');
    };

    // Group role exclusives by user level for display
    const groupedExclusives = roleExclusives.reduce((acc, exclusive) => {
        const userLevelId = exclusive.approval_exclusive_user_level_id;
        if (!acc[userLevelId]) {
            acc[userLevelId] = {
                approval_exclusive_user_level_id: userLevelId,
                user_level_name: exclusive.user_level_name,
                user_level_desc: exclusive.user_level_desc,
                departments: [],
                updated_by: exclusive.users_fname + ' ' + exclusive.users_lname,
                updated_at: exclusive.updated_at
            };
        }
        acc[userLevelId].departments.push({
            department_id: exclusive.approval_exclusive_department_id,
            departments_name: exclusive.departments_name
        });
        return acc;
    }, {});

    const groupedData = Object.values(groupedExclusives);
    const filteredGroupedData = groupedData.filter(group =>
        !searchTerm || 
        group.user_level_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.user_level_desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.departments.some(dept => dept.departments_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        group.updated_by?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedData = filteredGroupedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // const getSortIcon = (field) => {
    //     if (sortField !== field) return null;
    //     return sortOrder === 'asc' ? <UpOutlined /> : <DownOutlined />;
    // };

    // Filter departments based on search term
    const filteredDepartments = departments.filter(dept => {
        const matchesSearch = !departmentSearchTerm || 
            (dept.departments_name && dept.departments_name.toLowerCase().includes(departmentSearchTerm.toLowerCase()));
        
        return matchesSearch;
    });

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <div className="flex-shrink-0">
                <Sidebar />
            </div>
            
            <div className={`flex-grow overflow-y-auto`}>
                <div className={`${isMobile ? 'px-4 py-4 mt-5' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`${isMobile ? 'mb-3' : 'mb-4'}`}
                    >
                        <div className="mb-2 sm:mb-4 mt-mt-10">
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                          
                                Role Approval
                            </h2>
                            {/* <Text type="secondary">Manage exclusive role assignments for department approval</Text> */}
                        </div>
                    </motion.div>

                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Input
                                    placeholder={isMobile ? "Search..." : "Search by role, department, or updated by..."}
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                                <Tooltip title="Refresh data">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        size={isMobile ? "middle" : "large"}
                                        loading={loading}
                                    />
                                </Tooltip>
                                <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />}
                                    onClick={handleAdd}
                                    size={isMobile ? "middle" : "large"}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isMobile ? "Add" : "Add Role Exclusive"}
                                </Button>
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
                                {isMobile ? (
                                    // Mobile Card View
                                    <div className="p-3">
                                        {filteredGroupedData && filteredGroupedData.length > 0 ? (
                                            paginatedData.map((group, index) => (
                                                <Card
                                                    key={group.approval_exclusive_user_level_id}
                                                    className="mb-3 shadow-sm"
                                                    size="small"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaUserTag className="mr-2 text-green-900" />
                                                                <div>
                                                                    <Text strong className="text-sm">{group.user_level_name}</Text>
                                                                    {group.user_level_desc && (
                                                                        <>
                                                                            <br />
                                                                            <Text type="secondary" className="text-xs">{group.user_level_desc}</Text>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    icon={<EditOutlined />}
                                                                    onClick={() => handleEdit(group)}
                                                                    size="small"
                                                                />
                                                                <Button
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => handleDelete(group)}
                                                                    size="small"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Text type="secondary" className="text-xs">Assigned Departments:</Text>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {group.departments.map((dept) => (
                                                                    <span 
                                                                        key={dept.department_id}
                                                                        className="px-2 py-1 text-xs font-semibold text-white rounded"
                                                                        style={{ backgroundColor: '#145414' }}
                                                                    >
                                                                        {dept.departments_name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <Text type="secondary" className="text-xs">
                                                                {group.departments.length} department(s) assigned
                                                            </Text>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <Text type="secondary">By: {group.updated_by !== 'null null' && group.updated_by !== ' ' ? group.updated_by : 'N/A'}</Text>
                                                            <Text type="secondary">
                                                                {group.updated_at ? new Date(group.updated_at).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                }) : 'N/A'}
                                                            </Text>
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
                                                            No role exclusive assignments found
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
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('user_level_name')}>
                                                        <div className="flex items-center">
                                                            User Level
                                                            {sortField === 'user_level_name' && (
                                                                <span className="ml-1">
                                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('departments_name')}>
                                                        <div className="flex items-center">
                                                            Assigned Departments
                                                            {sortField === 'departments_name' && (
                                                                <span className="ml-1">
                                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4 cursor-pointer" onClick={() => handleSort('users_fname')}>
                                                            <div className="flex items-center">
                                                                Updated By
                                                                {sortField === 'users_fname' && (
                                                                    <span className="ml-1">
                                                                        {sortOrder === "asc" ? "↑" : "↓"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </th>
                                                    )}
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('updated_at')}>
                                                        <div className="flex items-center">
                                                            Updated At
                                                            {sortField === 'updated_at' && (
                                                                <span className="ml-1">
                                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                        <div className="flex items-center">
                                                            Actions
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredGroupedData && filteredGroupedData.length > 0 ? (
                                                    paginatedData.map((group) => (
                                                        <tr
                                                            key={group.approval_exclusive_user_level_id}
                                                            className="bg-white border-b last:border-b-0 border-gray-200"
                                                        >
                                                            <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                <div className="flex items-center">
                                                                    <FaUserTag className="mr-2 text-green-900" />
                                                                    <div>
                                                                        <span className={`font-medium truncate block ${isTablet ? 'max-w-[120px]' : 'max-w-[160px]'}`}>{group.user_level_name}</span>
                                                                        
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {group.departments.map((dept) => (
                                                                        <span 
                                                                            key={dept.department_id}
                                                                            className="px-2 py-1 text-xs font-semibold text-white rounded"
                                                                            style={{ backgroundColor: '#145414' }}
                                                                        >
                                                                            {dept.departments_name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {group.departments.length} department(s) assigned
                                                                </div>
                                                            </td>
                                                            {!isTablet && (
                                                                <td className="px-4 py-4">{group.updated_by !== 'null null' && group.updated_by !== ' ' ? group.updated_by : 'N/A'}</td>
                                                            )}
                                                            <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                {group.updated_at ? new Date(group.updated_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                }) : 'N/A'}
                                                            </td>
                                                            <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                <div className="flex space-x-2 justify-center">
                                                                    <Button
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEdit(group)}
                                                                        size={isTablet ? "small" : "middle"}
                                                                    />
                                                                    <Button
                                                                        danger
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => handleDelete(group)}
                                                                        size={isTablet ? "small" : "middle"}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={isTablet ? 4 : 5} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                                            <Empty
                                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                description={
                                                                    <span className="text-gray-500 dark:text-gray-400">
                                                                        No role exclusive assignments found
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

                                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredGroupedData ? filteredGroupedData.length : 0}
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

            {/* Add/Edit Modal/Drawer */}
            {isMobile ? (
                <Drawer
                    title={editMode ? 'Edit Role Exclusive' : 'Add Role Exclusive'}
                    placement="bottom"
                    height="90%"
                    open={showModal}
                    onClose={handleModalClose}
                    footer={
                        <div className="flex flex-col gap-2 p-4 border-t">
                            <Button
                                type="primary"
                                loading={isSubmitting}
                                onClick={() => form.submit()}
                                className="bg-green-600 hover:bg-green-700 border-green-600 w-full"
                                size="large"
                            >
                                {editMode ? 'Update' : 'Add'} Role Exclusive
                            </Button>
                            <Button 
                                onClick={handleModalClose}
                                size="large"
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    }
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Form.Item
                            name="user_level_id"
                            label="User Level"
                            rules={[
                                { required: true, message: 'Please select a user level' },
                                {
                                    validator: (_, value) => {
                                        if (value && value.toString().trim() === '') {
                                            toast.error('User level cannot contain only whitespace!');
                                            return Promise.reject(new Error('User level cannot contain only whitespace!'));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Select
                                placeholder="Select a user level"
                                showSearch
                                optionFilterProp="children"
                            >
                                {userLevels.map(level => (
                                    <Option key={level.user_level_id} value={level.user_level_id}>
                                        <div>
                                            <strong>{level.user_level_name}</strong>
                                           
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="department_ids"
                            label="Departments"
                            rules={[
                                { required: true, message: 'Please select at least one department' }
                            ]}
                        >
                            <div className="mb-3">
                                <div className="row g-2">
                                    <div className="col-md-12">
                                        <Input
                                            placeholder="Search departments by name..."
                                            prefix={<SearchOutlined />}
                                            value={departmentSearchTerm}
                                            onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                                            allowClear
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Showing {filteredDepartments.length} of {departments.length} departments
                                    </small>
                                    <div className="d-flex gap-2">
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredDepartments.map(d => d.departments_id);
                                                const newValues = [...new Set([...selectedDepartments, ...allFilteredIds])];
                                                setSelectedDepartments(newValues);
                                                form.setFieldsValue({ department_ids: newValues });
                                            }}
                                        >
                                            Select All Filtered
                                        </Button>
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredDepartments.map(d => d.departments_id);
                                                const newValues = selectedDepartments.filter(id => !allFilteredIds.includes(id));
                                                setSelectedDepartments(newValues);
                                                form.setFieldsValue({ department_ids: newValues });
                                            }}
                                        >
                                            Clear All Filtered
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <Checkbox.Group 
                                style={{ width: '100%' }}
                                value={selectedDepartments}
                                onChange={(checkedValues) => {
                                    setSelectedDepartments(checkedValues);
                                    form.setFieldsValue({ department_ids: checkedValues });
                                }}
                            >
                                <div className="row" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {filteredDepartments.length === 0 ? (
                                        <div className="col-12 text-center py-4">
                                            <Empty 
                                                description="No departments match your filters"
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            />
                                        </div>
                                    ) : (
                                        filteredDepartments.map(dept => {
                                            // Check if this department is already assigned to the current user level in edit mode
                                            const isAlreadyAssigned = editMode && currentRecord && 
                                                roleExclusives.some(exclusive => 
                                                    exclusive.approval_exclusive_user_level_id === currentRecord.approval_exclusive_user_level_id && 
                                                    exclusive.approval_exclusive_department_id === dept.departments_id
                                                );
                                            
                                            return (
                                                <div key={dept.departments_id} className="col-md-6 mb-2">
                                                    <Checkbox value={dept.departments_id}>
                                                        <div>
                                                            <strong>{dept.departments_name}</strong>
                                                            {isAlreadyAssigned && (
                                                                <span className="ms-2 px-2 py-1 text-white rounded text-xs font-medium" style={{ fontSize: '10px', backgroundColor: '#145414' }}>
                                                                    Already Assigned
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Checkbox>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Checkbox.Group>
                        </Form.Item>

                        <Form.Item
                            name="user_level_id"
                            label="User Level"
                            rules={[
                                { required: true, message: 'Please select a user level' },
                                {
                                    validator: (_, value) => {
                                        if (value && value.toString().trim() === '') {
                                            toast.error('User level cannot contain only whitespace!');
                                            return Promise.reject(new Error('User level cannot contain only whitespace!'));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Select
                                placeholder="Select a user level"
                                showSearch
                                optionFilterProp="children"
                            >
                                {userLevels.map(level => (
                                    <Option key={level.user_level_id} value={level.user_level_id}>
                                        <div>
                                            <strong>{level.user_level_name}</strong>
                                           
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="department_ids"
                            label="Departments"
                            rules={[
                                { required: true, message: 'Please select at least one department' }
                            ]}
                        >
                            <div className="mb-3">
                                <div className="row g-2">
                                    <div className="col-12">
                                        <Input
                                            placeholder="Search departments..."
                                            prefix={<SearchOutlined />}
                                            value={departmentSearchTerm}
                                            onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                                            allowClear
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Showing {filteredDepartments.length} of {departments.length} departments
                                    </small>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredDepartments.map(d => d.departments_id);
                                                const newValues = [...new Set([...selectedDepartments, ...allFilteredIds])];
                                                setSelectedDepartments(newValues);
                                                form.setFieldsValue({ department_ids: newValues });
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredDepartments.map(d => d.departments_id);
                                                const newValues = selectedDepartments.filter(id => !allFilteredIds.includes(id));
                                                setSelectedDepartments(newValues);
                                                form.setFieldsValue({ department_ids: newValues });
                                            }}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <Checkbox.Group 
                                style={{ width: '100%' }}
                                value={selectedDepartments}
                                onChange={(checkedValues) => {
                                    setSelectedDepartments(checkedValues);
                                    form.setFieldsValue({ department_ids: checkedValues });
                                }}
                            >
                                <div className="row" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    {filteredDepartments.length === 0 ? (
                                        <div className="col-12 text-center py-4">
                                            <Empty 
                                                description="No departments match your filters"
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            />
                                        </div>
                                    ) : (
                                        filteredDepartments.map(dept => {
                                            // Check if this department is already assigned to the current user level in edit mode
                                            const isAlreadyAssigned = editMode && currentRecord && 
                                                roleExclusives.some(exclusive => 
                                                    exclusive.approval_exclusive_user_level_id === currentRecord.approval_exclusive_user_level_id && 
                                                    exclusive.approval_exclusive_department_id === dept.departments_id
                                                );
                                            
                                            return (
                                                <div key={dept.departments_id} className="col-12 mb-2">
                                                    <Checkbox value={dept.departments_id}>
                                                        <div>
                                                            <strong className="text-sm">{dept.departments_name}</strong>
                                                            {isAlreadyAssigned && (
                                                                <span className="ms-2 px-2 py-1 text-white rounded text-xs font-medium" style={{ fontSize: '10px', backgroundColor: '#145414' }}>
                                                                    Already Assigned
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Checkbox>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Checkbox.Group>
                        </Form.Item>

                        {editMode && (
                            <Alert
                                message="Edit Role Exclusive Assignment"
                                description="Already assigned departments are pre-selected (marked as 'Already Assigned'). You can add more departments or uncheck existing ones to remove them. If you change the user level, all selected departments will be moved to the new user level."
                                type="info"
                                showIcon
                                className="mb-3"
                            />
                        )}
                    </Form>
                </Drawer>
            ) : (
                <Modal
                    title={
                        <div className="d-flex align-items-center">
                            <FaUserShield className="me-2" />
                            {editMode ? 'Edit Role Exclusive Assignment' : 'Add Role Exclusive Assignment'}
                        </div>
                    }
                    open={showModal}
                    onCancel={handleModalClose}
                    footer={[
                        <Button key="cancel" onClick={handleModalClose}>
                            Cancel
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={isSubmitting}
                            onClick={() => form.submit()}
                            className="bg-green-600 hover:bg-green-700 border-green-600"
                        >
                            {editMode ? 'Update' : 'Add'} Role Exclusive
                        </Button>
                    ]}
                    width={isTablet ? 700 : 800}
                    destroyOnClose
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Form.Item
                            name="user_level_id"
                            label="User Level"
                            rules={[
                                { required: true, message: 'Please select a user level' },
                                {
                                    validator: (_, value) => {
                                        if (value && value.toString().trim() === '') {
                                            toast.error('User level cannot contain only whitespace!');
                                            return Promise.reject(new Error('User level cannot contain only whitespace!'));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Select
                                placeholder="Select a user level"
                                showSearch
                                optionFilterProp="children"
                            >
                                {userLevels.map(level => (
                                    <Option key={level.user_level_id} value={level.user_level_id}>
                                        <div>
                                            <strong>{level.user_level_name}</strong>
                                         
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="department_ids"
                            label="Departments"
                            rules={[
                                { required: true, message: 'Please select at least one department' }
                            ]}
                        >
                            <div className="mb-3">
                                <div className="row g-2">
                                    <div className="col-md-12">
                                        <Input
                                            placeholder={isMobile ? "Search departments..." : "Search departments by name..."}
                                            prefix={<SearchOutlined />}
                                            value={departmentSearchTerm}
                                            onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                                            allowClear
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Showing {filteredDepartments.length} of {departments.length} departments
                                    </small>
                                    <div className={`d-flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredDepartments.map(d => d.departments_id);
                                                const newValues = [...new Set([...selectedDepartments, ...allFilteredIds])];
                                                setSelectedDepartments(newValues);
                                                form.setFieldsValue({ department_ids: newValues });
                                            }}
                                        >
                                            {isMobile ? "Select All" : "Select All Filtered"}
                                        </Button>
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredDepartments.map(d => d.departments_id);
                                                const newValues = selectedDepartments.filter(id => !allFilteredIds.includes(id));
                                                setSelectedDepartments(newValues);
                                                form.setFieldsValue({ department_ids: newValues });
                                            }}
                                        >
                                            {isMobile ? "Clear All" : "Clear All Filtered"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <Checkbox.Group 
                                style={{ width: '100%' }}
                                value={selectedDepartments}
                                onChange={(checkedValues) => {
                                    setSelectedDepartments(checkedValues);
                                    form.setFieldsValue({ department_ids: checkedValues });
                                }}
                            >
                                <div className="row" style={{ maxHeight: isMobile ? '250px' : '300px', overflowY: 'auto' }}>
                                    {filteredDepartments.length === 0 ? (
                                        <div className="col-12 text-center py-4">
                                            <Empty 
                                                description="No departments match your filters"
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            />
                                        </div>
                                    ) : (
                                        filteredDepartments.map(dept => {
                                            // Check if this department is already assigned to the current user level in edit mode
                                            const isAlreadyAssigned = editMode && currentRecord && 
                                                roleExclusives.some(exclusive => 
                                                    exclusive.approval_exclusive_user_level_id === currentRecord.approval_exclusive_user_level_id && 
                                                    exclusive.approval_exclusive_department_id === dept.departments_id
                                                );
                                            
                                            return (
                                                <div key={dept.departments_id} className={`${isMobile ? 'col-12' : 'col-md-6'} mb-2`}>
                                                    <Checkbox value={dept.departments_id}>
                                                        <div>
                                                            <strong className={isMobile ? 'text-sm' : ''}>{dept.departments_name}</strong>
                                                            {isAlreadyAssigned && (
                                                                <span className="ms-2 px-2 py-1 text-white rounded text-xs font-medium" style={{ fontSize: '10px', backgroundColor: '#145414' }}>
                                                                    Already Assigned
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Checkbox>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Checkbox.Group>
                        </Form.Item>

                        {editMode && (
                            <Alert
                                message="Edit Role Exclusive Assignment"
                                description="Already assigned departments are pre-selected (marked as 'Already Assigned'). You can add more departments or uncheck existing ones to remove them. If you change the user level, all selected departments will be moved to the new user level."
                                type="info"
                                showIcon
                                className="mb-3"
                            />
                        )}
                    </Form>
                </Modal>
            )}
        </div>
        
    );
};

export default AssignRoleExclusive;