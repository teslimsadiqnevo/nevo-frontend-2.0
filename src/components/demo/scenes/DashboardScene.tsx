"use client";

import { TeacherHome } from "@/components/teacher/Home/TeacherHome";
import { DEMO_CLASS_STATS } from "@/lib/demo/demoData";
import { ConsoleFrame } from "../ConsoleFrame";
import { CountUp, Reveal } from "../chrome";

/**
 * Scene 2. The morning picture.
 *
 * THIS IS THE REAL `TeacherHome`, not a rebuild of it. It renders its own
 * fixtures because no session token exists on `/demo`, which is behaviour the
 * console already had - `useLiveQuery` returns nothing without a token and
 * every screen falls back to its designed sample data. The demo did not have
 * to add a mocking layer; it just does not sign in.
 *
 * That is worth stating because it is the demo's honesty guarantee: the
 * audience is looking at the shipped component, at the shipped spacing, with
 * the shipped copy. If the product regresses, this scene regresses with it.
 *
 * The strip above it is presentation, not product. Five figures a room can
 * read in three seconds, counting up so the eye is drawn along them, sitting
 * above the console rather than inside it so nothing about the real screen is
 * misrepresented.
 */

const STATS = [
  { label: "Learners", value: DEMO_CLASS_STATS.learners, suffix: "" },
  { label: "Active today", value: DEMO_CLASS_STATS.active, suffix: "" },
  { label: "Average progress", value: DEMO_CLASS_STATS.averageProgress, suffix: "%" },
  { label: "Worth a look", value: DEMO_CLASS_STATS.needAttention, suffix: "" },
  { label: "Live lessons", value: DEMO_CLASS_STATS.activeLessons, suffix: "" },
];

export function DashboardScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[52px]">
      <div className="flex items-end justify-between gap-10">
        <Reveal show={progress > 0.02}>
          <div>
            <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
              {DEMO_CLASS_STATS.className}
            </p>
            <h2 className="m-0 mt-2.5 text-[42px] font-semibold leading-none tracking-[-0.022em] text-nevo-near-black">
              Wednesday morning
            </h2>
          </div>
        </Reveal>

        <div className="flex gap-11">
          {STATS.map((s, i) => (
            <Reveal key={s.label} show={progress > 0.04} delay={120 + i * 90}>
              <div className="text-right">
                <div className="text-[46px] font-semibold leading-none tracking-[-0.028em] text-nevo-navy tabular-nums">
                  <CountUp
                    value={s.value}
                    progress={Math.max(0, progress - 0.05)}
                    suffix={s.suffix}
                    window={0.22}
                  />
                </div>
                <div className="mt-2 text-[17px] font-medium text-nevo-near-black/58">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal show={progress > 0.12} delay={200} className="mt-9 min-h-0 flex-1">
        <ConsoleFrame active="Home" scale={1.28} pan={progress} className="h-full">
          <TeacherHome />
        </ConsoleFrame>
      </Reveal>
    </div>
  );
}
