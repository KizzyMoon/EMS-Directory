-- Keep the browser-facing database roles out of the server-only data model.
revoke all on table
  public.ranks,
  public.permissions,
  public.rank_permissions,
  public.members,
  public.discord_accounts,
  public.member_permission_overrides,
  public.audit_logs,
  public.import_jobs,
  public.import_rows,
  public.qualifications,
  public.member_qualifications
from public, anon, authenticated, service_role;

grant select on table
  public.ranks,
  public.permissions,
  public.rank_permissions,
  public.members,
  public.member_permission_overrides,
  public.qualifications,
  public.member_qualifications
to service_role;

grant select, update on table public.discord_accounts to service_role;
grant insert on table public.audit_logs to service_role;

-- This event-trigger helper is for database administration, never the REST API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role;

-- New objects must be explicitly exposed by their owning migration.
alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Cover every foreign key so updates and deletes on parent rows remain efficient.
create index if not exists audit_logs_actor_member_id_idx
  on public.audit_logs(actor_member_id);
create index if not exists discord_accounts_verified_by_idx
  on public.discord_accounts(verified_by);
create index if not exists import_jobs_created_by_idx
  on public.import_jobs(created_by);
create index if not exists import_rows_import_job_id_idx
  on public.import_rows(import_job_id);
create index if not exists member_permission_overrides_created_by_idx
  on public.member_permission_overrides(created_by);
create index if not exists member_permission_overrides_permission_key_idx
  on public.member_permission_overrides(permission_key);
create index if not exists member_qualifications_qualification_key_idx
  on public.member_qualifications(qualification_key);
create index if not exists rank_permissions_permission_key_idx
  on public.rank_permissions(permission_key);
