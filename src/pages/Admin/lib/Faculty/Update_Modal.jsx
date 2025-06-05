import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import axios from 'axios';
import { sanitizeInput, validateInput } from '../../../../utils/sanitize';
import { SecureStorage } from '../../../../utils/encryption';

const Update_Modal = ({ 
    show, 
    onHide, 
    user, 
    departments, 
    userLevels,
    generateAvatarColor,
    fetchUsers,
    getUserDetails
}) => {
    const timeoutRef = useRef(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const baseUrl = SecureStorage.getLocalItem("url");

    const [formData, setFormData] = useState({
        users_id: '',
        users_firstname: '',
        users_middlename: '',
        users_lastname: '',
        users_suffix: '',
        users_school_id: '',
        users_contact_number: '',
        users_email: '',
        departments_name: '',
        users_password: '',
        users_role: '',
        users_birthday: '',
    });

    const [errors, setErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});
    const [duplicateFields, setDuplicateFields] = useState({
        email: false,
        schoolId: false
    });

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
                        users_email: userDetails.users_email,
                        users_school_id: userDetails.users_school_id,
                        users_contact_number: userDetails.users_contact_number,
                        users_role: userDetails.users_user_level_id,
                        departments_name: userDetails.departments_name,
                        users_password: '',
                        users_birthday: userDetails.users_birthdate || '',
                    };
                    setFormData(newFormData);
                    setOriginalData(newFormData);
                    setImageUrl(userDetails.users_pic ? `${baseUrl}/${userDetails.users_pic}` : '');
                }
            }
        };

        fetchUserData();
    }, [user, getUserDetails, baseUrl]);

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

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouchedFields(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));

        if ((name === 'users_email' || name === 'users_school_id') && value) {
            checkDuplicates(name === 'users_email' ? 'email' : 'schoolId', value);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        
        if (name !== 'users_password') {
            finalValue = sanitizeInput(value);
            
            if (finalValue && !validateInput(finalValue)) {
                toast.error('Invalid input detected');
                return;
            }
        }
        
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: finalValue
            };
            
            if (originalData) {
                const hasAnyChange = Object.keys(originalData).some(key => {
                    if (key === 'users_password') return false;
                    return originalData[key] !== newData[key];
                });
                const passwordChange = newData.users_password !== '';
                setHasChanges(hasAnyChange || passwordChange);
            }
            
            return newData;
        });
        
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));
        
        if (name === 'users_email' || name === 'users_school_id') {
            setDuplicateFields(prev => ({
                ...prev,
                [name === 'users_email' ? 'email' : 'schoolId']: false
            }));
            
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            timeoutRef.current = setTimeout(() => {
                checkDuplicates(
                    name === 'users_email' ? 'email' : 'schoolId',
                    finalValue
                );
            }, 500);
        }
    };

    const checkDuplicates = async (field, value) => {
        if (!value) {
            setDuplicateFields(prev => ({
                ...prev,
                [field]: false
            }));
            setErrors(prev => ({
                ...prev,
                [field === 'email' ? 'users_email' : 'users_school_id']: ''
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
                        setErrors(prev => ({
                            ...prev,
                            [field === 'email' ? 'users_email' : 'users_school_id']: duplicate.message
                        }));
                    } else {
                        setDuplicateFields(prev => ({
                            ...prev,
                            [field]: false
                        }));
                        setErrors(prev => ({
                            ...prev,
                            [field === 'email' ? 'users_email' : 'users_school_id']: ''
                        }));
                    }
                } else {
                    setDuplicateFields(prev => ({
                        ...prev,
                        [field]: false
                    }));
                    setErrors(prev => ({
                        ...prev,
                        [field === 'email' ? 'users_email' : 'users_school_id']: ''
                    }));
                }
            }
        } catch (error) {
            console.error('Error checking duplicates:', error);
            toast.error('Error checking for duplicates');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isValid = Object.entries(formData).every(([key, value]) => {
            if (key === 'users_middlename' || key === 'users_password') return true;
            return validateInput(value);
        });

        if (!isValid) {
            toast.error('Please check your inputs for invalid characters or patterns.');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(formData.users_email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.users_firstname) || 
            (formData.users_middlename && !nameRegex.test(formData.users_middlename)) || 
            !nameRegex.test(formData.users_lastname)) {
            toast.error('Names can only contain letters and spaces');
            return;
        }

        /* Temporarily disabled unique check
        if (formData.users_email !== originalData.users_email || 
            formData.users_school_id !== originalData.users_school_id) {
            const uniqueCheckResult = await checkUniqueEmailAndSchoolId(
                formData.users_email,
                formData.users_school_id
            );

            if (uniqueCheckResult && uniqueCheckResult.email_exists &&
                formData.users_email !== originalData.users_email) {
                setErrors(prev => ({
                    ...prev,
                    users_email: 'This email is already in use'
                }));
                toast.error('Email is already registered');
                return;
            }

            if (uniqueCheckResult && uniqueCheckResult.school_id_exists &&
                formData.users_school_id !== originalData.users_school_id) {
                setErrors(prev => ({
                    ...prev,
                    users_school_id: 'This school ID is already in use'
                }));
                toast.error('School ID is already registered');
                return;
            }
        }
        */

        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (key !== 'users_middlename') {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTouchedFields(
                Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
            toast.error('Please fix the validation errors');
            return;
        }

        const selectedDepartment = departments.find(
            dept => dept.departments_name === formData.departments_name
        );
        
        if (!selectedDepartment) {
            console.error('Department not found:', formData.departments_name);
            return;
        }

        const jsonData = {
            operation: 'updateUser',
            userData: {
                userId: user.users_id,
                fname: formData.users_firstname,
                mname: formData.users_middlename || '',
                lname: formData.users_lastname,
                birthdate: formData.users_birthday || '',
                suffix: formData.users_suffix || '',
                email: formData.users_email,
                schoolId: formData.users_school_id,
                contact: formData.users_contact_number,
                userLevelId: formData.users_role,
                departmentId: selectedDepartment.departments_id,
                pic: user.users_pic || '',
                isActive: 1
            }
        };

        if (formData.users_password) {
            jsonData.userData.password = formData.users_password;
        }

        console.log('Sending update request:', jsonData);

        try {
            const response = await axios.post(
                `${baseUrl}/update_master1.php`,
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
        }
    };

    const checkUniqueEmailAndSchoolId = async (email, schoolId) => {
        try {
            const response = await axios.post(
                `${baseUrl}/user.php`,
                {
                    operation: 'checkUniqueEmailAndSchoolId',
                    email: email,
                    schoolId: schoolId
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error checking unique email and school ID:', error);
            throw error;
        }
    };

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Modal show={show} onHide={onHide} centered size="lg" className="rounded-xl faculty-modal">
            <Modal.Header closeButton className="bg-green-900 text-white">
                <Modal.Title className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-xl" />
                    <span className="font-bold">Edit Faculty Details</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-[#fafff4] p-4">
                <Form onSubmit={handleSubmit} noValidate className="p-2">
                    {/* Image Preview */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-32 h-32">
                            {imageUrl ? (
                                <div className="w-full h-full">
                                    <img
                                        src={imageUrl}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover border-4 border-green-500"
                                        onError={() => {
                                            const initials = `${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`.toUpperCase();
                                            const bgColor = generateAvatarColor(initials);
                                            const container = document.getElementById('profile-image-container');
                                            if (container) {
                                                container.innerHTML = `
                                                    <div
                                                        class="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-3xl"
                                                        style="background-color: ${bgColor}"
                                                    >
                                                        ${initials}
                                                    </div>
                                                `;
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-3xl"
                                    style={{ 
                                        backgroundColor: generateAvatarColor(
                                            `${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`
                                        )
                                    }}
                                >
                                    {`${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`.toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Form.Group>
                            <Form.Label className="font-semibold">First Name <span className="text-red-500">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="users_firstname"
                                value={formData.users_firstname}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touchedFields.users_firstname && errors.users_firstname}
                                className="border-green-200 focus:border-green-400 focus:ring focus:ring-green-200"
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.users_firstname}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="font-semibold">Middle Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="users_middlename" 
                                value={formData.users_middlename} 
                                onChange={handleChange}
                                className="border-green-200 focus:border-green-400 focus:ring focus:ring-green-200" 
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="font-semibold">Last Name <span className="text-red-500">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="users_lastname"
                                value={formData.users_lastname}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touchedFields.users_lastname && errors.users_lastname}
                                className="border-green-200 focus:border-green-400 focus:ring focus:ring-green-200"
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.users_lastname}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Group>
                            <Form.Label>School ID <span className="text-red-500">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="users_school_id"
                                value={formData.users_school_id}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={!!errors.users_school_id}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.users_school_id}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Phone Number <span className="text-red-500">*</span></Form.Label>
                            <Form.Control
                                type="tel"
                                name="users_contact_number"
                                value={formData.users_contact_number}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touchedFields.users_contact_number && errors.users_contact_number}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.users_contact_number}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Form.Group>
                            <Form.Label>Email Address <span className="text-red-500">*</span></Form.Label>
                            <Form.Control
                                type="email"
                                name="users_email"
                                value={formData.users_email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={!!errors.users_email}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.users_email}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Role <span className="text-red-500">*</span></Form.Label>
                            <Form.Select
                                name="users_role"
                                value={formData.users_role}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touchedFields.users_role && errors.users_role}
                                required
                            >
                                <option value="">Select Role</option>
                                {userLevels.map((level) => (
                                    <option key={level.user_level_id} value={level.user_level_id}>
                                        {level.user_level_name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.users_role}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Form.Group>
                            <Form.Label>Department <span className="text-red-500">*</span></Form.Label>
                            <Form.Select
                                name="departments_name"
                                value={formData.departments_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touchedFields.departments_name && errors.departments_name}
                                required
                            >
                                <option value="">Select Department</option>
                                {departments && departments.map((department) => (
                                    <option key={department.departments_id} value={department.departments_name}>
                                        {department.departments_name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.departments_name}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>New Password (leave blank to keep current)</Form.Label>
                            <Form.Control
                                type="password"
                                name="users_password"
                                value={formData.users_password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touchedFields.users_password && errors.users_password}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.users_password}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 
                                1 number, and exactly 1 special character (!@#$%^&*).
                            </Form.Text>
                        </Form.Group>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Form.Group>
                            <Form.Label>Suffix</Form.Label>
                            <Form.Select
                                name="users_suffix"
                                value={formData.users_suffix}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touchedFields.users_suffix && errors.users_suffix}
                            >
                                <option value="">Select Suffix</option>
                                <option value="Jr.">Jr.</option>
                                <option value="Sr.">Sr.</option>
                                <option value="II">II</option>
                                <option value="III">III</option>
                                <option value="IV">IV</option>
                                <option value="V">V</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.users_suffix}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Birthday*</Form.Label>
                            <Form.Control
                                type="date"
                                name="users_birthday"
                                value={formData.users_birthday}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touchedFields.users_birthday && errors.users_birthday}
                                required
                                max={new Date().toISOString().split('T')[0]}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.users_birthday}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="bg-[#fafff4] border-t border-green-100">
                <Button variant="outline-secondary" onClick={onHide} className="px-4">
                    Cancel
                </Button>
                <Button 
                    variant="success" 
                    onClick={handleSubmit} 
                    className="bg-green-900 hover:bg-lime-900 border-green-900 px-4"
                    disabled={
                        !hasChanges || 
                        (duplicateFields && (duplicateFields.email || duplicateFields.schoolId))
                    }
                >
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Update_Modal;
