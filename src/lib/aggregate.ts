import type { Direction } from "@/lib/types";

/** Minimal shape needed to roll up cash flow. */
export interface FlowRow {
  entity_id: string;
  amount: number;
  direction: Direction;
  signed_amount: number;
}

export interface FlowSummary {
  moneyIn: number;
  moneyOut: number;
  net: number;
  count: number;
}

const EMPTY: FlowSummary = { moneyIn: 0, moneyOut: 0, net: 0, count: 0 };

/** Sum money-in, money-out, and net over a set of rows. */
export function summarize(rows: FlowRow[]): FlowSummary {
  return rows.reduce<FlowSummary>(
    (acc, r) => ({
      moneyIn: acc.moneyIn + (r.direction === "in" ? Number(r.amount) : 0),
      moneyOut: acc.moneyOut + (r.direction === "out" ? Number(r.amount) : 0),
      net: acc.net + Number(r.signed_amount),
      count: acc.count + 1,
    }),
    { ...EMPTY }
  );
}

/** Group rows by entity_id and summarize each group. */
export function summarizeByEntity(rows: FlowRow[]): Map<string, FlowSummary> {
  const byEntity = new Map<string, FlowRow[]>();
  for (const r of rows) {
    const list = byEntity.get(r.entity_id);
    if (list) list.push(r);
    else byEntity.set(r.entity_id, [r]);
  }
  const out = new Map<string, FlowSummary>();
  for (const [id, list] of byEntity) out.set(id, summarize(list));
  return out;
}

export const emptySummary = (): FlowSummary => ({ ...EMPTY });
