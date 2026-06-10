"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { Card, Field, Select, Button } from "@/components/ui";
import { formatSigned } from "@/lib/format";
import {
  IMPORT_FIELDS,
  guessMapping,
  type ColumnMapping,
  type ImportField,
  type SignConvention,
} from "@/lib/import";
import { previewImport, commitImport, type PreviewResult } from "@/app/(app)/import/actions";

type EntityOption = { id: string; name: string };

const SIGN_OPTIONS: { value: SignConvention; label: string }[] = [
  { value: "signed", label: "Signed amount (negatives = money out)" },
  { value: "explicit", label: "Direction column (in/out, credit/debit)" },
  { value: "fixed_in", label: "All rows are money IN" },
  { value: "fixed_out", label: "All rows are money OUT" },
];

export default function ImportWizard({ entities }: { entities: EntityOption[] }) {
  const router = useRouter();
  const [entityId, setEntityId] = useState(entities[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [sign, setSign] = useState<SignConvention>("signed");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ inserted: number; skipped: number } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreview(null);
    setDone(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const hdrs = (results.meta.fields ?? []).filter(Boolean) as string[];
        setHeaders(hdrs);
        setRawRows(results.data as Record<string, string>[]);
        const guessed = guessMapping(hdrs);
        setMapping(guessed);
        setSign(guessed.direction ? "explicit" : "signed");
      },
      error: (err) => setError(err.message),
    });
  }

  function setField(field: ImportField, value: string) {
    setMapping((m) => {
      const next = { ...m };
      if (value) next[field] = value;
      else delete next[field];
      return next;
    });
  }

  async function runPreview() {
    setError(null);
    setBusy(true);
    try {
      const result = await previewImport(entityId, rawRows, mapping, sign);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    setError(null);
    setBusy(true);
    try {
      const result = await commitImport(entityId, rawRows, mapping, sign, fileName);
      setDone({ inserted: result.inserted, skipped: result.skipped });
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  const canPreview = entityId && rawRows.length > 0 && mapping.occurred_on && mapping.amount;

  return (
    <div className="space-y-4">
      {/* Step 1 — entity + file */}
      <Card className="p-5 space-y-4">
        <h2 className="font-medium">1 · Choose entity & file</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Entity">
            <Select value={entityId} onChange={(e) => setEntityId(e.target.value)}>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="CSV file">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white file:text-sm hover:file:bg-brand-hover"
            />
          </Field>
        </div>
        {fileName && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {fileName} · {rawRows.length} rows · {headers.length} columns
          </p>
        )}
      </Card>

      {/* Step 2 — mapping */}
      {headers.length > 0 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-medium">2 · Map columns</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {IMPORT_FIELDS.map((f) => (
              <Field key={f.key} label={`${f.label}${f.required ? " *" : ""}`} hint={f.hint}>
                <Select value={mapping[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)}>
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
          <Field label="How is direction (in vs out) determined?">
            <Select value={sign} onChange={(e) => setSign(e.target.value as SignConvention)}>
              {SIGN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end">
            <Button type="button" onClick={runPreview} disabled={!canPreview || busy}>
              <Upload size={14} /> {busy ? "Working…" : "Preview"}
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {done && (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 size={18} /> Imported {done.inserted} transaction{done.inserted === 1 ? "" : "s"}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {done.skipped > 0 ? `${done.skipped} row(s) skipped (duplicates or errors). ` : ""}
            They now appear on the dashboard and transactions list.
          </p>
        </Card>
      )}

      {/* Step 3 — preview */}
      {preview && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-medium">3 · Review &amp; confirm</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} /> {preview.okCount} new
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Copy size={13} /> {preview.duplicateCount} duplicate
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={13} /> {preview.errorCount} error
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500 dark:text-slate-400 sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-2 font-medium">#</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium">Date</th>
                  <th className="p-2 font-medium">Description</th>
                  <th className="p-2 font-medium">Category</th>
                  <th className="p-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {preview.rows.slice(0, 200).map((r) => (
                  <tr key={r.index} className={r.status === "error" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                    <td className="p-2 text-slate-400">{r.index + 1}</td>
                    <td className="p-2">
                      {r.status === "ok" && <span className="text-emerald-600 dark:text-emerald-400">New</span>}
                      {r.status === "duplicate" && <span className="text-slate-400">Duplicate</span>}
                      {r.status === "error" && (
                        <span className="text-amber-600 dark:text-amber-400" title={r.reason}>Error</span>
                      )}
                    </td>
                    <td className="p-2 whitespace-nowrap">{r.txn?.occurred_on ?? "—"}</td>
                    <td className="p-2">{r.txn?.description ?? r.reason ?? "—"}</td>
                    <td className="p-2 text-slate-500 dark:text-slate-400">
                      {r.txn?.category_label
                        ? `${r.txn.category_label}${r.txn.category_matched ? "" : " (?)"}`
                        : "—"}
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">
                      {r.txn
                        ? formatSigned(r.txn.direction === "in" ? r.txn.amount : -r.txn.amount)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.rows.length > 200 && (
            <p className="text-xs text-slate-400">Showing first 200 of {preview.rows.length} rows.</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPreview(null)} disabled={busy}>
              Back
            </Button>
            <Button type="button" onClick={runCommit} disabled={busy || preview.okCount === 0}>
              {busy ? "Importing…" : `Import ${preview.okCount} transaction${preview.okCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
