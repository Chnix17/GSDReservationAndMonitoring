import React, { useEffect, useState, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaCar } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { Button, Tooltip, Modal, Form, Input, Empty, Pagination, Alert } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const VehicleCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('vehicle_category_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const encryptedUrl = SecureStorage.getLocalItem("url");
  const [form] = Form.useForm();

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
      localStorage.clear();
      navigate('/gsd');
    }
  }, [navigate]);



  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}user.php`, 
        new URLSearchParams({ operation: 'fetchVehicleCategories' })
      );
      if (response.data.status === 'success') {
        setCategories(response.data.data);
        setFilteredCategories(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error fetching vehicle categories');
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEdit = (id) => {
    const categoryToEdit = categories.find((category) => category.vehicle_category_id === id);
    if (categoryToEdit) {
      setFormData({ id: categoryToEdit.vehicle_category_id, name: categoryToEdit.vehicle_category_name });
      setEditMode(true);
      setShowModal(true);
      form.setFieldsValue({ name: categoryToEdit.vehicle_category_name });
    }
  };

  const handleDelete = (id) => {
    setSelectedCategoryId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.post(`${encryptedUrl}delete_master.php`, {
        operation: 'deleteVehicleCategory',
        vehicleCategoryId: selectedCategoryId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data.status === 'success') {
        setCategories(categories.filter(category => category.vehicle_category_id !== selectedCategoryId));
        setFilteredCategories(filteredCategories.filter(category => category.vehicle_category_id !== selectedCategoryId));
        toast.success('Vehicle category deleted successfully!');
      } else {
        toast.error(response.data.message || 'Failed to delete vehicle category.');
      }
    } catch (error) {
      toast.error('Error deleting vehicle category.');
    } finally {
      setShowConfirmDelete(false);
    }
  };
  
  const handleSave = async (values) => {
    const sanitizedName = sanitizeInput(values.name);
    
    if (!sanitizedName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    if (!validateInput(sanitizedName)) {
      toast.error("Input contains invalid characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Always use user.php for both save and update
      const requestData = editMode
        ? {
            operation: 'updateVehicleCategory',
            id: formData.id,
            name: sanitizedName
          }
        : {
            operation: 'saveCategoryData',
            vehicle_category_name: sanitizedName
          };

      const response = await axios.post(`${encryptedUrl}user.php`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data.status === 'success') {
        toast.success(editMode ? 'Vehicle category updated successfully!' : 'Vehicle category added successfully!');
        fetchCategories();
        closeModal();
      } else {
        // Show backend error message, e.g., duplicate category
        toast.error(response.data.message || `Failed to ${editMode ? 'update' : 'add'} vehicle category.`);
      }
    } catch (error) {
      toast.error(`Error ${editMode ? 'updating' : 'adding'} vehicle category.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '' });
    form.resetFields();
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearchTerm(searchTerm);
    const results = categories.filter(category =>
      category.vehicle_category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(results);
  };

  const handleAddCategory = () => {
    setFormData({ id: '', name: '' });
    setEditMode(false);
    setShowModal(true);
    form.setFieldsValue({ name: '' });
  };
  
  const handleRefresh = () => {
    fetchCategories();
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

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-none">
        <Sidebar />
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-10">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-8"
          >
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-5">
                Vehicle Category
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-row items-center gap-2 w-full">
              <div className="flex-grow">
                <Input
                  placeholder="Search categories by name"
                  allowClear
                  prefix={<SearchOutlined />}
                  size="large"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full"
                />
              </div>
              <Tooltip title="Refresh data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="large"
                  style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Tooltip>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleAddCategory}
                className="bg-lime-900 hover:bg-green-600"
              >
                <span className="hidden sm:inline">Add Category</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100" style={{ minWidth: '100%' }}>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                  <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                    <tr>
                      <th scope="col" className="px-4 py-4" onClick={() => handleSort('vehicle_category_name')}>
                        <div className="flex items-center cursor-pointer">
                          CATEGORY NAME
                          {sortField === 'vehicle_category_name' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          ACTIONS
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories && filteredCategories.length > 0 ? (
                      filteredCategories
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((category) => (
                          <tr
                            key={category.vehicle_category_id}
                            className="bg-white border-b last:border-b-0 border-gray-200"
                          >
                            <td className="px-4 py-6">
                              <div className="flex items-center">
                                <span className="font-bold truncate block max-w-[140px]">{category.vehicle_category_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-6">
                              <div className="flex justify-center space-x-2">
                                <Tooltip title="Edit Category">
                                  <Button
                                    shape="circle"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(category.vehicle_category_id)}
                                    size="large"
                                    className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                  />
                                </Tooltip>
                                <Tooltip title="Delete Category">
                                  <Button
                                    shape="circle"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(category.vehicle_category_id)}
                                    size="large"
                                    className="shadow-lg flex items-center justify-center"
                                  />
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                              <span className="text-gray-500 dark:text-gray-400">
                                No categories found
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
                    total={filteredCategories ? filteredCategories.length : 0}
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

      {/* Add/Edit Category Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <FaCar className="mr-2 text-green-900" /> 
            {editMode ? 'Edit Vehicle Category' : 'Add Vehicle Category'}
          </div>
        }
        open={showModal}
        onCancel={closeModal}
        okText={editMode ? 'Update' : 'Add'}
        onOk={() => form.submit()}
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="Category Name"
            name="name"
            initialValue={formData.name}
            rules={[
              { required: true, message: 'Please input category name!' },
            ]}
          >
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter category name"
            />
          </Form.Item>
        </Form>
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
          description="Are you sure you want to delete this vehicle category? This action cannot be undone."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      </Modal>

      <Toaster position="top-right" />
    </div>
  );
};

export default VehicleCategories;