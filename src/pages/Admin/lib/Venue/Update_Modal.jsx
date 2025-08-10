import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
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
    const [selectedStatus, setSelectedStatus] = useState('1');
    const [statusOptions, setStatusOptions] = useState([]);
    const [eventType, setEventType] = useState('Big Event');
    const [areaType, setAreaType] = useState(null);

    const baseUrl = SecureStorage.getLocalItem("url");

    const fetchStatusAvailability = useCallback(async () => {
        try {
            const response = await axios.post(`${baseUrl}/user.php`, 
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
    }, [baseUrl]);

    useEffect(() => {
        fetchStatusAvailability();
    }, [fetchStatusAvailability]);

    const getVenueDetails = useCallback(async () => {
        if (!venueId) {
            toast.error("No venue ID provided.");
            return;
        }

        try {
            const requestData = {
                operation: 'fetchVenueById',
                id: venueId
            };

            const response = await axios.post(
                `${baseUrl}/user.php`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success' && response.data.data && response.data.data.length > 0) {
                const venue = response.data.data[0];
                setVenueName(venue.ven_name);
                setMaxOccupancy(venue.ven_occupancy);
                setSelectedStatus(venue.status_availability_id);
                setEventType(venue.event_type || 'Big Event');
                setAreaType(venue.area_type || null);

                form.setFieldsValue({
                    name: venue.ven_name,
                    occupancy: venue.ven_occupancy,
                    status: venue.status_availability_id,
                    event_type: venue.event_type || 'Big Event',
                    area_type: venue.area_type || null,
                });
            } else {
                toast.error("Failed to fetch venue details");
            }
        } catch (error) {
            console.error("Error fetching venue details:", error);
            toast.error("An error occurred while fetching venue details");
        }
    }, [venueId, baseUrl, form]);

    useEffect(() => {
        if (visible && venueId) {
            getVenueDetails();
        }
    }, [visible, venueId, getVenueDetails]);

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
                operation: 'updateVenue',
                venue_id: venueId,
                venue_name: validatedData.name,
                max_occupancy: validatedData.occupancy,
                status_availability_id: parseInt(selectedStatus),
                event_type: validatedData.event_type,
                area_type: validatedData.area_type
            };

            const response = await axios.post(
                `${baseUrl}/user.php`,
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
            footer={null}
            width={800}
        >
            <Form form={form} layout="vertical" className="p-4">
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
                            { value: 'Close Area', label: 'Close Area' }
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
                        Update Venue
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default Update_Modal;
