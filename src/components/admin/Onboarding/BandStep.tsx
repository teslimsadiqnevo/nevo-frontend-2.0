"use client";

import { useState } from "react";
import { schoolApi, type EnrolmentBand } from "@/lib/api/school";
import { cn } from "@/lib/utils";
import { Spinner } from "../Roster/primitives";
import { StepHeading, WIZARD_PRIMARY, WIZARD_SECONDARY } from "./OnboardingWizard";

/**
 * D1.4 Enrolment band.
 *
 * Framed as A DESCRIPTION OF THE SCHOOL, not as a price tier - the difference
 * matters, because the previous step just told this proprietor something was
 * permanent and this one is not. The reassurance below the cards says so
 * explicitly, for exactly that reason.
 *
 * ============================================================================
 * THE FRAME AND THE SPEC DISAGREE ABOUT THIS STEP, AND SO DOES BILLING.
 *
 * D1's frame draws step 4 as "Here's your annual cost" - a flat ₦150,000 per
 * student per year, "no tiers, no plan to choose", with a computed total and
 * VAT, over a roster of 340 students.
 *
 * SCRUM-39 draws step 4 as this: four enrolment bands, explicitly "not a price
 * tier", setting the seat count later surfaces count against.
 *
 * The deployed billing API agrees with the SPEC: `GET /api/billing/subscription`
 * returns `subscriptionTier` and `studentCountBand`, and the band names below
 * are the enum's own.
 *
 * Two of three say bands, and one of those two is the backend, so bands ship.
 * The per-student pricing screen is the same unresolved D11-vs-SCRUM-98
 * question that has blocked Billing since this campaign began - it needs a
 * product decision, not a build.
 *
 * There is also a practical objection to the frame's version: it shows "340
 * students loaded from your roster", and at onboarding there is no roster.
 * Nobody has been enrolled yet. The band is asked precisely BECAUSE the count
 * is not knowable at this point.
 * ============================================================================
 *
 * TODO(api): no band field. Written to `profile.onboarding.band` with the
 * other two provisional keys - see `lib/api/school.ts`.
 */

/**
 * The single band taxonomy. The Specialised-Small / Mid-Sized Premium /
 * Mega-Campus shorthand is retired and must not reappear in any payload, enum
 * or label. En dash inside the numeric ranges is correct.
 */
const BANDS: {
  value: EnrolmentBand;
  name: string;
  range: string;
  desc: string;
  /** Hardcoded v1 defaults; no purchase flow exists here. */
  adminSeats: number;
}[] = [
  {
    value: "boutique",
    name: "Boutique",
    range: "up to 250 students",
    desc: "A single site, one leadership team, everyone knows everyone.",
    adminSeats: 5,
  },
  {
    value: "mid_market",
    name: "Mid-Market",
    range: "251–500 students",
    desc: "Established, with heads of year or department alongside leadership.",
    adminSeats: 10,
  },
  {
    value: "premium",
    name: "Premium",
    range: "501–800 students",
    desc: "Large, usually with a dedicated bursar and IT support.",
    adminSeats: 15,
  },
  {
    value: "enterprise",
    name: "Enterprise",
    range: "801+ students",
    desc: "Multi-site or very large, with several administrative teams.",
    adminSeats: 25,
  },
];

type Phase = "idle" | "saving" | "failed";

export function BandStep({
  selected,
  onSelect,
  onBack,
  onDone,
}: {
  selected: EnrolmentBand | null;
  onSelect: (value: EnrolmentBand) => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const chosen = BANDS.find((b) => b.value === selected);

  const save = () => {
    if (!selected) return;
    setPhase("saving");
    schoolApi
      .saveOnboarding({ band: selected })
      .then(() => onDone())
      .catch(() => setPhase("failed"));
  };

  return (
    <>
      <StepHeading
        title="How big is your school?"
        sub="It sets your seat count and what you'll be billed for. You can move bands whenever your numbers change."
      />

      <div className="mt-8 flex flex-col gap-3">
        {BANDS.map((b) => {
          const on = selected === b.value;
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => onSelect(b.value)}
              aria-pressed={on}
              className={cn(
                "w-full cursor-pointer rounded-xl bg-nevo-cream-elevated px-5 py-5 text-left transition-colors",
                on
                  ? "border-2 border-nevo-navy bg-nevo-navy/[0.06]"
                  : "border border-nevo-near-black/10",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="text-base font-semibold text-nevo-near-black">
                  {b.name}
                </span>
                <span className="text-[13.5px] font-semibold text-nevo-navy">
                  {b.range}
                </span>
              </div>
              <p className="m-0 mt-1 text-sm leading-[1.5] text-nevo-near-black/70">
                {b.desc}
              </p>
            </button>
          );
        })}
      </div>

      {chosen ? (
        <p className="mt-4 text-[13.5px] leading-[1.55] text-nevo-near-black/60">
          {chosen.name} comes with {chosen.adminSeats} admin seats. You&rsquo;re
          using one of them.
        </p>
      ) : null}

      {/* Said plainly, because 1.2 just told them something is permanent. */}
      <p className="mt-3 text-[13.5px] leading-[1.55] text-nevo-near-black/60">
        Unlike how everyone signs in, this one is easy to change later.
      </p>

      {phase === "failed" ? (
        <p className="mt-5 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3.5 text-[13.5px] leading-[1.55] text-nevo-navy">
          That didn&rsquo;t save. We&rsquo;re on it - your choice is still here.
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={save}
          disabled={!selected || phase === "saving"}
          className={WIZARD_PRIMARY}
        >
          {phase === "saving" ? (
            <span className="inline-flex items-center justify-center gap-2.5">
              <Spinner />
              Saving…
            </span>
          ) : (
            "Continue"
          )}
        </button>
        <button type="button" onClick={onBack} className={WIZARD_SECONDARY}>
          Back
        </button>
      </div>
    </>
  );
}
