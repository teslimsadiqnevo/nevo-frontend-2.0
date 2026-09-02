"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Scene } from "@/lib/demo/timeline";

/**
 * The timeline engine.
 *
 * Timing is read from the WALL CLOCK, not accumulated from ticks. That
 * distinction was found the hard way: an earlier version added 50ms per
 * interval fire, and a backgrounded tab - which browsers throttle to roughly
 * one timer callback a second - ran the whole demo at a fifth of its intended
 * pace. A presenter who alt-tabs to their notes and comes back would have
 * found the demo minutes behind, with narration against the wrong scene.
 *
 * Reading `Date.now()` instead means throttling costs only smoothness: the
 * demo is wherever the clock says it should be the moment it repaints, and it
 * catches up by itself.
 *
 * TWO REPAINT TRIGGERS, deliberately. `requestAnimationFrame` gives the pan a
 * full 60fps, and a slow interval sits behind it as a backstop. rAF is parked
 * entirely in a hidden tab and can be starved by a struggling GPU driver, and
 * a demo whose clock depends on a single scheduler is one bad machine away
 * from freezing mid-sentence in front of an audience. Both callbacks do the
 * same thing - read the wall clock - so running both is harmless and costs one
 * cheap timer. Whichever fires, the position is correct.
 *
 * A single clock rather than a chain of per-scene `setTimeout`s, for the same
 * family of reasons: a chain drifts, cannot be paused mid-scene without
 * arithmetic, and leaves orphaned timers when the presenter skips.
 *
 * RESILIENCE, because this runs in front of an audience:
 *
 *   - the clock is the source of truth, so a dropped animation frame or a
 *     janky transition cannot strand the demo on a scene
 *   - every scene renders its content immediately and animates on top, so a
 *     failed animation degrades to a static, correct frame rather than a
 *     blank one
 *   - `restart` resets every piece of state, so the tenth run matches the first
 *   - nothing is persisted, so a refresh is a clean start rather than a
 *     resumed half-state
 *
 * Presenter keys are always live, even during autoplay: space pauses, arrows
 * step, R restarts, F fullscreens, Esc leaves.
 *
 * The timeline is a PARAMETER, not an import - the teacher and student demos
 * are different stories on the same engine, and the alternative was a second
 * copy of the clock with its own bugs.
 */

/**
 * Which scene a given elapsed time falls in.
 *
 * Module-level so the presenter controls can call it with a freshly-read
 * clock. They used to derive the next scene from the INDEX THIS RENDER
 * produced, and React does not re-render between two keypresses 80ms apart -
 * so a presenter tapping the arrow key five times advanced two scenes and
 * concluded the controls were broken. Reading the clock at call time makes
 * every press count, however fast they come.
 */
function indexAt(timeline: Scene[], ms: number): number {
  let acc = 0;
  for (let i = 0; i < timeline.length; i++) {
    acc += timeline[i].duration;
    if (ms < acc) return i;
  }
  return timeline.length - 1;
}

function offsetOf(timeline: Scene[], index: number): number {
  return timeline.slice(0, index).reduce((sum, s) => sum + s.duration, 0);
}

/** Backstop cadence when rAF is unavailable or parked. */
const BACKSTOP_MS = 100;

export interface DemoState {
  scene: Scene;
  index: number;
  /** 0..1 through the current scene, for per-scene animation timing. */
  sceneProgress: number;
  /** 0..1 through the whole demo, for the progress bar. */
  totalProgress: number;
  paused: boolean;
  /** Bumped on restart so scenes can key off it and remount cleanly. */
  runId: number;
}

export function useDemoController(timeline: Scene[]): DemoState & {
  next: () => void;
  previous: () => void;
  toggle: () => void;
  restart: () => void;
} {
  const total = timeline.reduce((sum, s) => sum + s.duration, 0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [runId, setRunId] = useState(0);

  /** Milliseconds banked before the current running stretch began. */
  const banked = useRef(0);
  /** When the current running stretch started, or null while paused. */
  const since = useRef<number | null>(null);

  // The loop is torn down while paused: a paused demo should not be driving
  // frames, and there is nothing to recompute.
  useEffect(() => {
    if (paused) return;
    if (since.current === null) since.current = Date.now();

    let frame = 0;
    const read = () => {
      const base = since.current === null ? 0 : Date.now() - since.current;
      setElapsed(Math.min(banked.current + base, total));
    };
    const loop = () => {
      read();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    // The backstop. Slow enough to be free, fast enough that the demo still
    // advances visibly if rAF is not running.
    const backstop = setInterval(read, BACKSTOP_MS);

    // Returning to a parked tab should land on the right frame immediately
    // rather than one stale one.
    const onVisible = () => {
      if (!document.hidden) read();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(backstop);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [paused, total]);

  const index = indexAt(timeline, elapsed);
  const scene = timeline[index];
  const within = elapsed - offsetOf(timeline, index);
  const sceneProgress = Math.max(0, Math.min(1, within / scene.duration));

  /** Move the clock, keeping the wall-clock reference consistent with it. */
  const seek = useCallback(
    (ms: number) => {
      banked.current = Math.max(0, Math.min(ms, total));
      since.current = Date.now();
      setElapsed(banked.current);
    },
    [total],
  );

  const goto = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(timeline.length - 1, i));
      seek(offsetOf(timeline, clamped));
    },
    [seek, timeline],
  );

  /** The clock right now, independent of what the last render saw. */
  const readNow = useCallback(() => {
    const base = since.current === null ? 0 : Date.now() - since.current;
    return Math.min(banked.current + base, total);
  }, [total]);

  const next = useCallback(
    () => goto(indexAt(timeline, readNow()) + 1),
    [goto, readNow, timeline],
  );
  const previous = useCallback(
    () => goto(indexAt(timeline, readNow()) - 1),
    [goto, readNow, timeline],
  );
  const toggle = useCallback(() => {
    setPaused((p) => {
      if (!p) {
        // Pausing: bank what has run so far and stop the reference.
        if (since.current !== null) banked.current += Date.now() - since.current;
        since.current = null;
      } else {
        // Resuming: start a fresh stretch from now.
        since.current = Date.now();
      }
      return !p;
    });
  }, []);

  const restart = useCallback(() => {
    banked.current = 0;
    since.current = Date.now();
    setElapsed(0);
    setPaused(false);
    // Forces every scene to remount, so no animation is left mid-flight.
    setRunId((r) => r + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          toggle();
          break;
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          previous();
          break;
        case "r":
        case "R":
          restart();
          break;
        case "f":
        case "F":
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen().catch(() => undefined);
          break;
        case "Escape":
          if (document.fullscreenElement) void document.exitFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, previous, restart, toggle]);

  return {
    scene,
    index,
    sceneProgress,
    totalProgress: elapsed / total,
    paused,
    runId,
    next,
    previous,
    toggle,
    restart,
  };
}
