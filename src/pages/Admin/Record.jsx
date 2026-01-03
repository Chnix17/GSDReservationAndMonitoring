import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {SecureStorage} from "../../utils/encryption";
import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  Button,
  Empty,
  Input,
  Modal,
  Pagination,
  Spin,
  Tooltip,
  Card,
  Typography,
  Drawer
} from "antd";
import { ToastContainer, toast } from "react-toastify";
import { useEffect, useState, useCallback } from "react";
import { DatePicker } from "antd";
import Sidebar from '../../components/core/Sidebar';
import axios from "axios";
import moment from "moment";
import { motion } from "framer-motion";
import ReservationDetails from "../../components/core/reservation_details";
import { generateReservationReport } from "./core/excel_report";
import { useMediaQuery } from 'react-responsive';


const { Text } = Typography;

const Record = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });
  
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
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [exporting, setExporting] = useState(false);

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

  const fetchReservations = useCallback(async (url) => {
    if (!url) return;
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${url}/Admin.php`,
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
      if (error.code === 'ERR_NETWORK' || !error.response) {
        toast.error("Network connection lost. Please check your internet connection and try again.");
      } else {
        toast.error("Error fetching reservations. Please try again later.");
      }
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const url = SecureStorage.getLocalItem("url");
    setBaseUrl(url);
    fetchReservations(url);
  }, [fetchReservations]);

  const consolidateReservations = (data) => {
    return data.map((item) => ({
      key: item.reservation_id,
      reservation_id: item.reservation_id,
      title: item.reservation_title || "Untitled Reservation",
      description: item.reservation_description || "No description",
      start_date: item.reservation_start_date,
      end_date: item.reservation_end_date,
      reschedule_start_date: item.reschedule_start_date || null,
      reschedule_end_date: item.reschedule_end_date || null,
      status: item.reservation_status_name || "Unknown",
      requester: item.user_full_name || "Unknown",
      created_at: item.reservation_created_at,
      reservation_type: item.reservation_type || "Unknown",
    }));
  };

  const getStatusStyle = (status) => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    switch (normalizedStatus) {
      case 'pending admin approval':
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200'
        };
      case 'decline':
      case 'declined':
      case 'admin declined':
      case 'department head declined':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      case 'approve':
      case 'approved':
      case 'admin approved':
      case 'department head approved':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200'
        };
      case 'completed':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200'
        };
      case 'cancelled':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
      case 'reserved':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          border: 'border-purple-200'
        };
      case 'pending department approval':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-200'
        };
      case 'reschedule':
      case 'reschedule confirmed':
        return {
          bg: 'bg-indigo-100',
          text: 'text-indigo-800',
          border: 'border-indigo-200'
        };
      case 'change request':
        return {
          bg: 'bg-cyan-100',
          text: 'text-cyan-800',
          border: 'border-cyan-200'
        };
      case 'processed':
        return {
          bg: 'bg-teal-100',
          text: 'text-teal-800',
          border: 'border-teal-200'
        };
      case 'on going':
      case 'ongoing':
        return {
          bg: 'bg-lime-100',
          text: 'text-lime-800',
          border: 'border-lime-200'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
    }
  };

  const getReservationTypeStyle = (type) => {
    switch (type) {
      case 'Trip':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200'
        };
      case 'Activity/Event':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          border: 'border-purple-200'
        };
      case 'EQ':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-200'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
    }
  };

  // Compact human-friendly date range for table/cards
  const formatDateRange = (record) => {
    // Use reschedule dates if status is "Reschedule Confirmed" and reschedule dates exist
    const isRescheduleConfirmed = record.status === 'Reschedule Confirmed';
    const start = isRescheduleConfirmed && record.reschedule_start_date ? record.reschedule_start_date : record.start_date;
    const end = isRescheduleConfirmed && record.reschedule_end_date ? record.reschedule_end_date : record.end_date;
    
    if (!start || !end) return "-";
    const s = moment(start);
    const e = moment(end);
    if (!s.isValid() || !e.isValid()) return "-";
    // Same-day: show end time only on the right for brevity
    if (s.isSame(e, "day")) {
      return `${s.format("MMM D, YYYY h:mm A")} – ${e.format("h:mm A")}`;
    }
    return `${s.format("MMM D, YYYY h:mm A")} – ${e.format("MMM D, YYYY h:mm A")}`;
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
  
  const handleGenerateReport = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month first.");
      return;
    }
    if (!baseUrl) {
      toast.error("Base URL not set.");
      return;
    }
    setExporting(true);
    try {
      const monthStr = selectedMonth.format("YYYY-MM");
      const response = await axios.post(
        `${baseUrl}/Assigned&Records.php`,
        {
          operation: "fetchReservationGenerateReport",
          month: monthStr,
          user_personnel_id: SecureStorage.getSessionItem("user_id"),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data && Array.isArray(response.data.data)) {
        const exported = generateReservationReport(response.data.data, monthStr);
        if (exported) {
          toast.success("Report exported successfully!");
        } else {
          toast.error("No data found for the selected month.");
        }
      } else {
        toast.error("No data found for the selected month.");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      if (error.code === 'ERR_NETWORK' || !error.response) {
        toast.error("Network connection lost. Please check your internet connection and try again.");
      } else {
        toast.error("Failed to generate report.");
      }
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    // ID column removed
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      sorter: true,
      sortOrder: sortField === "title" ? sortOrder : null,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Requester",
      dataIndex: "requester",
      key: "requester",
      sorter: true,
      sortOrder: sortField === "requester" ? sortOrder : null,
      render: (text) => <span className="font-medium text-gray-700">{text}</span>,
    },
    {
      title: "Type",
      dataIndex: "reservation_type",
      key: "reservation_type",
      sorter: true,
      sortOrder: sortField === "reservation_type" ? sortOrder : null,
      render: (type) => {
        const typeStyle = getReservationTypeStyle(type);
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
            {type}
          </span>
        );
      },
    },
    {
      title: "Date Range",
      dataIndex: "start_date",
      key: "date_range",
      sorter: true,
      sortOrder: sortField === "start_date" ? sortOrder : null,
      render: (_, record) => (
        <div className="text-gray-600 whitespace-nowrap">
          {formatDateRange(record)}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusStyle = getStatusStyle(status);
        return (
          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            {status}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => showModal(record)}
          icon={<EyeOutlined />}
          className="bg-green-700 hover:bg-green-800 font-medium rounded-lg flex items-center"
        >
          <span className="hidden sm:inline">View Details</span>
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
      <div className="flex-grow overflow-y-auto">
        <div className={`${isMobile ? 'px-4 py-4 mt-5' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Reservation Records
              </h2>
            </div>
          </motion.div>

          {/* Search, Filters, and Report Generation */}
          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  placeholder={isMobile ? "Search records..." : "Search by ID, title, or requester"}
                  allowClear
                  prefix={<SearchOutlined />}
                  size={isMobile ? "middle" : "large"}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size={isMobile ? "middle" : "large"}
                  />
                </Tooltip>
                {/* Month Picker and Generate Report Button */}
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row'} items-center gap-2`}>
                  <DatePicker
                    picker="month"
                    onChange={setSelectedMonth}
                    value={selectedMonth}
                    allowClear
                    placeholder={isMobile ? "Month" : "Select month"}
                    style={{ minWidth: isMobile ? '100%' : 140 }}
                    size={isMobile ? "middle" : "large"}
                    disabled={exporting}
                    suffixIcon={<CalendarOutlined />}
                  />
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleGenerateReport}
                    loading={exporting}
                    disabled={!selectedMonth || exporting}
                    className="bg-green-600 hover:bg-green-700"
                    size={isMobile ? "middle" : "large"}
                  >
                    {isMobile ? "Report" : "Generate Report"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Responsive Table / Cards */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                {isMobile ? (
                  // Mobile Card View
                  <div className="p-3">
                    {filteredReservations.length > 0 ? (
                      filteredReservations
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((reservation) => {
                          const statusStyle = getStatusStyle(reservation.status);
                          const typeStyle = getReservationTypeStyle(reservation.reservation_type);
                          return (
                            <Card
                              key={reservation.reservation_id}
                              className="mb-3 shadow-sm"
                              size="small"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center min-w-0">
                                    <UserOutlined className="mr-2 text-green-900 flex-shrink-0" />
                                    <Text strong className="text-sm truncate">{reservation.title}</Text>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      icon={<EyeOutlined />}
                                      onClick={() => showModal(reservation)}
                                      size="small"
                                      type="primary"
                                      className="bg-green-600 hover:bg-green-700"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Text type="secondary" className="text-xs">Requester:</Text>
                                  <div className="text-sm font-medium">{reservation.requester}</div>
                                </div>
                                <div>
                                  <Text type="secondary" className="text-xs">Date & Time:</Text>
                                  <div className="text-xs text-gray-600">{formatDateRange(reservation)}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                                    {reservation.reservation_type}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                    {reservation.status}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          );
                        })
                    ) : (
                      <div className="text-center py-12">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-gray-500">
                              No reservation records found
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
                          {columns.map((column) => {
                            // Hide certain columns on tablet
                            if (isTablet && (column.key === 'reservation_type')) {
                              return null;
                            }
                            return (
                              <th
                                key={column.key}
                                scope="col"
                                className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'} cursor-pointer`}
                                onClick={() => column.sorter && handleSort(column.dataIndex)}
                              >
                                <div className="flex items-center">
                                  {column.title}
                                  {sortField === column.dataIndex && (
                                    <span className="ml-1">
                                      {sortOrder === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReservations.length > 0 ? (
                          filteredReservations
                            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                            .map((reservation) => (
                              <tr key={reservation.reservation_id} className="bg-white border-b last:border-b-0 border-gray-200">
                                {columns.map((column) => {
                                  // Hide certain columns on tablet
                                  if (isTablet && (column.key === 'reservation_type')) {
                                    return null;
                                  }
                                  return (
                                    <td key={`${reservation.reservation_id}-${column.key}`} className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'}`}>
                                      {column.render
                                        ? column.render(reservation[column.dataIndex], reservation)
                                        : reservation[column.dataIndex]}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={isTablet ? columns.length - 1 : columns.length} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<span className="text-gray-500 dark:text-gray-400">No reservation records found</span>}
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}


                {/* Pagination */}
                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredReservations.length}
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

          {/* Detail Modal/Drawer */}
          <DetailModal
            visible={isModalVisible}
            record={selectedRecord}
            onClose={() => {
              setIsModalVisible(false);
              setSelectedRecord(null);
            }}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

const DetailModal = ({ visible, record, onClose, isMobile, isTablet }) => {
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [deansApproval, setDeansApproval] = useState([]);
  const [isLoadingDeans, setIsLoadingDeans] = useState(false);

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
            `${baseUrl}/reservation.php`,
            {
              operation: "fetchRequestById",
              reservation_id: record.reservation_id,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data?.status === "success") {
            setModalData(response.data.data);
          } else {
            toast.error("Failed to fetch reservation details");
          }
        } catch (error) {
          console.error("Error fetching details:", error);
          if (error.code === 'ERR_NETWORK' || !error.response) {
            toast.error("Network connection lost. Unable to fetch reservation details.");
          } else {
            toast.error("Error fetching reservation details");
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [visible, record, baseUrl]);

  // Fetch Dean's Approval data
  useEffect(() => {
    const fetchDeansApproval = async () => {
      if (!visible || !modalData?.reservation_id || !baseUrl) {
        setDeansApproval([]);
        return;
      }

      setIsLoadingDeans(true);
      try {
        const response = await axios.post(`${baseUrl}/Admin.php`, {
          operation: 'fetchDeansApproval',
          reservation_id: modalData.reservation_id
        });
        
        if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
          setDeansApproval(response.data.data);
        } else {
          setDeansApproval([]);
        }
      } catch (error) {
        console.error('Error fetching deans approval:', error);
        if (error.code === 'ERR_NETWORK' || !error.response) {
          toast.error("Network connection lost. Unable to fetch approval details.");
        } else {
          toast.error("Error fetching approval details.");
        }
        setDeansApproval([]);
      } finally {
        setIsLoadingDeans(false);
      }
    };

    fetchDeansApproval();
  }, [visible, modalData, baseUrl]);

  if (isLoading) {
    const LoadingComponent = ({ children }) => (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );

    return isMobile ? (
      <Drawer
        title="Loading Reservation Details"
        placement="bottom"
        height="90%"
        open={visible}
        onClose={onClose}
        maskClosable={false}
      >
        <LoadingComponent />
      </Drawer>
    ) : (
      <Modal
        visible={visible}
        onCancel={onClose}
        footer={null}
        width={isTablet ? 700 : 800}
        maskClosable={false}
      >
        <LoadingComponent />
      </Modal>
    );
  }

  return (
    <ReservationDetails
      visible={visible}
      onClose={onClose}
      reservationDetails={modalData}
      deansApproval={deansApproval}
      isLoadingDeans={isLoadingDeans}
      isMobile={isMobile}
      isTablet={isTablet}
    />
  );
};

export default Record;