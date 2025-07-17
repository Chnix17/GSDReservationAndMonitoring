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
  FaClipboardCheck,
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
  FaTasks,
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

import { SecureStorage } from "../../utils/encryption";
import { clearAllExceptLoginAttempts } from "../../utils/loginAttempts";

const SidebarContext = createContext();

const Sidebar = () => {
  // Same state management as before
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("");
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);

  const name = SecureStorage.getSessionItem("name") || "Personnel";

  // Same effects as before
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

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDesktopSidebar = () =>
    setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
  const toggleMobileSidebar = () =>
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    clearAllExceptLoginAttempts();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/gsd");
    window.location.reload();
  };

  const contextValue = useMemo(
    () => ({ isDesktopSidebarOpen }),
    [isDesktopSidebarOpen]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className="flex flex-col h-screen">
        {/* Mobile Header - Same as before */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 right-0 z-30 lg:hidden flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMobileSidebar}
              className="text-black p-2 rounded-lg hover:bg-gray-100"
            >
              <FaBars size={20} />
            </button>
            <div className="flex items-center">
              <img
                src="/images/assets/phinma.png"
                alt="Logo"
                className="w-8 h-8"
              />
              <span className="ml-2 font-bold text-black">GSD Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <HeaderUserMenu name={name} handleLogout={handleLogout} />
          </div>
        </header>

        {/* Sidebar Overlay - Same as before */}
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
        <div className="flex flex-1 pt-[60px] lg:pt-0">
          {/* Desktop Sidebar */}
          <div
            className={`hidden lg:flex lg:flex-col h-screen bg-white shadow-lg z-40 transition-all duration-300 ${
              isDesktopSidebarOpen ? "w-64" : "w-16"
            }`}
          >
            {/* Sidebar Header */}
            <div
              className={`flex items-center justify-between p-4 border-b border-gray-100 ${
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
                    <span className="font-bold text-black">GSD Portal</span>
                  </div>
                  <button
                    onClick={toggleDesktopSidebar}
                    className="text-black p-1 rounded-full hover:bg-gray-100"
                  >
                    <FaAngleLeft size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleDesktopSidebar}
                  className="text-black p-1 rounded-full hover:bg-gray-100"
                >
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
                    className="w-full bg-gray-100 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-black text-black"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FaSearch
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={14}
                  />
                </div>
              </div>
            )}

            {/* Navigation - Personnel specific menu items */}
            <nav
              className={`flex-grow overflow-y-auto ${
                isDesktopSidebarOpen ? "px-3" : "px-2"
              } py-1 space-y-1`}
            >
              <MiniSidebarItem
                icon={FaTachometerAlt}
                text="Dashboard"
                link="/personnel/dashboard"
                active={activeItem === "/personnel/dashboard"}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Tasks Management" />}

              <MiniSidebarItem
                icon={FaTasks}
                text="View Tasks"
                link="/viewTask"
                active={activeItem === "/viewTask"}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem
                icon={FaClipboardCheck}
                text="Task History"
                link="/personnel/taskHistory"
                active={activeItem === "/personnel/taskHistory"}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Communication" />}

              <MiniSidebarItem
                icon={FaComments}
                text="Chat"
                link="/personnel/chat"
                active={activeItem === "/personnel/chat"}
                badge={unreadMessages}
                isExpanded={isDesktopSidebarOpen}
              />

              {isDesktopSidebarOpen && <SectionLabel text="Account" />}

              <MiniSidebarItem
                icon={FaCogs}
                text="Account Settings"
                link="/personnel/settings"
                active={activeItem === "/personnel/settings"}
                isExpanded={isDesktopSidebarOpen}
              />
            </nav>

            {/* User Profile */}
            <div className="mt-auto border-t border-gray-200">
              <Popover className="relative w-full">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`w-full p-3 flex items-center ${
                        isDesktopSidebarOpen
                          ? "justify-between"
                          : "justify-center"
                      } hover:bg-gray-100`}
                    >
                      {isDesktopSidebarOpen ? (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <FaUserCircle className="text-black" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm text-black">
                                {name}
                              </p>
                              <p className="text-xs text-gray-500">Personnel</p>
                            </div>
                          </div>
                          <FaChevronDown
                            className={`text-gray-400 transform ${
                              open ? "rotate-180" : ""
                            }`}
                            size={14}
                          />
                        </>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaUserCircle className="text-black" />
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
                      <Popover.Panel className="absolute bottom-full mb-2 left-0 z-50 w-64 origin-bottom-left rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="p-3 border-b border-gray-100">
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Personnel
                          </p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                          >
                            <FaSignOutAlt size={16} />
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
            className={`fixed lg:hidden h-[calc(120vh-60px)] bg-white dark:bg-gray-200 text-white shadow-lg z-40 w-72 transition-transform duration-300 flex flex-col ${
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <nav className="flex-grow overflow-y-auto px-3 py-1 space-y-1">
              <SidebarItem
                icon={FaTachometerAlt}
                text="Dashboard"
                link="/personnel/dashboard"
                active={activeItem === "/personnel/dashboard"}
              />

              <SidebarItem
                icon={FaTasks}
                text="View Tasks"
                link="/viewTask"
                active={activeItem === "/viewTask"}
              />

              <SidebarItem
                icon={FaClipboardCheck}
                text="Task History"
                link="/personnel/taskHistory"
                active={activeItem === "/personnel/taskHistory"}
              />

              <SidebarItem
                icon={FaComments}
                text="Chat"
                link="/personnel/chat"
                active={activeItem === "/personnel/chat"}
                badge={unreadMessages}
              />

              <SectionLabel text="Account" />

              <SidebarItem
                icon={FaCogs}
                text="Settings"
                link="/personnel/settings"
                active={activeItem === "/personnel/settings"}
              />
            </nav>
          </div>

          {/* Main Content */}
          <main
            className={`flex-1 bg-gray-50 dark:bg-gray-800 min-h-screen overflow-x-hidden transition-all duration-300 ${
              !isDesktopSidebarOpen ? "pl-0" : "lg:pl-0"
            }`}
          >
            {/* Content will be rendered here */}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

// Helper Components (HeaderUserMenu, SectionLabel, SidebarItem, MiniSidebarItem)
// Same implementation as before, just copied from user_sidebar.jsx

const HeaderUserMenu = ({ name, handleLogout }) => {
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-800/50">
            <FaUserCircle
              size={20}
              className="text-gray-600 dark:text-gray-300"
            />
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
                <p className="text-xs text-gray-500">Personnel</p>
              </div>
              <div className="p-2">
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

const SectionLabel = ({ text }) => (
  <div className="pt-3 pb-1">
    <p className="px-2 text-xs font-medium uppercase tracking-wider text-white">
      {text}
    </p>
  </div>
);

const SidebarItem = React.memo(({ icon: Icon, text, link, active, badge }) => {
  return (
    <Link
      to={link}
      className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
        active
          ? "bg-green-100 dark:bg-green-800/50 text-white font-medium"
          : "text-white hover:bg-green-50 dark:hover:bg-green-900/30"
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon
          size={16}
          className={
            active ? "text-green-600 dark:text-green-400" : "text-gray-400"
          }
        />
        <span className="text-sm">{text}</span>
      </div>
      {badge && (
        <span className="px-1.5 py-0.5 text-xs font-bold text-red-100 bg-red-500 rounded-full">
          {badge}
        </span>
      )}
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
            ? "bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-200 font-medium"
            : "text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600"
        }`}
        title={!isExpanded ? text : undefined}
      >
        <div className={`flex items-center ${isExpanded ? "space-x-3" : ""}`}>
          <Icon
            size={16}
            className={
              active ? "text-green-600 dark:text-green-400" : "text-gray-400"
            }
          />
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
  }
);

export default Sidebar;
