# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brett, who owns and runs three businesses (Brett Mulkey IT, Stepping Stone Sober Living, Ashley Stone Homes) and five rental houses, plus his partner, who also signs in. Both are owners checking their own money, not accountants. Mostly used on a phone, in short check-ins.

## Product Purpose

One place that answers "am I up or down?" across every business and rental for a period, then lets you see which entity is driving it. Success: open the app on a phone and know the overall net within a second, with each entity's in / out / net one tap away.

## Positioning

A private, owner's-eye consolidation of several unrelated operations (IT services, sober living, real estate, rentals) into one net cash-flow number. It is not bookkeeping software: no accounts, ledgers, or tax categories beyond simple income/expense buckets.

## Operating Context

- Primary job: check the numbers. Entering transactions and importing CSVs are secondary.
- Data arrives by manual entry and CSV import (column mapping, duplicate detection, batch undo). Future: direct pulls from the source apps (Stepping Stone on Neon, Ashley Stone Homes on Supabase, Brett Mulkey IT on Zoho) via `(source, external_id)` upserts.
- Period selection matters: this month (default), year to date, last 12 months, all time, custom.

## Capabilities and Constraints

- Entities: businesses and rental houses; can be archived or deleted.
- Transactions: direction (in/out), positive amount, entity, category, date, payer/payee, method, description, notes.
- Reports: 12-month net by entity; CSV export.
- Access is invite-only; accounts are created in the Supabase dashboard. Roles: admin, member.
- Stack: Next.js 16, Supabase (Postgres + Auth + RLS), Tailwind v4, deployed on Vercel. Supabase free tier pauses the project after inactivity.

## Brand Commitments

Name: "Finances". No other binding brand assets.

## Evidence on Hand

Real entity names are seeded (8 entities, 18 categories). No real transactions yet; do not invent figures presented as real.

## Product Principles

1. The overall net comes first; everything else is a drill-down.
2. Phone-first: one-handed, glanceable, no horizontal scrolling for core answers.
3. Plain language over accounting terms ("money in / money out", not "credits / debits").
4. Fewer screens, fewer choices: secondary tasks (import, entity admin) stay reachable but out of the way.
