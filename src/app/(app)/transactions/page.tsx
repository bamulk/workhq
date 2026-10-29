import Link from "next/link";
import { Plus, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, LinkButton, EmptyState, Select, Field, Button, Section } from "@/components/ui";
import KeyFigures from "@/components/KeyFigures";
import PeriodTabs from "@/components/PeriodTabs";
import TransactionList from "@/components/TransactionList";
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

export default async function ActivityPage({
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
  const activeFilters = [sp.entity, sp.category, sp.direction].filter(Boolean).length;
  const entityName = entityList.find((e) => e.id === sp.entity)?.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        actions={
          <span className="hidden md:block">
            <LinkButton href="/transactions/new">
              <Plus size={16} /> Add transaction
            </LinkButton>
          </span>
        }
      />

      <PeriodTabs
        current={range.key}
        from={sp.from}
        to={sp.to}
        basePath="/transactions"
        keep={{ entity: sp.entity, category: sp.category, direction: sp.direction }}
      />

      {/* Filters — plain GET form, works without JS */}
      <details open={activeFilters > 0}>
        <summary className="inline-flex items-center gap-2 h-9 px-3 rounded-[4px] border border-rule bg-surface text-[13px] font-semibold hover:border-ink">
          <SlidersHorizontal size={14} />
          Filter{activeFilters > 0 ? ` · ${activeFilters} on` : ""}
        </summary>
        <form className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          {sp.range && <input type="hidden" name="range" value={sp.range} />}
          {sp.from && <input type="hidden" name="from" value={sp.from} />}
          {sp.to && <input type="hidden" name="to" value={sp.to} />}
          <Field label="Entity">
            <Select name="entity" defaultValue={sp.entity ?? ""}>
              <option value="">All entities</option>
              {entityList.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Direction">
            <Select name="direction" defaultValue={sp.direction ?? ""}>
              <option value="">In and out</option>
              <option value="in">Money in</option>
              <option value="out">Money out</option>
            </Select>
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue={sp.category ?? ""}>
              <option value="">All categories</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <Link href="/transactions" className="inline-flex items-center h-9 px-3 text-[13px] font-semibold text-ink-2 hover:text-ink">
              Clear
            </Link>
            <Button type="submit" size="sm">Apply</Button>
          </div>
        </form>
      </details>

      <KeyFigures summary={summary} label={entityName ? `${entityName}, ${range.label}` : range.label} />

      {rows.length === 0 ? (
        <EmptyState
          title="No transactions"
          description={activeFilters > 0 ? "Nothing matches these filters. Clear them or pick a longer period." : `Nothing recorded for this period yet.`}
          action={<LinkButton href="/transactions/new"><Plus size={16} /> Add transaction</LinkButton>}
        />
      ) : (
        <Section title="Transactions" aside={`${rows.length}${rows.length === 500 ? "+" : ""}`}>
          <TransactionList rows={rows} />
        </Section>
      )}
    </div>
  );
}
