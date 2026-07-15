import * as React from "react";
import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Ask Nevo trigger (Design System v2 §6; Student B.12). 56px navy circle — the
 * floating entry to the Ask Nevo drawer. `responding` gently pulses while Nevo
 * is working.
 */
function AskNevoButton({
  state = "idle",
  className,
  ...props
}: React.ComponentProps<"button"> & { state?: "idle" | "responding" }) {
  return (
    <button
      type="button"
      aria-label="Ask Nevo"
      className={cn(
        "flex size-14 cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream shadow-elevation-2 transition-transform hover:scale-105 active:scale-95",
        state === "responding" && "motion-safe:animate-nevo-pulse",
        className,
      )}
      {...props}
    >
      <MessageCircle className="size-6" strokeWidth={1.75} />
    </button>
  );
}

export { AskNevoButton };
