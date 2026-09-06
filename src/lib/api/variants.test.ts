import { describe, expect, it } from "vitest";
import { markInteractive, mediaUrlExpired } from "./variants";

/**
 * `interactiveVariant.answerKey` carries the SAME nullable union as a
 * comprehension checkpoint, so it has the same way of going wrong: a null key
 * compared with `===` tells a child they were wrong against no answer.
 *
 * `markInteractive` delegates to `markCheckpoint` rather than reimplementing
 * the judgement, and these tests exist to keep that true - if someone
 * "simplifies" it into its own comparison, the delegation is where the two
 * definitions start to drift and this is what notices.
 */

describe("markInteractive", () => {
  it("returns unmarkable for a null key, exactly as a checkpoint does", () => {
    expect(markInteractive({ answerKey: null }, "2/4")).toBe("unmarkable");
  });

  it("marks a scalar key", () => {
    expect(markInteractive({ answerKey: "2/4" }, "2/4")).toBe("correct");
    expect(markInteractive({ answerKey: "2/4" }, "2/3")).toBe("incorrect");
  });

  it("treats an array key as a set, whatever the interaction was called", () => {
    // `expectedInteraction` describes the GESTURE, not the answer's arity, so
    // the key's own shape decides how it is compared.
    expect(markInteractive({ answerKey: ["a", "b"] }, ["b", "a"])).toBe(
      "correct",
    );
    expect(markInteractive({ answerKey: ["a", "b"] }, ["a"])).toBe("incorrect");
  });

  it("coerces across the types the contract allows", () => {
    expect(markInteractive({ answerKey: 12 }, "12")).toBe("correct");
    expect(markInteractive({ answerKey: true }, "true")).toBe("correct");
  });

  it("marks no response as incorrect when a key exists", () => {
    expect(markInteractive({ answerKey: "2/4" }, null)).toBe("incorrect");
  });
});

/**
 * `urlExpiresInSeconds` is a LIFETIME, not a deadline - it says how long a
 * generated media URL was minted to last, so it only means anything measured
 * from when the payload was fetched. An expired Supabase URL renders as a dead
 * audio player or a missing image.
 */
describe("mediaUrlExpired", () => {
  const T0 = 1_000_000_000_000;

  it("never expires a URL with no lifetime", () => {
    expect(mediaUrlExpired(null, T0, T0 + 9_000_000_000)).toBe(false);
  });

  it("leaves a fresh URL alone", () => {
    expect(mediaUrlExpired(3600, T0, T0 + 5_000)).toBe(false);
  });

  it("expires a URL past its lifetime", () => {
    expect(mediaUrlExpired(3600, T0, T0 + 3_700_000)).toBe(true);
  });

  it("refreshes inside the margin, before a child taps play", () => {
    // 3580s of a 3600s lifetime: still technically valid, deliberately
    // treated as expired so the refresh happens before the tap, not after.
    expect(mediaUrlExpired(3600, T0, T0 + 3_580_000)).toBe(true);
  });

  it("applies the margin to short lifetimes too", () => {
    expect(mediaUrlExpired(60, T0, T0 + 20_000)).toBe(false);
    expect(mediaUrlExpired(60, T0, T0 + 35_000)).toBe(true);
  });
});
