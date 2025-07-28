import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message as toast, Modal, Button, Input, Space, Empty, Pagination, Tooltip, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DownOutlined, ToolOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { SecureStorage } from '../../utils/encryption';
import UpdateEquipmentModal from './lib/Equipment/Update_Modal';
import MasterEquipmentModal from './lib/Equipment/Master_Modal';
import Sidebar from '../Sidebar';
import axios from 'axios';
import TrackingModal from './lib/Equipment/core/view';

// Helper functions



const EquipmentEntry = () => {
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
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);

    const navigate = useNavigate();
    const user_level_id = SecureStorage.getLocalItem('user_level_id');

    useEffect(() => {
        const decryptedUserLevel = parseInt(user_level_id);
        if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
            navigate('/');
        }
    }, [user_level_id, navigate]);

    useEffect(() => {
        fetchEquipments();
  
    }, []);




    const fetchEquipments = async () => {
        setLoading(true);
        const encryptedUrl = SecureStorage.getLocalItem("url");
        const url = `${encryptedUrl}/user.php`;
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
            toast.error("An error occurred while fetching equipments.");
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

    const handleTrackingClick = (equipment) => {
        console.log('View button clicked for equipment:', equipment);
        setSelectedEquipment(equipment);
        setIsTrackingModalOpen(true);
    };

    const handleMenuClick = (e) => {
        switch (e.key) {
            case 'add':
                setIsMasterModalOpen(true);
                break;
            case 'viewCategories':
                navigate('/equipmentCategory');
                break;
            default:
                break;
        }
    };

    const items = [
        {
            key: 'add',
            icon: <PlusOutlined />,
            label: 'Add Equipment',
        },
        {
            key: 'viewCategories',
            icon: <ToolOutlined />,
            label: 'View Categories',
        },
    ];

    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-none">
                <Sidebar />
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 sm:mb-8"
                    >
                        <div className="mb-2 sm:mb-4 mt-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-5">
                                Equipment 
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-row items-center gap-2 w-full">
                            <div className="flex-grow">
                                <Input
                                    placeholder="Search equipments by name"
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
                            <Dropdown
                                menu={{
                                    items,
                                    onClick: handleMenuClick,
                                }}
                            >
                                <Button
                                    type="primary"
                                    size="large"
                                    className="bg-lime-900 hover:bg-green-600"
                                >
                                    <Space>
                                        Add Equipment
                                        <DownOutlined />
                                    </Space>
                                </Button>
                            </Dropdown>
                        </div>
                    </div>

                    {/* Table */}
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
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('equip_name')}>
                                                <div className="flex items-center cursor-pointer">
                                                    EQUIPMENT NAME
                                                    {sortField === 'equip_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4" onClick={() => handleSort('total_quantity')}>
                                                <div className="flex items-center cursor-pointer">
                                                    QUANTITY
                                                    {sortField === 'total_quantity' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    CATEGORY
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
                                                <div className="flex items-center">
                                                    TYPE
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-4">
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
                                                        <td className="px-4 py-6">
                                                            <div className="flex items-center">
                                                                <span className="font-bold truncate block max-w-[140px]">{equipment.equip_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-6 font-medium">
                                                            {equipment.total_quantity || 0}
                                                        </td>
                                                        <td className="px-4 py-6">{equipment.category_name || 'Not specified'}</td>
                                                        <td className="px-4 py-6">{equipment.equip_type || 'Not specified'}</td>
                                                        <td className="px-4 py-6">
                                                            <div className="flex justify-center space-x-2">
                                                                <Tooltip title="View Details">
                                                                    <Button
                                                                        shape="circle"
                                                                        icon={<EyeOutlined />}
                                                                        onClick={() => handleTrackingClick(equipment)}
                                                                        size="large"
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Edit Equipment">
                                                                    <Button
                                                                        shape="circle"
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEditClick(equipment)}
                                                                        size="large"
                                                                        className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                                                    />
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
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

                                {/* Pagination */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredEquipments ? filteredEquipments.length : 0}
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

            {/* Add Tracking Modal */}
            <TrackingModal
                isOpen={isTrackingModalOpen}
                onClose={() => {
                    console.log('Closing tracking modal');
                    setIsTrackingModalOpen(false);
                    setSelectedEquipment(null);
                }}
                equipmentId={selectedEquipment?.equip_id}
                onSuccess={fetchEquipments}
            />
        </div>
    );
};

export default EquipmentEntry;