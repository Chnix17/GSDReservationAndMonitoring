import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message as toast, AutoComplete, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import { SecureStorage } from '../../../../utils/encryption';
import CategoryModal from './Category_Modal';

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
    const [equipmentName, setEquipmentName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [equipmentType, setEquipmentType] = useState('');
    const [categories, setCategories] = useState([]);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const baseUrl = SecureStorage.getLocalItem("url");

    // Equipment types
    const equipmentTypes = [
        'Consumable',
        'Non-Consumable'
    ];

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (equipmentId) {
                getEquipmentDetails(equipmentId);
            }
        }
    }, [isOpen, equipmentId]);

    const fetchCategories = async () => {
        const url = `${baseUrl}/user.php`;
        const jsonData = { operation: "fetchCategories" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setCategories(response.data.data);
            } else {
                toast.error("Error fetching categories: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("An error occurred while fetching categories.");
        }
    };

    const handleCategoryManagement = () => {
        setIsCategoryModalVisible(true);
    };

    const handleCategoryModalClose = () => {
        setIsCategoryModalVisible(false);
    };

    const getEquipmentDetails = async (equip_id) => {
        const url = `${baseUrl}/fetchMaster.php`;
        const jsonData = { operation: "fetchEquipmentById", id: equip_id };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                const equipment = response.data.data;
                setEquipmentName(equipment.equip_name);
                
                // Find the category ID that matches the category name
                const matchingCategory = categories.find(cat => 
                    cat.equipments_category_name.toLowerCase() === equipment.category_name.toLowerCase()
                );
                
                if (matchingCategory) {
                    setSelectedCategory(matchingCategory.equipments_category_id);
                } else {
                    // If category not found, try to fetch categories again and then set
                    await fetchCategories();
                    const updatedMatchingCategory = categories.find(cat => 
                        cat.equipments_category_name.toLowerCase() === equipment.category_name.toLowerCase()
                    );
                    if (updatedMatchingCategory) {
                        setSelectedCategory(updatedMatchingCategory.equipments_category_id);
                    } else {
                        toast.warning(`Category "${equipment.category_name}" not found in the list`);
                    }
                }
                
                setEquipmentType(equipment.equip_type || 'Non-Consumable');
                
                form.setFieldsValue({
                    equipmentName: equipment.equip_name,
                    category: matchingCategory?.equipments_category_id,
                    equipmentType: equipment.equip_type || 'Non-Consumable'
                });
            } else {
                toast.error("Error fetching equipment details: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching equipment details.");
            console.error("Error fetching equipment details:", error);
        }
    };

    const handleEquipmentNameSearch = (value) => {
        const sanitized = sanitizeInput(value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid input detected. Please avoid special characters and scripts.');
            return;
        }
        setEquipmentName(sanitized);
        form.setFieldsValue({ equipmentName: sanitized });
    };

    const resetForm = () => {
        setEquipmentName('');
        setSelectedCategory('');
        setEquipmentType('');
        form.resetFields();
    };

    const handleSubmit = async () => {
        if (!validateInput(equipmentName)) {
            toast.error('Equipment name contains invalid characters.');
            return;
        }

        if (!equipmentName || !selectedCategory || !equipmentType) {
            toast.error("All fields are required!");
            return;
        }

        const user_admin_id = SecureStorage.getSessionItem('user_id');
        const requestData = {
            operation: "updateEquipment",
            equipmentData: {
                name: equipmentName,
                category_id: selectedCategory,
                is_active: true,
                user_admin_id: user_admin_id,
                equip_type: equipmentType,
                equipmentId: equipmentId
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

    const handleCategorySuccess = () => {
        fetchCategories(); // Refresh the categories list after adding a new one
    };

    return (
        <>
            <Modal
                title="Update Equipment"
                open={isOpen}
                onCancel={() => {
                    resetForm();
                    onClose();
                }}
                onOk={handleSubmit}
                confirmLoading={loading}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Equipment Name"
                        name="equipmentName"
                        rules={[{ required: true, message: 'Please input equipment name!' }]}
                    >
                        <AutoComplete
                            value={equipmentName}
                            onChange={(value) => handleEquipmentNameSearch(value)}
                            placeholder="Enter equipment name"
                            options={equipmentNameOptions}
                            filterOption={(inputValue, option) =>
                                option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true, message: 'Please select a category!' }]}
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Select
                                value={selectedCategory}
                                onChange={(value) => setSelectedCategory(value)}
                                placeholder="Select category"
                                style={{ width: 'calc(100% - 40px)' }}
                            >
                                {categories.map(category => (
                                    <Option key={category.equipments_category_id} value={category.equipments_category_id}>
                                        {category.equipments_category_name}
                                    </Option>
                                ))}
                            </Select>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCategoryManagement}
                                style={{ width: '40px' }}
                            />
                        </Space.Compact>
                    </Form.Item>

                    <Form.Item
                        label="Equipment Type"
                        name="equipmentType"
                        rules={[{ required: true, message: 'Please select equipment type!' }]}
                    >
                        <Select
                            value={equipmentType}
                            onChange={(value) => setEquipmentType(value)}
                            placeholder="Select equipment type"
                        >
                            {equipmentTypes.map(type => (
                                <Option key={type} value={type}>
                                    {type}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            <CategoryModal
                isOpen={isCategoryModalVisible}
                onClose={handleCategoryModalClose}
                onSuccess={handleCategorySuccess}
            />
        </>
    );
};

export default UpdateEquipmentModal;