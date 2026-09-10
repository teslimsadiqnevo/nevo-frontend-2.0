import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { ClassDetailView } from "./ClassDetailView";

/**
 * `ClassStudentResponse.consent` is REQUIRED in the contract, and the client's
 * `ClassStudent` interface did not declare it - so the field arrived on every
 * class roster read and was discarded, while this screen's own marker called
 * the missing consent column "the single biggest gap" on it.
 *
 * The response-shape check cannot catch this direction: it gates on properties
 * the CLIENT declares that the response lacks, and a required field the client
 * ignores only reaches check 2's advisory list when NOTHING in the client names
 * it. `consent` is named all over the students lane, so it never surfaced.
 */

const classStudents = vi.fn();

vi.mock("@/lib/api/classes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/classes")>();
  return {
    ...actual,
    classesApi: {
      ...actual.classesApi,
      get: async () => ({
        id: "c1", name: "JSS 2A", code: null, yearGroup: "jss2",
        source: null, subjects: [], studentCount: 2, archivedAt: null,
      }),
      classTeachers: async () => [],
      classStudents: () => classStudents(),
    },
  };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const student = (id: string, name: string, status: string | null) => ({
  studentId: id,
  firstName: name,
  lastName: "Eze",
  displayName: `${name} Eze`,
  loginIdentifier: name.toLowerCase(),
  status: "active",
  profileStatus: "ready",
  latestSessionAt: null,
  seatContext: "included",
  consent: status
    ? { status, actorId: null, actorName: null, timestamp: null, channel: null }
    : null,
});

describe("class roster consent", () => {
  it("shows the consent the response was already carrying", async () => {
    classStudents.mockResolvedValue([
      student("s1", "Chisom", "confirmed"),
      student("s2", "Amara", "pending"),
    ]);

    const { container } = render(<ClassDetailView classId="c1" />);
    await waitFor(() => expect(visibleText(container)).toMatch(/Chisom Eze/));

    expect(visibleText(container)).toMatch(/Confirmed/);
    expect(visibleText(container)).toMatch(/Pending/);
  });

  it("renders Unknown rather than Not sent when a row carries none", async () => {
    // The roster's rule, applied here too: an absent consent is not a record
    // that nobody asked.
    classStudents.mockResolvedValue([student("s1", "Chisom", null)]);

    const { container } = render(<ClassDetailView classId="c1" />);
    await waitFor(() => expect(visibleText(container)).toMatch(/Chisom Eze/));

    expect(visibleText(container)).toMatch(/Unknown/);
    expect(visibleText(container)).not.toMatch(/Not sent/);
  });
});
