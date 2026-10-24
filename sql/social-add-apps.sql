-- 2026-10-24：門戶加咗閱讀理解（reading）同句子重組（sentence），
-- 但原本 app_likes / app_comments 嘅 app_slug check 只准 dictalab / mathslab，
-- 所以新 app 嘅讚好／留言會被資料庫拒絕（實測 like_app 回 unknown app_slug、
-- 留言回 RLS 401）。
--
-- 喺 Supabase Dashboard → SQL Editor 貼晒成段 → Run（可重複跑）。
-- 跑完之後，門戶會自動由「只有分享」變返「讚好／分享／留言」：
-- hub/social.js 會讀 app_likes 有冇呢個 slug 嘅 row 來決定顯示邊個。
--
-- 唔使 service_role；呢段只係 schema 改動，要喺 Dashboard 用你嘅帳號跑。

alter table public.app_likes drop constraint if exists app_likes_app_slug_check;
alter table public.app_likes
  add constraint app_likes_app_slug_check
  check (app_slug in ('dictalab', 'mathslab', 'reading', 'sentence'));

insert into public.app_likes (app_slug, count)
values ('reading', 0), ('sentence', 0)
on conflict (app_slug) do nothing;

alter table public.app_comments drop constraint if exists app_comments_app_slug_check;
alter table public.app_comments
  add constraint app_comments_app_slug_check
  check (app_slug in ('dictalab', 'mathslab', 'reading', 'sentence'));

-- 若果之前有舊 policy 寫死兩個 slug，順手更新（policy 名同 social.sql 一致）。
drop policy if exists "comments insertable" on public.app_comments;
create policy "comments insertable"
  on public.app_comments for insert
  with check (
    hidden = false
    and char_length(body) between 1 and 300
    and app_slug in ('dictalab', 'mathslab', 'reading', 'sentence')
  );
