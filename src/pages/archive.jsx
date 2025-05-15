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
  Popconfirm,
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
  UndoOutlined,
  FileSearchOutlined,
  UserOutlined,
  CarOutlined,
  HomeOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { SecureStorage } from "../utils/encryption";
import Sidebar from "./Sidebar";
import axios from "axios";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const { Search } = Input;
const { Option } = Select;

const Archive = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();

  const encryptedUrl = SecureStorage.getLocalItem("url");

  useEffect(() => {
    const user_level_id = SecureStorage.getSessionItem("user_level_id");
    if (
      user_level_id !== "1" &&
      user_level_id !== "2" &&
      user_level_id !== "4"
    ) {
      localStorage.clear();
      navigate("/gsd");
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const filtered = getCurrentData().filter((item) => {
      const searchFields = getSearchFields(item);
      return searchFields.some((field) =>
        field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, users, vehicles, venues, equipment, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case "users":
          response = await axios.post(
            `${encryptedUrl}/delete_master.php`,
            { operation: "fetchAllUserTypes" },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response.data.status === "success") {
            setUsers(response.data.data);
          }
          break;
        case "vehicles":
          response = await axios.post(
            `${encryptedUrl}/delete_master.php`,
            { operation: "fetchAllVehicles" },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response.data.status === "success") {
            setVehicles(response.data.data);
          }
          break;
        case "venues":
          response = await axios.post(
            `${encryptedUrl}/delete_master.php`,
            { operation: "fetchVenue" },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response.data.status === "success") {
            setVenues(response.data.data);
          }
          break;
        case "equipment":
          response = await axios.post(
            `${encryptedUrl}/delete_master.php`,
            { operation: "fetchEquipmentsWithStatus" },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response.data.status === "success") {
            setEquipment(response.data.data);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(`Error fetching ${activeTab}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "users":
        return users;
      case "vehicles":
        return vehicles;
      case "venues":
        return venues;
      case "equipment":
        return equipment;
      default:
        return [];
    }
  };

  const getSearchFields = (item) => {
    switch (activeTab) {
      case "users":
        return [
          item.users_fname,
          item.users_mname,
          item.users_lname,
          item.users_school_id,
          item.users_email,
          item.departments_name,
          item.user_level_name,
        ];
      case "vehicles":
        return [
          item.vehicle_license,
          item.vehicle_make_name,
          item.vehicle_model_name,
          item.vehicle_category_name,
        ];
      case "venues":
        return [item.ven_name, item.ven_occupancy, item.ven_operating_hours];
      case "equipment":
        return [item.equip_name, item.equip_quantity];
      default:
        return [];
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

  const handleRefresh = () => {
    fetchData();
  };

  const handleRestore = async (record) => {
    setLoading(true);
    try {
      let operation, resourceType, resourceId;
      let userType;

      switch (activeTab) {
        case "users":
          operation = "unarchiveUser";
          userType = convertUserType(record.user_level_name);
          resourceId = record.users_id;
          break;
        case "vehicles":
          operation = "unarchiveResource";
          resourceType = "vehicle";
          resourceId = record.vehicle_id;
          break;
        case "venues":
          operation = "unarchiveResource";
          resourceType = "venue";
          resourceId = record.ven_id;
          break;
        case "equipment":
          operation = "unarchiveResource";
          resourceType = "equipment";
          resourceId = record.equip_id;
          break;
        default:
          break;
      }

      const requestData =
        activeTab === "users"
          ? { operation, userType, userId: resourceId }
          : { operation, resourceType, resourceId };

      const response = await axios.post(
        `${encryptedUrl}/delete_master.php`,
        JSON.stringify(requestData),
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "success") {
        toast.success(`${activeTab.slice(0, -1)} restored successfully!`);
        fetchData();
      } else {
        toast.error(`Failed to restore ${activeTab.slice(0, -1)}`);
      }
    } catch (error) {
      toast.error(
        `An error occurred while restoring ${activeTab.slice(0, -1)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const convertUserType = (userType) => {
    const typeMapping = {
      Dean: "dept",
      Admin: "admin",
      Driver: "driver",
      Personnel: "personel",
      User: "user",
    };
    return typeMapping[userType] || userType.toLowerCase();
  };

  const userColumns = [
    {
      title: "School ID",
      dataIndex: "users_school_id",
      key: "school_id",
      sorter: true,
      sortOrder: sortField === "users_school_id" ? sortOrder : null,
    },
    {
      title: "Name",
      key: "name",
      render: (_, record) =>
        `${record.users_fname} ${record.users_mname} ${record.users_lname}`,
      sorter: true,
      sortOrder: sortField === "name" ? sortOrder : null,
    },
    {
      title: "Email",
      dataIndex: "users_email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "Department",
      dataIndex: "departments_name",
      key: "department",
      render: (text) => (
        <Tag
          color="blue"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "User Level",
      dataIndex: "user_level_name",
      key: "userLevel",
      render: (text) => (
        <Tag
          color="green"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Popconfirm
            title={`Restore this user?`}
            description="This will move the user back to active status."
            onConfirm={() => handleRestore(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const vehicleColumns = [
    {
      title: "License",
      dataIndex: "vehicle_license",
      key: "license",
      sorter: true,
      sortOrder: sortField === "vehicle_license" ? sortOrder : null,
    },
    {
      title: "Make",
      dataIndex: "vehicle_make_name",
      key: "make",
      sorter: true,
      sortOrder: sortField === "vehicle_make_name" ? sortOrder : null,
    },
    {
      title: "Model",
      dataIndex: "vehicle_model_name",
      key: "model",
      sorter: true,
      sortOrder: sortField === "vehicle_model_name" ? sortOrder : null,
    },
    {
      title: "Category",
      dataIndex: "vehicle_category_name",
      key: "category",
      render: (text) => (
        <Tag
          color="purple"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Popconfirm
            title={`Restore this vehicle?`}
            description="This will move the vehicle back to active status."
            onConfirm={() => handleRestore(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const venueColumns = [
    {
      title: "Name",
      dataIndex: "ven_name",
      key: "name",
      sorter: true,
      sortOrder: sortField === "ven_name" ? sortOrder : null,
    },
    {
      title: "Occupancy",
      dataIndex: "ven_occupancy",
      key: "occupancy",
      sorter: true,
      sortOrder: sortField === "ven_occupancy" ? sortOrder : null,
      render: (text) => `${text} people`,
    },
    {
      title: "Operating Hours",
      dataIndex: "ven_operating_hours",
      key: "hours",
      render: (text) => (
        <Tag
          color="blue"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Popconfirm
            title={`Restore this venue?`}
            description="This will move the venue back to active status."
            onConfirm={() => handleRestore(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const equipmentColumns = [
    {
      title: "Name",
      dataIndex: "equip_name",
      key: "name",
      sorter: true,
      sortOrder: sortField === "equip_name" ? sortOrder : null,
    },
    {
      title: "Quantity",
      dataIndex: "equip_quantity",
      key: "quantity",
      sorter: true,
      sortOrder: sortField === "equip_quantity" ? sortOrder : null,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Popconfirm
            title={`Restore this equipment?`}
            description="This will move the equipment back to active status."
            onConfirm={() => handleRestore(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const getCurrentColumns = () => {
    switch (activeTab) {
      case "users":
        return userColumns;
      case "vehicles":
        return vehicleColumns;
      case "venues":
        return venueColumns;
      case "equipment":
        return equipmentColumns;
      default:
        return [];
    }
  };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-1 border-gray-400/20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder={`Search ${activeTab}...`}
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
        </div>
      </div>
    </div>
  );

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
                <FileSearchOutlined className="mr-3" />
                Archive Management
              </h2>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-2 border-gray-400/20">
            <div className="flex flex-wrap gap-2">
              <Button
                type={activeTab === "users" ? "primary" : "default"}
                icon={<UserOutlined />}
                onClick={() => setActiveTab("users")}
                size="large"
              >
                Users
              </Button>
              <Button
                type={activeTab === "vehicles" ? "primary" : "default"}
                icon={<CarOutlined />}
                onClick={() => setActiveTab("vehicles")}
                size="large"
              >
                Vehicles
              </Button>
              <Button
                type={activeTab === "venues" ? "primary" : "default"}
                icon={<HomeOutlined />}
                onClick={() => setActiveTab("venues")}
                size="large"
              >
                Venues
              </Button>
              <Button
                type={activeTab === "equipment" ? "primary" : "default"}
                icon={<ToolOutlined />}
                onClick={() => setActiveTab("equipment")}
                size="large"
              >
                Equipment
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <EnhancedFilters />

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white dark:bg-green-100">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-green-400/90 dark:bg-green-900/20 dark:text-green-900">
                <tr>
                  {getCurrentColumns().map((column) => (
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
                {filteredData.length > 0 ? (
                  filteredData
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={
                          record[`${activeTab.slice(0, -1)}_id`] || record.id
                        }
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {getCurrentColumns().map((column) => (
                          <td
                            key={`${record.id}-${column.key}`}
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
                      colSpan={getCurrentColumns().length}
                      className="px-6 py-24 text-center"
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className="text-gray-500 dark:text-gray-400">
                            No archived {activeTab} found
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
                total={filteredData.length}
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
        </div>
      </div>
    </div>
  );
};

export default Archive;
