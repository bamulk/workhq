"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, House, List, Building2, Menu } from "lucide-react";
import SignOutButton from "./SignOutButton";

type Item = {
  href: string;
  label: string;
  match: (p: string) => boolean;
};

const desktopItems: Item[] = [
  { href: "/", label: "Overview", match: (p) => p === "/" },
  { href: "/transactions", label: "Activity", match: (p) => p === "/transactions" || /^\/transactions\/(?!new)/.test(p) },
  { href: "/entities", label: "Entities", match: (p) => p.startsWith("/entities") },
  { href: "/reports", label: "Reports", match: (p) => p.startsWith("/reports") },
  { href: "/import", label: "Import", match: (p) => p.startsWith("/import") },
];

type TabItem = Item & { icon: React.ComponentType<{ size?: number; strokeWidth?: number }> };

const tabItems: TabItem[] = [
  { href: "/", label: "Overview", icon: House, match: (p) => p === "/" },
  { href: "/transactions", label: "Activity", icon: List, match: (p) => p === "/transactions" || /^\/transactions\/(?!new)/.test(p) },
  { href: "/transactions/new", label: "Add", icon: Plus, match: (p) => p === "/transactions/new" },
  { href: "/entities", label: "Entities", icon: Building2, match: (p) => p.startsWith("/entities") },
  {
    href: "/more",
    label: "More",
    icon: Menu,
    match: (p) => p.startsWith("/more") || p.startsWith("/reports") || p.startsWith("/import"),
  },
];

function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-semibold text-[17px] tracking-[-0.01em]">
      <span aria-hidden className="w-2.5 h-2.5 bg-ink" />
      Finances
    </Link>
  );
}

export default function NavBar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-paper border-b border-rule"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 md:h-14 flex items-center gap-6">
          <Wordmark />

          <nav aria-label="Main" className="hidden md:flex items-stretch self-stretch gap-1">
            {desktopItems.map((n) => {
              const active = n.match(pathname);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex items-center px-2.5 text-[14px] transition-colors duration-150 ${
                    active
                      ? "font-semibold text-ink after:absolute after:inset-x-2.5 after:bottom-[-1px] after:h-[3px] after:bg-ink"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden md:flex items-center gap-4 text-[14px]">
            <span className="text-ink-3 truncate max-w-[180px]">{displayName}</span>
            <SignOutButton />
            <Link
              href="/transactions/new"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] bg-ink text-paper text-[13px] font-semibold hover:bg-ink-2"
            >
              <Plus size={16} strokeWidth={2.25} /> Add
            </Link>
          </div>
        </div>
      </header>

      {/* Phone tab bar */}
      <nav
        aria-label="Main"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-rule"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="grid grid-cols-5 max-w-lg mx-auto">
          {tabItems.map((n) => {
            const Icon = n.icon;
            const active = n.match(pathname);
            const isAdd = n.href === "/transactions/new";
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center gap-1 h-16 text-[11px] ${
                    active ? "text-ink" : "text-ink-3"
                  } ${active && !isAdd ? "before:absolute before:top-[-1px] before:inset-x-4 before:h-[3px] before:bg-ink" : ""}`}
                >
                  {isAdd ? (
                    <span className="inline-flex items-center justify-center w-10 h-7 rounded-[4px] bg-ink text-paper">
                      <Icon size={18} strokeWidth={2.25} />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center h-7">
                      <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                    </span>
                  )}
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
