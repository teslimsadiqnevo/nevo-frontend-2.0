"use client";

import { useEffect, useRef } from "react";
import { IllustrationWrapper, NevoLockup } from "@/components/shared";

/**
 * "You're In" transition (UI/UX spec) — the final onboarding screen and the
 * hand-off into the app. Passive and celebratory: a welcoming figure, the full
 * Nevo lockup, and a single warm line. No controls; it auto-advances.
 */
export function YoureInScreen({
  onDone,
  holdMs = 2400,
}: {
  onDone: () => void;
  holdMs?: number;
}) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), holdMs);
    return () => clearTimeout(t);
  }, [holdMs]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-10 text-nevo-near-black">
      <IllustrationWrapper
        src="/illustrations/youre-in-cream.png"
        alt="A welcoming figure"
        width={766}
        height={1041}
        priority
        motion="breathe"
        className="w-[200px] sm:w-[260px] lg:w-[240px]"
      />

      {/* Full Nevo lockup (mark + wordmark) — the brand beat before the app. */}
      <NevoLockup priority className="mt-7" />

      <p className="mt-4 max-w-[280px] text-center text-[19px] font-medium leading-[1.45] tracking-[-0.01em] text-balance sm:max-w-[360px] sm:text-[21px] lg:max-w-[380px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:delay-200 motion-safe:duration-500">
        You&rsquo;re all set. Let&rsquo;s start learning
      </p>
    </div>
  );
}
