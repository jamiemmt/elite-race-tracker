/* Workout Creator Service Worker
 * Strategy:
 *   - App shell (HTML, JS, CSS, icons): cache-first, updated on each new deploy
 *   - API calls (/api/...): network-only (can't work offline anyway — needs Anthropic + Garmin)
 *   - Everything else: network-first with cache fallback
 */

const CACHE = 'workout-creator-v1';

// Resources to pre-cache on install (app shell)
const PRECACHE = [
  '/',
  '/garmin-workout',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Remove old caches from previous versions
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API calls — they need live network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for static assets (JS/CSS/images with content hashes)
  if (
    url.pathname.startsWith('/static/') ||
    url.pathname.match(/\.(png|ico|svg|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for navigation (HTML) — fallback to cache so app works offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});
