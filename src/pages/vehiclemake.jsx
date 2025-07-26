import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button, Modal, Form, Input, Tooltip, Empty, Pagination } from 'antd';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const VehicleMakes = () => {
  const navigate = useNavigate();
  const [makes, setMakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [showModal, setShowModal] = useState(false);  

  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('vehicle_make_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const encryptedUrl = SecureStorage.getLocalItem("url");

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [navigate]);



  const fetchMakes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${encryptedUrl}user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ operation: 'fetchMake' }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setMakes(data.data);
      } else {
        console.error(data.message);
        toast.error("Failed to fetch vehicle makes");
      }
    } catch (error) {
      console.error('Error fetching vehicle makes:', error);
      toast.error("An error occurred while fetching vehicle makes");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  useEffect(() => {
    fetchMakes();
  }, [fetchMakes]);

  const filteredMakes = useMemo(() => {
    return makes.filter(make => 
      make.vehicle_make_name &&
      make.vehicle_make_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [makes, searchTerm]);

  const handleEdit = (id) => {
    const makeToEdit = makes.find((make) => make.vehicle_make_id === id);
    if (makeToEdit) {
      setFormData({ id: makeToEdit.vehicle_make_id, name: makeToEdit.vehicle_make_name });
      setEditMode(true);
      setShowModal(true);
    }
  };

  // const handleDelete = (id) => {
  //   setSelectedMakeId(id);
  //   setShowConfirmDelete(true);
  // };

  // const confirmDelete = async () => {
  //   try {
  //     const response = await fetch(`${encryptedUrl}delete_master.php`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ 
  //         operation: 'deleteVehicleMake', 
  //         vehicleMakeId: selectedMakeId 
  //       }),
  //     });
  //
  //     const data = await response.json();
  //     if (data.status === 'success') {
  //       setMakes(makes.filter(make => make.vehicle_make_id !== selectedMakeId));
  //       toast.success('Vehicle make deleted successfully!');
  //     } else {
  //       toast.error(data.message || 'Failed to delete vehicle make.');
  //     }
  //   } catch (error) {
  //     console.error('Error deleting vehicle make:', error);
  //     toast.error('Error deleting vehicle make.');
  //   } finally {
  //     setShowConfirmDelete(false);
  //   }
  // };

  const handleAdd = () => {
    setFormData({ id: '', name: '' });
    setEditMode(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    const sanitizedName = sanitizeInput(formData.name);
    
    if (!sanitizedName.trim()) {
      toast.error("Please enter a make name.");
      return;
    }

    if (!validateInput(sanitizedName)) {
      toast.error("Input contains invalid characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = 'user.php';
      const operation = editMode ? 'updateVehicleMake' : 'saveMakeData';
      
      const requestBody = editMode 
        ? { operation, id: formData.id, name: sanitizedName }
        : { operation, vehicle_make_name: sanitizedName };

      const response = await fetch(`${encryptedUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.status === 'success') {
        if (editMode) {
          setMakes(makes.map(make => make.vehicle_make_id === formData.id ? { ...make, vehicle_make_name: formData.name } : make));
        } else {
          if (data.data) {
            const newMake = {
              vehicle_make_id: data.data.vehicle_make_id,
              vehicle_make_name: sanitizedName
            };
            setMakes(prevMakes => [...prevMakes, newMake]);
          }
        }
        toast.success(editMode ? 'Vehicle make updated successfully!' : 'Vehicle make added successfully!');
        fetchMakes(); // Refresh the list
        closeModal(); // Only close modal on success
      } else {
        toast.error(data.message || `Failed to ${editMode ? 'update' : 'add'} vehicle make.`);
        // Don't close modal on error - let user fix the issue
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'adding'} vehicle make:`, error);
      toast.error(`Error ${editMode ? 'updating' : 'adding'} vehicle make.`);
      // Don't close modal on error - let user fix the issue
    } finally {
      setIsSubmitting(false);
      // Removed closeModal() from finally block
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '' });
  };

  const handleRefresh = () => {
    fetchMakes();
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
                Vehicle Makes
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-row items-center gap-2 w-full">
              <div className="flex-grow">
                <Input
                  placeholder="Search makes by name"
                  allowClear
                  prefix={<SearchOutlined />}
                  size="large"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                onClick={handleAdd}
                className="bg-lime-900 hover:bg-green-600"
              >
                <span className="hidden sm:inline">Add Make</span>
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
                      <th scope="col" className="px-4 py-4">
                        <div className="flex items-center">
                          ACTIONS
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMakes && filteredMakes.length > 0 ? (
                      filteredMakes
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((make) => (
                          <tr key={make.vehicle_make_id} className="bg-white border-b last:border-b-0 border-gray-200">
                            <td className="px-4 py-6">
                              <div className="flex items-center">
                                <span className="font-bold truncate block max-w-[140px]">{make.vehicle_make_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-6">
                              <div className="flex justify-center space-x-2">
                                <Tooltip title="Edit Make">
                                  <Button
                                    shape="circle"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(make.vehicle_make_id)}
                                    size="large"
                                    className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                  />
                                </Tooltip>
                                {/*
                                <Tooltip title="Delete Make">
                                  <Button
                                    shape="circle"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(make.vehicle_make_id)}
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
                        <td colSpan={2} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                              <span className="text-gray-500 dark:text-gray-400">
                                No makes found
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
                    total={filteredMakes ? filteredMakes.length : 0}
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

      {/* Add/Edit Vehicle Make Modal */}
      <Modal
        title={
          <div className="flex items-center">
        
            {editMode ? 'Edit Vehicle Make' : 'Add Vehicle Make'}
          </div>
        }
        open={showModal}
        onCancel={closeModal}
        okText={editMode ? 'Update' : 'Add'}
        onOk={handleSave}
        confirmLoading={isSubmitting}
      >
        <Form layout="vertical">
          <Form.Item 
            label="Name" 
            required
            tooltip="Enter the vehicle make name"
          >
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter make name"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirm Delete Modal */}
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
            onClick={confirmDelete}
            icon={<DeleteOutlined />}
          >
            Delete
          </Button>,
        ]}
      >
        <div className="text-yellow-600 flex items-center mb-4">
          <ExclamationCircleOutlined className="mr-2 text-yellow-600" />
          <span>Warning</span>
        </div>
        <p>Are you sure you want to delete this vehicle make?</p>
        <p className="text-gray-500 text-sm mt-2">This action cannot be undone.</p>
      </Modal>
      */}

    
    </div>
  );
};

export default VehicleMakes;