import { formatCurrency, formatSigned } from "@/lib/format";
import type { FlowSummary } from "@/lib/aggregate";

/**
 * The one yellow plate on a screen: the net figure you came for, with money
 * in and money out set beneath it. Presentational — pass a computed summary.
 */
export default function KeyFigures({
  summary,
  label,
}: {
  summary: FlowSummary;
  label: string;
}) {
  const verdict = summary.net > 0 ? "Up" : summary.net < 0 ? "Down" : "Even";
  const figure = formatSigned(summary.net);
  // Step the figure down only when a long value would overflow a phone-width plate.
  const figureSize = figure.length > 10 ? "text-[44px] sm:text-figure" : "text-figure";

  return (
    <section aria-label={`Net, ${label}`} className="bg-plate text-plate-ink rounded-[4px]">
      <div className="px-5 pt-4 pb-5">
        <p className="text-[13px] text-plate-ink-2">
          {verdict} · {label}
        </p>
        <p className={`${figureSize} leading-none font-semibold tracking-[-0.035em] mt-2`}>
          {figure}
        </p>
      </div>
      <dl className="grid grid-cols-2 border-t border-plate-ink/15">
        <div className="px-5 py-3">
          <dt className="text-[13px] text-plate-ink-2">Money in</dt>
          <dd className="text-[17px] font-semibold mt-0.5">{formatCurrency(summary.moneyIn)}</dd>
        </div>
        <div className="px-5 py-3 border-l border-plate-ink/15">
          <dt className="text-[13px] text-plate-ink-2">Money out</dt>
          <dd className="text-[17px] font-semibold mt-0.5">{formatCurrency(summary.moneyOut)}</dd>
        </div>
      </dl>
    </section>
  );
}
