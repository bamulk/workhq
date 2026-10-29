import Link from "next/link";
import { Plus, Upload, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton, EmptyState, Section } from "@/components/ui";
import KeyFigures from "@/components/KeyFigures";
import EntityRanking from "@/components/EntityRanking";
import PeriodTabs from "@/components/PeriodTabs";
import EquityFigures from "@/components/EquityFigures";
import { equityFor, latestValuations } from "@/lib/equity";
import { formatCurrency, formatSigned, netTone } from "@/lib/format";
import { resolveRange } from "@/lib/ranges";
import { summarize, summarizeByEntity, type FlowRow } from "@/lib/aggregate";
import type { Entity, HomeValuation, Mortgage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Overview({
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

  const [{ data: entityRows }, { data: txnRows }, { data: valuationRows }, { data: mortgageRows }] = await Promise.all([
    supabase.from("entities").select("*").eq("archived", false).order("sort_order"),
    txnQuery,
    supabase.from("home_valuations").select("*").order("fetched_at", { ascending: false }),
    supabase.from("mortgages").select("*"),
  ]);

  const allEntities = (entityRows ?? []) as Entity[];
  // A primary home is tracked for equity only; it never counts toward cash flow.
  const entities = allEntities.filter((e) => e.type !== "home");
  const cashFlowIds = new Set(entities.map((e) => e.id));
  const rows = ((txnRows ?? []) as FlowRow[]).filter((r) => cashFlowIds.has(r.entity_id));
  const consolidated = summarize(rows);
  const byEntity = summarizeByEntity(rows);

  // Real estate equity: latest value per house minus estimated mortgage balances.
  const properties = allEntities.filter((e) => e.type === "rental" || e.type === "home");
  const valuations = latestValuations((valuationRows ?? []) as HomeValuation[]);
  const mortgages = (mortgageRows ?? []) as Mortgage[];
  const perHouse = properties.map((e) => ({
    e,
    ...equityFor(valuations.get(e.id), mortgages.filter((m) => m.entity_id === e.id)),
  }));
  const valued = perHouse.filter((h) => h.value != null);
  const totalValue = valued.reduce((acc, h) => acc + (h.value ?? 0), 0);
  const totalOwed = perHouse.reduce((acc, h) => acc + h.owed, 0);

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Overview</h1>
      <PeriodTabs current={range.key} from={sp.from} to={sp.to} />

      <KeyFigures summary={consolidated} label={range.label} />

      {entities.length === 0 ? (
        <EmptyState
          title="No businesses or rentals yet"
          description="Add one, then record or import its money in and out."
          action={<LinkButton href="/entities/new"><Plus size={16} /> Add a business or rental</LinkButton>}
        />
      ) : (
        <Section title="By entity" aside={`${entities.length} tracked`}>
          {consolidated.count === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-rule">
              <p className="text-ink-2">
                {range.key === "all"
                  ? "Nothing recorded yet."
                  : range.key === "last12"
                    ? "Nothing recorded in the last 12 months."
                    : `Nothing recorded for ${range.label} yet.`}
              </p>
              <div className="flex gap-2">
                <LinkButton href="/transactions/new" size="sm"><Plus size={14} /> Add</LinkButton>
                <LinkButton href="/import" size="sm" variant="secondary"><Upload size={14} /> Import CSV</LinkButton>
              </div>
            </div>
          )}
          <EntityRanking entities={entities} byEntity={byEntity} />
        </Section>
      )}

      {properties.length > 0 && (
        <Section title="Real estate equity" aside={`${valued.length} of ${properties.length} valued`}>
          <EquityFigures
            value={valued.length ? totalValue : null}
            owed={totalOwed}
            equity={valued.length ? totalValue - totalOwed : null}
          />
          <ul className="divide-y divide-rule border-b border-rule">
            {perHouse.map((h) => (
              <li key={h.e.id}>
                <Link href={`/entities/${h.e.id}`} className="flex items-center gap-4 py-3 hover:bg-hover">
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{h.e.name}</span>
                    <span className="block text-[13px] text-ink-3 truncate">
                      {[
                        h.e.type === "home" ? "Primary home" : "Rental",
                        h.value == null ? "no value yet" : `${formatCurrency(h.value)} value`,
                        h.owed > 0 ? `${formatCurrency(h.owed)} owed` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className={`shrink-0 font-semibold ${h.equity == null ? "text-ink-3 font-normal" : netTone(h.equity)}`}>
                    {h.equity == null ? "—" : formatSigned(h.equity)}
                  </span>
                  <ChevronRight size={16} className="text-ink-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
