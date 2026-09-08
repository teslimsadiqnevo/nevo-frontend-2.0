import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { Pricing } from "@/lib/api/billing";
import { CostSheet } from "./CostSheet";

/**
 * The figure a school pays, so it is pinned rather than trusted.
 *
 * THE OLD TESTS HERE ALL PASSED WHILE THE SCREEN WAS BROKEN FOR EVERY SCHOOL.
 * They built a `Subscription` fixture by hand in the flat shape the component
 * expected - `activeStudentCount`, `perStudentAnnualRate`, `currency` at the
 * top level - and the deployed contract has never had those names there. The
 * fixture agreed with the code, both disagreed with the server, and a green
 * suite said nothing. `api.get<T>` is a cast, so nothing else was going to
 * catch it either.
 *
 * The fixture below is copied FIELD BY FIELD from `PricingResponse` in the
 * deployed OpenAPI document. If it drifts again, `npm run contract` is the
 * thing that should catch it - it compares every call site's path now, reads
 * included.
 */

const pricing = (over: Partial<Pricing> = {}): Pricing => ({
  pricingModel: "per_student",
  pricingPlan: "annual",
  accessWindow: "year_round",
  studentCount: 340,
  perStudentRate: "150000.00",
  rateType: "standard",
  rateLockedUntil: null,
  totalBeforeVat: "51000000.00",
  vatRate: "7.5",
  vatAmount: "3825000.00",
  totalWithVat: "54825000.00",
  currency: "NGN",
  ...over,
});

describe("CostSheet", () => {
  it("shows the total the SERVER computed, not one of its own", () => {
    /*
     * The load-bearing test. These numbers deliberately do not add up:
     * 2 x 100 is 200, not 999. If any arithmetic creeps back into this
     * component it will render its own answer here instead of the server's,
     * and this fails.
     *
     * It matters because the backend computes against the school's actual
     * contract - an exemption, a grandfathered rate, a rate change - and the
     * client used to recompute it from a hard-coded Nigerian 7.5%.
     */
    const { container } = render(
      <CostSheet
        pricing={pricing({
          studentCount: 2,
          perStudentRate: "100.00",
          totalBeforeVat: "998.00",
          vatAmount: "1.00",
          totalWithVat: "999.00",
        })}
      />,
    );
    const t = visibleText(container);
    expect(t).toMatch(/₦999\b/);
    expect(t).toMatch(/₦998\b/);
    expect(t).not.toMatch(/₦200\b/);
    expect(t).not.toMatch(/₦215\b/); // 200 + 7.5%
  });

  it("shows the working, in the school's own currency", () => {
    const t = visibleText(render(<CostSheet pricing={pricing()} />).container);
    expect(t).toMatch(/₦54,825,000/);
    expect(t).toMatch(/340 active students × ₦150,000 per student/);
    expect(t).toMatch(/₦51,000,000/);
    expect(t).toMatch(/₦3,825,000/);
  });

  it("does not put a naira sign on a school billed in pounds", () => {
    const t = visibleText(
      render(<CostSheet pricing={pricing({ currency: "GBP" })} />).container,
    );
    expect(t).toMatch(/£54,825,000/);
    expect(t).not.toMatch(/₦/);
  });

  it("states the VAT amount and never a rate of its own", () => {
    // "7.5" and "0.075" are the same rate and differ a hundredfold on screen,
    // and the contract types the field as a bare string - so the rate is not
    // printed at all until that is settled. The amount is unambiguous.
    const t = visibleText(
      render(<CostSheet pricing={pricing({ vatRate: "0.075" })} />).container,
    );
    expect(t).toMatch(/VAT ₦3,825,000/);
    expect(t).not.toMatch(/7\.5%/);
    expect(t).not.toMatch(/0\.075/);
  });

  it("does not call a per-term fee annual", () => {
    const t = visibleText(
      render(
        <CostSheet
          pricing={pricing({
            pricingPlan: "per_term",
            accessWindow: "school_session",
          })}
        />,
      ).container,
    );
    expect(t).toMatch(/Your cost per term/);
    expect(t).toMatch(/per term/);
    expect(t).not.toMatch(/annual cost/i);
    expect(t).not.toMatch(/per year/);
    // The schema calls this "a fact the cost sheet has to state" - a per-term
    // school is not buying the holidays.
    expect(t).toMatch(/not the breaks between terms/i);
  });

  it("names a founding-partner rate and how long it is held", () => {
    const t = visibleText(
      render(
        <CostSheet
          pricing={pricing({
            rateType: "founding_partner",
            rateLockedUntil: "2027-08-31T00:00:00Z",
          })}
        />,
      ).container,
    );
    expect(t).toMatch(/founding-partner rate/i);
    expect(t).toMatch(/31 August 2027/);
  });

  it("does not tell a school its rate was never set when a figure is missing", () => {
    /*
     * The exact sentence this screen used to show EVERY school: "Your
     * per-student rate isn't set yet, so there's no total to show." That is a
     * claim about their contract, made on the strength of a field name.
     */
    const t = visibleText(
      render(<CostSheet pricing={pricing({ totalWithVat: "" })} />).container,
    );
    expect(t).toMatch(/340 active students/);
    expect(t).toMatch(/couldn't read your total/i);
    expect(t).not.toMatch(/rate isn't set/i);
    expect(t).not.toMatch(/₦/);
  });
});
