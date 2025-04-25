import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaPlus, FaTrash, FaSearch, FaTools } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';

const EquipmentCategories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ categoryId: '', name: '' });
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const encryptedUrl = SecureStorage.getLocalItem("url");

    useEffect(() => {
        const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
        console.log("this is encryptedUserLevel", encryptedUserLevel);
        if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}fetchMaster.php`, new URLSearchParams({ operation: 'fetchEquipments' }));
            if (response.data.status === 'success') {
                setCategories(response.data.data);
                setFilteredCategories(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Error fetching equipment categories');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        const categoryToEdit = categories.find((category) => category.equipments_category_id === id);
        if (categoryToEdit) {
            setFormData({ categoryId: categoryToEdit.equipments_category_id, name: categoryToEdit.equipments_category_name });
            setEditMode(true);
            setShowModal(true);
        }
    };

    const handleDelete = (id) => {
        setSelectedCategoryId(id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (!selectedCategoryId) {
            toast.error('Equipment category ID is required for deletion.');
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost/coc/gsd/delete_master.php',
                JSON.stringify({
                    operation: 'deleteEquipmentCategory',
                    equipmentCategoryId: selectedCategoryId
                }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.status === 'success') {
                setCategories(categories.filter(category => category.equipments_category_id !== selectedCategoryId));
                setFilteredCategories(filteredCategories.filter(category => category.equipments_category_id !== selectedCategoryId));
                toast.success('Equipment category deleted successfully!');
            } else {
                toast.error(response.data.message || 'Failed to delete equipment category.');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Error deleting equipment category.');
        } finally {
            setShowConfirmDelete(false);
            setSelectedCategoryId(null);
        }
    };

    const handleSave = async () => {
        const sanitizedName = sanitizeInput(formData.name);
        if (!sanitizedName.trim()) {
            toast.error("Please enter a category name.");
            return;
        }

        if (!validateInput(sanitizedName)) {
            toast.error("Invalid characters in category name.");
            return;
        }

        setIsSubmitting(true);
        try {
            const requestData = {
                operation: editMode ? 'updateEquipmentCategory' : 'saveEquipmentCategory',
                categoryData: {
                    categoryId: formData.categoryId,
                    name: sanitizedName.trim()
                }
            };

            const response = await axios.post(
                `${encryptedUrl}update_master1.php`,
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.status === 'success') {
                toast.success(editMode ? 'Equipment category updated successfully!' : 'Equipment category added successfully!');
                fetchCategories();
                closeModal();
            } else {
                toast.error(response.data.message || `Failed to ${editMode ? 'update' : 'add'} equipment category.`);
            }
        } catch (error) {
            toast.error(`Error ${editMode ? 'updating' : 'adding'} equipment category.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setFormData({ categoryId: '', name: '' });
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const results = categories.filter(category =>
            category.equipments_category_name.toLowerCase().includes(searchTerm)
        );
        setFilteredCategories(results);
    };

    const handleAddCategory = () => {
        setFormData({ categoryId: '', name: '' });
        setEditMode(false);
        setShowModal(true);
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-100">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <div className="mb-4">
                    <Button variant="link" onClick={() => navigate('/Master')} className="text-green-800">
                        <FaArrowLeft className="mr-2" /> Back to Master
                    </Button>
                </div>
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Equipment Categories</h2>
                <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative w-full md:w-64 mb-4 md:mb-0"
                        >
                            <input
                                type="text"
                                onChange={handleSearchChange}
                                placeholder="Search by category name"
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddCategory}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                        >
                            <FaPlus className="mr-2" /> Add Category
                        </motion.button>
                    </div>
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center items-center h-64"
                        >
                            <div className="loader"></div>
                        </motion.div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-green-600 text-white">
                                        <th className="py-3 px-4 text-left rounded-tl-lg">Name</th>
                                        <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    <AnimatePresence>
                                        {filteredCategories.map((category) => (
                                            <motion.tr 
                                                key={category.equipments_category_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{category.equipments_category_name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDelete(category.equipments_category_id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FaTrash />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEdit(category.equipments_category_id)}
                                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out"
                                                    >
                                                        Edit
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add/Edit Category Modal */}
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton className="bg-green-600 text-white">
                    <Modal.Title><FaTools className="inline-block mr-2" /> {editMode ? 'Edit' : 'Add'} Equipment Category</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-green-50">
                    <Form>
                        <Form.Group controlId="formCategoryName">
                            <Form.Label>Name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="bg-green-50">
                    <Button variant="secondary" onClick={closeModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)} centered>
                <Modal.Header closeButton className="bg-red-600 text-white">
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this equipment category?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            <Toaster position="top-right" />
        </div>
    );
};

export default EquipmentCategories;
