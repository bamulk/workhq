"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ArrowLeftRight,
  Upload,
  BarChart3,
  Wallet,
} from "lucide-react";
import SignOutButton from "./SignOutButton";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  match: (p: string) => boolean;
};

const items: Item[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/" },
  { href: "/entities", label: "Entities", icon: Building2, match: (p) => p.startsWith("/entities") },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, match: (p) => p.startsWith("/transactions") },
  { href: "/import", label: "Import", icon: Upload, match: (p) => p.startsWith("/import") },
  { href: "/reports", label: "Reports", icon: BarChart3, match: (p) => p.startsWith("/reports") },
];

export default function NavBar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <>
      <header
        className="sticky top-0 z-[1100] backdrop-blur-md bg-white/90 dark:bg-slate-900/85 border-b border-slate-200 dark:border-slate-700/70"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="w-8 h-8 rounded-lg bg-brand text-white inline-flex items-center justify-center">
              <Wallet size={18} />
            </span>
            <span className="tracking-tight hidden md:inline">Finances</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm ml-4">
            {items.map((n) => {
              const Icon = n.icon;
              const active = n.match(pathname);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${
                    active
                      ? "bg-brand text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon size={14} />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 text-sm">
            <span className="text-slate-700 dark:text-slate-300 hidden sm:block truncate max-w-[160px]">
              {displayName}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-[1100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700/70"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
      >
        <ul
          className="grid max-w-lg mx-auto"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((n) => {
            const Icon = n.icon;
            const active = n.match(pathname);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
                    active
                      ? "text-brand"
                      : "text-slate-600 dark:text-slate-400 active:text-slate-900 dark:active:text-slate-100"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-9 h-6 rounded-full ${
                      active ? "bg-brand/10" : ""
                    }`}
                  >
                    <Icon size={18} />
                  </span>
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
