import Link from "next/link";
import { Plus, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, LinkButton, Card, Badge, EmptyState, Select, Input, Button } from "@/components/ui";
import MoneyFlowCards from "@/components/MoneyFlowCards";
import { formatDate, formatSigned, netTone } from "@/lib/format";
import { resolveRange } from "@/lib/ranges";
import { summarize, type FlowRow } from "@/lib/aggregate";
import type { Entity, Category, TransactionWithJoins } from "@/lib/types";

export const dynamic = "force-dynamic";

type SP = {
  entity?: string;
  category?: string;
  direction?: string;
  range?: string;
  from?: string;
  to?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const range = resolveRange(sp);

  const [{ data: entities }, { data: categories }] = await Promise.all([
    supabase.from("entities").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  let query = supabase
    .from("transactions")
    .select("*, entities(name, type), categories(name, kind)")
    .order("occurred_on", { ascending: false })
    .limit(500);

  if (range.start) query = query.gte("occurred_on", range.start);
  if (range.end) query = query.lte("occurred_on", range.end);
  if (sp.entity) query = query.eq("entity_id", sp.entity);
  if (sp.category) query = query.eq("category_id", sp.category);
  if (sp.direction === "in" || sp.direction === "out") query = query.eq("direction", sp.direction);

  const { data } = await query;
  const rows = (data ?? []) as TransactionWithJoins[];
  const summary = summarize(rows as unknown as FlowRow[]);

  const entityList = (entities ?? []) as Entity[];
  const categoryList = (categories ?? []) as Category[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle={`${rows.length} in ${range.label}`}
        actions={
          <LinkButton href="/transactions/new">
            <Plus size={14} /> New transaction
          </LinkButton>
        }
      />

      {/* Filters — plain GET form, works without JS */}
      <Card className="p-4">
        <form className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Entity</span>
            <Select name="entity" defaultValue={sp.entity ?? ""}>
              <option value="">All</option>
              {entityList.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Direction</span>
            <Select name="direction" defaultValue={sp.direction ?? ""}>
              <option value="">All</option>
              <option value="in">Money in</option>
              <option value="out">Money out</option>
            </Select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Category</span>
            <Select name="category" defaultValue={sp.category ?? ""}>
              <option value="">All</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Range</span>
            <Select name="range" defaultValue={sp.range ?? "month"}>
              <option value="month">This month</option>
              <option value="ytd">Year to date</option>
              <option value="last12">Last 12 months</option>
              <option value="all">All time</option>
              <option value="custom">Custom</option>
            </Select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">From</span>
            <Input type="date" name="from" defaultValue={sp.from ?? ""} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">To</span>
            <Input type="date" name="to" defaultValue={sp.to ?? ""} />
          </label>
          <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex justify-end gap-2">
            <Link href="/transactions" className="text-sm text-slate-500 hover:underline self-center">Reset</Link>
            <Button type="submit" size="sm">
              <Filter size={14} /> Apply
            </Button>
          </div>
        </form>
      </Card>

      <MoneyFlowCards summary={summary} label={range.label} />

      {rows.length === 0 ? (
        <EmptyState
          title="No transactions"
          description="Nothing matches these filters. Add one or widen the date range."
          action={<LinkButton href="/transactions/new"><Plus size={14} /> New transaction</LinkButton>}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Entity</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {formatDate(t.occurred_on)}
                  </td>
                  <td className="p-3">
                    {t.entities ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Badge tone={t.entities.type}>{t.entities.type === "business" ? "biz" : "rental"}</Badge>
                        <span className="truncate max-w-[140px]">{t.entities.name}</span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-3">
                    <Link href={`/transactions/${t.id}`} className="hover:underline">
                      {t.description || t.counterparty || "—"}
                    </Link>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{t.categories?.name ?? "—"}</td>
                  <td className={`p-3 text-right whitespace-nowrap font-medium ${netTone(t.signed_amount)}`}>
                    {formatSigned(t.signed_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
