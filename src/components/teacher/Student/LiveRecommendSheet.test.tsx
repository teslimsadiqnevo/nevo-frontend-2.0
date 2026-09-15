import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { create, useLessonLibrary } = vi.hoisted(() => ({
  create: vi.fn(),
  useLessonLibrary: vi.fn(),
}));

vi.mock("@/lib/api/assignments", () => ({ assignmentsApi: { create } }));
vi.mock("@/hooks/useLessonLibrary", () => ({ useLessonLibrary }));

import { LiveRecommendSheet } from "./LiveRecommendSheet";

/**
 * C08c Recommend a Lesson, on a real student.
 *
 * THE DEFECT THIS REPLACES. `RecommendSheet` next door has a send button that
 * reads `onClick={() => setSent(true)}` - no network call anywhere in the file,
 * which imports no API module at all - and then tells the teacher "That's sent
 * to Amara". It was also unreachable when signed in, because `StudentRoute`
 * dropped `recommendOpen` before rendering the live profile. So the most
 * prominent action C08c draws has never assigned a lesson, and said it had.
 *
 * So the assertion that matters is that a confirmation follows a WRITE. A test
 * that the success copy appears would have passed against the fixture sheet
 * throughout, which is exactly how this survived.
 */

const LESSONS = [
  { id: "l-1", title: "Fractions 3", meta: "Mathematics · 20 min" },
  { id: "l-2", title: "Photosynthesis", meta: "Science · 25 min" },
];

const show = (props: Record<string, unknown> = {}) =>
  render(
    <LiveRecommendSheet
      studentId="s-1"
      firstName="Amara"
      onClose={() => {}}
      {...props}
    />,
  );

const pick = (title: string) =>
  fireEvent.click(screen.getByRole("button", { name: new RegExp(title) }));

const sendIt = () =>
  fireEvent.click(screen.getByRole("button", { name: "Recommend this lesson" }));

beforeEach(() => {
  create.mockReset();
  useLessonLibrary.mockReset();
  useLessonLibrary.mockReturnValue({ cards: LESSONS, live: true, sample: false, loading: false });
  create.mockResolvedValue({ created: 1 });
});

describe("sending", () => {
  it("assigns the chosen lesson to this one student", () => {
    show();
    pick("Fractions 3");
    sendIt();

    // One lesson, one student. `AssignmentCreate.studentIds` takes up to 500,
    // which is why "recommend to one child" needed no new endpoint.
    expect(create).toHaveBeenCalledWith({
      lessonIds: ["l-1"],
      studentIds: ["s-1"],
    });
  });

  it("confirms only after the write resolves", async () => {
    let resolve: (v: unknown) => void = () => {};
    create.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    show();
    pick("Fractions 3");
    sendIt();

    // Mid-flight: nothing is confirmed yet. The fixture sheet confirmed here.
    expect(screen.queryByText(/That’s sent to Amara/)).not.toBeInTheDocument();

    resolve({ created: 1 });
    expect(await screen.findByText(/That’s sent to Amara/)).toBeInTheDocument();
  });

  it("never claims a send that failed", async () => {
    create.mockRejectedValueOnce(new Error("500"));
    show();
    pick("Fractions 3");
    sendIt();

    expect(await screen.findByRole("alert")).toHaveTextContent(/Nothing has changed/i);
    expect(screen.queryByText(/That’s sent to Amara/)).not.toBeInTheDocument();
  });

  it("will not send until a lesson is chosen", () => {
    show();

    expect(
      screen.getByRole("button", { name: "Recommend this lesson" }),
    ).toBeDisabled();
    sendIt();
    expect(create).not.toHaveBeenCalled();
  });

  it("names the lesson it actually sent, in the confirmation", async () => {
    // Awaits the confirmation FIRST and then reads within it. The first draft
    // asserted on /Photosynthesis/ straight after the click, which raced the
    // option list still being on screen - so it was asking a question with two
    // possible answers and no fixed moment.
    show();
    pick("Photosynthesis");
    sendIt();

    const done = await screen.findByText(/That’s sent to Amara/);
    const panel = done.parentElement!;
    expect(panel.textContent).toMatch(/Photosynthesis/);
    expect(panel.textContent).not.toMatch(/Fractions 3/);
  });
});

