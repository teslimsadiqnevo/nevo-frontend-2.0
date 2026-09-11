import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TeacherClasses } from "@/hooks/useTeacherClasses";

const { useTeacherClasses, useCurrentUser } = vi.hoisted(() => ({
  useTeacherClasses: vi.fn(),
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/useTeacherClasses", () => ({ useTeacherClasses }));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser }));

import { ClassesList } from "./ClassesList";
import { SCHOOL_LINE, TEACHER_CLASSES } from "@/lib/mocks/teacherClasses";

/**
 * The school line under "My Classes", and the flash it used to show.
 *
 * `SCHOOL_LINE` is the fixture string "Corona Secondary School · Second term".
 * The header rendered it whenever `live` was false - and `live` is false for
 * the whole in-flight window, not only after a failure. So a real teacher at
 * a real school watched another school's name, and a term that is not
 * necessarily theirs, sit under their own heading for as long as the read took:
 * 1.0-5.6s on this backend.
 *
 * `useTeacherClasses.loading` was added precisely to separate "not back yet"
 * from "never coming" - its own doc comment says so - and this header was the
 * one consumer still reading `live` alone.
 *
 * THE TEST HAS TO MOCK THE HOOK'S REAL SHAPE. A previous test in this repo
 * mocked the signed-out shape of this same hook and thereby concealed a
 * live-path bug for a week, so `state()` below returns every field, and the
 * loading case is built by changing ONE flag from the failure case.
 */

/** The hook's shape when there is no live data - fixtures on screen. */
const state = (over: Partial<TeacherClasses> = {}): TeacherClasses => ({
  classes: TEACHER_CLASSES,
  liveClasses: [],
  options: [],
  live: false,
  loading: false,
  sample: false,
  ...over,
});

beforeEach(() => {
  useTeacherClasses.mockReset();
  useCurrentUser.mockReset();
  useCurrentUser.mockReturnValue(null);
});

describe("the school line", () => {
  it("shows nothing at all while the read is still in flight", () => {
    // The failure case and this differ by one flag, which is the point: the
    // old code could not tell them apart.
    useTeacherClasses.mockReturnValue(state({ loading: true }));

    render(<ClassesList />);

    expect(screen.getByText("My Classes")).toBeInTheDocument();
    expect(screen.queryByText(SCHOOL_LINE)).not.toBeInTheDocument();
  });

  it("still backs the designed screen once the read has actually failed", () => {
    // Not back yet and never coming are different, and only the second is a
    // reason to put the designed screen on display.
    useTeacherClasses.mockReturnValue(state({ loading: false, sample: true }));

    render(<ClassesList />);

    expect(screen.getByText(SCHOOL_LINE)).toBeInTheDocument();
  });

  it("never shows the fixture school to someone whose own school is known", () => {
    useTeacherClasses.mockReturnValue(state({ loading: false }));
    useCurrentUser.mockReturnValue({ school: "E2E Probe School" });

    render(<ClassesList />);

    expect(screen.getByText("E2E Probe School")).toBeInTheDocument();
    expect(screen.queryByText(SCHOOL_LINE)).not.toBeInTheDocument();
  });

  it("shows the teacher's own school, not a fixture, once live data is in", () => {
    useTeacherClasses.mockReturnValue(
      state({
        classes: [],
        liveClasses: [
          { class_id: "c-1", class_name: "E2E Probe Class", class_code: "ABC123" },
        ] as TeacherClasses["liveClasses"],
        live: true,
      }),
    );
    useCurrentUser.mockReturnValue({ school: "E2E Probe School" });

    render(<ClassesList />);

    expect(screen.getByText("E2E Probe School")).toBeInTheDocument();
    expect(screen.queryByText(SCHOOL_LINE)).not.toBeInTheDocument();
  });
});
