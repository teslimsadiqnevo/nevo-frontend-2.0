import { IllustrationWrapper } from "./IllustrationWrapper";

/**
 * Settling character (Design System v2 §12). Calm arrival illustration —
 * Welcome screen and onboarding transitions. Static (no motion).
 */
export function SettlingCharacter({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <IllustrationWrapper
      src="/illustrations/welcome-settling.png"
      alt="A student settling in comfortably"
      width={697}
      height={598}
      className={className}
      priority={priority}
    />
  );
}
