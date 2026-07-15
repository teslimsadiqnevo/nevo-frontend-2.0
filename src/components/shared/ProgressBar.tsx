import { cn } from "@/lib/utils";

/**
 * Nevo linear progress line (Design System v2 §6). 3px, violet fill on a cream
 * track — used beneath the Lesson Player top bar and in onboarding steps.
 */
export function ProgressBar({
  value,
  className,
  "aria-label": ariaLabel,
}: {
  /** 0–1 fraction complete. */
  value: number;
  className?: string;
  "aria-label"?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cn(
        "h-[3px] w-full overflow-hidden rounded-full bg-nevo-cream-elevated",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className="h-full rounded-full bg-nevo-violet transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
