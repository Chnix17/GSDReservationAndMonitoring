import React, { useState, useEffect, useCallback } from 'react';
import { Button, Tag, Space, message, Modal, Table, Input, Alert, Select, Drawer, Card } from 'antd';
import { toast } from 'react-toastify';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined, CalendarOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons';
import { FaChartBar } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';
import axios from 'axios';
import { SecureStorage } from '../../../../../utils/encryption';
import ViewUtilization from '../View_Utilization_unit';
import ViewUtilizationConsumable from '../View_Utilization_Consumable';

const EquipmentView = ({ equipmentId, onUpdate, onSuccess, onClose, isOpen }) => {
    console.log('EquipmentView component rendered with ID:', equipmentId);

    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

    const [loading, setLoading] = useState(true);
    const [equipment, setEquipment] = useState(null);
    const [quickAdjustment, setQuickAdjustment] = useState({
        quantity: '',
        tagNumber: '',
        brand: '',
        model: '',
        description: '',
        specs: '',
        inch: ''
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
            const url = `${baseUrl}/Admin.php`;
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
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                message.error("An error occurred while fetching equipment details");
            }
        } finally {
            setLoading(false);
        }
    }, [equipmentId, baseUrl]);

    const fetchStatusOptions = async () => {
        try {
            const response = await axios.post(`${baseUrl}/Admin.php`, { operation: "fetchStatusAvailability" });
            if (response.data.status === 'success') {
                // Filter out status IDs 9 (Available Stock) and 10 (Out of stock)
                const filteredStatuses = response.data.data.filter(
                    status => status.status_availability_id !== 9 && status.status_availability_id !== 10
                );
                setStatusOptions(filteredStatuses);
            }
        } catch (error) {
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                message.error("Failed to fetch status options");
            }
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
    const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);

    const handleQuickAdjustment = async (type) => {
        if (!equipment) {
            message.error('Equipment data not loaded');
            return;
        }

        if (equipment.equip_type === 'Bulk') {
            const trimmedQuantity = quickAdjustment.quantity.toString().trim();

            if (!trimmedQuantity) {
                message.error('Please enter quantity');
                return;
            }

            // Prevent decreasing stock: new quantity must be >= current on-hand
            const newQty = parseInt(trimmedQuantity, 10);

            if (isNaN(newQty)) {
                message.error('Please enter a valid quantity');
                return;
            }

            if (newQty < 0) {
                message.error('Quantity cannot be negative');
                return;
            }


            try {
                const params = new URLSearchParams({
                    operation: "saveStock",
                    equip_id: equipmentId,
                    quantity: newQty,
                    user_admin_id: SecureStorage.getLocalItem('user_id')
                });

                const response = await axios.post(`${baseUrl}/Admin.php`, params);

                if (response.data.status === 'success') {
                    message.success(`Stock updated to ${quickAdjustment.quantity} items`);
                    // Clear the form
                    setQuickAdjustment({
                        quantity: '',
                        tagNumber: '',
                        brand: '',
                        model: '',
                        description: '',
                        specs: '',
                        inch: ''
                    });
                    // Close the modal on success
                    setIsAddModalVisible(false);
                    // Refresh equipment data
                    await fetchEquipmentDetails();
                    // Call onUpdate/onSuccess callback to refresh parent component
                    if (typeof onUpdate === 'function') {
                        onUpdate();
                    }
                    if (typeof onSuccess === 'function') {
                        onSuccess();
                    }
                } else {
                    throw new Error(response.data.message || 'Failed to update stock');
                }
            } catch (error) {
                console.error('Error updating stock:', error);
                if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                    toast.error('Network connection lost. Please check your internet connection and try again.');
                } else {
                    message.error('Failed to update stock: ' + (error.message || 'Unknown error'));
                }
            }
        } else {
            const trimmedTagNumber = quickAdjustment.tagNumber.trim();

            if (!trimmedTagNumber) {
                message.error('Tag number cannot be empty or contain only spaces!');
                return;
            }

            try {
                const params = new URLSearchParams({
                    operation: "saveUnit",
                    equip_id: equipmentId,
                    serial_number: trimmedTagNumber,
                    equipment_brand: quickAdjustment.brand || '',
                    equipment_model: quickAdjustment.model || '',
                    equipment_description: quickAdjustment.description || '',
                    equipment_specs: quickAdjustment.specs || '',
                    inch: quickAdjustment.inch || '',
                    status_availability_id: 1, // Default to available
                    user_admin_id: SecureStorage.getLocalItem('user_id')
                });

                console.log('Unit Data:', params.toString());

                const response = await axios.post(`${baseUrl}/Admin.php`, params);

                if (response.data.status !== 'success') {
                    throw new Error(response.data.message || 'Failed to save unit');
                }

                message.success('Successfully added item with tag number: ' + quickAdjustment.tagNumber);
                // Clear the form
                setQuickAdjustment({
                    quantity: '',
                    tagNumber: '',
                    brand: '',
                    model: '',
                    description: '',
                    specs: '',
                    inch: ''
                });
                // Close the modal on success
                setIsAddModalVisible(false);
                // Refresh equipment data
                await fetchEquipmentDetails();
                // Call onUpdate/onSuccess callback to refresh parent component
                if (typeof onUpdate === 'function') {
                    onUpdate();
                }
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            } catch (error) {
                console.error('Error saving unit:', error);
                if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                    toast.error('Network connection lost. Please check your internet connection and try again.');
                } else {
                    message.error('Failed to save unit: ' + (error.message || 'Unknown error'));
                }
            }
        }
    };

    const handleEditUnit = (unit) => {
        setIsEditingUnit(true);
        setEditingUnitId(unit.unit_id);
        setQuickAdjustment({
            quantity: '',
            tagNumber: unit.serial_number,
            brand: unit.equipment_brand || '',
            model: unit.equipment_model || '',
            description: unit.equipment_description || '',
            specs: unit.equipment_specs || '',
            inch: unit.inch || ''
        });
        setSelectedStatus(unit.status_availability_id || 1);
        fetchStatusOptions();
    };

    const handleUpdateUnit = async () => {
        if (!editingUnitId) return;

        const trimmedTagNumber = quickAdjustment.tagNumber.trim();

        if (!trimmedTagNumber) {
            message.error('Tag number cannot be empty or contain only spaces!');
            return;
        }

        try {
            // Backend expects top-level JSON payload (not nested) sent to gsd/update_master1.php
            const payload = {
                operation: "updateEquipmentUnit",
                unit_id: editingUnitId,
                serial_number: trimmedTagNumber,
                equipment_brand: quickAdjustment.brand || '',
                equipment_model: quickAdjustment.model || '',
                equipment_description: quickAdjustment.description || '',
                equipment_specs: quickAdjustment.specs || '',
                inch: quickAdjustment.inch || '',
                status_availability_id: selectedStatus
            };

            console.log('Updating unit with data:', payload);
            console.log('Editing Unit ID:', editingUnitId);
            console.log('Form Data:', quickAdjustment);

            const response = await axios.post(
                `${baseUrl}/Admin.php`,
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
                    brand: '',
                    model: '',
                    description: '',
                    specs: '',
                    inch: ''
                });
                // Refresh equipment data
                await fetchEquipmentDetails();
                // Call onUpdate/onSuccess callback to refresh parent component
                if (typeof onUpdate === 'function') {
                    onUpdate();
                }
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            } else {
                throw new Error(response.data.message || 'Failed to update unit');
            }
        } catch (error) {
            console.error('Error updating unit:', error);
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                message.error('Failed to update unit: ' + (error.message || 'Unknown error'));
            }
        }
    };

    const handleDeactivateUnit = (unit) => {
        setSelectedUnits([unit.unit_id]);
        setShowConfirmDeactivate(true);
    };

    const handleMultipleDeactivate = (units) => {
        const unitIds = units.map(unit => unit.unit_id);
        setSelectedUnits(unitIds);
        setShowConfirmDeactivate(true);
    };

    const confirmDeactivate = async () => {
        if (!selectedUnits.length) return;

        try {
            const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
            const deactivateData = {
                operation: "deactivateResource",
                resourceType: "equipment",
                resourceId: selectedUnits,
                is_serialize: true,
                userid: userId
            };

            const response = await axios.post(`${baseUrl}/Admin.php`, deactivateData, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.status === 'success') {
                message.success(selectedUnits.length > 1 ? 'Units deactivated successfully' : 'Unit deactivated successfully');
                // Refresh equipment data
                await fetchEquipmentDetails();
                // Call onUpdate/onSuccess callback to refresh parent component
                if (typeof onUpdate === 'function') {
                    onUpdate();
                }
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            } else {
                throw new Error(response.data.message || 'Failed to deactivate unit(s)');
            }
        } catch (error) {
            console.error('Error deactivating unit(s):', error);
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                message.error('Failed to deactivate unit(s): ' + (error.message || 'Unknown error'));
            }
        } finally {
            setShowConfirmDeactivate(false);
            setSelectedUnits([]);
        }
    };

    const handleViewUnitUsage = async (unitId) => {
        try {
            const url = `${baseUrl}/Assigned&Records.php`;
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
            if (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                toast.error('Network connection lost. Please check your internet connection and try again.');
            } else {
                message.error("An error occurred while fetching unit usage");
            }
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
                        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
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
                                <Space wrap size={[8, 8]} className={isMobile ? 'w-full' : ''} direction={isMobile ? 'vertical' : 'horizontal'}>
                                    <Button
                                        type="default"
                                        icon={<FaChartBar />}
                                        onClick={() => setIsViewUtilizationOpen(true)}
                                        className="bg-green-50 hover:bg-green-100"
                                        size={isMobile ? 'large' : 'middle'}
                                        block={isMobile}
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
                                        size={isMobile ? 'large' : 'middle'}
                                        block={isMobile}
                                    >
                                        Add Quantity
                                    </Button>
                                </Space>
                            </div>
                            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
                                <Space wrap size={[8, 8]} className={isMobile ? 'w-full' : ''} direction={isMobile ? 'vertical' : 'horizontal'}>
                                    {selectedUnits.length > 0 && (
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleMultipleDeactivate(equipment.units.filter(unit => selectedUnits.includes(unit.unit_id)))}
                                            size={isMobile ? 'large' : 'middle'}
                                            block={isMobile}
                                        >
                                            {isMobile ? `Deactivate (${selectedUnits.length})` : `Deactivate Selected (${selectedUnits.length})`}
                                        </Button>
                                    )}
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setIsAddModalVisible(true)}
                                        className="bg-green-600 hover:bg-green-700"
                                        size={isMobile ? 'large' : 'middle'}
                                        block={isMobile}
                                    >
                                        Add Unit
                                    </Button>
                                </Space>
                            </div>
                            {equipment.units && equipment.units.length > 0 ? (
                                isMobile ? (
                                    // Mobile Card View
                                    <div className="space-y-3">
                                        {equipment.units.map((unit) => {
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
                                            const statusInfo = statusMap[unit.status_availability_id] || { name: 'Unknown', color: 'default' };

                                            return (
                                                <Card
                                                    key={unit.unit_id}
                                                    className="bg-white border border-gray-200 rounded-lg shadow-sm"
                                                    size="small"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <UserOutlined className="text-green-900 text-sm" />
                                                                <span className="font-medium text-sm font-mono truncate max-w-[150px]">
                                                                    {unit.serial_number || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedUnits.includes(unit.unit_id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedUnits([...selectedUnits, unit.unit_id]);
                                                                        } else {
                                                                            setSelectedUnits(selectedUnits.filter(id => id !== unit.unit_id));
                                                                        }
                                                                    }}
                                                                    className="mr-2"
                                                                />
                                                                <Tag color={statusInfo.color} className="text-xs">
                                                                    {statusInfo.name}
                                                                </Tag>
                                                            </div>
                                                        </div>
                                                        {(unit.equipment_brand || unit.equipment_model) && (
                                                            <div className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                                                                {unit.equipment_brand && (
                                                                    <span className="font-medium">Brand: <span className="font-normal">{unit.equipment_brand}</span></span>
                                                                )}
                                                                {unit.equipment_brand && unit.equipment_model && <span className="mx-1">•</span>}
                                                                {unit.equipment_model && (
                                                                    <span className="font-medium">Model: <span className="font-normal">{unit.equipment_model}</span></span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {unit.equipment_description && (
                                                            <div className="text-xs text-gray-600 italic">
                                                                {unit.equipment_description}
                                                            </div>
                                                        )}
                                                        {unit.equipment_specs && (
                                                            <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                                <span className="font-medium text-blue-700">Specs:</span> {unit.equipment_specs}
                                                            </div>
                                                        )}
                                                        {unit.inch && (
                                                            <div className="text-xs text-gray-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                                                                <span className="font-medium text-purple-700">Inch:</span> {unit.inch}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-600">
                                                            <span className="font-medium">Created:</span> {unit.unit_created_at || 'N/A'}
                                                        </div>
                                                        <div className="flex space-x-2 pt-2">
                                                            <Button
                                                                size="small"
                                                                type="default"
                                                                icon={<FaChartBar />}
                                                                onClick={() => handleViewUnitUsage(unit.unit_id)}
                                                                className="bg-green-50 hover:bg-green-100 flex-1"
                                                            >
                                                                View
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                type="primary"
                                                                icon={<EditOutlined />}
                                                                onClick={() => handleEditUnit(unit)}
                                                                className="bg-green-600 hover:bg-green-700 border-green-600 flex-1"
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                danger
                                                                icon={<StopOutlined />}
                                                                onClick={() => handleDeactivateUnit(unit)}
                                                                className="flex-1"
                                                            >
                                                                Deactivate
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    // Desktop/Tablet Table View
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
                                                    width: 150,
                                                    ellipsis: true,
                                                    render: (text) => (
                                                        <span className="font-mono">{text || 'N/A'}</span>
                                                    )
                                                },
                                                {
                                                    title: 'Brand',
                                                    dataIndex: 'equipment_brand',
                                                    key: 'equipment_brand',
                                                    width: 120,
                                                    ellipsis: true,
                                                    render: (text) => text || <span className="text-gray-400">—</span>
                                                },
                                                {
                                                    title: 'Model',
                                                    dataIndex: 'equipment_model',
                                                    key: 'equipment_model',
                                                    width: 120,
                                                    ellipsis: true,
                                                    render: (text) => text || <span className="text-gray-400">—</span>
                                                },
                                                {
                                                    title: 'Description',
                                                    dataIndex: 'equipment_description',
                                                    key: 'equipment_description',
                                                    width: 200,
                                                    ellipsis: true,
                                                    responsive: ['lg'],
                                                    render: (text) => text ? (
                                                        <span className="text-xs italic text-gray-600">{text}</span>
                                                    ) : <span className="text-gray-400">—</span>
                                                },
                                                {
                                                    title: 'Specs',
                                                    dataIndex: 'equipment_specs',
                                                    key: 'equipment_specs',
                                                    width: 200,
                                                    ellipsis: true,
                                                    responsive: ['xl'],
                                                    render: (text) => text ? (
                                                        <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">{text}</span>
                                                    ) : <span className="text-gray-400">—</span>
                                                },
                                                {
                                                    title: 'Inch',
                                                    dataIndex: 'inch',
                                                    key: 'inch',
                                                    width: 100,
                                                    ellipsis: true,
                                                    responsive: ['lg'],
                                                    render: (text) => text ? (
                                                        <span className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">{text}</span>
                                                    ) : <span className="text-gray-400">—</span>
                                                },
                                                {
                                                    title: 'Status',
                                                    dataIndex: 'status_availability_id',
                                                    key: 'status',
                                                    width: 120,
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
                                                    width: 180,
                                                    responsive: ['md'],
                                                    render: (text) => text || 'N/A'
                                                },
                                                {
                                                    title: 'Actions',
                                                    key: 'actions',
                                                    width: 200,
                                                    fixed: 'right',
                                                    render: (_, record) => (
                                                        <Space size="middle">
                                                            <Button
                                                                type="default"
                                                                icon={<FaChartBar />}
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
                                                                icon={<StopOutlined />}
                                                                onClick={() => handleDeactivateUnit(record)}
                                                                title="Deactivate Unit"
                                                            />
                                                        </Space>
                                                    )
                                                }
                                            ]}
                                        />
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No units available. Click "Add Unit" to add a new unit.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Edit Unit Modal */}
                {isMobile ? (
                    <Drawer
                        title="Edit Unit"
                        placement="bottom"
                        open={isEditingUnit}
                        onClose={() => {
                            setIsEditingUnit(false);
                            setEditingUnitId(null);
                            setQuickAdjustment({
                                quantity: '',
                                tagNumber: '',
                                brand: '',
                                model: '',
                                description: '',
                                specs: '',
                                inch: ''
                            });
                        }}
                        height="70%"
                        destroyOnClose
                        styles={{ body: { paddingBottom: '80px' } }}
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
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand
                                </label>
                                <Input
                                    value={quickAdjustment.brand}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, brand: e.target.value }))}
                                    placeholder="Enter brand name"
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Model
                                </label>
                                <Input
                                    value={quickAdjustment.model}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, model: e.target.value }))}
                                    placeholder="Enter model number"
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <Input.TextArea
                                    value={quickAdjustment.description}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter equipment description"
                                    rows={3}
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Specifications
                                </label>
                                <Input.TextArea
                                    value={quickAdjustment.specs}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, specs: e.target.value }))}
                                    placeholder="Enter detailed specs (processor, RAM, etc.)"
                                    rows={3}
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Inch
                                </label>
                                <Input
                                    value={quickAdjustment.inch}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, inch: e.target.value }))}
                                    placeholder="Enter inch size (e.g., 15.6, 24)" 
                                    size="large"
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
                                    size="large"
                                    getPopupContainer={trigger => trigger.parentNode}
                                >
                                    {statusOptions.map(option => (
                                        <Select.Option key={option.status_availability_id} value={option.status_availability_id}>
                                            {option.status_availability_name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex flex-col gap-4">
                                <Button
                                    type="primary"
                                    onClick={handleUpdateUnit}
                                    className="bg-green-600 hover:bg-green-700"
                                    size="large"
                                    block
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
                                            brand: '',
                                            model: '',
                                            description: '',
                                            specs: '',
                                            inch: ''
                                        });
                                    }}
                                    size="large"
                                    block
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Drawer>
                ) : (
                    <Modal
                        title="Edit Unit"
                        open={isEditingUnit}
                        onCancel={() => {
                            setIsEditingUnit(false);
                            setEditingUnitId(null);
                            setQuickAdjustment({
                                quantity: '',
                                tagNumber: '',
                                brand: '',
                                model: '',
                                description: '',
                                specs: '',
                                inch: ''
                            });
                        }}
                        footer={null}
                        destroyOnClose
                        getContainer={false}
                        width={isTablet ? 500 : 600}
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
                                    Brand
                                </label>
                                <Input
                                    value={quickAdjustment.brand}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, brand: e.target.value }))}
                                    placeholder="Enter brand name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Model
                                </label>
                                <Input
                                    value={quickAdjustment.model}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, model: e.target.value }))}
                                    placeholder="Enter model number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <Input.TextArea
                                    value={quickAdjustment.description}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter equipment description"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Specifications
                                </label>
                                <Input.TextArea
                                    value={quickAdjustment.specs}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, specs: e.target.value }))}
                                    placeholder="Enter detailed specs (processor, RAM, etc.)"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Inch
                                </label>
                                <Input
                                    value={quickAdjustment.inch}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, inch: e.target.value }))}
                                    placeholder="Enter inch size (e.g., 15.6, 24)"
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
                                            brand: '',
                                            model: '',
                                            description: '',
                                            specs: '',
                                            inch: ''
                                        });
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        );
    };

    const renderAddModal = () => {
        if (!equipment) return null;

        const modalTitle = equipment.equip_type === 'Bulk' ? 'Adjust Stock' : 'Add Unit';
        const handleCancel = () => {
            setIsAddModalVisible(false);
            setQuickAdjustment({
                quantity: '',
                tagNumber: '',
                brand: '',
                model: '',
                description: '',
                specs: '',
                inch: ''
            });
        };

        return isMobile ? (
            <Drawer
                title={modalTitle}
                placement="bottom"
                open={isAddModalVisible}
                onClose={handleCancel}
                height="70%"
                destroyOnClose
                styles={{ body: { paddingBottom: '80px' } }}
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
                                    size="large"
                                />
                            </div>

                            <div className="flex flex-col gap-4">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleQuickAdjustment('adjust')}
                                    className="bg-green-600 hover:bg-green-700"
                                    size="large"
                                    block
                                >
                                    Add Quantity
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    size="large"
                                    block
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
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand
                                </label>
                                <Input
                                    value={quickAdjustment.brand}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, brand: e.target.value }))}
                                    placeholder="Enter brand name"
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Model
                                </label>
                                <Input
                                    value={quickAdjustment.model}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, model: e.target.value }))}
                                    placeholder="Enter model number"
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <Input.TextArea
                                    value={quickAdjustment.description}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter equipment description"
                                    rows={3}
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Specifications
                                </label>
                                <Input.TextArea
                                    value={quickAdjustment.specs}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, specs: e.target.value }))}
                                    placeholder="Enter detailed specs (processor, RAM, etc.)"
                                    rows={3}
                                    size="large"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Inch
                                </label>
                                <Input
                                    value={quickAdjustment.inch}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, inch: e.target.value }))}
                                    placeholder="Enter inch size (e.g., 15.6, 24)"
                                    size="large"
                                />
                            </div>

                            <div className="flex flex-col gap-4 mt-6">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleQuickAdjustment('add')}
                                    className="bg-green-600 hover:bg-green-700"
                                    size="large"
                                    block
                                >
                                    Add Unit
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    size="large"
                                    block
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Drawer>
        ) : (
            <Modal
                title={modalTitle}
                open={isAddModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
                getContainer={false}
                width={isTablet ? 500 : 600}
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
                                    onClick={() => handleQuickAdjustment('adjust')}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Add Quantity
                                </Button>
                                <Button
                                    onClick={handleCancel}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand
                                </label>
                                <Input
                                    value={quickAdjustment.brand}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, brand: e.target.value }))}
                                    placeholder="Enter brand name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Model
                                </label>
                                <Input
                                    value={quickAdjustment.model}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, model: e.target.value }))}
                                    placeholder="Enter model number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <Input.TextArea
                                    value={quickAdjustment.description}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter equipment description"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Specifications
                                </label>
                                <Input.TextArea
                                    value={quickAdjustment.specs}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, specs: e.target.value }))}
                                    placeholder="Enter detailed specs (processor, RAM, etc.)"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Inch
                                </label>
                                <Input
                                    value={quickAdjustment.inch}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, inch: e.target.value }))}
                                    placeholder="Enter inch size (e.g., 15.6, 24)"
                                />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleQuickAdjustment('add')}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Add Unit
                                </Button>
                                <Button
                                    onClick={handleCancel}
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

    const modalTitle = (
        <div className="flex items-center">
            <EditOutlined className="mr-2 text-green-900" />
            {equipment?.equip_name || 'Loading...'}
        </div>
    );

    return isMobile ? (
        <Drawer
            title={modalTitle}
            placement="bottom"
            open={isOpen}
            onClose={onClose}
            height="90%"
            destroyOnClose
            zIndex={1100}
            styles={{ body: { paddingBottom: '20px' } }}
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
                        title={<div className="text-red-600 flex items-center"><ExclamationCircleOutlined className="mr-2" /> Confirm Deactivation</div>}
                        open={showConfirmDeactivate}
                        onCancel={() => {
                            setShowConfirmDeactivate(false);
                            setSelectedUnits([]);
                        }}
                        destroyOnClose
                        getContainer={false}
                        footer={[
                            <Button key="back" onClick={() => {
                                setShowConfirmDeactivate(false);
                                setSelectedUnits([]);
                            }}>
                                Cancel
                            </Button>,
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                loading={loading}
                                onClick={confirmDeactivate}
                                icon={<DeleteOutlined />}
                            >
                                Deactivate
                            </Button>,
                        ]}
                    >
                        <Alert
                            message="Warning"
                            description={`Are you sure you want to deactivate ${selectedUnits.length} unit(s)? This action will make the units unavailable for reservations.`}
                            type="warning"
                            showIcon
                            icon={<ExclamationCircleOutlined />}
                        />
                    </Modal>
                </>
            )}
        </Drawer>
    ) : (
        <Modal
            title={modalTitle}
            open={isOpen}
            onCancel={onClose}
            width={isTablet ? '90vw' : 'min(1000px, 95vw)'}
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
                        title={<div className="text-red-600 flex items-center"><ExclamationCircleOutlined className="mr-2" /> Confirm Deactivation</div>}
                        open={showConfirmDeactivate}
                        onCancel={() => {
                            setShowConfirmDeactivate(false);
                            setSelectedUnits([]);
                        }}
                        destroyOnClose
                        getContainer={false}
                        footer={[
                            <Button key="back" onClick={() => {
                                setShowConfirmDeactivate(false);
                                setSelectedUnits([]);
                            }}>
                                Cancel
                            </Button>,
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                loading={loading}
                                onClick={confirmDeactivate}
                                icon={<DeleteOutlined />}
                            >
                                Deactivate
                            </Button>,
                        ]}
                    >
                        <Alert
                            message="Warning"
                            description={`Are you sure you want to deactivate ${selectedUnits.length} unit(s)? This action will make the units unavailable for reservations.`}
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
