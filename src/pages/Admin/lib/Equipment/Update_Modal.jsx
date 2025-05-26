import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, Button, message as toast } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';

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
    const [newEquipmentQuantity, setNewEquipmentQuantity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [equipmentType, setEquipmentType] = useState('bulk');
    const [equipmentImage, setEquipmentImage] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusAvailability, setStatusAvailability] = useState([]);
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [hasUnits, setHasUnits] = useState(false);
    const [units, setUnits] = useState([]);
    const [hasSerializedUnits, setHasSerializedUnits] = useState(false);
    const [currentQuantity, setCurrentQuantity] = useState('');

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
            fetchStatusAvailability();
            getEquipmentDetails(equipmentId);
        }
    }, [isOpen, equipmentId]);

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

    const getEquipmentDetails = async (equip_id) => {
        const url = "http://localhost/coc/gsd/fetchMaster.php";
        const jsonData = { operation: "fetchEquipmentById", id: equip_id };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            console.log("Equipment Details Response:", response.data);
            if (response.data.status === 'success') {
                const equipment = response.data.data;
                setNewEquipmentName(equipment.equip_name);
                setNewEquipmentQuantity(equipment.equip_quantity);
                setSelectedCategory(equipment.category_name);
                setSelectedStatus(equipment.status_availability_id);
                setEditingEquipment(equipment);
                
                // Set units and hasUnits state
                if (equipment.units && Array.isArray(equipment.units)) {
                    setUnits(equipment.units);
                    setHasUnits(equipment.units.length > 0);
                    // Set current quantity if it's a quantity-based unit
                    if (equipment.units[0]?.serial_number === null) {
                        setCurrentQuantity(equipment.units[0].quantity);
                    }
                    // Check if any unit has a serial number
                    const hasSerialized = equipment.units.some(unit => unit.serial_number !== null);
                    setHasSerializedUnits(hasSerialized);
                } else {
                    setUnits([]);
                    setHasUnits(false);
                    setHasSerializedUnits(false);
                }

                // Determine equipment type based on category
                const category = categories.find(cat => cat.name === equipment.category_name);
                if (category) {
                    setEquipmentType(category.type);
                }

                // Update form values
                form.setFieldsValue({
                    equipmentName: equipment.equip_name,
                    equipmentQuantity: equipment.units?.[0]?.quantity || equipment.equip_quantity,
                    category: equipment.category_name,
                    status: equipment.status_availability_id
                });

                // If there's an image, prepare it for display
                if (equipment.equip_pic) {
                    const imageUrl = `http://localhost/coc/gsd/${equipment.equip_pic}`;
                    setEquipmentImage(imageUrl);
                    setFileList([{
                        uid: '-1',
                        name: 'equipment-image.png',
                        status: 'done',
                        url: imageUrl,
                    }]);
                } else {
                    setFileList([]);
                    setEquipmentImage(null);
                }
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

    const handleQuantityChange = (e) => {
        const value = e.target.value;
        setCurrentQuantity(value);
        if (hasUnits && units.length > 0) {
            const updatedUnits = [...units];
            updatedUnits[0].quantity = value;
            setUnits(updatedUnits);
        } else {
            setNewEquipmentQuantity(value);
        }
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

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        const category = categories.find(cat => cat.name === value);
        if (category) {
            setEquipmentType(category.type);
        }
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

        const requestData = {
            operation: "updateEquipment",
            equipmentData: {
                equipmentId: editingEquipment.equip_id,
                name: newEquipmentName,
                category_name: selectedCategory,
                equip_pic: equipmentImage || null,
                quantity: hasUnits && units.length > 0 ? currentQuantity : newEquipmentQuantity
            }
        };

        console.log("Request Data being sent:", requestData);   

        setLoading(true);
        try {
            const response = await axios.post(
                "http://localhost/coc/gsd/update_master1.php",
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

    const handleUpdateUnit = async (unitId, updatedData) => {
        console.log("Starting unit update process...");
        console.log("Unit ID:", unitId);
        console.log("Updated Data:", updatedData);
        
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/update_master1.php";
            const requestData = {
                operation: "updateEquipmentUnit",
                unit_id: unitId,
                serial_number: updatedData.serial_number,
                status_availability_id: updatedData.status_availability_id
            };
            
            console.log("Request Data being sent:", requestData);

            const response = await axios.post(url, JSON.stringify(requestData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log("Update Unit Response:", response.data);

            if (response.data.status === 'success') {
                toast.success("Unit updated successfully!");
                // Refresh both status availability and equipment details
                await Promise.all([
                    fetchStatusAvailability(),
                    getEquipmentDetails(equipmentId)
                ]);
            } else {
                console.error("Update failed with response:", response.data);
                toast.error("Failed to update unit: " + response.data.message);
            }
        } catch (error) {
            console.error("Error in handleUpdateUnit:", error);
            toast.error("An error occurred while updating the unit.");
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveUnit = async (unitId) => {
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/delete_master.php";
            const requestData = {
                operation: "archiveResource",
                resourceType: "equipment",
                resourceId: unitId,
                is_serialize: true
            };

            const response = await axios.post(url, JSON.stringify(requestData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success("Unit archived successfully!");
                getEquipmentDetails(equipmentId); // Refresh the data
            } else {
                toast.error("Failed to archive unit: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while archiving the unit.");
            console.error("Error archiving unit:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewEquipmentName('');
        setNewEquipmentQuantity('');
        setSelectedCategory('');
        setEditingEquipment(null);
        setEquipmentImage(null);
        setFileList([]);
        setSelectedStatus('');
        setEquipmentType('bulk');
        setHasUnits(false);
        setUnits([]);
        setHasSerializedUnits(false);
        setCurrentQuantity('');
        form.resetFields();
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

                {hasUnits && units.length > 0 && units[0].serial_number === null ? (
                    <Form.Item
                        label="Quantity"
                        name="equipmentQuantity"
                        rules={[{ required: true, message: 'Please input quantity!' }]}
                    >
                        <Input
                            type="number"
                            min={1}
                            value={currentQuantity}
                            onChange={handleQuantityChange}
                            placeholder="Enter quantity"
                        />
                    </Form.Item>
                ) : !hasUnits && equipmentType === 'bulk' && (
                    <Form.Item
                        label="Quantity"
                        name="equipmentQuantity"
                        rules={[{ required: true, message: 'Please input quantity!' }]}
                    >
                        <Input
                            type="number"
                            min={1}
                            value={newEquipmentQuantity}
                            onChange={handleQuantityChange}
                            placeholder="Enter quantity"
                        />
                    </Form.Item>
                )}

                {!hasUnits && (
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
                )}

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

                {/* Units Section - Only show for serialized units */}
                {hasUnits && units.length > 0 && units[0].serial_number !== null && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Equipment Units</h3>
                        <div className="space-y-4">
                            {units.map((unit) => (
                                <div key={unit.unit_id} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">Serial Number: {unit.serial_number}</p>
                                            <p className="text-sm text-gray-600">Status: {unit.availability_status}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                type="primary"
                                                icon={<EditOutlined />}
                                                onClick={() => {
                                                    Modal.confirm({
                                                        title: 'Update Unit',
                                                        content: (
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                                                    <Input
                                                                        defaultValue={unit.serial_number}
                                                                        onChange={(e) => unit.serial_number = e.target.value}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                                                    <Select
                                                                        defaultValue={unit.status_availability_id}
                                                                        style={{ width: '100%' }}
                                                                        onChange={(value) => unit.status_availability_id = value}
                                                                    >
                                                                        {statusAvailability.map(status => (
                                                                            <Option key={status.status_availability_id} value={status.status_availability_id}>
                                                                                {status.status_availability_name}
                                                                            </Option>
                                                                        ))}
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        ),
                                                        onOk: () => handleUpdateUnit(unit.unit_id, {
                                                            serial_number: unit.serial_number,
                                                            status_availability_id: unit.status_availability_id
                                                        })
                                                    });
                                                }}
                                                size="middle"
                                                className="bg-green-900 hover:bg-lime-900"
                                            />
                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => {
                                                    Modal.confirm({
                                                        title: 'Archive Unit',
                                                        content: 'Are you sure you want to archive this unit?',
                                                        onOk: () => handleArchiveUnit(unit.unit_id)
                                                    });
                                                }}
                                                size="middle"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Form>
        </Modal>
    );
};

export default UpdateEquipmentModal;