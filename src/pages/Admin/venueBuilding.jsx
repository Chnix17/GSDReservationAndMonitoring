import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FaBuilding } from 'react-icons/fa';
import { Modal, Input, Button, Tooltip, Alert, Empty, Pagination, Card } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, StopOutlined, EditOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import { SecureStorage } from '../../utils/encryption';
import CreateModal from './lib/Building/Create_Modal';
import UpdateModal from './lib/Building/Update_Modal';

const BuildingManagement = () => {
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedBuildingId, setSelectedBuildingId] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedBuildings, setSelectedBuildings] = useState([]);
    
    const navigate = useNavigate();
    const user_id = SecureStorage.getLocalItem('user_id');
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id");

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

    const fetchBuildings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}/Admin.php`, 
                new URLSearchParams({ operation: "fetchVenueBuildings" })
            );
            if (response.data.status === 'success') {
                setBuildings(response.data.data);
            } else {
                toast.error("Error fetching buildings: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching buildings:", error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Please check your internet connection and try again.");
            } else {
                toast.error("An error occurred while fetching buildings.");
            }
        } finally {
            setLoading(false);
        }
    }, [encryptedUrl]);

    useEffect(() => {
        fetchBuildings();
    }, [fetchBuildings]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleAddBuilding = () => {
        setShowCreateModal(true);
    };

    const handleEditBuilding = (building) => {
        setSelectedBuildingId(building.venue_building_id);
        setShowUpdateModal(true);
    };

    const handleDeactivateBuilding = (buildingIds) => {
        setSelectedBuildings(Array.isArray(buildingIds) ? buildingIds : [buildingIds]);
        setShowConfirmDelete(true);
    };
    
    const confirmDelete = async () => {
        setLoading(true);
        try {
            const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;

            const payload = {
                operation: "archiveBuilding",
                building_ids: selectedBuildings,
                user_id: userId
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
                toast.success(selectedBuildings.length > 1 ? "Buildings successfully deactivated!" : "Building successfully deactivated!");
                fetchBuildings();
                setShowConfirmDelete(false);
                setSelectedBuildings([]);
            } else {
                toast.error("Failed to deactivate building(s): " + response.data.message);
            }
        } catch (error) {
            console.error("Error archiving building(s):", error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to deactivate building(s). Please check your internet connection.");
            } else {
                toast.error("An error occurred while deactivating the building(s).");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchBuildings();
        setSearchTerm('');
    };

    const filteredBuildings = useMemo(() => {
        return buildings.filter(building =>
            building.venue_building_name && 
            building.venue_building_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [buildings, searchTerm]);

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
                                Building Management
                            </h2>
                        </div>
                    </motion.div>

                    <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
                        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                            <div className="flex-grow">
                                <Input
                                    placeholder={isMobile ? "Search buildings..." : "Search buildings by name"}
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-wrap gap-2' : 'gap-2'}`}>
                                {selectedBuildings.length > 0 && (
                                    <Button
                                        danger
                                        icon={<StopOutlined />}
                                        onClick={() => handleDeactivateBuilding(selectedBuildings)}
                                        size={isMobile ? "middle" : "large"}
                                        className={isMobile ? 'w-full' : ''}
                                    >
                                        {isMobile ? `Deactivate (${selectedBuildings.length})` : `Deactivate Selected (${selectedBuildings.length})`}
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
                                    onClick={handleAddBuilding}
                                    className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                                >
                                    {isMobile ? 'Add' : 'Add Building'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4]">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                {isMobile ? (
                                    <div className="space-y-3 p-3">
                                        {filteredBuildings && filteredBuildings.length > 0 ? (
                                            filteredBuildings
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((building) => (
                                                    <Card
                                                        key={building.venue_building_id}
                                                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                                                        size="small"
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                                        checked={selectedBuildings.includes(building.venue_building_id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedBuildings([...selectedBuildings, building.venue_building_id]);
                                                                            } else {
                                                                                setSelectedBuildings(selectedBuildings.filter(id => id !== building.venue_building_id));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <FaBuilding className="text-green-900 text-sm" />
                                                                    <span className="font-medium text-sm truncate max-w-[150px]">
                                                                        {building.venue_building_name}
                                                                    </span>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    <Button
                                                                        type="primary"
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEditBuilding(building)}
                                                                        size="small"
                                                                        className="bg-green-900 hover:bg-lime-900"
                                                                    />
                                                                    <Button
                                                                        danger
                                                                        icon={<StopOutlined />}
                                                                        onClick={() => handleDeactivateBuilding(building.venue_building_id)}
                                                                        size="small"
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
                                                            No buildings found
                                                        </span>
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
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
                                                                        setSelectedBuildings(filteredBuildings.map(b => b.venue_building_id));
                                                                    } else {
                                                                        setSelectedBuildings([]);
                                                                    }
                                                                }}
                                                                checked={selectedBuildings.length === filteredBuildings.length && filteredBuildings.length > 0}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                        <div className="flex items-center">
                                                            Building Name
                                                        </div>
                                                    </th>
                                                    <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                        <div className="flex items-center justify-center">
                                                            Actions
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredBuildings && filteredBuildings.length > 0 ? (
                                                    filteredBuildings
                                                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                        .map((building) => (
                                                            <tr
                                                                key={building.venue_building_id}
                                                                className={`bg-white border-b last:border-b-0 border-gray-200 ${
                                                                    selectedBuildings.includes(building.venue_building_id) ? 'bg-blue-50' : ''
                                                                }`}
                                                            >
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                                        checked={selectedBuildings.includes(building.venue_building_id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedBuildings([...selectedBuildings, building.venue_building_id]);
                                                                            } else {
                                                                                setSelectedBuildings(selectedBuildings.filter(id => id !== building.venue_building_id));
                                                                            }
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    <div className="flex items-center">
                                                                        <FaBuilding className="mr-2 text-green-900" />
                                                                        <span className="font-medium">{building.venue_building_name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                                                    <div className={`flex space-x-2 ${isTablet ? 'justify-start' : 'justify-center'}`}>
                                                                        <Button
                                                                            type="primary"
                                                                            icon={<EditOutlined />}
                                                                            onClick={() => handleEditBuilding(building)}
                                                                            size={isTablet ? "small" : "middle"}
                                                                            className="bg-green-900 hover:bg-lime-900"
                                                                        />
                                                                        <Button
                                                                            danger
                                                                            icon={<StopOutlined />}
                                                                            onClick={() => handleDeactivateBuilding(building.venue_building_id)}
                                                                            size={isTablet ? "small" : "middle"}
                                                                        />
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
                                                                    <span className="text-gray-500">
                                                                        No buildings found
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

                                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200`}>
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredBuildings ? filteredBuildings.length : 0}
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

            <CreateModal
                visible={showCreateModal}
                onCancel={() => setShowCreateModal(false)}
                onSuccess={fetchBuildings}
                encryptedUrl={encryptedUrl}
                user_id={user_id}
            />

            <UpdateModal
                visible={showUpdateModal}
                onCancel={() => setShowUpdateModal(false)}
                onSuccess={fetchBuildings}
                buildingId={selectedBuildingId}
            />

            <Modal
                open={showConfirmDelete}
                onCancel={() => {
                    setShowConfirmDelete(false);
                    setSelectedBuildings([]);
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
                            setSelectedBuildings([]);
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="deactivate"
                        type="primary"
                        danger
                        onClick={confirmDelete}
                        loading={loading}
                        icon={<DeleteOutlined />}
                    >
                        Deactivate
                    </Button>
                ]}
            >
                <Alert
                    message="Warning"
                    description={`Are you sure you want to deactivate ${selectedBuildings.length} building(s)? This action will move them to inactive status. Note: Buildings assigned to active venues cannot be deactivated.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>
        </div>
    );
};

export default BuildingManagement;
