import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FaEdit, FaSearch, FaPlus, FaTrashAlt, FaEye, FaArrowLeft } from 'react-icons/fa';
import '../vehicle.css';
import { Modal, Input, Form, TimePicker, Select, Table, Button, Image, Tooltip, Space, Upload, Alert, Empty, Pagination } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Tag } from 'primereact/tag';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';

const VenueEntry = () => {

    const user_level_id = localStorage.getItem('user_level_id');
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [venuePic, setVenuePic] = useState(null);
    const [venueExists, setVenueExists] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentVenueId, setCurrentVenueId] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('1');
    const [statusOptions, setStatusOptions] = useState([]);
    const [viewImageModal, setViewImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedVenueId, setSelectedVenueId] = useState(null);
    const [sortField, setSortField] = useState('ven_id');
    const [sortOrder, setSortOrder] = useState('desc');
    const navigate = useNavigate();
    const user_id = SecureStorage.getSessionItem('user_id');
    const fileUploadRef = useRef(null);
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const [form] = Form.useForm();

    useEffect(() => {
        console.log("this is encryptedUserLevel", encryptedUserLevel);
        if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    useEffect(() => {
        fetchVenues();
    }, []);

    useEffect(() => {
        fetchStatusAvailability();
    }, []);

    const fetchVenues = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}/user.php`, new URLSearchParams({ operation: "fetchVenue" }));
            if (response.data.status === 'success') {
                setVenues(response.data.data);
            } else {
                toast.error("Error fetching venues: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching venues:", error);
            toast.error("An error occurred while fetching venues.");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusAvailability = async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/fetchMaster.php`, 
                new URLSearchParams({
                    operation: 'fetchStatusAvailability'
                })
            );
            
            if (response.data.status === 'success') {
                setStatusOptions(response.data.data);
            } else {
                console.error("Failed to fetch status options");
            }
        } catch (error) {
            console.error("Error fetching status availability:", error);
        }
    };

    const handleAddVenue = () => {
        setVenueName('');
        setMaxOccupancy('');
        setShowModal(true);
        setEditMode(false);
        setVenueExists(false);
    };

    const getVenueDetails = async (venueId) => {
        try {
            const formData = new URLSearchParams();
            formData.append('operation', 'fetchVenueById');
            formData.append('id', venueId);
    
            const response = await axios.post(`${encryptedUrl}/fetchMaster.php`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            console.log('Venue details response:', response.data); // Debug log
    
            if (response.data.status === 'success' && response.data.data && response.data.data.length > 0) {
                const venue = response.data.data[0];
                setVenueName(venue.ven_name);
                setMaxOccupancy(venue.ven_occupancy);
                setCurrentVenueId(venue.ven_id);
                setSelectedStatus(venue.status_availability_id);
                
                if (venue.ven_pic) {
                    const imageUrl = `${encryptedUrl}/${venue.ven_pic}`;
                    setPreviewUrl(imageUrl);
                    setFileList([{
                        uid: '-1',
                        name: 'venue-image.png',
                        status: 'done',
                        url: imageUrl,
                    }]);
                } else {
                    setPreviewUrl(null);
                    setFileList([]);
                }
                
                setShowModal(true);
                setEditMode(true);
            } else {
                toast.error("Failed to fetch venue details");
            }
        } catch (error) {
            console.error("Error fetching venue details:", error);
            toast.error("An error occurred while fetching venue details");
        }
    };
    

    const handleEditVenue = (venue) => {
        getVenueDetails(venue.ven_id);
    };

    const checkVenueExists = async () => {
        const response = await axios.post(`${encryptedUrl}/user.php`, new URLSearchParams({
            operation: "venueExists",
            json: JSON.stringify({ venue_name: venueName })
        }));

        if (response.data.status === 'success' && response.data.exists) {
            setVenueExists(true);
        } else {
            setVenueExists(false);
        }
    };

    const handleUpdateVenue = async () => {
        setLoading(true);
        try {
            let requestData = {
                operation: 'updateVenue',
                venueData: {
                    venue_id: currentVenueId,
                    venue_name: venueName,
                    max_occupancy: maxOccupancy,
                    status_availability_id: parseInt(selectedStatus)
                }
            };

            // If there's a new image file
            if (venuePic instanceof File) {
                const reader = new FileReader();
                const base64Image = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(venuePic);
                });
                requestData.venueData.ven_pic = base64Image;
            }

            const response = await axios.post(
                `${encryptedUrl}/update_master1.php`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Venue successfully updated!");
                fetchVenues();
                setShowModal(false);
                resetForm();
            } else {
                toast.error(response.data.message || "Failed to update venue");
            }
        } catch (error) {
            console.error("Error updating venue:", error);
            toast.error("An error occurred while updating the venue.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setVenueName('');
        setMaxOccupancy('');
        setVenuePic(null);
        setPreviewUrl(null);
        setFileList([]);
    };

    const validateVenueData = () => {
        const sanitizedName = sanitizeInput(venueName);
        const sanitizedOccupancy = sanitizeInput(maxOccupancy);

        if (!validateInput(sanitizedName) || !validateInput(sanitizedOccupancy)) {
            toast.error("Invalid input detected. Please check your entries.");
            return false;
        }

        if (!sanitizedName || !sanitizedOccupancy) {
            toast.error("Please fill in all required fields!");
            return false;
        }

        // Validate occupancy
        if (parseInt(sanitizedOccupancy) <= 0) {
            toast.error("Maximum occupancy must be greater than zero!");
            return false;
        }

        return {
            name: sanitizedName,
            occupancy: sanitizedOccupancy
        };
    };

    const handleSubmit = async () => {
        if (editMode) {
            await handleUpdateVenue();
        } else {
            const validatedData = validateVenueData();
            if (!validatedData) return;

            setLoading(true);
            try {
                let imageBase64 = null;
                if (venuePic) {
                    imageBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(venuePic);
                    });
                }

                const requestData = {
                    operation: 'saveVenue',
                    data: {
                        name: validatedData.name,
                        occupancy: validatedData.occupancy,
                        user_admin_id: encryptedUserLevel === '1' ? user_id : null,  // Set for user admin (level 1)
                        status_availability_id: parseInt(selectedStatus),
                        ven_pic: imageBase64
                    }
                };

                console.log(requestData);

                const response = await axios.post(
                    `${encryptedUrl}/insert_master.php`,
                    requestData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.status === 'success') {
                    toast.success("Venue successfully added!");
                    fetchVenues();
                    setShowModal(false);
                    resetForm();
                } else {
                    toast.error(response.data.message || "Failed to save venue");
                }
            } catch (error) {
                console.error("Error saving venue:", error);
                toast.error("An error occurred while saving the venue.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleVenueNameChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        setVenueName(sanitizedValue);
        if (!editMode) {
            checkVenueExists();
        }
    };

    const handleOccupancyChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        if (/^\d*$/.test(sanitizedValue)) { // Only allow digits
            setMaxOccupancy(sanitizedValue);
        }
    };

    const handleArchiveVenue = (venueId) => {
        setSelectedVenueId(venueId);
        setShowConfirmDelete(true);
    };
    
    const confirmDelete = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                `${encryptedUrl}/delete_master.php`,
                {
                    operation: "archiveResource",
                    resourceType: "venue",
                    resourceId: selectedVenueId
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Venue successfully archived!");
                fetchVenues();
                setShowConfirmDelete(false);
            } else {
                toast.error("Failed to archive venue: " + response.data.message);
            }
        } catch (error) {
            console.error("Error archiving venue:", error);
            toast.error("An error occurred while archiving the venue.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            setVenuePic(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setVenuePic(null);
            setPreviewUrl(null);
        }
    };

    const onFileRemove = () => {
        setVenuePic(null);
        setPreviewUrl(null);
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };

    const filteredVenues = venues.filter(venue =>
        venue.ven_name && venue.ven_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getImageUrl = (venuePic) => {
        if (!venuePic) return null;
        return `${encryptedUrl}/${venuePic}`;
    };

    const handleViewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        setViewImageModal(true);
    };

    const handleRefresh = () => {
        fetchVenues();
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

    // Table columns configuration
    const columns = [
        {
            title: 'ID',
            dataIndex: 'ven_id',
            key: 'ven_id',
            width: 80,
            sorter: (a, b) => a.ven_id - b.ven_id,
        },
        {
            title: 'Image',
            dataIndex: 'ven_pic',
            key: 'ven_pic',
            width: 100,
            render: (text, record) => {
                const imageUrl = getImageUrl(record.ven_pic);
                return (
                    <div className="flex justify-center">
                        {imageUrl ? (
                            <div className="cursor-pointer" onClick={() => handleViewImage(imageUrl)}>
                                <img 
                                    src={imageUrl} 
                                    alt={record.ven_name} 
                                    className="w-16 h-16 object-cover rounded-md shadow-sm hover:opacity-80 transition-opacity"
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                <i className="pi pi-image text-2xl"></i>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Venue Name',
            dataIndex: 'ven_name',
            key: 'ven_name',
            sorter: (a, b) => a.ven_name.localeCompare(b.ven_name),
            render: (text) => <span className="font-semibold text-green-800">{text}</span>
        },
        {
            title: 'Max Occupancy',
            dataIndex: 'ven_occupancy',
            key: 'ven_occupancy',
            width: 150,
            sorter: (a, b) => a.ven_occupancy - b.ven_occupancy,
            render: (text) => <span>{text} people</span>
        },
       
        {
            title: 'Status',
            dataIndex: 'status_availability_id',
            key: 'status_availability_id',
            width: 120,
            render: (statusId) => (
                <Tag 
                    value={statusId === '1' ? 'Available' : 'Not Available'} 
                    severity={statusId === '1' ? 'success' : 'danger'}
                    className="px-2 py-1 text-xs font-semibold"
                />
            ),
            filters: statusOptions.map(status => ({
                text: status.status_availability_name,
                value: status.status_availability_id,
            })),
            onFilter: (value, record) => record.status_availability_id === value,
        },
        {
            title: 'Created At',
            dataIndex: 'ven_created_at',
            key: 'ven_created_at',
            width: 170,
            sorter: (a, b) => new Date(a.ven_created_at) - new Date(b.ven_created_at),
            render: (text) => dayjs(text).format('MMM D, YYYY HH:mm')
        },
        {
            title: 'Updated At',
            dataIndex: 'ven_updated_at',
            key: 'ven_updated_at',
            width: 170,
            sorter: (a, b) => new Date(a.ven_updated_at) - new Date(b.ven_updated_at),
            render: (text) => dayjs(text).format('MMM D, YYYY HH:mm')
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Venue">
                        <Button 
                            type="primary" 
                            icon={<FaEdit />} 
                            onClick={() => handleEditVenue(record)}
                            size="small"
                            className="bg-green-500 hover:bg-green-600 border-green-500"
                        />
                    </Tooltip>
                    <Tooltip title="Archive Venue">
                        <Button 
                            icon={<FaTrashAlt />} 
                            onClick={() => handleArchiveVenue(record.ven_id)}
                            size="small"
                            className="text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400"
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

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
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Venue Management
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search venues by name"
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        size="large"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                    onClick={handleAddVenue}
                                    className="bg-lime-900 hover:bg-green-600"
                                >
                                    Add Venue
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
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('ven_id')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    ID
                                                    {sortField === 'ven_id' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Image
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('ven_name')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Venue Name
                                                    {sortField === 'ven_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('ven_occupancy')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Max Occupancy
                                                    {sortField === 'ven_occupancy' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Status
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Actions
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVenues && filteredVenues.length > 0 ? (
                                            filteredVenues
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((venue) => (
                                                    <tr
                                                        key={venue.ven_id}
                                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                    >
                                                        <td className="px-6 py-4">{venue.ven_id}</td>
                                                        <td className="px-6 py-4">
                                                            {venue.ven_pic ? (
                                                                <div className="cursor-pointer" onClick={() => handleViewImage(getImageUrl(venue.ven_pic))}>
                                                                    <img 
                                                                        src={getImageUrl(venue.ven_pic)} 
                                                                        alt={venue.ven_name} 
                                                                        className="w-12 h-12 object-cover rounded-md shadow-sm hover:opacity-80 transition-opacity"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                                                    <i className="pi pi-image text-xl"></i>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                <FaEye className="mr-2 text-green-900" />
                                                                <span className="font-medium">{venue.ven_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{venue.ven_occupancy} people</td>
                                                        
                                                        <td className="px-6 py-4">
                                                            <Tag 
                                                                value={venue.status_availability_id === '1' ? 'Available' : 'Not Available'} 
                                                                severity={venue.status_availability_id === '1' ? 'success' : 'danger'}
                                                                className="px-2 py-1 text-xs font-semibold"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex space-x-2">
                                                                <Button
                                                                    type="primary"
                                                                    icon={<EditOutlined />}
                                                                    onClick={() => handleEditVenue(venue)}
                                                                    size="middle"
                                                                    className="bg-green-900 hover:bg-lime-900"
                                                                />
                                                                <Button
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => handleArchiveVenue(venue.ven_id)}
                                                                    size="middle"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No venues found
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
                                        total={filteredVenues ? filteredVenues.length : 0}
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

            {/* Add/Edit Venue Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <FaEye className="mr-2 text-green-900" /> 
                        {editMode ? 'Edit Venue' : 'Add Venue'}
                    </div>
                }
                open={showModal}
                onCancel={() => setShowModal(false)}
                okText={editMode ? 'Update' : 'Add'}
                onOk={handleSubmit}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Venue Name"
                        name="name"
                        initialValue={venueName}
                        validateStatus={venueExists ? 'error' : ''}
                        help={venueExists && 'Venue already exists!'}
                        rules={[
                            { required: true, message: 'Please input venue name!' },
                        ]}
                    >
                        <Input
                            value={venueName}
                            onChange={handleVenueNameChange}
                            placeholder="Enter venue name"
                        />
                    </Form.Item>
                    <Form.Item 
                        label="Max Occupancy"
                        name="occupancy"
                        initialValue={maxOccupancy}
                        rules={[
                            { required: true, message: 'Please input maximum occupancy!' },
                        ]}
                    >
                        <Input
                            type="number"
                            value={maxOccupancy}
                            onChange={handleOccupancyChange}
                            placeholder="Enter maximum occupancy"
                            min="1"
                        />
                    </Form.Item>
                    <Form.Item 
                        label="Venue Picture" 
                        tooltip="Upload venue image (max 5MB, formats: jpg, png)"
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleImageUpload}
                            beforeUpload={() => false}
                            maxCount={1}
                        >
                            {fileList.length < 1 && (
                                <Button icon={<PlusOutlined />}>
                                    Upload
                                </Button>
                            )}
                        </Upload>
                        {previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('http') && (
                            <div className="mt-4">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded shadow-md"
                                />
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item 
                        label="Status" 
                        required
                        tooltip="Select venue availability status"
                    >
                        <Select
                            value={selectedStatus}
                            onChange={(value) => setSelectedStatus(value)}
                            className="w-full"
                        >
                            {statusOptions.map(status => (
                                <Select.Option 
                                    key={status.status_availability_id} 
                                    value={status.status_availability_id}
                                >
                                    {status.status_availability_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                open={viewImageModal}
                footer={null}
                onCancel={() => setViewImageModal(false)}
                width={700}
                centered
            >
                {currentImage && (
                    <Image
                        src={currentImage}
                        alt="Venue"
                        className="w-full object-contain max-h-[70vh]"
                        preview={false}
                    />
                )}
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
                        onClick={() => confirmDelete()}
                        icon={<DeleteOutlined />}
                    >
                        Delete
                    </Button>,
                ]}
            >
                <Alert
                    message="Warning"
                    description={`Are you sure you want to archive this venue? This action cannot be undone.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>
        </div>
    );
};

export default VenueEntry;