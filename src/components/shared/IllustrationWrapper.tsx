import Image from "next/image";

import { cn } from "@/lib/utils";

export type IllustrationMotion = "none" | "breathe" | "sway";

/**
 * IllustrationWrapper (Design System v2 §12; FE Architecture §1) — the single
 * entry point for rendering Section 12 illustrations. Handles next/image sizing
 * and the optional calm animation, which is gated behind `motion-safe` so it
 * never plays under reduced motion.
 *
 * Assets are static PNGs, so "breathing/stretching" are expressed as a gentle
 * transform on the whole illustration within the Design System timing band.
 */
export function IllustrationWrapper({
  src,
  alt,
  width,
  height,
  className,
  motion = "none",
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  motion?: IllustrationMotion;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "h-auto max-w-full",
        motion === "breathe" && "motion-safe:animate-nevo-breathe",
        motion === "sway" && "motion-safe:animate-nevo-sway",
        className,
      )}
    />
  );
}
