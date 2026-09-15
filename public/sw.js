// Simply Music Lightweight Service Worker
const CACHE_NAME = 'simply-music-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let API and streaming pass through directly to network
  if (event.request.url.includes('/api/') || event.request.url.includes('/stream/')) {
    return;
  }

  // Never serve a stale HTML shell after a deployment. Hashed JS bundles can
  // change between deploys, so an old index.html can otherwise render blank.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// ─── Web Push ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'פשוט מוזיקה', body: 'יש עדכון חדש!', icon: '/icon-192.png', tag: 'update' };
  try {
    if (event.data) data = { ...data, ...JSON.parse(event.data.text()) };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/icon-192.png',
      tag: data.tag,
      renotify: true,
      dir: 'rtl',
      lang: 'he',
    })
  );
});

// Click on notification → open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
