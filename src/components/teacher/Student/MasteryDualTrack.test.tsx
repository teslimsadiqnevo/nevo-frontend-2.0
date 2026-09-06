import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MasteryDualTrack } from "./MasteryDualTrack";

/**
 * One concept, two tracks: how well a child has understood it, and how much
 * the reading load is shaping that result.
 *
 * This is a judgement about a child in the strongest sense in the console -
 * "Reading support needed" is a label a teacher may act on for months, and
 * SCRUM-38 deliberately keeps the attribution TEXT-ONLY for that reason: a
 * flagged row gets words, never an alarm colour.
 *
 * The values are read off the `progressbar` roles rather than the bar widths.
 * That is what a screen reader announces and what a teacher is actually being
 * told; a `width:` string is the styling that happens to express it.
 */

describe("MasteryDualTrack - what the numbers say", () => {
  it("reports both tracks as the teacher sees them", () => {
    render(
      <MasteryDualTrack concept="Equivalent fractions" understanding={72} reading={48} />,
    );
    expect(
      screen.getByRole("progressbar", { name: "Equivalent fractions - understanding" }),
    ).toHaveAttribute("aria-valuenow", "72");
    expect(
      screen.getByRole("progressbar", { name: "Equivalent fractions - reading level" }),
    ).toHaveAttribute("aria-valuenow", "48");
  });

  it("clamps a value outside 0-100 rather than drawing past the rail", () => {
    render(<MasteryDualTrack concept="Fractions" understanding={140} reading={-20} />);
    expect(
      screen.getByRole("progressbar", { name: "Fractions - understanding" }),
    ).toHaveAttribute("aria-valuenow", "100");
    expect(
      screen.getByRole("progressbar", { name: "Fractions - reading level" }),
    ).toHaveAttribute("aria-valuenow", "0");
  });

  it("falls back rather than emitting NaN when a value is missing", () => {
    // `width:NaN%` renders as a full-width bar in some engines, which would
    // show a child at 100% understanding on absent data.
    render(
      <MasteryDualTrack
        concept="Fractions"
        understanding={Number.NaN}
        reading={Number.NaN}
      />,
    );
    expect(
      screen.getByRole("progressbar", { name: "Fractions - understanding" }),
    ).toHaveAttribute("aria-valuenow", "72");
    expect(
      screen.getByRole("progressbar", { name: "Fractions - reading level" }),
    ).toHaveAttribute("aria-valuenow", "48");
  });
});

describe("MasteryDualTrack - the support label", () => {
  it("names concept support when understanding is low but reading is fine", () => {
    render(<MasteryDualTrack concept="Fractions" understanding={30} reading={70} />);
    expect(screen.getByText("Concept support needed")).toBeInTheDocument();
  });

  it("names reading support when the reverse is true", () => {
    // The distinction that matters: a child who understands the concept but
    // cannot read the question needs a different intervention entirely.
    render(<MasteryDualTrack concept="Fractions" understanding={70} reading={30} />);
    expect(screen.getByText("Reading support needed")).toBeInTheDocument();
  });

  it("names general support when both are low", () => {
    render(<MasteryDualTrack concept="Fractions" understanding={30} reading={30} />);
    expect(screen.getByText("Needs support")).toBeInTheDocument();
  });

  it("says nothing when both tracks are healthy", () => {
    render(<MasteryDualTrack concept="Fractions" understanding={80} reading={80} />);
    expect(screen.queryByText(/support/i)).not.toBeInTheDocument();
  });

  it("PINS THE DELIBERATE GAP: one track under 40 with the other 40-59 flags nothing", () => {
    // Not an oversight. The component reproduces the frame's own rule rather
    // than "correcting" it, and it is flagged to design. This test exists so
    // that if someone closes the gap it is a DECISION with a failing test
    // attached, not a silent change to who gets offered support.
    render(<MasteryDualTrack concept="Fractions" understanding={30} reading={50} />);
    expect(screen.queryByText(/support/i)).not.toBeInTheDocument();

    render(<MasteryDualTrack concept="Decimals" understanding={50} reading={30} />);
    expect(screen.queryByText(/support/i)).not.toBeInTheDocument();
  });

  it("lets an explicit flag override the computed one", () => {
    render(
      <MasteryDualTrack
        concept="Fractions"
        understanding={30}
        reading={30}
        flag="Reviewed with SENCo"
      />,
    );
    expect(screen.getByText("Reviewed with SENCo")).toBeInTheDocument();
    expect(screen.queryByText("Needs support")).not.toBeInTheDocument();
  });

  it('suppresses the label entirely on the literal "none"', () => {
    // The escape hatch for a row that has been reviewed and should not carry
    // a standing label.
    render(
      <MasteryDualTrack
        concept="Fractions"
        understanding={30}
        reading={30}
        flag="none"
      />,
    );
    expect(screen.queryByText(/support/i)).not.toBeInTheDocument();
  });

  it("still labels its bars when the row has no concept name", () => {
    // The component repeats down a panel where the concept may be the row
    // heading instead. The bars must stay announceable either way.
    render(<MasteryDualTrack concept="" understanding={60} reading={60} />);
    expect(screen.getByRole("progressbar", { name: "Understanding" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Reading level" })).toBeInTheDocument();
  });
});
