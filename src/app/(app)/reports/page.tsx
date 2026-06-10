import Link from "next/link";
import { Download } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, LinkButton } from "@/components/ui";
import { formatSigned, netTone } from "@/lib/format";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

interface FlowRow {
  entity_id: string;
  signed_amount: number;
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
    supabase.from("transactions").select("entity_id, signed_amount, occurred_on").gte("occurred_on", since),
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
        subtitle="Net cash flow by entity, last 12 months"
        actions={
          <LinkButton href="/api/export/csv" variant="secondary">
            <Download size={14} /> Export CSV
          </LinkButton>
        }
      />

      {entities.length === 0 ? (
        <EmptyState title="No entities yet" description="Add entities and transactions to see reports." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-2.5 font-medium sticky left-0 bg-white dark:bg-slate-900">Entity</th>
                {months.map((m) => (
                  <th key={m.key} className="p-2.5 font-medium text-right whitespace-nowrap">{m.label}</th>
                ))}
                <th className="p-2.5 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {entities.map((e) => {
                const total = entityTotal(e.id);
                return (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 sticky left-0 bg-white dark:bg-slate-900">
                      <Link href={`/entities/${e.id}`} className="hover:underline">{e.name}</Link>
                    </td>
                    {months.map((m) => {
                      const v = matrix.get(e.id)?.get(m.key);
                      return (
                        <td key={m.key} className={`p-2.5 text-right whitespace-nowrap ${v ? netTone(v) : "text-slate-300 dark:text-slate-600"}`}>
                          {v ? formatSigned(v) : "·"}
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
              <tr className="border-t border-slate-200 dark:border-slate-700 font-semibold">
                <td className="p-2.5 sticky left-0 bg-white dark:bg-slate-900">All entities</td>
                {months.map((m) => {
                  const v = monthTotals.get(m.key) ?? 0;
                  return (
                    <td key={m.key} className={`p-2.5 text-right whitespace-nowrap ${netTone(v)}`}>
                      {v ? formatSigned(v) : "·"}
                    </td>
                  );
                })}
                <td className={`p-2.5 text-right whitespace-nowrap ${netTone(grandTotal)}`}>
                  {formatSigned(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}
