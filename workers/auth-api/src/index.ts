interface Env {
  FRONTEND_ORIGIN: string;
  FRONTEND_PATH: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  SESSION_SECRET: string;
}

interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
}

interface DatabaseMember {
  id: string;
  display_name: string;
  callsign?: string;
  status: string;
  rank_id?: string | null;
  ranks?: {
    name: string;
    rank_permissions: Array<{ permission_key: string }>;
  };
  member_permission_overrides?: Array<{ permission_key: string; effect: 'allow' | 'deny' }>;
}

type DatabaseRosterStatus = 'active' | 'inactive' | 'loa';
type QualificationKey = 'fto' | 'hart' | 'met' | 'doctor';

interface DatabaseRosterMember {
  id: string;
  display_name: string;
  callsign: string | null;
  employee_number: string | null;
  steam_name: string | null;
  timezone: string;
  status: string;
  ranks: { name: string } | Array<{ name: string }> | null;
  discord_accounts: Array<{
    discord_user_id: string | null;
    username: string | null;
    display_name: string | null;
  }>;
  member_qualifications: Array<{ qualification_key: string }>;
}

interface RosterMemberInput {
  name: string;
  callsign: string;
  employeeNumber: string;
  rank: string;
  steamName: string;
  timezone: string;
  status: 'Active' | 'Inactive' | 'LOA';
  qualifications: Record<QualificationKey, boolean>;
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
};

function corsHeaders(env: Env) {
  return {
    'access-control-allow-origin': env.FRONTEND_ORIGIN,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'Origin',
  };
}

function redirectUri(env: Env) {
  return `${new URL(env.FRONTEND_ORIGIN).origin.replace(/\/$/, '')}${env.FRONTEND_PATH}`.replace(/\/$/, '');
}

function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None`;
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function createSession(memberId: string, discordUserId: string, env: Env) {
  const payload = btoa(JSON.stringify({ memberId, discordUserId, exp: Date.now() + 1000 * 60 * 60 * 8 }));
  return `${payload}.${await sign(payload, env.SESSION_SECRET)}`;
}

async function readSession(request: Request, env: Env) {
  const match = request.headers.get('cookie')?.match(/ems_session=([^;]+)/);
  if (!match) return null;
  const [payload, signature] = match[1].split('.');
  if (!payload || !signature || signature !== await sign(payload, env.SESSION_SECRET)) return null;
  const parsed = JSON.parse(atob(payload)) as { memberId: string; discordUserId: string; exp: number };
  return parsed.exp > Date.now() ? parsed : null;
}

async function supabase(env: Env, path: string, init?: RequestInit) {
  const authHeaders = env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')
    ? {}
    : { authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };

  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      ...authHeaders,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...init?.headers,
    },
  });
}

async function readMember(memberId: string, env: Env) {
  const memberResponse = await supabase(
    env,
    `members?id=eq.${encodeURIComponent(memberId)}&select=id,display_name,callsign,status,rank_id`,
  );
  if (!memberResponse.ok) throw new Error(`Supabase member lookup failed: ${memberResponse.status}`);
  const [member] = await memberResponse.json() as DatabaseMember[];
  if (!member || member.status !== 'active') return null;

  if (!member.rank_id) {
    return { ...member, ranks: { name: 'EMS', rank_permissions: [] } };
  }

  const [rankResponse, permissionsResponse] = await Promise.all([
    supabase(env, `ranks?id=eq.${encodeURIComponent(member.rank_id)}&select=name`),
    supabase(env, `rank_permissions?rank_id=eq.${encodeURIComponent(member.rank_id)}&select=permission_key`),
  ]);
  if (!rankResponse.ok) throw new Error(`Supabase rank lookup failed: ${rankResponse.status}`);
  if (!permissionsResponse.ok) throw new Error(`Supabase permission lookup failed: ${permissionsResponse.status}`);

  const [rank] = await rankResponse.json() as Array<{ name: string }>;
  const rankPermissions = await permissionsResponse.json() as Array<{ permission_key: string }>;
  const overridesResponse = await supabase(
    env,
    `member_permission_overrides?member_id=eq.${encodeURIComponent(member.id)}&select=permission_key,effect`,
  );
  if (!overridesResponse.ok) throw new Error(`Supabase member permission override lookup failed: ${overridesResponse.status}`);
  const memberPermissionOverrides = await overridesResponse.json() as Array<{ permission_key: string; effect: 'allow' | 'deny' }>;
  return {
    ...member,
    ranks: {
      name: rank?.name ?? 'EMS',
      rank_permissions: rankPermissions,
    },
    member_permission_overrides: memberPermissionOverrides,
  };
}

async function findMemberByDiscordId(discordUserId: string, env: Env) {
  const accountResponse = await supabase(
    env,
    `discord_accounts?discord_user_id=eq.${encodeURIComponent(discordUserId)}&select=member_id`,
  );
  if (!accountResponse.ok) throw new Error(`Supabase Discord lookup failed: ${accountResponse.status}`);
  const [account] = await accountResponse.json() as Array<{ member_id: string | null }>;
  if (!account?.member_id) return null;
  return readMember(account.member_id, env);
}

function resolvePermissions(member: DatabaseMember) {
  const denied = new Set(
    member.member_permission_overrides
      ?.filter((item) => item.effect === 'deny')
      .map((item) => item.permission_key) ?? [],
  );
  const allowed = new Set(
    member.ranks?.rank_permissions
      ?.map((item) => item.permission_key)
      .filter((permission) => !denied.has(permission)) ?? [],
  );
  member.member_permission_overrides
    ?.filter((item) => item.effect === 'allow')
    .forEach((item) => allowed.add(item.permission_key));
  return [...allowed];
}

function apiJson(env: Env, body: object, status = 200) {
  return Response.json(body, { status, headers: { ...jsonHeaders, ...corsHeaders(env) } });
}

async function requirePermission(request: Request, env: Env, permission: string) {
  const session = await readSession(request, env);
  if (!session) return { error: apiJson(env, { error: 'Not signed in' }, 401) };
  const member = await readMember(session.memberId, env);
  if (!member) return { error: apiJson(env, { error: 'Your EMS account is not active' }, 401) };
  if (!resolvePermissions(member).includes(permission)) {
    return { error: apiJson(env, { error: 'You do not have permission to perform this action' }, 403) };
  }
  return { member };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`);
  return value.trim();
}

