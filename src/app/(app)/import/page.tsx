import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, EmptyState, LinkButton, Button } from "@/components/ui";
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

export default async function ImportPage() {
  const supabase = await createClient();
  const [{ data: entities }, { data: batches }] = await Promise.all([
    supabase.from("entities").select("id, name").eq("archived", false).order("sort_order"),
    supabase
      .from("import_batches")
      .select("id, filename, status, inserted_count, skipped_count, created_at, entities(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const entityList = (entities ?? []) as { id: string; name: string }[];
  const batchList = (batches ?? []) as unknown as BatchRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import CSV"
        subtitle="Bring in income & expenses exported from another app — map the columns, preview, then commit."
      />

      {entityList.length === 0 ? (
        <EmptyState
          title="Add an entity first"
          description="Create a business or rental house before importing its transactions."
          action={<LinkButton href="/entities/new">New entity</LinkButton>}
        />
      ) : (
        <ImportWizard entities={entityList} />
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Recent imports</h2>
        {batchList.length === 0 ? (
          <p className="text-sm text-slate-400">No imports yet.</p>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-medium">When</th>
                  <th className="p-3 font-medium">Entity</th>
                  <th className="p-3 font-medium">File</th>
                  <th className="p-3 font-medium">Result</th>
                  <th className="p-3 font-medium text-right">Undo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {batchList.map((b) => {
                  const revert = revertImport.bind(null, b.id);
                  return (
                    <tr key={b.id}>
                      <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatDate(b.created_at)}
                      </td>
                      <td className="p-3">{b.entities?.name ?? "—"}</td>
                      <td className="p-3 truncate max-w-[180px]">{b.filename ?? "—"}</td>
                      <td className="p-3">
                        <Badge tone={b.status}>{b.status}</Badge>{" "}
                        {b.status === "committed" && (
                          <span className="text-xs text-slate-400">
                            {b.inserted_count} added
                            {b.skipped_count ? ` · ${b.skipped_count} skipped` : ""}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {b.status === "committed" ? (
                          <form
                            action={revert}
                            // confirm handled inline to avoid a client wrapper
                          >
                            <Button type="submit" variant="danger" size="sm">
                              Revert
                            </Button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
