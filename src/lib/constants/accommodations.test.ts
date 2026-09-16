import { describe, expect, it } from "vitest";
import type { AccommodationType } from "@/lib/api/students";
import { ACCOMMODATION_COPY, accommodationCopy } from "./accommodations";

/**
 * These three strings sit on a SENCo's screen beside one named child.
 *
 * They were rendered as pills reading "Reading", "Attention", "Numerical" —
 * a category noun next to a learner's name, which is a label about the learner
 * however neutral the word looks alone. This is a Zero-Tag guard, not a
 * snapshot: it fails on the vocabulary that turns an adjustment into a finding.
 */
const ALL: AccommodationType[] = ["reading", "attention", "numerical"];

/** Words that make the sentence about the child rather than the system. */
const DEFICIT =
  /\b(difficult\w*|struggl\w*|weak\w*|poor|deficit|disorder|impair\w*|delay\w*|below|behind|low|problem with|issues? with|needs? help|support needs?|diagnos\w*|dyslex\w*|adhd|dyscalcul\w*)\b/i;

describe("accommodation copy", () => {
  it("covers every value of the closed enum", () => {
    for (const a of ALL) expect(ACCOMMODATION_COPY[a], a).toBeTruthy();
    expect(Object.keys(ACCOMMODATION_COPY).sort()).toEqual([...ALL].sort());
  });

  it("never describes the learner, only what Nevo does", () => {
    for (const a of ALL) {
      expect(ACCOMMODATION_COPY[a], a).not.toMatch(DEFICIT);
      // The subject is the system. Every sentence names it.
      expect(ACCOMMODATION_COPY[a], a).toMatch(/^Nevo\b/);
    }
  });

  it("is a sentence, not a category word", () => {
    for (const a of ALL) {
      expect(ACCOMMODATION_COPY[a].split(" ").length, a).toBeGreaterThan(4);
    }
  });

  it("never names a cause it was not told", () => {
    for (const a of ALL) {
      expect(ACCOMMODATION_COPY[a], a).not.toMatch(/because|due to|since they/i);
    }
  });

  it("skips a value it has not been taught rather than printing the key", () => {
    expect(accommodationCopy("some_new_kind")).toBeNull();
  });
});
