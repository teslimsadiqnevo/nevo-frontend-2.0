import type { PricingCurrency } from "@/lib/api/billing";

/**
 * Money, from the API's decimal STRINGS - never through a float.
 *
 * ============================================================================
 * THIS EXISTS BECAUSE THREE PLACES WERE DOING IT DIFFERENTLY AND TWO WERE WRONG.
 *
 * `BillingView` had a `naira()` that stamped a NAIRA SIGN on every figure it
 * touched - the invoice list, the next charge, and the amount handed to the
 * transfer panel - while the deployed contract carries a required `currency` on
 * every invoice and `PricingCurrency` has three values. A school billed in
 * pounds read its own invoice history in the wrong currency, and "How to pay"
 * told it to transfer naira.
 *
 * Both `naira()` and the cost sheet's `fromMinor()` also TRUNCATED to whole
 * major units. That always understates, never rounds, and it broke the one
 * thing the cost sheet is for: a subtotal of 1,234.56 and VAT of 92.59 rendered
 * as 1,234 and 92 against a stated total of 1,327 - working that does not add
 * up, on the screen whose whole job is to justify a bill.
 * ============================================================================
 *
 * The fraction is shown when there is one and hidden when there is not, so
 * whole-naira invoices stay clean and kobo never silently vanish.
 */

export const CURRENCY_SYMBOL: Record<PricingCurrency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
};

/** What a figure reads as when we do not have one. Never a zero. */
export const NO_AMOUNT = "—";

/** Add one to a decimal string, without going through a number. */
function carry(whole: string): string {
  const d = whole.split("");
  for (let i = d.length - 1; i >= 0; i--) {
    if (d[i] === "9") {
      d[i] = "0";
      continue;
    }
    d[i] = String(Number(d[i]) + 1);
    return d.join("");
  }
  return `1${d.join("")}`;
}

/**
 * Group the integer part in threes and keep a meaningful fraction.
 *
 * The contract's own pattern for a rate is
 * `^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$` - any number of decimal places, an optional
 * sign, and a bare `.5` are all legal - so this parses what the SERVER may
 * send, not what we happen to expect. The cost sheet's old two-decimal regex
 * rejected `"150000.000"`, and a rejected rate was rendered to the school as
 * "your rate isn't set yet", which is a statement about their contract rather
 * than about our parser.
 */
export function formatMoney(
  amount: string | null | undefined,
  currency: PricingCurrency | null | undefined,
): string {
  if (amount == null || amount === "") return NO_AMOUNT;

  const m = /^\s*([+-]?)(\d*)(?:\.(\d*))?\s*$/.exec(amount);
  if (!m) return NO_AMOUNT;
  const [, sign, wholeRaw = "", fracRaw = ""] = m;
  if (wholeRaw === "" && fracRaw === "") return NO_AMOUNT;

  const whole = (wholeRaw.replace(/^0+(?=\d)/, "") || "0").replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

  // Two places, rounded rather than cut - but only shown when they say
  // something. Trailing zeros on a whole-naira invoice are noise.
  let frac = "";
  if (fracRaw) {
    const rounded = Math.round(Number(`0.${fracRaw}`) * 100);
    if (rounded >= 100) {
      // `.999` rounds INTO the next major unit. Rare, and silently dropping it
      // would be the same understatement this function exists to stop. Carried
      // on the DIGITS, because these strings can outgrow a float and a school's
      // total is the last place to find that out.
      return formatMoney(`${sign}${carry(wholeRaw || "0")}`, currency);
    }
    if (rounded > 0) frac = `.${String(rounded).padStart(2, "0")}`;
  }

  const symbol = currency ? CURRENCY_SYMBOL[currency] : "";
  return `${sign === "-" ? "-" : ""}${symbol}${whole}${frac}`;
}

/** True when the string is a number we can show. Absence is not zero. */
export function isAmount(amount: string | null | undefined): boolean {
  return formatMoney(amount, "NGN") !== NO_AMOUNT;
}
