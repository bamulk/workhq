import { formatCurrency, formatSigned, netTone } from "@/lib/format";

/** Home value, what's owed, and the equity between them, as three ruled figures. */
export default function EquityFigures({
  value,
  owed,
  equity,
}: {
  value: number | null;
  owed: number;
  equity: number | null;
}) {
  return (
    <dl className="grid grid-cols-3 border-b border-rule">
      <div className="py-3 pr-3">
        <dt className="text-[13px] text-ink-3">Home value</dt>
        <dd className="text-[17px] font-semibold mt-0.5">{value == null ? "—" : formatCurrency(value)}</dd>
      </div>
      <div className="py-3 px-3 border-l border-rule">
        <dt className="text-[13px] text-ink-3">Owed</dt>
        <dd className="text-[17px] font-semibold mt-0.5">{formatCurrency(owed)}</dd>
      </div>
      <div className="py-3 pl-3 border-l border-rule">
        <dt className="text-[13px] text-ink-3">Equity</dt>
        <dd className={`text-[17px] font-semibold mt-0.5 ${equity == null ? "" : netTone(equity)}`}>
          {equity == null ? "—" : formatSigned(equity)}
        </dd>
      </div>
    </dl>
  );
}
