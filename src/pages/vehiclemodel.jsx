<<<<<<< HEAD
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
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
  ArrowLeftOutlined,
  BankOutlined,
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
const { Option } = Select;
=======
import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Form, Tooltip, Input,  Pagination, Empty, Alert } from 'antd';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f

const VehicleModels = () => {
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [makes, setMakes] = useState([]);
  const [categories, setCategories] = useState([]);
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [selectedMake, setSelectedMake] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [modelToDelete, setModelToDelete] = useState(null);
  const [form] = Form.useForm();
  const [sortField, setSortField] = useState("vehicle_model_created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();

  const user_level_id = SecureStorage.getSessionItem("user_level_id");
=======
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '', makeId: '', categoryId: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('vehicle_model_id');
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
      localStorage.clear();
      navigate("/gsd");
=======
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    }
  }, [user_level_id, navigate]);


<<<<<<< HEAD
  useEffect(() => {
    const filtered = models.filter(
      (model) =>
        (model.vehicle_model_name &&
          model.vehicle_model_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (model.vehicle_make_name &&
          model.vehicle_make_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (model.vehicle_category_name &&
          model.vehicle_category_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );
    setFilteredModels(filtered);
    setCurrentPage(1);
  }, [searchTerm, models]);
=======

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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f

  const fetchModels = useCallback(async() => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchModels" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        setModels(response.data.data);
      } else {
<<<<<<< HEAD
        toast.error("Error fetching models: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("An error occurred while fetching models.");
=======
        // toast.error(`Error fetching models: ${response.data.message}`); // Removed to prevent double toast
      }
    } catch (error) {
      // toast.error('Error fetching vehicle models.'); // Removed to prevent double toast
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    } finally {
      setLoading(false);
    }
  },[encryptedUrl]);

  useEffect(() => {
    fetchModels();
    fetchMakes();
    fetchCategories();
  }, [fetchModels, fetchMakes, fetchCategories]);

  const fetchMakes = async () => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchMake" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
<<<<<<< HEAD
      if (response.data.status === "success") {
        setMakes(response.data.data);
      } else {
        toast.error("Error fetching makes: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching makes:", error);
      toast.error("Error fetching makes.");
=======

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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    }
  };

  const fetchCategories = async () => {
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
      toast.error("Error fetching categories.");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleModelNameChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    if (!validateInput(sanitized)) {
      toast.error(
        "Invalid input detected. Please avoid special characters and scripts."
      );
      return;
    }
    setNewModelName(sanitized);
    form.setFieldsValue({ modelName: sanitized });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!validateInput(newModelName) || !selectedMake || !selectedCategory) {
        toast.error("Please fill all fields with valid values.");
        return;
      }

      const user_admin_id = SecureStorage.getSessionItem("user_id");
      const user_level = SecureStorage.getSessionItem("user_level_id");

      const requestData = editingModel
        ? {
            operation: "updateVehicleModel",
            modelData: {
              id: editingModel.vehicle_model_id,
              name: newModelName,
              make_id: selectedMake,
              category_id: selectedCategory,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          }
        : {
            operation: "saveVehicleModel",
            data: {
              name: newModelName,
              make_id: selectedMake,
              category_id: selectedCategory,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          };

      const url = editingModel
        ? `${encryptedUrl}/update_master1.php`
        : `${encryptedUrl}/insert_master.php`;

      setLoading(true);
      const response = await axios.post(url, JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.status === "success") {
        toast.success(
          `Model successfully ${editingModel ? "updated" : "added"}!`
        );
        fetchModels();
        resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      } else {
        toast.error(
          `Failed to ${editingModel ? "update" : "add"} model: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${editingModel ? "updating" : "adding"} model.`
      );
      console.error("Error saving model:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewModelName("");
    setSelectedMake(null);
    setSelectedCategory(null);
    setEditingModel(null);
    form.resetFields();
  };

  const handleEditClick = async (model) => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        {
          operation: "fetchModelById",
          id: model.vehicle_model_id,
        },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        const modelData = response.data.data[0];
        setNewModelName(modelData.vehicle_model_name);
        setSelectedMake(
          makes.find(
            (make) => make.vehicle_make_name === modelData.vehicle_make_name
          )?.vehicle_make_id
        );
        setSelectedCategory(
          categories.find(
            (category) =>
              category.vehicle_category_name === modelData.vehicle_category_name
          )?.vehicle_category_id
        );
        setEditingModel(modelData);

        form.setFieldsValue({
          modelName: modelData.vehicle_model_name,
          makeId: modelData.vehicle_make_id,
          categoryId: modelData.vehicle_category_id,
        });

        setIsEditModalOpen(true);
      } else {
        toast.error("Error fetching model details: " + response.data.message);
      }
    } catch (error) {
      toast.error("An error occurred while fetching model details.");
      console.error("Error fetching model details:", error);
    }
  };

  const handleDeleteClick = (model) => {
    setModelToDelete(model);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!modelToDelete) return;

    const requestData = {
      operation: "archiveResource",
      resourceType: "vehicle_model",
      resourceId: modelToDelete.vehicle_model_id,
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
        toast.success("Model archived successfully!");
=======
      const response = await axios.post(`${encryptedUrl}delete_master.php`, 
        {
          operation: 'deleteModel',
          modelId: selectedModelId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.status === 'success') {
        setModels(models.filter(model => model.vehicle_model_id !== selectedModelId));
        setFilteredModels(filteredModels.filter(model => model.vehicle_model_id !== selectedModelId));
        toast.dismiss();
        toast.success('Vehicle model deleted successfully!');
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Failed to delete vehicle model.');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Error deleting vehicle model.');
    } finally {
      setShowConfirmDelete(false);
    }
  };

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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
        fetchModels();
      } else {
        toast.error("Failed to archive model: " + response.data.message);
      }
    } catch (error) {
<<<<<<< HEAD
      toast.error("An error occurred while archiving model: " + error.message);
=======
      console.error('Error:', error);
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setModelToDelete(null);
    }
  };

