"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronDown } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { todayISO } from "@/lib/format";
import type { Transaction, Category, Direction, EntityType } from "@/lib/types";

type EntityOption = { id: string; name: string; type: EntityType };
type CategoryOption = Pick<Category, "id" | "name" | "kind" | "applies_to">;

export default function TransactionForm({
  action,
  txn,
  entities,
  categories,
  defaultEntityId,
  submitLabel = "Save",
}: {
  action: (formData: FormData) => void | Promise<void>;
  txn?: Partial<Transaction>;
  entities: EntityOption[];
  categories: CategoryOption[];
  defaultEntityId?: string;
  submitLabel?: string;
}) {
  const t = txn ?? {};
  const [direction, setDirection] = useState<Direction>(t.direction ?? "in");
  const [entityId, setEntityId] = useState(t.entity_id ?? defaultEntityId ?? entities[0]?.id ?? "");

  const selectedEntity = entities.find((e) => e.id === entityId);
  const wantKind = direction === "in" ? "income" : "expense";
  const visibleCategories = categories.filter((c) => {
    if (c.kind !== wantKind) return false;
    if (c.applies_to === "any") return true;
    return selectedEntity ? c.applies_to === selectedEntity.type : true;
  });
  const hasDetails = Boolean(t.counterparty || t.method || t.notes);

  const toggle = (active: boolean) =>
    `flex-1 inline-flex items-center justify-center gap-2 h-11 text-[15px] font-semibold transition-colors duration-150 ${
      active ? "bg-ink text-paper" : "bg-surface text-ink-2 hover:text-ink"
    }`;

  return (
    <form action={action} className="space-y-5 max-w-xl">
      <input type="hidden" name="direction" value={direction} />
      <div role="radiogroup" aria-label="Direction" className="flex rounded-[4px] border border-rule overflow-hidden divide-x divide-rule">
        <button
          type="button"
          role="radio"
          aria-checked={direction === "in"}
          className={toggle(direction === "in")}
          onClick={() => setDirection("in")}
        >
          <ArrowDownLeft size={18} /> Money in
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={direction === "out"}
          className={toggle(direction === "out")}
          onClick={() => setDirection("out")}
        >
          <ArrowUpRight size={18} /> Money out
        </button>
      </div>

      <Field label="Amount">
        <div className="relative">
          <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-[24px] font-semibold text-ink-3">$</span>
          <Input
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={t.amount?.toString() ?? ""}
            required
            className="h-14 pl-8 text-[28px] sm:text-[28px] font-semibold tracking-[-0.02em]"
          />
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Entity">
          <Select name="entity_id" value={entityId} onChange={(e) => setEntityId(e.target.value)} required>
            {entities.length === 0 && <option value="">No entities</option>}
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Date">
          <Input type="date" name="occurred_on" defaultValue={t.occurred_on ?? todayISO()} required />
        </Field>

        <Field label="Category">
          <Select name="category_id" defaultValue={t.category_id ?? ""}>
            <option value="">Uncategorized</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description">
          <Input name="description" defaultValue={t.description ?? ""} placeholder="What was this for?" />
        </Field>
      </div>

      <details open={hasDetails} className="group border-t border-rule pt-3">
        <summary className="inline-flex items-center gap-1.5 h-9 text-[14px] text-ink-2 hover:text-ink">
          More details
          <ChevronDown size={16} className="transition-transform duration-150 group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Field label="Paid by / paid to">
            <Input name="counterparty" defaultValue={t.counterparty ?? ""} placeholder="Tenant, client, vendor" />
          </Field>
          <Field label="Method">
            <Select name="method" defaultValue={t.method ?? ""}>
              <option value="">Not set</option>
              <option value="zelle">Zelle</option>
              <option value="venmo">Venmo</option>
              <option value="bank">Bank transfer</option>
              <option value="check">Check</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" rows={3} defaultValue={t.notes ?? ""} />
            </Field>
          </div>
        </div>
      </details>

      <SubmitButton className="w-full sm:w-auto">{submitLabel}</SubmitButton>
    </form>
  );
}
