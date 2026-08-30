"use client";

import { useRef, useState } from "react";
import { baselineApi } from "@/lib/api";
import { ONBOARDING_SIGNAL_TYPES } from "@/lib/constants";
import { bandForYearLabel, gridSpanConfig } from "@/lib/profiling/bands";
import {
  BaselineCapture,
  reduceGridSpan,
  reduceTrialModule,
} from "@/lib/profiling/capture";
import { MOCK_STUDENT } from "@/components/student/Shell/studentNav";
import { randomId } from "@/lib/utils";
import type { TrackEvent } from "@/hooks";
import { DomainProbeModule } from "./DomainProbeModule";
import { GridSpanModule } from "./GridSpanModule";
import { PatternFlankerModule } from "./PatternFlankerModule";
import { ProfilingIntro } from "./ProfilingIntro";
import { SentenceDotModule } from "./SentenceDotModule";
import { StretchInterstitial } from "./StretchInterstitial";

/**
 * The Baseline Cognitive Profiling flow (SCRUM-104) - onboarding Phase C.
 * Intro → M1 Grid Span → stretch → M2 Pattern/Flanker → stretch → M3
 * Sentence/Dot → stretch → M4 Domain Probe → Complete. One BaselineCapture
 * spans the run; on completion the raw stream is reduced to a feature vector,
 * submitted, and purged - raw interaction data never leaves the device.
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
  const [phase, setPhase] = useState<
    | "intro"
    | "m1"
    | "stretch1"
    | "m2"
    | "stretch2"
    | "m3"
    | "stretch3"
    | "m4"
    | "complete"
  >("intro");
  const band = bandForYearLabel(MOCK_STUDENT.subtitle);
  const [capture] = useState(() => new BaselineCapture(`baseline-${randomId()}`));
  const submitted = useRef(false);

  const finishRun = () => {
    if (!submitted.current) {
      submitted.current = true;
      const features = [
        reduceGridSpan(capture),
        reduceTrialModule(capture, "pattern_flanker"),
        reduceTrialModule(capture, "sentence_dot"),
        reduceTrialModule(capture, "domain_probe"),
      ];
      const c = capture;
      // Fire-and-forget: the run never blocks on the network. Raw stream is
      // purged regardless - only the reduced vector is ever transmitted.
      // TODO(api): `/api/baseline/submit` is deployed; add retry/queue.
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

  const startSignal = (module: string) =>
    track?.(ONBOARDING_SIGNAL_TYPES.BASELINE_MODULE_START, { module, band });
  const completeSignal = (module: string) =>
    track?.(ONBOARDING_SIGNAL_TYPES.BASELINE_MODULE_COMPLETE, { module });

  if (phase === "stretch1") {
    return (
      <StretchInterstitial
        filled={1}
        active={1}
        onDone={() => {
          startSignal("pattern_flanker");
          setPhase("m2");
        }}
      />
    );
  }

  if (phase === "m2") {
    return (
      <PatternFlankerModule
        band={band}
        capture={capture}
        onComplete={() => {
          completeSignal("pattern_flanker");
          setPhase("stretch2");
        }}
      />
    );
  }

  if (phase === "stretch2") {
    return (
      <StretchInterstitial
        filled={2}
        active={2}
        onDone={() => {
          startSignal("sentence_dot");
          setPhase("m3");
        }}
      />
    );
  }

  if (phase === "m3") {
    return (
      <SentenceDotModule
        band={band}
        capture={capture}
        onComplete={() => {
          completeSignal("sentence_dot");
          setPhase("stretch3");
        }}
      />
    );
  }

  if (phase === "stretch3") {
    return (
      <StretchInterstitial
        filled={3}
        active={3}
        onDone={() => {
          startSignal("domain_probe");
          setPhase("m4");
        }}
      />
    );
  }

  if (phase === "m4") {
    return (
      <DomainProbeModule
        band={band}
        capture={capture}
        onComplete={() => {
          completeSignal("domain_probe");
          finishRun();
        }}
      />
    );
  }

  return <ProfilingIntro mode="complete" onContinue={onDone} />;
}
