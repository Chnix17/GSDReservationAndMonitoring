import React, { useEffect, useState, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import Sidebar from '../Sidebar';
import { FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput } from '../../utils/sanitize';
import { SecureStorage } from '../../utils/encryption';
import { Button, Tooltip, Modal, Form, Input, Empty, Pagination, Alert, DatePicker } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
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
                new URLSearchParams({ operation: 'fetchHolday' })
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
                : `${baseUrl}insert_master.php`;
            
            const payload = editMode ? {
                operation: 'updateHoliday',
                holiday_id: formData.id,
                holiday_name: formData.name,
                holiday_date: formData.date
            } : {
                operation: 'saveHoliday',
                data: {
                    holiday_name: formData.name,
                    holiday_date: formData.date,
                    user_admin_id: SecureStorage.getSessionItem("user_id")
                }
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
    };

    const formatDate = (dateString) => {
        return dayjs(dateString).format('MMMM D, YYYY');
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
                            <Button variant="link" onClick={() => navigate('/Master')} className="text-green-800">
                                <FaArrowLeft className="mr-2" /> Back to Master
                            </Button>
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Holiday Management
                            </h2>
                        </div>
                    </motion.div>

                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search holidays"
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
                                    Add Holiday
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
                                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Holiday Name
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">Date</th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Actions
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holidays && holidays.length > 0 ? (
                                            holidays.map((holiday) => (
                                                <tr key={holiday.holiday_id} 
                                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <FaCalendarAlt className="mr-2 text-green-900" />
                                                            <span className="font-medium">
                                                                {holiday.holiday_name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">{formatDate(holiday.holiday_date)}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                type="primary"
                                                                icon={<EditOutlined />}
                                                                onClick={() => handleEdit(holiday)}
                                                                size="middle"
                                                                className="bg-green-900 hover:bg-lime-900"
                                                            />
                                                            <Button
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => handleArchive(holiday.holiday_id)}
                                                                size="middle"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-24 text-center">
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
                                        total={holidays ? holidays.length : 0}
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
