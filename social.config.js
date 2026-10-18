/**
 * 門戶頁「讚好／留言」後端設定（2026-10-18）。
 *
 * ⚠️ 呢個檔係**公開**嘅（GitHub Pages 會照樣送出），所以只可以放 Supabase 嘅
 *    `anon` public key —— 佢嘅權限由 RLS 政策限制。
 *    **絕對唔好**放 `service_role` key（嗰個等於資料庫管理員，放上去即係全世界都可以改你資料）。
 *
 * 留空＝功能關閉（social 區塊保持 hidden，連一個請求都唔會發）。
 *
 * 設定步驟（大約 10 分鐘）見 docs/social-setup.md：
 *   1. 開 Supabase project（免費 tier）
 *   2. SQL Editor 跑 sql/social.sql
 *   3. 由 Project Settings → API 抄 Project URL 同 anon public key 貼落下面
 *   4. push 上 GitHub Pages，再用 hub/scripts/verify-social.py 對真 project 驗一次
 */
window.HUB_SOCIAL = {
  supabaseUrl: '',
  anonKey: '',

  /* 進階：唔想用預設表名可以改（要同 sql/social.sql 一致） */
  likeTable: 'app_likes',
  likeRpc: 'like_app',
  commentTable: 'app_comments',
};
