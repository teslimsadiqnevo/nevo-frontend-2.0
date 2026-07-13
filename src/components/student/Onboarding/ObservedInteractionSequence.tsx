"use client";

import { useState } from "react";
import { IllustrationWrapper } from "@/components/shared";
import { TransitionScreen } from "./TransitionScreen";
import { SequenceShell } from "./SequenceShell";
import { VisualSortingTask } from "./VisualSortingTask";
import { AudioComprehensionTask } from "./AudioComprehensionTask";
import { EngagementTask } from "./EngagementTask";

/**
 * The Observed Interaction Sequence (UI/UX spec) — one continuous experience:
 * a calm transition, then Activities 1–4 inside the shared shell, then the
 * close. Runs identically for manual and SSO students on first use.
 *
 * Activity 1 (Visual Sorting) is built; Activities 2–4 (Audio, Engagement,
 * Memory Pairs) and The Close are next — placeholders keep the flow walkable.
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

  // Activity 4 + The Close — placeholders until built.
  return (
    <SequenceShell
      filledDots={Math.min(index + 1, 4)}
      illustration={
        <IllustrationWrapper
          src="/illustrations/sequence-intro.png"
          alt="A friendly figure leaning in"
          width={518}
          height={486}
          priority
          className="w-[132px] sm:w-[180px]"
        />
      }
      prompt="Nicely done — more coming soon"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center pb-6">
        <span className="text-center font-mono text-xs tracking-[0.04em] text-nevo-near-black/40">
          Activity {index + 1} — coming next
        </span>
      </div>
    </SequenceShell>
  );
}