describe("the note", () => {
  // Built 15 Sep, when `note` landed on both creation contracts. Until then
  // this sheet deliberately had no box, because one that discarded what a
  // teacher wrote about a named child is worse than none.
  const write = (text: string) =>
    fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });

  it("sends what the teacher wrote, to this child", () => {
    show();
    pick("Fractions 3");
    write("I picked this because you liked the last one.");
    sendIt();

    expect(create).toHaveBeenCalledWith({
      lessonIds: ["l-1"],
      studentIds: ["s-1"],
      note: "I picked this because you liked the last one.",
    });
  });

  it("sends NO note key when the box was never touched", () => {
    // Optional means absent, not "". An empty note would render as an empty
    // bubble on her dashboard, saying her teacher wrote to her when they
    // did not.
    show();
    pick("Fractions 3");
    sendIt();

    expect(create).toHaveBeenCalledWith({
      lessonIds: ["l-1"],
      studentIds: ["s-1"],
    });
  });

  it("treats whitespace as no note", () => {
    show();
    pick("Fractions 3");
    write("   \n  ");
    sendIt();

    expect(create).toHaveBeenCalledWith(
      expect.not.objectContaining({ note: expect.anything() }),
    );
  });

  it("trims it", () => {
    show();
    pick("Fractions 3");
    write("  Have a go at this one.  ");
    sendIt();

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ note: "Have a go at this one." }),
    );
  });

  it("says the note went with the lesson, when there was one", async () => {
    show();
    pick("Fractions 3");
    write("Have a go at this one.");
    sendIt();

    const done = await screen.findByText(/That’s sent to Amara/);
    expect(done.parentElement?.textContent).toMatch(/with your note/i);
  });

  it("does not mention a note when none was written", async () => {
    show();
    pick("Fractions 3");
    sendIt();

    const done = await screen.findByText(/That’s sent to Amara/);
    expect(done.parentElement?.textContent).not.toMatch(/note/i);
  });

  it("never promises she will SEE it, because no student screen shows it yet", async () => {
    // C08c's line is "She'll see your note when she opens it". The note does
    // reach her - it rides on `students/me/dashboard` - but nothing renders it,
    // so that sentence is a promise about a surface that does not show it.
    // This guards the wording until the student console catches up.
    show();
    pick("Fractions 3");
    write("Have a go at this one.");
    sendIt();

    const done = await screen.findByText(/That’s sent to Amara/);
    expect(done.parentElement?.textContent).not.toMatch(/see your note|when she opens/i);
  });
});

describe("what it does not promise", () => {
  it("marks nothing as Nevo's suggestion", () => {
    // `Recommendation` is prose with no lesson id, so nothing connects Nevo's
    // sentence to a row in the library. A badge would be a guess.
    show({ suggestion: "The listen-first version would suit her this week." });

    expect(screen.queryByText(/^Suggested$/i)).not.toBeInTheDocument();
  });

  it("shows Nevo's sentence as context when there is one", () => {
    show({ suggestion: "The listen-first version would suit her this week." });

    expect(screen.getByText("Nevo suggests")).toBeInTheDocument();
    expect(
      screen.getByText(/listen-first version would suit her/),
    ).toBeInTheDocument();
  });

  it("says nothing about a suggestion when Nevo has made none", () => {
    show({ suggestion: null });

    expect(screen.queryByText("Nevo suggests")).not.toBeInTheDocument();
  });
});

describe("an empty or unreachable library", () => {
  it("tells a teacher their library is empty, not that something broke", () => {
    useLessonLibrary.mockReturnValue({ cards: [], live: true, sample: false, loading: false });
    show();

    expect(screen.getByText(/library is empty/i)).toBeInTheDocument();
  });

  it("distinguishes a failed read from an empty library", () => {
    useLessonLibrary.mockReturnValue({ cards: [], live: false, sample: true, loading: false });
    show();

    expect(screen.getByText(/couldn’t reach your library/i)).toBeInTheDocument();
    expect(screen.queryByText(/library is empty/i)).not.toBeInTheDocument();
  });
});
