import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message as toast, Modal, Button, Input, Space, Empty, Pagination, Tooltip, Card} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined, StopOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import { SecureStorage } from '../../utils/encryption';
import UpdateEquipmentModal from './lib/Equipment/Update_Modal';
import MasterEquipmentModal from './lib/Equipment/Master_Modal';
import Sidebar from '../../components/core/Sidebar';
import axios from 'axios';
import { FaTools } from 'react-icons/fa';

// Helper functions



const EquipmentEntry = () => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

    const [equipments, setEquipments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
    const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  
    const [sortField, setSortField] = useState('equip_id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [newUnitSerialNumbers, setNewUnitSerialNumbers] = useState(['']);

    const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
    const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);

    const navigate = useNavigate();
    const user_level_id = SecureStorage.getLocalItem('user_level_id');

    useEffect(() => {
        const decryptedUserLevel = parseInt(user_level_id);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            navigate('/');
        }
    }, [user_level_id, navigate]);

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
        fetchEquipments();
  
    }, []);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchEquipments = async () => {
        setLoading(true);
        const encryptedUrl = SecureStorage.getLocalItem("url");
        const url = `${encryptedUrl}Admin.php`;
        const jsonData = { operation: "fetchEquipmentsWithStatus" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setEquipments(response.data.data);
                console.log(response.data.data);
            } else {
                toast.error("Error fetching equipments: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching equipments:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                toast.error("An error occurred while fetching equipments.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (equipment) => {
        setEditingEquipmentId(equipment.equip_id);
        setIsEditModalOpen(true);
    };

    // const handleArchiveEquipment = (unit_ids) => {
    //     console.log('Archive clicked with unit_ids:', unit_ids);
    //     // Convert single unit_id to array if it's not already an array
    //     const unitIdsArray = Array.isArray(unit_ids) ? unit_ids : [unit_ids];
    //     setSelectedUnitId(unitIdsArray);
    //     setShowConfirmDelete(true);
    // };

    // const confirmDelete = async () => {
    //     setLoading(true);
    //     try {
    //         const encryptedUrl = SecureStorage.getLocalItem("url");
    //         const url = `${encryptedUrl}/delete_master.php`;
    //         const jsonData = {
    //             operation: "archiveResource",
    //             resourceType: "equipment",
    //             resourceId: selectedUnitId,
    //             is_serialize: true
    //         };

    //         console.log('Sending archive request with data:', jsonData);

    //         const response = await fetch(url, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(jsonData)
    //         });

    //         const data = await response.json();
    //         console.log('Archive response:', data);
            
    //         if (data.status === 'success') {
    //             toast.success(selectedUnitId.length > 1 ? "Equipment units archived successfully" : "Equipment unit archived successfully");
    //             setShowConfirmDelete(false);
    //             fetchEquipments();
    //         } else {
    //             toast.error(data.message || "Failed to archive equipment unit(s)");
    //         }
    //     } catch (error) {
    //         console.error('Archive error:', error);
    //         toast.error("An error occurred while archiving equipment unit(s): " + error.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleRefresh = () => {
        fetchEquipments();
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

    const handleAddUnit = () => {
        setIsAddUnitModalOpen(true);
    };

    // Add this new function to handle adding more serial number fields
    const addSerialNumberField = () => {
        setNewUnitSerialNumbers([...newUnitSerialNumbers, '']);
    };

    // Add this new function to handle removing a serial number field
    const removeSerialNumberField = (index) => {
        const newSerials = newUnitSerialNumbers.filter((_, i) => i !== index);
        setNewUnitSerialNumbers(newSerials.length ? newSerials : ['']);
    };

    // Add this new function to update a serial number
    const updateSerialNumber = (index, value) => {
        const newSerials = [...newUnitSerialNumbers];
        newSerials[index] = value;
        setNewUnitSerialNumbers(newSerials);
    };

    const filteredEquipments = equipments.filter(equipment =>
        equipment.equip_name && equipment.equip_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeactivateClick = (equipId) => {
        setSelectedEquipmentId(equipId);
        setShowConfirmDeactivate(true);
    };

    const confirmDeactivate = async () => {
        if (!selectedEquipmentId) return;
        
        setLoading(true);
        try {
            const encryptedUrl = SecureStorage.getLocalItem("url");
            const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
            const url = `${encryptedUrl}Admin.php`;
            
            const response = await axios.post(url, {
                operation: "archiveResource",
                resourceType: "equipment",
                resourceId: [selectedEquipmentId],
                userid: userId
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.status === 'success') {
                toast.success("Equipment deactivated successfully");
                setShowConfirmDeactivate(false);
                setSelectedEquipmentId(null);
                fetchEquipments();
            } else {
                toast.error(response.data.message || "Failed to deactivate equipment");
            }
        } catch (error) {
            console.error('Deactivate error:', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to deactivate equipment. Please check your internet connection.');
            } else {
                toast.error("An error occurred while deactivating equipment: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Sidebar - hidden on mobile */}
      {!isMobile && (
        <div className="flex-shrink-0">
            <Sidebar />
        </div>
      )}

            {isMobile && (
        <div className="flex-shrink-0">
            <Sidebar />
        </div>
      )}
            
      {/* Main Content */}
      <div className={`flex-grow overflow-y-auto`}>
        <div className={`${isMobile ? 'px-4 py-4 mt-15' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
            <motion.div 
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`${isMobile ? 'mb-3' : 'mb-4'}`}
            >
                <div className="mb-2 sm:mb-4 mt-10">
                    <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-900 mt-5`}>
                        Equipment 
                    </h2>
                </div>
            </motion.div>

            {/* Search and Filters */}
            <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
                <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
                    <div className="flex-grow">
                        <Input
                            placeholder={isMobile ? "Search equipment..." : "Search equipments by name"}
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
                                style={!isMobile ? { borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
                            >
                                {isMobile && 'Refresh'}
                            </Button>
                        </Tooltip>
                        <Button
                            type="primary"
                            size={isMobile ? "middle" : "large"}
                            className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                            onClick={() => setIsMasterModalOpen(true)}
                            icon={<PlusOutlined />}
                        >
                            {isMobile ? 'Add Equipment' : (
                                <Space>
                                    Add Equipment
                                </Space>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={`relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100`}>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <>
                        {isMobile ? (
                            // Mobile Card View
                            <div className="space-y-3 p-3">
                                {filteredEquipments && filteredEquipments.length > 0 ? (
                                    filteredEquipments
                                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                        .map((equipment) => (
                                            <Card
                                                key={equipment.equip_id}
                                                className="bg-white border border-gray-200 rounded-lg shadow-sm"
                                                size="small"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <FaTools className="text-green-900 text-sm" />
                                                            <span className="font-medium text-sm truncate max-w-[150px]">
                                                                {equipment.equip_name}
                                                            </span>
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <Button
                                                                size="small"
                                                                type="primary"
                                                                icon={<EditOutlined />}
                                                                onClick={() => handleEditClick(equipment)}
                                                                className="bg-green-600 hover:bg-green-700 border-green-600"
                                                            />
                                                            <Button
                                                                size="small"
                                                                danger
                                                                icon={<StopOutlined />}
                                                                onClick={() => handleDeactivateClick(equipment.equip_id)}
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
                                                    No equipments found
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
                                            <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`} onClick={() => handleSort('equip_name')}>
                                                <div className="flex items-center">
                                                    EQUIPMENT NAME
                                                    {sortField === 'equip_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>
                                                <div className="flex items-center">
                                                    ACTIONS
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEquipments && filteredEquipments.length > 0 ? (
                                            filteredEquipments
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((equipment) => (
                                                    <tr key={equipment.equip_id} className="bg-white border-b last:border-b-0 border-gray-200">
                                                        <td className={isTablet ? 'px-3 py-4' : 'px-4 py-6'}>
                                                            <div className="flex items-center">
                                                                <span className="font-bold truncate block max-w-[140px]">{equipment.equip_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className={isTablet ? 'px-3 py-4' : 'px-4 py-6'}>
                                                            <div className="flex justify-center space-x-2">
                                                                <Tooltip title="Edit Equipment">
                                                                    <Button
                                                                        type="primary"
                                                                        icon={<EditOutlined />}
                                                                        size={isTablet ? "small" : "middle"}
                                                                        onClick={() => handleEditClick(equipment)}
                                                                        className="bg-green-900 hover:bg-lime-900"
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Deactivate Equipment">
                                                                    <Button
                                                                        danger
                                                                        icon={<StopOutlined />}
                                                                        size={isTablet ? "small" : "middle"}
                                                                        onClick={() => handleDeactivateClick(equipment.equip_id)}
                                                                    />
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={2} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No equipments found
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

                        {/* Pagination */}
                        <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={filteredEquipments ? filteredEquipments.length : 0}
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

            {/* Update Unit Modal */}
            {/* <Modal
                title={<div className="flex items-center">
                    <EditOutlined className="mr-2 text-green-900" />
                    Update Equipment Unit
                </div>}
                open={isUpdateUnitModalOpen}
                onCancel={() => setIsUpdateUnitModalOpen(false)}
 
                confirmLoading={loading}
                destroyOnClose
            >
                {unitDetails && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
                            <Input 
                                value={unitDetails.equip_name} 
                                readOnly 
                                className="bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                            <Input 
                                value={unitDetails.serial_number}
                                onChange={(e) => setUnitDetails({
                                    ...unitDetails,
                                    serial_number: e.target.value
                                })}
                                placeholder="Enter serial number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <Select
                                value={unitDetails.status_availability_id}
                                onChange={(value) => setUnitDetails({
                                    ...unitDetails,
                                    status_availability_id: value
                                })}
                                style={{ width: '100%' }}
                            >
                                {statusAvailability.map(status => (
                                    <Select.Option 
                                        key={status.status_availability_id} 
                                        value={status.status_availability_id}
                                    >
                                        {status.status_availability_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                )}
            </Modal> */}

            {/* Add/Edit Equipment Modal */}


            <UpdateEquipmentModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingEquipmentId(null);
                }}
                onSuccess={fetchEquipments}
                equipmentId={editingEquipmentId}
            />
            
            {/* Confirm Delete Modal */}
            {/* <Modal
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
                    description={`Are you sure you want to archive this equipment unit? This action cannot be undone.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal> */}

            {/* Add Unit Modal */}
            <Modal
                title={<div className="flex items-center">
                    <PlusOutlined className="mr-2 text-green-900" />
                    Add Equipment Unit
                </div>}
                open={isAddUnitModalOpen}
                onCancel={() => {
                    setIsAddUnitModalOpen(false);
                    setNewUnitSerialNumbers(['']);
                }}
                onOk={handleAddUnit}
                confirmLoading={loading}
                okText="Add Units"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial Numbers</label>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {newUnitSerialNumbers.map((serial, index) => (
                                <Space key={index}>
                                    <Input
                                        value={serial}
                                        onChange={(e) => updateSerialNumber(index, e.target.value)}
                                        placeholder="Enter serial number"
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeSerialNumberField(index)}
                                        disabled={newUnitSerialNumbers.length === 1}
                                    />
                                </Space>
                            ))}
                            <Button
                                type="dashed"
                                onClick={addSerialNumberField}
                                block
                                icon={<PlusOutlined />}
                            >
                                Add More Serial Numbers
                            </Button>
                        </Space>
                    </div>
                </div>
            </Modal>

            <MasterEquipmentModal
                isOpen={isMasterModalOpen}
                onClose={() => setIsMasterModalOpen(false)}
                onSuccess={fetchEquipments}
            />

            {/* Confirm Deactivate Modal */}
            <Modal
                title={
                    <div className="text-orange-600 flex items-center">
                        <ExclamationCircleOutlined className="mr-2" /> 
                        Confirm Deactivation
                    </div>
                }
                open={showConfirmDeactivate}
                onCancel={() => {
                    setShowConfirmDeactivate(false);
                    setSelectedEquipmentId(null);
                }}
                footer={[
                    <Button 
                        key="back" 
                        onClick={() => {
                            setShowConfirmDeactivate(false);
                            setSelectedEquipmentId(null);
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={loading}
                        onClick={confirmDeactivate}
                        icon={<StopOutlined />}
                    >
                        Deactivate
                    </Button>,
                ]}
            >
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationCircleOutlined className="text-orange-400 text-xl" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-orange-700">
                                Are you sure you want to deactivate this equipment? This will make it unavailable for reservations.
                                You can reactivate it later from the Archive page.
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EquipmentEntry;