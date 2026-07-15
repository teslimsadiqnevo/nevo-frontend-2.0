"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [phase, setPhase] = useState<"transition" | "activities">("transition");
  const [index, setIndex] = useState(0);

  if (phase === "transition") {
    return <TransitionScreen path={path} onDone={() => setPhase("activities")} />;
  }

  const advance = () => setIndex((i) => i + 1);

  if (index === 0) {
    return <VisualSortingTask onComplete={advance} />;
  }

  if (index === 1) {
    return <AudioComprehensionTask onComplete={advance} />;
  }

  if (index === 2) {
    return <EngagementTask onComplete={advance} />;
  }

  if (index === 3) {
    return <MemoryPairsTask onComplete={advance} />;
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

  // "You're In" — the hand-off out of onboarding into the app.
  // TODO(lessons): the spec sends students straight into the Lesson Player;
  // route there once it exists. For now, land on the dashboard.
  return <YoureInScreen onDone={() => router.push("/student/dashboard")} />;
}
