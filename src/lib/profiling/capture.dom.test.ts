import { describe, expect, it } from "vitest";
import { BaselineCapture, reduceTrialModule } from "./capture";

/**
 * The feature vector is the only thing that leaves the device, so it is the
 * only thing that can be wrong in a way nobody sees.
 *
 * It carried response times and nothing else: a child who tapped True three
 * times in 800ms produced a better-looking reading vector than one who read
 * carefully and got all three right. `correct` now travels with the pick, and
 * these tests are about the two ways summarising it goes wrong - treating "not
 * measured" as zero, and hiding the denominator.
 *
 * `.dom.test.ts` because `BaselineCapture` stamps `performance.now()` and
 * reaches for `indexedDB`; neither belongs in the node project.
 */

const pick = (
  capture: BaselineCapture,
  act: string,
  payload: Record<string, unknown>,
) => capture.record("trial_pick", { module: "sentence_dot", act, ...payload });

const readingOf = (capture: BaselineCapture) =>
  reduceTrialModule(capture, "sentence_dot").acts.reading;

describe("reduceTrialModule", () => {
  it("scores a child who got them all right", () => {
    const c = new BaselineCapture("s1");
    pick(c, "reading", { rtMs: 3000, correct: true });
    pick(c, "reading", { rtMs: 3200, correct: true });

    expect(readingOf(c)).toMatchObject({ trials: 2, scored: 2, accuracy: 1 });
  });

  it("scores a child who guessed fast and got them wrong", () => {
    // The exact shape that used to look BEST: two very quick answers, both
    // wrong. Speed alone reported this as the strongest reader in the cohort.
    const c = new BaselineCapture("s2");
    pick(c, "reading", { rtMs: 400, correct: false });
    pick(c, "reading", { rtMs: 380, correct: false });

    const reading = readingOf(c);
    expect(reading.accuracy).toBe(0);
    expect(reading.meanRtMs).toBe(390);
  });

  it("does not read an absent answer key as zero right", () => {
    // The domain probe is a prior-knowledge sweep with no key at all. Null and
    // 0 mean opposite things to whatever consumes this.
    const c = new BaselineCapture("s3");
    c.record("trial_pick", {
      module: "domain_probe",
      act: "probe",
      rtMs: 2000,
    });

    const probe = reduceTrialModule(c, "domain_probe").acts.probe;
    expect(probe.accuracy).toBeNull();
    expect(probe.scored).toBe(0);
  });

  it("does not let 'Not sure' inflate an accuracy", () => {
    // "Not sure" is offered deliberately and is never marked wrong. But if it
    // simply vanishes, a child who answered one of three and shrugged at the
    // other two arrives as a flawless reader. The denominator is what tells
    // that apart, so it is sent rather than left to be inferred.
    const c = new BaselineCapture("s4");
    pick(c, "reading", { rtMs: 3000, correct: true });
    pick(c, "reading", { rtMs: 2000, notSure: true });
    pick(c, "reading", { rtMs: 2100, notSure: true });

    expect(readingOf(c)).toMatchObject({
      trials: 3,
      scored: 1,
      notSure: 2,
      accuracy: 1,
    });
  });

  it("keeps the two activities of a module apart", () => {
    // Reading and dots share a module and measure different things; averaging
    // them would report a number describing neither.
    const c = new BaselineCapture("s5");
    pick(c, "reading", { rtMs: 3000, correct: true });
    pick(c, "dots", { rtMs: 700, correct: false });

    const acts = reduceTrialModule(c, "sentence_dot").acts;
    expect(acts.reading.accuracy).toBe(1);
    expect(acts.dots.accuracy).toBe(0);
  });
});
