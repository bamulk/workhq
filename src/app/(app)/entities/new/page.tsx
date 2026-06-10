import Link from "next/link";
import { PageHeader } from "@/components/ui";
import EntityForm from "@/components/EntityForm";
import { createEntityAction } from "../actions";

export const dynamic = "force-dynamic";

export default function NewEntityPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/entities" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
          ← All entities
        </Link>
      </div>
      <PageHeader title="New entity" />
      <EntityForm action={createEntityAction} submitLabel="Create entity" />
    </div>
  );
}
