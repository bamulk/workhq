import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import MortgageForm from "@/components/MortgageForm";
import DeleteButton from "@/components/DeleteButton";
import { saveMortgageAction, deleteMortgageAction } from "../../../property-actions";
import type { Mortgage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditMortgagePage({
  params,
}: {
  params: Promise<{ id: string; mortgageId: string }>;
}) {
  const { id, mortgageId } = await params;
  const supabase = await createClient();
  const [{ data: entity }, { data: row }] = await Promise.all([
    supabase.from("entities").select("name").eq("id", id).single(),
    supabase.from("mortgages").select("*").eq("id", mortgageId).eq("entity_id", id).single(),
  ]);
  if (!entity || !row) notFound();
  const mortgage = row as Mortgage;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit mortgage" subtitle={entity.name} back={{ href: `/entities/${id}`, label: entity.name }} />
      <MortgageForm action={saveMortgageAction.bind(null, id, mortgageId)} mortgage={mortgage} submitLabel="Save changes" />
      <div className="max-w-xl border-t border-rule pt-5">
        <DeleteButton
          action={deleteMortgageAction.bind(null, id, mortgageId)}
          label="Delete mortgage"
          confirmText="Delete this mortgage? It can't be undone."
        />
      </div>
    </div>
  );
}
