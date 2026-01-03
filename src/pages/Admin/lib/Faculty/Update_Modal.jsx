import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button, Drawer } from 'antd';
import { useMediaQuery } from 'react-responsive';
import { FaUser } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import {validateInput } from '../../../../utils/sanitize';
import { SecureStorage } from '../../../../utils/encryption';

const Update_Modal = ({ 
    show, 
    onHide, 
    user, 
    departments, 
    userLevels,
    fetchUsers,
    getUserDetails
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    
    const [form] = Form.useForm();
    const timeoutRef = useRef(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [loading, setLoading] = useState(false);
    const baseUrl = SecureStorage.getLocalItem("url");

    const [formData, setFormData] = useState({
        users_id: '',
        users_firstname: '',
        users_middlename: '',
        users_lastname: '',
        users_suffix: '',
        users_title: '',
        users_school_id: '',
        users_contact_number: '',
        license_number: '',
        users_email: '',
        departments_name: '',
        users_password: '',
        users_role: '',
    });

    const [titles, setTitles] = useState([]);
    const [restrictionCodes, setRestrictionCodes] = useState([]);
    const [selectedRestrictions, setSelectedRestrictions] = useState([]);

    const handleRestrictionsChange = (values) => {
        setSelectedRestrictions(values);
        form.setFieldsValue({ driver_restrictions: values });
    };

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]*$/;
    const passwordSingleSpecialCharRegex = /[!@#$%^&*]/g;

    const fetchDriverRestrictions = useCallback(async (userId) => {
        try {
            const response = await axios.post(`${baseUrl}/Admin.php`, {
                operation: 'fetchDriverRestrictions',
                user_id: userId
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                const restrictionIds = response.data.data.map(r => r.restriction_code_id);
                setSelectedRestrictions(restrictionIds);
                form.setFieldsValue({ driver_restrictions: restrictionIds });
            }
        } catch (error) {
            console.error('Error fetching driver restrictions:', error);
        }
    }, [baseUrl, form]);

    useEffect(() => {
        const fetchUserData = async () => {
            setHasChanges(false);
            
            if (user) {
                console.log('Fetching user details for ID:', user.users_id);
                const userDetails = await getUserDetails(user.users_id);
                console.log('Fetched user details:', userDetails);
                
                if (userDetails) {
                    const newFormData = {
                        users_id: userDetails.users_id,
                        users_firstname: userDetails.users_fname,
                        users_middlename: userDetails.users_mname,
                        users_lastname: userDetails.users_lname,
                        users_suffix: userDetails.users_suffix || '',
                        users_title: userDetails.title_abbreviation || '',
                        users_email: userDetails.users_email,
                        users_school_id: userDetails.users_school_id,
                        users_contact_number: userDetails.users_contact_number,
                        license_number: userDetails.license_number || '',
                        users_role: userDetails.users_user_level_id,
                        departments_name: userDetails.departments_name,
                        users_password: '',
                    };
                    setFormData(newFormData);
                    setOriginalData(newFormData);
                    
                    // Set form values using Ant Design's form instance
                    form.setFieldsValue(newFormData);
                    
                    // Fetch driver restrictions if user is a driver (user_level_id = 19)
                    if (userDetails.users_user_level_id === '19' || userDetails.users_user_level_id === 19) {
                        await fetchDriverRestrictions(userDetails.users_id);
                    } else {
                        setSelectedRestrictions([]);
                    }
                }
            }
        };

        fetchUserData();
    }, [user, getUserDetails, baseUrl, form, fetchDriverRestrictions]);

    const fetchTitles = useCallback(async () => {
        try {
            const response = await axios({
                method: 'post',
                url: `${baseUrl}/Admin.php`,
                data: new URLSearchParams({
                    operation: 'fetchTitle'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                setTitles(response.data.data);
            } else {
                console.error('Invalid title data:', response.data);
                toast.error("Invalid title data format");
            }
        } catch (error) {
            console.error('Title fetch error:', error);
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load titles.');
            } else {
                toast.error("Failed to fetch titles");
            }
        }
    }, [baseUrl]);

    const fetchRestrictionCodes = useCallback(async () => {
        try {
            const response = await axios({
                method: 'post',
                url: `${baseUrl}/Admin.php`,
                data: JSON.stringify({
                    operation: 'fetchDriverRestrictionCodes'
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                setRestrictionCodes(response.data.data);
            } else {
                console.error('Invalid restriction codes data:', response.data);
            }
        } catch (error) {
            console.error('Restriction codes fetch error:', error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load restriction codes.');
            } else {
                toast.error("Failed to fetch restriction codes");
            }
        }
    }, [baseUrl]);

    

    useEffect(() => {
        const initializeData = async () => {
            await Promise.all([
                fetchTitles(),
                fetchRestrictionCodes()
            ]);
        };
        initializeData();
    }, [fetchTitles, fetchRestrictionCodes]);

    const validateField = (name, value) => {
        // Skip email and school ID validation in edit mode if they haven't changed
        if (name === 'users_email' || name === 'users_school_id') {
            if (originalData && value === originalData[name]) {
                return '';
            }
        }

        switch (name) {
            case 'users_firstname':
            case 'users_middlename':
            case 'users_lastname':
                if (!value.trim()) {
                    return 'This field is required';
                }
                if (/\d/.test(value)) {
                    return 'Name cannot contain numbers';
                }
                if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
                    return 'Name can only contain letters and spaces';
                }
                return '';
            case 'users_suffix':
                if (value && !/^[a-zA-Z\s.]+$/.test(value.trim())) {
                    return 'Suffix can only contain letters, spaces, and periods';
                }
                return '';

            case 'users_email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email address';
            case 'users_school_id':
                if (!value.trim()) {
                    return 'School ID is required';
                }
                if (!/^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(value)) {
                    return 'School ID must be in the format x1-x1-x1 (e.g., abc-123-xyz)';
                }
                return '';
            case 'users_contact_number':
                return /^\d{11}$/.test(value) ? '' : 'Contact number must be 11 digits';
            case 'users_password':
                if (value) {
                    if (!passwordRegex.test(value)) {
                        return 'Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, and 1 number';
                    }
                    const specialCharCount = (value.match(passwordSingleSpecialCharRegex) || []).length;
                    if (specialCharCount !== 1) {
                        return 'Password must contain exactly 1 special character (!@#$%^&*)';
                    }
                    if (value.length < 8) {
                        return 'Password must be at least 8 characters long';
                    }
                }
                return '';
            case 'users_role':
                return value ? '' : 'Please select a role';
            case 'departments_name':
                return value ? '' : 'Please select a department';
            default:
                return '';
        }
    };

    const handleSubmit = async (values) => {
        const isValid = Object.entries(values).every(([key, value]) => {
            if (key === 'users_middlename' || key === 'users_password') return true;
            return validateInput(value);
        });

        if (!isValid) {
            toast.error('Please check your inputs for invalid characters or patterns.');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(values.users_email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(values.users_firstname) || 
            (values.users_middlename && !nameRegex.test(values.users_middlename)) || 
            !nameRegex.test(values.users_lastname)) {
            toast.error('Names can only contain letters and spaces');
            return;
        }

        const newErrors = {};
        Object.keys(values).forEach(key => {
            if (key !== 'users_middlename') {
                const error = validateField(key, values[key]);
                if (error) newErrors[key] = error;
            }
        });

        const selectedDepartment = departments.find(
            dept => dept.departments_name === values.departments_name
        );
        
        if (!selectedDepartment) {
            console.error('Department not found:', values.departments_name);
            return;
        }

        const jsonData = {
            operation: 'updateUser',
            userId: user.users_id,
            fname: values.users_firstname,
            mname: values.users_middlename || '',
            lname: values.users_lastname,
            suffix: values.users_suffix || '',
            title: values.users_title || '',
            title_id: values.users_title ? titles.find(t => t.abbreviation === values.users_title)?.id : null,
            email: values.users_email,
            schoolId: values.users_school_id,
            contact: values.users_contact_number,
            license_number: values.license_number || null,
            userLevelId: values.users_role,
            departmentId: selectedDepartment.departments_id,
            pic: user.users_pic || '',
            isActive: 1
        };

        if (values.users_password) {
            jsonData.password = values.users_password;
        }

        console.log('Sending update request:', jsonData);

        try {
            setLoading(true);
            const response = await axios.post(
                `${baseUrl}/Admin.php`,
                jsonData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Server Response:', response.data);

            if (response && response.data.status === 'success') {
                // If user is a driver (user_level_id = 19), save restrictions
                const selectedRestrictionIds = values.driver_restrictions || [];
                
                if ((values.users_role === '19' || values.users_role === 19) && user.users_id) {
                    try {
                        const currentUserId = SecureStorage.getLocalItem('user_id');
                        await axios.post(`${baseUrl}/Admin.php`, {
                            operation: 'saveDriverRestrictions',
                            user_id: user.users_id,
                            restriction_ids: selectedRestrictionIds,
                            updated_by: parseInt(currentUserId, 10)
                        }, {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        console.error('Error saving driver restrictions:', error);
                        toast.warning('User updated but restrictions could not be saved');
                    }
                }
                
                toast.success(response.data.message || 'Faculty updated successfully');
                onHide();
                fetchUsers();
            } else {
                const errorMessage = response.data.message || response.data.error || 'Unknown error';
                console.error('Update failed:', {
                    status: response.data.status,
                    message: errorMessage,
                    data: response.data
                });
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error submitting form:', {
                error: error,
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            // Check if it's a network connectivity error
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to update faculty member. Please check your internet connection and try again.');
            } else {
                toast.error(error.response?.data?.message || error.message || 'Failed to update faculty member');
            }
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const currentTimeout = timeoutRef.current;
        return () => {
            if (currentTimeout) {
                clearTimeout(currentTimeout);
            }
        };
    }, []);

    const modalContent = (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={(changedValues, allValues) => {
                if (originalData) {
                    const hasAnyChange = Object.keys(originalData).some(key => {
                        if (key === 'users_password') return false;
                        return originalData[key] !== allValues[key];
                    });
                    const passwordChange = allValues.users_password !== '';
                    setHasChanges(hasAnyChange || passwordChange);
                }
            }}
            className={isMobile ? "p-2" : "p-4"}
            initialValues={formData}
        >
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-5 gap-2'} mb-6 items-end`}>
                <Form.Item
                    label="Title"
                    name="users_title"
                    className="mb-0"
                    style={!isMobile ? { minWidth: 80, maxWidth: 100 } : {}}
                >
                    <Select placeholder="Title" size={isMobile ? "middle" : "small"} style={{ width: '100%' }}>
                        <Select.Option value="">None</Select.Option>
                        {titles.map((title) => (
                            <Select.Option key={title.id} value={title.abbreviation}>
                                {title.abbreviation}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    label="First Name"
                    name="users_firstname"
                    rules={[
                        { required: true, message: 'Please input first name!' },
                        { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('First name cannot contain only whitespace!');
                                    return Promise.reject(new Error('First name cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                    className="mb-0"
                >
                    <Input placeholder="Enter first name" size={isMobile ? "middle" : "default"} />
                </Form.Item>
                <Form.Item
                    label="Middle Name"
                    name="users_middlename"
                    rules={[
                        { pattern: /^[a-zA-Z\s]*$/, message: 'Name can only contain letters and spaces' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Middle name cannot contain only whitespace!');
                                    return Promise.reject(new Error('Middle name cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                    className="mb-0"
                >
                    <Input placeholder="Enter middle name" size={isMobile ? "middle" : "default"} />
                </Form.Item>
                <Form.Item
                    label="Last Name"
                    name="users_lastname"
                    rules={[
                        { required: true, message: 'Please input last name!' },
                        { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Last name cannot contain only whitespace!');
                                    return Promise.reject(new Error('Last name cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                    className="mb-0"
                >
                    <Input placeholder="Enter last name" size={isMobile ? "middle" : "default"} />
                </Form.Item>
                <Form.Item
                    label="Suffix"
                    name="users_suffix"
                    className="mb-0"
                    style={!isMobile ? { minWidth: 80, maxWidth: 100 } : {}}
                >
                    <Select placeholder="Suffix" size={isMobile ? "middle" : "small"} style={{ width: '100%' }}>
                        <Select.Option value="">None</Select.Option>
                        <Select.Option value="Jr.">Jr.</Select.Option>
                        <Select.Option value="Sr.">Sr.</Select.Option>
                        <Select.Option value="II">II</Select.Option>
                        <Select.Option value="III">III</Select.Option>
                        <Select.Option value="IV">IV</Select.Option>
                        <Select.Option value="V">V</Select.Option>
                    </Select>
                </Form.Item>
            </div>
            <div className="border-b border-gray-200 mb-6"></div>

            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <Form.Item
                    label="School ID/ Employee ID"
                    name="users_school_id"
                    rules={[
                        { required: true, message: 'Please input school ID!' },
                        { pattern: /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/, message: 'School ID must be in the format x1-x1-x1' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('School ID cannot contain only whitespace!');
                                    return Promise.reject(new Error('School ID cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input placeholder="Enter school ID" size={isMobile ? "middle" : "default"} />
                </Form.Item>

                <Form.Item
                    label="Phone Number"
                    name="users_contact_number"
                    rules={[
                        { required: true, message: 'Please input phone number!' },
                        { pattern: /^\d{11}$/, message: 'Contact number must be 11 digits' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Phone number cannot contain only whitespace!');
                                    return Promise.reject(new Error('Phone number cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input placeholder="Enter phone number" size={isMobile ? "middle" : "default"} />
                </Form.Item>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <Form.Item
                    label="Email Address"
                    name="users_email"
                    rules={[
                        { required: true, message: 'Please input email address!' },
                        { 
                            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                            message: 'Please enter a valid email address'
                        },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Email address cannot contain only whitespace!');
                                    return Promise.reject(new Error('Email address cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input placeholder="Enter email address" size={isMobile ? "middle" : "default"} />
                </Form.Item>

                <Form.Item
                    label="Role"
                    name="users_role"
                    rules={[{ required: true, message: 'Please select a role!' }]}
                >
                    <Select placeholder="Select role" size={isMobile ? "middle" : "default"}>
                        {userLevels.map((level) => (
                            <Select.Option key={level.user_level_id} value={level.user_level_id}>
                                {level.user_level_name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <Form.Item
                    label="Department"
                    name="departments_name"
                    rules={[{ required: true, message: 'Please select a department!' }]}
                >
                    <Select placeholder="Select department" size={isMobile ? "middle" : "default"}>
                        {departments.map((department) => (
                            <Select.Option key={department.departments_id} value={department.departments_name}>
                                {department.departments_name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="New Password (leave blank to keep current)"
                    name="users_password"
                    rules={[
                        { pattern: passwordRegex, message: 'Password must meet requirements' },
                        { validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            if (value.trim() === '') {
                                toast.error('Password cannot contain only whitespace!');
                                return Promise.reject(new Error('Password cannot contain only whitespace!'));
                            }
                            const specialCharCount = (value.match(passwordSingleSpecialCharRegex) || []).length;
                            return specialCharCount === 1 ? Promise.resolve() : Promise.reject('Password must contain exactly 1 special character');
                        }}
                    ]}
                    tooltip="Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and exactly 1 special character (!@#$%^&*)"
                >
                    <Input.Password placeholder="Enter new password" size={isMobile ? "middle" : "default"} />
                </Form.Item>
            </div>

            {/* Driver Restrictions - Only show for Driver role (user_level_id = 19) */}
            {(formData.users_role === '19' || formData.users_role === 19) && (
                <>
                    <div className="border-b border-gray-200 my-6"></div>

                    <div className="grid grid-cols-1 gap-4 mb-6">
                                            <Form.Item
                                                label="License Number"
                                                name="license_number"
                                                rules={[
                                                    { required: true, message: 'Please input license number!' },
                                                    { 
                                                        validator: (_, value) => {
                                                            if (value && value.trim() === '') {
                                                                toast.error('License number cannot contain only whitespace!');
                                                                return Promise.reject(new Error('License number cannot contain only whitespace!'));
                                                            }
                                                            return Promise.resolve();
                                                        }
                                                    }
                                                ]}
                                                className="mb-0"
                                            >
                                                <Input placeholder="Enter license number" size={isMobile ? "middle" : "default"} />
                                            </Form.Item>
                                        </div>
                    <div className="grid grid-cols-1 gap-4 mb-6">
                        <Form.Item
                            label="Driver License Codes"
                            name="driver_restrictions"
                            rules={[
                                { required: true, message: 'Please select at least one driver restriction!' }
                            ]}
                            className="mb-0"
                        >
                            <Select
                                mode="multiple"
                                placeholder="Select driver license code"
                                size={isMobile ? "middle" : "default"}
                                allowClear
                                maxTagCount="responsive"
                                optionLabelProp="label"
                                value={selectedRestrictions}
                                onChange={handleRestrictionsChange}
                            >
                                {restrictionCodes.map((restriction) => (
                                    <Select.Option 
                                        key={restriction.restriction_id} 
                                        value={restriction.restriction_id}
                                        label={restriction.restriction_code}
                                    >
                                        <div>
                                            <strong>{restriction.restriction_code}</strong> - {restriction.restriction_desc}
                                            <div className="text-xs text-gray-500">
                                                {restriction.vehicle_category} ({restriction.wheels_count} wheels)
                                            </div>
                                        </div>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-800`}>
                                <strong>Note:</strong> Select all applicable license restriction codes for this driver.
                            </p>
                        </div>
                    </div>
                  
                </>
            )}

            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-end gap-2'} mt-4`}>
                <Button 
                    onClick={onHide}
                    size={isMobile ? "large" : "default"}
                    className={isMobile ? 'w-full' : ''}
                >
                    Cancel
                </Button>
                <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                    size={isMobile ? "large" : "default"}
                    className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                    disabled={!hasChanges}
                >
                    Save Changes
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
                            <FaUser className="mr-2 text-green-900" /> 
                            Edit Faculty Details
                        </div>
                    }
                    placement="bottom"
                    height="90%"
                    open={show}
                    onClose={onHide}
                    bodyStyle={{ paddingBottom: '120px' }}
                >
                    {modalContent}
                </Drawer>
            ) : (
                <Modal
                    title={
                        <div className="flex items-center">
                            <FaUser className="mr-2 text-green-900" /> 
                            Edit Faculty Details
                        </div>
                    }
                    open={show}
                    onCancel={onHide}
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
