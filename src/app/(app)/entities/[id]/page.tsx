import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Archive, ArchiveRestore, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, LinkButton, Button, Section, EmptyState } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import KeyFigures from "@/components/KeyFigures";
import PeriodTabs from "@/components/PeriodTabs";
import TransactionList from "@/components/TransactionList";
import EquityFigures from "@/components/EquityFigures";
import RefreshValueButton from "@/components/RefreshValueButton";
import { equityFor, estimateBalance, nextRefreshAt } from "@/lib/equity";
import { formatCurrency, formatDate, titleize } from "@/lib/format";
import { resolveRange } from "@/lib/ranges";
import { summarize, type FlowRow } from "@/lib/aggregate";
import { setEntityArchivedAction, deleteEntityAction } from "../actions";
import { refreshHomeValueAction } from "../property-actions";
import type { Entity, HomeValuation, Mortgage, TransactionWithJoins } from "@/lib/types";

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

  const [{ data: entityRow }, { data: txnRows }, { data: valuationRow }, { data: mortgageRows }] = await Promise.all([
    supabase.from("entities").select("*").eq("id", id).single(),
    txnQuery,
    supabase
      .from("home_valuations")
      .select("*")
      .eq("entity_id", id)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("mortgages").select("*").eq("entity_id", id).order("created_at"),
  ]);
  if (!entityRow) notFound();
  const entity = entityRow as Entity;
  const txns = (txnRows ?? []) as TransactionWithJoins[];
  const summary = summarize(txns as unknown as FlowRow[]);
  const valuation = (valuationRow ?? undefined) as HomeValuation | undefined;
  const mortgages = (mortgageRows ?? []) as Mortgage[];
  const equity = equityFor(valuation, mortgages);
  const waitUntil = nextRefreshAt(valuation);
  const isHome = entity.type === "home";
  const isProperty = entity.type === "rental" || isHome;

  const archiveAction = setEntityArchivedAction.bind(null, id, !entity.archived);
  const deleteAction = deleteEntityAction.bind(null, id);
  const subtitle = [
    entity.type === "rental" ? "Rental house" : entity.type === "home" ? "Primary home" : "Business",
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
            {!isHome && (
              <LinkButton href={`/transactions/new?entity=${entity.id}`} size="sm">
                <Plus size={14} /> Add
              </LinkButton>
            )}
            <LinkButton href={`/entities/${id}/edit`} variant="secondary" size="sm">
              <Pencil size={14} /> Edit
            </LinkButton>
          </>
        }
      />

      {!isHome && (
        <>
          <PeriodTabs current={range.key} from={sp.from} to={sp.to} basePath={`/entities/${id}`} />
          <KeyFigures summary={summary} label={range.label} />
        </>
      )}

      {isProperty && (
        <Section title="Equity">
          <EquityFigures value={equity.value} owed={equity.owed} equity={equity.equity} />

          <div className="py-3 space-y-3 border-b border-rule">
            <p className="text-[13px] text-ink-3">
              {valuation
                ? [
                    "RentCast estimate",
                    valuation.value_low && valuation.value_high
                      ? `${formatCurrency(Number(valuation.value_low))}–${formatCurrency(Number(valuation.value_high))}`
                      : null,
                    `updated ${formatDate(valuation.fetched_at)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : entity.address
                  ? "No value yet. Pull an estimate from RentCast."
                  : null}
            </p>
            {entity.address ? (
              <RefreshValueButton
                action={refreshHomeValueAction.bind(null, id)}
                label={valuation ? "Update value" : "Get home value"}
                disabledReason={waitUntil ? `Next update ${formatDate(waitUntil.toISOString())}` : undefined}
              />
            ) : (
              <p className="text-ink-2">
                Add the full address to pull a home value.{" "}
                <Link href={`/entities/${id}/edit`} className="font-semibold underline">
                  Add address
                </Link>
              </p>
            )}
          </div>

          {mortgages.length > 0 && (
            <ul className="divide-y divide-rule border-b border-rule">
              {mortgages.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/entities/${id}/mortgages/${m.id}`}
                    className="flex items-center gap-4 py-3 hover:bg-hover"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{m.lender || "Mortgage"}</span>
                      <span className="block text-[13px] text-ink-3 truncate">
                        {[
                          m.interest_rate != null ? `${Number(m.interest_rate)}%` : null,
                          m.monthly_payment != null ? `${formatCurrency(Number(m.monthly_payment))}/mo` : null,
                          m.payoff_date ? `paid off ${formatDate(m.payoff_date)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || `Balance as of ${formatDate(m.balance_as_of)}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-semibold">{formatCurrency(estimateBalance(m))}</span>
                      <span className="block text-[12px] text-ink-3">owed</span>
                    </span>
                    <ChevronRight size={16} className="text-ink-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="pt-3">
            <LinkButton href={`/entities/${id}/mortgages/new`} variant="secondary" size="sm">
              <Plus size={14} /> {mortgages.length ? "Add another mortgage" : "Add mortgage"}
            </LinkButton>
          </div>
        </Section>
      )}

      {isHome ? null : txns.length === 0 ? (
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
