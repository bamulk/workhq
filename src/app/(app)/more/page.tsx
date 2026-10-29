import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

const links = [
  { href: "/reports", label: "Reports", note: "Net by entity, month by month" },
  { href: "/import", label: "Import CSV", note: "Bring in a bank or app export" },
  { href: "/api/export/csv", label: "Export CSV", note: "Download every transaction" },
  { href: "/entities/new", label: "New entity", note: "Add a business or rental house" },
];

export default async function MorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <PageHeader title="More" />
      <ul className="divide-y divide-rule border-y border-rule">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center gap-3 py-3.5 -mx-2 px-2 rounded-[4px] hover:bg-hover">
              <span className="flex-1 min-w-0">
                <span className="block">{l.label}</span>
                <span className="block text-[13px] text-ink-3">{l.note}</span>
              </span>
              <ChevronRight size={16} className="text-ink-3" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-4 text-[14px]">
        <span className="text-ink-3 truncate">Signed in as {user?.email}</span>
        <SignOutButton className="h-11 px-4 rounded-[4px] border border-rule bg-surface font-semibold hover:border-ink" />
      </div>
    </div>
  );
}
