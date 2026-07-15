import { cn } from "@/lib/utils";

/**
 * Skeleton / loading block (Design System v2 §6). Cream-shimmer surface with a
 * gentle opacity pulse — no spinner, never a blank screen. Compose several to
 * mirror the shape of the content that's loading.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[8px] bg-nevo-cream-shimmer motion-safe:animate-pulse",
        className,
      )}
      aria-hidden
    />
  );
}
