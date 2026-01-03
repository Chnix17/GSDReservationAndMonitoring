// Push Notification Manager
import { SecureStorage } from './encryption';

// Helper function to derive service worker path/scope from baseName (homepage in package.json)
const getServiceWorkerConfig = () => {
    const publicUrl = (process.env.PUBLIC_URL || '').trim();
    const base = (() => {
        if (!publicUrl || publicUrl === '.') return '';
        const withLeading = publicUrl.startsWith('/') ? publicUrl : `/${publicUrl}`;
        return withLeading.replace(/\/$/, '');
    })();
    const path = `${base}/sw.js` || '/sw.js';
    const scope = `${base}/` || '/';
    console.log('Resolved Service Worker config from PUBLIC_URL:', { publicUrl, base, path, scope });
    return { path, scope };
};

// Create inline service worker as fallback for development
const createInlineServiceWorker = () => {
    const swCode = `
// Inline Service Worker for Push Notifications (Development Fallback)
console.log('🚀 Inline Service Worker loaded at:', new Date().toISOString());

// Install event
self.addEventListener('install', function(event) {
    console.log('🔧 Service Worker installing at:', new Date().toISOString());
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('⚙️ Service Worker activating at:', new Date().toISOString());
    event.waitUntil(self.clients.claim().then(() => {
        console.log('⚙️ Service Worker now controls all clients');
    }));
});

// Push event handler
self.addEventListener('push', function(event) {
    console.log('🔥 [Service Worker] PUSH EVENT RECEIVED! 🔥');
    console.log('[Service Worker] Push Received:', event);
    
    let notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/phinma.png',
        badge: '/phinma.png',
        requireInteraction: true,
        data: {
            url: '/',
            timestamp: Date.now()
        }
    };
    
    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('[Service Worker] Parsed payload:', payload);
            notificationData = {
                title: payload.title || notificationData.title,
                body: payload.body || notificationData.body,
                icon: payload.icon || notificationData.icon,
                badge: payload.badge || notificationData.badge,
                requireInteraction: payload.requireInteraction !== undefined ? payload.requireInteraction : true,
                data: payload.data || notificationData.data,
                actions: payload.actions || []
            };
        } catch (e) {
            console.error('[Service Worker] Error parsing push data:', e);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification clicked:', event);
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Message handler
self.addEventListener('message', function(event) {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }
});
`;
    
    const blob = new Blob([swCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
};

class PushNotificationManager {
    constructor() {
        // Try to load VAPID key from server or use the hardcoded one
        this.vapidPublicKey = 'BL7W2qb8X8DQSMu3S8gozbbawaad68DCNE0wLc2_R7D3zg6FFL4vZI5oBP9AJwf-2UiE3iw4rM-gab_-NdDgrm8';
        this.applicationServerKey = null; // Will be set in initialize
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.registration = null;
        this.subscription = null;
    }

    // Convert VAPID key to Uint8Array
    urlBase64ToUint8Array(base64String) {
        console.log('Converting VAPID key:', base64String);
        
        // Remove any whitespace
        base64String = base64String.trim();
        
        // Add padding if needed
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        console.log('Base64 with padding:', base64);
        
        try {
            const rawData = window.atob(base64);
            console.log('Raw data length:', rawData.length);
            
            // Handle different key formats
            let outputArray;
            
            if (rawData.length === 65) {
                // Standard uncompressed EC public key (65 bytes)
                outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                
                // Verify the first byte is 0x04 (uncompressed point format)
                if (outputArray[0] !== 0x04) {
                    console.warn('Warning: VAPID key first byte is not 0x04:', outputArray[0]);
                }
            } else if (rawData.length === 32) {
                // This might be a raw public key or compressed format
                // For VAPID, we typically need the full 65-byte uncompressed format
                console.error('VAPID key appears to be in compressed or raw format (32 bytes)');
                console.error('VAPID requires uncompressed EC public key (65 bytes)');
                console.error('Please generate a proper VAPID key pair using a tool like:');
                console.error('web-push generate-vapid-keys');
                throw new Error('VAPID key must be in uncompressed EC format (65 bytes). Current key is 32 bytes.');
            } else {
                throw new Error(`Unsupported VAPID key length: ${rawData.length} bytes (expected 65)`);
            }
            
            console.log('Converted to Uint8Array, length:', outputArray.length);
            console.log('First few bytes:', Array.from(outputArray.slice(0, 10)));
            
            return outputArray;
        } catch (error) {
            console.error('Error converting VAPID key:', error);
            throw new Error('Invalid VAPID key format: ' + error.message);
        }
    }

    // Initialize push notifications
    async initialize() {
        if (!this.isSupported) {
            console.log('Push notifications not supported');
            return false;
        }

        // Check if we're running on a supported protocol
        if (window.location.protocol === 'file:') {
            console.error('Service Workers require HTTPS or localhost. Cannot run on file:// protocol.');
            throw new Error('Service Workers require HTTPS or localhost. Please serve this page through a web server (e.g., http://localhost:8000) instead of opening it directly from the file system.');
        }

        // Check if we're on localhost or HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
            console.error('Service Workers require HTTPS or localhost for security reasons.');
            throw new Error('Service Workers require HTTPS or localhost. Please use a local development server or HTTPS.');
        }

        // Additional check for development environment
        console.log('Protocol:', window.location.protocol);
        console.log('Hostname:', window.location.hostname);
        console.log('Port:', window.location.port);

        try {
            // Convert VAPID key
            console.log('Converting VAPID public key...');
            this.applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
            console.log('VAPID key converted successfully');
            // Register service worker with dynamic path based on API URL
            const swConfig = getServiceWorkerConfig();
            console.log('Service worker config:', swConfig);
            
            // Determine if we should use inline fallback
            let useInlineFallback = false;
            
            if (swConfig.path === null) {
                console.log('Service worker path is null - using inline fallback');
                useInlineFallback = true;
            } else {
                console.log('Full service worker URL will be:', window.location.origin + swConfig.path);
                
                // Verify service worker file exists before registration
                console.log('Checking service worker availability...');
                console.log('Current location:', window.location.href);
                console.log('Service worker path:', swConfig.path);
                console.log('Full SW URL:', window.location.origin + swConfig.path);
                
                try {
                    const swResponse = await fetch(swConfig.path, { method: 'HEAD' });
                    console.log('SW fetch response status:', swResponse.status);
                    console.log('SW fetch response headers:', swResponse.headers);
                    
                    if (!swResponse.ok) {
                        console.warn(`Service worker file not accessible at ${swConfig.path} (Status: ${swResponse.status})`);
                        console.log('Response details:', {
                            status: swResponse.status,
                            statusText: swResponse.statusText,
                            url: swResponse.url,
                            type: swResponse.type
                        });
                        useInlineFallback = true;
                    } else {
                        console.log('Service worker file verified at:', swConfig.path);
                        const contentType = swResponse.headers.get('content-type');
                        console.log('Service worker content-type:', contentType);
                    }
                } catch (fetchError) {
                    console.warn('Service worker file check failed:', fetchError);
                    console.log('Error details:', {
                        name: fetchError.name,
                        message: fetchError.message,
                        stack: fetchError.stack
                    });
                    console.log('Will use inline fallback service worker for development');
                    useInlineFallback = true;
                }
            }
            
            // Check for any existing registrations first
            const allRegistrations = await navigator.serviceWorker.getRegistrations();
            console.log('Existing service worker registrations:', allRegistrations);
            
            // Do not aggressively unregister other scopes; keep existing SWs intact
            
            // Register service worker (either file-based or inline fallback)
            let finalSwPath = swConfig.path;
            let finalScope = swConfig.scope;
            
            if (useInlineFallback) {
                console.log('Using inline fallback service worker...');
                finalSwPath = createInlineServiceWorker();
                finalScope = '/'; // Inline service worker can use root scope
            }
            
            console.log('Final SW path:', finalSwPath);
            console.log('Final scope:', finalScope);
            
            // Check if service worker is already registered at our specific scope
            const existingRegistration = await navigator.serviceWorker.getRegistration(finalScope);
            if (existingRegistration && !useInlineFallback) {
                console.log('Service Worker already registered:', existingRegistration);
                this.registration = existingRegistration;
            } else {
                // Unregister existing if we're switching to inline or different scope
                if (existingRegistration && (useInlineFallback || existingRegistration.scope !== window.location.origin + finalScope)) {
                    console.log('Unregistering existing service worker...');
                    await existingRegistration.unregister();
                }
                
                console.log('Registering new service worker...');
                try {
                    this.registration = await navigator.serviceWorker.register(finalSwPath, {
                        scope: finalScope,
                        updateViaCache: 'none' // Ensure we get the latest version
                    });
                    console.log('Service Worker registered successfully:', this.registration);
                } catch (registrationError) {
                    console.error('Service Worker registration failed:', registrationError);
                    
                    // If file-based registration failed, try inline fallback
                    if (!useInlineFallback) {
                        console.log('Trying inline fallback after file registration failed...');
                        try {
                            const inlineSwPath = createInlineServiceWorker();
                            this.registration = await navigator.serviceWorker.register(inlineSwPath, {
                                scope: '/',
                                updateViaCache: 'none'
                            });
                            console.log('Inline fallback service worker registered successfully:', this.registration);
                        } catch (fallbackError) {
                            console.error('Inline fallback registration also failed:', fallbackError);
                            throw new Error(`Both service worker registration methods failed: ${registrationError.message} | ${fallbackError.message}`);
                        }
                    } else {
                        throw new Error(`Failed to register service worker: ${registrationError.message}`);
                    }
                }
            }

            // Wait for service worker to be ready
            console.log('Waiting for service worker to be ready...');
            this.registration = await navigator.serviceWorker.ready;
            console.log('Service Worker is ready:', this.registration);
            
            // Check if service worker is active
            if (this.registration.active) {
                console.log('Service Worker is active');
            } else {
                console.log('Service Worker is not active yet, waiting...');
                
                // Try to skip waiting if there's a waiting service worker
                if (this.registration.waiting) {
                    console.log('Sending skip waiting message...');
                    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                
                // Wait for the service worker to become active with timeout
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.log('Service Worker activation timeout');
                        reject(new Error('Service Worker activation timeout'));
                    }, 10000); // 10 second timeout
                    
                    if (this.registration.active) {
                        clearTimeout(timeout);
                        resolve();
                    } else {
                        this.registration.addEventListener('updatefound', () => {
                            const newWorker = this.registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'activated') {
                                        console.log('Service Worker activated');
                                        clearTimeout(timeout);
                                        resolve();
                                    }
                                });
                            }
                        });
                        
                        // Also listen for the active service worker
                        if (this.registration.active) {
                            clearTimeout(timeout);
                            resolve();
                        }
                    }
                });
            }

            // Check if already subscribed
            this.subscription = await this.registration.pushManager.getSubscription();
            
            if (this.subscription) {
                console.log('Already subscribed to push notifications');
                return true;
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
            return false;
        }
    }

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Push notifications not supported');
        }

        // Check if Notification API is available (not available in iOS Safari)
        if (typeof Notification === 'undefined') {
            console.warn('Notification API not available on this device');
            return false;
        }

        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('Notification permission granted');
            return true;
        } else {
            console.log('Notification permission denied');
            return false;
        }
    }

    // Subscribe to push notifications
    async subscribe(userId) {
        if (!this.isSupported) {
            throw new Error('Push notifications not supported');
        }

        console.log('Starting subscription process...');
        console.log('Current registration:', this.registration);

        if (!this.registration) {
            console.log('No registration found, initializing...');
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize push notifications');
            }
        }
        
        // Double-check registration is available
        if (!this.registration) {
            throw new Error('Service worker registration is still not available');
        }
        
        console.log('Registration available:', this.registration);
        console.log('Registration active state:', this.registration.active);
        console.log('Registration installing state:', this.registration.installing);
        console.log('Registration waiting state:', this.registration.waiting);

        try {
            // Request permission first
            const permissionGranted = await this.requestPermission();
            if (!permissionGranted) {
                throw new Error('Notification permission denied');
            }

            // Ensure registration is available
            if (!this.registration || !this.registration.pushManager) {
                console.error('Registration details:', this.registration);
                throw new Error('Service worker registration failed');
            }

            console.log('Registration available, attempting to subscribe...');
            console.log('PushManager available:', !!this.registration.pushManager);
            console.log('Application server key length:', this.applicationServerKey.length);
            console.log('Application server key first byte:', this.applicationServerKey[0]);

            // Subscribe to push manager
            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.applicationServerKey
            });

            console.log('Subscribed to push notifications:', this.subscription);

            // Send subscription to server
            await this.sendSubscriptionToServer(userId);

            return true;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            throw error;
        }
    }

    // Unsubscribe from push notifications
    async unsubscribe(userId = null) {
        if (!this.subscription) {
            console.log('No subscription to unsubscribe from');
            return true;
        }

        try {
            await this.subscription.unsubscribe();
            this.subscription = null;
            console.log('Unsubscribed from push notifications');

            // Also delete from server if userId provided
            if (userId) {
                await this.deleteSubscriptionFromServer(userId);
            }

            return true;
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            throw error;
        }
    }

    // Delete subscription from server
    async deleteSubscriptionFromServer(userId) {
        try {
            const getBaseUrl = () => {
                try {
                    const storedUrl = SecureStorage?.getLocalItem?.('url');
                    if (storedUrl && typeof storedUrl === 'string') {
                        return storedUrl;
                    }
                } catch (error) {
                    console.warn('Could not read SecureStorage url, falling back to default');
                }
                return 'http://localhost/gsd-reservation/api/';
            };

            const baseUrl = getBaseUrl();
            const apiUrl = `${baseUrl}server/save-push-subscription.php`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'delete',
                    user_id: userId
                })
            });

            const result = await response.json();
            console.log('Delete subscription result:', result);
            
            if (result.status === 'success') {
                console.log('Subscription deleted from server');
                return true;
            } else {
                throw new Error(result.message || 'Failed to delete subscription');
            }
        } catch (error) {
            console.error('Failed to delete subscription from server:', error);
            throw error;
        }
    }

    // Detect device information
    detectDeviceInfo() {
        const userAgent = navigator.userAgent;
        
        // Detect device type
        const deviceType = (() => {
            if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) {
                return 'Mobile';
            } else if (/Tablet|iPad/i.test(userAgent)) {
                return 'Tablet';
            } else {
                return 'Desktop';
            }
        })();
        
        // Detect operating system
        const deviceOS = (() => {
            if (/Windows NT/i.test(userAgent)) {
                return 'Windows';
            } else if (/Mac OS X|Macintosh/i.test(userAgent)) {
                return 'macOS';
            } else if (/Linux/i.test(userAgent)) {
                return 'Linux';
            } else if (/Android/i.test(userAgent)) {
                return 'Android';
            } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
                return 'iOS';
            } else {
                return 'Unknown';
            }
        })();
        
        // Detect browser
        const browser = (() => {
            if (/Edg/i.test(userAgent)) {
                return 'Microsoft Edge';
            } else if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
                return 'Google Chrome';
            } else if (/Firefox/i.test(userAgent)) {
                return 'Mozilla Firefox';
            } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
                return 'Safari';
            } else if (/Opera|OPR/i.test(userAgent)) {
                return 'Opera';
            } else if (/Trident|MSIE/i.test(userAgent)) {
                return 'Internet Explorer';
            } else {
                return 'Unknown';
            }
        })();
        
        return {
            device_type: deviceType,
            device_os: deviceOS,
            browser: browser,
            user_agent: userAgent
        };
    }

    // Send subscription to server
    async sendSubscriptionToServer(userId) {
        if (!this.subscription) {
            throw new Error('No subscription to send');
        }

        const toBase64Url = (u8) => {
            const b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(u8)));
            return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
        };

        const subscriptionData = {
            endpoint: this.subscription.endpoint,
            keys: {
                p256dh: toBase64Url(this.subscription.getKey('p256dh')),
                auth: toBase64Url(this.subscription.getKey('auth'))
            }
        };

        // Get device information
        const deviceInfo = this.detectDeviceInfo();
        console.log('Device info detected:', deviceInfo);

        const requestData = {
            operation: 'save',
            user_id: userId,
            subscription: subscriptionData,
            device_info: deviceInfo
        };

        console.log('Sending subscription data to server:', requestData);

        try {
            // Get baseURL from SecureStorage (same as used in App.js)
            const getBaseUrl = () => {
                try {
                    const storedUrl = SecureStorage?.getLocalItem?.('url');
                    if (storedUrl && typeof storedUrl === 'string') {
                        return storedUrl;
                    }
                } catch (error) {
                    console.warn('Could not read SecureStorage url, falling back to default');
                }
                // Fallback to default URL
                return 'http://localhost/gsd-reservation/api/';
            };

            const baseUrl = getBaseUrl();
            const apiUrl = `${baseUrl}server/save-push-subscription.php`;
            
            console.log('Using API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            const result = await response.json();
            console.log('Server response:', result);
            
            if (result.status === 'success') {
                console.log('Subscription saved to server');
                return true;
            } else {
                throw new Error(result.message || 'Failed to save subscription');
            }
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
            throw error;
        }
    }

    // Check subscription status
    async getSubscriptionStatus() {
        if (!this.isSupported) {
            return { supported: false };
        }

        // Check if Notification API is available
        const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

        if (!this.registration) {
            return {
                supported: true,
                subscribed: false,
                permission: notificationPermission,
                registration: null
            };
        }

        const subscription = await this.registration.pushManager.getSubscription();
        const permission = notificationPermission;

        return {
            supported: true,
            subscribed: !!subscription,
            permission: permission,
            subscription: subscription,
            registration: this.registration
        };
    }

 
    async getServerSubscriptionStatus(userId) {
        try {
            const getBaseUrl = () => {
                try {
                    const storedUrl = SecureStorage?.getLocalItem?.('url');
                    if (storedUrl && typeof storedUrl === 'string') {
                        return storedUrl;
                    }
                } catch (error) {
                    console.warn('Could not read SecureStorage url, falling back to default');
                }
                return 'http://localhost/gsd-reservation/api/';
            };

            const baseUrl = getBaseUrl();
            const apiUrl = `${baseUrl}server/save-push-subscription.php`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'get',
                    user_id: userId
                })
            });

            const result = await response.json();
            console.log('Server subscription status:', result);
            
            return result;
        } catch (error) {
            console.error('Failed to get server subscription status:', error);
            return {
                status: 'error',
                message: 'Failed to get subscription status: ' + error.message
            };
        }
    }

    // Test notification
    async testNotification() {
        if (!this.registration) {
            throw new Error('Service worker not registered');
        }

        try {
            console.log('Testing notification display...');
            console.log('Registration:', this.registration);
            console.log('Service Worker state:', this.registration.active ? 'active' : 'inactive');
            
            // Check if service worker is active
            if (!this.registration.active) {
                console.log('Service Worker is not active, waiting...');
                await navigator.serviceWorker.ready;
                console.log('Service Worker is now ready');
            }
            
            // Show notification through service worker
            const notificationOptions = {
                body: 'This is a test notification from GSD',
                icon: '/uploads/profileni.png',
                badge: '/uploads/profileni.png',
                tag: 'test-notification',
                requireInteraction: true,
                actions: [
                    {
                        action: 'view',
                        title: 'View',
                        icon: '/uploads/profileni.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss',
                        icon: '/uploads/profileni.png'
                    }
                ],
                data: {
                    url: window.location.href,
                    timestamp: Date.now()
                }
            };
            
            console.log('Showing notification with options:', notificationOptions);
            
            // Try to show notification directly first (for debugging)
            if ('Notification' in window && Notification.permission === 'granted') {
                console.log('Attempting to show notification directly...');
                const directNotification = new Notification('Approval Notification', {
                    body: 'A New Approval Request',
                    icon: '/uploads/profileni.png',
                    requireInteraction: true
                });
                
                // Auto-close after 5 seconds for direct notification
                setTimeout(() => {
                    directNotification.close();
                }, 5000);
            }
            
            // Show notification through service worker
            const result = await this.registration.showNotification('Test Notification (Service Worker)', notificationOptions);
            console.log('Notification show result:', result);
            
            return true;
        } catch (error) {
            console.error('Failed to show test notification:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Test simple notification
    async testSimpleNotification() {
        if (!this.isSupported) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            console.log('Testing simple notification...');
            
            // Check if we have a registration
            if (!this.registration) {
                console.log('No registration, initializing...');
                await this.initialize();
            }
            
            if (!this.registration) {
                console.log('Still no registration after initialization');
                return false;
            }
            
            console.log('Registration found:', this.registration);
            console.log('Registration active:', this.registration.active);
            
            // Test if we can show a notification directly
            const testOptions = {
                body: 'This is a test notification',
                icon: '/images/assets/phinma.png',
                badge: '/images/assets/phinma.png',
                tag: 'test-notification',
                data: {
                    url: '/',
                    timestamp: Date.now()
                },
                requireInteraction: false,
                actions: [
                    {
                        action: 'view',
                        title: 'View',
                        icon: '/images/assets/phinma.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss',
                        icon: '/images/assets/phinma.png'
                    }
                ]
            };
            
            console.log('Attempting to show test notification...');
            await this.registration.showNotification('Test Notification', testOptions);
            console.log('Test notification shown successfully!');
            return true;
            
        } catch (error) {
            console.error('Error showing test notification:', error);
            return false;
        }
    }

    // Test manual push notification
    async testManualPush() {
        if (!this.isSupported) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            console.log('Testing manual push notification...');
            
            // Check if we have a registration
            if (!this.registration) {
                console.log('No registration, initializing...');
                await this.initialize();
            }
            
            if (!this.registration) {
                console.log('Still no registration after initialization');
                return false;
            }
            
            console.log('Registration found:', this.registration);
            console.log('Registration active:', this.registration.active);
            
            // Send a message to the service worker to trigger a test push
            if (this.registration.active) {
                this.registration.active.postMessage({
                    type: 'TEST_PUSH',
                    data: {
                        title: 'Manual Test Notification',
                        body: 'This is a manual test notification',
                        icon: '/images/assets/phinma.png',
                        badge: '/images/assets/phinma.png',
                        data: {
                            url: '/',
                            timestamp: Date.now()
                        }
                    }
                });
                console.log('Test push message sent to service worker');
                return true;
            } else {
                console.log('Service worker not active');
                return false;
            }
            
        } catch (error) {
            console.error('Error testing manual push:', error);
            return false;
        }
    }

    // Test multiple notifications
    async testMultipleNotifications() {
        if (!this.isSupported) {
            throw new Error('Push notifications not supported');
        }

        try {
            // Request permission first
            const permissionGranted = await this.requestPermission();
            if (!permissionGranted) {
                throw new Error('Notification permission denied');
            }

            // Show multiple test notifications
            for (let i = 1; i <= 3; i++) {
                setTimeout(() => {
                    const notification = new Notification(`GSD Test Notification ${i}`, {
                        body: `This is test notification number ${i}`,
                        icon: '/images/assets/phinma.png',
                        badge: '/images/assets/phinma.png',
                        tag: `test-notification-${i}-${Date.now()}`,
                        requireInteraction: false,
                        silent: false,
                        vibrate: [200, 100, 200]
                    });

                    console.log(`Test notification ${i} created`);

                    // Auto-close after 3 seconds
                    setTimeout(() => {
                        notification.close();
                    }, 3000);
                }, i * 1000); // Stagger notifications by 1 second
            }

            return true;
        } catch (error) {
            console.error('Failed to show multiple test notifications:', error);
            return false;
        }
    }
}

