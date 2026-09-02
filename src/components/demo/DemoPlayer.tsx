"use client";


import { ConsoleFrame } from "./ConsoleFrame";
import { DemoStage } from "./DemoStage";
import { useDemoController } from "./DemoController";
import { Caption, ProgressBar } from "./chrome";
import { ActionScene } from "./scenes/ActionScene";
import { ActivityScene } from "./scenes/ActivityScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { DashboardScene } from "./scenes/DashboardScene";
import { InsightScene } from "./scenes/InsightScene";
import { IntroScene } from "./scenes/IntroScene";
import { ResultScene } from "./scenes/ResultScene";
import { StudentScene } from "./scenes/StudentScene";

/**
 * The player: stage, clock, scenes, captions.
 *
 * Scenes are MOUNTED ONE AT A TIME rather than all rendered and hidden. Eight
 * simultaneous copies of the console - three of which mount the real
 * `StudentProfile` - is a lot of React to keep alive for no benefit, and
 * offscreen animations competing for frames is exactly how a demo starts
 * dropping them. Mounting one keeps the frame budget for the scene that is
 * actually visible.
 *
 * The cost of that choice is a hard cut between scenes. The first attempt
 * covered the swap with an opaque cream panel, which looked worse than the
 * problem: caught on camera it is a blank frame, and on a large screen it
 * reads as a blink.
 *
 * What ships instead is a DIP. The outgoing scene fades down over its last
 * quarter-second and the incoming one fades up over its first, so the swap
 * happens while both are near zero. Same effect as a crossfade, one mounted
 * scene, and no separate element to get out of sync - the opacity is derived
 * from the same clock as everything else.
 *
 * `runId` is part of the scene key, so a restart genuinely remounts everything
 * and no animation survives into the new run.
 */

/** Fade lengths at each end of a scene, in milliseconds. */
const FADE_IN_MS = 260;
const FADE_OUT_MS = 300;

/** Scene opacity from the clock: up at the start, down at the end, 1 between. */
function sceneOpacity(withinMs: number, durationMs: number): number {
  const remaining = durationMs - withinMs;
  if (withinMs < FADE_IN_MS) return Math.max(0, withinMs / FADE_IN_MS);
  if (remaining < FADE_OUT_MS) return Math.max(0, remaining / FADE_OUT_MS);
  return 1;
}

const SCENES = {
  intro: IntroScene,
  dashboard: DashboardScene,
  insight: InsightScene,
  student: StudentScene,
  activity: ActivityScene,
  action: ActionScene,
  result: ResultScene,
  closing: ClosingScene,
} as const;

export function DemoPlayer({ recording = false }: { recording?: boolean }) {
  const {
    scene,
    index,
    sceneProgress,
    totalProgress,
    paused,
    runId,
    restart,
  } = useDemoController();

  // Derived from the clock rather than held in state, so it cannot get out of
  // step with the timeline and a skip re-runs the fade automatically.
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

      {/* Captions carry the narration for every scene except the two that are
          themselves a single sentence - a caption under the closing line would
          just be the line twice. */}
      {scene.id !== "intro" && scene.id !== "closing" ? (
        <Caption show={sceneProgress > 0.04}>{scene.narration}</Caption>
      ) : null}

      {/* Paused is the one piece of presenter state the room may see, because
          a frozen demo with no explanation looks broken. */}
      {paused ? (
        <div className="absolute bottom-9 right-11 z-50 rounded-full bg-nevo-near-black/78 px-6 py-3 text-[19px] font-semibold text-nevo-cream">
          Paused
        </div>
      ) : null}

      {/* Developer overlay - `/demo?recording=true` only, never in the room. */}
      {recording ? (
        <div className="absolute left-11 top-9 z-50 rounded-xl bg-nevo-near-black/82 px-5 py-3 font-mono text-[15px] leading-[1.6] text-nevo-cream">
          <div>
            scene {index + 1}/8 · {scene.id}
          </div>
          <div className="opacity-70">
            {Math.round(sceneProgress * 100)}% ·{" "}
            {Math.max(0, Math.round((scene.duration * (1 - sceneProgress)) / 1000))}s left
          </div>
          <div className="opacity-70">space pause · &larr;&rarr; step · R restart · F full</div>
        </div>
      ) : null}

      {/* Restart affordance for a presenter who has finished and wants the
          closing frame back. Invisible until hovered, so it cannot show up in
          a recording. */}
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

export { ConsoleFrame };
