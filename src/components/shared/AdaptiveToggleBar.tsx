"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToggleState = "default" | "manual" | "system";

export type ToggleSegment = {
  id: string;
  label: string;
  state: ToggleState;
};

/**
 * Adaptive Toggle Bar (Lesson Player frame; Design System v2 §6). Compact pacing
 * control on a quiet near-black track. Two active looks: manual (navy fill — the
 * student chose it) and system (violet, pulsing — Nevo's recommendation, waiting).
 * While a system recommendation sits unfollowed, a violet sparkle glints on the
 * control's top-right corner.
 */
export function AdaptiveToggleBar({
  segments,
  onSelect,
  className,
}: {
  segments: ToggleSegment[];
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const sparkle = segments.some((seg) => seg.state === "system");

  return (
    <div
      role="group"
      aria-label="Lesson pacing"
      className={cn(
        // 44px-tall pills with 8px gaps - touch-first sizing (frame 17 / Touch Audit).
        "relative inline-flex items-center gap-2 rounded-full bg-nevo-near-black/6 p-1",
        className,
      )}
    >
      {segments.map((seg) => (
        <button
          key={seg.id}
          type="button"
          onClick={() => onSelect?.(seg.id)}
          aria-pressed={seg.state !== "default"}
          className={cn(
            "flex h-11 cursor-pointer items-center justify-center rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition-colors",
            seg.state === "manual" && "bg-nevo-navy text-nevo-cream",
            seg.state === "system" &&
              "bg-nevo-violet/80 text-nevo-near-black motion-safe:animate-nevo-glow",
            seg.state === "default" &&
              "bg-transparent text-nevo-near-black hover:bg-nevo-navy/6",
          )}
        >
          {seg.label}
        </button>
      ))}
      {sparkle && (
        <Sparkles
          aria-hidden
          className="pointer-events-none absolute -top-2 -right-[7px] size-[15px] text-nevo-violet motion-safe:animate-nevo-sparkle"
          fill="currentColor"
          strokeWidth={0}
        />
      )}
    </div>
  );
}
