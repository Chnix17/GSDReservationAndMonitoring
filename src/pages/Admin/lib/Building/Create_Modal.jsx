import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Modal, Form, Input, Button, Drawer } from 'antd';
import { FaBuilding } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';

const Create_Modal = ({ visible, onCancel, onSuccess, encryptedUrl }) => {
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [buildingName, setBuildingName] = useState('');
    const [buildingExists, setBuildingExists] = useState(false);

    const checkBuildingExists = async () => {
        if (!buildingName.trim()) {
            setBuildingExists(false);
            return;
        }
        
        try {
            const response = await axios.post(`${encryptedUrl}/Admin.php`, 
                JSON.stringify({
                    operation: "buildingExists",
                    building_name: buildingName
                }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success' && response.data.exists) {
                setBuildingExists(true);
            } else {
                setBuildingExists(false);
            }
        } catch (error) {
            console.error("Error checking building existence:", error);
            setBuildingExists(false);
        }
    };

    const handleBuildingNameChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        setBuildingName(sanitizedValue);
    };

    const handleSubmit = async () => {
        try {
            await form.validateFields();
            
            const sanitizedName = sanitizeInput(buildingName);
            
            if (!validateInput(sanitizedName)) {
                toast.error("Invalid input detected. Please check your entries.");
                return;
            }

            if (!sanitizedName || !sanitizedName.trim()) {
                toast.error("Building name cannot be empty or contain only whitespace!");
                return;
            }

            if (buildingExists) {
                toast.error("This building name already exists!");
                return;
            }

            setLoading(true);
            
            const requestData = {
                operation: 'saveBuilding',
                building_name: sanitizedName.trim(),
                user_admin_id: SecureStorage.getLocalItem('user_id')
            };

            const response = await axios.post(
                `${encryptedUrl}/Admin.php`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Building successfully added!");
                form.resetFields();
                setBuildingName('');
                onSuccess();
                onCancel();
            } else {
                toast.error(response.data.message || "Failed to save building");
            }
        } catch (error) {
            if (error.errorFields) {
                return;
            }
            console.error("Error saving building:", error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to create building. Please check your internet connection and try again.");
            } else {
                toast.error("An error occurred while saving the building.");
            }
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <Form form={form} layout="vertical" className={isMobile ? "p-3" : "p-4"}>
            <Form.Item
                label="Building Name"
                name="name"
                validateStatus={buildingExists ? 'error' : ''}
                help={buildingExists && 'Building name already exists!'}
                rules={[
                    { required: true, message: 'Please input building name!' },
                    { 
                        validator: (_, value) => {
                            if (value && value.trim() === '') {
                                toast.error('Building name cannot contain only whitespace!');
                                return Promise.reject(new Error('Building name cannot contain only whitespace!'));
                            }
                            return Promise.resolve();
                        }
                    }
                ]}
            >
                <Input
                    value={buildingName}
                    onChange={handleBuildingNameChange}
                    onBlur={checkBuildingExists}
                    placeholder="Enter building name"
                    size={isMobile ? "middle" : "large"}
                />
            </Form.Item>
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'} mt-4`}>
                <Button 
                    onClick={onCancel}
                    size={isMobile ? "large" : "default"}
                    block={isMobile}
                >
                    Cancel
                </Button>
                <Button 
                    type="primary" 
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={buildingExists}
                    className="bg-green-900 hover:bg-lime-900"
                    size={isMobile ? "large" : "default"}
                    block={isMobile}
                >
                    Add Building
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
                            <FaBuilding className="mr-2 text-green-900" /> 
                            Add Building
                        </div>
                    }
                    placement="bottom"
                    open={visible}
                    onClose={onCancel}
                    height="60%"
                    bodyStyle={{ paddingBottom: '120px' }}
                >
                    {modalContent}
                </Drawer>
            ) : (
                <Modal
                    title={
                        <div className="flex items-center">
                            <FaBuilding className="mr-2 text-green-900" /> 
                            Add Building
                        </div>
                    }
                    open={visible}
                    onCancel={onCancel}
                    footer={null}
                    width={isTablet ? 600 : 700}
                >
                    {modalContent}
                </Modal>
            )}
        </>
    );
};

export default Create_Modal;
