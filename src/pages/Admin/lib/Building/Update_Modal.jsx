import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Modal, Form, Input, Button, Drawer } from 'antd';
import { FaEdit } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';

const Update_Modal = ({ visible, onCancel, onSuccess, buildingId }) => {
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [buildingName, setBuildingName] = useState('');

    const baseUrl = SecureStorage.getLocalItem("url");

    const getBuildingDetails = useCallback(async () => {
        if (!buildingId) {
            toast.error("No building ID provided.");
            return;
        }

        try {
            const requestData = {
                operation: 'fetchBuildingById',
                id: buildingId
            };

            const response = await axios.post(
                `${baseUrl}/Admin.php`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success' && response.data.data && response.data.data.length > 0) {
                const building = response.data.data[0];
                setBuildingName(building.venue_building_name);

                form.setFieldsValue({
                    name: building.venue_building_name
                });
            } else {
                toast.error("Failed to fetch building details");
            }
        } catch (error) {
            console.error("Error fetching building details:", error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to load building details. Please check your internet connection.");
            } else {
                toast.error("An error occurred while fetching building details");
            }
        }
    }, [buildingId, baseUrl, form]);

    useEffect(() => {
        if (visible && buildingId) {
            getBuildingDetails();
        }
    }, [visible, buildingId, getBuildingDetails]);

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

            setLoading(true);
            
            const requestData = {
                operation: 'updateBuilding',
                building_id: buildingId,
                building_name: sanitizedName.trim(),
                user_admin_id: SecureStorage.getLocalItem("user_id")
            };

            const response = await axios.post(
                `${baseUrl}/Admin.php`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Building successfully updated!");
                onSuccess();
                form.resetFields();
                setBuildingName('');
                onCancel();
            } else {
                toast.error(response.data.message || "Failed to update building");
            }
        } catch (error) {
            if (error.errorFields) {
                return;
            }
            console.error("Error updating building:", error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to update building. Please check your internet connection and try again.");
            } else {
                toast.error("An error occurred while updating the building.");
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
                    className="bg-green-900 hover:bg-lime-900"
                    size={isMobile ? "large" : "default"}
                    block={isMobile}
                >
                    Update Building
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
                            <FaEdit className="mr-2 text-green-900" /> 
                            Edit Building
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
                            <FaEdit className="mr-2 text-green-900" /> 
                            Edit Building
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

export default Update_Modal;
