"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v || "").trim();
  return s === "" ? null : s;
}
function num(v: FormDataEntryValue | null): number | null {
  const s = String(v || "").replace(/[$,]/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function txnFields(formData: FormData) {
  const direction = String(formData.get("direction") || "").trim();
  return {
    entity_id: str(formData.get("entity_id")),
    occurred_on: str(formData.get("occurred_on")),
    direction: direction === "out" ? "out" : "in",
    amount: num(formData.get("amount")),
    category_id: str(formData.get("category_id")),
    description: str(formData.get("description")),
    counterparty: str(formData.get("counterparty")),
    method: str(formData.get("method")),
    notes: str(formData.get("notes")),
  };
}

function validate(f: ReturnType<typeof txnFields>) {
  if (!f.entity_id) throw new Error("Entity is required");
  if (!f.occurred_on) throw new Error("Date is required");
  if (f.amount == null) throw new Error("Amount is required");
  if (f.amount < 0) throw new Error("Amount must be positive — use the In/Out toggle for direction");
}

export async function createTransactionAction(formData: FormData) {
  const { supabase } = await requireUser();
  const fields = txnFields(formData);
  validate(fields);
  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...fields, source: "manual" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/transactions");
  revalidatePath("/");
  if (fields.entity_id) revalidatePath(`/entities/${fields.entity_id}`);
  redirect(`/transactions/${data.id}`);
}

export async function updateTransactionAction(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const fields = txnFields(formData);
  validate(fields);
  const { error } = await supabase.from("transactions").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/transactions/${id}`);
  revalidatePath("/transactions");
  revalidatePath("/");
  if (fields.entity_id) revalidatePath(`/entities/${fields.entity_id}`);
  redirect(`/transactions/${id}`);
}

export async function deleteTransactionAction(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/transactions");
  revalidatePath("/");
  redirect("/transactions");
}
