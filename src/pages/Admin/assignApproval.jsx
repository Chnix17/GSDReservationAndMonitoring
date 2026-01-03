import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Form, Tooltip, Input, Empty, Pagination, Card, Avatar, Typography, Drawer } from 'antd';
import { toast } from 'sonner';
import Sidebar from '../../components/core/Sidebar';
import { FaUser } from 'react-icons/fa';
import { EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, CloseOutlined, UserOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Tag } from 'primereact/tag';
import { SecureStorage } from '../../utils/encryption';
import { useMediaQuery } from 'react-responsive';

const { Text } = Typography;

const AssignApproval = () => {
    const navigate = useNavigate();
    
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });
    
    const [approvalOrders, setApprovalOrders] = useState([]);
    const [filteredApprovalOrders, setFilteredApprovalOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('approval_order_id');
    const [sortOrder, setSortOrder] = useState('desc');
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
        console.log("this is encryptedUserLevel", encryptedUserLevel);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            navigate('/');
        }
    }, [navigate]);

    const fetchApprovalOrders = useCallback(async () => {
        setLoading(true);
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}Admin.php`, new URLSearchParams({ 
                operation: 'fetchApprovalOrders' 
            }));
            if (response.data.status === 'success') {
                setApprovalOrders(response.data.data);
                setFilteredApprovalOrders(response.data.data);
            } else {
                toast.error('Failed to fetch approval orders');
            }
        } catch (error) {
            console.error('Error fetching approval orders:', error);
            if (!error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                toast.error('Network connection lost. Unable to reach the server. Please check your internet connection.');
            } else {
                toast.error('Error fetching approval orders');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApprovalOrders();
        fetchUsers();
    }, [fetchApprovalOrders]);

    const handleRefresh = () => {
        fetchApprovalOrders();
        setSearchTerm('');
    };

    const fetchUsers = async () => {
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}Admin.php`, new URLSearchParams({ 
                operation: 'fetchAdmin' 
            }));
            if (response.data.status === 'success') {
                setUsers(response.data.data);
                setAvailableUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching admin users:', error);
            if (!error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                toast.error('Network connection lost. Unable to fetch users.');
            }
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (!value.trim()) {
            setFilteredApprovalOrders(approvalOrders);
        } else {
            const filtered = approvalOrders.filter(order => 
                order.user_name?.toLowerCase().includes(value.toLowerCase()) ||
                order.approval_sequence?.toString().includes(value)
            );
            setFilteredApprovalOrders(filtered);
        }
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        
        const sorted = [...filteredApprovalOrders].sort((a, b) => {
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
        
        setFilteredApprovalOrders(sorted);
    };


    const handleEdit = () => {
        // Load all existing approval orders into selectedUsers for editing
        const existingOrders = approvalOrders
            .sort((a, b) => a.approval_sequence - b.approval_sequence)
            .map(order => {
                const user = users.find(u => u.users_id === order.users_id);
                return user ? { ...user, approval_order_id: order.approval_order_id } : null;
            })
            .filter(user => user !== null);
        
        setSelectedUsers(existingOrders);
        setShowModal(true);
    };

    const handleClearAll = () => {
        Modal.confirm({
            title: 'Clear All Approval Orders',
            content: 'Are you sure you want to remove all approval orders? This action cannot be undone.',
            okText: 'Yes, Clear All',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                const url = SecureStorage.getLocalItem("url");
                try {
                    const response = await axios.post(`${url}Admin.php`, {
                        operation: 'deleteAllApprovalOrders'
                    });
                    
                    if (response.data.status === 'success') {
                        toast.success(response.data.message);
                        fetchApprovalOrders();
                    } else {
                        toast.error(response.data.message || 'Failed to clear approval orders');
                    }
                } catch (error) {
                    console.error('Error clearing approval orders:', error);
                    if (!error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                        toast.error('Network connection lost. Unable to clear approval orders.');
                    } else {
                        toast.error('Error clearing approval orders');
                    }
                }
            }
        });
    };

    const handleDelete = (orderId) => {
        Modal.confirm({
            title: 'Delete Approval Order',
            content: 'Are you sure you want to delete this approval order?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                const url = SecureStorage.getLocalItem("url");
                try {
                    const response = await axios.post(`${url}Admin.php`, new URLSearchParams({
                        operation: 'deleteApprovalOrder',
                        approval_order_id: orderId
                    }));
                    
                    if (response.data.status === 'success') {
                        toast.success('Approval order deleted successfully');
                        fetchApprovalOrders();
                    } else {
                        toast.error(response.data.message || 'Failed to delete approval order');
                    }
                } catch (error) {
                    console.error('Error deleting approval order:', error);
                    if (!error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                        toast.error('Network connection lost. Unable to delete approval order.');
                    } else {
                        toast.error('Error deleting approval order');
                    }
                }
            }
        });
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const url = SecureStorage.getLocalItem("url");
            
            // Only edit mode is supported now
            const approvalOrdersData = selectedUsers.map((user, index) => ({
                users_id: user.users_id,
                approval_sequence: index + 1
            }));

            const response = await axios.post(`${url}Admin.php`, {
                operation: 'updateAllApprovalOrders',
                approval_orders: approvalOrdersData
            });
            
            if (response.data.status === 'success') {
                toast.success(response.data.message);
                setShowModal(false);
                fetchApprovalOrders();
                setSelectedUsers([]);
            } else {
                toast.error(response.data.message || 'Failed to update approval orders');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            if (!error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                toast.error('Network connection lost. Unable to update approval orders.');
            } else {
                toast.error('Error submitting approval orders');
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    // Add user to selected list
    const handleAddUser = (userId) => {
        const user = availableUsers.find(u => u.users_id === userId);
        if (user && !selectedUsers.find(u => u.users_id === userId)) {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    // Remove user from selected list
    const handleRemoveUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u.users_id !== userId));
    };

    // Move user up in the list
    const handleMoveUp = (index) => {
        if (index > 0) {
            const newUsers = [...selectedUsers];
            [newUsers[index - 1], newUsers[index]] = [newUsers[index], newUsers[index - 1]];
            setSelectedUsers(newUsers);
        }
    };

    // Move user down in the list
    const handleMoveDown = (index) => {
        if (index < selectedUsers.length - 1) {
            const newUsers = [...selectedUsers];
            [newUsers[index], newUsers[index + 1]] = [newUsers[index + 1], newUsers[index]];
            setSelectedUsers(newUsers);
        }
    };

    const [form] = Form.useForm();


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
                              
                                Approval Order
                            </h2>
                        </div>
                    </motion.div>

                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Input
                                    placeholder={isMobile ? "Search..." : "Search approval orders..."}
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-wrap gap-2' : 'gap-2'}`}>
                                <Tooltip title="Refresh data">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        size={isMobile ? "middle" : "large"}
                                        className={isMobile ? 'w-full' : ''}
                                    >
                                        {isMobile && 'Refresh'}
                                    </Button>
                                </Tooltip>
                              
                                <Button 
                                    type="primary" 
                                    icon={<EditOutlined />} 
                                    onClick={handleEdit}
                                    size={isMobile ? "middle" : "large"}
                                    className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'w-full' : ''}`}
                                >
                                    {isMobile ? 'Edit Orders' : 'Edit All Orders'}
                                </Button>
                                <Button 
                                    danger
                                    icon={<DeleteOutlined />} 
                                    onClick={handleClearAll}
                                    size={isMobile ? "middle" : "large"}
                                    className={isMobile ? 'w-full' : ''}
                                >
                                    {isMobile ? 'Clear All' : 'Clear All Orders'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className={`relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100`}>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                {isMobile ? (
                                    // Mobile Card View
                                    <div className="space-y-3 p-3">
                                        {filteredApprovalOrders && filteredApprovalOrders.length > 0 ? (
                                            filteredApprovalOrders
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((order) => (
                                                    <Card
                                                        key={order.approval_order_id}
                                                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                                                        size="small"
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <FaUser className="text-green-900 text-sm" />
                                                                    <span className="font-medium text-sm truncate max-w-[150px]">
                                                                        {order.user_name}
                                                                    </span>
                                                                </div>
                                                                <Button
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => handleDelete(order.approval_order_id)}
                                                                    size="small"
                                                                />
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs text-gray-500">Sequence:</span>
                                                                <Tag 
                                                                    value={order.approval_sequence}
                                                                    severity="info"
                                                                    className="px-2 py-1 text-xs font-semibold"
                                                                />
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                <span className="font-medium">Department: </span>
                                                                {order.departments_name || 'Not Specified'}
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
                                                            No approval orders found
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
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('user_name')}>
                                                        <div className="flex items-center">
                                                            User
                                                            {sortField === 'user_name' && (
                                                                <span className="ml-1">
                                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('approval_sequence')}>
                                                        <div className="flex items-center">
                                                            Sequence
                                                            {sortField === 'approval_sequence' && (
                                                                <span className="ml-1">
                                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4">
                                                            <div className="flex items-center">
                                                                Department
                                                            </div>
                                                        </th>
                                                    )}
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                        <div className="flex items-center justify-center">
                                                            Actions
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredApprovalOrders && filteredApprovalOrders.length > 0 ? (
                                                    filteredApprovalOrders
                                                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                        .map((order) => (
                                                            <tr
                                                                key={order.approval_order_id}
                                                                className="bg-white border-b last:border-b-0 border-gray-200"
                                                            >
                                                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                    <div className="flex items-center">
                                                                        <FaUser className="mr-2 text-green-900" />
                                                                        <span className={`font-medium truncate block ${isTablet ? 'max-w-[100px]' : 'max-w-[140px]'}`}>
                                                                            {order.user_name}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                    <Tag 
                                                                        value={order.approval_sequence}
                                                                        severity="info"
                                                                        className="px-2 py-1 text-xs font-semibold"
                                                                    />
                                                                </td>
                                                                {!isTablet && (
                                                                    <td className="px-4 py-4">
                                                                        {order.departments_name || 'Not Specified'}
                                                                    </td>
                                                                )}
                                                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                                    <div className="flex space-x-2 justify-center">
                                                                        <Button
                                                                            danger
                                                                            icon={<DeleteOutlined />}
                                                                            onClick={() => handleDelete(order.approval_order_id)}
                                                                            size={isTablet ? "small" : "middle"}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={isTablet ? 3 : 4} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                                            <Empty
                                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                description={
                                                                    <span className="text-gray-500 dark:text-gray-400">
                                                                        No approval orders found
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
                                        total={filteredApprovalOrders ? filteredApprovalOrders.length : 0}
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

            {/* Edit Modal/Drawer */}
            {isMobile ? (
                <Drawer
                    title="Edit Approval Orders"
                    placement="bottom"
                    height="90%"
                    open={showModal}
                    onClose={() => {
                        setShowModal(false);
                        form.resetFields();
                        setSelectedUsers([]);
                    }}
                    footer={
                        <div className="flex flex-col gap-2 p-4 border-t">
                            <Button
                                type="primary"
                                loading={isSubmitting}
                                onClick={handleSubmit}
                                className="bg-green-600 hover:bg-green-700 border-green-600 w-full"
                                size="large"
                            >
                                Update {selectedUsers.length} Order{selectedUsers.length !== 1 ? 's' : ''}
                            </Button>
                            <Button 
                                onClick={() => {
                                    setShowModal(false);
                                    form.resetFields();
                                    setSelectedUsers([]);
                                }}
                                size="large"
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    }
                >
                    <div className={`${isMobile ? 'flex flex-col gap-4' : isTablet ? 'flex flex-col gap-4' : 'flex gap-5'} ${isMobile ? 'h-auto' : isTablet ? 'h-[400px]' : 'h-[500px]'}`}>
                        {/* Available Users */}
                        <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'}`}>
                            <Text strong className="block mb-3">
                                Available Users
                            </Text>
                            <div className={`border border-gray-300 rounded-md p-3 ${isMobile ? 'h-[200px]' : isTablet ? 'h-[150px]' : 'h-[450px]'} overflow-y-auto bg-gray-50`}>
                                {availableUsers
                                    .filter(user => !selectedUsers.find(su => su.users_id === user.users_id))
                                    .map(user => (
                                    <Card
                                        key={user.users_id}
                                        size="small"
                                        className="mb-2 cursor-pointer transition-all duration-300 hover:shadow-md"
                                        hoverable
                                        onClick={() => handleAddUser(user.users_id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar 
                                                size={isMobile ? "small" : "small"} 
                                                icon={<UserOutlined />}
                                                src={user.users_pic ? `/gsd-reservation/uploads/profile/${user.users_pic}` : null}
                                            />
                                            <div className="flex-1">
                                                <Text strong className={isMobile ? 'text-sm' : ''}>{user.full_name}</Text>
                                                <br />
                                                <Text type="secondary" className={`${isMobile ? 'text-xs' : 'text-xs'}`}>
                                                    Administrator
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {availableUsers.filter(user => !selectedUsers.find(su => su.users_id === user.users_id)).length === 0 && (
                                    <Empty 
                                        description="All users have been added" 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Selected Users with Up/Down Buttons */}
                        <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'}`}>
                            <Text strong className="block mb-3">
                                Approval Order ({selectedUsers.length} users)
                            </Text>
                            <div className={`border border-gray-300 rounded-md p-3 ${isMobile ? 'h-[200px]' : isTablet ? 'h-[150px]' : 'h-[450px]'} overflow-y-auto bg-green-50`}>
                                {selectedUsers.map((user, index) => (
                                    <Card
                                        key={`selected-${user.users_id}`}
                                        size="small"
                                        className="mb-2 bg-white"
                                    >
                                        <div className="flex items-center gap-2">
                                            {!isMobile && (
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<UpOutlined />}
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                        className={`p-1 h-5 w-5 ${index === 0 ? 'text-gray-300' : 'text-blue-500'}`}
                                                    />
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<DownOutlined />}
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === selectedUsers.length - 1}
                                                        className={`p-1 h-5 w-5 ${index === selectedUsers.length - 1 ? 'text-gray-300' : 'text-blue-500'}`}
                                                    />
                                                </div>
                                            )}
                                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <Avatar 
                                                size="small" 
                                                icon={<UserOutlined />}
                                                src={user.users_pic ? `/gsd-reservation/uploads/profile/${user.users_pic}` : null}
                                            />
                                            <div className="flex-1">
                                                <Text strong className={isMobile ? 'text-sm' : ''}>{user.full_name}</Text>
                                                <br />
                                                <Text type="secondary" className="text-xs">
                                                    Administrator
                                                </Text>
                                            </div>
                                            {isMobile && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<UpOutlined />}
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                        className={`p-1 h-6 w-6 ${index === 0 ? 'text-gray-300' : 'text-blue-500'}`}
                                                    />
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<DownOutlined />}
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === selectedUsers.length - 1}
                                                        className={`p-1 h-6 w-6 ${index === selectedUsers.length - 1 ? 'text-gray-300' : 'text-blue-500'}`}
                                                    />
                                                </div>
                                            )}
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<CloseOutlined />}
                                                onClick={() => handleRemoveUser(user.users_id)}
                                                className="text-red-500 hover:text-red-700"
                                            />
                                        </div>
                                    </Card>
                                ))}
                                {selectedUsers.length === 0 && (
                                    <Empty 
                                        description="Click users to add them here" 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </Drawer>
            ) : (
                <Modal
                    title="Edit Approval Orders"
                    open={showModal}
                    onCancel={() => {
                        setShowModal(false);
                        form.resetFields();
                        setSelectedUsers([]);
                    }}
                    footer={[
                        <Button key="cancel" onClick={() => {
                            setShowModal(false);
                            form.resetFields();
                            setSelectedUsers([]);
                        }}>
                            Cancel
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={isSubmitting}
                            onClick={handleSubmit}
                            className="bg-green-600 hover:bg-green-700 border-green-600"
                        >
                            Update {selectedUsers.length} Order{selectedUsers.length !== 1 ? 's' : ''}
                        </Button>
                    ]}
                    width={isTablet ? 700 : 800}
                >
                    <div className={`${isMobile ? 'flex flex-col gap-4' : isTablet ? 'flex flex-col gap-4' : 'flex gap-5'} ${isMobile ? 'h-auto' : isTablet ? 'h-[400px]' : 'h-[500px]'}`}>
                        {/* Available Users */}
                        <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'}`}>
                            <Text strong className="block mb-3">
                                Available Users
                            </Text>
                            <div className={`border border-gray-300 rounded-md p-3 ${isMobile ? 'h-[200px]' : isTablet ? 'h-[150px]' : 'h-[450px]'} overflow-y-auto bg-gray-50`}>
                                {availableUsers
                                    .filter(user => !selectedUsers.find(su => su.users_id === user.users_id))
                                    .map(user => (
                                    <Card
                                        key={user.users_id}
                                        size="small"
                                        className="mb-2 cursor-pointer transition-all duration-300 hover:shadow-md"
                                        hoverable
                                        onClick={() => handleAddUser(user.users_id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar 
                                                size={isMobile ? "small" : "small"} 
                                                icon={<UserOutlined />}
                                                src={user.users_pic ? `/gsd-reservation/uploads/profile/${user.users_pic}` : null}
                                            />
                                            <div className="flex-1">
                                                <Text strong className={isMobile ? 'text-sm' : ''}>{user.full_name}</Text>
                                                <br />
                                                <Text type="secondary" className={`${isMobile ? 'text-xs' : 'text-xs'}`}>
                                                    Administrator
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {availableUsers.filter(user => !selectedUsers.find(su => su.users_id === user.users_id)).length === 0 && (
                                    <Empty 
                                        description="All users have been added" 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Selected Users with Up/Down Buttons */}
                        <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'}`}>
                            <Text strong className="block mb-3">
                                Approval Order ({selectedUsers.length} users)
                            </Text>
                            <div className={`border border-gray-300 rounded-md p-3 ${isMobile ? 'h-[200px]' : isTablet ? 'h-[150px]' : 'h-[450px]'} overflow-y-auto bg-green-50`}>
                                {selectedUsers.map((user, index) => (
                                    <Card
                                        key={`selected-${user.users_id}`}
                                        size="small"
                                        className="mb-2 bg-white"
                                    >
                                        <div className="flex items-center gap-2">
                                            {!isMobile && (
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<UpOutlined />}
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                        className={`p-1 h-5 w-5 ${index === 0 ? 'text-gray-300' : 'text-blue-500'}`}
                                                    />
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<DownOutlined />}
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === selectedUsers.length - 1}
                                                        className={`p-1 h-5 w-5 ${index === selectedUsers.length - 1 ? 'text-gray-300' : 'text-blue-500'}`}
                                                    />
                                                </div>
                                            )}
                                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <Avatar 
                                                size="small" 
                                                icon={<UserOutlined />}
                                                src={user.users_pic ? `/gsd-reservation/uploads/profile/${user.users_pic}` : null}
                                            />
                                            <div className="flex-1">
                                                <Text strong className={isMobile ? 'text-sm' : ''}>{user.full_name}</Text>
                                                <br />
                                                <Text type="secondary" className="text-xs">
                                                    Administrator
                                                </Text>
                                            </div>
                                            {isMobile && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<UpOutlined />}
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                        className={`p-1 h-6 w-6 ${index === 0 ? 'text-gray-300' : 'text-blue-500'}`}
                                                    />
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<DownOutlined />}
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === selectedUsers.length - 1}
                                                        className={`p-1 h-6 w-6 ${index === selectedUsers.length - 1 ? 'text-gray-300' : 'text-blue-500'}`}
                                                    />
                                                </div>
                                            )}
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<CloseOutlined />}
                                                onClick={() => handleRemoveUser(user.users_id)}
                                                className="text-red-500 hover:text-red-700"
                                            />
                                        </div>
                                    </Card>
                                ))}
                                {selectedUsers.length === 0 && (
                                    <Empty 
                                        description="Click users to add them here" 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AssignApproval;