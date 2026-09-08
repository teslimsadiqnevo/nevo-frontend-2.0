import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { CostSheet, computeCost } from "./CostSheet";
import type { Subscription } from "@/lib/api/billing";

/**
 * This is the figure a school pays, so the arithmetic is pinned rather than
 * trusted. Two things in particular:
 *
 * 1. Money is computed in integer minor units from the API's decimal STRING.
 *    Floats are fine at these magnitudes right up until they are not, and
 *    "₦54,824,999.99999" on an invoice is not a rounding curiosity.
 * 2. VAT at 7.5% is NIGERIAN. `currency` is an enum of USD, NGN and GBP, and
 *    no rate is carried for the other two - so a dollar school must not be
 *    shown a Nigerian tax line.
 */

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  schoolId: "s1",
  schoolName: "Corona Secondary School",
  pricingModel: "per_student",
  activeStudentCount: 340,
  perStudentAnnualRate: "150000.00",
  currency: "NGN",
  subscriptionTier: "mid_market",
  studentCountBand: "medium",
  contractValue: "50000.00",
  contractStart: null,
  contractEnd: null,
  renewalBannerVisible: false,
  renewalMessage: null,
  billingContact: null,
  ...over,
});

const shown = (c: HTMLElement) => (c.textContent ?? "").replace(/\u2019/g, "'");

describe("computeCost", () => {
  it("matches D11's worked example exactly", () => {
    // 340 × ₦150,000 = ₦51,000,000; VAT 7.5% = ₦3,825,000; total ₦54,825,000.
    const c = computeCost(sub())!;
    expect(c.subtotalMinor).toBe(51_000_000_00);
    expect(c.vatMinor).toBe(3_825_000_00);
    expect(c.totalMinor).toBe(54_825_000_00);
  });

  it("does not apply Nigerian VAT to other currencies", () => {
    for (const currency of ["USD", "GBP"] as const) {
      const c = computeCost(sub({ currency }))!;
      expect(c.vatMinor).toBeNull();
      // Total is the subtotal - no invented tax.
      expect(c.totalMinor).toBe(c.subtotalMinor);
    }
  });

  it("handles a rate with kobo without losing a fraction", () => {
    const c = computeCost(sub({ activeStudentCount: 3, perStudentAnnualRate: "0.01" }))!;
    expect(c.subtotalMinor).toBe(3);
  });

  it("is null when there is no rate - a count is not a cost", () => {
    expect(computeCost(sub({ perStudentAnnualRate: null }))).toBeNull();
    expect(computeCost(sub({ perStudentAnnualRate: "not a number" }))).toBeNull();
  });
});

describe("CostSheet", () => {
  it("shows the total and the working", () => {
    const { container } = render(<CostSheet subscription={sub()} />);
    const t = shown(container);
    expect(t).toMatch(/₦54,825,000/);
    expect(t).toMatch(/340 active students/);
    expect(t).toMatch(/VAT at 7.5%/);
  });

  it("never shows the disputed tier fields", () => {
    const t = shown(render(<CostSheet subscription={sub()} />).container);
    expect(t).not.toMatch(/mid_market|medium|50000/);
  });

  it("says what is known when no rate is set, and claims no total", () => {
    const t = shown(
      render(<CostSheet subscription={sub({ perStudentAnnualRate: null })} />)
        .container,
    );
    expect(t).toMatch(/340 active students/);
    expect(t).toMatch(/no total to show/i);
    expect(t).not.toMatch(/₦/);
  });
});
