import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { FaEye } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';

const Update_Modal = ({ visible, onCancel, onSuccess, venueId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [venuePic, setVenuePic] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('1');
    const [statusOptions, setStatusOptions] = useState([]);

    const baseUrl = SecureStorage.getLocalItem("url");

    useEffect(() => {
        fetchStatusAvailability();
    }, []);

    useEffect(() => {
        if (visible && venueId) {
            getVenueDetails();
        }
    }, [visible, venueId]);

    const fetchStatusAvailability = async () => {
        try {
            const response = await axios.post(`${baseUrl}/fetchMaster.php`, 
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

    const getVenueDetails = async () => {
        try {
            const formData = new URLSearchParams();
            formData.append('operation', 'fetchVenueById');
            formData.append('id', venueId);
    
            const response = await axios.post(`${baseUrl}/fetchMaster.php`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            if (response.data.status === 'success' && response.data.data && response.data.data.length > 0) {
                const venue = response.data.data[0];
                setVenueName(venue.ven_name);
                setMaxOccupancy(venue.ven_occupancy);
                setSelectedStatus(venue.status_availability_id);
                
                if (venue.ven_pic) {
                    const imageUrl = `${baseUrl}/${venue.ven_pic}`;
                    setPreviewUrl(imageUrl);
                    setFileList([{
                        uid: '-1',
                        name: 'venue-image.png',
                        status: 'done',
                        url: imageUrl,
                    }]);
                } else {
                    setPreviewUrl(null);
                    setFileList([]);
                }
                
                form.setFieldsValue({
                    name: venue.ven_name,
                    occupancy: venue.ven_occupancy,
                    status: venue.status_availability_id
                });
            } else {
                toast.error("Failed to fetch venue details");
            }
        } catch (error) {
            console.error("Error fetching venue details:", error);
            toast.error("An error occurred while fetching venue details");
        }
    };

    const handleVenueNameChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        setVenueName(sanitizedValue);
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
            let requestData = {
                operation: 'updateVenue',
                venueData: {
                    venue_id: venueId,
                    venue_name: validatedData.name,
                    max_occupancy: validatedData.occupancy,
                    status_availability_id: parseInt(selectedStatus)
                }
            };

            if (venuePic instanceof File) {
                const reader = new FileReader();
                const base64Image = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(venuePic);
                });
                requestData.venueData.ven_pic = base64Image;
            }

            const response = await axios.post(
                `${baseUrl}/update_master1.php`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Venue successfully updated!");
                onSuccess();
                form.resetFields();
                setVenueName('');
                setMaxOccupancy('');
                setVenuePic(null);
                setPreviewUrl(null);
                setFileList([]);
                onCancel();
            } else {
                toast.error(response.data.message || "Failed to update venue");
            }
        } catch (error) {
            console.error("Error updating venue:", error);
            toast.error("An error occurred while updating the venue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <FaEye className="mr-2 text-green-900" /> 
                    Edit Venue
                </div>
            }
            open={visible}
            onCancel={onCancel}
            okText="Update"
            onOk={handleSubmit}
            confirmLoading={loading}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Venue Name"
                    name="name"
                    initialValue={venueName}
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

export default Update_Modal;
