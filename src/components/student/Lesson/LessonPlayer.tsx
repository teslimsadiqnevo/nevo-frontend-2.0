"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AdaptiveToggleBar, ProgressBar, type ToggleSegment } from "@/components/shared";
import { DENSITY, MODALITY, type Density, type Modality } from "@/lib/constants";
import type { AdaptationPlan, Lesson, LessonSegment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AudioSegment } from "./AudioSegment";
import { InteractiveSegment } from "./InteractiveSegment";
import { ModalitySuggestionPill } from "./ModalitySuggestionPill";
import { TextSegment } from "./TextSegment";
import { VisualSegment } from "./VisualSegment";

const DENSITIES: { id: Density; label: string }[] = [
  { id: DENSITY.SIMPLIFY, label: "Simplify" },
  { id: DENSITY.EXPAND, label: "Expand" },
  { id: DENSITY.SLOWER, label: "Slower" },
];

/**
 * Whether we can actually render `modality` for this segment. A segment may list
 * a modality it has no content for, and an Interactive segment carrying a
 * `calculationVariant` routes to the co-construction solver — which doesn't exist
 * until Slice 6, so it reads as "no content" for now rather than rendering blank.
 */
function hasContent(segment: LessonSegment, modality: Modality): boolean {
  switch (modality) {
    case MODALITY.TEXT:
      return Boolean(segment.text);
    case MODALITY.VISUAL:
      return Boolean(segment.visual);
    case MODALITY.AUDIO:
      return Boolean(segment.audio);
    case MODALITY.INTERACTIVE:
      return Boolean(segment.interactive) && !segment.calculationVariant;
  }
}

/** The modality a segment opens in: the plan's choice, else the first renderable one. */
function openingModality(
  segment: LessonSegment,
  planned: Modality | undefined,
): Modality {
  if (planned && hasContent(segment, planned)) return planned;
  return segment.modalities.find((m) => hasContent(segment, m)) ?? MODALITY.TEXT;
}

/**
 * Lesson Player (screen 17) — the immersive reading/learning shell. Slices 1–2:
 * the spine (top bar + progress + centered reading column + chevron nav), all
 * four modalities, reading density on Text, and the system's one-per-segment
 * modality suggestion. Comprehension checks, completion and the calculation
 * solver arrive in later slices.
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

  const planFor = (segmentId: string) =>
    plan?.segments.find((s) => s.segmentId === segmentId);

  const [index, setIndex] = useState(0);

  const first = lesson.segments[0];
  const firstPlan = planFor(first.id);

  // Active reading density, and whether it came from the adaptation plan (system)
  // rather than a student tap (manual) — drives the toggle's two active looks.
  const [density, setDensity] = useState<Density | null>(
    firstPlan?.density ?? null,
  );
  const [fromSystem, setFromSystem] = useState<boolean>(
    (firstPlan?.density ?? null) !== null,
  );
  const [modality, setModality] = useState<Modality>(
    openingModality(first, firstPlan?.startModality),
  );
  // The system gets ONE suggestion per segment; taking or declining it spends it.
  const [suggestionSpent, setSuggestionSpent] = useState(false);

  const segment = lesson.segments[index];

  const go = (next: number) => {
    if (next < 0 || next >= total) return;
    const nextSegment = lesson.segments[next];
    const nextPlan = planFor(nextSegment.id);
    setIndex(next);
    setDensity(nextPlan?.density ?? null);
    setFromSystem((nextPlan?.density ?? null) !== null);
    setModality(openingModality(nextSegment, nextPlan?.startModality));
    setSuggestionSpent(false);
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

  // Offer the plan's suggestion only while it's renderable and not already showing.
  const suggested = planFor(segment.id)?.suggestModality ?? null;
  const showSuggestion =
    !suggestionSpent &&
    suggested !== null &&
    suggested !== modality &&
    hasContent(segment, suggested);

  const acceptSuggestion = useCallback(() => {
    if (suggested) setModality(suggested);
    setSuggestionSpent(true);
  }, [suggested]);

  const dismissSuggestion = useCallback(() => setSuggestionSpent(true), []);

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
        {/* Density reshapes written text, so the toggle belongs to Text alone. */}
        <div className="mt-2 flex min-h-[60px] justify-end overflow-x-auto pb-3">
          {modality === MODALITY.TEXT && (
            <AdaptiveToggleBar segments={densitySegments} onSelect={pickDensity} />
          )}
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
          <SegmentBody
            // Remount on either axis so entry motion replays and per-modality
            // state (audio playback, ticked steps) never leaks across segments.
            key={`${segment.id}:${modality}`}
            segment={segment}
            modality={modality}
            density={density}
          />
        </div>
      </div>

      {showSuggestion && (
        <ModalitySuggestionPill
          key={segment.id}
          modality={suggested}
          onAccept={acceptSuggestion}
          onDismiss={dismissSuggestion}
        />
      )}

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

/** Renders the segment through the active modality. */
function SegmentBody({
  segment,
  modality,
  density,
}: {
  segment: LessonSegment;
  modality: Modality;
  density: Density | null;
}) {
  if (modality === MODALITY.TEXT && segment.text)
    return <TextSegment content={segment.text} density={density} />;
  if (modality === MODALITY.VISUAL && segment.visual)
    return <VisualSegment content={segment.visual} />;
  if (modality === MODALITY.AUDIO && segment.audio)
    return <AudioSegment content={segment.audio} />;
  if (modality === MODALITY.INTERACTIVE && segment.interactive)
    return <InteractiveSegment content={segment.interactive} />;
  return <ModalityPlaceholder />;
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

/** Fallback for content this slice can't render yet (the calculation solver, Slice 6). */
function ModalityPlaceholder() {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-[12px] bg-nevo-cream-elevated">
      <span className="font-mono text-xs tracking-[0.04em] text-nevo-near-black/40">
        This modality is coming next
      </span>
    </div>
  );
}
