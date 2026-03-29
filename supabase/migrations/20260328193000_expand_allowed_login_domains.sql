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

alter table public.profiles
  drop constraint if exists profiles_email_domain_check;

alter table public.profiles
  add constraint profiles_email_domain_check check (public.is_allowed_login_email(email));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and public.is_allowed_login_email(email)
);

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

grant execute on function public.is_allowed_login_email(text) to authenticated;
grant execute on function public.create_taxi_party(text, text, double precision, double precision, text, double precision, double precision, timestamptz, integer, text) to authenticated;

notify pgrst, 'reload schema';
