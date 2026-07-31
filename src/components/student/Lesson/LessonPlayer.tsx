"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AdaptiveToggleBar, ProgressBar, type ToggleSegment } from "@/components/shared";
import {
  BUSY_PHASE,
  BUSY_REASON,
  DENSITY,
  MODALITY,
  SIGNAL_EVENT_TYPES,
  TRIGGER_SOURCE,
  type BreakType,
  type BusyPhase,
  type BusyReason,
  type Density,
  type Modality,
} from "@/lib/constants";
import { useLesson, useSignals } from "@/hooks";
import type { AdaptationPlan, Lesson, LessonSegment } from "@/lib/types";
import { cn, randomId } from "@/lib/utils";
import {
  lessonModules,
  modulePositionFor,
  opensLaterModule,
  positionLine,
} from "@/lib/utils/modules";
import { AfterLessonAssessment } from "./AfterLessonAssessment";
import { AudioSegment } from "./AudioSegment";
import { BreakScreen } from "./BreakScreen";
import { CalculationSolver } from "./CalculationSolver";
import { FeedbackStrip } from "./FeedbackStrip";
import { InteractiveSegment } from "./InteractiveSegment";
import { LeaveLessonDialog } from "./LeaveLessonDialog";
import { LessonComplete } from "./LessonComplete";
import { ModalitySuggestionPill } from "./ModalitySuggestionPill";
import { ModuleBoundaryScreen } from "./ModuleBoundaryScreen";
import { OfflineBanner } from "./OfflineBanner";
import { ScaffoldIndicator } from "./ScaffoldIndicator";
import { QuickCheckSheet } from "./QuickCheckSheet";
import { type ReviewAnswer, saveReviewAnswers } from "./reviewStore";
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
  const [sessionId] = useState(() => `lesson-${lesson.id}-${randomId()}`);
  const { trackEvent } = useSignals(sessionId);
  const { setActiveLesson } = useLesson();

  // Assessment picks, captured for the Review Answers screen (a separate route).
  const reviewAnswers = useRef<ReviewAnswer[]>([]);

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
  // SCRUM-101: the segment index the player is about to enter across a module
  // boundary. Non-null takes over the screen with the boundary landing; the
  // student's continue (or break + "I'm ready") completes the move.
  const [boundaryTo, setBoundaryTo] = useState<number | null>(null);
  // Break module (frame 18): a plan-delivered break takes over the screen on
  // the way out of its segment; finishing it resumes the interrupted advance.
  // One break per segment - taken breaks never re-trigger on a back-and-forth.
  const [breakActive, setBreakActive] = useState<BreakType | null>(null);
  const breaksTaken = useRef<Set<string>>(new Set());
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

  // ── Touch Signal Contract markers (SCRUM-94.8) ──────────────────────────
  /** `system_busy` start/end pair — brackets windows the system owns. */
  const trackBusy = useCallback(
    (reason: BusyReason, phase: BusyPhase) =>
      trackEvent(SIGNAL_EVENT_TYPES.SYSTEM_BUSY, { reason, phase }),
    [trackEvent],
  );

  // While the Quick Check sheet is up, the player beneath is unavailable.
  useEffect(() => {
    if (!checkOpen) return;
    trackBusy(BUSY_REASON.BLOCKED_BY_MODAL, BUSY_PHASE.START);
    return () => trackBusy(BUSY_REASON.BLOCKED_BY_MODAL, BUSY_PHASE.END);
  }, [checkOpen, trackBusy]);

  // Scrim taps (the shared sheet overlay broadcasts them): recorded as blocked,
  // never as latency or an aborted gesture — a design signal, not a student one.
  useEffect(() => {
    const onScrimTap = () =>
      trackEvent(SIGNAL_EVENT_TYPES.TAP_BLOCKED, { target: "scrim" });
    window.addEventListener("nevo-scrim-tap", onScrimTap);
    return () => window.removeEventListener("nevo-scrim-tap", onScrimTap);
  }, [trackEvent]);

  // Offer the plan's suggestion only while it's renderable and not already
  // showing. Rate-limits: never on consecutive segments, and never on the first
  // segment after a module boundary (SCRUM-101 - the student just made a
  // transition decision; don't stack an adaptation offer on top of it).
  const suggested = planFor(segment.id)?.suggestModality ?? null;
  const showSuggestion =
    !suggestionSpent &&
    suggested !== null &&
    suggested !== modality &&
    hasContent(segment, suggested) &&
    lastSuggestedIndex !== index - 1 &&
    !opensLaterModule(lesson, index);

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

  /** The forward move itself — next segment, then assessment, then done. */
  const continueAdvance = () => {
    if (index < total - 1) {
      // Crossing into a later module lands on the boundary screen first
      // (SCRUM-101). Backward moves never re-show it.
      if (opensLaterModule(lesson, index + 1)) {
        setBoundaryTo(index + 1);
        return;
      }
      go(index + 1);
      return;
    }
    setPhase(lesson.assessment ? "assessment" : "complete");
  };

  /**
   * Leave the current segment forward. A plan-delivered break (frame 18)
   * intercepts once on the way out; finishing it resumes this same advance.
   */
  const advancePastSegment = () => {
    const plannedBreak = planFor(segment.id)?.breakAfter ?? null;
    if (plannedBreak && !breaksTaken.current.has(segment.id)) {
      breaksTaken.current.add(segment.id);
      setBreakActive(plannedBreak);
      return;
    }
    continueAdvance();
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
    // The accept beat is over and the new modality is on screen.
    trackBusy(BUSY_REASON.MODALITY_SWITCH, BUSY_PHASE.END);
  }, [suggested, index, trackBusy]);

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
        onAnswer={({ questionIndex, selectedId, correct }) => {
          trackEvent(SIGNAL_EVENT_TYPES.COMPREHENSION_RESPONSE, {
            kind: "assessment",
            questionIndex,
            correct,
          });
          // Record the pick (first per question) for the Review Answers screen.
          reviewAnswers.current = [
            ...reviewAnswers.current.filter((a) => a.questionIndex !== questionIndex),
            { questionIndex, selectedId },
          ];
          saveReviewAnswers(lesson.id, reviewAnswers.current);
        }}
        onFinish={() => setPhase("complete")}
        onReviewAnswers={() =>
          router.push(`${LESSONS_HREF}/${lesson.id}/review`)
        }
      />
    );
  }

  if (phase === "complete") {
    return (
      <LessonComplete
        onDone={() => router.push(HOME_HREF)}
        onSeeSummary={
          lesson.summary
            ? () => router.push(`${LESSONS_HREF}/${lesson.id}/summary`)
            : undefined
        }
      />
    );
  }

  // Break module (frame 18) — a calm full screen over the lesson. Ending it
  // resumes the advance the break interrupted (which may itself land on a
  // module boundary next).
  if (breakActive) {
    return (
      <BreakScreen
        type={breakActive}
        onStart={() =>
          trackEvent(SIGNAL_EVENT_TYPES.BREAK_START, {
            type: breakActive,
            trigger: "adaptation_plan",
            segmentId: segment.id,
          })
        }
        onEnd={(durationMs) =>
          trackEvent(SIGNAL_EVENT_TYPES.BREAK_END, {
            type: breakActive,
            durationMs,
          })
        }
        onFeelings={(feelings) =>
          trackEvent(SIGNAL_EVENT_TYPES.FEELING_CHECKIN, { feelings })
        }
        onDone={() => {
          setBreakActive(null);
          continueAdvance();
        }}
      />
    );
  }

  // Module boundary landing (SCRUM-101) — a full player screen between modules,
  // never a modal. Continue (or break + "I'm ready") completes the move.
  if (boundaryTo !== null) {
    const modules = lessonModules(lesson);
    const nextPos = modulePositionFor(lesson, boundaryTo);
    if (modules && nextPos) {
      return (
        <ModuleBoundaryScreen
          lessonTitle={lesson.title}
          finished={modules[nextPos.moduleIndex - 1]}
          next={nextPos.module}
          nextModuleIndex={nextPos.moduleIndex}
          moduleCount={nextPos.moduleCount}
          lessonProgress={boundaryTo / total}
          showRecap={Boolean(plan?.accommodations?.attention)}
          onReached={() =>
            trackEvent(SIGNAL_EVENT_TYPES.MODULE_BOUNDARY_REACHED, {
              moduleId: nextPos.module.id,
            })
          }
          onAction={(action) =>
            trackEvent(SIGNAL_EVENT_TYPES.MODULE_BOUNDARY_ACTION, {
              moduleId: nextPos.module.id,
              action,
            })
          }
          onEnterNext={() => {
            setBoundaryTo(null);
            go(boundaryTo);
          }}
        />
      );
    }
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
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/[0.06] active:bg-nevo-near-black/[0.12]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-base font-medium text-nevo-near-black sm:text-lg">
            {lesson.title}
          </h1>
          {/* 37a: the global scaffold indicator, opposite the exit. */}
          <ScaffoldIndicator
            level={planFor(segment.id)?.scaffold ?? "light"}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          {/* Two-level position line for modular lessons (SCRUM-101.3);
              segment-only lessons read exactly as today. */}
          <span className="min-w-0 truncate font-mono text-[11px] text-nevo-near-black/50">
            {positionLine(lesson, index)}
          </span>
          <AdaptiveToggleBar segments={densitySegments} onSelect={pickDensity} />
        </div>
      </header>

      {/* Progress line — the bar tracks the whole lesson, continuous across
          module boundaries; the text above carries the module breakdown. */}
      <ProgressBar
        value={(index + 1) / total}
        className="shrink-0"
        aria-label={positionLine(lesson, index)}
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
            onAcceptStart={() =>
              trackBusy(BUSY_REASON.MODALITY_SWITCH, BUSY_PHASE.START)
            }
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
              onAudioBusy={(phase) =>
                trackBusy(BUSY_REASON.MEDIA_PLAYING, phase)
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
            setFeedback("Nice - that's got it. Here's what's next.");
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
  onAudioBusy,
  onCalcSolved,
  onCalcStep,
}: {
  segment: LessonSegment;
  modality: Modality;
  density: Density | null;
  onReplay: () => void;
  onAudioBusy: (phase: BusyPhase) => void;
  onCalcSolved: () => void;
  onCalcStep: (correct: boolean) => void;
}) {
  if (modality === MODALITY.TEXT && segment.text)
    return <TextSegment content={segment.text} density={density} />;
  if (modality === MODALITY.VISUAL && segment.visual)
    return <VisualSegment content={segment.visual} />;
  if (modality === MODALITY.AUDIO && segment.audio)
    return (
      <AudioSegment
        content={segment.audio}
        onReplay={onReplay}
        onBusy={onAudioBusy}
      />
    );
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
