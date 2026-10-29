import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, EmptyState, LinkButton, Button, Section } from "@/components/ui";
import ImportWizard from "@/components/ImportWizard";
import { formatDate } from "@/lib/format";
import { revertImport } from "./actions";

export const dynamic = "force-dynamic";

interface BatchRow {
  id: string;
  filename: string | null;
  status: "preview" | "committed" | "reverted";
  inserted_count: number;
  skipped_count: number;
  created_at: string;
  entities: { name: string } | null;
}

const statusLabel: Record<BatchRow["status"], string> = {
  committed: "Imported",
  preview: "Not imported",
  reverted: "Undone",
};

export default async function ImportPage() {
  const supabase = await createClient();
  const [{ data: entities }, { data: batches }] = await Promise.all([
    supabase.from("entities").select("id, name").eq("archived", false).neq("type", "home").order("sort_order"),
    supabase
      .from("import_batches")
      .select("id, filename, status, inserted_count, skipped_count, created_at, entities(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const entityList = (entities ?? []) as { id: string; name: string }[];
  const batchList = (batches ?? []) as unknown as BatchRow[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Import CSV"
        subtitle="Export from your bank or another app, match the columns, check, then import."
      />

      {entityList.length === 0 ? (
        <EmptyState
          title="Add a business or rental first"
          description="Imported money has to belong to one of them."
          action={<LinkButton href="/entities/new">New entity</LinkButton>}
        />
      ) : (
        <ImportWizard entities={entityList} />
      )}

      <Section title="Past imports">
        {batchList.length === 0 ? (
          <p className="text-ink-3 py-3">No imports yet.</p>
        ) : (
          <ul className="divide-y divide-rule border-b border-rule">
            {batchList.map((b) => {
              const revert = revertImport.bind(null, b.id);
              return (
                <li key={b.id} className="flex items-center gap-4 py-3">
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{b.filename ?? "Untitled file"}</span>
                    <span className="block text-[13px] text-ink-3 truncate">
                      {[
                        formatDate(b.created_at),
                        b.entities?.name,
                        b.status === "committed"
                          ? `${b.inserted_count} added${b.skipped_count ? `, ${b.skipped_count} skipped` : ""}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {b.status === "committed" ? (
                    <form action={revert}>
                      <Button type="submit" variant="danger" size="sm">
                        Undo
                      </Button>
                    </form>
                  ) : (
                    <Badge tone={b.status}>{statusLabel[b.status]}</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
