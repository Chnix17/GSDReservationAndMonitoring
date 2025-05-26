import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Sidebar from '../Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FaEdit, FaSearch, FaPlus, FaTrashAlt, FaEye, FaArrowLeft } from 'react-icons/fa';
import { Modal, Input, Form, TimePicker, Select, Table, Button, Image, Tooltip, Space, Upload, Alert, Empty, Pagination } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Tag } from 'primereact/tag';
import { sanitizeInput, validateInput } from '../../utils/sanitize';
import { SecureStorage } from '../../utils/encryption';
import Create_Modal from './lib/Venue/Create_Modal';
import Update_Modal from './lib/Venue/Update_Modal';

const VenueEntry = () => {
    const user_level_id = localStorage.getItem('user_level_id');
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedVenueId, setSelectedVenueId] = useState(null);
    const [viewImageModal, setViewImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [sortField, setSortField] = useState('ven_id');
    const [sortOrder, setSortOrder] = useState('desc');
    const navigate = useNavigate();
    const user_id = SecureStorage.getSessionItem('user_id');
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id");

    useEffect(() => {
        if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    useEffect(() => {
        fetchVenues();
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

    const handleAddVenue = () => {
        setShowCreateModal(true);
    };

    const handleEditVenue = (venue) => {
        setSelectedVenueId(venue.ven_id);
        setShowUpdateModal(true);
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

    const filteredVenues = venues.filter(venue =>
        venue.ven_name && venue.ven_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Venue Management
                            </h2>
                        </div>
                    </motion.div>

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

            {/* Create Modal */}
            <Create_Modal
                visible={showCreateModal}
                onCancel={() => setShowCreateModal(false)}
                onSuccess={fetchVenues}
                encryptedUrl={encryptedUrl}
                user_id={user_id}
                encryptedUserLevel={encryptedUserLevel}
            />

            {/* Update Modal */}
            <Update_Modal
                visible={showUpdateModal}
                onCancel={() => setShowUpdateModal(false)}
                onSuccess={fetchVenues}
                encryptedUrl={encryptedUrl}
                venueId={selectedVenueId}
            />

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