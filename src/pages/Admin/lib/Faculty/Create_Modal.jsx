import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import { FaUser } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { SecureStorage } from '../../../../utils/encryption';

const Create_Modal = ({ 
    show, 
    onHide, 

    fetchUsers
}) => {
    const [form] = Form.useForm();
    const timeoutRef = useRef(null);
    const [userLevels, setUserLevels] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [titles, setTitles] = useState([]);
    const [loading, setLoading] = useState(false);


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
                    userLevelId: values.users_role,
                    password: values.users_school_id, // Default password is school ID
                    departmentId: selectedDepartment.departments_id,
                    suffix: values.users_suffix || "",
                    title_id: values.users_title ? titles.find(t => t.abbreviation === values.users_title)?.id : null
                };
            }

            const response = await axios.post(`${baseUrl}/user.php`, jsonData, {
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
                // Check for duplicate error message
                if (response.data.message === 'A user with that School ID and Email already exists.') {
                    form.setFields([
                        {
                            name: 'users_school_id',
                            errors: ['A user with that School ID and Email already exists.']
                        },
                        {
                            name: 'users_email',
                            errors: ['A user with that School ID and Email already exists.']
                        }
                    ]);
                    setLoading(false);
                    return;
                }
                if (response.data.message === 'School ID already exists.') {
                    form.setFields([
                        {
                            name: 'users_school_id',
                            errors: ['School ID already exists.']
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
            toast.error(`Failed to add faculty: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserLevels = useCallback(async () => {
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
    }, [baseUrl]);

    const fetchDepartments = useCallback(async () => {
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
    }, [baseUrl]);

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
                fetchUserLevels(),
                fetchDepartments(),
                fetchTitles()
            ]);
        };
        initializeData();
    }, [fetchUserLevels, fetchDepartments, fetchTitles]);

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
                {/* Name row: Title | First Name | Middle Name | Last Name | Suffix */}
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

                {/* Divider */}
                <div className="border-b border-gray-200 mb-6"></div>

                {/* School ID & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Form.Item
                        label="School ID"
                        name="users_school_id"
                        rules={[
                            { required: true, message: 'Please input school ID!' },
                            { pattern: /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/, message: 'School ID must be in the format x1-x1-x1' }
                        ]}
                        className="mb-0"
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
                        className="mb-0"
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>
                </div>

                {/* Divider */}
                <div className="border-b border-gray-200 mb-6"></div>

                {/* Email & Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Form.Item
                        label="Email Address"
                        name="users_email"
                        rules={[
                            { required: true, message: 'Please input email address!' },
                            { type: 'email', message: 'Please enter a valid email address' },
                            { 
                                pattern: /^[a-zA-Z0-9._%+-]+@phinmaed\.com$/,
                                message: 'Email must end with @phinmaed.com'
                            }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter email address (e.g., chsi.valle.coc@phinmaed.com)" />
                    </Form.Item>
                    <Form.Item
                        label="Role"
                        name="users_role"
                        rules={[{ required: true, message: 'Please select a role!' }]}
                        className="mb-0"
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

                {/* Divider */}
                <div className="border-b border-gray-200 mb-6"></div>

                {/* Department */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                    <Form.Item
                        label="Department"
                        name="departments_name"
                        rules={[{ required: true, message: 'Please select a department!' }]}
                        className="mb-0"
                    >
                        <Select placeholder="Select department">
                            {departments.map((department) => (
                                <Select.Option key={department.departments_id} value={department.departments_name}>
                                    {department.departments_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </div>

                {/* Info about default password */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> The default password will be set to the School ID. Users should change their password upon first login.
                    </p>
                </div>

                {/* Button Row */}
                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onHide}>
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={loading}
                        className="bg-green-900 hover:bg-lime-900"
                    >
                        submit
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default Create_Modal;
