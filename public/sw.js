// Service Worker for Push Notifications
console.log('🚀 Service Worker loaded at:', new Date().toISOString());
console.log('🚀 Service Worker scope:', self.registration ? self.registration.scope : 'No registration');

// Install event
self.addEventListener('install', function(event) {
    console.log('🔧 Service Worker installing at:', new Date().toISOString());
    console.log('🔧 SW Install event:', event);
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('⚙️ Service Worker activating at:', new Date().toISOString());
    console.log('⚙️ SW Activate event:', event);
    event.waitUntil(self.clients.claim().then(() => {
        console.log('⚙️ Service Worker now controls all clients');
    }));
});

// Push event handler
self.addEventListener('push', function(event) {
    console.log('🔥 [Service Worker] PUSH EVENT RECEIVED! 🔥');
    console.log('[Service Worker] Push Received:', event);
    console.log('[Service Worker] Push event data exists:', !!event.data);
    console.log('[Service Worker] Push event type:', typeof event.data);
    console.log('[Service Worker] Timestamp:', new Date().toISOString());
    
    // Send message to all clients that push was received
    clients.matchAll().then(clientList => {
        clientList.forEach(client => {
            client.postMessage({
                type: 'PUSH_RECEIVED',
                timestamp: Date.now(),
                hasData: !!event.data
            });
        });
    });
    
    let notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/gsd-reservation/public/images/assets/phinma.png',
        badge: '/gsd-reservation/public/images/assets/phinma.png',
        requireInteraction: true,
        data: {
            url: '/',
            timestamp: Date.now()
        }
    };

    // Parse the push data if available
    if (event.data) {
        try {
            let data;
            console.log('[Service Worker] Raw push data type:', typeof event.data);
            
            try {
                // Try to get JSON directly
                data = event.data.json();
                console.log('[Service Worker] Successfully parsed JSON from event.data.json()');
            } catch (e) {
                console.log('[Service Worker] event.data.json() failed, trying text method:', e.message);
                try {
                    const text = event.data.text();
                    console.log('[Service Worker] Raw text data:', text);
                    data = JSON.parse(text);
                    console.log('[Service Worker] Successfully parsed JSON from text');
                } catch (e2) {
                    console.error('[Service Worker] Both JSON parsing methods failed:', e2.message);
                    console.log('[Service Worker] Using default notification data');
                    data = null;
                }
            }
            
            if (data) {
                console.log('[Service Worker] Push data received:', data);
                
                notificationData.title = data.title || notificationData.title;
                notificationData.body = data.body || notificationData.body;
                
                if (data.data) {
                    notificationData.data = { ...notificationData.data, ...data.data };
                }
            }
            
            // Add action buttons for reservation notifications
            if (data.data && (data.data.type === 'reservation_confirmation' || 
                             data.data.type === 'new_reservation' || 
                             data.data.type === 'reservation_pending' ||
                             data.data.type === 'reservation_approved' ||
                             data.data.type === 'reservation_declined')) {
                
                let viewButtonTitle = 'View Request';
                let actionUrl = '/reservation/Admin/viewRequest';
                
                // Customize button title and URL based on notification type
                if (data.data.type === 'new_reservation') {
                    viewButtonTitle = 'View Request';
                    actionUrl = data.data.action_url || '/reservation/Admin/viewRequest';
                } else if (data.data.type === 'reservation_pending') {
                    viewButtonTitle = 'View Approval';
                    actionUrl = '/reservation/Dean/viewApproval';
                } else if (data.data.type === 'reservation_approved' || data.data.type === 'reservation_declined') {
                    viewButtonTitle = 'View Details';
                    actionUrl = '/reservation/User/dashboard';
                }
                
                notificationData.actions = [
                    {
                        action: 'view',
                        title: viewButtonTitle,
                        icon: '/gsd-reservation/public/images/assets/phinma.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Close',
                        icon: '/gsd-reservation/public/images/assets/phinma.png'
                    }
                ];
                
                // Set URL for reservation viewing
                notificationData.data.url = actionUrl;
                if (data.data.reservation_id) {
                    notificationData.data.reservation_id = data.data.reservation_id;
                }
            }
        } catch (error) {
            console.error('[Service Worker] Error parsing push data:', error);
        }
    }

    console.log('[Service Worker] About to show notification:', notificationData);
    console.log('[Service Worker] Notification title:', notificationData.title);
    console.log('[Service Worker] Notification body:', notificationData.body);

    // Notify all clients to refresh data
    const refreshPromise = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(function(clientList) {
        console.log('[Service Worker] Notifying clients to refresh data, found clients:', clientList.length);
        
        clientList.forEach(function(client) {
            console.log('[Service Worker] Sending refresh message to client:', client.url);
            client.postMessage({
                type: 'REFRESH_DATA',
                data: {
                    notificationData: notificationData,
                    timestamp: Date.now()
                }
            });
        });
    });

    // Show the notification
    console.log('[Service Worker] Calling showNotification...');
    const notificationPromise = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            requireInteraction: notificationData.requireInteraction,
            actions: notificationData.actions || [],
            data: notificationData.data
        }
    ).then(() => {
        console.log('[Service Worker] Notification shown successfully');
        // Auto-close notification after 60 seconds (increased from 20)
        setTimeout(() => {
            self.registration.getNotifications().then(notifications => {
                notifications.forEach(notification => {
                    if (notification.data && 
                        notification.data.timestamp === notificationData.data.timestamp) {
                        console.log('[Service Worker] Auto-closing notification after 60 seconds');
                        notification.close();
                    }
                });
            });
        }, 60000); // 60 seconds
    });

    console.log('[Service Worker] About to waitUntil with promises');
    event.waitUntil(Promise.all([notificationPromise, refreshPromise]).then(() => {
        console.log('[Service Worker] All promises completed successfully');
    }).catch(error => {
        console.error('[Service Worker] Promise error:', error);
    }));
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click received:', event);
    
    event.notification.close();

    if (event.action === 'dismiss') {
        console.log('[Service Worker] Notification dismissed');
        return;
    }

    // Handle view action or notification click
    const urlToOpen = event.notification.data?.url || '/';
    
    console.log('[Service Worker] Opening URL:', urlToOpen);

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Focus an existing client if possible
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if ('focus' in client) {
                    console.log('[Service Worker] Focusing existing window');
                    return client.focus().then(() => {
                        if (urlToOpen && client.url !== urlToOpen && 'navigate' in client) {
                            return client.navigate(urlToOpen);
                        }
                    });
                }
            }
            
            // Open a new window
            console.log('[Service Worker] Opening new window');
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Background sync (optional)
self.addEventListener('sync', function(event) {
    console.log('[Service Worker] Background sync:', event.tag);
});

// Message handler for communication with main thread
self.addEventListener('message', function(event) {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }
    if (event.data && event.data.type === 'TEST_PUSH') {
        const data = event.data.data || {};
        const title = data.title || 'Test Push Notification';
        const options = {
            body: data.body || 'This is a test push notification',
            icon: data.icon || '/gsd-reservation/public/images/assets/phinma.png',
            badge: data.badge || '/gsd-reservation/public/images/assets/phinma.png',
            data: data.data || { url: '/', timestamp: Date.now() }
        };
        event.waitUntil(self.registration.showNotification(title, options));
    }
});

// Test if service worker is receiving events
setInterval(() => {
    console.log('🔄 Service Worker heartbeat:', new Date().toISOString());
}, 30000); // Every 30 seconds

console.log('Service Worker setup complete at:', new Date().toISOString());
