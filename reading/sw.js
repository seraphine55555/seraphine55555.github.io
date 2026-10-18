/*
 * 閱讀理解 Service Worker（2026-10-18）
 *
 * 目的：令「離線可用」由口號變成事實（L1 斷網 reload、L2 安裝後冷啟）。
 *
 * 策略：network-first + cache fallback。
 *   - 有網：永遠攞最新（避免 GitHub Pages max-age=600 造成「部署完仍舊版」）；
 *   - 冇網：用預快取；導航請求 fallback 去 ./index.html。
 * 好處：唔需要每次部署手動 bump 版本都唔會食舊 cache。
 * 代價：離線時每個請求要先等網絡失敗（通常即刻 fail），可接受。
 *
 * ⚠️ 部署時如果有新增檔案，記得加入 ASSETS，否則第一次離線會 fetch 失敗。
 */
const CACHE = 'reading-v1';
const ASSETS = [
  './',
  './index.html',
  './reading.css',
  './app.js',
  './passages.js',
  './notes.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return cache.addAll(ASSETS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put('./index.html', copy);
          });
          return res;
        })
        .catch(function () {
          return caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copy);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req);
      })
  );
});
