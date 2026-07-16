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
import { cn } from "@/lib/utils";
import { IllustrationWrapper } from "@/components/shared";
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

type Drag = { id: string; x: number; y: number; dx: number; dy: number };

/**
 * Activity 1 — Visual Sorting Task (UI/UX spec). Drag 6 category-neutral objects
 * into two zones. No right/wrong — every placement is accepted. Generates the
 * initial processing-channel / speed signal. Pointer-based so it works on touch
 * and mouse alike.
 */
export function VisualSortingTask({ onComplete }: { onComplete?: () => void }) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onPointerDown = (e: React.PointerEvent, card: CardDef) => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    setDrag({ id: card.id, x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top });
  };

  // While a card is held, track the pointer on the window so movement continues
  // even once the finger/cursor leaves the card (touch + mouse).
  const dragId = drag?.id ?? null;
  useEffect(() => {
    if (!dragId) return;

    const hit = (x: number, y: number): string | null => {
      for (const z of ZONES) {
        const r = zoneRefs.current[z.key]?.getBoundingClientRect();
        if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return z.key;
      }
      return null;
    };

    const move = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      setOver(hit(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      const zone = hit(e.clientX, e.clientY);
      if (zone) {
        setPlaced((p) => {
          const next = { ...p, [dragId]: zone };
          // TODO(signals): trackEvent placement + timing/hesitation/sequence.
          if (Object.keys(next).length === CARDS.length) {
            window.setTimeout(() => onCompleteRef.current?.(), 700);
          }
          return next;
        });
      }
      setDrag(null);
      setOver(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragId]);

  const loose = CARDS.filter((c) => !placed[c.id]);

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
        {/* Scattered draggable cards */}
        <div className="relative min-h-0 flex-1">
          {loose.map((card) => {
            const isDragging = drag?.id === card.id;
            const CardIcon = card.Icon;
            return (
              <button
                key={card.id}
                type="button"
                aria-label={`Sort the ${card.label}`}
                onPointerDown={(e) => onPointerDown(e, card)}
                className="absolute flex size-[66px] touch-none items-center justify-center rounded-[12px] bg-nevo-cream-elevated text-nevo-navy shadow-elevation-1"
                style={
                  isDragging
                    ? {
                        position: "fixed",
                        left: drag.x - drag.dx,
                        top: drag.y - drag.dy,
                        transform: "scale(1.06)",
                        cursor: "grabbing",
                        zIndex: 50,
                      }
                    : {
                        left: card.x,
                        top: card.y,
                        transform: `rotate(${card.rot}deg)`,
                        cursor: "grab",
                      }
                }
              >
                <CardIcon className="size-8" strokeWidth={2} />
              </button>
            );
          })}
        </div>

        {/* Drop zones */}
        <div className="flex shrink-0 justify-center gap-3.5 px-4 pb-6">
          {ZONES.map((z) => {
            const items = CARDS.filter((c) => placed[c.id] === z.key);
            const isOver = over === z.key;
            return (
              <div
                key={z.key}
                ref={(el) => {
                  zoneRefs.current[z.key] = el;
                }}
                className={cn(
                  "flex min-h-[118px] flex-1 flex-col items-center rounded-[14px] border-2 border-dashed px-2.5 py-3.5 transition-colors",
                  isOver
                    ? "border-nevo-violet bg-nevo-violet/15"
                    : "border-nevo-violet/70",
                )}
              >
                <span className="text-[17px] font-medium text-nevo-near-black">
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
              </div>
            );
          })}
        </div>
      </div>
    </SequenceShell>
  );
}
