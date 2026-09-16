import { describe, expect, it } from "vitest";
import { lessonFromContent } from "./fromContent";
import type {
  LessonDetailResponse,
  LessonSegment as ContentSegment,
} from "@/lib/api/lessons";

/**
 * The co-construction solver, against real generated content.
 *
 * Nothing mapped `calculationVariant` until 16 Sep, so the player's
 * `segment.calculationVariant && segment.calculation` was false for every
 * lesson that had ever existed and the solver rendered as plain text. These
 * tests are written from the backend's own worked example, because the way to
 * get this wrong is specific and was called out when the fields landed:
 * mapping the VARIANT's answer onto every step renders "5" for all three steps
 * of `5x - 4 = 2x + 11`, where only the last one is right.
 */

const segment = (over: Partial<ContentSegment> = {}): ContentSegment =>
  ({
    id: "seg-1",
    segmentKey: "s1",
    contentType: "calculation",
    sequenceOrder: 1,
    title: "Solving linear equations",
    body: "We move the letters to one side.",
    availableModalities: ["text"],
    comprehensionCheckpoints: [],
    textVariant: null,
    visualVariant: null,
    audioVariant: null,
    interactiveVariant: null,
    calculationVariant: null,
    needsReview: false,
    reviewReasons: [],
    ...over,
  }) as unknown as ContentSegment;

const step = (over: Record<string, unknown> = {}) =>
  ({
    stepId: "st-1",
    stepNumber: 1,
    prompt: "Subtract 2x from both sides. What is on the left?",
    expectedInput: "text",
    hint: "Take 2x off each side.",
    confirmationText: "That is it.",
    visualUpdate: "left side changes",
    equationState: "3x - 4 = 11",
    answer: "3x - 4",
    options: [],
    unit: null,
    narrationAudio: null,
    ...over,
  }) as unknown as never;

/** The real JSS3 maths variant, as backend described it. */
const algebra = (over: Record<string, unknown> = {}) =>
  ({
    type: "linear_equation",
    fullEquation: "5x - 4 = 2x + 11",
    answer: "5",
    completionStatement: "You solved for x.",
    scaffoldImage: null,
    steps: [
      step(),
      step({
        stepId: "st-2",
        stepNumber: 2,
        prompt: "Add 4 to both sides. What is on the left?",
        answer: "3x",
        equationState: "3x = 15",
      }),
      step({
        stepId: "st-3",
        stepNumber: 3,
        prompt: "Divide both sides by 3. What is x?",
        expectedInput: "numeric",
        answer: 5,
        equationState: "x = 5",
      }),
    ],
    ...over,
  }) as unknown as never;

const lesson = (seg: ContentSegment): LessonDetailResponse =>
  ({
    id: "l-1",
    title: "Solving Linear Equations",
    status: "completed",
    sourceType: "pdf",
    segmentCount: 1,
    reviewSegmentCount: 0,
    createdAt: "2026-09-16T09:00:00Z",
    confirmationSummary: null,
    segments: [seg],
    modules: [],
  }) as unknown as LessonDetailResponse;

const calcOf = (seg: ContentSegment) =>
  lessonFromContent(lesson(seg)).segments[0];

