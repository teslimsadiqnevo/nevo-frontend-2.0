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

/**
 * THE ENGINE'S INSTRUCTION - the only affective thing the frontend is told.
 *
 * Frontend §4: "You receive an instruction and apply it as a change to the
 * active screen. You never decide which state is active." The states above
 * describe what the interface DOES; these are what the engine SAYS.
 *
 * WHY THIS EXISTS. `AdaptResponse.proactiveAdjustment` has carried an `action`
 * all along and nothing read it - the twelfth field on this wire that the
 * backend writes and the client ignores. Searching the document for
 * "frustration" or "anxiety" found nothing and the conclusion drawn was that
 * there was no affective transport at all. That was the wrong search: §4 says
 * those words must never reach the frontend, so their absence is the design
 * working, not a gap. The transport is `action`.
 *
 * `action` is a bare `string` in the deployed schema with no enum, so the six
 * below are §4's list rather than the contract's. Anything unrecognised
 * resolves to null and the interface does nothing, which is `no_action` and
 * also rule 5: absence is an instruction, do not fill the gap.
 *
 * NEVER RENDERED, and they travel on the same object: `reason`, `confidence`
 * and `triggerSignals`. Frame 38 is explicit - "the learner is never shown any
 * of this reasoning, no score, no label, no 'you seem frustrated'" - and
 * `confidence` is an engine parameter, which rule 3 keeps off every screen.
 */
export const ADJUSTMENT_ACTIONS = {
  NONE: "no_action",
  MODULATE_DENSITY: "modulate_density",
  INCREASE_DIFFICULTY: "increase_difficulty",
  OFFER_HINT: "offer_hint",
  OFFER_BREAK: "offer_break",
  SHOW_SOCRATIC_PANEL: "show_socratic_panel",
} as const;

export type AdjustmentAction =
  (typeof ADJUSTMENT_ACTIONS)[keyof typeof ADJUSTMENT_ACTIONS];

const KNOWN_ACTIONS = new Set<string>(Object.values(ADJUSTMENT_ACTIONS));

/** The engine's string, or null where it is absent or not one we know. */
export function asAdjustmentAction(
  value: string | null | undefined,
): AdjustmentAction | null {
  if (!value || !KNOWN_ACTIONS.has(value)) return null;
  return value as AdjustmentAction;
}
