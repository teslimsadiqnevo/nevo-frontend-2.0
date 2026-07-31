/**
 * Affective response states (37b, Intelligence Layer). Not new screens: the
 * same student screens change appearance and behaviour when the system infers
 * an emotional state from interaction rhythm - only on confident, multi-signal
 * confirmation, and only until the state passes. Never a diagnostic label; a
 * temporary state that shifts as the learner shifts.
 */
export const AFFECTIVE_STATES = {
  NONE: "none",
  /** Softened: density reduced, secondary UI dimmed, copy gentled. */
  ANXIETY: "anxiety",
  /** Escalated: violet content border + a step-up offer. */
  BOREDOM: "boredom",
  /** Proactive support: unrequested hint, guided forward glow, then a break offer. */
  FRUSTRATION: "frustration",
  /** Socratic prompt: a question pill opening 2-3 guided questions. */
  CONFUSION: "confusion",
} as const;

export type AffectiveState =
  (typeof AFFECTIVE_STATES)[keyof typeof AFFECTIVE_STATES];
