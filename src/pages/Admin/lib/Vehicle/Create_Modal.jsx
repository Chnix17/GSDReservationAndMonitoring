import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, Button } from 'antd';
import { Calendar } from 'primereact/calendar';
import { PlusOutlined } from '@ant-design/icons';
import { FaEye } from 'react-icons/fa';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import axios from 'axios';
import {SecureStorage} from '../../../../utils/encryption';

// Default values for categories, makes, and models
const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Sedan' },
    { id: 2, name: 'SUV' },
    { id: 3, name: 'Truck' },
    { id: 4, name: 'Van' },
    { id: 5, name: 'Sports Car' }
];

const DEFAULT_MAKES = [
    { id: 1, name: 'Toyota' },
    { id: 2, name: 'Honda' },
    { id: 3, name: 'Ford' },
    { id: 4, name: 'Chevrolet' },
    { id: 5, name: 'Nissan' },
    { id: 6, name: 'Porsche' }
];

const Create_Modal = ({ 
    showModal, 
    onClose, 
    selectedVehicleId, 
    editingVehicle,
    IMAGE_BASE_URL
}) => {
    const [form] = Form.useForm();
    const fileUploadRef = useRef(null);
    const [vehicleLicensed, setVehicleLicensed] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [year, setYear] = useState(new Date());
    const [vehicleImage, setVehicleImage] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [models, setModels] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);

    useEffect(() => {
        // Fetch models and status when component mounts
        fetchModels();
        fetchStatusAvailability();
    }, []);

    const fetchModels = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', {
                operation: "fetchModels"
            });
            
            if (response.data.status === "success") {
                setModels(response.data.data);
            } else {
                toast.error('Failed to fetch models');
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            toast.error('Failed to fetch models');
        }
    };

    const fetchStatusAvailability = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', {
                operation: "fetchStatusAvailability",
                user_admin_id: 1
            });
            
            if (response.data.status === "success") {
                setStatusOptions(response.data.data);
            } else {
                toast.error('Failed to fetch status availability');
            }
        } catch (error) {
            console.error('Error fetching status availability:', error);
            toast.error('Failed to fetch status availability');
        }
    };

    useEffect(() => {
        if (editingVehicle) {
            setVehicleLicensed(editingVehicle.vehicle_license);
            setYear(new Date(editingVehicle.year, 0));
            
            if (editingVehicle.vehicle_pic) {
                const imageUrl = `${IMAGE_BASE_URL}${editingVehicle.vehicle_pic}`;
                setVehicleImage(imageUrl);
                setFileList([{
                    uid: '-1',
                    name: 'vehicle-image.png',
                    status: 'done',
                    url: imageUrl,
                }]);
            }

            // Set default values for editing
            setSelectedCategory(editingVehicle.vehicle_category_name || '');
            setSelectedMake(editingVehicle.vehicle_make_name || '');
            setSelectedModel(editingVehicle.vehicle_model_name || '');
            setSelectedStatus(editingVehicle.status_availability_id || '');
        }
    }, [editingVehicle, IMAGE_BASE_URL]);

    const resetForm = () => {
        setVehicleLicensed('');
        setSelectedCategory('');
        setSelectedMake('');
        setSelectedModel('');
        setYear(new Date());
        setVehicleImage(null);
        setFileList([]);
        setSelectedStatus('');
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
        form.resetFields();
    };

    const sanitizeAndValidateLicense = (value) => {
        const sanitized = sanitizeInput(value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid characters detected in license number');
            return '';
        }
        return sanitized;
    };

    const handleLicenseChange = (e) => {
        const value = e.target.value;
        setVehicleLicensed(sanitizeAndValidateLicense(value));
    };

    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            if (file) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    setVehicleImage(reader.result);
                };
            } else if (newFileList[0].url) {
                setVehicleImage(newFileList[0].url);
            }
        } else {
            setVehicleImage(null);
        }
    };

    const handleCategoryChange = (categoryName) => {
        setSelectedCategory(categoryName);
        setSelectedModel(''); // Reset model when category changes
    };

    const handleMakeChange = (makeName) => {
        setSelectedMake(makeName);
        setSelectedModel(''); // Reset model when make changes
    };

    const handleSubmit = async () => {
        console.log('Submit button clicked');
        console.log('Current form values:', {
            vehicleLicensed,
            selectedCategory,
            selectedMake,
            selectedModel,
            year,
            selectedStatus,
            vehicleImage: vehicleImage ? 'Image present' : 'No image'
        });

        const sanitizedLicense = sanitizeAndValidateLicense(vehicleLicensed);
        if (!sanitizedLicense) {
            console.log('License validation failed');
            return;
        }

        if (!selectedModel || !year || !selectedStatus) {
            console.log('Missing required fields:', {
                model: !selectedModel,
                year: !year,
                status: !selectedStatus
            });
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const apiPayload = {
                operation: "saveVehicle",
                data: {
                    vehicle_model_name: selectedModel,
                    vehicle_license: sanitizedLicense,
                    year: dayjs(year).format('YYYY'),
                    user_admin_id: SecureStorage.getSessionItem('user_id'),
                    status_availability_id: selectedStatus,
                    vehicle_category_name: selectedCategory,
                    vehicle_make_name: selectedMake
                }
            };

            // Only add vehicle_pic if an image is selected
            if (vehicleImage && vehicleImage !== 'No image') {
                apiPayload.data.vehicle_pic = vehicleImage;
            }

            if (selectedVehicleId) {
                apiPayload.data.vehicle_id = selectedVehicleId;
            }

            console.log('Submitting API payload:', apiPayload);
            
            const response = await axios.post('http://localhost/coc/gsd/insert_master.php', apiPayload);
            console.log('API Response:', response.data);
            
            if (response.data.status === "success" || response.data.success) {
                toast.success('Vehicle saved successfully');
                resetForm();
                onClose();
            } else {
                const errorMessage = response.data.message || response.data.error || 'Failed to save vehicle';
                console.error('API Error:', errorMessage);
                toast.error(errorMessage);
            }
            
            console.log('Form submitted successfully');
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error(error.message || 'Failed to submit form');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <FaEye className="mr-2 text-green-900" /> 
                    {selectedVehicleId ? "Edit Vehicle" : "Add Vehicle"}
                </div>
            }
            open={showModal}
            onCancel={onClose}
            okText={selectedVehicleId ? "Update" : "Add"}
            onOk={handleSubmit}
            confirmLoading={isSubmitting}
            width={800}
            className="vehicle-modal"
        >
            <Form layout="vertical" form={form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <Form.Item
                            label="Category"
                            required
                            tooltip="Select the vehicle category"
                        >
                            <Select
                                value={selectedCategory}
                                options={DEFAULT_CATEGORIES.map(cat => ({
                                    label: cat.name,
                                    value: cat.name
                                }))}
                                onChange={handleCategoryChange}
                                placeholder="Select Category"
                                className="w-full"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Make"
                            required
                            tooltip="Select the vehicle make"
                        >
                            <Select
                                value={selectedMake}
                                options={DEFAULT_MAKES.map(make => ({
                                    label: make.name,
                                    value: make.name
                                }))}
                                onChange={handleMakeChange}
                                placeholder="Select Make"
                                className="w-full"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Model"
                            required
                            tooltip="Select the vehicle model or enter a custom model name"
                        >
                            <Select
                                value={selectedModel}
                                options={models.map(model => ({
                                    label: model.vehicle_model_name,
                                    value: model.vehicle_model_name
                                }))}
                                onChange={(value) => setSelectedModel(value)}
                                placeholder="Select or type model name"
                                className="w-full"
                                showSearch
                                allowClear
                                mode="single"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                onSearch={(value) => {
                                    if (value) {
                                        setSelectedModel(value);
                                    }
                                }}
                                notFoundContent={null}
                            />
                        </Form.Item>

                        <Form.Item
                            label="License Number"
                            required
                            tooltip="Enter the vehicle license number"
                        >
                            <Input
                                value={vehicleLicensed}
                                onChange={handleLicenseChange}
                                placeholder="Enter license number"
                                maxLength={50}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Year"
                            required
                            tooltip="Select the vehicle year"
                        >
                            <Calendar
                                value={year}
                                onChange={(e) => setYear(e.value)}
                                view="year"
                                dateFormat="yy"
                                placeholder="Select Year"
                                className="w-full"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Availability Status"
                            required
                            tooltip="Select the vehicle availability status"
                        >
                            <Select
                                value={selectedStatus}
                                options={statusOptions.map(status => ({
                                    label: status.status_availability_name,
                                    value: status.status_availability_id
                                }))}
                                onChange={(value) => setSelectedStatus(value)}
                                placeholder="Select Status"
                                className="w-full"
                            />
                        </Form.Item>
                    </div>

                    <div className="space-y-4">
                        <Form.Item
                            label="Vehicle Image"
                            tooltip="Upload vehicle image (max 5MB)"
                        >
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onChange={handleImageUpload}
                                beforeUpload={() => false}
                                maxCount={1}
                            >
                                {fileList.length < 1 && (
                                    <Button icon={<PlusOutlined />}>
                                        Upload
                                    </Button>
                                )}
                            </Upload>
                            {vehicleImage && typeof vehicleImage === 'string' && vehicleImage.startsWith('http') && (
                                <div className="mt-4">
                                    <img 
                                        src={vehicleImage} 
                                        alt="Vehicle Preview" 
                                        className="max-w-full h-auto rounded-lg shadow-lg" 
                                    />
                                </div>
                            )}
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default Create_Modal;
