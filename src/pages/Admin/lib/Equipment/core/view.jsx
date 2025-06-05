import React, { useState, useEffect } from 'react';
import { Button, Tag, Space, message, Modal, Table, Input } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusOutlined, UserOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { SecureStorage } from '../../../../../utils/encryption';
import View_Utilization from '../View_Utilization_unit';
import View_Utilization_Consumable from '../View_Utilization_Consumable';

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

    // Add user_admin_id state
    const [userAdminId] = useState(1); // This should come from your auth system

    // Example data - replace with actual data from your backend
    const [users] = useState([
        'John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown'
    ]);

    const [viewingUnitUsage, setViewingUnitUsage] = useState(null);
    const [isViewUtilizationOpen, setIsViewUtilizationOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);

    useEffect(() => {
        if (isOpen && equipmentId) {
            console.log('useEffect triggered, equipmentId:', equipmentId);
            fetchEquipmentDetails();
        }
    }, [equipmentId, isOpen]);

    const fetchEquipmentDetails = async () => {
        console.log('Fetching equipment details for ID:', equipmentId);
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/fetchMaster.php";
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
    };

    const handleQuickAdjustment = async (type) => {
        if (!equipment) {
            message.error('Equipment data not loaded');
            return;
        }

        if (equipment.equip_type === 'Consumable') {
            if (!quickAdjustment.quantity) {
                message.error('Please enter quantity');
                return;
            }

            try {
                const stockData = {
                    operation: "saveStock",
                    data: {
                        equip_id: equipmentId,
                        quantity: parseInt(quickAdjustment.quantity),
                        user_admin_id: SecureStorage.getSessionItem('user_id')
                    }
                };

                const response = await axios.post("http://localhost/coc/gsd/insert_master.php", stockData);

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
                    fetchEquipmentDetails();
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
                const unitData = {
                    operation: "saveUnit",
                    data: {
                        equip_id: equipmentId,
                        serial_number: quickAdjustment.tagNumber,
                        brand: quickAdjustment.brand || null,
                        size: quickAdjustment.size || null,
                        color: quickAdjustment.color || null,
                        status_availability_id: 1, // Default to available
                        user_admin_id: SecureStorage.getSessionItem('user_id')
                    }
                };

                const response = await axios.post("http://localhost/coc/gsd/insert_master.php", unitData);
                
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
                fetchEquipmentDetails();
            } catch (error) {
                console.error('Error saving unit:', error);
                message.error('Failed to save unit: ' + (error.message || 'Unknown error'));
            }
        }
        
        // Only call onUpdate if it's a function
        if (typeof onUpdate === 'function') {
            onUpdate();
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
    };

    const handleUpdateUnit = async () => {
        if (!editingUnitId) return;

        try {
            const unitData = {
                operation: "updateEquipmentUnit",
                unitData: {
                    unit_id: editingUnitId,
                    serial_number: quickAdjustment.tagNumber,
                    brand: quickAdjustment.brand,
                    size: quickAdjustment.size,
                    color: quickAdjustment.color,
                    is_active: true,
                    user_admin_id: SecureStorage.getSessionItem('user_id')
                }
            };

            console.log('Updating unit with data:', unitData);
            console.log('Editing Unit ID:', editingUnitId);
            console.log('Form Data:', quickAdjustment);

            const response = await axios.post("http://localhost/coc/gsd/update_master1.php", unitData);
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
                fetchEquipmentDetails();
            } else {
                throw new Error(response.data.message || 'Failed to update unit');
            }
        } catch (error) {
            console.error('Error updating unit:', error);
            message.error('Failed to update unit: ' + (error.message || 'Unknown error'));
        }
    };

    const handleArchiveUnit = (unit) => {
        Modal.confirm({
            title: 'Archive Unit',
            content: `Are you sure you want to archive unit with serial number ${unit.serial_number}?`,
            okText: 'Yes, Archive',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    const archiveData = {
                        operation: "archiveResource",
                        resourceType: "equipment",
                        resourceId: unit.unit_id
                    };

                    const response = await axios.post("http://localhost/coc/gsd/delete_master.php", archiveData);

                    if (response.data.status === 'success') {
                        message.success('Unit archived successfully');
                        // Refresh equipment data
                        fetchEquipmentDetails();
                    } else {
                        throw new Error(response.data.message || 'Failed to archive unit');
                    }
                } catch (error) {
                    console.error('Error archiving unit:', error);
                    message.error('Failed to archive unit: ' + (error.message || 'Unknown error'));
                }
            }
        });
    };

    const handleViewUnitUsage = async (unitId) => {
        try {
            const url = "http://localhost/coc/gsd/user.php";
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
                            <EditOutlined className="mr-2 text-blue-600" />
                            Equipment Information
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
                                <p className="text-xl font-bold text-blue-600">{equipment.equip_quantity || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-gray-500">Created At</span>
                                <p className="text-base text-gray-900">{equipment.equip_created_at || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Information Card for Consumable Items */}
                {equipment.equip_type === 'Consumable' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <CalendarOutlined className="mr-2 text-blue-600" />
                                    Stock Information
                                </h4>
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<EyeOutlined />}
                                        onClick={() => setIsViewUtilizationOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        View Usage
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            setQuickAdjustment(prev => ({
                                                ...prev,
                                                quantity: equipment.on_hand_quantity || 0
                                            }));
                                            setIsAddModalVisible(true);
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Adjust Stock
                                    </Button>
                                </Space>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <p className="text-3xl font-bold text-blue-600">{equipment.on_hand_quantity || 0}</p>
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
                {equipment.equip_type !== 'Consumable' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <UserOutlined className="mr-2 text-blue-600" />
                                    Unit Details
                                </h4>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setIsAddModalVisible(true)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Add Unit
                                </Button>
                            </div>
                            {equipment.units && equipment.units.length > 0 ? (
                                <Table
                                    dataSource={equipment.units}
                                    rowKey="unit_id"
                                    pagination={false}
                                    className="unit-table"
                                    columns={[
                                        {
                                            title: 'Serial Number',
                                            dataIndex: 'serial_number',
                                            key: 'serial_number',
                                            render: (text) => (
                                                <span className="font-mono">{text || 'N/A'}</span>
                                            )
                                        },
                                        {
                                            title: 'Brand',
                                            dataIndex: 'brand',
                                            key: 'brand',
                                            render: (text) => text || 'N/A'
                                        },
                                        {
                                            title: 'Size',
                                            dataIndex: 'size',
                                            key: 'size',
                                            render: (text) => text || 'N/A'
                                        },
                                        {
                                            title: 'Color',
                                            dataIndex: 'color',
                                            key: 'color',
                                            render: (text) => text || 'N/A'
                                        },
                                        {
                                            title: 'Status',
                                            dataIndex: 'status_availability_id',
                                            key: 'status',
                                            render: (status) => (
                                                <Tag color={status === 1 ? 'success' : 'warning'}>
                                                    {status === 1 ? 'Available' : 'In Use'}
                                                </Tag>
                                            )
                                        },
                                        {
                                            title: 'Created At',
                                            dataIndex: 'unit_created_at',
                                            key: 'created_at',
                                            render: (text) => text || 'N/A'
                                        },
                                        {
                                            title: 'Actions',
                                            key: 'actions',
                                            render: (_, record) => (
                                                <Space size="middle">
                                                    <Button
                                                        type="text"
                                                        icon={<EyeOutlined className="text-green-600" />}
                                                        onClick={() => handleViewUnitUsage(record.unit_id)}
                                                        title="View Usage"
                                                    />
                                                    <Button
                                                        type="text"
                                                        icon={<EditOutlined className="text-blue-600" />}
                                                        onClick={() => handleEditUnit(record)}
                                                        title="Edit Unit"
                                                    />
                                                    <Button
                                                        type="text"
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
                            size: '',
                            color: '',
                            brand: ''
                        });
                    }}
                    footer={null}
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Size
                                    </label>
                                    <Input
                                        value={quickAdjustment.size}
                                        onChange={(e) => setQuickAdjustment(prev => ({ ...prev, size: e.target.value }))}
                                        placeholder="Enter size"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Color
                                    </label>
                                    <Input
                                        value={quickAdjustment.color}
                                        onChange={(e) => setQuickAdjustment(prev => ({ ...prev, color: e.target.value }))}
                                        placeholder="Enter color"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Brand
                                    </label>
                                    <Input
                                        value={quickAdjustment.brand}
                                        onChange={(e) => setQuickAdjustment(prev => ({ ...prev, brand: e.target.value }))}
                                        placeholder="Enter brand"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="primary"
                                onClick={handleUpdateUnit}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                                        size: '',
                                        color: '',
                                        brand: ''
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
                title={equipment.equip_type === 'Consumable' ? 'Adjust Stock' : 'Add Unit'}
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
            >
                <div className="space-y-6">
                    {equipment.equip_type === 'Consumable' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adjust Quantity *
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={quickAdjustment.quantity}
                                    onChange={(e) => setQuickAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
                                    placeholder="Enter quantity"
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
                                    Save Changes
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
                            <div className="grid grid-cols-2 gap-4">
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

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Size
                                        </label>
                                        <Input
                                            value={quickAdjustment.size}
                                            onChange={(e) => setQuickAdjustment(prev => ({ ...prev, size: e.target.value }))}
                                            placeholder="Enter size"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Color
                                        </label>
                                        <Input
                                            value={quickAdjustment.color}
                                            onChange={(e) => setQuickAdjustment(prev => ({ ...prev, color: e.target.value }))}
                                            placeholder="Enter color"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Brand
                                        </label>
                                        <Input
                                            value={quickAdjustment.brand}
                                            onChange={(e) => setQuickAdjustment(prev => ({ ...prev, brand: e.target.value }))}
                                            placeholder="Enter brand"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
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
            width={1000}
            footer={null}
        >
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="loader"></div>
                </div>
            ) : (
                <>
                    {renderContent()}
                    {renderAddModal()}
                    {equipment?.equip_type === 'Consumable' ? (
                        <View_Utilization_Consumable
                            open={isViewUtilizationOpen}
                            onCancel={() => setIsViewUtilizationOpen(false)}
                            equipment={equipment}
                        />
                    ) : (
                        <View_Utilization
                            open={isViewUtilizationOpen}
                            onCancel={() => setIsViewUtilizationOpen(false)}
                            equipment={selectedUnit}
                        />
                    )}
                </>
            )}
        </Modal>
    );
};

export default EquipmentView;
