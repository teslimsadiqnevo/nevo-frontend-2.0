import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SubjectDetail } from "./SubjectDetail";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * Two things, both about a child being told something true and then given
 * nothing to do about it.
 *
 * 1. THE SPACED-RETRIEVAL LOOP HAD NO ENTRANCE. The route
 *    (`/student/lessons/<id>/review-session`), the player variant behind it and
 *    the schedule read (`useDueReviews`) all existed and all worked. Nothing
 *    linked them: the "Ready for another look" concepts rendered as plain
 *    `<span>`s, and `useDueReviews.playable` - the hook's own map of which due
 *    concepts can actually be opened - had no reader anywhere in the tree. So a
 *    child was told a concept was ready and could not take another look at it.
 *
 * 2. The signed-in heading fell back to `subject`, which is documented one line
 *    above its own declaration as "the designed fixture, for the signed-out
 *    walkthrough". A signed-in render must not read the fixtures at all.
 */

const hooks = vi.hoisted(() => ({
  useStudentProgress: vi.fn(),
  useSubjectProgress: vi.fn(),
  useDueReviews: vi.fn(),
}));
vi.mock("@/hooks/useStudentProgress", () => ({
  useStudentProgress: hooks.useStudentProgress,
}));
vi.mock("@/hooks/useSubjectProgress", () => ({
  useSubjectProgress: hooks.useSubjectProgress,
}));
vi.mock("@/hooks/useDueReviews", () => ({
  useDueReviews: hooks.useDueReviews,
}));

const signIn = () =>
  setSession({
    token: "tok-test",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: "student-1",
    role: "student",
  });

const CONCEPTS = [
  { conceptId: "c-frac", name: "Fractions" },
  { conceptId: "c-deci", name: "Decimals" },
];

beforeEach(() => {
  clearSession();
  hooks.useSubjectProgress.mockReturnValue({
    reflection: null,
    loading: false,
    failed: false,
  });
  hooks.useDueReviews.mockReturnValue({
    due: new Set<string>(),
    playable: new Map<string, string>(),
    loading: false,
    failed: false,
  });
  hooks.useStudentProgress.mockReturnValue({
    subjects: [
      { slug: "mathematics", name: "Mathematics", concepts: CONCEPTS },
    ],
    lessons: [],
    reflection: null,
    highlights: [],
    loading: false,
    failed: false,
    live: true,
  });
});

afterEach(() => {
  cleanup();
  clearSession();
});

describe("SubjectDetail", () => {
  it("lets a child open a concept that is ready for another look", async () => {
    signIn();
    hooks.useDueReviews.mockReturnValue({
      due: new Set(["c-frac"]),
      playable: new Map([["c-frac", "lesson-42"]]),
      loading: false,
      failed: false,
    });

    render(<SubjectDetail subject={null} slug="mathematics" />);

    const link = await screen.findByRole("link", {
      name: /take another look at Fractions/i,
    });
    expect(link.getAttribute("href")).toBe(
      "/student/lessons/lesson-42/review-session",
    );
  });

  it("does not offer a link for a due concept with no lesson behind it", async () => {
    signIn();
    hooks.useDueReviews.mockReturnValue({
      due: new Set(["c-frac"]),
      // Due, but its schedule row carried no lessonId - openable by nothing.
      playable: new Map<string, string>(),
      loading: false,
      failed: false,
    });

    render(<SubjectDetail subject={null} slug="mathematics" />);

    await waitFor(() => expect(screen.getByText("Fractions")).toBeTruthy());
    // Present and named, but not a link to nowhere.
    expect(
      screen.queryByRole("link", { name: /take another look/i }),
    ).toBeNull();
  });

  it("titles a signed-in page from the slug, never from the designed fixture", async () => {
    signIn();
    hooks.useStudentProgress.mockReturnValue({
      // The live read knows no subject by this slug.
      subjects: [],
      lessons: [],
      reflection: null,
      highlights: [],
      loading: false,
      failed: false,
      live: true,
    });

    render(
      <SubjectDetail
        subject={{ slug: "mathematics", name: "FIXTURE NAME" } as never}
        slug="mathematics"
      />,
    );

    await waitFor(() => expect(screen.getByText("Mathematics")).toBeTruthy());
    expect(screen.queryByText("FIXTURE NAME")).toBeNull();
  });
});
