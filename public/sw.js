// Bump this version string whenever you deploy changes
const CACHE_VERSION = 'goals-v3';

self.addEventListener('install', event => {
  // Force the new service worker to activate immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(['/', '/index.html', '/manifest.json']))
  );
});

self.addEventListener('activate', event => {
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Delete all old caches
      caches.keys().then(names =>
        Promise.all(names.filter(n => n !== CACHE_VERSION).map(n => caches.delete(n)))
      ),
      // Claim all open tabs/windows so the update applies instantly
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  // Only cache GET requests. POST requests (like API calls to OpenRouter) cannot be cached.
  if (event.request.method !== 'GET') {
    return; // Let the browser handle the request normally
  }

  // Network first — always try to get the latest from the server
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a copy of successful responses for offline use
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Listen for "skipWaiting" message from the page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', event => {
  console.log('Notification click received.');
  
  event.notification.close();

  // Try to open/focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        // If so, just focus it.
        if (client.url === event.notification.data?.url || client.url.startsWith(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});
