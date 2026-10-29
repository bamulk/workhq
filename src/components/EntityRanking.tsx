import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatCurrency, formatSigned, netTone } from "@/lib/format";
import { emptySummary, type FlowSummary } from "@/lib/aggregate";
import type { Entity } from "@/lib/types";

/**
 * Every entity ranked on one centre axis: earners run right in green, losers
 * run left in red, each bar scaled to the largest net on the list. This is the
 * app's signature graphic — the annual report's key-figures chart.
 *
 * The axis is a single rule drawn down the whole list; type sits above it on
 * a paper ground, so the rule breaks around words as it would in print. On phones the bar track
 * spans the row, so its centre is the row's centre; from `sm` up the track is
 * the middle grid column, so the axis sits at that column's centre.
 */
export default function EntityRanking({
  entities,
  byEntity,
}: {
  entities: Entity[];
  byEntity: Map<string, FlowSummary>;
}) {
  const rows = entities
    .map((e) => ({ e, s: byEntity.get(e.id) ?? emptySummary() }))
    .sort((a, b) => b.s.net - a.s.net || a.e.sort_order - b.e.sort_order);
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.s.net)));
  const anyRecorded = rows.some((r) => r.s.count > 0);

  return (
    <div className="relative">
      {anyRecorded && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-rule-strong left-1/2 sm:left-[calc(14rem+0.75rem+(100%-14rem-7.5rem-16px-2.25rem)/2)]"
        />
      )}
      <ol className="divide-y divide-rule border-b border-rule">
        {rows.map(({ e, s }) => {
          const pct = (Math.abs(s.net) / max) * 50;
          const empty = s.count === 0;
          return (
            <li key={e.id}>
              <Link
                href={`/entities/${e.id}`}
                className="group grid grid-cols-[1fr_auto_16px] sm:grid-cols-[minmax(0,14rem)_1fr_7.5rem_16px] items-center gap-x-3 gap-y-1.5 py-2.5 hover:bg-hover"
              >
                <span className="min-w-0">
                  <span className="relative z-20 block w-fit max-w-full truncate pr-1.5 bg-paper group-hover:bg-hover">
                    {e.name}
                  </span>
                  <span className="relative z-20 block w-fit max-w-full truncate pr-1.5 text-[13px] text-ink-3 bg-paper group-hover:bg-hover">
                    {empty
                      ? "Nothing recorded"
                      : `${formatCurrency(s.moneyIn)} in · ${formatCurrency(s.moneyOut)} out`}
                  </span>
                </span>

                <span
                  aria-hidden
                  className={`relative h-2.5 col-span-3 row-start-2 sm:col-span-1 sm:row-start-auto sm:col-start-2 ${
                    anyRecorded ? "" : "max-sm:hidden"
                  }`}
                >
                    {s.net !== 0 && (
                      <span
                        className={`bar-grow absolute inset-y-0 ${
                          s.net > 0
                            ? "left-1/2 bg-gain-bar origin-left"
                            : "right-1/2 bg-loss-bar origin-right"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                  )}
                </span>

                <span className={`text-right font-semibold ${empty ? "text-ink-3 font-normal" : netTone(s.net)}`}>
                  {empty ? "—" : formatSigned(s.net)}
                </span>
                <ChevronRight size={16} className="text-ink-3 group-hover:text-ink" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ol>
      {anyRecorded && (
        <p className="flex justify-between text-[12px] text-ink-3 pt-1.5 sm:ml-[calc(14rem+0.75rem)] sm:mr-[calc(7.5rem+16px+1.5rem)]">
          <span>−{formatCurrency(max)}</span>
          <span>+{formatCurrency(max)}</span>
        </p>
      )}
    </div>
  );
}
