const CACHE_NAME = 'dms-insight-v3';
const OFFLINE_URL = '/offline-testing';

// Files to cache for offline use - only static assets, NOT JS bundles
const PRECACHE_URLS = [
  '/offline-testing',
  '/manifest.json'
];

// Install event - cache essential files and skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install v3 - forcing immediate activation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - cleanup ALL old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate v3 - clearing old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming all clients');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - NETWORK FIRST for everything, only cache for offline fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests entirely - never cache them
  if (event.request.url.includes('/api/')) return;
  
  // Skip JavaScript and CSS files - always fetch fresh
  if (event.request.url.match(/\.(js|css)$/)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses for static assets
        if (response.status === 200 && !event.request.url.includes('/static/js/')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached version when offline
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // For navigation requests, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Skip waiting message received');
    self.skipWaiting();
  }
});
