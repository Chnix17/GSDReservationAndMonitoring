import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, Button } from 'antd';
import { Calendar } from 'primereact/calendar';
import { PlusOutlined } from '@ant-design/icons';
import { FaEye } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'sonner';


// Default values for categories and makes
const DEFAULT_CATEGORIES = [
    'Sedan',
    'SUV',
    'Truck',
    'Van',
    'Sports Car'
];

const DEFAULT_MAKES = [
    'Toyota',
    'Honda',
    'Ford',
    'Chevrolet',
    'Nissan',
    'Porsche'
];

const Update_Modal = ({
    showModal,
    onClose,
    selectedVehicleId,
    onSubmit
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [vehicleImage, setVehicleImage] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [vehicleModelId, setVehicleModelId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [year, setYear] = useState(new Date());
    const [models, setModels] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);

    const fetchModels = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', {
                operation: "fetchModels"
            });
            
            if (response.data.status === "success") {
                setModels(response.data.data);
            } else {
                toast.error('Failed to fetch models');
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            toast.error('Failed to fetch models');
        }
    };

    const fetchStatusAvailability = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', {
                operation: "fetchStatusAvailability",
                user_admin_id: 1
            });
            
            if (response.data.status === "success") {
                setStatusOptions(response.data.data);
            } else {
                toast.error('Failed to fetch status availability');
            }
        } catch (error) {
            console.error('Error fetching status availability:', error);
            toast.error('Failed to fetch status availability');
        }
    };

    useEffect(() => {
        fetchStatusAvailability();
        fetchModels();
    }, []);

    const getVehicleById = async (id) => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetchMaster.php", new URLSearchParams({ 
                operation: "fetchVehicleById", 
                id 
            }));
            console.log(response.data);

            if (response.data.status === 'success' && response.data.data.length > 0) {
                const vehicle = response.data.data[0];
                
                // Set form values
                form.setFieldsValue({
                    vehicle_license: vehicle.vehicle_license,
                    year: new Date(vehicle.year, 0),
                    status_availability_id: vehicle.status_availability_id,
                    make_id: vehicle.vehicle_make_name,
                    category_id: vehicle.vehicle_category_name,
                    vehicle_model_id: vehicle.vehicle_model_name
                });

                // Set status based on status_availability_name
                if (vehicle.status_availability_name) {
                    const matchingStatus = statusOptions.find(
                        status => status.status_availability_name.toLowerCase() === vehicle.status_availability_name.toLowerCase()
                    );
                    if (matchingStatus) {
                        form.setFieldsValue({
                            status_availability_id: matchingStatus.status_availability_id
                        });
                    }
                }

                // Set category state
                setSelectedCategory(vehicle.vehicle_category_name);

                // Handle vehicle image
                if (vehicle.vehicle_pic) {
                    const imageUrl = `http://localhost/coc/gsd/${vehicle.vehicle_pic}`;
                    setVehicleImage(imageUrl);
                    setFileList([{
                        uid: '-1',
                        name: 'vehicle-image.png',
                        status: 'done',
                        url: imageUrl,
                    }]);
                } else {
                    setVehicleImage(null);
                    setFileList([]);
                }

                // Set year
                if (vehicle.year) {
                    setYear(new Date(vehicle.year, 0));
                }
            } else {
                toast.error("Failed to fetch vehicle details");
            }
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (showModal && selectedVehicleId) {
            getVehicleById(selectedVehicleId);
        }
    }, [showModal, selectedVehicleId]);

    const handleMakeChange = (selectedMake) => {
        setSelectedMake(selectedMake);
    };

    const handleCategoryChange = (selectedCategory) => {
        setSelectedCategory(selectedCategory);
    };

    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            if (file) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    setVehicleImage(reader.result);
                };
            } else if (newFileList[0].url) {
                setVehicleImage(newFileList[0].url);
            }
        } else {
            setVehicleImage(null);
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            let base64Image = null;
            if (fileList.length > 0 && fileList[0].originFileObj) {
                base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(fileList[0].originFileObj);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                });
            } else if (fileList.length > 0 && fileList[0].url && fileList[0].url.startsWith('data:')) {
                base64Image = fileList[0].url;
            }

            const payload = {
                operation: "updateVehicleLicense",
                vehicleData: {
                    vehicle_id: selectedVehicleId,
                    vehicle_model_name: values.vehicle_model_id,
                    vehicle_license: values.vehicle_license,
                    year: year.getFullYear().toString(),
                    status_availability_id: values.status_availability_id,
                    vehicle_category_name: values.category_id,
                    vehicle_make_name: values.make_id,
                    ...(base64Image ? { vehicle_pic: base64Image } : {})
                }
            };

            const response = await axios.post('http://localhost/coc/gsd/update_master1.php', payload);
            if (response.data.status === 'success') {
                toast.success('Vehicle updated successfully');
                onClose();
                // Call the parent's onSubmit to trigger a refresh
                if (onSubmit) {
                    await onSubmit(payload.vehicleData);
                }
            } else {
                toast.error(response.data.message || 'Failed to update vehicle');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <FaEye className="mr-2 text-green-900" /> 
                    Update Vehicle
                </div>
            }
            open={showModal}
            onCancel={onClose}
            footer={null}
            width={800}
            className="vehicle-modal"
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    make_id: selectedMake,
                    category_id: selectedCategory,
                    vehicle_model_id: vehicleModelId,
                    status_availability_id: selectedStatus
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <Form.Item
                            name="category_id"
                            label="Category"
                            required
                            tooltip="Select the vehicle category"
                            rules={[{ required: true, message: 'Please select category' }]}
                        >
                            <Select
                                placeholder="Select category"
                                onChange={handleCategoryChange}
                                options={DEFAULT_CATEGORIES.map(cat => ({
                                    value: cat,
                                    label: cat
                                }))}
                                className="w-full"
                            />
                        </Form.Item>

                        <Form.Item
                            name="make_id"
                            label="Make"
                            required
                            tooltip="Select the vehicle make"
                            rules={[{ required: true, message: 'Please select make' }]}
                        >
                            <Select
                                placeholder="Select make"
                                onChange={handleMakeChange}
                                options={DEFAULT_MAKES.map(make => ({
                                    value: make,
                                    label: make
                                }))}
                                className="w-full"
                            />
                        </Form.Item>

                        <Form.Item
                            name="vehicle_model_id"
                            label="Model"
                            required
                            tooltip="Select the vehicle model"
                            rules={[{ required: true, message: 'Please select model' }]}
                        >
                            <Select
                                placeholder="Select or type model name"
                                options={models.map(model => ({
                                    label: model.vehicle_model_name,
                                    value: model.vehicle_model_name
                                }))}
                                className="w-full"
                                showSearch
                                allowClear
                                mode="single"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                onSearch={(value) => {
                                    if (value) {
                                        form.setFieldsValue({ vehicle_model_id: value });
                                    }
                                }}
                                notFoundContent={null}
                            />
                        </Form.Item>

                        <Form.Item
                            name="vehicle_license"
                            label="License Number"
                            required
                            tooltip="Enter the vehicle license number"
                            rules={[{ required: true, message: 'Please enter license number' }]}
                        >
                            <Input placeholder="Enter license number" className="w-full" />
                        </Form.Item>

                        <Form.Item
                            name="year"
                            label="Year"
                            required
                            tooltip="Select the vehicle year"
                            rules={[{ required: true, message: 'Please select year' }]}
                        >
                            <Calendar
                                value={year}
                                onChange={(e) => setYear(e.value)}
                                view="year"
                                dateFormat="yy"
                                placeholder="Select Year"
                                className="w-full"
                            />
                        </Form.Item>

                        <Form.Item
                            name="status_availability_id"
                            label="Availability Status"
                            required
                            tooltip="Select the vehicle availability status"
                            rules={[{ required: true, message: 'Please select status' }]}
                        >
                            <Select
                                placeholder="Select status"
                                options={statusOptions.map(status => ({
                                    label: status.status_availability_name,
                                    value: status.status_availability_id
                                }))}
                                className="w-full"
                            />
                        </Form.Item>
                    </div>

                    <div className="space-y-4">
                        <Form.Item
                            name="vehicle_pic"
                            label="Vehicle Image"
                            tooltip="Upload vehicle image (max 5MB)"
                        >
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onChange={handleImageUpload}
                                beforeUpload={() => false}
                                maxCount={1}
                            >
                                {fileList.length < 1 && (
                                    <Button icon={<PlusOutlined />}>
                                        Upload
                                    </Button>
                                )}
                            </Upload>
                            {vehicleImage && typeof vehicleImage === 'string' && vehicleImage.startsWith('http') && (
                                <div className="mt-4">
                                    <img 
                                        src={vehicleImage} 
                                        alt="Vehicle Preview" 
                                        className="max-w-full h-auto rounded-lg shadow-lg" 
                                    />
                                </div>
                            )}
                        </Form.Item>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Update Vehicle
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default Update_Modal;
