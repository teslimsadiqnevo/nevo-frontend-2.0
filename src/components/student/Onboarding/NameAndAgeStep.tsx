"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  IllustrationWrapper,
  Input,
  NevoKeyboard,
  useNevoKeyboardDock,
} from "@/components/shared";
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
  // A.12: the Nevo Keyboard opens while the name field is focused (touch); a
  // hardware keyboard still types on desktop, where the on-screen one is hidden.
  const kb = useNevoKeyboardDock();

  const valid = name.trim().length > 0 && isAgeInRange(ageText);

  const submit = () => {
    // TODO: persist name/age to onboarding state before advancing.
    if (valid) router.push(NEXT_STEP);
  };

  return (
    <OnboardingShell step={1} backHref="/student/onboarding">
      <div className="flex justify-center">
        <IllustrationWrapper
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
          onFocus={kb.onFocus}
          onBlur={kb.onBlur}
          inputMode="none"
          placeholder="Your name"
          autoComplete="off"
          aria-label="Your name"
          className="mt-6"
        />

        <p className="mt-8 text-[17px] font-medium text-nevo-near-black sm:text-lg">
          How old are you?
        </p>

        <div className="mt-4">
          <AgeStepper value={ageText} onChange={setAgeText} />
        </div>

        <Button type="submit" disabled={!valid} className="mt-8 w-full">
          Continue
        </Button>
      </form>

      {kb.open && (
        <NevoKeyboard
          layout="qwerty"
          onKey={(c) => setName((n) => n + c)}
          onBackspace={() => setName((n) => n.slice(0, -1))}
          onReturn={submit}
          className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        />
      )}
    </OnboardingShell>
  );
}
