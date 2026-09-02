"use client";

import { cn } from "@/lib/utils";

/**
 * The student app in a tablet, on a 1920x1080 stage.
 *
 * The student frames are drawn at three breakpoints - mobile 375x812, tablet
 * 820x1112, desktop 1280x832 - and this is the tablet one. It does not fit the
 * stage at native size (1112 > 1080), so the device renders at its true
 * viewport and is scaled down as a whole. Scaling the frame rather than
 * reflowing the app is the point: at 820 wide the shell shows its collapsed
 * sidebar and the lesson player renders bare, exactly as it would on a real
 * device, and the audience is looking at the product's own tablet layout
 * rather than a desktop build squeezed into a bezel.
 *
 * Portrait, held upright, occupying the left of the stage - which leaves the
 * right for the adaptation commentary. That split is the whole composition:
 * the tablet is what happened, the panel beside it is what it means.
 */

const VIEWPORT_W = 820;
const VIEWPORT_H = 1112;

export function TabletFrame({
  /** Rendered height on the stage. The width follows from the aspect. */
  height = 880,
  children,
  className,
}: {
  height?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const scale = height / VIEWPORT_H;
  const width = Math.round(VIEWPORT_W * scale);

  return (
    <div
      className={cn("relative flex-none", className)}
      style={{ width: width + 28, height: height + 28 }}
    >
      {/* Bezel. Deliberately thin and neutral - a heavy photoreal device mock
          dates fast and competes with the screen it is holding. */}
      <div
        className="absolute inset-0 rounded-[38px] bg-nevo-near-black/88 shadow-[0_36px_90px_rgba(43,43,47,0.34)]"
        aria-hidden="true"
      />
      <div
        className="absolute overflow-hidden rounded-[26px] bg-nevo-cream"
        style={{ left: 14, top: 14, width, height }}
      >
        <div
          style={{
            width: VIEWPORT_W,
            height: VIEWPORT_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export { VIEWPORT_W as TABLET_W, VIEWPORT_H as TABLET_H };
