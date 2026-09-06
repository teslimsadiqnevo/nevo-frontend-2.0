import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { useClassInsights } = vi.hoisted(() => ({ useClassInsights: vi.fn() }));
vi.mock("@/hooks/useClassInsights", () => ({ useClassInsights }));

const { LiveClassInsights } = await import("./LiveClassInsights");

/**
 * C09 Insights for a real class.
 *
 * The distinction these tests exist to protect is the one the hook spells out
 * in its own type: `empty` means every read landed and there was nothing in
 * them; `failed` means every read failed. NEVER THE SAME THING.
 *
 * Collapsing them is not a cosmetic slip. "Still gathering insights for Year 7
 * Maths" shown over three failed requests is an AFFIRMATIVE, FALSE CLAIM about
 * real children - it tells a teacher Nevo has looked and found nothing worth
 * raising, when in fact Nevo never looked. A teacher who would have acted on a
 * flag does not, and nothing on screen suggests they should ask again.
 *
 * The hook is mocked because `useLiveQuery` is tested directly elsewhere. What
 * is under test here is whether the component tells these three states apart.
 */

const CLASS = { classId: "c9", className: "Year 7 Maths" };

const state = (over: Partial<ReturnType<typeof useClassInsights>> = {}) => ({
  misconceptions: [],
  concepts: [],
  flags: [],
  loading: false,
  empty: false,
  failed: false,
  ...over,
});

beforeEach(() => {
  useClassInsights.mockReset();
});

describe("LiveClassInsights - telling the three states apart", () => {
  it("holds the space while the reads are in flight", () => {
    useClassInsights.mockReturnValue(state({ loading: true }));
    const { container } = render(<LiveClassInsights {...CLASS} />);

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
    expect(screen.queryByText(/Still gathering/)).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn’t load/i)).not.toBeInTheDocument();
  });

  it("says the read failed, and says it is not about the class", () => {
    useClassInsights.mockReturnValue(state({ failed: true }));
    render(<LiveClassInsights {...CLASS} />);

    expect(
      screen.getByText(/We couldn’t load insights just now/i),
    ).toBeInTheDocument();
    // The sentence names the class only to EXCLUDE it as the cause.
    expect(
      screen.getByText(/This isn't about Year 7 Maths/),
    ).toBeInTheDocument();
  });

  it("NEVER says it is still gathering when the reads failed", () => {
    // The regression that matters. This claim over a failure tells a teacher
    // Nevo looked and found nothing, when Nevo never looked at all.
    useClassInsights.mockReturnValue(state({ failed: true }));
    render(<LiveClassInsights {...CLASS} />);

    expect(screen.queryByText(/Still gathering/)).not.toBeInTheDocument();
  });

  it("says it is still gathering when the reads genuinely came back empty", () => {
    useClassInsights.mockReturnValue(state({ empty: true }));
    render(<LiveClassInsights {...CLASS} />);

    expect(
      screen.getByText(/Still gathering insights for Year 7 Maths/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/couldn’t load/i)).not.toBeInTheDocument();
  });

  it("prefers the failure message when a read both failed and is empty", () => {
    // `failed` is checked first by design: an empty result set produced BY a
    // failure is a failure, and claiming otherwise is the false claim again.
    useClassInsights.mockReturnValue(state({ failed: true, empty: true }));
    render(<LiveClassInsights {...CLASS} />);

    expect(
      screen.getByText(/We couldn’t load insights just now/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Still gathering/)).not.toBeInTheDocument();
  });
});

describe("LiveClassInsights - with something to say", () => {
  it("draws the class mastery panel from real concepts", () => {
    useClassInsights.mockReturnValue(
      state({
        concepts: [
          {
            conceptId: "k1",
            name: "Equivalent fractions",
            understanding: 64,
            reading: 52,
            studentCount: 18,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
      }),
    );
    render(<LiveClassInsights {...CLASS} />);

    expect(screen.getByText("Equivalent fractions")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Equivalent fractions - understanding",
      }),
    ).toHaveAttribute("aria-valuenow", "64");
  });

  it("does not claim a state it was not given", () => {
    // Something to show means neither banner is drawn - the sparse card is
    // for a class with nothing in ANY section, not for a partial one.
    useClassInsights.mockReturnValue(
      state({
        concepts: [
          {
            conceptId: "k1",
            name: "Equivalent fractions",
            understanding: 64,
            reading: 52,
            studentCount: 18,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
      }),
    );
    render(<LiveClassInsights {...CLASS} />);

    expect(screen.queryByText(/Still gathering/)).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn’t load/i)).not.toBeInTheDocument();
  });
});
