import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
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
  const origin = txn.import_batch_id
    ? "Imported from CSV"
    : txn.source === "manual"
      ? "Added by hand"
      : `From ${titleize(txn.source)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit transaction"
        subtitle={origin}
        back={{ href: "/transactions", label: "Activity" }}
      />
      <TransactionForm
        action={updateAction}
        txn={txn}
        entities={entities ?? []}
        categories={categories ?? []}
        submitLabel="Save changes"
      />
      <div className="max-w-xl border-t border-rule pt-5">
        <DeleteButton action={deleteAction} label="Delete transaction" />
      </div>
    </div>
  );
}
