"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fetchHomeValue } from "@/lib/rentcast";
import { nextRefreshAt } from "@/lib/equity";
import type { HomeValuation } from "@/lib/types";

export type RefreshState = { error?: string; ok?: boolean } | null;

/** Pull a fresh RentCast estimate for one house. Returns a message rather than throwing so the form can show it. */
export async function refreshHomeValueAction(entityId: string): Promise<RefreshState> {
  const { supabase } = await requireUser();
  const [{ data: entity }, { data: last }] = await Promise.all([
    supabase.from("entities").select("address, type").eq("id", entityId).single(),
    supabase
      .from("home_valuations")
      .select("*")
      .eq("entity_id", entityId)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!entity?.address) return { error: "Add the house's full address first (Edit → Address)." };
  if (nextRefreshAt((last ?? undefined) as HomeValuation | undefined)) {
    return { error: "This value was updated in the last week. RentCast lookups are limited, so it can refresh again in a few days." };
  }

  try {
    const v = await fetchHomeValue(entity.address);
    const { error } = await supabase.from("home_valuations").insert({
      entity_id: entityId,
      value: v.price,
      value_low: v.priceRangeLow,
      value_high: v.priceRangeHigh,
      source: "rentcast",
      details: v.subject,
    });
    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't get a value." };
  }

  revalidatePath(`/entities/${entityId}`);
  revalidatePath("/");
  return { ok: true };
}

function money(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(/[$,\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) throw new Error(`"${v}" isn't a valid amount`);
  return n;
}
function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function mortgageFields(formData: FormData) {
  const balance = money(formData.get("balance"));
  if (balance == null) throw new Error("Balance is required");
  return {
    lender: str(formData.get("lender")),
    balance,
    balance_as_of: str(formData.get("balance_as_of")) ?? new Date().toISOString().slice(0, 10),
    interest_rate: money(formData.get("interest_rate")),
    monthly_payment: money(formData.get("monthly_payment")),
    payoff_date: str(formData.get("payoff_date")),
    notes: str(formData.get("notes")),
  };
}

export async function saveMortgageAction(entityId: string, mortgageId: string | null, formData: FormData) {
  const { supabase } = await requireUser();
  const fields = mortgageFields(formData);
  const { error } = mortgageId
    ? await supabase.from("mortgages").update(fields).eq("id", mortgageId).eq("entity_id", entityId)
    : await supabase.from("mortgages").insert({ ...fields, entity_id: entityId });
  if (error) throw new Error(error.message);
  revalidatePath(`/entities/${entityId}`);
  revalidatePath("/");
  redirect(`/entities/${entityId}`);
}

export async function deleteMortgageAction(entityId: string, mortgageId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("mortgages").delete().eq("id", mortgageId).eq("entity_id", entityId);
  if (error) throw new Error(error.message);
  revalidatePath(`/entities/${entityId}`);
  revalidatePath("/");
  redirect(`/entities/${entityId}`);
}
