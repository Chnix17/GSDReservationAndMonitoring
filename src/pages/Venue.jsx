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
  TimePicker,
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

const VenueEntry = () => {
    const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [statusAvailability, setStatusAvailability] = useState([]);
    const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueOccupancy, setNewVenueOccupancy] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
    const [operatingHoursStart, setOperatingHoursStart] = useState(null);
    const [operatingHoursEnd, setOperatingHoursEnd] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("1");
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [venueImage, setVenueImage] = useState(null);
  const [form] = Form.useForm();
  const [sortField, setSortField] = useState("ven_created_at");
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
        }
  }, [user_level_id, navigate]);

    useEffect(() => {
        fetchVenues();
    fetchStatusAvailability();
    }, []);

    useEffect(() => {
    const filtered = venues.filter(
      (venue) =>
        venue.ven_name &&
        venue.ven_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVenues(filtered);
    setCurrentPage(1);
  }, [searchTerm, venues]);

    const fetchVenues = async () => {
        setLoading(true);
        try {
      const response = await axios.post(
        `${encryptedUrl}/user.php`,
        { operation: "fetchVenue" },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
                setVenues(response.data.data);
            } else {
                toast.error("Error fetching venues: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching venues:", error);
            toast.error("An error occurred while fetching venues.");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusAvailability = async () => {
        try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
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

  const handleVenueNameChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    if (!validateInput(sanitized)) {
      toast.error(
        "Invalid input detected. Please avoid special characters and scripts."
      );
      return;
    }
    setNewVenueName(sanitized);
    form.setFieldsValue({ venueName: sanitized });
  };

  const handleVenueOccupancyChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    if (!/^\d*$/.test(sanitized)) {
      toast.error("Please enter only numbers for occupancy.");
      return;
    }
    setNewVenueOccupancy(sanitized);
    form.setFieldsValue({ venueOccupancy: sanitized });
  };

  const handleTimeChange = (times, timeStrings) => {
    if (times) {
      setOperatingHoursStart(times[0]);
      setOperatingHoursEnd(times[1]);
      setOperatingHours(`${timeStrings[0]} - ${timeStrings[1]}`);
            } else {
      setOperatingHoursStart(null);
      setOperatingHoursEnd(null);
      setOperatingHours("");
        }
    };

  const handleImageUpload = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      const reader = new FileReader();
      reader.onloadend = () => {
        setVenueImage(reader.result);
      };
      reader.readAsDataURL(file);
        } else {
      setVenueImage(null);
        }
    };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!validateInput(newVenueName)) {
        toast.error("Venue name contains invalid characters.");
        return;
      }

      const user_admin_id = SecureStorage.getSessionItem("user_id");
      const user_level = SecureStorage.getSessionItem("user_level_id");

      const requestData = editingVenue
        ? {
            operation: "updateVenue",
                venueData: {
              venueId: editingVenue.ven_id,
              name: newVenueName,
              occupancy: newVenueOccupancy,
              operatingHours: operatingHours,
              statusId: selectedStatus,
              ven_pic: venueImage || null,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          }
        : {
            operation: "saveVenue",
            data: {
              name: newVenueName,
              occupancy: newVenueOccupancy,
              operatingHours: operatingHours,
              ven_pic: venueImage,
              status_availability_id: selectedStatus,
              user_admin_id: user_level === "1" ? user_admin_id : null,
              super_admin_id: user_level === "4" ? user_admin_id : null,
            },
          };

      const url = editingVenue
        ? `${encryptedUrl}/update_master1.php`
        : `${encryptedUrl}/insert_master.php`;

      setLoading(true);
      const response = await axios.post(url, JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.status === "success") {
        toast.success(
          `Venue successfully ${editingVenue ? "updated" : "added"}!`
        );
                fetchVenues();
                resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
            } else {
        toast.error(
          `Failed to ${editingVenue ? "update" : "add"} venue: ${
            response.data.message || "Unknown error"
          }`
        );
            }
        } catch (error) {
      toast.error(
        `An error occurred while ${editingVenue ? "updating" : "adding"} venue.`
      );
      console.error("Error saving venue:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
    setNewVenueName("");
    setNewVenueOccupancy("");
    setOperatingHours("");
        setOperatingHoursStart(null);
        setOperatingHoursEnd(null);
    setSelectedStatus("1");
    setEditingVenue(null);
    setVenueImage(null);
    setFileList([]);
    form.resetFields();
  };

  const handleEditClick = async (venue) => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchVenueById", id: venue.ven_id },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.status === "success") {
        const venueData = response.data.data[0];
        setNewVenueName(venueData.ven_name);
        setNewVenueOccupancy(venueData.ven_occupancy);
        setSelectedStatus(venueData.status_availability_id);
        setEditingVenue(venueData);

        if (venueData.ven_operating_hours) {
          const [start, end] = venueData.ven_operating_hours.split(" - ");
          setOperatingHours(venueData.ven_operating_hours);
          if (start && end) {
            setOperatingHoursStart(dayjs(start, "HH:mm:ss"));
            setOperatingHoursEnd(dayjs(end, "HH:mm:ss"));
                    }
        }

        form.setFieldsValue({
          venueName: venueData.ven_name,
          venueOccupancy: venueData.ven_occupancy,
          status: venueData.status_availability_id,
        });

        setIsEditModalOpen(true);
                } else {
        toast.error("Error fetching venue details: " + response.data.message);
                }
            } catch (error) {
      toast.error("An error occurred while fetching venue details.");
      console.error("Error fetching venue details:", error);
        }
    };

  const handleDeleteClick = (venue) => {
    setVenueToDelete(venue);
    setIsDeleteModalOpen(true);
    };

  const confirmDelete = async () => {
    if (!venueToDelete) return;

    const requestData = {
      operation: "archiveResource",
      resourceType: "venue",
      resourceId: venueToDelete.ven_id,
    };

        setLoading(true);
        try {
            const response = await axios.post(
                `${encryptedUrl}/delete_master.php`,
        JSON.stringify(requestData),
        { headers: { "Content-Type": "application/json" } }
            );

      if (response.data.status === "success") {
        toast.success("Venue archived successfully!");
                fetchVenues();
            } else {
                toast.error("Failed to archive venue: " + response.data.message);
            }
        } catch (error) {
      toast.error("An error occurred while archiving venue: " + error.message);
        } finally {
            setLoading(false);
      setIsDeleteModalOpen(false);
      setVenueToDelete(null);
        }
    };

  const handleRefresh = () => {
    fetchVenues();
    };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder="Search venue by name"
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
            Add Venue
          </Button>
                                    </div>
                                </div>
                            </div>
  );

  const columns = [
    {
      title: "Venue",
      dataIndex: "ven_name",
      key: "ven_name",
      sorter: true,
      sortOrder: sortField === "ven_name" ? sortOrder : null,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "ID",
      dataIndex: "ven_id",
      key: "ven_id",
      sorter: true,
      sortOrder: sortField === "ven_id" ? sortOrder : null,
    },
    {
      title: "Occupancy",
      dataIndex: "ven_occupancy",
      key: "ven_occupancy",
      sorter: true,
      sortOrder: sortField === "ven_occupancy" ? sortOrder : null,
      render: (text) => (
        <Tag
          color="blue"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text} people
        </Tag>
      ),
    },
    {
      title: "Operating Hours",
      dataIndex: "ven_operating_hours",
      key: "operating_hours",
      sorter: true,
      sortOrder: sortField === "ven_operating_hours" ? sortOrder : null,
      render: (text) => text || "N/A",
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
      dataIndex: "ven_created_at",
      key: "created_at",
      sorter: true,
      sortOrder: sortField === "ven_created_at" ? sortOrder : null,
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
                Venue Management
              </h2>
                        </div>
                            </motion.div>

          {/* Search and Filters */}
          <EnhancedFilters />

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white dark:bg-gray-800">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
                {filteredVenues.length > 0 ? (
                  filteredVenues
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.ven_id}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.ven_id}-${column.key}`}
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
                            No venues found
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
                total={filteredVenues.length}
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
            title={editingVenue ? "Edit Venue" : "Add Venue"}
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
                venueName: newVenueName,
                venueOccupancy: newVenueOccupancy,
                status: selectedStatus,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Form.Item
                        label="Venue Name"
                    name="venueName"
                    rules={[
                      {
                        required: true,
                        message: "Please input venue name!",
                      },
                    ]}
                    >
                        <Input
                            placeholder="Enter venue name"
                      onChange={handleVenueNameChange}
                        />
                    </Form.Item>

                  <Form.Item
                    label="Max Occupancy"
                    name="venueOccupancy"
                    rules={[
                      { required: true, message: "Please input occupancy!" },
                      {
                        pattern: /^[1-9]\d*$/,
                        message: "Please enter a valid number greater than 0",
                      },
                    ]}
                  >
                        <Input
                            type="number"
                      placeholder="Enter max occupancy"
                      onChange={handleVenueOccupancyChange}
                        />
                    </Form.Item>

                    <Form.Item 
                        label="Operating Hours"
                        required
                        tooltip="Select start and end time"
                    >
                        <TimePicker.RangePicker 
                            format="HH:mm:ss"
                            value={[operatingHoursStart, operatingHoursEnd]}
                            onChange={handleTimeChange}
                            className="w-full"
                      placeholder={["Start Time", "End Time"]}
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
                    label="Venue Image"
                    tooltip="Upload venue image (max 5MB)"
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

                  {editingVenue?.ven_pic && !venueImage && (
                    <div className="mt-4">
                      <img
                        src={`${encryptedUrl}/${editingVenue.ven_pic}`}
                        alt="Current Venue"
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
              description={`Are you sure you want to archive "${venueToDelete?.ven_name}"? This action cannot be undone.`}
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

export default VenueEntry;
