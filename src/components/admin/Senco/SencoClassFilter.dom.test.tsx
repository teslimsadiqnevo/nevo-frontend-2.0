import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { AdminClass } from "@/lib/api/classes";
import type { AdminStudentRow } from "@/lib/api/students";
import { SencoView } from "./SencoView";

/**
 * "No profiles match. Try a different name or filter."
 *
 * This screen issues one roster request PER CLASS to work out who is in what.
 * Each can fail on its own, and a class whose request failed contributed no
 * entries at all - so filtering to it matched nobody, and the screen stated it
 * as a fact about the school's records. A SENCo checking who she holds profiles
 * for before a review meeting concluded Nevo held none for that class.
 */

const perClass = vi.fn();
const classList = vi.fn();

vi.mock("@/lib/api/intelligence", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/intelligence")>();
  return {
    ...actual,
    intelligenceApi: { ...actual.intelligenceApi, getFlags: async () => [] },
  };
});

vi.mock("@/lib/api/classes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/classes")>();
  return {
    ...actual,
    classesApi: { ...actual.classesApi, list: () => classList() },
  };
});

const students: AdminStudentRow[] = [
  {
    id: "s1",
    name: "Amara Okafor",
    loginIdentifier: "amara",
    status: "active",
    ageBand: "11-14",
    consent: null,
  },
];

vi.mock("@/lib/api/students", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/students")>();
  return {
    ...actual,
    studentsApi: {
      ...actual.studentsApi,
      // The whole-school read and the per-class read are the same function
      // with different arguments; only the second one is under test.
      list: (opts?: { classId?: string }) =>
        opts?.classId ? perClass(opts.classId) : Promise.resolve(students),
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const klass = (id: string, name: string): AdminClass => ({
  id,
  name,
  code: null,
  yearGroup: "jss2",
  source: null,
  subjects: [],
  studentCount: 1,
  archivedAt: null,
});

async function openProfilesAndFilter(container: HTMLElement, classId: string) {
  fireEvent.click(await screen.findByRole("tab", { name: "Learner profiles" }));
  const select = await waitFor(() => {
    const el = container.querySelector("select") as HTMLSelectElement | null;
    if (!el) throw new Error("no class filter yet");
    return el;
  });
  fireEvent.change(select, { target: { value: classId } });
}

describe("SencoView class filter", () => {
  it("does not report an empty class when that class's roster failed", async () => {
    classList.mockResolvedValue([klass("c1", "JSS 2A")]);
    perClass.mockRejectedValue(new Error("500"));

    const { container } = render(<SencoView />);
    await openProfilesAndFilter(container, "c1");

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/couldn't read that class's roster/i),
    );
    expect(visibleText(container)).toMatch(
      /not a record that the class has no profiles/i,
    );
    expect(visibleText(container)).not.toMatch(/No profiles match/i);
  });

  it("still says no match when the roster read fine and nobody is in it", async () => {
    classList.mockResolvedValue([klass("c1", "JSS 2A")]);
    perClass.mockResolvedValue([]);

    const { container } = render(<SencoView />);
    await openProfilesAndFilter(container, "c1");

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/No profiles match/i),
    );
    expect(visibleText(container)).not.toMatch(/couldn't read/i);
  });
  it("does not report an empty class while that class's roster is still loading", async () => {
    // `setPhase("ready")` fires before the per-class fan-out is even launched,
    // so the filter was usable during a window in which no class had answered.
    classList.mockResolvedValue([klass("c1", "JSS 2A")]);
    perClass.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<SencoView />);
    await openProfilesAndFilter(container, "c1");

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Still reading that class's roster/i),
    );
    expect(visibleText(container)).not.toMatch(/No profiles match/i);
    expect(visibleText(container)).not.toMatch(/couldn't read/i);
  });
});
