import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message as toast, AutoComplete, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { FaTools } from 'react-icons/fa';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import CategoryModal from './Category_Modal';
const { Option } = Select;

const MasterEquipmentModal = ({ isOpen, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [equipmentName, setEquipmentName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [equipmentType, setEquipmentType] = useState('');
    const [equipmentNameOptions, setEquipmentNameOptions] = useState([]);
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
            fetchEquipmentNames();
            fetchCategories();
        }
    }, [isOpen]);

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

    const fetchEquipmentNames = async () => {
        const url = `${baseUrl}/user.php`;
        const jsonData = { operation: "fetchEquipmentName" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                const options = response.data.data.map(equipment => ({
                    value: equipment.equip_name,
                    label: equipment.equip_name,
                    equip_id: equipment.equip_id,
                    category_name: equipment.category_name
                }));
                setEquipmentNameOptions(options);
            } else {
                
            }
        } catch (error) {
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
            operation: "saveEquipment",
            data: {
                name: equipmentName,
                equipments_category_id: selectedCategory,
                equip_type: equipmentType,
                user_admin_id: user_admin_id
            }
        };

        

        console.log('Request Data:', requestData);

        setLoading(true);
        try {
            const response = await axios.post(
                `${baseUrl}/insert_master.php`,
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Equipment master added successfully!");
                resetForm();
                onSuccess();
                onClose();
            } else {
                toast.error(`Failed to add equipment master: ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {
            toast.error("An error occurred while adding equipment master.");
            console.error("Error saving equipment master:", error);
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
                title={
                    <div className="flex items-center">
                        <FaTools className="mr-2 text-green-900" /> 
                        Add Equipment Master
                    </div>
                }
                open={isOpen}
                onCancel={() => {
                    resetForm();
                    onClose();
                }}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" className="p-4">
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

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => {
                            resetForm();
                            onClose();
                        }}>
                            Cancel
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={handleSubmit}
                            loading={loading}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            Add Equipment
                        </Button>
                    </div>
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

export default MasterEquipmentModal;
