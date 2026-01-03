import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Sidebar from '../../components/core/Sidebar';
import { FaCalendarAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput } from '../../utils/sanitize';
import { SecureStorage } from '../../utils/encryption';
import { Button, Tooltip, Modal, Form, Input, Empty, Pagination, DatePicker, Card, Drawer, Alert } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import dayjs from 'dayjs';

const Holiday = () => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

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
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [outdatedHolidays, setOutdatedHolidays] = useState([]);
    const lastSubmitTime = React.useRef(0);

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
            localStorage.clear();
            navigate('/');
        }
    }, [navigate]);

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${baseUrl}Admin.php`, 
                new URLSearchParams({ operation: 'fetchHoliday' })
            );
            if (response.data.status === 'success') {
                const holidayData = response.data.data;
                setHolidays(holidayData);
                
                // Check for outdated holidays (previous years)
                const currentYear = dayjs().year();
                const outdated = holidayData.filter(holiday => 
                    dayjs(holiday.holiday_date).year() < currentYear
                );
                setOutdatedHolidays(outdated);
            } else {
                toast.error(response.data.message || 'Failed to fetch holidays');
            }
        } catch (error) {
            if (error.code === 'ERR_NETWORK' || !error.response) {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                toast.error('Error fetching holidays');
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

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

    const handleAdd = () => {
        form.resetFields();
        setFormData({
            id: '',
            name: '',
            date: ''
        });
        setEditMode(false);
        setShowModal(true);
    };

    // const handleCreate = () => {
    //     form.resetFields();
    //     setFormData({
    //         id: '',
    //         name: '',
    //         date: ''
    //     });
    //     setEditMode(false);
    //     setShowModal(true);
    // };

    const handleCreate = async () => {
        // Prevent double submission with timestamp check (within 1 second)
        const now = Date.now();
        if (isSubmitting || now - lastSubmitTime.current < 1000) return;
        lastSubmitTime.current = now;
        
        try {
            // First validate the form fields
            await form.validateFields();
            
            setIsSubmitting(true);
            
            const endpoint = `${baseUrl}Admin.php`;
            
            const userId =
                SecureStorage.getSessionItem('user_id') ||
                SecureStorage.getLocalItem('user_id') || null;

            const payload = {
                operation: 'saveHoliday',
                holiday_name: formData.name,
                holiday_date: formData.date,
                userid: userId
            };

            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                toast.success('Holiday created successfully!');
                closeModal();
                await fetchHolidays();
            } else {
                toast.error(response.data.message || 'Failed to create holiday');
            }
        } catch (error) {
            if (error.errorFields) {
                // Form validation error - don't show toast as Antd will show field errors
                return;
            }
            if (error.code === 'ERR_NETWORK' || !error.response) {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                toast.error('Error creating holiday');
            }
            console.error('Error creating holiday:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        // Prevent double submission with timestamp check (within 1 second)
        const now = Date.now();
        if (isSubmitting || now - lastSubmitTime.current < 1000) return;
        lastSubmitTime.current = now;
        
        try {
            // First validate the form fields
            await form.validateFields();
            
            setIsSubmitting(true);
            
            const endpoint = `${baseUrl}Admin.php`;
            
            const userId =
                SecureStorage.getSessionItem('user_id') ||
                SecureStorage.getLocalItem('user_id') || null;

            const payload = {
                operation: 'updateHoliday',
                holiday_id: formData.id,
                holiday_name: formData.name,
                holiday_date: formData.date,
                userid: userId
            };

            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                toast.success('Holiday updated successfully!');
                closeModal();
                await fetchHolidays();
            } else {
                toast.error(response.data.message || 'Failed to update holiday');
            }
        } catch (error) {
            if (error.errorFields) {
                // Form validation error - don't show toast as Antd will show field errors
                return;
            }
            if (error.code === 'ERR_NETWORK' || !error.response) {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                toast.error('Error updating holiday');
            }
            console.error('Error updating holiday:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setFormData({ id: '', name: '', date: '' });
        form.resetFields();
    };

    const handleDeactivate = async (id) => {
        Modal.confirm({
            title: 'Deactivate Holiday',
            content: 'Are you sure you want to deactivate this holiday? It will be moved to the archive.',
            okText: 'Yes, Deactivate',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;
                    const response = await axios.post(`${baseUrl}Admin.php`, {
                        operation: 'archiveCatalogItem',
                        itemType: 'holiday',
                        itemId: id,
                        userid: userId
                    });

                    if (response.data.status === 'success') {
                        toast.success('Holiday deactivated successfully!');
                        fetchHolidays();
                    } else {
                        toast.error(response.data.message || 'Failed to deactivate holiday.');
                    }
                } catch (error) {
                    if (error.code === 'ERR_NETWORK' || !error.response) {
                        toast.error('Network connection lost. Please check your internet connection and try again.');
                    } else {
                        toast.error('Error deactivating holiday.');
                    }
                    console.error('Error deactivating holiday:', error);
                }
            },
        });
    };

    const handleRefresh = () => {
        fetchHolidays();
        setSearchTerm('');
    };

    const formatDate = (dateString) => {
        return dayjs(dateString).format('MMMM D, YYYY');
    };

    const isOutdated = (dateString) => {
        const currentYear = dayjs().year();
        return dayjs(dateString).year() < currentYear;
    };

    const filteredHolidays = holidays.filter(holiday =>
        holiday.holiday_name && holiday.holiday_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <div className="flex-shrink-0">
                <Sidebar />
            </div>
            
            <div className={`flex-grow overflow-y-auto`}>
                <div className={`${isMobile ? 'px-4 py-4 mt-15' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`${isMobile ? 'mb-3' : 'mb-4'}`}
                    >
                        <div className="mb-2 sm:mb-4 mt-mt-10">
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Holiday Management
                            </h2>
                        </div>
                    </motion.div>

                    {/* Outdated Holidays Warning */}
                    {outdatedHolidays.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className={isMobile ? 'mb-4' : 'mb-5'}
                        >
                            <Alert
                                message="Outdated Holidays Detected"
                                description={
                                    <>
                                        <p className="mb-2">
                                            Found {outdatedHolidays.length} holiday{outdatedHolidays.length > 1 ? 's' : ''} from previous year{outdatedHolidays.length > 1 ? 's' : ''}. 
                                            Please update or remove outdated holidays to keep the system current.
                                        </p>
                                        <div className="text-xs text-gray-600">
                                            {outdatedHolidays.slice(0, 3).map((h, idx) => (
                                                <div key={idx}>&bull; {h.holiday_name} - {formatDate(h.holiday_date)}</div>
                                            ))}
                                            {outdatedHolidays.length > 3 && (
                                                <div>&bull; ... and {outdatedHolidays.length - 3} more</div>
                                            )}
                                        </div>
                                    </>
                                }
                                type="warning"
                                icon={<ExclamationCircleOutlined />}
                                showIcon
                                closable
                            />
                        </motion.div>
                    )}

                    {/* Search & Controls */}
                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Input
                                    placeholder={isMobile ? "Search..." : "Search holidays by name"}
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                    icon={<PlusOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    onClick={handleAdd}
                                    className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                                >
                                    {isMobile ? 'Add Holiday' : 'Add Holiday'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100" style={{ minWidth: '100%' }}>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                {isMobile ? (
                                    // Mobile Card View
                                    <div className="space-y-3 p-3">
                                        {filteredHolidays && filteredHolidays.length > 0 ? (
                                            filteredHolidays
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((holiday) => (
                                                    <Card
                                                        key={holiday.holiday_id}
                                                        className={`border rounded-lg shadow-sm ${
                                                            isOutdated(holiday.holiday_date) 
                                                                ? 'bg-orange-50 border-orange-300' 
                                                                : 'bg-white border-gray-200'
                                                        }`}
                                                        size="small"
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <FaCalendarAlt className={`text-sm ${
                                                                        isOutdated(holiday.holiday_date) 
                                                                            ? 'text-orange-600' 
                                                                            : 'text-green-900'
                                                                    }`} />
                                                                    <span className="font-medium text-sm truncate max-w-[150px]">
                                                                        {holiday.holiday_name}
                                                                    </span>
                                                                    {isOutdated(holiday.holiday_date) && (
                                                                        <span className="text-xs px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full">
                                                                            Outdated
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        size="small"
                                                                        type="primary"
                                                                        className="bg-green-900 hover:bg-lime-900"
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEdit(holiday)}
                                                                    />
                                                                    <Button
                                                                        size="small"
                                                                        danger
                                                                        icon={<StopOutlined />}
                                                                        onClick={() => handleDeactivate(holiday.holiday_id)}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                <span className="font-medium">Date: </span>
                                                                {formatDate(holiday.holiday_date)}
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
                                                            No holidays found
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
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                        <div className="flex items-center">
                                                            HOLIDAY NAME
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>DATE</th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
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
                                                            <tr key={holiday.holiday_id} className={`border-b last:border-b-0 border-gray-200 ${
                                                                isOutdated(holiday.holiday_date) 
                                                                    ? 'bg-orange-50' 
                                                                    : 'bg-white'
                                                            }`}>
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    <div className="flex items-center">
                                                                        <FaCalendarAlt className={`mr-2 ${
                                                                            isOutdated(holiday.holiday_date) 
                                                                                ? 'text-orange-600' 
                                                                                : 'text-green-900'
                                                                        }`} />
                                                                        <span className="font-bold truncate block max-w-[200px]">
                                                                            {holiday.holiday_name}
                                                                        </span>
                                                                        {isOutdated(holiday.holiday_date) && (
                                                                            <span className="ml-2 text-xs px-2 py-1 bg-orange-200 text-orange-800 rounded-full">
                                                                                Outdated
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} font-medium ${
                                                                    isOutdated(holiday.holiday_date) 
                                                                        ? 'text-orange-700' 
                                                                        : ''
                                                                }`}>
                                                                    {formatDate(holiday.holiday_date)}
                                                                </td>
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    <div className="flex justify-center space-x-2">
                                                                        <Tooltip title="Edit Holiday">
                                                                            <Button
                                                                                type="primary"
                                                                                icon={<EditOutlined />}
                                                                                onClick={() => handleEdit(holiday)}
                                                                                size={isTablet ? "middle" : "large"}
                                                                                className="bg-green-900 hover:bg-lime-900"
                                                                            />
                                                                        </Tooltip>
                                                                        <Tooltip title="Deactivate Holiday">
                                                                            <Button
                                                                                danger
                                                                                icon={<StopOutlined />}
                                                                                onClick={() => handleDeactivate(holiday.holiday_id)}
                                                                                size={isTablet ? "middle" : "large"}
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
                                    </div>
                                )}

                                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredHolidays ? filteredHolidays.length : 0}
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

            {(() => {
                const modalContent = (
                    <Form 
                        form={form} 
                        layout="vertical" 
                        className={isMobile ? "p-3" : "p-4"}
                        onSubmitCapture={(e) => e.preventDefault()}
                    >
                        <Form.Item
                            label="Holiday Name"
                            name="name"
                            initialValue={formData.name}
                            rules={[
                                { required: true, message: 'Please input holiday name!' },
                                {
                                    validator: (_, value) => {
                                        if (value && value.trim() === '') {
                                            toast.error('Holiday name cannot contain only whitespace!');
                                            return Promise.reject(new Error('Holiday name cannot contain only whitespace!'));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
                                placeholder="Enter holiday name"
                                size={isMobile ? "large" : isTablet ? "middle" : "large"}
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
                                size={isMobile ? "large" : isTablet ? "middle" : "large"}
                                disabledDate={(current) => {
                                    // Disable all dates before today
                                    return current && current < dayjs().startOf('day');
                                }}
                            />
                        </Form.Item>

                        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'} mt-4`}>
                            <Button 
                                onClick={closeModal} 
                                size={isMobile ? "large" : isTablet ? "middle" : "large"}
                                block={isMobile}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (editMode) {
                                        handleUpdate();
                                    } else {
                                        handleCreate();
                                    }
                                }}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                className="bg-green-900 hover:bg-lime-900"
                                size={isMobile ? "large" : isTablet ? "middle" : "large"}
                                block={isMobile}
                            >
                                {isSubmitting ? 'Saving...' : (editMode ? 'Update' : 'Add')} Holiday
                            </Button>
                        </div>
                    </Form>
                );

                return (
                    <>
                        {isMobile ? (
                            <Drawer
                                title={<div className="text-lg font-bold flex items-center">
                                    <FaCalendarAlt className="mr-2 text-green-900" />
                                    {editMode ? 'Edit Holiday' : 'Add Holiday'}
                                </div>}
                                placement="bottom"
                                height="90%"
                                open={showModal}
                                onClose={closeModal}
                                bodyStyle={{ paddingBottom: '120px' }}
                            >
                                {modalContent}
                            </Drawer>
                        ) : (
                            <Modal
                                title={<div className="text-xl font-bold mb-4 flex items-center">
                                    <FaCalendarAlt className="mr-2 text-green-900" />
                                    {editMode ? 'Edit Holiday' : 'Add Holiday'}
                                </div>}
                                open={showModal}
                                onCancel={closeModal}
                                footer={null}
                                width={isTablet ? 500 : 600}
                            >
                                {modalContent}
                            </Modal>
                        )}
                    </>
                );
            })()}
        </div>
    );
};

export default Holiday;
