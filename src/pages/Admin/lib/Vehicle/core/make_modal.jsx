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
            
            if (!sanitizedName.trim()) {
                toast.error("Please enter a make name.");
                return;
            }

            if (!validateInput(sanitizedName)) {
                toast.error("Input contains invalid characters.");
                return;
            }

            setIsSubmitting(true);
            const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;

            const requestData = {
                operation: 'saveMakeData',
                vehicle_make_name: sanitizedName,
                userid: userId
            };

            const response = await axios.post(`${BASE_URL}Admin.php`, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success('Vehicle make added successfully!');
                form.resetFields();
                onSuccess();
                onCancel();
            } else {
                toast.error(response.data.message || 'Failed to add vehicle make.');
            }
        } catch (error) {
            console.error('Error adding vehicle make:', error);
            toast.error('Error adding vehicle make.');
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
                        { min: 2, message: 'Make name must be at least 2 characters' }
                    ]}
                >
                    <Input placeholder="Enter make name" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default MakeModal;
