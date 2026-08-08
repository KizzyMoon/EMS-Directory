create extension if not exists pgcrypto;

create table public.ranks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  key text primary key,
  description text not null
);

create table public.rank_permissions (
  rank_id uuid not null references public.ranks(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (rank_id, permission_key)
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  callsign text unique,
  employee_number text unique,
  display_name text not null,
  rank_id uuid references public.ranks(id),
  status text not null default 'active' check (status in ('active', 'inactive', 'loa', 'former', 'applicant', 'cadet')),
  joined_at date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discord_accounts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid unique references public.members(id) on delete set null,
  discord_user_id text unique,
  username text,
  display_name text,
  avatar_url text,
  verified_at timestamptz,
  verified_by uuid references public.members(id),
  verification_note text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discord_user_id_numeric check (discord_user_id is null or discord_user_id ~ '^[0-9]{16,25}$')
);

create table public.member_permission_overrides (
  member_id uuid not null references public.members(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  effect text not null check (effect in ('allow', 'deny')),
  reason text,
  created_at timestamptz not null default now(),
  created_by uuid references public.members(id),
  primary key (member_id, permission_key)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_member_id uuid references public.members(id),
  action text not null,
  record_type text not null,
  record_id text,
  previous_value jsonb,
  new_value jsonb,
  ip_hash text,
  session_id text,
  created_at timestamptz not null default now()
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  status text not null default 'preview' check (status in ('preview', 'committed', 'failed', 'rolled_back')),
  created_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  row_number integer not null,
  source_data jsonb not null,
  mapped_data jsonb,
  status text not null default 'pending' check (status in ('pending', 'valid', 'warning', 'error', 'imported')),
  messages text[] not null default '{}'
);

insert into public.permissions (key, description) values
  ('dashboard.read', 'View authorised dashboard panels'),
  ('roster.read', 'View basic roster information'),
  ('roster.manage', 'Create and edit roster members'),
  ('discord_ids.manage', 'Link and correct roster Discord user IDs'),
  ('cadets.read', 'View authorised cadet information'),
  ('training.read', 'View authorised training records'),
  ('training.manage', 'Create and edit training records'),
  ('probationer_tests.read', 'View authorised probationer tests'),
  ('probationer_tests.manage', 'Create and edit probationer tests'),
  ('documents.read', 'Read published authorised documents'),
  ('documents.manage', 'Draft, edit and publish documents'),
  ('forms.read', 'Read authorised form submissions'),
  ('forms.manage', 'Create and administer forms'),
  ('admin.read', 'View administration area'),
  ('admin.manage', 'Manage system settings and permissions'),
  ('audit_logs.read', 'Read audit logs')
on conflict (key) do nothing;

create index members_status_idx on public.members(status);
create index members_rank_idx on public.members(rank_id);
create index discord_accounts_discord_user_id_idx on public.discord_accounts(discord_user_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_record_idx on public.audit_logs(record_type, record_id);

alter table public.ranks enable row level security;
alter table public.permissions enable row level security;
alter table public.rank_permissions enable row level security;
alter table public.members enable row level security;
alter table public.discord_accounts enable row level security;
alter table public.member_permission_overrides enable row level security;
alter table public.audit_logs enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
