/* sw.js - minimal PWA service worker for offline caching */

const CACHE_NAME = "ten-commandments-v1";

// Core shell files (add more if you want)
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/*
  Cache strategy:
  - For your own files (same-origin): cache-first, then network, then fallback.
  - This means images/audio will be saved after first use and work offline.
*/
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== "GET") return;

  // Only cache same-origin (your GitHub Pages domain/path)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((resp) => {
          // Save a copy to cache for later offline use
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() => {
          // If offline and not cached, you could return a fallback here if you want.
          // For now: just fail normally.
          return cached;
        });
    })
  );
});
