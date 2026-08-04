"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, IllustrationWrapper } from "@/components/shared";
import { BUSY_PHASE, BUSY_REASON, SIGNAL_EVENT_TYPES } from "@/lib/constants";
import { useSignals } from "@/hooks";
import { randomId } from "@/lib/utils";
import { OnboardingShell } from "./OnboardingShell";
import { SchoolCodeInput, type CodeStatus } from "./SchoolCodeInput";

const NEXT_STEP = "/student/onboarding/class";

// TODO(api): replace this demo check with a real school-code lookup once the
// backend contract exists. The valid demo code is NEVO-7K2M.
const DEMO_VALID_CODE = "7K2M";

/**
 * Onboarding Step 2 — School Connection (UI/UX spec B.2 Step 2). Identifies the
 * school via code entry. On a full code it validates (brief pending), then either
 * confirms + auto-advances, or shows a warm-toned (non-alarming) error. The
 * validation wait is the system's, bracketed as `system_busy` (SCRUM-94 fix 9)
 * via a short-lived signal session (no onboarding session exists yet here).
 */
export function SchoolConnectionStep() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", ""]);
  const [status, setStatus] = useState<CodeStatus>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [signalSession] = useState(() => `onboarding-school-${randomId()}`);
  const { trackEvent } = useSignals(signalSession);

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (status !== "pending") return;
    trackEvent(SIGNAL_EVENT_TYPES.SYSTEM_BUSY, {
      reason: BUSY_REASON.CONTENT_LOADING,
      phase: BUSY_PHASE.START,
    });
    return () =>
      trackEvent(SIGNAL_EVENT_TYPES.SYSTEM_BUSY, {
        reason: BUSY_REASON.CONTENT_LOADING,
        phase: BUSY_PHASE.END,
      });
  }, [status, trackEvent]);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const handleChange = (next: string[]) => {
    reset();
    setStatus("idle");
    setCode(next);
  };

  const handleComplete = (entered: string) => {
    setStatus("pending");
    timers.current.push(
      setTimeout(() => {
        if (entered === DEMO_VALID_CODE) {
          setStatus("success");
          timers.current.push(setTimeout(() => router.push(NEXT_STEP), 900));
        } else {
          setStatus("error");
        }
      }, 700),
    );
  };

  const message =
    status === "success"
      ? {
          text: "That's a match - connecting you to your school…",
          className: "text-nevo-navy",
        }
      : status === "error"
        ? {
            text: "That code doesn't match a school. Check it with your teacher.",
            className: "text-nevo-violet",
          }
        : null;

  return (
    <OnboardingShell step={2} backHref="/student/onboarding/name">
      <div className="flex justify-center">
        <IllustrationWrapper
          src="/illustrations/onboarding-school.png"
          alt="A friendly figure holding up a school card"
          width={671}
          height={963}
          priority
          className="mt-1 w-[98px] sm:mt-5 sm:w-[130px] lg:mt-3 lg:w-[148px]"
        />
      </div>

      <h2 className="mt-5 text-lg font-medium leading-[1.25] tracking-[-0.01em] text-nevo-near-black sm:mt-8 sm:text-[23px] lg:mt-[26px] lg:text-[22px]">
        Do you have a code from your school?
      </h2>

      <div className="mt-7">
        <SchoolCodeInput
          value={code}
          onChange={handleChange}
          onComplete={handleComplete}
          status={status}
        />
      </div>

      <div className="mt-3 min-h-[22px]">
        {message && (
          <p className={`text-sm leading-[1.4] ${message.className}`}>
            {message.text}
          </p>
        )}
      </div>

      <Button
        onClick={() => router.push(NEXT_STEP)}
        disabled={status !== "success"}
        className="mt-7 w-full sm:mt-8"
      >
        Continue
      </Button>
    </OnboardingShell>
  );
}
