"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AdaptiveToggleBar, ProgressBar, type ToggleSegment } from "@/components/shared";
import { DENSITY, MODALITY, type Density, type Modality } from "@/lib/constants";
import type { AdaptationPlan, Lesson, LessonSegment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AfterLessonAssessment } from "./AfterLessonAssessment";
import { AudioSegment } from "./AudioSegment";
import { InteractiveSegment } from "./InteractiveSegment";
import { ModalitySuggestionPill } from "./ModalitySuggestionPill";
import { QuickCheckSheet } from "./QuickCheckSheet";
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
 * Lesson Player (screen 17) — the immersive reading/learning shell. Slices 1–3:
 * the spine (top bar + progress + centered reading column + chevron nav), all
 * four modalities, reading density on Text, the system's one-per-segment
 * modality suggestion, the inline Quick Check, and the after-lesson assessment.
 * Completion, the leave dialog and the calculation solver arrive in later
 * slices.
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

  // Active reading density. The plan's density arrives pre-applied and reads as
  // the chosen option (navy); the violet "system" look is reserved for live
  // mid-lesson recommendations (Slice 5).
  const [density, setDensity] = useState<Density | null>(
    firstPlan?.density ?? null,
  );
  const [modality, setModality] = useState<Modality>(
    openingModality(first, firstPlan?.startModality),
  );
  // The system gets ONE suggestion per segment; taking or declining it spends it.
  const [suggestionSpent, setSuggestionSpent] = useState(false);
  // …and never offers on consecutive segments (17 doc page).
  const [lastSuggestedIndex, setLastSuggestedIndex] = useState<number | null>(
    null,
  );

  // Segments whose Quick Check has been answered correctly — only a correct
  // answer spends the check (a miss offers Try again / See it explained).
  const [passedChecks, setPassedChecks] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [checkOpen, setCheckOpen] = useState(false);
  // Segments are the lesson itself; the assessment takes over the screen once
  // the last segment is done (growth framing — never a score).
  const [phase, setPhase] = useState<"segments" | "assessment">("segments");

  const segment = lesson.segments[index];

  // Offer the plan's suggestion only while it's renderable and not already showing.
  const suggested = planFor(segment.id)?.suggestModality ?? null;
  const showSuggestion =
    !suggestionSpent &&
    suggested !== null &&
    suggested !== modality &&
    hasContent(segment, suggested) &&
    lastSuggestedIndex !== index - 1;

  const go = (next: number) => {
    if (next < 0 || next >= total) return;
    // Leaving a segment that had a live offer counts as that segment having
    // suggested — the next segment must stay quiet (never consecutive).
    if (showSuggestion) setLastSuggestedIndex(index);
    const nextSegment = lesson.segments[next];
    const nextPlan = planFor(nextSegment.id);
    setIndex(next);
    setDensity(nextPlan?.density ?? null);
    setModality(openingModality(nextSegment, nextPlan?.startModality));
    setSuggestionSpent(false);
  };

  /** Leave the current segment forward — into the next one, or the assessment. */
  const advancePastSegment = () => {
    if (index < total - 1) {
      go(index + 1);
      return;
    }
    if (lesson.assessment) setPhase("assessment");
    // No assessment: the completion screen arrives in Slice 4.
  };

  /** Next chevron — an unpassed Quick Check intercepts the advance. */
  const handleNext = () => {
    if (segment.quickCheck && !passedChecks.has(segment.id)) {
      setCheckOpen(true);
      return;
    }
    advancePastSegment();
  };

  const pickDensity = (id: string) => {
    const d = id as Density;
    setDensity((current) => (current === d ? null : d));
  };

  const densitySegments: ToggleSegment[] = DENSITIES.map(({ id, label }) => ({
    id,
    label,
    state: density === id ? "manual" : "default",
  }));

  const acceptSuggestion = useCallback(() => {
    if (suggested) setModality(suggested);
    setLastSuggestedIndex(index);
    setSuggestionSpent(true);
  }, [suggested, index]);

  const dismissSuggestion = useCallback(() => {
    setLastSuggestedIndex(index);
    setSuggestionSpent(true);
  }, [index]);

  // Once the last segment is behind us there is nowhere further to chevron to
  // (the assessment brings its own forward path).
  const nextDisabled =
    index === total - 1 &&
    !lesson.assessment &&
    !(segment.quickCheck && !passedChecks.has(segment.id));

  // The assessment takes over the full screen — its own header, no player chrome.
  if (phase === "assessment") {
    return (
      <AfterLessonAssessment
        assessment={lesson.assessment!}
        // TODO(slice-4): hand off to the LessonComplete screen instead.
        onFinish={() => router.push("/student/lessons")}
      />
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      {/* Top bar: exit + title, then the density toggle (present in every modality) */}
      <header className="flex shrink-0 flex-col gap-2.5 px-4 pt-2.5 pb-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
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
        <div className="flex justify-end">
          <AdaptiveToggleBar segments={densitySegments} onSelect={pickDensity} />
        </div>
      </header>

      {/* Progress line — segment `index + 1` of `total` */}
      <ProgressBar
        value={(index + 1) / total}
        className="shrink-0"
        aria-label={`Segment ${index + 1} of ${total}`}
      />

      {/* Anchor for the suggestion pill — slides down just below the top bar */}
      <div className="relative">
        {showSuggestion && (
          <ModalitySuggestionPill
            key={`pill-${segment.id}`}
            modality={suggested}
            onAccept={acceptSuggestion}
            onDismiss={dismissSuggestion}
          />
        )}
      </div>

      {/* Content — centered reading column */}
      <div className="flex-1 overflow-y-auto">
        <div
          // Remount on either axis so entry motion replays and per-modality
          // state (audio playback, ticked steps) never leaks across segments.
          key={`${segment.id}:${modality}`}
          className="mx-auto w-full max-w-full px-6 py-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-nevo-slide sm:max-w-[620px] sm:px-8 lg:max-w-[680px] lg:px-10"
        >
          <SegmentBody segment={segment} modality={modality} density={density} />
        </div>
      </div>

      {segment.quickCheck && (
        <QuickCheckSheet
          key={`check-${segment.id}`}
          check={segment.quickCheck}
          open={checkOpen}
          onOpenChange={setCheckOpen}
          onAnswered={(correct) => {
            // TODO(slice-5): emit the comprehension_response signal here.
            if (correct)
              setPassedChecks((prev) => new Set(prev).add(segment.id));
          }}
          onContinue={() => {
            setCheckOpen(false);
            advancePastSegment();
          }}
        />
      )}

      {/* Chevron nav */}
      <nav className="flex shrink-0 items-center justify-center gap-8 px-4 pt-2 pb-6">
        <ChevronButton
          dir="prev"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        />
        <ChevronButton dir="next" disabled={nextDisabled} onClick={handleNext} />
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
          ? "cursor-not-allowed text-nevo-near-black/20"
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
