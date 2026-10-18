/**
 * 門戶頁「讚好／留言」後端設定（由 enable-social.ps1 寫入）。
 *
 * ⚠️ 呢個檔係**公開**嘅（GitHub Pages 會照樣送出）：只可以放 Supabase 嘅 anon public key。
 *    絕對唔好放 service_role key。
 */
window.HUB_SOCIAL = {
  supabaseUrl: 'https://dwlzyrvcltkhjctfjnzm.supabase.co',
  anonKey: 'sb_publishable_6hp1FgVwQ0lIaimajOUMzg_rvSEKykL',
  likeTable: 'app_likes',
  likeRpc: 'like_app',
  commentTable: 'app_comments',
};