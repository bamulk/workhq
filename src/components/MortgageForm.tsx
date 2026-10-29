"use client";

import { Field, Input, Textarea } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { todayISO } from "@/lib/format";
import type { Mortgage } from "@/lib/types";

export default function MortgageForm({
  action,
  mortgage,
  submitLabel = "Save mortgage",
}: {
  action: (formData: FormData) => void | Promise<void>;
  mortgage?: Mortgage;
  submitLabel?: string;
}) {
  const m = mortgage;
  return (
    <form action={action} className="space-y-5 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Lender">
          <Input name="lender" defaultValue={m?.lender ?? ""} placeholder="Lender name" />
        </Field>
        <Field label="Balance owed" hint="From your latest statement.">
          <Input name="balance" inputMode="decimal" required defaultValue={m?.balance?.toString() ?? ""} placeholder="245,000" />
        </Field>
        <Field label="Balance as of">
          <Input type="date" name="balance_as_of" required defaultValue={m?.balance_as_of ?? todayISO()} />
        </Field>
        <Field label="Interest rate (%)">
          <Input name="interest_rate" inputMode="decimal" defaultValue={m?.interest_rate?.toString() ?? ""} placeholder="6.125" />
        </Field>
        <Field label="Monthly payment" hint="Principal and interest only, without escrow.">
          <Input name="monthly_payment" inputMode="decimal" defaultValue={m?.monthly_payment?.toString() ?? ""} placeholder="1,480" />
        </Field>
        <Field label="Payoff date">
          <Input type="date" name="payoff_date" defaultValue={m?.payoff_date ?? ""} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea name="notes" rows={2} defaultValue={m?.notes ?? ""} />
          </Field>
        </div>
      </div>
      <p className="text-[13px] text-ink-3">
        With a rate and payment filled in, the balance is estimated forward each month, so you only need to update it
        now and then.
      </p>
      <SubmitButton className="w-full sm:w-auto">{submitLabel}</SubmitButton>
    </form>
  );
}
