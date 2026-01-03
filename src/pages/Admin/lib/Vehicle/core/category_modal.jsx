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
            
            // Additional validation for whitespace
            if (!sanitizedName || !sanitizedName.trim()) {
                toast.error("Category name cannot be empty or contain only spaces.", {
                    description: "Please enter a valid category name.",
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
            const encryptedUrl = SecureStorage.getLocalItem("url");
            const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;

            console.log('Submitting category data:', sanitizedName.trim());

            const requestData = {
                operation: 'saveCategoryData',
                vehicle_category_name: sanitizedName.trim(),
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
                toast.success(`Vehicle category "${sanitizedName.trim()}" added successfully!`, {
                    description: "The category has been added to the system.",
                    duration: 4000
                });
                form.resetFields();
                onSuccess();
            } else {
                console.error('Failed to add category:', response.data.message);
                toast.error(response.data.message || 'Failed to add vehicle category.', {
                    description: "Please check the category name and try again.",
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Error adding category:', error);
            
            // Handle different types of errors with specific messages
            if (error.errorFields && error.errorFields.length > 0) {
                toast.error("Please fix the form errors before submitting.", {
                    description: "Check the highlighted fields for validation errors.",
                    duration: 4000
                });
            } else if (error.response?.status === 409) {
                toast.error("Vehicle category already exists!", {
                    description: "Please use a different category name.",
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
                        },
                        { 
                            validator: (_, value) => {
                                if (!value || !value.trim()) {
                                    return Promise.reject(new Error('Category name cannot be empty or contain only spaces'));
                                }
                                return Promise.resolve();
                            }
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
