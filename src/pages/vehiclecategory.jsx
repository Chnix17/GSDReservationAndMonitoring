<<<<<<< HEAD
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Table,
  Tag,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CarOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { sanitizeInput, validateInput } from "../utils/sanitize";
import { SecureStorage } from "../utils/encryption";
import Sidebar from "./Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Search } = Input;
=======
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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f

const VehicleCategories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [form] = Form.useForm();
  const [sortField, setSortField] = useState("vehicle_category_created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();

  const user_level_id = SecureStorage.getSessionItem("user_level_id");
=======
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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
  const encryptedUrl = SecureStorage.getLocalItem("url");
  const [form] = Form.useForm();

  useEffect(() => {
<<<<<<< HEAD
    if (
      user_level_id !== "1" &&
      user_level_id !== "2" &&
      user_level_id !== "4"
    ) {
=======
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
      localStorage.clear();
      navigate("/gsd");
    }
  }, [user_level_id, navigate]);


<<<<<<< HEAD
  useEffect(() => {
    const filtered = categories.filter(
      (category) =>
        category.vehicle_category_name &&
        category.vehicle_category_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
=======

  const fetchCategories = useCallback(async () => {
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchVehicleCategories" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
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
  }, [encryptedUrl]);
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleCategoryNameChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    if (!validateInput(sanitized)) {
      toast.error(
        "Invalid input detected. Please avoid special characters and scripts."
      );
      return;
    }
    setNewCategoryName(sanitized);
    form.setFieldsValue({ categoryName: sanitized });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!validateInput(newCategoryName)) {
        toast.error("Category name contains invalid characters.");
        return;
      }

      const user_admin_id = SecureStorage.getSessionItem("user_id");
      const user_level = SecureStorage.getSessionItem("user_level_id");

      const requestData = editingCategory
        ? {
            operation: "updateVehicleCategory",
            categoryData: {
              categoryId: editingCategory.vehicle_category_id,
              name: newCategoryName,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          }
        : {
            operation: "saveVehicleCategory",
            data: {
              name: newCategoryName,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          };

      const url = editingCategory
        ? `${encryptedUrl}/update_master1.php`
        : `${encryptedUrl}/insert_master.php`;

      setLoading(true);
      const response = await axios.post(url, JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.status === "success") {
        toast.success(
          `Category successfully ${editingCategory ? "updated" : "added"}!`
        );
        fetchCategories();
        resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      } else {
        toast.error(
          `Failed to ${editingCategory ? "update" : "add"} category: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${
          editingCategory ? "updating" : "adding"
        } category.`
      );
      console.error("Error saving category:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewCategoryName("");
    setEditingCategory(null);
    form.resetFields();
  };

  const handleEditClick = async (category) => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        {
          operation: "fetchVehicleCategoryById",
          id: category.vehicle_category_id,
        },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        const categoryData = response.data.data[0];
        setNewCategoryName(categoryData.vehicle_category_name);
        setEditingCategory(categoryData);

        form.setFieldsValue({
          categoryName: categoryData.vehicle_category_name,
        });

        setIsEditModalOpen(true);
      } else {
        toast.error(
          "Error fetching category details: " + response.data.message
        );
      }
    } catch (error) {
      toast.error("An error occurred while fetching category details.");
      console.error("Error fetching category details:", error);
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    const requestData = {
      operation: "archiveResource",
      resourceType: "vehicle_category",
      resourceId: categoryToDelete.vehicle_category_id,
    };

    setLoading(true);
    try {
<<<<<<< HEAD
      const response = await axios.post(
        `${encryptedUrl}/delete_master.php`,
        JSON.stringify(requestData),
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "success") {
        toast.success("Category archived successfully!");
=======
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
  
  const handleSave = async () => {
    const sanitizedName = sanitizeInput(formData.name);
    
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
      const endpoint = editMode ? 'update_master1.php' : 'vehicle_master.php';
      const requestData = editMode ? {
        operation: 'updateVehicleCategory',
        id: formData.id,
        name: sanitizedName
      } : {
        operation: 'saveCategoryData',
        json: JSON.stringify({
          vehicle_category_name: sanitizedName
        })
      };

      const response = await axios.post(`${encryptedUrl}${endpoint}`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data.status === 'success') {
        toast.success(editMode ? 'Vehicle category updated successfully!' : 'Vehicle category added successfully!');
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
        fetchCategories();
      } else {
        toast.error("Failed to archive category: " + response.data.message);
      }
    } catch (error) {
      toast.error(
        "An error occurred while archiving category: " + error.message
      );
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleRefresh = () => {
    fetchCategories();
  };

<<<<<<< HEAD
  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-1">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder="Search category by name"
              allowClear
              enterButton={<SearchOutlined />}
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
              className="bg-[#334e33] hover:bg-[#273e24] text-white"
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#145414] hover:bg-[#538c4c]"
          >
            Add Category
          </Button>
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      title: "Category Name",
      dataIndex: "vehicle_category_name",
      key: "vehicle_category_name",
      sorter: true,
      sortOrder: sortField === "vehicle_category_name" ? sortOrder : null,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "ID",
      dataIndex: "vehicle_category_id",
      key: "vehicle_category_id",
      sorter: true,
      sortOrder: sortField === "vehicle_category_id" ? sortOrder : null,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      sortOrder: sortField === "status" ? sortOrder : null,
      render: (_, record) => (
        <Tag
          color={record.status_availability_id === "1" ? "green" : "red"}
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {record.status_availability_id === "1"
            ? "Available"
            : "Not Available"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "vehicle_category_created_at",
      key: "created_at",
      sorter: true,
      sortOrder: sortField === "vehicle_category_created_at" ? sortOrder : null,
      render: (text) => dayjs(text).format("MMM D, YYYY HH:mm"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditClick(record)}
              className="bg-[#2f7126] hover:bg-[#145414] text-white"
            />
          </Tooltip>
          <Tooltip title="Archive">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteClick(record)}
              className="hover:bg-red-600"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto ">
        <div className="p-[2.5rem] lg:p-12 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4">
              <CarOutlined className="text-[#1c511c] text-4xl" />
              <h2 className="text-4xl font-bold text-[#145414] m-0">
                Vehicle Categories
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <EnhancedFilters />

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
            <table className="w-full text-sm text-left rtl:text-right text-gray-700">
              <thead className="text-xs text-white uppercase bg-[#145414]">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3"
                      onClick={() =>
                        column.sorter && handleSort(column.dataIndex)
                      }
                    >
                      <div className="flex items-center cursor-pointer hover:text-[#83b383]">
                        {column.title}
                        {sortField === column.dataIndex && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.vehicle_category_id}
                        className="bg-white border-b border-gray-200 hover:bg-[#d4f4dc]"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.vehicle_category_id}-${column.key}`}
                            className="px-6 py-4"
                          >
                            {column.render
                              ? column.render(record[column.dataIndex], record)
                              : record[column.dataIndex]}
                          </td>
                        ))}
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-24 text-center"
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className="text-gray-500">
                            No categories found
                          </span>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Always show pagination, even when empty */}
            <div className="p-4 border-t border-gray-200">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredCategories.length}
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
          </div>

          {/* Add/Edit Modal */}
          <Modal
            title={editingCategory ? "Edit Category" : "Add Category"}
            open={isAddModalOpen || isEditModalOpen}
            onCancel={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              resetForm();
            }}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={700}
            okButtonProps={{
              className: "bg-[#145414] hover:bg-[#538c4c] text-white",
            }}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                categoryName: newCategoryName,
              }}
            >
              <Form.Item
                label="Category Name"
                name="categoryName"
                rules={[
                  {
                    required: true,
                    message: "Please input category name!",
                  },
                ]}
              >
                <Input
                  placeholder="Enter category name"
                  onChange={handleCategoryNameChange}
                />
              </Form.Item>
            </Form>
          </Modal>
=======
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
        onOk={handleSave}
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical">
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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f

          {/* Delete Confirmation Modal */}
          <Modal
            title="Confirm Archive"
            open={isDeleteModalOpen}
            onCancel={() => setIsDeleteModalOpen(false)}
            footer={[
              <Button key="back" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                danger
                loading={loading}
                onClick={confirmDelete}
                icon={<DeleteOutlined />}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Archive
              </Button>,
            ]}
          >
            <Alert
              message="Warning"
              description={`Are you sure you want to archive "${categoryToDelete?.vehicle_category_name}"? This action cannot be undone.`}
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default VehicleCategories;