import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button, Drawer } from 'antd';
// import { PlusOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { Calendar } from 'primereact/calendar';
import { FaEye } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import dayjs from 'dayjs';
import axios from 'axios';
import MakeModal from './core/make_modal';
import CategoryModal from './core/category_modal';
import ModelModal from './core/model_modal';
import { SecureStorage } from '../../../../utils/encryption';

const Update_Modal = ({ 
    open, 
    onCancel, 
    onSubmit, 
    isSubmitting,
    editingVehicle
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
    const [selectedStatus, setSelectedStatus] = useState('');
    const [makes, setMakes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [modelsByCategory, setModelsByCategory] = useState({});
    const [statusAvailability, setStatusAvailability] = useState([]);
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

    const fetchCategories = useCallback(async (makeId) => {
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
    }, [BASE_URL]);

    const fetchModels = useCallback(async (categoryId) => {
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
    }, [BASE_URL, makeId, modelsByCategory]);

    const fetchStatusAvailability = useCallback(async () => {
        try {
            const response = await axios.post(BASE_URL, 
                new URLSearchParams({ operation: "fetchStatusAvailability" })
            );
            if (response.data.status === 'success') {
                // Filter out status IDs 9 (Available Stock) and 10 (Out of stock)
                const filteredStatuses = response.data.data.filter(
                    status => status.status_availability_id !== 9 && status.status_availability_id !== 10
                );
                setStatusAvailability(filteredStatuses);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load status options.');
            } else {
                toast.error(error.message);
            }
        }
    }, [BASE_URL]);


    const resetForm = useCallback(() => {
        console.log('Resetting form');
        form.resetFields();
        setMakeId('');
        setCategory('');
        setVehicleModelId('');
        setVehicleLicensed('');
        setYear(new Date());
        setSelectedStatus('');
    }, [form]);

    useEffect(() => {
        if (open) {
            fetchMakes();
            fetchStatusAvailability();
        } else {
            // Reset form when modal closes
            resetForm();
        }
    }, [open, fetchMakes, fetchStatusAvailability, resetForm]);

    // Reset and populate form when editingVehicle changes
    useEffect(() => {
        if (open && editingVehicle) {
            console.log('Editing vehicle changed, resetting form with:', editingVehicle);
            resetForm();
            
            // Set license immediately
            setVehicleLicensed(editingVehicle.vehicle_license);
            form.setFieldsValue({ license: editingVehicle.vehicle_license });
            
            // Set year immediately
            const yearValue = parseInt(editingVehicle.year);
            if (!isNaN(yearValue)) {
                const yearDate = new Date(yearValue, 0, 1);
                console.log('Setting year to:', yearValue, 'Date object:', yearDate);
                setYear(yearDate);
                form.setFieldsValue({ year: yearDate });
            }
        }
    }, [editingVehicle, open, form, resetForm]);

    // Ensure form is synchronized when modal opens
    useEffect(() => {
        if (open && editingVehicle) {
            console.log('Modal opened, synchronizing form with editing vehicle:', editingVehicle);
            
            // Force form update after a short delay to ensure all fields are properly set
            setTimeout(() => {
                if (editingVehicle) {
                    console.log('Forcing form update with vehicle data:', editingVehicle);
                    
                    // Set license
                    setVehicleLicensed(editingVehicle.vehicle_license);
                    form.setFieldsValue({ license: editingVehicle.vehicle_license });
                    
                    // Set year
                    const yearValue = parseInt(editingVehicle.year);
                    if (!isNaN(yearValue)) {
                        const yearDate = new Date(yearValue, 0, 1);
                        console.log('Re-setting year to:', yearValue, 'Date object:', yearDate);
                        setYear(yearDate);
                        form.setFieldsValue({ year: yearDate });
                    }
                }
            }, 100);
        }
    }, [open, editingVehicle, form]);

    useEffect(() => {
        if (open && editingVehicle && makes.length > 0) {
            console.log('Populating form with editing vehicle:', editingVehicle);
            const selectedMake = makes.find(make => make.vehicle_make_name === editingVehicle.vehicle_make_name);
            if (selectedMake) {
                setMakeId(selectedMake.vehicle_make_id);
                form.setFieldsValue({ make: selectedMake.vehicle_make_id });
                fetchCategories(selectedMake.vehicle_make_id);
            }
        }
    }, [open, editingVehicle, makes, form, fetchCategories]);

    useEffect(() => {
        if (open && editingVehicle && categories.length > 0) {
            console.log('Setting category for editing vehicle:', editingVehicle.vehicle_category_name);
            const selectedCategory = categories.find(cat => cat.vehicle_category_name === editingVehicle.vehicle_category_name);
            if (selectedCategory) {
                setCategory(selectedCategory.vehicle_category_id);
                form.setFieldsValue({ category: selectedCategory.vehicle_category_id });
                fetchModels(selectedCategory.vehicle_category_id);
            }
        }
    }, [open, editingVehicle, categories, form, fetchModels]);

    useEffect(() => {
        if (open && editingVehicle && modelsByCategory[category]?.length > 0) {
            console.log('Setting model for editing vehicle:', editingVehicle.vehicle_model_name);
            const models = modelsByCategory[category] || [];
            const selectedModel = models.find(model => model.vehicle_model_name === editingVehicle.vehicle_model_name);
            if (selectedModel) {
                console.log('Found matching model:', selectedModel);
                setVehicleModelId(selectedModel.vehicle_model_id);
                form.setFieldsValue({ model: selectedModel.vehicle_model_id });
            } else {
                console.log('No matching model found for:', editingVehicle.vehicle_model_name);
                console.log('Available models:', models.map(m => m.vehicle_model_name));
            }
        }
    }, [open, editingVehicle, modelsByCategory, category, form]);

    useEffect(() => {
        if (open && editingVehicle && statusAvailability.length > 0) {
            console.log('Setting form values for editing vehicle:', editingVehicle);
            
            // Set license
            setVehicleLicensed(editingVehicle.vehicle_license);
            form.setFieldsValue({ license: editingVehicle.vehicle_license });

            // Set year - ensure it's properly formatted
            const yearValue = parseInt(editingVehicle.year);
            if (!isNaN(yearValue)) {
                const yearDate = new Date(yearValue, 0, 1); // January 1st of the year
                console.log('Setting year to:', yearValue, 'Date object:', yearDate);
                setYear(yearDate);
                form.setFieldsValue({ year: yearDate });
            } else {
                console.error('Invalid year value:', editingVehicle.year);
            }

            // Set status
            const selectedStatusObj = statusAvailability.find(status => status.status_availability_name === editingVehicle.status_availability_name);
            if (selectedStatusObj) {
                setSelectedStatus(selectedStatusObj.status_availability_id);
                form.setFieldsValue({ status: selectedStatusObj.status_availability_id });
            }
        }
    }, [open, editingVehicle, statusAvailability, form]);

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
        setIsMakeModalOpen(false);
    };

    // const handleAddCategory = () => {
    //     setIsCategoryModalOpen(true);
    // };

    const handleCategoryModalSuccess = async () => {
        setIsCategoryModalOpen(false);
    };

    // const handleAddModel = () => {
    //     setIsModelModalOpen(true);
    // };

    const handleModelModalSuccess = async () => {
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
            // Show loading toast
          
            
            const values = await form.validateFields();
            
            // Validate required fields exist and are not just whitespace
            if (!values.model || !values.year || !values.status || !values.license) {
             
                toast.error("Please fill in all required fields.");
                return;
            }

            // Validate license is not just whitespace
            if (!values.license.trim()) {
                // toast.dismiss(loadingToast);
                toast.error("License number cannot be empty or contain only spaces.");
                return;
            }

            // // Update loading message
            // toast.dismiss(loadingToast);
            // toast.loading("Updating vehicle information...");

            const formData = {
                vehicle_id: editingVehicle.vehicle_id,
                vehicle_model_id: values.model,
                vehicle_license: values.license.trim(),
                year: dayjs(values.year).format('YYYY'),
                status_availability_id: values.status,
                user_admin_id: SecureStorage.getLocalItem('user_id'),
                is_active: 1
            };
            console.log('Form data to submit:', formData);

            // Let the parent component handle the API call
            onSubmit(formData);
        } catch (error) {
            console.error('Form validation failed:', error);
            
            // Handle different types of errors with specific messages
            if (error.errorFields && error.errorFields.length > 0) {
                toast.error("Please fix the form errors before submitting.", {
                    description: "Check the highlighted fields for validation errors.",
                    duration: 4000
                });
            } else {
                toast.error('Please check all required fields', {
                    description: "Ensure all fields are properly filled out.",
                    duration: 4000
                });
            }
        }
    };



    const handleClose = () => {
        resetForm();
        onCancel();
    };

    const modalTitle = (
        <div className="flex items-center">
            <FaEye className="mr-2 text-green-900" /> 
            Edit Vehicle
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

                <Form.Item
                    name="status"
                    label="Availability Status"
                    required
                    tooltip="Select the vehicle availability status"
                >
                    <Select
                        value={selectedStatus}
                        options={statusAvailability.map(status => ({
                            label: status.status_availability_name,
                            value: status.status_availability_id
                        }))}
                        onChange={(value) => setSelectedStatus(value)}
                        placeholder="Select Status"
                        className="w-full"
                        size={isMobile ? "middle" : "large"}
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
                disabled={isSubmitting}
                className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                size={isMobile ? "large" : "middle"}
            >
                {isSubmitting ? 'Updating...' : 'Update Vehicle'}
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

export default Update_Modal;
