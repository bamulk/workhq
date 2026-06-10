# Finances — setup

A consolidated money-in / money-out dashboard across 3 businesses + 5 rental houses.
Next.js 16 · Supabase · Tailwind v4. v1 gets data in via manual entry + CSV import.

## 1. Create the Supabase project

In your (new) Supabase account: **New project** → name it `finances`, pick a region near you,
set a database password (save it).

## 2. Run the schema

Open **SQL Editor** → New query → paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql)
→ **Run**. This creates the tables (`entities`, `categories`, `transactions`, `import_batches`,
`profiles`), triggers, row-level security, and seeds the 8 entities + default categories.

## 3. Wire up environment variables

Copy `.env.local.example` to `.env.local` and fill in the three values from
**Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key>
```

## 4. Create your login

Supabase dashboard → **Authentication → Users → Add user** → enter your email + a password
(check "Auto confirm"). A `profiles` row is created automatically. To make yourself admin,
run in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@email.com';
```

## 5. Run it

```bash
npm install   # already done
npm run dev   # http://localhost:3000
```

You'll be redirected to `/login`; sign in with the user from step 4.

## Deploy (Vercel)

Import the repo in Vercel, set the same three env vars in **Project Settings → Environment
Variables**, and deploy. The build is already verified (`npm run build`).

## What's next (not in v1)

`src/lib/connectors/` is the seam for pulling data directly from the source apps later
(Stepping Stone / Neon, Ashley Stone Homes / Supabase, Brett Mulkey IT / Zoho). Every
transaction already records `(source, external_id)` behind a unique index, so a future sync
upserts idempotently with **no schema change**.
