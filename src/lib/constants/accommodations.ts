import type { AccommodationType } from "@/lib/api/students";

/**
 * What Nevo is DOING for a learner, in sentences rather than categories.
 *
 * The three values — `reading`, `attention`, `numerical` — were being rendered
 * as pills reading "Reading", "Attention", "Numerical" beside a named child.
 * That is the shape Zero-Tag exists to forbid: a category noun next to a
 * learner's name is a label about the learner, however neutral the word looks
 * on its own. "Attention" beside Amara Okafor reads as a finding about Amara.
 *
 * So each one becomes a sentence about the SYSTEM's behaviour. The subject of
 * every string below is Nevo, never the child, and none of them names a cause:
 * we know what was adjusted, and we do not know why.
 *
 * This mirrors `lib/constants/observations.ts`, which did the same job for the
 * five roster observation patterns on the same screen — one file, hand-written,
 * with the reasoning beside the words.
 */

export const ACCOMMODATION_COPY: Record<AccommodationType, string> = {
  // Not "reading difficulty", not "reading support" - both name a deficit in
  // the child. This names the adjustment.
  reading: "Nevo keeps the reading level of each step within reach.",
  // The trap one. "Attention" alone is a clinical-sounding noun; what the
  // system actually does is shorten and space the work.
  attention: "Nevo breaks work into shorter stretches, with more pauses.",
  // "Numerical" would read as a maths ability judgement. The adjustment is to
  // how a number problem is presented, not a statement about the learner.
  numerical: "Nevo works through number problems a step at a time.",
};

/** The sentence, or null for a value this console has not been taught yet. */
export function accommodationCopy(value: string): string | null {
  return ACCOMMODATION_COPY[value as AccommodationType] ?? null;
}
