import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {SecureStorage} from "../utils/encryption";

import {
  BuildOutlined,
  CalendarOutlined,
  CarOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Empty,
  Input,
  Modal,
  Pagination,

  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { ToastContainer, toast } from "react-toastify";
import { useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import axios from "axios";
import moment from "moment";
import { motion } from "framer-motion";


const Record = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("reservation_created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    const url = SecureStorage.getLocalItem("url");
    setBaseUrl(url);
    fetchReservations(url);
  }, []);

  const fetchReservations = async (url) => {
    if (!url) return;
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${url}//records&reports.php`,
        {
          operation: "fetchRecord",
          json: {},
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.data?.status === "success" &&
        Array.isArray(response.data.data)
      ) {
        const uniqueData = [
          ...new Map(
            response.data.data.map((item) => [item.reservation_id, item])
          ).values(),
        ];
        const consolidatedData = consolidateReservations(uniqueData);
        setReservations(consolidatedData);
      } else {
        toast.error("No reservations found.");
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Error fetching reservations. Please try again later.");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const consolidateReservations = (data) => {
    return data.map((item) => ({
      key: item.reservation_id,
      reservation_id: item.reservation_id,
      title: item.reservation_title || "Untitled Reservation",
      description: item.reservation_description || "No description",
      start_date: item.reservation_start_date,
      end_date: item.reservation_end_date,
      status: item.reservation_status_name || "Unknown",
      requester: item.user_full_name || "Unknown",
      created_at: item.reservation_created_at,
    }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approve":
      case "approved":
        return "green";
      case "pending":
        return "blue";
      case "decline":
      case "declined":
        return "red";
      case "reserved":
        return "blue";
      case "cancelled":
        return "gray";
      default:
        return "default";
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

  const getFilteredReservations = () => {
    return reservations.filter((reservation) => {
      const searchLower = searchText.toLowerCase();
      return (
        reservation.title?.toLowerCase().includes(searchLower) ||
        reservation.description?.toLowerCase().includes(searchLower) ||
        reservation.requester?.toLowerCase().includes(searchLower) ||
        reservation.reservation_id?.toString().includes(searchLower)
      );
    });
  };

  const showModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleRefresh = () => {
    fetchReservations(baseUrl);
  };
  
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      sorter: true,
      sortOrder: sortField === "title" ? sortOrder : null,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <span className="line-clamp-2">{text}</span>,
    },
    {
      title: "Requester",
      dataIndex: "requester",
      key: "requester",
      sorter: true,
      sortOrder: sortField === "requester" ? sortOrder : null,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      sorter: true,
      sortOrder: sortField === "created_at" ? sortOrder : null,
      render: (text) => moment(text).format("MMM D, YYYY h:mm A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => showModal(record)}
          icon={<EyeOutlined />}
          className="bg-green-900 hover:bg-lime-900 font-medium"
        >
          View
        </Button>
      ),
    },
  ];

  const filteredReservations = getFilteredReservations();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="p-[2.5rem] lg:p-12 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-custom-font font-bold text-green-900 mt-5">
                Reservation Records
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder="Search by ID, title, or requester"
                    allowClear
                    prefix={<SearchOutlined />}
                    size="large"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
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

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-24 text-center"
                    >
                      <Spin size="large" />
                    </td>
                  </tr>
                ) : filteredReservations.length > 0 ? (
                  filteredReservations
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((reservation) => (
                    <tr
                      key={reservation.reservation_id}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {columns.map((column) => (
                        <td
                          key={`${reservation.reservation_id}-${column.key}`}
                          className="px-6 py-4"
                        >
                          {column.render
                            ? column.render(
                                reservation[column.dataIndex],
                                reservation
                              )
                            : reservation[column.dataIndex]}
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
                            No reservation records found
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
                total={filteredReservations.length}
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

          {/* Detail Modal */}
          <DetailModal
            visible={isModalVisible}
            record={selectedRecord}
            onClose={() => {
              setIsModalVisible(false);
              setSelectedRecord(null);
            }}
          />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

const DetailModal = ({ visible, record, onClose }) => {
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    const url = SecureStorage.getLocalItem("url");
    setBaseUrl(url);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (visible && record?.reservation_id && baseUrl) {
        setIsLoading(true);
        try {
          const response = await axios.post(
            `${baseUrl}/records&reports.php`,
            {
              operation: "getReservationDetailsById",
              json: {
                reservation_id: record.reservation_id,
              },
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data?.status === "success") {
            setModalData(response.data.data);
          }
        } catch (error) {
          toast.error("Error fetching details");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [visible, record, baseUrl]);

  const getIconForType = (type) => {
    const icons = {
      Equipment: <ToolOutlined className="mr-2 text-orange-500" />,
      Venue: <BuildOutlined className="mr-2 text-green-500" />,
      Vehicle: <CarOutlined className="mr-2 text-blue-500" />,
    };
    return icons[type] || null;
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const isSameDay = start.toDateString() === end.toDateString();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const formatTime = (date) => {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    if (isSameDay) {
      return `${monthNames[start.getMonth()]} ${start.getDate()} ${formatTime(
        start
      )} to ${formatTime(end)}`;
    } else {
      return `${monthNames[start.getMonth()]} ${start.getDate()}-${
        monthNames[end.getMonth()]
      } ${end.getDate()}\n${formatTime(start)} to ${formatTime(end)}`;
    }
  };

  const ReservedItemsTable = ({ items, type }) => {
    if (!items || items.length === 0) return null;

    const columns = {
      venue: [
        {
          title: "Venue Name",
          dataIndex: "venue_name",
          key: "venue_name",
          render: (text) => (
            <div className="flex items-center">
              <BuildOutlined className="mr-2 text-purple-500" />
              <span className="font-medium">{text}</span>
            </div>
          ),
        },
      ],
      vehicle: [
        {
          title: "Vehicle",
          dataIndex: "vehicle_name",
          key: "vehicle_name",
          render: (text) => (
            <div className="flex items-center">
              <CarOutlined className="mr-2 text-blue-500" />
              <span className="font-medium">{text}</span>
            </div>
          ),
        },
        {
          title: "Driver",
          dataIndex: "driver_name",
          key: "driver_name",
          render: (text) => (
            <div className="flex items-center">
              <UserOutlined className="mr-2 text-blue-500" />
              <span className="font-medium">
                {text || "No driver assigned"}
              </span>
            </div>
          ),
        },
      ],
      equipment: [
        {
          title: "Equipment",
          dataIndex: "equipment_name",
          key: "equipment_name",
          render: (text) => (
            <div className="flex items-center">
              <ToolOutlined className="mr-2 text-orange-500" />
              <span className="font-medium">{text}</span>
            </div>
          ),
        },
        {
          title: "Quantity",
          dataIndex: "quantity",
          key: "quantity",
          render: (text) => <Tag color="orange">Qty: {text}</Tag>,
        },
      ],
    };

    return (
      <Table
        dataSource={items}
        columns={columns[type]}
        pagination={false}
        size="small"
        className="mb-4"
      />
    );
  };

  return (
    <Modal
      title={null}
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button 
          key="close" 
          onClick={onClose} 
          size="large"
          className="bg-green-900 hover:bg-lime-900 text-white"
        >
          Close
        </Button>,
      ]}
      className="reservation-detail-modal"
      bodyStyle={{ padding: "0" }}
      maskClosable={false}
      zIndex={1000}
      closable={false}
    >
      <div className="p-0">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-600 to-lime-500 p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {modalData?.reservation_title || "Reservation Details"}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Tag
                  color={
                    modalData?.status_request === "Approved"
                      ? "green"
                      : modalData?.status_request === "Declined"
                      ? "red"
                      : "blue"
                  }
                  className="text-sm px-3 py-1"
                >
                  {modalData?.status_request || "Unknown Status"}
                </Tag>
              </div>
            </div>
            <div className="text-white text-right">
              <p className="text-white opacity-90 text-sm">Created on</p>
              <p className="font-semibold">
                {modalData?.reservation_created_at
                  ? new Date(modalData.reservation_created_at).toLocaleString()
                  : "Unknown date"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 bg-[#fafff4]">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requester Information */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium mb-4 text-green-900">
                      Requester Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">
                            {modalData?.full_name || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TeamOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-medium">
                            {modalData?.department_name || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium mb-4 text-green-900">
                      Schedule
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Date & Time</p>
                          <p className="font-medium">
                            {modalData?.reservation_start_date &&
                            modalData?.reservation_end_date
                              ? formatDateRange(
                                  modalData.reservation_start_date,
                                  modalData.reservation_end_date
                                )
                              : "Unknown schedule"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TeamOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Participants</p>
                          <p className="font-medium">
                            {modalData?.reservation_participants || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resources Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4 text-green-900">
                    Requested Resources
                  </h3>
                  <div className="space-y-4">
                    {/* Venues */}
                    {modalData?.venues?.length > 0 && (
                      <ReservedItemsTable
                        items={modalData.venues}
                        type="venue"
                      />
                    )}

                    {/* Vehicles */}
                    {modalData?.vehicles?.length > 0 && (
                      <ReservedItemsTable
                        items={modalData.vehicles}
                        type="vehicle"
                      />
                    )}

                    {/* Equipment */}
                    {modalData?.equipment?.length > 0 && (
                      <ReservedItemsTable
                        items={modalData.equipment}
                        type="equipment"
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                {modalData?.reservation_description && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 text-green-900">
                      Description
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-700">
                        {modalData.reservation_description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Record;