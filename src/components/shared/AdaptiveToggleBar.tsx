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
 * Adaptive Toggle Bar (Design System v2 §6; Lesson Player B.7). Pacing control
 * with two active looks: manual (navy — the student tapped it) and
 * system-triggered (violet, pulsing, with a sparkle — Nevo adjusted it).
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
  return (
    <div
      role="group"
      aria-label="Lesson pacing"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-nevo-cream-elevated p-1.5 shadow-elevation-1",
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
            "inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-5 py-2.5 text-[15px] font-medium transition-colors",
            seg.state === "manual" &&
              "border-nevo-navy bg-nevo-navy text-nevo-cream",
            seg.state === "system" &&
              "border-transparent bg-nevo-violet/80 text-nevo-near-black motion-safe:animate-nevo-glow",
            seg.state === "default" &&
              "border-transparent bg-transparent text-nevo-near-black hover:bg-nevo-navy/6",
          )}
        >
          {seg.state === "system" && (
            <Sparkles className="size-3.5" fill="currentColor" strokeWidth={0} />
          )}
          {seg.label}
        </button>
      ))}
    </div>
  );
}
