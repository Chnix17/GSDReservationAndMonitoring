// Service Worker for Push Notifications - Version 2.4
const SW_VERSION = '2.4';
console.log('🚀 Service Worker loaded at:', new Date().toISOString());
console.log('🚀 Service Worker version:', SW_VERSION);
console.log('🚀 Service Worker scope:', self.registration ? self.registration.scope : 'No registration');
console.log('⚠️ IMPORTANT: Department Approval and Final Approval notifications should show "View Request" button only');

// Install event - immediately activate
self.addEventListener('install', function(event) {
    console.log('🔧 Service Worker installing at:', new Date().toISOString());
    console.log('🔧 SW Install event:', event);
    // Skip waiting immediately to activate right away
    event.waitUntil(self.skipWaiting().then(() => {
        console.log('🔧 Service Worker skipped waiting, will activate immediately');
    }));
});

// Activate event - take control immediately
self.addEventListener('activate', function(event) {
    console.log('⚙️ Service Worker activating at:', new Date().toISOString());
    console.log('⚙️ SW Activate event:', event);
    // Claim all clients immediately
    event.waitUntil(
        self.clients.claim().then(() => {
            console.log('⚙️ Service Worker now controls all clients');
            return self.clients.matchAll();
        }).then(clients => {
            console.log('⚙️ Active clients count:', clients.length);
            // Notify all clients that service worker is active
            clients.forEach(client => {
                client.postMessage({
                    type: 'SW_ACTIVATED',
                    timestamp: Date.now()
                });
            });
        })
    );
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
        icon: '/phinma.png',
        badge: '/phinma.png',
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
                console.log('[Service Worker] data.data structure:', data.data);
                console.log('[Service Worker] data.data.type:', data.data?.type);
                
                notificationData.title = data.title || notificationData.title;
                notificationData.body = data.body || notificationData.body;
                
                if (data.data) {
                    notificationData.data = { ...notificationData.data, ...data.data };
                }
            }
            
            // Add action buttons for chat notifications
            if (data.data && data.data.type === 'chat_message') {
                notificationData.actions = [
                    {
                        action: 'view',
                        title: 'View Chat',
                        icon: '/gsd-reservation/public/images/assets/phinma.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Close',
                        icon: '/gsd-reservation/public/images/assets/phinma.png'
                    }
                ];
                
                // Set URL for chat viewing
                notificationData.data.url = data.data.url || 'gsd/grms/Admin/Chat';
                notificationData.requireInteraction = false; // Allow auto-close for chat
            }
            // Add action buttons for reservation notifications
            else if (data.data && (data.data.type === 'reservation_confirmation' || 
                             data.data.type === 'reservation_created' ||
                             data.data.type === 'new_reservation' || 
                             data.data.type === 'reservation_pending' ||
                             data.data.type === 'reservation_approved' ||
                             data.data.type === 'reservation_declined' ||
                             data.data.type === 'reservation_final_approval' ||
                             data.data.type === 'department_approval')) {
                
                console.log('[Service Worker] Processing reservation notification, type:', data.data.type);
                console.log('[Service Worker] Is final approval?', data.data.type === 'reservation_final_approval');
                console.log('[Service Worker] Is department approval?', data.data.type === 'department_approval');
                
                let viewButtonTitle = 'View Request';
                let actionUrl = '/gsd/grms/Faculty/MyReservations';
                
                // Customize button title and URL based on notification type
                if (data.data.type === 'reservation_created' || data.data.type === 'reservation_confirmation') {
                    console.log('[Service Worker] Match: reservation_created or confirmation');
                    viewButtonTitle = 'View Request';
                    actionUrl = '/gsd/grms/Admin/viewRequest';
                } else if (data.data.type === 'new_reservation') {
                    console.log('[Service Worker] Match: new_reservation');
                    viewButtonTitle = 'View Request';
                    actionUrl = '/gsd/grms/Admin/viewRequest';
                } else if (data.data.type === 'reservation_final_approval') {
                    console.log('[Service Worker] ⚠️⚠️⚠️ MATCHED FINAL APPROVAL ⚠️⚠️⚠️');
                    viewButtonTitle = 'View Request';
                    actionUrl = data.data.url || '/gsd/grms/Admin/viewRequest';
                    console.log('[Service Worker] Final approval button title:', viewButtonTitle);
                    console.log('[Service Worker] Final approval URL:', actionUrl);
                } else if (data.data.type === 'reservation_pending') {
                    console.log('[Service Worker] Match: reservation_pending');
                    viewButtonTitle = 'View Approval';
                    actionUrl = '/gsd/grms/Department/viewApproval';
                } else if (data.data.type === 'reservation_approved' || data.data.type === 'reservation_declined') {
                    console.log('[Service Worker] Match: approved or declined');
                    viewButtonTitle = 'View Details';
                    actionUrl = '/gsd/grms/Faculty/MyReservations';
                } else if (data.data.type === 'department_approval') {
                    console.log('[Service Worker] Match: department_approval');
                    viewButtonTitle = 'View Request';
                    actionUrl = data.data.action_url || '/gsd/grms/Department/ViewApproval';
                }
                
                // For reservation creation, new reservation, final approval, and department approval, show only "View Request" button
                if (data.data.type === 'reservation_created' || 
                    data.data.type === 'reservation_confirmation' || 
                    data.data.type === 'new_reservation' ||
                    data.data.type === 'reservation_final_approval' ||
                    data.data.type === 'department_approval') {
                    console.log('[Service Worker] Using single button (View Request only) for type:', data.data.type);
                    notificationData.actions = [
                        {
                            action: 'view',
                            title: viewButtonTitle,
                            icon: '/phinma.png'
                        }
                    ];
                } else {
                    console.log('[Service Worker] Using dual buttons (View + Close) for type:', data.data.type);
                    // For other notifications, show both View and Close buttons
                    notificationData.actions = [
                        {
                            action: 'view',
                            title: viewButtonTitle,
                            icon: '/phinma.png'
                        },
                        {
                            action: 'dismiss',
                            title: 'Close',
                            icon: '/phinma.png'
                        }
                    ];
                }
                
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
    console.log('[Service Worker] Notification actions:', notificationData.actions);
    console.log('[Service Worker] Notification data.type:', notificationData.data?.type);

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

    // Create unique tag to prevent duplicates
    let notificationTag = 'default';
    let autoCloseTimeout = 60000; // Default 60 seconds
    
    if (notificationData.data) {
        if (notificationData.data.type === 'chat_message') {
            // Chat messages auto-close after 10 seconds
            notificationTag = `chat_message_${notificationData.data.sender_id}_${Date.now()}`;
            autoCloseTimeout = 10000; // 10 seconds for chat messages
        } else if (notificationData.data.type === 'reservation_created' || notificationData.data.type === 'reservation_confirmation') {
            // Use reservation_id as tag to prevent duplicate success notifications
            notificationTag = `reservation_created_${notificationData.data.reservation_id || Date.now()}`;
        } else if (notificationData.data.type === 'new_reservation') {
            // Use reservation_id as tag for admin notifications
            notificationTag = `new_reservation_${notificationData.data.reservation_id || Date.now()}`;
        } else if (notificationData.data.type === 'reservation_final_approval') {
            // Use reservation_id as tag for final approval notifications
            notificationTag = `final_approval_${notificationData.data.reservation_id || Date.now()}`;
        } else if (notificationData.data.reservation_id) {
            // Use reservation_id + type for other reservation notifications
            notificationTag = `${notificationData.data.type}_${notificationData.data.reservation_id}`;
        } else {
            // Fallback to timestamp-based tag
            notificationTag = `${notificationData.data.type || 'notification'}_${Date.now()}`;
        }
    }

    console.log('[Service Worker] Using notification tag:', notificationTag);

    // Show the notification with unique tag
    console.log('[Service Worker] Calling showNotification...');
    const notificationPromise = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            requireInteraction: notificationData.requireInteraction,
            actions: notificationData.actions || [],
            data: notificationData.data,
            tag: notificationTag // This prevents duplicate notifications with same tag
        }
    ).then(() => {
        console.log('[Service Worker] Notification shown successfully with tag:', notificationTag);
        console.log('[Service Worker] Auto-close timeout set to:', autoCloseTimeout / 1000, 'seconds');
        // Auto-close notification based on type
        setTimeout(() => {
            self.registration.getNotifications({ tag: notificationTag }).then(notifications => {
                notifications.forEach(notification => {
                    console.log('[Service Worker] Auto-closing notification after', autoCloseTimeout / 1000, 'seconds');
                    notification.close();
                });
            });
        }, autoCloseTimeout);
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
            icon: data.icon || '/phinma.png',
            badge: data.badge || '/phinma.png',
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
