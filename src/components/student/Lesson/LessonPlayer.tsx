"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AdaptiveToggleBar, ProgressBar, type ToggleSegment } from "@/components/shared";
import { DENSITY, type Density } from "@/lib/constants";
import type { AdaptationPlan, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TextSegment } from "./TextSegment";

const DENSITIES: { id: Density; label: string }[] = [
  { id: DENSITY.SIMPLIFY, label: "Simplify" },
  { id: DENSITY.EXPAND, label: "Expand" },
  { id: DENSITY.SLOWER, label: "Slower" },
];

/**
 * Lesson Player (screen 17) — the immersive reading/learning shell. Slice 1: the
 * spine (top bar + progress + centered reading column + chevron nav) and the Text
 * modality with Simplify/Expand/Slower density. Other modalities, the modality
 * suggestion, comprehension checks and completion arrive in later slices.
 */
export function LessonPlayer({
  lesson,
  plan,
}: {
  lesson: Lesson;
  plan: AdaptationPlan | null;
}) {
  const router = useRouter();
  const total = lesson.segments.length;

  const planDensityFor = (segmentId: string): Density | null =>
    plan?.segments.find((s) => s.segmentId === segmentId)?.density ?? null;

  const [index, setIndex] = useState(0);
  // Active reading density, and whether it came from the adaptation plan (system)
  // rather than a student tap (manual) — drives the toggle's two active looks.
  const [density, setDensity] = useState<Density | null>(
    planDensityFor(lesson.segments[0].id),
  );
  const [fromSystem, setFromSystem] = useState<boolean>(
    planDensityFor(lesson.segments[0].id) !== null,
  );

  const segment = lesson.segments[index];

  const go = (next: number) => {
    if (next < 0 || next >= total) return;
    const planned = planDensityFor(lesson.segments[next].id);
    setIndex(next);
    setDensity(planned);
    setFromSystem(planned !== null);
  };

  const pickDensity = (id: string) => {
    const d = id as Density;
    if (density === d) {
      setDensity(null);
      setFromSystem(false);
    } else {
      setDensity(d);
      setFromSystem(false); // a tap is always a manual choice
    }
  };

  const densitySegments: ToggleSegment[] = DENSITIES.map(({ id, label }) => ({
    id,
    label,
    state: density === id ? (fromSystem ? "system" : "manual") : "default",
  }));

  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      {/* Top bar: exit + title, then the density toggle */}
      <header className="shrink-0 px-4 pt-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Exit lesson"
            onClick={() => router.push("/student/lessons")}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/[0.06] active:bg-nevo-near-black/[0.12]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-base font-medium text-nevo-near-black sm:text-lg">
            {lesson.title}
          </h1>
        </div>
        <div className="mt-2 flex justify-end overflow-x-auto pb-3">
          <AdaptiveToggleBar segments={densitySegments} onSelect={pickDensity} />
        </div>
      </header>

      {/* Progress line — segment `index + 1` of `total` */}
      <ProgressBar
        value={(index + 1) / total}
        className="shrink-0"
        aria-label={`Segment ${index + 1} of ${total}`}
      />

      {/* Content — centered reading column */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-full px-6 py-8 sm:max-w-[620px] sm:px-8 lg:max-w-[680px] lg:px-10">
          {segment.text ? (
            <TextSegment content={segment.text} density={density} />
          ) : (
            <ModalityPlaceholder />
          )}
        </div>
      </div>

      {/* Chevron nav */}
      <nav className="flex shrink-0 items-center justify-center gap-8 px-4 pt-2 pb-6">
        <ChevronButton
          dir="prev"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        />
        <ChevronButton
          dir="next"
          disabled={index === total - 1}
          onClick={() => go(index + 1)}
        />
      </nav>
    </div>
  );
}

function ChevronButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous" : "Next"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-12 items-center justify-center rounded-full transition-colors",
        disabled
          ? "cursor-not-allowed text-nevo-near-black/25"
          : "cursor-pointer text-nevo-navy hover:bg-nevo-navy/6 active:bg-nevo-cream-elevated",
      )}
    >
      <Icon className="size-6" strokeWidth={2} />
    </button>
  );
}

/** Placeholder for a modality not yet built (Slice 2+). */
function ModalityPlaceholder() {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-[12px] bg-nevo-cream-elevated">
      <span className="font-mono text-xs tracking-[0.04em] text-nevo-near-black/40">
        This modality is coming next
      </span>
    </div>
  );
}
