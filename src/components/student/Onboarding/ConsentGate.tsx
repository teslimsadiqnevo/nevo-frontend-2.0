"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, IllustrationWrapper } from "@/components/shared";

/**
 * Consent Gate (UI/UX spec) — the first screen after the Observed Interaction
 * Sequence. It opens in a brief pending state ("getting things ready") while
 * consent/provisioning is confirmed, then reveals a plain-language explanation
 * of what Nevo does with what it learns, and a single Continue on to PIN
 * creation. Calm, one decision, no dense legalese.
 */
export function ConsentGate({
  onContinue,
  pendingMs = 1400,
}: {
  onContinue: () => void;
  /** How long the pending state holds before revealing the explanation. */
  pendingMs?: number;
}) {
  const [pending, setPending] = useState(true);
  useEffect(() => {
    // TODO(api): replace the simulated wait with the real consent/provisioning
    // check once the FastAPI contract lands.
    const t = setTimeout(() => setPending(false), pendingMs);
    return () => clearTimeout(t);
  }, [pendingMs]);

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
