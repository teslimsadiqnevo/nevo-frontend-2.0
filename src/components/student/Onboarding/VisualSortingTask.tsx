"use client";

import { useEffect, useRef, useState } from "react";
import {
  Armchair,
  Coffee,
  Fish,
  Lamp,
  Sun,
  TreePine,
  type LucideIcon,
} from "lucide-react";
import { cn, now } from "@/lib/utils";
import { IllustrationWrapper } from "@/components/shared";
import { ONBOARDING_SIGNAL_TYPES } from "@/lib/constants";
import type { TrackEvent } from "@/hooks";
import { SequenceShell } from "./SequenceShell";

type CardDef = { id: string; label: string; Icon: LucideIcon; x: number; y: number; rot: number };

// Category-neutral objects, scattered (non-grid) with a slight hand-placed tilt.
const CARDS: CardDef[] = [
  { id: "sun", label: "sun", Icon: Sun, x: 30, y: 14, rot: -5 },
  { id: "cup", label: "cup", Icon: Coffee, x: 250, y: 6, rot: 4 },
  { id: "tree", label: "tree", Icon: TreePine, x: 130, y: 70, rot: -3 },
  { id: "chair", label: "chair", Icon: Armchair, x: 270, y: 96, rot: 6 },
  { id: "fish", label: "fish", Icon: Fish, x: 40, y: 128, rot: 3 },
  { id: "lamp", label: "lamp", Icon: Lamp, x: 180, y: 156, rot: -6 },
];

const ZONES = [
  { key: "inside", label: "Inside" },
  { key: "outside", label: "Outside" },
] as const;

/**
 * Activity 1 — Visual Sorting Task (UI/UX spec · SCRUM-94.1). Sort 6
 * category-neutral objects into two zones. No right/wrong — every placement is
 * accepted. Generates the initial processing-channel / speed signal.
 *
 * Interaction is **tap-to-select, then tap-a-zone** (the gesture-vocabulary
 * decision: tap is the universal interaction; drag is reserved for the solver's
 * framed manipulative). Two discrete taps, both large, both unambiguous — clean
 * tap latency, no aborted-gesture noise in the screen that seeds the student's
 * baseline. Tapping the selected card again releases it, so a change of mind is
 * a real, recorded decision rather than a stuck state.
 */
export function VisualSortingTask({
  onComplete,
  track,
}: {
  onComplete?: () => void;
  track?: TrackEvent;
}) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  const trackRef = useRef(track);
  const startedAt = useRef(0);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    trackRef.current = track;
  }, [onComplete, track]);
  useEffect(() => {
    startedAt.current = now();
    trackRef.current?.(ONBOARDING_SIGNAL_TYPES.ACTIVITY_START, {
      activity: "visual_sorting",
    });
  }, []);

  const select = (id: string) =>
    setSelectedId((s) => (s === id ? null : id));

  const place = (zone: string) => {
    if (!selectedId || placed[selectedId]) return;
    const id = selectedId;
    const order = Object.keys(placed).length + 1;
    setPlaced((p) => ({ ...p, [id]: zone }));
    setSelectedId(null);
    trackRef.current?.(ONBOARDING_SIGNAL_TYPES.SORT_PLACEMENT, {
      item: id,
      zone,
      order,
      msSinceStart: now() - startedAt.current,
    });
    if (order === CARDS.length) {
      trackRef.current?.(ONBOARDING_SIGNAL_TYPES.ACTIVITY_COMPLETE, {
        activity: "visual_sorting",
        totalMs: now() - startedAt.current,
      });
      window.setTimeout(() => onCompleteRef.current?.(), 700);
    }
  };

  const loose = CARDS.filter((c) => !placed[c.id]);
  const armed = selectedId != null;
  const allPlaced = loose.length === 0;

  return (
    <SequenceShell
      filledDots={1}
      illustration={
        <IllustrationWrapper
          src="/illustrations/activity-sorting.png"
          alt="A friendly figure leaning in"
          width={1031}
          height={782}
          priority
          className="w-[76px]"
        />
      }
      prompt="Where do these belong?"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* The affordance is what makes the second tap unambiguous. */}
        <p
          className={cn(
            "shrink-0 text-center text-[15px] leading-[1.4] transition-colors duration-150",
            armed ? "text-nevo-navy" : "text-nevo-near-black/60",
          )}
        >
          {allPlaced
            ? "That's all of them."
            : armed
              ? "Now tap where it belongs"
              : "Tap one to pick it up"}
        </p>

        {/* Scattered tappable cards */}
        <div className="relative mt-2 min-h-0 flex-1">
          {loose.map((card) => {
            const on = selectedId === card.id;
            const CardIcon = card.Icon;
            return (
              <button
                key={card.id}
                type="button"
                aria-label={`Sort the ${card.label}`}
                aria-pressed={on}
                onClick={() => select(card.id)}
                className={cn(
                  "absolute flex size-[66px] cursor-pointer items-center justify-center rounded-[12px] bg-nevo-cream-elevated text-nevo-navy transition-[box-shadow,transform] duration-150 active:scale-[0.97]",
                  on
                    ? "shadow-[0_0_0_2.5px_#3b3f6e,0_8px_24px_rgba(0,0,0,0.16)]"
                    : "shadow-elevation-1",
                )}
                style={{
                  left: card.x,
                  top: card.y,
                  transform: `rotate(${card.rot}deg)${on ? " scale(1.06)" : ""}`,
                }}
              >
                <CardIcon className="size-8" strokeWidth={2} />
              </button>
            );
          })}
        </div>

        {/* Zones — quiet cream tiles at rest, unmistakably armed once a card is
            selected. Solid surfaces (the dashed drop affordance no longer applies). */}
        <div className="flex shrink-0 justify-center gap-3.5 px-4 pb-6">
          {ZONES.map((z) => {
            const items = CARDS.filter((c) => placed[c.id] === z.key);
            return (
              <button
                key={z.key}
                type="button"
                onClick={() => place(z.key)}
                className={cn(
                  "flex min-h-[118px] flex-1 flex-col items-center rounded-[14px] bg-nevo-cream-elevated px-2.5 py-3.5 transition-[box-shadow] duration-150",
                  armed
                    ? "cursor-pointer shadow-[inset_0_0_0_2px_#3b3f6e,0_8px_24px_rgba(0,0,0,0.16)]"
                    : "cursor-default shadow-elevation-1",
                )}
              >
                <span
                  className={cn(
                    "text-[17px] text-nevo-near-black transition-[font-weight] duration-150",
                    armed ? "font-semibold" : "font-medium",
                  )}
                >
                  {z.label}
                </span>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {items.map((c) => {
                    const ItemIcon = c.Icon;
                    return (
                      <ItemIcon
                        key={c.id}
                        className="size-[26px] text-nevo-navy motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200"
                        strokeWidth={2}
                      />
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SequenceShell>
  );
}
