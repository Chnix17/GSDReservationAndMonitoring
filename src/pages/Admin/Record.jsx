import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {SecureStorage} from "../../utils/encryption";

import {

  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,

} from "@ant-design/icons";
import {
  Button,
  Empty,
  Input,
  Modal,
  Pagination,
  Spin,
  Tooltip,
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
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [exporting, setExporting] = useState(false);

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
      toast.error("Error fetching reservations. Please try again later.");
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
      toast.error("Failed to generate report.");
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
                Reservation Records
              </h2>
            </div>
          </motion.div>

          {/* Search, Filters, and Report Generation */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <div className="flex-grow w-full">
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
              <Tooltip title="Refresh data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="large"
                  style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Tooltip>
              {/* Month Picker and Generate Report Button */}
              <div className="flex flex-row items-center gap-2">
                <DatePicker
                  picker="month"
                  onChange={setSelectedMonth}
                  value={selectedMonth}
                  allowClear
                  placeholder="Select month"
                  style={{ minWidth: 140 }}
                  size="large"
                  disabled={exporting}
                />
                <Button
                  type="primary"
                  onClick={handleGenerateReport}
                  loading={exporting}
                  disabled={!selectedMonth || exporting}
                  className="bg-green-700 hover:bg-green-900 font-medium"
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </div>

          {/* Responsive Table / Cards */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100" style={{ minWidth: '100%' }}>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                {/* Desktop / Tablet: Table */}
                <div className="hidden md:block">
                  <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                    <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            scope="col"
                            className="px-4 py-4"
                            onClick={() => column.sorter && handleSort(column.dataIndex)}
                          >
                            <div className="flex items-center cursor-pointer hover:text-gray-900">
                              {column.title}
                              {sortField === column.dataIndex && (
                                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.length > 0 ? (
                        filteredReservations
                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                          .map((reservation) => (
                            <tr key={reservation.reservation_id} className="bg-white border-b last:border-b-0 border-gray-200">
                              {columns.map((column) => (
                                <td key={`${reservation.reservation_id}-${column.key}`} className="px-4 py-5">
                                  {column.render
                                    ? column.render(reservation[column.dataIndex], reservation)
                                    : reservation[column.dataIndex]}
                                </td>
                              ))}
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={columns.length} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
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

                {/* Mobile: Card list */}
                <div className="md:hidden p-2">
                  {filteredReservations.length > 0 ? (
                    filteredReservations
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((r) => (
                        <div key={r.reservation_id} className="mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs text-gray-500">{r.requester}</div>
                              <div className="text-base font-semibold text-gray-900 truncate">{r.title}</div>
                              <div className="mt-1 text-xs text-gray-600">{formatDateRange(r)}</div>
                            </div>
                            {(() => {
                              const statusStyle = getStatusStyle(r.status);
                              return (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                  {r.status}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button size="small" type="primary" onClick={() => showModal(r)} icon={<EyeOutlined />} className="bg-green-700 hover:bg-green-800">
                              Details
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span className="text-gray-500 dark:text-gray-400">No reservation records found</span>}
                      />
                    </div>
                  )}
                </div>

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
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                    className="flex justify-end"
                  />
                </div>
              </>
            )}
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
          toast.error("Error fetching reservation details");
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
        setDeansApproval([]);
      } finally {
        setIsLoadingDeans(false);
      }
    };

    fetchDeansApproval();
  }, [visible, modalData, baseUrl]);

  if (isLoading) {
    return (
      <Modal
        visible={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        maskClosable={false}
      >
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
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
    />
  );
};

export default Record;