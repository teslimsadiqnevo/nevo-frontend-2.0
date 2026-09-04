import {
  markCheckpoint,
  type CheckpointOption,
  type CheckpointScalar,
  type MarkResult,
} from "./checkpoints";

/**
 * The five typed modality payloads a lesson segment can carry.
 *
 * These were `Record<string, unknown>` because the spec described them as
 * arbitrary dictionaries. They are typed as of 3 Sep, so a renderer can reach
 * for a field instead of guessing at one.
 *
 * Two things here are load-bearing and easy to miss:
 *
 * `interactiveVariant.answerKey` carries the SAME nullable union as a
 * comprehension checkpoint, and the same rule applies - null means unmarkable,
 * never wrong. `markInteractive` below routes through the checkpoint marker so
 * there is one implementation of that judgement, not two that can drift.
 *
 * Audio and visual URLs can EXPIRE. Both carry `urlExpiresInSeconds`, and
 * audio adds `requiresAuthentication`; a private Supabase URL that has aged
 * out needs refreshing through `POST /api/content/media/url` rather than being
 * rendered as a broken player or a missing image.
 */

export interface TextVariant {
  body: string;
  keyPoints: string[];
}

export interface VisualVariant {
  type: string;
  imageUrl: string;
  storagePath: string;
  prompt: string;
  provider: string;
  /** Who signed the image off, when anyone did. */
  reviewedBy: string | null;
  reviewAttempts: number;
  generatedAt: string;
  caption: string;
  qualityValidated: boolean;
  /** Null means it does not expire. See `mediaUrlExpired`. */
  urlExpiresInSeconds: number | null;
}

export interface AudioVariant {
  script: string;
  audioUrl: string;
  storagePath: string | null;
  durationMs: number;
  provider: string;
  voice: string | null;
  format: string;
  requiresAuthentication: boolean;
  urlExpiresInSeconds: number | null;
  /** Ties narration to one calculation step, when it belongs to one. */
  stepId: string | null;
}

export interface InteractiveVariant {
  type: string;
  prompt: string;
  expectedInteraction: string;
  options: CheckpointOption[];
  /** NULL MEANS UNMARKABLE - see `markInteractive`. */
  answerKey: CheckpointScalar | CheckpointScalar[] | null;
  instructions: string | null;
}

export interface ScaffoldImage {
  imageUrl: string | null;
  storagePath: string | null;
  prompt: string | null;
  caption: string | null;
}

export type CalculationStepInput = "selection" | "numeric" | "text" | "drag";

export interface CalculationStep {
  stepId: string;
  stepNumber: number;
  prompt: string;
  expectedInput: CalculationStepInput;
  hint: string;
  confirmationText: string;
}

export interface CalculationVariant {
  type: string;
  fullEquation: string;
  steps: CalculationStep[];
  scaffoldImage: ScaffoldImage | null;
  completionStatement: string;
}

/** Every variant a segment may carry. All independently nullable. */
export interface SegmentVariants {
  textVariant: TextVariant | null;
  visualVariant: VisualVariant | null;
  audioVariant: AudioVariant | null;
  interactiveVariant: InteractiveVariant | null;
  calculationVariant: CalculationVariant | null;
}

/**
 * Mark a response to an interactive segment.
 *
 * Delegates to the checkpoint marker deliberately: an interactive answer key
 * has the same shape and the same legacy-null problem, and two copies of
 * "is this right?" would eventually disagree. Returns `"unmarkable"` rather
 * than `"incorrect"` when there is no key.
 *
 * `expectedInteraction` describes the GESTURE, not the answer's arity, so the
 * key's own shape decides how it is compared - an array key is a set match
 * whatever the interaction was called.
 */
export function markInteractive(
  variant: Pick<InteractiveVariant, "answerKey">,
  response: CheckpointScalar | CheckpointScalar[] | null | undefined,
): MarkResult {
  return markCheckpoint(
    {
      answerKey: variant.answerKey,
      answerType: Array.isArray(variant.answerKey)
        ? "multiple_choice"
        : "single_choice",
    },
    response,
  );
}

/**
 * Has a generated media URL aged out?
 *
 * `urlExpiresInSeconds` is a LIFETIME, not a deadline - it says how long the
 * URL was minted to last, so it has to be measured from when the payload was
 * fetched. Pass that moment; the caller owns it because only the caller knows
 * when the lesson was loaded.
 *
 * Null lifetime means it does not expire. A margin is applied so a URL that is
 * about to die is refreshed before a child taps play rather than after.
 */
export function mediaUrlExpired(
  urlExpiresInSeconds: number | null,
  fetchedAtMs: number,
  nowMs: number = Date.now(),
  marginSeconds = 30,
): boolean {
  if (urlExpiresInSeconds === null) return false;
  const ageSeconds = (nowMs - fetchedAtMs) / 1000;
  return ageSeconds >= urlExpiresInSeconds - marginSeconds;
}
