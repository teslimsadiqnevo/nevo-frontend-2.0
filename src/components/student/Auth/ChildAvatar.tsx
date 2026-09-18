import { cn } from "@/lib/utils";
import { SHAPE_COUNT } from "@/lib/auth/deviceRoster";

/**
 * A remembered child's avatar: a soft geometric shape on a quiet tint.
 *
 * 28c: *"Avatars are soft geometric shapes, never a face; the enlarged first
 * name is the primary identifier and the shape is a secondary cue for a child
 * still learning to read."* Never a photograph and never initials - this is a
 * pre-authentication screen that anybody in the room can see, and a face or a
 * pair of initials on it identifies a child to a stranger.
 *
 * The frame's own note: *"Shapes are quiet cream placeholders; real avatar
 * artwork drops into the same tiles."* So this is the tile, not the artwork.
 *
 * WHICH SHAPE IS STORED, NOT DERIVED FROM POSITION - see `deviceRoster`. The
 * frame assigns by list index, which would move a child's shape every time
 * another child signed in, and a cue that moves is not a cue.
 */

/** The frame's six, in its order. `currentColor` is set by the wrapper. */
const SHAPES = [
  <circle key="circle" cx="12" cy="12" r="8.5" />,
  <rect key="rsquare" x="4" y="4" width="16" height="16" rx="6" />,
  <rect key="pill" x="2.5" y="7" width="19" height="10" rx="5" />,
  <path
    key="diamond"
    d="M12 4 20 12 12 20 4 12Z"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinejoin="round"
  />,
  <path
    key="triangle"
    d="M12 5.5 19.5 18 4.5 18Z"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinejoin="round"
  />,
  <path
    key="hex"
    d="M12 4 19 8 19 16 12 20 5 16 5 8Z"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinejoin="round"
  />,
];

/**
 * The frame's tints, which are `nevo-violet` and `nevo-navy` at six opacities.
 * Kept as explicit classes rather than composed at runtime, because Tailwind
 * cannot see a class name it did not find in the source.
 */
const TINTS = [
  "bg-nevo-violet/30",
  "bg-nevo-navy/15",
  "bg-nevo-violet/25",
  "bg-nevo-navy/20",
  "bg-nevo-violet/35",
  "bg-nevo-navy/10",
];

export function ChildAvatar({
  shapeIndex,
  className,
}: {
  shapeIndex: number;
  className?: string;
}) {
  // A stored index from an older or hand-edited roster must not blank the tile.
  const i = ((Math.trunc(shapeIndex) % SHAPE_COUNT) + SHAPE_COUNT) % SHAPE_COUNT;

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-nevo-cream-elevated",
        TINTS[i],
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-[46%]"
        aria-hidden
      >
        {SHAPES[i]}
      </svg>
    </span>
  );
}
