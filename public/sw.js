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

  let defaultData = {
    title: 'GSD Notification',
    body: 'You have a new notification.',
    icon: '/images/assets/phinma.png',
    badge: '/images/assets/phinma.png',
    tag: `gsd-notification-${Date.now()}-${Math.random()}`,
    data: {
      url: '/viewRequest',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      defaultData = {
        ...defaultData,
        ...payload,
        tag: `gsd-notification-${Date.now()}-${Math.random()}`
      };
    } catch (err) {
      console.error('Failed to parse push data JSON:', err);
      try {
        const fallbackText = event.data.text();
        defaultData.body = fallbackText;
      } catch (fallbackErr) {
        console.error('Fallback text parse failed:', fallbackErr);
      }
    }
  }

  const options = {
    body: defaultData.body,
    icon: defaultData.icon,
    badge: defaultData.badge,
    tag: defaultData.tag,
    data: defaultData.data,
    renotify: true, // Added to ensure notification pops up again
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
    // Removed requireInteraction: true for better compatibility
  };

  // Close all old notifications before showing a new one
  event.waitUntil(
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(notification => notification.close());
      return self.registration.showNotification(defaultData.title, options);
    })
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
