import { describe, expect, it } from "vitest";
import { EVENT_TYPE_LABELS, EVENT_TYPE_OPTIONS, eventTypeLabel } from "./eventTypes";

/**
 * The engine's vocabulary must never reach a school.
 *
 * `simplify_trigger` was printed as a row headline in front of a head teacher,
 * because the labels were written for the filter and not used in the rows —
 * the same fix-one-miss-the-sibling that keeps recurring here.
 *
 * Zero-Tag governs the wording: every label says what NEVO DID. "Made a step
 * simpler" is an action the system took; "Struggled with a step" would be a
 * claim about a learner, which this screen is never entitled to make.
 */
describe("adaptation event labels", () => {
  it("covers every option it offers", () => {
    for (const k of EVENT_TYPE_OPTIONS) {
      expect(EVENT_TYPE_LABELS[k], k).toBeTruthy();
    }
  });

  it("never leaks a raw key as a label", () => {
    for (const k of EVENT_TYPE_OPTIONS) {
      expect(EVENT_TYPE_LABELS[k], k).not.toMatch(/_/);
      expect(EVENT_TYPE_LABELS[k], k).not.toBe(k);
    }
  });

  it("describes what Nevo did, never what the learner is", () => {
    const BLAME = /\b(struggl\w*|fail\w*|weak|poor|slow learner|could not|couldn't|difficult\w*)\b/i;
    for (const k of EVENT_TYPE_OPTIONS) {
      expect(EVENT_TYPE_LABELS[k], k).not.toMatch(BLAME);
    }
  });

  it("returns null for a key it has not been taught, so callers can fall back", () => {
    expect(eventTypeLabel("some_new_trigger")).toBeNull();
  });
});
