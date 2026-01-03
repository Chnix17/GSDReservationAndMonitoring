import React, { useState, useEffect, createContext, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt, FaFileAlt, 
  FaBars,  FaUserCircle, FaFolder,
  FaChartBar, FaArchive, FaTimes,
  FaComments, FaBell, 
  FaAngleRight, FaAngleLeft, FaCalendarAlt, FaCheck,
  FaCar, FaListAlt, FaBuilding, FaUsers, FaPlus, FaHistory, FaSort, 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';  
import { Popover, Transition } from '@headlessui/react';
import { useMediaQuery } from 'react-responsive';
import { SecureStorage } from '../../utils/encryption';
import ProfileAdminModal from './profile_admin';
import { getApiBaseUrl } from '../../utils/apiConfig';
import axios from 'axios';
import './Sidebar.css';

// Helper functions to get service worker path/scope based on baseName (homepage in package.json)
const getServiceWorkerBase = () => {
    // CRA sets PUBLIC_URL from package.json "homepage"
    const publicUrl = (process.env.PUBLIC_URL || '').trim();
    if (!publicUrl || publicUrl === '.') return '';
    // ensure it starts with '/' and has no trailing '/'
    const withLeading = publicUrl.startsWith('/') ? publicUrl : `/${publicUrl}`;
    return withLeading.replace(/\/$/, '');
};

const getServiceWorkerPath = () => {
    const base = getServiceWorkerBase();
    return `${base}/sw.js` || '/sw.js';
};

const getServiceWorkerScope = () => {
    const base = getServiceWorkerBase();
    return `${base}/` || '/';
};

const SidebarContext = createContext();

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

  const [notifications, setNotifications] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    supported: false,
    subscribed: false,
    permission: 'default'
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [needRepair, setNeedRepair] = useState(false);
  const [repairReason, setRepairReason] = useState('');
  const [userDetails, setUserDetails] = useState(null);

  const name = SecureStorage.getLocalItem('name') || 'Admin User';
  const userLevelName = SecureStorage.getLocalItem('user_level') || SecureStorage.getLocalItem('user_level');
  // const departmentName = SecureStorage.getLocalItem('Department Name') || SecureStorage.getLocalItem('Department Name');
  
  // Compute correct base path for public assets (works under /gsd-reservation or other subpaths)
  const assetBasePath = (() => {
    try {
      const apiBase = getApiBaseUrl();
      const url = new URL(apiBase);
      // For localhost development, we need to use the project path
      // For production deployment, we need to account for subdirectory paths
      if (url.hostname === 'localhost') {
        return '/gsd-reservation-main';
      }
      return url.pathname.replace(/\/backend\/.*$/, '');
    } catch (e) {
      return '';
    }
  })();

  // Fetch user details using fetchUsersById
  const fetchUserDetails = useCallback(async () => {
    try {
      const baseUrl = SecureStorage.getLocalItem('url');
      const userId = SecureStorage.getLocalItem('user_id');
      
      if (!baseUrl || !userId) return;

      const response = await axios.post(
        `${baseUrl}Admin.php`,
        { 
          operation: 'fetchUsersById',
          id: userId 
        },
        { 
          headers: { 'Content-Type': 'application/json' } 
        }
      );

      if (response.data.status === 'success' && response.data.data.length > 0) {
        setUserDetails(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

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

  // Auto-close mobile sidebar when switching to desktop
  useEffect(() => {
    if (isDesktop && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isDesktop, isMobileSidebarOpen]);

  // Close mobile sidebar when clicking on navigation items
  const handleMobileNavClick = useCallback(() => {
    if (isMobile || isTablet) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile, isTablet]);

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

  const handleLogout = async () => {
    // Preserve critical data before clearing
    const loginAttempts = localStorage.getItem('loginAttempts');
    const url = localStorage.getItem('url');
    const baseUrl = SecureStorage.getLocalItem('url') || url;
    const usersId = SecureStorage.getLocalItem('user_id');
    
    // Log the logout to backend (best-effort)
    try {
      if (baseUrl && usersId) {
        await fetch(`${baseUrl}/login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'logout',
            json: { users_id: Number(usersId) }
          })
        });
      }
    } catch (err) {
      console.warn('Logout log failed:', err);
    } finally {
      // Clear everything
      sessionStorage.clear();
      localStorage.clear();
      
      // Restore critical data
      if (loginAttempts) localStorage.setItem('loginAttempts', loginAttempts);
      if (url) localStorage.setItem('url', url);
      
      // Navigate to login
      navigate('/');
      window.location.reload();
    }
  };

  const contextValue = useMemo(() => ({ isDesktopSidebarOpen }), [isDesktopSidebarOpen]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      const currentUserId = SecureStorage.getLocalItem('user_id');
      
      // Fetch regular notifications
      const response = await fetch(`${baseUrl}faculty&staff.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchNotification',
          userId: currentUserId
        })
      });
      const data = await response.json();

      // Set notifications from regular notifications only
      let notifications = [];
      
      if (data.status === 'success') {
        notifications = [...data.data];
        
        // Sort notifications by creation date
        notifications.sort((a, b) => {
          const dateA = new Date(a.notification_created_at || a.notification_create);
          const dateB = new Date(b.notification_created_at || b.notification_create);
          return dateB - dateA;
        });
      }
      
      setNotifications(notifications);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notifications as read
  const markNotificationsAsRead = async () => {
    try {
      const baseUrl = SecureStorage.getLocalItem("url");
      const currentUserId = SecureStorage.getLocalItem('user_id');

      // Get regular notification IDs
      const regularNotificationIds = [];

      notifications.forEach(notification => {
        if (notification.notification_reservation_id) {
          regularNotificationIds.push(notification.notification_reservation_id);
        }
      });

      // Update regular notifications if any exist
      if (regularNotificationIds.length > 0) {
        const response = await fetch(`${baseUrl}faculty&staff.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'updateReadNotification',
            notificationIds: regularNotificationIds,
            userId: currentUserId
          })
        });
        await response.json();
      }

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

  // Device fingerprint utility (hoisted and memoized for reuse)
  const detectDeviceInfo = useCallback(() => {
    const userAgent = navigator.userAgent;
    const deviceType = (() => {
      if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) return 'Mobile';
      if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
      return 'Desktop';
    })();
    const deviceOS = (() => {
      if (/Windows NT/i.test(userAgent)) return 'Windows';
      if (/Mac OS X|Macintosh/i.test(userAgent)) return 'macOS';
      if (/Linux/i.test(userAgent)) return 'Linux';
      if (/Android/i.test(userAgent)) return 'Android';
      if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
      return 'Unknown';
    })();
    const browser = (() => {
      if (/Edg/i.test(userAgent)) return 'Microsoft Edge';
      if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) return 'Google Chrome';
      if (/Firefox/i.test(userAgent)) return 'Mozilla Firefox';
      if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Safari';
      if (/Opera|OPR/i.test(userAgent)) return 'Opera';
      if (/Trident|MSIE/i.test(userAgent)) return 'Internet Explorer';
      return 'Unknown';
    })();
    return { device_type: deviceType, device_os: deviceOS, browser, user_agent: userAgent };
  }, []);

  // Add this function to fetch subscription status from backend
  const fetchPushSubscriptionStatus = useCallback(async () => {
    try {
      const userId = SecureStorage.getLocalItem('user_id');
      const baseUrl = SecureStorage.getLocalItem('url');
      // Provide device fingerprint to let backend verify device-specific match
      const deviceInfo = detectDeviceInfo();
      const response = await fetch(`${baseUrl}/server/save-push-subscription.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'get',
          user_id: userId,
          device_info: deviceInfo
        })
      });
      const result = await response.json();
      // Check if Notification API is available
      const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      if (result.status === 'success' && result.device_match) {
        // Device-specific subscription exists
        setSubscriptionStatus(prev => ({ ...prev, subscribed: true, permission: notificationPermission }));
        setNeedRepair(!!result.need_resubscribe);
        setRepairReason(result.reason || '');
      } else {
        // No device-specific subscription, show subscribe button
        setSubscriptionStatus(prev => ({ ...prev, subscribed: false, permission: notificationPermission }));
        setNeedRepair(false);
        setRepairReason('');
      }
    } catch (error) {
      console.error('Error fetching push subscription status:', error);
      setSubscriptionStatus(prev => ({ ...prev, subscribed: false }));
      setNeedRepair(false);
      setRepairReason('');
    }
  }, [detectDeviceInfo]);

  // In useEffect, call fetchPushSubscriptionStatus on mount
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    // Check if Notification API is available (not available in iOS Safari)
    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    setSubscriptionStatus(prev => ({ ...prev, supported, permission }));
    fetchPushSubscriptionStatus();
  }, [fetchPushSubscriptionStatus]);

  // Subscribe to push notifications
  const subscribeToNotifications = async () => {
    if (!subscriptionStatus.supported) {
      alert('Push notifications are not supported in your browser.');
      return;
    }

    setIsSubscribing(true);
    try {
      // Check if Notification API is available
      if (typeof Notification === 'undefined') {
        alert('Push notifications are not supported on this device (iOS Safari does not support Web Push).');
        return;
      }
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
        return;
      }

      // Unregister all existing service workers first
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      console.log('Found existing registrations:', existingRegistrations.length);
      for (const reg of existingRegistrations) {
        console.log('Unregistering:', reg.scope);
        await reg.unregister();
      }
      console.log('All existing service workers unregistered');

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Register fresh service worker
      console.log('Registering new service worker at:', getServiceWorkerPath());
      const registration = await navigator.serviceWorker.register(getServiceWorkerPath(), { 
        scope: getServiceWorkerScope(),
        updateViaCache: 'none'
      });
      console.log('Service worker registered:', registration);
      console.log('Registration state - installing:', !!registration.installing, 'waiting:', !!registration.waiting, 'active:', !!registration.active);
      
      // Force skip waiting if there's a waiting worker
      if (registration.waiting) {
        console.log('Sending SKIP_WAITING message to waiting worker');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      if (registration.installing) {
        console.log('Service worker is installing, waiting for activation...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Service worker activation timeout')), 15000);
          
          registration.installing.addEventListener('statechange', function handler(e) {
            console.log('Service worker state changed to:', e.target.state);
            if (e.target.state === 'activated') {
              clearTimeout(timeout);
              e.target.removeEventListener('statechange', handler);
              resolve();
            } else if (e.target.state === 'redundant') {
              clearTimeout(timeout);
              e.target.removeEventListener('statechange', handler);
              reject(new Error('Service worker became redundant'));
            }
          });
        });
      }
      
      // Wait for service worker to be ready
      const readyRegistration = await navigator.serviceWorker.ready;
      console.log('Service worker ready:', readyRegistration);
      console.log('Active worker:', readyRegistration.active);
      
      // Double check it's active
      if (!readyRegistration.active) {
        throw new Error('Service worker failed to activate');
      }
      console.log('Service worker is now active and ready');

      // Subscribe to push manager with new VAPID key
      console.log('Subscribing to push manager...');
      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BL7W2qb8X8DQSMu3S8gozbbawaad68DCNE0wLc2_R7D3zg6FFL4vZI5oBP9AJwf-2UiE3iw4rM-gab_-NdDgrm8')
      });

      // Send subscription to server with device information
      const userId = SecureStorage.getLocalItem('user_id');
      const baseUrl = SecureStorage.getLocalItem("url");
      const deviceInfo = detectDeviceInfo();
      
      console.log('Device info detected in Sidebar:', deviceInfo);
      
      const response = await fetch(`${baseUrl}/server/save-push-subscription.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'save',
          user_id: userId,
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
              auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
            }
          },
          device_info: deviceInfo
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        await fetchPushSubscriptionStatus();
        alert('Successfully subscribed to push notifications!');
      } else {
        throw new Error(result.message || 'Failed to save subscription');
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      alert('Failed to subscribe to notifications: ' + error.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  // detectDeviceInfo already memoized above

  // Repair existing notification subscription on this device
  const repairNotifications = async () => {
    if (!subscriptionStatus.supported) {
      alert('Push notifications are not supported in your browser.');
      return;
    }
    setIsRepairing(true);
    try {
      // Unregister all existing service workers
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      console.log('[Repair] Found existing registrations:', existingRegistrations.length);
      for (const reg of existingRegistrations) {
        console.log('[Repair] Unregistering:', reg.scope);
        await reg.unregister();
      }
      console.log('[Repair] All existing service workers unregistered');

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Register fresh service worker
      console.log('[Repair] Registering new service worker');
      const registration = await navigator.serviceWorker.register(getServiceWorkerPath(), { 
        scope: getServiceWorkerScope(),
        updateViaCache: 'none'
      });
      console.log('[Repair] Service worker registered:', registration);
      
      // Force skip waiting
      if (registration.waiting) {
        console.log('[Repair] Sending SKIP_WAITING message');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Wait for installation if needed
      if (registration.installing) {
        console.log('[Repair] Waiting for service worker to activate...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Activation timeout')), 15000);
          registration.installing.addEventListener('statechange', function handler(e) {
            console.log('[Repair] State changed to:', e.target.state);
            if (e.target.state === 'activated') {
              clearTimeout(timeout);
              e.target.removeEventListener('statechange', handler);
              resolve();
            } else if (e.target.state === 'redundant') {
              clearTimeout(timeout);
              e.target.removeEventListener('statechange', handler);
              reject(new Error('Service worker became redundant'));
            }
          });
        });
      }
      
      const readyRegistration = await navigator.serviceWorker.ready;
      console.log('[Repair] Service worker ready and active');
      
      if (!readyRegistration.active) {
        throw new Error('Service worker failed to activate');
      }

      // Check if Notification API is available
      if (typeof Notification === 'undefined') {
        throw new Error('Push notifications are not supported on this device (iOS Safari does not support Web Push)');
      }
      
      // Check permission
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }
      
      // Subscribe to push manager
      console.log('[Repair] Subscribing to push manager...');
      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BL7W2qb8X8DQSMu3S8gozbbawaad68DCNE0wLc2_R7D3zg6FFL4vZI5oBP9AJwf-2UiE3iw4rM-gab_-NdDgrm8')
      });
      console.log('[Repair] Subscription obtained:', subscription.endpoint.substring(0, 50) + '...');

      const userId = SecureStorage.getLocalItem('user_id');
      const baseUrl = SecureStorage.getLocalItem('url');
      const deviceInfo = detectDeviceInfo();

      console.log('[Repair] Sending subscription to server...');
      const res = await fetch(`${baseUrl}/server/save-push-subscription.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'save',
          user_id: userId,
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
              auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
            }
          },
          device_info: deviceInfo
        })
      });
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'Repair failed');
      await fetchPushSubscriptionStatus();
      alert('Notifications repaired successfully.');
    } catch (err) {
      console.error('Repair failed:', err);
      alert('Failed to repair notifications: ' + err.message);
    } finally {
      setIsRepairing(false);
    }
  };

  // Unsubscribe from push notifications on this device
  const unsubscribeFromNotifications = async () => {
    if (!subscriptionStatus.subscribed) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to unsubscribe from push notifications on this device? You can always subscribe again later.'
    );

    if (!confirmed) {
      return;
    }

    setIsUnsubscribing(true);
    try {
      const userId = SecureStorage.getLocalItem('user_id');
      const baseUrl = SecureStorage.getLocalItem('url');
      const deviceInfo = detectDeviceInfo();

      console.log('[Unsubscribe] Starting unsubscribe process...');
      console.log('[Unsubscribe] Device info:', deviceInfo);

      // Unsubscribe from push manager first
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          console.log('[Unsubscribe] Unsubscribing from push manager...');
          await subscription.unsubscribe();
          console.log('[Unsubscribe] Successfully unsubscribed from push manager');
        } else {
          console.log('[Unsubscribe] No active push subscription found');
        }
      } catch (err) {
        console.warn('[Unsubscribe] Error unsubscribing from push manager:', err);
        // Continue anyway to remove from database
      }

      // Remove subscription from server database
      console.log('[Unsubscribe] Removing subscription from server...');
      const response = await fetch(`${baseUrl}/server/save-push-subscription.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'deleteDevice',
          user_id: userId,
          device_info: deviceInfo
        })
      });

      const result = await response.json();
      console.log('[Unsubscribe] Server response:', result);

      if (result.status === 'success') {
        await fetchPushSubscriptionStatus();
        alert('Successfully unsubscribed from push notifications on this device.');
      } else {
        throw new Error(result.message || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('[Unsubscribe] Error:', error);
      alert('Failed to unsubscribe: ' + error.message);
    } finally {
      setIsUnsubscribing(false);
    }
  };

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

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
                className={`
                  ${isMobile || isTablet 
                    ? 'fixed left-1/2 top-20 z-50 w-[90vw] max-w-[340px] -translate-x-1/2' 
                    : 'absolute right-0 mt-2 w-96 z-10'}
                  origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5
                `}
              >
                <div className={`${isMobile ? 'p-2' : 'p-3'} border-b border-gray-100 dark:border-gray-700 flex justify-between items-center`}>
                  <h3 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => {
                        markNotificationsAsRead();
                      }}
                      className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-green-600 dark:text-green-400 hover:underline`}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className={`${isMobile ? 'max-h-60' : 'max-h-80'} overflow-y-auto`}>
                  {notifications.length === 0 ? (
                    <div className={`${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'} text-center text-gray-500 dark:text-gray-400`}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.notification_reservation_id}
                        className={`${isMobile ? 'p-2' : 'p-3'} border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          notification.is_read === 0 ? 'bg-green-50 dark:bg-green-900/20' : ''
                        }`}
                      >
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{notification.notification_message}</p>
                        <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-1`}>
                          {new Date(notification.notification_created_at || notification.notification_create).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className={`${isMobile ? 'p-1.5' : 'p-2'} text-center border-t border-gray-100 dark:border-gray-700`}>
                  <Link to="/Notification" className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-green-600 dark:text-green-400 hover:underline`}>
                    View all notifications
                  </Link>
                </div>
                
                {/* Subscription Section */}
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600`}>
                  <div className={`flex ${isMobile || isTablet ? 'flex-col gap-2' : 'items-center justify-between'}`}>
                    <div className="flex-1">
                      <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Push Notifications</p>
                      <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
                        {subscriptionStatus.subscribed 
                          ? 'Enabled' 
                          : subscriptionStatus.permission === 'denied' 
                            ? 'Blocked' 
                            : 'Not enabled'}
                      </p>
                    </div>
                    {!subscriptionStatus.subscribed && subscriptionStatus.supported && subscriptionStatus.permission !== 'denied' && (
                      <button
                        onClick={subscribeToNotifications}
                        disabled={isSubscribing}
                        className={`${isMobile || isTablet ? 'w-full px-3 py-1.5 text-xs' : 'px-3 py-1 text-xs'} bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                      >
                        {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                      </button>
                    )}
                    {subscriptionStatus.subscribed && (
                      <div className={`flex ${isMobile || isTablet ? 'flex-col w-full' : 'items-center'} gap-2`}>
                        {!needRepair && (
                          <div className={`flex items-center ${isMobile ? 'text-[10px]' : 'text-xs'} text-green-600 dark:text-green-400`}>
                            <FaCheck className="w-3 h-3 mr-1" />
                            Enabled
                          </div>
                        )}
                        <div className={`flex ${isMobile || isTablet ? 'flex-col w-full' : 'items-center'} gap-2`}>
                          <button
                            onClick={needRepair ? repairNotifications : subscribeToNotifications}
                            disabled={isRepairing || isSubscribing || isUnsubscribing}
                            className={`${needRepair ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'} ${isMobile || isTablet ? 'w-full px-3 py-1.5 text-xs' : 'px-3 py-1 text-xs'} rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                          >
                            {isRepairing ? 'Repairing...' : isSubscribing ? 'Subscribing...' : needRepair ? 'Repair' : 'Refresh'}
                          </button>
                          <button
                            onClick={unsubscribeFromNotifications}
                            disabled={isRepairing || isSubscribing || isUnsubscribing}
                            className={`${isMobile || isTablet ? 'w-full px-3 py-1.5 text-xs' : 'px-3 py-1 text-xs'} bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                          >
                            {isUnsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Notes */}
                  {subscriptionStatus.subscribed && needRepair && (
                    <p className={`mt-2 ${isMobile ? 'text-[9px]' : 'text-[10px]'} text-yellow-600 dark:text-yellow-400`}>
                      {repairReason ? `Needs repair (${repairReason.replace(/_/g,' ')})` : 'Needs repair'} — click Repair to refresh your subscription.
                    </p>
                  )}
                  {subscriptionStatus.subscribed && !needRepair && (
                    <p className={`mt-2 ${isMobile ? 'text-[9px]' : 'text-[10px]'} text-blue-600 dark:text-blue-300`}>
                      Not receiving notifications? Ensure site notifications are allowed, keep your browser running, or try logging out/in.
                    </p>
                  )}
                  {!subscriptionStatus.supported && (
                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-red-500 mt-1`}>
                      Not supported in this browser
                    </p>
                  )}
                  {subscriptionStatus.permission === 'denied' && (
                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-yellow-500 mt-1`}>
                      Please enable notifications in browser settings
                    </p>
                  )}
                  {/* Recommendation/Reminder for enabling push notifications */}
                  {(!subscriptionStatus.subscribed && subscriptionStatus.supported && subscriptionStatus.permission !== 'denied') && (
                    <div className={`mt-2 ${isMobile ? 'text-[10px]' : 'text-xs'} text-blue-600 dark:text-blue-300`}>
                      For real-time updates, enabling push notifications is recommended.
                    </div>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    );
  };

  // Build role-based menu definitions and renderer
  const roleKey = (() => {
    const r = (userLevelName || '').trim().toUpperCase();
    if (r === 'ADMIN' || r === 'ADMINISTRATOR') return 'admin';
    if (['SBO ADVISER', 'CSG PRESIDENT', 'SBO PRESIDENT'].includes(r)) return 'user';
    if (['DEAN', 'SECRETARY', 'DEPARTMENT HEAD', 'PRINCIPAL'].includes(r)) return 'department';
    if (r === 'PERSONNEL') return 'personnel';
    if (r === 'DRIVER') return 'driver';
    return 'user';
  })();

  const menus = {
    admin: [], // use existing static admin menu below
    user: [
      { type: 'link', icon: FaTachometerAlt, text: 'Dashboard', link: '/Faculty/Dashboard' },
      { type: 'link', icon: FaComments, text: 'Chat', link: '/Faculty/Chat' },
      { type: 'section', text: 'Reservation' },
      { type: 'link', icon: FaCar, text: 'Make Reservation', link: '/Faculty/addReservation' },
      { type: 'link', icon: FaFileAlt, text: 'My Reservations', link: '/Faculty/MyReservations' },
    ],
    department: [
      { type: 'link', icon: FaTachometerAlt, text: 'Dashboard', link: '/Department/Dashboard' },
      { type: 'link', icon: FaComments, text: 'Chat', link: '/Department/Chat' },
      { type: 'section', text: 'Reservation Management' },
      { type: 'link', icon: FaCar, text: 'Make Request', link: '/Department/addReservation' },
      { type: 'link', icon: FaFileAlt, text: 'My Reservation', link: '/Department/MyReservations' },
      { type: 'link', icon: FaFileAlt, text: 'My Ticket Request', link: '/Department/MyTicketRequest' },
      { type: 'section', text: 'Reports' },
      { type: 'link', icon: FaFileAlt, text: 'Submit Report', link: '/Department/SubmitReport' }
      
    ],
    personnel: [
      { type: 'link', icon: FaTachometerAlt, text: 'Dashboard', link: '/Personnel/Dashboard' },
      { type: 'link', icon: FaComments, text: 'Chat', link: '/Personnel/Chat' },
      { type: 'link', icon: FaFileAlt, text: 'View Task', link: '/Personnel/ViewTask' },
      { type: 'section', text: 'Reports' },
      { type: 'link', icon: FaFileAlt, text: 'Submit Report', link: '/Personnel/SubmitReport' },
    ],
    driver: [
      { type: 'link', icon: FaTachometerAlt, text: 'Dashboard', link: '/Driver/Dashboard' },
      { type: 'link', icon: FaComments, text: 'Chat', link: '/Driver/Chat' },
      { type: 'link', icon: FaFileAlt, text: 'Trips', link: '/Driver/Trips' },
    ]
  };

  const renderMenu = (isExpanded) => (
    <>
      {menus[roleKey].map((item, idx) => {
        if (item.type === 'section') {
          return <SectionLabel key={`sec-${idx}`} text={item.text} isExpanded={isExpanded} />;
        }
        if (item.type === 'dropdown') {
          return (
            <SidebarDropdown
              key={`dd-${idx}`}
              icon={item.icon}
              text={item.text}
              isExpanded={isExpanded}
              active={item.items?.some(it => it.link === activeItem)}
              items={item.items || []}
            />
          );
        }
        // default link
        return (
          <MiniSidebarItem
            key={`lnk-${idx}`}
            icon={item.icon}
            text={item.text}
            link={item.link}
            active={activeItem === item.link}
            isExpanded={isExpanded}
            onMobileClick={handleMobileNavClick}
          />
        );
      })}
    </>
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className={`flex flex-col h-screen `}>
        {/* Desktop Header with Profile Card */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 hidden lg:flex items-center justify-end shadow-sm fixed top-0 left-0 right-0 z-30 h-24">
          <div className="flex items-center space-x-6">
            {/* Welcome Message */}
            <div className="hidden lg:block">
              <p className="text-green-600 dark:text-green-400 font-medium">Welcome! <span className="font-bold">{userDetails ? `${userDetails.title_abbreviation ? userDetails.title_abbreviation + ' ' : ''}${userDetails.users_fname} ${userDetails.users_mname ? userDetails.users_mname + ' ' : ''}${userDetails.users_lname}${userDetails.users_suffix ? ' ' + userDetails.users_suffix : ''}` : name}</span></p>
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
                        <p className="font-medium text-sm">{userDetails ? `${userDetails.title_abbreviation ? userDetails.title_abbreviation + ' ' : ''}${userDetails.users_fname} ${userDetails.users_mname ? userDetails.users_mname + ' ' : ''}${userDetails.users_lname}${userDetails.users_suffix ? ' ' + userDetails.users_suffix : ''}` : name}</p>
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
              <img src={`${assetBasePath}/phinma.png`} alt="Logo" className="w-8 h-8" />
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
                        <p className="font-medium text-sm">{userDetails ? `${userDetails.title_abbreviation ? userDetails.title_abbreviation + ' ' : ''}${userDetails.users_fname} ${userDetails.users_mname ? userDetails.users_mname + ' ' : ''}${userDetails.users_lname}${userDetails.users_suffix ? ' ' + userDetails.users_suffix : ''}` : name}</p>
                       
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
                    <img src={`${assetBasePath}/phinma.png`} alt="Logo" className="w-8 h-8" />
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
            <nav className={`sidebar-nav flex-1 overflow-y-auto ${isDesktopSidebarOpen ? 'px-3' : 'px-2'} py-1 space-y-1`} style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {/* Dynamic: non-admin roles */}
              {roleKey !== 'admin' && renderMenu(isDesktopSidebarOpen)}
              {/* Admin: keep existing static menu */}
              {roleKey === 'admin' && (
                <>
              <MiniSidebarItem 
                icon={FaTachometerAlt} 
                text="Dashboard" 
                link="/Admin/Dashboard" 
                active={activeItem === '/Admin' || activeItem === '/Admin/' || activeItem === '/Admin/Dashboard'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaCalendarAlt} 
                text="Calendar" 
                link="/Admin/LandCalendar" 
                active={activeItem === '/Admin/LandCalendar'}
                isExpanded={isDesktopSidebarOpen}
              />
              
              <MiniSidebarItem 
                icon={FaComments} 
                text="Chat" 
                link="/Admin/Chat" 
                active={activeItem === '/Admin/Chat'}
                isExpanded={isDesktopSidebarOpen}
              />

              <SectionLabel text="Resource Management" isExpanded={isDesktopSidebarOpen} />

              {/* Master File Dropdown (Desktop) */}
              <SidebarDropdown
                icon={FaFileAlt}
                text="Master File"
                isExpanded={isDesktopSidebarOpen}
                active={[
                  '/Admin/Venue', '/Admin/VehicleEntry', '/Admin/Equipment', '/Admin/Faculty', '/Admin/Holiday', '/Admin/vehiclemake', '/Admin/vehiclecategory', '/Admin/vehiclemodel', '/Admin/equipmentCategory', '/Admin/departments'
                ].includes(activeItem)}
                items={[
                  { text: 'Venue', link: '/Admin/Venue', icon: FaBuilding },
                  { text: 'Vehicle', link: '/Admin/VehicleEntry', icon: FaCar },
                  { text: 'Equipment', link: '/Admin/Equipment', icon: FaListAlt },
                  { text: 'User', link: '/Admin/Faculty', icon: FaUsers },
                  { text: 'Holiday', link: '/Admin/Holiday', icon: FaPlus },
                  { text: 'Venue Location', link: '/Admin/VenueBuilding', icon: FaBuilding },
                  { section: '___________________________ ' },
                  { text: 'Vehicle Make', link: '/Admin/vehiclemake', icon: FaCar },
                  { text: 'Vehicle Category', link: '/Admin/vehiclecategory', icon: FaListAlt },
                  { text: 'Vehicle Model', link: '/Admin/vehiclemodel', icon: FaCar },
                  { section: '___________________________ ' },
                  { text: 'Equipment Category', link: '/Admin/equipmentCategory', icon: FaFolder },
                  { section: '___________________________ ' },
                  { text: 'Department', link: '/Admin/departments', icon: FaBuilding },
                ]}
              />

              {/* Checklist Navigation Item */}
              <MiniSidebarItem 
                icon={FaCheck} 
                text="Checklist" 
                link="/Admin/Checklist" 
                active={activeItem === '/Admin/Checklist'}
                isExpanded={isDesktopSidebarOpen}
              />

              {/* Restore Archive nav item (Desktop) */}
              <MiniSidebarItem 
                icon={FaArchive} 
                text="Deactive Data" 
                link="/Admin/archive" 
                active={activeItem === '/Admin/archive'}
                isExpanded={isDesktopSidebarOpen}
              />

            
              <SectionLabel text="RESERVATION & WORK MANAGEMENT" isExpanded={isDesktopSidebarOpen} />

              <MiniSidebarItem 
                icon={FaUserCircle} 
                text="Assign Personnel" 
                link="/Admin/AssignPersonnel" 
                active={activeItem === '/Admin/AssignPersonnel'}
                isExpanded={isDesktopSidebarOpen}
              />

              {/* Approval Sequence */}
              <MiniSidebarItem 
                icon={FaSort} 
                text="Approval Sequence" 
                link="/Admin/assignApproval" 
                active={activeItem === '/Admin/assignApproval'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaFolder} 
                text="Reservation Request" 
                link="/Admin/ViewRequest" 
                active={activeItem === '/Admin/ViewRequest'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaListAlt} 
                text="All Job Orders" 
                link="/Admin/AllJobOrders" 
                active={activeItem === '/Admin/AllJobOrders'}
                isExpanded={isDesktopSidebarOpen}
              />

              <SectionLabel text="REPORTS & LOGS" isExpanded={isDesktopSidebarOpen} />

              <MiniSidebarItem 
                icon={FaChartBar} 
                text="Defect Reports" 
                link="/Admin/Reports" 
                active={activeItem === '/Admin/Reports'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Issue & Bugs Reports" 
                link="/Admin/IssueBugsReports" 
                active={activeItem === '/Admin/IssueBugsReports'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaArchive} 
                text="Reservation Records" 
                link="/Admin/record" 
                active={activeItem === '/Admin/record'}
                isExpanded={isDesktopSidebarOpen}
              />

              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Complaint Report" 
                link="/Admin/AllJobOrders" 
                active={activeItem === '/Admin/AllJobOrders'}
                isExpanded={isDesktopSidebarOpen}
              />
              
              <MiniSidebarItem 
                icon={FaHistory} 
                text="Audit Trail" 
                link="/Admin/AuditLog" 
                active={activeItem === '/Admin/AuditLog'}
                isExpanded={isDesktopSidebarOpen}
              />

              {/* Venue Schedule for GSD Admin */}
              {/* {((departmentName || '').trim().toUpperCase() === 'GSD' && (userLevelName || '').trim().toUpperCase() === 'ADMIN') && (
                <MiniSidebarItem 
                  icon={FaCalendarAlt} 
                  text="Venue Batch Upload" 
                  link="/Admin/VenueSchedule" 
                  active={activeItem === '/Admin/VenueSchedule'}
                  isExpanded={isDesktopSidebarOpen}
                />
              )} */}
              </>
              )}
            </nav>

            {/* User Profile - Show only icon when collapsed */}
            
          </div>

          {/* Mobile Sidebar */}
          <div className={`mobile-sidebar sidebar-transition fixed lg:hidden h-screen top-0 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 shadow-lg z-40 ${isMobile || isTablet ? 'w-1/2' : 'w-72'} transition-transform duration-300 flex flex-col ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-green-100 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <img src={`${assetBasePath}/phinma.png`} alt="Logo" className="w-8 h-8" />
                <span className="font-bold text-green-600 dark:text-green-400">GSD Portal</span>
              </div>
              <button onClick={toggleMobileSidebar} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                <FaTimes size={18} />
              </button>
            </div>

            

            {/* Navigation - Same as desktop but separate instance */}
            <nav className={`sidebar-nav mobile-nav flex-1 overflow-y-auto px-3 py-1 space-y-1 ${isMobile ? 'pb-16' : 'pb-8'}`} style={{ maxHeight: 'calc(100vh - 100px)', paddingBottom: isMobile ? '4rem' : '2rem' }}>
            {/* Dynamic: non-admin roles */}
              {roleKey !== 'admin' && renderMenu(true)}
              {/* Admin: keep existing static menu */}
              {roleKey === 'admin' && (
                <>
              <MiniSidebarItem 
                icon={FaTachometerAlt} 
                text="Dashboard" 
                link="/Admin/Dashboard" 
                active={activeItem === '/Admin' || activeItem === '/Admin/' || activeItem === '/Admin/Dashboard'}
                isExpanded={true}
              />

              <MiniSidebarItem 
                icon={FaCalendarAlt} 
                text="Calendar" 
                link="/Admin/LandCalendar" 
                active={activeItem === '/Admin/LandCalendar'}
                isExpanded={true}
              />
              
              <MiniSidebarItem 
                icon={FaComments} 
                text="Chat" 
                link="/Admin/Chat" 
                active={activeItem === '/Admin/Chat'}
                isExpanded={true}
              />

              <SectionLabel text="Resource Management" isExpanded={true} />

              {/* Master File Dropdown (Mobile) */}
              <SidebarDropdown
                icon={FaFileAlt}
                text="Master File"
                isExpanded={true}
                active={[
                  '/Admin/Venue', '/Admin/VehicleEntry', '/Admin/Equipment', '/Admin/Faculty', '/Admin/Holiday', '/Admin/vehiclemake', '/Admin/vehiclecategory', '/Admin/vehiclemodel', '/Admin/equipmentCategory', '/Admin/departments'
                ].includes(activeItem)}
                items={[
                  { text: 'Venue', link: '/Admin/Venue', icon: FaBuilding },
                  { text: 'Vehicle', link: '/Admin/VehicleEntry', icon: FaCar },
                  { text: 'Equipment', link: '/Admin/Equipment', icon: FaListAlt },
                  { text: 'Users', link: '/Admin/Faculty', icon: FaUsers },
                  { text: 'Holidays', link: '/Admin/Holiday', icon: FaPlus },
                  { section: 'Sub-Vehicle ' },
                  { text: 'Vehicle Make', link: '/Admin/vehiclemake', icon: FaCar },
                  { text: 'Vehicle Category', link: '/Admin/vehiclecategory', icon: FaListAlt },
                  { text: 'Vehicle Model', link: '/Admin/vehiclemodel', icon: FaCar },
                  { section: 'Sub-Equipment ' },
                  { text: 'Equipment Category', link: '/Admin/equipmentCategory', icon: FaFolder },
                  { section: 'Sub-Department ' },
                  { text: 'Department', link: '/Admin/departments', icon: FaBuilding },
                ]}
              />

              {/* Checklist Navigation Item */}
              <MiniSidebarItem 
                icon={FaCheck} 
                text="Checklist" 
                link="/Admin/Checklist" 
                active={activeItem === '/Admin/Checklist'}
                isExpanded={true}
              />

              {/* Restore Archive nav item (Mobile) */}
              <MiniSidebarItem 
                icon={FaArchive} 
                text="Deactive Data" 
                link="/Admin/archive" 
                active={activeItem === '/Admin/archive'}
                isExpanded={true}
              />

             

              <SectionLabel text="RESERVATION & WORK MANAGEMENT" isExpanded={true} />

              <MiniSidebarItem 
                icon={FaUserCircle} 
                text="Assign Personnel" 
                link="/Admin/AssignPersonnel" 
                active={activeItem === '/Admin/AssignPersonnel'}
                isExpanded={true}
              />

              {/* Approval Sequence */}
              <MiniSidebarItem 
                icon={FaSort} 
                text="Approval Sequence" 
                link="/Admin/assignApproval" 
                active={activeItem === '/Admin/assignApproval'}
                isExpanded={true}
              />

              <MiniSidebarItem 
                icon={FaFolder} 
                text="Reservation Request" 
                link="/Admin/ViewRequest" 
                active={activeItem === '/Admin/ViewRequest'}
                isExpanded={true}
              />

              <MiniSidebarItem 
                icon={FaListAlt} 
                text="All Job Orders" 
                link="/Admin/AllJobOrders" 
                active={activeItem === '/Admin/AllJobOrders'}
                isExpanded={true}
              />

              <SectionLabel text="REPORTS & LOGS" isExpanded={true} />

              <MiniSidebarItem 
                icon={FaChartBar} 
                text="Defect Reports" 
                link="/Admin/Reports" 
                active={activeItem === '/Admin/Reports'}
                isExpanded={true}
              />

              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Issue & Bugs Reports" 
                link="/Admin/IssueBugsReports" 
                active={activeItem === '/Admin/IssueBugsReports'}
                isExpanded={true}
              />

              <MiniSidebarItem 
                icon={FaArchive} 
                text="Reservation Records" 
                link="/Admin/record" 
                active={activeItem === '/Admin/record'}
                isExpanded={true}
              />

              <MiniSidebarItem 
                icon={FaFileAlt} 
                text="Complaint Report" 
                link="/Admin/AllJobOrders" 
                active={activeItem === '/Admin/AllJobOrders'}
                isExpanded={true}
              />

              <MiniSidebarItem 
                icon={FaHistory} 
                text="Audit Trail" 
                link="/Admin/AuditLog" 
                active={activeItem === '/Admin/AuditLog'}
                isExpanded={true}
              />

              {/* Venue Schedule for GSD Admin */}
              {/* {((departmentName || '').trim().toUpperCase() === 'GSD' && (userLevelName || '').trim().toUpperCase() === 'ADMIN') && (
                <MiniSidebarItem 
                  icon={FaCalendarAlt} 
                  text="Venue Schedule" 
                  link="/Admin/VenueSchedule" 
                  active={activeItem === '/Admin/VenueSchedule'}
                  isExpanded={true}
                />
              )} */}
              </>
              )}
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
          onProfileUpdate={fetchUserDetails}
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
const SectionLabel = ({ text, isExpanded = true }) => {
  if (!isExpanded) return null;
  
  return (
    <div className="pt-3 pb-1">
      <p className="px-2 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {text}
      </p>
    </div>
  );
};

const MiniSidebarItem = React.memo(({ icon: Icon, text, link, active, isExpanded, badge, onMobileClick }) => {
  // Responsive hooks for better mobile experience
  const isMobile = useMediaQuery({ maxWidth: 767 });
  
  const handleClick = (e) => {
    e.preventDefault();
    
    // Close mobile sidebar if on mobile/tablet
    if (onMobileClick) {
      onMobileClick();
    }
    
    // Always use the direct link path for nested routes
    const baseUrl = window.location.origin + '/gsd/grms';
    const fullUrl = baseUrl + link;
    window.location.assign(fullUrl);
  };

  return (
    <button 
      onClick={handleClick}
      className={`mobile-nav-item w-full flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} ${isMobile ? 'p-3' : isExpanded ? 'p-2.5' : 'p-2'} rounded-lg transition-all ${
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
    </button>
  );
});

// Add SidebarDropdown component at the end of the file
const SidebarDropdown = ({ icon: Icon, text, isExpanded, active, items, onMobileClick }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const activeItem = location.pathname;
  
  // Responsive hooks for dropdown behavior
  const isMobile = useMediaQuery({ maxWidth: 767 });
  // const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  // Helper to check if any item is currently active (matches current pathname)
  const isAnyItemActive = items.some(item => item.link && activeItem === item.link);

  return (
    <div className="relative">
      <button
        type="button"
        className={`flex items-center w-full ${isExpanded ? 'justify-between p-2.5' : 'justify-center p-2'} rounded-lg transition-all ${
          active ? 'bg-[#145414] text-white font-medium' : 'text-black hover:bg-[#d4f4dc] hover:text-[#145414]'
        }`}
        onClick={() => {
          if (!open || !isAnyItemActive) {
            setOpen((prev) => !prev);
          }
        }}
        title={!isExpanded ? text : undefined}
      >
        <div className={`flex items-center ${isExpanded ? 'space-x-3' : ''}`}>
          <Icon size={16} className={active ? 'text-white' : 'text-[#145414]'} />
          {isExpanded && <span className="text-sm">{text}</span>}
        </div>
        {isExpanded && (
          <span className="ml-auto">
            {open ? <FaAngleLeft size={12} /> : <FaAngleRight size={12} />}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`dropdown-content overflow-hidden ${isExpanded ? 'pl-8' : ''}`}
          >
            {items.map((item, idx) => {
              if (item.section) {
                return (
                  <div key={item.section + idx} className="pt-3 pb-1">
                    <p className="px-2 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {item.section}
                    </p>
                  </div>
                );
              }
              const ItemIcon = item.icon;
              const isItemActive = activeItem === item.link;
              return (
                <button
                  key={item.link}
                  onClick={() => {
                    // Close mobile sidebar if on mobile/tablet
                    if (onMobileClick) {
                      onMobileClick();
                    }
                    
                    // Always use the direct link path for nested routes
                    const baseUrl = window.location.origin + '/gsd/grms';
                    const fullUrl = baseUrl + item.link;
                    window.location.assign(fullUrl);
                  }}
                  className={`mobile-dropdown-item w-full flex items-center gap-2 ${isMobile ? 'py-3 px-3' : 'py-2 px-2'} rounded-lg text-sm transition-all ${
                    isItemActive
                      ? 'bg-[#145414] text-white font-medium'
                      : 'text-black hover:bg-[#d4f4dc] hover:text-[#145414]'
                  }`}
                >
                  {ItemIcon && <ItemIcon size={15} className={isItemActive ? 'text-white' : 'text-[#145414]'} />}
                  {item.text}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



export default Sidebar;
