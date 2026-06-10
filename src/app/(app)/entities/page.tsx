import Link from "next/link";
import { Plus, Building2, Home, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, LinkButton, Card, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatSigned, netTone } from "@/lib/format";
import { summarizeByEntity, emptySummary, type FlowRow, type FlowSummary } from "@/lib/aggregate";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

function EntityCard({ e, summary }: { e: Entity; summary: FlowSummary }) {
  return (
    <Link href={`/entities/${e.id}`}>
      <Card className="p-4 hover:border-brand/40 h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium truncate">{e.name}</div>
            {e.address && <div className="text-xs text-slate-400 truncate">{e.address}</div>}
          </div>
          <Badge tone={e.type}>{e.type}</Badge>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-slate-400">Net (all time)</div>
            <div className={`text-lg font-semibold ${netTone(summary.net)}`}>
              {formatSigned(summary.net)}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>In {formatCurrency(summary.moneyIn)}</div>
            <div>Out {formatCurrency(summary.moneyOut)}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EntityGroup({
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
      <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Icon size={15} className="text-brand" /> {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((e) => (
          <EntityCard key={e.id} e={e} summary={byEntity.get(e.id) ?? emptySummary()} />
        ))}
      </div>
    </div>
  );
}

export default async function EntitiesPage() {
  const supabase = await createClient();
  const [{ data: entityRows }, { data: txnRows }] = await Promise.all([
    supabase.from("entities").select("*").order("sort_order"),
    supabase.from("transactions").select("entity_id, amount, direction, signed_amount"),
  ]);

  const entities = (entityRows ?? []) as Entity[];
  const byEntity = summarizeByEntity((txnRows ?? []) as FlowRow[]);

  const businesses = entities.filter((e) => e.type === "business" && !e.archived);
  const rentals = entities.filter((e) => e.type === "rental" && !e.archived);
  const archived = entities.filter((e) => e.archived);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entities"
        subtitle={`${businesses.length} businesses · ${rentals.length} rental houses`}
        actions={
          <LinkButton href="/entities/new">
            <Plus size={14} /> New entity
          </LinkButton>
        }
      />

      {entities.length === 0 ? (
        <EmptyState
          title="No entities yet"
          description="Add a business or rental house to start tracking its money in and out."
          action={
            <LinkButton href="/entities/new">
              <Plus size={14} /> New entity
            </LinkButton>
          }
        />
      ) : (
        <>
          <EntityGroup title="Businesses" icon={Building2} list={businesses} byEntity={byEntity} />
          <EntityGroup title="Rental houses" icon={Home} list={rentals} byEntity={byEntity} />
          {archived.length > 0 && (
            <div className="space-y-2 pt-2">
              <h2 className="text-sm font-medium text-slate-400">Archived</h2>
              <div className="flex flex-wrap gap-2">
                {archived.map((e) => (
                  <Link
                    key={e.id}
                    href={`/entities/${e.id}`}
                    className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1"
                  >
                    {e.name} <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
