import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
    const BASE_URL = `${encryptedUrl}/fetchMaster.php`;

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
            toast.error(error.message);
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
            toast.error(error.message);
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
            toast.error(error.message);
        }
    }, [BASE_URL, makeId, modelsByCategory]);

    const fetchStatusAvailability = useCallback(async () => {
        try {
            const response = await axios.post(BASE_URL, 
                new URLSearchParams({ operation: "fetchStatusAvailability" })
            );
            if (response.data.status === 'success') {
                setStatusAvailability(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [BASE_URL]);

    useEffect(() => {
        if (open) {
            fetchMakes();
            fetchStatusAvailability();
        }
    }, [open, fetchMakes, fetchStatusAvailability]);

    useEffect(() => {
        if (open && editingVehicle && makes.length > 0) {
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
            const models = modelsByCategory[category] || [];
            const selectedModel = models.find(model => model.vehicle_model_name === editingVehicle.vehicle_model_name);
            if (selectedModel) {
                setVehicleModelId(selectedModel.vehicle_model_id);
                form.setFieldsValue({ model: selectedModel.vehicle_model_id });
            }
        }
    }, [open, editingVehicle, modelsByCategory, category, form]);

    useEffect(() => {
        if (open && editingVehicle && statusAvailability.length > 0) {
            setVehicleLicensed(editingVehicle.vehicle_license);
            form.setFieldsValue({ license: editingVehicle.vehicle_license });

            setYear(new Date(editingVehicle.year));
            form.setFieldsValue({ year: new Date(editingVehicle.year) });

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

    const handleAddMake = () => {
        setIsMakeModalOpen(true);
    };

    const handleMakeModalSuccess = async () => {
        setIsMakeModalOpen(false);
    };

    const handleAddCategory = () => {
        setIsCategoryModalOpen(true);
    };

    const handleCategoryModalSuccess = async () => {
        setIsCategoryModalOpen(false);
    };

    const handleAddModel = () => {
        setIsModelModalOpen(true);
    };

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
            const values = await form.validateFields();
            
            if (!values.model || !values.year || !values.status || !values.license) {
                toast.error("Please fill in all required fields.");
                return;
            }

            const formData = {
                operation: "updateVehicleLicense",
                vehicleData: {
                    vehicle_id: editingVehicle.vehicle_id,
                    vehicle_model_id: values.model,
                    vehicle_license: values.license,
                    year: dayjs(values.year).format('YYYY'),
                    status_availability_id: values.status,
                    user_admin_id: SecureStorage.getSessionItem('user_id'),
                    is_active: 1
                }
            };
            console.log('Form data:', formData);

            const response = await axios.post(`${encryptedUrl}/update_master1.php`, formData);
            
            if (response.data.status === 'success') {
                toast.success('Vehicle updated successfully');
                onSubmit(formData.vehicleData);
                handleClose();
            } else {
                toast.error(response.data.message || 'Failed to update vehicle');
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to update vehicle');
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

    return (
        <>
            <Modal
                title={
                    <div className="flex items-center">
                        <FaEye className="mr-2 text-green-900" /> 
                        Edit Vehicle
                    </div>
                }
                open={open}
                onCancel={handleClose}
                footer={null}
                width={800}
                className="vehicle-modal"
            >
                <Form form={form} layout="vertical" className="p-4">
                    <div className="space-y-4">
                        <div className="flex items-end gap-2">
                            <Form.Item
                                name="make"
                                label="Make"
                                required
                                tooltip="Select the vehicle make"
                                className="flex-1 mb-0"
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
                                />
                            </Form.Item>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={handleAddMake}
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <Form.Item
                                name="category"
                                label="Category"
                                required
                                tooltip="Select the vehicle category"
                                className="flex-1 mb-0"
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
                                />
                            </Form.Item>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={handleAddCategory}
                                disabled={!makeId}
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <Form.Item
                                name="model"
                                label="Model"
                                required
                                tooltip="Select the vehicle model"
                                className="flex-1 mb-0"
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
                                />
                            </Form.Item>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={handleAddModel}
                                disabled={!category}
                            />
                        </div>

                        <Form.Item
                            name="license"
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
                            />
                        </Form.Item>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            Update Vehicle
                        </Button>
                    </div>
                </Form>
            </Modal>

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
