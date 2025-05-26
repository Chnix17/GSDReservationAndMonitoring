import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, Button, Space, message as toast, AutoComplete } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';

const { Option } = Select;

const CreateEquipmentModal = ({ isOpen, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [newEquipmentName, setNewEquipmentName] = useState('');
    const [newEquipmentQuantity, setNewEquipmentQuantity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [equipmentType, setEquipmentType] = useState('bulk');
    const [equipmentImage, setEquipmentImage] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [serialNumbers, setSerialNumbers] = useState(['']);
    const [statusAvailability, setStatusAvailability] = useState([]);
    const [equipmentNameOptions, setEquipmentNameOptions] = useState([]);

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
        fetchStatusAvailability();
        fetchEquipmentNames();
    }, []);
    

    const fetchEquipmentNames = async () => {
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "fetchEquipmentName" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));

            console.log("Response Data:", response.data);
            if (response.data.status === 'success') {
                const options = response.data.data.map(equipment => ({
                    value: equipment.equip_name,
                    label: equipment.equip_name,
                    equip_id: equipment.equip_id,
                    category_name: equipment.category_name
                }));
                setEquipmentNameOptions(options);
            } else {
                toast.error("Error fetching equipment names: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching equipment names:", error);
            toast.error("An error occurred while fetching equipment names.");
        }
    };

    const fetchStatusAvailability = async () => {
        const url = "http://localhost/coc/gsd/fetchMaster.php";
        const jsonData = { operation: "fetchStatusAvailability" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setStatusAvailability(response.data.data);
            } else {
                toast.error("Failed to fetch status availability");
            }
        } catch (error) {
            console.error("Error fetching status availability:", error);
            toast.error("An error occurred while fetching status availability.");
        }
    };

    const handleEquipmentNameSearch = (value) => {
        const sanitized = sanitizeInput(value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid input detected. Please avoid special characters and scripts.');
            return;
        }
        setNewEquipmentName(sanitized);
        form.setFieldsValue({ equipmentName: sanitized });
        
        // Find the selected equipment in the options
        const selectedEquipment = equipmentNameOptions.find(option => 
            option.value.toLowerCase() === sanitized.toLowerCase()
        );

        // If an existing equipment is selected, set the category based on built-in data
        if (selectedEquipment) {
            const category = categories.find(cat => cat.name === selectedEquipment.category_name);
            if (category) {
                setSelectedCategory(category.name);
                form.setFieldsValue({ category: category.name });
                setEquipmentType(category.type);
            }
        }
    };

    const handleEquipmentQuantityChange = (e) => {
        const sanitized = sanitizeInput(e.target.value);
        if (!/^\d*$/.test(sanitized)) {
            toast.error('Please enter only numbers for quantity.');
            return;
        }
        setNewEquipmentQuantity(sanitized);
        form.setFieldsValue({ equipmentQuantity: sanitized });
    };

    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            const reader = new FileReader();
            reader.onloadend = () => {
                setEquipmentImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setEquipmentImage(null);
        }
    };

    const addSerialNumberField = () => {
        setSerialNumbers([...serialNumbers, '']);
    };

    const removeSerialNumberField = (index) => {
        const newSerialNumbers = serialNumbers.filter((_, i) => i !== index);
        setSerialNumbers(newSerialNumbers);
    };

    const handleSerialNumberChange = (index, value) => {
        const newSerialNumbers = [...serialNumbers];
        newSerialNumbers[index] = value;
        setSerialNumbers(newSerialNumbers);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        const category = categories.find(cat => cat.name === value);
        if (category) {
            setEquipmentType(category.type);
            // Reset serial numbers if switching to bulk type
            if (category.type === 'bulk') {
                setSerialNumbers(['']);
            }
        }
    };

    const resetForm = () => {
        setNewEquipmentName('');
        setNewEquipmentQuantity('');
        setSelectedCategory('');
        setEquipmentImage(null);
        setFileList([]);
        setSelectedStatus('');
        setEquipmentType('bulk');
        setSerialNumbers(['']);
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

        // Check equipment type specific validations
        const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);
        if (selectedCategoryData.type === 'bulk' && !newEquipmentQuantity) {
            toast.error("Quantity is required for bulk equipment!");
            return;
        }

        if (selectedCategoryData.type === 'serialized') {
            // Validate if any serial number is empty
            const nonEmptySerialNumbers = serialNumbers.filter(sn => sn.trim());
            if (!nonEmptySerialNumbers.length) {
                toast.error('Please enter at least one serial number');
                return;
            }

            // Check for duplicate serial numbers in the input
            const uniqueSerials = new Set(nonEmptySerialNumbers.map(sn => sn.toLowerCase()));
            if (uniqueSerials.size !== nonEmptySerialNumbers.length) {
                toast.error('Duplicate serial numbers are not allowed');
                console.log("Serial Numbers:", uniqueSerials);
                return;
            }

            // If this is an existing equipment, check for conflicts with existing serial numbers
            const existingEquipment = equipmentNameOptions.find(option => 
                option.value.toLowerCase() === newEquipmentName.toLowerCase()
            );

            if (existingEquipment && existingEquipment.units) {
                const existingSerials = new Set(existingEquipment.units.map(unit => unit.serial_number.toLowerCase()));
                const duplicate = nonEmptySerialNumbers.find(sn => existingSerials.has(sn.toLowerCase()));
                if (duplicate) {
                    toast.error(`Serial number "${duplicate}" already exists for this equipment`);
                    return;
                }
            }
        }

        const user_admin_id = SecureStorage.getSessionItem('user_id');
        let requestData;

        // Find if the equipment already exists
        const existingEquipment = equipmentNameOptions.find(option => 
            option.value.toLowerCase() === newEquipmentName.toLowerCase()
        );

        // Prepare request data based on equipment type
        if (selectedCategoryData.type === 'bulk') {
            requestData = {
                operation: existingEquipment ? "updateEquipment" : "saveEquipment",
                data: {
                    equip_id: existingEquipment?.equip_id,
                    name: newEquipmentName,
                    category_name: selectedCategory,
                    quantity: parseInt(newEquipmentQuantity),
                    status_availability_id: selectedStatus || 1,
                    user_admin_id: user_admin_id,
                    equip_pic: equipmentImage
                }
            };
        } else {
            // For serialized equipment
            requestData = {
                operation: "saveEquipment",
                data: {
                    equip_id: existingEquipment?.equip_id,
                    name: newEquipmentName,
                    category_name: selectedCategory,
                    serial_numbers: serialNumbers.filter(sn => sn.trim()),
                    status_availability_id: selectedStatus || 1,
                    user_admin_id: user_admin_id,
                    equip_pic: equipmentImage
                }
            };
        }

        // Add console logs to show the data being submitted
        console.log('Form Data:', {
            equipmentName: newEquipmentName,
            category: selectedCategory,
            equipmentType: selectedCategoryData.type,
            quantity: newEquipmentQuantity,
            serialNumbers: serialNumbers,
            status: selectedStatus,
            hasImage: !!equipmentImage
        });
        console.log('Request Data:', requestData);

        setLoading(true);
        try {
            const response = await axios.post(
                "http://localhost/coc/gsd/insert_master.php",
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(response.data);
            
            if (response.data.status === 'success') {
                toast.success(existingEquipment ? "Equipment updated successfully!" : "Equipment added successfully!");
                resetForm();
                onSuccess();
                onClose();
            } else {
                toast.error(`Failed to ${existingEquipment ? "update" : "add"} equipment: ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {
            toast.error(`An error occurred while ${existingEquipment ? "updating" : "adding"} equipment.`);
            console.error("Error saving equipment:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Add New Equipment"
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
                    <AutoComplete
                        value={newEquipmentName}
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

                {equipmentType === 'bulk' ? (
                    <Form.Item
                        label="Quantity"
                        name="equipmentQuantity"
                        rules={[{ required: true, message: 'Please input quantity!' }]}
                    >
                        <Input
                            type="number"
                            min={1}
                            value={newEquipmentQuantity}
                            onChange={handleEquipmentQuantityChange}
                            placeholder="Enter quantity"
                        />
                    </Form.Item>
                ) : (
                    <Form.Item label="Serial Numbers">
                        {serialNumbers.map((serialNumber, index) => (
                            <Space key={index} style={{ display: 'flex', marginBottom: 8 }}>
                                <Input
                                    value={serialNumber}
                                    onChange={(e) => handleSerialNumberChange(index, e.target.value)}
                                    placeholder={`Enter serial number ${index + 1}`}
                                />
                                {serialNumbers.length > 1 && (
                                    <Button
                                        type="link"
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeSerialNumberField(index)}
                                    />
                                )}
                            </Space>
                        ))}
                        <Button
                            type="dashed"
                            onClick={addSerialNumberField}
                            icon={<PlusOutlined />}
                            style={{ width: '100%' }}
                        >
                            Add Serial Number
                        </Button>
                    </Form.Item>
                )}

                <Form.Item
                    label="Status"
                    name="status"
                    rules={[{ required: true, message: 'Please select status!' }]}
                >
                    <Select
                        value={selectedStatus}
                        onChange={(value) => setSelectedStatus(value)}
                        placeholder="Select status"
                    >
                        {statusAvailability.map(status => (
                            <Option key={status.status_availability_id} value={status.status_availability_id}>
                                {status.status_availability_name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Equipment Image">
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={handleImageUpload}
                        beforeUpload={() => false}
                        maxCount={1}
                    >
                        {fileList.length === 0 && <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>}
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateEquipmentModal;