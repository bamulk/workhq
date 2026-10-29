import type { HomeValuation, Mortgage } from "@/lib/types";

/**
 * A mortgage balance rolled forward from its last known figure: each whole
 * month since `balance_as_of` adds a month's interest and takes off one
 * payment. Without a rate and payment the entered balance is returned as is.
 */
export function estimateBalance(m: Mortgage, today = new Date()): number {
  const balance = Number(m.balance);
  const rate = m.interest_rate == null ? null : Number(m.interest_rate);
  const payment = m.monthly_payment == null ? null : Number(m.monthly_payment);
  if (rate == null || payment == null || payment <= 0) return balance;

  const [y, mo, d] = m.balance_as_of.split("-").map(Number);
  let months = (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - mo);
  if (today.getDate() < d) months -= 1;

  const monthlyRate = rate / 100 / 12;
  let b = balance;
  for (let i = 0; i < months && b > 0; i++) {
    b = b * (1 + monthlyRate) - payment;
  }
  return Math.max(0, Math.round(b * 100) / 100);
}

export interface EquitySummary {
  value: number | null; // null when the house has no valuation yet
  owed: number;
  equity: number | null;
  mortgageCount: number;
}

export function equityFor(valuation: HomeValuation | undefined, mortgages: Mortgage[]): EquitySummary {
  const owed = mortgages.reduce((acc, m) => acc + estimateBalance(m), 0);
  const value = valuation ? Number(valuation.value) : null;
  return {
    value,
    owed,
    equity: value == null ? null : value - owed,
    mortgageCount: mortgages.length,
  };
}

/** Newest valuation per entity, from rows ordered newest first. */
export function latestValuations(rows: HomeValuation[]): Map<string, HomeValuation> {
  const out = new Map<string, HomeValuation>();
  for (const r of rows) if (!out.has(r.entity_id)) out.set(r.entity_id, r);
  return out;
}

/** RentCast's free tier allows 50 lookups a month; one refresh per house per week keeps well inside it. */
export const REFRESH_INTERVAL_DAYS = 7;

export function nextRefreshAt(v: HomeValuation | undefined): Date | null {
  if (!v) return null;
  const next = new Date(v.fetched_at);
  next.setDate(next.getDate() + REFRESH_INTERVAL_DAYS);
  return next > new Date() ? next : null;
}
