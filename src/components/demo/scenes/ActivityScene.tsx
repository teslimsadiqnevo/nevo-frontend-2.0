"use client";

import { MasteryDualTrack } from "@/components/teacher/Student/MasteryDualTrack";
import { DEMO_STUDENT } from "@/lib/demo/demoData";
import { cn } from "@/lib/utils";
import { Reveal } from "../chrome";

/**
 * Scene 5. The evidence.
 *
 * `MasteryDualTrack` is the console's own component, reused unmodified. It
 * draws two tracks per concept: how well she understands the idea, and the
 * reading level the material is asking for. Where the two part company, the
 * barrier is the text rather than the concept - and that is exactly the
 * finding that makes the next scene's action the right one.
 *
 * This is the scene that turns an assertion into a demonstration. Scene 4 says
 * "she is slower on written work"; this shows the shape of it, concept by
 * concept, and shows her sessions beside it so the claim has dates attached.
 *
 * Bars animate by rendering the real component behind a width transition on
 * its container - the component is untouched, and if the transition never
 * runs the bars are simply already correct.
 */
export function ActivityScene({ progress }: { progress: number }) {
  const sessions = DEMO_STUDENT.sessions.slice(0, 4);

  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[62px]">
      <Reveal show={progress > 0.02}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          {DEMO_STUDENT.name} &middot; recent work
        </p>
        <h2 className="m-0 mt-3 text-[46px] font-semibold leading-none tracking-[-0.024em] text-nevo-near-black">
          Where the reading is asking more than the idea
        </h2>
      </Reveal>

      <div className="mt-10 grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-12">
        {/* Concept mastery - the console's own dual-track bars. */}
        <div className="flex flex-col gap-7">
          {DEMO_STUDENT.concepts.map((c, i) => (
            <Reveal key={c.name} show={progress > 0.08} delay={150 + i * 160}>
              <div
                className={cn(
                  "rounded-2xl bg-nevo-cream-elevated px-8 py-6",
                  "shadow-[0_2px_10px_rgba(43,43,47,0.06)]",
                )}
              >
                <MasteryDualTrack
                  concept={c.name}
                  understanding={c.u}
                  reading={c.r}
                  flag={c.flag}
                />
              </div>
            </Reveal>
          ))}
        </div>

        {/* Her sessions, so the pattern has dates on it. */}
        <div className="flex flex-col">
          <Reveal show={progress > 0.14} delay={280}>
            <h3 className="m-0 text-[21px] font-semibold uppercase tracking-[0.1em] text-nevo-near-black/45">
              Recent sessions
            </h3>
          </Reveal>

          <div className="mt-6 flex flex-col gap-4">
            {sessions.map((s, i) => (
              <Reveal key={s.id} show={progress > 0.18} delay={340 + i * 150}>
                <div className="rounded-2xl bg-nevo-cream-elevated px-8 py-6 shadow-[0_2px_10px_rgba(43,43,47,0.06)]">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[22px] font-semibold tracking-[-0.012em] text-nevo-near-black">
                      {s.lesson}
                    </span>
                    <span className="flex-none text-[16px] text-nevo-near-black/50">
                      {s.dateLong}
                    </span>
                  </div>
                  <p className="m-0 mt-2.5 text-[18px] leading-[1.5] text-nevo-near-black/72">
                    {s.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
