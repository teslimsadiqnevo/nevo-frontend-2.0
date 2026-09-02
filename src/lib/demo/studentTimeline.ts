import type { Scene } from "./timeline";

/**
 * The student demo's timeline - the other half of the pair.
 *
 * The teacher video ends with Amara being recommended a listen-first maths
 * lesson. This one is that lesson, from her side, and the pairing is not
 * contrived: `ADDING_FRACTIONS_PLAN` in the fixtures genuinely carries
 * `suggestModality: AUDIO` on its recap segment. The product already believed
 * this story before either video existed.
 *
 * WEIGHTING. The brief asks for emphasis on how lessons adapt, so the three
 * adaptation beats - support, channel, rest - take 58 seconds of the 118,
 * roughly half the film, and each gets long enough for a room to read the
 * offer and understand who made it and why. The surrounding scenes are
 * deliberately brief: they exist to give the adaptation somewhere to happen.
 */

export type StudentSceneId =
  | "intro"
  | "home"
  | "lesson"
  | "support"
  | "channel"
  | "rest"
  | "summary"
  | "closing";

export const STUDENT_TIMELINE: Scene[] = [
  {
    id: "intro",
    duration: 6500,
    label: "Opening",
    narration: "A lesson that meets her where she is.",
  },
  {
    id: "home",
    duration: 13000,
    label: "Her day",
    narration:
      "Amara opens Nevo. A warm-up to tune the day, whatever she was part-way through, and what is ready when she is.",
  },
  {
    id: "lesson",
    duration: 15000,
    label: "The lesson",
    narration:
      "It starts as an ordinary lesson. What is different is that Nevo is watching how it goes, and is allowed to change it.",
  },
  {
    id: "support",
    duration: 20000,
    label: "Adapts: support",
    narration:
      "When the work gets harder, the support quietly comes up. Four small circles, no score and no label - a signal the system gives itself, never a difficulty she has to choose.",
  },
  {
    id: "channel",
    duration: 21000,
    label: "Adapts: channel",
    narration:
      "And when reading is the thing slowing her down, it offers her another way in. One question, two plain answers - Nevo suggests, Amara decides.",
  },
  {
    id: "rest",
    duration: 17000,
    label: "Adapts: rest",
    narration:
      "It also knows when to stop. A break is offered, not imposed, and declining it costs her nothing.",
  },
  {
    id: "summary",
    duration: 14000,
    label: "What she did",
    narration:
      "At the end she sees what she did - in her own language, with nothing about her ranked against anybody else.",
  },
  {
    id: "closing",
    duration: 11000,
    label: "Closing",
    narration: "Every lesson, shaped to the learner.",
  },
];

export const STUDENT_TOTAL = STUDENT_TIMELINE.reduce(
  (sum, s) => sum + s.duration,
  0,
);
