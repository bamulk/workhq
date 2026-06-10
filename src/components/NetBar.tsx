import { formatCurrency } from "@/lib/format";

/**
 * A CSS-only in-vs-out bar — no chart library. The green segment is money in,
 * the rose segment money out, each sized by its share of total gross flow.
 */
export default function NetBar({
  moneyIn,
  moneyOut,
}: {
  moneyIn: number;
  moneyOut: number;
}) {
  const total = moneyIn + moneyOut;
  const inPct = total > 0 ? (moneyIn / total) * 100 : 0;
  const outPct = total > 0 ? (moneyOut / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="bg-emerald-500"
          style={{ width: `${inPct}%` }}
          title={`In ${formatCurrency(moneyIn)}`}
        />
        <div
          className="bg-rose-500"
          style={{ width: `${outPct}%` }}
          title={`Out ${formatCurrency(moneyOut)}`}
        />
      </div>
      <div className="flex justify-between text-[11px] text-slate-400">
        <span className="text-emerald-600 dark:text-emerald-400">
          {formatCurrency(moneyIn)} in
        </span>
        <span className="text-rose-600 dark:text-rose-400">
          {formatCurrency(moneyOut)} out
        </span>
      </div>
    </div>
  );
}
