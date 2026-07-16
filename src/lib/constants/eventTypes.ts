/**
 * Signal event type enums (Frontend Architecture Section 3).
 *
 * Every interaction in the Intelligence Framework's signal layer is captured as
 * a structured event and batched by the `useSignals` hook before being flushed
 * to the backend (`/api/signals/`).
 *
 * TODO(intelligence): reconcile the full event catalogue with the backend
 * Intelligence Framework spec — the events below are those named in Section 3.
 */
export const SIGNAL_EVENT_TYPES = {
  TIME_ON_SEGMENT: "time_on_segment",
  REPLAY: "replay",
  SCROLL: "scroll",
  SIMPLIFY_TRIGGER: "simplify_trigger",
  COMPREHENSION_RESPONSE: "comprehension_response",
  EXIT_ATTEMPT: "exit_attempt",
} as const;

/**
 * Observed Interaction Sequence signals (Product Arch B.2) — the first-run
 * onboarding activities seed the learner profile across cognitive dimensions.
 * Each event carries timing/sequence/hesitation in its payload.
 *
 * TODO(intelligence): reconcile exact names + payload schema with the backend
 * Intelligence Framework once the onboarding-signal contract lands.
 */
export const ONBOARDING_SIGNAL_TYPES = {
  /** Activity entered / finished — brackets each activity's event stream. */
  ACTIVITY_START: "onboarding_activity_start",
  ACTIVITY_COMPLETE: "onboarding_activity_complete",
  /** Visual Sorting — processing-channel / speed. */
  SORT_PLACEMENT: "sort_placement",
  /** Audio Comprehension — audio-channel preference. */
  AUDIO_RESPONSE: "audio_response",
  /** Interactive Engagement — attention pattern / light working memory. */
  PATTERN_TAP: "pattern_tap",
  /** Working-Memory Pairs — working-memory load. */
  MEMORY_FLIP: "memory_flip",
} as const;

export type SignalEventType =
  | (typeof SIGNAL_EVENT_TYPES)[keyof typeof SIGNAL_EVENT_TYPES]
  | (typeof ONBOARDING_SIGNAL_TYPES)[keyof typeof ONBOARDING_SIGNAL_TYPES];

/** How a toggle/adaptation was triggered — see `simplify_trigger` payload. */
export const TRIGGER_SOURCE = {
  MANUAL: "manual",
  SYSTEM: "system",
} as const;

export type TriggerSource =
  (typeof TRIGGER_SOURCE)[keyof typeof TRIGGER_SOURCE];

/** Signal batching thresholds (Section 3). */
export const SIGNAL_BATCH = {
  /** Flush at least this often. */
  FLUSH_INTERVAL_MS: 5_000,
  /** Flush immediately once a batch reaches this many events. */
  MAX_BATCH_SIZE: 20,
} as const;
