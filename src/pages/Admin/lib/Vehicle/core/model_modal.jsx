import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { toast } from 'sonner';
import axios from 'axios';
import {SecureStorage} from '../../../../../utils/encryption';
import { sanitizeInput, validateInput } from '../../../../../utils/sanitize';

const ModelModal = ({ open, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [makes, setMakes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedMake, setSelectedMake] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const BASE_URL = `${encryptedUrl}/Admin.php`;
    const FETCH_URL = `${encryptedUrl}/Admin.php`;

    const fetchMakes = useCallback(async () => {
        try {
            const response = await axios.post(FETCH_URL, new URLSearchParams({ operation: "fetchMake" }));
            if (response.data.status === 'success') {
                setMakes(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [FETCH_URL]);

    useEffect(() => {
        if (open) {
            fetchMakes();
        }
    }, [open, fetchMakes]);

    const fetchCategories = async (makeId) => {
        if (!makeId) return;
        try {
            const response = await axios.post(FETCH_URL, new URLSearchParams({ 
                operation: "fetchVehicleCategories",
                make_id: makeId
            }));
            if (response.data.status === 'success') {
                setCategories(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleMakeChange = (value) => {
        setSelectedMake(value);
        form.setFieldsValue({ category: undefined });
        if (value) {
            fetchCategories(value);
        } else {
            setCategories([]);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const sanitizedName = sanitizeInput(values.modelName);
            
            // Additional validation for whitespace
            if (!sanitizedName || !sanitizedName.trim()) {
                toast.error("Model name cannot be empty or contain only spaces.", {
                    description: "Please enter a valid model name.",
                    duration: 4000
                });
                return;
            }

            if (!validateInput(sanitizedName)) {
                toast.error("Input contains invalid characters.", {
                    description: "Please use only letters, numbers, and basic punctuation.",
                    duration: 4000
                });
                return;
            }

            setIsSubmitting(true);

            const modelData = {
                operation: "saveModelData",
                json: {
                    name: sanitizedName.trim(),
                    category_id: values.category,
                    make_id: values.make
                }
            };

            const response = await axios.post(BASE_URL, modelData);
            
            if (response.data.status === 'success') {
                toast.success(`Vehicle model "${sanitizedName.trim()}" added successfully!`, {
                    description: "The model has been added to the system.",
                    duration: 4000
                });
                onSuccess(values);
                form.resetFields();
            } else {
                toast.error(response.data.message || 'Failed to add vehicle model.', {
                    description: "Please check the model information and try again.",
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Error saving model:', error);
            
            // Handle different types of errors with specific messages
            if (error.errorFields && error.errorFields.length > 0) {
                toast.error("Please fix the form errors before submitting.", {
                    description: "Check the highlighted fields for validation errors.",
                    duration: 4000
                });
            } else if (error.response?.status === 409) {
                toast.error("Vehicle model already exists!", {
                    description: "Please use a different model name.",
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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title="Add New Model"
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText="Add"
            confirmLoading={isSubmitting}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="make"
                    label="Make"
                    rules={[{ required: true, message: 'Please select a make' }]}
                >
                    <Select
                        placeholder="Select Make"
                        onChange={handleMakeChange}
                        options={makes.map(make => ({
                            label: make.vehicle_make_name,
                            value: make.vehicle_make_id
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select a category' }]}
                >
                    <Select
                        placeholder="Select Category"
                        disabled={!selectedMake}
                        options={categories.map(cat => ({
                            label: cat.vehicle_category_name,
                            value: cat.vehicle_category_id
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="modelName"
                    label="Model Name"
                    rules={[
                        { required: true, message: 'Please enter model name' },
                        { 
                            validator: (_, value) => {
                                if (!value || !value.trim()) {
                                    return Promise.reject(new Error('Model name cannot be empty or contain only spaces'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input placeholder="Enter model name" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModelModal;
