import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { AssignedClass } from "@/lib/api/classes";
import type { TeacherDetail, TeacherSummary } from "@/lib/api/teachers";
import { RemoveAccessSheet } from "./RemoveAccessSheet";

/**
 * A SHEET THAT COULD NOT BE COMPLETED AND DID NOT SAY WHY.
 *
 * `staff: []` is the value on first render, after a failed read, and for a
 * school that genuinely has nobody else active. All three rendered the same
 * thing: selects showing only their placeholder, a commit that could never
 * enable, and nothing on screen to act on.
 *
 * And when it did work, the sheet closed straight onto a list where the
 * teacher was still present - the reload happens afterwards - so the admin saw
 * nothing at all confirming it.
 */

const list = vi.fn();
const revoke = vi.fn();
const reassign = vi.fn();

vi.mock("@/lib/api/teachers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/teachers")>();
  return {
    ...actual,
    teachersApi: {
      ...actual.teachersApi,
      list: () => list(),
      revoke: (id: string) => revoke(id),
    },
  };
});

vi.mock("@/lib/api/classes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/classes")>();
  return {
    ...actual,
    classesApi: {
      ...actual.classesApi,
      reassign: (id: string, body: unknown) => reassign(id, body),
    },
  };
});

const teacher = {
  id: "t1",
  name: "Folake Adeyemi",
  email: "adeyemi.f@school.edu.ng",
  status: "active",
} as TeacherDetail;

const held: AssignedClass[] = [
  {
    assignmentId: "a1",
    classId: "c1",
    className: "JSS 2A",
    role: "primary",
    assignedAt: "2026-09-01T00:00:00Z",
  } as AssignedClass,
];

const other = (over: Partial<TeacherSummary> = {}): TeacherSummary =>
  ({
    id: "t2",
    name: "Bola Bello",
    email: "bello.b@school.edu.ng",
    status: "active",
    ...over,
  }) as TeacherSummary;

beforeEach(() => {
  list.mockReset();
  revoke.mockReset();
  reassign.mockReset();
  revoke.mockResolvedValue(undefined);
  reassign.mockResolvedValue(undefined);
});

describe("the staff read", () => {
  it("says the list could not be loaded, and offers a retry", async () => {
    list.mockRejectedValueOnce(new Error("500")).mockResolvedValue([other()]);
    const { container } = render(
      <RemoveAccessSheet
        teacher={teacher}
        held={held}
        onClose={() => {}}
        onRemoved={() => {}}
      />,
    );
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/couldn't load your staff list/),
    );
    // Absence of evidence is not evidence of absence: it must not claim the
    // school has nobody else.
    expect(visibleText(container)).not.toMatch(/no one else active/);
    expect(visibleText(container)).toMatch(/Nothing has changed for Adeyemi/);

    fireEvent.click(
      Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent === "Try again",
      )!,
    );
    await waitFor(() =>
      expect(visibleText(container)).not.toMatch(/couldn't load your staff/),
    );
  });

  it("tells a school with nobody else what it can still do", async () => {
    list.mockResolvedValue([]);
    const { container } = render(
      <RemoveAccessSheet
        teacher={teacher}
        held={held}
        onClose={() => {}}
        onRemoved={() => {}}
      />,
    );
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/no one else active/),
    );
    // The way through is still open, and named.
    expect(visibleText(container)).toMatch(/remove Adeyemi from each class/);
  });

  it("never offers a teacher who cannot sign in", async () => {
    list.mockResolvedValue([
      other(),
      other({ id: "t3", name: "Gone Person", status: "deactivated" }),
      other({ id: "t4", name: "Not Yet", status: "invited" }),
    ]);
    const { container } = render(
      <RemoveAccessSheet
        teacher={teacher}
        held={held}
        onClose={() => {}}
        onRemoved={() => {}}
      />,
    );
    await waitFor(() => expect(visibleText(container)).toMatch(/Bola Bello/));
    const options = Array.from(container.querySelectorAll("option")).map(
      (o) => o.textContent ?? "",
    );
    expect(options.join(" ")).not.toMatch(/Gone Person|Not Yet/);
  });
});

describe("a completed removal", () => {
  it("confirms before the sheet goes", async () => {
    list.mockResolvedValue([other()]);
    const onRemoved = vi.fn();
    const { container } = render(
      <RemoveAccessSheet
        teacher={teacher}
        held={held}
        onClose={() => {}}
        onRemoved={onRemoved}
      />,
    );
    await waitFor(() => expect(visibleText(container)).toMatch(/Bola Bello/));

    fireEvent.change(container.querySelector("select")!, {
      target: { value: "t2" },
    });
    fireEvent.click(
      Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent === "Reassign and remove access",
      )!,
    );

    await waitFor(() =>
      expect(visibleText(container)).toMatch(
        /1 class handed over\. Adeyemi can no longer open their console\./,
      ),
    );
    // The confirmation is on screen BEFORE the parent is told to close.
    expect(onRemoved).not.toHaveBeenCalled();
    await waitFor(() => expect(onRemoved).toHaveBeenCalled(), { timeout: 3000 });
  });
});
