import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Form, Tooltip, Input, Empty, Pagination, Alert, Select, Checkbox, Card, Typography, Drawer } from 'antd';
import { toast } from 'sonner';
import Sidebar from '../../components/core/Sidebar';
import { FaUniversity } from 'react-icons/fa';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, ExclamationCircleOutlined, FilterOutlined } from '@ant-design/icons';
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

const { Option } = Select;
const { Text } = Typography;

const AssignApprovalVenue = () => {
    const navigate = useNavigate();
    
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });
    const [venueApprovals, setVenueApprovals] = useState([]);
    const [filteredVenueApprovals, setFilteredVenueApprovals] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('approval_venue_id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [form] = Form.useForm();
    const [venueSearchTerm, setVenueSearchTerm] = useState('');
    const [selectedAreaType, setSelectedAreaType] = useState('all');
    const [selectedVenues, setSelectedVenues] = useState([]);
    const [currentDepartmentName, setCurrentDepartmentName] = useState('');
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);

    // Helper function to check if error is a network error
    const isNetworkError = (error) => {
        return !error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !navigator.onLine);
    };
    
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

    const fetchVenueApprovals = useCallback(async () => {
        setLoading(true);
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}Assigned&Records.php`, {
                operation: 'fetchVenueApprovals'
            });
            if (response.data.status === 'success') {
                setVenueApprovals(response.data.data);
                setFilteredVenueApprovals(response.data.data);
            } else {
                toast.error('Failed to fetch venue approvals');
            }
        } catch (error) {
            console.error('Error fetching venue approvals:', error);
            if (isNetworkError(error)) {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                toast.error('Error fetching venue approvals');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDepartments = useCallback(async (currentDepartmentId = null) => {
        const url = SecureStorage.getLocalItem("url");
        try {
            const operation = currentDepartmentId ? 'fetchDepartmentsForEdit' : 'fetchDepartments';
            const payload = { operation };
            
            if (currentDepartmentId) {
                payload.current_department_id = currentDepartmentId;
            }
            
            const response = await axios.post(`${url}Assigned&Records.php`, payload);
            if (response.data.status === 'success') {
                setDepartments(response.data.data);
                return response.data.data; // Return the departments data
            }
            return [];
        } catch (error) {
            console.error('Error fetching departments:', error);
            if (isNetworkError(error)) {
                toast.error('Network connection lost. Unable to fetch departments.');
            } else {
                toast.error('Error fetching departments');
            }
            return [];
        }
    }, []);

    const fetchVenues = useCallback(async () => {
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}Assigned&Records.php`, {
                operation: 'fetchVenues'
            });
            if (response.data.status === 'success') {
                setVenues(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching venues:', error);
            if (isNetworkError(error)) {
                toast.error('Network connection lost. Unable to fetch venues.');
            } else {
                toast.error('Error fetching venues');
            }
        }
    }, []);

    useEffect(() => {
        fetchVenueApprovals();
        fetchDepartments();
        fetchVenues();
    }, [fetchVenueApprovals, fetchDepartments, fetchVenues]);

    const handleRefresh = () => {
        fetchVenueApprovals();
        setSearchTerm('');
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (!value.trim()) {
            setFilteredVenueApprovals(venueApprovals);
        } else {
            const filtered = venueApprovals.filter(approval => 
                approval.ven_name?.toLowerCase().includes(value.toLowerCase()) ||
                approval.departments_name?.toLowerCase().includes(value.toLowerCase()) ||
                approval.users_fname?.toLowerCase().includes(value.toLowerCase()) ||
                approval.users_lname?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredVenueApprovals(filtered);
        }
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        
        const sorted = [...filteredVenueApprovals].sort((a, b) => {
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
        
        setFilteredVenueApprovals(sorted);
    };

    const handleAdd = async () => {
        setEditMode(false);
        setCurrentRecord(null);
        form.resetFields();
        setSelectedVenues([]);
        setCurrentDepartmentName('');
        
        // Fetch available departments (excluding already assigned ones)
        await fetchDepartments();
        setShowModal(true);
    };

    const handleEdit = async (record) => {
        setEditMode(true);
        setCurrentRecord(record);
        
        // Fetch departments for edit mode (includes current department)
        const fetchedDepartments = await fetchDepartments(record.department_id);
        
        // Get all venues currently assigned to this department
        const departmentVenues = venueApprovals
            .filter(approval => approval.approval_venue_department_id === record.department_id)
            .map(approval => approval.approval_venue_venue_id);
        
        console.log('Edit mode - Department venues:', departmentVenues);
        console.log('Edit mode - Record object:', record);
        console.log('Edit mode - Department name from record:', record.departments_name);
        console.log('Edit mode - Fetched departments:', fetchedDepartments);
        
        // Find the department name from the fetched departments
        const departmentName = fetchedDepartments.find(dept => dept.departments_id === record.department_id)?.departments_name || 
                              record.departments_name || 
                              'Unknown Department';
        
        console.log('Edit mode - Final department name:', departmentName);
        
        // Set both form values and state - ensure they are synchronized
        setSelectedVenues(departmentVenues);
        form.setFieldsValue({
            department_id: record.department_id,
            venue_ids: departmentVenues // Pre-select existing venues
        });
        
        // Store the department info for display in disabled input
        setCurrentRecord(record);
        setCurrentDepartmentName(departmentName);
        
        // Force form validation to ensure venue_ids field is properly set
        setTimeout(() => {
            form.validateFields(['venue_ids']);
        }, 100);
        
        setShowModal(true);
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Delete Venue Approval',
            content: `Are you sure you want to delete all venue approvals for ${record.departments_name}? This will remove all venues assigned to this department.`,
            icon: <ExclamationCircleOutlined />,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                const url = SecureStorage.getLocalItem("url");
               
                
                try {
                    const response = await axios.post(`${url}Assigned&Records.php`, {
                        operation: 'deleteVenueApproval',
                        approval_id: record.approval_venue_id
                    });
                    
                    if (response.data.status === 'success') {
                        toast.success(response.data.message);
                        fetchVenueApprovals();
                    } else {
                        toast.error(response.data.message || 'Failed to delete venue approval');
                    }
                } catch (error) {
                    console.error('Error deleting venue approval:', error);
                    if (isNetworkError(error)) {
                        toast.error('Network connection lost. Unable to delete venue approval.');
                    } else {
                        toast.error('Error deleting venue approval');
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
            const operation = editMode ? 'updateVenueApproval' : 'addVenueApproval';
            
            // Always use selectedVenues state as the source of truth for venue_ids
            // This ensures all selected venues are included even if form values are out of sync
            const venueIdsToSend = selectedVenues.length > 0 ? selectedVenues : values.venue_ids || [];
            
            console.log('Submitting venue approval:', {
                operation,
                venue_ids: venueIdsToSend,
                department_id: values.department_id,
                selectedVenues,
                formVenueIds: values.venue_ids
            });
            
            const payload = {
                operation,
                venue_ids: venueIdsToSend,
                department_id: values.department_id,
                user_id: parseInt(userId)
            };
            
            if (editMode) {
                payload.approval_id = currentRecord.approval_venue_id;
            }
            
            // Validate that we have venues to assign
            if (!venueIdsToSend || venueIdsToSend.length === 0) {
                toast.error('Please select at least one venue');
                setIsSubmitting(false);
                return;
            }
            
            const response = await axios.post(`${url}Assigned&Records.php`, payload);
            
            if (response.data.status === 'success') {
                toast.success(response.data.message);
                setShowModal(false);
                form.resetFields();
                fetchVenueApprovals();
            } else {
                toast.error(response.data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error submitting venue approval:', error);
            if (isNetworkError(error)) {
                toast.error('Network connection lost. Unable to submit venue approval.');
            } else {
                toast.error('Error submitting venue approval');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalClose = async () => {
        setShowModal(false);
        form.resetFields();
        setCurrentRecord(null);
        setSelectedVenues([]);
        setCurrentDepartmentName('');
        
        // Reset departments to default (available only)
        await fetchDepartments();
        
        // Reset venue filters
        setVenueSearchTerm('');
        setSelectedAreaType('all');
        setShowSelectedOnly(false);
    };

    // Group venues by department for display
    const groupedApprovals = venueApprovals.reduce((acc, approval) => {
        const deptId = approval.approval_venue_department_id;
        if (!acc[deptId]) {
            acc[deptId] = {
                department_id: deptId,
                departments_name: approval.departments_name,
                venues: [],
                updated_by: approval.users_fname + ' ' + approval.users_lname,
                updated_at: approval.updated_at,
                approval_venue_id: approval.approval_venue_id // For edit/delete operations
            };
        }
        acc[deptId].venues.push({
            ven_id: approval.approval_venue_venue_id,
            ven_name: approval.ven_name
        });
        return acc;
    }, {});

    const groupedData = Object.values(groupedApprovals);
    const filteredGroupedData = groupedData.filter(group =>
        !searchTerm || 
        group.departments_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.venues.some(venue => venue.ven_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

    // Filter venues based on search term, area type, and selected venues filter
    const filteredVenues = venues.filter(venue => {
        const matchesSearch = !venueSearchTerm || 
            (venue.ven_name && venue.ven_name.toLowerCase().includes(venueSearchTerm.toLowerCase())) ||
            (venue.event_type && venue.event_type.toLowerCase().includes(venueSearchTerm.toLowerCase()));
        
        const matchesAreaType = selectedAreaType === 'all' || 
            (venue.area_type && venue.area_type.toLowerCase() === selectedAreaType.toLowerCase());
        
        // Filter by selected venues if the toggle is enabled
        const matchesSelectedFilter = !showSelectedOnly || selectedVenues.includes(venue.ven_id);
        
        // In edit mode, always include already selected venues even if they don't match filters
        // This ensures that existing assignments are always visible and included in the payload
        const isAlreadySelected = editMode && selectedVenues.includes(venue.ven_id);
        
        return ((matchesSearch && matchesAreaType && matchesSelectedFilter) || isAlreadySelected);
    });

    // Get unique area types for filter dropdown
    const uniqueAreaTypes = [...new Set(venues.map(venue => venue.area_type).filter(areaType => areaType != null))].sort();

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
                              
                                Venue Approval 
                            </h2>
                        </div>
                    </motion.div>

                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Input
                                    placeholder={isMobile ? "Search..." : "Search by department, venue, or updated by..."}
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
                                    />
                                </Tooltip>
                                <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />}
                                    onClick={handleAdd}
                                    size={isMobile ? "middle" : "large"}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isMobile ? "Add" : "Add Venue Approval"}
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
                                                    key={group.department_id}
                                                    className="mb-3 shadow-sm"
                                                    size="small"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaUniversity className="mr-2 text-green-900" />
                                                                <Text strong className="text-sm">{group.departments_name}</Text>
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
                                                            <Text type="secondary" className="text-xs">Assigned Venues:</Text>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {group.venues.map((venue) => (
                                                                    <span 
                                                                        key={venue.ven_id}
                                                                        className="px-2 py-1 text-xs font-semibold text-white rounded"
                                                                        style={{ backgroundColor: '#145414' }}
                                                                    >
                                                                        {venue.ven_name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <Text type="secondary" className="text-xs">
                                                                {group.venues.length} venue(s) assigned
                                                            </Text>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <Text type="secondary">By: {group.updated_by}</Text>
                                                            <Text type="secondary">
                                                                {new Date(group.updated_at).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
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
                                                            No venue approvals found
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
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('departments_name')}>
                                                        <div className="flex items-center">
                                                            Department
                                                            {sortField === 'departments_name' && (
                                                                <span className="ml-1">
                                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                        <div className="flex items-center">
                                                            Assigned Venues
                                                        </div>
                                                    </th>
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4 cursor-pointer" onClick={() => handleSort('updated_by')}>
                                                            <div className="flex items-center">
                                                                Updated By
                                                                {sortField === 'updated_by' && (
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
                                                    paginatedData.map((group, index) => (
                                                        <tr
                                                            key={group.department_id}
                                                            className="bg-white border-b last:border-b-0 border-gray-200"
                                                        >
                                                            <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                <div className="flex items-center">
                                                                    <FaUniversity className="mr-2 text-green-900" />
                                                                    <span className={`font-medium truncate block ${isTablet ? 'max-w-[100px]' : 'max-w-[140px]'}`}>{group.departments_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {group.venues.map((venue) => (
                                                                        <span 
                                                                            key={venue.ven_id}
                                                                            className="px-2 py-1 text-xs font-semibold text-white rounded"
                                                                            style={{ backgroundColor: '#145414' }}
                                                                        >
                                                                            {venue.ven_name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {group.venues.length} venue(s) assigned
                                                                </div>
                                                            </td>
                                                            {!isTablet && (
                                                                <td className="px-4 py-4">{group.updated_by}</td>
                                                            )}
                                                            <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                {new Date(group.updated_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
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
                                                                        No venue approvals found
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
                    title={editMode ? 'Edit Venue Approval' : 'Add Venue Approval'}
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
                                {editMode ? 'Update Venues' : 'Add'} Venue Approval
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
                        {editMode ? (
                            <>
                                {/* Hidden field to maintain form value */}
                                <Form.Item
                                    name="department_id"
                                    style={{ display: 'none' }}
                                >
                                    <Input type="hidden" />
                                </Form.Item>
                                
                                {/* Display field showing department name */}
                                <Form.Item
                                    label="Department"
                                >
                                    <Input
                                        value={currentDepartmentName}
                                        disabled
                                        style={{ 
                                            backgroundColor: '#f5f5f5',
                                            color: '#666',
                                            cursor: 'not-allowed'
                                        }}
                                    />
                                </Form.Item>
                            </>
                        ) : (
                            <Form.Item
                                name="department_id"
                                label="Department"
                                rules={[
                                    { required: true, message: 'Please select a department' }
                                ]}
                            >
                                <Select
                                    placeholder="Select a department"
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(inputValue, option) =>
                                        option.children.toLowerCase().includes(inputValue.toLowerCase())
                                    }
                                >
                                    {departments.map(dept => (
                                        <Option key={dept.departments_id} value={dept.departments_id}>
                                            {dept.departments_name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                        <Form.Item
                            name="venue_ids"
                            label="Venues"
                            rules={[
                                { required: true, message: 'Please select at least one venue' }
                            ]}
                        >
                            <div className="mb-3">
                                <div className="row g-2">
                                    <div className="col-12 mb-2">
                                        <Input
                                            placeholder="Search venues..."
                                            prefix={<SearchOutlined />}
                                            value={venueSearchTerm}
                                            onChange={(e) => setVenueSearchTerm(e.target.value)}
                                            allowClear
                                        />
                                    </div>
                                    <div className="col-12">
                                        <Select
                                            placeholder="Filter by area type"
                                            value={selectedAreaType}
                                            onChange={setSelectedAreaType}
                                            style={{ width: '100%' }}
                                        >
                                            <Option value="all">All Area Types</Option>
                                            {uniqueAreaTypes.map(areaType => (
                                                <Option key={areaType} value={areaType}>
                                                    {areaType}
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                                <div className="mt-2 d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Showing {filteredVenues.length} of {venues.length} venues
                                        {showSelectedOnly && ` (${selectedVenues.length} selected)`}
                                    </small>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <Button 
                                            size="small" 
                                            type={showSelectedOnly ? "primary" : "default"}
                                            icon={<FilterOutlined />}
                                            onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                                        >
                                            {showSelectedOnly ? "All" : "Selected"}
                                        </Button>
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredVenues.map(v => v.ven_id);
                                                const newValues = [...new Set([...selectedVenues, ...allFilteredIds])];
                                                setSelectedVenues(newValues);
                                                form.setFieldsValue({ venue_ids: newValues });
                                                form.validateFields(['venue_ids']);
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredVenues.map(v => v.ven_id);
                                                const newValues = selectedVenues.filter(id => !allFilteredIds.includes(id));
                                                setSelectedVenues(newValues);
                                                form.setFieldsValue({ venue_ids: newValues });
                                                form.validateFields(['venue_ids']);
                                            }}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <Checkbox.Group 
                                style={{ width: '100%' }}
                                value={selectedVenues}
                                onChange={(checkedValues) => {
                                    setSelectedVenues(checkedValues);
                                    form.setFieldsValue({ venue_ids: checkedValues });
                                    form.validateFields(['venue_ids']);
                                }}
                            >
                                <div className="row" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    {filteredVenues.length === 0 ? (
                                        <div className="col-12 text-center py-4">
                                            <Empty 
                                                description="No venues match your filters"
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            />
                                        </div>
                                    ) : (
                                        filteredVenues.map(venue => {
                                            const isAlreadyAssigned = editMode && currentRecord && 
                                                venueApprovals.some(approval => 
                                                    approval.approval_venue_department_id === currentRecord.department_id && 
                                                    approval.approval_venue_venue_id === venue.ven_id
                                                );
                                            
                                            const matchesSearch = !venueSearchTerm || 
                                                (venue.ven_name && venue.ven_name.toLowerCase().includes(venueSearchTerm.toLowerCase())) ||
                                                (venue.event_type && venue.event_type.toLowerCase().includes(venueSearchTerm.toLowerCase()));
                                            const matchesAreaType = selectedAreaType === 'all' || 
                                                (venue.area_type && venue.area_type.toLowerCase() === selectedAreaType.toLowerCase());
                                            const isShownBecauseSelected = editMode && selectedVenues.includes(venue.ven_id) && !(matchesSearch && matchesAreaType);
                                            
                                            return (
                                                <div key={venue.ven_id} className="col-12 mb-2">
                                                    <Checkbox value={venue.ven_id}>
                                                        <div>
                                                            <strong className="text-sm">{venue.ven_name}</strong>
                                                            {isAlreadyAssigned && (
                                                                <span className="ms-2 px-2 py-1 text-white rounded text-xs font-medium" style={{ fontSize: '10px', backgroundColor: '#145414' }}>
                                                                    Already Assigned
                                                                </span>
                                                            )}
                                                            {isShownBecauseSelected && !isAlreadyAssigned && (
                                                                <span className="ms-2 px-2 py-1 text-white rounded text-xs font-medium" style={{ fontSize: '10px', backgroundColor: '#145414' }}>
                                                                    Selected (Hidden by Filter)
                                                                </span>
                                                            )}
                                                            <br />
                                                            <small className="text-muted text-xs">
                                                                {venue.event_type} • {venue.area_type} • Cap: {venue.ven_occupancy}
                                                            </small>
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
                                message="Edit Venue Assignment"
                                description="Already assigned venues are pre-selected. You can add more venues or uncheck existing ones to remove them. The department cannot be changed in edit mode."
                                type="info"
                                showIcon
                                className="mb-3"
                            />
                        )}
                    </Form>
                </Drawer>
            ) : (
                <Modal
                    title={editMode ? 'Edit Venue Approval' : 'Add Venue Approval'}
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
                            {editMode ? 'Update Venues' : 'Add'} Venue Approval
                        </Button>
                    ]}
                    width={isTablet ? 700 : 800}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {editMode ? (
                            <>
                                {/* Hidden field to maintain form value */}
                                <Form.Item
                                    name="department_id"
                                    style={{ display: 'none' }}
                                >
                                    <Input type="hidden" />
                                </Form.Item>
                                
                                {/* Display field showing department name */}
                                <Form.Item
                                    label="Department"
                                >
                                    <Input
                                        value={currentDepartmentName}
                                        disabled
                                        style={{ 
                                            backgroundColor: '#f5f5f5',
                                            color: '#666',
                                            cursor: 'not-allowed'
                                        }}
                                        onFocus={() => {
                                            console.log('Input focused - currentRecord:', currentRecord);
                                            console.log('Input focused - currentDepartmentName:', currentDepartmentName);
                                            console.log('Input focused - form department_id value:', form.getFieldValue('department_id'));
                                        }}
                                    />
                                </Form.Item>
                            </>
                        ) : (
                            <Form.Item
                                name="department_id"
                                label="Department"
                                rules={[
                                    { required: true, message: 'Please select a department' }
                                ]}
                            >
                                <Select
                                    placeholder="Select a department"
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(inputValue, option) =>
                                        option.children.toLowerCase().includes(inputValue.toLowerCase())
                                    }
                                >
                                    {departments.map(dept => (
                                        <Option key={dept.departments_id} value={dept.departments_id}>
                                            {dept.departments_name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                        <Form.Item
                            name="venue_ids"
                            label="Venues"
                            rules={[
                                { required: true, message: 'Please select at least one venue' }
                            ]}
                        >
                            <div className="mb-3">
                                <div className="row g-2">
                                    <div className={`${isMobile || isTablet ? 'col-12 mb-2' : 'col-md-8'}`}>
                                        <Input
                                            placeholder={isMobile ? "Search venues..." : "Search venues by name or event type..."}
                                            prefix={<SearchOutlined />}
                                            value={venueSearchTerm}
                                            onChange={(e) => setVenueSearchTerm(e.target.value)}
                                            allowClear
                                        />
                                    </div>
                                    <div className={`${isMobile || isTablet ? 'col-12' : 'col-md-4'}`}>
                                        <Select
                                            placeholder="Filter by area type"
                                            value={selectedAreaType}
                                            onChange={setSelectedAreaType}
                                            style={{ width: '100%' }}
                                        >
                                            <Option value="all">All Area Types</Option>
                                            {uniqueAreaTypes.map(areaType => (
                                                <Option key={areaType} value={areaType}>
                                                    {areaType}
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                                <div className="mt-2 d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Showing {filteredVenues.length} of {venues.length} venues
                                        {showSelectedOnly && ` (${selectedVenues.length} selected)`}
                                    </small>
                                    <div className={`d-flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                                        <Button 
                                            size="small" 
                                            type={showSelectedOnly ? "primary" : "default"}
                                            icon={<FilterOutlined />}
                                            onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                                            title={showSelectedOnly ? "Show all venues" : "Show only selected venues"}
                                        >
                                            {showSelectedOnly ? (isMobile ? "All" : "Show All") : (isMobile ? "Selected" : "Selected Only")}
                                        </Button>
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredVenues.map(v => v.ven_id);
                                                const newValues = [...new Set([...selectedVenues, ...allFilteredIds])];
                                                setSelectedVenues(newValues);
                                                form.setFieldsValue({ venue_ids: newValues });
                                                form.validateFields(['venue_ids']);
                                            }}
                                        >
                                            {isMobile ? "Select All" : "Select All Filtered"}
                                        </Button>
                                        <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                                const allFilteredIds = filteredVenues.map(v => v.ven_id);
                                                const newValues = selectedVenues.filter(id => !allFilteredIds.includes(id));
                                                setSelectedVenues(newValues);
                                                form.setFieldsValue({ venue_ids: newValues });
                                                form.validateFields(['venue_ids']);
                                            }}
                                        >
                                            {isMobile ? "Clear All" : "Clear All Filtered"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <Checkbox.Group 
                                style={{ width: '100%' }}
                                value={selectedVenues}
                                onChange={(checkedValues) => {
                                    setSelectedVenues(checkedValues);
                                    form.setFieldsValue({ venue_ids: checkedValues });
                                    form.validateFields(['venue_ids']);
                                }}
                            >
                                <div className="row" style={{ maxHeight: isMobile ? '250px' : '300px', overflowY: 'auto' }}>
                                    {filteredVenues.length === 0 ? (
                                        <div className="col-12 text-center py-4">
                                            <Empty 
                                                description="No venues match your filters"
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            />
                                        </div>
                                    ) : (
                                        filteredVenues.map(venue => {
                                            const isAlreadyAssigned = editMode && currentRecord && 
                                                venueApprovals.some(approval => 
                                                    approval.approval_venue_department_id === currentRecord.department_id && 
                                                    approval.approval_venue_venue_id === venue.ven_id
                                                );
                                            
                                            const matchesSearch = !venueSearchTerm || 
                                                (venue.ven_name && venue.ven_name.toLowerCase().includes(venueSearchTerm.toLowerCase())) ||
                                                (venue.event_type && venue.event_type.toLowerCase().includes(venueSearchTerm.toLowerCase()));
                                            const matchesAreaType = selectedAreaType === 'all' || 
                                                (venue.area_type && venue.area_type.toLowerCase() === selectedAreaType.toLowerCase());
                                            const isShownBecauseSelected = editMode && selectedVenues.includes(venue.ven_id) && !(matchesSearch && matchesAreaType);
                                            
                                            return (
                                                <div key={venue.ven_id} className={`${isMobile ? 'col-12' : 'col-md-6'} mb-2`}>
                                                    <Checkbox value={venue.ven_id}>
                                                        <div>
                                                            <strong className={isMobile ? 'text-sm' : ''}>{venue.ven_name}</strong>
                                                            {isAlreadyAssigned && (
                                                                <span className="ms-2 px-2 py-1 text-white rounded text-xs font-medium" style={{ fontSize: '10px', backgroundColor: '#145414' }}>
                                                                    Already Assigned
                                                                </span>
                                                            )}
                                                            {isShownBecauseSelected && !isAlreadyAssigned && (
                                                                <span className="ms-2 px-2 py-1 text-white rounded text-xs font-medium" style={{ fontSize: '10px', backgroundColor: '#145414' }}>
                                                                    Selected (Hidden by Filter)
                                                                </span>
                                                            )}
                                                            <br />
                                                            <small className={`text-muted ${isMobile ? 'text-xs' : ''}`}>
                                                                {venue.event_type} • {venue.area_type} • Cap: {venue.ven_occupancy}
                                                            </small>
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
                                message="Edit Venue Assignment"
                                description="Already assigned venues are pre-selected. You can add more venues or uncheck existing ones to remove them. The department cannot be changed in edit mode."
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

export default AssignApprovalVenue;