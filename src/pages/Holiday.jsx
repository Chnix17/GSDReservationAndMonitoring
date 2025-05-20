import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaTrash, FaClipboardCheck } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';

const Conditions = () => {
    const navigate = useNavigate();
    const [conditions, setConditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ id: '', name: '' });
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedConditionId, setSelectedConditionId] = useState(null);
    const [ setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const user_level_id = localStorage.getItem('user_level_id');

    useEffect(() => {
          const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
          console.log("this is encryptedUserLevel", encryptedUserLevel);
          if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
              localStorage.clear();
              navigate('/gsd');
          }
      }, [navigate]);

    useEffect(() => {
        fetchConditions();
    }, []);

    const fetchConditions = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', new URLSearchParams({ operation: 'fetchConditions' }));
            if (response.data.status === 'success') {
                setConditions(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Error fetching conditions');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        const conditionToEdit = conditions.find((condition) => condition.condition_id === id);
        if (conditionToEdit) {
            setFormData({ id: conditionToEdit.condition_id, name: conditionToEdit.condition_name });
            setEditMode(true);
            setShowModal(true);
        }
    };    const handleDelete = (id) => {
        console.log('Deleting condition with id:', id);  // For debugging
        if (id) {
            setSelectedConditionId(id);
            setShowConfirmDelete(true);
        } else {
            toast.error('Invalid condition ID');
        }
    };

    const confirmDelete = async () => {
        try {            const response = await axios.post('http://localhost/coc/gsd/delete_master.php', {
                operation: 'deleteCondition',
                conditionId: selectedConditionId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.status === 'success') {
                setConditions(conditions.filter(condition => condition.condition_id !== selectedConditionId));
                toast.success('Condition deleted successfully!');
            } else {
                toast.error(response.data.message || 'Failed to delete condition.');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error deleting condition.');
        } finally {
            setShowConfirmDelete(false);
        }
    };

    const handleSave = async () => {
        const sanitizedName = sanitizeInput(formData.name);
        if (!sanitizedName.trim()) {
            toast.error("Please enter a condition name.");
            return;
        }

        if (!validateInput(sanitizedName)) {
            toast.error("Invalid characters in condition name.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/update_master1.php', {
                operation: 'updateCondition',
                conditionData: {
                    conditionId: formData.id,
                    name: sanitizedName.trim()
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.status === 'success') {
                // Update the local state
                setConditions(prevConditions => prevConditions.map(condition => 
                    condition.condition_id === formData.id 
                        ? { ...condition, condition_name: sanitizedName.trim() } 
                        : condition
                ));
                toast.success('Condition updated successfully!');
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to update condition.');
            }
        } catch (error) {
            console.error('Error updating condition:', error);
            toast.error('Error updating condition.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setFormData({ id: '', name: '' });
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
                <div className="mb-4 mt-20">
                    <Button variant="link" onClick={() => navigate('/Master')} className="text-green-800">
                        <FaArrowLeft className="mr-2" /> Back to Master
                    </Button>
                </div>
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Conditions</h2>
                <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
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
                                        {conditions.map((condition) => (
                                            <motion.tr 
                                                key={condition.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{condition.condition_name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}                                                        onClick={() => handleDelete(condition.id.toString())}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FaTrash />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEdit(condition.condition_id)}
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

            {/* Edit Condition Modal */}
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton className="bg-green-600 text-white">
                    <Modal.Title><FaClipboardCheck className="inline-block mr-2" /> Edit Condition</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-green-50">
                    <Form>
                        <Form.Group controlId="formConditionName">
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
                    <p>Are you sure you want to delete this condition?</p>
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

export default Conditions;
