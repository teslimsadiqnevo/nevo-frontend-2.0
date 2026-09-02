"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A fixed 1920x1080 stage, scaled to whatever screen it lands on.
 *
 * WHY A FIXED STAGE RATHER THAN A RESPONSIVE LAYOUT. This has to look
 * identical on a 4K projector, a 1440p laptop and inside a 1920x1080 screen
 * recording. A responsive layout gives all three a DIFFERENT composition, so
 * spacing tuned on one is wrong on the others and a recording crops
 * unpredictably. Composing once at 1920x1080 and scaling uniformly means what
 * is tuned here is what is projected, and the 16:9 recording frame is exact.
 *
 * The scale is applied to a wrapper rather than to individual elements, so
 * text scales with the layout and nothing reflows at a breakpoint mid-demo.
 *
 * Presentation hygiene, all of it required by a live room: no scrollbars, no
 * text selection to accidentally highlight, no drag-and-drop of an image out
 * of the page, and no browser chrome inside the frame.
 */

const STAGE_W = 1920;
const STAGE_H = 1080;

export function DemoStage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // A zero measurement means the window has no usable size yet - a hidden
      // tab, a detached frame, a browser mid-restore. Scaling by it would set
      // scale(0) and blank the stage, and on a conference machine that reads
      // as the demo having crashed. Keep the last good scale instead; the
      // resize listener will correct it the moment a real size arrives.
      if (w < 1 || h < 1) return;
      // Contain, never cover: the whole composition must be visible, with
      // letterboxing rather than a cropped edge.
      setScale(Math.min(w / STAGE_W, h / STAGE_H));
    };
    fit();
    window.addEventListener("resize", fit);
    // Some environments report a real size only after first paint.
    const settle = setTimeout(fit, 120);
    return () => {
      window.removeEventListener("resize", fit);
      clearTimeout(settle);
    };
  }, []);

  return (
    <div
      ref={frame}
      className="fixed inset-0 flex select-none items-center justify-center overflow-hidden bg-nevo-near-black"
    >
      <div
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
        className="relative flex-none overflow-hidden bg-nevo-cream"
      >
        {children}
      </div>
    </div>
  );
}

export { STAGE_W, STAGE_H };
