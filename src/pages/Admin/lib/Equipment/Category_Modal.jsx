import React, { useState } from 'react';
import { Modal, Drawer, Form, Input, message as toast } from 'antd';
import { useMediaQuery } from 'react-responsive';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';

const CategoryModal = ({ isOpen, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const baseUrl = SecureStorage.getLocalItem("url");
    
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const sanitizedCategoryName = sanitizeInput(values.categoryName);
            const trimmedCategoryName = sanitizedCategoryName.trim();
            
            if (!trimmedCategoryName) {
                toast.error('Category name cannot be empty or contain only spaces!');
                return;
            }
            
            if (!validateInput(trimmedCategoryName)) {
                toast.error('Category name contains invalid characters.');
                return;
            }

            const requestData = {
                operation: "saveEquipmentCategory",
                json: {
                    equipments_category_name: trimmedCategoryName
                }
            };

            setLoading(true);
            const response = await axios.post(
                `${baseUrl}/Admin.php`,
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

    const handleClose = () => {
        form.resetFields();
        onClose();
    };

    const formContent = (
        <Form form={form} layout="vertical">
            <Form.Item
                label="Category Name"
                name="categoryName"
                rules={[
                    { required: true, message: 'Please input category name!' },
                    { 
                        validator: (_, value) => {
                            if (value && value.trim() === '') {
                                toast.error('Category name cannot contain only whitespace!');
                                return Promise.reject(new Error('Category name cannot contain only whitespace!'));
                            }
                            return Promise.resolve();
                        }
                    },
                    { max: 100, message: 'Category name cannot exceed 100 characters!' }
                ]}
            >
                <Input 
                    placeholder="Enter category name" 
                    size={isMobile ? "large" : "middle"}
                />
            </Form.Item>
        </Form>
    );

    if (isMobile) {
        return (
            <Drawer
                title="Add Equipment Category"
                placement="bottom"
                height="40%"
                open={isOpen}
                onClose={handleClose}
                footer={
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px',
                        padding: '16px 0'
                    }}>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: loading ? '#d9d9d9' : '#1890ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Adding...' : 'Add Category'}
                        </button>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'transparent',
                                color: '#666',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                fontSize: '16px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                }
                bodyStyle={{ paddingBottom: '120px' }}
            >
                {formContent}
            </Drawer>
        );
    }

    return (
        <Modal
            title="Add Equipment Category"
            open={isOpen}
            onCancel={handleClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={isTablet ? 350 : 400}
            okText="Add Category"
            cancelText="Cancel"
        >
            {formContent}
        </Modal>
    );
};

export default CategoryModal;
