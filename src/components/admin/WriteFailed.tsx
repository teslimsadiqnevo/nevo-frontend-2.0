"use client";

import { cn } from "@/lib/utils";

/**
 * What an ACTION shows when it did not happen.
 *
 * `ReadFailed` is the same idea one direction over: a read that failed must not
 * render as an established absence. This is the write half, and it is the more
 * dangerous of the two - a read that fails shows the admin nothing, while a
 * write that fails silently shows them SUCCESS, and they act on it.
 *
 * The habit that produced this file is `.catch(() => setConfirming(false))`:
 * the failure path closes the dialog, drops the spinner and returns the screen
 * to rest, which is byte-for-byte what the admin saw the last time it worked.
 * The audit on 8 Sep found the same shape in ten places across the console:
 *
 *   - a class archived, the POST refused, the dialog closing exactly as it does
 *     on success, so the class stays live on every list
 *   - "Mark all read" refused, every unread dot cleared anyway, and the Unread
 *     filter then reporting "You're up to date."
 *   - a teacher removed from a class, the DELETE refused, the confirm strip
 *     closing, the teacher keeping access
 *   - a child deactivated under the words "their seat frees up", the DELETE
 *     refused, the dialog returning to rest
 *   - an SSO disconnect refused, its only message painted UNDERNEATH the modal
 *     still covering the screen, so the admin presses again, and again
 *
 * THREE RULES, and the third is the one that is easy to miss:
 *
 *   1. SAY IT. Nothing changed, in those words, so it is distinguishable from
 *      the same screen after a success.
 *   2. KEEP THE AFFORDANCE. The dialog stays open and the button stays
 *      pressable, because the admin's intent has not been served yet.
 *   3. PUT IT WHERE THEY ARE LOOKING. A message rendered behind an open modal
 *      is not a message. This renders inline, at the point of the action.
 *
 * DESIGN LAW: no red. A refused write is not an alarm, and on this console
 * "something went wrong" is violet and calm - see `bg-nevo-violet`.
 */
export function WriteFailed({
  /**
   * What did not happen, phrased as the thing itself: "archive this class",
   * "mark everything as read". Rendered after "We couldn't".
   */
  what,
  /** The backend's own words, when it gave any worth repeating. */
  message,
  className,
}: {
  what: string;
  message?: string | null;
  className?: string;
}) {
  return (
    <p
      role="status"
      className={cn(
        "m-0 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3 text-[13.5px] leading-[1.5] text-nevo-navy",
        className,
      )}
    >
      {message ?? (
        <>
          We couldn&rsquo;t {what} just now, so nothing has changed. Try again
          in a moment.
        </>
      )}
    </p>
  );
}
