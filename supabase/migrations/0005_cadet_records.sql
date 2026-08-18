create table if not exists public.cadet_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.members(id) on delete cascade,
  start_date date,
  deadline date,
  stage text not null default 'Awaiting Day 1' check (
    stage in (
      'Awaiting Day 1',
      'Day 1 Signed Up',
      'Available for Ride Alongs',
      'Ready for Day 2',
      'Day 2 Booked'
    )
  ),
  day_one_complete boolean not null default false,
  day_one_session_id text,
  day_two_session_id text,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cadet_records_deadline_after_start check (
    deadline is null or start_date is null or deadline >= start_date
  )
);

create index if not exists cadet_records_stage_idx on public.cadet_records(stage);

alter table public.cadet_records enable row level security;

revoke all on table public.cadet_records from public, anon, authenticated;
revoke all on table public.cadet_records from service_role;
grant select on table public.cadet_records to service_role;
