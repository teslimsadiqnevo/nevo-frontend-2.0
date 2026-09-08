import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { AdminClass } from "@/lib/api/classes";
import { ClassDetailView } from "./ClassDetailView";

/**
 * Three writes on this screen ended in a catch that returned the UI to rest,
 * which is byte-for-byte what a SUCCESS looks like.
 *
 * Archiving is the worst of them: the proprietor watches the confirmation close
 * at the end of term and moves on believing the class is off their lists. It is
 * not. It is still live, still counted, still holding children.
 */

const archive = vi.fn();
const restore = vi.fn();
const classTeachers = vi.fn(async () => []);

const klass = (over: Partial<AdminClass> = {}): AdminClass => ({
  id: "c1",
  name: "JSS2 Blue",
  code: "JSS2B",
  yearGroup: "jss2",
  source: null,
  subjects: [],
  studentCount: 24,
  archivedAt: null,
  ...over,
});

let current = klass();

vi.mock("@/lib/api/classes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/classes")>();
  return {
    ...actual,
    classesApi: {
      ...actual.classesApi,
      get: async () => current,
      classTeachers: () => classTeachers(),
      classStudents: async () => [],
      archive: () => archive(),
      restore: () => restore(),
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
  usePathname: () => "/admin/classes/c1",
}));

describe("ClassDetailView archive", () => {
  it("holds the dialog open and says so when the archive is refused", async () => {
    current = klass();
    archive.mockRejectedValue(new Error("403"));

    const { container } = render(<ClassDetailView classId="c1" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Archive this class" }),
    );
    // The dialog's own confirm carries the same words as the opener.
    const confirm = await screen.findAllByRole("button", {
      name: "Archive this class",
    });
    fireEvent.click(confirm[confirm.length - 1]);

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/couldn't archive this class/i),
    );
    expect(visibleText(container)).toMatch(/nothing has changed/i);

    /*
     * The dialog must still be open - closing it is precisely the thing that
     * made a refusal indistinguishable from a success.
     */
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // And it must not be stuck on its spinner: a refusal is not in flight.
    expect(visibleText(container)).not.toMatch(/Archiving…/);
    expect(
      screen.getByRole("button", { name: "Keep it active" }),
    ).toBeInTheDocument();
  });

  it("closes on a successful archive", async () => {
    current = klass();
    archive.mockResolvedValue(undefined);

    const { container } = render(<ClassDetailView classId="c1" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Archive this class" }),
    );
    const confirm = await screen.findAllByRole("button", {
      name: "Archive this class",
    });
    fireEvent.click(confirm[confirm.length - 1]);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(visibleText(container)).not.toMatch(/couldn't archive/i);
  });
});

describe("ClassDetailView restore", () => {
  it("says a refused restore did not happen, instead of nothing at all", async () => {
    current = klass({ archivedAt: "2026-07-31T00:00:00Z" });
    restore.mockRejectedValue(new Error("500"));

    const { container } = render(<ClassDetailView classId="c1" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Restore this class" }),
    );

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/couldn't restore this class/i),
    );
    // Before, the page was byte-identical before and after the press, so a
    // broken write and a dead button looked the same.
    expect(visibleText(container)).toMatch(/nothing has changed/i);
  });

  it("does not fire the restore twice while one is in flight", async () => {
    current = klass({ archivedAt: "2026-07-31T00:00:00Z" });
    // Held in an object: TS narrows a plain `let` to `null` because it cannot
    // see the assignment happen inside the promise callback.
    const pending: { settle: (() => void) | null } = { settle: null };
    restore.mockImplementation(
      () => new Promise<void>((res) => { pending.settle = () => res(); }),
    );

    render(<ClassDetailView classId="c1" />);
    const button = await screen.findByRole("button", {
      name: "Restore this class",
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Restoring…" })).toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Restoring…" }));
    expect(restore).toHaveBeenCalledTimes(1);

    pending.settle?.();
  });
});
