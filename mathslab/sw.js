/* sw.js — 數練 MathsLab service worker（手寫，唔用 Workbox）。
 *
 * 呢個 app 係純前端：所有題目都由種子 PRNG 即時生成，冇 API、冇後端。所以快取
 * 策略非常簡單：
 *
 *   - 導覽請求（HTML）→ network-first，離線時回快取，確保更新一定拿得到
 *   - 同源靜態檔 → cache-first（檔名有內容雜湊，永遠唔會變）
 *   - Google Fonts CSS → stale-while-revalidate（字型係可選，失敗就用系統字型）
 *   - fonts.gstatic.com woff2 → cache-first（URL 已含版本）
 *
 * ⚠️ 重要限制：Service Worker 只在**安全來源**（https 或 localhost）註冊得到。
 * 屋企 Wi-Fi 用 http://192.168.x.x 係非安全來源，所以平板上面呢個檔案**唔會生效**
 * —— 但 manifest 同 apple-touch-icon 照樣有效（加到主畫面、全螢幕）。
 * 換言之：平板今日就有圖示同全螢幕；離線要等有 https 才會有。
 *
 * 改動快取策略時記得改 CACHE 版本號，舊快取會在 activate 時清走。
 */

const CACHE = 'mathslab-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

/**
 * 由 index.html 解析出真正要快取的檔案。
 *
 * 點解要咁做：建置產物嘅檔名有內容雜湊（`index-CAGuSFb0.js`），而 sw.js 係
 * `public/` 裡面嘅靜態檔，寫程式碼時根本唔知個名。第一版只 precache 咗
 * `./`、`./index.html`、`./manifest.webmanifest`，結果離線 reload 開得到 HTML
 * 但載入唔到 JS —— 因為首次瀏覽時 Service Worker 仲未啟用，啲 asset 從來冇經過
 * fetch handler，所以冇入快取。實測就係咁樣失敗。
 *
 * 改為 install 時抓一次 index.html、掃出所有同源 asset 再逐個快取。
 */
async function precache(cache) {
  const targets = new Set(SHELL);
  try {
    const html = await fetch('./index.html', { cache: 'reload' }).then((r) => r.text());
    for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = m[1];
      const sameOrigin =
        !url.startsWith('data:') && !url.includes('://') && !url.startsWith('//');
      if (sameOrigin) targets.add(url);
    }
  } catch {
    /* 連 index.html 都抓唔到就惟有靠 fetch handler 慢慢填 */
  }
  // 逐個加，唔用 addAll —— 一個 404 就會令整個 install 失敗。
  await Promise.all(
    [...targets].map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await precache(await caches.open(CACHE));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

/** 先上網，失敗才回快取。用於 HTML。 */
async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return (await cache.match(request)) || (await cache.match(fallbackUrl)) || Response.error();
  }
}

/** 先快取，冇才上網。用於有內容雜湊的同源靜態檔。 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}

/** 即時回快取，背景更新。用於 Google Fonts 的 CSS。 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => hit);
  return hit || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request));
  }
});
