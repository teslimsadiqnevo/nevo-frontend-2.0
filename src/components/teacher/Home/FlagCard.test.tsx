import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlagCard } from "./FlagCard";
import type { HomeFlag } from "@/lib/mocks/teacherHome";

/**
 * "Worth your attention" (C03). This card is a JUDGEMENT ABOUT A CHILD shown
 * to their teacher, which puts it in the class of screen where being wrong
 * costs the most - the same class as the assessment result that once
 * congratulated a child for getting every answer wrong.
 *
 * What is tested here is what a teacher can READ and ACT ON: the child's name,
 * the note explaining the flag, the evidence behind it, and where each action
 * goes. Not the styling - the design frames are the contract for that, and
 * asserting Tailwind classes would only duplicate a check that already exists
 * elsewhere while breaking on every redesign.
 *
 * The one visual thing asserted is the sudden/pattern distinction, because it
 * is semantic rather than decorative: a sudden change means something happened
 * to this child recently, and a teacher reads that differently from a
 * long-standing pattern.
 */

const flag = (over: Partial<HomeFlag> = {}): HomeFlag => ({
  id: "flag-1",
  name: "Amara Kalu",
  context: "Year 7 Maths",
  isSudden: false,
  note: "Three lessons in a row have taken twice as long as usual.",
  evidence: [
    [40, ""],
    [55, ""],
    [30, "accent"],
  ],
  evidenceLabel: "Time per lesson, last 3",
  actionLabel: "See Amara's profile",
  actionHref: "/teacher/classes/c1/students/s1",
  secondaryLabel: "Send them a message",
  secondaryHref: "/teacher/connect?student=s1",
  ...over,
});

describe("FlagCard", () => {
  it("names the child and the class the flag is about", () => {
    render(<FlagCard flag={flag()} />);
    expect(screen.getByText("Amara Kalu")).toBeInTheDocument();
    expect(screen.getByText("Year 7 Maths")).toBeInTheDocument();
  });

  it("shows the note that explains why the flag was raised", () => {
    // A flag without its reason is an accusation. The note is the whole
    // difference between "something is wrong with this child" and something
    // a teacher can act on.
    render(<FlagCard flag={flag()} />);
    expect(
      screen.getByText(
        "Three lessons in a row have taken twice as long as usual.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the evidence label so the judgement can be checked", () => {
    render(<FlagCard flag={flag()} />);
    expect(screen.getByText("Time per lesson, last 3")).toBeInTheDocument();
  });

  it("renders one bar per piece of evidence, at both sizes", () => {
    // The card draws the bars twice - inline for tablet, panelled for desktop -
    // and CSS decides which is visible. Three data points must therefore
    // produce six bars, and a mismatch here would mean a teacher sees fewer
    // sessions than the flag was derived from.
    const { container } = render(<FlagCard flag={flag()} />);
    const bars = container.querySelectorAll("span[style*='height']");
    expect(bars).toHaveLength(6);
  });

  it("points both actions at the right places", () => {
    render(<FlagCard flag={flag()} />);
    for (const link of screen.getAllByRole("link", {
      name: /See Amara's profile/,
    })) {
      expect(link).toHaveAttribute(
        "href",
        "/teacher/classes/c1/students/s1",
      );
    }
    expect(
      screen.getByRole("link", { name: "Send them a message" }),
    ).toHaveAttribute("href", "/teacher/connect?student=s1");
  });

  it("marks a sudden change apart from a standing pattern", () => {
    // Semantic, not decorative: a teacher reads "this happened recently"
    // differently from "this has been true for a while".
    const { container: sudden } = render(
      <FlagCard flag={flag({ isSudden: true })} />,
    );
    expect(sudden.querySelectorAll("svg").length).toBeGreaterThan(0);

    const { container: pattern } = render(
      <FlagCard flag={flag({ isSudden: false })} />,
    );
    expect(pattern.querySelectorAll("svg")).toHaveLength(0);
  });

  it("renders a child with no evidence without inventing any", () => {
    // A flag can arrive before there is a history behind it. Drawing bars for
    // data that does not exist would be a fabricated justification.
    const { container } = render(
      <FlagCard flag={flag({ evidence: [], evidenceLabel: "Not enough yet" })} />,
    );
    expect(container.querySelectorAll("span[style*='height']")).toHaveLength(0);
    expect(screen.getByText("Not enough yet")).toBeInTheDocument();
  });
});
