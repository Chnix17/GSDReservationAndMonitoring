import React, { useState, useEffect,  } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { Modal, Form, Input, Upload, Select, Button, Image, Tooltip, Space, Empty, Pagination, Alert, message } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined, MinusOutlined } from '@ant-design/icons';
import { Tag } from 'primereact/tag';

const EquipmentEntry = () => {
 
    const [equipments, setEquipments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdateUnitModalOpen, setIsUpdateUnitModalOpen] = useState(false);
    const [newEquipmentName, setNewEquipmentName] = useState('');
    const [newEquipmentQuantity, setNewEquipmentQuantity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [equipmentType, setEquipmentType] = useState('bulk');
    
    const [currentUnit, setCurrentUnit] = useState(null);
    const [unitDetails, setUnitDetails] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const navigate = useNavigate();
    
    const [form] = Form.useForm();
    const [equipmentImage, setEquipmentImage] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [statusAvailability, setStatusAvailability] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [viewImageModal, setViewImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
    const [sortField, setSortField] = useState('equip_id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [isSerializedUnit, setIsSerializedUnit] = useState(false);
    const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
    const [currentEquipmentId, setCurrentEquipmentId] = useState(null);
    const [serialNumbers, setSerialNumbers] = useState(['']);
    const [newUnitSerialNumbers, setNewUnitSerialNumbers] = useState(['']);

    const user_level_id = SecureStorage.getSessionItem('user_level_id');


    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    useEffect(() => {
        fetchEquipments();
        fetchCategories();
        fetchStatusAvailability();
    }, []);

    const fetchUnitById = async (unitId) => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "getUnitById", unitId: unitId };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setUnitDetails(response.data.data[0]);
            } else {
                toast.error("Error fetching unit details: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching unit details:", error);
            toast.error("An error occurred while fetching unit details.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUnit = async () => {
        if (!currentUnit || !unitDetails) {
            toast.error("No unit selected for update");
            return;
        }

        setLoading(true);
        const url = "http://localhost/coc/gsd/update_master1.php";
        const requestData = {
            operation: "updateEquipmentUnit",
            unit_id: currentUnit.unit_id,
            serial_number: unitDetails.serial_number,
            status_availability_id: unitDetails.status_availability_id
        };

        console.log("Request Data:", requestData);

        try {
            const response = await axios.post(url, JSON.stringify(requestData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success("Unit successfully updated!");
                setIsUpdateUnitModalOpen(false);
                fetchEquipments(); // Refresh the equipment list
            } else {
                toast.error("Failed to update unit: " + response.data.message);
            }
        } catch (error) {
            console.error("Error updating unit:", error);
            toast.error("An error occurred while updating the unit.");
        } finally {
            setLoading(false);
        }
    };

    const fetchEquipments = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "fetchEquipmentsWithStatus" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setEquipments(response.data.data);
            } else {
                toast.error("Error fetching equipments: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching equipments:", error);
            toast.error("An error occurred while fetching equipments.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "fetchCategories" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setCategories(response.data.data);
            } else {
                toast.error("Error fetching categories: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("An error occurred while fetching categories.");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusAvailability = async () => {
        const url = "http://localhost/coc/gsd/fetchMaster.php";
        const jsonData = { operation: "fetchStatusAvailability" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setStatusAvailability(response.data.data);
            } else {
                toast.error("Error fetching status availability: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching status availability:", error);
            toast.error("An error occurred while fetching status availability.");
        }
    };

    const handleEquipmentNameChange = (e) => {
        const sanitized = sanitizeInput(e.target.value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid input detected. Please avoid special characters and scripts.');
            return;
        }
        setNewEquipmentName(sanitized);
        form.setFieldsValue({ equipmentName: sanitized });
    };

    const handleEquipmentQuantityChange = (e) => {
        const sanitized = sanitizeInput(e.target.value);
        if (!/^\d*$/.test(sanitized)) {
            toast.error('Please enter only numbers for quantity.');
            return;
        }
        setNewEquipmentQuantity(sanitized);
        form.setFieldsValue({ equipmentQuantity: sanitized });
    };

    const handleSubmit = async () => {
        if (!validateInput(newEquipmentName)) {
            toast.error('Equipment name contains invalid characters.');
            return;
        }

        if (!newEquipmentName || !selectedCategory || !selectedStatus) {
            toast.error("All fields are required!");
            return;
        }

        // Check equipment type specific validations only for new equipment
        if (!editingEquipment) {
            if (equipmentType === 'bulk' && !newEquipmentQuantity) {
                toast.error("Quantity is required for bulk equipment!");
                return;
            }

            if (equipmentType === 'serialized' && (!serialNumbers || serialNumbers.length === 0)) {
                toast.error("At least one serial number is required!");
                return;
            }
        }

        const user_admin_id = localStorage.getItem('user_id');

        let requestData;
        if (editingEquipment) {
            requestData = {
                operation: "updateEquipment",
                equipmentData: {
                    equipmentId: editingEquipment.equip_id,
                    name: newEquipmentName,
                    quantity: editingEquipment.units && editingEquipment.units.length > 0 ? editingEquipment.units.length : newEquipmentQuantity,
                    categoryId: selectedCategory,
                    statusId: selectedStatus,
                    equip_pic: equipmentImage || null,
                    user_admin_id: user_admin_id,
                    serial_numbers: editingEquipment.units && editingEquipment.units.length > 0 ? 
                        editingEquipment.units.map(u => u.serial_number) : 
                        null
                }
            };
        } else {
            requestData = {
                operation: "saveEquipment",
                data: {
                    name: newEquipmentName,
                    ...(equipmentType === 'bulk' 
                        ? { quantity: parseInt(newEquipmentQuantity) }
                        : { serial_numbers: serialNumbers }
                    ),
                    status_availability_id: selectedStatus,
                    categoryId: selectedCategory,
                    user_admin_id: user_admin_id
                }
            };
        }

        const url = editingEquipment 
            ? "http://localhost/coc/gsd/update_master1.php"
            : "http://localhost/coc/gsd/insert_master.php";

        setLoading(true);
        try {
            const response = await axios.post(url, JSON.stringify(requestData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                toast.success(`Equipment successfully ${editingEquipment ? "updated" : "added"}!`);
                fetchEquipments();
                resetForm();
            } else {
                toast.error(`Failed to ${editingEquipment ? "update" : "add"} equipment: ` + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            toast.error(`An error occurred while ${editingEquipment ? "updating" : "adding"} equipment.`);
            console.error("Error saving equipment:", error);
        } finally {
            setLoading(false);
            if (editingEquipment) {
                setIsEditModalOpen(false);
            } else {
                setIsAddModalOpen(false);
            }
        }
    };
    
    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            const reader = new FileReader();
            reader.onloadend = () => {
                setEquipmentImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setEquipmentImage(null);
        }
    };

    const resetForm = () => {
        setNewEquipmentName('');
        setNewEquipmentQuantity('');
        setSelectedCategory('');
        setEditingEquipment(null);
        setEquipmentImage(null);
        setFileList([]);
        setSelectedStatus('');
        setEquipmentType('bulk');
        setSerialNumbers([]);
        form.resetFields();
    };

    const handleEditClick = async (equipment) => {
        await getEquipmentDetails(equipment.equip_id);
        setIsEditModalOpen(true);
    };

    const getEquipmentDetails = async (equip_id) => {
        const url = "http://localhost/coc/gsd/fetchMaster.php";
        const jsonData = { operation: "fetchEquipmentById", id: equip_id };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                const equipment = response.data.data[0];
                setNewEquipmentName(equipment.equip_name);
                setNewEquipmentQuantity(equipment.equip_quantity);
                setSelectedCategory(equipment.equipment_equipment_category_id);
                setSelectedStatus(equipment.status_availability_id);
                setEditingEquipment(equipment);

                console.log("Fetched Equipment Details:", equipment);
                
                // Update form values
                form.setFieldsValue({
                    equipmentName: equipment.equip_name,
                    equipmentQuantity: equipment.equip_quantity,
                    category: equipment.equipment_equipment_category_id,
                    status: equipment.status_availability_id
                });

                // If there's an image, prepare it for display
                if (equipment.equip_pic) {
                    const imageUrl = `http://localhost/coc/gsd/${equipment.equip_pic}`;
                    setEquipmentImage(imageUrl);
                    setFileList([{
                        uid: '-1',
                        name: 'equipment-image.png',
                        status: 'done',
                        url: imageUrl,
                    }]);
                } else {
                    setFileList([]);
                    setEquipmentImage(null);
                }
            } else {
                toast.error("Error fetching equipment details: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching equipment details.");
            console.error("Error fetching equipment details:", error);
        }
    };

    const handleArchiveEquipment = (equip_id, unit_id = null, is_serialize = false) => {
        setSelectedEquipmentId(equip_id);
        setSelectedUnitId(unit_id);
        setIsSerializedUnit(is_serialize);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/delete_master.php";
            const jsonData = {
                operation: "archiveResource",
                resourceType: "equipment",
                resourceId: isSerializedUnit ? selectedUnitId : selectedEquipmentId,
                is_serialize: isSerializedUnit
            };

            console.log("Request Data:", jsonData);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData)
            });


            console.log("Response:", response);

            const data = await response.json();

            console.log("Response Data:", data);
            
            if (data.status === 'success') {
                toast.success(isSerializedUnit ? "Equipment unit archived successfully" : "Equipment archived successfully");
                setShowConfirmDelete(false);
                fetchEquipments();
            } else {
                toast.error(data.message || "Failed to archive equipment");
            }
        } catch (error) {
            toast.error("An error occurred while archiving equipment: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        setViewImageModal(true);
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        return `http://localhost/coc/gsd/${imagePath}`;
    };

    const handleRefresh = () => {
        fetchEquipments();
        setSearchTerm('');
    };
    
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const toggleExpand = (equipId) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(equipId)) {
            newExpandedRows.delete(equipId);
        } else {
            newExpandedRows.add(equipId);
        }
        setExpandedRows(newExpandedRows);
    };

    const handleAddUnit = async () => {
        // Validate if any serial number is empty
        const nonEmptySerialNumbers = newUnitSerialNumbers.filter(sn => sn.trim());
        if (nonEmptySerialNumbers.length === 0) {
            message.error('Please enter at least one serial number');
            return;
        }

        // Check for duplicate serial numbers in the input
        const uniqueSerials = new Set(nonEmptySerialNumbers.map(sn => sn.toLowerCase()));
        if (uniqueSerials.size !== nonEmptySerialNumbers.length) {
            message.error('Duplicate serial numbers are not allowed');
            return;
        }

        // Check if any of the serial numbers already exist for this equipment
        const equipment = filteredEquipments.find(eq => eq.equip_id === currentEquipmentId);
        if (equipment && equipment.units) {
            const existingSerials = new Set(equipment.units.map(unit => unit.serial_number.toLowerCase()));
            const duplicate = nonEmptySerialNumbers.find(sn => existingSerials.has(sn.toLowerCase()));
            if (duplicate) {
                message.error(`Serial number "${duplicate}" already exists for this equipment`);
                return;
            }
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost/coc/gsd/insert_master.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'saveEquipmentUnit',
                    data: {
                        equip_id: currentEquipmentId,
                        serial_numbers: nonEmptySerialNumbers,
                        status_availability_id: 1 // Default to available status
                    }
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                message.success(`${nonEmptySerialNumbers.length} equipment unit(s) added successfully`);
                setIsAddUnitModalOpen(false);
                setNewUnitSerialNumbers(['']);
                await fetchEquipments();
            } else {
                message.error(data.message || 'Failed to add equipment units');
            }
        } catch (error) {
            console.error('Error adding equipment units:', error);
            message.error('Failed to add equipment units');
        } finally {
            setLoading(false);
        }
    };

    // Add this new function to handle adding more serial number fields
    const addSerialNumberField = () => {
        setNewUnitSerialNumbers([...newUnitSerialNumbers, '']);
    };

    // Add this new function to handle removing a serial number field
    const removeSerialNumberField = (index) => {
        const newSerials = newUnitSerialNumbers.filter((_, i) => i !== index);
        setNewUnitSerialNumbers(newSerials.length ? newSerials : ['']);
    };

    // Add this new function to update a serial number
    const updateSerialNumber = (index, value) => {
        const newSerials = [...newUnitSerialNumbers];
        newSerials[index] = value;
        setNewUnitSerialNumbers(newSerials);
    };

    const filteredEquipments = equipments.filter(equipment =>
        equipment.equip_name && equipment.equip_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
                <Sidebar />
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
                <div className="p-[2.5rem] lg:p-12 min-h-screen">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="mb-4 mt-20">
                           
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Equipment Management
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search equipments by name"
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        size="large"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Tooltip title="Refresh data">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        size="large"
                                    />
                                </Tooltip>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size="large"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="bg-lime-900 hover:bg-green-600"
                                >
                                    Add Equipment
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                                        <tr>
                                            <th scope="col" className="px-2 py-3">
                                                <div className="flex items-center">
                                                    Expand
                                                </div>
                                            </th>
                                           
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Image
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('equip_name')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Equipment Name
                                                    {sortField === 'equip_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('equip_quantity')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Quantity
                                                    {sortField === 'equip_quantity' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Category
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Status
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Actions
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEquipments && filteredEquipments.length > 0 ? (
                                            filteredEquipments
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((equipment) => (
                                                    <React.Fragment key={equipment.equip_id}>
                                                        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                            <td className="px-2 py-4">
                                                                {equipment.units && equipment.units.length > 0 && (
                                                                    <Button
                                                                        type="text"
                                                                        icon={expandedRows.has(equipment.equip_id) ? 
                                                                            <MinusOutlined /> : <PlusOutlined />}
                                                                        onClick={() => toggleExpand(equipment.equip_id)}
                                                                        className="text-green-900"
                                                                    />
                                                                )}
                                                            </td>
                                                           
                                                            <td className="px-6 py-4">
                                                                {equipment.equip_pic ? (
                                                                    <div className="cursor-pointer" onClick={() => handleViewImage(getImageUrl(equipment.equip_pic))}>
                                                                        <img 
                                                                            src={getImageUrl(equipment.equip_pic)} 
                                                                            alt={equipment.equip_name} 
                                                                            className="w-12 h-12 object-cover rounded-md shadow-sm hover:opacity-80 transition-opacity"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                                                        <i className="pi pi-box text-xl"></i>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center">
                                                               
                                                                    <span className="font-medium">{equipment.equip_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">{equipment.equip_quantity}</td>
                                                            <td className="px-6 py-4">{equipment.equipments_category_name || 'Not specified'}</td>
                                                            <td className="px-6 py-4">
                                                                <Tag 
                                                                    value={equipment.status || 'Available'} 
                                                                    severity={(equipment.status || 'Available') === 'Available' ? 'success' : 'danger'}
                                                                    className="px-2 py-1 text-xs font-semibold"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        type="primary"
                                                                        icon={<EditOutlined />}
                                                                        onClick={() => handleEditClick(equipment)}
                                                                        size="middle"
                                                                        className="bg-green-900 hover:bg-lime-900"
                                                                    />
                                                                    <Button
                                                                        danger
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => handleArchiveEquipment(equipment.equip_id)}
                                                                        size="middle"
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {expandedRows.has(equipment.equip_id) && equipment.units && (
                                                            <tr className="bg-gray-50">
                                                                <td colSpan={8} className="px-6 py-4">
                                                                    <div className="pl-8">
                                                                        <div className="flex justify-between items-center mb-4">
                                                                            <h4 className="text-sm font-semibold text-green-900">Serial Numbers:</h4>
                                                                            <Button
                                                                                type="primary"
                                                                                icon={<PlusOutlined />}
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    setCurrentEquipmentId(equipment.equip_id);
                                                                                    setIsAddUnitModalOpen(true);
                                                                                }}
                                                                                className="bg-green-900 hover:bg-lime-900"
                                                                            >
                                                                                Add Unit
                                                                            </Button>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {equipment.units.map((unit) => (
                                                                                <div key={unit.unit_id} className="flex items-center justify-between space-x-4 text-sm">
                                                                                    <div className="flex items-center space-x-4">
                                                                                        <span className="font-medium">{unit.serial_number}</span>
                                                                                        <Tag 
                                                                                            value={unit.availability_status} 
                                                                                            severity={unit.availability_status === 'available' ? 'success' : 'danger'}
                                                                                            className="px-2 py-1 text-xs font-semibold"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex space-x-2">
                                                                                        <Button
                                                                                            type="primary"
                                                                                            icon={<EditOutlined />}
                                                                                            size="small"
                                                                                            onClick={() => {
                                                                                                setCurrentUnit(unit);
                                                                                                fetchUnitById(unit.unit_id);
                                                                                                setIsUpdateUnitModalOpen(true);
                                                                                            }}
                                                                                            className="bg-green-900 hover:bg-lime-900"
                                                                                        />
                                                                                        <Button
                                                                                            danger
                                                                                            icon={<DeleteOutlined />}
                                                                                            size="small"
                                                                                            onClick={() => handleArchiveEquipment(equipment.equip_id, unit.unit_id, true)}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No equipments found
                                                            </span>
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredEquipments ? filteredEquipments.length : 0}
                                        onChange={(page, size) => {
                                            setCurrentPage(page);
                                            setPageSize(size);
                                        }}
                                        showSizeChanger={true}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} of ${total} items`
                                        }
                                        className="flex justify-end"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Update Unit Modal */}
            <Modal
                title={<div className="flex items-center">
                    <EditOutlined className="mr-2 text-green-900" />
                    Update Equipment Unit
                </div>}
                open={isUpdateUnitModalOpen}
                onCancel={() => setIsUpdateUnitModalOpen(false)}
                onOk={handleUpdateUnit}
                confirmLoading={loading}
                destroyOnClose
            >
                {unitDetails && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
                            <Input 
                                value={unitDetails.equip_name} 
                                readOnly 
                                className="bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                            <Input 
                                value={unitDetails.serial_number}
                                onChange={(e) => setUnitDetails({
                                    ...unitDetails,
                                    serial_number: e.target.value
                                })}
                                placeholder="Enter serial number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <Select
                                value={unitDetails.status_availability_id}
                                onChange={(value) => setUnitDetails({
                                    ...unitDetails,
                                    status_availability_id: value
                                })}
                                style={{ width: '100%' }}
                            >
                                {statusAvailability.map(status => (
                                    <Select.Option 
                                        key={status.status_availability_id} 
                                        value={status.status_availability_id}
                                    >
                                        {status.status_availability_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add/Edit Equipment Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <FaEye className="mr-2 text-green-900" /> 
                        {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
                    </div>
                }
                open={isAddModalOpen || isEditModalOpen}
                onCancel={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                }}
                okText={editingEquipment ? 'Update' : 'Add'}
                onOk={handleSubmit}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
                    {!editingEquipment && (
                        <Form.Item
                            label="Equipment Type"
                            name="equipmentType"
                            rules={[{ required: true, message: 'Please select equipment type!' }]}
                        >
                            <Select
                                value={equipmentType}
                                onChange={(value) => setEquipmentType(value)}
                                placeholder="Select equipment type"
                            >
                                <Select.Option value="bulk">Bulk Entry (Quantity Only)</Select.Option>
                                <Select.Option value="serialized">Individual Serial Numbers</Select.Option>
                            </Select>
                        </Form.Item>
                    )}

                    <Form.Item
                        label="Equipment Name"
                        name="equipmentName"
                        rules={[{ required: true, message: 'Please input equipment name!' }]}
                    >
                        <Input
                            value={newEquipmentName}
                            onChange={handleEquipmentNameChange}
                            placeholder="Enter equipment name"
                        />
                    </Form.Item>

                    {/* Show quantity field only for bulk equipment in add mode or when editing equipment with existing quantity */}
                    {(!editingEquipment && equipmentType === 'bulk') || (editingEquipment && editingEquipment.equip_quantity) ? (
                        <Form.Item
                            label="Quantity"
                            name="equipmentQuantity"
                            rules={[{ required: !editingEquipment, message: 'Please input quantity!' }]}
                        >
                            <Input
                                type="number"
                                value={newEquipmentQuantity}
                                onChange={handleEquipmentQuantityChange}
                                placeholder="Enter quantity"
                                min="1"
                            />
                        </Form.Item>
                    ) : null}

                    {/* Show serial numbers field only for serialized equipment in add mode */}
                    {!editingEquipment && equipmentType === 'serialized' && (
                        <Form.Item
                            label="Serial Numbers"
                            name="serialNumbers"
                            rules={[{ required: true, message: 'Please add at least one serial number!' }]}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {serialNumbers.map((serial, index) => (
                                    <Space key={index}>
                                        <Input
                                            value={serial}
                                            onChange={(e) => {
                                                const newSerialNumbers = [...serialNumbers];
                                                newSerialNumbers[index] = e.target.value;
                                                setSerialNumbers(newSerialNumbers);
                                            }}
                                            placeholder="Enter serial number"
                                        />
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => {
                                                const newSerialNumbers = serialNumbers.filter((_, i) => i !== index);
                                                setSerialNumbers(newSerialNumbers);
                                            }}
                                        />
                                    </Space>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => setSerialNumbers([...serialNumbers, ''])}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Add Serial Number
                                </Button>
                            </Space>
                        </Form.Item>
                    )}

                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true, message: 'Please select a category!' }]}
                    >
                        <Select
                            value={selectedCategory}
                            onChange={(value) => setSelectedCategory(value)}
                            placeholder="Select a category"
                        >
                            {categories.map(category => (
                                <Select.Option key={category.equipments_category_id} value={category.equipments_category_id}>
                                    {category.equipments_category_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Status Availability"
                        name="status"
                        rules={[{ required: true, message: 'Please select status!' }]}
                    >
                        <Select
                            value={selectedStatus}
                            onChange={(value) => setSelectedStatus(value)}
                            placeholder="Select status"
                        >
                            {statusAvailability.map(status => (
                                <Select.Option key={status.status_availability_id} value={status.status_availability_id}>
                                    {status.status_availability_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Equipment Image"
                        tooltip="Upload equipment image (max 5MB)"
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
                        {equipmentImage && typeof equipmentImage === 'string' && equipmentImage.startsWith('http') && (
                            <div className="mt-4">
                                <img
                                    src={equipmentImage}
                                    alt="Equipment Preview"
                                    className="w-32 h-32 object-cover rounded shadow-md"
                                />
                            </div>
                        )}
                    </Form.Item>
                </Form>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                open={viewImageModal}
                footer={null}
                onCancel={() => setViewImageModal(false)}
                width={700}
                centered
            >
                {currentImage && (
                    <Image
                        src={currentImage}
                        alt="Equipment"
                        className="w-full object-contain max-h-[70vh]"
                        preview={false}
                    />
                )}
            </Modal>
            
            {/* Confirm Delete Modal */}
            <Modal
                title={<div className="text-red-600 flex items-center"><ExclamationCircleOutlined className="mr-2" /> Confirm Deletion</div>}
                open={showConfirmDelete}
                onCancel={() => setShowConfirmDelete(false)}
                footer={[
                    <Button key="back" onClick={() => setShowConfirmDelete(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={loading}
                        onClick={() => confirmDelete()}
                        icon={<DeleteOutlined />}
                    >
                        Delete
                    </Button>,
                ]}
            >
                <Alert
                    message="Warning"
                    description={`Are you sure you want to archive this ${isSerializedUnit ? 'equipment unit' : 'equipment'}? This action cannot be undone.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>

            {/* Add Unit Modal */}
            <Modal
                title={<div className="flex items-center">
                    <PlusOutlined className="mr-2 text-green-900" />
                    Add Equipment Unit
                </div>}
                open={isAddUnitModalOpen}
                onCancel={() => {
                    setIsAddUnitModalOpen(false);
                    setNewUnitSerialNumbers(['']);
                }}
                onOk={handleAddUnit}
                confirmLoading={loading}
                okText="Add Units"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial Numbers</label>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {newUnitSerialNumbers.map((serial, index) => (
                                <Space key={index}>
                                    <Input
                                        value={serial}
                                        onChange={(e) => updateSerialNumber(index, e.target.value)}
                                        placeholder="Enter serial number"
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeSerialNumberField(index)}
                                        disabled={newUnitSerialNumbers.length === 1}
                                    />
                                </Space>
                            ))}
                            <Button
                                type="dashed"
                                onClick={addSerialNumberField}
                                block
                                icon={<PlusOutlined />}
                            >
                                Add More Serial Numbers
                            </Button>
                        </Space>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EquipmentEntry;