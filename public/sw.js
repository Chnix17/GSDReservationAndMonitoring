// Service Worker for Push Notifications
const CACHE_NAME = 'gsd-notifications-v1';

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(['./']);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - SHOW the notification
self.addEventListener('push', event => {
    console.log('[Service Worker] Push Received:', event);

    let title = 'GSD Notification';
    let body = 'You have a new notification.';
    let icon = '/images/assets/phinma.png';
    let badge = '/images/assets/phinma.png';
    let data = {
        url: '/viewRequest',
        timestamp: Date.now()
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            title = payload.title || title;
            body = payload.body || body;
            if (payload.data) {
                data = { ...data, ...payload.data };
            }
        } catch (e) {
            console.error('Push data is not valid JSON, treating as plain text.', e);
            body = event.data.text();
        }
    }
    
    const options = {
        body: body,
        icon: icon,
        badge: badge,
        tag: `gsd-notification-${Date.now()}`, // Using a timestamp tag helps prevent duplicate notifications
        data: data,
        renotify: true,
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

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (let client of clientList) {
          if (client.url.includes(event.notification.data.url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});