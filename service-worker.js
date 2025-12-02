// Service Worker untuk Undangan Pernikahan
const CACHE_NAME = 'undangan-pernikahan-v3';
const OFFLINE_URL = '/undangan-pernikahan/offline.html';

// Assets yang akan di-cache saat install
const PRECACHE_ASSETS = [
  '/undangan-pernikahan/',
  '/undangan-pernikahan/index.html',
  '/undangan-pernikahan/manifest.json',
  '/undangan-pernikahan/cover_baru.jpg',
  '/undangan-pernikahan/musik.MP3',
  '/undangan-pernikahan/posters/poster1.jpg',
  '/undangan-pernikahan/posters/poster2.jpg',
  '/undangan-pernikahan/posters/poster3.jpg',
  '/undangan-pernikahan/posters/poster4.jpg',
  '/undangan-pernikahan/posters/poster5.jpg',
  '/undangan-pernikahan/posters/poster6.jpg',
  '/undangan-pernikahan/icons/icon-192x192.png',
  '/undangan-pernikahan/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event dengan strategi caching khusus untuk video
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Handle video requests dengan cache-first, network-fallback
  if (url.pathname.match(/\.(mp4|webm)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Return cached video jika ada
          if (cachedResponse) {
            console.log('[Service Worker] Serving video from cache:', url.pathname);
            return cachedResponse;
          }
          
          // Jika tidak ada di cache, fetch dari network
          console.log('[Service Worker] Fetching video from network:', url.pathname);
          return fetch(event.request)
            .then(networkResponse => {
              // Validasi response
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              
              // Clone response untuk caching
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('[Service Worker] Cached video:', url.pathname);
                });
              
              return networkResponse;
            })
            .catch(error => {
              console.error('[Service Worker] Fetch failed:', error);
              // Return offline fallback untuk video
              return new Response('', {
                status: 408,
                statusText: 'Network error'
              });
            });
        })
    );
    return;
  }
  
  // Handle Google Maps iframe
  if (url.hostname.includes('google.com') || url.hostname.includes('maps.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Strategi cache-first untuk assets lainnya
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response jika ada
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Clone request karena request adalah stream dan hanya bisa digunakan sekali
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Validasi response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response untuk caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // Jika offline, coba serve dari cache
            return caches.match(event.request);
          });
      })
  );
});

// Background sync untuk mengirim ucapan saat online kembali
self.addEventListener('sync', event => {
  if (event.tag === 'send-greeting') {
    console.log('[Service Worker] Background sync: send-greeting');
    event.waitUntil(sendGreetings());
  }
});

async function sendGreetings() {
  // Implementasi pengiriman ucapan saat online
  console.log('[Service Worker] Sending greetings...');
}

// Push notification
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Undangan pernikahan baru tersedia!',
    icon: 'icons/icon-192x192.png',
    badge: 'icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Buka Undangan',
        icon: 'icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: 'icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Undangan Pernikahan', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/undangan-pernikahan/')
    );
  }
});