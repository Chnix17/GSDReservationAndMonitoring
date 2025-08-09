import React, { useState, useEffect, useRef, useCallback } from 'react'; // Add useCallback to imports
import Sidebar from '../Sidebar';
import { toast } from 'sonner';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import 'primereact/resources/themes/lara-light-green/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Tag } from 'primereact/tag';
import { Modal, Input,  Button, Tooltip,   Empty, Pagination, Alert } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, InboxOutlined, EditOutlined, SearchOutlined, ReloadOutlined, BarChartOutlined } from '@ant-design/icons';

import {SecureStorage} from '../../utils/encryption'; // Adjust the import path as necessary
import CreateModal from './lib/Vehicle/Create_Modal';
import UpdateModal from './lib/Vehicle/Update_Modal';
import ViewUtilization from './lib/Vehicle/View_Utilization';

const VehicleEntry = () => {
    const user_level_id = SecureStorage.getLocalItem('user_level_id');
    const encryptedUrl = SecureStorage.getLocalItem("url");
    // Add fileUploadRef before other state declarations
    const fileUploadRef = useRef(null);
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    // const [categories, setCategories] = useState([]);
    // const [makes, setMakes] = useState([]);
    // const [modelsByCategory, setModelsByCategory] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);

    // const [statusAvailability, setStatusAvailability] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    
    const navigate = useNavigate();
    const BASE_URL = `${encryptedUrl}/user.php`;

    const IMAGE_BASE_URL = encryptedUrl;
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('vehicle_license');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showUtilizationModal, setShowUtilizationModal] = useState(false);
    const [selectedVehicleForUtilization, setSelectedVehicleForUtilization] = useState(null);
    const [selectedVehicles, setSelectedVehicles] = useState([]);

    useEffect(() => {
        const decryptedUserLevel = parseInt(user_level_id);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            localStorage.clear();
        
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        try {
            console.log('Fetching all vehicles...');
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchAllVehicles" }));
            console.log('Vehicles response:', response.data);
            
            if (response.data.status === 'success') {
                const vehiclesData = response.data.data || [];
                console.log('Setting vehicles:', vehiclesData);
                setVehicles(vehiclesData);
                setFilteredVehicles(vehiclesData);
            } else {
                console.error('Failed to fetch vehicles:', response.data.message);
                toast.error(response.data.message || 'Failed to fetch vehicles');
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast.error(error.message || 'Failed to fetch vehicles');
        } finally {
            setLoading(false);
        }
    }, [BASE_URL]);

    // const fetchMakes = useCallback(async () => {
    //     try {
    //         const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchMake" }));
    //         if (response.data.status === 'success') {
    //             setMakes(response.data.data);
    //             return response.data.data;
    //         } else {
    //             toast.error(response.data.message);
    //             return [];
    //         }
    //     } catch (error) {
    //         toast.error(error.message);
    //         return [];
    //     }
    // }, [BASE_URL]);

    // const fetchCategoriesAndModels = useCallback(async (makeId) => {
    //     if (!makeId) return;
    //     try {
    //         const response = await axios.post(BASE_URL, new URLSearchParams({ 
    //             operation: "fetchCategoriesAndModels",
    //             make_id: makeId
    //         }));
    //         if (response.data.status === 'success') {
    //             setCategories(response.data.data.categories);
    //             setModelsByCategory(response.data.data.modelsByCategory);
    //         } else {
    //             toast.error(response.data.message);
    //         }
    //     } catch (error) {
    //         toast.error(error.message);
    //     }
    // }, [BASE_URL]);

    // const fetchStatusAvailability = useCallback(async () => {
    //     try {
    //         const response = await axios.post(`${encryptedUrl}/user.php`, 
    //             new URLSearchParams({ operation: "fetchStatusAvailability" })
    //         );
    //         if (response.data.status === 'success') {
    //             setStatusAvailability(response.data.data);
    //         } else {
    //             toast.error(response.data.message);
    //         }
    //     } catch (error) {
    //         toast.error(error.message);
    //     }
    // }, [encryptedUrl]);

    useEffect(() => {
        fetchVehicles();
        // fetchMakes();
        // fetchCategoriesAndModels();
        // fetchStatusAvailability();
    }, [fetchVehicles]);

    // Reset editing vehicle when modal closes
    useEffect(() => {
        if (!showEditModal) {
            setEditingVehicle(null);
        }
    }, [showEditModal]);

    const handleAddVehicle = () => {
        resetForm();
     
        setShowAddModal(true);
    };

    const resetForm = () => {

       
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };





    const handleCreateSubmit = async () => {
        try {
            await fetchVehicles();
            setShowAddModal(false);
            toast.success('Vehicle created successfully');
        } catch (error) {
            console.error('Create error:', error);
            toast.error(error.message || 'Failed to create vehicle');
        }
    };

    const handleEditVehicle = async (vehicle) => {
        try {
            console.log('Fetching vehicle details for ID:', vehicle.vehicle_id);
            const response = await axios.post(BASE_URL, new URLSearchParams({
                operation: "fetchVehicleById",
                id: vehicle.vehicle_id
            }));

            console.log('Vehicle fetch response:', response.data);

            if (response.data.status === 'success' && response.data.data && response.data.data.length > 0) {
                const vehicleData = response.data.data[0];
                console.log('Setting editing vehicle with data:', vehicleData);
                console.log('Year value from API:', vehicleData.year, 'Type:', typeof vehicleData.year);
                console.log('License value from API:', vehicleData.vehicle_license);
                console.log('Model value from API:', vehicleData.vehicle_model_name);
                setEditingVehicle(vehicleData);
                setShowEditModal(true);
            } else {
                console.error('No vehicle data found or invalid response:', response.data);
                toast.error('Failed to fetch vehicle details');
            }
        } catch (error) {
            console.error('Error fetching vehicle details:', error);
            toast.error(error.message || 'Failed to fetch vehicle details');
        }
    };

    const handleUpdateSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            console.log('Updating vehicle with data:', formData);
            
            const requestData = {
                operation: "updateVehicleLicense",
                vehicleData: formData
            };

            const response = await axios.post(
                `${encryptedUrl}/update_master1.php`,
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Update response:', response.data);

            if (response.data.status === 'success') {
                toast.success(response.data.message || 'Vehicle updated successfully');
                setShowEditModal(false);
                setEditingVehicle(null);
                // Refresh the vehicles list to show updated data
                await fetchVehicles();
            } else {
                toast.error(response.data.message || 'Failed to update vehicle');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to update vehicle');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleArchiveVehicle = (vehicleIds) => {
        setSelectedVehicles(Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds]);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (selectedVehicles.length > 0) {
            try {
                const response = await axios.post(`${encryptedUrl}/delete_master.php`, 
                    JSON.stringify({
                        operation: "archiveResource",
                        resourceType: "vehicle",
                        resourceId: selectedVehicles
                    }), {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.data.status === 'success') {
                    toast.success(selectedVehicles.length > 1 ? "Vehicles successfully archived!" : "Vehicle successfully archived!");
                    fetchVehicles();
                    setShowConfirmDelete(false);
                    setSelectedVehicles([]);
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        if (searchTerm === '') {
            setFilteredVehicles(vehicles);
        } else {
            const results = vehicles.filter(vehicle =>
                (vehicle.vehicle_model_name && vehicle.vehicle_model_name.toLowerCase().includes(searchTerm)) ||
                (vehicle.vehicle_license && vehicle.vehicle_license.toLowerCase().includes(searchTerm)) ||
                (vehicle.vehicle_make_name && vehicle.vehicle_make_name.toLowerCase().includes(searchTerm)) ||
                (vehicle.vehicle_category_name && vehicle.vehicle_category_name.toLowerCase().includes(searchTerm)) ||
                (vehicle.year && vehicle.year.toString().includes(searchTerm))
            );
            setFilteredVehicles(results);
        }
    };





    const handleRefresh = () => {
        fetchVehicles();
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

    const handleViewUtilization = (vehicle) => {
        setSelectedVehicleForUtilization(vehicle);
        setShowUtilizationModal(true);
    };

    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
                <Sidebar />
            </div>
            
            <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-20">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 sm:mb-8"
                    >
                        <div className="mb-2 sm:mb-4 mt-10">
                           
                            {/* <h2 className="text-2xl font-bold text-green-900 mt-5">
                                List Of Vehicles
                            </h2> */}
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-row flex-wrap md:flex-row md:items-center md:justify-between gap-2 md:gap-4 w-full">
                            <div className="flex flex-row flex-1 gap-2 md:gap-4">
                                <div className="flex-1 min-w-0">
                                    <Input
                                        placeholder="Search vehicles..."
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        size="large"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="w-full"
                                    />
                                </div>
                                <Tooltip title="Refresh data" className="flex-shrink-0">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        size="large"
                                    />
                                </Tooltip>
                                {/* Replace Dropdown with a single Add Vehicle button */}
                                <Button
                                    type="primary"
                                    size="large"
                                    className="bg-lime-900 hover:bg-green-600 flex-shrink-0"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddVehicle}
                                >
                                    Add Vehicle
                                </Button>
                            </div>
                            {selectedVehicles.length > 0 && (
                                <Button
                                    danger
                                    icon={<InboxOutlined />}
                                    onClick={() => handleArchiveVehicle(selectedVehicles)}
                                    size="large"
                                    className="w-full md:w-auto"
                                >
                                    Archive Selected ({selectedVehicles.length})
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4]">
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
                                                                setSelectedVehicles(filteredVehicles.map(vehicle => vehicle.vehicle_id));
                                                            } else {
                                                                setSelectedVehicles([]);
                                                            }
                                                        }}
                                                        checked={selectedVehicles.length === filteredVehicles.length && filteredVehicles.length > 0}
                                                    />
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('vehicle_license')}>
                                                <div className="flex items-center cursor-pointer">
                                                    License
                                                    {sortField === 'vehicle_license' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('vehicle_make_name')}>
                                                <div className="flex items-center cursor-pointer">
                                                    Make
                                                    {sortField === 'vehicle_make_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('vehicle_category_name')}>
                                                <div className="flex items-center cursor-pointer">
                                                    Category
                                                    {sortField === 'vehicle_category_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('vehicle_model_name')}>
                                                <div className="flex items-center cursor-pointer">
                                                    Model
                                                    {sortField === 'vehicle_model_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('year')}>
                                                <div className="flex items-center cursor-pointer">
                                                    Year
                                                    {sortField === 'year' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
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
                                        {filteredVehicles && filteredVehicles.length > 0 ? (
                                            filteredVehicles
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((vehicle) => (
                                                    <tr
                                                        key={vehicle.vehicle_id}
                                                        className="bg-white border-b border-gray-200 hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-4">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                                checked={selectedVehicles.includes(vehicle.vehicle_id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedVehicles([...selectedVehicles, vehicle.vehicle_id]);
                                                                    } else {
                                                                        setSelectedVehicles(selectedVehicles.filter(id => id !== vehicle.vehicle_id));
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center">
                                                                <span className="font-medium">{vehicle.vehicle_license}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">{vehicle.vehicle_make_name}</td>
                                                        <td className="px-4 py-4">{vehicle.vehicle_category_name}</td>
                                                        <td className="px-4 py-4">{vehicle.vehicle_model_name}</td>
                                                        <td className="px-4 py-4">{vehicle.year}</td>
                                                        <td className="px-4 py-4">
                                                            <Tag 
                                                                value={vehicle.status_availability_name || 'Unknown'} 
                                                                severity={vehicle.status_availability_name?.toLowerCase() === 'available' ? 'success' : 'danger'}
                                                                className="px-2 py-1 text-xs font-semibold"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex space-x-2">
                                                                <Button
                                                                    type="primary"
                                                                    icon={<EditOutlined />}
                                                                    onClick={() => handleEditVehicle(vehicle)}
                                                                    size="middle"
                                                                    className="bg-green-900 hover:bg-lime-900"
                                                                />
                                                                <Button
                                                                    danger
                                                                    icon={<InboxOutlined />}
                                                                    onClick={() => handleArchiveVehicle(vehicle.vehicle_id)}
                                                                    size="middle"
                                                                />
                                                                <Button
                                                                    type="default"
                                                                    icon={<BarChartOutlined />}
                                                                    onClick={() => handleViewUtilization(vehicle)}
                                                                    size="middle"
                                                                    className="bg-green-50 hover:bg-green-100"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500">
                                                                No vehicles found
                                                            </span>
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="p-4 border-t border-gray-200">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredVehicles ? filteredVehicles.length : 0}
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
                open={showAddModal}
                onCancel={() => setShowAddModal(false)}
                onSubmit={handleCreateSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Update Modal */}
            <UpdateModal
                open={showEditModal}
                onCancel={() => {
                    setShowEditModal(false);
                    setEditingVehicle(null);
                }}
                onSubmit={handleUpdateSubmit}
                isSubmitting={isSubmitting}
                editingVehicle={editingVehicle}
            />

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
                        onClick={confirmDelete}
                        icon={<InboxOutlined />}
                    >
                        Archive
                    </Button>,
                ]}
            >
                <Alert
                    message="Warning"
                    description={`Are you sure you want to archive ${selectedVehicles.length} vehicle(s)? This action cannot be undone.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>

            {/* Image Preview Modal */}


            {/* Add View Utilization Modal */}
            <ViewUtilization
                open={showUtilizationModal}
                onCancel={() => {
                    setShowUtilizationModal(false);
                    setSelectedVehicleForUtilization(null);
                }}
                vehicle={selectedVehicleForUtilization}
                IMAGE_BASE_URL={IMAGE_BASE_URL}
            />
        </div>
    );
};

export default VehicleEntry;