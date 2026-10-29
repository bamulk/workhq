"use client";

import { ChevronDown } from "lucide-react";
import { Field, Input, Select } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import type { Entity } from "@/lib/types";

export default function EntityForm({
  action,
  entity,
  submitLabel = "Save",
}: {
  action: (formData: FormData) => void | Promise<void>;
  entity?: Partial<Entity>;
  submitLabel?: string;
}) {
  const e = entity ?? {};
  return (
    <form action={action} className="space-y-5 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name">
          <Input name="name" defaultValue={e.name ?? ""} required placeholder="123 Main St" />
        </Field>
        <Field label="Type">
          <Select name="type" defaultValue={e.type ?? "business"}>
            <option value="business">Business</option>
            <option value="rental">Rental house</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address" hint="Street, city, state, ZIP. Rentals need it to pull a home value.">
            <Input name="address" defaultValue={e.address ?? ""} />
          </Field>
        </div>
      </div>

      <details className="group border-t border-rule pt-3">
        <summary className="inline-flex items-center gap-1.5 h-9 text-[14px] text-ink-2 hover:text-ink">
          More options
          <ChevronDown size={16} className="transition-transform duration-150 group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Field label="Kind of business" hint="A short label, like IT or sober living.">
            <Input name="subtype" defaultValue={e.subtype ?? ""} />
          </Field>
          <Field label="Sort order" hint="Lower numbers are listed first.">
            <Input name="sort_order" type="number" defaultValue={e.sort_order?.toString() ?? "100"} />
          </Field>
        </div>
      </details>

      <SubmitButton className="w-full sm:w-auto">{submitLabel}</SubmitButton>
    </form>
  );
}
