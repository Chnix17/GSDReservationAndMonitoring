import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button, AutoComplete, Drawer } from 'antd';
import { FaTools } from 'react-icons/fa';
import { toast } from 'sonner';
import { useMediaQuery } from 'react-responsive';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';

const MasterEquipmentModal = ({ isOpen, onClose, onSuccess }) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [equipmentName, setEquipmentName] = useState('');
    const [equipmentNameOptions, setEquipmentNameOptions] = useState([]);
    const baseUrl = SecureStorage.getLocalItem("url");

    const fetchEquipmentNames = useCallback(async () => {
        const url = `${baseUrl}/Admin.php`;
        const jsonData = { operation: "fetchEquipmentName" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                const options = response.data.data.map(equipment => ({
                    value: equipment.equip_name,
                    label: equipment.equip_name,
                    equip_id: equipment.equip_id,
                    category_name: equipment.category_name
                }));
                setEquipmentNameOptions(options);
            } else {
                
            }
        } catch (error) {
        }
    }, [baseUrl]);

    useEffect(() => {
        if (isOpen) {
            fetchEquipmentNames();
        }
    }, [isOpen, fetchEquipmentNames]);

    const handleEquipmentNameSearch = (value) => {
        const sanitized = sanitizeInput(value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid input detected. Please avoid special characters and scripts.');
            return;
        }
        setEquipmentName(sanitized);
        form.setFieldsValue({ equipmentName: sanitized });
    };

    const resetForm = () => {
        setEquipmentName('');
        form.resetFields();
    };

    const validateEquipmentData = () => {
        const sanitizedName = sanitizeInput(equipmentName);

        if (!validateInput(sanitizedName)) {
            toast.error("Invalid input detected. Please check your entries.");
            return false;
        }

        // Check for empty or whitespace-only fields
        if (!sanitizedName || !sanitizedName.trim()) {
            toast.error("Equipment name cannot be empty or contain only whitespace!");
            return false;
        }

        return {
            name: sanitizedName.trim()
        };
    };

    const handleSubmit = async () => {
        try {
            // First validate the form fields
            await form.validateFields();
            
            // Then run custom validation
            const validatedData = validateEquipmentData();
            if (!validatedData) return;

            setLoading(true);
            
            const requestData = {
                operation: "saveEquipment",
                name: validatedData.name,
                user_admin_id: SecureStorage.getLocalItem('user_id')
            };

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
                toast.success("Equipment master added successfully!");
                resetForm();
                onSuccess();
                onClose();
            } else {
                toast.error(response.data.message || "Failed to save equipment");
            }
        } catch (error) {
            if (error.errorFields) {
                // Form validation error - don't show toast as Antd will show field errors
                return;
            }
            console.error("Error saving equipment:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to create equipment. Please check your internet connection and try again.');
            } else {
                toast.error("An error occurred while saving equipment.");
            }
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <Form form={form} layout="vertical" className={isMobile ? "p-3" : "p-4"}>
            <Form.Item
                label="Equipment Name"
                name="equipmentName"
                initialValue={equipmentName}
                rules={[
                    { required: true, message: 'Please input equipment name!' },
                    { 
                        validator: (_, value) => {
                            if (value && value.trim() === '') {
                                toast.error('Equipment name cannot contain only whitespace!');
                                return Promise.reject(new Error('Equipment name cannot contain only whitespace!'));
                            }
                            return Promise.resolve();
                        }
                    }
                ]}
            >
                <AutoComplete
                    value={equipmentName}
                    onChange={(value) => handleEquipmentNameSearch(value)}
                    placeholder="Enter equipment name"
                    options={equipmentNameOptions}
                    size={isMobile ? "middle" : "large"}
                    filterOption={(inputValue, option) =>
                        option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                    }
                />
            </Form.Item>

            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'} mt-4`}>
                <Button 
                    onClick={() => {
                        resetForm();
                        onClose();
                    }}
                    size={isMobile ? "large" : "middle"}
                    block={isMobile}
                >
                    Cancel
                </Button>
                <Button 
                    type="primary" 
                    onClick={handleSubmit}
                    loading={loading}
                    size={isMobile ? "large" : "middle"}
                    block={isMobile}
                    className="bg-green-900 hover:bg-lime-900"
                >
                    Add Equipment
                </Button>
            </div>
        </Form>
    );

    return (
        <>
            {isMobile ? (
                <Drawer
                    title={
                        <div className="flex items-center">
                            <FaTools className="mr-2 text-green-900" /> 
                            Add Equipment Master
                        </div>
                    }
                    placement="bottom"
                    height="90%"
                    open={isOpen}
                    onClose={() => {
                        resetForm();
                        onClose();
                    }}
                    bodyStyle={{ paddingBottom: '60px' }}
                >
                    {modalContent}
                </Drawer>
            ) : (
                <Modal
                    title={
                        <div className="flex items-center">
                            <FaTools className="mr-2 text-green-900" /> 
                            Add Equipment Master
                        </div>
                    }
                    open={isOpen}
                    onCancel={() => {
                        resetForm();
                        onClose();
                    }}
                    footer={null}
                    width={isTablet ? 700 : 800}
                >
                    {modalContent}
                </Modal>
            )}
        </>
    );
};

export default MasterEquipmentModal;
