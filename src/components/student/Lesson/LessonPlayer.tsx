"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AdaptiveToggleBar, ProgressBar, type ToggleSegment } from "@/components/shared";
import {
  DENSITY,
  MODALITY,
  SIGNAL_EVENT_TYPES,
  TRIGGER_SOURCE,
  type Density,
  type Modality,
} from "@/lib/constants";
import { useLesson, useSignals } from "@/hooks";
import type { AdaptationPlan, Lesson, LessonSegment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AfterLessonAssessment } from "./AfterLessonAssessment";
import { AudioSegment } from "./AudioSegment";
import { CalculationSolver } from "./CalculationSolver";
import { FeedbackStrip } from "./FeedbackStrip";
import { InteractiveSegment } from "./InteractiveSegment";
import { LeaveLessonDialog } from "./LeaveLessonDialog";
import { LessonComplete } from "./LessonComplete";
import { ModalitySuggestionPill } from "./ModalitySuggestionPill";
import { OfflineBanner } from "./OfflineBanner";
import { QuickCheckSheet } from "./QuickCheckSheet";
import { TextSegment } from "./TextSegment";
import { VisualSegment } from "./VisualSegment";

const LESSONS_HREF = "/student/lessons";
// Finishing a lesson returns to Home (the daily landing), not the lesson list.
const HOME_HREF = "/student/dashboard";

const DENSITIES: { id: Density; label: string }[] = [
  { id: DENSITY.SIMPLIFY, label: "Simplify" },
  { id: DENSITY.EXPAND, label: "Expand" },
  { id: DENSITY.SLOWER, label: "Slower" },
];

/** Scroll-depth marks (%) that each emit one `scroll` signal per segment. */
const SCROLL_MILESTONES = [25, 50, 75, 100];

/** How long the transient post-answer feedback note lingers before fading. */
const FEEDBACK_MS = 3500;

/** A calculation segment whose Interactive modality routes to the solver (§8). */
function isCalculation(segment: LessonSegment): boolean {
  return Boolean(segment.calculationVariant) && Boolean(segment.calculation);
}

