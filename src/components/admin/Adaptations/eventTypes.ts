import type { AdaptationEventType } from "@/lib/api/schoolIntelligence";

/**
 * D21's type filter, in words an administrator can read.
 *
 * The contract's eight values are the ENGINE'S vocabulary - `simplify_trigger`,
 * `modality_suggestion_accepted` - and none of them is a phrase to put in front
 * of a school. They are mapped here, once, so the filter and any future row
 * label cannot drift apart.
 *
 * ZERO-TAG. Every label below describes WHAT NEVO DID. None describes the
 * child, and none implies a reason: "Made a step simpler" is an action Nevo
 * took, where "Struggled with a step" would be a claim about a learner that
 * this console is never entitled to make. The distinction is the whole screen.
 *
 * A TYPE THE ENUM GAINS LATER falls through to `null` and is simply not
 * offered as a filter option, rather than being shown as its raw key. The log
 * still lists the events themselves - a filter that cannot name something is a
 * smaller failure than a screen that prints `modality_switch_outcome` at a
 * head teacher.
 */

export const EVENT_TYPE_LABELS: Record<AdaptationEventType, string> = {
  simplify_trigger: "Made a step simpler",
  expand_trigger: "Went into more depth",
  slower_trigger: "Slowed the pace",
  break_suggested: "Suggested a break",
  modality_suggestion_shown: "Offered another format",
  modality_suggestion_accepted: "Another format was taken up",
  modality_switch_outcome: "How a format change went",
  modality_manual_switch: "The learner chose another format",
};

/** The filter's options, in the order the labels above read most naturally. */
export const EVENT_TYPE_OPTIONS: AdaptationEventType[] = [
  "simplify_trigger",
  "expand_trigger",
  "slower_trigger",
  "break_suggested",
  "modality_suggestion_shown",
  "modality_suggestion_accepted",
  "modality_manual_switch",
  "modality_switch_outcome",
];

/** The label, or null for a value this console has not been taught yet. */
export function eventTypeLabel(value: string): string | null {
  return EVENT_TYPE_LABELS[value as AdaptationEventType] ?? null;
}
