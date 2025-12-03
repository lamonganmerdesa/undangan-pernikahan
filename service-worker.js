const CACHE_NAME = "undangan-v1";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./cover_baru.jpg",
  "./musik.MP3",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resClone);
            });
            return res;
          })
          .catch(() => caches.match("./index.html"))
      );
    })
  );
});
