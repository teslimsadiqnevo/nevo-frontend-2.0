import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Nevo Top Navigation (Design System v2 §6) — landing & auth screens only.
 * Wordmark left, one CTA right, cream, no border beneath.
 */
export function TopNav({
  right,
  className,
}: {
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex h-[68px] w-full items-center justify-between bg-nevo-cream px-6",
        className,
      )}
    >
      <span className="font-brand text-[26px] font-bold tracking-[-0.03em] text-nevo-navy">
        Nevo
      </span>
      {right}
    </header>
  );
}
