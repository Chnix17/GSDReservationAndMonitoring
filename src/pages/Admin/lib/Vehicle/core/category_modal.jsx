import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { toast } from 'sonner';
import axios from 'axios';
import {SecureStorage} from '../../../../../utils/encryption';
import { sanitizeInput, validateInput } from '../../../../../utils/sanitize';

const CategoryModal = ({ open, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const sanitizedName = sanitizeInput(values.categoryName);
            
            if (!sanitizedName.trim()) {
                toast.error("Please enter a category name.");
                return;
            }

            if (!validateInput(sanitizedName)) {
                toast.error("Input contains invalid characters.");
                return;
            }

            setIsSubmitting(true);
            const encryptedUrl = SecureStorage.getLocalItem("url");
            const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;

            console.log('Submitting category data:', sanitizedName);

            const requestData = {
                operation: 'saveCategoryData',
                vehicle_category_name: sanitizedName,
                userid: userId
            };

            const response = await axios.post(`${encryptedUrl}Admin.php`, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('API Response:', response.data);

            if (response.data.status === 'success') {
                console.log('Category added successfully, refreshing categories...');
                toast.success('Vehicle category added successfully!');
                form.resetFields();
                onSuccess();
            } else {
                console.error('Failed to add category:', response.data.message);
                toast.error(response.data.message || 'Failed to add vehicle category.');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Error adding vehicle category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Add New Category"
            open={open}
            onCancel={handleClose}
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={isSubmitting}
                    onClick={handleSubmit}
                >
                    Add Category
                </Button>
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="categoryName"
                    label="Category Name"
                    rules={[
                        {
                            required: true,
                            message: 'Please enter category name'
                        }
                    ]}
                >
                    <Input placeholder="Enter category name" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CategoryModal;
