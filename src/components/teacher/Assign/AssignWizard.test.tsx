import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { create, useTeacherClasses, useLessonLibrary, useStudentDirectory, useHasSession, push } =
  vi.hoisted(() => ({
    create: vi.fn(),
    useHasSession: vi.fn(),
    useTeacherClasses: vi.fn(),
    useLessonLibrary: vi.fn(),
    useStudentDirectory: vi.fn(),
    push: vi.fn(),
  }));

vi.mock("@/lib/api/assignments", () => ({ assignmentsApi: { create } }));
vi.mock("@/hooks/useTeacherClasses", () => ({ useTeacherClasses }));
vi.mock("@/hooks/useLessonLibrary", () => ({ useLessonLibrary }));
vi.mock("@/hooks/useStudentDirectory", () => ({ useStudentDirectory }));
// Without this the wizard takes its signed-OUT path, where Confirm closes the
// demo rather than assigning - and `create` is never called, which looks
// exactly like a broken submit.
vi.mock("@/hooks/useHasSession", () => ({ useHasSession }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push, back: push, prefetch: vi.fn() }),
}));

import { AssignWizard } from "./AssignWizard";

/**
 * "Specific students", which the wizard refused to do on a reason that had
 * stopped being true.
 *
 * THE FALSE PREMISE. The guard read: "The API takes `studentIds`, but the live
 * class list carries no roster, so there are no real ids to send." True of the
 * class LIST - `AssignedClassResponse` carries none - and not true of the
 * product. `GET /api/v1/classes/{class_id}/students` returns `studentId` per
 * child; `useStudentDirectory` already fans the class list out across it for
 * the compose picker; `AssignmentCreate.studentIds` accepts up to 500. Three
 * pieces, all built, all tested, none joined up.
 *
 * The old picker also keyed its selection on `${classId}:${name}`, which is
 * what a screen does when it has no ids - and means two children sharing a name
 * shared a checkbox.
 */

const CLASSES = [
  { id: "c-1", name: "JSS 2A", joinCode: "AB12" },
  { id: "c-2", name: "JSS 2B", joinCode: "CD34" },
];

const DIRECTORY = [
  { studentId: "s-1", name: "Amara Okafor", initials: "AO", className: "JSS 2A" },
  { studentId: "s-2", name: "Chidi Nwosu", initials: "CN", className: "JSS 2A" },
  { studentId: "s-3", name: "Tunde Bakare", initials: "TB", className: "JSS 2B" },
];

const LESSONS = [{ id: "l-1", title: "Fractions 3", meta: "Mathematics" }];

const directory = (over: Record<string, unknown> = {}) => ({
  students: DIRECTORY,
  loading: false,
  failed: false,
  ...over,
});

beforeEach(() => {
  create.mockReset();
  useTeacherClasses.mockReset();
  useLessonLibrary.mockReset();
  useStudentDirectory.mockReset();
  push.mockReset();

  create.mockResolvedValue({ createdCount: 1 });
  useTeacherClasses.mockReturnValue({
    options: CLASSES,
    classes: [],
    liveClasses: [],
    live: true,
    loading: false,
    sample: false,
  });
  useLessonLibrary.mockReturnValue({
    cards: LESSONS,
    live: true,
    sample: false,
    loading: false,
    slow: false,
  });
  useStudentDirectory.mockReturnValue(directory());
  useHasSession.mockReturnValue(true);
});

/** Walk to step 2 with a lesson chosen, then switch to the student picker. */
const toStudents = () => {
  render(<AssignWizard preselect="l-1" />);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Specific students" }));
};

describe("the student picker", () => {
  it("offers the teacher's real students, grouped by class", () => {
    toStudents();

    expect(screen.getByText("Amara Okafor")).toBeInTheDocument();
    expect(screen.getByText("Tunde Bakare")).toBeInTheDocument();
    expect(screen.getByText("JSS 2A")).toBeInTheDocument();
  });

  it("no longer refuses on a premise that stopped being true", () => {
    toStudents();

    expect(
      screen.queryByText(/isn’t connected yet|Assign to the whole class for now/i),
    ).not.toBeInTheDocument();
  });

  it("distinguishes a failed directory from classes with no students", () => {
    useStudentDirectory.mockReturnValue(directory({ students: [], failed: true }));
    toStudents();

    expect(screen.getByText(/couldn’t reach your classes/i)).toBeInTheDocument();
    expect(screen.queryByText(/no students in your classes yet/i)).not.toBeInTheDocument();
  });

  it("says a class is missing when the directory is only partial", () => {
    // A partial list is worth offering; a teacher must know it is partial.
    useStudentDirectory.mockReturnValue(directory({ failed: true }));
    toStudents();

    expect(screen.getByText(/some students may be missing/i)).toBeInTheDocument();
  });

  it("holds while the directory loads rather than claiming it is empty", () => {
    useStudentDirectory.mockReturnValue(
      directory({ students: [], loading: true }),
    );
    toStudents();

    expect(screen.getByText(/Finding your students/i)).toBeInTheDocument();
    expect(screen.queryByText(/no students in your classes yet/i)).not.toBeInTheDocument();
  });
});

describe("sending to specific students", () => {
  /** Step 2 to the end: two Continues, then the confirm at step 4. */
  const send = () => {
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm assignment" }));
  };

  it("sends every chosen student in ONE request, keyed by id", async () => {
    toStudents();
    fireEvent.click(screen.getByRole("button", { name: /Amara Okafor/ }));
    fireEvent.click(screen.getByRole("button", { name: /Tunde Bakare/ }));
    send();

    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        lessonIds: ["l-1"],
        studentIds: ["s-1", "s-3"],
      }),
    );
  });

  it("sends no classId when the teacher picked students", async () => {
    // A classId alongside studentIds would assign the whole class as well.
    toStudents();
    fireEvent.click(screen.getByRole("button", { name: /Amara Okafor/ }));
    send();

    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0].classId).toBeUndefined();
  });

  it("still sends one request per class for a whole-class pick", async () => {
    render(<AssignWizard preselect="l-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: /JSS 2A/ }));
    fireEvent.click(screen.getByRole("button", { name: /JSS 2B/ }));
    send();

    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    expect(create.mock.calls[0][0].studentIds).toBeUndefined();
  });

  it("will not let a teacher past step 2 with no student chosen", () => {
    // The guard is the disabled Continue, not a message at the end: there is
    // no way to reach Confirm without a selection, which is why this asserts
    // the control rather than driving to the last step.
    toStudents();

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("closes without assigning for a signed-out visitor walking the demo", async () => {
    useHasSession.mockReturnValue(false);
    toStudents();
    fireEvent.click(screen.getByRole("button", { name: /Amara Okafor/ }));
    send();

    await vi.waitFor(() => expect(push).toHaveBeenCalled());
    expect(create).not.toHaveBeenCalled();
  });
});
