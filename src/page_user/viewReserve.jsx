import "react-toastify/dist/ReactToastify.css";

import {
  AppstoreOutlined,
  BuildOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  FaBuilding,
  FaCalendar,
  FaCar,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaFileAlt,
  FaIdCard,
  FaMapMarkedAlt,
  FaTags,
  FaTools,
  FaUser,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { Modal, Table, Tabs } from "antd";
import React, { useCallback, useEffect, useState } from "react";

import { SecureStorage } from "../utils/encryption";
import Sidebar from "./component/user_sidebar";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const { TabPane } = Tabs;

const ViewReserve = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [reservations, setReservations] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReservation] = useState(null);

  const [detailedReservation] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);

  const statusColors = {
    confirmed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  };

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id");
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (encryptedUserLevel !== "3" && encryptedUserLevel !== "15") {
      localStorage.clear();
      navigate("/gsd");
    }
  }, [navigate]);

  const confirmCancelReservation = async () => {
    try {
      const userId = SecureStorage.getSessionItem("user_id");
      if (!userId) {
        toast.error("User session expired");
        navigate("/gsd");
        return;
      }

      const response = await fetch(
        "http://localhost/coc/gsd/process_reservation.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "handleCancelReservation",
            reservation_id: reservationToCancel.id,
            user_id: userId,
          }),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        // Update the local state
        setReservations((prevReservations) =>
          prevReservations.map((res) =>
            res.id === reservationToCancel.id
              ? { ...res, status: "cancelled" }
              : res
          )
        );
        toast.success(result.message || "Reservation cancelled successfully!");
        setShowCancelModal(false);
        setReservationToCancel(null);
      } else {
        toast.error(result.message || "Failed to cancel reservation");
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error("Failed to cancel reservation");
    }
  };

  const fetchReservations = useCallback(async () => {
    try {
      const userId = SecureStorage.getSessionItem("user_id");
      console.log("Fetching reservations for user:", userId);

      if (!userId) {
        toast.error("User session expired");
        navigate("/gsd");
        return;
      }

      const response = await fetch(
        "http://localhost/coc/gsd/faculty&staff.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "fetchMyReservation",
            userId: userId,
          }),
        }
      );

      const result = await response.json();
      console.log("API response:", result);

      if (result.status === "success" && result.data) {
        const transformedReservations = result.data.map((reservation) => {
          // Format creation date and time
          const createdAt = new Date(reservation.reservation_created_at);
          const formattedCreatedAt = format(createdAt, "MMM dd, yyyy h:mm a");

          return {
            id: reservation.reservation_id,
            title: reservation.reservation_title,
            description: reservation.reservation_description,
            startDate: new Date(reservation.reservation_start_date),
            endDate: new Date(reservation.reservation_end_date),
            participants: reservation.reservation_participants,
            createdAt: formattedCreatedAt,
            status: reservation.reservation_status || "pending", // Use the status from API
          };
        });
        setReservations(transformedReservations);
      } else {
        throw new Error(result.message || "Failed to fetch reservations");
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Failed to fetch reservations");
    }
  }, [navigate]);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const isLoggedIn = localStorage.getItem("loggedIn");

    if (!userId || !isLoggedIn) {
      toast.error("Please login first");
      navigate("/gsd"); // or wherever your login page is
      return;
    }

    console.log("User ID:", userId); // Debug log
    fetchReservations();
  }, [navigate, fetchReservations]);

  const filteredReservations = reservations.filter((reservation) =>
    activeFilter === "all" ? true : reservation.status === activeFilter
  );

  const handleViewReservation = async (reservation) => {
    try {
      // Fetch reservation details
      const response = await fetch(
        `http://localhost/coc/gsd/faculty&staff.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "fetchMyReservationbyId",
            reservationId: reservation.id,
          }),
        }
      );

      // Fetch status history
      const statusResponse = await fetch(
        `http://localhost/coc/gsd/faculty&staff.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "fetchStatusById",
            reservationId: reservation.id,
          }),
        }
      );

      const [result, statusResult] = await Promise.all([
        response.json(),
        statusResponse.json(),
      ]);

      if (result.status === "success") {
        const details = result.data;
        setReservationDetails({
          ...details,
          statusHistory:
            statusResult.status === "success" ? statusResult.data : [],
        });
        setIsDetailModalOpen(true);
      } else {
        throw new Error(
          result.message || "Failed to fetch reservation details"
        );
      }
    } catch (error) {
      console.error("Error fetching reservation details:", error);
      toast.error("Failed to fetch reservation details");
    }
  };

  const DetailModal = ({ visible, onClose, reservationDetails }) => {
    if (!reservationDetails) return null;

    const getStatusColor = () => {
      if (reservationDetails.active === "0") return "gold";
      switch (reservationDetails.reservation_status?.toLowerCase()) {
        case "approved":
          return "green";
        case "declined":
          return "red";
        case "pending":
          return "blue";
        default:
          return "blue";
      }
    };

    // Check if reservation is cancelled or completed
    const isCancelled = reservationDetails.statusHistory?.some(
      (status) => status.status_name === "Cancelled"
    );

    const isCompleted = reservationDetails.statusHistory?.some(
      (status) => status.status_name === "Completed" && status.active === "1"
    );

    const handleShowCancelModal = () => {
      setReservationToCancel({
        id: reservationDetails.reservation_id,
        name:
          reservationDetails.reservation_event_title ||
          reservationDetails.reservation_destination,
      });
      setShowCancelModal(true);
      onClose(); // Close the detail modal
    };

    // Function to format status timestamp
    const formatStatusDate = (dateString) => {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    };

    // Function to handle reservation cancellation
    const handleCancelReservation = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const response = await fetch(
          "http://localhost/coc/gsd/process_reservation.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operation: "handleCancelReservation",
              reservation_id: reservationDetails.reservation_id,
              user_id: userId,
            }),
          }
        );

        const result = await response.json();

        if (result.status === "success") {
          toast.success(result.message);
          onClose();
          fetchReservations(); // Refresh the list
        } else {
          toast.error(result.message || "Failed to cancel reservation");
        }
      } catch (error) {
        console.error("Error cancelling reservation:", error);
        toast.error("Failed to cancel reservation");
      }
    };

    // Table columns definition for resources
    const venueColumns = [
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
      {
        title: "Capacity",
        dataIndex: "occupancy",
        key: "occupancy",
      },
    ];

    const equipmentColumns = [
      {
        title: "Equipment",
        dataIndex: "name",
        key: "name",
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
      },
    ];

    return (
      <Modal
        title={null}
        visible={visible}
        onCancel={onClose}
        width={900}
        footer={[
          <button
            key="close"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>,
          !isCancelled && !isCompleted && (
            <button
              key="cancel"
              onClick={handleShowCancelModal}
              disabled={reservationDetails.active === "0"}
              className={`px-4 py-2 text-white rounded-lg ml-2 ${
                reservationDetails.active === "0"
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Cancel Reservation
            </button>
          ),
        ]}
        className="reservation-detail-modal"
        bodyStyle={{ padding: "0" }}
      >
        <div className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-6 rounded-t-lg">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {reservationDetails.reservation_event_title ||
                    reservationDetails.reservation_destination}
                </h1>
                <div className="flex items-center gap-2"></div>
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

          {/* Tabs Section */}
          <Tabs defaultActiveKey="1" className="p-6">
            <TabPane
              tab={
                <span>
                  <InfoCircleOutlined /> Details
                </span>
              }
              key="1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <UserOutlined className="text-blue-500" /> Requester
                      Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <UserOutlined className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Name</p>
                          <p className="font-medium">
                            {reservationDetails.requester_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-full">
                          <TeamOutlined className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Department</p>
                          <p className="font-medium">
                            {reservationDetails.department_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <CalendarOutlined className="text-orange-500" /> Schedule
                      Information
                    </h3>
                    <div className="space-y-2">
                      {reservationDetails.reservation_start_date && (
                        <div className="flex items-center gap-2">
                          <div className="bg-orange-100 p-2 rounded-full">
                            <CalendarOutlined className="text-orange-600" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Date & Time</p>
                            <p className="font-medium">
                              {format(
                                new Date(
                                  reservationDetails.reservation_start_date
                                ),
                                "MMM dd, yyyy h:mm a"
                              )}{" "}
                              -
                              {format(
                                new Date(
                                  reservationDetails.reservation_end_date
                                ),
                                "h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {reservationDetails.reservation_description && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Description
                  </h3>
                  <p className="text-gray-700">
                    {reservationDetails.reservation_description}
                  </p>
                </div>
              )}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <AppstoreOutlined /> Resources
                </span>
              }
              key="2"
            >
              <div className="space-y-8">
                {reservationDetails.venues?.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-purple-50 p-4 border-b border-purple-100">
                      <h3 className="text-lg font-medium text-purple-800 flex items-center">
                        <BuildOutlined className="mr-2" /> Venue Information
                      </h3>
                    </div>
                    <div className="p-4">
                      <Table
                        dataSource={reservationDetails.venues}
                        columns={venueColumns}
                        pagination={false}
                        rowKey="venue_id"
                      />
                    </div>
                  </div>
                )}

                {reservationDetails.equipment?.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-orange-50 p-4 border-b border-orange-100">
                      <h3 className="text-lg font-medium text-orange-800 flex items-center">
                        <ToolOutlined className="mr-2" /> Equipment Information
                      </h3>
                    </div>
                    <div className="p-4">
                      <Table
                        dataSource={reservationDetails.equipment}
                        columns={equipmentColumns}
                        pagination={false}
                        rowKey="equipment_id"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <CalendarOutlined /> Status Log
                </span>
              }
              key="3"
            >
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <CalendarOutlined className="text-blue-500" /> Status
                    History
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {reservationDetails.statusHistory &&
                    reservationDetails.statusHistory.map((status, index) => (
                      <div
                        key={index}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                status.status_name?.toLowerCase() === "approved"
                                  ? "bg-green-500"
                                  : status.status_name?.toLowerCase() ===
                                    "declined"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }`}
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {status.status_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatStatusDate(status.updated_at)}
                                {status.updated_by_full_name &&
                                  status.status_name !== "Pending" && (
                                    <span className="ml-2 text-gray-400">
                                      • Updated by {status.updated_by_full_name}
                                    </span>
                                  )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  {(!reservationDetails.statusHistory ||
                    reservationDetails.statusHistory.length === 0) && (
                    <div className="p-4 text-center text-gray-500">
                      No status history available
                    </div>
                  )}
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Modal>
    );
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Filter buttons */}
            <div className="flex gap-4 mb-6">
              {["all", "confirmed", "pending", "cancelled"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full capitalize ${
                    activeFilter === filter
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  } transition duration-300 ease-in-out shadow-sm`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Enhanced Reservations Grid */}
            <div className="grid gap-6">
              {filteredReservations.map((reservation) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {reservation.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FaCalendar size={14} className="text-blue-500" />
                          <span>Created on {reservation.createdAt}</span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[reservation.status]
                        }`}
                      >
                        {reservation.status}
                      </span>
                    </div>

                    <div className="flex justify-end mt-4 gap-2">
                      <button
                        onClick={() => handleViewReservation(reservation)}
                        className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
                      >
                        <FaEye size={16} />
                        <span className="text-sm">View Details</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* All modals */}
            {/* View Reservation Modal - VENUE */}
            {showViewModal &&
              selectedReservation &&
              detailedReservation &&
              selectedReservation.type === "venue" && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-green-400 px-8 py-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <FaCalendar />
                          Venue Reservation Details
                        </h2>
                        <button
                          onClick={() => setShowViewModal(false)}
                          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      <div className="grid grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Event Information
                            </h3>
                            <div className="space-y-4">
                              <InfoField
                                icon={<FaCalendar className="text-green-500" />}
                                label="Event Title"
                                value={
                                  detailedReservation.venue_form_event_title ||
                                  "N/A"
                                }
                              />
                              <InfoField
                                icon={<FaUser className="text-green-500" />}
                                label="Department"
                                value={detailedReservation.departments_name}
                              />
                              <InfoField
                                icon={<FaUsers className="text-green-500" />}
                                label="Participants"
                                value={
                                  detailedReservation.venue_participants ||
                                  "N/A"
                                }
                              />
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Venue & Equipment
                            </h3>
                            <div className="space-y-4">
                              <InfoField
                                icon={<FaBuilding className="text-green-500" />}
                                label="Venue"
                                value={detailedReservation.venue_name || "N/A"}
                              />
                              <InfoField
                                icon={<FaTools className="text-green-500" />}
                                label="Equipment"
                                value={
                                  detailedReservation.equipment_name
                                    ? `${detailedReservation.equipment_name} (${detailedReservation.reservation_equipment_quantity})`
                                    : "No equipment requested"
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Schedule
                            </h3>
                            <div className="space-y-4">
                              <InfoField
                                icon={<FaClock className="text-green-500" />}
                                label="Start Date & Time"
                                value={format(
                                  new Date(
                                    detailedReservation.venue_form_start_date
                                  ),
                                  "MMM dd, yyyy HH:mm"
                                )}
                              />
                              <InfoField
                                icon={<FaClock className="text-green-500" />}
                                label="End Date & Time"
                                value={format(
                                  new Date(
                                    detailedReservation.venue_form_end_date
                                  ),
                                  "MMM dd, yyyy HH:mm"
                                )}
                              />
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Status Information
                            </h3>
                            <div className="space-y-4">
                              <InfoField
                                icon={
                                  <FaCheckCircle className="text-green-500" />
                                }
                                label="GSD Status"
                                value={
                                  detailedReservation.current_reservation_status ||
                                  "Pending"
                                }
                                className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                                  statusColors[
                                    detailedReservation.current_reservation_status?.toLowerCase() ||
                                      "pending"
                                  ]
                                }`}
                              />
                              <InfoField
                                icon={
                                  <FaUserShield className="text-green-500" />
                                }
                                label="Dean Status"
                                value={
                                  detailedReservation.status_approval_name ||
                                  "Pending"
                                }
                                className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                                  detailedReservation.status_approval_name?.toLowerCase() ===
                                  "approve"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-8 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowViewModal(false)}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

            {/* View Reservation Modal - VEHICLE */}
            {showViewModal &&
              selectedReservation &&
              detailedReservation &&
              selectedReservation.type === "vehicle" && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-8 py-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <FaCar />
                          Vehicle Reservation Details
                        </h2>
                        <button
                          onClick={() => setShowViewModal(false)}
                          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      <div className="grid grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Reservation Details
                            </h3>
                            <div className="space-y-4">
                              <InfoField
                                icon={<FaUser className="text-blue-500" />}
                                label="Reserved By"
                                value={
                                  detailedReservation.vehicle_form_user_full_name
                                }
                              />
                              <InfoField
                                icon={<FaBuilding className="text-blue-500" />}
                                label="Department"
                                value={detailedReservation.departments_name}
                              />
                              <InfoField
                                icon={
                                  <FaMapMarkedAlt className="text-blue-500" />
                                }
                                label="Destination"
                                value={
                                  detailedReservation.vehicle_form_destination
                                }
                              />
                              <InfoField
                                icon={<FaFileAlt className="text-blue-500" />}
                                label="Purpose"
                                value={detailedReservation.vehicle_form_purpose}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Vehicle Information
                            </h3>
                            <div className="space-y-4">
                              <InfoField
                                icon={<FaCar className="text-blue-500" />}
                                label="Vehicle"
                                value={`${detailedReservation.vehicle_make} ${detailedReservation.vehicle_model}`}
                              />
                              <InfoField
                                icon={<FaIdCard className="text-blue-500" />}
                                label="License Plate"
                                value={detailedReservation.vehicle_license}
                              />
                              <InfoField
                                icon={<FaTags className="text-blue-500" />}
                                label="Category"
                                value={detailedReservation.vehicle_category}
                              />
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Schedule
                            </h3>
                            <div className="space-y-4">
                              <InfoField
                                icon={<FaClock className="text-blue-500" />}
                                label="Start Date & Time"
                                value={format(
                                  new Date(
                                    detailedReservation.vehicle_form_start_date
                                  ),
                                  "MMM dd, yyyy HH:mm"
                                )}
                              />
                              <InfoField
                                icon={<FaClock className="text-blue-500" />}
                                label="End Date & Time"
                                value={format(
                                  new Date(
                                    detailedReservation.vehicle_form_end_date
                                  ),
                                  "MMM dd, yyyy HH:mm"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {detailedReservation.passenger_names && (
                        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Passengers
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {detailedReservation.passenger_names
                              .split(",")
                              .map((passenger, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                >
                                  {passenger.trim()}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-8 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowViewModal(false)}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

            {/* Cancel Reservation Modal */}
            {showCancelModal && reservationToCancel && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl p-8 w-full max-w-md transform transition-all duration-300 ease-in-out"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Confirm Cancellation</h2>
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      &times;
                    </button>
                  </div>
                  <p>
                    Are you sure you want to cancel the reservation "
                    {reservationToCancel.name}"?
                  </p>
                  <div className="flex justify-end mt-6 gap-4">
                    <button
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                      onClick={() => setShowCancelModal(false)}
                    >
                      No, Keep Reservation
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      onClick={confirmCancelReservation}
                    >
                      Yes, Cancel Reservation
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isDetailModalOpen && (
        <DetailModal
          visible={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setCurrentRequest(null);
            setReservationDetails(null);
          }}
          reservationDetails={reservationDetails}
        />
      )}
    </div>
  );
};

const InfoField = ({ label, value, className, icon }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <h3 className="text-sm font-medium text-gray-500">{label}</h3>
    </div>
    <p className={`mt-1 ${className || "text-gray-900"}`}>{value}</p>
  </div>
);

export default ViewReserve;
