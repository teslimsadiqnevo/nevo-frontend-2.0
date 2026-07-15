import { IllustrationWrapper } from "./IllustrationWrapper";

/**
 * Breathing character (Design System v2 §12). Micro-break — a slow scale-pulse
 * that helps regulate the student. Motion is gated behind `motion-safe`.
 */
export function BreathingCharacter({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <IllustrationWrapper
      src="/illustrations/break-micro.png"
      alt="A calm figure breathing slowly"
      width={1254}
      height={1254}
      motion="breathe"
      className={className}
      priority={priority}
    />
  );
}
