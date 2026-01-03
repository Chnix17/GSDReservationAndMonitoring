import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Modal, Form, Input, Button, Select, Drawer } from 'antd';
import { FaBuilding } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';

const Create_Modal = ({ visible, onCancel, onSuccess, encryptedUrl, user_id, encryptedUserLevel }) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [minOccupancy, setMinOccupancy] = useState('');
    const [venueExists, setVenueExists] = useState(false);
    const [eventType, setEventType] = useState('Big Event');
    const [areaType, setAreaType] = useState(null);
    const [buildingId, setBuildingId] = useState(null);
    const [buildings, setBuildings] = useState([]);

    const fetchBuildings = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/Admin.php`, 
                new URLSearchParams({
                    operation: 'fetchVenueBuildings'
                })
            );
            
            if (response.data.status === 'success') {
                setBuildings(response.data.data);
            } else {
                console.error("Failed to fetch buildings");
            }
        } catch (error) {
            console.error("Error fetching buildings:", error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to load buildings.");
            }
        }
    }, [encryptedUrl]);

    useEffect(() => {
        if (visible) {
            fetchBuildings();
        }
    }, [visible, fetchBuildings]);

    const checkVenueExists = async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/Admin.php`, new URLSearchParams({
                operation: "venueExists",
                json: JSON.stringify({ venue_name: venueName })
            }));

            if (response.data.status === 'success' && response.data.exists) {
                setVenueExists(true);
            } else {
                setVenueExists(false);
            }
        } catch (error) {
            console.error("Error checking venue existence:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to verify venue name.");
            }
            // Silently fail for venue existence check - don't block user input
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

    const handleMinOccupancyChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        if (/^\d*$/.test(sanitizedValue)) {
            setMinOccupancy(sanitizedValue);
        }
    };

    const validateVenueData = () => {
        const sanitizedName = sanitizeInput(venueName);
        const sanitizedOccupancy = sanitizeInput(maxOccupancy);
        const sanitizedMinOccupancy = sanitizeInput(minOccupancy);
        const sanitizedEventType = sanitizeInput(eventType);
        const sanitizedAreaType = sanitizeInput(areaType);

        if (!validateInput(sanitizedName) || !validateInput(sanitizedOccupancy) || 
            !validateInput(sanitizedEventType) || !validateInput(sanitizedAreaType)) {
            toast.error("Invalid input detected. Please check your entries.");
            return false;
        }

        // Check for empty or whitespace-only fields
        if (!sanitizedName || !sanitizedName.trim()) {
            toast.error("Venue name cannot be empty or contain only whitespace!");
            return false;
        }

        if (!sanitizedOccupancy || !sanitizedOccupancy.toString().trim()) {
            toast.error("Maximum occupancy cannot be empty or contain only whitespace!");
            return false;
        }

        // Require minimum occupancy
        if (!sanitizedMinOccupancy || !sanitizedMinOccupancy.toString().trim()) {
            toast.error("Minimum occupancy cannot be empty or contain only whitespace!");
            return false;
        }

        if (!sanitizedEventType || !sanitizedEventType.trim()) {
            toast.error("Event type cannot be empty or contain only whitespace!");
            return false;
        }

        if (!sanitizedAreaType || !sanitizedAreaType.trim()) {
            toast.error("Area type cannot be empty or contain only whitespace!");
            return false;
        }

        // Require location selection
        if (!buildingId) {
            toast.error("Location is required!");
            return false;
        }

        if (parseInt(sanitizedOccupancy) <= 0) {
            toast.error("Maximum occupancy must be greater than zero!");
            return false;
        }

        // Validate minimum occupancy constraints
        if (parseInt(sanitizedMinOccupancy) < 0) {
            toast.error("Minimum occupancy cannot be negative!");
            return false;
        }
        if (parseInt(sanitizedMinOccupancy) > parseInt(sanitizedOccupancy)) {
            toast.error("Minimum occupancy cannot be greater than maximum occupancy!");
            return false;
        }

        return {
            name: sanitizedName.trim(),
            occupancy: sanitizedOccupancy,
            min_occupancy: sanitizedMinOccupancy || 0,
            event_type: sanitizedEventType.trim(),
            area_type: sanitizedAreaType.trim()
        };
    };

    const handleSubmit = async () => {
        try {
            // First validate the form fields
            await form.validateFields();
            
            // Then run custom validation
            const validatedData = validateVenueData();
            if (!validatedData) return;

            setLoading(true);
            
            const requestData = {
                operation: 'saveVenue',
                name: validatedData.name,
                occupancy: validatedData.occupancy,
                min_occupancy: validatedData.min_occupancy,
                event_type: validatedData.event_type,
                area_type: validatedData.area_type,
                building_id: buildingId,
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
                toast.success("Venue successfully added!");
                form.resetFields();
                setVenueName('');
                setMaxOccupancy('');
                setMinOccupancy('');
                setEventType('Big Event');
                setAreaType(null);
                setBuildingId(null);
                onSuccess();
                onCancel();
            } else {
                toast.error(response.data.message || "Failed to save venue");
            }
        } catch (error) {
            if (error.errorFields) {
                // Form validation error - don't show toast as Antd will show field errors
                return;
            }
            console.error("Error saving venue:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to create venue. Please check your internet connection and try again.");
            } else {
                toast.error("An error occurred while saving the venue.");
            }
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <Form form={form} layout="vertical" className={isMobile ? "p-3" : "p-4"}>
                <Form.Item
                    label="Venue Name"
                    name="name"
                    initialValue={venueName}
                    validateStatus={venueExists ? 'error' : ''}
                    help={venueExists && 'Venue already exists!'}
                    rules={[
                        { required: true, message: 'Please input venue name!' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Venue name cannot contain only whitespace!');
                                    return Promise.reject(new Error('Venue name cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
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
                        { 
                            validator: (_, value) => {
                                if (value && value.toString().trim() === '') {
                                    toast.error('Maximum occupancy cannot contain only whitespace!');
                                    return Promise.reject(new Error('Maximum occupancy cannot contain only whitespace!'));
                                }
                                if (value && parseInt(value) < 0) {
                                    toast.error('Maximum occupancy cannot be negative!');
                                    return Promise.reject(new Error('Maximum occupancy cannot be negative!'));
                                }
                                return Promise.resolve();
                            }
                        }
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
                    label="Min Occupancy"
                    name="min_occupancy"
                    initialValue={minOccupancy}
                    rules={[
                        { required: true, message: 'Please input minimum occupancy!' },
                        { 
                            validator: (_, value) => {
                                if (value && value.toString().trim() === '') {
                                    toast.error('Minimum occupancy cannot contain only whitespace!');
                                    return Promise.reject(new Error('Minimum occupancy cannot contain only whitespace!'));
                                }
                                if (value && parseInt(value) < 0) {
                                    toast.error('Minimum occupancy cannot be negative!');
                                    return Promise.reject(new Error('Minimum occupancy cannot be negative!'));
                                }
                                if (value && maxOccupancy && parseInt(value) > parseInt(maxOccupancy)) {
                                    toast.error('Minimum occupancy cannot be greater than maximum occupancy!');
                                    return Promise.reject(new Error('Minimum occupancy cannot be greater than maximum occupancy!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input
                        type="number"
                        value={minOccupancy}
                        onChange={handleMinOccupancyChange}
                        placeholder="Enter minimum occupancy"
                        min="0"
                    />
                </Form.Item>
                <Form.Item 
                    label="Event Type"
                    name="event_type"
                    initialValue={eventType}
                    rules={[
                        { required: true, message: 'Please select event type!' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Event type cannot contain only whitespace!');
                                    return Promise.reject(new Error('Event type cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
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
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Area type cannot contain only whitespace!');
                                    return Promise.reject(new Error('Area type cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
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
                <Form.Item 
                    label="Location"
                    name="location"
                    initialValue={buildingId}
                    rules={[
                        { required: true, message: 'Please select location!' }
                    ]}
                >
                    <Select
                        value={buildingId}
                        onChange={value => setBuildingId(value)}
                        placeholder="Select location"
                        allowClear
                        options={buildings.map(building => ({
                            value: building.venue_building_id,
                            label: building.venue_building_name
                        }))}
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
                        Add Venue
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
                            Add Venue
                        </div>
                    }
                    placement="bottom"
                    open={visible}
                    onClose={onCancel}
                    height="90%"
                    bodyStyle={{ paddingBottom: '120px' }}
                >
                    {modalContent}
                </Drawer>
            ) : (
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
                    width={isTablet ? 700 : 800}
                >
                    {modalContent}
                </Modal>
            )}
        </>
    );
};

export default Create_Modal;
