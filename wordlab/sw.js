/* WordLab service worker（2026-10-25）
 * Network-first：有網時攞最新，斷網時用快取；導航請求 fallback 去 index.html。
 * 只快取本站靜態檔，冇第三方。
 */
const CACHE = 'wordlab-v7';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './bulk.js',
  './app.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('./index.html');
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
      )
  );
});
