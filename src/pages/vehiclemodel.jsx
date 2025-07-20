import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Form, Tooltip, Input,  Pagination, Empty } from 'antd';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { PlusOutlined,  EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const VehicleModels = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [makes, setMakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '', makeId: '', categoryId: '' });
  const [showModal, setShowModal] = useState(false);
  // const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  // const [selectedModelId, setSelectedModelId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('vehicle_model_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const encryptedUrl = SecureStorage.getLocalItem("url");
  const [form] = Form.useForm();

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [navigate]);



  const fetchMakes = useCallback(async () => {
    try {
      const response = await axios.post(
        `${encryptedUrl}fetchMaster.php`,
        'operation=fetchMake',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      const data = response.data;
      if (data.status === 'success') {
        setMakes(data.data);
      } else {
        toast.dismiss();
        toast.error(`Error fetching makes: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching makes:', error);
      toast.dismiss();
      toast.error('Error fetching makes.');
    }
  }, [encryptedUrl ]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.post(`${encryptedUrl}fetchMaster.php`, 
        'operation=fetchVehicleCategories',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      const data = response.data;
      if (data.status === 'success') {
        setCategories(data.data);
      } else {
        toast.dismiss();
        toast.error(`Error fetching categories: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.dismiss();
      toast.error('Error fetching categories.');
    }
  },[encryptedUrl]);

  const fetchModels = useCallback(async() => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}fetchMaster.php`, 
        new URLSearchParams({ operation: 'fetchModels' })
      );
      if (response.data.status === 'success') {
        setModels(response.data.data);
        setFilteredModels(response.data.data);
      } else {
        // toast.error(`Error fetching models: ${response.data.message}`); // Removed to prevent double toast
      }
    } catch (error) {
      // toast.error('Error fetching vehicle models.'); // Removed to prevent double toast
    } finally {
      setLoading(false);
    }
  },[encryptedUrl]);

  useEffect(() => {
    fetchModels();
    fetchMakes();
    fetchCategories();
  }, [fetchModels, fetchMakes, fetchCategories]);

  const fetchVehicleModelById = async (id) => {
    try {
      const response = await axios.post(`${encryptedUrl}fetchMaster.php`,
        `operation=fetchModelById&id=${id}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data.status === 'success' && response.data.data.length > 0) {
        const modelData = response.data.data[0];
        
        setFormData({
          id: modelData.vehicle_model_id,
          name: modelData.vehicle_model_name?.trim() || "",
          makeId: makes.find(make => make.vehicle_make_name?.trim() === modelData.vehicle_make_name?.trim())?.vehicle_make_id || '',
          categoryId: categories.find(category => category.vehicle_category_name?.trim() === modelData.vehicle_category_name?.trim())?.vehicle_category_id || ''
        });
                
        setEditMode(true);
        setShowModal(true);
      } else {
        toast.dismiss();
        toast.error('Failed to fetch vehicle model details.');
      }
    } catch (error) {
      console.error('Error fetching vehicle model details:', error);
      toast.dismiss();
      toast.error('Error fetching vehicle model details.');
    }
  };

  const handleEdit = (id) => {
    fetchVehicleModelById(id);
  };

// const handleDelete = (id) => {
//   setSelectedModelId(id);
//   setShowConfirmDelete(true);
// };

