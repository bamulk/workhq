import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import TransactionForm from "@/components/TransactionForm";
import { updateTransactionAction, deleteTransactionAction } from "../actions";
import { titleize } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: txnRow }, { data: entities }, { data: categories }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).single(),
    supabase.from("entities").select("id, name, type").order("sort_order"),
    supabase.from("categories").select("id, name, kind, applies_to").order("sort_order"),
  ]);
  if (!txnRow) notFound();
  const txn = txnRow as Transaction;

  const updateAction = updateTransactionAction.bind(null, id);
  const deleteAction = deleteTransactionAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/transactions" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
          ← All transactions
        </Link>
      </div>
      <PageHeader
        title="Edit transaction"
        actions={
          <DeleteButton action={deleteAction} label="Delete" />
        }
      />
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Badge tone={txn.direction}>{txn.direction === "in" ? "Money in" : "Money out"}</Badge>
        <span>Source: {titleize(txn.source)}</span>
        {txn.import_batch_id && <span>· imported</span>}
      </div>
      <TransactionForm
        action={updateAction}
        txn={txn}
        entities={entities ?? []}
        categories={categories ?? []}
        submitLabel="Save changes"
      />
    </div>
  );
}
