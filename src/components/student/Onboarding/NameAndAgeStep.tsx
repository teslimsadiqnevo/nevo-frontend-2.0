"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OnboardingShell } from "./OnboardingShell";
import { AgeStepper, isAgeInRange } from "./AgeStepper";

const NEXT_STEP = "/student/onboarding/school";

/**
 * Onboarding Step 1 — Name & Age (UI/UX spec B.2 Step 1). Captures the minimum
 * identity to create the account. Continue stays muted until both fields are
 * valid. Conversational headings, no clinical form labels.
 */
export function NameAndAgeStep() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ageText, setAgeText] = useState("");

  const valid = name.trim().length > 0 && isAgeInRange(ageText);

  const submit = () => {
    // TODO: persist name/age to onboarding state before advancing.
    if (valid) router.push(NEXT_STEP);
  };

  return (
    <OnboardingShell step={1} backHref="/student/onboarding">
      <div className="flex justify-center">
        <Image
          src="/illustrations/onboarding-name.png"
          alt="A friendly figure waving hello"
          width={500}
          height={611}
          priority
          className="mt-1 w-[104px] sm:mt-6 sm:w-[138px] lg:mt-4 lg:w-40"
        />
      </div>

      <h2 className="mt-5 text-[23px] font-medium leading-[1.25] tracking-[-0.01em] text-nevo-near-black sm:mt-8 sm:text-[26px] lg:mt-7">
        What should we call you?
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="off"
          aria-label="Your name"
          className="mt-6 h-13 rounded-[10px] border-[1.5px] border-nevo-near-black/[0.16] bg-nevo-cream px-4 text-base text-nevo-near-black shadow-[0_2px_8px_rgba(0,0,0,0.06)] placeholder:text-nevo-near-black/40 focus-visible:border-nevo-navy focus-visible:ring-[3px] focus-visible:ring-nevo-navy/[0.18]"
        />

        <p className="mt-8 text-[17px] font-medium text-nevo-near-black sm:text-lg">
          How old are you?
        </p>

        <div className="mt-4">
          <AgeStepper value={ageText} onChange={setAgeText} />
        </div>

        <Button
          type="submit"
          disabled={!valid}
          className="mt-8 h-13 w-full rounded-[10px] bg-nevo-navy text-base font-medium text-nevo-cream hover:bg-nevo-navy hover:brightness-[0.93] active:brightness-[0.86] disabled:opacity-40"
        >
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
