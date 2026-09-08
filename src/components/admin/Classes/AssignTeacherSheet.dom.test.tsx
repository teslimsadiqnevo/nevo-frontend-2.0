import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { TeacherSummary } from "@/lib/api/teachers";
import { AssignTeacherSheet } from "./AssignTeacherSheet";

/**
 * "Everyone on staff already teaches this class" was said in three different
 * situations, and was true in only one of them.
 *
 * The one that matters is the FIRST-RUN state: the Classes screen's own empty
 * state tells a new school to "Create your first class, then assign a teacher
 * and enrol students", so they arrive here having invited nobody yet — and were
 * told their entire staff was already teaching it.
 */

const list = vi.fn();

vi.mock("@/lib/api/teachers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/teachers")>();
  return {
    ...actual,
    teachersApi: { ...actual.teachersApi, list: () => list() },
  };
});

const teacher = (i: number): TeacherSummary => ({
  id: `t${i}`,
  name: `Folake Adeyemi ${i}`,
  email: `f${i}@school.edu.ng`,
  status: "active",
  classIds: [],
});

function sheet(assigned: { teacher_id: string }[] = []) {
  return render(
    <AssignTeacherSheet
      classId="c1"
      className="JSS 2A"
      classSubtitle="Year 8"
      assigned={assigned as never}
      onClose={() => {}}
      onAssigned={() => {}}
    />,
  );
}

describe("AssignTeacherSheet staff list", () => {
  it("does not tell a school with no staff that everyone already teaches it", async () => {
    list.mockResolvedValue([]);

    const { container } = sheet();
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/No staff to assign yet/i),
    );
    expect(visibleText(container)).toMatch(/Invite a teacher first/i);
    expect(visibleText(container)).not.toMatch(/already teaches this class/i);
  });

  it("does not turn a failed staff read into a statement about the staff", async () => {
    list.mockRejectedValue(new Error("500"));

    const { container } = sheet();
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/couldn't read your staff list/i),
    );
    expect(visibleText(container)).toMatch(/not a record that it's empty/i);
    expect(visibleText(container)).not.toMatch(/already teaches this class/i);
    expect(visibleText(container)).not.toMatch(/No staff to assign yet/i);
  });

  it("still says it when everyone genuinely does teach the class", async () => {
    list.mockResolvedValue([teacher(1), teacher(2)]);

    const { container } = sheet([{ teacher_id: "t1" }, { teacher_id: "t2" }]);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Everyone on staff already teaches/i),
    );
    expect(visibleText(container)).not.toMatch(/No staff to assign yet/i);
    expect(visibleText(container)).not.toMatch(/couldn't read/i);
  });

  it("says none of the three when there is somebody to assign", async () => {
    list.mockResolvedValue([teacher(1), teacher(2)]);

    const { container } = sheet([{ teacher_id: "t1" }]);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Folake Adeyemi 2/),
    );
    expect(visibleText(container)).not.toMatch(/already teaches this class/i);
    expect(visibleText(container)).not.toMatch(/No staff to assign yet/i);
    expect(visibleText(container)).not.toMatch(/couldn't read/i);
  });
});
