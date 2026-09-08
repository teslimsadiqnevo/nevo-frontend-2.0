"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, IllustrationWrapper } from "@/components/shared";
import { BUSY_PHASE, BUSY_REASON, SIGNAL_EVENT_TYPES } from "@/lib/constants";
import type { TrackEvent } from "@/hooks";

/**
 * The first screen after baseline profiling: a plain-language notice of what
 * Nevo does with what it learns, and a single Continue on to PIN creation.
 * Calm, one decision, no dense legalese. The opening pending state is a
 * design-owned beat, bracketed as `system_busy` (SCRUM-94 fix 9).
 *
 * WAS `ConsentGate`, AND IS NO LONGER A GATE. Design ruled on SCRUM-80 (7 Sep)
 * that Nevo does not gate on consent at all: the school warrants it through
 * the DSA, so `granted: false` means the school has not filed the paperwork,
 * which is not the child's problem. The screen used to call
 * `GET /students/me/consent-gate` and dev-log a not-granted result while
 * revealing anyway - a check whose only consequence was a console line. That
 * call is gone.
 *
 * The SCREEN stays, and the ruling did not ask for it to go: what it does is
 * TELL A CHILD, in words they can read, that Nevo notices how they learn.
 * Under a model where a school consents on their behalf, that notice is the
 * only thing standing between the child and being profiled without ever being
 * told. It is renamed rather than deleted so that nothing here reads as a gate
 * again.
 *
 * NOT HANDLED HERE: withdrawal. If a parent withdraws, processing must stop
 * (same ruling), and this screen is the wrong place for it - a child reaching
 * onboarding has already been profiled one step earlier. See
 * `processingWithdrawn` in `lib/api/consents.ts` for the seam, and
 * docs/BUILD_STATUS.md for the open design question of what a withdrawn child
 * should actually see.
 */
export function LearningNotice({
  onContinue,
  pendingMs = 1400,
  track,
}: {
  onContinue: () => void;
  /** How long the pending state holds before revealing the explanation. */
  pendingMs?: number;
  track?: TrackEvent;
}) {
  const [pending, setPending] = useState(true);
  useEffect(() => {
    // A pure design-owned beat now. It used to also await a consent check, but
    // that check could not change what happened next, so awaiting it only made
    // the wait longer on a slow connection - and made a network round trip a
    // dependency of an onboarding screen that does not need one.
    const timer = setTimeout(() => setPending(false), pendingMs);
    return () => clearTimeout(timer);
  }, [pendingMs]);

  useEffect(() => {
    if (!pending) return;
    track?.(SIGNAL_EVENT_TYPES.SYSTEM_BUSY, {
      reason: BUSY_REASON.AUTH_PENDING,
      phase: BUSY_PHASE.START,
    });
    return () =>
      track?.(SIGNAL_EVENT_TYPES.SYSTEM_BUSY, {
        reason: BUSY_REASON.AUTH_PENDING,
        phase: BUSY_PHASE.END,
      });
    // Pending-scoped bracket; `track` is stable from useSignals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      {/* Top bar: wordmark only — the sequence dots are done by now */}
      <div className="flex h-[60px] shrink-0 items-center px-5 sm:px-8">
        <Image
          src="/brand/nevo-wordmark.png"
          alt="Nevo"
          width={344}
          height={116}
          priority
          className="h-[18px] w-auto sm:h-5"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-10 pb-10 text-center">
        {pending ? (
          <>
            <span
              role="status"
              aria-label="Getting things ready"
              className="mb-6 block size-[26px] rounded-full border-[2.5px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:800ms]"
            />
            <h2 className="max-w-[270px] text-[20px] font-medium leading-[1.4] tracking-[-0.01em] text-balance sm:max-w-[360px] sm:text-[24px]">
              Just a moment, we&rsquo;re getting things ready for you
            </h2>
            <Button
              size="lg"
              disabled
              aria-hidden
              tabIndex={-1}
              className="mt-12 w-full max-w-[300px]"
            >
              Continue
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
            <IllustrationWrapper
              src="/illustrations/consent-gate.png"
              alt=""
              width={1254}
              height={1254}
              priority
              className="mb-2 w-[200px]"
            />
            <h2 className="max-w-[300px] text-[23px] font-medium leading-[1.3] tracking-[-0.01em] text-balance sm:max-w-[440px] sm:text-[27px]">
              Nevo will get to know how you learn
            </h2>
            <p className="mt-6 max-w-[290px] text-base leading-[1.6] text-balance sm:max-w-[430px] sm:text-[17px]">
              As you use lessons, Nevo quietly notices what helps and adjusts
              things to make learning easier for you.
            </p>
            <Button
              size="lg"
              onClick={onContinue}
              className="mt-12 w-full max-w-[300px]"
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
