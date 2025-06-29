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

const SidebarContext = createContext();

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const name = SecureStorage.getSessionItem('name') || 'Admin User';


  
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
          if (read.user_id === currentUserId && read.is_read === "1") {
            readNotificationMap.set(read.notification_id, true);
          }
        });
      }
      
      // Process approval notifications and set read status
      let processedNotifications = [];
      if (approvalData.status === 'success') {
        processedNotifications = approvalData.data.map(notification => ({
          ...notification,
          is_read: readNotificationMap.has(notification.notification_id) ? "1" : "0"
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
    const unreadCount = notifications.filter(n => n.is_read === "0").length;
    
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
              <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-medium">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => {
                        const unreadIds = notifications
                          .filter(n => n.is_read === "0")
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
                          notification.is_read === "0" ? 'bg-green-50 dark:bg-green-900/20' : ''
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
                    <FaAngleLeft size={16} />
                  </button>
                </>
              ) : (
                <button onClick={toggleDesktopSidebar} className="text-[#082308] dark:text-[#1b1e1b] p-1 rounded-full hover:bg-[#538c4c] dark:hover:bg-[#83b383]">
                  <FaAngleRight size={16} className="text-black" />
                </button>
              )}
            </div>

           
            
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
                icon={FaCalendarAlt} 
                text="Calendar" 
                link="/LandCalendar" 
                active={activeItem === '/LandCalendar'}
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
                text="Master" 
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
          </div>

          {/* Main Content */}
          <main className={`flex-1 bg-gray-50 dark:bg-gray-800 min-h-screen overflow-x-hidden transition-all duration-300 ${
            isDesktopSidebarOpen 
              ? 'lg:ml-64 pl-0 mb-[300px]' 
              : 'lg:ml-16 pl-0 mb-[300px]'
          }`}>



            {/* Content will be rendered here */}
          </main>
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

// Section Label Component - Clean and minimal
const SectionLabel = ({ text }) => (
  <div className="pt-3 pb-1">
    <p className="px-2 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {text}
    </p>
  </div>
);




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