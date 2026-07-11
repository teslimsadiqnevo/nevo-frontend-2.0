import Link from "next/link";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import type { NavItem } from "./Sidebar";

/**
 * Nevo Bottom Navigation (Design System v2 §6) — mobile/tablet only, replaces the
 * sidebar on small screens. Violet indicator above the active item.
 */
export function BottomNav({
  items,
  activeHref,
  className,
}: {
  items: NavItem[];
  activeHref?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex w-full rounded-2xl bg-nevo-cream-elevated p-2 shadow-elevation-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1.5 py-1.5"
          >
            <span
              className={cn(
                "h-[3px] w-6 rounded-full",
                active ? "bg-nevo-violet" : "bg-transparent",
              )}
            />
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-[10px]",
                active ? "bg-nevo-navy text-nevo-cream" : "text-nevo-near-black",
              )}
            >
              <Icon icon={item.icon} size="dense" />
            </span>
            <span
              className={cn(
                "text-[11px]",
                active ? "font-medium text-nevo-navy" : "text-nevo-near-black",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
