"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Nevo Switch / toggle (Design System v2 §6). 52×30 track with a 24px knob.
 * Navy when on, muted near-black when off. Persists immediately (no save step).
 */
function Switch({
  checked = false,
  onCheckedChange,
  className,
  disabled,
  ...props
}: Omit<React.ComponentProps<"button">, "onChange" | "type"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative h-[30px] w-[52px] shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-default disabled:opacity-40",
        checked ? "bg-nevo-navy" : "bg-nevo-near-black/[0.22]",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute top-[3px] size-6 rounded-full bg-nevo-cream shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-[left] duration-150",
          checked ? "left-[25px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

export { Switch };
