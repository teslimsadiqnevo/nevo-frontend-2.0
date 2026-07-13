import Image from "next/image";
import type { ReactNode } from "react";
import { ProgressDots } from "@/components/shared";

/**
 * Shared shell for the Observed Interaction Sequence (UI/UX spec). Purely
 * structural so all four activities read as one continuous experience: a
 * wordmark + four-dot indicator up top, then a centered column holding the
 * activity's (optional) illustration and prompt, with the activity's own
 * interaction filling the space below. No back / skip / timer, by design.
 */
export function SequenceShell({
  filledDots,
  totalDots = 4,
  illustration,
  prompt,
  children,
}: {
  /** Current activity, 1-indexed (fills that many dots). */
  filledDots: number;
  totalDots?: number;
  illustration?: ReactNode;
  prompt?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      {/* Top bar: wordmark (left) + four-dot progress (centered) */}
      <div className="relative flex h-[60px] shrink-0 items-center justify-center px-5 sm:px-8">
        <Image
          src="/brand/nevo-wordmark.png"
          alt="Nevo"
          width={344}
          height={116}
          className="absolute top-1/2 left-5 h-[18px] w-auto -translate-y-1/2 sm:left-8 sm:h-5"
        />
        <ProgressDots
          total={totalDots}
          current={filledDots}
          aria-label={`Activity ${filledDots} of ${totalDots}`}
        />
      </div>

      {/* Centered content column; the activity fills the space below the prompt */}
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col px-2">
        {(illustration || prompt) && (
          <div className="flex shrink-0 flex-col items-center px-4 pt-2">
            {illustration}
            {prompt && (
              <p className="mt-3 max-w-[320px] text-center text-xl font-medium leading-[1.35] tracking-[-0.01em] text-balance">
                {prompt}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
