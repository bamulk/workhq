"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v || "").trim();
  return s === "" ? null : s;
}
function int(v: FormDataEntryValue | null): number {
  const n = parseInt(String(v || "").trim(), 10);
  return Number.isNaN(n) ? 0 : n;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "entity"
  );
}

function entityFields(formData: FormData) {
  const type = String(formData.get("type") || "business").trim();
  return {
    name: String(formData.get("name") || "").trim(),
    type: type === "rental" ? "rental" : "business",
    subtype: str(formData.get("subtype")),
    address: str(formData.get("address")),
    sort_order: int(formData.get("sort_order")),
  };
}

export async function createEntityAction(formData: FormData) {
  const { supabase } = await requireUser();
  const fields = entityFields(formData);
  if (!fields.name) throw new Error("Name is required");

  // Ensure a unique slug.
  const wanted = str(formData.get("slug")) || slugify(fields.name);
  const { data: existing } = await supabase
    .from("entities")
    .select("slug")
    .like("slug", `${wanted}%`);
  const taken = new Set((existing ?? []).map((e) => e.slug));
  let slug = wanted;
  let i = 2;
  while (taken.has(slug)) slug = `${wanted}_${i++}`;

  const { data, error } = await supabase
    .from("entities")
    .insert({ ...fields, slug })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/entities");
  revalidatePath("/");
  redirect(`/entities/${data.id}`);
}

export async function updateEntityAction(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const fields = entityFields(formData);
  if (!fields.name) throw new Error("Name is required");
  const { error } = await supabase.from("entities").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/entities/${id}`);
  revalidatePath("/entities");
  revalidatePath("/");
  redirect(`/entities/${id}`);
}

export async function setEntityArchivedAction(id: string, archived: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("entities")
    .update({ archived })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/entities");
  revalidatePath("/");
}

export async function deleteEntityAction(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("entities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/entities");
  revalidatePath("/");
  redirect("/entities");
}
