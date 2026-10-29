"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button, ErrorNote } from "@/components/ui";
import type { RefreshState } from "@/app/(app)/entities/property-actions";

export default function RefreshValueButton({
  action,
  label,
  disabledReason,
}: {
  action: (prev: RefreshState) => Promise<RefreshState>;
  label: string;
  disabledReason?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={pending || Boolean(disabledReason)}>
          <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
          {pending ? "Looking up…" : label}
        </Button>
        {disabledReason && <span className="text-[13px] text-ink-3">{disabledReason}</span>}
      </div>
      {state?.error && <ErrorNote>{state.error}</ErrorNote>}
    </form>
  );
}
