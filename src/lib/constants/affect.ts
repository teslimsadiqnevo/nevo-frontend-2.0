/**
 * THE VOCABULARY THE ENGINE SPEAKS, and the only affective vocabulary this
 * codebase is allowed to have.
 *
 * There used to be an `AFFECTIVE_STATES` map here - `anxiety`, `boredom`,
 * `frustration`, `confusion` - and components named after it. It was deleted
 * on 17 Sep, and not for tidiness. Frontend §4: "You receive an instruction
 * and apply it as a change to the active screen. You never decide which state
 * is active." Code named for states teaches the next person that the frontend
 * reasons about states, and that is the drift this codebase has hit four times
 * - the count interpolation, the insights threshold, the modality field, the
 * client-side empty condition. Every one was a reasonable local decision by
 * somebody reading the code rather than the architecture. Names are what the
 * code says out loud.
 */

/**
 * THE ENGINE'S INSTRUCTION - the only affective thing the frontend is told.
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
