import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Modal, Form, Input, Select, Button, Drawer } from 'antd';
import { FaEye } from 'react-icons/fa';
import { toast } from 'sonner';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';

const Update_Modal = ({ visible, onCancel, onSuccess, venueId }) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [minOccupancy, setMinOccupancy] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('1');
    const [statusOptions, setStatusOptions] = useState([]);
    const [eventType, setEventType] = useState('Big Event');
    const [areaType, setAreaType] = useState(null);
    const [buildingId, setBuildingId] = useState(null);
    const [buildingName, setBuildingName] = useState('');
    const [buildings, setBuildings] = useState([]);

    const baseUrl = SecureStorage.getLocalItem("url");

    const fetchStatusAvailability = useCallback(async () => {
        try {
            const response = await axios.post(`${baseUrl}/Admin.php`, 
                new URLSearchParams({
                    operation: 'fetchStatusAvailability'
                })
            );
            
            if (response.data.status === 'success') {
                // Filter out status IDs 9 (Available Stock) and 10 (Out of stock)
                const filteredStatuses = response.data.data.filter(
                    status => status.status_availability_id !== 9 && status.status_availability_id !== 10
                );
                setStatusOptions(filteredStatuses);
            } else {
                console.error("Failed to fetch status options");
            }
        } catch (error) {
            console.error("Error fetching status availability:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to load status options. Please check your internet connection.");
            }
        }
    }, [baseUrl]);

    const fetchBuildings = useCallback(async () => {
        try {
            const response = await axios.post(`${baseUrl}/Admin.php`, 
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
    }, [baseUrl]);

    useEffect(() => {
        fetchStatusAvailability();
        fetchBuildings();
    }, [fetchStatusAvailability, fetchBuildings]);

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
                `${baseUrl}/Admin.php`,
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
                setMinOccupancy(venue.ven_minimum || '');
                setSelectedStatus(venue.status_availability_id);
                setEventType(venue.event_type || 'Big Event');
                setAreaType(venue.area_type || null);
                setBuildingId(venue.venue_building_id || null);
                setBuildingName(venue.venue_building_name || '');

                form.setFieldsValue({
                    name: venue.ven_name,
                    occupancy: venue.ven_occupancy,
                    min_occupancy: venue.ven_minimum || '',
                    status: venue.status_availability_id,
                    event_type: venue.event_type || 'Big Event',
                    area_type: venue.area_type || null,
                    building: venue.venue_building_id || null,
                });
            } else {
                toast.error("Failed to fetch venue details");
            }
        } catch (error) {
            console.error("Error fetching venue details:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to load venue details. Please check your internet connection.");
            } else {
                toast.error("An error occurred while fetching venue details");
            }
        }
    }, [venueId, baseUrl, form]);

    useEffect(() => {
        if (visible && venueId) {
            getVenueDetails();
        }
    }, [visible, venueId, getVenueDetails]);

    useEffect(() => {
        if (!visible) return;
        if (buildingId) return;
        if (!buildingName || !buildingName.trim()) return;
        if (!Array.isArray(buildings) || buildings.length === 0) return;

        const trimmedName = buildingName.trim();
        const matchedBuilding = buildings.find(b => (b.venue_building_name || '').trim() === trimmedName);
        if (!matchedBuilding) return;

        setBuildingId(matchedBuilding.venue_building_id);
        form.setFieldsValue({ building: matchedBuilding.venue_building_id });
    }, [visible, buildingId, buildingName, buildings, form]);

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
                operation: 'updateVenue',
                venue_id: venueId,
                venue_name: validatedData.name,
                max_occupancy: validatedData.occupancy,
                min_occupancy: validatedData.min_occupancy,
                status_availability_id: parseInt(selectedStatus),
                event_type: validatedData.event_type,
                area_type: validatedData.area_type,
                building_id: buildingId,
                user_personnel_id: SecureStorage.getLocalItem("user_id")
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
                toast.success("Venue successfully updated!");
                onSuccess();
                form.resetFields();
                setVenueName('');
                setMaxOccupancy('');
                setMinOccupancy('');
                onCancel();
            } else {
                toast.error(response.data.message || "Failed to update venue");
            }
        } catch (error) {
            if (error.errorFields) {
                // Form validation error - don't show toast as Antd will show field errors
                return;
            }
            console.error("Error updating venue:", error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error("Network connection lost. Unable to update venue. Please check your internet connection and try again.");
            } else {
                toast.error("An error occurred while updating the venue.");
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
                    name="building"
                    initialValue={buildingId}
                    rules={[
                        { required: true, message: 'Please select location!' }
                    ]}
                >
                    <Select
                        value={buildingId}
                        onChange={value => setBuildingId(value)}
                        placeholder="Select building"
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
                        Update Venue
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
                            <FaEye className="mr-2 text-green-900" /> 
                            Edit Venue
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
                            <FaEye className="mr-2 text-green-900" /> 
                            Edit Venue
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

export default Update_Modal;
