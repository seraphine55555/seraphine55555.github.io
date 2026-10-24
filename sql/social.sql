-- 門戶頁「讚好／留言」資料表（Supabase / Postgres）
-- 2026-10-18
--
-- 跑法：Supabase Dashboard → SQL Editor → 貼晒成段 → Run（可以重複跑，全部 IF NOT EXISTS）
--
-- 安全模型：
--   * anon key 係公開嘅，所以**所有**保護靠 RLS / grant。
--   * anon 只可以：讀 likes 數、呼叫 like_app()、讀 hidden=false 嘅留言、插入留言。
--   * anon **唔可以**改 likes 數字、唔可以自己設 hidden、唔可以刪／改留言。
--   * 管理動作（隱藏留言）要喺 Dashboard 用 service role 或者 Table Editor 做。
--
-- 已知限制（要接受）：
--   * 匿名讚好可以重複呼叫 like_app() 刷數 —— 屬「顯示用」嘅社交證明，唔係金錢／投票。
--   * 匿名留言可以用 script 灌水 —— 靠 Supabase 免費 tier 嘅流量限制 + 你手動 hidden。

-- ---------------------------------------------------------------- likes
create table if not exists public.app_likes (
  app_slug text primary key check (app_slug in ('dictalab', 'mathslab', 'reading', 'sentence')),
  count integer not null default 0 check (count >= 0)
);

insert into public.app_likes (app_slug, count)
values ('dictalab', 0), ('mathslab', 0), ('reading', 0), ('sentence', 0)
on conflict (app_slug) do nothing;

alter table public.app_likes enable row level security;

-- 只准讀（數字係公開嘅）
drop policy if exists "likes readable" on public.app_likes;
create policy "likes readable"
  on public.app_likes for select
  using (true);

revoke all on public.app_likes from anon, authenticated;
grant select on public.app_likes to anon, authenticated;

-- 讚好：用 security definer function 做原子加一，唔使畀 anon UPDATE 權
create or replace function public.like_app(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.app_likes
     set count = count + 1
   where app_slug = p_slug
  returning count into n;

  if n is null then
    raise exception 'unknown app_slug: %', p_slug;
  end if;

  return n;
end;
$$;

revoke all on function public.like_app(text) from public;
grant execute on function public.like_app(text) to anon, authenticated;

-- ------------------------------------------------------------- comments
create table if not exists public.app_comments (
  id uuid primary key default gen_random_uuid(),
  app_slug text not null check (app_slug in ('dictalab', 'mathslab', 'reading', 'sentence')),
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now(),
  hidden boolean not null default false
);

create index if not exists app_comments_feed_idx
  on public.app_comments (app_slug, created_at desc)
  where hidden = false;

alter table public.app_comments enable row level security;

-- 讀：只讀未隱藏
drop policy if exists "comments readable" on public.app_comments;
create policy "comments readable"
  on public.app_comments for select
  using (hidden = false);

-- 寫：匿名可以插入，但唔可以自己設 hidden=true，亦受長度／slug 限制
drop policy if exists "comments insertable" on public.app_comments;
create policy "comments insertable"
  on public.app_comments for insert
  with check (
    hidden = false
    and app_slug in ('dictalab', 'mathslab', 'reading', 'sentence')
    and char_length(body) between 1 and 300
  );

revoke all on public.app_comments from anon, authenticated;
grant select, insert on public.app_comments to anon, authenticated;

-- --------------------------------------------------------------- 管理用
-- 隱藏一條留言（喺 SQL Editor 執行，service role）：
--   update public.app_comments set hidden = true where id = '<uuid>';
--
-- 睇最新留言：
--   select created_at, app_slug, body
--     from public.app_comments
--    where hidden = false
--    order by created_at desc
--    limit 50;
