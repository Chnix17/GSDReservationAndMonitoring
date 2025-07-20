import React, { useEffect, useState, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import Sidebar from '../Sidebar';
import { FaCalendarAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput } from '../../utils/sanitize';
import { SecureStorage } from '../../utils/encryption';
import { Button, Tooltip, Modal, Form, Input, Empty, Pagination, Alert, DatePicker } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const Holiday = () => {
    const navigate = useNavigate();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [form] = Form.useForm();
    const baseUrl = SecureStorage.getLocalItem("url");
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        date: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedHolidayId, setSelectedHolidayId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id");
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${baseUrl}user.php`, 
                new URLSearchParams({ operation: 'fetchHoliday' })
            );
            if (response.data.status === 'success') {
                setHolidays(response.data.data);
            } else {
                toast.error(response.data.message || 'Failed to fetch holidays');
            }
        } catch (error) {
            toast.error('Error fetching holidays');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handleArchive = (id) => {
        console.log('Delete clicked for holiday ID:', id);
        setSelectedHolidayId(id);
        setShowConfirmDelete(true);
    };

    const handleEdit = (holiday) => {
        setFormData({
            id: holiday.holiday_id,
            name: holiday.holiday_name,
            date: holiday.holiday_date
        });
        form.setFieldsValue({
            name: holiday.holiday_name,
            date: dayjs(holiday.holiday_date)
        });
        setEditMode(true);
        setShowModal(true);
    };

    const confirmArchive = async () => {
        try {
            const response = await axios.post(`${baseUrl}user.php`, {
                operation: 'deleteHoliday',
                holidayId: selectedHolidayId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.status === 'success') {
                await fetchHolidays();
                toast.success('Holiday deleted successfully!');
            } else {
                toast.error(response.data.message || 'Failed to delete holiday');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error deleting holiday');
        } finally {
            setShowConfirmDelete(false);
        }
    };

    const handleCreate = () => {
        form.resetFields();
        setFormData({
            id: '',
            name: '',
            date: ''
        });
        setEditMode(false);
        setShowModal(true);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const endpoint = editMode 
                ? `${baseUrl}user.php`
                : `${baseUrl}user.php`;
            
            const payload = editMode ? {
                operation: 'updateHoliday',
                holiday_id: formData.id,
                holiday_name: formData.name,
                holiday_date: formData.date
            } : {
                operation: 'saveHoliday',
                holiday_name: formData.name,
                holiday_date: formData.date
         
            };

            console.log(payload);

            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                await fetchHolidays();
                toast.success(`Holiday ${editMode ? 'updated' : 'created'} successfully!`);
                closeModal();
            } else {
                toast.error(response.data.message || `Failed to ${editMode ? 'update' : 'create'} holiday`);
            }
        } catch (error) {
            console.error('Error saving holiday:', error);
            toast.error(`Error ${editMode ? 'updating' : 'creating'} holiday`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        form.resetFields();
        setFormData({
            id: '',
            name: '',
            date: ''
        });
    };

    const handleRefresh = () => {
        fetchHolidays();
        setSearchTerm('');
    };

    const formatDate = (dateString) => {
        return dayjs(dateString).format('MMMM D, YYYY');
    };

    const filteredHolidays = holidays.filter(holiday =>
        holiday.holiday_name && holiday.holiday_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <div className="flex-none">
                <Sidebar />
            </div>
            
            <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 sm:mb-8"
                    >
                        <div className="mb-2 sm:mb-4 mt-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-5 flex items-center">
                                Holiday
                                <Tooltip title="Holidays added here will be reflected on the calendar when users make a reservation.">
                                    <QuestionCircleOutlined className="ml-2 text-gray-500" />
                                </Tooltip>
                            </h2>
                        </div>
                    </motion.div>

                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-row items-center gap-2 w-full">
                            <div className="flex-grow">
                                <Input
                                    placeholder="Search holidays by name"
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size="large"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                onClick={handleCreate}
                                className="bg-lime-900 hover:bg-green-600"
                            >
                                <span className="hidden sm:inline">Add Holiday</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </div>
                    </div>

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
                                                    HOLIDAY NAME
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">DATE</th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center justify-center">
                                                    ACTIONS
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHolidays && filteredHolidays.length > 0 ? (
                                            filteredHolidays
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((holiday) => (
                                                    <tr key={holiday.holiday_id} className="bg-white border-b last:border-b-0 border-gray-200">
                                                        <td className="px-4 py-6">
                                                            <div className="flex items-center">
                                                                <FaCalendarAlt className="mr-2 text-green-900" />
                                                                <span className="font-bold truncate block max-w-[200px]">
                                                                    {holiday.holiday_name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-6 font-medium">
                                                            {formatDate(holiday.holiday_date)}
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <div className="flex justify-center space-x-2">
                                                                <Tooltip title="Edit Holiday">
                                                                    <Button
                                                                        shape="circle"
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEdit(holiday)}
                                                                        size="large"
                                                                        className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Delete Holiday">
                                                                    <Button
                                                                        shape="circle"
                                                                        danger
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => handleArchive(holiday.holiday_id)}
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
                                                <td colSpan={3} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No holidays found
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
                                        total={filteredHolidays ? filteredHolidays.length : 0}
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

            <Modal
                title={<div className="text-xl font-bold mb-4 flex items-center">
                    <FaCalendarAlt className="mr-2 text-green-900" />
                    {editMode ? 'Edit Holiday' : 'Add Holiday'}
                </div>}
                open={showModal}
                onCancel={closeModal}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        label="Holiday Name"
                        name="name"
                        initialValue={formData.name}
                        rules={[
                            { required: true, message: 'Please input holiday name!' }
                        ]}
                    >
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
                            placeholder="Enter holiday name"
                            className="border border-gray-300 rounded px-4 py-2 w-full"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Date"
                        name="date"
                        initialValue={formData.date ? dayjs(formData.date) : null}
                        rules={[
                            { required: true, message: 'Please select date!' }
                        ]}
                    >
                        <DatePicker
                            value={formData.date ? dayjs(formData.date) : null}
                            onChange={(date) => setFormData({ ...formData, date: date ? date.format('YYYY-MM-DD') : '' })}
                            className="w-full"
                        />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSubmitting}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            {isSubmitting ? 'Saving...' : (editMode ? 'Update' : 'Add')} Holiday
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Modal
                title={<div className="text-red-600 flex items-center"><ExclamationCircleOutlined className="mr-2" /> Confirm Delete</div>}
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
                        onClick={confirmArchive}
                        icon={<DeleteOutlined />}
                    >
                        Delete
                    </Button>,
                ]}
            >
                <Alert
                    message="Warning"
                    description="Are you sure you want to delete this holiday? This action cannot be undone."
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>

            <Toaster position="top-right" />
        </div>
    );
};

export default Holiday;
