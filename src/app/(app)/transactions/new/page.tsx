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
      <PageHeader title="Add transaction" />
      {(entities ?? []).length === 0 ? (
        <EmptyState
          title="Add a business or rental first"
          description="Money has to belong to something before you can record it."
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
