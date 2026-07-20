import { cn } from "@/lib/utils";

/**
 * Nevo dot progress indicator (Design System v2 §6). Onboarding-only — the
 * Observed Interaction Sequence's four dots. Filled = solid navy, remaining =
 * violet outline.
 */
export function ProgressDots({
  total,
  current,
  className,
  "aria-label": ariaLabel,
}: {
  total: number;
  /** How many dots are filled. */
  current: number;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={ariaLabel}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-2 rounded-full",
            i < current ? "bg-nevo-navy" : "border-[1.5px] border-nevo-violet",
          )}
        />
      ))}
    </div>
  );
}
