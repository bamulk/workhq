import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, LinkButton, Button } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import MoneyFlowCards from "@/components/MoneyFlowCards";
import { formatCurrency, formatDate, formatSigned, netTone, titleize } from "@/lib/format";
import { summarize, type FlowRow } from "@/lib/aggregate";
import {
  setEntityArchivedAction,
  deleteEntityAction,
} from "../actions";
import type { Entity, TransactionWithJoins } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: entityRow }, { data: txnRows }] = await Promise.all([
    supabase.from("entities").select("*").eq("id", id).single(),
    supabase
      .from("transactions")
      .select("*, entities(name, type), categories(name, kind)")
      .eq("entity_id", id)
      .order("occurred_on", { ascending: false })
      .limit(100),
  ]);
  if (!entityRow) notFound();
  const entity = entityRow as Entity;
  const txns = (txnRows ?? []) as TransactionWithJoins[];
  const summary = summarize(txns as unknown as FlowRow[]);

  const archiveAction = setEntityArchivedAction.bind(null, id, !entity.archived);
  const deleteAction = deleteEntityAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/entities" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
          ← All entities
        </Link>
      </div>

      <PageHeader
        title={entity.name}
        subtitle={[titleize(entity.subtype) !== "—" ? titleize(entity.subtype) : null, entity.address]
          .filter(Boolean)
          .join(" · ") || undefined}
        actions={
          <>
            <LinkButton href={`/transactions/new?entity=${entity.id}`} variant="secondary">
              <Plus size={14} /> Add transaction
            </LinkButton>
            <LinkButton href={`/entities/${id}/edit`} variant="secondary">
              <Pencil size={14} /> Edit
            </LinkButton>
          </>
        }
      />

      <div className="flex items-center gap-2">
        <Badge tone={entity.type}>{entity.type}</Badge>
        {entity.archived && <Badge tone="reverted">archived</Badge>}
      </div>

      <MoneyFlowCards summary={summary} label="All time" />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-medium">Transactions</h2>
          <span className="text-xs text-slate-400">{txns.length} shown</span>
        </div>
        {txns.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No transactions yet.{" "}
            <Link href={`/transactions/new?entity=${entity.id}`} className="text-brand hover:underline">
              Add one
            </Link>
            .
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {txns.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {formatDate(t.occurred_on)}
                  </td>
                  <td className="p-3">
                    <Link href={`/transactions/${t.id}`} className="hover:underline">
                      {t.description || t.counterparty || "—"}
                    </Link>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">
                    {t.categories?.name ?? "—"}
                  </td>
                  <td className={`p-3 text-right whitespace-nowrap font-medium ${netTone(t.signed_amount)}`}>
                    {formatSigned(t.signed_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Net to date:{" "}
          <span className={`font-semibold ${netTone(summary.net)}`}>
            {formatSigned(summary.net)}
          </span>{" "}
          <span className="text-xs">
            ({formatCurrency(summary.moneyIn)} in · {formatCurrency(summary.moneyOut)} out)
          </span>
        </div>
        <div className="flex items-center gap-2">
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
            label="Delete entity"
            confirmText={`Delete ${entity.name} and ALL its transactions? This cannot be undone.`}
          />
        </div>
      </Card>
    </div>
  );
}
