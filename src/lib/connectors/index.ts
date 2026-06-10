import type { Connector } from "./types";

/**
 * Registry of live sync connectors, keyed by entity slug.
 *
 * v1 is intentionally EMPTY — all data comes in via manual entry + CSV import.
 * This is the seam where future direct-pull integrations plug in:
 *
 *   - `ss_sle`              → Stepping Stone Sober Living (Neon Postgres via `pg`)
 *   - `ashley_stone_homes`  → Ashley Stone Homes (Supabase, read-only key)
 *   - `brett_mulkey_it`     → once that app exists (Zoho export in the meantime)
 *
 * Because every transaction already records `(source, external_id)` behind a
 * partial unique index, turning a connector on later needs NO schema change —
 * just upsert with `onConflict: 'source,external_id'`.
 */
export const connectors: Record<string, Connector> = {};

export function getConnector(slug: string): Connector | undefined {
  return connectors[slug];
}
