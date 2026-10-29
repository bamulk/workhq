import { notFound } from "next/navigation";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, LinkButton, Button, Section, EmptyState } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import KeyFigures from "@/components/KeyFigures";
import PeriodTabs from "@/components/PeriodTabs";
import TransactionList from "@/components/TransactionList";
import { titleize } from "@/lib/format";
import { resolveRange } from "@/lib/ranges";
import { summarize, type FlowRow } from "@/lib/aggregate";
import { setEntityArchivedAction, deleteEntityAction } from "../actions";
import type { Entity, TransactionWithJoins } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EntityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const range = resolveRange(sp);
  const supabase = await createClient();

  let txnQuery = supabase
    .from("transactions")
    .select("*, entities(name, type), categories(name, kind)")
    .eq("entity_id", id)
    .order("occurred_on", { ascending: false })
    .limit(200);
  if (range.start) txnQuery = txnQuery.gte("occurred_on", range.start);
  if (range.end) txnQuery = txnQuery.lte("occurred_on", range.end);

  const [{ data: entityRow }, { data: txnRows }] = await Promise.all([
    supabase.from("entities").select("*").eq("id", id).single(),
    txnQuery,
  ]);
  if (!entityRow) notFound();
  const entity = entityRow as Entity;
  const txns = (txnRows ?? []) as TransactionWithJoins[];
  const summary = summarize(txns as unknown as FlowRow[]);

  const archiveAction = setEntityArchivedAction.bind(null, id, !entity.archived);
  const deleteAction = deleteEntityAction.bind(null, id);
  const subtitle = [
    entity.type === "rental" ? "Rental house" : "Business",
    entity.subtype ? titleize(entity.subtype) : null,
    entity.address,
    entity.archived ? "Archived" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={entity.name}
        subtitle={subtitle}
        back={{ href: "/entities", label: "Entities" }}
        actions={
          <>
            <LinkButton href={`/transactions/new?entity=${entity.id}`} size="sm">
              <Plus size={14} /> Add
            </LinkButton>
            <LinkButton href={`/entities/${id}/edit`} variant="secondary" size="sm">
              <Pencil size={14} /> Edit
            </LinkButton>
          </>
        }
      />

      <PeriodTabs current={range.key} from={sp.from} to={sp.to} basePath={`/entities/${id}`} />

      <KeyFigures summary={summary} label={range.label} />

      {txns.length === 0 ? (
        <EmptyState
          title="Nothing recorded"
          description={`No money in or out for ${entity.name} in this period.`}
          action={
            <LinkButton href={`/transactions/new?entity=${entity.id}`}>
              <Plus size={16} /> Add transaction
            </LinkButton>
          }
        />
      ) : (
        <Section title="Transactions" aside={`${txns.length}${txns.length === 200 ? "+" : ""}`}>
          <TransactionList rows={txns} showEntity={false} />
        </Section>
      )}

      <Section title="Manage" className="pt-4">
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <form action={archiveAction}>
            <Button type="submit" variant="secondary" size="sm">
              {entity.archived ? (
                <>
                  <ArchiveRestore size={14} /> Unarchive
                </>
              ) : (
                <>
                  <Archive size={14} /> Archive
                </>
              )}
            </Button>
          </form>
          <DeleteButton
            action={deleteAction}
            label="Delete"
            confirmText={`Delete ${entity.name} and all of its transactions? This can't be undone.`}
          />
        </div>
        <p className="text-[13px] text-ink-3 pt-2">
          Archiving hides it from the overview but keeps its history.
        </p>
      </Section>
    </div>
  );
}
