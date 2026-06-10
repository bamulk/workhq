import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import EntityForm from "@/components/EntityForm";
import { updateEntityAction } from "../../actions";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditEntityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("entities").select("*").eq("id", id).single();
  if (!data) notFound();
  const entity = data as Entity;
  const updateAction = updateEntityAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/entities/${id}`} className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
          ← Back to {entity.name}
        </Link>
      </div>
      <PageHeader title={`Edit ${entity.name}`} />
      <EntityForm action={updateAction} entity={entity} submitLabel="Save changes" />
    </div>
  );
}
