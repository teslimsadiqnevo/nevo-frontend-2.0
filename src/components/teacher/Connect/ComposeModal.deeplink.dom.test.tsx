import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { useStudentDirectory, useTeacherClasses, useHasSession } = vi.hoisted(
  () => ({
    useStudentDirectory: vi.fn(),
    useTeacherClasses: vi.fn(),
    useHasSession: vi.fn(),
  }),
);
vi.mock("@/hooks/useStudentDirectory", () => ({ useStudentDirectory }));
vi.mock("@/hooks/useTeacherClasses", () => ({ useTeacherClasses }));
vi.mock("@/hooks/useHasSession", () => ({ useHasSession }));

import { ComposeModal } from "./ComposeModal";

/**
 * "Send them a message" landing on the right child.
 *
 * WHAT WAS BROKEN, and it was not the resolver. All three live callers - the
 * flag card, the student profile and the session panel - linked to a bare
 * `/teacher/connect`. Connect decides whether to open compose from the
 * `student` query, so the action opened the thread list and did nothing else.
 * Only the fixture profile passed the parameter, which is why the defect read
 * as a resolution problem.
 *
 * THE MATCH IS ON `studentId`, never on a name: a school with two Amaras
 * would otherwise have the message addressed to whichever one the directory
 * happened to list first.
 */

const DIRECTORY = [
  { studentId: "s-1", name: "Amara Okafor", className: "JSS 2A", initials: "AO" },
  { studentId: "s-2", name: "Amara Nwosu", className: "JSS 2B", initials: "AN" },
  { studentId: "s-3", name: "Tunde Adeyemi", className: "JSS 2A", initials: "TA" },
];

const directory = (students: typeof DIRECTORY, loading = false) =>
  useStudentDirectory.mockReturnValue({
    students,
    loading,
    failed: false,
    live: true,
  });

beforeEach(() => {
  useHasSession.mockReturnValue(true);
  useTeacherClasses.mockReturnValue({ options: [], live: true, loading: false });
  directory(DIRECTORY);
});

describe("the link that names a child", () => {
  it("opens compose on that child", async () => {
    render(<ComposeModal preset="s-3" onClose={vi.fn()} onSend={vi.fn()} />);

    expect(await screen.findByText("Tunde Adeyemi")).toBeInTheDocument();
    // The picker is gone once a recipient is chosen.
    expect(
      screen.queryByPlaceholderText("Search your students"),
    ).not.toBeInTheDocument();
  });

  it("tells two children with the same first name apart", async () => {
    render(<ComposeModal preset="s-2" onClose={vi.fn()} onSend={vi.fn()} />);

    expect(await screen.findByText("Amara Nwosu")).toBeInTheDocument();
    expect(screen.queryByText("Amara Okafor")).not.toBeInTheDocument();
  });

  it("waits for the roster rather than giving up on it", async () => {
    // The directory is a live read: it is not in hand when this mounts, and
    // an earlier version of this raced it.
    const { rerender } = render(
      <ComposeModal preset="s-1" onClose={vi.fn()} onSend={vi.fn()} />,
    );
    directory([], true);
    rerender(<ComposeModal preset="s-1" onClose={vi.fn()} onSend={vi.fn()} />);

    expect(screen.queryByText("Amara Okafor")).not.toBeInTheDocument();

    directory(DIRECTORY);
    rerender(<ComposeModal preset="s-1" onClose={vi.fn()} onSend={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByText("Amara Okafor")).toBeInTheDocument(),
    );
  });

  it("still opens the picker when the id matches nobody", async () => {
    // A stale link is not a reason to swallow the click. The teacher can
    // search; what they must not get is a recipient they did not choose.
    render(<ComposeModal preset="gone" onClose={vi.fn()} onSend={vi.fn()} />);

    expect(
      await screen.findByPlaceholderText("Search your students"),
    ).toBeInTheDocument();
  });

  it("lets the teacher choose somebody else instead", async () => {
    render(<ComposeModal preset="s-1" onClose={vi.fn()} onSend={vi.fn()} />);
    await screen.findByText("Amara Okafor");

    // The control that goes back to the list. The link's choice must not be
    // put straight back under them - which is what happens if the preset is
    // still live after they have rejected it.
    fireEvent.click(screen.getByRole("button", { name: /change|choose|back/i }));
    expect(
      await screen.findByPlaceholderText("Search your students"),
    ).toBeInTheDocument();

    fireEvent.click(await screen.findByText("Tunde Adeyemi"));

    expect(screen.getByText("Tunde Adeyemi")).toBeInTheDocument();
    expect(screen.queryByText("Amara Okafor")).not.toBeInTheDocument();
  });

  it("presets nobody when there is no link", async () => {
    render(<ComposeModal onClose={vi.fn()} onSend={vi.fn()} />);

    expect(
      await screen.findByPlaceholderText("Search your students"),
    ).toBeInTheDocument();
  });
});
