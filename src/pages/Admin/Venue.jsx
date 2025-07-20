import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {  FaChartBar, FaBuilding } from 'react-icons/fa';
import { Modal, Input,  Button, Tooltip, Alert, Empty, Pagination } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Tag } from 'primereact/tag';
import { SecureStorage } from '../../utils/encryption';
import CreateModal from './lib/Venue/Create_Modal';
import UpdateModal from './lib/Venue/Update_Modal';
import ViewUtilization from './lib/Venue/View_Utilization';

const VenueEntry = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedVenueId, setSelectedVenueId] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [sortField, setSortField] = useState('ven_id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showUtilizationModal, setShowUtilizationModal] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [selectedVenues, setSelectedVenues] = useState([]);
    const navigate = useNavigate();
    const user_id = SecureStorage.getSessionItem('user_id');
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id");

    useEffect(() => {
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate, encryptedUserLevel]);


    const fetchVenues = useCallback(async () => {
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
    }, [encryptedUrl]);

    useEffect(() => {
        fetchVenues();
    }, [fetchVenues]);


    const handleAddVenue = () => {
        setShowCreateModal(true);
    };

    const handleEditVenue = (venue) => {
        setSelectedVenueId(venue.ven_id);
        setShowUpdateModal(true);
    };

    const handleArchiveVenue = (venueIds) => {
        setSelectedVenues(Array.isArray(venueIds) ? venueIds : [venueIds]);
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
                    resourceId: selectedVenues
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success(selectedVenues.length > 1 ? "Venues successfully archived!" : "Venue successfully archived!");
                fetchVenues();
                setShowConfirmDelete(false);
                setSelectedVenues([]);
            } else {
                toast.error("Failed to archive venue(s): " + response.data.message);
            }
        } catch (error) {
            console.error("Error archiving venue(s):", error);
            toast.error("An error occurred while archiving the venue(s).");
        } finally {
            setLoading(false);
        }
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

    const handleViewUtilization = (venue) => {
        setSelectedVenue(venue);
        setShowUtilizationModal(true);
    };

    const filteredVenues = venues.filter(venue =>
        venue.ven_name && venue.ven_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
            <div className="flex-shrink-0">
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
                        <div className="mb-2 sm:mb-4 mt-mt-10">
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Venue 
                            </h2>
                        </div>
                    </motion.div>

                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-row items-center gap-2 w-full">
                            <div className="flex-grow">
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
                            <div className="flex gap-2">
                                {selectedVenues.length > 0 && (
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleArchiveVenue(selectedVenues)}
                                        size="large"
                                    >
                                        Archive Selected ({selectedVenues.length})
                                    </Button>
                                )}
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
                                <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                                    <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                                        <tr>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedVenues(filteredVenues.map(venue => venue.ven_id));
                                                            } else {
                                                                setSelectedVenues([]);
                                                            }
                                                        }}
                                                        checked={selectedVenues.length === filteredVenues.length && filteredVenues.length > 0}
                                                    />
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4 cursor-pointer" onClick={() => handleSort('ven_name')}>
                                                <div className="flex items-center">
                                                    Venue Name
                                                    {sortField === 'ven_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4 cursor-pointer" onClick={() => handleSort('ven_occupancy')}>
                                                <div className="flex items-center">
                                                    Max Occupancy
                                                    {sortField === 'ven_occupancy' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    Event Type
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    Status
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
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
                                                        className={`bg-white border-b last:border-b-0 border-gray-200 ${
                                                            selectedVenues.includes(venue.ven_id) ? 'bg-blue-50' : ''
                                                        }`}
                                                    >
                                                        <td className="px-4 py-4">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                                checked={selectedVenues.includes(venue.ven_id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedVenues([...selectedVenues, venue.ven_id]);
                                                                    } else {
                                                                        setSelectedVenues(selectedVenues.filter(id => id !== venue.ven_id));
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center">
                                                                <FaBuilding className="mr-2 text-green-900" />
                                                                <span className="font-medium truncate block max-w-[140px]">{venue.ven_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {venue.ven_occupancy && venue.ven_occupancy !== '0' ? venue.ven_occupancy : 'Not Specified'}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {venue.event_type ? venue.event_type : 'Not Specified'}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <Tag 
                                                                value={
                                                                    venue.status_availability_id === 1 ? 'Available' :
                                                                    venue.status_availability_id === 5 ? 'In Use' :
                                                                    venue.status_availability_id === 6 ? 'For Inspection' :
                                                                    venue.status_availability_id === 7 ? 'Missing' :
                                                                    venue.status_availability_id === 8 ? 'Damaged' :
                                                                    'Not Available'
                                                                }
                                                                severity={
                                                                    venue.status_availability_id === 1 ? 'success' :
                                                                    venue.status_availability_id === 5 ? 'info' :
                                                                    venue.status_availability_id === 6 ? 'warning' :
                                                                    venue.status_availability_id === 7 ? 'danger' :
                                                                    venue.status_availability_id === 8 ? 'danger' :
                                                                    'danger'
                                                                }
                                                                className="px-2 py-1 text-xs font-semibold"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex space-x-2 justify-center">
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
                                                                <Button
                                                                    type="default"
                                                                    icon={<FaChartBar />}
                                                                    onClick={() => handleViewUtilization(venue)}
                                                                    size="middle"
                                                                    className="bg-green-50 hover:bg-green-100"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
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
            <CreateModal
                visible={showCreateModal}
                onCancel={() => setShowCreateModal(false)}
                onSuccess={fetchVenues}
                encryptedUrl={encryptedUrl}
                user_id={user_id}
                encryptedUserLevel={encryptedUserLevel}
            />

            {/* Update Modal */}
            <UpdateModal
                visible={showUpdateModal}
                onCancel={() => setShowUpdateModal(false)}
                onSuccess={fetchVenues}
                encryptedUrl={encryptedUrl}
                venueId={selectedVenueId}
            />
            
            {/* Confirm Delete Modal */}
            <Modal
                open={showConfirmDelete}
                onCancel={() => {
                    setShowConfirmDelete(false);
                    setSelectedVenues([]);
                }}
                centered
                title={
                    <span className="text-red-600 flex items-center">
                        <ExclamationCircleOutlined className="mr-2" /> Confirm Archive
                    </span>
                }
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setShowConfirmDelete(false);
                            setSelectedVenues([]);
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="archive"
                        danger
                        onClick={confirmDelete}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Archive
                    </Button>
                ]}
            >
                <Alert
                    message="Warning"
                    description={`Are you sure you want to archive ${selectedVenues.length} venue(s)? This action cannot be undone.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>

            {/* Utilization Modal */}
            <ViewUtilization
                open={showUtilizationModal}
                onCancel={() => setShowUtilizationModal(false)}
                venue={selectedVenue}
                encryptedUrl={encryptedUrl}
            />
        </div>
    );
};

export default VenueEntry;