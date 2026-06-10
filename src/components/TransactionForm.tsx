"use client";

import { useState } from "react";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { todayISO } from "@/lib/format";
import type { Transaction, Category, Direction } from "@/lib/types";

type EntityOption = { id: string; name: string; type: "business" | "rental" };
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

  const toggleClass = (active: boolean, tone: "in" | "out") =>
    `flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
      active
        ? tone === "in"
          ? "bg-emerald-500 text-white border-emerald-500"
          : "bg-rose-500 text-white border-rose-500"
        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
    }`;

  return (
    <Card className="p-5">
      <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Direction toggle */}
        <div className="sm:col-span-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
            Direction
          </span>
          <input type="hidden" name="direction" value={direction} />
          <div className="flex gap-2">
            <button type="button" className={toggleClass(direction === "in", "in")} onClick={() => setDirection("in")}>
              ↓ Money in
            </button>
            <button type="button" className={toggleClass(direction === "out", "out")} onClick={() => setDirection("out")}>
              ↑ Money out
            </button>
          </div>
        </div>

        <Field label="Entity">
          <Select
            name="entity_id"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            required
          >
            {entities.length === 0 && <option value="">— No entities —</option>}
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

        <Field label="Amount" hint="Always positive — the toggle sets in vs out.">
          <Input
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={t.amount?.toString() ?? ""}
            required
          />
        </Field>

        <Field label="Category">
          <Select name="category_id" defaultValue={t.category_id ?? ""}>
            <option value="">— Uncategorized —</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Payer / Payee">
          <Input name="counterparty" defaultValue={t.counterparty ?? ""} placeholder="Tenant, client, vendor…" />
        </Field>

        <Field label="Method">
          <Select name="method" defaultValue={t.method ?? ""}>
            <option value="">—</option>
            <option value="zelle">Zelle</option>
            <option value="venmo">Venmo</option>
            <option value="bank">Bank transfer</option>
            <option value="check">Check</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Description">
            <Input name="description" defaultValue={t.description ?? ""} placeholder="What was this?" />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea name="notes" rows={2} defaultValue={t.notes ?? ""} />
          </Field>
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
