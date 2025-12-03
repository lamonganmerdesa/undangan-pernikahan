const CACHE_NAME = 'undangan-v4';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './cover_baru.jpg',
  './musik.mp3',
  './offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request)
          .then(resp => {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
            return resp;
          })
          .catch(() => caches.match('./offline.html'))
      );
    })
  );
});
