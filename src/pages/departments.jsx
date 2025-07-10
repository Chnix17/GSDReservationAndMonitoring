import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Tooltip, Input, Empty, Pagination, Alert } from 'antd';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import {   FaBuilding } from 'react-icons/fa';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';

const Departments = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ id: '', name: '' });
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('departments_id');
    const [sortOrder, setSortOrder] = useState('desc');


    useEffect(() => {
          const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
          const decryptedUserLevel = parseInt(encryptedUserLevel);
          console.log("this is encryptedUserLevel", encryptedUserLevel);
            if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
              localStorage.clear();
              navigate('/gsd');
          }
      }, [navigate]);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}fetchMaster.php`, new URLSearchParams({ operation: 'fetchDepartments' }));
            if (response.data.status === 'success') {
                setDepartments(response.data.data);
                setFilteredDepartments(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Error fetching departments');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        const departmentToEdit = departments.find((dept) => dept.departments_id === id);
        if (departmentToEdit) {
            setFormData({ id: departmentToEdit.departments_id, name: departmentToEdit.departments_name });
            setEditMode(true);
            setShowModal(true);
        }
    };

    const handleDelete = (id) => {
        setSelectedDepartmentId(id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        const url = SecureStorage.getLocalItem("url");
        try {
            const response = await axios.post(`${url}delete_master.php`, {
                operation: 'deleteDepartment',
                departmentId: selectedDepartmentId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.status === 'success') {
                setDepartments(departments.filter(dept => dept.departments_id !== selectedDepartmentId));
                setFilteredDepartments(filteredDepartments.filter(dept => dept.departments_id !== selectedDepartmentId));
                toast.success('Department deleted successfully!');
            } else {
                toast.error(response.data.message || 'Failed to delete department.');
            }
        } catch (error) {
            toast.error('Error deleting department.');
        } finally {
            setShowConfirmDelete(false);
        }
    };

    const handleSave = async () => {
        const sanitizedName = sanitizeInput(formData.name);
        if (!sanitizedName.trim()) {
            toast.error("Please enter a department name.");
            return;
        }
        
        if (!validateInput(sanitizedName)) {
            toast.error("Invalid characters in department name.");
            return;
        }

        setIsSubmitting(true);
        const url = SecureStorage.getLocalItem("url");
        try {
            const endpoint = editMode ? 'update_master1.php' : 'vehicle_master.php';
            const operation = editMode ? 'updateDepartment' : 'saveDepartmentData';
            const payload = editMode ? 
                { operation, id: formData.id, name: sanitizedName.trim() } :
                { operation, json: { departments_name: sanitizedName.trim() } };
            
            console.log('Sending payload:', payload); // Debug log
            
            const response = await axios.post(`${url}${endpoint}`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response received:', response.data); // Debug log

            if (response.data.status === 'success') {
                if (editMode) {
                    setDepartments(departments.map(dept => 
                        dept.departments_id === formData.id ? { ...dept, departments_name: sanitizedName.trim() } : dept
                    ));
                    setFilteredDepartments(filteredDepartments.map(dept => 
                        dept.departments_id === formData.id ? { ...dept, departments_name: sanitizedName.trim() } : dept
                    ));
                    toast.success('Department updated successfully!');
                } else {
                    // Check if response.data.data exists
                    const newDepartment = {
                        departments_id: response.data.data?.departments_id || Date.now().toString(), // Fallback ID if not provided
                        departments_name: sanitizedName.trim()
                    };
                    setDepartments(prevDepartments => [...prevDepartments, newDepartment]);
                    setFilteredDepartments(prevFiltered => [...prevFiltered, newDepartment]);
                    toast.success('Department added successfully!');
                }
                closeModal();
            } else {
                toast.error(response.data.message || `Failed to ${editMode ? 'update' : 'add'} department.`);
            }
        } catch (error) {
            console.error('Error saving department:', error.response || error); // Enhanced error logging
            toast.error(error.response?.data?.message || `Error ${editMode ? 'updating' : 'adding'} department.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setFormData({ id: '', name: '' });
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        const results = departments.filter(dept =>
            dept.departments_name.toLowerCase().includes(searchTerm)
        );
        setFilteredDepartments(results);
    };

    const handleAddDepartment = () => {
        setFormData({ id: '', name: '' });
        setEditMode(false);
        setShowModal(true);
    };

    const handleRefresh = () => {
        fetchDepartments();
        setSearchTerm('');
    };
    
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            {/* Fixed Sidebar */}
            <div className="flex-none">
                <Sidebar />
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 sm:mb-8"
                    >
                        <div className="mb-2 sm:mb-4 mt-10">
                            {/* <Button variant="link" onClick={() => navigate('/Master')} className="text-green-800">
                                <FaArrowLeft className="mr-2" /> Back to Master
                            </Button> */}
                            <h2 className="text-xl sm:tex5t-2xl font-bold text-green-900 mt-5">
                                Department
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-row items-center gap-2 w-full">
                            <div className="flex-grow">
                                <Input
                                    placeholder="Search departments by name"
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size="large"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full"
                                />
                            </div>
                            <Tooltip title="Refresh data">
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={handleRefresh}
                                    size="large"
                                    style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                />
                            </Tooltip>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="large"
                                onClick={handleAddDepartment}
                                className="bg-lime-900 hover:bg-green-600"
                            >
                                <span className="hidden sm:inline">Add Department</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
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
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('departments_name')}>
                                                <div className="flex items-center cursor-pointer">
                                                    DEPARTMENT NAME
                                                    {sortField === 'departments_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    ACTIONS
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDepartments && filteredDepartments.length > 0 ? (
                                            filteredDepartments
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((department) => (
                                                    <tr key={department.departments_id} className="bg-white border-b last:border-b-0 border-gray-200">
                                                        <td className="px-4 py-6">
                                                            <div className="flex items-center">
                                                                <FaBuilding className="mr-2 text-green-900" />
                                                                <span className="font-bold truncate block max-w-[140px]">{department.departments_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <div className="flex justify-center space-x-2">
                                                                <Tooltip title="Edit Department">
                                                                    <Button
                                                                        shape="circle"
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEdit(department.departments_id)}
                                                                        size="large"
                                                                        className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Delete Department">
                                                                    <Button
                                                                        shape="circle"
                                                                        danger
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => handleDelete(department.departments_id)}
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
                                                <td colSpan={2} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No departments found
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
                                        total={filteredDepartments ? filteredDepartments.length : 0}
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

            {/* Add/Edit Department Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <FaBuilding className="mr-2 text-green-900" /> 
                        {editMode ? 'Edit Department' : 'Add Department'}
                    </div>
                }
                open={showModal}
                onCancel={closeModal}
                okText={editMode ? 'Update' : 'Add'}
                onOk={handleSave}
                confirmLoading={isSubmitting}
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Department Name"
                        required
                        tooltip="Enter the department name"
                    >
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
                            placeholder="Enter department name"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal
                title={<div className="text-red-600 flex items-center"><ExclamationCircleOutlined className="mr-2" /> Confirm Deletion</div>}
                open={showConfirmDelete}
                onCancel={() => setShowConfirmDelete(false)}
                footer={[
                    <Button key="back" onClick={() => setShowConfirmDelete(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={loading}
                        onClick={confirmDelete}
                        icon={<DeleteOutlined />}
                    >
                        Delete
                    </Button>,
                ]}
            >
                <Alert
                    message="Warning"
                    description="Are you sure you want to delete this department? This action cannot be undone."
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>

            <Toaster position="top-right" />
        </div>
    );
};

export default Departments;