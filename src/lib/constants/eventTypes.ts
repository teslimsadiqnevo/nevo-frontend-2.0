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
  /** Module boundary screen shown (SCRUM-101) — payload { moduleId }. */
  MODULE_BOUNDARY_REACHED: "module_boundary_reached",
  /** The student's boundary choice — payload { moduleId, action: continue|break }. */
  MODULE_BOUNDARY_ACTION: "module_boundary_action",
  /**
   * Touch Signal Contract (SCRUM-94.8): a start/end pair bracketing every
   * window in which the system, not the student, owns the wait — so idle time
   * inside it is never misread as hesitation. Payload { reason, phase }.
   */
  SYSTEM_BUSY: "system_busy",
  /**
   * A tap on an inert scrim (SCRUM-94.8 G1). Diagnostic only — recorded as
   * blocked, never written to latency or aborted-gesture channels. It tells us
   * the scrim still read as tappable: a design signal, not a student one.
   */
  TAP_BLOCKED: "tap_blocked",
  /**
   * One per session, at start (G6): the form factor and reduced-motion mode the
   * whole session's signals should be interpreted under.
   */
  SESSION_CONTEXT: "session_context",
} as const;

/** `system_busy` reasons — the closed set from the Touch Signal Contract. */
export const BUSY_REASON = {
  AUTH_PENDING: "auth_pending",
  CONTENT_LOADING: "content_loading",
  TRANSITION_SCREEN: "transition_screen",
  CONFIRMATION_HOLD: "confirmation_hold",
  MODALITY_SWITCH: "modality_switch",
  VIEW_TRANSITION: "view_transition",
  MEDIA_PLAYING: "media_playing",
  BLOCKED_BY_MODAL: "blocked_by_modal",
} as const;

export type BusyReason = (typeof BUSY_REASON)[keyof typeof BUSY_REASON];

export const BUSY_PHASE = {
  START: "start",
  END: "end",
} as const;

export type BusyPhase = (typeof BUSY_PHASE)[keyof typeof BUSY_PHASE];

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
