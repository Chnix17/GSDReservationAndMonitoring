// Service Worker for Push Notifications
console.log('Service Worker loaded');

// Install event
self.addEventListener('install', function(event) {
    console.log('Service Worker installing');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('Service Worker activating');
    event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received:', event);
    
    let notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/uploads/profileni.png',
        badge: '/uploads/profileni.png',
        tag: 'notification',
        requireInteraction: true,
        data: {
            url: '/',
            timestamp: Date.now()
        }
    };

    // Parse the push data if available
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[Service Worker] Push data received:', data);
            
            notificationData.title = data.title || notificationData.title;
            notificationData.body = data.body || notificationData.body;
            
            if (data.data) {
                notificationData.data = { ...notificationData.data, ...data.data };
            }
            
            // Add action buttons for reservation notifications
            if (data.data && data.data.type === 'reservation_confirmation') {
                notificationData.actions = [
                    {
                        action: 'view',
                        title: 'View Request',
                        icon: '/uploads/profileni.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss',
                        icon: '/uploads/profileni.png'
                    }
                ];
                
                // Set URL for reservation viewing
                if (data.data.reservation_id) {
                    notificationData.data.url = `/viewRequest?id=${data.data.reservation_id}`;
                }
            }
        } catch (error) {
            console.error('[Service Worker] Error parsing push data:', error);
        }
    }

    console.log('[Service Worker] Showing notification:', notificationData);

    // Show the notification
    const notificationPromise = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            actions: notificationData.actions || [],
            data: notificationData.data
        }
    );

    event.waitUntil(notificationPromise);
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
            // Check if there's already a window open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(window.location.origin) && 'focus' in client) {
                    console.log('[Service Worker] Focusing existing window');
                    return client.focus().then(() => {
                        // Navigate to the URL if needed
                        if (urlToOpen !== '/') {
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
    }
});

console.log('Service Worker setup complete');
