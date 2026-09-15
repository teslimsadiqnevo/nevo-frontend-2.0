import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type {
  AdminStudentRow,
  ConsentState,
  StudentConsent,
} from "@/lib/api/students";
import { StudentsView } from "./StudentsView";

/**
 * The roster exists to answer the consent question and could not be narrowed
 * by it - so "which families have replied" could be read row by row and no
 * other way. And the footer line SCRUM-40 says to keep by name ("it is where
 * admins learn how parent accounts come into being") was missing entirely.
 */

const list = vi.fn();
const params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
  useSearchParams: () => params,
}));

vi.mock("@/lib/api/students", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/students")>();
  return {
    ...actual,
    studentsApi: { ...actual.studentsApi, list: () => list() },
  };
});

vi.mock("@/lib/api/classes", () => ({ classesApi: { list: async () => [] } }));

const row = (
  name: string,
  consent: AdminStudentRow["consent"],
): AdminStudentRow => ({
  id: name,
  name,
  status: "active",
  ageBand: null,
  loginIdentifier: null,
  consent,
});

const withStatus = (status: ConsentState): StudentConsent => ({
  status,
  actorId: null,
  actorName: null,
  timestamp: null,
  channel: null,
});

beforeEach(() => {
  list.mockReset();
  list.mockResolvedValue([
    row("Amara Okafor", withStatus("confirmed")),
    row("Chidi Eze", withStatus("withdrawn")),
    row("Ngozi Bello", withStatus("pending")),
    row("Tunde Alao", null),
  ]);
});

function select(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll("select")).find((s) =>
    Array.from(s.options).some((o) => o.textContent === label),
  )!;
}

describe("the consent filter", () => {
  it("narrows to withdrawn families", async () => {
    const { container } = render(<StudentsView />);
    await waitFor(() => expect(visibleText(container)).toMatch(/Amara Okafor/));

    fireEvent.change(select(container, "Any consent"), {
      target: { value: "withdrawn" },
    });
    await waitFor(() =>
      expect(visibleText(container)).not.toMatch(/Amara Okafor/),
    );
    expect(visibleText(container)).toMatch(/Chidi Eze/);
  });

  it("tells a missing record from one that says 'not asked'", async () => {
    // A row that came back with no consent object is not the same as
    // `not_sent`, and folding them would report a read gap as a school's own
    // decision not to ask.
    const { container } = render(<StudentsView />);
    await waitFor(() => expect(visibleText(container)).toMatch(/Tunde Alao/));

    fireEvent.change(select(container, "Any consent"), {
      target: { value: "none" },
    });
    await waitFor(() => expect(visibleText(container)).not.toMatch(/Ngozi/));
    expect(visibleText(container)).toMatch(/Tunde Alao/);

    fireEvent.change(select(container, "Any consent"), {
      target: { value: "not_sent" },
    });
    await waitFor(() =>
      expect(visibleText(container)).not.toMatch(/Tunde Alao/),
    );
  });
});

describe("the footer line", () => {
  it("says where a parent account comes from", async () => {
    const { container } = render(<StudentsView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(
        /a parent account is created automatically once consent is confirmed/,
      ),
    );
  });

  it("counts what is on screen, so it stays true under a filter", async () => {
    const { container } = render(<StudentsView />);
    await waitFor(() => expect(visibleText(container)).toMatch(/Showing 4 of 4/));

    fireEvent.change(select(container, "Any consent"), {
      target: { value: "withdrawn" },
    });
    await waitFor(() => expect(visibleText(container)).toMatch(/Showing 1 of 4/));
  });
});
