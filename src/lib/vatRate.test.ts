import { describe, expect, it } from "vitest";
import { formatVatRate } from "./money";

/**
 * The question that came round twice: percentage or fraction?
 *
 * Settled 15 Sep — `vatRate` is a PERCENTAGE. Nigeria's 7.5% arrives as
 * "7.50". These pin the answer so it cannot be re-litigated by a future edit,
 * and pin the refusals: a rate we cannot read is no rate, never a guess. A
 * wrong tax rate on a school's invoice is not a rounding error.
 */
describe("formatVatRate", () => {
  it("renders the contract's own example", () => {
    expect(formatVatRate("7.50")).toBe("7.5%");
  });

  it("trims as text, never by parsing to a float", () => {
    expect(formatVatRate("7.00")).toBe("7%");
    expect(formatVatRate("7")).toBe("7%");
    expect(formatVatRate("0.075")).toBe("0.075%");
  });

  it("does NOT multiply — a fraction stays the figure it was sent as", () => {
    // If this ever reads "7.5%", someone has started doing arithmetic on a
    // school's tax rate on the strength of a guess about its units.
    expect(formatVatRate("0.075")).not.toBe("7.5%");
  });

  it("is null for an invoice that carries no rate", () => {
    // Nullable AND omissible on InvoiceResponse: invoices issued before the
    // field existed have no rate recorded, and must not borrow today's.
    expect(formatVatRate(null)).toBeNull();
    expect(formatVatRate(undefined)).toBeNull();
    expect(formatVatRate("")).toBeNull();
  });

  it("is null for anything that is not a number", () => {
    expect(formatVatRate("seven and a half")).toBeNull();
    expect(formatVatRate("7.5%")).toBeNull();
    expect(formatVatRate("-7.5")).toBeNull();
  });
});
