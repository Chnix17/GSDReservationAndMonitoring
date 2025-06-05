import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { FaEye } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import { SecureStorage } from '../../../../utils/encryption';
import axios from 'axios';

const Create_Modal = ({ visible, onCancel, onSuccess, encryptedUrl, user_id, encryptedUserLevel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [venuePic, setVenuePic] = useState(null);
    const [venueExists, setVenueExists] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('1');
    const [statusOptions, setStatusOptions] = useState([]);

    useEffect(() => {
        fetchStatusAvailability();
    }, []);

    const fetchStatusAvailability = async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/fetchMaster.php`, 
                new URLSearchParams({
                    operation: 'fetchStatusAvailability'
                })
            );

            
            
            if (response.data.status === 'success') {
                setStatusOptions(response.data.data);
            } else {
                console.error("Failed to fetch status options");
            }
        } catch (error) {
            console.error("Error fetching status availability:", error);
        }
    };

    const checkVenueExists = async () => {
        const response = await axios.post(`${encryptedUrl}/user.php`, new URLSearchParams({
            operation: "venueExists",
            json: JSON.stringify({ venue_name: venueName })
        }));

        if (response.data.status === 'success' && response.data.exists) {
            setVenueExists(true);
        } else {
            setVenueExists(false);
        }
    };

    const handleVenueNameChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        setVenueName(sanitizedValue);
        checkVenueExists();
    };

    const handleOccupancyChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        if (/^\d*$/.test(sanitizedValue)) {
            setMaxOccupancy(sanitizedValue);
        }
    };

    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            setVenuePic(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setVenuePic(null);
            setPreviewUrl(null);
        }
    };

    const validateVenueData = () => {
        const sanitizedName = sanitizeInput(venueName);
        const sanitizedOccupancy = sanitizeInput(maxOccupancy);

        if (!validateInput(sanitizedName) || !validateInput(sanitizedOccupancy)) {
            toast.error("Invalid input detected. Please check your entries.");
            return false;
        }

        if (!sanitizedName || !sanitizedOccupancy) {
            toast.error("Please fill in all required fields!");
            return false;
        }

        if (parseInt(sanitizedOccupancy) <= 0) {
            toast.error("Maximum occupancy must be greater than zero!");
            return false;
        }

        return {
            name: sanitizedName,
            occupancy: sanitizedOccupancy
        };
    };

    const handleSubmit = async () => {
        const validatedData = validateVenueData();
        if (!validatedData) return;

        setLoading(true);
        try {
            let imageBase64 = null;
            if (venuePic) {
                imageBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(venuePic);
                });
            }

            const requestData = {
                operation: 'saveVenue',
                data: {
                    name: validatedData.name,
                    occupancy: validatedData.occupancy,
                    user_admin_id: encryptedUserLevel === '1' ? user_id : null,
                    status_availability_id: parseInt(selectedStatus),
                    ven_pic: imageBase64
                }
            };

            const response = await axios.post(
                `${encryptedUrl}/insert_master.php`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Venue successfully added!");
                form.resetFields();
                setVenueName('');
                setMaxOccupancy('');
                setVenuePic(null);
                setPreviewUrl(null);
                setFileList([]);
                setSelectedStatus('1');
                onSuccess();
                onCancel();
            } else {
                toast.error(response.data.message || "Failed to save venue");
            }
        } catch (error) {
            console.error("Error saving venue:", error);
            toast.error("An error occurred while saving the venue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <FaEye className="mr-2 text-green-900" /> 
                    Add Venue
                </div>
            }
            open={visible}
            onCancel={onCancel}
            okText="Add"
            onOk={handleSubmit}
            confirmLoading={loading}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Venue Name"
                    name="name"
                    initialValue={venueName}
                    validateStatus={venueExists ? 'error' : ''}
                    help={venueExists && 'Venue already exists!'}
                    rules={[
                        { required: true, message: 'Please input venue name!' },
                    ]}
                >
                    <Input
                        value={venueName}
                        onChange={handleVenueNameChange}
                        placeholder="Enter venue name"
                    />
                </Form.Item>
                <Form.Item 
                    label="Max Occupancy"
                    name="occupancy"
                    initialValue={maxOccupancy}
                    rules={[
                        { required: true, message: 'Please input maximum occupancy!' },
                    ]}
                >
                    <Input
                        type="number"
                        value={maxOccupancy}
                        onChange={handleOccupancyChange}
                        placeholder="Enter maximum occupancy"
                        min="1"
                    />
                </Form.Item>
                <Form.Item 
                    label="Venue Picture" 
                    tooltip="Upload venue image (max 5MB, formats: jpg, png)"
                >
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={handleImageUpload}
                        beforeUpload={() => false}
                        maxCount={1}
                    >
                        {fileList.length < 1 && (
                            <Button icon={<PlusOutlined />}>
                                Upload
                            </Button>
                        )}
                    </Upload>
                    {previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('http') && (
                        <div className="mt-4">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded shadow-md"
                            />
                        </div>
                    )}
                </Form.Item>
                <Form.Item 
                    label="Status" 
                    required
                    tooltip="Select venue availability status"
                >
                    <Select
                        value={selectedStatus}
                        onChange={(value) => setSelectedStatus(value)}
                        className="w-full"
                    >
                        {statusOptions.map(status => (
                            <Select.Option 
                                key={status.status_availability_id} 
                                value={status.status_availability_id}
                            >
                                {status.status_availability_name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default Create_Modal;
