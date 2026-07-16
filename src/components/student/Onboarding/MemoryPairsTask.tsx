"use client";

import { useEffect, useRef, useState } from "react";
import { Fish, Star, Sun, TreePine, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SequenceShell } from "./SequenceShell";

const ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  tree: TreePine,
  fish: Fish,
  star: Star,
};

// Four pairs in a fixed layout (matches the design; deterministic).
const ORDER = ["sun", "tree", "fish", "star", "fish", "star", "sun", "tree"];

// Subtle dot pattern on the face-down (violet) cards.
const FACE_DOWN_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Ccircle cx='6' cy='6' r='1.6' fill='%23f7f1e6' fill-opacity='0.5'/%3E%3C/svg%3E\")";

/**
 * Activity 4 — Working-Memory-Heavy Mini Task (UI/UX spec). A 4-pair matching
 * grid: flip two cards; matches stay revealed, misses flip back gently. No move
 * counter, timer, or "tries remaining" pressure. Generates the working-memory /
 * cognitive-load signal.
 */
export function MemoryPairsTask({ onComplete }: { onComplete?: () => void }) {
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Record<number, boolean>>({});
  const [lock, setLock] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const tap = (i: number) => {
    if (lock || matched[i] || flipped.includes(i)) return;
    const next = [...flipped, i];
    if (next.length < 2) {
      setFlipped(next);
      return;
    }
    setFlipped(next);
    setLock(true);
    const [a, b] = next;
    // TODO(signals): trackEvent flip/match sequence, timing, cognitive load.
    if (ORDER[a] === ORDER[b]) {
      timer.current = setTimeout(() => {
        setMatched((m) => {
          const nm = { ...m, [a]: true, [b]: true };
          if (Object.keys(nm).length === ORDER.length) {
            window.setTimeout(() => onCompleteRef.current?.(), 700);
          }
          return nm;
        });
        setFlipped([]);
        setLock(false);
      }, 380);
    } else {
      timer.current = setTimeout(() => {
        setFlipped([]);
        setLock(false);
      }, 800);
    }
  };

  return (
    <SequenceShell filledDots={4}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <p className="mb-7 text-center text-[21px] font-semibold tracking-[-0.01em] text-nevo-near-black">
          Find the matching pairs
        </p>

        <div className="grid grid-cols-[repeat(4,80px)] gap-2">
          {ORDER.map((key, i) => {
            const faceUp = flipped.includes(i) || matched[i];
            const isMatched = !!matched[i];
            const Icon = ICONS[key];
            return (
              <button
                key={i}
                type="button"
                aria-label={faceUp ? `${key} card` : "Face-down card"}
                onClick={() => tap(i)}
                className={cn(
                  "flex size-20 cursor-pointer items-center justify-center rounded-[12px] transition-shadow",
                  faceUp
                    ? "bg-nevo-cream-elevated motion-safe:animate-nevo-reveal"
                    : "bg-nevo-violet",
                )}
                style={{
                  boxShadow: isMatched
                    ? "0 0 0 2px #3b3f6e, 0 2px 10px rgba(59, 63, 110, 0.25)"
                    : "0 2px 8px rgba(0, 0, 0, 0.06)",
                  ...(faceUp
                    ? null
                    : {
                        backgroundImage: FACE_DOWN_PATTERN,
                        backgroundSize: "12px 12px",
                      }),
                }}
              >
                {faceUp && <Icon className="size-10 text-nevo-navy" strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      </div>
    </SequenceShell>
  );
}
