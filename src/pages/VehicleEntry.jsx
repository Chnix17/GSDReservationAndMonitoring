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
  Upload,
} from "antd";
import {
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { sanitizeInput, validateInput } from "../utils/sanitize";

import { SecureStorage } from "../utils/encryption";
import Sidebar from "./Sidebar";
import axios from "axios";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const { Search } = Input;
const { Option } = Select;

const VehicleEntry = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [makes, setMakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [statusAvailability, setStatusAvailability] = useState([]);
    const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [year, setYear] = useState(dayjs().format("YYYY"));
    const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [fileList, setFileList] = useState([]);
    const [vehicleImage, setVehicleImage] = useState(null);
  const [form] = Form.useForm();
  const [sortField, setSortField] = useState("vehicle_created_at");
  const [sortOrder, setSortOrder] = useState("desc");
    const navigate = useNavigate();

  const user_level_id = SecureStorage.getSessionItem("user_level_id");

    useEffect(() => {
    if (
      user_level_id !== "1" &&
      user_level_id !== "2" &&
      user_level_id !== "4"
    ) {
            localStorage.clear();
      navigate("/gsd");
        }
    }, [user_level_id, navigate]);

    useEffect(() => {
        fetchVehicles();
        fetchMakes();
    fetchStatusAvailability();
    }, []);

  useEffect(() => {
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.vehicle_model_name &&
        vehicle.vehicle_model_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredVehicles(filtered);
    setCurrentPage(1);
  }, [searchTerm, vehicles]);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
      const response = await axios.post(
        "http://localhost/coc/gsd/user.php",
        { operation: "fetchAllVehicles" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
                setVehicles(response.data.data);
            } else {
        toast.error("Error fetching vehicles: " + response.data.message);
            }
        } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("An error occurred while fetching vehicles.");
        } finally {
            setLoading(false);
        }
    };

    const fetchMakes = async () => {
        try {
      const response = await axios.post(
        "http://localhost/coc/gsd/user.php",
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
        }
    };

  const fetchCategories = async (makeId) => {
        try {
      const response = await axios.post(
        "http://localhost/coc/gsd/user.php",
        {
          operation: "fetchCategoriesAndModels",
          make_id: makeId,
        },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        setCategories(response.data.data.categories);
        setModels(response.data.data.models);
            } else {
        toast.error("Error fetching categories: " + response.data.message);
            }
        } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("An error occurred while fetching categories.");
        }
    };

  const fetchStatusAvailability = async () => {
    try {
      const response = await axios.post(
        "http://localhost/coc/gsd/fetchMaster.php",
        { operation: "fetchStatusAvailability" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        setStatusAvailability(response.data.data);
      } else {
        toast.error(
          "Error fetching status availability: " + response.data.message
        );
      }
    } catch (error) {
      console.error("Error fetching status availability:", error);
      toast.error("An error occurred while fetching status availability.");
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

  const handleLicenseChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    if (!validateInput(sanitized)) {
      toast.error(
        "Invalid input detected. Please avoid special characters and scripts."
      );
      return;
    }
    setLicenseNumber(sanitized);
    form.setFieldsValue({ licenseNumber: sanitized });
  };

  const handleYearChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    if (!/^\d{4}$/.test(sanitized)) {
      toast.error("Please enter a valid 4-digit year.");
      return;
    }
    setYear(sanitized);
    form.setFieldsValue({ year: sanitized });
    };

  const handleMakeChange = (value) => {
    setSelectedMake(value);
    setSelectedCategory("");
    setSelectedModel("");
    if (value) {
      fetchCategories(value);
    } else {
      setCategories([]);
      setModels([]);
    }
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSelectedModel("");
    };

  const handleImageUpload = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setVehicleImage(null);
    }
    };

    const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!validateInput(licenseNumber)) {
        toast.error("License number contains invalid characters.");
            return;
        }
    
      const user_admin_id = SecureStorage.getSessionItem("user_id");
      const user_level = SecureStorage.getSessionItem("user_level_id");

      const requestData = editingVehicle
        ? {
                    operation: "updateVehicleLicense",
                    vehicleData: {
              vehicle_id: editingVehicle.vehicle_id,
              vehicle_model_id: selectedModel,
              vehicle_license: licenseNumber,
              year: year,
                        status_availability_id: selectedStatus,
              vehicle_pic: vehicleImage || null,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          }
        : {
                    operation: "saveVehicle",
                    data: {
              vehicle_model_id: selectedModel,
              vehicle_license: licenseNumber,
              year: year,
                        vehicle_pic: vehicleImage,
              status_availability_id: selectedStatus,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          };

      const url = editingVehicle
        ? "http://localhost/coc/gsd/update_master1.php"
        : "http://localhost/coc/gsd/insert_master.php";

      setLoading(true);
      const response = await axios.post(url, JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
                });
    
      if (response.data.status === "success") {
        toast.success(
          `Vehicle successfully ${editingVehicle ? "updated" : "added"}!`
        );
                fetchVehicles();
        resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
            } else {
        toast.error(
          `Failed to ${editingVehicle ? "update" : "add"} vehicle: ${
            response.data.message || "Unknown error"
          }`
        );
            }
        } catch (error) {
      toast.error(
        `An error occurred while ${
          editingVehicle ? "updating" : "adding"
        } vehicle.`
      );
      console.error("Error saving vehicle:", error);
        } finally {
      setLoading(false);
        }
    };

  const resetForm = () => {
    setLicenseNumber("");
    setSelectedMake("");
    setSelectedCategory("");
    setSelectedModel("");
    setSelectedStatus("");
    setYear(dayjs().format("YYYY"));
    setEditingVehicle(null);
    setVehicleImage(null);
    setFileList([]);
    form.resetFields();
  };

  const handleEditClick = async (vehicle) => {
            try {
      const response = await axios.post(
        "http://localhost/coc/gsd/fetchMaster.php",
        { operation: "fetchVehicleById", id: vehicle.vehicle_id },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                );
                
      if (response.data.status === "success") {
        const vehicleData = response.data.data[0];
        setLicenseNumber(vehicleData.vehicle_license);
        setYear(vehicleData.year);
        setSelectedStatus(vehicleData.status_availability_id);
        setEditingVehicle(vehicleData);

        // Set make and fetch categories/models
        setSelectedMake(vehicleData.vehicle_make_id);
        await fetchCategories(vehicleData.vehicle_make_id);

        // After categories are loaded, set category and model
        setSelectedCategory(vehicleData.vehicle_category_id);
        setSelectedModel(vehicleData.vehicle_model_id);

        form.setFieldsValue({
          licenseNumber: vehicleData.vehicle_license,
          year: vehicleData.year,
          make: vehicleData.vehicle_make_id,
          category: vehicleData.vehicle_category_id,
          model: vehicleData.vehicle_model_id,
          status: vehicleData.status_availability_id,
        });

        setIsEditModalOpen(true);
                } else {
        toast.error("Error fetching vehicle details: " + response.data.message);
                }
            } catch (error) {
      toast.error("An error occurred while fetching vehicle details.");
      console.error("Error fetching vehicle details:", error);
        }
    };

  const handleDeleteClick = (vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteModalOpen(true);
    };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;

    const requestData = {
      operation: "archiveResource",
      resourceType: "vehicle",
      resourceId: vehicleToDelete.vehicle_id,
    };

    setLoading(true);
        try {
      const response = await axios.post(
        "http://localhost/coc/gsd/delete_master.php",
        JSON.stringify(requestData),
        { headers: { "Content-Type": "application/json" } }
            );

      if (response.data.status === "success") {
        toast.success("Vehicle archived successfully!");
        fetchVehicles();
            } else {
        toast.error("Failed to archive vehicle: " + response.data.message);
            }
        } catch (error) {
      toast.error(
        "An error occurred while archiving vehicle: " + error.message
      );
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setVehicleToDelete(null);
    }
    };

  const handleRefresh = () => {
    fetchVehicles();
  };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder="Search vehicles by model"
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
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Vehicle
          </Button>
                        </div>
                    </div>
                </div>
  );

  const columns = [
    {
      title: "Vehicle",
      dataIndex: "vehicle_model_name",
      key: "vehicle_model_name",
      sorter: true,
      sortOrder: sortField === "vehicle_model_name" ? sortOrder : null,
      render: (text, record) => (
        <div className="flex items-center">
          <CarOutlined className="mr-2 text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "License",
      dataIndex: "vehicle_license",
      key: "vehicle_license",
      sorter: true,
      sortOrder: sortField === "vehicle_license" ? sortOrder : null,
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
      title: "Year",
      dataIndex: "year",
      key: "year",
      sorter: true,
      sortOrder: sortField === "year" ? sortOrder : null,
    },
    {
      title: "Status",
      dataIndex: "status_availability_name",
      key: "status",
      sorter: true,
      sortOrder: sortField === "status_availability_name" ? sortOrder : null,
      render: (text) => (
        <Tag
          color={text === "Available" ? "green" : "red"}
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text === "Available" ? "Available" : "Not Available"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "vehicle_created_at",
      key: "created_at",
      sorter: true,
      sortOrder: sortField === "vehicle_created_at" ? sortOrder : null,
      render: (text) => new Date(text).toLocaleString(),
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
              className="bg-blue-500 hover:bg-blue-600"
            />
          </Tooltip>
          <Tooltip title="Archive">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteClick(record)}
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
            <div className="flex-1 overflow-y-auto">
        <div className="p-[2.5rem] lg:p-12 min-h-screen">
                <motion.div 
            initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-4xl font-bold text-gray-800 mt-5">
                Vehicle Management
              </h2>
                        </div>
                            </motion.div>

          {/* Search and Filters */}
          <EnhancedFilters />

          {/* Table */}
          <div className="relative overflow-x-auto   shadow-md sm:rounded-lg bg-white dark:bg-green-100">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
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
                      <div className="flex items-center cursor-pointer hover:text-gray-900">
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
                {filteredVehicles.length > 0 ? (
                  filteredVehicles
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.vehicle_id}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.vehicle_id}-${column.key}`}
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
                          <span className="text-gray-500 dark:text-gray-400">
                            No vehicles found
                          </span>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Always show pagination, even when empty */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredVehicles.length}
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
            title={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
            open={isAddModalOpen || isEditModalOpen}
            onCancel={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              resetForm();
            }}
                onOk={handleSubmit}
            confirmLoading={loading}
            width={700}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                licenseNumber: licenseNumber,
                year: year,
                make: selectedMake,
                category: selectedCategory,
                model: selectedModel,
                status: selectedStatus,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Form.Item
                    label="License Number"
                    name="licenseNumber"
                    rules={[
                      {
                        required: true,
                        message: "Please input license number!",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter license number"
                      onChange={handleLicenseChange}
                    />
                  </Form.Item>

                            <Form.Item
                                label="Make"
                    name="make"
                    rules={[
                      { required: true, message: "Please select a make!" },
                    ]}
                            >
                    <Select
                      placeholder="Select make"
                                    onChange={handleMakeChange}
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
                    name="category"
                    rules={[
                      { required: true, message: "Please select a category!" },
                    ]}
                            >
                    <Select
                      placeholder="Select category"
                                    onChange={handleCategoryChange}
                      disabled={!selectedMake}
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

                            <Form.Item
                                label="Model"
                    name="model"
                    rules={[
                      { required: true, message: "Please select a model!" },
                    ]}
                  >
                    <Select
                      placeholder="Select model"
                      onChange={(value) => setSelectedModel(value)}
                      disabled={!selectedCategory}
                    >
                      {models
                        .filter(
                          (model) =>
                            model.vehicle_category_id === selectedCategory
                        )
                        .map((model) => (
                          <Option
                            key={model.vehicle_model_id}
                            value={model.vehicle_model_id}
                          >
                            {model.vehicle_model_name}
                          </Option>
                        ))}
                    </Select>
                            </Form.Item>

                            <Form.Item
                                label="Year"
                    name="year"
                    rules={[{ required: true, message: "Please input year!" }]}
                            >
                    <Input
                      type="number"
                      placeholder="Enter year (YYYY)"
                      onChange={handleYearChange}
                                />
                            </Form.Item>

                            <Form.Item
                    label="Status"
                    name="status"
                    rules={[
                      { required: true, message: "Please select status!" },
                    ]}
                  >
                    <Select
                      placeholder="Select status"
                      onChange={(value) => setSelectedStatus(value)}
                    >
                      {statusAvailability.map((status) => (
                        <Option
                          key={status.status_availability_id}
                          value={status.status_availability_id}
                        >
                          {status.status_availability_name}
                        </Option>
                      ))}
                    </Select>
                            </Form.Item>
                        </div>

                <div>
                            <Form.Item
                                label="Vehicle Image"
                                tooltip="Upload vehicle image (max 5MB)"
                            >
                    <Upload
                      listType="picture-card"
                      fileList={fileList}
                      onChange={handleImageUpload}
                      beforeUpload={() => false}
                      maxCount={1}
                    >
                      {fileList.length < 1 && (
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                      )}
                    </Upload>
                  </Form.Item>

                  {editingVehicle?.vehicle_pic && !vehicleImage && (
                                    <div className="mt-4">
                      <img
                        src={`http://localhost/coc/gsd/${editingVehicle.vehicle_pic}`}
                        alt="Current Vehicle"
                                            className="max-w-full h-auto rounded-lg shadow-lg" 
                                        />
                      <p className="text-sm text-gray-500 mt-2">
                        Current Image
                      </p>
                                    </div>
                                )}
                        </div>
                    </div>
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
              >
                Archive
              </Button>,
            ]}
          >
            <Alert
              message="Warning"
              description={`Are you sure you want to archive "${vehicleToDelete?.vehicle_model_name}"? This action cannot be undone.`}
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

export default VehicleEntry;
