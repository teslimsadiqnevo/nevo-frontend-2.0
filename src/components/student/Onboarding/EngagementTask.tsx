"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IllustrationWrapper } from "@/components/shared";
import { SequenceShell } from "./SequenceShell";

// The sequence Nevo demonstrates, then the student copies.
const PATTERN = [0, 2, 1, 3];

// Four distinct shapes in the Design System palette (navy, violet + two tints).
const SHAPES: { kind: "circle" | "square" | "triangle"; className: string }[] = [
  { kind: "circle", className: "rounded-full bg-nevo-navy" },
  { kind: "square", className: "rounded-[18px] bg-nevo-violet" },
  {
    kind: "triangle",
    className: "bg-[#c3c4e0] rounded-[8px] [clip-path:polygon(50%_6%,96%_92%,4%_92%)]",
  },
  { kind: "circle", className: "rounded-full bg-[#5b5f8f]" },
];

/**
 * Activity 3 — Short Interactive Engagement Task (UI/UX spec). Nevo plays a
 * short shape pattern, then the student copies it. Feedback is a neutral glow —
 * never evaluative. Generates the attention-pattern / light-working-memory
 * signal.
 */
export function EngagementTask({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<"demo" | "input">("demo");
  const [hint, setHint] = useState("Watch…");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [glow, setGlow] = useState<{ id: number; n: number }>({ id: -1, n: 0 });
  const tapsRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Play the demo sequence on mount, then hand over to the student.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    PATTERN.forEach((id, step) => {
      timers.push(
        setTimeout(
          () => {
            setActiveId(id);
            setGlow((g) => ({ id, n: g.n + 1 }));
            timers.push(setTimeout(() => setActiveId(null), 340));
          },
          600 + step * 620,
        ),
      );
    });
    timers.push(
      setTimeout(
        () => {
          setPhase("input");
          setHint("Now your turn");
        },
        600 + PATTERN.length * 620 + 200,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const tap = (i: number) => {
    if (phase !== "input") return;
    setGlow((g) => ({ id: i, n: g.n + 1 }));
    tapsRef.current += 1;
    // TODO(signals): trackEvent tap sequence, timing, attention drop-off.
    if (tapsRef.current >= PATTERN.length) {
      window.setTimeout(() => onCompleteRef.current?.(), 600);
    }
  };

  return (
    <SequenceShell
      filledDots={3}
      topRight={
        <IllustrationWrapper
          src="/illustrations/activity-engage.png"
          alt="A figure watching"
          width={998}
          height={1026}
          priority
          className="w-11"
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <p className="text-center text-[21px] font-semibold tracking-[-0.01em] text-nevo-near-black">
          Can you copy the pattern?
        </p>
        <p className="mt-2 min-h-5 text-center text-sm text-nevo-near-black/55">
          {hint}
        </p>

        <div className="mt-10 flex items-center justify-center gap-[22px]">
          {SHAPES.map((shape, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Shape ${i + 1}`}
              onClick={() => tap(i)}
              className="relative size-[72px] cursor-pointer"
            >
              <span
                className={cn(
                  "block size-[72px] transition-transform duration-150",
                  shape.className,
                  activeId === i && "scale-[1.08]",
                )}
              />
              {glow.id === i && (
                <span
                  key={glow.n}
                  className="pointer-events-none absolute -inset-1.5 rounded-[22px] border-[3px] border-nevo-navy motion-safe:animate-nevo-ring"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </SequenceShell>
  );
}
