import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Form, Button, message as toast, AutoComplete, Drawer } from 'antd';
import { FaTools } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';
import axios from 'axios';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import { SecureStorage } from '../../../../utils/encryption';

const UpdateEquipmentModal = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    equipmentId,
    equipmentNameOptions = []
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [equipmentName, setEquipmentName] = useState('');
    const baseUrl = SecureStorage.getLocalItem("url");
    const hasLoadedData = useRef(false);

    const getEquipmentDetails = useCallback(async (equip_id) => {
        const url = `${baseUrl}/Admin.php`;
        const jsonData = { operation: "fetchEquipmentById", id: equip_id };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                const equipment = response.data.data;
                
                // Set equipment name
                setEquipmentName(equipment.equip_name);
                
                // Set form values first
                form.setFieldsValue({
                    equipmentName: equipment.equip_name
                });
            } else {
                toast.error("Error fetching equipment details: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching equipment details:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load equipment details. Please check your internet connection.');
            } else {
                toast.error("An error occurred while fetching equipment details.");
            }
        }
    }, [baseUrl, form]);

    useEffect(() => {
        if (isOpen && !hasLoadedData.current) {
            hasLoadedData.current = true;
            if (equipmentId) {
                getEquipmentDetails(equipmentId);
            }
        }
    }, [isOpen, equipmentId, getEquipmentDetails]);

    // Reset the ref when modal closes
    useEffect(() => {
        if (!isOpen) {
            hasLoadedData.current = false;
        }
    }, [isOpen]);

    const handleEquipmentNameChange = (value) => {
        setEquipmentName(value);
        form.setFieldsValue({ equipmentName: value });
    };

    const handleEquipmentNameBlur = () => {
        if (equipmentName) {
            const sanitized = sanitizeInput(equipmentName);
            if (!validateInput(sanitized)) {
                toast.error('Invalid input detected. Please avoid special characters and scripts.');
                setEquipmentName('');
                form.setFieldsValue({ equipmentName: '' });
                return;
            }
            setEquipmentName(sanitized);
            form.setFieldsValue({ equipmentName: sanitized });
        }
    };

    const resetForm = () => {
        setEquipmentName('');
        form.resetFields();
    };

    const handleSubmit = async () => {
        // Trim whitespace and validate
        const trimmedEquipmentName = equipmentName.trim();
        
        if (!trimmedEquipmentName) {
            toast.error("Equipment name cannot be empty or contain only spaces!");
            return;
        }

        if (!validateInput(trimmedEquipmentName)) {
            toast.error('Equipment name contains invalid characters.');
            return;
        }

        const user_admin_id = SecureStorage.getLocalItem('user_id');
        const requestData = {
            operation: "updateEquipment",
            equip_id: equipmentId,
            equip_name: trimmedEquipmentName,
            user_admin_id: user_admin_id
        };

        console.log("Request Data being sent:", requestData);   

        setLoading(true);
        try {
            const response = await axios.post(
                `${baseUrl}/Admin.php`,
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data && response.data.status === 'success') {
                toast.success(response.data.message || "Equipment updated successfully!");
                resetForm();
                onSuccess();
                onClose();
            } else {
                toast.error(response.data.message || "Failed to update equipment");
            }
        } catch (error) {
            console.error("Error updating equipment:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to update equipment. Please check your internet connection and try again.');
            } else {
                toast.error("An error occurred while updating equipment.");
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
                rules={[{ required: true, message: 'Please input equipment name!' }]}
            >
                <AutoComplete
                    value={equipmentName}
                    onChange={(value) => handleEquipmentNameChange(value)}
                    onBlur={handleEquipmentNameBlur}
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
                    Update Equipment
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
                            Update Equipment
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
                            Update Equipment
                        </div>
                    }
                    open={isOpen}
                    onCancel={() => {
                        resetForm();
                        onClose();
                    }}
                    footer={null}
                    width={isTablet ? 600 : 700}
                >
                    {modalContent}
                </Modal>
            )}
        </>
    );
};

export default UpdateEquipmentModal;