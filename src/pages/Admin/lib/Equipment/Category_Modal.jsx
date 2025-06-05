import React, { useState } from 'react';
import { Modal, Form, Input, Button, message as toast } from 'antd';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';

const CategoryModal = ({ isOpen, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const baseUrl = SecureStorage.getLocalItem("url");

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const sanitizedCategoryName = sanitizeInput(values.categoryName);
            
            if (!validateInput(sanitizedCategoryName)) {
                toast.error('Category name contains invalid characters.');
                return;
            }

            const requestData = {
                operation: "saveEquipmentCategory",
                json: {
                    equipments_category_name: sanitizedCategoryName
                }
            };

            setLoading(true);
            const response = await axios.post(
                `${baseUrl}/vehicle_master.php`,
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Category added successfully!");
                form.resetFields();
                onSuccess();
                onClose();
            } else {
                toast.error(`Failed to add category: ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {
            toast.error("An error occurred while adding category.");
            console.error("Error saving category:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Add Equipment Category"
            open={isOpen}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={400}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Category Name"
                    name="categoryName"
                    rules={[
                        { required: true, message: 'Please input category name!' },
                        { max: 100, message: 'Category name cannot exceed 100 characters!' }
                    ]}
                >
                    <Input placeholder="Enter category name" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CategoryModal;
