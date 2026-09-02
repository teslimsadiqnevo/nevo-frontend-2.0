/**
 * The demo timeline: one array, eight beats, roughly three minutes.
 *
 * Durations are deliberate rather than uniform. A conference audience needs
 * about four seconds to read a headline, and considerably longer to absorb a
 * dashboard they have never seen - so the two beats that carry the argument
 * (the dashboard and the student profile) get the most time, and the beats
 * that only move the story along get the least.
 *
 * `narration` is not spoken by anything today. It is here because each scene
 * needs a stated purpose to be worth its seconds, and because a voiceover
 * recorded later should not require the timeline to be re-derived from the
 * components. It doubles as the on-screen caption.
 *
 * No external text-to-speech, and no audio dependency of any kind.
 */

export type SceneId =
  | "intro"
  | "dashboard"
  | "insight"
  | "student"
  | "activity"
  | "action"
  | "result"
  | "closing";

export interface Scene {
  /**
   * A plain string, not the teacher demo's own union: the student demo runs
   * the same engine with its own scene set, and narrowing this to one story's
   * ids would have forced a cast at every entry in the other's timeline.
   */
  id: string;
  /** Milliseconds the scene holds before the timeline advances. */
  duration: number;
  /**
   * The caption shown at the foot of the stage, and the script a voiceover
   * would read. One sentence, written for someone who has never seen the
   * product.
   */
  narration: string;
  /** Short label for the presenter's recording overlay. */
  label: string;
}

export const TIMELINE: Scene[] = [
  {
    id: "intro",
    duration: 6500,
    label: "Opening",
    narration: "One place to understand every learner.",
  },
  {
    id: "dashboard",
    duration: 20000,
    label: "The morning picture",
    narration:
      "A teacher opens the console and sees their morning in one screen - who is active, how the class is moving, and what is worth their attention before first period.",
  },
  {
    id: "insight",
    duration: 16000,
    label: "The signal",
    narration:
      "Nevo does not just display data. It notices - and here it has flagged three learners whose pattern has changed.",
  },
  {
    id: "student",
    duration: 22000,
    label: "The learner",
    narration:
      "One click reaches Amara. She is not falling behind - she is taking longer on written work, three sessions running, and she settles faster when she can hear it first.",
  },
  {
    id: "activity",
    duration: 18000,
    label: "The evidence",
    narration:
      "The evidence is on the page: where the time actually went, concept by concept, and where the reading level is asking more than the idea does.",
  },
  {
    id: "action",
    duration: 18000,
    label: "The action",
    narration:
      "So the teacher acts. Nevo suggests the listen-first version of the next lesson, and says why - the teacher decides.",
  },
  {
    id: "result",
    duration: 14000,
    label: "The result",
    narration:
      "The recommendation reaches Amara's next session, and the teacher can see it landed.",
  },
  {
    id: "closing",
    duration: 11000,
    label: "Closing",
    narration:
      "Understand every learner. Support them at the right moment.",
  },
];

export const TOTAL_DURATION = TIMELINE.reduce((sum, s) => sum + s.duration, 0);

/** Where a scene begins on the overall timeline, for the progress bar. */
export function sceneOffset(index: number): number {
  return TIMELINE.slice(0, index).reduce((sum, s) => sum + s.duration, 0);
}
