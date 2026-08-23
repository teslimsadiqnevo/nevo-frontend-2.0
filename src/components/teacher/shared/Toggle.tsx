"use client";

import { cn } from "@/lib/utils";

/**
 * The console's switch (C11 toggle-states frame): navy track when on, muted
 * violet when off, cream knob. No red and no alarm state - an off toggle is a
 * choice, not a warning.
 */
export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-[26px] w-11 shrink-0 cursor-pointer rounded-full transition-colors",
        on ? "bg-nevo-navy" : "bg-nevo-navy/25",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] size-5 rounded-full bg-nevo-cream transition-[left]",
          on ? "left-[21px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
