import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaFileAlt, FaHeadset,
  FaChevronDown, FaBars, FaHome, FaTools, FaUserCircle, FaFolder,
  FaCalendarAlt, FaChartBar, FaArchive, FaChevronRight, FaTimes,
  FaComments, FaCogs, FaBell, FaSearch, FaEllipsisV, FaChevronUp,
  FaAngleRight, FaAngleLeft
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Popover, Transition } from '@headlessui/react';
import { clearAllExceptLoginAttempts } from '../utils/loginAttempts';
import { SecureStorage } from '../utils/encryption';
import ProfileAdminModal from '../components/core/profile_admin';

const SidebarContext = createContext();

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(3);
  const [notifications, setNotifications] = useState(5);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const name = SecureStorage.getSessionItem('name') || 'Admin User';
  const user_level_id = SecureStorage.getSessionItem('user_level_id');

  const canAccessMenu = (menuType) => {
    switch (user_level_id) {
      case '1': return true; // Admin - all access
      case '2': return ['calendar', 'viewRequest', 'viewReservation'].includes(menuType); // Limited
      case '4': return true; // Full access
      default: return false;
    }
  };
  
  useEffect(() => {
    setActiveItem(location.pathname);
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [location]);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

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

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    // Save loginAttempts
    const loginAttempts = localStorage.getItem('loginAttempts');
    const url = localStorage.getItem('url');
    
    // Clear everything
    sessionStorage.clear();
    localStorage.clear();
    
    // Restore critical data
    if (loginAttempts) localStorage.setItem('loginAttempts', loginAttempts);
    if (url) localStorage.setItem('url', url);
    
    // Navigate to login
    navigate('/gsd');
    window.location.reload();
  };

  const contextValue = useMemo(() => ({ isDesktopSidebarOpen }), [isDesktopSidebarOpen]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''}`}>
        {/* Desktop Header with Profile Card */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 hidden lg:flex items-center justify-end shadow-sm fixed top-0 left-0 right-0 z-30 h-24">
          <div className="flex items-center space-x-6">
            {/* Welcome Message */}
            <div className="hidden lg:block">
              <p className="text-green-600 dark:text-green-400 font-medium">Welcome! <span className="font-bold">{name}</span></p>
            </div>
            
            {/* Notifications */}
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-800/50">
                    <FaBell size={18} className="text-gray-600 dark:text-gray-300" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {notifications}
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
                    <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-medium">Notifications</h3>
                        <button className="text-xs text-green-600 dark:text-green-400 hover:underline">
                          Mark all as read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <p className="text-sm font-medium">New reservation request</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A new venue request needs your approval</p>
                          <p className="text-xs text-gray-400 mt-1">3 mins ago</p>
                        </div>
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <p className="text-sm font-medium">System Update</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">GSD Portal has been updated to version 2.4.0</p>
                          <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                        </div>
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
            <button onClick={toggleMobileSidebar} className="text-green-600 dark:text-green-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaBars size={20} />
            </button>
            <div className="flex items-center">
              <img src="/images/assets/phinma.png" alt="Logo" className="w-8 h-8" />
              <span className="ml-2 font-bold text-green-600 dark:text-green-400">GSD Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-800/50">
                    <FaBell size={18} className="text-gray-600 dark:text-gray-300" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {notifications}
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
                    <Popover.Panel className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-medium">Notifications</h3>
                        <button className="text-xs text-green-600 dark:text-green-400 hover:underline">
                          Mark all as read
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <p className="text-sm font-medium">New reservation request</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A new venue request needs your approval</p>
                          <p className="text-xs text-gray-400 mt-1">3 mins ago</p>
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
            
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
        <div className="flex flex-1 pt-4 lg:pt-4">
          {/* Desktop Sidebar */}
          <div className={`hidden lg:flex lg:flex-col h-screen fixed top-0 bg-white dark:bg-gray-900 shadow-lg z-50 transition-all duration-300 ${
            isDesktopSidebarOpen ? 'w-64' : 'w-16'
          }`}>
            {/* Sidebar Header */}
            <div className={`flex items-center p-4 border-b border-green-100 dark:border-green-800 ${
              isDesktopSidebarOpen ? 'justify-between' : 'justify-center'
            }`}>
              {isDesktopSidebarOpen ? (
                <>
                  <div className="flex items-center space-x-2">
                    <img src="/images/assets/phinma.png" alt="Logo" className="w-8 h-8" />
                    <span className="font-bold text-green-600 dark:text-green-400">GSD Portal</span>
                  </div>
                  <button onClick={toggleDesktopSidebar} className="text-green-600 dark:text-green-400 p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900">
                    <FaAngleLeft size={16} />
                  </button>
                </>
              ) : (
                <button onClick={toggleDesktopSidebar} className="text-green-600 dark:text-green-400 p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900">
                  <FaAngleRight size={16} />
                </button>
              )}
            </div>

            {/* Search Input - Only show when expanded */}
            {isDesktopSidebarOpen && (
              <div className="px-4 my-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FaSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
                </div>
              </div>
            )}
            
            {/* Navigation */}
            <nav className={`flex-grow overflow-y-auto ${isDesktopSidebarOpen ? 'px-3' : 'px-2'} py-1 space-y-1`}>
              {/* Main Menu Items */}
              <MiniSidebarItem 
                icon={FaTachometerAlt} 
                text="Dashboard" 
                link="/adminDashboard" 
                active={activeItem === '/adminDashboard'}
                isExpanded={isDesktopSidebarOpen}
              />
              

              <MiniSidebarItem 
                icon={FaComments} 
                text="Chat" 
                link="/chatAdmin" 
                active={activeItem === '/chat'}
                badge={unreadMessages}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Resource Management" />}

              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Master" 
                link="/Master" 
                active={activeItem === '/Master'}
                isExpanded={isDesktopSidebarOpen}
              />
              
              <MiniSidebarDropdown 
                icon={FaFileAlt} 
                text="Resources" 
                active={['/Venue', '/VehicleEntry', '/Equipment'].includes(activeItem)}
                isExpanded={isDesktopSidebarOpen}
              >
                <MiniSidebarSubItem 
                  icon={FaHome} 
                  text="Venue" 
                  link="/Venue" 
                  active={activeItem === '/Venue'}
                  isExpanded={isDesktopSidebarOpen}
                />
                <MiniSidebarSubItem 
                  icon={FaCar} 
                  text="Vehicle" 
                  link="/VehicleEntry" 
                  active={activeItem === '/VehicleEntry'}
                  isExpanded={isDesktopSidebarOpen}
                />
                <MiniSidebarSubItem 
                  icon={FaTools} 
                  text="Equipment" 
                  link="/Equipment" 
                  active={activeItem === '/Equipment'}
                  isExpanded={isDesktopSidebarOpen}
                />
              </MiniSidebarDropdown>


              <MiniSidebarItem 
                icon={FaArchive} 
                text="Archive" 
                link="/archive" 
                active={activeItem === '/archive'}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Personnel" />}

                            <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Checklist" 
                link="/Checklist" 
                active={activeItem === '/Checklist'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaUserCircle} 
                text="Assign Personnel" 
                link="/AssignPersonnel" 
                active={activeItem === '/AssignPersonnel'}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="User Management" />}


              <MiniSidebarItem 
                icon={FaUserCircle} 
                text="Faculty" 
                link="/Faculty" 
                active={activeItem === '/Faculty'}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Manage Reservation" />}

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

            {/* Search Input */}
            <div className="px-4 mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
              </div>
            </div>

            {/* Navigation - Same as desktop but separate instance */}
            <nav className="flex-grow overflow-y-auto px-3 py-1 space-y-1">
              <SidebarItem 
                icon={FaTachometerAlt} 
                text="Dashboard" 
                link="/adminDashboard" 
                active={activeItem === '/adminDashboard'} 
              />
              

              <SidebarItem 
                icon={FaComments} 
                text="Chat" 
                link="/chatAdmin" 
                active={activeItem === '/chat'} 
                badge={unreadMessages}
              />
              
              <SectionLabel text="Resource Management" />
              
              <SidebarDropdown 
                icon={FaFileAlt} 
                text="Resources" 
                active={['/Venue', '/VehicleEntry', '/Equipment'].includes(activeItem)}
              >
                <SidebarSubItem 
                  icon={FaHome} 
                  text="Venue" 
                  link="/Venue" 
                  active={activeItem === '/Venue'} 
                />
                <SidebarSubItem 
                  icon={FaCar} 
                  text="Vehicle" 
                  link="/VehicleEntry" 
                  active={activeItem === '/VehicleEntry'} 
                />
                <SidebarSubItem 
                  icon={FaTools} 
                  text="Equipment" 
                  link="/Equipment" 
                  active={activeItem === '/Equipment'} 
                />
              </SidebarDropdown>
              
              <SidebarItem 
                icon={FaFileAlt} 
                text="Checklist" 
                link="/Checklist" 
                active={activeItem === '/Checklist'} 
              />

              <SidebarItem 
                icon={FaUserCircle} 
                text="Assign Personnel" 
                link="/AssignPersonnel" 
                active={activeItem === '/AssignPersonnel'} 
              />
              
              <SidebarItem 
                icon={FaUserCircle} 
                text="Personnel" 
                link="/AssignPersonnel" 
                active={activeItem === '/AssignPersonnel'} 
              />
              
              <SectionLabel text="Manage Reservation" />

              <SidebarItem 
                icon={FaFolder} 
                text="View Requests" 
                link="/ViewRequest" 
                active={activeItem === '/ViewRequest'} 
              />

              <SidebarItem 
                icon={FaChartBar} 
                text="Reports" 
                link="/Reports" 
                active={activeItem === '/Reports'} 
              />

              <SidebarItem 
                icon={FaFileAlt} 
                text="Records" 
                link="/record" 
                active={activeItem === '/record'} 
              />
              
              <SectionLabel text="Account" />
              
              <SidebarItem 
                icon={FaCogs} 
                text="Settings" 
                link="/settings" 
                active={activeItem === '/settings'} 
              />
            </nav>
          </div>

          {/* Main Content */}
          <main className={`flex-1 bg-gray-50 dark:bg-gray-800 min-h-screen overflow-x-hidden transition-all duration-300 ${
            !isDesktopSidebarOpen 
              ? 'lg:ml-64 pl-0 mb-[300px]' 
              : 'lg:ml-64 pl-0 mb-[300px]'
          }`}>



            {/* Content will be rendered here */}
          </main>
        </div>

        {/* Profile Modal */}
        <ProfileAdminModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
        />
      </div>
    </SidebarContext.Provider>
  );
};

// Section Label Component - Clean and minimal
const SectionLabel = ({ text }) => (
  <div className="pt-3 pb-1">
    <p className="px-2 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {text}
    </p>
  </div>
);

// Simplified SidebarItem
const SidebarItem = React.memo(({ icon: Icon, text, link, active, badge }) => {
  return (
    <Link 
      to={link} 
      className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
        active 
          ? 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-200 font-medium' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon size={16} className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
        <span className="text-sm">{text}</span>
      </div>
      
      {badge && (
        <span className="px-1.5 py-0.5 text-xs font-bold text-red-100 bg-red-500 rounded-full">
          {badge}
        </span>
      )}
      
      {active && (
        <div className="absolute left-0 w-1 h-7 bg-green-500 rounded-r-full" />
      )}
    </Link>
  );
});

// Simplified SidebarDropdown
const SidebarDropdown = React.memo(({ icon: Icon, text, active, children }) => {
  const [isOpen, setIsOpen] = useState(false);

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
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={16} className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
          <span className="text-sm">{text}</span>
        </div>
        <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} size={12} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
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
          ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300 font-medium' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20'
      }`}
    >
      <Icon size={14} className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
      <span className="text-xs">{text}</span>
    </Link>
  );
});

