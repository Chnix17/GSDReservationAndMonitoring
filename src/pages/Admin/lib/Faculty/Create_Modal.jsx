import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { FaUser } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import { SecureStorage } from '../../../../utils/encryption';

const Create_Modal = ({ 
    show, 
    onHide, 
    onSubmit, 
    generateAvatarColor,
    fetchUsers
}) => {
    const [form] = Form.useForm();
    const timeoutRef = useRef(null);
    const [userLevels, setUserLevels] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [duplicateFields, setDuplicateFields] = useState({
        email: false,
        schoolId: false
    });

    // Get base URL from SecureStorage
    const baseUrl = SecureStorage.getLocalItem("url");

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]*$/;
    const passwordSingleSpecialCharRegex = /[!@#$%^&*]/g;

    const validateField = (name, value) => {
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
            case 'users_birthday':
                if (!value) {
                    return 'Birthday is required';
                }
                const birthDate = new Date(value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 18) {
                    return 'Must be at least 18 years old';
                }
                if (age > 100) {
                    return 'Invalid birth date';
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
                return '';
            case 'users_role':
                return value ? '' : 'Please select a role';
            case 'departments_name':
                return value ? '' : 'Please select a department';
            default:
                return '';
        }
    };

    const checkDuplicates = async (field, value) => {
        if (!value) {
            setDuplicateFields(prev => ({
                ...prev,
                [field]: false
            }));
            return;
        }

        try {
            const response = await axios.post(
                `${baseUrl}/user.php`,
                {
                    operation: 'checkUniqueEmailAndSchoolId',
                    email: field === 'email' ? value : '',
                    schoolId: field === 'schoolId' ? value : ''
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                const { status, exists, duplicates } = response.data;
                
                if (status === 'success' && exists && Array.isArray(duplicates)) {
                    const duplicate = duplicates.find(d => 
                        (field === 'email' && d.field === 'email') || 
                        (field === 'schoolId' && d.field === 'school_id')
                    );

                    if (duplicate) {
                        setDuplicateFields(prev => ({
                            ...prev,
                            [field]: true
                        }));
                        form.setFields([{
                            name: field === 'email' ? 'users_email' : 'users_school_id',
                            errors: [duplicate.message]
                        }]);
                    } else {
                        setDuplicateFields(prev => ({
                            ...prev,
                            [field]: false
                        }));
                        form.setFields([{
                            name: field === 'email' ? 'users_email' : 'users_school_id',
                            errors: []
                        }]);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking duplicates:', error);
            toast.error('Error checking for duplicates');
        }
    };

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

            let operation = 'saveUser';
            let jsonData;

            if (values.users_role === '13') {
                jsonData = {
                    operation: operation,
                    data: {
                        fullName: `${values.users_firstname} ${values.users_middlename} ${values.users_lastname}`.trim(),
                        email: values.users_email,
                        schoolId: values.users_school_id,
                        contact: values.users_contact_number,
                        userLevelId: values.users_role,
                        password: values.users_password,
                        departmentId: selectedDepartment.departments_id,
                        pic: "",
                        suffix: values.users_suffix || "",
                        birthdate: values.users_birthday || ""
                    }
                };
            } else {
                jsonData = {
                    operation: operation,
                    data: {
                        fname: values.users_firstname,
                        mname: values.users_middlename,
                        lname: values.users_lastname,
                        email: values.users_email,
                        schoolId: values.users_school_id,
                        contact: values.users_contact_number,
                        userLevelId: values.users_role,
                        password: values.users_password,
                        departmentId: selectedDepartment.departments_id,
                        suffix: values.users_suffix || "",
                        birthdate: values.users_birthday || ""
                    }
                };
            }

            const response = await axios.post(`${baseUrl}/insert_master.php`, jsonData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success('Faculty successfully added!');
                fetchUsers();
                onHide();
                form.resetFields();
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(`Failed to add faculty: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserLevels = async () => {
        try {
            const response = await axios({
                method: 'post',
                url: `${baseUrl}/fetchMaster.php`,
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
            toast.error("Failed to fetch user levels");
        }
    };

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await axios({
                method: 'post',
                url: `${baseUrl}/fetchMaster.php`,
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
            toast.error(error.response?.data?.message || "Failed to fetch departments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            await Promise.all([
                fetchUserLevels(),
                fetchDepartments()
            ]);
        };
        initializeData();
    }, []);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <FaUser className="mr-2 text-green-900" /> 
                    Add New Faculty
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
                className="p-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                        label="First Name"
                        name="users_firstname"
                        rules={[
                            { required: true, message: 'Please input first name!' },
                            { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
                        ]}
                    >
                        <Input placeholder="Enter first name" />
                    </Form.Item>

                    <Form.Item
                        label="Middle Name"
                        name="users_middlename"
                        rules={[
                            { pattern: /^[a-zA-Z\s]*$/, message: 'Name can only contain letters and spaces' }
                        ]}
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
                    >
                        <Input placeholder="Enter last name" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            { type: 'email', message: 'Please enter a valid email address' }
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
                        label="Password"
                        name="users_password"
                        rules={[
                            { required: true, message: 'Please input password!' },
                            { pattern: passwordRegex, message: 'Password must meet requirements' },
                            { validator: (_, value) => {
                                const specialCharCount = (value.match(passwordSingleSpecialCharRegex) || []).length;
                                return specialCharCount === 1 ? Promise.resolve() : Promise.reject('Password must contain exactly 1 special character');
                            }}
                        ]}
                        tooltip="Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and exactly 1 special character (!@#$%^&*)"
                    >
                        <Input.Password placeholder="Enter password" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        label="Suffix"
                        name="users_suffix"
                    >
                        <Select placeholder="Select suffix">
                            <Select.Option value="">None</Select.Option>
                            <Select.Option value="Jr.">Jr.</Select.Option>
                            <Select.Option value="Sr.">Sr.</Select.Option>
                            <Select.Option value="II">II</Select.Option>
                            <Select.Option value="III">III</Select.Option>
                            <Select.Option value="IV">IV</Select.Option>
                            <Select.Option value="V">V</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Birthday"
                        name="users_birthday"
                        rules={[
                            { required: true, message: 'Please select birthday!' },
                            { validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                const birthDate = new Date(value);
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                }
                                return age >= 18 && age <= 100 ? Promise.resolve() : Promise.reject('Age must be between 18 and 100');
                            }}
                        ]}
                    >
                        <Input type="date" max={new Date().toISOString().split('T')[0]} />
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
                        disabled={duplicateFields && (duplicateFields.email || duplicateFields.schoolId)}
                    >
                        Add Faculty
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default Create_Modal;
