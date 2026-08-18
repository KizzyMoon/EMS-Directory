create table public.ride_alongs (
  id uuid primary key default gen_random_uuid(),
  fto_id uuid not null references public.members(id) on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz,
  status text not null default 'In Progress' check (status in ('In Progress', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ride_alongs_end_after_start check (ended_at is null or ended_at >= started_at)
);

create table public.ride_along_cadets (
  id uuid primary key default gen_random_uuid(),
  ride_along_id uuid not null references public.ride_alongs(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete restrict,
  unique (ride_along_id, member_id)
);

create table public.ride_along_calls (
  id uuid primary key default gen_random_uuid(),
  ride_along_id uuid not null references public.ride_alongs(id) on delete cascade,
  call_code text not null check (length(trim(call_code)) between 1 and 30),
  created_at timestamptz not null default now()
);

create table public.ride_along_feedback (
  id uuid primary key default gen_random_uuid(),
  ride_along_cadet_id uuid not null unique references public.ride_along_cadets(id) on delete cascade,
  strengths text not null default '',
  areas_to_improve text not null default '',
  current_focus text not null default '',
  general_feedback text not null default '',
  concerns text not null default '',
  internal_notes text not null default '',
  recommended_next_step text not null default 'Continue Ride Alongs' check (
    recommended_next_step in ('Continue Ride Alongs', 'Ready for Day 2', 'Needs Specific Training', 'Command Review Required')
  ),
  status text not null default 'Not Started' check (status in ('Not Started', 'Draft', 'Submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ride_alongs_fto_started_idx on public.ride_alongs(fto_id, started_at desc);
create index ride_alongs_status_started_idx on public.ride_alongs(status, started_at desc);
create index ride_along_cadets_member_idx on public.ride_along_cadets(member_id);
create index ride_along_calls_ride_idx on public.ride_along_calls(ride_along_id, created_at);

alter table public.ride_alongs enable row level security;
alter table public.ride_along_cadets enable row level security;
alter table public.ride_along_calls enable row level security;
alter table public.ride_along_feedback enable row level security;

revoke all on table public.ride_alongs, public.ride_along_cadets, public.ride_along_calls, public.ride_along_feedback from public, anon, authenticated, service_role;

grant select, insert, update on table public.ride_alongs to service_role;
grant select, insert on table public.ride_along_cadets to service_role;
grant select, insert on table public.ride_along_calls to service_role;
grant select, insert, update on table public.ride_along_feedback to service_role;
