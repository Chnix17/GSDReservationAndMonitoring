import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button, Drawer } from 'antd';
import { useMediaQuery } from 'react-responsive';
import { FaUser } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';

const Create_Modal = ({ 
    show, 
    onHide, 

    fetchUsers
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    
    const [form] = Form.useForm();
    const timeoutRef = useRef(null);
    const [userLevels, setUserLevels] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [titles, setTitles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [restrictionCodes, setRestrictionCodes] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);


    // Get base URL from SecureStorage
    const baseUrl = SecureStorage.getLocalItem("url");

    // Default password will be the school ID



    // const checkDuplicates = async (field, value) => {
    //     if (!value) {
    //         setDuplicateFields(prev => ({
    //             ...prev,
    //             [field]: false
    //         }));
    //         return;
    //     }

    //     try {
    //         const response = await axios.post(
    //             `${baseUrl}/user.php`,
    //             {
    //                 operation: 'checkUniqueEmailAndSchoolId',
    //                 email: field === 'email' ? value : '',
    //                 schoolId: field === 'schoolId' ? value : ''
    //             },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 }
    //             }
    //         );

    //         if (response.data) {
    //             const { status, exists, duplicates } = response.data;
                
    //             if (status === 'success' && exists && Array.isArray(duplicates)) {
    //                 const duplicate = duplicates.find(d => 
    //                     (field === 'email' && d.field === 'email') || 
    //                     (field === 'schoolId' && d.field === 'school_id')
    //                 );

    //                 if (duplicate) {
    //                     setDuplicateFields(prev => ({
    //                         ...prev,
    //                         [field]: true
    //                     }));
    //                     form.setFields([{
    //                         name: field === 'email' ? 'users_email' : 'users_school_id',
    //                         errors: [duplicate.message]
    //                     }]);
    //                 } else {
    //                     setDuplicateFields(prev => ({
    //                         ...prev,
    //                         [field]: false
    //                     }));
    //                     form.setFields([{
    //                         name: field === 'email' ? 'users_email' : 'users_school_id',
    //                         errors: []
    //                     }]);
    //                 }
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error checking duplicates:', error);
    //         toast.error('Error checking for duplicates');
    //     }
    // };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const selectedDepartment = departments.find(
                dept => dept.departments_name === values.departments_name
            );
            
            if (!selectedDepartment) {
                console.error('Department not found:', values.departments_name);
                return;
            }

            let jsonData;

            if (values.users_role === '13') {
                jsonData = {
                    operation: 'saveUser',
                    fullName: `${values.users_firstname} ${values.users_middlename} ${values.users_lastname}`.trim(),
                    email: values.users_email,
                    schoolId: values.users_school_id,
                    contact: values.users_contact_number,
                    license_number: values.license_number || null,
                    userLevelId: values.users_role,
                    password: values.users_school_id, // Default password is school ID
                    departmentId: selectedDepartment.departments_id,
                    pic: "",
                    suffix: values.users_suffix || "",
                    title_id: values.users_title ? titles.find(t => t.abbreviation === values.users_title)?.id : null
                };
            } else {
                jsonData = {
                    operation: 'saveUser',
                    fname: values.users_firstname,
                    mname: values.users_middlename,
                    lname: values.users_lastname,
                    email: values.users_email,
                    schoolId: values.users_school_id,
                    contact: values.users_contact_number,
                    license_number: values.license_number || null,
                    userLevelId: values.users_role,
                    password: values.users_school_id, // Default password is school ID
                    departmentId: selectedDepartment.departments_id,
                    suffix: values.users_suffix || "",
                    title_id: values.users_title ? titles.find(t => t.abbreviation === values.users_title)?.id : null
                };
            }

            const response = await axios.post(`${baseUrl}/Admin.php`, jsonData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                // If user is a driver (user_level_id = 19), save restrictions
                const userId = response.data.user_id; // Backend should return the new user ID
                const selectedRestrictions = values.driver_restrictions || [];
                
                console.log('User created with ID:', userId);
                console.log('User role:', values.users_role, 'Type:', typeof values.users_role);
                console.log('Selected restrictions:', selectedRestrictions);
                
                if ((values.users_role === '19' || values.users_role === 19) && selectedRestrictions.length > 0 && userId) {
                    console.log('Saving driver restrictions...');
                    try {
                        const currentUserId = SecureStorage.getLocalItem('user_id');
                        const restrictionResponse = await axios.post(`${baseUrl}/Admin.php`, {
                            operation: 'saveDriverRestrictions',
                            user_id: userId,
                            restriction_ids: selectedRestrictions,
                            updated_by: parseInt(currentUserId, 10)
                        }, {
                            headers: { 'Content-Type': 'application/json' }
                        });
                        console.log('Restriction save response:', restrictionResponse.data);
                        if (restrictionResponse.data.status === 'success') {
                            console.log('Driver restrictions saved successfully!');
                        }
                    } catch (error) {
                        console.error('Error saving driver restrictions:', error);
                        toast.warning('User created but restrictions could not be saved');
                    }
                } else {
                    console.log('Skipping restriction save. Reason:', {
                        isDriver: (values.users_role === '19' || values.users_role === 19),
                        hasRestrictions: selectedRestrictions.length > 0,
                        hasUserId: !!userId
                    });
                }
                
                toast.success('Faculty successfully added!');
                fetchUsers();
                onHide();
                form.resetFields();
                setSelectedRole(null);
            } else {
                // Check for duplicate error message
                if (response.data.message === 'A user with that Student ID / Employee ID and Email already exists.') {
                    form.setFields([
                        {
                            name: 'users_school_id',
                            errors: ['A user with that Student ID / Employee ID and Email already exists.']
                        },
                        {
                            name: 'users_email',
                            errors: ['A user with that Student ID / Employee ID and Email already exists.']
                        }
                    ]);
                    setLoading(false);
                    return;
                }
                if (response.data.message === 'Student ID / Employee ID already exists.') {
                    form.setFields([
                        {
                            name: 'users_school_id',
                            errors: ['Student ID / Employee ID already exists.']
                        }
                    ]);
                    setLoading(false);
                    return;
                }
                if (response.data.message === 'Email address already exists.') {
                    form.setFields([
                        {
                            name: 'users_email',
                            errors: ['Email address already exists.']
                        }
                    ]);
                    setLoading(false);
                    return;
                }
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            console.error('Error details:', error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to create faculty member. Please check your internet connection and try again.');
            } else {
                toast.error(`Failed to add faculty: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUserLevels = useCallback(async () => {
        try {
            const response = await axios({
                method: 'post',
                url: `${baseUrl}/Admin.php`,
                data: new URLSearchParams({
                    operation: 'fetchUserLevels'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && Array.isArray(response.data.data)) {
                setUserLevels(response.data.data);
            } else {
                console.error('Invalid user level data:', response.data);
                toast.error("Invalid user level data format");
            }
        } catch (error) {
            console.error('User level fetch error:', error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load user levels.');
            } else {
                toast.error("Failed to fetch user levels");
            }
        }
    }, [baseUrl]);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await axios({
                method: 'post',
                url: `${baseUrl}/Admin.php`,
                data: new URLSearchParams({
                    operation: 'fetchDepartments'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
    
            if (response.data && Array.isArray(response.data.data)) {
                setDepartments(response.data.data);
            } else {
                console.error('Invalid department data:', response.data);
                toast.error("Invalid department data format");
            }
        } catch (error) {
            console.error('Department fetch error:', error);
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
                toast.error('Network connection lost. Unable to load departments.');
            } else {
                toast.error(error.response?.data?.message || "Failed to fetch departments");
            }
        }
    }, [baseUrl]);

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
                fetchUserLevels(),
                fetchDepartments(),
                fetchTitles(),
                fetchRestrictionCodes()
            ]);
        };
        initializeData();
    }, [fetchUserLevels, fetchDepartments, fetchTitles, fetchRestrictionCodes]);

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
            className={isMobile ? "p-2" : "p-4"}
        >
            {/* Name row: Title | First Name | Middle Name | Last Name | Suffix */}
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
            {/* Divider */}
            <div className="border-b border-gray-200 mb-6"></div>

            {/* School ID & Phone */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4 mb-6`}>
                <Form.Item
                    label="Student ID/ Employee ID"
                    name="users_school_id"
                    rules={[
                        { required: true, message: 'Please input student ID/ employee ID!' },
                        { pattern: /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/, message: 'Student ID must be in the format x1-x1-x1' },
                        { 
                            validator: (_, value) => {
                                if (value && value.trim() === '') {
                                    toast.error('Student ID cannot contain only whitespace!');
                                    return Promise.reject(new Error('Student ID cannot contain only whitespace!'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                    className="mb-0"
                >
                    <Input placeholder="Enter student ID/ employee ID" size={isMobile ? "middle" : "default"} />
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
                    className="mb-0"
                >
                    <Input placeholder="Enter phone number" size={isMobile ? "middle" : "default"} />
                </Form.Item>
            </div>

            {/* Divider */}
            <div className="border-b border-gray-200 mb-6"></div>

            {/* Email & Role */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4 mb-6`}>
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
                    className="mb-0"
                >
                    <Input placeholder="Enter email address" size={isMobile ? "middle" : "default"} />
                </Form.Item>
                <Form.Item
                    label="Role"
                    name="users_role"
                    rules={[{ required: true, message: 'Please select a role!' }]}
                    className="mb-0"
                >
                    <Select 
                        placeholder="Select role" 
                        size={isMobile ? "middle" : "default"}
                        onChange={(value) => {
                            console.log('Selected role value:', value, 'Type:', typeof value);
                            setSelectedRole(value);
                        }}
                    >
                        {userLevels.map((level) => (
                            <Select.Option key={level.user_level_id} value={level.user_level_id}>
                                {level.user_level_name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </div>

            {/* Divider */}
            <div className="border-b border-gray-200 mb-6"></div>

            {/* Department */}
            <div className="grid grid-cols-1 gap-4 mb-6">
                <Form.Item
                    label="Department"
                    name="departments_name"
                    rules={[{ required: true, message: 'Please select a department!' }]}
                    className="mb-0"
                >
                    <Select placeholder="Select department" size={isMobile ? "middle" : "default"}>
                        {departments.map((department) => (
                            <Select.Option key={department.departments_id} value={department.departments_name}>
                                {department.departments_name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </div>

            {/* Driver Restrictions - Only show for Driver role (user_level_id = 19) */}
            {(selectedRole === 19 || selectedRole === '19') && (
                <>
                    <div className="border-b border-gray-200 mb-6"></div>

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
                       
                    </div>
                    
                </>
            )}

            {/* Info about default password */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-800`}>
                    <strong>Note:</strong> The default password will be set to the Student ID / Employee ID. Users should change their password upon first login.
                </p>
            </div>

            {/* Button Row */}
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
                >
                    Submit
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
                            Add New User
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
                            Add New User
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

export default Create_Modal;
