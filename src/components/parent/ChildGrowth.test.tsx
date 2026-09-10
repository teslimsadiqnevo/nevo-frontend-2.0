import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GrowthNarrative, GrowthTrend } from "@/lib/api/parent";
import { ChildGrowth, formatRange } from "./ChildGrowth";

/**
 * D15d Parent Growth View.
 *
 * The rules this screen exists to keep are unusually literal, so the tests are
 * literal too:
 *
 *   - a parent is never shown a number about their child
 *   - the page never claims a "term", because no term dates exist anywhere
 *   - "not enough yet" is SHOWN, not quietly dropped
 *
 * The third is the one that would be tempting to get wrong. A screen that hides
 * the dimensions it cannot speak to looks tidier and tells a parent their child
 * is growing on evidence that does not support it.
 */

const NARRATIVE: GrowthNarrative = {
  studentId: "s-1",
  studentFirstName: "Amara",
  headline: "This term, we're seeing real change",
  summary: "Amara is settling into how she learns best.",
  statements: [
    {
      dimension: "staying_with_hard_problems",
      trend: "growing",
      statement:
        "She's working through tricky questions on her own for longer before asking for help.",
    },
    {
      dimension: "knowing_what_she_knows",
      trend: "steady",
      statement:
        "She's getting a clearer sense of what she has understood, and what is worth another look.",
    },
    {
      dimension: "connecting_ideas",
      trend: "emerging",
      statement:
        "She's starting to carry what she learns in one subject over into another.",
    },
    {
      dimension: "learning_new_things_faster",
      trend: "not_enough_yet",
      statement:
        "There isn't enough yet to say how this is going. It will fill in as she does more lessons.",
    },
  ],
  periodStart: "2026-06-12",
  periodEnd: "2026-09-10",
  comparisonStart: "2026-03-14",
  comparisonEnd: "2026-06-11",
  generatedAt: "2026-09-10T09:00:00Z",
  source: "live_learning_data",
};

const withTrend = (trend: GrowthTrend): GrowthNarrative => ({
  ...NARRATIVE,
  statements: NARRATIVE.statements.map((s) => ({ ...s, trend })),
});

describe("the four dimensions", () => {
  it("renders all four, in the frame's titles", () => {
    render(<ChildGrowth growth={NARRATIVE} />);

    expect(screen.getByText("Staying with hard problems")).toBeInTheDocument();
    expect(screen.getByText("Connecting ideas")).toBeInTheDocument();
    expect(screen.getByText("Learning new things faster")).toBeInTheDocument();
  });

  it("does not assume the child is a girl", () => {
    // The frame's example is Amara, so its title reads "Knowing what she
    // knows" - and the enum behind it is `knowing_what_she_knows`. A real child
    // may be any gender and the payload carries no pronoun.
    render(<ChildGrowth growth={NARRATIVE} />);

    expect(screen.getByText("Knowing what they know")).toBeInTheDocument();
    expect(screen.queryByText("Knowing what she knows")).not.toBeInTheDocument();
  });

  it("shows the statement exactly as sent, without reformatting it", () => {
    render(<ChildGrowth growth={NARRATIVE} />);
    expect(
      screen.getByText(
        /working through tricky questions on her own for longer before asking for help\./,
      ),
    ).toBeInTheDocument();
  });
});

describe("not_enough_yet", () => {
  it("is rendered, never hidden", () => {
    // The failure this guards: dropping the dimensions with no evidence makes
    // the page tidier and tells a parent their child is growing on evidence
    // that does not support it.
    render(<ChildGrowth growth={NARRATIVE} />);

    expect(screen.getByText("Not enough yet")).toBeInTheDocument();
    expect(screen.getByText(/isn't enough yet to say how this is going/)).toBeInTheDocument();
  });

  it("still shows all four cards when nothing has enough evidence", () => {
    render(<ChildGrowth growth={withTrend("not_enough_yet")} />);

    expect(screen.getAllByText("Not enough yet")).toHaveLength(4);
    expect(screen.getByText("Staying with hard problems")).toBeInTheDocument();
  });

  it("carries no alarm colour - it is not a bad result", () => {
    // Matched on Tailwind colour tokens specifically. A bare /red/ sweep over
    // innerHTML finds the letters inside ordinary class names and passes or
    // fails for the wrong reason.
    const { container } = render(<ChildGrowth growth={withTrend("not_enough_yet")} />);
    expect(container.innerHTML).not.toMatch(
      /(?:bg|text|border)-(?:red|rose|amber|orange|yellow)-/,
    );
  });
});

describe("never showing a parent a number", () => {
  it("renders no digit anywhere in the four statements", () => {
    // The backend has the mirror of this test: it fails if a statement contains
    // a digit. This one fails if the screen introduces one.
    render(<ChildGrowth growth={NARRATIVE} />);

    for (const s of NARRATIVE.statements) {
      expect(screen.getByText(s.statement).textContent ?? "").not.toMatch(/\d/);
    }
  });

  it("tells the parent outright that there is no score", () => {
    // Asserted as PRESENT, not absent. A sweep for the word "score" fails on
    // this very sentence - the page's own promise that it never gives one -
    // which is a good reminder that "the word is missing" is not the property
    // worth testing. The property is that no NUMBER describes the child.
    render(<ChildGrowth growth={NARRATIVE} />);
    expect(
      screen.getByText(/never gives Amara a score, a percentage or a label/i),
    ).toBeInTheDocument();
  });

  it("puts no percentage anywhere on the page", () => {
    const { container } = render(<ChildGrowth growth={NARRATIVE} />);
    expect(container.textContent ?? "").not.toContain("%");
  });
});

describe("what period this covers", () => {
  it("says what was actually compared, with real dates", () => {
    render(<ChildGrowth growth={NARRATIVE} />);
    expect(
      screen.getByText(
        /Based on 12 June to 10 September, compared with 14 March to 11 June\./,
      ),
    ).toBeInTheDocument();
  });

  it("never claims a term, because no term dates exist", () => {
    // The frame says "this term" three times. The roster holds no term dates,
    // so the page would be claiming something nobody can support. The API sends
    // both windows precisely so the screen can say the true thing instead.
    const { container } = render(<ChildGrowth growth={NARRATIVE} />);
    const chrome = (container.textContent ?? "").replace(NARRATIVE.headline, "");
    expect(chrome).not.toMatch(/\bterm\b/i);
  });
});

describe("formatRange", () => {
  it("reads as a sentence", () => {
    expect(formatRange("2026-06-12", "2026-09-10")).toBe("12 June to 10 September");
  });

  it("falls back to the raw values rather than rendering Invalid Date", () => {
    // A broken date should cost the sentence, not the page.
    expect(formatRange("nonsense", "2026-09-10")).toBe("nonsense to 2026-09-10");
  });
});
