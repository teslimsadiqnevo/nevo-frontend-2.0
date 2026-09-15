import { describe, expect, it } from "vitest";
import type { Invoice } from "@/lib/api/billing";
import { formatMoney, sumMoney } from "@/lib/money";
import {
  PANEL_THRESHOLD_DAYS,
  daysPastDue,
  overdueHeadline,
  overdueLine,
  overduePanel,
} from "./overdue";

/**
 * D11.8, whose constraints are absolute rather than stylistic: no red, no
 * warning glyph, no countdown to suspension, and no copy anywhere that hints
 * at one - because "non-payment never affects a student's or a teacher's
 * access. Not at 60 days, not at 200, not ever."
 */

const NOW = Date.parse("2026-09-15T12:00:00Z");
const daysAgo = (n: number) =>
  new Date(NOW - n * 86_400_000).toISOString();

const inv = (over: Partial<Invoice> = {}): Invoice =>
  ({
    id: Math.random().toString(36).slice(2),
    invoiceNumber: "INV-003",
    issuedAt: daysAgo(90),
    currency: "NGN",
    amount: "80625000",
    status: "overdue",
    dueAt: daysAgo(70),
    paidAt: null,
    pdfUrl: "https://example.test/i.pdf",
    ...over,
  }) as Invoice;

const money = (a: string) => formatMoney(a, "NGN");
const issuedOn = () => "1 September";

describe("daysPastDue", () => {
  it("counts whole days late", () => {
    expect(daysPastDue(daysAgo(12), NOW)).toBe(12);
  });

  it("is null before the date, so nothing reads '0 days past its due date'", () => {
    expect(daysPastDue(new Date(NOW + 86_400_000).toISOString(), NOW)).toBeNull();
    expect(daysPastDue(new Date(NOW).toISOString(), NOW)).toBeNull();
  });

  it("is null for a date it cannot read, which licenses no claim", () => {
    expect(daysPastDue("not a date", NOW)).toBeNull();
    expect(daysPastDue(null, NOW)).toBeNull();
  });
});

describe("overdueLine", () => {
  it("says how long, and that nothing has changed for the children", () => {
    expect(overdueLine(12)).toBe(
      "12 days past its due date. Nothing has changed for your students.",
    );
    expect(overdueLine(1)).toMatch(/^1 day past/);
  });

  it("threatens nothing, because there is nothing to threaten", () => {
    const line = overdueLine(200);
    expect(line).not.toMatch(/suspend|risk|restrict|access|disable|cut off/i);
  });
});

describe("overduePanel", () => {
  it("stays away until the threshold", () => {
    expect(PANEL_THRESHOLD_DAYS).toBe(60);
    expect(overduePanel([inv({ dueAt: daysAgo(59) })], NOW)).toBeNull();
    expect(overduePanel([inv({ dueAt: daysAgo(60) })], NOW)).not.toBeNull();
  });

  it("ignores invoices that are not overdue", () => {
    expect(
      overduePanel([inv({ status: "paid", dueAt: daysAgo(400) })], NOW),
    ).toBeNull();
    expect(
      overduePanel([inv({ status: "pending", dueAt: daysAgo(400) })], NOW),
    ).toBeNull();
  });

  it("never counts an invoice whose date it could not read", () => {
    // A total a bursar reconciles against their own ledger must not include a
    // row we do not actually understand.
    const panel = overduePanel(
      [inv({ dueAt: daysAgo(70) }), inv({ dueAt: "rubbish" })],
      NOW,
    );
    expect(panel!.invoices).toHaveLength(1);
  });

  it("says nothing at all when the invoice list could not be read", () => {
    expect(overduePanel(null, NOW)).toBeNull();
  });
});

describe("overdueHeadline", () => {
  it("names the single invoice it is about", () => {
    const panel = overduePanel([inv({ dueAt: daysAgo(70) })], NOW)!;
    expect(overdueHeadline(panel, money, issuedOn)).toBe(
      "₦80,625,000 is outstanding from INV-003, issued 1 September.",
    );
  });

  it("aggregates rather than repeating itself per invoice", () => {
    const panel = overduePanel(
      [
        inv({ dueAt: daysAgo(70), amount: "80625000" }),
        inv({ dueAt: daysAgo(65), amount: "80625000" }),
      ],
      NOW,
    )!;
    expect(overdueHeadline(panel, money, issuedOn)).toBe(
      "2 invoices are outstanding, totalling ₦161,250,000.",
    );
  });

  it("adds the figures exactly, never through a float", () => {
    // `money.ts`: "Money, from the API's decimal STRINGS - never through a
    // float." 0.1 + 0.2 is the reason.
    expect(sumMoney(["0.1", "0.2"])).toBe("0.3");
    expect(sumMoney(["80625000.55", "80625000.45"])).toBe("161250001.00");
    expect(sumMoney(["9999999999999999999", "1"])).toBe("10000000000000000000");
  });

  it("gives no total rather than a wrong one", () => {
    expect(sumMoney(["100", "not a number"])).toBeNull();
    expect(sumMoney(["100", null])).toBeNull();
    const panel = overduePanel(
      [
        inv({ dueAt: daysAgo(70), amount: "100" }),
        inv({ dueAt: daysAgo(65), amount: "" }),
      ],
      NOW,
    )!;
    // The count still stands; only the figure is withheld.
    expect(overdueHeadline(panel, money, issuedOn)).toBe(
      "2 invoices are outstanding.",
    );
  });
});
