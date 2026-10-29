-- Allow a "home" entity type: a primary residence tracked for equity only,
-- kept out of cash flow. Run once in the Supabase SQL editor. Safe to re-run.
alter table public.entities drop constraint if exists entities_type_check;
alter table public.entities
  add constraint entities_type_check check (type in ('business','rental','home'));
