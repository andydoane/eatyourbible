/* sw.js - PWA service worker for /eatyourbible/pwa/commandments/ */

const CACHE_NAME = "ten-commandments-v1";

const CORE_ASSETS = [
  "/eatyourbible/pwa/commandments/",
  "/eatyourbible/pwa/commandments/index.html",
  "/eatyourbible/pwa/commandments/manifest.webmanifest",
  "/eatyourbible/pwa/commandments/sw.js"
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
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin GET requests (images/audio will be saved after first use)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return resp;
        });
    })
  );
});
