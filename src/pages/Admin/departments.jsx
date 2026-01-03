import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button, Modal, Form, Input, Tooltip, Empty, Pagination, Card, Drawer, Select } from 'antd';
import { toast } from 'sonner';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { FaBuilding } from 'react-icons/fa';
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../../utils/sanitize';
import { SecureStorage } from '../../utils/encryption';

const Departments = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '', department_type: 'Academic' });
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();

  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('departments_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const encryptedUrl = SecureStorage.getLocalItem("url");

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

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${encryptedUrl}Admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ operation: 'fetchDepartments' }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setDepartments(data.data);
      } else {
        console.error(data.message);
        toast.error("Failed to fetch departments");
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Please check your internet connection.');
      } else {
        toast.error("An error occurred while fetching departments");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => 
      dept.departments_name &&
      dept.departments_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  const handleEdit = (id) => {
    const departmentToEdit = departments.find((dept) => dept.departments_id === id);
    if (departmentToEdit) {
      setFormData({ 
        id: departmentToEdit.departments_id, 
        name: departmentToEdit.departments_name,
        department_type: departmentToEdit.department_type || 'Academic'
      });
      form.setFieldsValue({
        departmentName: departmentToEdit.departments_name,
        departmentType: departmentToEdit.department_type || 'Academic'
      });
      setEditMode(true);
      setShowModal(true);
    }
  };



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
      toast.error("Input contains invalid characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = 'Admin.php';
      const operation = editMode ? 'updateDepartment' : 'saveDepartmentData';
      // Include current user id for auditing
      const userId =
        SecureStorage.getSessionItem('user_id') ||
        SecureStorage.getLocalItem('user_id') || null;
      
      const requestBody = editMode 
        ? { operation, id: formData.id, name: sanitizedName, type: formData.department_type, userid: userId }
        : { operation, departments_name: sanitizedName, department_type: formData.department_type, userid: userId };

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
          setDepartments(departments.map(dept => dept.departments_id === formData.id ? { ...dept, departments_name: formData.name, department_type: formData.department_type } : dept));
        } else {
          if (data.data) {
            const newDepartment = {
              departments_id: data.data.departments_id,
              departments_name: sanitizedName,
              department_type: formData.department_type
            };
            setDepartments(prevDepartments => [...prevDepartments, newDepartment]);
          }
        }
        toast.success(editMode ? 'Department updated successfully!' : 'Department added successfully!');
        fetchDepartments(); // Refresh the list
        closeModal(); // Only close modal on success
      } else {
        toast.error(data.message || `Failed to ${editMode ? 'update' : 'add'} department.`);
        // Don't close modal on error - let user fix the issue
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'adding'} department:`, error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError' || !navigator.onLine) {
        toast.error('Network connection lost. Please check your internet connection.');
      } else {
        toast.error(`Error ${editMode ? 'updating' : 'adding'} department.`);
      }
      // Don't close modal on error - let user fix the issue
    } finally {
      setIsSubmitting(false);
      // Removed closeModal() from finally block
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '', department_type: 'Academic' });
    form.resetFields();
  };

  const handleAdd = () => {
    setFormData({ id: '', name: '', department_type: 'Academic' });
    setEditMode(false);
    form.resetFields();
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    Modal.confirm({
      title: 'Deactivate Department',
      content: 'Are you sure you want to deactivate this department? It will be moved to the archive.',
      okText: 'Yes, Deactivate',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;
          const response = await fetch(`${encryptedUrl}Admin.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operation: 'archiveCatalogItem',
              itemType: 'department',
              itemId: id,
              userid: userId
            }),
          });

          const data = await response.json();
          if (data.status === 'success') {
            toast.success('Department deactivated successfully!');
            fetchDepartments();
          } else {
            toast.error(data.message || 'Failed to deactivate department.');
          }
        } catch (error) {
          console.error('Error deactivating department:', error);
          if (error.message === 'Failed to fetch' || error.name === 'TypeError' || !navigator.onLine) {
            toast.error('Network connection lost. Please check your internet connection.');
          } else {
            toast.error('Error deactivating department.');
          }
        }
      },
    });
  };

  const handleRefresh = () => {
    fetchDepartments();
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
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Departments
              </h2>
            </div>
          </motion.div>

          {/* Search & Controls */}
          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  placeholder={isMobile ? "Search..." : "Search departments by name"}
                  allowClear
                  prefix={<SearchOutlined />}
                  size={isMobile ? "middle" : "large"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={handleAdd}
                  className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                >
                  <span className="hidden sm:inline">Add New Department</span>
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
                    {filteredDepartments && filteredDepartments.length > 0 ? (
                      filteredDepartments
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((department) => (
                          <Card
                            key={department.departments_id}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm"
                            size="small"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FaBuilding className="text-green-900 text-sm" />
                                  <span className="font-medium text-sm truncate max-w-[150px]">
                                    {department.departments_name}
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="small"
                                    type="primary"
                                    className="bg-green-900 hover:bg-lime-900"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(department.departments_id)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    danger
                                    icon={<StopOutlined />}
                                    onClick={() => handleDeactivate(department.departments_id)}
                                  >
                                    Deactivate
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {department.department_type || 'N/A'}
                                </span>
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
                              No departments found
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
                            onClick={() => handleSort('departments_name')}
                          >
                            <div className="flex items-center">
                              DEPARTMENT NAME
                              {sortField === 'departments_name' && (
                                <span className="ml-1">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                          <th scope="col" className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                            <div className="flex items-center">
                              DEPARTMENT TYPE
                            </div>
                          </th>
                          <th scope="col" className={isTablet ? 'px-3 py-3' : 'px-4 py-4'}>
                            <div className="flex items-center justify-center">
                              ACTIONS
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepartments && filteredDepartments.length > 0 ? (
                          filteredDepartments
                            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                            .map((department) => (
                              <tr key={department.departments_id} className="bg-white border-b last:border-b-0 border-gray-200">
                                <td className={isTablet ? 'px-3 py-4' : 'px-4 py-6'}>
                                  <div className="flex items-center">
                                    <FaBuilding className="mr-2 text-green-900" />
                                    <span className="font-bold truncate block max-w-[140px]">{department.departments_name}</span>
                                  </div>
                                </td>
                                <td className={isTablet ? 'px-3 py-4' : 'px-4 py-6'}>
                                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {department.department_type || 'N/A'}
                                  </span>
                                </td>
                                <td className={isTablet ? 'px-3 py-4' : 'px-4 py-6'}>
                                  <div className="flex justify-center space-x-2">
                                    <Tooltip title="Edit Department">
                                      <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(department.departments_id)}
                                        size={isTablet ? "middle" : "large"}
                                        className="bg-green-900 hover:bg-lime-900"
                                      />
                                    </Tooltip>
                                    <Tooltip title="Deactivate Department">
                                      <Button
                                        danger
                                        icon={<StopOutlined />}
                                        onClick={() => handleDeactivate(department.departments_id)}
                                        size={isTablet ? "middle" : "large"}
                                      />
                                    </Tooltip>
                                  </div>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                  <span className="text-gray-500 dark:text-gray-400">
                                    No departments found
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
                    total={filteredDepartments ? filteredDepartments.length : 0}
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

      {/* Add/Edit Department Modal */}
      {isMobile ? (
        <Drawer
          title={
            <div className="flex items-center">
              <FaBuilding className="mr-2 text-green-900" />
              {editMode ? 'Edit Department' : 'Add Department'}
            </div>
          }
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
        >
          <div style={{ paddingBottom: '120px' }}>
            <Form form={form} layout="vertical">
              <Form.Item 
                label="Department Name" 
                name="departmentName"
                rules={[
                  {
                    required: true,
                    message: 'Please enter department name!'
                  },
                  {
                    validator: (_, value) => {
                      if (value && value.trim() === '') {
                        toast.error('Department name cannot contain only whitespace!');
                        return Promise.reject(new Error('Department name cannot contain only whitespace!'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
                tooltip="Enter the department name"
              >
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter department name"
                  size="large"
                />
              </Form.Item>
              <Form.Item 
                label="Department Type" 
                name="departmentType"
                rules={[
                  {
                    required: true,
                    message: 'Please select department type!'
                  }
                ]}
                tooltip="Select the department type"
              >
                <Select
                  value={formData.department_type}
                  onChange={(value) => setFormData({ ...formData, department_type: value })}
                  placeholder="Select department type"
                  size="large"
                >
                  <Select.Option value="Academic">Academic</Select.Option>
                  <Select.Option value="Non-Academic">Non-Academic</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        </Drawer>
      ) : (
        <Modal
          title={
            <div className="flex items-center">
              <FaBuilding className="mr-2 text-green-900" />
              {editMode ? 'Edit Department' : 'Add Department'}
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
              label="Department Name" 
              name="departmentName"
              rules={[
                {
                  required: true,
                  message: 'Please enter department name!'
                },
                {
                  validator: (_, value) => {
                    if (value && value.trim() === '') {
                      toast.error('Department name cannot contain only whitespace!');
                      return Promise.reject(new Error('Department name cannot contain only whitespace!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
              tooltip="Enter the department name"
            >
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter department name"
              />
            </Form.Item>
            <Form.Item 
              label="Department Type" 
              name="departmentType"
              rules={[
                {
                  required: true,
                  message: 'Please select department type!'
                }
              ]}
              tooltip="Select the department type"
            >
              <Select
                value={formData.department_type}
                onChange={(value) => setFormData({ ...formData, department_type: value })}
                placeholder="Select department type"
              >
                <Select.Option value="Academic">Academic</Select.Option>
                <Select.Option value="Non-Academic">Non-Academic</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default Departments;