async function readRosterInput(request: Request): Promise<RosterMemberInput> {
  const body: unknown = await request.json();
  if (!isRecord(body) || !isRecord(body.qualifications)) throw new Error('Invalid roster member data');
  const status = body.status;
  if (status !== 'Active' && status !== 'Inactive' && status !== 'LOA') throw new Error('Invalid member status');
  const qualificationKeys: QualificationKey[] = ['fto', 'hart', 'met', 'doctor'];
  const qualifications = Object.fromEntries(
    qualificationKeys.map((key) => [key, body.qualifications[key] === true]),
  ) as Record<QualificationKey, boolean>;
  return {
    name: requiredString(body.name, 'Name'),
    callsign: requiredString(body.callsign, 'Callsign'),
    employeeNumber: requiredString(body.employeeNumber, 'Employee number'),
    rank: requiredString(body.rank, 'Rank'),
    steamName: typeof body.steamName === 'string' ? body.steamName.trim() : '',
    timezone: requiredString(body.timezone, 'Timezone'),
    status,
    qualifications,
  };
}

function databaseStatus(status: RosterMemberInput['status']): DatabaseRosterStatus {
  if (status === 'LOA') return 'loa';
  return status === 'Active' ? 'active' : 'inactive';
}

function frontendStatus(status: string): RosterMemberInput['status'] {
  if (status === 'loa') return 'LOA';
  return status === 'active' ? 'Active' : 'Inactive';
}

