"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { Field, Select, Button, Section, ErrorNote } from "@/components/ui";
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
    <div className="space-y-8">
      {/* Step 1 — entity + file */}
      <Section title="Choose a file">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
              className="block w-full text-[14px] text-ink-2 file:mr-3 file:h-11 file:rounded-[4px] file:border-0 file:bg-ink file:px-4 file:text-paper file:text-[14px] file:font-semibold hover:file:bg-ink-2"
            />
          </Field>
        </div>
        {fileName && (
          <p className="text-[13px] text-ink-3 pt-3">
            {fileName} · {rawRows.length} rows · {headers.length} columns
          </p>
        )}
      </Section>

      {/* Step 2 — mapping */}
      {headers.length > 0 && (
        <Section title="Match the columns">
          <div className="space-y-4 pt-2">
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
          <Field label="How can we tell money in from money out?">
            <Select value={sign} onChange={(e) => setSign(e.target.value as SignConvention)}>
              {SIGN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end">
            <Button type="button" onClick={runPreview} disabled={!canPreview || busy}>
              <Upload size={14} /> {busy ? "Checking…" : "Preview"}
            </Button>
          </div>
          </div>
        </Section>
      )}

      {error && (
        <ErrorNote>{error}</ErrorNote>
      )}

      {done && (
        <div role="status" className="border-y border-rule py-4">
          <div className="flex items-center gap-2 text-gain font-semibold">
            <CheckCircle2 size={18} /> Imported {done.inserted} transaction{done.inserted === 1 ? "" : "s"}
          </div>
          <p className="text-ink-3 mt-1">
            {done.skipped > 0 ? `${done.skipped} row${done.skipped === 1 ? "" : "s"} skipped as duplicates or errors. ` : ""}
            They now show on the overview and in activity.
          </p>
        </div>
      )}

      {/* Step 3 — preview */}
      {preview && (
        <Section
          title="Check and import"
          aside={
            <span className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-gain">
                <CheckCircle2 size={13} /> {preview.okCount} new
              </span>
              <span className="inline-flex items-center gap-1 text-ink-3">
                <Copy size={13} /> {preview.duplicateCount} duplicate
              </span>
              <span className="inline-flex items-center gap-1 text-loss">
                <AlertTriangle size={13} /> {preview.errorCount} error
              </span>
            </span>
          }
        >
          <div className="space-y-4 pt-2">

          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-rule rounded-[4px]">
            <table className="w-full text-[14px]">
              <thead className="text-left text-[13px] text-ink-3 sticky top-0 bg-surface border-b border-rule">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Category</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {preview.rows.slice(0, 200).map((r) => (
                  <tr key={r.index} className={r.status === "error" ? "bg-hover" : ""}>
                    <td className="p-2 text-ink-3">{r.index + 1}</td>
                    <td className="p-2">
                      {r.status === "ok" && <span className="text-gain">New</span>}
                      {r.status === "duplicate" && <span className="text-ink-3">Duplicate</span>}
                      {r.status === "error" && (
                        <span className="text-loss" title={r.reason}>Error</span>
                      )}
                    </td>
                    <td className="p-2 whitespace-nowrap">{r.txn?.occurred_on ?? "—"}</td>
                    <td className="p-2">{r.txn?.description ?? r.reason ?? "—"}</td>
                    <td className="p-2 text-ink-3">
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
            <p className="text-[13px] text-ink-3">Showing the first 200 of {preview.rows.length} rows.</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPreview(null)} disabled={busy}>
              Back
            </Button>
            <Button type="button" onClick={runCommit} disabled={busy || preview.okCount === 0}>
              {busy ? "Importing…" : `Import ${preview.okCount} transaction${preview.okCount === 1 ? "" : "s"}`}
            </Button>
          </div>
          </div>
        </Section>
      )}
    </div>
  );
}
