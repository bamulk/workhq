export function formatCurrency(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCurrencyCents(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

/**
 * Signed currency: prefixes an explicit + for positive net so cash flow reads
 * clearly. Negative numbers already carry their minus sign.
 */
export function formatSigned(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const formatted = formatCurrency(Math.abs(n));
  if (n > 0) return `+${formatted}`;
  if (n < 0) return `−${formatted}`;
  return formatted;
}

/** Tailwind text-color class for a net amount (gain green positive, loss red negative). */
export function netTone(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n) || n === 0) return "text-ink";
  return n > 0 ? "text-gain" : "text-loss";
}

/** Format a YYYY-MM-DD (or ISO) date without timezone drift. */
export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const iso = d.length > 10 ? d.slice(0, 10) : d;
  const [y, m, day] = iso.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Turn a snake_case slug into a Title Case label (e.g. property_tax → Property Tax). */
export function titleize(s: string | null | undefined): string {
  if (!s) return "—";
  return s
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Today as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
