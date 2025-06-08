import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { toast } from 'sonner';
import axios from 'axios';
import {SecureStorage} from '../../../../../utils/encryption';

const MakeModal = ({ open, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const BASE_URL = SecureStorage.getLocalItem("url");

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setIsSubmitting(true);

            const response = await axios.post(BASE_URL, {
                operation: "saveMakeData",
                json: {
                    vehicle_make_name: values.makeName
                }
            });

            if (response.data.status === 'success') {
                toast.success('Make added successfully');
                form.resetFields();
                onSuccess();
                onCancel();
            } else {
                toast.error(response.data.message || 'Failed to add make');
            }
        } catch (error) {
            toast.error(error.message || 'An error occurred');
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
