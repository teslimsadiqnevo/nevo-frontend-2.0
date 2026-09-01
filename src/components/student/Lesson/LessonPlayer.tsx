"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AdaptiveToggleBar, ProgressBar, type ToggleSegment } from "@/components/shared";
import {
  AFFECTIVE_STATES,
  BREAK_TYPES,
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
  type SignalEventType,
} from "@/lib/constants";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useBreakMonitor, useLesson, useSignals } from "@/hooks";
import type { AdaptationPlan, Lesson, LessonSegment } from "@/lib/types";
import { cn, randomId } from "@/lib/utils";
import {
  lessonModules,
  modulePositionFor,
  opensLaterModule,
  positionLine,
} from "@/lib/utils/modules";
import {
  affectDim,
  BoredomOfferPill,
  ConfusionSupport,
  FrustrationHint,
} from "./AffectiveLayer";
import { AfterLessonAssessment } from "./AfterLessonAssessment";
import { LESSON_STATUS } from "@/lib/api/lessons";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { AudioSegment } from "./AudioSegment";
import { BreakOfferPill } from "./BreakOfferPill";
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
import { ReviewEntryScreen } from "./ReviewEntryScreen";
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

// Each density is its own event type in the backend ingest contract.
const DENSITY_TRIGGER: Record<Density, SignalEventType> = {
  [DENSITY.SIMPLIFY]: SIGNAL_EVENT_TYPES.SIMPLIFY_TRIGGER,
  [DENSITY.EXPAND]: SIGNAL_EVENT_TYPES.EXPAND_TRIGGER,
  [DENSITY.SLOWER]: SIGNAL_EVENT_TYPES.SLOWER_TRIGGER,
};

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
  review = false,
  live = false,
  startAt = 0,
}: {
  lesson: Lesson;
  plan: AdaptationPlan | null;
  /**
   * The lesson came from the backend, so its id is real and progress can be
   * written against it. False for the two authored mock lessons - writing
   * their invented ids would 404 and blame the network for our own fixture.
   */
  live?: boolean;
  /**
   * Segment to open on, from saved progress. Clamped by the caller; a review
   * session always opens at the top regardless.
   */
  startAt?: number;
  /**
   * Review session (37d): the same player as a spaced-retrieval variant. Adds
   * only an entry screen, the REVIEW pill during, and the "You strengthened
   * this concept" completion; the after-lesson assessment is skipped (the
   * quick checks are the recall).
   */
  review?: boolean;
}) {
  const router = useRouter();
  const total = lesson.segments.length;

  const planFor = (segmentId: string) =>
    plan?.segments.find((s) => s.segmentId === segmentId);

  // A LOCAL correlation id for the in-app lesson context (Ask Nevo reads it).
  // It is NOT the signal session any more: the ingest contract wants a UUID,
  // this is not one, and passing it here is what had every batch rejected 422.
  // Signals ride the backend's issued id - see `useSignals`.
  const [sessionId] = useState(
    () => `${review ? "review" : "lesson"}-${lesson.id}-${randomId()}`,
  );
  // ── Persisted progress ────────────────────────────────────────────────────
  // Nothing wrote a child's position down before this: closing the tab
  // returned a lesson to unstarted. `useLessonProgress` opens the session and
  // reports position; the two authored mocks opt out (`live`), because their
  // ids are invented and a 404 would be ours, not the network's.
  const progress = useLessonProgress(lesson.id, live);
  const { report: reportProgress } = progress;

  // Signals ride the BACKEND's session id, not the local one above - see
  // `useSignals`. Null until `POST /session` answers, which the hook holds for.
  const { trackEvent } = useSignals(progress.sessionId, lesson.id);
  const { setActiveLesson } = useLesson();

  // Assessment picks, captured for the Review Answers screen (a separate route).
  const reviewAnswers = useRef<ReviewAnswer[]>([]);

  // Publish the active session so surfaces outside the player (e.g. Ask Nevo)
  // can see what's being learned; cleared on unmount.
  useEffect(() => {
    setActiveLesson({ lessonId: lesson.id, sessionId, adaptationPlan: plan });
    return () => setActiveLesson(null);
  }, [lesson.id, sessionId, plan, setActiveLesson]);

  // Resuming opens on the saved segment; a review session replays the whole
  // thing, so it ignores the saved position.
  const opening =
    !review && startAt > 0 && startAt < lesson.segments.length ? startAt : 0;
  const [index, setIndex] = useState(opening);

  const first = lesson.segments[opening];
  const firstPlan = planFor(first.id);

  // The student's MANUAL density pick (navy chip). Separate from the system's
  // standing density — the segment plan's, defaulting to Simplify (frame:
  // `adaptive ?? "Simplify"`) — which renders as the violet chip and supplies
  // the resting view until the student overrides. Both can show at once.
  const [density, setDensity] = useState<Density | null>(null);
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
  // Review sessions open on their entry screen first (37d).
  const [phase, setPhase] = useState<
    "review-entry" | "segments" | "assessment" | "complete"
  >(review ? "review-entry" : "segments");
  // Exiting mid-lesson goes through the leave dialog, not straight out.
  const [leaveOpen, setLeaveOpen] = useState(false);

  // Position, on every move - including the ones that go through a module
  // boundary or a break, which is why this watches `index` rather than
  // hooking each call site.
  useEffect(() => {
    const pos = modulePositionFor(lesson, index);
    reportProgress(LESSON_STATUS.IN_PROGRESS, {
      segment: index,
      ...(pos ? { module: pos.moduleIndex } : {}),
    });
  }, [lesson, index, reportProgress]);

  // Completion. Reported once, however the child leaves the finished lesson.
  //
  // This was keyed on `phase === "complete"` alone, which quietly missed a
  // whole exit: from the assessment result a child can tap "Review answers"
  // instead of "Done", which routes them away WITHOUT the phase ever reaching
  // "complete". They had played every segment and answered every question, and
  // the lesson stayed `in_progress` forever - while the review screen they
  // landed on told them "Your progress is saved".
  //
  // So completion is a function both exits call, not a side effect of one of
  // them. The ref keeps it idempotent.
  const completionReported = useRef(false);
  const markComplete = useCallback(() => {
    if (completionReported.current) return;
    completionReported.current = true;
    reportProgress(LESSON_STATUS.COMPLETED, {
      segment: Math.max(0, lesson.segments.length - 1),
    });
  }, [lesson, reportProgress]);

  useEffect(() => {
    if (phase !== "complete") return;
    markComplete();
  }, [phase, markComplete]);
  // SCRUM-101: the segment index the player is about to enter across a module
  // boundary. Non-null takes over the screen with the boundary landing; the
  // student's continue (or break + "I'm ready") completes the move.
  const [boundaryTo, setBoundaryTo] = useState<number | null>(null);
  // Break module (frame 18): a plan-delivered break takes over the screen on
  // the way out of its segment; finishing it resumes the interrupted advance.
  // One break per segment - taken breaks never re-trigger on a back-and-forth.
  const [breakActive, setBreakActive] = useState<BreakType | null>(null);
  const breaksTaken = useRef<Set<string>>(new Set());
  // Where the active break came from: "advance" resumes the interrupted move,
  // "offer" returns to the same segment. Trigger travels into `break_start`.
  const breakOrigin = useRef<"advance" | "offer">("advance");
  const breakTrigger = useRef<string>("adaptation_plan");
  // Break OFFERS (B.7/37b): spent per segment for affect offers, once per
  // session for the 20-minute monitor. Declining spends; never re-asks.
  const [spentBreakOffers, setSpentBreakOffers] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [timeOfferSpent, setTimeOfferSpent] = useState(false);
  // Boredom escalation offers, spent per segment by acting on them.
  const [spentEscalations, setSpentEscalations] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // The student's own preference gates the prompt - turning it off used to
  // change nothing at all.
  const { suggestBreaks } = useAccessibility();
  const { approachingThreshold } = useBreakMonitor(
    phase === "segments" && suggestBreaks,
  );
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

  // ── Affective state (37b) ───────────────────────────────────────────────
  // Server-inferred later; the plan seam carries it today. The interface
  // modulates while it holds and returns to default when it passes.
  const segPlan = planFor(segment.id);
  const affect = segPlan?.affect ?? AFFECTIVE_STATES.NONE;
  const anxious = affect === AFFECTIVE_STATES.ANXIETY;
  // UDL accommodations (37c) - cross-session delivery themes from the plan.
  const readingOn = Boolean(plan?.accommodations?.reading);
  const attentionOn = Boolean(plan?.accommodations?.attention);

  // Break OFFERS (B.7): frustration persisting offers the plan's break type;
  // the 20-minute monitor primes a micro one. One ask on screen at a time -
  // an offered break outranks (and suppresses) the modality suggestion.
  const affectOfferType =
    affect === AFFECTIVE_STATES.FRUSTRATION
      ? (segPlan?.offerBreak ?? null)
      : null;
  const showAffectBreakOffer =
    affectOfferType !== null && !spentBreakOffers.has(segment.id);
  const showTimeBreakOffer =
    !showAffectBreakOffer && approachingThreshold && !timeOfferSpent;
  const showBreakOffer = showAffectBreakOffer || showTimeBreakOffer;

  // Offer the plan's suggestion only while it's renderable and not already
  // showing. Rate-limits: never on consecutive segments, never on the first
  // segment after a module boundary (SCRUM-101 - the student just made a
  // transition decision; don't stack an adaptation offer on top of it), and
  // never alongside a break offer.
  const suggested = segPlan?.suggestModality ?? null;
  const showSuggestion =
    !suggestionSpent &&
    !showBreakOffer &&
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
    // Manual picks don't carry across segments; the new segment rests on its
    // plan's system density (violet), Simplify when the plan is silent.
    setDensity(null);
    setModality(openingModality(nextSegment, nextPlan?.startModality));
    setSuggestionSpent(false);
    // A plan-applied density on the new segment is a system-driven adaptation.
    if (nextPlan?.density) {
      trackEvent(DENSITY_TRIGGER[nextPlan.density], {
        segmentId: nextSegment.id,
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
    // Review sessions end on the strengthened completion - the quick checks
    // were the retrieval, so no second assessment (37d).
    setPhase(lesson.assessment && !review ? "assessment" : "complete");
  };

  /**
   * Leave the current segment forward. A plan-delivered break (frame 18)
   * intercepts once on the way out; finishing it resumes this same advance.
   */
  const advancePastSegment = () => {
    const plannedBreak = planFor(segment.id)?.breakAfter ?? null;
    if (plannedBreak && !breaksTaken.current.has(segment.id)) {
      breaksTaken.current.add(segment.id);
      breakOrigin.current = "advance";
      breakTrigger.current = "adaptation_plan";
      setBreakActive(plannedBreak);
      return;
    }
    continueAdvance();
  };

  /** Accept/decline the offered break; either way the offer is spent. */
  const acceptBreakOffer = () => {
    if (showAffectBreakOffer) {
      setSpentBreakOffers((prev) => new Set(prev).add(segment.id));
      breakTrigger.current = "affect_offer";
      breakOrigin.current = "offer";
      setBreakActive(affectOfferType);
      return;
    }
    setTimeOfferSpent(true);
    breakTrigger.current = "time_offer";
    breakOrigin.current = "offer";
    setBreakActive(BREAK_TYPES.MICRO);
  };

  const dismissBreakOffer = () => {
    if (showAffectBreakOffer) {
      setSpentBreakOffers((prev) => new Set(prev).add(segment.id));
      return;
    }
    setTimeOfferSpent(true);
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
      trackEvent(DENSITY_TRIGGER[next], {
        segmentId: segment.id,
        source: TRIGGER_SOURCE.MANUAL,
      });
    }
  };

  // Frame contract: the manual pick is navy; the system's standing density is
  // violet (glow-once) and KEEPS showing beside a different manual pick. The
  // sparkle rides the unfollowed system chip (AdaptiveToggleBar).
  const systemDensity: Density = segPlan?.density ?? DENSITY.SIMPLIFY;
  const effectiveDensity: Density = density ?? systemDensity;
  // Only the densities this segment can actually reshape into. Parsed backend
  // content carries one body and no variants, so a live lesson offers none -
  // and an offered density that re-renders identical prose is the player
  // telling a child it adapted when it did not. Authored lessons carry all
  // three and are unaffected.
  const densitySegments: ToggleSegment[] = DENSITIES.filter(
    ({ id }) => segment.text?.body[id] !== undefined,
  ).map(({ id, label }) => ({
    id,
    label,
    state:
      density === id ? "manual" : systemDensity === id ? "system" : "default",
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

  // The entry, assessment and completion screens each take over the full
  // screen — their own layout, no player chrome.
  if (phase === "review-entry") {
    return (
      <ReviewEntryScreen
        lessonTitle={lesson.title}
        onBegin={() => setPhase("segments")}
      />
    );
  }

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
        onReviewAnswers={() => {
          // The lesson IS finished at this point - reviewing is a way of
          // leaving it, not of abandoning it.
          markComplete();
          router.push(`${LESSONS_HREF}/${lesson.id}/review`);
        }}
      />
    );
  }

  if (phase === "complete") {
    // "Your progress is saved" is the screen's default note, and until the
    // progress write existed it was simply untrue. Now it is a report: when
    // the write did not reach Nevo the child is told, in the same words the
    // daily warm-up uses - the fault is ours and it says so.
    const savedNote = progress.completionFailed
      ? "We couldn’t save that just now — that’s on us, not you. Your work is still yours."
      : undefined;

    // Review sessions close on the strengthened-concept variant (37d) - the
    // standard completion screen with only the message swapped.
    if (review) {
      return (
        <LessonComplete
          onDone={() => router.push(HOME_HREF)}
          heading="You strengthened this concept"
          note={
            savedNote ??
            `${lesson.title} is settling in. We'll bring it back once more before it fully sticks.`
          }
          doneLabel="Done"
        />
      );
    }
    return (
      <LessonComplete
        onDone={() => router.push(HOME_HREF)}
        note={savedNote}
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
            trigger: breakTrigger.current,
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
          // An offered break returns to the segment it interrupted; a
          // plan-delivered one resumes the advance it intercepted.
          if (breakOrigin.current === "advance") continueAdvance();
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
      {/* Top bar: exit + title, then the density toggle (present in every modality).
          Frame: 10/14/12 padding, whole bar carries the secondary affect dim. */}
      <header
        className={cn(
          "flex shrink-0 flex-col gap-2.5 px-3.5 pt-2.5 pb-3",
          affectDim(anxious, attentionOn),
        )}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Exit lesson"
            onClick={requestExit}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/[0.06] active:bg-nevo-near-black/[0.12]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
          {/* 37d: quiet violet marker while a review session runs. */}
          {review && (
            <span className="flex h-[26px] shrink-0 items-center rounded-2xl bg-nevo-cream-elevated px-[11px] text-[11px] font-bold tracking-[0.1em] text-nevo-violet">
              REVIEW
            </span>
          )}
          <h1 className="min-w-0 flex-1 truncate text-base font-medium text-nevo-near-black sm:text-lg">
            {lesson.title}
          </h1>
          {/* 37a: the global scaffold indicator, opposite the exit. 37b:
              boredom pulses it once at the transition. */}
          <ScaffoldIndicator
            key={`scaf-${segment.id}`}
            level={segPlan?.scaffold ?? "light"}
            pulse={affect === AFFECTIVE_STATES.BOREDOM}
          />
        </div>
        {/* Frame: the density toggle sits alone on its own right-aligned row.
            Absent entirely when the segment has no reshapes to offer, rather
            than an empty pill rail. */}
        {densitySegments.length > 0 && (
          <div className="flex justify-end">
            <AdaptiveToggleBar
              segments={densitySegments}
              onSelect={pickDensity}
            />
          </div>
        )}
      </header>

      {/* Two-level position line for modular lessons (SCRUM-101.3) - its own
          full-width row directly above the progress bar (frame: 0 16px 7px). */}
      <div className={cn("shrink-0 px-4 pb-[7px]", affectDim(anxious, attentionOn))}>
        <span className="block min-w-0 truncate font-mono text-[11px] tracking-[0.02em] text-nevo-near-black/50">
          {positionLine(lesson, index)}
        </span>
      </div>

      {/* Progress line — the bar tracks the whole lesson, continuous across
          module boundaries; the text above carries the module breakdown. */}
      <ProgressBar
        value={(index + 1) / total}
        className={cn("shrink-0", affectDim(anxious, attentionOn))}
        aria-label={positionLine(lesson, index)}
      />

      {/* Calm banner while the device is offline — the cached lesson stays usable */}
      <OfflineBanner />

      {/* Anchor for system offers — one ask at a time, just below the top bar.
          A break offer (B.7) outranks the modality suggestion. */}
      <div className="relative">
        {showBreakOffer ? (
          <BreakOfferPill
            key={`break-offer-${segment.id}`}
            trigger={showAffectBreakOffer ? "affect" : "time"}
            onAccept={acceptBreakOffer}
            onDismiss={dismissBreakOffer}
          />
        ) : (
          showSuggestion && (
            <ModalitySuggestionPill
              key={`pill-${segment.id}`}
              modality={suggested}
              onAccept={acceptSuggestion}
              onAcceptStart={() =>
                trackBusy(BUSY_REASON.MODALITY_SWITCH, BUSY_PHASE.START)
              }
              onDismiss={dismissSuggestion}
            />
          )
        )}
      </div>

      {/* Content — centered reading column. 37b: boredom frames it in a soft
          violet border ("more here if you want it"). */}
      <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        <div
          className={cn(
            "mx-auto w-full max-w-full p-6 sm:max-w-[620px] sm:p-8 lg:max-w-[680px] lg:p-10",
            affect === AFFECTIVE_STATES.BOREDOM &&
              "rounded-[12px] border-2 border-nevo-violet/45",
          )}
        >
          {feedback && <FeedbackStrip message={feedback} />}
          {affect === AFFECTIVE_STATES.BOREDOM &&
            !spentEscalations.has(segment.id) && (
              <BoredomOfferPill
                key={`boredom-${segment.id}`}
                onSpent={() => {
                  setSpentEscalations((prev) => new Set(prev).add(segment.id));
                  setFeedback("Noted - we'll step things up.");
                }}
              />
            )}
          {affect === AFFECTIVE_STATES.CONFUSION &&
            (segPlan?.socraticPrompts?.length ?? 0) > 0 && (
              <ConfusionSupport
                key={`confusion-${segment.id}`}
                prompts={segPlan!.socraticPrompts!}
              />
            )}
          <div
            // Remount on either axis so entry motion replays and per-modality
            // state (audio playback, ticked steps) never leaks across segments.
            key={`${segment.id}:${modality}`}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-nevo-slide"
          >
            <SegmentBody
              segment={segment}
              modality={modality}
              density={effectiveDensity}
              reading={readingOn}
              attention={attentionOn}
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
          {/* 37b frustration: the unrequested hint under the content. */}
          {affect === AFFECTIVE_STATES.FRUSTRATION && segPlan?.affectHint && (
            <FrustrationHint hint={segPlan.affectHint} />
          )}
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
        onLeave={() => {
          // `exited` is a status the contract defines and nothing ever sent.
          // Leaving deliberately is not the same fact as drifting off mid
          // segment, and the engine is entitled to tell them apart - the
          // position is identical either way, the intent is not.
          reportProgress(LESSON_STATUS.EXITED, { segment: index });
          router.push(LESSONS_HREF);
        }}
      />

      {/* Chevron nav — dims under anxiety; frustration guides the forward
          control with three quiet glow cycles (never displaces it). */}
      <nav
        className={cn(
          "flex shrink-0 items-center justify-center gap-8 px-3.5 pt-2 pb-6",
          affectDim(anxious, attentionOn),
        )}
      >
        <ChevronButton
          dir="prev"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        />
        <ChevronButton
          dir="next"
          disabled={nextDisabled}
          onClick={handleNext}
          className={cn(
            affect === AFFECTIVE_STATES.FRUSTRATION &&
              !nextDisabled &&
              "motion-safe:animate-nevo-glow-guide",
          )}
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
  reading,
  attention,
  onReplay,
  onAudioBusy,
  onCalcSolved,
  onCalcStep,
}: {
  segment: LessonSegment;
  modality: Modality;
  density: Density | null;
  reading: boolean;
  attention: boolean;
  onReplay: () => void;
  onAudioBusy: (phase: BusyPhase) => void;
  onCalcSolved: () => void;
  onCalcStep: (correct: boolean) => void;
}) {
  if (modality === MODALITY.TEXT && segment.text)
    return (
      <TextSegment
        content={segment.text}
        density={density}
        reading={reading}
        attention={attention}
      />
    );
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
  className,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  className?: string;
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
        className,
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
