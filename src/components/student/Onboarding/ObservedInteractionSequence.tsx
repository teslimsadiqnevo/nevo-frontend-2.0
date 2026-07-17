"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignals } from "@/hooks";
import { FIRST_LESSON_ID } from "@/lib/mocks";
import { TransitionScreen } from "./TransitionScreen";
import { VisualSortingTask } from "./VisualSortingTask";
import { AudioComprehensionTask } from "./AudioComprehensionTask";
import { EngagementTask } from "./EngagementTask";
import { MemoryPairsTask } from "./MemoryPairsTask";
import { TheCloseScreen } from "./TheCloseScreen";
import { ConsentGate } from "./ConsentGate";
import { PinCreationScreen } from "./PinCreationScreen";
import { YoureInScreen } from "./YoureInScreen";

/**
 * The Observed Interaction Sequence (UI/UX spec) — one continuous experience:
 * a calm transition, Activities 1–4, The Close, the Consent Gate, PIN Creation,
 * and the "You're In" hand-off into the app. Runs identically for manual and
 * SSO students on first use.
 */
export function ObservedInteractionSequence({
  path = "manual",
}: {
  path?: "manual" | "sso";
}) {
  const router = useRouter();
  // One profile-seeding session spans the whole sequence; useSignals batches the
  // activity events and flushes on completion (unmount). TODO(api): the backend
  // may issue a real onboarding session id / dedicated endpoint — swap in here.
  const [sessionId] = useState(() => `onboarding-${crypto.randomUUID()}`);
  const { trackEvent } = useSignals(sessionId);
  const [phase, setPhase] = useState<"transition" | "activities">("transition");
  const [index, setIndex] = useState(0);

  if (phase === "transition") {
    return <TransitionScreen path={path} onDone={() => setPhase("activities")} />;
  }

  const advance = () => setIndex((i) => i + 1);

  if (index === 0) {
    return <VisualSortingTask onComplete={advance} track={trackEvent} />;
  }

  if (index === 1) {
    return <AudioComprehensionTask onComplete={advance} track={trackEvent} />;
  }

  if (index === 2) {
    return <EngagementTask onComplete={advance} track={trackEvent} />;
  }

  if (index === 3) {
    return <MemoryPairsTask onComplete={advance} track={trackEvent} />;
  }

  if (index === 4) {
    // The Close — a calm beat, then on to consent + PIN creation.
    return <TheCloseScreen onDone={advance} />;
  }

  if (index === 5) {
    return <ConsentGate onContinue={advance} />;
  }

  if (index === 6) {
    return <PinCreationScreen sso={path === "sso"} onComplete={advance} />;
  }

  // "You're In" — the hand-off out of onboarding straight into the first lesson
  // (Product Arch B.2: land in a lesson, never an empty dashboard).
  // TODO(lessons): source the first lesson from the adaptation plan once the
  // backend assigns one, instead of the mock's FIRST_LESSON_ID.
  return (
    <YoureInScreen
      onDone={() => router.push(`/student/lessons/${FIRST_LESSON_ID}`)}
    />
  );
}
