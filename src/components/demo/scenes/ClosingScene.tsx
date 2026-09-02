"use client";

import { Reveal } from "../chrome";

/**
 * Scene 8. The close.
 *
 * Two lines and the product name, held long enough to be photographed. A
 * conference audience reaches for a phone at the closing frame, and a demo
 * that cuts to black three seconds in loses that.
 *
 * The two lines are the whole thesis, and they are in the order the demo
 * argued them: first the console helps you SEE, then it lets you ACT. That is
 * the distinction the product is making against every other dashboard in the
 * category - teachers do not need more data, they need to know what a learner
 * needs and be able to do something about it.
 *
 * The timeline stops here rather than looping. A demo that silently restarts
 * behind a presenter who has moved on to questions is a distraction; `R`
 * restarts it deliberately.
 */
export function ClosingScene({ progress }: { progress: number }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-nevo-cream">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(1100px 620px at 50% 46%, rgba(154,156,203,0.20) 0%, rgba(247,241,230,0) 70%)",
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        <Reveal show={progress > 0.05}>
          <p className="m-0 text-[52px] font-semibold leading-[1.22] tracking-[-0.026em] text-nevo-near-black">
            Understand every learner.
          </p>
        </Reveal>

        <Reveal show={progress > 0.2} delay={100}>
          <p className="m-0 mt-3 text-[52px] font-semibold leading-[1.22] tracking-[-0.026em] text-nevo-near-black/50">
            Support them at the right moment.
          </p>
        </Reveal>

        <Reveal show={progress > 0.42} delay={160}>
          <div className="mt-20 flex items-center gap-5">
            <span className="flex size-[62px] items-center justify-center rounded-[18px] bg-nevo-navy text-[26px] font-semibold text-nevo-cream">
              N
            </span>
            <span className="text-[40px] font-semibold tracking-[-0.024em] text-nevo-near-black">
              Teacher Console
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
