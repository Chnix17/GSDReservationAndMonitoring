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
  ArrowLeftOutlined,
  CarOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
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
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button, Modal, Form, Input, Tooltip, Empty, Pagination } from 'antd';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f

const VehicleMakes = () => {
  const [makes, setMakes] = useState([]);
<<<<<<< HEAD
  const [filteredMakes, setFilteredMakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newMakeName, setNewMakeName] = useState("");
  const [editingMake, setEditingMake] = useState(null);
  const [makeToDelete, setMakeToDelete] = useState(null);
  const [form] = Form.useForm();
  const [sortField, setSortField] = useState("vehicle_make_created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();

  const user_level_id = SecureStorage.getSessionItem("user_level_id");
  const encryptedUrl = SecureStorage.getLocalItem("url");

  useEffect(() => {
    if (
      user_level_id !== "1" &&
      user_level_id !== "2" &&
      user_level_id !== "4"
    ) {
      localStorage.clear();
      navigate("/gsd");
=======
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [showModal, setShowModal] = useState(false);  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedMakeId, setSelectedMakeId] = useState(null);
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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    }
  }, [user_level_id, navigate]);

<<<<<<< HEAD
  useEffect(() => {
    fetchMakes();
  }, []);

  useEffect(() => {
    const filtered = makes.filter(
      (make) =>
        make.vehicle_make_name &&
        make.vehicle_make_name.toLowerCase().includes(searchTerm.toLowerCase())
=======


  const fetchMakes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${encryptedUrl}fetchMaster.php`, {
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
      make.vehicle_make_name.toLowerCase().includes(searchTerm.toLowerCase())
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    );
    setFilteredMakes(filtered);
    setCurrentPage(1);
  }, [searchTerm, makes]);

  const fetchMakes = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchMake" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        setMakes(response.data.data);
      } else {
        toast.error("Error fetching makes: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching makes:", error);
      toast.error("An error occurred while fetching makes.");
    } finally {
      setLoading(false);
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

  const handleMakeNameChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    if (!validateInput(sanitized)) {
      toast.error(
        "Invalid input detected. Please avoid special characters and scripts."
      );
      return;
    }
    setNewMakeName(sanitized);
    form.setFieldsValue({ makeName: sanitized });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!validateInput(newMakeName)) {
        toast.error("Make name contains invalid characters.");
        return;
      }

      const user_admin_id = SecureStorage.getSessionItem("user_id");
      const user_level = SecureStorage.getSessionItem("user_level_id");

      const requestData = editingMake
        ? {
            operation: "updateVehicleMake",
            makeData: {
              makeId: editingMake.vehicle_make_id,
              name: newMakeName,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          }
        : {
            operation: "saveVehicleMake",
            data: {
              name: newMakeName,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          };

      const url = editingMake
        ? `${encryptedUrl}/update_master1.php`
        : `${encryptedUrl}/insert_master.php`;

      setLoading(true);
      const response = await axios.post(url, JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.status === "success") {
        toast.success(
          `Make successfully ${editingMake ? "updated" : "added"}!`
        );
        fetchMakes();
        resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      } else {
        toast.error(
          `Failed to ${editingMake ? "update" : "add"} make: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${editingMake ? "updating" : "adding"} make.`
      );
      console.error("Error saving make:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewMakeName("");
    setEditingMake(null);
    form.resetFields();
  };

  const handleEditClick = async (make) => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        {
          operation: "fetchMakeById",
          id: make.vehicle_make_id,
        },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        const makeData = response.data.data[0];
        setNewMakeName(makeData.vehicle_make_name);
        setEditingMake(makeData);

        form.setFieldsValue({
          makeName: makeData.vehicle_make_name,
        });

        setIsEditModalOpen(true);
      } else {
        toast.error("Error fetching make details: " + response.data.message);
      }
    } catch (error) {
      toast.error("An error occurred while fetching make details.");
      console.error("Error fetching make details:", error);
    }
  };

  const handleDeleteClick = (make) => {
    setMakeToDelete(make);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
<<<<<<< HEAD
    if (!makeToDelete) return;
=======
    try {
      const response = await fetch(`${encryptedUrl}delete_master.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          operation: 'deleteVehicleMake', 
          vehicleMakeId: selectedMakeId 
        }),
      });
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f

    const requestData = {
      operation: "archiveResource",
      resourceType: "vehicle_make",
      resourceId: makeToDelete.vehicle_make_id,
    };

    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/delete_master.php`,
        JSON.stringify(requestData),
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "success") {
        toast.success("Make archived successfully!");
        fetchMakes();
      } else {
        toast.error("Failed to archive make: " + response.data.message);
      }
    } catch (error) {
      toast.error("An error occurred while archiving make: " + error.message);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setMakeToDelete(null);
    }
  };

<<<<<<< HEAD
  const handleRefresh = () => {
    fetchMakes();
  };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-1">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder="Search make by name"
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
            Add Make
          </Button>
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      title: "Make Name",
      dataIndex: "vehicle_make_name",
      key: "vehicle_make_name",
      sorter: true,
      sortOrder: sortField === "vehicle_make_name" ? sortOrder : null,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "ID",
      dataIndex: "vehicle_make_id",
      key: "vehicle_make_id",
      sorter: true,
      sortOrder: sortField === "vehicle_make_id" ? sortOrder : null,
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
      dataIndex: "vehicle_make_created_at",
      key: "created_at",
      sorter: true,
      sortOrder: sortField === "vehicle_make_created_at" ? sortOrder : null,
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
                Vehicle Makes
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
                {filteredMakes.length > 0 ? (
                  filteredMakes
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.vehicle_make_id}
                        className="bg-white border-b border-gray-200 hover:bg-[#d4f4dc]"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.vehicle_make_id}-${column.key}`}
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
                          <span className="text-gray-500">No makes found</span>
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
                total={filteredMakes.length}
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
            title={editingMake ? "Edit Make" : "Add Make"}
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
                makeName: newMakeName,
              }}
            >
              <Form.Item
                label="Make Name"
                name="makeName"
                rules={[
                  {
                    required: true,
                    message: "Please input make name!",
                  },
                ]}
              >
                <Input
                  placeholder="Enter make name"
                  onChange={handleMakeNameChange}
                />
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
              description={`Are you sure you want to archive "${makeToDelete?.vehicle_make_name}"? This action cannot be undone.`}
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
          </Modal>
        </div>
      </div>
=======
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
      const endpoint = editMode ? 'update_master1.php' : 'vehicle_master.php';
      const operation = editMode ? 'updateVehicleMake' : 'saveMakeData';
      
      const requestBody = editMode 
        ? { operation, id: formData.id, name: sanitizedName }
        : { operation, json: { vehicle_make_name: sanitizedName } };

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

    
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    </div>
  );
};

export default VehicleMakes;