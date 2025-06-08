import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { toast } from 'sonner';
import axios from 'axios';
import {SecureStorage} from '../../../../../utils/encryption';

const CategoryModal = ({ open, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setIsSubmitting(true);
            const encryptedUrl = SecureStorage.getLocalItem("url");

            console.log('Submitting category data:', values.categoryName);

            const response = await axios.post(
                `${encryptedUrl}/gsd/vehicle_master.php`,
                {
                    operation: "saveCategoryData",
                    json: {
                        vehicle_category_name: values.categoryName
                    }
                }
            );

            console.log('API Response:', response.data);

            if (response.data.status === 'success') {
                console.log('Category added successfully, refreshing categories...');
                toast.success('Category added successfully');
                form.resetFields();
                onSuccess();
            } else {
                console.error('Failed to add category:', response.data.message);
                toast.error(response.data.message || 'Failed to add category');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error(error.message || 'An error occurred');
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