function mapRosterMember(member: DatabaseRosterMember) {
  const account = member.discord_accounts?.[0];
  const rank = Array.isArray(member.ranks) ? member.ranks[0]?.name : member.ranks?.name;
  const qualificationKeys = new Set(member.member_qualifications?.map((item) => item.qualification_key) ?? []);
  return {
    id: member.id,
    rank: rank ?? 'Cadet',
    callsign: member.callsign ?? '',
    name: member.display_name,
    employeeNumber: member.employee_number ?? '',
    steamName: member.steam_name ?? '',
    discordName: account?.display_name ?? account?.username ?? 'Not linked',
    discordUserId: account?.discord_user_id ?? null,
    timezone: member.timezone || 'Unknown',
    status: frontendStatus(member.status),
    qualifications: {
      fto: qualificationKeys.has('fto'),
      hart: qualificationKeys.has('hart'),
      met: qualificationKeys.has('met'),
      doctor: qualificationKeys.has('doctor'),
    },
  };
}

const rosterSelect = 'id,display_name,callsign,employee_number,steam_name,timezone,status,ranks(name),discord_accounts(discord_user_id,username,display_name),member_qualifications(qualification_key)';

async function readRoster(env: Env, memberId?: string) {
  const filter = memberId ? `&id=eq.${encodeURIComponent(memberId)}` : '';
  const response = await supabase(
    env,
    `members?select=${rosterSelect}&archived_at=is.null${filter}&order=callsign.asc`,
  );
  if (!response.ok) throw new Error(`Supabase roster lookup failed: ${response.status}`);
  return (await response.json() as DatabaseRosterMember[]).map(mapRosterMember);
}

async function handleRosterApi(request: Request, env: Env, memberId?: string) {
  const permission = request.method === 'GET' ? 'roster.read' : 'roster.manage';
  const auth = await requirePermission(request, env, permission);
  if ('error' in auth) return auth.error;

  try {
    if (request.method === 'GET') {
      const members = await readRoster(env, memberId);
      if (memberId && !members[0]) return apiJson(env, { error: 'Roster member not found' }, 404);
      return apiJson(env, memberId ? { member: members[0] } : { members });
    }

    if (request.method === 'POST' || request.method === 'PATCH') {
      const input = await readRosterInput(request);
      const qualificationKeys = (Object.entries(input.qualifications) as Array<[QualificationKey, boolean]>)
        .filter(([, selected]) => selected)
        .map(([key]) => key);
      const rpcResponse = await supabase(env, 'rpc/upsert_roster_member', {
        method: 'POST',
        body: JSON.stringify({
          p_member_id: memberId ?? null,
          p_actor_member_id: auth.member.id,
          p_display_name: input.name,
          p_callsign: input.callsign,
          p_employee_number: input.employeeNumber,
          p_rank_name: input.rank,
          p_steam_name: input.steamName,
          p_timezone: input.timezone,
          p_status: databaseStatus(input.status),
          p_qualification_keys: qualificationKeys,
        }),
      });
      if (!rpcResponse.ok) {
        const details = await rpcResponse.json().catch(() => null) as { message?: string } | null;
        const message = details?.message?.includes('duplicate key')
          ? 'That callsign or employee number is already in use'
          : details?.message ?? 'Unable to save roster member';
        return apiJson(env, { error: message }, 400);
      }
      const savedMemberId = await rpcResponse.json() as string;
      const [savedMember] = await readRoster(env, savedMemberId);
      return apiJson(env, { member: savedMember }, memberId ? 200 : 201);
    }

    if (request.method === 'DELETE' && memberId) {
      const rpcResponse = await supabase(env, 'rpc/archive_roster_member', {
        method: 'POST',
        body: JSON.stringify({ p_member_id: memberId, p_actor_member_id: auth.member.id }),
      });
      if (!rpcResponse.ok) throw new Error(`Supabase roster archive failed: ${rpcResponse.status}`);
      const archived = await rpcResponse.json() as boolean;
      if (!archived) return apiJson(env, { error: 'Roster member not found' }, 404);
      return apiJson(env, { ok: true });
    }

    return apiJson(env, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Roster API request failed',
      method: request.method,
      memberId: memberId ?? null,
      error: error instanceof Error ? error.message : String(error),
    }));
    const message = error instanceof Error && !error.message.startsWith('Supabase')
      ? error.message
      : 'Unable to complete the roster request';
    return apiJson(env, { error: message }, 500);
  }
}

