"use client";

import { IllustrationWrapper } from "@/components/shared";
import { ProfilingShell } from "./ProfilingShell";

/**
 * Profiling intro + complete (BP-01 / BP-DONE) - the bookends of the baseline
 * flow, one component with two modes per the frame. Fixed copy; never "test",
 * "score" or "ability". No skip, no back. The complete screen shows no results
 * of any kind - a settled figure, not a celebration.
 *
 * The complete copy reports the baseline write rather than assuming it: "your
 * learning space has been personalized" is a claim about the engine, and it is
 * false if the submit never landed. `saved === false` swaps it for the same
 * plain admission the daily warm-up uses.
 */
export function ProfilingIntro({
  mode,
  onContinue,
  saved = null,
}: {
  mode: "intro" | "complete";
  onContinue: () => void;
  /**
   * Whether the baseline reached Nevo. Null while it is still resolving, which
   * reads as the settled copy - the child did their part either way and the
   * screen should not flicker a warning at them mid-flight.
   */
  saved?: boolean | null;
}) {
  const complete = mode === "complete";
  return (
    <ProfilingShell filled={complete ? 4 : 0} active={complete ? -1 : 0}>
      <div className="flex min-h-0 w-full max-w-[300px] flex-1 flex-col items-center justify-center text-center sm:max-w-[480px]">
        <IllustrationWrapper
          src={
            complete
              ? "/illustrations/sequence-complete.png"
              : "/illustrations/sequence-intro.png"
          }
          alt={
            complete
              ? "A calm Nevo figure sitting comfortably"
              : "A friendly Nevo figure leaning in"
          }
          width={518}
          height={486}
          priority
          className="h-[160px] w-auto sm:h-[200px]"
        />
        <h1 className="mt-[22px] text-[22px] leading-[1.25] font-semibold tracking-[-0.015em] text-balance text-nevo-navy sm:mt-[26px] sm:text-2xl">
          {complete ? "All set. Nevo is ready for you." : "Let's set up your learning space"}
        </h1>
        <p className="mt-3 max-w-[400px] text-[15px] leading-[1.55] text-pretty text-nevo-near-black sm:text-base">
          {complete
            ? saved === false
              ? "Thanks for doing that. We couldn’t save it just now — that’s on us, not you."
              : "Your learning space has been personalized."
            : "You'll do four quick activities. No tests, no scores. This just helps Nevo work better for you."}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-[30px] h-[52px] w-full cursor-pointer rounded-[10px] bg-nevo-navy text-base font-semibold text-nevo-cream transition-[filter,transform] hover:brightness-109 active:scale-[0.985] sm:mt-[34px]"
        >
          {complete ? "Start my first lesson" : "Let's go"}
        </button>
      </div>
    </ProfilingShell>
  );
}