describe("a generated calculation", () => {
  it("gives every step ITS OWN answer, not the whole problem's", () => {
    const built = calcOf(segment({ calculationVariant: algebra() }));

    // The defect this exists to stop: "5" on all three.
    expect(built.calculation?.steps.map((s) => ("answer" in s ? s.answer : null)))
      .toEqual(["3x - 4", "3x", "5"]);
    // And the whole problem's answer is kept where it belongs.
    expect(built.calculation?.problem.answer).toBe("5");
  });

  it("keeps a numeric answer and a string answer both readable", () => {
    // Step 3's answer arrives as the NUMBER 5 and steps 1-2 as strings. A
    // fraction must survive the trip too.
    const built = calcOf(
      segment({
        calculationVariant: algebra({
          steps: [step({ answer: "3/4" }), step({ stepId: "st-2", expectedInput: "numeric", answer: 5 })],
        }),
      }),
    );

    const answers = built.calculation?.steps.map((s) =>
      "answer" in s ? s.answer : null,
    );
    expect(answers).toEqual(["3/4", "5"]);
  });

  it("opens the Interactive channel, which is what makes the solver reachable", () => {
    const built = calcOf(segment({ calculationVariant: algebra() }));

    expect(built.modalities).toContain("interactive");
    // Both halves, because the player gates on both.
    expect(built.calculationVariant).toBe("linear_equation");
    expect(built.calculation).toBeDefined();
  });

  it("carries the equation's opening state as well as each step's", () => {
    const built = calcOf(segment({ calculationVariant: algebra() }));

    expect(built.calculation?.equationStates).toEqual([
      "5x - 4 = 2x + 11",
      "3x - 4 = 11",
      "3x = 15",
      "x = 5",
    ]);
  });

  it("draws no scaffold, because generated content carries none", () => {
    const built = calcOf(segment({ calculationVariant: algebra() }));

    // `{kind, parts, rows}` is the authored fraction variant's shape and has
    // no counterpart on the wire. Bars built from numbers that mean something
    // else would be a picture of the child's problem that nobody authored.
    expect(built.calculation?.scaffold).toBeUndefined();
  });
});

describe("a calculation this app cannot honestly mark", () => {
  it("refuses the WHOLE variant when one step has no answer", () => {
    // Lessons parsed before the 0057 migration carry no step answers at all.
    const built = calcOf(
      segment({
        calculationVariant: algebra({
          steps: [step(), step({ stepId: "st-2", answer: null })],
        }),
      }),
    );

    // Half a solve walks a child into a locked door two steps in.
    expect(built.calculation).toBeUndefined();
    expect(built.calculationVariant).toBeUndefined();
    expect(built.modalities).not.toContain("interactive");
    // And the segment is still a lesson.
    expect(built.text.body.default).toContain("letters");
  });

  it("refuses a selection step with fewer than two options", () => {
    const built = calcOf(
      segment({
        calculationVariant: algebra({
          steps: [
            step({
              expectedInput: "selection",
              answer: "a",
              options: [{ value: "a", label: "Only one" }],
            }),
          ],
        }),
      }),
    );

    expect(built.calculation).toBeUndefined();
  });

  it("refuses a selection whose answer matches none of its own options", () => {
    const built = calcOf(
      segment({
        calculationVariant: algebra({
          steps: [
            step({
              expectedInput: "selection",
              answer: "z",
              options: [
                { value: "a", label: "First" },
                { value: "b", label: "Second" },
              ],
            }),
          ],
        }),
      }),
    );

    expect(built.calculation).toBeUndefined();
  });

  it("refuses a drag step rather than turning it into multiple choice", () => {
    // Drag is a manipulative - the child builds the answer. Rendering it as
    // "pick one" is a different task and a different signal.
    const built = calcOf(
      segment({
        calculationVariant: algebra({
          steps: [
            step({
              expectedInput: "drag",
              answer: "a",
              options: [
                { value: "a", label: "First" },
                { value: "b", label: "Second" },
              ],
            }),
          ],
        }),
      }),
    );

    expect(built.calculation).toBeUndefined();
  });

  it("builds a selection step when it can be marked", () => {
    const built = calcOf(
      segment({
        calculationVariant: algebra({
          steps: [
            step({
              expectedInput: "selection",
              answer: "b",
              options: [
                { value: "a", label: "Take 2x off" },
                { value: "b", label: "Add 4" },
              ],
            }),
          ],
        }),
      }),
    );

    const first = built.calculation?.steps[0];
    expect(first).toMatchObject({
      choices: ["Take 2x off", "Add 4"],
      correct: 1,
    });
  });
});
