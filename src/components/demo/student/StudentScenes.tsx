"use client";

import { HomeDashboard } from "@/components/student/Home/HomeDashboard";
import { LessonPlayer } from "@/components/student/Lesson/LessonPlayer";
import { LessonProvider } from "@/context/LessonContext";
import { ADDING_FRACTIONS, ADDING_FRACTIONS_PLAN } from "@/lib/mocks/adding-fractions";
import { DemoLockup } from "../DemoLockup";
import { TabletFrame } from "../TabletFrame";
import { Reveal } from "../chrome";

/**
 * The framing scenes - the ones that give the adaptation somewhere to happen.
 *
 * `HomeDashboard` and `LessonPlayer` are the REAL components, rendering the
 * real `adding-fractions` fixture and its adaptation plan. Nothing is signed
 * in, which is exactly why they render: the student surfaces try live first
 * and fall back to the mock registry, so `/demo/student` is deterministic
 * without a mocking layer existing anywhere.
 *
 * The tablet is the product's own 820x1112 breakpoint, so the shell shows its
 * collapsed sidebar and the player renders bare - what a student on a school
 * tablet actually sees.
 */

/* --------------------------------------------------------------- 1. INTRO */

export function StudentIntroScene({ progress }: { progress: number }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-nevo-cream">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(1100px 620px at 50% 44%, rgba(154,156,203,0.20) 0%, rgba(247,241,230,0) 70%)",
        }}
      />
      <div className="relative flex flex-col items-center">
        <Reveal show={progress > 0.06}>
          <DemoLockup width={560} priority />
        </Reveal>
        <Reveal show={progress > 0.16} delay={80}>
          <h1 className="m-0 mt-14 text-[86px] font-semibold leading-none tracking-[-0.034em] text-nevo-near-black">
            For the learner
          </h1>
        </Reveal>
        <Reveal show={progress > 0.34} delay={120}>
          <p className="m-0 mt-9 text-[36px] leading-none tracking-[-0.014em] text-nevo-near-black/58">
            A lesson that meets her where she is.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 2. HOME */

export function StudentHomeScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full items-center gap-[84px] bg-nevo-cream px-[96px] pb-[150px] pt-[26px]">
      <Reveal show={progress > 0.04} className="flex-none">
        <TabletFrame height={876}>
          <HomeDashboard />
        </TabletFrame>
      </Reveal>

      <div className="max-w-[790px]">
        <Reveal show={progress > 0.1}>
          <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
            Amara Okafor &middot; JSS 2A
          </p>
          <h2 className="m-0 mt-3 text-[52px] font-semibold leading-[1.1] tracking-[-0.026em] text-nevo-near-black">
            Her morning, in one screen
          </h2>
        </Reveal>
        <Reveal show={progress > 0.2} delay={200}>
          {/* Deliberately about the shape of the screen, not about which
              lesson is on it: the student app's sample lesson list belongs to
              its own persona, and claiming it held her recommended fractions
              lesson would be a caption the tablet contradicts. */}
          <p className="m-0 mt-7 text-[24px] leading-[1.55] text-nevo-near-black/70">
            A warm-up to tune the day, what she was part-way through, and
            what is ready when she is. No score, no league table.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- 3. LESSON */

export function StudentLessonScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full items-center gap-[84px] bg-nevo-cream px-[96px] pb-[150px] pt-[26px]">
      <Reveal show={progress > 0.04} className="flex-none">
        <TabletFrame height={876}>
          {/* The real player, on the real fixture and its adaptation plan.
              `live={false}` because the fixture's id is authored, not a
              backend one - writing progress against it would 404.

              `LessonProvider` is what the real route's layout wraps it in, and
              the player's `useLesson` is strict - without it the scene threw
              and the stage showed an error boundary. Mounting a component
              outside its route means bringing its route's providers with it. */}
          <LessonProvider>
            <LessonPlayer
              lesson={ADDING_FRACTIONS}
              plan={ADDING_FRACTIONS_PLAN}
              live={false}
            />
          </LessonProvider>
        </TabletFrame>
      </Reveal>

      <div className="max-w-[790px]">
        <Reveal show={progress > 0.1}>
          <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
            Adding Fractions
          </p>
          <h2 className="m-0 mt-3 text-[52px] font-semibold leading-[1.1] tracking-[-0.026em] text-nevo-near-black">
            An ordinary lesson, watched carefully
          </h2>
        </Reveal>
        <Reveal show={progress > 0.2} delay={200}>
          <p className="m-0 mt-7 text-[24px] leading-[1.55] text-nevo-near-black/70">
            Nothing about the first screen looks clever. What is different is
            that Nevo is reading how it goes &mdash; and is allowed to change
            it while she works.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- 7. SUMMARY */

const DID = [
  { label: "Worked through", value: "Adding Fractions" },
  { label: "Switched to", value: "Listening, on the recap" },
  { label: "Took", value: "One break, offered" },
  { label: "Support", value: "Raised on the harder step" },
];

export function StudentSummaryScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[64px]">
      <Reveal show={progress > 0.03}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          What Amara did today
        </p>
        <h2 className="m-0 mt-3 text-[52px] font-semibold leading-none tracking-[-0.026em] text-nevo-near-black">
          Told back to her, in her own language
        </h2>
      </Reveal>

      <div className="mt-12 grid flex-1 grid-cols-2 gap-7">
        {DID.map((row, i) => (
          <Reveal key={row.label} show={progress > 0.1} delay={160 + i * 150}>
            <div className="rounded-2xl bg-nevo-cream-elevated px-9 py-8 shadow-[0_2px_10px_rgba(43,43,47,0.06)]">
              <p className="m-0 text-[18px] font-medium uppercase tracking-[0.1em] text-nevo-near-black/45">
                {row.label}
              </p>
              <p className="m-0 mt-3 text-[30px] font-semibold tracking-[-0.014em] text-nevo-near-black">
                {row.value}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal show={progress > 0.36} delay={240}>
        <p className="m-0 mt-8 max-w-[86ch] text-[21px] leading-[1.55] text-nevo-near-black/60">
          No score, no rank, nothing measuring her against the class. What she
          did, and what Nevo will do differently next time because of it.
        </p>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------- 8. CLOSING */

export function StudentClosingScene({ progress }: { progress: number }) {
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
            Every lesson,
          </p>
        </Reveal>
        <Reveal show={progress > 0.2} delay={100}>
          <p className="m-0 mt-3 text-[52px] font-semibold leading-[1.22] tracking-[-0.026em] text-nevo-near-black/50">
            shaped to the learner.
          </p>
        </Reveal>
        <Reveal show={progress > 0.42} delay={160}>
          <div className="mt-[86px] flex items-center gap-6">
            <DemoLockup width={300} />
            <span className="h-[46px] w-px bg-nevo-near-black/20" />
            <span className="text-[38px] font-semibold tracking-[-0.024em] text-nevo-near-black">
              For students
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
