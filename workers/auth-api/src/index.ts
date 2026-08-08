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

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
};

function corsHeaders(env: Env) {
  return {
    'access-control-allow-origin': env.FRONTEND_ORIGIN,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
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
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...init?.headers,
    },
  });
}

async function findMemberByDiscordId(discordUserId: string, env: Env) {
  const response = await supabase(
    env,
    `discord_accounts?discord_user_id=eq.${discordUserId}&select=member_id,members(id,display_name,callsign,status,ranks(name,rank_permissions(permission_key)))`,
  );
  const rows = await response.json() as Array<any>;
  const row = rows[0];
  if (!row?.members || row.members.status !== 'active') return null;
  return row.members;
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
  const member = await findMemberByDiscordId(discordUser.id, env);
  if (!member) return Response.redirect(fallback, 302);

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
  const response = await supabase(
    env,
    `members?id=eq.${session.memberId}&select=id,display_name,callsign,status,ranks(name,rank_permissions(permission_key))`,
  );
  const [member] = await response.json() as Array<any>;
  if (!member || member.status !== 'active') {
    return Response.json({ user: null, unauthorised: true }, { headers: { ...jsonHeaders, ...corsHeaders(env) } });
  }
  const permissions = member.ranks?.rank_permissions?.map((item: { permission_key: string }) => item.permission_key) ?? [];
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
    return Response.json({ error: 'Not found' }, { status: 404, headers: { ...jsonHeaders, ...corsHeaders(env) } });
  },
};
