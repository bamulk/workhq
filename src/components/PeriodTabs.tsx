"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RANGE_PRESETS, type RangeKey } from "@/lib/ranges";
import { Button, Input } from "@/components/ui";

/**
 * Period selector: a ruled row of tabs, the active one marked by a solid bar.
 * Writes the choice to the URL (?range=… or ?range=custom&from&to) so the
 * server component re-queries. `keep` carries other filters across changes.
 */
export default function PeriodTabs({
  current,
  from,
  to,
  basePath = "/",
  keep,
}: {
  current: RangeKey;
  from?: string;
  to?: string;
  basePath?: string;
  keep?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(current === "custom");
  const [f, setF] = useState(from ?? "");
  const [t, setT] = useState(to ?? "");

  function href(range: RangeKey, extra?: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(keep ?? {})) if (v) params.set(k, v);
    if (range !== "month") params.set("range", range);
    for (const [k, v] of Object.entries(extra ?? {})) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const tab = (active: boolean) =>
    `relative shrink-0 h-11 px-1.5 sm:px-3 inline-flex items-center text-[14px] whitespace-nowrap transition-colors duration-150 ${
      active
        ? "font-semibold text-ink after:absolute after:inset-x-1.5 sm:after:inset-x-3 after:bottom-[-1px] after:h-[3px] after:bg-ink"
        : "text-ink-3 hover:text-ink"
    }`;

  const customActive = current === "custom" || showCustom;

  return (
    <div className="space-y-3">
      <nav
        aria-label="Period"
        className="flex border-b border-rule overflow-x-auto -mx-4 px-2 sm:mx-0 sm:px-0 [scrollbar-width:none]"
      >
        {RANGE_PRESETS.map((p) => {
          const active = current === p.key && !showCustom;
          return (
            <Link
              key={p.key}
              href={href(p.key)}
              aria-current={active ? "page" : undefined}
              className={tab(active)}
              onClick={() => setShowCustom(false)}
            >
              {p.label}
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={showCustom}
          className={tab(customActive)}
          onClick={() => setShowCustom(true)}
        >
          Custom
        </button>
      </nav>

      {showCustom && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(href("custom", { from: f, to: t }));
          }}
        >
          <label className="flex-1 min-w-[9rem] space-y-1.5">
            <span className="block text-[13px] text-ink-2">From</span>
            <Input type="date" value={f} onChange={(e) => setF(e.target.value)} />
          </label>
          <label className="flex-1 min-w-[9rem] space-y-1.5">
            <span className="block text-[13px] text-ink-2">To</span>
            <Input type="date" value={t} onChange={(e) => setT(e.target.value)} />
          </label>
          <Button type="submit" variant="secondary">
            Show
          </Button>
        </form>
      )}
    </div>
  );
}
