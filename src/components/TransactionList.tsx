import Link from "next/link";
import { formatDate, formatSigned, netTone } from "@/lib/format";
import type { TransactionWithJoins } from "@/lib/types";

/** Ruled list of transactions: what, when and where on the left; signed amount on the right. */
export default function TransactionList({
  rows,
  showEntity = true,
}: {
  rows: TransactionWithJoins[];
  showEntity?: boolean;
}) {
  return (
    <ul className="divide-y divide-rule border-b border-rule">
      {rows.map((t) => {
        const meta = [
          formatDate(t.occurred_on),
          showEntity ? t.entities?.name : null,
          t.categories?.name ?? "Uncategorized",
        ].filter(Boolean);
        return (
          <li key={t.id}>
            <Link
              href={`/transactions/${t.id}`}
              className="flex items-center gap-4 py-3 -mx-2 px-2 rounded-[4px] hover:bg-hover"
            >
              <span className="flex-1 min-w-0">
                <span className="block truncate">
                  {t.description || t.counterparty || (t.direction === "in" ? "Money in" : "Money out")}
                </span>
                <span className="block text-[13px] text-ink-3 truncate">{meta.join(" · ")}</span>
              </span>
              <span className={`shrink-0 font-semibold ${netTone(t.signed_amount)}`}>
                {formatSigned(t.signed_amount)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
