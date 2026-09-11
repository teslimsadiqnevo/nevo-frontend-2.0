import type { ObservationPattern } from "@/lib/api/classes";

/**
 * Plain-language wording for the five roster observation patterns.
 *
 * `LearnerObservationPattern` is a closed enum and the backend deliberately
 * stopped phrasing it - the wording is the client's and the guarantee lives in
 * the schema. This file is that wording, and it is the ONLY copy of it, so a
 * second screen that grows an observations row imports from here rather than
 * writing a set that drifts from this one.
 *
 * ZERO-TAG GOVERNS EVERY STRING BELOW. An observation says what HAPPENED. It
 * must never harden into a trait, a diagnosis, a deficit or a judgement, and
 * the note on each entry records which wrong reading that phrasing is steering
 * away from. The guard is also a test: `observations.test.ts` fails on trait
 * vocabulary, so a later edit cannot quietly slide back.
 *
 * NOTHING HERE DATES ITSELF. The roster route declares no window and no cap, so
 * "this week" and "in the last 30 days" are claims the API has not made.
 */

export interface ObservationCopy {
  title: string;
  body: (firstName: string) => string;
}

export const OBSERVATION_COPY: Record<ObservationPattern, ObservationCopy> = {
  // An event, stated as an event. Deliberately not a rate: a rate is a score
  // about a child, and this screen already refuses scores elsewhere.
  completed_lessons: {
    title: "Lessons finished",
    body: () => "Worked a lesson all the way through to the end.",
  },
  // THE TRAP ONE. "Revisited" converts to "struggles with retention" in one
  // careless reading. The second sentence exists only to block that: it states
  // a fact about the PRODUCT, not about the child.
  revisited_content: {
    title: "Went back over something",
    body: (first) =>
      `Opened material ${first} had already covered and went through it again. Nevo's lessons are built to be re-entered, so this is the material being used the way it was designed to be used.`,
  },
  // Short on purpose. "Steadier" is the backend's comparative and the basis it
  // compared against is not in the response - so no "than last week" (no window
  // in the contract) and no "fewer long pauses" (a mechanism we were not told).
  steadier_pace: {
    title: "Pace",
    body: () => "Nevo has seen the pace even out.",
  },
  // Names no modality. The response says a switch happened, never which way,
  // and "prefers audio" or "needs visuals" is exactly the learning-style label
  // the card above this section promises the console does not produce.
  tried_another_format: {
    title: "Tried another format",
    body: (first) =>
      `Took the same material in a different way. Nevo offers each part of a lesson more than one route in, and ${first} used one of the others.`,
  },
  // An ordinary reading, said plainly. "No pattern" must not land as idleness.
  no_recent_pattern: {
    title: "Nothing standing out",
    body: () =>
      "Nothing consistent enough to name this time. That is an ordinary reading, not a finding about how much work has been done.",
  },
};

/**
 * The count line, when there is a count.
 *
 * `count` is OPTIONAL AND NULLABLE on the contract - `LearnerObservationResponse`
 * requires `pattern` alone. A card that interpolated it unconditionally printed
 * "null times". Absent means we were not told how many, which is not zero.
 */
export function observationCount(count?: number | null): string | null {
  if (typeof count !== "number") return null;
  return count === 1 ? "Once" : `${count} times`;
}
