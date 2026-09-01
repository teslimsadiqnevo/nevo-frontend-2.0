"use client";

import { useState } from "react";
import type { EnrolmentBand, SchoolAuthMethod } from "@/lib/api/school";
import { cn } from "@/lib/utils";
import { AuthMethodStep } from "./AuthMethodStep";
import { BandStep } from "./BandStep";
import { DpaStep } from "./DpaStep";
import { HandoverStep } from "./HandoverStep";
import { SignUpStep } from "./SignUpStep";

/**
 * D1 School Onboarding (SCRUM-39) - the most consequential setup flow in the
 * product. Every downstream student and teacher screen depends on what happens
 * here.
 *
 * A calm single-column wizard with NO SIDEBAR: the workspace does not exist
 * until this completes, so there is nothing to navigate. There is also no
 * back-out to a marketing site - once a proprietor starts, the only way is
 * through or away.
 *
 * FIVE STEPS OR SIX? The D1 frame draws "Step 1 of 5"; SCRUM-39 says "Six
 * short steps" and specifies a row of six pills. The spec enumerates D1.1
 * through D1.5 as five distinct SCREENS, with 1.5 having two variants - so the
 * sixth pill is the workspace itself, arriving. Five steps are built, and the
 * indicator shows five. Raised with design; it is a one-line change either way.
 *
 * FAILURE IS A RECOVERY MOMENT throughout: no red, no alarm glyph, no blame.
 * The system owns the fault, the work so far is preserved AND SAID to be
 * preserved, and there is always a forward path plus a quiet secondary.
 *
 * Written for a proprietor, not an IT specialist.
 */

export type Step = 0 | 1 | 2 | 3 | 4;

export interface WizardState {
  schoolName: string;
  adminName: string;
  email: string;
  authMethod: SchoolAuthMethod | null;
  band: EnrolmentBand | null;
}

const TOTAL = 5;

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>(0);
  const [state, setState] = useState<WizardState>({
    schoolName: "",
    adminName: "",
    email: "",
    authMethod: null,
    band: null,
  });

  const patch = (p: Partial<WizardState>) => setState((s) => ({ ...s, ...p }));

  return (
    <main className="flex min-h-dvh flex-col items-center bg-nevo-cream px-6 py-16 lg:justify-center lg:py-12">
      <div className="w-full max-w-[520px]">
        {/* Position is the only signal - no numbers, no labels. */}
        <div className="mb-9 flex gap-2" aria-hidden="true">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-nevo-navy" : "bg-nevo-navy/16",
              )}
            />
          ))}
        </div>
        <p className="sr-only" role="status">
          Step {step + 1} of {TOTAL}
        </p>

        {step === 0 ? (
          <SignUpStep
            state={state}
            onChange={patch}
            onDone={() => setStep(1)}
          />
        ) : null}

        {step === 1 ? (
          <AuthMethodStep
            selected={state.authMethod}
            onSelect={(authMethod) => patch({ authMethod })}
            onBack={() => setStep(0)}
            onDone={() => setStep(2)}
          />
        ) : null}

        {step === 2 ? (
          <DpaStep
            schoolName={state.schoolName}
            onBack={() => setStep(1)}
            onDone={() => setStep(3)}
          />
        ) : null}

        {step === 3 ? (
          <BandStep
            selected={state.band}
            onSelect={(band) => patch({ band })}
            onBack={() => setStep(2)}
            onDone={() => setStep(4)}
          />
        ) : null}

        {step === 4 ? <HandoverStep state={state} /> : null}
      </div>
    </main>
  );
}

/* ------------------------------------------------------- shared step chrome */

export function StepHeading({
  title,
  sub,
}: {
  title: string;
  sub: string;
}) {
  return (
    <>
      <h1 className="m-0 text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-nevo-near-black">
        {title}
      </h1>
      <p className="mt-2.5 text-[15px] leading-[1.6] text-nevo-near-black/62">{sub}</p>
    </>
  );
}

/** Full-width navy primary. Disabled is muted, never removed from the page. */
export const WIZARD_PRIMARY =
  "w-full cursor-pointer rounded-[10px] bg-nevo-navy px-5 py-[15px] text-[15.5px] font-semibold text-nevo-cream transition-[filter] hover:brightness-110 disabled:cursor-default disabled:bg-nevo-navy/28 disabled:text-nevo-cream/60 disabled:hover:brightness-100";

export const WIZARD_SECONDARY =
  "w-full cursor-pointer rounded-[10px] px-5 py-[15px] text-[15.5px] font-semibold text-nevo-near-black/70 transition-colors hover:bg-nevo-near-black/[0.05]";

export const FIELD_LABEL =
  "mb-2 block text-[13px] font-medium text-nevo-near-black/62";

export const FIELD =
  "w-full rounded-[10px] border border-nevo-near-black/12 bg-nevo-cream-elevated px-4 py-3.5 text-[15.5px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy";

export const FIELD_HELP = "mt-2 text-[12.5px] leading-[1.5] text-nevo-near-black/50";

/**
 * A field-level correction. On blur only, under the field, navy - no icon and
 * no red. The wording describes what is NEEDED, never what was wrong.
 */
export function FieldNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-[12.5px] leading-[1.5] text-nevo-navy">{children}</p>
  );
}
