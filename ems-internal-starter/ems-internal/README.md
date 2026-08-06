# SAMD Internal

Shared EMS internal website foundation.

## Current foundation

- React + TypeScript + Vite
- Shared CAD-style application shell
- Responsive sidebar and portrait-monitor friendly layout
- Dashboard foundation
- Cadet list and cadet profile foundation
- Quick Reference foundation
- Placeholder routes for all agreed modules
- Supabase client scaffold
- GitHub Pages deployment workflow

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Supabase environment variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not commit `.env`.

## Build

```bash
npm run build
```

## GitHub Pages

The included workflow deploys the `dist` folder when changes are pushed to `main`.
Enable GitHub Pages and choose **GitHub Actions** as the source in the repository settings.
