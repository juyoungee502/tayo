create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 160),
  created_at timestamptz not null default now()
);

create index if not exists idx_guestbook_entries_created_at on public.guestbook_entries (created_at desc);
create index if not exists idx_guestbook_entries_user_id on public.guestbook_entries (user_id);

alter table public.guestbook_entries enable row level security;

drop policy if exists "guestbook_entries_select_public" on public.guestbook_entries;
create policy "guestbook_entries_select_public"
on public.guestbook_entries
for select
to public
using (true);

drop policy if exists "guestbook_entries_insert_own" on public.guestbook_entries;
create policy "guestbook_entries_insert_own"
on public.guestbook_entries
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "guestbook_entries_delete_admin" on public.guestbook_entries;
create policy "guestbook_entries_delete_admin"
on public.guestbook_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

notify pgrst, 'reload schema';
