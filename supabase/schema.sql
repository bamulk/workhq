-- Finances — schema. Run in the Supabase SQL editor (or via MCP apply_migration).
-- Consolidates money-in / money-out across businesses + rental houses.

create extension if not exists "pgcrypto";

-- ============ profiles (app users) ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ entities (businesses + rental houses) ============
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('business','rental')),
  subtype text,                       -- 'it','sober_living','real_estate', or null
  slug text not null unique,          -- stable key for future connectors
  address text,                       -- mainly for rental houses
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entities_sort_idx on public.entities (archived, sort_order);

-- ============ categories (income/expense buckets) ============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('income','expense')),
  applies_to text not null default 'any' check (applies_to in ('any','business','rental')),
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============ import_batches (CSV import tracking + undo) ============
-- Declared before transactions because transactions references it.
create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  source text not null default 'csv',
  filename text,
  column_mapping jsonb,
  row_count int not null default 0,
  inserted_count int not null default 0,
  skipped_count int not null default 0,
  status text not null default 'committed' check (status in ('preview','committed','reverted')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index if not exists import_batches_entity_idx on public.import_batches (entity_id, created_at desc);

-- ============ transactions (the core ledger) ============
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  occurred_on date not null,
  direction text not null check (direction in ('in','out')),
  amount numeric(14,2) not null check (amount >= 0),
  signed_amount numeric(14,2) generated always as
    (case when direction = 'in' then amount else -amount end) stored,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  counterparty text,
  method text,                        -- 'zelle','venmo','bank','check','card','cash'
  source text not null default 'manual',
  external_id text,                   -- provider/connector row id for idempotent sync
  import_batch_id uuid references public.import_batches(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_entity_date_idx on public.transactions (entity_id, occurred_on desc);
create index if not exists transactions_date_idx on public.transactions (occurred_on);
create index if not exists transactions_category_idx on public.transactions (category_id);
create index if not exists transactions_batch_idx on public.transactions (import_batch_id);
-- Idempotent sync: synced rows dedupe on (source, external_id). Postgres
-- treats NULLs as distinct, so manual rows (external_id null) coexist freely.
-- A regular (non-partial) index so `on conflict (source, external_id)` works
-- from PostgREST/supabase-js for future connector upserts.
drop index if exists public.transactions_source_extid_uq;
create unique index if not exists transactions_source_extid_uq
  on public.transactions (source, external_id);

-- ============ updated_at trigger ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists entities_touch_updated_at on public.entities;
create trigger entities_touch_updated_at
  before update on public.entities
  for each row execute procedure public.touch_updated_at();

drop trigger if exists transactions_touch_updated_at on public.transactions;
create trigger transactions_touch_updated_at
  before update on public.transactions
  for each row execute procedure public.touch_updated_at();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.entities enable row level security;
alter table public.categories enable row level security;
alter table public.import_batches enable row level security;
alter table public.transactions enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles
drop policy if exists "profiles_select_all_authed" on public.profiles;
create policy "profiles_select_all_authed" on public.profiles
  for select using (auth.role() = 'authenticated');
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_admin());
drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

-- All data tables: any authenticated user can CRUD (single trusted owner).
do $$
declare t text;
begin
  foreach t in array array['entities','categories','import_batches','transactions'] loop
    execute format('drop policy if exists %I on public.%I', t || '_authed_all', t);
    execute format(
      'create policy %I on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      t || '_authed_all', t
    );
  end loop;
end $$;

-- ============ seed: entities (3 businesses + 5 rental houses) ============
insert into public.entities (name, type, subtype, slug, sort_order) values
  ('Brett Mulkey IT',            'business', 'it',          'brett_mulkey_it',     10),
  ('Stepping Stone Sober Living','business', 'sober_living','ss_sle',              20),
  ('Ashley Stone Homes',         'business', 'real_estate', 'ashley_stone_homes',  30)
on conflict (slug) do nothing;

insert into public.entities (name, type, subtype, slug, sort_order) values
  ('Rental House 1', 'rental', 'rental', 'rental_house_1', 110),
  ('Rental House 2', 'rental', 'rental', 'rental_house_2', 120),
  ('Rental House 3', 'rental', 'rental', 'rental_house_3', 130),
  ('Rental House 4', 'rental', 'rental', 'rental_house_4', 140),
  ('Rental House 5', 'rental', 'rental', 'rental_house_5', 150)
on conflict (slug) do nothing;

-- ============ seed: categories ============
insert into public.categories (name, kind, applies_to, slug, sort_order) values
  -- income
  ('Rent',             'income',  'rental',   'rent',             10),
  ('Business Income',  'income',  'business', 'business_income',  20),
  ('Commission',       'income',  'business', 'commission',       30),
  ('Guest Rent',       'income',  'business', 'guest_rent',       40),
  ('Other Income',     'income',  'any',      'other_income',     90),
  -- rental expenses
  ('Mortgage',         'expense', 'rental',   'mortgage',         110),
  ('Property Tax',     'expense', 'rental',   'property_tax',     120),
  ('Insurance',        'expense', 'rental',   'insurance',        130),
  ('Repairs',          'expense', 'rental',   'repairs',          140),
  ('Management',       'expense', 'rental',   'management',       150),
  ('Utilities',        'expense', 'rental',   'utilities',        160),
  ('HOA',              'expense', 'rental',   'hoa',              170),
  -- business expenses
  ('Payroll',          'expense', 'business', 'payroll',          210),
  ('Software',         'expense', 'business', 'software',         220),
  ('Supplies',         'expense', 'business', 'supplies',         230),
  ('Fees',             'expense', 'business', 'fees',             240),
  ('Business Expense', 'expense', 'business', 'business_expense', 250),
  ('Other Expense',    'expense', 'any',      'other_expense',    290)
on conflict (slug) do nothing;
