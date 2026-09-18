import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { params, useStudentDirectory, useTeacherClasses, useHasSession } =
  vi.hoisted(() => ({
    params: { value: "" },
    useStudentDirectory: vi.fn(),
    useTeacherClasses: vi.fn(),
    useHasSession: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(params.value),
}));
vi.mock("@/hooks/useStudentDirectory", () => ({ useStudentDirectory }));
vi.mock("@/hooks/useTeacherClasses", () => ({ useTeacherClasses }));
vi.mock("@/hooks/useHasSession", () => ({ useHasSession }));
vi.mock("@/hooks/useConnectThreads", () => ({
  useConnectThreads: () => ({
    threads: [],
    live: true,
    sample: false,
    loading: false,
    openThread: vi.fn(),
    send: vi.fn(),
    markThreadRead: vi.fn(),
  }),
}));

import { ConnectView } from "./ConnectView";

/**
 * The half of the deep link that lives on this screen.
 *
 * Connect decides whether to open compose at all from the `student` query, so
 * a link without one is a nav to the thread list - which is what every live
 * caller was doing until 18 Sep. Two things have to hold here: the query
 * opens compose, and it reaches the modal, which is what turns it into a
 * named recipient.
 *
 * A mutation run is why this file exists: dropping either one left every
 * other test in the change green.
 */

const DIRECTORY = [
  { studentId: "s-1", name: "Amara Okafor", className: "JSS 2A", initials: "AO" },
  { studentId: "s-3", name: "Tunde Adeyemi", className: "JSS 2A", initials: "TA" },
];

beforeEach(() => {
  params.value = "";
  useHasSession.mockReturnValue(true);
  useTeacherClasses.mockReturnValue({ options: [], live: true, loading: false });
  useStudentDirectory.mockReturnValue({
    students: DIRECTORY,
    loading: false,
    failed: false,
    live: true,
  });
});

describe("arriving from a student's screen", () => {
  it("opens compose on the child the link names", async () => {
    params.value = "student=s-3";

    render(<ConnectView />);

    expect(await screen.findByText("Tunde Adeyemi")).toBeInTheDocument();
    /*
     * THE ASSERTION THAT MAKES THIS TEST WORTH ANYTHING. Finding the name is
     * not enough: every child is on screen when compose opens on the picker,
     * so a version that opened compose and forgot to pass the parameter down
     * would pass the line above. The picker being GONE is what says a
     * recipient was chosen for the teacher.
     */
    expect(
      screen.queryByPlaceholderText("Search your students"),
    ).not.toBeInTheDocument();
  });

  it("opens the thread list, not compose, without one", () => {
    // On the dialog, not on the picker: a preselected recipient also hides
    // the picker, so this has to ask whether compose is open at all.
    render(<ConnectView />);

    expect(
      screen.queryByRole("dialog", { name: "New message" }),
    ).not.toBeInTheDocument();
  });

  it("opens compose on an unknown id rather than swallowing the click", async () => {
    // A stale link still gets the teacher to the screen they asked for.
    params.value = "student=gone";

    render(<ConnectView />);

    expect(
      await screen.findByPlaceholderText("Search your students"),
    ).toBeInTheDocument();
  });
});
