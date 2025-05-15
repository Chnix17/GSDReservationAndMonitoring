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
  BuildOutlined,
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
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const { Search } = Input;
const { Option } = Select;

const EquipmentEntry = () => {
    const [equipments, setEquipments] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
    const [categories, setCategories] = useState([]);
  const [statusAvailability, setStatusAvailability] = useState([]);
    const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentQuantity, setNewEquipmentQuantity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
    const [editingEquipment, setEditingEquipment] = useState(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [equipmentImage, setEquipmentImage] = useState(null);
  const [form] = Form.useForm();
  const [sortField, setSortField] = useState("equip_created_at");
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
    fetchEquipments();
    fetchCategories();
    fetchStatusAvailability();
  }, []);

    useEffect(() => {
    const filtered = equipments.filter(
      (equipment) =>
        equipment.equip_name &&
        equipment.equip_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredEquipments(filtered);
            setCurrentPage(1);
    }, [searchTerm, equipments]);

    const fetchEquipments = async () => {
        setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost/coc/gsd/user.php",
        { operation: "fetchEquipmentsWithStatus" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
                setEquipments(response.data.data);
            } else {
                toast.error("Error fetching equipments: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching equipments:", error);
            toast.error("An error occurred while fetching equipments.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost/coc/gsd/user.php",
        { operation: "fetchCategories" },
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

    const handleEquipmentNameChange = (e) => {
        const sanitized = sanitizeInput(e.target.value);
        if (!validateInput(sanitized)) {
      toast.error(
        "Invalid input detected. Please avoid special characters and scripts."
      );
            return;
        }
        setNewEquipmentName(sanitized);
        form.setFieldsValue({ equipmentName: sanitized });
    };

    const handleEquipmentQuantityChange = (e) => {
        const sanitized = sanitizeInput(e.target.value);
        if (!/^\d*$/.test(sanitized)) {
      toast.error("Please enter only numbers for quantity.");
            return;
        }
        setNewEquipmentQuantity(sanitized);
        form.setFieldsValue({ equipmentQuantity: sanitized });
    };

  const handleImageUpload = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      const reader = new FileReader();
      reader.onloadend = () => {
        setEquipmentImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setEquipmentImage(null);
    }
  };

    const handleSubmit = async () => {
    try {
      await form.validateFields();

        if (!validateInput(newEquipmentName)) {
        toast.error("Equipment name contains invalid characters.");
            return;
        }

      const user_admin_id = SecureStorage.getSessionItem("user_id");
      const user_level = SecureStorage.getSessionItem("user_level_id");

      const requestData = editingEquipment
        ? {
                operation: "updateEquipment",
                equipmentData: {
                    equipmentId: editingEquipment.equip_id,
                    name: newEquipmentName,
                    quantity: newEquipmentQuantity,
                    categoryId: selectedCategory,
                    statusId: selectedStatus,
                    equip_pic: equipmentImage || null,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
                }
        : {
                operation: "saveEquipment",
                data: {
                    name: newEquipmentName,
                    quantity: newEquipmentQuantity,
                    categoryId: selectedCategory,
                    equip_pic: equipmentImage,
                    status_availability_id: selectedStatus,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
            };

      const url = editingEquipment
        ? "http://localhost/coc/gsd/update_master1.php"
        : "http://localhost/coc/gsd/insert_master.php";

        setLoading(true);
            const response = await axios.post(url, JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
            });
            
      if (response.data.status === "success") {
        toast.success(
          `Equipment successfully ${editingEquipment ? "updated" : "added"}!`
        );
                fetchEquipments();
                resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
            } else {
        toast.error(
          `Failed to ${editingEquipment ? "update" : "add"} equipment: ${
            response.data.message || "Unknown error"
          }`
        );
            }
        } catch (error) {
      toast.error(
        `An error occurred while ${
          editingEquipment ? "updating" : "adding"
        } equipment.`
      );
            console.error("Error saving equipment:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
    setNewEquipmentName("");
    setNewEquipmentQuantity("");
    setSelectedCategory("");
    setSelectedStatus("");
        setEditingEquipment(null);
        setEquipmentImage(null);
        setFileList([]);
        form.resetFields();
    };

    const handleEditClick = async (equipment) => {
    try {
      const response = await axios.post(
        "http://localhost/coc/gsd/fetchMaster.php",
        { operation: "fetchEquipmentById", id: equipment.equip_id },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        const equipmentData = response.data.data[0];
        setNewEquipmentName(equipmentData.equip_name);
        setNewEquipmentQuantity(equipmentData.equip_quantity);
        setSelectedCategory(equipmentData.equipment_equipment_category_id);
        setSelectedStatus(equipmentData.status_availability_id);
        setEditingEquipment(equipmentData);

        form.setFieldsValue({
          equipmentName: equipmentData.equip_name,
          equipmentQuantity: equipmentData.equip_quantity,
          category: equipmentData.equipment_equipment_category_id,
          status: equipmentData.status_availability_id,
        });

        setIsEditModalOpen(true);
            } else {
        toast.error(
          "Error fetching equipment details: " + response.data.message
        );
            }
        } catch (error) {
            toast.error("An error occurred while fetching equipment details.");
            console.error("Error fetching equipment details:", error);
        }
    };

  const handleDeleteClick = (equipment) => {
    setEquipmentToDelete(equipment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToDelete) return;

        const requestData = {
            operation: "archiveResource",
            resourceType: "equipment",
      resourceId: equipmentToDelete.equip_id,
        };

        setLoading(true);
        try {
      const response = await axios.post(
        "http://localhost/coc/gsd/delete_master.php",
        JSON.stringify(requestData),
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "success") {
                toast.success("Equipment archived successfully!");
                fetchEquipments();
            } else {
                toast.error("Failed to archive equipment: " + response.data.message);
            }
        } catch (error) {
      toast.error(
        "An error occurred while archiving equipment: " + error.message
      );
        } finally {
            setLoading(false);
      setIsDeleteModalOpen(false);
      setEquipmentToDelete(null);
    }
  };

  const handleRefresh = () => {
    fetchEquipments();
  };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder="Search equipment by name"
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
            Add Equipment
          </Button>
                                    </div>
                                </div>
                            </div>
  );

  const columns = [
    {
      title: "Equipment",
      dataIndex: "equip_name",
      key: "equip_name",
      sorter: true,
      sortOrder: sortField === "equip_name" ? sortOrder : null,
      render: (text, record) => (
        <div className="flex items-center">
          <BuildOutlined className="mr-2 text-orange-500" />
          <span className="font-medium">{text}</span>
                            </div>
      ),
    },
    {
      title: "ID",
      dataIndex: "equip_id",
      key: "equip_id",
      sorter: true,
      sortOrder: sortField === "equip_id" ? sortOrder : null,
    },
    {
      title: "Quantity",
      dataIndex: "equip_quantity",
      key: "equip_quantity",
      sorter: true,
      sortOrder: sortField === "equip_quantity" ? sortOrder : null,
      render: (text) => (
        <Tag
          color="blue"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          Qty: {text}
        </Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "equipment_category_name",
      key: "category",
      sorter: true,
      sortOrder: sortField === "equipment_category_name" ? sortOrder : null,
      render: (text) => text || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      sortOrder: sortField === "status" ? sortOrder : null,
      render: (text) => (
        <Tag
          color={text === "Available" ? "green" : "red"}
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text || "Unavailable"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "equip_created_at",
      key: "created_at",
      sorter: true,
      sortOrder: sortField === "equip_created_at" ? sortOrder : null,
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
                Equipment Management
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
                {filteredEquipments.length > 0 ? (
                  filteredEquipments
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.equip_id}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.equip_id}-${column.key}`}
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
                            No equipment found
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
                total={filteredEquipments.length}
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
                title={editingEquipment ? "Edit Equipment" : "Add Equipment"}
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
                        equipmentName: newEquipmentName,
                        equipmentQuantity: newEquipmentQuantity,
                category: selectedCategory,
                status: selectedStatus,
                    }}
                >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                            <Form.Item
                                label="Equipment Name"
                                name="equipmentName"
                    rules={[
                      {
                        required: true,
                        message: "Please input equipment name!",
                      },
                    ]}
                            >
                                <Input
                                    placeholder="Enter equipment name"
                      onChange={handleEquipmentNameChange}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Quantity"
                                name="equipmentQuantity"
                    rules={[
                      { required: true, message: "Please input quantity!" },
                    ]}
                            >
                                <Input
                                    type="number"
                                    placeholder="Enter quantity"
                      onChange={handleEquipmentQuantityChange}
                                />
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
                      onChange={(value) => setSelectedCategory(value)}
                    >
                      {categories.map((category) => (
                        <Option
                          key={category.equipments_category_id}
                          value={category.equipments_category_id}
                        >
                                            {category.equipments_category_name}
                        </Option>
                                    ))}
                    </Select>
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
                                label="Equipment Image"
                                tooltip="Upload equipment image (max 5MB)"
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

                  {editingEquipment?.equip_pic && !equipmentImage && (
                                <div className="mt-4">
                                    <img
                        src={`http://localhost/coc/gsd/${editingEquipment.equip_pic}`}
                        alt="Current Equipment"
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
              description={`Are you sure you want to archive "${equipmentToDelete?.equip_name}"? This action cannot be undone.`}
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

export default EquipmentEntry;
