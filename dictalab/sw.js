/*
 * 讀默 web 版 service worker。
 *
 * ⚠️ Android APK 內嘅 WebView **唔會**註冊呢個檔案（見 src/platform/pwa.ts）。
 *    原因：APK 嘅網頁資產由 APK 自己提供，一旦被 service worker 快取住，
 *    app 更新之後仍然會行舊 code —— 呢個係不可接受嘅風險。
 *
 * 策略：
 *   - /assets/*（內容雜湊檔名，immutable）→ cache-first ⇒ 第二次開即刻有
 *   - 其餘（HTML／manifest／icon）        → network-first，離線回快取
 *     ⇒ 每次上線都攞到最新版本，唔會出現「改了但用戶見到舊版」
 */

// v2（2026-10-15）：OCR 引擎由 Tesseract 換成 PaddleOCR，/ocr/ 內容完全唔同。
// 一定要升版先可以令舊 Tesseract 資產由 cache 度清走（activate 會刪其他 key）。
const CACHE = 'dictalab-web-v2';

/** 相對於 service worker 所在目錄（部署到子目錄都啱）。 */
const SCOPE = self.registration.scope;

function abs(path) {
  return new URL(path, SCOPE).href;
}

const CORE = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-32.png'].map(abs);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 逐個 add：任何一個 404 都唔應該令整個 install 失敗
    await Promise.all(CORE.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch {
        /* 個別資源唔存在就跳過 */
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 版本固定／內容雜湊嘅資產：cache-first
  //   /assets/ —— 檔名帶 hash，一變就係新 URL
  //   /ocr/    —— 版本由 scripts/fetch-ocr-assets.mjs 固定，而且係 6 MB 級大檔；
  //              唔 cache 嘅話斷網就用唔到 OCR，違背「完全離線」承諾。
  if (url.pathname.includes('/assets/') || url.pathname.includes('/ocr/')) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(req, res.clone());
      }
      return res;
    })());
    return;
  }

  // 其餘：network-first
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(req, res.clone());
      }
      return res;
    } catch {
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await caches.match(abs('./index.html'));
        if (shell) return shell;
      }
      return new Response('離線，而且未快取過呢個資源。', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
