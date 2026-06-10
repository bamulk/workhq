"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RANGE_PRESETS, type RangeKey } from "@/lib/ranges";

/**
 * Range selector for the dashboard. Preset chips plus an optional custom
 * from/to. Writes the choice to the URL (?range=… or ?range=custom&from&to)
 * so the server component re-queries.
 */
export default function DateRangePicker({
  current,
  from,
  to,
  basePath = "/",
}: {
  current: RangeKey;
  from?: string;
  to?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(current === "custom");
  const [f, setF] = useState(from ?? "");
  const [t, setT] = useState(to ?? "");

  function go(range: RangeKey) {
    if (range === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const qs = range === "month" ? "" : `?range=${range}`;
    router.push(`${basePath}${qs}`);
  }

  function applyCustom() {
    const params = new URLSearchParams({ range: "custom" });
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    router.push(`${basePath}?${params.toString()}`);
  }

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm border transition-colors ${
      active
        ? "bg-brand text-white border-brand"
        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand/40"
    }`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {RANGE_PRESETS.map((p) => (
          <button key={p.key} type="button" className={chip(current === p.key && !showCustom)} onClick={() => go(p.key)}>
            {p.label}
          </button>
        ))}
        <button type="button" className={chip(current === "custom" || showCustom)} onClick={() => go("custom")}>
          Custom
        </button>
      </div>
      {showCustom && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">
            From
            <input
              type="date"
              value={f}
              onChange={(e) => setF(e.target.value)}
              className="block mt-0.5 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500 dark:text-slate-400">
            To
            <input
              type="date"
              value={t}
              onChange={(e) => setT(e.target.value)}
              className="block mt-0.5 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            className="px-3 py-1.5 rounded-lg text-sm bg-brand text-white hover:bg-brand-hover"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
