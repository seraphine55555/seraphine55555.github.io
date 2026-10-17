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

// v3（2026-10-17）：修「離線 reload 白屏」。
//   v2 只 precache CORE（HTML／manifest／icon），**冇 precache /assets/ 嘅 JS/CSS**
//   —— 因為首次載入時 service worker 仲未接管，`index-XXXX.js` 嘅請求喺 SW 之前
//   就已經發生，所以永遠唔會入 cache。結果：斷網 reload ⇒ HTML 由 cache 出到、
//   但 `<script src=assets/...>` cache miss ⇒ fetch 失敗 ⇒ **白屏**。
//   實測（scripts/verify-offline.py）v2 係 3 個 problem。
//   修法：install 時抓 index.html、用 regex 抽出 hash 檔名嘅 assets 一併 cache。
//   升版一定要改呢個字串，activate 會刪走舊 key。
const CACHE = 'dictalab-web-v3';

/** 相對於 service worker 所在目錄（部署到子目錄都啱）。 */
const SCOPE = self.registration.scope;

function abs(path) {
  return new URL(path, SCOPE).href;
}

const CORE = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-32.png'].map(abs);

/**
 * 由 index.html 抽出所有 `/assets/...`（檔名帶 hash，每個 build 都唔同）。
 *
 * 唔硬編檔名，因為 hash 每次 build 都變 —— 硬編就要每次 build 改 sw.js。
 * 用正則抽，令 sw.js 唔需要知道 build 產物。
 */
async function assetUrlsFromHtml() {
  try {
    const res = await fetch(abs('./index.html'), { cache: 'reload' });
    if (!res.ok) return [];
    const html = await res.text();
    const out = new Set();
    const re = /(?:src|href)="([^"]*\/assets\/[^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) out.add(abs(m[1].replace(/^\.?\//, '')));
    return [...out];
  } catch {
    return [];
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 逐個 add：任何一個 404 都唔應該令整個 install 失敗
    const targets = CORE.concat(await assetUrlsFromHtml());
    await Promise.all(targets.map(async (url) => {
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
      // ⚠️ 一定要 `ignoreVary: true`（2026-10-17 實測，v3 第一版仲係白屏）。
      //
      //     Vite 出嘅 script 係 `<script type="module" crossorigin src=...>`，
      //     呢種請求**會帶 `Origin` header**。而 install 階段我哋用
      //     `cache.add(new Request(url))` 預快取 —— 嗰個 request **冇** Origin。
      //     Vite preview／GitHub Pages 嘅回應帶 `Vary: Origin`，
      //     所以 Cache API 用 Vary 做比對：有 Origin 嘅 script 請求
      //     vs 冇 Origin 嘅快取 key ⇒ **唔配** ⇒ cache miss ⇒ 白屏。
      //
      //     症狀極易誤判：快取清單明明有嗰個檔、喺 page context 用
      //     `caches.match(url)` 都話中，但文件自己嘅 script 就 503。
      //     `ignoreVary` 就係為呢種情況而設。
      const hit = await caches.match(req, { ignoreVary: true });
      if (hit) return hit;
      // ⚠️ 一定要 try/catch：斷網而 cache 又 miss 嘅話，`await fetch(req)` 會 throw
      //    ⇒ respondWith 嘅 promise reject ⇒ 成個 script 載入失敗。
      //    寧願回一個明確嘅 503，好過靜靜死掉。
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(req, res.clone());
        }
        return res;
      } catch {
        return new Response('離線，而且未快取過呢個資源。', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
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
      // 同上面一樣要 ignoreVary（HTML／manifest 嘅回應亦可能帶 Vary）
      const hit = await caches.match(req, { ignoreVary: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await caches.match(abs('./index.html'), { ignoreVary: true });
        if (shell) return shell;
      }
      return new Response('離線，而且未快取過呢個資源。', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
