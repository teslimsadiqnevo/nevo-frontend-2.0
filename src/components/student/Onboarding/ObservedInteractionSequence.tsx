"use client";

import { useState } from "react";
import { IllustrationWrapper } from "@/components/shared";
import { TransitionScreen } from "./TransitionScreen";
import { SequenceShell } from "./SequenceShell";

/**
 * The Observed Interaction Sequence (UI/UX spec) — one continuous experience:
 * a calm transition, then Activities 1–4 inside the shared shell, then the
 * close. It runs identically for manual and SSO students on first use.
 *
 * The four activities (Visual Sorting, Audio Comprehension, Engagement,
 * Memory Pairs) fill the shell's interaction stage and are built next; for now
 * the first activity slot shows a placeholder so the shell is walkable.
 */
export function ObservedInteractionSequence({
  path = "manual",
}: {
  path?: "manual" | "sso";
}) {
  const [phase, setPhase] = useState<"transition" | "sequence">("transition");

  if (phase === "transition") {
    return <TransitionScreen path={path} onDone={() => setPhase("sequence")} />;
  }

  return (
    <SequenceShell
      filledDots={1}
      illustration={
        <IllustrationWrapper
          src="/illustrations/sequence-intro.png"
          alt="A friendly figure leaning in"
          width={518}
          height={486}
          priority
          className="w-[152px] sm:w-[208px]"
        />
      }
      prompt="Where do these belong?"
    >
      {/* TODO: Activity 1 — Visual Sorting Task. Placeholder until built. */}
      <span className="text-center font-mono text-xs tracking-[0.04em] text-nevo-near-black/40">
        Activity 1 — coming next
      </span>
    </SequenceShell>
  );
}
