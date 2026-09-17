import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ADJUSTMENT_ACTIONS } from "./affect";

/**
 * THE CODE MUST NOT SPEAK A VOCABULARY THE PRODUCT DOES NOT HAVE.
 *
 * There was an `AFFECTIVE_STATES` map and three components named off it -
 * `FrustrationHint`, `BoredomOfferPill`, `ConfusionSupport`. Frontend §4 is
 * explicit that the frontend receives an instruction and never decides which
 * state is active, so the names said out loud that this app reasons about
 * states. Only the authored demo ever reached them, so nothing was wrong on a
 * child's screen; the cost was that the next person to read the player learned
 * the wrong model of the system from the identifiers.
 *
 * Design's ruling on 17 Sep was that this is not cosmetic: "Code named for
 * states teaches the next person that the frontend reasons about states, and
 * that is the exact drift we have hit four times." So this is a lint with a
 * reason rather than a style rule - a state name is how the drift comes back,
 * and a fixture or a demo is exactly where somebody reintroduces one.
 */

const ROOT = join(import.meta.dirname, "..", "..");

/** Every place an instruction is authored, chosen, or rendered. */
const FILES = [
  "lib/constants/affect.ts",
  "lib/types/lesson.ts",
  "lib/lessons/adaptation.ts",
  "lib/mocks/photosynthesis.ts",
  "lib/mocks/adding-fractions.ts",
  "components/student/Lesson/LessonPlayer.tsx",
  "components/student/Lesson/AffectiveLayer.tsx",
  "components/student/Lesson/BreakOfferPill.tsx",
];

const read = (f: string) => readFileSync(join(ROOT, f), "utf8");

/**
 * Comments may discuss the words - the two docblocks recording WHY they went
 * are worth more than the purity of this check, and a future reader who does
 * not know the history is the person who reintroduces them.
 */
const code = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

describe("the affective vocabulary this codebase is allowed", () => {
  it("names no affective state in any code path", () => {
    // The four the engine infers and §4 forbids us knowing. Word-bounded, so
    // `no_action` and `modulate_density` are untouched.
    const states = /\b(anxiety|anxious|boredom|bored|frustration|frustrated|confusion|confused)\b/i;

    for (const f of FILES) {
      const found = code(read(f)).match(states);
      expect(found?.[0], `${f} names the state "${found?.[0]}"`).toBeUndefined();
    }
  });

  it("carries exactly the six actions section 4 names", () => {
    // Not five and not seven: a seventh here means somebody invented an
    // instruction, which is the frontend deciding by another route.
    expect(Object.values(ADJUSTMENT_ACTIONS).sort()).toEqual([
      "increase_difficulty",
      "modulate_density",
      "no_action",
      "offer_break",
      "offer_hint",
      "show_socratic_panel",
    ]);
  });

  it("still records why the state words went", () => {
    // The inverse guard. If a later tidy-up deletes the history, the next
    // person to reach for `affect: "frustration"` has nothing telling them not
    // to - and this whole check becomes an unexplained rule.
    expect(read("lib/constants/affect.ts")).toContain("AFFECTIVE_STATES");
    expect(read("components/student/Lesson/AffectiveLayer.tsx")).toContain(
      "FrustrationHint",
    );
  });
});
