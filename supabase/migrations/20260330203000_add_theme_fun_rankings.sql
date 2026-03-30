create table if not exists public.theme_fun_rankings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  click_count integer not null default 0 check (click_count >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists idx_theme_fun_rankings_click_count on public.theme_fun_rankings (click_count desc, updated_at desc);

alter table public.theme_fun_rankings enable row level security;

drop policy if exists "theme_fun_rankings_select_public" on public.theme_fun_rankings;
create policy "theme_fun_rankings_select_public"
on public.theme_fun_rankings
for select
to public
using (true);

drop policy if exists "theme_fun_rankings_upsert_own_insert" on public.theme_fun_rankings;
create policy "theme_fun_rankings_upsert_own_insert"
on public.theme_fun_rankings
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "theme_fun_rankings_upsert_own_update" on public.theme_fun_rankings;
create policy "theme_fun_rankings_upsert_own_update"
on public.theme_fun_rankings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

notify pgrst, 'reload schema';
