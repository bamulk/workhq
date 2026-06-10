# Finances

Consolidated **money-in vs money-out** dashboard across 3 businesses and 5 rental
houses. One login, one screen, every entity's net cash flow.

- **Stack:** Next.js 16 · Supabase (Postgres + Auth + RLS) · Tailwind v4
- **Data in (v1):** manual entry + CSV import (column mapping, duplicate detection, batch undo)
- **Designed for later:** direct-pull connectors from source apps via `(source, external_id)`
  idempotent upserts — see `src/lib/connectors/`

## Develop

```bash
npm install
npm run dev
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and `SUPABASE_SERVICE_ROLE_KEY`. First-time setup (schema, login user): see [SETUP.md](SETUP.md).

## Deploy

Pushes to `main` auto-deploy to Vercel (project `finances`).
