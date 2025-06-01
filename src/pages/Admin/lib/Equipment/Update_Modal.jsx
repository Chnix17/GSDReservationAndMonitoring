import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, Button, message as toast } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import { SecureStorage } from '../../../../utils/encryption';

const { Option } = Select;

const UpdateEquipmentModal = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    equipmentId,
    equipmentNameOptions 
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [newEquipmentName, setNewEquipmentName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [equipmentType, setEquipmentType] = useState('bulk');
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [consumableType, setConsumableType] = useState('non-consumable');
    const baseUrl = SecureStorage.getLocalItem("url");

    // Built-in categories
    const categories = [
        { name: 'Tools', type: 'serialized' },
        { name: 'Electronics', type: 'serialized' },
        { name: 'Office Supplies', type: 'bulk' },
        { name: 'Furniture', type: 'serialized' },
        { name: 'Safety Equipment', type: 'serialized' },
        { name: 'Cleaning Supplies', type: 'bulk' },
        { name: 'Medical Equipment', type: 'serialized' },
        { name: 'Sports Equipment', type: 'serialized' },
        { name: 'Laboratory Equipment', type: 'serialized' },
        { name: 'Maintenance Tools', type: 'serialized' }
    ];

    useEffect(() => {
        if (isOpen && equipmentId) {
            getEquipmentDetails(equipmentId);
        }
    }, [isOpen, equipmentId]);

    const getEquipmentDetails = async (equip_id) => {
        const url = `${baseUrl}/fetchMaster.php`;
        const jsonData = { operation: "fetchEquipmentById", id: equip_id };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            console.log("Equipment Details Response:", response.data);
            if (response.data.status === 'success') {
                const equipment = response.data.data;
                setNewEquipmentName(equipment.equip_name);
                setSelectedCategory(equipment.category_name);
                setEditingEquipment(equipment);
                setConsumableType(equipment.equip_type || 'non-consumable');
                
                // Determine equipment type based on category
                const category = categories.find(cat => cat.name === equipment.category_name);
                if (category) {
                    setEquipmentType(category.type);
                }

                // Update form values
                form.setFieldsValue({
                    equipmentName: equipment.equip_name,
                    category: equipment.category_name,
                    consumableType: equipment.equip_type || 'non-consumable'
                });
            } else {
                toast.error("Error fetching equipment details: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching equipment details.");
            console.error("Error fetching equipment details:", error);
        }
    };

    const handleEquipmentNameChange = (value) => {
        const sanitized = sanitizeInput(value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid input detected. Please avoid special characters and scripts.');
            return;
        }
        setNewEquipmentName(sanitized);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        const category = categories.find(cat => cat.name === value);
        if (category) {
            setEquipmentType(category.type);
        }
    };

    const resetForm = () => {
        setNewEquipmentName('');
        setSelectedCategory('');
        setEditingEquipment(null);
        setEquipmentType('bulk');
        setConsumableType('non-consumable');
        form.resetFields();
    };

    const handleSubmit = async () => {
        if (!validateInput(newEquipmentName)) {
            toast.error('Equipment name contains invalid characters.');
            return;
        }

        if (!newEquipmentName || !selectedCategory) {
            toast.error("All fields are required!");
            return;
        }

        const user_admin_id = SecureStorage.getSessionItem('user_id');
        const requestData = {
            operation: "updateEquipment",
            equipmentData: {
                equipmentId: editingEquipment.equip_id,
                name: newEquipmentName,
                category_name: selectedCategory,
                is_active: true,
                user_admin_id: user_admin_id,
                equip_type: consumableType
            }
        };

        console.log("Request Data being sent:", requestData);   

        setLoading(true);
        try {
            const response = await axios.post(
                `${baseUrl}/update_master1.php`,
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log("Response from server:", response.data);
            
            if (response.data && response.data.status === 'success') {
                toast.success(response.data.message || "Equipment updated successfully!");
                resetForm();
                onSuccess();
                onClose();
            } else {
                toast.error(response.data.message || "Failed to update equipment");
            }
        } catch (error) {
            console.error("Error updating equipment:", error);
            toast.error("An error occurred while updating equipment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Update Equipment"
            open={isOpen}
            onCancel={() => {
                resetForm();
                onClose();
            }}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={800}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Equipment Name"
                    name="equipmentName"
                    rules={[{ required: true, message: 'Please input equipment name!' }]}
                >
                    <Input
                        value={newEquipmentName}
                        onChange={(e) => handleEquipmentNameChange(e.target.value)}
                        placeholder="Enter equipment name"
                    />
                </Form.Item>

                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Please select a category!' }]}
                >
                    <Select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        placeholder="Select category"
                    >
                        {categories.map(category => (
                            <Option key={category.name} value={category.name}>
                                {category.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Equipment Type"
                    name="consumableType"
                    rules={[{ required: true, message: 'Please select equipment type!' }]}
                >
                    <Select
                        value={consumableType}
                        onChange={(value) => setConsumableType(value)}
                        placeholder="Select equipment type"
                    >
                        <Option value="consumable">Consumable</Option>
                        <Option value="non-consumable">Non-Consumable</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UpdateEquipmentModal;