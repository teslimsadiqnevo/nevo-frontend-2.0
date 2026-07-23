/**
 * Learning channels — the "How you learn" display (Profile & Settings).
 *
 * Read-only, observed patterns (never self-report). Confidence comes from the
 * intelligence framework's profile; only channels at **medium or high**
 * confidence are ever shown, in a fixed order. The copy is approved and used
 * verbatim — do not vary it.
 */

export type Channel =
  | "visual_spatial"
  | "auditory"
  | "reading_writing"
  | "interactive_kinesthetic";

export type ChannelConfidence = "low" | "medium" | "high";

/** Approved statement per channel — exact wording, no variation. */
export const CHANNEL_STATEMENT: Record<Channel, string> = {
  visual_spatial:
    "You tend to understand things better when you can see how they connect",
  auditory: "Hearing explanations tends to work well for you",
  reading_writing: "You work well with written explanations",
  interactive_kinesthetic: "You learn well by trying things out",
};

/** Fixed display order. */
const CHANNEL_ORDER: Channel[] = [
  "visual_spatial",
  "auditory",
  "reading_writing",
  "interactive_kinesthetic",
];

/** Shown when no channel has reached medium/high confidence yet. */
export const NO_CHANNELS_LINE = "Nevo learns how you learn best over time";

/**
 * The student's per-channel confidence. `null` = not yet seeded.
 * TODO(api): source from the profile / Intelligence Framework contract.
 */
export type ChannelConfidenceMap = Record<Channel, ChannelConfidence | null>;

export const MOCK_CHANNEL_CONFIDENCE: ChannelConfidenceMap = {
  visual_spatial: "high",
  auditory: "medium",
  reading_writing: "low",
  interactive_kinesthetic: null,
};

/**
 * The statements to display — medium/high confidence only, in fixed order.
 * Returns 0–4 statements (0 → callers show `NO_CHANNELS_LINE`).
 */
export function visibleChannelStatements(
  confidence: ChannelConfidenceMap,
): string[] {
  return CHANNEL_ORDER.filter(
    (c) => confidence[c] === "medium" || confidence[c] === "high",
  ).map((c) => CHANNEL_STATEMENT[c]);
}
