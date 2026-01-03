import React, { useState, createContext, useCallback, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import VehicleEntry from './pages/Admin/VehicleEntry';
import PersonnelDashboard from './pages/Personnel/dashboard';
import ViewTask from './pages/Personnel/ViewPersonnelTask';
import Venue from './pages/Admin/Venue';
import  Dashboard from './pages/User/dashboard';
import Equipment from './pages/Admin/Equipment';
import ViewRequest from './pages/Admin/viewRequest';
import AddReservation from './components/Reservation/AddReservation'; 
import { Toaster } from 'sonner';
import VenueBuilding from './pages/Admin/venueBuilding';
import './App.css'; 
// import Logins from './pages/logins';
import AdminDashboard from './pages/Admin/adminDashboard';
import Faculty from './pages/Admin/Faculty';  // Updated casing to match file name


import Vehiclem from './pages/Admin/vehiclemake';
import Departments from './pages/Admin/departments';
import Vehiclec from './pages/Admin/vehiclecategory';
import Equipmentc from './pages/Admin/equipmentCategory';

import VehicleModel from './pages/Admin/vehiclemodel';
// import ViewReserve from './pages/User/viewReserve';

import Record from './pages/Admin/Record';
import AllJobOrders from './pages/Admin/AllJobOrders';
import ViewApproval from './pages/Dean/viewApproval';
import DeanDashboard from './pages/Dean/dashboard';
import MyTicketRequest from './pages/Dean/MyTicketRequest';
import Chat from './components/core/chat';
import ProtectedRoute from './utils/ProtectedRoute';
import AssignPersonnel from './pages/Admin/AssignPersonnel';
import AssignApproval from './pages/Admin/assignApproval';
import AssignApprovalVenue from './pages/Admin/assignApprovalVenue';
import AssignRoleExclusive from './pages/Admin/assignRoleExclusive';
import LandCalendar from './pages/Admin/landCalendar';
import Archive from './pages/Admin/archive';
import NotFound from './utils/NotFound';
import Checklists from './pages/Admin/Checklist';
import Reports from './pages/Admin/Reports';
import { SecureStorage } from './utils/encryption';

import Holiday from './pages/Admin/Holiday';
import DriverDashboard from './pages/Driver/DriverDashboard';
import DriverTrips from './pages/Driver/Trips'
import AuditTrail from './pages/Admin/audit_trail';
import Notification from './components/core/main_notification';
import MyReservation from './components/core/viewReserve';
import RoleRedirect from './utils/RoleRedirect';

import VenueSchedule from './pages/Admin/VenueSchedule'
// Ensure the push notification manager module loads and attaches to window
import './utils/pushNotificationManager';
import AdminLayout from './layouts/AdminLayout';
import FacultyLayout from './layouts/FacultyLayout';
import DepartmentLayout from './layouts/DepartmentLayout';
import PersonnelLayout from './layouts/PersonnelLayout';
import DriverLayout from './layouts/DriverLayout';
import LoginRedirect from './components/LoginRedirect';
import { getApiBaseUrl } from './utils/apiConfig';

// Service worker registration is handled by pushNotificationManager.js



export const ThemeContext = createContext();

const App = () => {
    const initializeApiUrl = () => {
        const defaultUrl = getApiBaseUrl();
        const storedUrl = SecureStorage.getLocalItem("url");
        
        if (!storedUrl || storedUrl !== defaultUrl) {
            SecureStorage.setLocalItem("url", defaultUrl);
        }
    };

    useEffect(() => {
        initializeApiUrl();
    }, []);

    // Service worker registration is handled by pushNotificationManager.js

    // Add state for the current theme
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'light';
    });

    // Function to toggle the theme
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    }, []);

    // Removed manual URL validation; rely on router's catch-all 404 route

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={`app-container ${theme}`}>
                <Toaster richColors position='top-center' duration={1500} />
                <main className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LoginRedirect />} />
                        <Route index element={<LoginRedirect />} />

                        {/* New Nested Route Entrypoints */}
                        <Route path="/Admin/*" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><AdminLayout /></ProtectedRoute>}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="Dashboard" element={<AdminDashboard />} />
                            <Route path="VenueSchedule" element={<ProtectedRoute allowedRoles={['Admin']} requiredDepartment="GSD"><VenueSchedule /></ProtectedRoute>} />
                            {/* Vehicle Management */}
                            <Route path="VehicleEntry" element={<VehicleEntry />} />
                            <Route path="vehiclemake" element={<Vehiclem />} />
                            <Route path="vehiclecategory" element={<Vehiclec />} />
                            <Route path="vehiclemodel" element={<VehicleModel />} />
                         
                            {/* Equipment Management */}
                            <Route path="Equipment" element={<Equipment />} />
                            <Route path="equipmentCategory" element={<Equipmentc />} />
                            <Route path="equipmentCat" element={<Equipmentc />} />
                            {/* Venue Management */}
                            <Route path="Venue" element={<Venue />} />
                            <Route path="LandCalendar" element={<LandCalendar />} />
                            <Route path="VenueBuilding" element={<VenueBuilding />} />
                            {/* User Management */}
                            <Route path="Faculty" element={<Faculty />} />
                            <Route path="departments" element={<Departments />} />
                            <Route path="AssignPersonnel" element={<AssignPersonnel />} />
                            <Route path="assignApproval" element={<AssignApproval />} />
                            <Route path="assignApprovalVenue" element={<AssignApprovalVenue />} />
                            <Route path="assignRoleExclusive" element={<AssignRoleExclusive />} />
                            {/* System Management */}
                           
                            <Route path="Holiday" element={<Holiday />} />
                            <Route path="Checklist" element={<Checklists />} />
                            {/* Request & Record */}
                            <Route path="ViewRequest" element={<ViewRequest />} />
                            <Route path="AllJobOrders" element={<AllJobOrders />} />
                            <Route path="record" element={<Record />} />
                            <Route path="archive" element={<Archive />} />
                            <Route path="Reports" element={<Reports />} />
                           
                            <Route path="Chat" element={<Chat />} />
                            <Route path="Notification" element={<Notification />} />
                            <Route path="AuditLog" element={<AuditTrail />} />
                            {/* Catch-all for invalid Admin routes */}
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        <Route path="/Faculty/*" element={<ProtectedRoute allowedRoles={['Faculty/Staff', 'School Head', 'SBO PRESIDENT', 'CSG PRESIDENT']}><FacultyLayout /></ProtectedRoute>}>
                            <Route index element={<Dashboard />} />
                            <Route path="Dashboard" element={<Dashboard />} />
                            <Route path="addReservation" element={<AddReservation />} />
                            <Route path="MyReservations" element={<MyReservation />} />
                            <Route path="Chat" element={<Chat />} />
                            <Route path="Notification" element={<Notification />} />
                            {/* Catch-all for invalid Faculty routes */}
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        <Route path="/Department/*" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary', 'Department Head', 'Principal']}><DepartmentLayout /></ProtectedRoute>}>
                            <Route index element={<DeanDashboard />} />
                            <Route path="Dashboard" element={<DeanDashboard />} />
                            <Route path="addReservation" element={<AddReservation />} />
                            <Route path="MyReservations" element={<MyReservation />} />
                            <Route path="ViewApproval" element={<ViewApproval />} />
                            <Route path="MyTicketRequest" element={<MyTicketRequest />} />
                          
                            <Route path="Chat" element={<Chat />} />
                            <Route path="Notification" element={<Notification />} />
                            {/* Catch-all for invalid Department routes */}
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        {/* Personnel Routes (nested) */}
                        <Route path="/Personnel/*" element={<ProtectedRoute allowedRoles={['Personnel']}><PersonnelLayout /></ProtectedRoute>}>
                            <Route index element={<PersonnelDashboard />} />
                            <Route path="Dashboard" element={<PersonnelDashboard />} />
                            <Route path="ViewTask" element={<ViewTask />} />
                            <Route path="Notification" element={<Notification />} />
                            <Route path="Chat" element={<Chat />} />
                            {/* Catch-all for invalid Personnel routes */}
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        {/* Driver Routes (nested) */}
                        <Route path="/Driver/*" element={<ProtectedRoute allowedRoles={['Driver']}><DriverLayout /></ProtectedRoute>}>
                            <Route index element={<DriverDashboard />} />
                            <Route path="Dashboard" element={<DriverDashboard />} />
    
                            <Route path="Trips" element={<DriverTrips />} />
                            <Route path="Chat" element={<Chat />} />
                            <Route path="Notification" element={<Notification />} />
                            {/* Catch-all for invalid Driver routes */}
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        {/* Role-based redirects for shared entry points */}
                        <Route path="/addReservation" element={<RoleRedirect type="addReservation" />} />
                        <Route path="/MyReservations" element={<RoleRedirect type="reservations" />} />
                        <Route path="/Notification" element={<RoleRedirect type="notification" />} />
                        <Route path="/chat" element={<RoleRedirect type="chat" />} />
                        <Route path="/chatAdmin" element={<ProtectedRoute allowedRoles={['Personnel', 'Admin', 'Dean', 'Secretary', 'Faculty/Staff']}><Chat /></ProtectedRoute>} />


                        {/* Catch-all route for unmatched paths */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </div>
        </ThemeContext.Provider>
    );
};

export default App;
