import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";

import {
  Alert,
  Button,
  Input,
  Modal,
  Radio,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  BuildOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { FaBuilding, FaCar, FaTools } from "react-icons/fa";
import React, { useCallback, useEffect, useState } from "react";

import { SecureStorage } from "../utils/encryption";
import Sidebar from "./Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const { Search } = Input;

const ReservationRequests = () => {
  const [reservations, setReservations] = useState([]);
  const [userLevel, setUserLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isPriorityConflictModalOpen, setIsPriorityConflictModalOpen] =
    useState(false);
  const [conflictingReservations, setConflictingReservations] = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [filter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [sortField, setSortField] = useState("reservation_created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    declined: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const user_level_id = localStorage.getItem("user_level_id");
  const encryptedUrl = SecureStorage.getLocalItem("url");

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id");
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (
      encryptedUserLevel !== "1" &&
      encryptedUserLevel !== "2" &&
      encryptedUserLevel !== "4"
    ) {
      localStorage.clear();
      navigate("/gsd");
    }
  }, [navigate]);

  const updateStats = useCallback(
    (data) => {
      const computed = {
        total: data.length,
        pending: data.filter((item) => item.active === "1").length,
        approved: data.filter((item) => item.reservation_status === "Approved")
          .length,
        declined: data.filter((item) => item.reservation_status === "Declined")
          .length,
      };
      setStats(computed);
    },
    [setStats]
  );

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "fetchRequestReservation",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.status === "success") {
        setReservations(response.data.data);
        updateStats(response.data.data);
      } else {
        toast.error("No pending reservations found.");
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [setLoading, updateStats]);

  const fetchReservationDetails = async (reservationId) => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "fetchRequestById",
          reservation_id: reservationId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.status === "success" && response.data.data) {
        // Get the reservation details
        const details = response.data.data;

        // Fetch availability data
        const availabilityResponse = await axios.post(
          `${encryptedUrl}/process_reservation.php`,
          {
            operation: "doubleCheckAvailability",
            start_datetime: details.reservation_start_date,
            end_datetime: details.reservation_end_date,
          }
        );

        // Combine the details with availability data
        const detailsWithAvailability = {
          ...details,
          availabilityData:
            availabilityResponse.data?.status === "success"
              ? availabilityResponse.data.data
              : null,
        };

        setReservationDetails(detailsWithAvailability);
        setCurrentRequest({
          reservation_id: details.reservation_id,
          isUnderReview: details.active === "0",
        });
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Error fetching reservation details");
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handlePriorityCheck = async () => {
    try {
      const checkResponse = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "doubleCheckAvailability",
          start_datetime: reservationDetails.reservation_start_date,
          end_datetime: reservationDetails.reservation_end_date,
        }
      );

      if (checkResponse.data?.status === "success") {
        const data = checkResponse.data.data;
        const conflictingUsers = data.reservation_users || [];

        // Check if any of the requested resources are actually in conflict
        const hasVenueConflict = reservationDetails.venues?.some(
          (requestedVenue) =>
            data.unavailable_venues?.some(
              (unavailableVenue) =>
                requestedVenue.venue_id === unavailableVenue.ven_id
            )
        );

        const hasVehicleConflict = reservationDetails.vehicles?.some(
          (requestedVehicle) =>
            data.unavailable_vehicles?.some(
              (unavailableVehicle) =>
                requestedVehicle.vehicle_id === unavailableVehicle.vehicle_id
            )
        );

        const hasEquipmentConflict = reservationDetails.equipment?.some(
          (requestedEquipment) =>
            data.unavailable_equipment?.some(
              (unavailableEquipment) =>
                requestedEquipment.equipment_id ===
                unavailableEquipment.equip_id
            )
        );

        const hasAnyConflict =
          hasVenueConflict || hasVehicleConflict || hasEquipmentConflict;

        // If no actual conflicts found, return success
        if (!hasAnyConflict) {
          return {
            hasPriority: true,
            conflictingUsers: [],
            message: "",
            needsOverride: false,
          };
        }

        // If there are conflicts, check priority
        if (hasAnyConflict && conflictingUsers.length > 0) {
          const userPriorities = {
            COO: 4,
            "School Head": 3,
            Dean: 2,
            "Faculty&Staff": 1,
          };

          const currentUserLevel = reservationDetails.user_level_name;
          const currentPriority = userPriorities[currentUserLevel] || 0;

          const canOverride = conflictingUsers.every((conflictUser) => {
            const conflictingPriority =
              userPriorities[conflictUser.user_level_name] || 0;
            return currentPriority > conflictingPriority;
          });

          if (canOverride) {
            return {
              hasPriority: true,
              conflictingUsers,
              message: `The resources are currently reserved by users with lower priority. As a ${currentUserLevel}, you can bump this reservation.`,
              needsOverride: true,
            };
          } else {
            const highestConflictingLevel = conflictingUsers.reduce(
              (highest, user) => {
                const priority = userPriorities[user.user_level_name] || 0;
                return priority > (userPriorities[highest] || 0)
                  ? user.user_level_name
                  : highest;
              },
              ""
            );

            return {
              hasPriority: false,
              conflictingUsers,
              message: `Cannot accept this reservation. The resources are currently reserved by ${highestConflictingLevel} who has equal or higher priority.`,
            };
          }
        }

        // If we have conflicts but no conflicting users (shouldn't happen, but just in case)
        return {
          hasPriority: true,
          conflictingUsers: [],
          message: "",
          needsOverride: false,
        };
      }
      return {
        hasPriority: true,
        conflictingUsers: [],
        message: "",
        needsOverride: false,
      };
    } catch (error) {
      console.error("Priority check error:", error);
      throw error;
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const priorityCheckResult = await handlePriorityCheck();

      // If no priority, show error
      if (!priorityCheckResult.hasPriority) {
        Modal.error({
          title: "Cannot Accept Reservation",
          content: priorityCheckResult.message,
          centered: true,
        });
        setIsAccepting(false);
        return;
      }

      // If there are conflicts, show conflict modal
      if (
        priorityCheckResult.needsOverride &&
        priorityCheckResult.conflictingUsers.length > 0
      ) {
        setConflictingReservations(priorityCheckResult.conflictingUsers);
        setIsPriorityConflictModalOpen(true);
        setIsAccepting(false);
        return;
      }

      // If no conflicts, proceed with normal acceptance
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "handleRequest",
          reservation_id: currentRequest.reservation_id,
          is_accepted: true,
          user_id: SecureStorage.getSessionItem("user_id"),
          override_lower_priority: false,
        }
      );

      if (response.data?.status === "success") {
        toast.success("Reservation accepted successfully!", {
          icon: "✅",
          duration: 3000,
        });
        await fetchReservations();
        setIsDetailModalOpen(false);
      } else {
        toast.error("Failed to accept reservation.");
      }
    } catch (error) {
      toast.error(
        `Error accepting reservation: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsAccepting(false);
    }
  };

  // Handler for accepting with override
  const handleAcceptWithOverride = async () => {
    setIsAccepting(true);
    try {
      // Process to cancel existing lower priority reservations
      if (reservationDetails.availabilityData?.reservation_users) {
        for (const user of reservationDetails.availabilityData
          .reservation_users) {
          try {
            await axios.post(`${encryptedUrl}/process_reservation.php`, {
              operation: "handleCancelReservation",
              reservation_id: user.reservation_id,
              user_id: SecureStorage.getSessionItem("user_id"),
            });
          } catch (cancelError) {
            console.error("Error canceling reservation:", cancelError);
            throw new Error("Failed to cancel existing reservations");
          }
        }
      }

      // Now proceed with the acceptance
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "handleRequest",
          reservation_id: currentRequest.reservation_id,
          is_accepted: true,
          user_id: SecureStorage.getSessionItem("user_id"),
          override_lower_priority: true,
        }
      );

      if (response.data?.status === "success") {
        toast.success("Reservation accepted successfully!", {
          icon: "✅",
          duration: 3000,
        });
        await fetchReservations();
        setIsDetailModalOpen(false);
        setIsPriorityConflictModalOpen(false);
      } else {
        toast.error("Failed to accept reservation.");
      }
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to process reservation"}`);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "handleRequest",
          reservation_id: currentRequest.reservation_id,
          is_accepted: false,
          user_id: SecureStorage.getSessionItem("user_id"),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.status === "success") {
        toast.success("Reservation declined successfully!", {
          icon: "❌",
          duration: 3000,
        });
        await fetchReservations();
        setIsDeclineModalOpen(false); // Close the decline modal
        setIsDetailModalOpen(false); // Also close the detail modal
      } else {
        toast.error("Failed to decline reservation.");
      }
    } catch (error) {
      console.error("Decline error:", error);
      toast.error("Error declining reservation. Please try again.");
    } finally {
      setIsDeclining(false);
    }
  };

  const getIconForType = (type) => {
    const icons = {
      Equipment: <FaTools className="mr-2 text-orange-500" />,
      Venue: <FaBuilding className="mr-2 text-green-500" />,
      Vehicle: <FaCar className="mr-2 text-blue-500" />,
    };
    return icons[type] || null;
  };

  useEffect(() => {
    const level = localStorage.getItem("user_level");
    setUserLevel(level);
    fetchReservations();
  }, [fetchReservations, setUserLevel]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Define filteredReservations before it's used in sortedReservations
  const filteredReservations = reservations.filter(
    (reservation) =>
      (filter === "All" || (reservation.type && reservation.type === filter)) &&
      (searchTerm === "" ||
        reservation.reservation_id.toString().includes(searchTerm) ||
        (reservation.reservations_users_id &&
          reservation.reservations_users_id
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (reservation.reservation_title &&
          reservation.reservation_title
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (reservation.requester_name &&
          reservation.requester_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))) &&
      (!startDate ||
        new Date(reservation.reservation_start_date) >= startDate) &&
      (!endDate || new Date(reservation.reservation_end_date) <= endDate)
  );

  // Add new fetch functions for different request types
  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "fetchRequestReservation",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data?.status === "success") {
        const pendingRequests = response.data.data.filter(
          (request) => request.active === "1"
        );
        setReservations(pendingRequests);
        updateStats(response.data.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [setLoading, updateStats]);

  const fetchReviewRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "fetchRequestReservation",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data?.status === "success") {
        // Filter for active === "0"
        const reviewRequests = response.data.data.filter(
          (request) => request.active === "0"
        );
        setReservations(reviewRequests);
        updateStats(response.data.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "fetchHistoryRequests",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data?.status === "success") {
        setReservations(response.data.data);
        updateStats(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching history");
    } finally {
      setLoading(false);
    }
  };

  // Update tab change handler
  const handleTabChange = (key) => {
    setActiveTab(key);
    setReservations([]);
    setCurrentPage(1);
    switch (key) {
      case "1":
        fetchPendingRequests();
        break;
      case "2":
        fetchReviewRequests();
        break;
      case "3":
        fetchHistoryRequests();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleRefresh = () => {
    fetchReservations();
  };

  // Add this new Table component
  const RequestTable = ({ data, onView }) => {
    const getStatusColor = (status, active) => {
      if (active === "0") return "bg-y-400 text-yellow-800";
      switch (status) {
        case "Pending":
          return "bg-blue-100 text-blue-800";
        case "Approved":
          return "bg-green-100 text-green-800";
        case "Declined":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getStatusText = (status, active) => {
      return active === "0" ? "Final Confirmation" : "Waiting for Approval";
    };

    return (
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Title
              </th>
              <th scope="col" className="px-6 py-3">
                Description
              </th>
              <th scope="col" className="px-6 py-3">
                Requester
              </th>
              <th scope="col" className="px-6 py-3">
                Created At
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((record) => (
              <tr
                key={record.reservation_id}
                className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  <div className="flex items-center">
                    {getIconForType(record.type)}
                    <span className="ml-2">
                      {record.reservation_title ||
                        record.reservation_destination ||
                        "Untitled"}
                    </span>
                  </div>
                </th>
                <td className="px-6 py-4">{record.reservation_description}</td>
                <td className="px-6 py-4">{record.requester_name}</td>
                <td className="px-6 py-4">
                  {new Date(record.reservation_created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      record.reservation_status,
                      record.active
                    )}`}
                  >
                    {getStatusText(record.reservation_status, record.active)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onView(record.reservation_id)}
                    className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination - You'll need to implement this part */}
        <div className="flex items-center justify-between p-4">
          <div>
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredReservations.length)} of{" "}
            {filteredReservations.length} items
          </div>
          <div className="flex space-x-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage * pageSize >= filteredReservations.length}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="w-full md:w-auto md:flex-1">
            <Search
              placeholder="Search by ID, title, or requester"
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

  // Update the items array to use the new table component
  const items = [
    {
      key: "1",
      label: (
        <span>
          <ClockCircleOutlined /> Waiting for Approval
        </span>
      ),
      children: (
        <div className="mt-4">
          <RequestTable
            data={filteredReservations.filter((r) => r.active === "1")}
            onView={fetchReservationDetails}
          />
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <CheckCircleOutlined /> Final Confirmation
        </span>
      ),
      children: (
        <div className="mt-4">
          <RequestTable
            data={filteredReservations.filter((r) => r.active === "0")}
            onView={fetchReservationDetails}
          />
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <span>
          <HistoryOutlined /> History
        </span>
      ),
      children: (
        <div className="mt-4">
          <RequestTable
            data={filteredReservations}
            onView={fetchReservationDetails}
          />
        </div>
      ),
    },
  ];

  // Replace the existing card rendering code in the return statement
  return (
    <div className="flex flex-col lg:flex-row bg-gradient-to-br from-white to-green-100 min-h-screen">
      <Sidebar />
      <div className="flex-grow p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-4xl font-bold text-gray-800">
              Reservation Requests
            </h2>
          </div>
        </motion.div>

        {/* Enhanced Filters */}
        <EnhancedFilters />

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
          className="bg-white p-4 rounded-lg shadow-sm"
        />

        {/* Detail Modal for Accepting */}
        <DetailModal
          visible={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setCurrentRequest(null);
            setReservationDetails(null);
          }}
          reservationDetails={reservationDetails}
          setReservationDetails={setReservationDetails}
          onAccept={handleAccept}
          onDecline={() => setIsDeclineModalOpen(true)}
          isAccepting={isAccepting}
          isDeclining={isDeclining}
        />

        {/* Confirmation Modal for Declining */}
        <Modal
          title="Confirm Decline"
          visible={isDeclineModalOpen}
          onCancel={() => setIsDeclineModalOpen(false)}
          maskClosable={false}
          zIndex={1001}
          footer={[
            <Button key="back" onClick={() => setIsDeclineModalOpen(false)}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              danger
              loading={isDeclining}
              onClick={() => {
                handleDecline();
              }}
            >
              Decline
            </Button>,
          ]}
        >
          <p>
            Are you sure you want to decline this reservation? This action
            cannot be undone.
          </p>
        </Modal>

        {/* Priority Conflict Modal */}
        <PriorityConflictModal
          visible={isPriorityConflictModalOpen}
          onClose={() => setIsPriorityConflictModalOpen(false)}
          conflictingReservations={conflictingReservations}
          onConfirm={handleAcceptWithOverride}
        />
      </div>
    </div>
  );
};

// Add this utility function before the DetailModal component
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
    return `${
      monthNames[start.getMonth()]
    } ${start.getDate()}-${end.getDate()}\n${formatTime(start)} to ${formatTime(
      end
    )}`;
  }
};

const DetailModal = ({
  visible,
  onClose,
  reservationDetails,
  setReservationDetails,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}) => {
  const [tripTicketApproved, setTripTicketApproved] = useState(false);
  const encryptedUrl = SecureStorage.getLocalItem("url");

  const fetchReservationDetails = async (reservationId) => {
    try {
      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "fetchRequestById",
          reservation_id: reservationId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.status === "success" && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching reservation details:", error);
      toast.error("Error fetching reservation details");
      return null;
    }
  };

  if (!reservationDetails) return null;

  // Add trip ticket verification
  const needsTripTicketApproval = () => {
    if (!reservationDetails.drivers || reservationDetails.drivers.length === 0)
      return false;
    const driver = reservationDetails.drivers[0];

    // Case 1: If driver and name have values but is_accepted_trip is null - No trip ticket required
    if (
      driver &&
      driver.driver_id &&
      driver.name &&
      driver.is_accepted_trip === null
    ) {
      return false;
    }

    // Case 2: If driver and name are null but is_accepted_trip is 0 - Trip ticket required
    if (
      driver &&
      !driver.driver_id &&
      !driver.name &&
      driver.is_accepted_trip === "0"
    ) {
      return true;
    }

    // Case 3: If all values are null - No trip ticket required
    if (
      driver &&
      !driver.driver_id &&
      !driver.name &&
      driver.is_accepted_trip === null
    ) {
      return false;
    }

    // Default case
    return false;
  };

  const hasPendingTripTicket = () => {
    if (!reservationDetails.drivers || reservationDetails.drivers.length === 0)
      return false;
    const driver = reservationDetails.drivers[0];
    return driver.is_accepted_trip === "0";
  };

  const isTripApproved = () => {
    if (!reservationDetails.drivers || reservationDetails.drivers.length === 0)
      return false;
    const driver = reservationDetails.drivers[0];
    return driver.is_accepted_trip === "1";
  };

  const handleTripTicketApproval = async () => {
    try {
      const driver = reservationDetails.drivers[0];
      if (!driver || !driver.reservation_driver_id) {
        throw new Error("No driver information found");
      }

      const response = await axios.post(
        `${encryptedUrl}/process_reservation.php`,
        {
          operation: "updateTripTicket",
          reservation_driver_id: driver.reservation_driver_id,
        }
      );

      if (response.data?.status === "success") {
        toast.success("Trip ticket approved successfully");
        setTripTicketApproved(true);
        const updatedDetails = await fetchReservationDetails(
          reservationDetails.reservation_id
        );
        if (updatedDetails) {
          setReservationDetails(updatedDetails);
        }
      } else {
        throw new Error(
          response.data?.message || "Failed to update trip ticket"
        );
      }
    } catch (error) {
      console.error("Trip ticket update error:", error);
      toast.error(error.message || "Failed to update trip ticket");
      setTripTicketApproved(false);
    }
  };

  // Add priority checking logic
  const checkPriority = () => {
    const userPriorities = {
      COO: 4,
      "School Head": 3,
      Dean: 2,
      "Faculty&Staff": 1,
    };

    // First check if there are any actual resource conflicts
    const hasVenueConflict = reservationDetails.venues?.some((requestedVenue) =>
      reservationDetails.availabilityData?.unavailable_venues?.some(
        (unavailableVenue) =>
          requestedVenue.venue_id === unavailableVenue.ven_id
      )
    );

    const hasVehicleConflict = reservationDetails.vehicles?.some(
      (requestedVehicle) =>
        reservationDetails.availabilityData?.unavailable_vehicles?.some(
          (unavailableVehicle) =>
            requestedVehicle.vehicle_id === unavailableVehicle.vehicle_id
        )
    );

    const hasEquipmentConflict = reservationDetails.equipment?.some(
      (requestedEquipment) =>
        reservationDetails.availabilityData?.unavailable_equipment?.some(
          (unavailableEquipment) =>
            requestedEquipment.equipment_id === unavailableEquipment.equip_id
        )
    );

    const hasAnyResourceConflict =
      hasVenueConflict || hasVehicleConflict || hasEquipmentConflict;

    // If no resource conflicts, approve immediately
    if (!hasAnyResourceConflict) {
      return {
        hasPriority: true,
        message: "No conflicting reservations found.",
      };
    }

    // Only check priority if there are actual resource conflicts
    const currentPriority =
      userPriorities[reservationDetails.user_level_name] || 0;

    // Check against conflicting reservations
    const hasConflicts =
      reservationDetails.availabilityData?.reservation_users?.length > 0;

    if (!hasConflicts) {
      return {
        hasPriority: true,
        message: "No conflicting reservations found.",
      };
    }

    // Check if current request has higher priority than all conflicts
    const canOverride =
      reservationDetails.availabilityData.reservation_users.every(
        (conflictUser) => {
          const conflictingPriority =
            userPriorities[conflictUser.user_level_name] || 0;
          return currentPriority > conflictingPriority;
        }
      );

    return {
      hasPriority: canOverride,
      message: canOverride
        ? "You can override existing reservations due to higher priority."
        : "Cannot proceed - existing reservations have equal or higher priority.",
    };
  };

  const checkResourceAvailability = (type, id, data) => {
    if (!data) return true;

    switch (type) {
      case "venue":
        return !data.unavailable_venues?.some((v) => v.ven_id === id);
      case "vehicle":
        return !data.unavailable_vehicles?.some((v) => v.vehicle_id === id);
      case "equipment":
        return !data.unavailable_equipment?.some((e) => e.equipment_id === id);
      case "driver":
        return !data.unavailable_drivers?.some((d) => d.driver_id === id);
      default:
        return true;
    }
  };

  const getModalFooter = () => {
    if (reservationDetails.active === "0") {
      const priorityCheck = checkPriority();
      const isDisabled = needsTripTicketApproval()
        ? !tripTicketApproved
        : hasPendingTripTicket();

      return [
        <Button
          key="decline"
          danger
          loading={isDeclining}
          onClick={(e) => {
            e.stopPropagation();
            onDecline();
          }}
          size="large"
          icon={<CloseCircleOutlined />}
        >
          Decline
        </Button>,
        <Button
          key="accept"
          type="primary"
          loading={isAccepting}
          onClick={onAccept}
          size="large"
          icon={<CheckCircleOutlined />}
          disabled={!priorityCheck.hasPriority || isDisabled}
        >
          Accept
        </Button>,
      ];
    }
    return [
      <Button key="close" onClick={onClose} size="large">
        Close
      </Button>,
    ];
  };

  // Resource table columns definitions
  const columns = {
    venue: [
      {
        title: "Venue Name",
        dataIndex: "venue_name",
        key: "venue_name",
        render: (text, record) => (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BuildOutlined className="mr-2 text-purple-500" />
              <span className="font-medium">{text}</span>
            </div>
            <Tag
              color={
                checkResourceAvailability(
                  "venue",
                  record.venue_id,
                  reservationDetails.availabilityData
                )
                  ? "green"
                  : "red"
              }
            >
              {checkResourceAvailability(
                "venue",
                record.venue_id,
                reservationDetails.availabilityData
              )
                ? "Available"
                : "Not Available"}
            </Tag>
          </div>
        ),
      },
    ],
    vehicle: [
      {
        title: "Vehicle",
        dataIndex: "model",
        key: "model",
        render: (text, record) => (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CarOutlined className="mr-2 text-blue-500" />
              <span className="font-medium">{text}</span>
            </div>
            <Tag
              color={
                checkResourceAvailability(
                  "vehicle",
                  record.vehicle_id,
                  reservationDetails.availabilityData
                )
                  ? "green"
                  : "red"
              }
            >
              {checkResourceAvailability(
                "vehicle",
                record.vehicle_id,
                reservationDetails.availabilityData
              )
                ? "Available"
                : "Not Available"}
            </Tag>
          </div>
        ),
      },
      {
        title: "License Plate",
        dataIndex: "license",
        key: "license",
        render: (text) => <Tag color="blue">{text}</Tag>,
      },
    ],
    equipment: [
      {
        title: "Equipment",
        dataIndex: "name",
        key: "name",
        render: (text, record) => (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ToolOutlined className="mr-2 text-orange-500" />
              <span className="font-medium">{text}</span>
            </div>
            <Tag
              color={
                checkResourceAvailability(
                  "equipment",
                  record.equipment_id,
                  reservationDetails.availabilityData
                )
                  ? "green"
                  : "red"
              }
            >
              {checkResourceAvailability(
                "equipment",
                record.equipment_id,
                reservationDetails.availabilityData
              )
                ? "Available"
                : "Not Available"}
            </Tag>
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

  const priorityCheck = checkPriority();

  return (
    <Modal
      title={null}
      visible={visible}
      onCancel={onClose}
      width={window.innerWidth < 768 ? "90%" : 800} // Responsive width
      footer={getModalFooter()}
      className="reservation-detail-modal"
      bodyStyle={{ padding: "0" }}
      maskClosable={false}
      zIndex={1000}
      style={{ top: 20 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-500 p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <Tag
                  color={reservationDetails.active === "0" ? "gold" : "blue"}
                  className="text-sm px-3 py-1"
                >
                  {reservationDetails.active === "0"
                    ? "Final Confirmation"
                    : "Waiting for Approval"}
                </Tag>
              </div>
            </div>
            <div className="text-white text-right">
              <p className="text-white opacity-90 text-sm">Created on</p>
              <p className="font-semibold">
                {new Date(
                  reservationDetails.reservation_created_at
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Trip Ticket Approval Section - Only show if there are drivers */}
          {reservationDetails.drivers &&
            reservationDetails.drivers.length > 0 && (
              <>
                {needsTripTicketApproval() && (
                  <div className="mb-6">
                    <Alert
                      message="Trip Ticket Approval Required"
                      description="This reservation requires trip ticket approval before it can be accepted."
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                    <Radio.Group
                      onChange={(e) => {
                        if (e.target.value) {
                          handleTripTicketApproval();
                        }
                      }}
                      value={tripTicketApproved}
                    >
                      <Space direction="vertical">
                        <Radio value={true}>Approve Trip Ticket</Radio>
                      </Space>
                    </Radio.Group>
                  </div>
                )}

                {isTripApproved() && (
                  <div className="mb-6">
                    <Alert
                      message="Trip Ticket Status"
                      description="Trip ticket has been approved."
                      type="success"
                      showIcon
                    />
                  </div>
                )}
              </>
            )}

          {/* Priority and Existing Reservations Section - Moved to Top */}
          {reservationDetails.active === "0" && (
            <div className="mb-6 space-y-4">
              {/* Priority Status Alert */}
              <Alert
                message={
                  <span className="font-semibold">
                    {priorityCheck.hasPriority
                      ? "Priority Status: Approved"
                      : "Priority Status: Blocked"}
                  </span>
                }
                description={priorityCheck.message}
                type={priorityCheck.hasPriority ? "success" : "warning"}
                showIcon
                className="border border-gray-200 shadow-sm"
              />

              {/* Existing Reservations - Only show if there are actual resource conflicts */}
              {(() => {
                const hasVenueConflict = reservationDetails.venues?.some(
                  (requestedVenue) =>
                    reservationDetails.availabilityData?.unavailable_venues?.some(
                      (unavailableVenue) =>
                        requestedVenue.venue_id === unavailableVenue.ven_id
                    )
                );
                const hasVehicleConflict = reservationDetails.vehicles?.some(
                  (requestedVehicle) =>
                    reservationDetails.availabilityData?.unavailable_vehicles?.some(
                      (unavailableVehicle) =>
                        requestedVehicle.vehicle_id ===
                        unavailableVehicle.vehicle_id
                    )
                );
                const hasEquipmentConflict = reservationDetails.equipment?.some(
                  (requestedEquipment) =>
                    reservationDetails.availabilityData?.unavailable_equipment?.some(
                      (unavailableEquipment) =>
                        requestedEquipment.equipment_id ===
                        unavailableEquipment.equip_id
                    )
                );
                const hasResourceConflicts =
                  hasVenueConflict ||
                  hasVehicleConflict ||
                  hasEquipmentConflict;
                return (
                  hasResourceConflicts &&
                  reservationDetails.availabilityData?.reservation_users
                    ?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                      <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
                        <InfoCircleOutlined className="text-red-600" />
                        Existing Reservations
                      </h2>

                      <div className="space-y-4">
                        {reservationDetails.availabilityData.reservation_users.map(
                          (user, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Reserved by: {user.full_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Department: {user.departments_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Role: {user.user_level_name}
                                  </p>
                                </div>
                                <Tag color="blue">Priority: High</Tag>
                              </div>

                              <div className="mt-3">
                                <h4 className="font-medium text-gray-800">
                                  Reservation Title:{" "}
                                  {user.reservation_title ||
                                    "Untitled Reservation"}
                                </h4>
                                <h4>
                                  Reservation Description:{" "}
                                  {user.reservation_description}
                                </h4>
                              </div>

                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Start Time
                                    </p>
                                    <p className="font-medium">
                                      {new Date(
                                        user.reservation_start_date
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      End Time
                                    </p>
                                    <p className="font-medium">
                                      {new Date(
                                        user.reservation_end_date
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
          )}

          {/* Current Request Section - Moved Below */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <UserOutlined className="text-blue-600" />
                Current Request Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requester Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Requester Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserOutlined className="text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">
                          {reservationDetails.requester_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamOutlined className="text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium">
                          {reservationDetails.user_level_name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Schedule
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CalendarOutlined className="text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium">
                          {formatDateRange(
                            reservationDetails.reservation_start_date,
                            reservationDetails.reservation_end_date
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources Section */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  Requested Resources
                </h3>
                <div className="space-y-4">
                  {/* Venues */}
                  {reservationDetails.venues?.length > 0 && (
                    <Table
                      title={() => "Venues"}
                      dataSource={reservationDetails.venues}
                      columns={columns.venue}
                      pagination={false}
                      size="small"
                    />
                  )}

                  {/* Vehicles */}
                  {reservationDetails.vehicles?.length > 0 && (
                    <Table
                      title={() => "Vehicles"}
                      dataSource={reservationDetails.vehicles.map(
                        (vehicle) => ({
                          ...vehicle,
                          driver:
                            reservationDetails.drivers?.[0]?.name ||
                            "No driver assigned",
                        })
                      )}
                      columns={[
                        ...columns.vehicle,
                        {
                          title: "Driver",
                          dataIndex: "driver",
                          key: "driver",
                          render: (text) => (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <UserOutlined className="mr-2 text-blue-500" />
                                <span className="font-medium">{text}</span>
                              </div>
                            </div>
                          ),
                        },
                      ]}
                      pagination={false}
                      size="small"
                    />
                  )}

                  {/* Equipment */}
                  {reservationDetails.equipment?.length > 0 && (
                    <Table
                      title={() => "Equipment"}
                      dataSource={reservationDetails.equipment}
                      columns={columns.equipment}
                      pagination={false}
                      size="small"
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              {reservationDetails.reservation_description && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2 text-gray-800">
                    Description
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700">
                      {reservationDetails.reservation_description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const PriorityConflictModal = ({
  visible,
  onClose,
  conflictingReservations,
  onConfirm,
}) => {
  const encryptedUrl = SecureStorage.getLocalItem("url");

  const handleCancelAndReserve = async () => {
    try {
      // First cancel the existing reservations
      for (const reservation of conflictingReservations) {
        await axios.post(`${encryptedUrl}process_reservation.php`, {
          operation: "handleCancelReservation",
          reservation_id: reservation.reservation_id,
          user_id: SecureStorage.getSessionItem("user_id"),
        });
      }

      // After cancelling, proceed with the new reservation
      onConfirm();
      toast.success(
        "Successfully cancelled existing reservations and created new reservation."
      );
    } catch (error) {
      console.error("Error in cancel and reserve process:", error);
      toast.error("Failed to process the request. Please try again.");
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-500">
          <InfoCircleOutlined />
          <span>Existing Reservation Details</span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="cancelAndReserve"
          type="primary"
          danger
          onClick={handleCancelAndReserve}
          icon={<CloseCircleOutlined />}
        >
          Cancel Existing & Create New
        </Button>,
      ]}
    >
      <Alert
        message="Resource Conflict Detected"
        description="The following reservation is currently using these resources for the requested time slot. You can override this reservation based on priority level."
        type="warning"
        showIcon
        className="mb-4"
      />

      <div className="space-y-4">
        {conflictingReservations.map((reservation, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="grid gap-4">
              {/* Header with Priority Level */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {reservation.reservation_title || "Untitled Reservation"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created by {reservation.full_name}
                  </p>
                </div>
                <Tag color="blue" className="text-sm">
                  Priority: {reservation.user_level_name}
                </Tag>
              </div>

              {/* Department Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{reservation.departments_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Tag color="green">Active</Tag>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">
                  Schedule Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Start</p>
                      <p className="font-medium">
                        {new Date(
                          reservation.reservation_start_date
                        ).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">End</p>
                      <p className="font-medium">
                        {new Date(
                          reservation.reservation_end_date
                        ).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {reservation.reservation_description && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600">
                    {reservation.reservation_description}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default ReservationRequests;
