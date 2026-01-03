import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Form, Tooltip, Input, Pagination, Empty, Select, Card, Drawer } from 'antd';
import { toast } from 'sonner';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../../utils/sanitize';
import { SecureStorage } from '../../utils/encryption';
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { FaCar } from 'react-icons/fa';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const VehicleModels = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

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

  // Update page size based on screen size
  useEffect(() => {
    if (isMobile) {
      setPageSize(5);
    } else if (isTablet) {
      setPageSize(8);
    } else {
      setPageSize(10);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        navigate('/');
    }
  }, [navigate]);



  const fetchMakes = useCallback(async () => {
    try {
      const response = await axios.post(
        `${encryptedUrl}Admin.php`,
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
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
        toast.error('Network connection lost. Please check your internet connection.');
      } else {
        toast.error('Error fetching makes.');
      }
    }
  }, [encryptedUrl ]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.post(`${encryptedUrl}Admin.php`, 
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
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
        toast.error('Network connection lost. Please check your internet connection.');
      } else {
        toast.error('Error fetching categories.');
      }
    }
  },[encryptedUrl]);

  const fetchModels = useCallback(async() => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}Admin.php`, 
        new URLSearchParams({ operation: 'fetchModels' })
      );
      if (response.data.status === 'success') {
        setModels(response.data.data);
        setFilteredModels(response.data.data);
      } else {
        // toast.error(`Error fetching models: ${response.data.message}`); // Removed to prevent double toast
      }
    } catch (error) {
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
        toast.dismiss();
        toast.error('Network connection lost. Please check your internet connection.');
      }
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
      const response = await axios.post(`${encryptedUrl}Admin.php`,
        `operation=fetchModelById&id=${id}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data.status === 'success' && response.data.data.length > 0) {
        const modelData = response.data.data[0];
        
        const newFormData = {
          id: modelData.vehicle_model_id,
          name: modelData.vehicle_model_name?.trim() || "",
          makeId: makes.find(make => make.vehicle_make_name?.trim() === modelData.vehicle_make_name?.trim())?.vehicle_make_id || '',
          categoryId: categories.find(category => category.vehicle_category_name?.trim() === modelData.vehicle_category_name?.trim())?.vehicle_category_id || ''
        };
        
        setFormData(newFormData);
        
        // Set form fields for Antd Form validation
        form.setFieldsValue({
          modelName: newFormData.name,
          makeId: newFormData.makeId ? String(newFormData.makeId) : undefined,
          categoryId: newFormData.categoryId ? String(newFormData.categoryId) : undefined
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
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
        toast.error('Network connection lost. Please check your internet connection.');
      } else {
        toast.error('Error fetching vehicle model details.');
      }
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
//     toast.error('Error deleting vehicle model.');
//   } finally {
//     setShowConfirmDelete(false);
//   }
// };

  const handleSave = async () => {
    try {
      // Validate form fields using Antd Form validation
      await form.validateFields();
    } catch (error) {
      // Form validation failed, errors are already shown
      return;
    }

    const sanitizedName = sanitizeInput(formData.name);
    
    if (!validateInput(sanitizedName)) {
      toast.dismiss();
      toast.error("Input contains invalid characters.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Include current user id for auditing
      const userId =
        SecureStorage.getSessionItem('user_id') ||
        SecureStorage.getLocalItem('user_id') || null;
      let response;
      if (editMode) {
        const requestData = {
          operation: 'updateVehicleModel',
          userid: userId,
          modelData: {
            id: formData.id,
            name: sanitizedName,
            make_id: parseInt(formData.makeId),
            category_id: parseInt(formData.categoryId)
          }
        };
        response = await axios.post(`${encryptedUrl}Admin.php`, 
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
          name: sanitizedName,
          category_id: parseInt(formData.categoryId),
          make_id: parseInt(formData.makeId),
          userid: userId
        };
        response = await axios.post(`${encryptedUrl}Admin.php`, 
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
      toast.dismiss();
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
        toast.error('Network connection lost. Please check your internet connection.');
      } else {
        toast.error('Failed to save vehicle model.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '', makeId: '', categoryId: '' });
    form.resetFields();
  };

  const handleDeactivate = async (id) => {
    Modal.confirm({
      title: 'Deactivate Vehicle Model',
      content: 'Are you sure you want to deactivate this vehicle model? It will be moved to the archive.',
      okText: 'Yes, Deactivate',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;
          const response = await axios.post(`${encryptedUrl}Admin.php`, {
            operation: 'archiveCatalogItem',
            itemType: 'vehicle_model',
            itemId: id,
            userid: userId
          });

          if (response.data.status === 'success') {
            toast.success('Vehicle model deactivated successfully!');
            fetchModels();
          } else {
            toast.error(response.data.message || 'Failed to deactivate vehicle model.');
          }
        } catch (error) {
          console.error('Error deactivating vehicle model:', error);
          if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
            toast.error('Network connection lost. Please check your internet connection.');
          } else {
            toast.error('Error deactivating vehicle model.');
          }
        }
      },
    });
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
    form.resetFields();
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
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      
      <div className={`flex-grow overflow-y-auto`}>
        <div className={`${isMobile ? 'px-4 py-4 mt-15' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4 mt-mt-10">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Vehicle Models 
              </h2>
            </div>
          </motion.div>

          {/* Search & Controls */}
          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  placeholder={isMobile ? "Search..." : "Search models by name"}
                  allowClear
                  prefix={<SearchOutlined />}
                  size={isMobile ? "middle" : "large"}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full"
                />
              </div>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-wrap gap-2' : 'gap-2'}`}>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size={isMobile ? "middle" : "large"}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {isMobile && 'Refresh'}
                  </Button>
                </Tooltip>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size={isMobile ? "middle" : "large"}
                  onClick={handleAddModel}
                  className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                >
                  <span className="hidden sm:inline">Add Model</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>
          </div>

          <div className={`relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100`}>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                {isMobile ? (
                  // Mobile Card View
                  <div className="space-y-3 p-3">
                    {filteredModels && filteredModels.length > 0 ? (
                      filteredModels
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((model) => (
                          <Card
                            key={model.vehicle_model_id}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm"
                            size="small"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FaCar className="text-green-900 text-sm" />
                                  <span className="font-medium text-sm truncate max-w-[150px]">
                                    {model.vehicle_model_name}
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="small"
                                    type="primary"
                                    className="bg-green-900 hover:bg-lime-900"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(model.vehicle_model_id)}
                                  />
                                  <Button
                                    size="small"
                                    danger
                                    icon={<StopOutlined />}
                                    onClick={() => handleDeactivate(model.vehicle_model_id)}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Make:</span>
                                <span className="text-xs text-gray-700">{model.vehicle_make_name?.trim() || ""}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Category:</span>
                                <span className="text-xs text-gray-700">{model.vehicle_category_name?.trim() || ""}</span>
                              </div>
                            </div>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-gray-500">
                              No models found
                            </span>
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Desktop/Tablet Table View
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                      <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                        <tr>
                          <th 
                            scope="col" 
                            className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`}
                            onClick={() => handleSort('vehicle_model_name')}
                          >
                            <div className="flex items-center">
                              MODEL NAME
                              {sortField === 'vehicle_model_name' && (
                                <span className="ml-1">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`}
                            onClick={() => handleSort('vehicle_make_name')}
                          >
                            <div className="flex items-center">
                              MAKE NAME
                              {sortField === 'vehicle_make_name' && (
                                <span className="ml-1">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                          {!isTablet && (
                            <th 
                              scope="col" 
                              className="px-4 py-4 cursor-pointer"
                              onClick={() => handleSort('vehicle_category_name')}
                            >
                              <div className="flex items-center">
                                CATEGORY
                                {sortField === 'vehicle_category_name' && (
                                  <span className="ml-1">
                                    {sortOrder === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                              </div>
                            </th>
                          )}
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} text-center`}>
                            <div className="flex items-center justify-center">
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
                                <td className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                                  <div className="flex items-center">
                                    <span className="font-bold truncate block max-w-[140px]">{model.vehicle_model_name}</span>
                                  </div>
                                </td>
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} font-medium`}>
                                  {(model.vehicle_make_name?.trim() || "")}
                                </td>
                                {!isTablet && (
                                  <td className="px-4 py-4">
                                    {(model.vehicle_category_name?.trim() || "")}
                                  </td>
                                )}
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} text-center`}>
                                  <div className="flex items-center justify-center space-x-2 w-full">
                                    <Tooltip title="Edit Model">
                                      <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(model.vehicle_model_id)}
                                        size={isTablet ? "middle" : "large"}
                                        className="bg-green-900 hover:bg-lime-900"
                                      />
                                    </Tooltip>
                                    <Tooltip title="Deactivate Model">
                                      <Button
                                        danger
                                        icon={<StopOutlined />}
                                        onClick={() => handleDeactivate(model.vehicle_model_id)}
                                        size={isTablet ? "middle" : "large"}
                                      />
                                    </Tooltip>
                                  </div>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={isTablet ? 3 : 4} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
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
                  </div>
                )}

                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredModels ? filteredModels.length : 0}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger={!isMobile}
                    showTotal={!isMobile ? (total, range) =>
                      `${range[0]}-${range[1]} of ${total} items` : false
                    }
                    size={isMobile ? "small" : "default"}
                    className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                    simple={isMobile}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Vehicle Model Modal/Drawer */}
      {isMobile ? (
        <Drawer
          title={editMode ? 'Edit Vehicle Model' : 'Add Vehicle Model'}
          placement="bottom"
          height="90%"
          open={showModal}
          onClose={closeModal}
          footer={
            <div className="flex flex-col gap-2 p-4">
              <Button
                type="primary"
                onClick={handleSave}
                loading={isSubmitting}
                block
                size="large"
                className="bg-green-900 hover:bg-lime-900"
              >
                {editMode ? 'Update' : 'Add'}
              </Button>
              <Button
                onClick={closeModal}
                block
                size="large"
              >
                Cancel
              </Button>
            </div>
          }
          bodyStyle={{ paddingBottom: '120px' }}
        >
          <Form form={form} layout="vertical">
            <Form.Item 
              label="Model Name" 
              name="modelName"
              rules={[
                {
                  required: true,
                  message: 'Please enter model name!'
                },
                {
                  validator: (_, value) => {
                    if (value && value.trim() === '') {
                      toast.error('Model name cannot contain only whitespace!');
                      return Promise.reject(new Error('Model name cannot contain only whitespace!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter model name"
                size="large"
              />
            </Form.Item>
            <Form.Item 
              label="Select Make" 
              name="makeId"
              rules={[
                {
                  required: true,
                  message: 'Please select a make!'
                }
              ]}
            >
              <Select
                showSearch
                placeholder="Select a make..."
                optionFilterProp="children"
                className="w-full"
                size="large"
                value={formData.makeId ? String(formData.makeId) : undefined}
                onChange={(value) => setFormData({ ...formData, makeId: value })}
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {makes.map((make) => (
                  <Select.Option key={make.vehicle_make_id} value={String(make.vehicle_make_id)}>
                    {make.vehicle_make_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              label="Select Category" 
              name="categoryId"
              rules={[
                {
                  required: true,
                  message: 'Please select a category!'
                }
              ]}
            >
              <Select
                showSearch
                placeholder="Select a category..."
                optionFilterProp="children"
                className="w-full"
                size="large"
                value={formData.categoryId ? String(formData.categoryId) : undefined}
                onChange={(value) => setFormData({ ...formData, categoryId: value })}
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {categories.map((category) => (
                  <Select.Option key={category.vehicle_category_id} value={String(category.vehicle_category_id)}>
                    {category.vehicle_category_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Drawer>
      ) : (
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
          width={isTablet ? 700 : 800}
        >
          <Form form={form} layout="vertical">
            <Form.Item 
              label="Model Name" 
              name="modelName"
              rules={[
                {
                  required: true,
                  message: 'Please enter model name!'
                },
                {
                  validator: (_, value) => {
                    if (value && value.trim() === '') {
                      toast.error('Model name cannot contain only whitespace!');
                      return Promise.reject(new Error('Model name cannot contain only whitespace!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter model name"
              />
            </Form.Item>
            <Form.Item 
              label="Select Make" 
              name="makeId"
              rules={[
                {
                  required: true,
                  message: 'Please select a make!'
                }
              ]}
            >
              <Select
                showSearch
                placeholder="Select a make..."
                optionFilterProp="children"
                className="w-full"
                value={formData.makeId ? String(formData.makeId) : undefined}
                onChange={(value) => setFormData({ ...formData, makeId: value })}
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {makes.map((make) => (
                  <Select.Option key={make.vehicle_make_id} value={String(make.vehicle_make_id)}>
                    {make.vehicle_make_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              label="Select Category" 
              name="categoryId"
              rules={[
                {
                  required: true,
                  message: 'Please select a category!'
                }
              ]}
            >
              <Select
                showSearch
                placeholder="Select a category..."
                optionFilterProp="children"
                className="w-full"
                value={formData.categoryId ? String(formData.categoryId) : undefined}
                onChange={(value) => setFormData({ ...formData, categoryId: value })}
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {categories.map((category) => (
                  <Select.Option key={category.vehicle_category_id} value={String(category.vehicle_category_id)}>
                    {category.vehicle_category_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      )}

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