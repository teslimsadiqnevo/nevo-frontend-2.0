import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Nevo Pill / filter tag (Design System v2 §6). Tap to select — navy fill when
 * selected, cream with a hairline border when not.
 */
function Pill({
  selected = false,
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type={type}
      data-slot="pill"
      aria-pressed={selected}
      className={cn(
        "cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        selected
          ? "border-nevo-navy bg-nevo-navy text-nevo-cream"
          : "border-nevo-near-black/[0.18] bg-nevo-cream text-nevo-near-black hover:bg-nevo-cream-elevated",
        className,
      )}
      {...props}
    />
  );
}

export { Pill };
