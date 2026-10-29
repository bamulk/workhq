import { PageHeader } from "@/components/ui";
import EntityForm from "@/components/EntityForm";
import { createEntityAction } from "../actions";

export const dynamic = "force-dynamic";

export default function NewEntityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New entity" back={{ href: "/entities", label: "Entities" }} />
      <EntityForm action={createEntityAction} submitLabel="Create entity" />
    </div>
  );
}
