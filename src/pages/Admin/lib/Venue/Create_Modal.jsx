import React, { useState } from 'react';
import { Modal, Form, Input, Button, Select } from 'antd';
import { FaBuilding } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';

const Create_Modal = ({ visible, onCancel, onSuccess, encryptedUrl, user_id, encryptedUserLevel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [venueExists, setVenueExists] = useState(false);
    const [eventType, setEventType] = useState('Big Event');
    const [areaType, setAreaType] = useState(null);

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

    const validateVenueData = () => {
        const sanitizedName = sanitizeInput(venueName);
        const sanitizedOccupancy = sanitizeInput(maxOccupancy);
        const sanitizedEventType = sanitizeInput(eventType);
        const sanitizedAreaType = sanitizeInput(areaType);

        if (!validateInput(sanitizedName) || !validateInput(sanitizedOccupancy) || 
            !validateInput(sanitizedEventType) || !validateInput(sanitizedAreaType)) {
            toast.error("Invalid input detected. Please check your entries.");
            return false;
        }

        if (!sanitizedName || !sanitizedOccupancy || !sanitizedEventType || !sanitizedAreaType) {
            toast.error("Please fill in all required fields!");
            return false;
        }

        if (parseInt(sanitizedOccupancy) <= 0) {
            toast.error("Maximum occupancy must be greater than zero!");
            return false;
        }

        return {
            name: sanitizedName,
            occupancy: sanitizedOccupancy,
            event_type: sanitizedEventType,
            area_type: sanitizedAreaType
        };
    };

    const handleSubmit = async () => {
        const validatedData = validateVenueData();
        if (!validatedData) return;

        setLoading(true);
        try {
            const requestData = {
                operation: 'saveVenue',
                name: validatedData.name,
                occupancy: validatedData.occupancy,
                event_type: validatedData.event_type,
                area_type: validatedData.area_type,
                user_admin_id: SecureStorage.getSessionItem('user_id')
            };

            const response = await axios.post(
                `${encryptedUrl}/user.php`,
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
                setEventType('Big Event');
                setAreaType(null);
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
                    <FaBuilding className="mr-2 text-green-900" /> 
                    Add Venue
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
        >
            <Form form={form} layout="vertical" className="p-4">
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
                    label="Event Type"
                    name="event_type"
                    initialValue={eventType}
                    rules={[
                        { required: true, message: 'Please select event type!' },
                    ]}
                >
                    <Select
                        value={eventType}
                        onChange={value => setEventType(value)}
                        options={[
                            { value: 'Big Event', label: 'Big Event' },
                            { value: 'Small Event', label: 'Small Event' }
                        ]}
                    />
                </Form.Item>
                <Form.Item 
                    label="Area Type"
                    name="area_type"
                    initialValue={areaType}
                    rules={[
                        { required: true, message: 'Please select area type!' },
                    ]}
                >
                    <Select
                        value={areaType}
                        onChange={value => setAreaType(value)}
                        placeholder="Select area type"
                        options={[
                            { value: 'Open Area', label: 'Open Area' },
                            { value: 'Open Area', label: 'Close Area' }
                        ]}
                    />
                </Form.Item>
                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        onClick={handleSubmit}
                        loading={loading}
                        className="bg-green-900 hover:bg-lime-900"
                    >
                        Add Venue
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default Create_Modal;
