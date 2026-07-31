/**
 * Lesson content + adaptation types (FE Architecture §4; Product Arch §Lesson
 * experience). These replace the `unknown` placeholders in `LessonContext` and
 * `useAdaptation`. Shapes are built to a static mock now; when the backend
 * content/adaptation contract lands, swapping the data source shouldn't touch the
 * player UI. TODO(api): reconcile with the ratified backend schema.
 */
import type {
  AffectiveState,
  BreakType,
  CalcModality,
  Density,
  Modality,
  ScaffoldLevel,
} from "@/lib/constants";

// ── Per-modality content ────────────────────────────────────────────────────

/** Text modality — one heading, body variants keyed by density (frame 17). */
export interface TextContent {
  heading: string;
  /** `default` is the base rendering; density keys reshape the same segment. */
  body: Record<Density | "default", string>;
  /**
   * Slower breaks the same idea into small numbered step cards (frame 17);
   * the density's `body` string becomes the lead line above them.
   */
  slowerSteps?: string[];
  /** Expand surfaces key terms as violet chips under the fuller prose. */
  keyTerms?: string[];
  /** Per-density callout (e.g. Simplify "IN SHORT", Expand "WORD EQUATION"). */
  callouts?: Partial<
    Record<Density | "default", { label: string; text: string; sub?: string }>
  >;
}

/** Visual modality — an illustration and/or a simple input→output diagram. */
export interface VisualContent {
  heading: string;
  /** One-line orientation under the heading ("Follow the arrows."). */
  intro?: string;
  /**
   * Named inline artwork (finished SVG shipped with the app) — the frame's
   * answer to missing produced assets: real art, never a wireframe box.
   */
  art?: { id: string; alt: string; caption?: string };
  illustration?: { src: string; alt: string; caption?: string };
  /** e.g. Photosynthesis "TAKES IN → GIVES OUT". */
  diagram?: { inLabel: string; outLabel: string; inputs: string[]; outputs: string[] };
}

/** Audio modality — a produced narration asset + transcript for the disclosure. */
export interface AudioContent {
  heading?: string;
  /** One-line orientation under the heading. */
  intro?: string;
  /** Player-card title, e.g. "Narrated: What is photosynthesis?". */
  title?: string;
  /** Backend-produced asset ref; absent in the mock (UI animates a placeholder). */
  src?: string;
  durationSec?: number;
  transcript: string;
}

/** Interactive modality — tickable steps that reveal an outcome once all done. */
export interface InteractiveContent {
  heading: string;
  /** One-line orientation under the heading ("…there's no rush."). */
  intro?: string;
  /** "YOU'LL NEED" items. */
  needs?: string[];
  steps: string[];
  outcome: { pending: string; done: string };
}

// ── Comprehension check (inline Quick Check) ────────────────────────────────

export interface QuickCheck {
  question: string;
  options: { id: string; label: string }[];
  correctId: string;
  /** Navy note on a correct answer. */
  correctNote: string;
  /** Soft-violet (never red) note on a miss — always reassures continuity. */
  recoveryNote: string;
}

// ── Calculation subsystem (17b §9 — co-construction) ────────────────────────

/** Which calculation the solver co-constructs; non-null triggers the seam (§8). */
export type CalculationVariant = "fraction_add_like" | (string & {});

export interface CalcCardStep {
  prompt: string;
  choices: string[];
  /** Index into `choices`. */
  correct: number;
  hint: string;
  onCorrect?: { highlight?: string; confirm?: string };
}

export interface CalcNumericStep {
  prompt: string;
  input: "numeric";
  answer: string;
  hint: string;
}

export type CalculationStep = CalcCardStep | CalcNumericStep;

export function isNumericStep(step: CalculationStep): step is CalcNumericStep {
  return "input" in step && step.input === "numeric";
}

export interface CalculationSegment {
  variant: CalculationVariant;
  problem: { expression: string; answer: string };
  scaffold: { kind: string; parts: number; rows: number[] };
  steps: CalculationStep[];
  completion: string;
  /** Per-step narration asset refs — producer-generated content. */
  narration?: string[];
  /** Available layers (interactive always; audio/kinesthetic optional). */
  modalities: CalcModality[];
}

// ── Segment + lesson ────────────────────────────────────────────────────────

export interface LessonSegment {
  id: string;
  /** Modalities this segment supports (minimum two). */
  modalities: Modality[];
  text?: TextContent;
  visual?: VisualContent;
  audio?: AudioContent;
  interactive?: InteractiveContent;
  /**
   * Non-null routes the Interactive modality to the co-construction solver
   * instead of the standard interactive content (17b §8 — the ONLY place a
   * toggle option renders a different component).
   */
  calculationVariant?: CalculationVariant | null;
  /** Calculation content, present when `calculationVariant` is set. */
  calculation?: CalculationSegment;
  /** Optional inline comprehension check shown after this segment. */
  quickCheck?: QuickCheck;
}

