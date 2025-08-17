import React, { useState, useEffect, useCallback } from 'react';
import { Button, Tag, Space, message, Modal, Table, Input, Alert, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined, CalendarOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { SecureStorage } from '../../../../../utils/encryption';
import ViewUtilization from '../View_Utilization_unit';
import ViewUtilizationConsumable from '../View_Utilization_Consumable';

const EquipmentView = ({ equipmentId, onUpdate, onClose, isOpen }) => {
    console.log('EquipmentView component rendered with ID:', equipmentId);

    const [loading, setLoading] = useState(true);
    const [equipment, setEquipment] = useState(null);
    const [quickAdjustment, setQuickAdjustment] = useState({
        quantity: '',
        tagNumber: '',
        size: '',
        color: '',
        brand: ''
    });

    // Add state for editing unit
    const [isEditingUnit, setIsEditingUnit] = useState(false);
    const [editingUnitId, setEditingUnitId] = useState(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [statusOptions, setStatusOptions] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(1); // default to 'Available'

    // Get base URL from SecureStorage
    const baseUrl = SecureStorage.getLocalItem("url");

    const fetchEquipmentDetails = useCallback(async () => {
        console.log('Fetching equipment details for ID:', equipmentId);
        setLoading(true);
        try {
            const url = `${baseUrl}/user.php`;
            const params = new URLSearchParams({
                operation: "fetchEquipmentById",
                id: equipmentId,
                type: "Consumable"
            });
            
            console.log('Making API call with params:', params.toString());
            const response = await axios.post(url, params);
            console.log('Raw API Response:', response);

            if (response.data.status === 'success') {
                console.log('Successfully fetched equipment:', response.data.data);
                setEquipment(response.data.data);
            } else {
                console.log('Failed to fetch equipment:', response.data);
                message.error("Failed to fetch equipment details");
            }
        } catch (error) {
            console.error("Error fetching equipment details:", error);
            message.error("An error occurred while fetching equipment details");
        } finally {
            setLoading(false);
        }
    }, [equipmentId, baseUrl]);

    const fetchStatusOptions = async () => {
        try {
            const response = await axios.post(`${baseUrl}/user.php`, { operation: "fetchStatusAvailability" });
            if (response.data.status === 'success') {
                setStatusOptions(response.data.data);
            }
        } catch (error) {
            message.error("Failed to fetch status options");
        }
    };

    useEffect(() => {
        if (isOpen && equipmentId) {
            console.log('useEffect triggered, equipmentId:', equipmentId);
            fetchEquipmentDetails();
        }
    }, [equipmentId, isOpen, fetchEquipmentDetails]);

    const [isViewUtilizationOpen, setIsViewUtilizationOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [showConfirmArchive, setShowConfirmArchive] = useState(false);

    const handleQuickAdjustment = async (type) => {
        if (!equipment) {
            message.error('Equipment data not loaded');
            return;
        }

        if (equipment.equip_type === 'Bulk') {
            if (!quickAdjustment.quantity) {
                message.error('Please enter quantity');
                return;
            }

            // Prevent decreasing stock: new quantity must be >= current on-hand
            const newQty = parseInt(quickAdjustment.quantity, 10);
            const currentQty = parseInt(equipment.on_hand_quantity || 0, 10);
            if (isNaN(newQty)) {
                message.error('Please enter a valid quantity');
                return;
            }
            

            try {
                const params = new URLSearchParams({
                    operation: "saveStock",
                    equip_id: equipmentId,
                    quantity: newQty,
                    user_admin_id: SecureStorage.getSessionItem('user_id')
                });

                const response = await axios.post(`${baseUrl}/user.php`, params);

                if (response.data.status === 'success') {
                    message.success(`Stock updated to ${quickAdjustment.quantity} items`);
                    // Clear the form
                    setQuickAdjustment({
                        quantity: '',
                        tagNumber: '',
                        size: '',
                        color: '',
                        brand: ''
                    });
                    // Refresh equipment data
                    await fetchEquipmentDetails();
                    // Call onUpdate callback to refresh parent component
                    if (typeof onUpdate === 'function') {
                        onUpdate();
                    }
                } else {
                    throw new Error(response.data.message || 'Failed to update stock');
                }
            } catch (error) {
                console.error('Error updating stock:', error);
                message.error('Failed to update stock: ' + (error.message || 'Unknown error'));
            }
        } else {
            if (!quickAdjustment.tagNumber) {
                message.error('Please enter tag number');
                return;
            }

            try {
                const params = new URLSearchParams({
                    operation: "saveUnit",
                    equip_id: equipmentId,
                    serial_number: quickAdjustment.tagNumber,
                    status_availability_id: 1, // Default to available
                    user_admin_id: SecureStorage.getSessionItem('user_id')
                });

                console.log('Unit Data:', params.toString());

                const response = await axios.post(`${baseUrl}/user.php`, params);
                
                if (response.data.status !== 'success') {
                    throw new Error(response.data.message || 'Failed to save unit');
                }

                message.success('Successfully added item with tag number: ' + quickAdjustment.tagNumber);
                // Clear the form
                setQuickAdjustment({
                    quantity: '',
                    tagNumber: '',
                    size: '',
                    color: '',
                    brand: ''
                });
                // Refresh equipment data
                await fetchEquipmentDetails();
                // Call onUpdate callback to refresh parent component
                if (typeof onUpdate === 'function') {
                    onUpdate();
                }
            } catch (error) {
                console.error('Error saving unit:', error);
                message.error('Failed to save unit: ' + (error.message || 'Unknown error'));
            }
        }
    };

    const handleEditUnit = (unit) => {
        setIsEditingUnit(true);
        setEditingUnitId(unit.unit_id);
        setQuickAdjustment({
            quantity: '',
            tagNumber: unit.serial_number,
            size: unit.size || '',
            color: unit.color || '',
            brand: unit.brand || ''
        });
        setSelectedStatus(unit.status_availability_id || 1);
        fetchStatusOptions();
    };

    const handleUpdateUnit = async () => {
        if (!editingUnitId) return;

        try {
            // Backend expects top-level JSON payload (not nested) sent to gsd/update_master1.php
            const payload = {
                operation: "updateEquipmentUnit",
                unit_id: editingUnitId,
                serial_number: quickAdjustment.tagNumber,
                status_availability_id: selectedStatus
            };

            console.log('Updating unit with data:', payload);
            console.log('Editing Unit ID:', editingUnitId);
            console.log('Form Data:', quickAdjustment);

            const response = await axios.post(
                `${baseUrl}/user.php`,
                JSON.stringify(payload),
                { headers: { 'Content-Type': 'application/json' } }
            );
            console.log('Update response:', response.data);

            if (response.data.status === 'success') {
                message.success('Unit updated successfully');
                setIsEditingUnit(false);
                setEditingUnitId(null);
                setQuickAdjustment({
                    quantity: '',
                    tagNumber: '',
                    size: '',
                    color: '',
                    brand: ''
                });
                // Refresh equipment data
                await fetchEquipmentDetails();
                // Call onUpdate callback to refresh parent component
                if (typeof onUpdate === 'function') {
                    onUpdate();
                }
            } else {
                throw new Error(response.data.message || 'Failed to update unit');
            }
        } catch (error) {
            console.error('Error updating unit:', error);
            message.error('Failed to update unit: ' + (error.message || 'Unknown error'));
        }
    };

    const handleArchiveUnit = (unit) => {
        setSelectedUnits([unit.unit_id]);
        setShowConfirmArchive(true);
    };

    const handleMultipleArchive = (units) => {
        const unitIds = units.map(unit => unit.unit_id);
        setSelectedUnits(unitIds);
        setShowConfirmArchive(true);
    };

    const confirmArchive = async () => {
        if (!selectedUnits.length) return;
        
        try {
            const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
            const archiveData = {
                operation: "archiveResource",
                resourceType: "equipment",
                resourceId: selectedUnits,
                is_serialize: true,
                userid: userId
            };

            const response = await axios.post(`${baseUrl}/delete_master.php`, archiveData, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.status === 'success') {
                message.success(selectedUnits.length > 1 ? 'Units archived successfully' : 'Unit archived successfully');
                // Refresh equipment data
                await fetchEquipmentDetails();
                // Call onUpdate callback to refresh parent component
                if (typeof onUpdate === 'function') {
                    onUpdate();
                }
            } else {
                throw new Error(response.data.message || 'Failed to archive unit(s)');
            }
        } catch (error) {
            console.error('Error archiving unit(s):', error);
            message.error('Failed to archive unit(s): ' + (error.message || 'Unknown error'));
        } finally {
            setShowConfirmArchive(false);
            setSelectedUnits([]);
        }
    };

    const handleViewUnitUsage = async (unitId) => {
        try {
            const url = `${baseUrl}/user.php`;
            const response = await axios.post(url, new URLSearchParams({
                operation: "getEquipmentUnitUsage",
                unitId: unitId
            }));

            if (response.data.status === 'success') {
                setSelectedUnit(response.data.data.equipment_unit_details);
                setIsViewUtilizationOpen(true);
            } else {
                message.error("Failed to fetch unit usage data");
            }
        } catch (error) {
            console.error("Error fetching unit usage:", error);
            message.error("An error occurred while fetching unit usage");
        }
    };

    const renderContent = () => {
        if (!equipment) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">No equipment data available</div>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                {/* Equipment Information Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <EditOutlined className="mr-2 text-green-900" />
                            Equipment Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-gray-500">Name</span>
                                <p className="text-base text-gray-900">{equipment.equip_name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-gray-500">Category</span>
                                <p className="text-base text-gray-900">{equipment.category_name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-gray-500">Type</span>
                                <p className="text-base text-gray-900 capitalize">{equipment.equip_type || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-gray-500">Total Quantity</span>
                                <p className="text-xl font-bold text-green-900">{equipment.equip_quantity || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-gray-500">Created At</span>
                                <p className="text-base text-gray-900">{equipment.equip_created_at || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Information Card for Bulk Items */}
                {equipment.equip_type === 'Bulk' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <CalendarOutlined className="mr-2 text-green-900" />
                                    Stock Information
                                </h4>
                                <Space wrap size={[8, 8]}>
                                    <Button
                                        type="primary"
                                        icon={<EyeOutlined />}
                                        onClick={() => setIsViewUtilizationOpen(true)}
                                        className="bg-green-900 hover:bg-lime-900"
                                    >
                                        View Usage
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            setQuickAdjustment(prev => ({
                                                ...prev,
                                                quantity: 0
                                            }));
                                            setIsAddModalVisible(true);
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Add Quantity
                                    </Button>
                                </Space>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <p className="text-3xl font-bold text-green-600">{equipment.on_hand_quantity || 0}</p>
                                    <p className="text-sm text-gray-600 mt-1">Current Stock</p>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <p className="text-3xl font-bold text-gray-600">{equipment.equip_quantity || 0}</p>
                                    <p className="text-sm text-gray-600 mt-1">Default Quantity</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Units Information Card */}
                {equipment.equip_type === 'Serialized' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <UserOutlined className="mr-2 text-green-900" />
                                    Unit Details
                                </h4>
                                <Space wrap size={[8, 8]}>
                                    {selectedUnits.length > 0 && (
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleMultipleArchive(equipment.units.filter(unit => selectedUnits.includes(unit.unit_id)))}
                                            size="middle"
                                        >
                                            Archive Selected ({selectedUnits.length})
                                        </Button>
                                    )}
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setIsAddModalVisible(true)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Add Unit
                                    </Button>
                                </Space>
                            </div>
                            {equipment.units && equipment.units.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table
                                        dataSource={equipment.units}
                                        rowKey="unit_id"
                                        pagination={false}
                                        size="middle"
                                        scroll={{ x: true, y: 360 }}
                                        className="unit-table"
                                        rowSelection={{
                                            type: 'checkbox',
                                            selectedRowKeys: selectedUnits,
                                            onChange: (selectedRowKeys) => setSelectedUnits(selectedRowKeys),
                                        }}
                                        columns={[
                                            {
                                                title: 'Serial Number',
                                                dataIndex: 'serial_number',
                                                key: 'serial_number',
                                                ellipsis: true,
                                                render: (text) => (
                                                    <span className="font-mono">{text || 'N/A'}</span>
                                                )
                                            },
                                            {
                                                title: 'Status',
                                                dataIndex: 'status_availability_id',
                                                key: 'status',
                                                render: (status) => {
                                                    // Status mapping: id -> { name, color }
                                                    const statusMap = {
                                                        1: { name: 'Available', color: 'success' },
                                                        2: { name: 'Unavailable', color: 'error' },
                                                        5: { name: 'In Use', color: 'warning' },
                                                        6: { name: 'For Inspection', color: 'processing' },
                                                        7: { name: 'Missing', color: 'magenta' },
                                                        8: { name: 'Damaged', color: 'volcano' },
                                                        9: { name: 'Available Stock', color: 'cyan' },
                                                        10: { name: 'Out of stock', color: 'default' },
                                                    };
                                                    const statusInfo = statusMap[status] || { name: 'Unknown', color: 'default' };
                                                    return (
                                                        <Tag color={statusInfo.color}>
                                                            {statusInfo.name}
                                                        </Tag>
                                                    );
                                                }
                                            },
                                            {
                                                title: 'Created At',
                                                dataIndex: 'unit_created_at',
                                                key: 'created_at',
                                                responsive: ['sm'],
                                                render: (text) => text || 'N/A'
                                            },
                                            {
                                                title: 'Actions',
                                                key: 'actions',
                                                render: (_, record) => (
                                                    <Space size="middle">
                                                        <Button
                                                            type="default"
                                                            icon={<EyeOutlined />}
                                                            onClick={() => handleViewUnitUsage(record.unit_id)}
                                                            title="View Usage"
                                                            className="bg-green-50 hover:bg-green-100"
                                                        />
                                                        <Button
                                                            type="primary"
                                                            icon={<EditOutlined />}
                                                            onClick={() => handleEditUnit(record)}
                                                            title="Edit Unit"
                                                            className="bg-green-900 hover:bg-lime-900"
                                                        />
                                                        <Button
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => handleArchiveUnit(record)}
                                                            title="Archive Unit"
                                                        />
                                                    </Space>
                                                )
                                            }
                                        ]}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No units available. Click "Add Unit" to add a new unit.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Edit Unit Modal */}
                <Modal
                    title="Edit Unit"
                    open={isEditingUnit}
                    onCancel={() => {
                        setIsEditingUnit(false);
                        setEditingUnitId(null);
                        setQuickAdjustment({
                            quantity: '',
                            tagNumber: '',
                        });
                    }}
                    footer={null}
                    destroyOnClose
                    getContainer={false}
                    styles={{ body: { maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' } }}
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tag Number *
                            </label>
                            <Input
                                value={quickAdjustment.tagNumber}
                                onChange={(e) => setQuickAdjustment(prev => ({ ...prev, tagNumber: e.target.value }))}
                                placeholder="Enter tag number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status *
                            </label>
                            <Select
                                value={selectedStatus}
                                onChange={setSelectedStatus}
                                style={{ width: '100%' }}
                                getPopupContainer={trigger => trigger.parentNode}
                            >
                                {statusOptions.map(option => (
                                    <Select.Option key={option.status_availability_id} value={option.status_availability_id}>
                                        {option.status_availability_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                type="primary"
                                onClick={handleUpdateUnit}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                Update Unit
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsEditingUnit(false);
                                    setEditingUnitId(null);
                                    setQuickAdjustment({
                                        quantity: '',
                                        tagNumber: '',
                                    });
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    };

    const renderAddModal = () => {
        if (!equipment) return null;

        return (
            <Modal
                title={equipment.equip_type === 'Bulk' ? 'Adjust Stock' : 'Add Unit'}
                open={isAddModalVisible}
                onCancel={() => {
                    setIsAddModalVisible(false);
                    setQuickAdjustment({
                        quantity: '',
                        tagNumber: '',
                        size: '',
                        color: '',
                        brand: ''
                    });
                }}
                footer={null}
                destroyOnClose
                getContainer={false}
                styles={{ body: { maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' } }}
            >
                <div className="space-y-6">
                    {equipment.equip_type === 'Bulk' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Add Quantity *
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={quickAdjustment.quantity}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
                                    placeholder="Enter new stock quantity"
                                />
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        handleQuickAdjustment('adjust');
                                        setIsAddModalVisible(false);
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Add Quantity
                                </Button>
                                <Button
                                    onClick={() => setIsAddModalVisible(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tag Number *
                                </label>
                                <Input
                                    value={quickAdjustment.tagNumber}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, tagNumber: e.target.value }))}
                                    placeholder="Enter tag number (e.g., EQP-2025-001)"
                                />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        handleQuickAdjustment('add');
                                        setIsAddModalVisible(false);
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Add Unit
                                </Button>
                                <Button
                                    onClick={() => setIsAddModalVisible(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        );
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <EditOutlined className="mr-2 text-green-900" />
                    {equipment?.equip_name || 'Loading...'}
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            width={'min(1000px, 95vw)'}
            footer={null}
            destroyOnClose
            zIndex={1100}
            styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 8 } }}
        >
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="loader"></div>
                </div>
            ) : (
                <>
                    {renderContent()}
                    {renderAddModal()}
                    {equipment?.equip_type === 'Bulk' ? (
                        <ViewUtilizationConsumable
                            open={isViewUtilizationOpen}
                            onCancel={() => setIsViewUtilizationOpen(false)}
                            equipment={equipment}
                        />
                    ) : (
                        <ViewUtilization
                            open={isViewUtilizationOpen}
                            onCancel={() => setIsViewUtilizationOpen(false)}
                            equipment={selectedUnit}
                        />
                    )}
                    <Modal
                        title={<div className="text-red-600 flex items-center"><ExclamationCircleOutlined className="mr-2" /> Confirm Archive</div>}
                        open={showConfirmArchive}
                        onCancel={() => {
                            setShowConfirmArchive(false);
                            setSelectedUnits([]);
                        }}
                        destroyOnClose
                        getContainer={false}
                        footer={[
                            <Button key="back" onClick={() => {
                                setShowConfirmArchive(false);
                                setSelectedUnits([]);
                            }}>
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
                                Archive
                            </Button>,
                        ]}
                    >
                        <Alert
                            message="Warning"
                            description={`Are you sure you want to archive ${selectedUnits.length} unit(s)? This action cannot be undone.`}
                            type="warning"
                            showIcon
                            icon={<ExclamationCircleOutlined />}
                        />
                    </Modal>
                </>
            )}
        </Modal>
    );
};

export default EquipmentView;
