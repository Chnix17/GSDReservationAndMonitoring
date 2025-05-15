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
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  BankOutlined,
  SolutionOutlined,
  CarOutlined,
  AuditOutlined,
  CrownOutlined,
  TeamOutlined,
  PhoneOutlined,
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

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [userLevels, setUserLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [sortField, setSortField] = useState("users_created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [editingFaculty, setEditingFaculty] = useState(null);
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
    }
  }, [user_level_id, navigate]);

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
    fetchUserLevels();
  }, []);

  useEffect(() => {
    const filtered = faculty.filter(
      (fac) =>
        (fac.users_fname + " " + fac.users_lname)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        fac.users_school_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFaculty(filtered);
    setCurrentPage(1);
  }, [searchTerm, faculty]);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/user.php`,
        { operation: "fetchAllUser" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        setFaculty(response.data.data);
      } else {
        toast.error("Error fetching faculty: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching faculty:", error);
      toast.error("An error occurred while fetching faculty.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchDepartments" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        setDepartments(response.data.data);
      } else {
        toast.error("Error fetching departments: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("An error occurred while fetching departments.");
    }
  };

  const fetchUserLevels = async () => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchUserLevels" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        setUserLevels(response.data.data);
      } else {
        toast.error("Error fetching user levels: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching user levels:", error);
      toast.error("An error occurred while fetching user levels.");
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

  const handleEditClick = async (faculty) => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchUsersById", id: faculty.users_id },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        const facultyData = response.data.data[0];
        setEditingFaculty(facultyData);
        form.setFieldsValue({
          firstName: facultyData.users_fname,
          middleName: facultyData.users_mname,
          lastName: facultyData.users_lname,
          schoolId: facultyData.users_school_id,
          contact: facultyData.users_contact_number,
          email: facultyData.users_email,
          department: facultyData.departments_name,
          role: facultyData.users_user_level_id,
        });
        setIsEditModalOpen(true);
      } else {
        toast.error("Error fetching faculty details: " + response.data.message);
      }
    } catch (error) {
      toast.error("An error occurred while fetching faculty details.");
      console.error("Error fetching faculty details:", error);
    }
  };

  const handleDeleteClick = (faculty) => {
    setFacultyToDelete(faculty);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!facultyToDelete) return;

    let apiUserType;
    switch (facultyToDelete.user_level_name) {
      case "Admin":
        apiUserType = "admin";
        break;
      case "Dean":
      case "Secretary":
        apiUserType = "dept";
        break;
      case "Driver":
        apiUserType = "driver";
        break;
      case "Personnel":
        apiUserType = "personel";
        break;
      default:
        apiUserType = "user";
    }

    const requestData = {
      operation: "archiveUser",
      userType: apiUserType,
      userId: facultyToDelete.users_id,
    };

    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/delete_master.php`,
        JSON.stringify(requestData),
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "success") {
        toast.success("Faculty archived successfully!");
        fetchFaculty();
      } else {
        toast.error("Failed to archive faculty: " + response.data.message);
      }
    } catch (error) {
      toast.error(
        "An error occurred while archiving faculty: " + error.message
      );
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setFacultyToDelete(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!validateInput(values.firstName) || !validateInput(values.lastName)) {
        toast.error("Name contains invalid characters.");
        return;
      }

      const user_admin_id = SecureStorage.getSessionItem("user_id");
      const user_level = SecureStorage.getSessionItem("user_level_id");

      const selectedDepartment = departments.find(
        (dept) => dept.departments_name === values.department
      );

      const requestData = editingFaculty
        ? {
            operation: "updateUsers",
            type: "user", // Adjust based on user level
            id: editingFaculty.users_id,
            fname: values.firstName,
            mname: values.middleName || "",
            lname: values.lastName,
            email: values.email,
            school_id: values.schoolId,
            contact: values.contact,
            user_level_id: values.role,
            department_id: selectedDepartment?.departments_id,
            user_admin_id: user_level === "1" ? user_admin_id : null,
            super_admin_id: user_level === "4" ? user_admin_id : null,
          }
        : {
            operation: "saveUser",
            data: {
              fname: values.firstName,
              mname: values.middleName || "",
              lname: values.lastName,
              email: values.email,
              schoolId: values.schoolId,
              contact: values.contact,
              userLevelId: values.role,
              departmentId: selectedDepartment?.departments_id,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          };

      const url = editingFaculty
        ? `${encryptedUrl}/update_master.php`
        : `${encryptedUrl}/insert_master.php`;

      setLoading(true);
      const response = await axios.post(url, JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.status === "success") {
        toast.success(
          `Faculty successfully ${editingFaculty ? "updated" : "added"}!`
        );
        fetchFaculty();
        form.resetFields();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      } else {
        toast.error(
          `Failed to ${editingFaculty ? "update" : "add"} faculty: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${
          editingFaculty ? "updating" : "adding"
        } faculty.`
      );
      console.error("Error saving faculty:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchFaculty();
  };

  const generateAvatarColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "#1abc9c",
      "#2ecc71",
      "#3498db",
      "#9b59b6",
      "#34495e",
      "#16a085",
      "#27ae60",
      "#2980b9",
      "#8e44ad",
      "#2c3e50",
      "#f1c40f",
      "#e67e22",
      "#e74c3c",
      "#95a5a6",
      "#f39c12",
      "#d35400",
      "#c0392b",
      "#7f8c8d",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const renderAvatar = (record) => {
    const initials = `${record.users_fname?.[0] || ""}${
      record.users_lname?.[0] || ""
    }`.toUpperCase();
    const bgColor = generateAvatarColor(initials);

    if (record.users_pic) {
      return (
        <div className="relative w-8 h-8">
          <img
            src={`${encryptedUrl}/${record.users_pic}`}
            alt={record.users_name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      );
    }

    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>
    );
  };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder="Search faculty by name or ID"
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
            Add Faculty
          </Button>
        </div>
      </div>
    </div>
  );

  // Styling for the tags

  const columns = [
    {
      title: "Photo",
      key: "photo",
      render: (_, record) => renderAvatar(record),
      width: 80,
    },
    {
      title: "Name",
      key: "name",
      sorter: true,
      sortOrder: sortField === "users_fname" ? sortOrder : null,
      render: (_, record) => (
        <span className="font-medium">
          {record.users_fname} {record.users_lname}
        </span>
      ),
    },
    {
      title: "School ID",
      dataIndex: "users_school_id",
      key: "users_school_id",
      sorter: true,
      sortOrder: sortField === "users_school_id" ? sortOrder : null,
    },
    {
      title: "Department",
      dataIndex: "departments_name",
      key: "departments_name",
      sorter: true,
      sortOrder: sortField === "departments_name" ? sortOrder : null,
      render: (text) => (
        <Tag
          icon={<BankOutlined />}
          color="blue"
          className="rounded-full px-2 py-1 text-xs font-semibold  flex items-center justify-center"
        >
          {text || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Role",
      dataIndex: "user_level_name",
      key: "user_level_name",
      sorter: true,
      sortOrder: sortField === "user_level_name" ? sortOrder : null,
      render: (text) => {
        let icon, color;
        switch (text) {
          case "Admin":
            icon = <CrownOutlined />;
            color = "purple";
            break;
          case "Faculty":
            icon = <UserOutlined />;
            color = "green";
            break;
          case "Staff":
            icon = <TeamOutlined />;
            color = "orange";
            break;
          case "Dean":
            icon = <AuditOutlined />;
            color = "volcano";
            break;
          case "Secretary":
            icon = <SolutionOutlined />;
            color = "cyan";
            break;
          case "Driver":
            icon = <CarOutlined />;
            color = "geekblue";
            break;
          case "Personnel":
            icon = <TeamOutlined />;
            color = "pink";
            break;
          default:
            icon = <UserOutlined />;
            color = "green";
        }
        return (
          <Tag
            icon={icon}
            color={color}
            className="rounded-full px-2 py-1 text-xs capitalize font-semibold flex items-center justify-center"
          >
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Contact",
      dataIndex: "users_contact_number",
      key: "users_contact_number",
      sorter: true,
      sortOrder: sortField === "users_contact_number" ? sortOrder : null,
      render: (text) => (
        <div className="flex items-center gap-1">
          <PhoneOutlined className="text-green-600 font-bold" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag
          color={record.users_is_active === "1" ? "green" : "red"}
          icon={
            record.users_is_active === "1" ? (
              <CheckCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          className="rounded-full px-2 py-1 text-xs font-semibold  flex items-center justify-center"
        >
          {record.users_is_active === "1" ? "Active" : "Inactive"}
        </Tag>
      ),
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
              className="bg-green-900 hover:bg-green-800"
            />
          </Tooltip>
          <Tooltip title="Archive">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteClick(record)}
              className="bg-red-900 hover:bg-red-800"
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
                Faculty Management
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <EnhancedFilters />

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white dark:bg-green-100">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-green-400/90 dark:bg-green-900/20 dark:text-green-900">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3"
                      onClick={() =>
                        column.sorter &&
                        handleSort(column.dataIndex || column.key)
                      }
                    >
                      <div className="flex items-center cursor-pointer hover:text-gray-900">
                        {column.title}
                        {sortField === (column.dataIndex || column.key) && (
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
                {filteredFaculty.length > 0 ? (
                  filteredFaculty
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.users_id}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.users_id}-${column.key}`}
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
                            No faculty members found
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
                total={filteredFaculty.length}
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
            title={editingFaculty ? "Edit Faculty" : "Add Faculty"}
            open={isAddModalOpen || isEditModalOpen}
            onCancel={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              form.resetFields();
              setEditingFaculty(null);
            }}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={700}
          >
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[
                      { required: true, message: "Please input first name!" },
                      {
                        validator: (_, value) =>
                          !value || /^[a-zA-Z\s]+$/.test(value)
                            ? Promise.resolve()
                            : Promise.reject("Name can only contain letters"),
                      },
                    ]}
                  >
                    <Input placeholder="Enter first name" />
                  </Form.Item>

                  <Form.Item
                    label="Middle Name"
                    name="middleName"
                    rules={[
                      {
                        validator: (_, value) =>
                          !value || /^[a-zA-Z\s]+$/.test(value)
                            ? Promise.resolve()
                            : Promise.reject("Name can only contain letters"),
                      },
                    ]}
                  >
                    <Input placeholder="Enter middle name" />
                  </Form.Item>

                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[
                      { required: true, message: "Please input last name!" },
                      {
                        validator: (_, value) =>
                          !value || /^[a-zA-Z\s]+$/.test(value)
                            ? Promise.resolve()
                            : Promise.reject("Name can only contain letters"),
                      },
                    ]}
                  >
                    <Input placeholder="Enter last name" />
                  </Form.Item>
                </div>

                <div>
                  <Form.Item
                    label="School ID"
                    name="schoolId"
                    rules={[
                      { required: true, message: "Please input school ID!" },
                      {
                        pattern: /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/,
                        message:
                          "Must be in format x1-x1-x1 (e.g., abc-123-xyz)",
                      },
                    ]}
                  >
                    <Input placeholder="Enter school ID" />
                  </Form.Item>

                  <Form.Item
                    label="Contact Number"
                    name="contact"
                    rules={[
                      {
                        required: true,
                        message: "Please input contact number!",
                      },
                      {
                        pattern: /^\d{11}$/,
                        message: "Must be 11 digits",
                      },
                    ]}
                  >
                    <Input placeholder="Enter contact number" />
                  </Form.Item>

                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Please input email!" },
                      {
                        type: "email",
                        message: "Please enter a valid email",
                      },
                    ]}
                  >
                    <Input placeholder="Enter email" />
                  </Form.Item>

                  <Form.Item
                    label="Department"
                    name="department"
                    rules={[
                      { required: true, message: "Please select department!" },
                    ]}
                  >
                    <Select placeholder="Select department">
                      {departments.map((dept) => (
                        <Option
                          key={dept.departments_id}
                          value={dept.departments_name}
                        >
                          {dept.departments_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Role"
                    name="role"
                    rules={[{ required: true, message: "Please select role!" }]}
                  >
                    <Select placeholder="Select role">
                      {userLevels.map((level) => (
                        <Option
                          key={level.user_level_id}
                          value={level.user_level_id}
                        >
                          {level.user_level_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
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
              description={`Are you sure you want to archive "${facultyToDelete?.users_fname} ${facultyToDelete?.users_lname}"? This action cannot be undone.`}
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

export default Faculty;
