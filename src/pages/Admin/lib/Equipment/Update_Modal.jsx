import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Form, Select, Button, message as toast, AutoComplete, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { FaTools } from 'react-icons/fa';
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
    equipmentNameOptions = []
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [equipmentName, setEquipmentName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [equipmentType, setEquipmentType] = useState('');
    const [categories, setCategories] = useState([]);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [equipmentData, setEquipmentData] = useState(null);
    const baseUrl = SecureStorage.getLocalItem("url");
    const hasLoadedData = useRef(false);

    // Equipment types
    const equipmentTypes = [
        { value: 'Bulk', label: 'Bulk (Multiple units in one entry)' },
        { value: 'Serialized', label: 'Serialized (Individual unit tracking)' }
    ];

    const fetchCategories = useCallback(async () => {
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
    }, [baseUrl]);

    const getEquipmentDetails = useCallback(async (equip_id) => {
        const url = `${baseUrl}/user.php`;
        const jsonData = { operation: "fetchEquipmentById", id: equip_id };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                const equipment = response.data.data;
                
                // Store equipment data
                setEquipmentData(equipment);
                
                // Set equipment name
                setEquipmentName(equipment.equip_name);
                
                // Set equipment type
                const equipType = equipment.equip_type || 'Non-Consumable';
                setEquipmentType(equipType);
                
                // Set form values first
                form.setFieldsValue({
                    equipmentName: equipment.equip_name,
                    equipmentType: equipType
                });
            } else {
                toast.error("Error fetching equipment details: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching equipment details.");
            console.error("Error fetching equipment details:", error);
        }
    }, [baseUrl, form]);

    // Handle category matching after categories are loaded
    useEffect(() => {
        if (equipmentData && categories.length > 0) {
            const matchingCategory = categories.find(cat => 
                cat.equipments_category_name.toLowerCase() === equipmentData.category_name.toLowerCase()
            );
            
            if (matchingCategory) {
                setSelectedCategory(matchingCategory.equipments_category_id);
                form.setFieldsValue({ category: matchingCategory.equipments_category_id });
            }
        }
    }, [categories, equipmentData, form]);

    useEffect(() => {
        if (isOpen && !hasLoadedData.current) {
            hasLoadedData.current = true;
            fetchCategories().then(() => {
                if (equipmentId) {
                    getEquipmentDetails(equipmentId);
                }
            });
        }
    }, [isOpen, equipmentId, fetchCategories, getEquipmentDetails]);

    // Reset the ref when modal closes
    useEffect(() => {
        if (!isOpen) {
            hasLoadedData.current = false;
        }
    }, [isOpen]);

    const handleCategoryManagement = () => {
        setIsCategoryModalVisible(true);
    };

    const handleCategoryModalClose = () => {
        setIsCategoryModalVisible(false);
    };



    const handleEquipmentNameChange = (value) => {
        setEquipmentName(value);
        form.setFieldsValue({ equipmentName: value });
    };

    const handleEquipmentNameBlur = () => {
        if (equipmentName) {
            const sanitized = sanitizeInput(equipmentName);
            if (!validateInput(sanitized)) {
                toast.error('Invalid input detected. Please avoid special characters and scripts.');
                setEquipmentName('');
                form.setFieldsValue({ equipmentName: '' });
                return;
            }
            setEquipmentName(sanitized);
            form.setFieldsValue({ equipmentName: sanitized });
        }
    };

    const resetForm = () => {
        setEquipmentName('');
        setSelectedCategory('');
        setEquipmentType('');
        setEquipmentData(null);
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
            equip_id: equipmentId,
            equip_name: equipmentName,
            equip_type: equipmentType,
            equipments_category_id: selectedCategory,
            user_admin_id: user_admin_id
        };

        console.log("Request Data being sent:", requestData);   

        setLoading(true);
        try {
            const response = await axios.post(
                `${baseUrl}/user.php`,
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
                title={
                    <div className="flex items-center">
                        <FaTools className="mr-2 text-green-900" /> 
                        Update Equipment
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
                            onChange={(value) => handleEquipmentNameChange(value)}
                            onBlur={handleEquipmentNameBlur}
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
                                onChange={(value) => {
                                    setSelectedCategory(value);
                                    form.setFieldsValue({ category: value });
                                }}
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
                            onChange={(value) => {
                                setEquipmentType(value);
                                form.setFieldsValue({ equipmentType: value });
                            }}
                            placeholder="Select equipment type"
                        >
                            {equipmentTypes.map(type => (
                                <Option key={type.value} value={type.value}>
                                    {type.label}
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
                            Update Equipment
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

export default UpdateEquipmentModal;