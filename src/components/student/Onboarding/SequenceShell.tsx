import Image from "next/image";
import type { ReactNode } from "react";
import { ProgressDots } from "@/components/shared";

/**
 * Shared shell for the Observed Interaction Sequence (UI/UX spec). Purely
 * structural so all four activities read as one continuous experience: a
 * four-dot indicator up top, an illustration + prompt in the upper two-thirds,
 * and the activity's controls in the lower-third interaction stage. No
 * back / skip / timer, by design.
 */
export function SequenceShell({
  filledDots,
  totalDots = 4,
  illustration,
  prompt,
  children,
}: {
  /** How many activities are complete (0–4). */
  filledDots: number;
  totalDots?: number;
  illustration: ReactNode;
  prompt: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      {/* Top bar: wordmark (left) + four-dot progress (centered) */}
      <div className="relative flex min-h-11 shrink-0 items-center justify-center px-5 pt-4 sm:px-8">
        <Image
          src="/brand/nevo-wordmark.png"
          alt="Nevo"
          width={344}
          height={116}
          className="absolute top-4 left-5 h-5 w-auto sm:left-8 sm:h-[22px] lg:h-6"
        />
        <ProgressDots
          total={totalDots}
          current={filledDots}
          aria-label={`Activity ${filledDots} of ${totalDots}`}
        />
      </div>

      {/* Upper zone (~two-thirds): illustration + prompt */}
      <div className="flex min-h-0 flex-[2] flex-col items-center justify-center px-5 sm:px-8">
        {illustration}
        <p className="mt-6 max-w-[300px] text-center text-[19px] font-medium leading-[1.4] tracking-[-0.01em] text-balance sm:max-w-[460px] sm:text-[22px]">
          {prompt}
        </p>
      </div>

      {/* Lower zone (~one-third): the activity's interaction stage */}
      <div className="flex min-h-0 flex-1 px-5 pb-5 sm:px-8 sm:pb-8">
        <div className="flex flex-1 items-center justify-center rounded-[12px] bg-nevo-cream-elevated p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
