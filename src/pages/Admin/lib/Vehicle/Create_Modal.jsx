import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button, Drawer } from 'antd';
// import { PlusOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { Calendar } from 'primereact/calendar';
import { FaCar } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import dayjs from 'dayjs';
import axios from 'axios';
import MakeModal from './core/make_modal';
import CategoryModal from './core/category_modal';
import ModelModal from './core/model_modal';
import { SecureStorage } from '../../../../utils/encryption';

const Create_Modal = ({ 
    open, 
    onCancel, 
    onSubmit, 
    isSubmitting 
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });

    const [form] = Form.useForm();
    const [makeId, setMakeId] = useState('');
    const [category, setCategory] = useState('');
    const [vehicleModelId, setVehicleModelId] = useState('');
    const [vehicleLicensed, setVehicleLicensed] = useState('');
    const [year, setYear] = useState(new Date());
    const [makes, setMakes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [modelsByCategory, setModelsByCategory] = useState({});
    const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const BASE_URL = `${encryptedUrl}/Admin.php`;

    const fetchMakes = useCallback(async () => {
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchMake" }));
            if (response.data.status === 'success') {
                setMakes(response.data.data);
                return response.data.data;
            } else {
                toast.error(response.data.message);
                return [];
            }
        } catch (error) {
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load vehicle makes.');
            } else {
                toast.error(error.message);
            }
            return [];
        }
    }, [BASE_URL]);

    const fetchCategories = async (makeId) => {
        if (!makeId) return;
        try {
            console.log('Fetching categories for makeId:', makeId);
            const response = await axios.post(BASE_URL, new URLSearchParams({ 
                operation: "fetchVehicleCategories",
                make_id: makeId
            }));
            console.log('Categories Response:', response.data);
            if (response.data.status === 'success') {
                setCategories(response.data.data);
                console.log('Categories updated:', response.data.data);
                toast.success('Categories refreshed successfully');
            } else {
                console.error('Failed to fetch categories:', response.data.message);
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load categories.');
            } else {
                toast.error(error.message);
            }
        }
    };

    const fetchModels = async (categoryId) => {
        if (!categoryId || !makeId) return;
        
        // Check if models are already fetched for this category
        if (modelsByCategory[categoryId]) {
            console.log('Models already fetched for category:', categoryId, modelsByCategory[categoryId]);
            return;
        }
        
        try {
            console.log('Fetching models for categoryId:', categoryId, 'and makeId:', makeId);
            const response = await axios.post(BASE_URL, new URLSearchParams({ 
                operation: "fetchModelsByCategoryAndMake",
                categoryId: categoryId,
                makeId: makeId
            }));
            console.log('Models Response:', response.data);
            if (response.data.status === 'success') {
                setModelsByCategory(prev => ({
                    ...prev,
                    [categoryId]: response.data.data
                }));
                console.log('Models updated for category:', categoryId, response.data.data);
                toast.success('Models refreshed successfully');
            } else {
                console.error('Failed to fetch models:', response.data.message);
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load models.');
            } else {
                toast.error(error.message);
            }
        }
    };


    useEffect(() => {
        if (open) {
            fetchMakes();
        }
    }, [open, fetchMakes]);

    const handleMakeChange = async (selectedMakeId) => {
        setMakeId(selectedMakeId);
        setCategory('');
        setVehicleModelId('');
        form.setFieldsValue({ category: undefined, model: undefined });
        if (selectedMakeId) {
            await fetchCategories(selectedMakeId);
        } else {
            setCategories([]);
            setModelsByCategory({});
        }
    };

    const handleCategoryChange = async (selectedCategoryId) => {
        setCategory(selectedCategoryId);
        setVehicleModelId('');
        form.setFieldsValue({ model: undefined });
        if (selectedCategoryId) {
            await fetchModels(selectedCategoryId);
        }
    };

    // const handleAddMake = () => {
    //     setIsMakeModalOpen(true);
    // };

    const handleMakeModalSuccess = async () => {
        const updatedMakes = await fetchMakes();
        if (updatedMakes.length > 0) {
            const newMake = updatedMakes[updatedMakes.length - 1];
            setMakeId(newMake.vehicle_make_id);
            form.setFieldsValue({ make: newMake.vehicle_make_id });
            await fetchCategories(newMake.vehicle_make_id);
        }
    };

    // const handleAddCategory = () => {
    //     setIsCategoryModalOpen(true);
    // };

    const handleCategoryModalSuccess = async () => {
        console.log('Category modal success, refreshing categories for makeId:', makeId);
        if (makeId) {
            await fetchCategories(makeId);
        }
    };

    // const handleAddModel = () => {
    //     setIsModelModalOpen(true);
    // };

    const handleModelModalSuccess = async () => {
        if (category) {
            await fetchModels(category);
        }
        setIsModelModalOpen(false);
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

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Validate required fields exist and are not just whitespace
            if (!values.model || !values.year || !values.license) {
                toast.error("Please fill in all required fields.");
                return;
            }

            // Validate license is not just whitespace
            if (!values.license.trim()) {
                toast.error("License number cannot be empty or contain only spaces.");
                return;
            }

            const formData = {
                vehicle_model_id: values.model,
                vehicle_license: values.license.trim(),
                year: dayjs(values.year).format('YYYY'),
                user_admin_id: SecureStorage.getLocalItem('user_id')
            };

            console.log('Form data:', formData);

            const requestData = JSON.stringify({
                operation: "saveVehicle",
                ...formData
            });

            const response = await axios.post(`${encryptedUrl}/Admin.php`, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success(`Vehicle "${values.license.trim()}" added successfully!`, {
                    description: "The vehicle has been registered in the system.",
                    duration: 4000
                });
                resetForm();
                onCancel();
                onSubmit(); // This will trigger the parent to refresh the vehicle list
            } else {
                toast.error(response.data.message || 'Failed to add vehicle', {
                    description: "Please check the vehicle information and try again.",
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Validation failed:', error);
            
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to create vehicle.', {
                    description: 'Please check your internet connection and try again.',
                    duration: 5000
                });
            // Handle different types of errors with specific messages
            } else if (error.errorFields && error.errorFields.length > 0) {
                toast.error("Please fix the form errors before submitting.", {
                    description: "Check the highlighted fields for validation errors.",
                    duration: 4000
                });
            } else if (error.response?.status === 409) {
                toast.error("Vehicle license already exists!", {
                    description: "Please use a different license number.",
                    duration: 5000
                });
            } else if (error.response?.status >= 500) {
                toast.error("Server error occurred", {
                    description: "Please try again later or contact support.",
                    duration: 5000
                });
            } else {
                toast.error(error.response?.data?.message || error.message || "An unexpected error occurred", {
                    description: "Please try again or contact support if the problem persists.",
                    duration: 5000
                });
            }
        }
    };

    const resetForm = () => {
        form.resetFields();
        setMakeId('');
        setCategory('');
        setVehicleModelId('');
        setVehicleLicensed('');
        setYear(new Date());
    };

    const handleClose = () => {
        resetForm();
        onCancel();
    };

    const modalTitle = (
        <div className="flex items-center">
            <FaCar className="mr-2 text-green-900" /> 
            Add Vehicle
        </div>
    );

    const formContent = (
        <Form form={form} layout="vertical" className={isMobile ? "p-2" : "p-4"}>
            <div className={`space-y-${isMobile ? '3' : '4'}`}>
                <Form.Item
                    name="make"
                    label="Make"
                    required
                    tooltip="Select the vehicle make"
                >
                    <Select
                        value={makeId}
                        options={makes.map(make => ({
                            label: make.vehicle_make_name,
                            value: make.vehicle_make_id
                        }))}
                        onChange={handleMakeChange}
                        placeholder="Select Make"
                        className="w-full"
                        size={isMobile ? "middle" : "large"}
                    />
                </Form.Item>

                <Form.Item
                    name="category"
                    label="Category"
                    required
                    tooltip="Select the vehicle category"
                >
                    <Select
                        value={category}
                        options={categories.map(cat => ({
                            label: cat.vehicle_category_name,
                            value: cat.vehicle_category_id
                        }))}
                        onChange={handleCategoryChange}
                        placeholder="Select Category"
                        className="w-full"
                        disabled={!makeId}
                        size={isMobile ? "middle" : "large"}
                    />
                </Form.Item>

                <Form.Item
                    name="model"
                    label="Model"
                    required
                    tooltip="Select the vehicle model"
                >
                    <Select
                        value={vehicleModelId}
                        options={modelsByCategory[category]?.map(model => ({
                            label: model.vehicle_model_name,
                            value: model.vehicle_model_id
                        }))}
                        onChange={(value) => setVehicleModelId(value)}
                        placeholder="Select Model"
                        className="w-full"
                        disabled={!category}
                        size={isMobile ? "middle" : "large"}
                    />
                </Form.Item>

                <Form.Item
                    name="license"
                    label="Plate No."
                    required
                    tooltip="Enter the vehicle plate no."
                    rules={[
                        { required: true, message: 'Plate no. is required' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Plate no. cannot contain only whitespace!');
                                    return Promise.reject(new Error('Plate no. cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input
                        value={vehicleLicensed}
                        onChange={handleLicenseChange}
                        placeholder="Enter plate no."
                        maxLength={50}
                        size={isMobile ? "middle" : "large"}
                    />
                </Form.Item>

                <Form.Item
                    name="year"
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
                        maxDate={new Date()}
                    />
                </Form.Item>
            </div>
        </Form>
    );

    const footerButtons = (
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'} ${isMobile ? 'mt-4' : 'mt-4'}`}>
            <Button 
                onClick={handleClose}
                size={isMobile ? "large" : "middle"}
                className={isMobile ? 'w-full' : ''}
            >
                Cancel
            </Button>
            <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={isSubmitting}
                className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                size={isMobile ? "large" : "middle"}
            >
                Add Vehicle
            </Button>
        </div>
    );

    return (
        <>
            {isMobile ? (
                <Drawer
                    title={modalTitle}
                    placement="bottom"
                    onClose={handleClose}
                    open={open}
                    height="90%"
                    className="vehicle-drawer"
                    bodyStyle={{ paddingBottom: '120px' }}
                    footer={footerButtons}
                >
                    {formContent}
                </Drawer>
            ) : (
                <Modal
                    title={modalTitle}
                    open={open}
                    onCancel={handleClose}
                    footer={footerButtons}
                    width={isTablet ? 700 : 800}
                    className="vehicle-modal"
                >
                    {formContent}
                </Modal>
            )}


            <MakeModal
                open={isMakeModalOpen}
                onCancel={() => setIsMakeModalOpen(false)}
                onSuccess={handleMakeModalSuccess}
            />

            <CategoryModal
                open={isCategoryModalOpen}
                onCancel={() => setIsCategoryModalOpen(false)}
                onSuccess={handleCategoryModalSuccess}
            />

            <ModelModal
                open={isModelModalOpen}
                onCancel={() => setIsModelModalOpen(false)}
                onSuccess={handleModelModalSuccess}
            />
        </>
    );
};

export default Create_Modal;
