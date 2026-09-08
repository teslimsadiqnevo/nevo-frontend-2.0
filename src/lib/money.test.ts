import { describe, expect, it } from "vitest";
import { formatMoney, isAmount, NO_AMOUNT } from "./money";

/**
 * The two faults this replaced, pinned so neither comes back:
 *   1. a naira sign on every figure regardless of the invoice's own currency;
 *   2. truncation, which always understates and broke the cost sheet's sum.
 */

describe("formatMoney", () => {
  it("uses the currency it is given, not naira", () => {
    expect(formatMoney("54825", "NGN")).toBe("₦54,825");
    expect(formatMoney("54825", "GBP")).toBe("£54,825");
    expect(formatMoney("54825", "USD")).toBe("$54,825");
  });

  it("stamps no symbol at all when the currency is unknown", () => {
    // Inventing one here is exactly the bug. A bare number is honest.
    expect(formatMoney("54825", null)).toBe("54,825");
    expect(formatMoney("54825", undefined)).toBe("54,825");
  });

  it("groups in threes", () => {
    expect(formatMoney("1", "NGN")).toBe("₦1");
    expect(formatMoney("999", "NGN")).toBe("₦999");
    expect(formatMoney("1000", "NGN")).toBe("₦1,000");
    expect(formatMoney("54825000", "NGN")).toBe("₦54,825,000");
  });

  it("rounds the fraction instead of cutting it off", () => {
    // The old code did `amount.split(".")[0]`, so every one of these lost money.
    expect(formatMoney("0.75", "NGN")).toBe("₦0.75");
    expect(formatMoney("1234.56", "NGN")).toBe("₦1,234.56");
    expect(formatMoney("1234.567", "NGN")).toBe("₦1,234.57");
    expect(formatMoney("0.004", "NGN")).toBe("₦0");
  });

  it("hides a fraction that says nothing", () => {
    expect(formatMoney("54825.00", "NGN")).toBe("₦54,825");
    expect(formatMoney("54825.0", "NGN")).toBe("₦54,825");
  });

  it("carries into the next unit rather than dropping the rounding", () => {
    expect(formatMoney("1234.999", "NGN")).toBe("₦1,235");
    expect(formatMoney("999.999", "NGN")).toBe("₦1,000");
    // Past the point a float would start lying about the digits.
    expect(formatMoney("9007199254740993.999", "NGN")).toBe(
      "₦9,007,199,254,740,994",
    );
  });

  it("accepts every shape the contract's own pattern permits", () => {
    // `^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$` - the old two-decimal parser rejected
    // all four of these, and a rejected rate was shown to the school as "your
    // rate isn't set yet".
    expect(formatMoney("150000.000", "NGN")).toBe("₦150,000");
    expect(formatMoney(".5", "NGN")).toBe("₦0.50");
    expect(formatMoney("+150000.00", "NGN")).toBe("₦150,000");
    expect(formatMoney("0150000", "NGN")).toBe("₦150,000");
  });

  it("keeps a negative sign, which a credit note needs", () => {
    expect(formatMoney("-1500", "NGN")).toBe("-₦1,500");
  });

  it("says nothing rather than zero when there is no figure", () => {
    expect(formatMoney(null, "NGN")).toBe(NO_AMOUNT);
    expect(formatMoney(undefined, "NGN")).toBe(NO_AMOUNT);
    expect(formatMoney("", "NGN")).toBe(NO_AMOUNT);
    expect(formatMoney("not a number", "NGN")).toBe(NO_AMOUNT);
    expect(formatMoney(".", "NGN")).toBe(NO_AMOUNT);
  });

  it("adds up, which is the whole point of the cost sheet", () => {
    // The card shows its working. Before, 1,234.56 + 92.59 rendered as
    // "1,234" and "92" against a total of "1,327".
    const before = "1234.56";
    const vat = "92.59";
    const total = "1327.15";
    expect(formatMoney(before, "NGN")).toBe("₦1,234.56");
    expect(formatMoney(vat, "NGN")).toBe("₦92.59");
    expect(formatMoney(total, "NGN")).toBe("₦1,327.15");
  });
});

describe("isAmount", () => {
  it("separates a figure from the absence of one", () => {
    expect(isAmount("0")).toBe(true);
    expect(isAmount("0.00")).toBe(true);
    expect(isAmount(null)).toBe(false);
    expect(isAmount("")).toBe(false);
    expect(isAmount("TBC")).toBe(false);
  });
});
