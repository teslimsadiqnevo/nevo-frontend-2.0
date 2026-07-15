import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Nevo text Input (Design System v2 §6). 52px tall, 10px radius, cream fill on a
 * 1.5px border with Level 1 elevation. Navy focus ring; `error` switches to the
 * soft-violet state that signals a (system-triggered) validation problem.
 */
function Input({
  className,
  error,
  ...props
}: React.ComponentProps<"input"> & { error?: boolean }) {
  return (
    <input
      data-slot="input"
      aria-invalid={error || undefined}
      className={cn(
        "h-13 w-full rounded-[10px] border-[1.5px] bg-nevo-cream px-4 text-[15px] text-nevo-near-black shadow-elevation-1 outline-none transition-[border-color,box-shadow] placeholder:text-nevo-near-black/40 disabled:cursor-default disabled:opacity-40",
        error
          ? "border-nevo-violet ring-[3px] ring-nevo-violet/[0.28]"
          : "border-nevo-near-black/[0.16] focus:border-nevo-navy focus:ring-[3px] focus:ring-nevo-navy/[0.18]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
