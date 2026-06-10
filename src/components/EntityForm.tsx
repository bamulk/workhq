"use client";

import { Card, Field, Input, Select } from "@/components/ui";
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
    <Card className="p-5">
      <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name">
          <Input name="name" defaultValue={e.name ?? ""} required placeholder="Rental House — 123 Main St" />
        </Field>
        <Field label="Type">
          <Select name="type" defaultValue={e.type ?? "business"}>
            <option value="business">Business</option>
            <option value="rental">Rental house</option>
          </Select>
        </Field>
        <Field label="Subtype" hint="Optional label, e.g. it, real_estate, sober_living.">
          <Input name="subtype" defaultValue={e.subtype ?? ""} />
        </Field>
        <Field label="Sort order" hint="Lower numbers show first.">
          <Input name="sort_order" type="number" defaultValue={e.sort_order?.toString() ?? "100"} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address" hint="Mainly for rental houses.">
            <Input name="address" defaultValue={e.address ?? ""} />
          </Field>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
