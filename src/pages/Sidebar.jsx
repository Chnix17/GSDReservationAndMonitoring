<<<<<<< HEAD
import { AnimatePresence, motion } from "framer-motion";
import {
  FaAngleLeft,
  FaAngleRight,
  FaArchive,
  FaBars,
  FaBell,
  FaCalendarAlt,
  FaCar,
  FaChartBar,
  FaChevronDown,
  FaChevronRight,
  FaChevronUp,
  FaCog,
  FaCogs,
  FaComments,
  FaEllipsisV,
  FaFileAlt,
  FaFolder,
  FaHeadset,
  FaHome,
  FaSearch,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTimes,
  FaTools,
  FaUserCircle,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Popover, Transition } from "@headlessui/react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SecureStorage } from "../utils/encryption";
import { clearAllExceptLoginAttempts } from "../utils/loginAttempts";
import { format } from "date-fns";
=======
import React, { useState, useEffect, createContext, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt, FaFileAlt, 
  FaBars,  FaUserCircle, FaFolder,
 FaChartBar, FaArchive, FaTimes,
  FaComments, FaBell, 
  FaAngleRight, FaAngleLeft, FaCalendarAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';  
import { Popover, Transition } from '@headlessui/react';
import { SecureStorage } from '../utils/encryption';
import ProfileAdminModal from '../components/core/profile_admin';
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f

const SidebarContext = createContext();

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("");
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
<<<<<<< HEAD
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(3);

  const name = SecureStorage.getSessionItem("name") || "Admin User";
  const user_level_id = SecureStorage.getSessionItem("user_level_id");

  const canAccessMenu = (menuType) => {
    switch (user_level_id) {
      case "1":
        return true; // Admin - all access
      case "2":
        return ["calendar", "viewRequest", "viewReservation"].includes(
          menuType
        ); // Limited
      case "4":
        return true; // Full access
      default:
        return false;
    }
  };

=======

  const [notifications, setNotifications] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const name = SecureStorage.getSessionItem('name') || 'Admin User';


  
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
  useEffect(() => {
    setActiveItem(location.pathname);
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [location]);

<<<<<<< HEAD
  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDesktopSidebar = () =>
    setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
  const toggleMobileSidebar = () =>
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
=======


  const toggleDesktopSidebar = () => {
    const newState = !isDesktopSidebarOpen;
    setIsDesktopSidebarOpen(newState);
    
    // Dispatch custom event to notify other components
    const event = new CustomEvent('sidebar-toggle', { 
      detail: { collapsed: !newState }
    });
    window.dispatchEvent(event);
  };
  
  const toggleMobileSidebar = () => {
    const newState = !isMobileSidebarOpen;
    setIsMobileSidebarOpen(newState);
    
    // Dispatch custom event for mobile sidebar
    const event = new CustomEvent('mobile-sidebar-toggle', { 
      detail: { open: newState }
    });
    window.dispatchEvent(event);
  };

  
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f

  const handleLogout = () => {
    // Save loginAttempts
    const loginAttempts = localStorage.getItem("loginAttempts");
    const url = localStorage.getItem("url");

    // Clear everything
    sessionStorage.clear();
    localStorage.clear();

    // Restore critical data
    if (loginAttempts) localStorage.setItem("loginAttempts", loginAttempts);
    if (url) localStorage.setItem("url", url);

    // Navigate to login
    navigate("/gsd");
    window.location.reload();
  };

  const contextValue = useMemo(
    () => ({ isDesktopSidebarOpen }),
    [isDesktopSidebarOpen]
  );

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      const currentUserId = SecureStorage.getSessionItem('user_id');
      
      // Fetch approval notifications
      const approvalResponse = await fetch(`${baseUrl}/user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchApprovalNotification',
          department_id: SecureStorage.getSessionItem('department_id'),
          user_level_id: SecureStorage.getSessionItem('user_level_id')
        })
      });
      const approvalData = await approvalResponse.json();
      console.log('Approval notification fetch response:', approvalData);

      // Fetch read notifications for current user
      const readResponse = await fetch(`${baseUrl}/user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchReadApprovalNotification'
        })
      });
      const readData = await readResponse.json();
      console.log('Read notifications response:', readData);

      // Create a map of read notification IDs for the current user
      const readNotificationMap = new Map();
      if (readData.status === 'success') {
        readData.data.forEach(read => {
          if (read.user_id === currentUserId && read.is_read === 1) {
            readNotificationMap.set(read.notification_id, true);
          }
        });
      }
      
      // Process approval notifications and set read status
      let processedNotifications = [];
      if (approvalData.status === 'success') {
        processedNotifications = approvalData.data.map(notification => ({
          ...notification,
          is_read: readNotificationMap.has(notification.notification_id) ? 1 : 0
        }));
      }
      
      // Sort notifications by creation date
      processedNotifications.sort((a, b) => {
        const dateA = new Date(a.notification_created_at || a.notification_create);
        const dateB = new Date(b.notification_created_at || b.notification_create);
        return dateB - dateA;
      });
      
      console.log('Processed notifications:', processedNotifications);
      setNotifications(processedNotifications);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notifications as read
  const markNotificationsAsRead = async (notificationIds) => {
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      const currentUserId = SecureStorage.getSessionItem('user_id');

      // Update approval notifications
      const approvalResponse = await fetch(`${baseUrl}/process_reservation.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateReadApprovalNotification',
          notification_ids: notificationIds,
          user_id: currentUserId
        })
      });
      const approvalData = await approvalResponse.json();
      console.log('Approval notifications update response:', approvalData);

      // Refresh notifications after marking as read
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling to refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update the notifications Popover content
  const renderNotifications = () => {
    const unreadCount = notifications.filter(n => n.is_read === 0).length;
    
    return (
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-800/50">
              <FaBell size={18} className="text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </Popover.Button>
            <Transition
              show={open}
              as={React.Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel
                className="
                  fixed left-1/2 top-20 z-50 w-[95vw] max-w-xs -translate-x-1/2
                  sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:w-80 sm:max-w-xs sm:left-auto sm:translate-x-0 sm:z-10
                  origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5
                "
              >
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-medium">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => {
                        const unreadIds = notifications
                          .filter(n => n.is_read === 0)
                          .map(n => n.notification_id);
                        markNotificationsAsRead(unreadIds);
                      }}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.notification_id}
                        className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          notification.is_read === 0 ? 'bg-green-50 dark:bg-green-900/20' : ''
                        }`}
                      >
                        <p className="text-sm font-medium">{notification.notification_message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.notification_created_at || notification.notification_create).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 text-center">
                  <Link to="/notifications" className="text-xs text-green-600 dark:text-green-400 hover:underline">
                    View all notifications
                  </Link>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    );
  };

  return (
    <SidebarContext.Provider value={contextValue}>
<<<<<<< HEAD
      <div className={`${isDarkMode ? "dark" : ""}`}>
        {/* Mobile Header - Simplified */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 fixed top-0 left-0 right-0 z-30 lg:hidden flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMobileSidebar}
              className="text-[#145414] dark:text-[#d4f4dc] p-2 rounded-lg hover:bg-[#d4f4dc] dark:hover:bg-[#145414]"
            >
              <FaBars size={20} />
            </button>
            <div className="flex items-center">
              <img
                src="/images/assets/phinma.png"
                alt="Logo"
                className="w-8 h-8"
              />
              <span className="ml-2 font-bold text-black dark:text-white">
                GSD Portal
              </span>
=======
      <div className={`flex flex-col h-screen `}>
        {/* Desktop Header with Profile Card */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 hidden lg:flex items-center justify-end shadow-sm fixed top-0 left-0 right-0 z-30 h-24">
          <div className="flex items-center space-x-6">
            {/* Welcome Message */}
            <div className="hidden lg:block">
              <p className="text-green-600 dark:text-green-400 font-medium">Welcome! <span className="font-bold">{name}</span></p>
            </div>
            
            {/* Notifications */}
            {renderNotifications()}
            
            {/* Profile Menu */}
            <Popover className="relative">
              {({ open, close }) => (
                <>
                  <Popover.Button className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-800/50">
                    <FaUserCircle size={20} className="text-gray-600 dark:text-gray-300" />
                  </Popover.Button>

                  <Transition
                    show={open}
                    as={React.Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => {
                            close();
                            setShowProfileModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          My Profile
                        </button>
                        <Link to="/settings" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                        >
                          Logout
                        </button>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 fixed top-0 left-0 right-0 z-30 lg:hidden flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={toggleMobileSidebar} className="text-[#145414] dark:text-[#d4f4dc] p-2 rounded-lg hover:bg-[#d4f4dc] dark:hover:bg-[#145414]">
              <FaBars size={20} />
            </button>
                          <div className="flex items-center">
              <img src="/images/assets/phinma.png" alt="Logo" className="w-8 h-8" />
              <span className="ml-2 font-bold text-black dark:text-white">GSD Portal</span>
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notifications */}
            {renderNotifications()}
            
            {/* User Menu */}
            <Popover className="relative">
              {({ open, close }) => (
                <>
                  <Popover.Button className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-800/50">
                    <FaUserCircle size={20} className="text-gray-600 dark:text-gray-300" />
                  </Popover.Button>

                  <Transition
                    show={open}
                    as={React.Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => {
                            close();
                            setShowProfileModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          My Profile
                        </button>
                        <Link to="/settings" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                        >
                          Logout
                        </button>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        </header>

        {/* Spacer to push content below fixed headers */}
        <div className="h-24 w-full"></div>

        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-30 lg:hidden"
              onClick={toggleMobileSidebar}
            />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
<<<<<<< HEAD
        <div>
          {/* Desktop Sidebar */}
          <div
            className={`hidden lg:flex lg:flex-col h-screen bg-white dark:bg-gray-900 shadow-lg z-40 transition-all duration-300 ${
              isDesktopSidebarOpen ? "w-64" : "w-16"
            }`}
          >
            {/* Sidebar Header */}
            <div
              className={`flex items-center justify-between p-4 border-b border-[#d4f4dc] dark:border-[#145414] ${
                !isDesktopSidebarOpen && "justify-center"
              }`}
            >
              {isDesktopSidebarOpen ? (
                <>
                  <div className="flex items-center space-x-2">
                    <img
                      src="/images/assets/phinma.png"
                      alt="Logo"
                      className="w-8 h-8"
                    />
                    <span className="font-bold text-black dark:text-white">
                      GSD Portal
                    </span>
                  </div>
                  <button
                    onClick={toggleDesktopSidebar}
                    className="text-[#0b2a0b] dark:text-[#202521] p-1 rounded-full hover:bg-[#538c4c] dark:hover:bg-[#83b383]"
                  >
=======
        <div className="flex flex-1 pt-4 lg:pt-4">
          {/* Desktop Sidebar */}
          <div className={`hidden lg:flex lg:flex-col h-screen fixed top-0 bg-white dark:bg-gray-900 shadow-lg z-50 transition-all duration-300 ${
            isDesktopSidebarOpen ? 'w-64' : 'w-16'
          }`}>
            {/* Sidebar Header */}
            <div className={`flex items-center p-4 border-b border-[#d4f4dc] dark:border-[#145414] ${
              isDesktopSidebarOpen ? 'justify-between' : 'justify-center'
            }`}>
              {isDesktopSidebarOpen ? (
                <>
                  <div className="flex items-center space-x-2">
                    <img src="/images/assets/phinma.png" alt="Logo" className="w-8 h-8" />
                    <span className="font-bold text-black dark:text-white">GSD Portal</span>
                  </div>
                  <button onClick={toggleDesktopSidebar} className="text-[#0b2a0b] dark:text-[#202521] p-1 rounded-full hover:bg-[#538c4c] dark:hover:bg-[#83b383]">
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
                    <FaAngleLeft size={16} />
                  </button>
                </>
              ) : (
<<<<<<< HEAD
                <>
                  <button
                    onClick={toggleDesktopSidebar}
                    className="text-[#082308] dark:text-[#1b1e1b] p-1 rounded-full hover:bg-[#538c4c] dark:hover:bg-[#83b383]"
                  >
                    <FaAngleRight size={16} className="text-black " />
                  </button>
                </>
              )}
            </div>

            {/* Search Input - Only show when expanded */}
            {isDesktopSidebarOpen && (
              <div className="px-4 my-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#145414] text-black"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FaSearch
                    className="absolute left-3 top-2.5 text-gray-600"
                    size={14}
                  />
                </div>
              </div>
            )}

=======
                <button onClick={toggleDesktopSidebar} className="text-[#082308] dark:text-[#1b1e1b] p-1 rounded-full hover:bg-[#538c4c] dark:hover:bg-[#83b383]">
                  <FaAngleRight size={16} className="text-black" />
                </button>
              )}
            </div>

           
            
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            {/* Navigation */}
            <nav
              className={`flex-grow overflow-y-auto ${
                isDesktopSidebarOpen ? "px-3" : "px-2"
              } py-1 space-y-1`}
            >
              {/* Main Menu Items */}
<<<<<<< HEAD
              <MiniSidebarItem
                icon={FaTachometerAlt}
                text="Dashboard"
                link="/adminDashboard"
                active={activeItem === "/adminDashboard"}
=======
              <MiniSidebarItem 
                icon={FaTachometerAlt} 
                text="Dashboard" 
                link="/adminDashboard" 
                active={activeItem === '/adminDashboard'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaCalendarAlt} 
                text="Calendar" 
                link="/LandCalendar" 
                active={activeItem === '/LandCalendar'}
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
                isExpanded={isDesktopSidebarOpen}
              />
              

              <MiniSidebarItem 
                icon={FaComments} 
                text="Chat" 
                link="/chatAdmin" 
                active={activeItem === '/chat'}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Resource Management" />}

              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Master File" 
                link="/Master" 
                active={activeItem === '/Master'}
                isExpanded={isDesktopSidebarOpen}
              />
              
              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Checklist" 
                link="/Checklist" 
                active={activeItem === '/Checklist'}
                isExpanded={isDesktopSidebarOpen}
              />



              <MiniSidebarItem 
                icon={FaArchive} 
                text="Archive" 
                link="/archive" 
                active={activeItem === '/archive'}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Manage Reservation" />}

              <MiniSidebarItem 
                icon={FaUserCircle} 
                text="Assign Personnel" 
                link="/AssignPersonnel" 
                active={activeItem === '/AssignPersonnel'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaFolder} 
                text="View Requests" 
                link="/ViewRequest" 
                active={activeItem === '/ViewRequest'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaChartBar} 
                text="Reports" 
                link="/Reports" 
                active={activeItem === '/Reports'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Records" 
                link="/record" 
                active={activeItem === '/record'}
                isExpanded={isDesktopSidebarOpen}
              />
            </nav>

            {/* User Profile - Show only icon when collapsed */}
            
          </div>

          {/* Mobile Sidebar */}
          <div className={`fixed lg:hidden h-screen top-0 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 shadow-lg z-40 w-72 transition-transform duration-300 flex flex-col ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-green-100 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <img src="/images/assets/phinma.png" alt="Logo" className="w-8 h-8" />
                <span className="font-bold text-green-600 dark:text-green-400">GSD Portal</span>
              </div>
              <button onClick={toggleMobileSidebar} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                <FaTimes size={18} />
              </button>
            </div>

            

            {/* Navigation - Same as desktop but separate instance */}
            <nav className="flex-grow overflow-y-auto px-3 py-1 space-y-1">
            <MiniSidebarItem 
                icon={FaTachometerAlt} 
                text="Dashboard" 
                link="/adminDashboard" 
                active={activeItem === '/adminDashboard'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaCalendarAlt} 
                text="Calendar" 
                link="/LandCalendar" 
                active={activeItem === '/LandCalendar'}
                isExpanded={isDesktopSidebarOpen}
              />
              

<<<<<<< HEAD
              <MiniSidebarItem
                icon={FaCalendarAlt}
                text="Calendar"
                link="/LandCalendar"
                active={activeItem === "/LandCalendar"}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem
                icon={FaComments}
                text="Chat"
                link="/chatAdmin"
                active={activeItem === "/chat"}
                badge={unreadMessages}
=======
              <MiniSidebarItem 
                icon={FaComments} 
                text="Chat" 
                link="/chatAdmin" 
                active={activeItem === '/chat'}
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && (
                <SectionLabel text="Resource Management" />
              )}

              <MiniSidebarItem
                icon={FaFileAlt}
                text="Master"
                link="/Master"
                active={activeItem === "/Master"}
                isExpanded={isDesktopSidebarOpen}
              />
<<<<<<< HEAD

              <MiniSidebarDropdown
                icon={FaFileAlt}
                text="Resources"
                active={["/Venue", "/VehicleEntry", "/Equipment"].includes(
                  activeItem
                )}
                isExpanded={isDesktopSidebarOpen}
              >
                <MiniSidebarSubItem
                  icon={FaHome}
                  text="Venue"
                  link="/Venue"
                  active={activeItem === "/Venue"}
                  isExpanded={isDesktopSidebarOpen}
                />
                <MiniSidebarSubItem
                  icon={FaCar}
                  text="Vehicle"
                  link="/VehicleEntry"
                  active={activeItem === "/VehicleEntry"}
                  isExpanded={isDesktopSidebarOpen}
                />
                <MiniSidebarSubItem
                  icon={FaTools}
                  text="Equipment"
                  link="/Equipment"
                  active={activeItem === "/Equipment"}
                  isExpanded={isDesktopSidebarOpen}
                />
              </MiniSidebarDropdown>
              <MiniSidebarItem
                icon={FaArchive}
                text="Archive"
                link="/archive"
                active={activeItem === "/archive"}
=======
              
              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Checklist" 
                link="/Checklist" 
                active={activeItem === '/Checklist'}
                isExpanded={isDesktopSidebarOpen}
              />



              <MiniSidebarItem 
                icon={FaArchive} 
                text="Archive" 
                link="/archive" 
                active={activeItem === '/archive'}
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Manage Reservation" />}

              <MiniSidebarItem
                icon={FaUserCircle}
                text="Assign Personnel"
                link="/AssignPersonnel"
                active={activeItem === "/AssignPersonnel"}
                isExpanded={isDesktopSidebarOpen}
              />

<<<<<<< HEAD
              <MiniSidebarItem
                icon={FaFileAlt}
                text="Checklist"
                link="/Checklist"
                active={activeItem === "/Checklist"}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && (
                <SectionLabel text="Manage Reservation" />
              )}

              <MiniSidebarItem
                icon={FaFolder}
                text="View Requests"
                link="/ViewRequest"
                active={activeItem === "/ViewRequest"}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem
                icon={FaFileAlt}
                text="Records"
                link="/record"
                active={activeItem === "/record"}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="User Management" />}

              <MiniSidebarItem
                icon={FaUserCircle}
                text="Faculty"
                link="/Faculty"
                active={activeItem === "/Faculty"}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Personal Info" />}

              <MiniSidebarItem
                icon={FaCogs}
                text="Account Settings"
                link="/settings"
                active={activeItem === "/settings"}
                isExpanded={isDesktopSidebarOpen}
              />
            </nav>

            {/* User Profile - Show only icon when collapsed */}
            <div className="mt-auto  bg-green-900 border-t border-gray-200 dark:border-gray-800">
              <Popover className="relative w-full">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`w-full p-3 flex items-center ${
                        isDesktopSidebarOpen
                          ? "justify-between"
                          : "justify-center"
                      } hover:bg-[#4d8246] dark:hover:bg-[#325032] `}
                    >
                      {isDesktopSidebarOpen ? (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[#214a2b] dark:bg-[#e1f6e1] flex items-center justify-center">
                              <FaUserCircle className="text-[#145414] dark:text-[#253729]" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-sm text-white dark:text-black ">
                                {name}
                              </p>
                              <p className="text-xs font-semibold text-gray-100 dark:text-green-100 ">
                                Administrator
                              </p>
                            </div>
                          </div>
                          <FaChevronDown
                            className={`text-gray-100 transform ${
                              open ? "rotate-180" : ""
                            }`}
                            size={14}
                          />
                        </>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#d4f4dc] dark:bg-[#145414] flex items-center justify-center">
                          <FaUserCircle className="text-[#145414] dark:text-[#d4f4dc]" />
                        </div>
                      )}
                    </Popover.Button>
                    <Transition
                      show={open}
                      as={React.Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel
                        className={`absolute ${
                          !isDesktopSidebarOpen ? "left-full ml-2" : "right-0"
                        } bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50`}
                      >
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="font-medium text-sm text-black dark:text-white">
                            {name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Administrator
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/settings"
                            className="block w-full px-3 py-2 text-sm text-black dark:text-gray-300 hover:bg-[#538c4c] dark:hover:bg-[#83b383] rounded-md flex items-center space-x-2"
                          >
                            <FaCog size={14} />
                            <span>Settings</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full mt-1 text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center space-x-2"
                          >
                            <FaSignOutAlt size={14} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
          </div>

          {/* Mobile Sidebar */}
          <div
            className={`fixed lg:hidden h-[calc(100vh-60px)] bg-white dark:bg-gray-900 text-black dark:text-gray-200 shadow-lg z-40 w-72 transition-transform duration-300 flex flex-col ${
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Close button */}
            <div className="flex justify-end p-3">
              <button
                onClick={toggleMobileSidebar}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-4 mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#145414] text-black"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FaSearch
                  className="absolute left-3 top-2.5 text-gray-600"
                  size={14}
                />
              </div>
            </div>

            {/* Navigation - Same as desktop but separate instance */}
            <nav className="flex-grow overflow-y-auto px-3 py-1 space-y-1">
              <SidebarItem
                icon={FaTachometerAlt}
                text="Dashboard"
                link="/adminDashboard"
                active={activeItem === "/adminDashboard"}
              />

              <SidebarItem
                icon={FaCalendarAlt}
                text="Calendar"
                link="/LandCalendar"
                active={activeItem === "/LandCalendar"}
              />

              <SidebarItem
                icon={FaComments}
                text="Chat"
                link="/chatAdmin"
                active={activeItem === "/chat"}
                badge={unreadMessages}
              />

              <SectionLabel text="Resource Management" />

              <SidebarDropdown
                icon={FaFileAlt}
                text="Resources"
                active={["/Venue", "/VehicleEntry", "/Equipment"].includes(
                  activeItem
                )}
              >
                <SidebarSubItem
                  icon={FaHome}
                  text="Venue"
                  link="/Venue"
                  active={activeItem === "/Venue"}
                />
                <SidebarSubItem
                  icon={FaCar}
                  text="Vehicle"
                  link="/VehicleEntry"
                  active={activeItem === "/VehicleEntry"}
                />
                <SidebarSubItem
                  icon={FaTools}
                  text="Equipment"
                  link="/Equipment"
                  active={activeItem === "/Equipment"}
                />
              </SidebarDropdown>

              {/* Continuing with more menu items... */}
              <SidebarItem
                icon={FaUserCircle}
                text="Personnel"
                link="/AssignPersonnel"
                active={activeItem === "/AssignPersonnel"}
              />

              <SectionLabel text="Account" />

              <SidebarItem
                icon={FaCogs}
                text="Settings"
                link="/settings"
                active={activeItem === "/settings"}
              />
            </nav>
          </div>

          {/* Toggle Button - Always visible when sidebar is closed */}
          {!isDesktopSidebarOpen && (
            <button
              onClick={toggleDesktopSidebar}
              className="hidden lg:flex fixed top-4 left-4 z-50 bg-[#253d2b] dark:bg-gray-100 shadow-md rounded-full p-2 text-[#0f380f] dark:text-[#193c21] hover:bg-[#1f431a] dark:hover:bg-[#44ae44]"
            >
              <FaAngleRight size={20} />
            </button>
          )}
=======
              <MiniSidebarItem 
                icon={FaFolder} 
                text="View Requests" 
                link="/ViewRequest" 
                active={activeItem === '/ViewRequest'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaChartBar} 
                text="Reports" 
                link="/Reports" 
                active={activeItem === '/Reports'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Records" 
                link="/record" 
                active={activeItem === '/record'}
                isExpanded={isDesktopSidebarOpen}
              />
            </nav>
          </div>

          {/* Main Content */}
          <main className={`flex-1 bg-gray-50 dark:bg-gray-800 min-h-screen overflow-x-hidden transition-all duration-300 ${
            isDesktopSidebarOpen 
              ? 'lg:ml-64 pl-0 mb-[300px]' 
              : 'lg:ml-16 pl-0 mb-[300px]'
          }`}>



            {/* Content will be rendered here */}
          </main>
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
        </div>

        {/* Profile Modal */}
        <ProfileAdminModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
        />

        {/* Toggle Button - Always visible when sidebar is closed */}
        {!isDesktopSidebarOpen && (
          <button
            onClick={toggleDesktopSidebar}
            className="hidden lg:flex fixed top-4 left-4 z-50 bg-[#829e89] dark:bg-gray-100 shadow-md rounded-full p-2 text-[#0f380f] dark:text-[#193c21] hover:bg-[#beffb6] dark:hover:bg-[#9dff9d]"
          >
            <FaAngleRight size={20} />
          </button>
        )}
      </div>
    </SidebarContext.Provider>
  );
};

<<<<<<< HEAD
// Header User Menu Component - Simplified
const HeaderUserMenu = ({ name, handleLogout }) => {
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#538c4c] dark:hover:bg-[#83b383]">
            <FaUserCircle size={20} className="text-black dark:text-gray-300" />
          </Popover.Button>

          <Transition
            show={open}
            as={React.Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <p className="font-medium text-sm text-black dark:text-white">
                  {name}
                </p>
                <p className="text-xs text-gray-600">Administrator</p>
              </div>
              <div className="p-2">
                <Link
                  to="/settings"
                  className="block px-3 py-2 text-sm text-black dark:text-gray-300 hover:bg-[#538c4c] dark:hover:bg-[#83b383] rounded-md"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                >
                  Logout
                </button>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

=======
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
// Section Label Component - Clean and minimal
const SectionLabel = ({ text }) => (
  <div className="pt-3 pb-1">
    <p className="px-2 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-500">
      {text}
    </p>
  </div>
);

<<<<<<< HEAD
// Simplified SidebarItem
const SidebarItem = React.memo(({ icon: Icon, text, link, active, badge }) => {
  return (
    <Link
      to={link}
      className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
        active
          ? "bg-[#145414] text-white font-medium"
          : "text-black hover:bg-[#d4f4dc] hover:text-[#145414]"
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon size={16} className={active ? "text-white" : "text-[#145414]"} />
        <span className="text-sm">{text}</span>
      </div>

      {badge && (
        <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
          {badge}
        </span>
      )}

      {active && (
        <div className="absolute left-0 w-1 h-7 bg-[#145414] rounded-r-full" />
      )}
    </Link>
  );
});
=======
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f


<<<<<<< HEAD
  // Auto-open dropdown if child is active
  useEffect(() => {
    if (active) setIsOpen(true);
  }, [active]);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
          active
            ? "bg-[#145414] text-white font-medium"
            : "text-black hover:bg-[#d4f4dc] hover:text-[#145414]"
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon
            size={16}
            className={active ? "text-white" : "text-[#145414]"}
          />
          <span className="text-sm">{text}</span>
        </div>
        <FaChevronDown
          className={`transition-transform ${
            isOpen ? "rotate-180" : ""
          } text-[#145414]`}
          size={12}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-3 mt-1 space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Simplified SidebarSubItem
const SidebarSubItem = React.memo(({ icon: Icon, text, link, active }) => {
  return (
    <Link
      to={link}
      className={`flex items-center space-x-2.5 p-2 pl-4 ml-2 rounded-md transition-all ${
        active
          ? "bg-[#145414] text-white font-medium"
          : "text-black hover:bg-[#d4f4dc] hover:text-[#145414]"
      }`}
    >
      <Icon size={14} className={active ? "text-white" : "text-[#145414]"} />
      <span className="text-xs">{text}</span>
    </Link>
  );
});

const MiniSidebarItem = React.memo(
  ({ icon: Icon, text, link, active, isExpanded, badge }) => {
    return (
      <Link
        to={link}
        className={`flex items-center ${
          isExpanded ? "justify-between p-2.5" : "justify-center p-2"
        } rounded-lg transition-all ${
          active
            ? "bg-[#145414] text-white font-medium"
            : "text-black hover:bg-[#d4f4dc] hover:text-[#145414]"
        }`}
        title={!isExpanded ? text : undefined}
      >
        <div className={`flex items-center ${isExpanded ? "space-x-3" : ""}`}>
          <Icon
            size={16}
            className={active ? "text-white" : "text-[#145414]"}
          />
          {isExpanded && <span className="text-sm">{text}</span>}
        </div>

        {badge && isExpanded && (
          <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
            {badge}
          </span>
        )}

        {badge && !isExpanded && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </Link>
    );
  }
);

const MiniSidebarDropdown = React.memo(
  ({ icon: Icon, text, active, children, isExpanded }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      if (active) setIsOpen(true);
    }, [active]);

    if (!isExpanded) {
      return (
        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${
                  active
                    ? "bg-[#145414] text-white"
                    : "text-black hover:bg-[#d4f4dc] hover:text-[#145414]"
                }`}
                title={text}
              >
                <Icon
                  size={16}
                  className={active ? "text-white" : "text-[#145414]"}
                />
              </Popover.Button>
              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">{children}</div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      );
    }

    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
            active
              ? "bg-[#145414] text-white font-medium"
              : "text-black hover:bg-[#d4f4dc] hover:text-[#145414]"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Icon
              size={16}
              className={active ? "text-white" : "text-[#145414]"}
            />
            <span className="text-sm">{text}</span>
          </div>
          <FaChevronDown
            className={`transition-transform ${
              isOpen ? "rotate-180" : ""
            } text-[#145414]`}
            size={12}
          />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3 mt-1 space-y-1 overflow-hidden"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

const MiniSidebarSubItem = React.memo(
  ({ icon: Icon, text, link, active, isExpanded }) => {
    return (
      <Link
        to={link}
        className={`flex items-center ${
          isExpanded ? "space-x-2.5 p-2 pl-4 ml-2" : "p-2"
        } rounded-md transition-all ${
          active
            ? "bg-[#145414] text-white font-medium"
            : "text-black hover:bg-[#d4f4dc] hover:text-[#145414]"
        }`}
      >
        <Icon size={14} className={active ? "text-white" : "text-[#145414]"} />
        {isExpanded && <span className="text-xs">{text}</span>}
      </Link>
    );
  }
);

export default Sidebar;
=======

const MiniSidebarItem = React.memo(({ icon: Icon, text, link, active, isExpanded, badge }) => {
  return (
    <Link 
      to={link} 
      className={`flex items-center ${isExpanded ? 'justify-between p-2.5' : 'justify-center p-2'} rounded-lg transition-all ${
        active 
          ? 'bg-[#145414] text-white font-medium' 
          : 'text-black hover:bg-[#d4f4dc] hover:text-[#145414]'
      }`}
      title={!isExpanded ? text : undefined}
    >
      <div className={`flex items-center ${isExpanded ? 'space-x-3' : ''}`}>
        <Icon size={16} className={active ? 'text-white' : 'text-[#145414]'} />
        {isExpanded && <span className="text-sm">{text}</span>}
      </div>
      
      {badge && isExpanded && (
        <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
          {badge}
        </span>
      )}
      
      {badge && !isExpanded && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
      )}
    </Link>
  );
});


export default Sidebar;
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
