/* sw.js - PWA service worker for /eatyourbible/pwa/quiz/ */

const CACHE_NAME = "eyb-quiz-2026_Mar_19 v3";

/**
 * Core files needed so the app "boots" offline.
 * Add more items here if you want a stronger offline-first experience.
 */
const CORE_ASSETS = [
  "/eatyourbible/pwa/quiz/",
  "/eatyourbible/pwa/quiz/index.html",
  "/eatyourbible/pwa/quiz/manifest.webmanifest",
  "/eatyourbible/pwa/quiz/sw.js",

  // Your default theme + key title assets (so intro/title loads offline)
  "/eatyourbible/pwa/quiz/quiz_themes/theme-gray.css",
  "/eatyourbible/pwa/quiz/quizimages/quiz_icon.png",
  "/eatyourbible/pwa/quiz/quizimages/eyb_logo_1.png",
  "/eatyourbible/pwa/quiz/quizimages/eyb_logo_2.png",
  "/eatyourbible/pwa/quiz/quizsounds/sound_chomp.mp3"
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

/**
 * Cache-first for same-origin GET requests:
 * - If the file is already cached, use it.
 * - Otherwise fetch it, then cache it for next time.
 * This means quiz JSON, extra themes, images, and sounds get cached after first use.
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return resp;
      });
    })
  );
});
