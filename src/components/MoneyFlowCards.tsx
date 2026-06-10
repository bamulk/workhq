import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { Card } from "@/components/ui";
import { formatCurrency, formatSigned, netTone } from "@/lib/format";
import type { FlowSummary } from "@/lib/aggregate";

/**
 * The headline money-in / money-out / net trio. Presentational — pass in an
 * already-computed summary. Net is colored emerald when positive, rose when negative.
 */
export default function MoneyFlowCards({
  summary,
  label,
}: {
  summary: FlowSummary;
  label?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Money in{label ? ` · ${label}` : ""}
          </span>
          <ArrowDownLeft size={16} className="text-emerald-500" />
        </div>
        <div className="text-2xl font-semibold mt-2 text-emerald-600 dark:text-emerald-400">
          {formatCurrency(summary.moneyIn)}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Money out{label ? ` · ${label}` : ""}
          </span>
          <ArrowUpRight size={16} className="text-rose-500" />
        </div>
        <div className="text-2xl font-semibold mt-2 text-rose-600 dark:text-rose-400">
          {formatCurrency(summary.moneyOut)}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Net{label ? ` · ${label}` : ""}
          </span>
          <Scale size={16} className="text-brand" />
        </div>
        <div className={`text-2xl font-semibold mt-2 ${netTone(summary.net)}`}>
          {formatSigned(summary.net)}
        </div>
      </Card>
    </div>
  );
}
