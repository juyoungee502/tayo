create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.party_status as enum ('recruiting', 'full', 'completed', 'cancelled', 'expired');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.member_status as enum ('joined', 'left', 'removed', 'completed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_reason as enum ('late', 'no_show', 'unsafe_behavior', 'rude_behavior', 'other');
exception
  when duplicate_object then null;
end $$;

create or replace function public.is_allowed_login_email(p_email text)
returns boolean
language sql
immutable
returns null on null input
as $$
  select lower(trim(p_email)) like any (
    array[
      '%@catholic.ac.kr',
      '%@korea.ac.kr',
      '%@gmail.com'
    ]
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nickname text not null,
  school text not null default '가톨릭대학교 성심교정',
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_domain_check check (public.is_allowed_login_email(email))
);

create table if not exists public.taxi_parties (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  school text not null default '가톨릭대학교 성심교정',
  departure_place_name text not null,
  departure_detail text,
  departure_lat double precision,
  departure_lng double precision,
  destination_name text not null default '가톨릭대학교 성심교정',
  destination_lat double precision,
  destination_lng double precision,
  scheduled_at timestamptz not null,
  capacity integer not null check (capacity between 2 and 4),
  note text,
  status public.party_status not null default 'recruiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.party_members (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.taxi_parties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.member_status not null default 'joined',
  joined_at timestamptz not null default now(),
  unique (party_id, user_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.taxi_parties(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  punctuality_rating integer not null check (punctuality_rating between 1 and 5),
  comfort_rating integer not null check (comfort_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (party_id, reviewer_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.taxi_parties(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason public.report_reason not null,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  note text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_taxi_parties_scheduled_at on public.taxi_parties (scheduled_at);
create index if not exists idx_taxi_parties_status on public.taxi_parties (status);
create index if not exists idx_party_members_party_id on public.party_members (party_id);
create index if not exists idx_party_members_user_id on public.party_members (user_id);
create index if not exists idx_reports_reported_user_id on public.reports (reported_user_id);
create unique index if not exists uniq_one_active_party_per_user on public.party_members (user_id) where status = 'joined';

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

drop trigger if exists trg_taxi_parties_updated_at on public.taxi_parties;
create trigger trg_taxi_parties_updated_at
before update on public.taxi_parties
for each row execute function public.handle_updated_at();

create or replace function public.complete_due_parties()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.taxi_parties
  set status = 'completed'
  where status in ('recruiting', 'full')
    and scheduled_at <= now();

  update public.party_members pm
  set status = 'completed'
  where status = 'joined'
    and exists (
      select 1
      from public.taxi_parties tp
      where tp.id = pm.party_id
        and tp.status = 'completed'
    );
end;
$$;

create or replace function public.sync_party_status(p_party_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_scheduled_at timestamptz;
  v_status public.party_status;
  v_joined_count integer;
begin
  select capacity, scheduled_at, status
  into v_capacity, v_scheduled_at, v_status
  from public.taxi_parties
  where id = p_party_id;

  if not found or v_status = 'cancelled' then
    return;
  end if;

  if v_scheduled_at <= now() then
    update public.taxi_parties
    set status = 'completed'
    where id = p_party_id;

    update public.party_members
    set status = 'completed'
    where party_id = p_party_id
      and status = 'joined';

    return;
  end if;

  select count(*)
  into v_joined_count
  from public.party_members
  where party_id = p_party_id
    and status = 'joined';

  update public.taxi_parties
  set status = case
    when v_joined_count >= v_capacity then 'full'::public.party_status
    else 'recruiting'::public.party_status
  end
  where id = p_party_id;
end;
$$;

drop function if exists public.create_taxi_party(text, text, double precision, double precision, text, double precision, double precision, timestamptz, integer, text);

create or replace function public.create_taxi_party(
  p_departure_place_name text,
  p_departure_detail text,
  p_departure_lat double precision,
  p_departure_lng double precision,
  p_destination_name text,
  p_destination_lat double precision,
  p_destination_lng double precision,
  p_scheduled_at timestamptz,
  p_capacity integer,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_party_id uuid;
begin
  perform public.complete_due_parties();

  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select email into v_email
  from public.profiles
  where id = v_user_id;

  if v_email is null or not public.is_allowed_login_email(v_email) then
    raise exception '허용된 이메일 도메인 사용자만 파티를 만들 수 있습니다. (@catholic.ac.kr, @korea.ac.kr, @gmail.com)';
  end if;

  if p_capacity < 2 or p_capacity > 4 then
    raise exception '정원은 2명에서 4명 사이여야 합니다.';
  end if;

  if p_scheduled_at <= now() then
    raise exception '이미 지난 시간으로는 파티를 만들 수 없습니다.';
  end if;

  if exists (
    select 1
    from public.party_members pm
    join public.taxi_parties tp on tp.id = pm.party_id
    where pm.user_id = v_user_id
      and pm.status = 'joined'
      and tp.status in ('recruiting', 'full')
      and tp.scheduled_at > now()
  ) then
    raise exception '이미 참여 중인 활성 택시팟이 있습니다.';
  end if;

  insert into public.taxi_parties (
    creator_id,
    departure_place_name,
    departure_detail,
    departure_lat,
    departure_lng,
    destination_name,
    destination_lat,
    destination_lng,
    scheduled_at,
    capacity,
    note
  ) values (
    v_user_id,
    p_departure_place_name,
    nullif(trim(p_departure_detail), ''),
    p_departure_lat,
    p_departure_lng,
    p_destination_name,
    p_destination_lat,
    p_destination_lng,
    p_scheduled_at,
    p_capacity,
    nullif(trim(p_note), '')
  )
  returning id into v_party_id;

  insert into public.party_members (party_id, user_id, status)
  values (v_party_id, v_user_id, 'joined');

  perform public.sync_party_status(v_party_id);

  return v_party_id;
end;
$$;

create or replace function public.join_taxi_party(p_party_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_party public.taxi_parties%rowtype;
begin
  perform public.complete_due_parties();

  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into v_party
  from public.taxi_parties
  where id = p_party_id;

  if not found then
    raise exception '존재하지 않는 택시팟입니다.';
  end if;

  if v_party.status not in ('recruiting', 'full') or v_party.scheduled_at <= now() then
    raise exception '이미 참여할 수 없는 택시팟입니다.';
  end if;

  if exists (
    select 1
    from public.party_members
    where party_id = p_party_id
      and user_id = v_user_id
      and status = 'joined'
  ) then
    raise exception '이미 이 택시팟에 참여 중입니다.';
  end if;

  if exists (
    select 1
    from public.party_members pm
    join public.taxi_parties tp on tp.id = pm.party_id
    where pm.user_id = v_user_id
      and pm.status = 'joined'
      and tp.status in ('recruiting', 'full')
      and tp.scheduled_at > now()
  ) then
    raise exception '이미 다른 활성 택시팟에 참여 중입니다.';
  end if;

  if (
    select count(*)
    from public.party_members
    where party_id = p_party_id
      and status = 'joined'
  ) >= v_party.capacity then
    raise exception '이미 정원이 가득 찼습니다.';
  end if;

  insert into public.party_members (party_id, user_id, status)
  values (p_party_id, v_user_id, 'joined');

  perform public.sync_party_status(p_party_id);
end;
$$;

create or replace function public.leave_taxi_party(p_party_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_creator_id uuid;
begin
  perform public.complete_due_parties();

  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select creator_id
  into v_creator_id
  from public.taxi_parties
  where id = p_party_id;

  if v_creator_id = v_user_id then
    raise exception '작성자는 파티 취소 버튼을 사용해주세요.';
  end if;

  update public.party_members
  set status = 'left'
  where party_id = p_party_id
    and user_id = v_user_id
    and status = 'joined';

  if not found then
    raise exception '참여 중인 멤버가 아닙니다.';
  end if;

  perform public.sync_party_status(p_party_id);
end;
$$;

create or replace function public.cancel_taxi_party(p_party_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  update public.taxi_parties
  set status = 'cancelled'
  where id = p_party_id
    and creator_id = v_user_id;

  if not found then
    raise exception '작성자만 파티를 취소할 수 있습니다.';
  end if;

  update public.party_members
  set status = case
    when user_id = v_user_id then 'left'::public.member_status
    else 'removed'::public.member_status
  end
  where party_id = p_party_id
    and status = 'joined';
end;
$$;

create or replace function public.submit_feedback(
  p_party_id uuid,
  p_punctuality_rating integer,
  p_comfort_rating integer,
  p_comment text default null,
  p_reports jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_review_id uuid;
  v_item record;
begin
  perform public.complete_due_parties();

  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not exists (
    select 1
    from public.party_members
    where party_id = p_party_id
      and user_id = v_user_id
      and status in ('joined', 'completed')
  ) then
    raise exception '참여한 사용자만 후기를 남길 수 있습니다.';
  end if;

  if not exists (
    select 1
    from public.taxi_parties
    where id = p_party_id
      and scheduled_at <= now() - interval '1 hour'
  ) then
    raise exception '피드백 가능 시간이 아직 아닙니다.';
  end if;

  insert into public.reviews (
    party_id,
    reviewer_id,
    punctuality_rating,
    comfort_rating,
    comment
  ) values (
    p_party_id,
    v_user_id,
    p_punctuality_rating,
    p_comfort_rating,
    nullif(trim(p_comment), '')
  )
  returning id into v_review_id;

  for v_item in
    select *
    from jsonb_to_recordset(coalesce(p_reports, '[]'::jsonb))
      as x(reported_user_id uuid, reason public.report_reason, detail text)
  loop
    if v_item.reported_user_id = v_user_id then
      continue;
    end if;

    if exists (
      select 1
      from public.party_members
      where party_id = p_party_id
        and user_id = v_item.reported_user_id
    ) then
      insert into public.reports (
        party_id,
        reporter_id,
        reported_user_id,
        reason,
        detail
      ) values (
        p_party_id,
        v_user_id,
        v_item.reported_user_id,
        v_item.reason,
        nullif(trim(v_item.detail), '')
      );
    end if;
  end loop;

  return v_review_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.taxi_parties enable row level security;
alter table public.party_members enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.account_deletion_requests enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and public.is_allowed_login_email(email)
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "taxi_parties_select_authenticated" on public.taxi_parties;
create policy "taxi_parties_select_authenticated"
on public.taxi_parties
for select
to authenticated
using (true);

drop policy if exists "taxi_parties_update_creator_or_admin" on public.taxi_parties;
create policy "taxi_parties_update_creator_or_admin"
on public.taxi_parties
for update
to authenticated
using (
  creator_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "party_members_select_authenticated" on public.party_members;
create policy "party_members_select_authenticated"
on public.party_members
for select
to authenticated
using (true);

drop policy if exists "reviews_select_self_or_admin" on public.reviews;
create policy "reviews_select_self_or_admin"
on public.reviews
for select
to authenticated
using (
  reviewer_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "reports_select_reporter_or_admin" on public.reports;
create policy "reports_select_reporter_or_admin"
on public.reports
for select
to authenticated
using (
  reporter_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "account_deletion_requests_select_own_or_admin" on public.account_deletion_requests;
create policy "account_deletion_requests_select_own_or_admin"
on public.account_deletion_requests
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "account_deletion_requests_insert_own" on public.account_deletion_requests;
create policy "account_deletion_requests_insert_own"
on public.account_deletion_requests
for insert
to authenticated
with check (user_id = auth.uid());

grant execute on function public.is_allowed_login_email(text) to authenticated;
grant execute on function public.complete_due_parties() to authenticated;
grant execute on function public.sync_party_status(uuid) to authenticated;
grant execute on function public.create_taxi_party(text, text, double precision, double precision, text, double precision, double precision, timestamptz, integer, text) to authenticated;
grant execute on function public.join_taxi_party(uuid) to authenticated;
grant execute on function public.leave_taxi_party(uuid) to authenticated;
grant execute on function public.cancel_taxi_party(uuid) to authenticated;
grant execute on function public.submit_feedback(uuid, integer, integer, text, jsonb) to authenticated;

notify pgrst, 'reload schema';







