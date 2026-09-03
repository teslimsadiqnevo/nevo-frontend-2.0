"use client";

import { useEffect } from "react";
import { installDemoApi } from "@/lib/demo/adminDemoApi";
import { ADMIN_TIMELINE } from "@/lib/demo/adminTimeline";
import { DemoStage } from "./DemoStage";
import { useDemoController } from "./DemoController";
import { Caption, ProgressBar } from "./chrome";
import {
  AdminClosingScene,
  AdminComplianceScene,
  AdminIntroScene,
  AdminLogScene,
  AdminOverviewScene,
  AdminRegisterScene,
  AdminRetentionScene,
  AdminZeroTagScene,
} from "./admin/AdminScenes";

/**
 * The admin film. Third of three, on the same engine.
 *
 * The one thing this player does that the other two do not is install a fetch
 * shim before any admin component mounts. The admin console has no fixture
 * fallback - every screen calls the API and renders an error card when it
 * 401s - so without this the film would be two minutes of "We couldn't load".
 * The patch is removed on unmount and cannot outlive the route.
 */

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
  intro: AdminIntroScene,
  overview: AdminOverviewScene,
  log: AdminLogScene,
  register: AdminRegisterScene,
  zerotag: AdminZeroTagScene,
  compliance: AdminComplianceScene,
  retention: AdminRetentionScene,
  closing: AdminClosingScene,
};

/**
 * Installs the demo's canned API for the life of the route.
 *
 * Runs before any scene mounts an admin component: the intro holds for six
 * seconds and scenes mount one at a time, so the first real fetch is a long
 * way off.
 */
function useDemoApi() {
  useEffect(() => installDemoApi(), []);
}

export function AdminDemoPlayer({ recording = false }: { recording?: boolean }) {
  useDemoApi();
  const { scene, index, sceneProgress, totalProgress, paused, runId, restart } =
    useDemoController(ADMIN_TIMELINE);

  const withinMs = sceneProgress * scene.duration;
  const opacity = sceneOpacity(withinMs, scene.duration);
  const Scene = SCENES[scene.id];

  return (
    <DemoStage>
      <ProgressBar value={totalProgress} />

      <div key={`${runId}-${scene.id}`} className="absolute inset-0" style={{ opacity }}>
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
            scene {index + 1}/{ADMIN_TIMELINE.length} · {scene.id}
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
