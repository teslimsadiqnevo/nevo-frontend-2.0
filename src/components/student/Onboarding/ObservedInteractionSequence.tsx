"use client";

import { useState } from "react";
import { TransitionScreen } from "./TransitionScreen";
import { VisualSortingTask } from "./VisualSortingTask";
import { AudioComprehensionTask } from "./AudioComprehensionTask";
import { EngagementTask } from "./EngagementTask";
import { MemoryPairsTask } from "./MemoryPairsTask";
import { TheCloseScreen } from "./TheCloseScreen";

/**
 * The Observed Interaction Sequence (UI/UX spec) — one continuous experience:
 * a calm transition, then Activities 1–4 inside the shared shell, then the
 * close. Runs identically for manual and SSO students on first use.
 *
 * Activities 1–4 (Visual Sorting, Audio, Engagement, Memory Pairs) and The
 * Close are built; consent + PIN creation are next.
 */
export function ObservedInteractionSequence({
  path = "manual",
}: {
  path?: "manual" | "sso";
}) {
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
    // The Close — a calm beat, then on to consent + PIN creation (next up).
    return <TheCloseScreen onDone={advance} />;
  }

  // Consent Gate — placeholder until built; keeps the flow walkable and stops
  // The Close from looping its auto-advance.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-nevo-cream px-8 text-nevo-near-black">
      <span className="text-center font-mono text-xs tracking-[0.04em] text-nevo-near-black/40">
        Consent Gate — coming next
      </span>
    </div>
  );
}
