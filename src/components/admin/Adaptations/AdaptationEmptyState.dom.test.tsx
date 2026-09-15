import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { AdaptationLogView } from "./AdaptationLogView";

/**
 * AN EMPTY STATE HAS TO NAME EVERY FILTER THAT COULD BE CAUSING IT.
 *
 * This branch discriminated on the class filter alone, so an admin who had
 * narrowed to one KIND of adaptation and found nothing was told "No
 * adaptations were made in the last 30 days" - a flat statement about their
 * school, produced by a control they had set two rows above - and was offered
 * no way back from it. The kind filter arrived after the branch was written
 * and nothing here noticed.
 */

const log = vi.fn();

vi.mock("@/lib/api/schoolIntelligence", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/schoolIntelligence")>();
  return {
    ...actual,
    schoolIntelligenceApi: {
      ...actual.schoolIntelligenceApi,
      adaptationLog: (q: unknown) => log(q),
    },
  };
});

vi.mock("@/lib/api/classes", () => ({
  classesApi: { list: async () => [] },
}));

const empty = { events: [], total: 0, limit: 20, offset: 0 };

beforeEach(() => {
  log.mockReset();
  log.mockResolvedValue(empty);
});

function chip(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => (b.textContent ?? "").trim() === label,
  );
}

describe("the filtered-empty state", () => {
  it("names the kind filter when one is set", async () => {
    const { container } = render(<AdaptationLogView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Nothing to show for this range/),
    );

    fireEvent.click(chip(container, "Suggested a break")!);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/this kind and range/),
    );
    // And never the flat claim about the whole school.
    expect(visibleText(container)).toMatch(/No adaptations of that kind/);
  });

  it("offers a way back out of it", async () => {
    const { container } = render(<AdaptationLogView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Nothing to show for this range/),
    );

    fireEvent.click(chip(container, "Suggested a break")!);
    await waitFor(() => expect(chip(container, "Show every kind")).toBeTruthy());

    fireEvent.click(chip(container, "Show every kind")!);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Nothing to show for this range/),
    );
    expect(visibleText(container)).not.toMatch(/of that kind/);
  });

  it("keeps the unfiltered wording when nothing is set", async () => {
    const { container } = render(<AdaptationLogView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(
        /No adaptations were made in the last/,
      ),
    );
    expect(visibleText(container)).not.toMatch(/of that kind/);
    expect(chip(container, "Show every kind")).toBeUndefined();
  });
});
