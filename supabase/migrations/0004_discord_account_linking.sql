create or replace function public.link_discord_account(
  p_member_id uuid,
  p_actor_member_id uuid,
  p_discord_user_id text,
  p_verification_note text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_previous_discord_user_id text;
  v_previous_verification_note text;
begin
  if p_discord_user_id is null or p_discord_user_id !~ '^[0-9]{16,25}$' then
    raise exception 'Discord user ID must contain 16 to 25 digits';
  end if;

  if not exists (
    select 1
    from public.members
    where id = p_member_id and archived_at is null
  ) then
    raise exception 'Roster member not found';
  end if;

  if exists (
    select 1
    from public.discord_accounts
    where discord_user_id = p_discord_user_id
      and member_id is distinct from p_member_id
  ) then
    raise exception 'Discord user ID is already linked to another member';
  end if;

  select discord_user_id, verification_note
  into v_previous_discord_user_id, v_previous_verification_note
  from public.discord_accounts
  where member_id = p_member_id;

  insert into public.discord_accounts (
    member_id,
    discord_user_id,
    verified_at,
    verified_by,
    verification_note
  ) values (
    p_member_id,
    p_discord_user_id,
    now(),
    p_actor_member_id,
    nullif(trim(coalesce(p_verification_note, '')), '')
  )
  on conflict (member_id) do update set
    discord_user_id = excluded.discord_user_id,
    username = case
      when discord_accounts.discord_user_id is distinct from excluded.discord_user_id then null
      else discord_accounts.username
    end,
    display_name = case
      when discord_accounts.discord_user_id is distinct from excluded.discord_user_id then null
      else discord_accounts.display_name
    end,
    avatar_url = case
      when discord_accounts.discord_user_id is distinct from excluded.discord_user_id then null
      else discord_accounts.avatar_url
    end,
    last_login_at = case
      when discord_accounts.discord_user_id is distinct from excluded.discord_user_id then null
      else discord_accounts.last_login_at
    end,
    verified_at = excluded.verified_at,
    verified_by = excluded.verified_by,
    verification_note = excluded.verification_note,
    updated_at = now()
  returning id into v_account_id;

  insert into public.audit_logs (
    actor_member_id,
    action,
    record_type,
    record_id,
    previous_value,
    new_value
  ) values (
    p_actor_member_id,
    case
      when v_previous_discord_user_id is null then 'discord_account.linked'
      else 'discord_account.corrected'
    end,
    'discord_account',
    v_account_id::text,
    jsonb_build_object(
      'memberId', p_member_id,
      'discordUserId', v_previous_discord_user_id,
      'verificationNote', v_previous_verification_note
    ),
    jsonb_build_object(
      'memberId', p_member_id,
      'discordUserId', p_discord_user_id,
      'verificationNote', nullif(trim(coalesce(p_verification_note, '')), '')
    )
  );

  return v_account_id;
end;
$$;

revoke all on function public.link_discord_account(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.link_discord_account(uuid,uuid,text,text) to service_role;
