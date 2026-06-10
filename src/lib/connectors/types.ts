import type { Direction } from "@/lib/types";

/**
 * A row ready to upsert into `transactions`. Connectors map their source
 * system's records into this shape. `source` + `external_id` form the
 * idempotency key (partial unique index), so re-running a sync upserts
 * rather than duplicating.
 */
export interface TransactionUpsert {
  entity_id: string;
  occurred_on: string; // YYYY-MM-DD
  direction: Direction;
  amount: number; // always >= 0
  category_id?: string | null;
  description?: string | null;
  counterparty?: string | null;
  method?: string | null;
  source: string; // connector slug, e.g. 'ss_sle'
  external_id: string; // the source system's row id
}

/**
 * A pluggable data source that pulls income/expense rows from one of Brett's
 * apps (or a third-party export) and maps them into transactions. Implementations
 * live alongside this file (e.g. `ss_sle.ts`, `ashley_stone_homes.ts`). None are
 * wired up in v1 — the dashboard runs entirely on manual + CSV data for now.
 */
export interface Connector {
  /** Matches `entities.slug` so the runner knows which entity to attribute rows to. */
  slug: string;
  /** Stored in `transactions.source`. */
  source: string;
  /** Human label for the sync UI. */
  label: string;
  /** Pull raw rows changed since the given cursor (ISO timestamp), newest first. */
  fetchSince(cursor: string | null): Promise<unknown[]>;
  /** Map one raw row into an upsertable transaction. */
  map(row: unknown): TransactionUpsert;
}
