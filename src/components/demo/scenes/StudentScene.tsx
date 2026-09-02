"use client";

import { StudentProfile } from "@/components/teacher/Student/StudentProfile";
import { DEMO_STUDENT } from "@/lib/demo/demoData";
import { ConsoleFrame } from "../ConsoleFrame";
import { AnchoredRing, Reveal } from "../chrome";

/**
 * Scene 4. One learner.
 *
 * The real `StudentProfile`, fed the fixture the rest of the console already
 * uses for her - so the observation the dashboard flagged one scene ago is
 * the same sentence that appears here. That consistency is the point: the
 * audience should feel they followed a thread, not watched two screenshots.
 *
 * The ring names the noticing banner, because that is the sentence the
 * narration is speaking and the one that makes the case. It is a ring rather
 * than a simulated cursor deliberately - a fake pointer drifting across a
 * screen invites the room to watch the pointer.
 */
export function StudentScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[52px]">
      <Reveal show={progress > 0.02}>
        <div className="flex items-end justify-between gap-10">
          <div>
            <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
              From a class signal to one learner
            </p>
            <h2 className="m-0 mt-2.5 text-[42px] font-semibold leading-none tracking-[-0.022em] text-nevo-near-black">
              {DEMO_STUDENT.name}
            </h2>
          </div>
          <p className="m-0 max-w-[560px] text-right text-[21px] leading-[1.5] text-nevo-near-black/60">
            Not falling behind. Taking longer on written work &mdash; and there
            is something to do about it.
          </p>
        </div>
      </Reveal>

      <Reveal show={progress > 0.1} delay={180} className="relative mt-8 min-h-0 flex-1">
        <ConsoleFrame
          active="Classes"
          scale={1.24}
          pan={progress}
          // Held at the top while the ring names the noticing banner, then
          // moves on to the concept bars and her sessions.
          panWindow={[0.46, 0.94]}
          className="h-full"
        >
          <StudentProfile student={DEMO_STUDENT} />
        </ConsoleFrame>

        {/* Anchored to the console's own noticing banner - the violet
            left-ruled callout - so the ring is correct wherever the layout
            puts it, and follows the pan. */}
        {/* No label on the ring. It was drawn above the banner, which is
            exactly where the student's name and class sit - and the caption
            already says what the ring is pointing at, so a second label was
            competing for the one focal point the scene is allowed. */}
        <AnchoredRing
          selector=".border-nevo-violet.bg-nevo-violet\/16"
          show={progress > 0.3 && progress < 0.62}
          progress={progress}
        />
      </Reveal>
    </div>
  );
}
