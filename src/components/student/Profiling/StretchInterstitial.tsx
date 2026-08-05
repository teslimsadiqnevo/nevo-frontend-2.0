"use client";

import { useEffect, useRef } from "react";
import { IllustrationWrapper } from "@/components/shared";
import { ProfilingShell } from "./ProfilingShell";

/** The mandatory reset between modules: 15 seconds, then auto-advance. */
const STRETCH_MS = 15_000;

/**
 * Stretch interstitial (BP-INT) - a mandatory 15-second cognitive reset after
 * every profiling module on first run. Breathing figure, "Take a breath", and a
 * circle that slowly fills with "water" bottom-to-top over 15s (drifting wave
 * surface) before auto-advancing. No skip on first run; reduced motion parks
 * the level partway with no rise or drift. The pause is the system's ask, so
 * the flow (not the student) ends it.
 */
export function StretchInterstitial({
  filled,
  active,
  onDone,
}: {
  filled: number;
  active: number;
  onDone: () => void;
}) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), STRETCH_MS);
    return () => clearTimeout(t);
  }, []);

  const size = 56;
  const stroke = 3;
  const r = (size - stroke) / 2;

  return (
    <ProfilingShell filled={filled} active={active}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <IllustrationWrapper
          src="/illustrations/break-movement.png"
          alt="A Nevo figure stretching gently"
          width={1024}
          height={1536}
          priority
          motion="breathe"
          className="h-[140px] w-auto sm:h-[180px]"
        />
        <p className="mt-4 text-[17px] font-medium tracking-[0.01em] text-nevo-violet sm:text-lg">
          Take a breath
        </p>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="mt-6"
          aria-hidden
        >
          <defs>
            <clipPath id="nv-breath-water">
              <circle cx={size / 2} cy={size / 2} r={r - stroke / 2} />
            </clipPath>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(154,156,203,0.3)"
            strokeWidth={stroke}
          />
          <g clipPath="url(#nv-breath-water)">
            <g className="[transform:translateY(100%)] motion-safe:[animation:nevo-water-rise_15s_linear_forwards] motion-reduce:[transform:translateY(55%)]">
              <path
                d="M0 8 Q14 2 28 8 T56 8 T84 8 T112 8 T140 8 T168 8 V64 H0 Z"
                fill="rgba(154,156,203,0.55)"
                className="motion-safe:[animation:nevo-water-drift_3.2s_linear_infinite]"
              />
            </g>
          </g>
        </svg>
      </div>
    </ProfilingShell>
  );
}
