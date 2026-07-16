import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Nevo combined lockup (icon + wordmark) — the primary brand mark for brand
 * moments (Welcome, You're In). Cropped from the padded 1080² brand asset to the
 * design's ~100×29 lockup box via an overflow window + oversized offset image
 * (glyph bbox x256–824 / y453–625 in the source). Fixed size by design.
 */
export function NevoLockup({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative h-[29px] w-[100px] overflow-hidden",
        className,
      )}
    >
      <Image
        src="/brand/nevo-logo-combined.png"
        alt="Nevo"
        width={181}
        height={181}
        priority={priority}
        className="absolute -top-[76px] -left-[43px] h-[181px] w-[181px] max-w-none"
      />
    </div>
  );
}
