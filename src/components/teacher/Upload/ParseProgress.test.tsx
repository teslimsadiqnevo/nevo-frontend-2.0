import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PARSE_STAGES, ParseProgress, rungFor } from "./ParseProgress";

/**
 * The parse ladder, and the rule design gave it: "never draw a rung the backend
 * doesn't report."
 *
 * It had FOUR rungs, invented to match C07e's drawing, driven by a mock clock.
 * `UploadStage` reports THREE - `lessons | structure | complete`. So a teacher
 * watched a four-step story about a three-step process, and on the live path
 * never saw the ladder at all: a real upload id routed to a plain spinner,
 * because there was no honest way to map three values onto four rungs.
 *
 * `rungFor` is where that rule lives, so it is what these pin. The labels are
 * design's own words, asserted verbatim: getting them approximately right is
 * the failure mode nobody notices.
 */

describe("rungFor", () => {
  it("places each reported stage, in the order the backend reports them", () => {
    expect(rungFor("lessons")).toBe(0);
    expect(rungFor("structure")).toBe(1);
    expect(rungFor("complete")).toBe(2);
  });

  it("treats `complete` as a rung, not as the ladder resolving", () => {
    // This was the ambiguity in the ruling, and design settled it: `complete`
    // is reported, so it ticks like the others. If it ever stops being a rung
    // this test should be the thing that objects.
    expect(PARSE_STAGES).toHaveLength(3);
    expect(PARSE_STAGES[2].stage).toBe("complete");
  });

  it("refuses to place a stage it does not recognise", () => {
    // -1 sends the wizard to the spinner. Guessing at a rung would tell a
    // teacher where their upload is on no evidence at all.
    expect(rungFor(undefined)).toBe(-1);
    expect(rungFor(null)).toBe(-1);
    expect(rungFor("some_future_stage" as never)).toBe(-1);
  });

  it("carries design's labels verbatim", () => {
    expect(PARSE_STAGES.map((s) => s.label)).toEqual([
      "Reading your upload",
      "Breaking it into segments",
      "Ready to review",
    ]);
  });
});

describe("the ladder", () => {
  it("draws exactly the rungs the backend reports, and no more", () => {
    render(<ParseProgress stage={0} />);

    for (const s of PARSE_STAGES) {
      expect(screen.getAllByText(s.label).length).toBeGreaterThan(0);
    }
    // The four invented rungs are gone. Naming one that used to exist is the
    // cheapest guard against the old list creeping back.
    expect(screen.queryByText("Writing the recaps and previews")).not.toBeInTheDocument();
    expect(screen.queryByText("Finding the lessons")).not.toBeInTheDocument();
  });

  it("leads with the stage the upload is actually on", () => {
    render(<ParseProgress stage={1} />);

    expect(screen.getAllByText("Breaking it into segments").length).toBeGreaterThan(0);
  });

  it("does not crash on a rung index past the end", () => {
    // Defensive: the wizard gates on `rungFor(...) >= 0`, but a stage arriving
    // out of range must not take the screen down mid-upload.
    expect(() => render(<ParseProgress stage={9} />)).not.toThrow();
  });
});
