import { Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton, EmptyState, Section } from "@/components/ui";
import KeyFigures from "@/components/KeyFigures";
import EntityRanking from "@/components/EntityRanking";
import PeriodTabs from "@/components/PeriodTabs";
import { resolveRange } from "@/lib/ranges";
import { summarize, summarizeByEntity, type FlowRow } from "@/lib/aggregate";
import type { Entity } from "@/lib/types";

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

  const [{ data: entityRows }, { data: txnRows }] = await Promise.all([
    supabase.from("entities").select("*").eq("archived", false).order("sort_order"),
    txnQuery,
  ]);

  const entities = (entityRows ?? []) as Entity[];
  const rows = (txnRows ?? []) as FlowRow[];
  const consolidated = summarize(rows);
  const byEntity = summarizeByEntity(rows);

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
    </div>
  );
}
