import type { Scene } from "./timeline";

/**
 * The admin film: adaptation you can account for.
 *
 * The third of three, and it answers the question the first two raise. The
 * teacher film shows a teacher acting on what Nevo noticed; the student film
 * shows a lesson changing under a child. A room watching those two will be
 * forming the obvious worry - what is this system deciding about my students,
 * and what is it writing down about them?
 *
 * So this one is about the record. What Nevo changed, why it changed it, and
 * the single number the whole claim rests on: how many diagnostic labels it
 * holds about children. That number is zero, and it is zero in the product -
 * `diagnosticLabelsStored` is a real field on the compliance audit, and the
 * D22 screen exists to display it.
 *
 * WEIGHTING. The register scene and the zero-labels scene are the argument, so
 * they take the most time. The overview exists to establish that this is a
 * working school, not a slide.
 */

export const ADMIN_TIMELINE: Scene[] = [
  {
    id: "intro",
    duration: 6500,
    label: "Opening",
    narration: "Adaptation you can account for.",
  },
  {
    id: "overview",
    duration: 14000,
    label: "The school",
    narration:
      "A proprietor opens the console. Two hundred and eighty-four learners, and a system that has been changing lessons under them all term.",
  },
  {
    id: "log",
    duration: 17000,
    label: "The record",
    narration:
      "Every one of those changes is written down. What Nevo saw, what it did about it, and for whom - eleven thousand of them this term.",
  },
  {
    id: "register",
    duration: 20000,
    label: "The register",
    narration:
      "Read the wording. Every line describes something that happened in a moment - never a property of the child. That distinction is the product, not the paperwork.",
  },
  {
    id: "zerotag",
    duration: 19000,
    label: "Zero labels",
    narration:
      "Which is why this number is zero, and stays zero. Nevo adapts to a child without ever writing down a label about them.",
  },
  {
    id: "compliance",
    duration: 16000,
    label: "The audit",
    narration:
      "The school can check that for itself, on demand, against the Nigeria Data Protection Act - and hand the result to a regulator or a parent.",
  },
  {
    id: "retention",
    duration: 14000,
    label: "Afterwards",
    narration:
      "And when a student leaves, the school decides what is kept and for how long - in plain words, not a buried toggle.",
  },
  {
    id: "closing",
    duration: 11000,
    label: "Closing",
    narration: "Adaptation you can account for.",
  },
];

export const ADMIN_TOTAL = ADMIN_TIMELINE.reduce((s, x) => s + x.duration, 0);
