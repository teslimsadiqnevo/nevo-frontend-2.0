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

/**
 * "7.5%" from the decimal string the contract sends, or null when there isn't one.
 *
 * SETTLED 15 SEP, after the question came round twice. `vatRate` is a
 * PERCENTAGE, not a fraction: Nigeria's 7.5% arrives as "7.50". The schema now
 * documents it with an example, so nobody has to ask again - and this function
 * exists so that the answer lives in ONE place rather than at each render site.
 *
 * NO ARITHMETIC. Trailing zeros are trimmed as text, never by parsing to a
 * float and formatting back: "7.50" -> "7.5", "7.00" -> "7". A rate is a
 * figure on a school's invoice and this file does not do sums on those.
 *
 * Null for absent, null, or anything that is not a number - `vatRate` is
 * nullable AND omissible on `InvoiceResponse`, because invoices issued before
 * the field existed genuinely have no rate recorded. Those show the amount
 * with no rate rather than borrowing today's.
 */
export function formatVatRate(rate: string | null | undefined): string | null {
  if (typeof rate !== "string") return null;
  const trimmed = rate.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const tidy = trimmed.includes(".")
    ? trimmed.replace(/0+$/, "").replace(/\.$/, "")
    : trimmed;
  return `${tidy}%`;
}


/**
 * Add decimal strings exactly, or return null.
 *
 * THE FILE'S OWN RULE, HONOURED: "Money, from the API's decimal STRINGS -
 * never through a float." D11.8 needs one total - "Two invoices are
 * outstanding, totalling ₦161,250,000" - and `Number(a) + Number(b)` on
 * figures of that size is how a bursar reconciling against their own ledger
 * finds a penny that is not there.
 *
 * Scaled to the longest fraction present and summed as BigInt, so the result
 * is exact whatever the server's decimal places. One unreadable amount makes
 * the whole total null: a sum that silently skipped a row would understate
 * what a school owes, which is worse than showing no total at all.
 */
export function sumMoney(
  amounts: (string | null | undefined)[],
): string | null {
  const parts: { negative: boolean; digits: string }[] = [];
  let scale = 0;
  const parsed: { negative: boolean; whole: string; frac: string }[] = [];

  for (const raw of amounts) {
    if (raw == null || raw === "") return null;
    const m = /^\s*([+-]?)(\d*)(?:\.(\d*))?\s*$/.exec(raw);
    if (!m) return null;
    const [, sign, whole = "", frac = ""] = m;
    if (whole === "" && frac === "") return null;
    parsed.push({ negative: sign === "-", whole: whole || "0", frac });
    if (frac.length > scale) scale = frac.length;
  }
  if (parsed.length === 0) return null;

  for (const p of parsed) {
    parts.push({
      negative: p.negative,
      digits: p.whole + p.frac + "0".repeat(scale - p.frac.length),
    });
  }

  let total = parts[0];
  for (let i = 1; i < parts.length; i++) {
    total =
      total.negative === parts[i].negative
        ? { negative: total.negative, digits: addDigits(total.digits, parts[i].digits) }
        : subtractSigned(total, parts[i]);
  }

  const digits = total.digits.padStart(scale + 1, "0");
  const whole = trimLeadingZeros(digits.slice(0, digits.length - scale));
  const frac = scale > 0 ? digits.slice(digits.length - scale) : "";
  const zero = /^0*$/.test(whole) && /^0*$/.test(frac);
  return `${total.negative && !zero ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

function trimLeadingZeros(d: string): string {
  return d.replace(/^0+(?=\d)/, "") || "0";
}

/** a + b, both non-negative digit strings of any length. */
function addDigits(a: string, b: string): string {
  const len = Math.max(a.length, b.length);
  const x = a.padStart(len, "0");
  const y = b.padStart(len, "0");
  let carried = 0;
  let out = "";
  for (let i = len - 1; i >= 0; i--) {
    const sum = Number(x[i]) + Number(y[i]) + carried;
    out = String(sum % 10) + out;
    carried = sum >= 10 ? 1 : 0;
  }
  return carried ? `1${out}` : out;
}

/** a - b where a >= b, both non-negative digit strings. */
function subDigits(a: string, b: string): string {
  const len = Math.max(a.length, b.length);
  const x = a.padStart(len, "0").split("");
  const y = b.padStart(len, "0");
  let out = "";
  let borrow = 0;
  for (let i = len - 1; i >= 0; i--) {
    let d = Number(x[i]) - Number(y[i]) - borrow;
    borrow = d < 0 ? 1 : 0;
    if (d < 0) d += 10;
    out = String(d) + out;
  }
  return out;
}

/** Which of two non-negative digit strings is larger. */
function cmpDigits(a: string, b: string): number {
  const len = Math.max(a.length, b.length);
  const x = a.padStart(len, "0");
  const y = b.padStart(len, "0");
  return x < y ? -1 : x > y ? 1 : 0;
}

function subtractSigned(
  total: { negative: boolean; digits: string },
  next: { negative: boolean; digits: string },
): { negative: boolean; digits: string } {
  const order = cmpDigits(total.digits, next.digits);
  if (order === 0) return { negative: false, digits: "0" };
  return order > 0
    ? { negative: total.negative, digits: subDigits(total.digits, next.digits) }
    : { negative: next.negative, digits: subDigits(next.digits, total.digits) };
}
