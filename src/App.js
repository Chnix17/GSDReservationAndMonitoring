import "./App.css";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import React, { createContext, useCallback, useEffect, useState } from "react";

import AccountSettings from "./pages/accountSettings";
import AddReservation from "./page_user/AddReservation"; // Import the AddReservation component
import AdminDashboard from "./pages/adminDashboard";
import Archive from "./pages/archive";
import AssignPersonnel from "./pages/AssignPersonnel";
import Calendar from "./pages/calendar";
import Chat from "./pages/chat";
import Checklists from "./pages/Checklist";
import Dashboard from "./page_user/dashboard";
import DeanAddReservation from "./page_dean/AddReservation";
import DeanDashboard from "./page_dean/dashboard";
import DeanViewReserve from "./page_dean/viewReserve";
import Departments from "./pages/departments";
import Equipment from "./pages/Equipment";
import Equipmentc from "./pages/equipmentCategory";
import Faculty from "./pages/Faculty";
import LandCalendar from "./pages/landCalendar";
import Logins from "./pages/logins";
import Master from "./pages/Master";
import NotFound from "./components/NotFound";
import PersonnelDashboard from "./page_personnel/dashboard";
import ProtectedRoute from "./utils/ProtectedRoute";
import Record from "./pages/Record";
import Reports from "./pages/Reports";
import { SecureStorage } from "./utils/encryption";
import { Toaster } from "sonner";
import Userlevel from "./pages/condition";
import VehicleEntry from "./pages/VehicleEntry";
import VehicleModel from "./pages/vehiclemodel";
import Vehiclec from "./pages/vehiclecategory";
import Vehiclem from "./pages/vehiclemake";
import Venue from "./pages/Venue";
import ViewApproval from "./page_dean/viewApproval";
import ViewRequest from "./pages/viewRequest";
import ViewReserve from "./page_user/viewReserve";
import ViewTask from "./page_personnel/ViewPersonnelTask";

// import Sidebar from './pages/Sidebar';
// import Login from './pages/Login';

// Updated casing to match file name

export const ThemeContext = createContext();

const App = () => {
  const defaultUrl = "http://localhost/coc/gsd/";
  const storedUrl = SecureStorage.getLocalItem("url");

  if (!storedUrl || storedUrl !== defaultUrl) {
    SecureStorage.setLocalItem("url", defaultUrl);
  }

  // Add state for the current theme
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  // Function to toggle the theme
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  }, []);

  const [isNotFoundVisible, setIsNotFoundVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Add URL validation
  useEffect(() => {
    const validPaths = [
      "/gsd",
      "/Admin",
      "/adminDashboard",
      "/VehicleEntry",
      "/Equipment",
      "/Faculty",
      "/departments",
      "/master",
      "/vehiclemake",
      "/vehiclecategory",
      "/position",
      "/equipmentCategory",
      "/condition",
      "/vehiclemodel",
      "/AssignPersonnel",
      "/LandCalendar",
      "/record",
      "/ViewRequest",
      "/Reports",
      "/Venue",
      "/equipmentCat",
      "/archive",
      "/deanDashboard",
      "/deanViewReserve",
      "/deanAddReservation",
      "/viewApproval",
      "/dashboard",
      "/viewReserve",
      "/addReservation",
      "/profile1",
      "/settings",
      "/calendar",
      "/chat",
      "/personnelDashboard",
      "/viewTask",
      "/Master",
      "/vehicleCategory",
      "/",
      "/Checklist",
      "/chatAdmin",
      "/AccountSettings",
      "/chatAdmin",
    ];

    if (!validPaths.includes(location.pathname)) {
      setIsNotFoundVisible(true);
    }
  }, [location]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`app-container ${theme}`}>
        <Toaster richColors position="top-center" duration={1500} />
        <NotFound
          isVisible={isNotFoundVisible}
          onClose={() => setIsNotFoundVisible(false)}
        />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/gsd" replace />} />
            <Route path="/gsd" element={<Logins />} />

            <Route
              path="/adminDashboard"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/VehicleEntry"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <VehicleEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Equipment"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Equipment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Faculty"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Faculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/master"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Master />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehiclemake"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Vehiclem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehiclecategory"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Vehiclec />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipmentCategory"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Equipmentc />
                </ProtectedRoute>
              }
            />
            <Route
              path="/condition"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Userlevel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehiclemodel"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <VehicleModel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AssignPersonnel"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <AssignPersonnel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/LandCalendar"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <LandCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Checklist"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Checklists />
                </ProtectedRoute>
              }
            />

            <Route
              path="/record"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Record />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ViewRequest"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <ViewRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Reports"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Venue"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Venue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipmentCat"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Equipmentc />
                </ProtectedRoute>
              }
            />
            <Route
              path="/archive"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <Archive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AccountSettings"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Super Admin"]}>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />

            {/* Dean/Secretary Routes */}
            <Route
              path="/deanDashboard"
              element={
                <ProtectedRoute allowedRoles={["Dean", "Secretary"]}>
                  <DeanDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deanViewReserve"
              element={
                <ProtectedRoute allowedRoles={["Dean", "Secretary"]}>
                  <DeanViewReserve />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deanAddReservation"
              element={
                <ProtectedRoute allowedRoles={["Dean", "Secretary"]}>
                  <DeanAddReservation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/viewApproval"
              element={
                <ProtectedRoute allowedRoles={["Dean", "Secretary"]}>
                  <ViewApproval />
                </ProtectedRoute>
              }
            />

            {/* User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["Faculty/Staff"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/viewReserve"
              element={
                <ProtectedRoute allowedRoles={["Faculty/Staff"]}>
                  <ViewReserve />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addReservation"
              element={
                <ProtectedRoute allowedRoles={["Faculty/Staff"]}>
                  <AddReservation />
                </ProtectedRoute>
              }
            />

            {/* Shared Routes (accessible by all authenticated users) */}

            <Route
              path="/calendar"
              element={
                <ProtectedRoute
                  allowedRoles={["Admin", "Dean", "Secretary", "Faculty/Staff"]}
                >
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute
                  allowedRoles={["Admin", "Dean", "Secretary", "Faculty/Staff"]}
                >
                  <Chat />
                </ProtectedRoute>
              }
            />

            {/* Personnel Routes */}
            <Route
              path="/personnelDashboard"
              element={
                <ProtectedRoute allowedRoles={["Personnel"]}>
                  <PersonnelDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/viewTask"
              element={
                <ProtectedRoute allowedRoles={["Personnel"]}>
                  <ViewTask />
                </ProtectedRoute>
              }
            />
            {/* chats */}
            <Route
              path="/chatAdmin"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "Personnel",
                    "Admin",
                    "Dean",
                    "Secretary",
                    "Faculty/Staff",
                  ]}
                >
                  <Chat />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
