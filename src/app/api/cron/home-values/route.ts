import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchHomeValue } from "@/lib/rentcast";

export const dynamic = "force-dynamic";

/**
 * Monthly refresh of every rental's home value (scheduled in vercel.json).
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: rentals, error } = await supabase
    .from("entities")
    .select("id, name, address")
    .eq("type", "rental")
    .eq("archived", false)
    .not("address", "is", null);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results: { name: string; value?: number; error?: string }[] = [];
  for (const r of rentals ?? []) {
    try {
      const v = await fetchHomeValue(r.address as string);
      const { error: insertError } = await supabase.from("home_valuations").insert({
        entity_id: r.id,
        value: v.price,
        value_low: v.priceRangeLow,
        value_high: v.priceRangeHigh,
        source: "rentcast",
        details: v.subject,
      });
      results.push(insertError ? { name: r.name, error: insertError.message } : { name: r.name, value: v.price });
    } catch (err) {
      results.push({ name: r.name, error: err instanceof Error ? err.message : "lookup failed" });
    }
  }
  return Response.json({ refreshed: results });
}
