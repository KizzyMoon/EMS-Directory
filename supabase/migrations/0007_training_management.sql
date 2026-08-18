create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('Day 1', 'Day 2', 'Other Training', 'Probationer Test')),
  title text not null check (length(trim(title)) > 0),
  session_date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  server text not null,
  cadet_capacity integer not null check (cadet_capacity > 0),
  fto_capacity integer not null check (fto_capacity > 0),
  status text not null default 'Open' check (status in ('Draft', 'Open', 'Full', 'Completed', 'Cancelled')),
  notes text not null default '',
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_sessions_time_order check (end_time > start_time)
);

create table public.training_signups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role text not null check (role in ('Cadet', 'FTO', 'Supervisor', 'Observer')),
  status text not null default 'Signed Up' check (status in ('Signed Up', 'Waiting List', 'Withdrawn', 'Attended', 'No Show', 'Cancelled')),
  signed_up_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, member_id)
);

create table public.training_attendance (
  signup_id uuid primary key references public.training_signups(id) on delete cascade,
  status text not null default 'Pending' check (status in ('Pending', 'Attended', 'Late', 'No Show', 'Cancelled', 'Excused')),
  notes text,
  updated_by uuid references public.members(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.training_activity (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  label text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create index training_sessions_date_status_idx on public.training_sessions(session_date, status);
create index training_sessions_created_by_idx on public.training_sessions(created_by);
create index training_signups_member_id_idx on public.training_signups(member_id);
create index training_attendance_updated_by_idx on public.training_attendance(updated_by);
create index training_activity_session_created_idx on public.training_activity(session_id, created_at desc);

alter table public.training_sessions enable row level security;
alter table public.training_signups enable row level security;
alter table public.training_attendance enable row level security;
alter table public.training_activity enable row level security;

revoke all on table public.training_sessions, public.training_signups, public.training_attendance, public.training_activity from public, anon, authenticated, service_role;

grant select, insert, update on table public.training_sessions to service_role;
grant select, insert, update on table public.training_signups to service_role;
grant select, insert, update on table public.training_attendance to service_role;
grant select, insert on table public.training_activity to service_role;
