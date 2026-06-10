import type { Direction } from "@/lib/types";

/** Target fields a CSV column can map to. */
export type ImportField =
  | "occurred_on"
  | "amount"
  | "direction"
  | "description"
  | "category"
  | "counterparty"
  | "method"
  | "external_id";

export type ColumnMapping = Partial<Record<ImportField, string>>;

/** How to derive in/out direction from the source data. */
export type SignConvention = "explicit" | "signed" | "fixed_in" | "fixed_out";

export const IMPORT_FIELDS: {
  key: ImportField;
  label: string;
  required: boolean;
  hint?: string;
}[] = [
  { key: "occurred_on", label: "Date", required: true, hint: "M/D/YYYY or YYYY-MM-DD" },
  { key: "amount", label: "Amount", required: true },
  { key: "direction", label: "Direction", required: false, hint: "in/out, credit/debit (explicit mode)" },
  { key: "description", label: "Description", required: false },
  { key: "category", label: "Category", required: false, hint: "matched by name" },
  { key: "counterparty", label: "Payer / Payee", required: false },
  { key: "method", label: "Method", required: false, hint: "zelle, venmo, check…" },
  { key: "external_id", label: "Source ID", required: false, hint: "if the export has a stable row id" },
];

export interface NormalizedTxn {
  occurred_on: string;
  direction: Direction;
  amount: number;
  description: string | null;
  category_id: string | null;
  category_label: string | null;
  category_matched: boolean;
  counterparty: string | null;
  method: string | null;
  external_id: string | null;
}

export interface NormalizeResult {
  status: "ok" | "error";
  reason?: string;
  txn?: NormalizedTxn;
  /** Stable per-row basis for deduping when there's no Source ID column. */
  dedupeBasis: string;
}

const IN_WORDS = new Set([
  "in", "income", "credit", "cr", "deposit", "rent", "+", "received", "revenue",
]);
const OUT_WORDS = new Set([
  "out", "expense", "debit", "dr", "withdrawal", "payment", "-", "paid", "cost",
]);

/** Parse a money string: strips $ , and parentheses-negatives. */
export function parseAmount(raw: string | undefined): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (s === "") return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$,\s]/g, "");
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

/** Parse M/D/YYYY, M/D/YY, or YYYY-MM-DD into a YYYY-MM-DD string. */
export function parseFlexibleDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s === "") return null;

  // ISO (optionally with time)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m}-${d}`;
  }

  // M/D/YYYY or M-D-YYYY (also handles 2-digit years)
  const slash = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const [, mm, dd, yy] = slash;
    let year = Number(yy);
    if (yy.length === 2) year = year >= 70 ? 1900 + year : 2000 + year;
    const m = Number(mm);
    const d = Number(dd);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return null;
}

function pick(raw: Record<string, string>, col: string | undefined): string | undefined {
  if (!col) return undefined;
  return raw[col];
}

/** Best-effort guess of a column mapping from CSV headers. */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
  const find = (...needles: string[]) =>
    headers.find((h) => {
      const n = norm(h);
      return needles.some((needle) => n.includes(needle));
    });

  mapping.occurred_on = find("date", "posted", "when");
  mapping.amount = find("amount", "total", "value", "price");
  mapping.direction = find("direction", "type", "creditdebit", "drcr");
  mapping.description = find("description", "memo", "details", "note", "name");
  mapping.category = find("category", "bucket", "account");
  mapping.counterparty = find("payer", "payee", "counterparty", "from", "to", "customer", "vendor");
  mapping.method = find("method", "channel", "paymentmethod");
  mapping.external_id = find("id", "transactionid", "reference", "refnum", "confirmation");

  // Drop undefined keys
  for (const k of Object.keys(mapping) as ImportField[]) {
    if (!mapping[k]) delete mapping[k];
  }
  return mapping;
}

function resolveDirection(
  raw: Record<string, string>,
  mapping: ColumnMapping,
  sign: SignConvention,
  amount: number
): { direction: Direction; reason?: string } {
  switch (sign) {
    case "fixed_in":
      return { direction: "in" };
    case "fixed_out":
      return { direction: "out" };
    case "signed":
      return { direction: amount < 0 ? "out" : "in" };
    case "explicit":
    default: {
      const val = (pick(raw, mapping.direction) ?? "").trim().toLowerCase();
      if (val === "") return { direction: "in", reason: "Missing direction value" };
      if (IN_WORDS.has(val)) return { direction: "in" };
      if (OUT_WORDS.has(val)) return { direction: "out" };
      // Fall back to sign if the word is unrecognized.
      return { direction: amount < 0 ? "out" : "in" };
    }
  }
}

/**
 * Normalize one raw CSV row into a transaction (or an error). Pure & testable —
 * the action layer handles dedupe (via dedupeBasis / external_id) and DB writes.
 */
export function normalizeRow(
  raw: Record<string, string>,
  opts: {
    mapping: ColumnMapping;
    sign: SignConvention;
    categoriesByName: Map<string, string>; // lowercased name|slug -> category_id
  }
): NormalizeResult {
  const { mapping, sign, categoriesByName } = opts;

  const dateRaw = pick(raw, mapping.occurred_on);
  const occurred_on = parseFlexibleDate(dateRaw);

  const amountRaw = pick(raw, mapping.amount);
  const parsedAmount = parseAmount(amountRaw);

  const description = (pick(raw, mapping.description) ?? "").trim() || null;
  const counterparty = (pick(raw, mapping.counterparty) ?? "").trim() || null;
  const method = (pick(raw, mapping.method) ?? "").trim() || null;
  const external_id = (pick(raw, mapping.external_id) ?? "").trim() || null;
  const categoryLabel = (pick(raw, mapping.category) ?? "").trim() || null;

  const dedupeBasis = [dateRaw, amountRaw, description, counterparty]
    .map((v) => (v ?? "").toString().trim())
    .join("|");

  if (!occurred_on) {
    return { status: "error", reason: `Bad or missing date: "${dateRaw ?? ""}"`, dedupeBasis };
  }
  if (parsedAmount == null) {
    return { status: "error", reason: `Bad or missing amount: "${amountRaw ?? ""}"`, dedupeBasis };
  }

  const { direction, reason } = resolveDirection(raw, mapping, sign, parsedAmount);
  if (reason) return { status: "error", reason, dedupeBasis };

  const amount = Math.abs(parsedAmount);
  if (amount === 0) {
    return { status: "error", reason: "Amount is zero", dedupeBasis };
  }

  let category_id: string | null = null;
  let category_matched = false;
  if (categoryLabel) {
    const hit =
      categoriesByName.get(categoryLabel.toLowerCase()) ??
      categoriesByName.get(categoryLabel.toLowerCase().replace(/[^a-z0-9]/g, "_"));
    if (hit) {
      category_id = hit;
      category_matched = true;
    }
  }

  return {
    status: "ok",
    dedupeBasis,
    txn: {
      occurred_on,
      direction,
      amount,
      description,
      category_id,
      category_label: categoryLabel,
      category_matched,
      counterparty,
      method,
      external_id,
    },
  };
}
