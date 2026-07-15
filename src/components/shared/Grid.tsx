import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Page container (Design System v2 §5) — centers content with the standard
 * gutters. Use as the outer wrapper for a screen's main column.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-6", className)}>
      {children}
    </div>
  );
}

/**
 * 12-column responsive grid (Design System v2 §5) — 24px gutters, for tablet and
 * desktop. Children set their width with `col-span-*` utilities.
 */
export function Grid({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid grid-cols-12 gap-6", className)}>{children}</div>
  );
}
