import Link from "next/link";
import { Download } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, LinkButton, Section } from "@/components/ui";
import KeyFigures from "@/components/KeyFigures";
import EntityRanking from "@/components/EntityRanking";
import { summarize, summarizeByEntity, type FlowRow as SummaryRow } from "@/lib/aggregate";
import { formatSigned, netTone } from "@/lib/format";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

interface FlowRow extends SummaryRow {
  occurred_on: string;
}

export default async function ReportsPage() {
  const supabase = await createClient();

  // Last 12 months, oldest → newest.
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = startOfMonth(subMonths(now, 11 - i));
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM") };
  });
  const since = months[0].key + "-01";

  const [{ data: entityRows }, { data: txnRows }] = await Promise.all([
    supabase.from("entities").select("*").eq("archived", false).order("sort_order"),
    supabase.from("transactions").select("entity_id, amount, direction, signed_amount, occurred_on").gte("occurred_on", since),
  ]);

  const entities = (entityRows ?? []) as Entity[];
  const rows = (txnRows ?? []) as FlowRow[];

  // matrix[entityId][monthKey] = net
  const matrix = new Map<string, Map<string, number>>();
  const monthTotals = new Map<string, number>();
  for (const r of rows) {
    const mk = r.occurred_on.slice(0, 7);
    if (!matrix.has(r.entity_id)) matrix.set(r.entity_id, new Map());
    const em = matrix.get(r.entity_id)!;
    em.set(mk, (em.get(mk) ?? 0) + Number(r.signed_amount));
    monthTotals.set(mk, (monthTotals.get(mk) ?? 0) + Number(r.signed_amount));
  }
  const entityTotal = (id: string) =>
    months.reduce((acc, m) => acc + (matrix.get(id)?.get(m.key) ?? 0), 0);
  const grandTotal = months.reduce((acc, m) => acc + (monthTotals.get(m.key) ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Net by entity, month by month"
        actions={
          <LinkButton href="/api/export/csv" variant="secondary" size="sm">
            <Download size={14} /> Export CSV
          </LinkButton>
        }
      />

      {entities.length === 0 ? (
        <EmptyState title="No entities yet" description="Add entities and transactions to see reports." />
      ) : (
        <>
        <KeyFigures summary={summarize(rows)} label="Last 12 months" />
        <Section title="By entity" aside="Last 12 months">
          <EntityRanking entities={entities} byEntity={summarizeByEntity(rows)} />
        </Section>
        <Section title="Month by month">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-[14px] border-b border-rule">
            <thead className="text-left text-[13px] text-ink-3 border-b border-rule">
              <tr>
                <th className="p-2.5 sticky left-0 bg-paper pl-4 sm:pl-0">Entity</th>
                {months.map((m) => (
                  <th key={m.key} className="p-2.5 text-right whitespace-nowrap">{m.label}</th>
                ))}
                <th className="p-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {entities.map((e) => {
                const total = entityTotal(e.id);
                return (
                  <tr key={e.id}>
                    <td className="p-2.5 pl-4 sm:pl-0 sticky left-0 bg-paper max-w-[11rem] truncate">
                      <Link href={`/entities/${e.id}`} className="hover:underline">{e.name}</Link>
                    </td>
                    {months.map((m) => {
                      const v = matrix.get(e.id)?.get(m.key);
                      return (
                        <td key={m.key} className={`p-2.5 text-right whitespace-nowrap ${v ? netTone(v) : "text-ink-3"}`}>
                          {v ? formatSigned(v) : "—"}
                        </td>
                      );
                    })}
                    <td className={`p-2.5 text-right whitespace-nowrap font-semibold ${netTone(total)}`}>
                      {formatSigned(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule-strong font-semibold">
                <td className="p-2.5 pl-4 sm:pl-0 sticky left-0 bg-paper">All entities</td>
                {months.map((m) => {
                  const v = monthTotals.get(m.key) ?? 0;
                  return (
                    <td key={m.key} className={`p-2.5 text-right whitespace-nowrap ${netTone(v)}`}>
                      {v ? formatSigned(v) : "—"}
                    </td>
                  );
                })}
                <td className={`p-2.5 text-right whitespace-nowrap ${netTone(grandTotal)}`}>
                  {formatSigned(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        </Section>
        </>
      )}
    </div>
  );
}
