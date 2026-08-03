"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The four-segment quest map (`Nevo Quest Map`) - the profiling flow's only
 * progress indicator. Done circles fill navy with a cream check; the active one
 * breathes a soft-violet ring; upcoming stay quiet outlines. The connecting
 * line fills navy up to the last completed circle. No numbers, no labels.
 */
export function QuestMap({
  filled,
  active,
  className,
}: {
  /** How many of the four segments are complete (0-4). */
  filled: number;
  /** 0-based index of the segment in progress; -1 for none. */
  active: number;
  className?: string;
}) {
  const done = Math.max(0, Math.min(4, filled));
  // Circle centres sit at i/3 across the row; the fill line reaches the last
  // completed centre.
  const fillPct = done > 0 ? ((done - 1) / 3) * 100 : 0;

  return (
    <div
      className={cn("relative h-6 w-[300px] sm:h-8 sm:w-[340px]", className)}
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-label={`Part ${Math.min(4, done + 1)} of 4`}
    >
      <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-nevo-navy/20 sm:inset-x-4" />
      <div
        className="absolute left-3 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-nevo-navy transition-[width] duration-300 sm:left-4"
        style={{ width: `calc(${fillPct} * (100% - 1.5rem) / 100)` }}
      />
      <div className="relative flex h-full w-full items-center justify-between">
        {[0, 1, 2, 3].map((i) => {
          const isDone = i < done;
          const isActive = i === active && !isDone;
          return (
            <span
              key={i}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full sm:size-8",
                isDone && "bg-nevo-navy",
                isActive &&
                  "border-2 border-nevo-violet bg-nevo-cream motion-safe:animate-nevo-quest-pulse",
                !isDone && !isActive && "border-2 border-nevo-navy/20 bg-nevo-cream",
              )}
            >
              {isDone && (
                <Check className="size-[11px] text-nevo-cream sm:size-[13px]" strokeWidth={3} />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
