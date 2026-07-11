import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Empty state (Design System v2 §6) — the most recurring component. Cream
 * Elevated card, centered illustration + warm copy. Tone shifts by audience.
 */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-[12px] bg-nevo-cream-elevated px-6 py-8 text-center shadow-elevation-1",
        className,
      )}
    >
      {illustration}
      <div className="flex flex-col gap-1.5">
        <p className="text-lg font-medium text-nevo-near-black">{title}</p>
        {description && (
          <p className="text-sm leading-[1.5] text-nevo-near-black/60">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
