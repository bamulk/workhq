# This is NOT the Next.js you know

This project uses Next.js 16, which has breaking changes — APIs, conventions, and file
structure may differ from older training data. Notably the old `middleware.ts` is now
`src/proxy.ts` (exporting `proxy`). When in doubt, read the guides in
`node_modules/next/dist/docs/` before writing framework code, and mirror the patterns in
the sibling `../Stone Homes` project, which targets the same Next 16 + Supabase stack.

# What this app is

**Finances** — a consolidation dashboard showing money-in vs money-out across several
entities Brett owns/runs: 3 businesses (Brett Mulkey IT, Stepping Stone Sober Living,
Ashley Stone Homes) and 5 rental houses. v1 gets data in via **manual entry + CSV import**;
the schema is built so a future sync layer (`src/lib/connectors/`) can pull directly from
the source apps with no schema change — every transaction carries `(source, external_id)`
behind a partial unique index for idempotent upserts.

## Core model
- `entities` — the businesses + rental houses (type: 'business' | 'rental').
- `categories` — income/expense buckets (kind: 'income' | 'expense').
- `transactions` — `direction` ('in' | 'out') + positive `amount`, plus a generated
  `signed_amount` column. Net cash flow = `sum(signed_amount)`.
- `import_batches` — tracks each CSV import for undo.

## Conventions (mirror Stone Homes)
- Supabase clients in `src/lib/supabase/{client,server,admin}.ts`; auth guards in
  `src/lib/auth.ts` (`requireUser`, `requireAdmin`).
- Route protection in `src/app/(app)/layout.tsx`; `src/proxy.ts` redirects to `/login`.
- Server actions colocated in `actions.ts`, guarded by `requireUser()`.
- Pages are server components (`export const dynamic = "force-dynamic"`); forms are
  `"use client"` components receiving the action as a prop, submitting via `<SubmitButton>`.
- UI primitives in `src/components/ui.tsx`; Tailwind v4 tokens in `src/app/globals.css`.