export interface AssessmentQuestion {
  prompt: string;
  options: { id: string; label: string }[];
  correctId: string;
  /** Soft-violet recovery note (never a score). */
  recoveryNote?: string;
}

/** Low-stakes after-lesson assessment — growth framing, no score. */
export interface Assessment {
  questions: AssessmentQuestion[];
  /** Concepts to surface in the result as "getting the hang of" vs "revisit". */
  masteredConcepts?: string[];
  revisitConcepts?: string[];
  /** Warm result paragraph under "You're getting the hang of this". */
  resultNote?: string;
}

/**
 * Post-lesson recap (frame 18 · Lesson Summary). A warm narrative of what the
 * student did, plus a compact "what you covered" line. Named distinctly from the
 * catalogue's `LessonSummary` (the browse-list card), which is a different shape.
 */
export interface CompletionSummary {
  /** Warm recap paragraph — what they worked through, in plain language. */
  recap: string;
  /** "What you covered" — a middot-joined list of the concepts touched. */
  covered: string;
}

// ── Module structure (SCRUM-101) ────────────────────────────────────────────

/**
 * An intermediate level between lesson and segment. Lessons of 6+ segments get
 * modules by default (teacher can override in either direction at upload);
 * short lessons stay segment-only. Students never see the distinction named -
 * they see a well-structured lesson.
 */
export interface LessonModule {
  id: string;
  /** Teacher-named ("Introduction", "Practice"); position label when absent. */
  title?: string;
  /** The lesson's segment ids belonging to this module, in lesson order. */
  segmentIds: string[];
  /**
   * Gemini-generated at upload, teacher-edited. Shown on the boundary screen
   * ("What you just did" / "What's coming next") only under the attention
   * accommodation; absent text renders no block.
   */
  recap?: string;
  preview?: string;
}

export interface Lesson {
  id: string;
  title: string;
  subject?: string;
  segments: LessonSegment[];
  /**
   * Module structure (SCRUM-101). Absent/empty means segment-only - nothing in
   * the player assumes modules exist.
   */
  modules?: LessonModule[];
  assessment?: Assessment;
  /** Recap shown on the post-lesson summary screen (frame 18). */
  summary?: CompletionSummary;
}

// ── Adaptation plan (personalization overlay — §4) ──────────────────────────

export interface SegmentAdaptation {
  segmentId: string;
  /** Modality the player opens this segment in. */
  startModality: Modality;
  /** Active reading density, if any. */
  density?: Density | null;
  /** One system-suggested modality to surface via the calm pill (never chained). */
  suggestModality?: Modality | null;
  /**
   * Break module (frame 18) inserted after the student leaves this segment
   * forward. Break decisions are confirmed server-side (FE Architecture §5);
   * the plan is the delivery seam the mock exercises today.
   */
  breakAfter?: BreakType | null;
  /**
   * Scaffold indicator level for this segment (37a) - the support the system
   * is quietly giving, generated from behaviour server-side. Defaults to
   * "light" when absent.
   */
  scaffold?: ScaffoldLevel;
  /**
   * Affective response state (37b) - inferred from interaction rhythm on
   * confident multi-signal confirmation, server-side. The interface modulates
   * while it holds and returns to default when it passes.
   */
  affect?: AffectiveState;
  /** Frustration: the unrequested, content-specific hint (Gemini-generated). */
  affectHint?: string;
  /** Confusion: the Socratic panel's 2-3 guided questions. */
  socraticPrompts?: string[];
  /**
   * Frustration persisting past two adaptations: the system OFFERS this break
   * type (accept/decline) rather than delivering one - distinct from
   * `breakAfter`, which inserts a break on the way out of the segment.
   */
  offerBreak?: BreakType | null;
}

/** The adapted lesson structure returned per student (§4). */
export interface AdaptationPlan {
  lessonId: string;
  segments: SegmentAdaptation[];
  /**
   * Active UDL accommodations (37c / SCRUM-71, backend-owned). Cross-session
   * delivery themes, never a label: `reading` renders text more spaciously;
   * `attention` chunks long text into tap-to-continue parts (with a calm pause
   * between), dims secondary chrome and enriches the module boundary with
   * recap/preview blocks; `numerical` is carried by the calc solver's
   * picture-first rendering. TODO(api): source from the ratified contract.
   */
  accommodations?: {
    attention?: boolean;
    reading?: boolean;
    numerical?: boolean;
  };
}
