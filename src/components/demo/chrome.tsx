"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The presentation layer: the pieces that sit over the console and tell the
 * audience where to look.
 *
 * Every one of these earns its place by directing attention. The brief's rule
 * is that each scene has ONE focal point, so these are used sparingly - a
 * caption and at most one emphasis per beat. A stage with a caption, a
 * spotlight, a callout and a moving cursor all at once has no focal point at
 * all, only noise.
 */

/**
 * The narration line. Large, high-contrast, bottom-anchored - the one piece of
 * text that must be readable from the back of a hall, so it is set at 30px on
 * a 1920 stage rather than at a UI size.
 *
 * It is the same string a voiceover would read, from the timeline, so the
 * captions and any future recording cannot drift apart.
 */
export function Caption({
  children,
  show = true,
}: {
  children: React.ReactNode;
  show?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 px-[110px] pb-[54px] pt-24",
        "bg-gradient-to-t from-nevo-near-black/72 via-nevo-near-black/45 to-transparent",
        "transition-opacity duration-700",
        show ? "opacity-100" : "opacity-0",
      )}
    >
      <p className="m-0 max-w-[1400px] text-[30px] font-medium leading-[1.42] tracking-[-0.011em] text-nevo-cream">
        {children}
      </p>
    </div>
  );
}

/**
 * A focus ring that finds its own target.
 *
 * The first version of this took stage coordinates, which meant guessing a
 * pixel box for an element living inside a frame that is itself scaled AND
 * panning. Two problems with that: the guess cannot be checked without
 * looking at it, and it silently goes wrong the moment the console's layout
 * changes - which, since this demo renders the real product, it eventually
 * will.
 *
 * Measuring the element instead makes the ring correct by construction. It
 * follows the pan, survives a re-scale, and if the element ever stops
 * existing the ring simply does not render rather than pointing at empty
 * cream.
 *
 * `deps` re-measures: pass the scene progress so the box tracks a moving pan.
 */
export function AnchoredRing({
  selector,
  show,
  label,
  padding = 10,
  progress,
}: {
  /** Queried within the document. First match wins. */
  selector: string;
  show: boolean;
  label?: string;
  padding?: number;
  /** Scene progress - re-measures as the pan moves the target. */
  progress: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  // Measured and written straight to the DOM. This runs on every frame of the
  // pan, and holding the box in state would re-render the scene - and its
  // console subtree - sixty times a second to move one absolutely-positioned
  // div. The same reason `ConsoleFrame` writes its own transform directly.
  useEffect(() => {
    const parent = host.current?.parentElement;
    const el = document.querySelector(selector);
    const node = ring.current;
    if (!node) return;

    if (!parent || !el) {
      node.style.opacity = "0";
      return;
    }
    const p = parent.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || p.width === 0) {
      node.style.opacity = "0";
      return;
    }
    // The stage is scaled as a whole, so divide back out to land in the
    // parent's own coordinate space rather than in screen pixels.
    const k = parent.offsetWidth / p.width;
    node.style.left = `${(r.left - p.left) * k - padding}px`;
    node.style.top = `${(r.top - p.top) * k - padding}px`;
    node.style.width = `${r.width * k + padding * 2}px`;
    node.style.height = `${r.height * k + padding * 2}px`;
    node.style.opacity = show ? "1" : "0";
  }, [selector, padding, show, progress]);

  return (
    <div ref={host} className="pointer-events-none absolute inset-0 z-20">
      <div
        ref={ring}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="absolute rounded-[16px] border-2 border-nevo-violet shadow-[0_0_0_6px_rgba(154,156,203,0.22)] transition-opacity duration-[600ms] ease-out"
      >
        {label ? (
          <span className="absolute -top-[46px] left-0 whitespace-nowrap rounded-full bg-nevo-navy px-4 py-2 text-[17px] font-semibold text-nevo-cream">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A number that counts up to its value.
 *
 * Driven by the scene's own progress rather than an internal timer, so a
 * presenter who skips backwards or pauses gets a value consistent with where
 * the clock is - an independent animation would keep running while paused and
 * finish at the wrong moment. Eased so it decelerates into the final figure
 * instead of stopping dead.
 */
export function CountUp({
  value,
  progress,
  suffix = "",
  /** Fraction of the scene over which the count runs. */
  window: win = 0.35,
}: {
  value: number;
  progress: number;
  suffix?: string;
  window?: number;
}) {
  const t = Math.max(0, Math.min(1, progress / win));
  const eased = 1 - Math.pow(1 - t, 3);
  return (
    <>
      {Math.round(value * eased)}
      {suffix}
    </>
  );
}

/**
 * The progress indicator. Deliberately faint and 3px tall: the audience should
 * be able to sense how far through they are without it competing with the
 * product.
 */
export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 z-30 h-[3px] bg-nevo-near-black/10"
    >
      <div
        className="h-full bg-nevo-navy/55 transition-[width] duration-200 ease-linear"
        style={{ width: `${Math.min(100, value * 100)}%` }}
      />
    </div>
  );
}

/**
 * Staggered reveal. A plain wrapper so scenes can bring cards in one after
 * another without each one hand-rolling a delay.
 *
 * IMPORTANT: the child is always rendered and only its opacity and offset are
 * animated. If the transition never runs - reduced motion, a stalled frame,
 * a browser that throttles the tab - the content is still on screen and
 * correct. Nothing in this demo is gated behind an animation completing.
 */
export function Reveal({
  show,
  delay = 0,
  children,
  className,
}: {
  show: boolean;
  /** Milliseconds. */
  delay?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "transition-all duration-[700ms] ease-out motion-reduce:transition-none",
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
      style={{ transitionDelay: show ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
