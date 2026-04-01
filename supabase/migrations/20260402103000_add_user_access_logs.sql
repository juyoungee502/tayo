create table if not exists public.user_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  path text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_access_logs_user_id on public.user_access_logs (user_id);
create index if not exists idx_user_access_logs_created_at on public.user_access_logs (created_at desc);

alter table public.user_access_logs enable row level security;

drop policy if exists "user_access_logs_select_admin" on public.user_access_logs;
create policy "user_access_logs_select_admin"
on public.user_access_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create or replace function public.record_user_access(
  p_path text,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  if p_path is null or trim(p_path) = '' then
    return;
  end if;

  if exists (
    select 1
    from public.user_access_logs
    where user_id = v_user_id
      and path = p_path
      and created_at >= now() - interval '3 minutes'
  ) then
    return;
  end if;

  insert into public.user_access_logs (user_id, path, user_agent)
  values (v_user_id, left(trim(p_path), 200), left(nullif(trim(coalesce(p_user_agent, '')), ''), 255));
end;
$$;

grant execute on function public.record_user_access(text, text) to authenticated;

notify pgrst, 'reload schema';
