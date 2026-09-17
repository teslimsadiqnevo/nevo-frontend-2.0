import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { SessionPanel } from "./SessionPanel";
import type { SessionRow } from "@/lib/mocks/teacherStudents";

/**
 * Session detail (C08d), and the copy rule it broke.
 *
 * It rendered `title="Took her time here"` on every slow section: a tooltip a
 * teacher reads about a specific child, using a pronoun nothing in the system
 * stores. Frontend section 6 on two counts - no gendered pronoun in generated
 * copy, and "describe what the software did rather than what the child is".
 * "Steady" was the same mistake in the other direction, characterising a child
 * where the flag only says how long a section took.
 *
 * WHY THIS ASSERTS ON `innerHTML` AND NOT `textContent`. The offending string
 * was a `title` ATTRIBUTE, which never appears in `textContent` - so the
 * pronoun test the parent lane already had would have passed on this component
 * while the bug was live. Attributes are where tooltips, aria-labels and alt
 * text live, and all three are copy a person reads.
 *
 * The escaping matters too: the parent lane records that `\b` written through a
 * shell was mangled into literal backspace characters, so the regex matched
 * nothing and could never fail. This file is written directly for that reason,
 * and the guard below is verified by putting a pronoun back.
 */

const PRONOUN = /\b(he|him|his|she|her|hers|himself|herself)\b/i;

const session = (over: Partial<SessionRow> = {}): SessionRow => ({
  id: "s-1",
  date: "9 Jul",
  dateLong: "9 July",
  lesson: "Solving linear equations",
  note: "Worked through it across two sittings.",
  steps: [
    { title: "What an equation is", note: "Straight through.", took: false },
    { title: "Equations with x on both sides", note: "Came back the next day.", took: true },
  ],
  ...over,
});

const renderPanel = (over: Partial<SessionRow> = {}) =>
  render(
    <SessionPanel
      session={session(over)}
      studentName="Amara Okafor"
      onClose={vi.fn()}
      onRecommend={vi.fn()}
      onMessage={vi.fn()}
    />,
  );

describe("the section markers", () => {
  it("describes the section, not the child, on a slow step", () => {
    const { container } = renderPanel();

    expect(container.innerHTML).toContain("Spent longer on this section");
    expect(container.innerHTML).not.toContain("Took her time");
  });

  it("describes the section, not the child, on a steady step", () => {
    // "Steady" reads as a verdict on a person. The flag only says the section
    // did not take longer.
    const { container } = renderPanel();

    expect(container.innerHTML).toContain("Moved straight through");
    expect(container.innerHTML).not.toMatch(/title="Steady"/);
  });
});

describe("pronouns", () => {
  it("uses none anywhere a teacher can read, attributes included", () => {
    const { container } = renderPanel();

    expect(container.innerHTML).not.toMatch(PRONOUN);
  });

  it("would catch one in an attribute, which textContent cannot", () => {
    // Proves the guard above is not vacuous, and proves WHY it reads innerHTML.
    // This is the exact shape of the bug: a pronoun that never reaches
    // textContent because it lives in a title.
    const { container } = render(
      <div>
        <span title="Took her time here">x</span>
      </div>,
    );

    expect(container.textContent ?? "").not.toMatch(PRONOUN);
    expect(container.innerHTML).toMatch(PRONOUN);
  });
});
