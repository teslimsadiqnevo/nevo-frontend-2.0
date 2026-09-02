"use client";

import { StudentProfile } from "@/components/teacher/Student/StudentProfile";
import { DEMO_STUDENT } from "@/lib/demo/demoData";
import { ConsoleFrame } from "../ConsoleFrame";
import { Reveal } from "../chrome";

/**
 * Scene 6. The teacher acts.
 *
 * The payoff, and the reason this is a product demo rather than a dashboard
 * tour. Everything so far has been the console telling the teacher something;
 * here the teacher does something about it.
 *
 * THE ACTION IS THE PRODUCT'S OWN, NOT INVENTED FOR THE DEMO. `StudentProfile`
 * accepts `recommendOpen`, which is how the real C08c route opens the
 * recommend sheet over the profile - so this scene passes the flag and the
 * shipped sheet appears, with the shipped suggestion in it: the listen-first
 * version of "Simplifying Expressions", and the console's own sentence saying
 * why.
 *
 * Nothing is faked and nothing is stubbed. Had the console not supported a
 * meaningful action, the honest move would have been to end the story at the
 * insight rather than mock one up.
 *
 * Note that Nevo suggests and the teacher decides - the sheet offers three
 * options with one marked suggested, which is the right relationship between
 * a system that noticed something and the person who knows the child.
 */
export function ActionScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[52px]">
      <Reveal show={progress > 0.02}>
        <div className="flex items-end justify-between gap-10">
          <div>
            <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
              Nevo suggests &middot; the teacher decides
            </p>
            <h2 className="m-0 mt-2.5 text-[42px] font-semibold leading-none tracking-[-0.022em] text-nevo-near-black">
              Recommend the version that fits her
            </h2>
          </div>
          <p className="m-0 max-w-[540px] text-right text-[21px] leading-[1.5] text-nevo-near-black/60">
            Same lesson. Heard first, then read.
          </p>
        </div>
      </Reveal>

      <Reveal show={progress > 0.08} delay={180} className="mt-8 min-h-0 flex-1">
        <ConsoleFrame
          active="Classes"
          scale={1.24}
          // The recommend sheet is what matters here and it sits at the top,
          // so this scene stays put rather than panning past it.
          pan={0}
          className="h-full"
        >
          {/* The real recommend sheet, opened the way the real route opens it. */}
          <StudentProfile student={DEMO_STUDENT} recommendOpen />
        </ConsoleFrame>
      </Reveal>
    </div>
  );
}
