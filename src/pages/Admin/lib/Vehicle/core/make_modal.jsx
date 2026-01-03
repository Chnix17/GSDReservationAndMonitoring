import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { toast } from 'sonner';
import axios from 'axios';
import {SecureStorage} from '../../../../../utils/encryption';
import { sanitizeInput, validateInput } from '../../../../../utils/sanitize';

const MakeModal = ({ open, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const BASE_URL = SecureStorage.getLocalItem("url");

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const sanitizedName = sanitizeInput(values.makeName);
            
            // Additional validation for whitespace
            if (!sanitizedName || !sanitizedName.trim()) {
                toast.error("Make name cannot be empty or contain only spaces.", {
                    description: "Please enter a valid make name.",
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
            const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;

            const requestData = {
                operation: 'saveMakeData',
                vehicle_make_name: sanitizedName.trim(),
                userid: userId
            };

            const response = await axios.post(`${BASE_URL}Admin.php`, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success(`Vehicle make "${sanitizedName.trim()}" added successfully!`, {
                    description: "The make has been added to the system.",
                    duration: 4000
                });
                form.resetFields();
                onSuccess();
                onCancel();
            } else {
                toast.error(response.data.message || 'Failed to add vehicle make.', {
                    description: "Please check the make name and try again.",
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Error adding vehicle make:', error);
            
            // Handle different types of errors with specific messages
            if (error.errorFields && error.errorFields.length > 0) {
                toast.error("Please fix the form errors before submitting.", {
                    description: "Check the highlighted fields for validation errors.",
                    duration: 4000
                });
            } else if (error.response?.status === 409) {
                toast.error("Vehicle make already exists!", {
                    description: "Please use a different make name.",
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
            title="Add New Make"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    loading={isSubmitting}
                    onClick={handleSubmit}
                >
                    Add
                </Button>
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="makeName"
                    label="Make Name"
                    rules={[
                        { required: true, message: 'Please enter make name' },
                        { min: 2, message: 'Make name must be at least 2 characters' },
                        { 
                            validator: (_, value) => {
                                if (!value || !value.trim()) {
                                    return Promise.reject(new Error('Make name cannot be empty or contain only spaces'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input placeholder="Enter make name" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default MakeModal;
