import { readGoogleRoster, readGoogleTrainingBookings, readGoogleTrainingSessions, type GoogleRosterMember } from './googleSheets';

interface Env {
  FRONTEND_ORIGIN: string;
  FRONTEND_PATH: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  GOOGLE_ROSTER_CSV_URL?: string;
  GOOGLE_TRAINING_CSV_URL?: string;
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

interface DatabaseCadetMember {
  id: string;
  display_name: string;
  callsign: string | null;
  employee_number: string | null;
  joined_at: string | null;
  ranks: { name: string } | Array<{ name: string }> | null;
  cadet_records: Array<{
    start_date: string | null;
    deadline: string | null;
    stage: string;
    day_one_complete: boolean;
    day_one_session_id: string | null;
    day_two_session_id: string | null;
    next_step: string | null;
  }>;
}

interface DatabaseTrainingSession {
  id: string;
  type: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  server: string;
  cadet_capacity: number;
  fto_capacity: number;
  status: string;
  notes: string;
  created_by_member: { display_name: string } | Array<{ display_name: string }> | null;
  training_signups: Array<{
    id: string;
    member_id: string;
    role: string;
    status: string;
    signed_up_at: string;
    member: { display_name: string; callsign: string | null } | Array<{ display_name: string; callsign: string | null }> | null;
    training_attendance: { status: string; notes: string | null } | Array<{ status: string; notes: string | null }> | null;
  }>;
  training_activity: Array<{
    id: string;
    label: string;
    detail: string;
    created_at: string;
  }>;
}

interface DatabaseRideAlong {
  id: string;
  fto_id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  created_at: string;
  fto: { display_name: string; callsign: string | null } | Array<{ display_name: string; callsign: string | null }> | null;
  ride_along_cadets: Array<{
    id: string;
    member_id: string;
    member: { display_name: string; callsign: string | null; employee_number: string | null } | Array<{ display_name: string; callsign: string | null; employee_number: string | null }> | null;
    ride_along_feedback: {
      id: string;
      strengths: string;
      areas_to_improve: string;
      current_focus: string;
      general_feedback: string;
      concerns: string;
      internal_notes: string;
      recommended_next_step: string;
      status: string;
      submitted_at: string | null;
    } | Array<{
      id: string;
      strengths: string;
      areas_to_improve: string;
      current_focus: string;
      general_feedback: string;
      concerns: string;
      internal_notes: string;
      recommended_next_step: string;
      status: string;
      submitted_at: string | null;
    }> | null;
  }>;
  ride_along_calls: Array<{ call_code: string }>;
}

interface TrainingSessionInput {
  type: 'Day 1' | 'Day 2' | 'Other Training' | 'Probationer Test';
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  server: string;
  cadetCapacity: number;
  ftoCapacity: number;
  notes: string;
}

type TrainingAttendanceStatus = 'Pending' | 'Attended' | 'Late' | 'No Show' | 'Cancelled' | 'Excused';

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

interface DiscordLinkInput {
  memberId: string;
  discordUserId: string;
  note: string;
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

async function readDiscordLinkInput(request: Request): Promise<DiscordLinkInput> {
  const body: unknown = await request.json();
  if (!isRecord(body)) throw new Error('Invalid Discord link data');
  const discordUserId = requiredString(body.discordUserId, 'Discord user ID');
  if (!/^[0-9]{16,25}$/.test(discordUserId)) {
    throw new Error('Discord user ID must contain 16 to 25 digits');
  }
  return {
    memberId: requiredString(body.memberId, 'Member'),
    discordUserId,
    note: typeof body.note === 'string' ? body.note.trim() : '',
  };
}

async function readTrainingSessionInput(request: Request): Promise<TrainingSessionInput> {
  const body: unknown = await request.json();
  if (!isRecord(body)) throw new Error('Invalid training session data');
  const allowedTypes: TrainingSessionInput['type'][] = ['Day 1', 'Day 2', 'Other Training', 'Probationer Test'];
  if (!allowedTypes.includes(body.type as TrainingSessionInput['type'])) throw new Error('Invalid training type');
  const date = requiredString(body.date, 'Date');
  const startTime = requiredString(body.startTime, 'Start time');
  const endTime = requiredString(body.endTime, 'End time');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid training date');
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || endTime <= startTime) {
    throw new Error('End time must be after the start time');
  }
  const cadetCapacity = Number(body.cadetCapacity);
  const ftoCapacity = Number(body.ftoCapacity);
  if (!Number.isInteger(cadetCapacity) || cadetCapacity < 1 || !Number.isInteger(ftoCapacity) || ftoCapacity < 1) {
    throw new Error('Session capacities must be positive whole numbers');
  }
  return {
    type: body.type as TrainingSessionInput['type'],
    title: requiredString(body.title, 'Title'),
    date,
    startTime,
    endTime,
    location: requiredString(body.location, 'Location'),
    server: requiredString(body.server, 'Server'),
    cadetCapacity,
    ftoCapacity,
    notes: typeof body.notes === 'string' ? body.notes.trim() : '',
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
    source: 'Supabase' as const,
  };
}

const rosterSelect = 'id,display_name,callsign,employee_number,steam_name,timezone,status,ranks(name),discord_accounts!discord_accounts_member_id_fkey(discord_user_id,username,display_name),member_qualifications(qualification_key)';

async function readDatabaseRosterMembers(env: Env) {
  const response = await supabase(
    env,
    `members?select=${rosterSelect}&archived_at=is.null&order=callsign.asc`,
  );
  if (!response.ok) throw new Error(`Supabase roster lookup failed: ${response.status}`);
  return await response.json() as DatabaseRosterMember[];
}

function mapGoogleRosterMember(member: GoogleRosterMember, databaseMember?: DatabaseRosterMember) {
  const account = databaseMember?.discord_accounts?.[0];
  return {
    id: databaseMember?.id ?? `sheet-${member.employeeNumber}`,
    rank: member.rank,
    callsign: member.callsign,
    name: member.name,
    employeeNumber: member.employeeNumber,
    steamName: member.steamName,
    discordName: member.discordName || account?.display_name || account?.username || 'Not linked',
    discordUserId: account?.discord_user_id ?? null,
    timezone: member.timezone || 'Unknown',
    status: 'Active' as const,
    qualifications: member.qualifications,
    source: 'Google Sheets' as const,
  };
}

async function readRoster(env: Env, memberId?: string) {
  const databaseMembers = await readDatabaseRosterMembers(env);
  let members: Array<ReturnType<typeof mapRosterMember> | ReturnType<typeof mapGoogleRosterMember>> = databaseMembers.map(mapRosterMember);
  if (env.GOOGLE_ROSTER_CSV_URL) {
    const sheetMembers = await readGoogleRoster(env.GOOGLE_ROSTER_CSV_URL);
    members = sheetMembers.map((sheetMember) => {
      const databaseMember = databaseMembers.find((candidate) =>
        candidate.employee_number === sheetMember.employeeNumber
        || candidate.callsign?.toLowerCase() === sheetMember.callsign.toLowerCase(),
      );
      return mapGoogleRosterMember(sheetMember, databaseMember);
    });
  }
  return memberId ? members.filter((member) => member.id === memberId) : members;
}

async function syncGoogleRoster(env: Env) {
  if (!env.GOOGLE_ROSTER_CSV_URL) return { checked: 0, updated: 0 };
  const [sheetMembers, databaseMembers] = await Promise.all([
    readGoogleRoster(env.GOOGLE_ROSTER_CSV_URL, true),
    readDatabaseRosterMembers(env),
  ]);
  const pending = sheetMembers.flatMap((sheetMember) => {
    const databaseMember = databaseMembers.find((candidate) =>
      candidate.employee_number === sheetMember.employeeNumber
      || candidate.callsign?.toLowerCase() === sheetMember.callsign.toLowerCase(),
    );
    const mapped = databaseMember ? mapRosterMember(databaseMember) : null;
    const qualificationKeys = (Object.entries(sheetMember.qualifications) as Array<[QualificationKey, boolean]>)
      .filter(([, selected]) => selected)
      .map(([key]) => key);
    const needsUpdate = !mapped
      || mapped.name !== sheetMember.name
      || mapped.callsign !== sheetMember.callsign
      || mapped.employeeNumber !== sheetMember.employeeNumber
      || mapped.rank !== sheetMember.rank
      || mapped.steamName !== sheetMember.steamName
      || mapped.timezone !== sheetMember.timezone
      || (Object.keys(sheetMember.qualifications) as QualificationKey[])
        .some((key) => mapped.qualifications[key] !== sheetMember.qualifications[key]);
    return needsUpdate ? [{ sheetMember, databaseMember, qualificationKeys }] : [];
  });

  for (let offset = 0; offset < pending.length; offset += 5) {
    await Promise.all(pending.slice(offset, offset + 5).map(async ({ sheetMember, databaseMember, qualificationKeys }) => {
      const response = await supabase(env, 'rpc/upsert_roster_member', {
        method: 'POST',
        body: JSON.stringify({
          p_member_id: databaseMember?.id ?? null,
          p_actor_member_id: null,
          p_display_name: sheetMember.name,
          p_callsign: sheetMember.callsign,
          p_employee_number: sheetMember.employeeNumber,
          p_rank_name: sheetMember.rank,
          p_steam_name: sheetMember.steamName,
          p_timezone: sheetMember.timezone || 'Unknown',
          p_status: databaseMember?.status === 'loa' || databaseMember?.status === 'inactive'
            ? databaseMember.status
            : 'active',
          p_qualification_keys: qualificationKeys,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Google roster sync failed for ${sheetMember.employeeNumber}: ${response.status} ${detail}`);
      }
    }));
  }
  return { checked: sheetMembers.length, updated: pending.length };
}

async function handleRosterApi(request: Request, env: Env, memberId?: string) {
  const permission = request.method === 'GET' ? 'roster.read' : 'roster.manage';
  const auth = await requirePermission(request, env, permission);
  if ('error' in auth) return auth.error;

  if (request.method !== 'GET' && env.GOOGLE_ROSTER_CSV_URL) {
    return apiJson(env, { error: 'The roster is managed in the main Google Sheet during migration' }, 409);
  }

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

async function handleDiscordLinkApi(request: Request, env: Env) {
  const auth = await requirePermission(request, env, 'discord_ids.manage');
  if ('error' in auth) return auth.error;

  try {
    if (request.method === 'GET') {
      return apiJson(env, { members: await readRoster(env) });
    }

    if (request.method === 'POST') {
      const input = await readDiscordLinkInput(request);
      const rpcResponse = await supabase(env, 'rpc/link_discord_account', {
        method: 'POST',
        body: JSON.stringify({
          p_member_id: input.memberId,
          p_actor_member_id: auth.member.id,
          p_discord_user_id: input.discordUserId,
          p_verification_note: input.note,
        }),
      });
      if (!rpcResponse.ok) {
        const details = await rpcResponse.json().catch(() => null) as { message?: string } | null;
        const message = details?.message?.includes('already linked') || details?.message?.includes('duplicate key')
          ? 'That Discord user ID is already linked to another member'
          : details?.message ?? 'Unable to save the Discord link';
        return apiJson(env, { error: message }, 400);
      }
      const [member] = await readRoster(env, input.memberId);
      if (!member) return apiJson(env, { error: 'Roster member not found' }, 404);
      return apiJson(env, { member });
    }

    return apiJson(env, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Discord linking API request failed',
      method: request.method,
      error: error instanceof Error ? error.message : String(error),
    }));
    const message = error instanceof Error && !error.message.startsWith('Supabase')
      ? error.message
      : 'Unable to complete the Discord linking request';
    return apiJson(env, { error: message }, 500);
  }
}

function mapCadet(member: DatabaseCadetMember) {
  const record = member.cadet_records?.[0];
  return {
    id: member.id,
    memberId: member.id,
    name: member.display_name,
    employeeNumber: member.employee_number ?? '',
    callsign: member.callsign ?? '',
    startDate: record?.start_date ?? member.joined_at,
    deadline: record?.deadline ?? null,
    stage: record?.stage ?? 'Awaiting Day 1',
    dayOneComplete: record?.day_one_complete ?? false,
    dayOneSessionId: record?.day_one_session_id ?? undefined,
    dayTwoSessionId: record?.day_two_session_id ?? undefined,
    nextStep: record?.next_step ?? 'Training progress has not been set.',
    source: 'Supabase' as const,
  };
}

async function readDatabaseCadetMembers(env: Env) {
  const response = await supabase(
    env,
    'members?select=id,display_name,callsign,employee_number,joined_at,ranks!inner(name),cadet_records(start_date,deadline,stage,day_one_complete,day_one_session_id,day_two_session_id,next_step)&archived_at=is.null&status=eq.active&ranks.name=eq.Cadet&order=callsign.asc',
  );
  if (!response.ok) throw new Error(`Supabase cadet lookup failed: ${response.status}`);
  return await response.json() as DatabaseCadetMember[];
}

async function readCadets(env: Env, memberId?: string) {
  if (!env.GOOGLE_ROSTER_CSV_URL) {
    const cadets = (await readDatabaseCadetMembers(env)).map(mapCadet);
    return memberId ? cadets.filter((cadet) => cadet.memberId === memberId) : cadets;
  }

  const roster = await readRoster(env);
  let dayOneBookings = new Set<string>();
  let dayTwoBookings = new Set<string>();
  let dayOneCompletions = new Set<string>();
  if (env.GOOGLE_TRAINING_CSV_URL) {
    const bookings = await readGoogleTrainingBookings(env.GOOGLE_TRAINING_CSV_URL);
    dayOneBookings = bookings.dayOne;
    dayTwoBookings = bookings.dayTwo;
    dayOneCompletions = bookings.dayOneComplete;
  }

  const cadets = roster.filter((member) => member.rank === 'Cadet').map((member) => {
    const sheetDayOneComplete = dayOneCompletions.has(member.employeeNumber);
    const bookingStage = dayTwoBookings.has(member.employeeNumber)
      ? 'Day 2 Booked'
      : sheetDayOneComplete
        ? 'Available for Ride Alongs'
      : dayOneBookings.has(member.employeeNumber)
        ? 'Day 1 Signed Up'
        : 'Not currently booked';
    return {
      id: member.id,
      memberId: member.id,
      name: member.name,
      employeeNumber: member.employeeNumber,
      callsign: member.callsign,
      startDate: null,
      deadline: null,
      stage: bookingStage,
      dayOneComplete: sheetDayOneComplete,
      dayOneSessionId: undefined,
      dayTwoSessionId: undefined,
      nextStep: bookingStage === 'Day 2 Booked'
          ? 'Booked on the current Day 2 training sheet.'
          : bookingStage === 'Available for Ride Alongs'
            ? 'Day 1 is marked complete on the current training sheet; ready for ride-along training.'
          : bookingStage === 'Day 1 Signed Up'
            ? 'Booked on the current Day 1 training sheet.'
            : 'No current Day 1 or Day 2 booking is listed.',
      source: 'Google Sheets' as const,
    };
  });
  return memberId ? cadets.filter((cadet) => cadet.memberId === memberId) : cadets;
}

async function handleCadetsApi(request: Request, env: Env, memberId?: string) {
  if (request.method !== 'GET') return apiJson(env, { error: 'Method not allowed' }, 405);
  const auth = await requirePermission(request, env, 'cadets.read');
  if ('error' in auth) return auth.error;

  try {
    const cadets = await readCadets(env, memberId);
    if (memberId && !cadets[0]) return apiJson(env, { error: 'Cadet not found' }, 404);
    return apiJson(env, memberId ? { cadet: cadets[0] } : { cadets });
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Cadet API request failed',
      memberId: memberId ?? null,
      error: error instanceof Error ? error.message : String(error),
    }));
    return apiJson(env, { error: 'Unable to load cadet records' }, 500);
  }
}

function relatedOne<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function mapTrainingSession(session: DatabaseTrainingSession) {
  const signups = (session.training_signups ?? []).map((signup) => {
    const member = relatedOne(signup.member);
    return {
      id: signup.id,
      memberId: signup.member_id,
      memberName: member?.display_name ?? 'Unknown member',
      callsign: member?.callsign ?? undefined,
      role: signup.role,
      status: signup.status,
      signedUpAt: signup.signed_up_at,
    };
  });
  const attendance = (session.training_signups ?? []).map((signup) => {
    const record = relatedOne(signup.training_attendance);
    return {
      memberId: signup.member_id,
      status: record?.status ?? 'Pending',
      notes: record?.notes ?? undefined,
    };
  });
  return {
    id: session.id,
    type: session.type,
    title: session.title,
    date: session.session_date,
    startTime: session.start_time.slice(0, 5),
    endTime: session.end_time.slice(0, 5),
    location: session.location,
    server: session.server,
    cadetCapacity: session.cadet_capacity,
    ftoCapacity: session.fto_capacity,
    status: session.status,
    notes: session.notes,
    createdBy: relatedOne(session.created_by_member)?.display_name ?? 'EMS',
    signups,
    attendance,
    activity: (session.training_activity ?? []).map((activity) => ({
      id: activity.id,
      label: activity.label,
      detail: activity.detail,
      createdAt: activity.created_at,
    })),
    source: 'EMS Directory' as const,
  };
}

const trainingSelect = 'id,type,title,session_date,start_time,end_time,location,server,cadet_capacity,fto_capacity,status,notes,created_by_member:members!training_sessions_created_by_fkey(display_name),training_signups(id,member_id,role,status,signed_up_at,member:members!training_signups_member_id_fkey(display_name,callsign),training_attendance(status,notes)),training_activity(id,label,detail,created_at)';

async function readTrainingSessions(env: Env, sessionId?: string) {
  if (env.GOOGLE_TRAINING_CSV_URL) {
    const [googleSessions, roster] = await Promise.all([
      readGoogleTrainingSessions(env.GOOGLE_TRAINING_CSV_URL),
      readRoster(env),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const sessions = googleSessions.map((session) => {
      const makeSignup = (attendee: { employeeNumber: string; name: string; complete: boolean }, role: 'Cadet' | 'FTO') => {
        const member = roster.find((candidate) => candidate.employeeNumber === attendee.employeeNumber);
        return {
          id: `${session.id}-${role.toLowerCase()}-${attendee.employeeNumber}`,
          memberId: member?.id ?? `sheet-${attendee.employeeNumber}`,
          memberName: member?.name ?? (attendee.name || `Employee ${attendee.employeeNumber}`),
          callsign: member?.callsign,
          role,
          status: attendee.complete ? 'Attended' as const : 'Signed Up' as const,
          signedUpAt: `${session.date}T00:00:00.000Z`,
        };
      };
      const signups = [
        ...session.cadets.map((attendee) => makeSignup(attendee, 'Cadet')),
        ...session.ftos.map((attendee) => makeSignup(attendee, 'FTO')),
      ];
      const attendance = [
        ...session.cadets.map((attendee) => ({ attendee, role: 'Cadet' as const })),
        ...session.ftos.map((attendee) => ({ attendee, role: 'FTO' as const })),
      ].map(({ attendee, role }) => {
        const signup = makeSignup(attendee, role);
        return { memberId: signup.memberId, status: attendee.complete ? 'Attended' as const : 'Pending' as const };
      });
      return {
        id: session.id,
        type: session.type,
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        endTime: '',
        location: 'See Training Attendance Sheet',
        server: session.timezone || session.title.split(' ')[0],
        cadetCapacity: session.cadetCapacity,
        ftoCapacity: session.ftoCapacity,
        status: session.date < today ? 'Completed' as const : 'Open' as const,
        notes: session.host
          ? `Hosted by ${session.host}. Bookings and attendance are managed in the main Training Attendance Sheet.`
          : 'Bookings and attendance are managed in the main Training Attendance Sheet.',
        createdBy: session.host || 'EMS Training Team',
        signups,
        attendance,
        activity: [],
        source: 'Google Sheets' as const,
      };
    });
    return sessionId ? sessions.filter((session) => session.id === sessionId) : sessions.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }
  const filter = sessionId ? `&id=eq.${encodeURIComponent(sessionId)}` : '';
  const response = await supabase(env, `training_sessions?select=${trainingSelect}${filter}&order=session_date.desc,start_time.desc`);
  if (!response.ok) throw new Error(`Supabase training lookup failed: ${response.status}`);
  return (await response.json() as DatabaseTrainingSession[]).map(mapTrainingSession);
}

async function recordTrainingActivity(env: Env, sessionId: string, label: string, detail: string) {
  const response = await supabase(env, 'training_activity', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, label, detail }),
  });
  if (!response.ok) throw new Error(`Supabase training activity write failed: ${response.status}`);
}

async function handleTrainingSessionsApi(request: Request, env: Env, sessionId?: string) {
  const permission = request.method === 'GET' ? 'training.read' : 'training.manage';
  const auth = await requirePermission(request, env, permission);
  if ('error' in auth) return auth.error;

  try {
    if (request.method === 'GET') {
      const sessions = await readTrainingSessions(env, sessionId);
      if (sessionId && !sessions[0]) return apiJson(env, { error: 'Training session not found' }, 404);
      return apiJson(env, sessionId ? { session: sessions[0] } : { sessions });
    }

    if (request.method === 'POST' && !sessionId) {
      if (env.GOOGLE_TRAINING_CSV_URL) return apiJson(env, { error: 'Training sessions are currently managed in the main Google Training Attendance Sheet' }, 409);
      const input = await readTrainingSessionInput(request);
      const response = await supabase(env, 'training_sessions', {
        method: 'POST',
        body: JSON.stringify({
          type: input.type,
          title: input.title,
          session_date: input.date,
          start_time: input.startTime,
          end_time: input.endTime,
          location: input.location,
          server: input.server,
          cadet_capacity: input.cadetCapacity,
          fto_capacity: input.ftoCapacity,
          notes: input.notes,
          created_by: auth.member.id,
        }),
      });
      if (!response.ok) throw new Error(`Supabase training create failed: ${response.status}`);
      const [created] = await response.json() as Array<{ id: string }>;
      await recordTrainingActivity(env, created.id, 'Session created', `Created by ${auth.member.display_name}`);
      const auditResponse = await supabase(env, 'audit_logs', {
        method: 'POST',
        body: JSON.stringify({
          actor_member_id: auth.member.id,
          action: 'training.session.created',
          record_type: 'training_session',
          record_id: created.id,
          new_value: input,
        }),
      });
      if (!auditResponse.ok) throw new Error(`Supabase training audit write failed: ${auditResponse.status}`);
      const [session] = await readTrainingSessions(env, created.id);
      return apiJson(env, { session }, 201);
    }

    return apiJson(env, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Training session API request failed',
      method: request.method,
      sessionId: sessionId ?? null,
      error: error instanceof Error ? error.message : String(error),
    }));
    const message = error instanceof Error && !error.message.startsWith('Supabase')
      ? error.message
      : 'Unable to complete the training request';
    return apiJson(env, { error: message }, 500);
  }
}

async function handleTrainingSignupApi(request: Request, env: Env, sessionId: string) {
  if (request.method !== 'POST') return apiJson(env, { error: 'Method not allowed' }, 405);
  const auth = await requirePermission(request, env, 'training.read');
  if ('error' in auth) return auth.error;
  if (env.GOOGLE_TRAINING_CSV_URL) return apiJson(env, { error: 'Sign-ups are currently managed in the main Google Training Attendance Sheet' }, 409);

  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || (body.role !== 'Cadet' && body.role !== 'FTO')) throw new Error('Invalid training role');
    const [session] = await readTrainingSessions(env, sessionId);
    if (!session) return apiJson(env, { error: 'Training session not found' }, 404);
    if (session.status !== 'Open' && session.status !== 'Full') throw new Error('This session is not accepting sign-ups');

    if (body.role === 'FTO' && !resolvePermissions(auth.member).includes('training.manage')) {
      const qualificationResponse = await supabase(env, `member_qualifications?member_id=eq.${encodeURIComponent(auth.member.id)}&qualification_key=eq.fto&select=member_id`);
      if (!qualificationResponse.ok) throw new Error(`Supabase FTO qualification lookup failed: ${qualificationResponse.status}`);
      const qualifications = await qualificationResponse.json() as Array<{ member_id: string }>;
      if (!qualifications.length) return apiJson(env, { error: 'Only qualified FTOs can volunteer for this role' }, 403);
    }

    const existingSignup = session.signups.find((signup) => signup.memberId === auth.member.id);
    const activeForRole = session.signups.filter((signup) => signup.role === body.role && signup.status !== 'Withdrawn' && signup.status !== 'Cancelled' && signup.status !== 'Waiting List').length;
    const capacity = body.role === 'Cadet' ? session.cadetCapacity : session.ftoCapacity;
    const signupStatus = existingSignup?.role === body.role && existingSignup.status === 'Signed Up'
      ? 'Signed Up'
      : activeForRole >= capacity ? 'Waiting List' : 'Signed Up';
    const signupResponse = await supabase(env, 'training_signups?on_conflict=session_id,member_id', {
      method: 'POST',
      headers: { prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        session_id: sessionId,
        member_id: auth.member.id,
        role: body.role,
        status: signupStatus,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!signupResponse.ok) throw new Error(`Supabase training sign-up failed: ${signupResponse.status}`);
    const [signup] = await signupResponse.json() as Array<{ id: string }>;
    const attendanceResponse = await supabase(env, 'training_attendance?on_conflict=signup_id', {
      method: 'POST',
      headers: { prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ signup_id: signup.id, status: 'Pending' }),
    });
    if (!attendanceResponse.ok) throw new Error(`Supabase attendance initialization failed: ${attendanceResponse.status}`);
    await recordTrainingActivity(env, sessionId, `${body.role} signed up`, `${auth.member.display_name} joined the session${signupStatus === 'Waiting List' ? ' waiting list' : ''}`);
    const [updated] = await readTrainingSessions(env, sessionId);
    return apiJson(env, { session: updated });
  } catch (error) {
    const message = error instanceof Error && !error.message.startsWith('Supabase') ? error.message : 'Unable to save the training sign-up';
    return apiJson(env, { error: message }, 500);
  }
}

async function handleTrainingAttendanceApi(request: Request, env: Env, sessionId: string) {
  if (request.method !== 'PATCH') return apiJson(env, { error: 'Method not allowed' }, 405);
  const auth = await requirePermission(request, env, 'training.manage');
  if ('error' in auth) return auth.error;
  if (env.GOOGLE_TRAINING_CSV_URL) return apiJson(env, { error: 'Attendance is currently managed in the main Google Training Attendance Sheet' }, 409);

  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || !Array.isArray(body.entries)) throw new Error('Invalid attendance data');
    const allowed: TrainingAttendanceStatus[] = ['Pending', 'Attended', 'Late', 'No Show', 'Cancelled', 'Excused'];
    const entries = body.entries.map((entry) => {
      if (!isRecord(entry) || typeof entry.memberId !== 'string' || !allowed.includes(entry.status as TrainingAttendanceStatus)) {
        throw new Error('Invalid attendance entry');
      }
      return {
        memberId: entry.memberId,
        status: entry.status as TrainingAttendanceStatus,
        notes: typeof entry.notes === 'string' ? entry.notes.trim() : '',
      };
    });
    const [session] = await readTrainingSessions(env, sessionId);
    if (!session) return apiJson(env, { error: 'Training session not found' }, 404);

    for (const entry of entries) {
      const signup = session.signups.find((item) => item.memberId === entry.memberId);
      if (!signup) throw new Error('Attendance member is not signed up for this session');
      const attendanceResponse = await supabase(env, 'training_attendance?on_conflict=signup_id', {
        method: 'POST',
        headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          signup_id: signup.id,
          status: entry.status,
          notes: entry.notes || null,
          updated_by: auth.member.id,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!attendanceResponse.ok) throw new Error(`Supabase attendance save failed: ${attendanceResponse.status}`);
      const signupStatus = entry.status === 'Attended' || entry.status === 'Late'
        ? 'Attended'
        : entry.status === 'No Show'
          ? 'No Show'
          : entry.status === 'Cancelled'
            ? 'Cancelled'
            : 'Signed Up';
      const signupResponse = await supabase(env, `training_signups?id=eq.${encodeURIComponent(signup.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: signupStatus, updated_at: new Date().toISOString() }),
      });
      if (!signupResponse.ok) throw new Error(`Supabase training sign-up update failed: ${signupResponse.status}`);
    }

    const sessionResponse = await supabase(env, `training_sessions?id=eq.${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Completed', updated_at: new Date().toISOString() }),
    });
    if (!sessionResponse.ok) throw new Error(`Supabase training completion failed: ${sessionResponse.status}`);
    await recordTrainingActivity(env, sessionId, 'Attendance saved', `Recorded by ${auth.member.display_name}`);
    const auditResponse = await supabase(env, 'audit_logs', {
      method: 'POST',
      body: JSON.stringify({
        actor_member_id: auth.member.id,
        action: 'training.attendance.saved',
        record_type: 'training_session',
        record_id: sessionId,
        new_value: { entries },
      }),
    });
    if (!auditResponse.ok) throw new Error(`Supabase training audit write failed: ${auditResponse.status}`);
    const [updated] = await readTrainingSessions(env, sessionId);
    return apiJson(env, { session: updated });
  } catch (error) {
    const message = error instanceof Error && !error.message.startsWith('Supabase') ? error.message : 'Unable to save training attendance';
    return apiJson(env, { error: message }, 500);
  }
}

function mapRideAlong(rideAlong: DatabaseRideAlong, includeInternal: boolean) {
  const fto = relatedOne(rideAlong.fto);
  const cadets = (rideAlong.ride_along_cadets ?? []).map((entry) => {
    const member = relatedOne(entry.member);
    const feedback = relatedOne(entry.ride_along_feedback);
    return {
      id: entry.id,
      memberId: entry.member_id,
      name: member?.display_name ?? 'Unknown cadet',
      employeeNumber: member?.employee_number ?? '',
      callsign: member?.callsign ?? undefined,
      feedbackStatus: feedback?.status ?? 'Not Started',
    };
  });
  const feedback = (rideAlong.ride_along_cadets ?? []).flatMap((entry) => {
    const record = relatedOne(entry.ride_along_feedback);
    if (!record) return [];
    const member = relatedOne(entry.member);
    return [{
      id: record.id,
      cadetId: entry.member_id,
      cadetName: member?.display_name ?? 'Unknown cadet',
      strengths: record.strengths,
      areasToImprove: record.areas_to_improve,
      currentFocus: record.current_focus,
      generalFeedback: record.general_feedback,
      concerns: includeInternal ? record.concerns : '',
      internalNotes: includeInternal ? record.internal_notes : '',
      recommendedNextStep: record.recommended_next_step,
      status: record.status,
      submittedAt: record.submitted_at ?? undefined,
    }];
  });
  const durationMinutes = rideAlong.ended_at
    ? Math.max(0, Math.round((new Date(rideAlong.ended_at).getTime() - new Date(rideAlong.started_at).getTime()) / 60_000))
    : undefined;
  return {
    id: rideAlong.id,
    ftoId: rideAlong.fto_id,
    ftoName: fto?.display_name ?? 'Unknown FTO',
    ftoCallsign: fto?.callsign ?? '',
    startedAt: rideAlong.started_at,
    endedAt: rideAlong.ended_at ?? undefined,
    durationMinutes,
    status: rideAlong.status,
    cadets,
    feedback,
    callsAttended: (rideAlong.ride_along_calls ?? []).map((call) => call.call_code),
    createdAt: rideAlong.created_at,
  };
}

const rideAlongSelect = 'id,fto_id,started_at,ended_at,status,created_at,fto:members!ride_alongs_fto_id_fkey(display_name,callsign),ride_along_cadets(id,member_id,member:members!ride_along_cadets_member_id_fkey(display_name,callsign,employee_number),ride_along_feedback(id,strengths,areas_to_improve,current_focus,general_feedback,concerns,internal_notes,recommended_next_step,status,submitted_at)),ride_along_calls(call_code)';

async function readRideAlongs(env: Env, includeInternal: boolean, rideAlongId?: string) {
  const filter = rideAlongId ? `&id=eq.${encodeURIComponent(rideAlongId)}` : '';
  const response = await supabase(env, `ride_alongs?select=${rideAlongSelect}${filter}&order=started_at.desc`);
  if (!response.ok) throw new Error(`Supabase ride along lookup failed: ${response.status}`);
  return (await response.json() as DatabaseRideAlong[]).map((rideAlong) => mapRideAlong(rideAlong, includeInternal));
}

function rideAlongCadetOverview(cadets: Awaited<ReturnType<typeof readCadets>>, rideAlongs: ReturnType<typeof mapRideAlong>[]) {
  return cadets.map((cadet) => {
    const completed = rideAlongs.filter((rideAlong) =>
      rideAlong.status === 'Completed' && rideAlong.cadets.some((entry) => entry.memberId === cadet.memberId),
    );
    const latestFeedback = completed
      .flatMap((rideAlong) => rideAlong.feedback)
      .filter((feedback) => feedback.cadetId === cadet.memberId && feedback.status === 'Submitted')
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))[0];
    const daysRemaining = cadet.deadline
      ? Math.max(0, Math.ceil((new Date(`${cadet.deadline}T12:00:00Z`).getTime() - Date.now()) / 86_400_000))
      : null;
    return {
      id: cadet.memberId,
      name: cadet.name,
      employeeNumber: cadet.employeeNumber,
      callsign: cadet.callsign,
      daysRemaining,
      rideAlongs: completed.length,
      currentFocus: latestFeedback?.currentFocus || 'Not set',
    };
  });
}

async function handleRideAlongsApi(request: Request, env: Env, rideAlongId?: string) {
  const permission = request.method === 'GET' ? 'training.read' : 'training.manage';
  const auth = await requirePermission(request, env, permission);
  if ('error' in auth) return auth.error;
  const permissions = resolvePermissions(auth.member);
  const includeInternal = permissions.includes('fto_resources.read') || permissions.includes('training.manage');

  try {
    if (request.method === 'GET') {
      const rideAlongs = await readRideAlongs(env, includeInternal, rideAlongId);
      if (rideAlongId && !rideAlongs[0]) return apiJson(env, { error: 'Ride along not found' }, 404);
      if (rideAlongId) return apiJson(env, { rideAlong: rideAlongs[0] });
      const cadets = await readCadets(env);
      return apiJson(env, { rideAlongs, availableCadets: rideAlongCadetOverview(cadets, rideAlongs) });
    }

    if (request.method === 'POST' && !rideAlongId) {
      const body: unknown = await request.json();
      if (!isRecord(body) || !Array.isArray(body.cadetIds) || body.cadetIds.length < 1 || body.cadetIds.length > 2) {
        throw new Error('Select one or two cadets');
      }
      const cadetIds = [...new Set(body.cadetIds.filter((value): value is string => typeof value === 'string'))];
      if (cadetIds.length !== body.cadetIds.length) throw new Error('Select one or two unique cadets');
      const startedAt = typeof body.startedAt === 'string' ? new Date(body.startedAt) : new Date('invalid');
      if (Number.isNaN(startedAt.getTime())) throw new Error('Invalid ride along start time');
      const cadets = await readCadets(env);
      if (cadetIds.some((id) => !cadets.some((cadet) => cadet.memberId === id))) throw new Error('A selected cadet is not available');

      const response = await supabase(env, 'ride_alongs', {
        method: 'POST',
        body: JSON.stringify({ fto_id: auth.member.id, started_at: startedAt.toISOString() }),
      });
      if (!response.ok) throw new Error(`Supabase ride along create failed: ${response.status}`);
      const [created] = await response.json() as Array<{ id: string }>;
      const cadetResponse = await supabase(env, 'ride_along_cadets', {
        method: 'POST',
        body: JSON.stringify(cadetIds.map((memberId) => ({ ride_along_id: created.id, member_id: memberId }))),
      });
      if (!cadetResponse.ok) throw new Error(`Supabase ride along cadet assignment failed: ${cadetResponse.status}`);
      const auditResponse = await supabase(env, 'audit_logs', {
        method: 'POST',
        body: JSON.stringify({
          actor_member_id: auth.member.id,
          action: 'ride_along.started',
          record_type: 'ride_along',
          record_id: created.id,
          new_value: { cadetIds, startedAt: startedAt.toISOString() },
        }),
      });
      if (!auditResponse.ok) throw new Error(`Supabase ride along audit write failed: ${auditResponse.status}`);
      const [rideAlong] = await readRideAlongs(env, true, created.id);
      return apiJson(env, { rideAlong }, 201);
    }

    return apiJson(env, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error(JSON.stringify({ message: 'Ride along API request failed', method: request.method, rideAlongId: rideAlongId ?? null, error: error instanceof Error ? error.message : String(error) }));
    const message = error instanceof Error && !error.message.startsWith('Supabase') ? error.message : 'Unable to complete the ride along request';
    return apiJson(env, { error: message }, 500);
  }
}

async function handleRideAlongCallApi(request: Request, env: Env, rideAlongId: string) {
  if (request.method !== 'POST') return apiJson(env, { error: 'Method not allowed' }, 405);
  const auth = await requirePermission(request, env, 'training.manage');
  if ('error' in auth) return auth.error;
  try {
    const body: unknown = await request.json();
    const callCode = isRecord(body) ? requiredString(body.callCode, 'Call code') : '';
    if (!/^[A-Za-z0-9 -]{1,30}$/.test(callCode)) throw new Error('Call code contains unsupported characters');
    const [rideAlong] = await readRideAlongs(env, true, rideAlongId);
    if (!rideAlong) return apiJson(env, { error: 'Ride along not found' }, 404);
    if (rideAlong.status !== 'In Progress') throw new Error('Calls can only be added to an active ride along');
    const response = await supabase(env, 'ride_along_calls', {
      method: 'POST',
      body: JSON.stringify({ ride_along_id: rideAlongId, call_code: callCode }),
    });
    if (!response.ok) throw new Error(`Supabase ride along call write failed: ${response.status}`);
    const [updated] = await readRideAlongs(env, true, rideAlongId);
    return apiJson(env, { rideAlong: updated });
  } catch (error) {
    const message = error instanceof Error && !error.message.startsWith('Supabase') ? error.message : 'Unable to add the call';
    return apiJson(env, { error: message }, 500);
  }
}

async function handleRideAlongEndApi(request: Request, env: Env, rideAlongId: string) {
  if (request.method !== 'POST') return apiJson(env, { error: 'Method not allowed' }, 405);
  const auth = await requirePermission(request, env, 'training.manage');
  if ('error' in auth) return auth.error;
  try {
    const [rideAlong] = await readRideAlongs(env, true, rideAlongId);
    if (!rideAlong) return apiJson(env, { error: 'Ride along not found' }, 404);
    if (rideAlong.status === 'In Progress') {
      const endedAt = new Date().toISOString();
      const response = await supabase(env, `ride_alongs?id=eq.${encodeURIComponent(rideAlongId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed', ended_at: endedAt, updated_at: endedAt }),
      });
      if (!response.ok) throw new Error(`Supabase ride along completion failed: ${response.status}`);
      const feedbackResponse = await supabase(env, 'ride_along_feedback?on_conflict=ride_along_cadet_id', {
        method: 'POST',
        headers: { prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(rideAlong.cadets.map((cadet) => ({ ride_along_cadet_id: cadet.id }))),
      });
      if (!feedbackResponse.ok) throw new Error(`Supabase ride along feedback initialization failed: ${feedbackResponse.status}`);
      const auditResponse = await supabase(env, 'audit_logs', {
        method: 'POST',
        body: JSON.stringify({ actor_member_id: auth.member.id, action: 'ride_along.completed', record_type: 'ride_along', record_id: rideAlongId }),
      });
      if (!auditResponse.ok) throw new Error(`Supabase ride along audit write failed: ${auditResponse.status}`);
    }
    const [updated] = await readRideAlongs(env, true, rideAlongId);
    return apiJson(env, { rideAlong: updated });
  } catch (error) {
    const message = error instanceof Error && !error.message.startsWith('Supabase') ? error.message : 'Unable to end the ride along';
    return apiJson(env, { error: message }, 500);
  }
}

async function handleRideAlongFeedbackApi(request: Request, env: Env, rideAlongId: string, cadetId: string) {
  if (request.method !== 'PATCH') return apiJson(env, { error: 'Method not allowed' }, 405);
  const auth = await requirePermission(request, env, 'training.manage');
  if ('error' in auth) return auth.error;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error('Invalid feedback data');
    const [rideAlong] = await readRideAlongs(env, true, rideAlongId);
    if (!rideAlong) return apiJson(env, { error: 'Ride along not found' }, 404);
    const cadet = rideAlong.cadets.find((entry) => entry.memberId === cadetId);
    if (!cadet) return apiJson(env, { error: 'Cadet is not part of this ride along' }, 404);
    const allowedNextSteps = ['Continue Ride Alongs', 'Ready for Day 2', 'Needs Specific Training', 'Command Review Required'];
    if (!allowedNextSteps.includes(String(body.recommendedNextStep))) throw new Error('Invalid recommended next step');
    const submit = body.submit === true;
    const now = new Date().toISOString();
    const response = await supabase(env, 'ride_along_feedback?on_conflict=ride_along_cadet_id', {
      method: 'POST',
      headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        ride_along_cadet_id: cadet.id,
        strengths: typeof body.strengths === 'string' ? body.strengths.trim() : '',
        areas_to_improve: typeof body.areasToImprove === 'string' ? body.areasToImprove.trim() : '',
        current_focus: typeof body.currentFocus === 'string' ? body.currentFocus.trim() : '',
        general_feedback: typeof body.generalFeedback === 'string' ? body.generalFeedback.trim() : '',
        concerns: typeof body.concerns === 'string' ? body.concerns.trim() : '',
        internal_notes: typeof body.internalNotes === 'string' ? body.internalNotes.trim() : '',
        recommended_next_step: body.recommendedNextStep,
        status: submit ? 'Submitted' : 'Draft',
        submitted_at: submit ? now : null,
        updated_at: now,
      }),
    });
    if (!response.ok) throw new Error(`Supabase ride along feedback save failed: ${response.status}`);
    const auditResponse = await supabase(env, 'audit_logs', {
      method: 'POST',
      body: JSON.stringify({
        actor_member_id: auth.member.id,
        action: submit ? 'ride_along.feedback.submitted' : 'ride_along.feedback.drafted',
        record_type: 'ride_along_feedback',
        record_id: `${rideAlongId}:${cadetId}`,
        new_value: { currentFocus: body.currentFocus, recommendedNextStep: body.recommendedNextStep },
      }),
    });
    if (!auditResponse.ok) throw new Error(`Supabase ride along feedback audit write failed: ${auditResponse.status}`);
    const [updated] = await readRideAlongs(env, true, rideAlongId);
    return apiJson(env, { rideAlong: updated });
  } catch (error) {
    const message = error instanceof Error && !error.message.startsWith('Supabase') ? error.message : 'Unable to save ride along feedback';
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

async function handleHealth(env: Env) {
  const [roster, training] = await Promise.allSettled([
    env.GOOGLE_ROSTER_CSV_URL ? readGoogleRoster(env.GOOGLE_ROSTER_CSV_URL) : Promise.reject(new Error('Roster source is not configured')),
    env.GOOGLE_TRAINING_CSV_URL ? readGoogleTrainingSessions(env.GOOGLE_TRAINING_CSV_URL) : Promise.reject(new Error('Training source is not configured')),
  ]);
  const healthy = roster.status === 'fulfilled' && training.status === 'fulfilled';
  return apiJson(env, {
    ok: healthy,
    version: 'google-sources-v3',
    sources: {
      roster: { ok: roster.status === 'fulfilled', count: roster.status === 'fulfilled' ? roster.value.length : 0 },
      training: { ok: training.status === 'fulfilled', count: training.status === 'fulfilled' ? training.value.length : 0 },
    },
  }, healthy ? 200 : 503);
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(env) });
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return request.method === 'GET'
      ? handleHealth(env)
      : apiJson(env, { error: 'Method not allowed' }, 405);
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
    const cadetsMatch = url.pathname.match(/^\/api\/cadets(?:\/([^/]+))?$/);
    if (cadetsMatch) return handleCadetsApi(request, env, cadetsMatch[1] ? decodeURIComponent(cadetsMatch[1]) : undefined);
    const trainingSignupMatch = url.pathname.match(/^\/api\/training-sessions\/([^/]+)\/signup$/);
    if (trainingSignupMatch) return handleTrainingSignupApi(request, env, decodeURIComponent(trainingSignupMatch[1]));
    const trainingAttendanceMatch = url.pathname.match(/^\/api\/training-sessions\/([^/]+)\/attendance$/);
    if (trainingAttendanceMatch) return handleTrainingAttendanceApi(request, env, decodeURIComponent(trainingAttendanceMatch[1]));
    const trainingMatch = url.pathname.match(/^\/api\/training-sessions(?:\/([^/]+))?$/);
    if (trainingMatch) return handleTrainingSessionsApi(request, env, trainingMatch[1] ? decodeURIComponent(trainingMatch[1]) : undefined);
    const rideAlongCallMatch = url.pathname.match(/^\/api\/ride-alongs\/([^/]+)\/calls$/);
    if (rideAlongCallMatch) return handleRideAlongCallApi(request, env, decodeURIComponent(rideAlongCallMatch[1]));
    const rideAlongEndMatch = url.pathname.match(/^\/api\/ride-alongs\/([^/]+)\/end$/);
    if (rideAlongEndMatch) return handleRideAlongEndApi(request, env, decodeURIComponent(rideAlongEndMatch[1]));
    const rideAlongFeedbackMatch = url.pathname.match(/^\/api\/ride-alongs\/([^/]+)\/feedback\/([^/]+)$/);
    if (rideAlongFeedbackMatch) return handleRideAlongFeedbackApi(request, env, decodeURIComponent(rideAlongFeedbackMatch[1]), decodeURIComponent(rideAlongFeedbackMatch[2]));
    const rideAlongMatch = url.pathname.match(/^\/api\/ride-alongs(?:\/([^/]+))?$/);
    if (rideAlongMatch) return handleRideAlongsApi(request, env, rideAlongMatch[1] ? decodeURIComponent(rideAlongMatch[1]) : undefined);
    if (url.pathname === '/api/discord-links') return handleDiscordLinkApi(request, env);
    return Response.json({ error: 'Not found' }, { status: 404, headers: { ...jsonHeaders, ...corsHeaders(env) } });
  },
  async scheduled(_controller: ScheduledController, env: Env, context: ExecutionContext) {
    context.waitUntil(syncGoogleRoster(env).then((result) => {
      console.log(JSON.stringify({ message: 'Google roster sync completed', ...result }));
    }));
  },
};
