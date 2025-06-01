import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput,  } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import {  Button, Tooltip, Modal, Form, Input, Empty, Pagination, Alert, Select, DatePicker } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const Drivers = () => {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [form] = Form.useForm();
    const baseUrl = SecureStorage.getLocalItem("url");
    const [formData, setFormData] = useState({
        id: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        employeeId: '',
        birthdate: '',
        contactNumber: '',
        address: '',
        isActive: true
    });
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const suffixOptions = ['', 'Jr', 'Sr', 'I', 'II', 'III', 'IV', 'V'];

    useEffect(() => {
        const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id");
        const decryptedUserLevel = parseInt(encryptedUserLevel);
            if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${baseUrl}fetchMaster.php`, 
                new URLSearchParams({ operation: 'fetchDriver' })
            );
            if (response.data.status === 'success') {
                setDrivers(response.data.data);
            } else {
                toast.error(response.data.message || 'Failed to fetch drivers');
            }
        } catch (error) {
            toast.error('Error fetching drivers');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };    const fetchDriverById = async (id) => {
        setLoading(true);
        console.log('Fetching driver with ID:', id);
        // Reset form first
        form.resetFields();
        try {
            const response = await axios.post(`${baseUrl}fetchMaster.php`,
                new URLSearchParams({ 
                    operation: 'fetchDriverById',
                    id: id
                })
            );            if (response.data.status === 'success' && response.data.data.length > 0) {
                const driver = response.data.data[0];
                console.log('Fetched driver data:', driver);
                const formValues = {
                    id: driver.driver_id,
                    firstName: driver.driver_first_name,
                    middleName: driver.driver_middle_name,
                    lastName: driver.driver_last_name,
                    suffix: driver.driver_suffix || '',
                    employeeId: driver.employee_id || '',
                    birthdate: driver.driver_birthdate || '',
                    contactNumber: driver.driver_contact_number,
                    address: driver.driver_address,
                    isActive: driver.is_active === undefined ? true : driver.is_active
                };
                
                // Set form data state
                setFormData(formValues);
                
                // Set form values
                form.setFieldsValue({
                    firstName: formValues.firstName,
                    middleName: formValues.middleName,
                    lastName: formValues.lastName,
                    suffix: formValues.suffix,
                    employeeId: formValues.employeeId,
                    birthdate: formValues.birthdate ? dayjs(formValues.birthdate) : null,
                    contactNumber: formValues.contactNumber,
                    address: formValues.address
                });
                
                setEditMode(true);
                setShowModal(true);
            } else {
                toast.error('Failed to fetch driver details');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error fetching driver details');
        } finally {
            setLoading(false);
        }
    };    const handleEdit = (driver) => {
        console.log('Edit clicked for driver:', driver);
        fetchDriverById(driver.driver_id);
    };

    const handleArchive = (id) => {
        setSelectedDriverId(id);
        setShowConfirmDelete(true);
    };

    const confirmArchive = async () => {
        try {
            const response = await axios.post(`${baseUrl}delete_master.php`, {
                operation: 'archiveUser',
                userType: 'driver',
                userId: selectedDriverId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.status === 'success') {
                await fetchDrivers(); // Refresh the list to show updated status
                toast.success('Driver archived successfully!');
            } else {
                toast.error(response.data.message || 'Failed to archive driver');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error deleting driver');
        } finally {
            setShowConfirmDelete(false);
        }
    };    const handleCreate = () => {
        // Reset form instance first
        form.resetFields();
        setFormData({
            id: '',
            firstName: '',
            middleName: '',
            lastName: '',
            suffix: '',
            employeeId: '',
            birthdate: '',
            contactNumber: '',
            address: '',
            isActive: true
        });
        setEditMode(false);
        setShowModal(true);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const endpoint = editMode 
                ? `${baseUrl}update_master1.php`
                : `${baseUrl}insert_master.php`;
            
            const payload = editMode ? {
                operation: 'updateDriver',
                driverData: {
                    driver_id: formData.id,
                    first_name: formData.firstName,
                    middle_name: formData.middleName,
                    last_name: formData.lastName,
                    suffix: formData.suffix,
                    employee_id: formData.employeeId,
                    birthdate: formData.birthdate,
                    contact_number: formData.contactNumber,
                    address: formData.address,
                    is_active: formData.isActive
                }
            } : {
                operation: 'saveDriver',
                data: {
                    driver_first_name: formData.firstName,
                    driver_middle_name: formData.middleName,
                    driver_last_name: formData.lastName,
                    driver_suffix: formData.suffix,
                    driver_birthdate: formData.birthdate,
                    driver_contact_number: formData.contactNumber,
                    driver_address: formData.address,
                    employee_id: formData.employeeId,
                    user_admin_id: SecureStorage.getSessionItem("user_id"), 
                    is_active: 1
                }
            };

            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                await fetchDrivers(); // Refresh the list
                toast.success(`Driver ${editMode ? 'updated' : 'created'} successfully!`);
                closeModal();
            } else {
                toast.error(response.data.message || `Failed to ${editMode ? 'update' : 'create'} driver`);
            }
        } catch (error) {
            console.error('Error saving driver:', error);
            toast.error(`Error ${editMode ? 'updating' : 'creating'} driver`);
        } finally {
            setIsSubmitting(false);
        }
    };    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        form.resetFields(); // Reset the form instance
        setFormData({
            id: '',
            firstName: '',
            middleName: '',
            lastName: '',
            suffix: '',
            employeeId: '',
            birthdate: '',
            contactNumber: '',
            address: '',
            isActive: true
        });
    };

    const handleRefresh = () => {
        fetchDrivers();
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            {/* Fixed Sidebar */}
            <div className="flex-shrink-0">
                <Sidebar />
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
                <div className="p-[2.5rem] lg:p-12 min-h-screen">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="mb-4 mt-20">
                            <Button variant="link" onClick={() => navigate('/Master')} className="text-green-800">
                                <FaArrowLeft className="mr-2" /> Back to Master
                            </Button>
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Drivers Management
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search drivers by name"
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        size="large"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Tooltip title="Refresh data">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        size="large"
                                    />
                                </Tooltip>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size="large"
                                    onClick={handleCreate}
                                    className="bg-lime-900 hover:bg-green-600"
                                >
                                    Add Driver
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
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
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Full Name
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">Employee ID</th>
                                            <th scope="col" className="px-6 py-3">Birthdate</th>
                                            <th scope="col" className="px-6 py-3">Contact</th>
                                            <th scope="col" className="px-6 py-3">Address</th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Actions
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers && drivers.length > 0 ? (
                                            drivers.map((driver) => (
                                                <tr key={driver.driver_id} 
                                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <FaUser className="mr-2 text-green-900" />
                                                            <span className="font-medium">
                                                                {`${driver.driver_first_name} ${driver.driver_middle_name} ${driver.driver_last_name}${driver.driver_suffix ? ` ${driver.driver_suffix}` : ''}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">{driver.employee_id || '-'}</td>
                                                    <td className="px-6 py-4">{driver.driver_birthdate || '-'}</td>
                                                    <td className="px-6 py-4">{driver.driver_contact_number}</td>
                                                    <td className="px-6 py-4">{driver.driver_address}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                type="primary"
                                                                icon={<EditOutlined />}
                                                                onClick={() => handleEdit(driver)}
                                                                size="middle"
                                                                className="bg-green-900 hover:bg-lime-900"
                                                            />
                                                            <Button
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => handleArchive(driver.driver_id)}
                                                                size="middle"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No drivers found
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
                                        total={drivers ? drivers.length : 0}
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

            {/* Add/Edit Driver Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <FaUser className="mr-2 text-green-900" /> 
                        {editMode ? 'Edit Driver' : 'Add Driver'}
                    </div>
                }
                open={showModal}
                onCancel={closeModal}
                okText={editMode ? 'Update' : 'Add'}
                onOk={handleSave}
                confirmLoading={isSubmitting}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="First Name"
                        name="firstName"
                        initialValue={formData.firstName}
                        rules={[{ required: true, message: 'Please input first name!' }]}
                    >
                        <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: sanitizeInput(e.target.value) })}
                            placeholder="Enter first name"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Middle Name"
                        name="middleName"
                        initialValue={formData.middleName}
                    >
                        <Input
                            value={formData.middleName}
                            onChange={(e) => setFormData({ ...formData, middleName: sanitizeInput(e.target.value) })}
                            placeholder="Enter middle name"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Last Name"
                        name="lastName"
                        initialValue={formData.lastName}
                        rules={[{ required: true, message: 'Please input last name!' }]}
                    >
                        <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: sanitizeInput(e.target.value) })}
                            placeholder="Enter last name"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Suffix"
                        name="suffix"
                        initialValue={formData.suffix}
                    >
                        <Select
                            value={formData.suffix}
                            onChange={(value) => setFormData({ ...formData, suffix: value })}
                        >
                            {suffixOptions.map((suffix) => (
                                <Select.Option key={suffix} value={suffix}>
                                    {suffix || 'None'}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Employee ID"
                        name="employeeId"
                        initialValue={formData.employeeId}
                    >
                        <Input
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: sanitizeInput(e.target.value) })}
                            placeholder="Enter employee ID"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Birthdate"
                        name="birthdate"
                        initialValue={formData.birthdate ? dayjs(formData.birthdate) : null}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            value={formData.birthdate ? dayjs(formData.birthdate) : null}
                            onChange={(date) => setFormData({ ...formData, birthdate: date ? date.format('YYYY-MM-DD') : '' })}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Contact Number"
                        name="contactNumber"
                        initialValue={formData.contactNumber}
                        rules={[{ required: true, message: 'Please input contact number!' }]}
                    >
                        <Input
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({ ...formData, contactNumber: sanitizeInput(e.target.value) })}
                            placeholder="Enter contact number"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Address"
                        name="address"
                        initialValue={formData.address}
                        rules={[{ required: true, message: 'Please input address!' }]}
                    >
                        <Input.TextArea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: sanitizeInput(e.target.value) })}
                            placeholder="Enter address"
                            rows={3}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal
                title={<div className="text-red-600 flex items-center"><ExclamationCircleOutlined className="mr-2" /> Confirm Archive</div>}
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
                        onClick={() => confirmArchive()}
                        icon={<DeleteOutlined />}
                    >
                        Archive
                    </Button>,
                ]}
            >
                <Alert
                    message="Warning"
                    description="Are you sure you want to archive this driver? This action cannot be undone."
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>

            <Toaster position="top-right" />
        </div>
    );
};

export default Drivers;
