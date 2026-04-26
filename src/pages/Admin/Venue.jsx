import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {  FaChartBar, FaBuilding } from 'react-icons/fa';
import { Modal, Input, Button, Tooltip, Alert, Empty, Pagination, Card } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, StopOutlined, EditOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
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
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
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
    const user_id = SecureStorage.getLocalItem('user_id');
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id");

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
        const decryptedUserLevel = parseInt(encryptedUserLevel);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
            navigate('/');
        }
    }, [navigate, encryptedUserLevel]);


    const fetchVenues = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}/Admin.php`, new URLSearchParams({ operation: "fetchVenue" }));
            if (response.data.status === 'success') {
                setVenues(response.data.data);
            } else {
                toast.error("Error fetching venues: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching venues:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Please check your internet connection and try again.");
            } else {
                toast.error("An error occurred while fetching venues.");
            }
        } finally {
            setLoading(false);
        }
    }, [encryptedUrl]);

    useEffect(() => {
        fetchVenues();
    }, [fetchVenues]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);


    const handleAddVenue = () => {
        setShowCreateModal(true);
    };

    const handleEditVenue = (venue) => {
        setSelectedVenueId(venue.ven_id);
        setShowUpdateModal(true);
    };

    const handleDeactivateVenue = (venueIds) => {
        setSelectedVenues(Array.isArray(venueIds) ? venueIds : [venueIds]);
        setShowConfirmDelete(true);
    };
    
    const confirmDelete = async () => {
        setLoading(true);
        try {
            const userId =
                SecureStorage.getSessionItem('user_id') ||
                SecureStorage.getLocalItem('user_id') || null;

            const payload = {
                operation: "archiveResource",
                resourceType: "venue",
                resourceId: selectedVenues,
                userid: userId
            };

            const response = await axios.post(
                `${encryptedUrl}/Admin.php`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success(selectedVenues.length > 1 ? "Venues successfully deactivated!" : "Venue successfully deactivated!");
                fetchVenues();
                setShowConfirmDelete(false);
                setSelectedVenues([]);
            } else {
                toast.error("Failed to deactivate venue(s): " + response.data.message);
            }
        } catch (error) {
            console.error("Error archiving venue(s):", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to deactivate venue(s). Please check your internet connection.");
            } else {
                toast.error("An error occurred while deactivating the venue(s).");
            }
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
            
            <div className={`flex-grow overflow-y-auto`}>
                <div className={`${isMobile ? 'px-4 py-4 mt-13' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`${isMobile ? 'mb-3' : 'mb-4'}`}
                    >
                        <div className="mb-2 sm:mb-4 mt-mt-10">
                            <h2 className={"text-2xl font-bold text-green-900 mt-5 "}>
                                Venue
                            </h2>
                        </div>
                    </motion.div>

                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Input
                                    placeholder={isMobile ? "Search venues..." : "Search venues by name"}
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-wrap gap-2' : 'gap-2'}`}>
                                {selectedVenues.length > 0 && (
                                    <Button
                                        danger
                                        icon={<StopOutlined />}
                                        onClick={() => handleDeactivateVenue(selectedVenues)}
                                        size={isMobile ? "middle" : "large"}
                                        className={isMobile ? 'w-full' : ''}
                                    >
                                        {isMobile ? `Deactivate (${selectedVenues.length})` : `Deactivate Selected (${selectedVenues.length})`}
                                    </Button>
                                )}
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
                                    onClick={handleAddVenue}
                                    className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                                >
                                    {isMobile ? 'Add' : 'Add Venue'}
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
                                    <div className="space-y-3 p-3">
                                        {filteredVenues && filteredVenues.length > 0 ? (
                                            filteredVenues
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((venue) => (
                                                    <Card
                                                        key={venue.ven_id}
                                                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                                                        size="small"
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
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
                                                                    <FaBuilding className="text-green-900 text-sm" />
                                                                    <span className="font-medium text-sm truncate max-w-[150px]">
                                                                        {venue.ven_name}
                                                                    </span>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    <Button
                                                                        type="primary"
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEditVenue(venue)}
                                                                        size="small"
                                                                        className="bg-green-900 hover:bg-lime-900"
                                                                    />
                                                                    <Button
                                                                        danger
                                                                        icon={<StopOutlined />}
                                                                        onClick={() => handleDeactivateVenue(venue.ven_id)}
                                                                        size="small"
                                                                    />
                                                                    <Button
                                                                        type="default"
                                                                        icon={<FaChartBar />}
                                                                        onClick={() => handleViewUtilization(venue)}
                                                                        size="small"
                                                                        className="bg-green-50 hover:bg-green-100"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                                                <div>
                                                                    <span className="font-medium">Max Occupancy:</span>
                                                                    <br />
                                                                    {venue.ven_occupancy && venue.ven_occupancy !== '0' ? venue.ven_occupancy : 'Not Specified'}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Min Occupancy:</span>
                                                                    <br />
                                                                    {venue.ven_minimum ? venue.ven_minimum : 'Not Specified'}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                                                <div>
                                                                    <span className="font-medium">Event Type:</span>
                                                                    <br />
                                                                    {venue.event_type ? venue.event_type : 'Not Specified'}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Area Type:</span>
                                                                    <br />
                                                                    {venue.area_type === 'Open Area' ? 'Open Area' : 
                                                                     venue.area_type === 'Close Area' ? 'Close Area' : 'Not Specified'}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                                                <div>
                                                                    <span className="font-medium">Location:</span>
                                                                    <br />
                                                                    {venue.venue_building_name || 'Not Assigned'}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Status:</span>
                                                                    <br />
                                                                    <Tag 
                                                                        value={
                                                                            venue.status_availability_id === 1 || venue.status_availability_id === '1' ? 'Available' : 
                                                                            venue.status_availability_id === 5 || venue.status_availability_id === '5' ? 'In Use' :
                                                                            venue.status_availability_id === 6 || venue.status_availability_id === '6' ? 'For Inspection' :
                                                                            venue.status_availability_id === 7 || venue.status_availability_id === '7' ? 'Missing' :
                                                                            venue.status_availability_id === 8 || venue.status_availability_id === '8' ? 'Damaged' :
                                                                            'Not Available'
                                                                        }
                                                                        severity={
                                                                            venue.status_availability_id === 1 || venue.status_availability_id === '1' ? 'success' :
                                                                            venue.status_availability_id === 5 || venue.status_availability_id === '5' ? 'info' :
                                                                            venue.status_availability_id === 6 || venue.status_availability_id === '6' ? 'warning' :
                                                                            venue.status_availability_id === 7 || venue.status_availability_id === '7' ? 'danger' :
                                                                            venue.status_availability_id === 8 || venue.status_availability_id === '8' ? 'danger' :
                                                                            'danger'
                                                                        }
                                                                        className="px-2 py-1 text-xs font-semibold"
                                                                    />
                                                                </div>
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
                                                            No venues found
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
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('ven_name')}>
                                                        <div className="flex items-center">
                                                            Venue Name
                                                            {sortField === 'ven_name' && (
                                                                <span className="ml-1">
                                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('ven_occupancy')}>
                                                        <div className="flex items-center">
                                                            Max Occupancy
                                                            {sortField === 'ven_occupancy' && (
                                                                <span className="ml-1">
                                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4">
                                                            <div className="flex items-center">
                                                                Min Occupancy
                                                            </div>
                                                        </th>
                                                    )}
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4">
                                                            <div className="flex items-center">
                                                                Event Type
                                                            </div>
                                                        </th>
                                                    )}
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                        <div className="flex items-center">
                                                            Area Type
                                                        </div>
                                                    </th>
                                                    {!isTablet && (
                                                        <th scope="col" className="px-4 py-4">
                                                            <div className="flex items-center">
                                                                Location
                                                            </div>
                                                        </th>
                                                    )}
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                        <div className="flex items-center">
                                                            Status
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
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
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
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    <div className="flex items-center">
                                                                        <FaBuilding className="mr-2 text-green-900" />
                                                                        <span className="font-medium truncate block max-w-[140px]">{venue.ven_name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    {venue.ven_occupancy && venue.ven_occupancy !== '0' ? venue.ven_occupancy : 'Not Specified'}
                                                                </td>
                                                                {!isTablet && (
                                                                    <td className="px-4 py-4">
                                                                        {venue.ven_minimum ? venue.ven_minimum : 'Not Specified'}
                                                                    </td>
                                                                )}
                                                                {!isTablet && (
                                                                    <td className="px-4 py-4">
                                                                        {venue.event_type ? venue.event_type : 'Not Specified'}
                                                                    </td>
                                                                )}
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    {venue.area_type === 'Open Area' ? 'Open Area' : 
                                                                     venue.area_type === 'Close Area' ? 'Close Area' : 'Not Specified'}
                                                                </td>
                                                                {!isTablet && (
                                                                    <td className="px-4 py-4">
                                                                        {venue.venue_building_name || 'Not Assigned'}
                                                                    </td>
                                                                )}
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    <Tag 
                                                                        value={
                                                                            venue.status_availability_id === 1 || venue.status_availability_id === '1' ? 'Available' :
                                                                            venue.status_availability_id === 5 || venue.status_availability_id === '5' ? 'In Use' :
                                                                            venue.status_availability_id === 6 || venue.status_availability_id === '6' ? 'For Inspection' :
                                                                            venue.status_availability_id === 7 || venue.status_availability_id === '7' ? 'Missing' :
                                                                            venue.status_availability_id === 8 || venue.status_availability_id === '8' ? 'Damaged' :
                                                                            'Not Available'
                                                                        }
                                                                        severity={
                                                                            venue.status_availability_id === 1 || venue.status_availability_id === '1' ? 'success' :
                                                                            venue.status_availability_id === 5 || venue.status_availability_id === '5' ? 'info' :
                                                                            venue.status_availability_id === 6 || venue.status_availability_id === '6' ? 'warning' :
                                                                            venue.status_availability_id === 7 || venue.status_availability_id === '7' ? 'danger' :
                                                                            venue.status_availability_id === 8 || venue.status_availability_id === '8' ? 'danger' :
                                                                            'danger'
                                                                        }
                                                                        className="px-2 py-1 text-xs font-semibold"
                                                                    />
                                                                </td>
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    <div className={`flex space-x-2 ${isTablet ? 'justify-start' : 'justify-center'}`}>
                                                                        <Button
                                                                            type="primary"
                                                                            icon={<EditOutlined />}
                                                                            onClick={() => handleEditVenue(venue)}
                                                                            size={isTablet ? "small" : "middle"}
                                                                            className="bg-green-900 hover:bg-lime-900"
                                                                        />
                                                                        <Button
                                                                            danger
                                                                            icon={<StopOutlined />}
                                                                            onClick={() => handleDeactivateVenue(venue.ven_id)}
                                                                            size={isTablet ? "small" : "middle"}
                                                                        />
                                                                        <Button
                                                                            type="default"
                                                                            icon={<FaChartBar />}
                                                                            onClick={() => handleViewUtilization(venue)}
                                                                            size={isTablet ? "small" : "middle"}
                                                                            className="bg-green-50 hover:bg-green-100"
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={isTablet ? 6 : 9} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
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
                                    </div>
                                )}

                                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredVenues ? filteredVenues.length : 0}
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
                        <ExclamationCircleOutlined className="mr-2" /> Confirm Deactivate
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
                        key="deactivate"
                        type="primary"
                        danger
                        onClick={confirmDelete}
                        icon={<DeleteOutlined />}
                    >
                        Deactivate
                    </Button>
                ]}
            >
                <Alert
                    message="Warning"
                    description={`Are you sure you want to deactivate ${selectedVenues.length} venue(s)? This action will move them to inactive status.`}
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