/**
 * Whether we can actually render `modality` for this segment. A segment may list
 * a modality it has no content for. The Interactive modality renders the standard
 * interactive content, or — when the segment carries a `calculationVariant` — the
 * co-construction calculation solver instead (17b §8, the one place a toggle
 * option renders a different component).
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
      return Boolean(segment.interactive) || isCalculation(segment);
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
 * Lesson Player (screen 17) — the immersive reading/learning shell. Slices 1–4:
 * the spine, all four modalities, reading density, the modality suggestion, the
 * inline Quick Check, the after-lesson assessment, completion, the leave dialog,
 * and system states. Slice 5 wires signal collection (`useSignals`) across every
 * interaction and publishes the session into `LessonContext`.
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

  // One signal session spans the whole lesson; useSignals batches events and
  // flushes every 5s, at 20 events, and on unmount (exit/completion).
  const [sessionId] = useState(() => `lesson-${lesson.id}-${crypto.randomUUID()}`);
  const { trackEvent } = useSignals(sessionId);
  const { setActiveLesson } = useLesson();

  // Publish the active session so surfaces outside the player (e.g. Ask Nevo)
  // can see what's being learned; cleared on unmount.
  useEffect(() => {
    setActiveLesson({ lessonId: lesson.id, sessionId, adaptationPlan: plan });
    return () => setActiveLesson(null);
  }, [lesson.id, sessionId, plan, setActiveLesson]);

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
  // the last segment is done (growth framing — never a score), then completion.
  const [phase, setPhase] = useState<"segments" | "assessment" | "complete">(
    "segments",
  );
  // Exiting mid-lesson goes through the leave dialog, not straight out.
  const [leaveOpen, setLeaveOpen] = useState(false);
  // Transient post-answer note that greets the next segment, then fades.
  const [feedback, setFeedback] = useState<string | null>(null);
  // Calculation segments the student has co-constructed to completion — the
  // forward chevron stays gated until the answer assembles (17b §11).
  const [solvedCalcs, setSolvedCalcs] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const segment = lesson.segments[index];

  // ── Signal helpers ──────────────────────────────────────────────────────
  // Max scroll depth + which milestones have fired, reset per segment.
  const scrollDepth = useRef(0);
  const scrollMarks = useRef<Set<number>>(new Set());

  // time_on_segment: one event per segment, emitted when it's left (index
  // change) or on unmount. Keyed on `index` so within-segment modality/density
  // changes don't split the timing.
  useEffect(() => {
    const enteredAt = Date.now();
    const segId = lesson.segments[index].id;
    scrollDepth.current = 0;
    scrollMarks.current = new Set();
    return () => {
      trackEvent(SIGNAL_EVENT_TYPES.TIME_ON_SEGMENT, {
        segmentId: segId,
        durationMs: Date.now() - enteredAt,
        scrollDepthPct: Math.round(scrollDepth.current),
      });
    };
  }, [index, lesson.segments, trackEvent]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const room = el.scrollHeight - el.clientHeight;
    const pct = room <= 0 ? 100 : (el.scrollTop / room) * 100;
    scrollDepth.current = Math.max(scrollDepth.current, pct);
    for (const mark of SCROLL_MILESTONES) {
      if (pct >= mark && !scrollMarks.current.has(mark)) {
        scrollMarks.current.add(mark);
        trackEvent(SIGNAL_EVENT_TYPES.SCROLL, {
          segmentId: segment.id,
          depthPct: mark,
        });
      }
    }
  };

  // Auto-clear the feedback note.
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [feedback]);

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
    // A plan-applied density on the new segment is a system-driven adaptation.
    if (nextPlan?.density) {
      trackEvent(SIGNAL_EVENT_TYPES.SIMPLIFY_TRIGGER, {
        segmentId: nextSegment.id,
        density: nextPlan.density,
        source: TRIGGER_SOURCE.SYSTEM,
      });
    }
  };

  /** Leave the current segment forward — next segment, then assessment, then done. */
  const advancePastSegment = () => {
    if (index < total - 1) {
      go(index + 1);
      return;
    }
    setPhase(lesson.assessment ? "assessment" : "complete");
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
    const next = density === d ? null : d;
    setDensity(next);
    // A tap that sets (not clears) a density is a manual adaptation.
    if (next) {
      trackEvent(SIGNAL_EVENT_TYPES.SIMPLIFY_TRIGGER, {
        segmentId: segment.id,
        density: next,
        source: TRIGGER_SOURCE.MANUAL,
      });
    }
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

  const requestExit = () => {
    trackEvent(SIGNAL_EVENT_TYPES.EXIT_ATTEMPT, {
      segmentId: segment.id,
      index,
    });
    setLeaveOpen(true);
  };

  // A calculation being co-constructed holds the forward chevron until it's
  // solved (17b: forward disabled until the segment completes).
  const calcBlocking =
    modality === MODALITY.INTERACTIVE &&
    isCalculation(segment) &&
    !solvedCalcs.has(segment.id);

  // Once the last segment is behind us there is nowhere further to chevron to
  // (the assessment brings its own forward path).
  const nextDisabled =
    calcBlocking ||
    (index === total - 1 &&
      !lesson.assessment &&
      !(segment.quickCheck && !passedChecks.has(segment.id)));

  // The assessment and completion each take over the full screen — their own
  // layout, no player chrome.
  if (phase === "assessment") {
    return (
      <AfterLessonAssessment
        assessment={lesson.assessment!}
        onAnswer={({ questionIndex, correct }) =>
          trackEvent(SIGNAL_EVENT_TYPES.COMPREHENSION_RESPONSE, {
            kind: "assessment",
            questionIndex,
            correct,
          })
        }
        onFinish={() => setPhase("complete")}
      />
    );
  }

  if (phase === "complete") {
    return (
      <LessonComplete onDone={() => router.push(HOME_HREF)} />
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
            onClick={requestExit}
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

      {/* Calm banner while the device is offline — the cached lesson stays usable */}
      <OfflineBanner />

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
      <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        <div className="mx-auto w-full max-w-full px-6 py-8 sm:max-w-[620px] sm:px-8 lg:max-w-[680px] lg:px-10">
          {feedback && <FeedbackStrip message={feedback} />}
          <div
            // Remount on either axis so entry motion replays and per-modality
            // state (audio playback, ticked steps) never leaks across segments.
            key={`${segment.id}:${modality}`}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-nevo-slide"
          >
            <SegmentBody
              segment={segment}
              modality={modality}
              density={density}
              onReplay={() =>
                trackEvent(SIGNAL_EVENT_TYPES.REPLAY, { segmentId: segment.id })
              }
              onCalcSolved={() =>
                setSolvedCalcs((prev) => new Set(prev).add(segment.id))
              }
              onCalcStep={(correct) =>
                trackEvent(SIGNAL_EVENT_TYPES.COMPREHENSION_RESPONSE, {
                  kind: "calculation",
                  segmentId: segment.id,
                  correct,
                })
              }
            />
          </div>
        </div>
      </div>

      {segment.quickCheck && (
        <QuickCheckSheet
          key={`check-${segment.id}`}
          check={segment.quickCheck}
          open={checkOpen}
          onOpenChange={setCheckOpen}
          onAnswered={(correct) => {
            trackEvent(SIGNAL_EVENT_TYPES.COMPREHENSION_RESPONSE, {
              kind: "quick_check",
              segmentId: segment.id,
              correct,
            });
            if (correct)
              setPassedChecks((prev) => new Set(prev).add(segment.id));
          }}
          onContinue={() => {
            setCheckOpen(false);
            setFeedback("Nice — that's got it. Here's what's next.");
            advancePastSegment();
          }}
        />
      )}

      <LeaveLessonDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onLeave={() => router.push(LESSONS_HREF)}
      />

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
  onReplay,
  onCalcSolved,
  onCalcStep,
}: {
  segment: LessonSegment;
  modality: Modality;
  density: Density | null;
  onReplay: () => void;
  onCalcSolved: () => void;
  onCalcStep: (correct: boolean) => void;
}) {
  if (modality === MODALITY.TEXT && segment.text)
    return <TextSegment content={segment.text} density={density} />;
  if (modality === MODALITY.VISUAL && segment.visual)
    return <VisualSegment content={segment.visual} />;
  if (modality === MODALITY.AUDIO && segment.audio)
    return <AudioSegment content={segment.audio} onReplay={onReplay} />;
  if (modality === MODALITY.INTERACTIVE) {
    // A calculation segment routes the Interactive modality to the solver (§8).
    if (segment.calculationVariant && segment.calculation)
      return (
        <CalculationSolver
          calculation={segment.calculation}
          onSolved={onCalcSolved}
          onStepAnswered={onCalcStep}
          onReplay={onReplay}
        />
      );
    if (segment.interactive)
      return <InteractiveSegment content={segment.interactive} />;
  }
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
