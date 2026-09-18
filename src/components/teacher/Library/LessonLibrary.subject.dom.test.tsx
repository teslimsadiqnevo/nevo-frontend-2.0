import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { useLessonLibrary } = vi.hoisted(() => ({ useLessonLibrary: vi.fn() }));
vi.mock("@/hooks/useLessonLibrary", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useLessonLibrary")>();
  return { ...actual, useLessonLibrary };
});

import { LessonLibrary } from "./LessonLibrary";
import { __toCardForTest } from "@/hooks/useLessonLibrary";
import type { LessonSummary } from "@/lib/api/lessons";

/**
 * C06's subject pills, over real lessons.
 *
 * They used to render over fixtures only, on the recorded grounds that a live
 * lesson carries no subject. That was true, and it was true only because
 * neither upload wrapper ever sent the optional `subject` the endpoint has
 * always accepted. With the upload asking and the mapper carrying, the pills
 * are whatever the shelf says it is about.
 *
 * The mapper is tested separately below, because this screen mocks the hook -
 * so a field dropped in `toCard` would not show up in any of the tests above
 * it. That is the defect Home shipped once already.
 */

const card = (id: string, title: string, subject?: string) => ({
  id,
  title,
  status: "Ready" as const,
  kind: "normal" as const,
  needsReview: false,
  meta: "6 sections · PDF",
  footer: "Not yet assigned",
  subject,
});

const state = (cards: ReturnType<typeof card>[]) => ({
  cards,
  live: true,
  sample: false,
  loading: false,
  slow: false,
});

const pill = (name: string) => screen.queryByRole("button", { name });

beforeEach(() => {
  useLessonLibrary.mockReset();
});

describe("the subject pills", () => {
  it("are built from the subjects on the shelf", () => {
    useLessonLibrary.mockReturnValue(
      state([
        card("1", "Solving Linear Equations", "Mathematics"),
        card("2", "Things Fall Apart", "English"),
        card("3", "Algebraic Fractions", "Mathematics"),
      ]),
    );

    render(<LessonLibrary />);

    expect(pill("All")).toBeInTheDocument();
    expect(pill("Mathematics")).toBeInTheDocument();
    expect(pill("English")).toBeInTheDocument();
  });

  it("show subjects this repo has never heard of", () => {
    // The point of not writing the list here: the fixture vocabulary is
    // Mathematics, English and Sciences, and a real school teaches these.
    useLessonLibrary.mockReturnValue(
      state([
        card("1", "Photosynthesis", "Biology"),
        card("2", "Titration", "Chemistry"),
      ]),
    );

    render(<LessonLibrary />);

    expect(pill("Biology")).toBeInTheDocument();
    expect(pill("Chemistry")).toBeInTheDocument();
  });

  it("narrow the shelf to one subject", () => {
    useLessonLibrary.mockReturnValue(
      state([
        card("1", "Solving Linear Equations", "Mathematics"),
        card("2", "Things Fall Apart", "English"),
      ]),
    );

    render(<LessonLibrary />);
    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByText("Things Fall Apart")).toBeInTheDocument();
    expect(screen.queryByText("Solving Linear Equations")).not.toBeInTheDocument();
  });

  it("do not appear when there is only one thing to pick", () => {
    // A row reading "All / Mathematics" over an all-maths shelf is a control
    // that cannot change anything.
    useLessonLibrary.mockReturnValue(
      state([
        card("1", "Solving Linear Equations", "Mathematics"),
        card("2", "Algebraic Fractions", "Mathematics"),
      ]),
    );

    render(<LessonLibrary />);

    expect(pill("All")).not.toBeInTheDocument();
    expect(pill("Mathematics")).not.toBeInTheDocument();
  });

  it("do not appear at all when nothing carries a subject", () => {
    useLessonLibrary.mockReturnValue(
      state([card("1", "Solving Linear Equations"), card("2", "Fractions")]),
    );

    render(<LessonLibrary />);

    expect(pill("All")).not.toBeInTheDocument();
    expect(screen.getByText("Solving Linear Equations")).toBeInTheDocument();
  });
});

describe("what the card carries", () => {
  const lesson = (over: Partial<LessonSummary> = {}) =>
    ({
      id: "l-1",
      title: "Solving Linear Equations",
      status: "ready",
      sourceType: "pdf",
      segmentCount: 6,
      reviewSegmentCount: 0,
      subject: "Mathematics",
      assignmentCount: 0,
      estimatedMinutes: 20,
      createdAt: "2026-09-18T09:00:00Z",
      ...over,
    }) as LessonSummary;

  it("keeps the subject the lesson was uploaded with", () => {
    expect(__toCardForTest(lesson()).subject).toBe("Mathematics");
  });

  it("leaves it absent when the lesson has none", () => {
    // Nullable on the summary. Absent is a lesson the pills cannot narrow,
    // which is not the same as an error and not the same as "All".
    expect(__toCardForTest(lesson({ subject: null })).subject).toBeUndefined();
  });
});
