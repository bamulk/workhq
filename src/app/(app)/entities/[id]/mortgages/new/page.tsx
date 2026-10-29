import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import MortgageForm from "@/components/MortgageForm";
import { saveMortgageAction } from "../../../property-actions";

export const dynamic = "force-dynamic";

export default async function NewMortgagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: entity } = await supabase.from("entities").select("name").eq("id", id).single();
  if (!entity) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Add mortgage" subtitle={entity.name} back={{ href: `/entities/${id}`, label: entity.name }} />
      <MortgageForm action={saveMortgageAction.bind(null, id, null)} submitLabel="Add mortgage" />
    </div>
  );
}
