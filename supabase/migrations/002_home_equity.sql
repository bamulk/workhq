-- Home values (pulled from RentCast) and hand-entered mortgages for rental houses.
-- Run once in the Supabase SQL editor. Safe to re-run.

create table if not exists public.home_valuations (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  value numeric(14,2) not null check (value >= 0),
  value_low numeric(14,2),
  value_high numeric(14,2),
  source text not null default 'rentcast',
  details jsonb,
  fetched_at timestamptz not null default now()
);
create index if not exists home_valuations_entity_fetched_idx
  on public.home_valuations (entity_id, fetched_at desc);

create table if not exists public.mortgages (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  lender text,
  balance numeric(14,2) not null check (balance >= 0),
  balance_as_of date not null default current_date,
  interest_rate numeric(6,3) check (interest_rate >= 0),   -- annual %, e.g. 6.125
  monthly_payment numeric(12,2) check (monthly_payment >= 0), -- principal + interest only
  payoff_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mortgages_entity_idx on public.mortgages (entity_id);

drop trigger if exists mortgages_touch_updated_at on public.mortgages;
create trigger mortgages_touch_updated_at
  before update on public.mortgages
  for each row execute function public.touch_updated_at();

alter table public.home_valuations enable row level security;
alter table public.mortgages enable row level security;

do $$
declare t text;
begin
  foreach t in array array['home_valuations','mortgages'] loop
    execute format('drop policy if exists %I on public.%I', t || '_authed_all', t);
    execute format(
      'create policy %I on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      t || '_authed_all', t
    );
  end loop;
end $$;