// Global instance
window.pushNotificationManager = new PushNotificationManager();

// Helper function to show server setup instructions
function showServerSetupInstructions() {
    const instructions = `
        To run this application locally, you need to serve it through a web server.
        
        Option 1 - Using PHP built-in server:
        Open terminal/command prompt in this directory and run:
        php -S localhost:8000
        
        Option 2 - Using Python:
        python -m http.server 8000
        
        Option 3 - Using Node.js (if you have http-server installed):
        npx http-server -p 8000
        
        Then open: http://localhost:8000/test-push-notifications.html
    `;
    
    console.log(instructions);
    
    // If there's a status element, update it
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.innerHTML = `
            <strong>Setup Required:</strong><br>
            This application must be served through a web server.<br>
            <strong>Quick setup:</strong> Run <code>php -S localhost:8000</code> in this directory,<br>
            then open <a href="http://localhost:8000/test-push-notifications.html" target="_blank">http://localhost:8000/test-push-notifications.html</a>
        `;
        statusElement.className = 'status warning';
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing push notification manager...');
    try {
        await window.pushNotificationManager.initialize();
        console.log('Push notification manager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize push notification manager:', error);
        
        // Show setup instructions if it's a protocol error
        if (error.message.includes('file://') || error.message.includes('HTTPS') || error.message.includes('localhost')) {
            showServerSetupInstructions();
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PushNotificationManager;
} 