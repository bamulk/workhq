import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  format,
} from "date-fns";
import { formatDate } from "@/lib/format";

export type RangeKey = "month" | "ytd" | "last12" | "all" | "custom";

export interface ResolvedRange {
  key: RangeKey;
  /** Inclusive lower bound (YYYY-MM-DD), or null for no lower bound. */
  start: string | null;
  /** Inclusive upper bound (YYYY-MM-DD), or null for no upper bound. */
  end: string | null;
  label: string;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export const RANGE_PRESETS: { key: RangeKey; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "ytd", label: "This year" },
  { key: "last12", label: "12 months" },
  { key: "all", label: "All time" },
];

/**
 * Resolve a date range from URL search params. Defaults to the current month.
 * `range=custom` reads `from`/`to` (either bound optional).
 */
export function resolveRange(sp: {
  range?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  const now = new Date();
  const key = (sp.range as RangeKey) || "month";

  switch (key) {
    case "ytd":
      return {
        key,
        start: iso(startOfYear(now)),
        end: iso(endOfYear(now)),
        label: `${now.getFullYear()} year to date`,
      };
    case "last12":
      return {
        key,
        start: iso(startOfMonth(subMonths(now, 11))),
        end: iso(endOfMonth(now)),
        label: "Last 12 months",
      };
    case "all":
      return { key, start: null, end: null, label: "All time" };
    case "custom": {
      const start = sp.from && ISO_RE.test(sp.from) ? sp.from : null;
      const end = sp.to && ISO_RE.test(sp.to) ? sp.to : null;
      const label =
        start && end
          ? `${formatDate(start)} – ${formatDate(end)}`
          : start
            ? `Since ${formatDate(start)}`
            : end
              ? `Through ${formatDate(end)}`
              : "All time";
      return { key, start, end, label };
    }
    case "month":
    default:
      return {
        key: "month",
        start: iso(startOfMonth(now)),
        end: iso(endOfMonth(now)),
        label: format(now, "MMMM yyyy"),
      };
  }
}

/** Build a querystring for a range preset, preserving an optional entity filter. */
export function rangeHref(
  key: RangeKey,
  extra?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  if (key !== "month") params.set("range", key);
  for (const [k, v] of Object.entries(extra ?? {})) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}
