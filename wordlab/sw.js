/* WordLab service worker（2026-10-25）
 * Network-first：有網時攞最新，斷網時用快取；導航請求 fallback 去 index.html。
 * 只快取本站靜態檔，冇第三方。
 */
const CACHE = 'wordlab-v35';
const ASSETS = [
  './index.html',
  './style.css',
  './data.js',
  './bulk.js',
  './types.js',
  './blocked.js',
  './examples-pack1.js',
  './examples-pack2.js',
  './examples-pack3.js',
  './examples-pack4.js',
  './examples-pack5.js',
  './examples-pack6.js',
  './examples-pack7.js',
  './examples-pack8.js',
  './examples-pack9.js',
  './examples-pack10.js',
  './examples-pack11.js',
  './examples-pack12.js',
  './examples-pack13.js',
  './examples-pack14.js',
  './examples-pack15.js',
  './examples-pack16.js',
  './examples-pack17.js',
  './examples-pack18.js',
  './examples-pack19.js',
  './examples-pack20.js',
  './examples-pack21.js',
  './examples-pack22.js',
  './examples-pack23.js',
  './examples-pack24.js',
  './examples-pack25.js',
  './examples-pack26.js',
  './examples-pack27.js',
  './examples-pack28.js',
  './examples-pack29.js',
  './examples-pack30.js',
  './examples-pack31.js',
  './examples-pack32.js',
  './examples-pack33.js',
  './examples-pack34.js',
  './examples-pack35.js',
  './examples-pack36.js',
  './examples-pack37.js',
  './examples-pack38.js',
  './examples-pack39.js',
  './examples-pack40.js',
  './examples-pack41.js',
  './examples-pack42.js',
  './examples-pack43.js',
  './examples-pack44.js',
  './examples-pack45.js',
  './examples-pack46.js',
  './examples-pack47.js',
  './examples-pack48.js',
  './examples-pack49.js',
  './examples-pack50.js',
  './senses.js',
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
