# EMS Directory

Internal EMS operations website for personnel, cadets, training and ride-along records.

## Architecture

- Frontend: React + TypeScript + Vite, deployed to GitHub Pages at `https://USERNAME.github.io/EMS-Directory/`.
- Secure backend: Cloudflare Worker for Discord OAuth, sessions, roster checks and protected API routes.
- Database: Supabase Postgres using migrations, constraints and Row Level Security.

GitHub Pages is only the static interface. It must not contain Discord client secrets, database service keys, private roster data or protected EMS records.

## Current status

- Discord OAuth with rank-based permissions
- Live personnel roster from the main EMS Google Sheet
- Live cadet identities, training bookings and completion checkboxes from Google Sheets
- Live EU/NA Day 1 and Day 2 sessions, cadets, FTOs and helpers
- Supabase-backed Discord identity links, ride-alongs, feedback and audit records
- Real EMS Google Docs/Sheets linked from Training Sheets, Knowledge Base, Forms and Quick Reference
- Source-health endpoint at `https://ems-directory.chelseacaitline.workers.dev/api/health`
- GitHub Pages production site at `https://kizzymoon.github.io/EMS-Directory/`

Google Sheets remain authoritative during the migration. Roster and training writes are intentionally blocked in EMS Directory until those workflows are fully moved to Supabase.

## Local setup

```bash
npm install
copy .env.example .env
npm run dev
```

For local frontend-only setup, leave `VITE_API_BASE_URL` blank to use setup mode. Setup mode is not security; it is only for building the public interface before the backend is live.

## Frontend environment

```env
VITE_BASE_PATH=/EMS-Directory/
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_REDIRECT_URL=https://your-worker.your-subdomain.workers.dev/auth/discord/callback
VITE_DISCORD_GUILD_ID=optional_discord_server_id
```

## GitHub Pages

1. Push this repository to GitHub.
2. Open repository settings.
3. Go to **Pages**.
4. Set source to **GitHub Actions**.
5. Add repository variables for the public frontend values:
   - `VITE_API_BASE_URL`
   - `VITE_DISCORD_CLIENT_ID`
   - `VITE_DISCORD_REDIRECT_URL`
   - `VITE_DISCORD_GUILD_ID` if used
6. Push to `main`.

The workflow builds with `VITE_BASE_PATH=/EMS-Directory/`, so asset URLs work under the GitHub Pages repository path.

## Supabase setup

1. Create a Supabase project.
2. Open SQL editor.
3. Run `supabase/migrations/0001_core_security_schema.sql`.
4. Create initial ranks.
5. Assign permissions through `rank_permissions`.
6. Import or manually create active EMS members.
7. Add Discord user IDs as you collect them.

Discord IDs are allowed to start blank. A member cannot sign in until their `discord_accounts.discord_user_id` is linked to an active `members` record.

## Cloudflare Worker setup

1. Create a Cloudflare Worker.
2. Use `workers/auth-api/wrangler.toml.example` as the starting config.
3. Set public Worker variables:
   - `FRONTEND_ORIGIN`
   - `FRONTEND_PATH`
   - `SUPABASE_URL`
   - `DISCORD_CLIENT_ID`
   - `GOOGLE_ROSTER_CSV_URL`
   - `GOOGLE_TRAINING_CSV_URL`
4. Set secrets with Wrangler:

```bash
wrangler secret put DISCORD_CLIENT_SECRET
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SESSION_SECRET
```

5. Deploy the Worker.
6. Add the Worker callback URL in the Discord Developer Portal:

```text
https://your-worker.your-subdomain.workers.dev/auth/discord/callback
```

## Manual Discord ID workflow

1. Add or import the roster member without a Discord ID.
2. Ask the member to provide their Discord user ID, not their username.
3. Verify it in Discord.
4. Use `#/administration/discord-linking` to record the ID.
5. Audit every link/correction.

Discord usernames can change, so they are only display metadata. The permanent account match is the Discord user ID.

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## Production verification

The public health endpoint verifies that the deployed Worker can read both authoritative Google sources without exposing roster content:

```bash
curl https://ems-directory.chelseacaitline.workers.dev/api/health
```

A healthy response reports `ok: true`, the deployed source-reader version, and non-sensitive roster/training counts.
