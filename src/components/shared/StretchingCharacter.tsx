import { IllustrationWrapper } from "./IllustrationWrapper";

/**
 * Stretching character (Design System v2 §12). Movement break — a gentle sway
 * cueing the student to move. Motion is gated behind `motion-safe`.
 */
export function StretchingCharacter({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <IllustrationWrapper
      src="/illustrations/break-movement.png"
      alt="A figure gently stretching"
      width={1024}
      height={1536}
      motion="sway"
      className={className}
      priority={priority}
    />
  );
}
