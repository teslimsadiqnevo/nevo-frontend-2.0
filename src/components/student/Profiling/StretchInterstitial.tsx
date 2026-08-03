"use client";

import { useEffect, useRef } from "react";
import { IllustrationWrapper } from "@/components/shared";
import { ProfilingShell } from "./ProfilingShell";

/** The mandatory reset between modules: 15 seconds, then auto-advance. */
const STRETCH_MS = 15_000;

/**
 * Stretch interstitial (BP-INT) - a mandatory 15-second cognitive reset after
 * every profiling module on first run. Breathing figure, "Take a breath", and a
 * soft-violet ring that fills clockwise over 15s before auto-advancing. No skip
 * on first run; reduced motion parks the ring partway with no sweep. The pause
 * is the system's ask, so the flow (not the student) ends it.
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
  const c = 2 * Math.PI * r;

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
          className="mt-6 -rotate-90"
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(154,156,203,0.15)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#9a9ccb"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            className="motion-safe:[animation:nevo-ring-fill_15s_linear_forwards] motion-reduce:[stroke-dashoffset:calc(var(--nevo-ring-c)*0.45)]"
            style={{ "--nevo-ring-c": c, strokeDashoffset: c } as React.CSSProperties}
          />
        </svg>
      </div>
    </ProfilingShell>
  );
}
