import Link from "next/link";
import { Plus, Upload, Building2, Home, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, LinkButton, EmptyState } from "@/components/ui";
import MoneyFlowCards from "@/components/MoneyFlowCards";
import NetBar from "@/components/NetBar";
import DateRangePicker from "@/components/DateRangePicker";
import { formatSigned, netTone } from "@/lib/format";
import { resolveRange } from "@/lib/ranges";
import { summarize, summarizeByEntity, emptySummary, type FlowRow, type FlowSummary } from "@/lib/aggregate";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

function EntityCard({ e, summary }: { e: Entity; summary: FlowSummary }) {
  return (
    <Link href={`/entities/${e.id}`}>
      <Card className="p-4 hover:border-brand/40 h-full space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium truncate">{e.name}</span>
          <span className={`font-semibold text-sm ${netTone(summary.net)}`}>{formatSigned(summary.net)}</span>
        </div>
        <NetBar moneyIn={summary.moneyIn} moneyOut={summary.moneyOut} />
      </Card>
    </Link>
  );
}

function EntitySection({
  title,
  icon: Icon,
  list,
  byEntity,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  list: Entity[];
  byEntity: Map<string, FlowSummary>;
}) {
  if (list.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Icon size={15} className="text-brand" /> {title}
        </h2>
        <Link href="/entities" className="text-xs text-brand hover:underline inline-flex items-center gap-1">
          Manage <ArrowRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((e) => (
          <EntityCard key={e.id} e={e} summary={byEntity.get(e.id) ?? emptySummary()} />
        ))}
      </div>
    </div>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);
  const supabase = await createClient();

  let txnQuery = supabase
    .from("transactions")
    .select("entity_id, amount, direction, signed_amount");
  if (range.start) txnQuery = txnQuery.gte("occurred_on", range.start);
  if (range.end) txnQuery = txnQuery.lte("occurred_on", range.end);

  const [{ data: entityRows }, { data: txnRows }] = await Promise.all([
    supabase.from("entities").select("*").eq("archived", false).order("sort_order"),
    txnQuery,
  ]);

  const entities = (entityRows ?? []) as Entity[];
  const rows = (txnRows ?? []) as FlowRow[];
  const consolidated = summarize(rows);
  const byEntity = summarizeByEntity(rows);

  const businesses = entities.filter((e) => e.type === "business");
  const rentals = entities.filter((e) => e.type === "rental");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Money in vs money out · {range.label}
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/transactions/new" variant="secondary"><Plus size={14} /> Add</LinkButton>
          <LinkButton href="/import" variant="secondary"><Upload size={14} /> Import</LinkButton>
        </div>
      </div>

      <DateRangePicker current={range.key} from={sp.from} to={sp.to} />

      <MoneyFlowCards summary={consolidated} />

      {entities.length === 0 ? (
        <EmptyState
          title="No entities yet"
          description="Add your businesses and rental houses, then record or import their income and expenses."
          action={<LinkButton href="/entities/new"><Plus size={14} /> Add your first entity</LinkButton>}
        />
      ) : (
        <>
          <EntitySection title="Businesses" icon={Building2} list={businesses} byEntity={byEntity} />
          <EntitySection title="Rental houses" icon={Home} list={rentals} byEntity={byEntity} />
        </>
      )}
    </div>
  );
}
