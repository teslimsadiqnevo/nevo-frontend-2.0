import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Nevo lockup at stage scale.
 *
 * The shared `NevoLockup` is fixed at 100x29 - correct for the in-app brand
 * moments it was built for, and far too small for a 1920 stage. Scaling that
 * component with a transform would render the mark at 181px and then blow it
 * up, which is visibly soft on a projector.
 *
 * So this re-does the same crop at whatever size is asked for. The geometry is
 * the shared component's, and it comes from the asset: the padded 1080-square
 * brand file carries the glyph at x256-824, y453-625, so the lockup is 568x172
 * of actual mark inside a lot of white. Rendering the source at
 * `1080 * width/568` and offsetting by the bbox origin puts exactly the mark in
 * the window, at any size, sharp - a 620px lockup renders the source at 1179px,
 * barely above its native 1080.
 *
 * If the brand asset is ever re-exported with different padding, these four
 * numbers are the only thing to change, here and in `NevoLockup`.
 */

/** Glyph bounding box inside the 1080-square source. */
const SRC = 1080;
const BOX = { x: 256, y: 453, w: 568, h: 172 } as const;

export function DemoLockup({
  width,
  className,
  priority,
}: {
  /** Rendered width of the mark itself, in stage pixels. */
  width: number;
  className?: string;
  priority?: boolean;
}) {
  const k = width / BOX.w;
  const rendered = Math.round(SRC * k);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width, height: Math.round(BOX.h * k) }}
    >
      <Image
        src="/brand/nevo-logo-combined.png"
        alt="Nevo"
        width={rendered}
        height={rendered}
        priority={priority}
        className="absolute max-w-none"
        style={{
          width: rendered,
          height: rendered,
          left: -Math.round(BOX.x * k),
          top: -Math.round(BOX.y * k),
        }}
      />
    </div>
  );
}