async function handleDiscordStart(request: Request, env: Env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || `${env.FRONTEND_ORIGIN}${env.FRONTEND_PATH}#/`;
  const state = btoa(JSON.stringify({ returnTo, nonce: crypto.randomUUID() }));
  const discordUrl = new URL('https://discord.com/oauth2/authorize');
  discordUrl.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
  discordUrl.searchParams.set('redirect_uri', `${new URL(request.url).origin}/auth/discord/callback`);
  discordUrl.searchParams.set('response_type', 'code');
  discordUrl.searchParams.set('scope', 'identify');
  discordUrl.searchParams.set('state', state);
  return Response.redirect(discordUrl.toString(), 302);
}

async function handleDiscordCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const fallback = `${env.FRONTEND_ORIGIN}${env.FRONTEND_PATH}#/access-denied`;
  if (!code || !state) return Response.redirect(fallback, 302);

  const { returnTo } = JSON.parse(atob(state)) as { returnTo: string };
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${url.origin}/auth/discord/callback`,
    }),
  });
  if (!tokenResponse.ok) return Response.redirect(fallback, 302);
  const token = await tokenResponse.json() as { access_token: string };
  const discordResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  const discordUser = await discordResponse.json() as DiscordUser;
  let member: DatabaseMember | null = null;
  try {
    member = await findMemberByDiscordId(discordUser.id, env);
  } catch {
    const deniedUrl = new URL(fallback);
    deniedUrl.hash = `/access-denied?discordUserId=${encodeURIComponent(discordUser.id)}&username=${encodeURIComponent(discordUser.username)}&reason=lookup`;
    return Response.redirect(deniedUrl.toString(), 302);
  }
  if (!member) {
    const deniedUrl = new URL(fallback);
    deniedUrl.hash = `/access-denied?discordUserId=${encodeURIComponent(discordUser.id)}&username=${encodeURIComponent(discordUser.username)}`;
    return Response.redirect(deniedUrl.toString(), 302);
  }

  await supabase(env, `discord_accounts?discord_user_id=eq.${discordUser.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      username: discordUser.username,
      display_name: discordUser.global_name ?? discordUser.username,
      avatar_url: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null,
      last_login_at: new Date().toISOString(),
    }),
  });

  const session = await createSession(member.id, discordUser.id, env);
  return new Response(null, {
    status: 302,
    headers: {
      location: returnTo,
      'set-cookie': cookie('ems_session', session, 60 * 60 * 8),
    },
  });
}

async function handleSession(request: Request, env: Env) {
  const session = await readSession(request, env);
  if (!session) return Response.json({ user: null }, { headers: { ...jsonHeaders, ...corsHeaders(env) } });
  const member = await readMember(session.memberId, env);
  if (!member) {
    return Response.json({ user: null, unauthorised: true }, { headers: { ...jsonHeaders, ...corsHeaders(env) } });
  }
  const permissions = resolvePermissions(member);
  return Response.json({
    user: {
      id: member.id,
      displayName: member.display_name,
      callsign: member.callsign,
      rank: member.ranks?.name ?? 'EMS',
      discordLinked: true,
      permissions,
    },
  }, { headers: { ...jsonHeaders, ...corsHeaders(env) } });
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(env) });
    const url = new URL(request.url);
    if (url.pathname === '/auth/discord/start') return handleDiscordStart(request, env);
    if (url.pathname === '/auth/discord/callback') return handleDiscordCallback(request, env);
    if (url.pathname === '/auth/session') return handleSession(request, env);
    if (url.pathname === '/auth/logout') {
      return Response.json({ ok: true }, {
        headers: { ...jsonHeaders, ...corsHeaders(env), 'set-cookie': cookie('ems_session', '', 0) },
      });
    }
    const rosterMatch = url.pathname.match(/^\/api\/roster(?:\/([^/]+))?$/);
    if (rosterMatch) return handleRosterApi(request, env, rosterMatch[1] ? decodeURIComponent(rosterMatch[1]) : undefined);
    return Response.json({ error: 'Not found' }, { status: 404, headers: { ...jsonHeaders, ...corsHeaders(env) } });
  },
};
