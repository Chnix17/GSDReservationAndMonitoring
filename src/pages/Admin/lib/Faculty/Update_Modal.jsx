import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
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
        users_email: '',
        departments_name: '',
        users_password: '',
        users_role: '',
    });

    const [titles, setTitles] = useState([]);

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]*$/;
    const passwordSingleSpecialCharRegex = /[!@#$%^&*]/g;

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
                        users_role: userDetails.users_user_level_id,
                        departments_name: userDetails.departments_name,
                        users_password: '',
                    };
                    setFormData(newFormData);
                    setOriginalData(newFormData);
                    
                    // Set form values using Ant Design's form instance
                    form.setFieldsValue(newFormData);
                }
            }
        };

        fetchUserData();
    }, [user, getUserDetails, baseUrl, form]);

    const fetchTitles = useCallback(async () => {
        try {
            const response = await axios({
                method: 'post',
                url: `${baseUrl}/user.php`,
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
            toast.error("Failed to fetch titles");
        }
    }, [baseUrl]);

    useEffect(() => {
        const initializeData = async () => {
            await Promise.all([
                fetchTitles()
            ]);
        };
        initializeData();
    }, [fetchTitles]);

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
                `${baseUrl}/user.php`,
                jsonData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Server Response:', response.data);

            if (response && response.data.status === 'success') {
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
            toast.error(error.response?.data?.message || error.message || 'Failed to update faculty member');
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

    return (
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
            width={800}
        >
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
                className="p-4"
                initialValues={formData}
            >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6 items-end">
                    <Form.Item
                        label="Title"
                        name="users_title"
                        className="mb-0"
                        style={{ minWidth: 80, maxWidth: 100 }}
                    >
                        <Select placeholder="Title" size="small" style={{ width: '100%' }}>
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
                            { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter first name" />
                    </Form.Item>
                    <Form.Item
                        label="Middle Name"
                        name="users_middlename"
                        rules={[
                            { pattern: /^[a-zA-Z\s]*$/, message: 'Name can only contain letters and spaces' }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter middle name" />
                    </Form.Item>
                    <Form.Item
                        label="Last Name"
                        name="users_lastname"
                        rules={[
                            { required: true, message: 'Please input last name!' },
                            { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter last name" />
                    </Form.Item>
                    <Form.Item
                        label="Suffix"
                        name="users_suffix"
                        className="mb-0"
                        style={{ minWidth: 80, maxWidth: 100 }}
                    >
                        <Select placeholder="Suffix" size="small" style={{ width: '100%' }}>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                        label="School ID"
                        name="users_school_id"
                        rules={[
                            { required: true, message: 'Please input school ID!' },
                            { pattern: /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/, message: 'School ID must be in the format x1-x1-x1' }
                        ]}
                    >
                        <Input placeholder="Enter school ID" />
                    </Form.Item>

                    <Form.Item
                        label="Phone Number"
                        name="users_contact_number"
                        rules={[
                            { required: true, message: 'Please input phone number!' },
                            { pattern: /^\d{11}$/, message: 'Contact number must be 11 digits' }
                        ]}
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        label="Email Address"
                        name="users_email"
                        rules={[
                            { required: true, message: 'Please input email address!' },
                            { 
                                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                message: 'Please enter a valid email address'
                            }
                        ]}
                    >
                        <Input placeholder="Enter email address" />
                    </Form.Item>

                    <Form.Item
                        label="Role"
                        name="users_role"
                        rules={[{ required: true, message: 'Please select a role!' }]}
                    >
                        <Select placeholder="Select role">
                            {userLevels.map((level) => (
                                <Select.Option key={level.user_level_id} value={level.user_level_id}>
                                    {level.user_level_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        label="Department"
                        name="departments_name"
                        rules={[{ required: true, message: 'Please select a department!' }]}
                    >
                        <Select placeholder="Select department">
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
                                const specialCharCount = (value.match(passwordSingleSpecialCharRegex) || []).length;
                                return specialCharCount === 1 ? Promise.resolve() : Promise.reject('Password must contain exactly 1 special character');
                            }}
                        ]}
                        tooltip="Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and exactly 1 special character (!@#$%^&*)"
                    >
                        <Input.Password placeholder="Enter new password" />
                    </Form.Item>
                </div>



                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onHide}>
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={loading}
                        className="bg-green-900 hover:bg-lime-900"
                        disabled={!hasChanges}
                    >
                        Save Changes
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default Update_Modal;
