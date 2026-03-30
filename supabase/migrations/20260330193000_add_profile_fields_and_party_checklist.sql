alter table public.profiles
  add column if not exists department text,
  add column if not exists student_number text,
  add column if not exists profile_message text;

alter table public.taxi_parties
  add column if not exists taxi_called boolean not null default false,
  add column if not exists everyone_ready boolean not null default false;

notify pgrst, 'reload schema';
