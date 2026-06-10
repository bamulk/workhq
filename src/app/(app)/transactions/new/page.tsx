import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, LinkButton } from "@/components/ui";
import TransactionForm from "@/components/TransactionForm";
import { createTransactionAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: entities }, { data: categories }] = await Promise.all([
    supabase.from("entities").select("id, name, type").eq("archived", false).order("sort_order"),
    supabase.from("categories").select("id, name, kind, applies_to").order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/transactions" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
          ← All transactions
        </Link>
      </div>
      <PageHeader title="New transaction" />
      {(entities ?? []).length === 0 ? (
        <EmptyState
          title="Add an entity first"
          description="You need at least one business or rental house before recording money."
          action={<LinkButton href="/entities/new">New entity</LinkButton>}
        />
      ) : (
        <TransactionForm
          action={createTransactionAction}
          entities={entities ?? []}
          categories={categories ?? []}
          defaultEntityId={sp.entity}
          submitLabel="Add transaction"
        />
      )}
    </div>
  );
}
