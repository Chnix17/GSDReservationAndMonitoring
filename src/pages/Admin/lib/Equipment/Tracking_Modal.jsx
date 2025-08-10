import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Table, Button, Input, Space, Tag, Form, Select, message, Typography } from 'antd';
import { PlusOutlined, MinusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import SecureStorage from '../../../utils/SecureStorage';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const TrackingModal = ({ isOpen, onClose, equipment, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('1');
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState([]);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [editingUnit, setEditingUnit] = useState(null);
    const [quantity, setQuantity] = useState(0);
    const [viewingUnitUsage, setViewingUnitUsage] = useState(null);
    const baseUrl = SecureStorage.getLocalItem("url");

    useEffect(() => {
        if (isOpen && equipment) {
            fetchUnits();
            setQuantity(equipment.equip_quantity || 0);
        }
    }, [isOpen, equipment]);

    const fetchUnits = async () => {
        if (!equipment) return;
        
        setLoading(true);
        try {
            const url = `${baseUrl}/gsd/user.php`;
            const response = await axios.post(url, new URLSearchParams({
                operation: "fetchEquipmentUnits",
                equipment_id: equipment.equip_id
            }));

            if (response.data.status === 'success') {
                setUnits(response.data.data || []);
            } else {
                message.error("Failed to fetch equipment units");
            }
        } catch (error) {
            console.error("Error fetching units:", error);
            message.error("An error occurred while fetching units");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUnit = async (values) => {
        setLoading(true);
        try {
            const url = `${baseUrl}/gsd/update_master1.php`;
            const response = await axios.post(url, JSON.stringify({
                operation: "addEquipmentUnit",
                equipment_id: equipment.equip_id,
                serial_number: values.serial_number,
                status_availability_id: values.status_availability_id
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.status === 'success') {
                message.success("Unit added successfully");
                form.resetFields();
                fetchUnits();
                onSuccess?.();
            } else {
                message.error(response.data.message || "Failed to add unit");
            }
        } catch (error) {
            console.error("Error adding unit:", error);
            message.error("An error occurred while adding unit");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUnit = async (values) => {
        if (!editingUnit) return;

        setLoading(true);
        try {
            const url = `${baseUrl}/gsd/update_master1.php`;
            const response = await axios.post(url, JSON.stringify({
                operation: "updateEquipmentUnit",
                unit_id: editingUnit.unit_id,
                serial_number: values.serial_number,
                status_availability_id: values.status_availability_id
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.status === 'success') {
                message.success("Unit updated successfully");
                setEditingUnit(null);
                editForm.resetFields();
                fetchUnits();
                onSuccess?.();
            } else {
                message.error(response.data.message || "Failed to update unit");
            }
        } catch (error) {
            console.error("Error updating unit:", error);
            message.error("An error occurred while updating unit");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUnit = async (unitId) => {
        setLoading(true);
        try {
            const url = `${baseUrl}/gsd/delete_master.php`;
            const response = await axios.post(url, JSON.stringify({
                operation: "archiveResource",
                resourceType: "equipment",
                resourceId: [unitId],
                is_serialize: true
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.status === 'success') {
                message.success("Unit deleted successfully");
                fetchUnits();
                onSuccess?.();
            } else {
                message.error(response.data.message || "Failed to delete unit");
            }
        } catch (error) {
            console.error("Error deleting unit:", error);
            message.error("An error occurred while deleting unit");
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = async (newQuantity) => {
        if (newQuantity < 0) return;
        
        setLoading(true);
        try {
            const url = `${baseUrl}/gsd/update_master1.php`;
            const response = await axios.post(url, JSON.stringify({
                operation: "updateEquipmentQuantity",
                equipment_id: equipment.equip_id,
                quantity: newQuantity
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.status === 'success') {
                setQuantity(newQuantity);
                message.success("Quantity updated successfully");
                onSuccess?.();
            } else {
                message.error(response.data.message || "Failed to update quantity");
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
            message.error("An error occurred while updating quantity");
        } finally {
            setLoading(false);
        }
    };

    const handleViewUnitUsage = async (unitId) => {
        setLoading(true);
        try {
            const url = `${baseUrl}/gsd/user.php`;
            const response = await axios.post(url, new URLSearchParams({
                operation: "getEquipmentUnitUsage",
                unitId: unitId
            }));

            if (response.data.status === 'success') {
                return response.data.data;
            } else {
                message.error("Failed to fetch unit usage data");
                return null;
            }
        } catch (error) {
            console.error("Error fetching unit usage:", error);
            message.error("An error occurred while fetching unit usage");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Serial Number',
            dataIndex: 'serial_number',
            key: 'serial_number',
        },
        {
            title: 'Status',
            dataIndex: 'status_availability_name',
            key: 'status_availability_name',
            render: (text) => (
                <Tag color={text === 'Available' ? 'green' : 'red'}>
                    {text}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        style={{ backgroundColor: '#548e54' }}
                        onClick={async () => {
                            const usageData = await handleViewUnitUsage(record.unit_id);
                            if (usageData) {
                                setViewingUnitUsage({
                                    ...record,
                                    ...usageData.equipment_unit_details
                                });
                            }
                        }}
                        title="View Usage"
                    />
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => {
                            setEditingUnit(record);
                            editForm.setFieldsValue({
                                serial_number: record.serial_number,
                                status_availability_id: record.status_availability_id
                            });
                        }}
                    />
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDeleteUnit(record.unit_id)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <EyeOutlined className="mr-2 text-green-900" />
                    Equipment Tracking: {equipment?.equip_name}
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            width={800}
            footer={null}
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Overview" key="1">
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Name:</span>
                                    <p className="text-sm text-gray-900">{equipment?.equip_name}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Category:</span>
                                    <p className="text-sm text-gray-900">{equipment?.category_name}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Type:</span>
                                    <p className="text-sm text-gray-900 capitalize">
                                        {equipment?.equip_type || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Total Quantity:</span>
                                    <p className="text-lg font-bold text-blue-600">{quantity}</p>
                                </div>
                            </div>
                        </div>

                        {equipment?.equip_type === 'Bulk' && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Adjust Quantity</h4>
                                <Space>
                                    <Button
                                        icon={<MinusOutlined />}
                                        onClick={() => handleQuantityChange(quantity - 1)}
                                        disabled={quantity <= 0}
                                    />
                                    <Input
                                        value={quantity}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            if (!isNaN(value)) {
                                                handleQuantityChange(value);
                                            }
                                        }}
                                        style={{ width: 100 }}
                                    />
                                    <Button
                                        icon={<PlusOutlined />}
                                        onClick={() => handleQuantityChange(quantity + 1)}
                                    />
                                </Space>
                            </div>
                        )}
                    </div>
                </TabPane>

                {equipment?.equip_type === 'Serialized' && (
                    <TabPane tab="Units" key="2">
                        <div className="space-y-4">
                            <Form
                                form={form}
                                onFinish={handleAddUnit}
                                layout="vertical"
                                className="bg-white p-4 rounded-lg border border-gray-200 mb-4"
                            >
                                <h4 className="text-md font-medium text-gray-900 mb-4">Add New Unit</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item
                                        name="serial_number"
                                        label="Serial Number"
                                        rules={[{ required: true, message: 'Please enter serial number' }]}
                                    >
                                        <Input placeholder="Enter serial number" />
                                    </Form.Item>
                                    <Form.Item
                                        name="status_availability_id"
                                        label="Status"
                                        rules={[{ required: true, message: 'Please select status' }]}
                                    >
                                        <Select placeholder="Select status">
                                            <Select.Option value="1">Available</Select.Option>
                                            <Select.Option value="2">In Use</Select.Option>
                                            <Select.Option value="3">Maintenance</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </div>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Add Unit
                                </Button>
                            </Form>

                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Unit List</h4>
                                <Table
                                    columns={columns}
                                    dataSource={units}
                                    loading={loading}
                                    rowKey="unit_id"
                                    pagination={false}
                                    size="middle"
                                />
                            </div>
                        </div>
                    </TabPane>
                )}
            </Tabs>

            {/* Edit Unit Modal */}
            <Modal
                title="Edit Unit"
                open={!!editingUnit}
                onCancel={() => {
                    setEditingUnit(null);
                    editForm.resetFields();
                }}
                onOk={() => editForm.submit()}
                confirmLoading={loading}
            >
                <Form
                    form={editForm}
                    onFinish={handleUpdateUnit}
                    layout="vertical"
                >
                    <Form.Item
                        name="serial_number"
                        label="Serial Number"
                        rules={[{ required: true, message: 'Please enter serial number' }]}
                    >
                        <Input placeholder="Enter serial number" />
                    </Form.Item>
                    <Form.Item
                        name="status_availability_id"
                        label="Status"
                        rules={[{ required: true, message: 'Please select status' }]}
                    >
                        <Select placeholder="Select status">
                            <Select.Option value="1">Available</Select.Option>
                            <Select.Option value="2">In Use</Select.Option>
                            <Select.Option value="3">Maintenance</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* View Unit Usage Modal */}
            <Modal
                title={
                    <Space className="items-center">
                        <EyeOutlined style={{ color: '#548e54' }} className="text-xl" />
                        <Title level={4} className="!mb-0 !text-lg md:!text-xl">Equipment Unit Usage</Title>
                    </Space>
                }
                open={!!viewingUnitUsage}
                onCancel={() => setViewingUnitUsage(null)}
                footer={null}
                width={800}
            >
                {viewingUnitUsage && (
                    <div className="space-y-4">
                        {/* Unit Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3" style={{ backgroundColor: '#d4f4dc' }}>
                            <div>
                                <Title level={4} className="!mb-2 !text-base md:!text-lg">
                                    {viewingUnitUsage.equip_name}
                                </Title>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Serial Number:</span> {viewingUnitUsage.serial_number}
                                </Text>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Brand:</span> {viewingUnitUsage.brand}
                                </Text>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Size:</span> {viewingUnitUsage.size}
                                </Text>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Color:</span> {viewingUnitUsage.color}
                                </Text>
                            </div>
                            <div>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Category:</span> {viewingUnitUsage.equipments_category_name}
                                </Text>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Type:</span> {viewingUnitUsage.equip_type}
                                </Text>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Created At:</span> {viewingUnitUsage.unit_created_at}
                                </Text>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Created By:</span> {viewingUnitUsage.admin_full_name}
                                </Text>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Status:</span>{' '}
                                    <Tag color={viewingUnitUsage.status_availability_id === '1' ? 'green' : 'red'}>
                                        {viewingUnitUsage.status_availability_name}
                                    </Tag>
                                </Text>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Modal>
    );
};

export default TrackingModal; 