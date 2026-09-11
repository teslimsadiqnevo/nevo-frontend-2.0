import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  ConsentPill,
  consentDetailLine,
  withdrawnCount,
  withoutRecordedConsent,
} from "./ConsentPill";
import type { StudentConsent } from "@/lib/api/students";

/**
 * Two rules are pinned here because breaking either misinforms a school about a
 * legal position, and both are easy to break by accident:
 *
 * 1. An ABSENT consent object is not "not sent". A read that did not carry
 *    consent must not render as a school having asked nobody.
 * 2. Consent is never derived from account status. An active account is not a
 *    granted consent - conflating them was the obvious shortcut when the field
 *    did not exist, and it stays wrong now that it does.
 */

const at = (status: StudentConsent["status"], over: Partial<StudentConsent> = {}) =>
  ({ status, actorId: null, actorName: null, timestamp: null, channel: null, ...over });

const text = (el: HTMLElement) => (el.textContent ?? "").replace(/\u2019/g, "'");

describe("ConsentPill", () => {
  it("renders each of the four states with its own label", () => {
    const seen = (["confirmed", "pending", "not_sent", "withdrawn"] as const).map(
      (s) => text(render(<ConsentPill consent={at(s)} />).container),
    );
    expect(seen).toEqual(["Confirmed", "Pending", "Not sent", "Withdrawn"]);
  });

  it("says Unknown when the read carried no consent - never 'Not sent'", () => {
    for (const missing of [null, undefined]) {
      const { container } = render(<ConsentPill consent={missing} />);
      expect(text(container)).toBe("Unknown");
      expect(text(container)).not.toMatch(/Not sent/);
    }
  });

  it("uses no red for withdrawn - the palette has no alarm colours", () => {
    const { container } = render(<ConsentPill consent={at("withdrawn")} />);
    const cls = container.firstElementChild?.className ?? "";
    expect(cls).toMatch(/violet/);
    expect(cls).not.toMatch(/red|rose|danger|destructive/);
  });
});

/**
 * These two count different things and the difference is the whole ruling.
 *
 * This used to be one function called `blockedByConsent`, feeding a header that
 * read "N can't begin lessons yet". SCRUM-80 says Nevo is not the consent gate:
 * `not_sent` and `pending` are the school's paperwork and the child proceeds.
 * Only a withdrawal stops processing.
 */
const ROWS = [
  { consent: at("confirmed") },
  { consent: at("pending") },
  { consent: at("withdrawn") },
  { consent: at("not_sent") },
  // No consent on the read is not a fact about the student either way.
  { consent: null },
  {},
];

describe("withoutRecordedConsent", () => {
  it("counts everyone not confirmed, and ignores unknowns", () => {
    expect(withoutRecordedConsent(ROWS)).toBe(3);
  });
});

describe("withdrawnCount", () => {
  it("counts only an actual withdrawal", () => {
    expect(withdrawnCount(ROWS)).toBe(1);
  });

  it("never treats an absent record as a withdrawal", () => {
    expect(withdrawnCount([{ consent: null }, {}])).toBe(0);
  });

  it("is not the same number as the paperwork count", () => {
    // If these ever agree on this fixture, one of them has been rewritten
    // into the other and the SCRUM-80 distinction is gone.
    expect(withdrawnCount(ROWS)).not.toBe(withoutRecordedConsent(ROWS));
  });
});

describe("consentDetailLine", () => {
  it("names the actor and the date on a withdrawal, per SCRUM-40", () => {
    expect(
      consentDetailLine(
        at("withdrawn", { actorName: "Mrs. Eze", timestamp: "2026-07-14T09:00:00Z" }),
      ),
    ).toBe("Mrs. Eze withdrew consent on 14 July 2026.");
  });

  it("still says a withdrawal happened when the actor is unknown", () => {
    expect(consentDetailLine(at("withdrawn"))).toMatch(/withdrawn/i);
  });
});
