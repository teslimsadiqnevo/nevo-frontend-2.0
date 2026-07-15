"use client";

import { useEffect } from "react";
import { IllustrationWrapper } from "@/components/shared";
import { SequenceShell } from "./SequenceShell";

/**
 * The Close (UI/UX spec) — the calm wrap-up of the Observed Interaction
 * Sequence. All four dots are filled, there is no text and no control: just a
 * content figure at rest, breathing gently. A button-less beat that lets the
 * sequence land before onboarding moves on to consent. Auto-advances.
 */
export function TheCloseScreen({
  onDone,
  holdMs = 2200,
}: {
  onDone: () => void;
  holdMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, holdMs);
    return () => clearTimeout(t);
  }, [onDone, holdMs]);

  return (
    <SequenceShell filledDots={4}>
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 pb-6">
        <IllustrationWrapper
          src="/illustrations/sequence-complete.png"
          alt="A content figure sitting, hands resting"
          width={1254}
          height={1254}
          priority
          motion="breathe"
          className="w-[220px] sm:w-[280px] lg:w-[300px]"
        />
      </div>
    </SequenceShell>
  );
}
