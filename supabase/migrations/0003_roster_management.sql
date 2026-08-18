alter table public.members
  add column if not exists steam_name text,
  add column if not exists timezone text not null default 'UK';

create table if not exists public.qualifications (
  key text primary key,
  label text not null unique
);

create table if not exists public.member_qualifications (
  member_id uuid not null references public.members(id) on delete cascade,
  qualification_key text not null references public.qualifications(key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, qualification_key)
);

insert into public.qualifications (key, label) values
  ('fto', 'FTO'),
  ('hart', 'HART'),
  ('met', 'MET'),
  ('doctor', 'Doctor')
on conflict (key) do update set label = excluded.label;

alter table public.qualifications enable row level security;
alter table public.member_qualifications enable row level security;

create or replace function public.upsert_roster_member(
  p_member_id uuid,
  p_actor_member_id uuid,
  p_display_name text,
  p_callsign text,
  p_employee_number text,
  p_rank_name text,
  p_steam_name text,
  p_timezone text,
  p_status text,
  p_qualification_keys text[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_rank_id uuid;
begin
  if nullif(trim(p_display_name), '') is null
    or nullif(trim(p_callsign), '') is null
    or nullif(trim(p_employee_number), '') is null then
    raise exception 'Name, callsign and employee number are required';
  end if;

  if p_status not in ('active', 'inactive', 'loa') then
    raise exception 'Invalid roster status';
  end if;

  select id into v_rank_id from public.ranks where name = p_rank_name;
  if v_rank_id is null then
    raise exception 'Rank does not exist: %', p_rank_name;
  end if;

  if p_member_id is null then
    insert into public.members (
      display_name, callsign, employee_number, rank_id, steam_name, timezone, status
    ) values (
      trim(p_display_name), trim(p_callsign), trim(p_employee_number), v_rank_id,
      nullif(trim(coalesce(p_steam_name, '')), ''), trim(p_timezone), p_status
    ) returning id into v_member_id;
  else
    update public.members set
      display_name = trim(p_display_name),
      callsign = trim(p_callsign),
      employee_number = trim(p_employee_number),
      rank_id = v_rank_id,
      steam_name = nullif(trim(coalesce(p_steam_name, '')), ''),
      timezone = trim(p_timezone),
      status = p_status,
      updated_at = now()
    where id = p_member_id and archived_at is null
    returning id into v_member_id;

    if v_member_id is null then
      raise exception 'Roster member not found';
    end if;
  end if;

  delete from public.member_qualifications where member_id = v_member_id;
  insert into public.member_qualifications (member_id, qualification_key)
  select v_member_id, key
  from public.qualifications
  where key = any(coalesce(p_qualification_keys, array[]::text[]));

  insert into public.audit_logs (actor_member_id, action, record_type, record_id, new_value)
  values (
    p_actor_member_id,
    case when p_member_id is null then 'roster.member.created' else 'roster.member.updated' end,
    'member',
    v_member_id::text,
    jsonb_build_object(
      'displayName', trim(p_display_name),
      'callsign', trim(p_callsign),
      'employeeNumber', trim(p_employee_number),
      'rank', p_rank_name,
      'steamName', nullif(trim(coalesce(p_steam_name, '')), ''),
      'timezone', trim(p_timezone),
      'status', p_status,
      'qualifications', coalesce(p_qualification_keys, array[]::text[])
    )
  );

  return v_member_id;
end;
$$;

create or replace function public.archive_roster_member(p_member_id uuid, p_actor_member_id uuid) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.members
  set status = 'former', archived_at = now(), updated_at = now()
  where id = p_member_id and archived_at is null;
  if found then
    insert into public.audit_logs (actor_member_id, action, record_type, record_id)
    values (p_actor_member_id, 'roster.member.archived', 'member', p_member_id::text);
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.upsert_roster_member(uuid,uuid,text,text,text,text,text,text,text,text[]) from public, anon, authenticated;
revoke all on function public.archive_roster_member(uuid,uuid) from public, anon, authenticated;
grant execute on function public.upsert_roster_member(uuid,uuid,text,text,text,text,text,text,text,text[]) to service_role;
grant execute on function public.archive_roster_member(uuid,uuid) to service_role;
