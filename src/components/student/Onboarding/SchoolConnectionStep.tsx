"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, IllustrationWrapper } from "@/components/shared";
import { ApiError, authApi } from "@/lib/api";
import { BUSY_PHASE, BUSY_REASON, SIGNAL_EVENT_TYPES } from "@/lib/constants";
import { useSignals } from "@/hooks";
import { mergeOnboardingDraft } from "@/lib/auth/onboarding";
import { randomId } from "@/lib/utils";
import { OnboardingShell } from "./OnboardingShell";
import { SchoolCodeInput, type CodeStatus } from "./SchoolCodeInput";

const NEXT_STEP = "/student/onboarding/class";

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
  // A school that does not exist and a check we could not run are different
  // sentences, and a child should never wonder if they mistyped when we
  // failed. Both render in the same warm error styling.
  const [trouble, setTrouble] = useState(false);
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
    setTrouble(false);
    setCode(next);
  };

  const handleComplete = (entered: string) => {
    setStatus("pending");
    setTrouble(false);
    // Canonical form: the UI's fixed prefix + the four typed characters.
    const schoolCode = `NEVO-${entered}`;
    void authApi.verifySchoolCode(schoolCode).then(
      (school) => {
        setStatus("success");
        // Remember what the school told us: the code (the live login needs
        // it), the name, how its students sign in, and its class list -
        // which is exactly what the next step confirms against.
        mergeOnboardingDraft({
          schoolCode,
          schoolName: school.schoolName,
          authMethod: school.authMethod,
          classes: school.classes.map((c) => ({ id: c.id, name: c.name })),
        });
        timers.current.push(setTimeout(() => router.push(NEXT_STEP), 900));
      },
      (err: unknown) => {
        // 4xx is the server's answer about the code; anything else is ours.
        const notFound =
          err instanceof ApiError && err.status >= 400 && err.status < 500;
        setTrouble(!notFound);
        setStatus("error");
      },
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
            text: trouble
              ? "We couldn't check that just now. Give it a moment and try again."
              : "That code doesn't match a school. Check it with your teacher.",
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
