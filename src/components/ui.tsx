import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[4px] select-none whitespace-nowrap transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2",
  secondary: "bg-surface text-ink border border-rule hover:border-ink",
  ghost: "text-ink-2 hover:text-ink hover:bg-hover",
  danger: "bg-surface text-loss border border-rule hover:border-loss",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] h-9 px-3",
  md: "text-[15px] h-11 px-4",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant; size?: Size }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/** A plain ruled box — used for forms. Lists and figures sit on the page without one. */
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`bg-surface border border-rule rounded-[4px] ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="space-y-3">
      {back && <BackLink href={back.href}>{back.label}</BackLink>}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-balance">{title}</h1>
          {subtitle && <p className="text-ink-3 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 -ml-1 h-8 pr-2 text-[13px] text-ink-2 hover:text-ink"
    >
      <ChevronLeft size={16} strokeWidth={2} />
      {children}
    </Link>
  );
}

/** Section title sitting on a strong top rule — the report's way of dividing a page. */
export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-1 ${className}`}>
      <div className="flex items-baseline justify-between gap-4 border-t-2 border-rule-strong pt-3 pb-1">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
        {aside && <div className="text-[13px] text-ink-3">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

const inputClass =
  "w-full h-11 border border-rule rounded-[4px] px-3 text-base sm:text-[15px] text-ink transition-colors duration-150 hover:border-ink-3";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={`${inputClass} h-auto py-2.5 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputClass} pr-8 ${props.className ?? ""}`} />;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[13px] text-ink-2">{label}</span>
      {children}
      {hint && <span className="block text-[13px] text-ink-3">{hint}</span>}
    </label>
  );
}

const badgeTones: Record<string, string> = {
  in: "text-gain",
  out: "text-loss",
  committed: "text-gain",
  reverted: "text-ink-3",
  preview: "text-ink-2",
};

/** A quiet printed label: small text in a hairline box. Colour only when it carries meaning. */
export function Badge({
  children,
  tone = "",
  className = "",
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center h-5 px-1.5 rounded-[3px] border border-rule text-[12px] ${
        badgeTones[tone] ?? "text-ink-2"
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-12 px-4 text-center border-y border-rule">
      <p className="font-semibold">{title}</p>
      {description && <p className="text-ink-3 mt-1 max-w-sm mx-auto text-pretty">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-[14px] text-loss border border-loss/40 rounded-[4px] px-3 py-2.5">
      {children}
    </p>
  );
}
