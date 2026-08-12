"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignals } from "@/hooks";
import { rememberOnboardedStudent } from "@/lib/auth/onboarding";
import { FIRST_LESSON_ID } from "@/lib/mocks";
import { randomId } from "@/lib/utils";
import { ProfilingFlow } from "@/components/student/Profiling/ProfilingFlow";
import { TransitionScreen } from "./TransitionScreen";
import { ConsentGate } from "./ConsentGate";
import { PinCreationScreen } from "./PinCreationScreen";
import { YoureInScreen } from "./YoureInScreen";

/**
 * Onboarding Phase C — one continuous experience: a calm transition, the
 * Baseline Cognitive Profiling flow (SCRUM-104 — design retired the Observed
 * Interaction Sequence's four activities and this flow took their slot), the
 * Consent Gate, PIN Creation, and the "You're In" hand-off into the app.
 * Manual students arrive from Steps 1–3, SSO students from the callback; only
 * the transition copy and the PIN step differ, driven by the session
 * (`user.method`), never a URL param.
 */
export function ObservedInteractionSequence() {
  const router = useRouter();
  const { user } = useAuth();
  const isSso = user?.method === "sso";
  // One profile-seeding session spans the whole sequence; useSignals batches the
  // events and flushes on completion (unmount). TODO(api): the backend may issue
  // a real onboarding session id / dedicated endpoint — swap in here.
  const [sessionId] = useState(() => `onboarding-${randomId()}`);
  const { trackEvent } = useSignals(sessionId);
  const [phase, setPhase] = useState<"transition" | "activities">("transition");
  const [index, setIndex] = useState(0);

  if (phase === "transition") {
    return (
      <TransitionScreen
        path={isSso ? "sso" : "manual"}
        onDone={() => setPhase("activities")}
        track={trackEvent}
      />
    );
  }

  const advance = () => setIndex((i) => i + 1);

  if (index === 0) {
    return <ProfilingFlow track={trackEvent} onDone={advance} />;
  }

  if (index === 1) {
    return <ConsentGate onContinue={advance} track={trackEvent} />;
  }

  if (index === 2) {
    return (
      <PinCreationScreen
        sso={isSso}
        onComplete={() => {
          // The device now belongs to this student: fold the onboarding draft
          // into the remembered profile the PIN login unlocks against. SSO
          // students re-enter through their provider, not a PIN.
          if (!isSso) rememberOnboardedStudent();
          advance();
        }}
      />
    );
  }

  // "You're In" — the hand-off out of onboarding straight into the first lesson
  // (Product Arch B.2: land in a lesson, never an empty dashboard).
  // TODO(lessons): source the first lesson from the adaptation plan once the
  // backend assigns one, instead of the mock's FIRST_LESSON_ID.
  return (
    <YoureInScreen
      onDone={() => router.push(`/student/lessons/${FIRST_LESSON_ID}`)}
      track={trackEvent}
    />
  );
}
