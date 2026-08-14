const CACHE_NAME = 'shikshamitr-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/materials.html',
  '/reading.html',
  '/faculty.html',
  '/css/style.css',
  '/js/theme.js',
  '/js/app.js',
  '/js/materials.js',
  '/js/reading.js',
  '/js/faculty.js',
  '/images/logo-icon.png',
  '/images/logo.png',
  '/manifest.json'
];

// Install Event - Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate for assets, Network-first for API
self.addEventListener('fetch', (event) => {
  // Only handle http and https requests (ignore chrome-extension:// etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // Skip non-GET requests and analytics requests
  if (event.request.method !== 'GET' || url.origin.includes('googletagmanager') || url.origin.includes('google-analytics')) {
    return;
  }

  // For API requests: Network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For Static Assets & HTML: Cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
