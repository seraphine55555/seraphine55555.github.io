/* Sentence Lab service worker（2026-10-24）
 * Network-first：有網時攞最新，斷網時用快取；導航請求 fallback 去 index.html。
 * 只快取本站 5 個檔案，冇第三方。
 */
const CACHE = 'sentence-v1';
const ASSETS = ['./', './index.html', './style.css', './sentences.js', './app.js', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((hit) => {
          if (hit) return hit;
          if (e.request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
