"use client";

import { useEffect } from "react";
import { STUDENT_TIMELINE } from "@/lib/demo/studentTimeline";
import { DemoStage } from "./DemoStage";
import { useDemoController } from "./DemoController";
import { Caption, ProgressBar } from "./chrome";
import { ChannelScene, RestScene, SupportScene } from "./student/AdaptScene";
import {
  StudentClosingScene,
  StudentHomeScene,
  StudentIntroScene,
  StudentLessonScene,
  StudentSummaryScene,
} from "./student/StudentScenes";

/**
 * The student demo. Same engine, same stage, same presenter keys as the
 * teacher film - only the timeline and the scenes differ, which is why
 * `useDemoController` takes its timeline as a parameter.
 *
 * The two are meant to be watched as a pair: the teacher video ends with a
 * listen-first lesson being recommended, and this one is that lesson.
 *
 * NAMING THE LEARNER. The two apps' fixtures describe different children - the
 * teacher console's sample student is Amara Okafor in JSS 2A, the student
 * app's is Ada, who is several years younger. For the pair to read as one
 * story the learner is named here, through the product's OWN device
 * preference: `nevo.auth.displayName` is what a student who typed their name
 * into the app would have set, and `useDisplayName` reads it first.
 *
 * Two honesty notes on that. It renames the greeting and nothing else - her
 * lesson list still belongs to the student app's own persona, which is why the
 * home scene's panel does not claim the tablet is showing her recommended
 * fractions lesson. And the previous value is restored on unmount, so a demo
 * run does not quietly rename the learner in the real student app on the same
 * origin.
 *
 * The underlying incoherence - two sample learners for one product - is worth
 * fixing in the fixtures rather than papered over here indefinitely.
 */

const DISPLAY_NAME_KEY = "nevo.auth.displayName";
const DEMO_LEARNER = "Amara";

/**
 * Names the learner for the run, and puts back whatever was there before.
 *
 * Safe to do in a plain effect: scenes mount one at a time and the intro holds
 * for six seconds, so this lands long before any student component reads it.
 */
function useDemoLearnerName() {
  useEffect(() => {
    let previous: string | null = null;
    try {
      previous = window.localStorage.getItem(DISPLAY_NAME_KEY);
      window.localStorage.setItem(DISPLAY_NAME_KEY, DEMO_LEARNER);
    } catch {
      // Private mode or blocked storage - the demo still runs, just as "Ada".
    }
    return () => {
      try {
        if (previous === null) window.localStorage.removeItem(DISPLAY_NAME_KEY);
        else window.localStorage.setItem(DISPLAY_NAME_KEY, previous);
      } catch {
        /* nothing to restore to */
      }
    };
  }, []);
}

type SceneComponent = (props: { progress: number }) => React.ReactElement;

const FADE_IN_MS = 260;
const FADE_OUT_MS = 300;

function sceneOpacity(withinMs: number, durationMs: number): number {
  const remaining = durationMs - withinMs;
  if (withinMs < FADE_IN_MS) return Math.max(0, withinMs / FADE_IN_MS);
  if (remaining < FADE_OUT_MS) return Math.max(0, remaining / FADE_OUT_MS);
  return 1;
}

const SCENES: Record<string, SceneComponent> = {
  intro: StudentIntroScene,
  home: StudentHomeScene,
  lesson: StudentLessonScene,
  support: SupportScene,
  channel: ChannelScene,
  rest: RestScene,
  summary: StudentSummaryScene,
  closing: StudentClosingScene,
};

export function StudentDemoPlayer({ recording = false }: { recording?: boolean }) {
  useDemoLearnerName();
  const { scene, index, sceneProgress, totalProgress, paused, runId, restart } =
    useDemoController(STUDENT_TIMELINE);

  const withinMs = sceneProgress * scene.duration;
  const opacity = sceneOpacity(withinMs, scene.duration);
  const Scene = SCENES[scene.id];

  return (
    <DemoStage>
      <ProgressBar value={totalProgress} />

      <div
        key={`${runId}-${scene.id}`}
        className="absolute inset-0"
        style={{ opacity }}
      >
        <Scene progress={sceneProgress} />
      </div>

      {scene.id !== "intro" && scene.id !== "closing" ? (
        <Caption show={sceneProgress > 0.04}>{scene.narration}</Caption>
      ) : null}

      {paused ? (
        <div className="absolute bottom-9 right-11 z-50 rounded-full bg-nevo-near-black/78 px-6 py-3 text-[19px] font-semibold text-nevo-cream">
          Paused
        </div>
      ) : null}

      {recording ? (
        <div className="absolute left-11 top-9 z-50 rounded-xl bg-nevo-near-black/82 px-5 py-3 font-mono text-[15px] leading-[1.6] text-nevo-cream">
          <div>
            scene {index + 1}/{STUDENT_TIMELINE.length} · {scene.id}
          </div>
          <div className="opacity-70">
            {Math.round(sceneProgress * 100)}% ·{" "}
            {Math.max(0, Math.round((scene.duration * (1 - sceneProgress)) / 1000))}s left
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={restart}
        aria-label="Restart demo"
        className="absolute bottom-0 left-0 z-50 size-16 cursor-pointer opacity-0 transition-opacity hover:opacity-100"
      >
        <span className="sr-only">Restart</span>
      </button>
    </DemoStage>
  );
}
