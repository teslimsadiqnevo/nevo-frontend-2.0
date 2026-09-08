"use client";

import type { PricingCurrency, Subscription } from "@/lib/api/billing";
import { cn } from "@/lib/utils";

/**
 * D11's cost sheet - what the school pays, and how it is arrived at.
 *
 * This was the one thing on the billing screen that could not be built. D11 said
 * per-student, the API said tiers, and rendering either would have stated a
 * school's annual bill on the strength of a disagreement. That is settled: the
 * contract now carries `pricingModel` as a CONST `"per_student"`, alongside the
 * three numbers the sum actually needs.
 *
 * COMPUTED FROM THE BILLED NUMBERS, not from anything nearby.
 * `activeStudentCount` is the count the school is billed on - deliberately not
 * `invitedStudents`, and not `studentsProfiled`, both of which are different
 * populations and are why this sum used to be guessable and wrong.
 *
 * MONEY IS STRING ARITHMETIC. `perStudentAnnualRate` arrives as a decimal
 * string, and totals are computed in minor units with integers. A float would
 * be fine at these magnitudes right up until it was not, and this is a figure a
 * school pays.
 *
 * VAT IS NIGERIAN, AND SO IS ONLY APPLIED TO NAIRA. D11's 7.5% is Nigeria's
 * rate; `currency` is an enum of USD, NGN and GBP, and no VAT rate is carried
 * for the other two. So a non-naira school sees the subtotal and is told the
 * tax line is not computed here, rather than being shown a Nigerian rate on a
 * dollar invoice.
 */

/** D11's rate. Nigerian VAT, hence the naira-only application below. */
const NG_VAT_PERCENT = 7.5;

const SYMBOL: Record<PricingCurrency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
};

/** A decimal string to integer minor units. Returns null on anything odd. */
function toMinor(decimal: string): number | null {
  const m = /^\s*(\d+)(?:\.(\d{1,2}))?\s*$/.exec(decimal);
  if (!m) return null;
  const [, whole, frac = ""] = m;
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

function fromMinor(minor: number, currency: PricingCurrency): string {
  const whole = Math.trunc(minor / 100);
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${SYMBOL[currency]}${grouped}`;
}

export interface CostBreakdown {
  count: number;
  rate: string;
  subtotalMinor: number;
  vatMinor: number | null;
  totalMinor: number;
  currency: PricingCurrency;
}

/** Null when the rate is missing or unparseable - no rate, no cost sheet. */
export function computeCost(sub: Subscription): CostBreakdown | null {
  if (!sub.perStudentAnnualRate) return null;
  const rateMinor = toMinor(sub.perStudentAnnualRate);
  if (rateMinor === null) return null;

  const subtotalMinor = rateMinor * sub.activeStudentCount;
  const vatMinor =
    sub.currency === "NGN"
      ? Math.round((subtotalMinor * NG_VAT_PERCENT) / 100)
      : null;
  return {
    count: sub.activeStudentCount,
    rate: sub.perStudentAnnualRate,
    subtotalMinor,
    vatMinor,
    totalMinor: subtotalMinor + (vatMinor ?? 0),
    currency: sub.currency,
  };
}

const CARD = "rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]";
const ROW = "flex items-baseline justify-between gap-4 py-2.5";

export function CostSheet({ subscription }: { subscription: Subscription }) {
  const cost = computeCost(subscription);

  return (
    <>
      <h2 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
        Your annual cost
      </h2>
      <div className={cn(CARD, "mt-3 px-6 py-[22px]")}>
        {cost ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <span className="text-[34px] leading-none font-semibold text-nevo-near-black tabular-nums">
                {fromMinor(cost.totalMinor, cost.currency)}
              </span>
              <span className="text-[13.5px] text-nevo-near-black/58">
                per year
              </span>
            </div>

            <div className="mt-4 divide-y divide-nevo-near-black/7 border-t border-nevo-near-black/7">
              <div className={ROW}>
                <span className="text-[14px] text-nevo-near-black/72">
                  {cost.count} active {cost.count === 1 ? "student" : "students"}{" "}
                  &times; {fromMinor(toMinor(cost.rate) ?? 0, cost.currency)} per
                  student
                </span>
                <span className="text-[14px] font-semibold text-nevo-near-black tabular-nums">
                  {fromMinor(cost.subtotalMinor, cost.currency)}
                </span>
              </div>
              {cost.vatMinor !== null ? (
                <div className={ROW}>
                  <span className="text-[14px] text-nevo-near-black/72">
                    VAT at {NG_VAT_PERCENT}%
                  </span>
                  <span className="text-[14px] font-semibold text-nevo-near-black tabular-nums">
                    {fromMinor(cost.vatMinor, cost.currency)}
                  </span>
                </div>
              ) : (
                <div className={ROW}>
                  <span className="text-[13.5px] text-nevo-near-black/62">
                    Tax isn&rsquo;t calculated here for {cost.currency}.
                  </span>
                </div>
              )}
            </div>

            <p className="m-0 mt-4 text-[13px] leading-[1.6] text-nevo-near-black/62">
              This is your active student count times the per-student rate. If
              your roster grows, the count and the total move with it.
            </p>
          </>
        ) : (
          /* A count without a rate is not a cost. Show what is known. */
          <>
            <p className="m-0 text-[15px] font-semibold text-nevo-near-black">
              {subscription.activeStudentCount} active{" "}
              {subscription.activeStudentCount === 1 ? "student" : "students"}
            </p>
            <p className="m-0 mt-1.5 text-[13.5px] leading-[1.55] text-nevo-near-black/62">
              Your per-student rate isn&rsquo;t set yet, so there&rsquo;s no
              total to show. Your invoices carry the amount in the meantime.
            </p>
          </>
        )}
      </div>
    </>
  );
}
