"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  normalizeRow,
  type ColumnMapping,
  type SignConvention,
  type NormalizedTxn,
} from "@/lib/import";

const SOURCE = "csv";
const MAX_ROWS = 5000;

export interface PreviewRow {
  index: number;
  status: "ok" | "duplicate" | "error";
  reason?: string;
  externalId?: string;
  txn?: NormalizedTxn;
}

export interface PreviewResult {
  rows: PreviewRow[];
  okCount: number;
  duplicateCount: number;
  errorCount: number;
}

/** Stable id for a row: the mapped Source ID if present, else a content hash. */
function externalIdFor(
  entityId: string,
  txn: NormalizedTxn,
  dedupeBasis: string
): string {
  if (txn.external_id) return txn.external_id;
  const hash = createHash("sha256")
    .update(`${entityId}|${dedupeBasis}`)
    .digest("hex")
    .slice(0, 32);
  return `h:${hash}`;
}

/** Which of these (source='csv') external ids already exist, chunked for URL length. */
async function existingExternalIds(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  ids: string[]
): Promise<Set<string>> {
  const existing = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    if (!chunk.length) break;
    const { data, error } = await supabase
      .from("transactions")
      .select("external_id")
      .eq("source", SOURCE)
      .in("external_id", chunk);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) if (r.external_id) existing.add(r.external_id);
  }
  return existing;
}

async function categoriesByName(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"]
): Promise<Map<string, string>> {
  const { data } = await supabase.from("categories").select("id, name, slug");
  const map = new Map<string, string>();
  for (const c of data ?? []) {
    map.set(String(c.name).toLowerCase(), c.id);
    map.set(String(c.slug).toLowerCase(), c.id);
  }
  return map;
}

/** Normalize + classify rows without writing anything. */
export async function previewImport(
  entityId: string,
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  sign: SignConvention
): Promise<PreviewResult> {
  const { supabase } = await requireUser();
  if (!entityId) throw new Error("Pick an entity first");
  const rows = rawRows.slice(0, MAX_ROWS);
  const catMap = await categoriesByName(supabase);

  // First pass: normalize + compute external ids.
  const normalized = rows.map((raw, index) => {
    const res = normalizeRow(raw, { mapping, sign, categoriesByName: catMap });
    const externalId =
      res.status === "ok" && res.txn
        ? externalIdFor(entityId, res.txn, res.dedupeBasis)
        : undefined;
    return { index, res, externalId };
  });

  // Check existing external ids in the DB. Scoped to source only — this
  // mirrors the unique index on (source, external_id).
  const ids = normalized.map((n) => n.externalId).filter(Boolean) as string[];
  const existing = await existingExternalIds(supabase, ids);

  const seen = new Set<string>();
  const out: PreviewRow[] = normalized.map(({ index, res, externalId }) => {
    if (res.status === "error") {
      return { index, status: "error", reason: res.reason };
    }
    const dup =
      (externalId && existing.has(externalId)) ||
      (externalId && seen.has(externalId));
    if (externalId) seen.add(externalId);
    return {
      index,
      status: dup ? "duplicate" : "ok",
      externalId,
      txn: res.txn,
    };
  });

  return {
    rows: out,
    okCount: out.filter((r) => r.status === "ok").length,
    duplicateCount: out.filter((r) => r.status === "duplicate").length,
    errorCount: out.filter((r) => r.status === "error").length,
  };
}

/** Insert a batch + upsert the rows. Idempotent via (source, external_id). */
export async function commitImport(
  entityId: string,
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  sign: SignConvention,
  filename: string | null
): Promise<{ batchId: string; inserted: number; skipped: number }> {
  const { supabase, user } = await requireUser();
  if (!entityId) throw new Error("Pick an entity first");
  const rows = rawRows.slice(0, MAX_ROWS);
  const catMap = await categoriesByName(supabase);

  // Create the batch first so transactions can reference it.
  const { data: batch, error: batchErr } = await supabase
    .from("import_batches")
    .insert({
      entity_id: entityId,
      source: SOURCE,
      filename,
      column_mapping: mapping,
      row_count: rows.length,
      status: "committed",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (batchErr) throw new Error(batchErr.message);
  const batchId = batch.id as string;

  // Build upsert payload from the ok rows, deduped within the batch.
  const seen = new Set<string>();
  const payload: Record<string, unknown>[] = [];
  for (const raw of rows) {
    const res = normalizeRow(raw, { mapping, sign, categoriesByName: catMap });
    if (res.status !== "ok" || !res.txn) continue;
    const externalId = externalIdFor(entityId, res.txn, res.dedupeBasis);
    if (seen.has(externalId)) continue;
    seen.add(externalId);
    payload.push({
      entity_id: entityId,
      occurred_on: res.txn.occurred_on,
      direction: res.txn.direction,
      amount: res.txn.amount,
      category_id: res.txn.category_id,
      description: res.txn.description,
      counterparty: res.txn.counterparty,
      method: res.txn.method,
      source: SOURCE,
      external_id: externalId,
      import_batch_id: batchId,
    });
  }

  // Skip rows whose external_id already exists, then plain-insert the rest.
  // (Idempotency check in app code: ON CONFLICT can't target our index from
  // the client, and this also gives an accurate skipped count.)
  const existing = await existingExternalIds(
    supabase,
    payload.map((p) => p.external_id as string)
  );
  const fresh = payload.filter((p) => !existing.has(p.external_id as string));

  let inserted = 0;
  if (fresh.length) {
    const { data, error } = await supabase
      .from("transactions")
      .insert(fresh)
      .select("id");
    if (error) {
      // Don't leave a stale batch behind if nothing landed.
      await supabase.from("import_batches").delete().eq("id", batchId);
      throw new Error(error.message);
    }
    inserted = data?.length ?? 0;
  }
  const skipped = rows.length - inserted;

  await supabase
    .from("import_batches")
    .update({ inserted_count: inserted, skipped_count: skipped })
    .eq("id", batchId);

  revalidatePath("/import");
  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath(`/entities/${entityId}`);
  return { batchId, inserted, skipped };
}

/** Undo a batch: delete its transactions and mark it reverted. */
export async function revertImport(batchId: string) {
  const { supabase } = await requireUser();
  const { data: batch } = await supabase
    .from("import_batches")
    .select("entity_id")
    .eq("id", batchId)
    .single();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("import_batch_id", batchId);
  if (error) throw new Error(error.message);
  await supabase
    .from("import_batches")
    .update({ status: "reverted", inserted_count: 0 })
    .eq("id", batchId);
  revalidatePath("/import");
  revalidatePath("/transactions");
  revalidatePath("/");
  if (batch?.entity_id) revalidatePath(`/entities/${batch.entity_id}`);
}
