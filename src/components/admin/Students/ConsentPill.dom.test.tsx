import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ConsentPill, blockedByConsent, consentDetailLine } from "./ConsentPill";
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

describe("blockedByConsent", () => {
  it("counts everyone who is not confirmed, and ignores unknowns", () => {
    expect(
      blockedByConsent([
        { consent: at("confirmed") },
        { consent: at("pending") },
        { consent: at("withdrawn") },
        { consent: at("not_sent") },
        // No consent on the read is not a student we can call blocked.
        { consent: null },
        {},
      ]),
    ).toBe(3);
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
