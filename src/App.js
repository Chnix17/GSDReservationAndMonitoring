import React, { useState, createContext, useCallback, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
// import Sidebar from './pages/Sidebar';
// import Login from './pages/Login';
import VehicleEntry from './pages/Admin/VehicleEntry';
import PersonnelDashboard from './pages/Personnel/dashboard';
import ViewTask from './pages/Personnel/ViewPersonnelTask';
import Venue from './pages/Admin/Venue';
import  Dashboard from './page_user/dashboard';
import Equipment from './pages/Admin/Equipment';
import ViewRequest from './pages/Admin/viewRequest';
import AddReservation from './components/Reservation/AddReservation'; // Import the AddReservation component
import { Toaster } from 'sonner';
import './App.css'; 
import Logins from './pages/logins';
import AdminDashboard from './pages/Admin/adminDashboard';
import Faculty from './pages/Admin/Faculty';  // Updated casing to match file name
import Master from './pages/Admin/Master'
import Vehiclem from './pages/vehiclemake';
import Departments from './pages/departments';
import Vehiclec from './pages/vehiclecategory';
import Equipmentc from './pages/equipmentCategory';

import VehicleModel from './pages/vehiclemodel';
import ViewReserve from './page_user/viewReserve';

import Record from './pages/Admin/Record';
import ViewApproval from './page_dean/viewApproval';
import DeanViewReserve from './page_dean/viewReserve';
import DeanDashboard from './page_dean/dashboard';
import Chat from './components/core/chat';
import ProtectedRoute from './utils/ProtectedRoute';
import AssignPersonnel from './pages/Admin/AssignPersonnel';
import LandCalendar from './pages/landCalendar';
import Archive from './pages/archive';
import NotFound from './components/NotFound';
import Checklists from './pages/Checklist';
import Reports from './pages/Admin/Reports';
import { SecureStorage } from './utils/encryption';
import NotificationUser from './page_user/notification';
import NotificationRequest from './page_dean/notification';
import ChatUser from './page_user/chat';
import ChatDepartment from './page_dean/chat';
import ChatPersonnel from './pages/Personnel/chat';
import Driver from './pages/Drivers';
import Holiday from './pages/Admin/Holiday';
import DriverDashboard from './pages/Driver/DriverDashboard';
import DriverTrips from './pages/Driver/Trips'
import AdminNotification from './pages/Admin/notification';
import AuditTrail from './pages/Admin/audit_trail';
import Notification from './components/core/main_notification';

import VenueSchedule from './page_dean/VenueSchedule'



export const ThemeContext = createContext();

const App = () => {
    const defaultUrl = "http://192.168.1.10/coc/gsd/";
    const storedUrl = SecureStorage.getLocalItem("url");
    
    if (!storedUrl || storedUrl !== defaultUrl) {
        SecureStorage.setLocalItem("url", defaultUrl);
    }

    

    // Register service worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }, []);

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

    const [isNotFoundVisible, setIsNotFoundVisible] = useState(false);
    const location = useLocation();

    // Add URL validation
    useEffect(() => {
        const validPaths = [
            '/gsd', '/Admin', '/adminDashboard', '/VehicleEntry', '/drivers',
            '/Equipment', '/Faculty', '/departments', '/master',
            '/vehiclemake', '/vehiclecategory', '/position',
            '/equipmentCategory', '/condition', '/vehiclemodel',
            '/AssignPersonnel', '/LandCalendar', '/record',
            '/ViewRequest', '/Venue', '/equipmentCat',
            '/archive', '/Department/Dashboard', '/Department/Myreservation', '/Department/Chat', 
            '/departmentAddReservation', '/Department/ViewApproval', '/Faculty/Dashboard', '/Faculty/Chat',
            '/Faculty/Myreservation', '/addReservation', '/profile1',
            '/settings', '/calendar', '/chat', '/Personnel/Dashboard',
            '/Personnel/ViewTask', '/Personnel/Chat', '/Master', '/vehicleCategory', '/',
            '/Checklist', '/chatAdmin', '/AccountSettings', '/chatAdmin', '/Reports', '/Faculty/Notification', '/Department/Notification',
            '/Holiday', '/Department/VenueSchedule', '/Driver/Dashboard', '/Driver/Trips', '/Admin/Notification', '/Admin/AuditLog', '/Notification'
        ];

        if (!validPaths.includes(location.pathname)) {
            setIsNotFoundVisible(true);
        }
    }, [location]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={`app-container ${theme}`}>
                <Toaster richColors position='top-center' duration={1500} />
                <NotFound 
                    isVisible={isNotFoundVisible} 
                    onClose={() => setIsNotFoundVisible(false)} 
                />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/gsd" replace />} />
                        <Route path="/gsd" element={<Logins />} />
                        
            
                       
                        <Route path="/adminDashboard" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/VehicleEntry" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><VehicleEntry /></ProtectedRoute>} />
                        <Route path="/Equipment" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Equipment /></ProtectedRoute>} />
                        <Route path="/Faculty" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Faculty /></ProtectedRoute>} />
                        <Route path="/departments" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Departments /></ProtectedRoute>} />
                        <Route path="/master" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Master /></ProtectedRoute>} />
                        <Route path="/vehiclemake" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Vehiclem /></ProtectedRoute>} />
                        <Route path="/vehiclecategory" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Vehiclec /></ProtectedRoute>} />
                        <Route path="/equipmentCategory" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Equipmentc /></ProtectedRoute>} />
                        <Route path="/Admin/Notification" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><AdminNotification /></ProtectedRoute>} />
                        <Route path="/Admin/AuditLog" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><AuditTrail /></ProtectedRoute>} />
                        <Route path="/Notification" element={<ProtectedRoute allowedRoles={['Admin', 'Faculty/Staff', 'SBO PRESIDENT', 'CSG PRESIDENT', 'Dean', 'Secretary', 'Department Head', 'Personnel', 'Driver']}><Notification /></ProtectedRoute>} />
          
                        <Route path="/vehiclemodel" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><VehicleModel /></ProtectedRoute>} />
                        <Route path="/AssignPersonnel" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><AssignPersonnel /></ProtectedRoute>} />
                        <Route path="/LandCalendar" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><LandCalendar /></ProtectedRoute>} />
                        <Route path="/Checklist" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Checklists /></ProtectedRoute>} />
                        <Route path="/drivers" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Driver /></ProtectedRoute>} />
                        <Route path="/record" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Record /></ProtectedRoute>} />
                        <Route path="/ViewRequest" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><ViewRequest /></ProtectedRoute>} />

                        <Route path="/Venue" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Venue /></ProtectedRoute>} />
                        <Route path="/equipmentCat" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Equipmentc /></ProtectedRoute>} />
                        <Route path="/archive" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Archive /></ProtectedRoute>} />
                        <Route path="/Reports" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Reports /></ProtectedRoute>} />
                        <Route path="/Holiday" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><Holiday /></ProtectedRoute>} />
                                                            
                        {/* Dean/Secretary Routes */}
                        <Route path="/Department/Dashboard" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary', 'Department Head']}><DeanDashboard /></ProtectedRoute>} />
                        <Route path="/Department/Myreservation" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary', 'Department Head']}><DeanViewReserve /></ProtectedRoute>} />
                        <Route path="/Department/ViewApproval" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary', 'Department Head']}><ViewApproval /></ProtectedRoute>} />
                        <Route path="/Department/Notification" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary', 'Department Head']}><NotificationRequest /></ProtectedRoute>} />
                        <Route path="/Department/Chat" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary', 'Department Head']}><ChatDepartment /></ProtectedRoute>} />
                        <Route path="/Department/VenueSchedule" element={<ProtectedRoute allowedRoles={['Department Head']} requiredDepartment="REGISTRAR"><VenueSchedule /></ProtectedRoute>} />
                        {/* User Routes */}
                        <Route path="/Faculty/Dashboard" element={<ProtectedRoute allowedRoles={['Faculty/Staff', 'School Head', 'SBO PRESIDENT', 'CSG PRESIDENT']}><Dashboard /></ProtectedRoute>} />
                        <Route path="/Faculty/Myreservation" element={<ProtectedRoute allowedRoles={['Faculty/Staff', 'School Head', 'SBO PRESIDENT', 'CSG PRESIDENT']}><ViewReserve /></ProtectedRoute>} />
                        <Route path="/addReservation" element={<ProtectedRoute allowedRoles={['Faculty/Staff', 'SBO PRESIDENT', 'CSG PRESIDENT', 'Dean', 'Secretary', 'Department Head']}><AddReservation /></ProtectedRoute>} />
                        <Route path="/Faculty/Chat" element={<ProtectedRoute allowedRoles={['Faculty/Staff', 'School Head', 'SBO PRESIDENT', 'CSG PRESIDENT']}><ChatUser /></ProtectedRoute>} />
                        <Route path="/Faculty/Notification" element={<ProtectedRoute allowedRoles={['Faculty/Staff', 'School Head', 'SBO PRESIDENT', 'CSG PRESIDENT']}><NotificationUser /></ProtectedRoute>} />
                        {/* Shared Routes (accessible by all authenticated users) */}
                        
                       
                        <Route path="/chat" element={<ProtectedRoute allowedRoles={['Admin', 'Faculty/Staff', 'SBO PRESIDENT', 'CSG PRESIDENT', 'Dean', 'Secretary', 'Department Head', 'Personnel', 'Driver']}><Chat /></ProtectedRoute>} />
                        
                        {/* Personnel Routes */}
                        <Route path="/Personnel/Dashboard" element={<ProtectedRoute allowedRoles={['Personnel']}><PersonnelDashboard /></ProtectedRoute>} />
                        <Route path="/Personnel/ViewTask" element={<ProtectedRoute allowedRoles={['Personnel']}><ViewTask /></ProtectedRoute>} />
                        <Route path="/Personnel/Chat" element={<ProtectedRoute allowedRoles={['Personnel']}><ChatPersonnel /></ProtectedRoute>} />
                       
                        <Route path="/Driver/Dashboard" element={<ProtectedRoute allowedRoles={['Driver']}><DriverDashboard/></ProtectedRoute>} />
                        <Route path="/Driver/Trips" element={<ProtectedRoute allowedRoles={['Driver']}><DriverTrips/></ProtectedRoute>} />
                        {/* chats */}
                        <Route path="/chatAdmin" element={<ProtectedRoute allowedRoles={['Personnel', 'Admin', 'Dean', 'Secretary', 'Faculty/Staff']}><Chat /></ProtectedRoute>} />
                    </Routes>
                </main>
            </div>
        </ThemeContext.Provider>
    );
};

export default App;