// const confirmDelete = async () => {
//   try {
//     const response = await axios.post(`${encryptedUrl}delete_master.php`, 
//       {
//         operation: 'deleteModel',
//         modelId: selectedModelId
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       }
//     );
//     if (response.data.status === 'success') {
//       setModels(models.filter(model => model.vehicle_model_id !== selectedModelId));
//       setFilteredModels(filteredModels.filter(model => model.vehicle_model_id !== selectedModelId));
//       toast.dismiss();
//       toast.success('Vehicle model deleted successfully!');
//     } else {
//       toast.dismiss();
//       toast.error(response.data.message || 'Failed to delete vehicle model.');
//     }
//   } catch (error) {
//     toast.dismiss();
//     toast.error('Error deleting vehicle model.');
//   } finally {
//     setShowConfirmDelete(false);
//   }
// };

  const handleSave = async () => {
    const sanitizedName = sanitizeInput(formData.name);
    
    if (!sanitizedName.trim() || !formData.makeId || !formData.categoryId) {
      toast.dismiss();
      toast.error("Please fill in all fields.");
      return;
    }

    if (!validateInput(sanitizedName)) {
      toast.dismiss();
      toast.error("Input contains invalid characters.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      let response;
      if (editMode) {
        const requestData = {
          operation: 'updateVehicleModel',
          modelData: {
            id: formData.id,
            name: sanitizedName,
            make_id: parseInt(formData.makeId),
            category_id: parseInt(formData.categoryId)
          }
        };
        response = await axios.post(`${encryptedUrl}update_master1.php`, 
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        const requestData = {
          operation: 'saveModelData',
          json: JSON.stringify({
            name: sanitizedName,
            category_id: parseInt(formData.categoryId),
            make_id: parseInt(formData.makeId)
          })
        };
        response = await axios.post(`${encryptedUrl}vehicle_master.php`, 
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      toast.dismiss();
      if (response.data.status === 'success') {
        toast.success(response.data.message);
        fetchModels();
        closeModal();
      } else {
        toast.error(response.data.message || 'Failed to update vehicle model.');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '', makeId: '', categoryId: '' });
  };

  const handleSearchChange = (e) => {
    const searchTerm = sanitizeInput(e.target.value.toLowerCase());
    setSearchTerm(searchTerm);
    const results = models.filter(model =>
      model.vehicle_model_name?.toLowerCase().includes(searchTerm) ||
      (model.vehicle_make_name?.toLowerCase().trim().includes(searchTerm) || "") ||
      (model.vehicle_category_name?.toLowerCase().trim().includes(searchTerm) || "")
    );
    setFilteredModels(results);
  };

  const handleAddModel = () => {
    setFormData({ id: '', name: '', makeId: '', categoryId: '' });
    setEditMode(false);
    setShowModal(true);
  };

  const handleRefresh = () => {
    fetchModels();
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
                Vehicle Models 
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-row items-center gap-2 w-full">
              <div className="flex-grow">
                <Input
                  placeholder="Search models by name"
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
                onClick={handleAddModel}
                className="bg-lime-900 hover:bg-green-600"
              >
                <span className="hidden sm:inline">Add Model</span>
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
                      <th scope="col" className="px-4 py-4" onClick={() => handleSort('vehicle_model_name')}>
                        <div className="flex items-center cursor-pointer">
                          MODEL NAME
                          {sortField === 'vehicle_model_name' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-4" onClick={() => handleSort('vehicle_make_name')}>
                        <div className="flex items-center cursor-pointer">
                          MAKE NAME
                          {sortField === 'vehicle_make_name' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-4" onClick={() => handleSort('vehicle_category_name')}>
                        <div className="flex items-center cursor-pointer">
                          CATEGORY
                          {sortField === 'vehicle_category_name' && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-4">
                        <div className="flex items-center">
                          ACTIONS
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels && filteredModels.length > 0 ? (
                      filteredModels
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((model) => (
                          <tr key={model.vehicle_model_id} className="bg-white border-b last:border-b-0 border-gray-200">
                            <td className="px-4 py-6">
                              <div className="flex items-center">
                                <span className="font-bold truncate block max-w-[140px]">{model.vehicle_model_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-6 font-medium">
                              {(model.vehicle_make_name?.trim() || "")}
                            </td>
                            <td className="px-4 py-6">
                              {(model.vehicle_category_name?.trim() || "")}
                            </td>
                            <td className="px-4 py-6">
                              <div className="flex justify-center space-x-2">
                                <Tooltip title="Edit Model">
                                  <Button
                                    shape="circle"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(model.vehicle_model_id)}
                                    size="large"
                                    className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                  />
                                </Tooltip>
                                {/* Delete button is disabled/commented out to prevent deletion */}
                                {/*
                                <Tooltip title="Delete Model">
                                  <Button
                                    shape="circle"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(model.vehicle_model_id)}
                                    size="large"
                                    className="shadow-lg flex items-center justify-center"
                                  />
                                </Tooltip>
                                */}
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                              <span className="text-gray-500 dark:text-gray-400">
                                No models found
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
                    total={filteredModels ? filteredModels.length : 0}
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

      {/* Add/Edit Vehicle Model Modal */}
      <Modal
        title={
          <div className="flex items-center">
          
            {editMode ? 'Edit Vehicle Model' : 'Add Vehicle Model'}
          </div>
        }
        open={showModal}
        onCancel={closeModal}
        okText={editMode ? 'Update' : 'Add'}
        onOk={handleSave}
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            label="Model Name" 
            required
          >
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter model name"
            />
          </Form.Item>
          <Form.Item 
            label="Select Make" 
            required
          >
            <select 
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500" 
              value={formData.makeId} 
              onChange={(e) => setFormData({ ...formData, makeId: e.target.value })}
            >
              <option value="">Select a make...</option>
              {makes.map((make) => (
                <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                  {make.vehicle_make_name}
                </option>
              ))}
            </select>
          </Form.Item>
          <Form.Item 
            label="Select Category" 
            required
          >
            <select 
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500" 
              value={formData.categoryId} 
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category.vehicle_category_id} value={category.vehicle_category_id}>
                  {category.vehicle_category_name}
                </option>
              ))}
            </select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirm Delete Modal is disabled/commented out */}
      {/*
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
          description={`Are you sure you want to delete this vehicle model? This action cannot be undone.`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      </Modal>
      */}

    </div>
  );
};

export default VehicleModels;