<<<<<<< HEAD
  const handleRefresh = () => {
    fetchModels();
  };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-1">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder="Search model by name, make, or category"
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
            Add Model
          </Button>
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      title: "Model Name",
      dataIndex: "vehicle_model_name",
      key: "vehicle_model_name",
      sorter: true,
      sortOrder: sortField === "vehicle_model_name" ? sortOrder : null,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Make",
      dataIndex: "vehicle_make_name",
      key: "vehicle_make_name",
      sorter: true,
      sortOrder: sortField === "vehicle_make_name" ? sortOrder : null,
    },
    {
      title: "Category",
      dataIndex: "vehicle_category_name",
      key: "vehicle_category_name",
      sorter: true,
      sortOrder: sortField === "vehicle_category_name" ? sortOrder : null,
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
      dataIndex: "vehicle_model_created_at",
      key: "created_at",
      sorter: true,
      sortOrder: sortField === "vehicle_model_created_at" ? sortOrder : null,
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
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/Master")}
                className="flex items-center text-[#145414] hover:bg-[#f0f0f0]"
              >
                Back to Master
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <CarOutlined className="text-[#1c511c] text-4xl" />
              <h2 className="text-4xl font-bold text-[#145414] m-0">
                Vehicle Models
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
                {filteredModels.length > 0 ? (
                  filteredModels
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.vehicle_model_id}
                        className="bg-white border-b border-gray-200 hover:bg-[#d4f4dc]"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.vehicle_model_id}-${column.key}`}
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
                          <span className="text-gray-500">No models found</span>
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
                total={filteredModels.length}
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
            title={editingModel ? "Edit Model" : "Add Model"}
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
                modelName: newModelName,
                makeId: selectedMake,
                categoryId: selectedCategory,
              }}
            >
              <Form.Item
                label="Model Name"
                name="modelName"
                rules={[
                  {
                    required: true,
                    message: "Please input model name!",
                  },
                ]}
              >
                <Input
                  placeholder="Enter model name"
                  onChange={handleModelNameChange}
                />
              </Form.Item>
              <Form.Item
                label="Make"
                name="makeId"
                rules={[
                  {
                    required: true,
                    message: "Please select a make!",
                  },
                ]}
              >
                <Select
                  placeholder="Select a make"
                  onChange={(value) => setSelectedMake(value)}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {makes.map((make) => (
                    <Option
                      key={make.vehicle_make_id}
                      value={make.vehicle_make_id}
                    >
                      {make.vehicle_make_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="Category"
                name="categoryId"
                rules={[
                  {
                    required: true,
                    message: "Please select a category!",
                  },
                ]}
              >
                <Select
                  placeholder="Select a category"
                  onChange={(value) => setSelectedCategory(value)}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {categories.map((category) => (
                    <Option
                      key={category.vehicle_category_id}
                      value={category.vehicle_category_id}
                    >
                      {category.vehicle_category_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Modal>

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
              description={`Are you sure you want to archive "${modelToDelete?.vehicle_model_name}"? This action cannot be undone.`}
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
          </Modal>
        </div>
      </div>
=======
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
          description={`Are you sure you want to delete this vehicle model? This action cannot be undone.`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      </Modal>

>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    </div>
  );
};

export default VehicleModels;