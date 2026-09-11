import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PatternFlankerModule } from "./PatternFlankerModule";
import { BaselineCapture } from "@/lib/profiling/capture";

/**
 * The flanker is the attention measure, and it measured nothing.
 *
 * The centre arrow was a plain `<ArrowRight>` that nothing ever rotated, so
 * "Right" was the answer on all three trials of every run. A child who noticed
 * could stop looking entirely - which is the exact attention the task exists to
 * catch. And the pick carried only congruency, never whether the flankers had
 * captured them, so a wrong fast tap scored better in the vector than a right
 * considered one. On an interference measure that does not lose the finding, it
 * inverts it.
 *
 * These assert on the capture and on the rendered transform, because both were
 * wrong while the screen looked entirely correct.
 */

const picks = (capture: BaselineCapture, which: string) =>
  capture.stream
    .filter((e) => e.kind === "trial_pick")
    .map((e) => e.payload as Record<string, unknown>)
    .filter((p) => p.act === which);

/** Answer all three 2A trials to reach the flanker. */
function throughThePatterns() {
  for (let i = 0; i < 3; i++) {
    fireEvent.click(screen.getByText("Same"));
    act(() => void vi.advanceTimersByTime(500));
  }
}

/** How far the centre arrow is turned, in degrees. */
function centreRotation(): number {
  const arrows = document.querySelectorAll<SVGElement>(
    "svg.lucide-arrow-right",
  );
  // The centre is the one drawn at the heavier stroke weight.
  const centre = [...arrows].find(
    (a) => a.getAttribute("stroke-width") === "3",
  );
  const turn = /rotate\((-?\d+)deg\)/.exec(centre?.getAttribute("style") ?? "");
  return Number(turn?.[1] ?? 0);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PatternFlankerModule", () => {
  it("does not point the arrow the same way every trial", () => {
    // The regression. Three trials, and the answer used to be Right on all of
    // them, in every run, for every child.
    render(<PatternFlankerModule band="p46" onComplete={() => {}} />);
    throughThePatterns();

    const seen: number[] = [];
    for (let i = 0; i < 3; i++) {
      seen.push(centreRotation());
      fireEvent.click(screen.getByLabelText("Right"));
      act(() => void vi.advanceTimersByTime(500));
    }

    expect(new Set(seen).size).toBeGreaterThan(1);
  });

  it("records whether the flankers caught a child", () => {
    const capture = new BaselineCapture("flanker");
    render(
      <PatternFlankerModule
        band="p46"
        capture={capture}
        onComplete={() => {}}
      />,
    );
    throughThePatterns();

    // Trial 1 is congruent and points right; answer it correctly.
    fireEvent.click(screen.getByLabelText("Right"));
    act(() => void vi.advanceTimersByTime(500));
    // Trial 2 is incongruent and points LEFT - the trial the flankers exist to
    // spoil. Answer it the way a captured child would.
    fireEvent.click(screen.getByLabelText("Right"));

    expect(picks(capture, "flanker").map((p) => p.correct)).toEqual([
      true,
      false,
    ]);
  });

  it("scores the pattern half too", () => {
    const capture = new BaselineCapture("pattern");
    render(
      <PatternFlankerModule
        band="p46"
        capture={capture}
        onComplete={() => {}}
      />,
    );
    // Trial 1 shows a different pair, so "Different" is right.
    fireEvent.click(screen.getByText("Different"));

    expect(picks(capture, "pattern")[0]).toMatchObject({ correct: true });
  });

  it("turns the single P1-3 arrow as well", () => {
    // P1-3 sees only the centre arrow - no flankers to ignore. If the target
    // stopped moving for them the activity would have no question in it at all.
    render(<PatternFlankerModule band="p13" onComplete={() => {}} />);
    throughThePatterns();

    fireEvent.click(screen.getByLabelText("Right"));
    act(() => void vi.advanceTimersByTime(500));

    expect(centreRotation()).toBe(180);
  });
});