const MiniSidebarItem = React.memo(({ icon: Icon, text, link, active, isExpanded, badge }) => {
  return (
    <Link 
      to={link} 
      className={`flex items-center ${isExpanded ? 'justify-between p-2.5' : 'justify-center p-2'} rounded-lg transition-all ${
        active 
          ? 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-200 font-medium' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600'
      }`}
      title={!isExpanded ? text : undefined}
    >
      <div className={`flex items-center ${isExpanded ? 'space-x-3' : ''}`}>
        <Icon size={16} className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
        {isExpanded && <span className="text-sm">{text}</span>}
      </div>
      
      {badge && isExpanded && (
        <span className="px-1.5 py-0.5 text-xs font-bold text-red-100 bg-red-500 rounded-full">
          {badge}
        </span>
      )}
      
      {badge && !isExpanded && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
      )}
    </Link>
  );
});

const MiniSidebarDropdown = React.memo(({ icon: Icon, text, active, children, isExpanded }) => {
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
                  ? 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-200' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30'
              }`}
              title={text}
            >
              <Icon size={16} className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
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
                <div className="py-1">
                  {children}
                </div>
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
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={16} className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
          <span className="text-sm">{text}</span>
        </div>
        <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} size={12} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
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

const MiniSidebarSubItem = React.memo(({ icon: Icon, text, link, active, isExpanded }) => {
  return (
    <Link 
      to={link} 
      className={`flex items-center ${isExpanded ? 'space-x-2.5 p-2 pl-4 ml-2' : 'p-2'} rounded-md transition-all ${
        active 
          ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300 font-medium' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20'
      }`}
    >
      <Icon size={14} className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
      {isExpanded && <span className="text-xs">{text}</span>}
    </Link>
  );
});

export default Sidebar;