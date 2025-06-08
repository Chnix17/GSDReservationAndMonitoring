import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import { toast } from 'sonner';
import axios from 'axios';
import {SecureStorage} from '../../../../../utils/encryption';

const ModelModal = ({ open, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [makes, setMakes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedMake, setSelectedMake] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const BASE_URL = `${encryptedUrl}/vehicle_master.php`;
    const FETCH_URL = `${encryptedUrl}/fetchMaster.php`;

    useEffect(() => {
        if (open) {
            fetchMakes();
        }
    }, [open]);

    const fetchMakes = async () => {
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
    };

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
            setIsSubmitting(true);

            const modelData = {
                operation: "saveModelData",
                json: {
                    name: values.modelName,
                    category_id: values.category,
                    make_id: values.make
                }
            };

            const response = await axios.post(BASE_URL, modelData);
            
            if (response.data.status === 'success') {
                toast.success('Model added successfully');
                onSuccess(values);
                form.resetFields();
            } else {
                toast.error(response.data.message || 'Failed to add model');
            }
        } catch (error) {
            console.error('Error saving model:', error);
            toast.error(error.message || 'Failed to add model');
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
                    rules={[{ required: true, message: 'Please enter model name' }]}
                >
                    <Input placeholder="Enter model name" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModelModal;
