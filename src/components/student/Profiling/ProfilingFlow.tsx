"use client";

import { useRef, useState } from "react";
import { baselineApi } from "@/lib/api";
import { ONBOARDING_SIGNAL_TYPES } from "@/lib/constants";
import { bandForYearLabel, gridSpanConfig } from "@/lib/profiling/bands";
import { BaselineCapture, reduceGridSpan } from "@/lib/profiling/capture";
import { MOCK_STUDENT } from "@/components/student/Shell/studentNav";
import { randomId } from "@/lib/utils";
import type { TrackEvent } from "@/hooks";
import { GridSpanModule } from "./GridSpanModule";
import { ProfilingIntro } from "./ProfilingIntro";
import { StretchInterstitial } from "./StretchInterstitial";

/**
 * The Baseline Cognitive Profiling flow (SCRUM-104) - onboarding Phase C.
 * Intro → Module 1 (Spatial Grid Span) → stretch → [Modules 2-4 land next
 * slice] → Complete. One BaselineCapture spans the run; on completion the raw
 * stream is reduced to a feature vector, submitted, and purged - raw
 * interaction data never leaves the device.
 *
 * The age band comes from the student profile (mock: "Year 4" → P4-6) and
 * drives grid sizes, content and targets; the shells are shared.
 */
export function ProfilingFlow({
  track,
  onDone,
}: {
  track?: TrackEvent;
  /** The whole flow is complete - carry on to the Consent Gate. */
  onDone: () => void;
}) {
  // TODO(n1b): insert m2/stretch2/m3/stretch3/m4 when Modules 2-4 land.
  const [phase, setPhase] = useState<"intro" | "m1" | "stretch1" | "complete">(
    "intro",
  );
  const band = bandForYearLabel(MOCK_STUDENT.subtitle);
  const [capture] = useState(() => new BaselineCapture(`baseline-${randomId()}`));
  const submitted = useRef(false);

  const finishRun = () => {
    if (!submitted.current) {
      submitted.current = true;
      const features = [reduceGridSpan(capture)];
      const c = capture;
      // Fire-and-forget: the run never blocks on the network. Raw stream is
      // purged regardless - only the reduced vector is ever transmitted.
      // TODO(api): retry/queue once the baseline contract lands.
      baselineApi
        .submit(c.sessionId, features)
        .catch(() => {})
        .finally(() => void c.purge());
      track?.(ONBOARDING_SIGNAL_TYPES.BASELINE_SUBMITTED, {
        modules: features.map((f) => f.module),
      });
    }
    setPhase("complete");
  };

  if (phase === "intro") {
    return (
      <ProfilingIntro
        mode="intro"
        onContinue={() => {
          track?.(ONBOARDING_SIGNAL_TYPES.BASELINE_MODULE_START, {
            module: "grid_span",
            band,
          });
          capture.record("run_start", { band });
          setPhase("m1");
        }}
      />
    );
  }

  if (phase === "m1") {
    return (
      <GridSpanModule
        config={gridSpanConfig(band)}
        capture={capture}
        onComplete={() => {
          track?.(ONBOARDING_SIGNAL_TYPES.BASELINE_MODULE_COMPLETE, {
            module: "grid_span",
          });
          setPhase("stretch1");
        }}
      />
    );
  }

  if (phase === "stretch1") {
    return (
      <StretchInterstitial filled={1} active={1} onDone={finishRun} />
    );
  }

  return <ProfilingIntro mode="complete" onContinue={onDone} />;
}
