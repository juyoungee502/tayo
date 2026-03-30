create table if not exists public.party_member_notes (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.taxi_parties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text not null check (char_length(trim(note)) between 1 and 80),
  updated_at timestamptz not null default now(),
  unique (party_id, user_id)
);

create table if not exists public.guestbook_entry_likes (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.guestbook_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (entry_id, user_id)
);

create index if not exists idx_party_member_notes_party_id on public.party_member_notes (party_id);
create index if not exists idx_party_member_notes_user_id on public.party_member_notes (user_id);
create index if not exists idx_guestbook_entry_likes_entry_id on public.guestbook_entry_likes (entry_id);
create index if not exists idx_guestbook_entry_likes_user_id on public.guestbook_entry_likes (user_id);

alter table public.party_member_notes enable row level security;
alter table public.guestbook_entry_likes enable row level security;

drop policy if exists "party_member_notes_select_authenticated" on public.party_member_notes;
create policy "party_member_notes_select_authenticated"
on public.party_member_notes
for select
to authenticated
using (true);

drop policy if exists "party_member_notes_upsert_own" on public.party_member_notes;
create policy "party_member_notes_upsert_own"
on public.party_member_notes
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "party_member_notes_update_own" on public.party_member_notes;
create policy "party_member_notes_update_own"
on public.party_member_notes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "guestbook_entry_likes_select_public" on public.guestbook_entry_likes;
create policy "guestbook_entry_likes_select_public"
on public.guestbook_entry_likes
for select
to public
using (true);

drop policy if exists "guestbook_entry_likes_insert_own" on public.guestbook_entry_likes;
create policy "guestbook_entry_likes_insert_own"
on public.guestbook_entry_likes
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "guestbook_entry_likes_delete_own" on public.guestbook_entry_likes;
create policy "guestbook_entry_likes_delete_own"
on public.guestbook_entry_likes
for delete
to authenticated
using (user_id = auth.uid());

notify pgrst, 'reload schema';
