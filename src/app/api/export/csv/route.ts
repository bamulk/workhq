import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveRange } from "@/lib/ranges";
import type { TransactionWithJoins } from "@/lib/types";

export const dynamic = "force-dynamic";

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const range = resolveRange({
    range: sp.get("range") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  });

  let query = supabase
    .from("transactions")
    .select("*, entities(name, type), categories(name, kind)")
    .order("occurred_on", { ascending: false });
  if (range.start) query = query.gte("occurred_on", range.start);
  if (range.end) query = query.lte("occurred_on", range.end);
  if (sp.get("entity")) query = query.eq("entity_id", sp.get("entity")!);

  const { data } = await query;
  const rows = (data ?? []) as TransactionWithJoins[];

  const header = ["Date", "Entity", "Type", "Direction", "Amount", "Category", "Description", "Payer/Payee", "Method", "Source"];
  const lines = [header.map(csvCell).join(",")];
  for (const t of rows) {
    lines.push(
      [
        t.occurred_on,
        t.entities?.name ?? "",
        t.entities?.type ?? "",
        t.direction,
        t.amount,
        t.categories?.name ?? "",
        t.description ?? "",
        t.counterparty ?? "",
        t.method ?? "",
        t.source,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  const body = lines.join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finances-transactions.csv"`,
    },
  });
}
