const KEY = "nevo.rotate.continueSideways";

/**
 * Whether this child has said they are staying in landscape.
 *
 * A DEVICE FACT, NOT A CHILD'S PREFERENCE, and stored per device for that
 * reason. A tablet clamped to a wheelchair tray, a stand, or a mount does not
 * rotate; nor does one with rotation locked by an accessibility setting. The
 * prompt asked such a child to do the one thing they cannot do and offered
 * nothing else, which made it a wall between them and the lesson rather than a
 * nudge - and "portrait only, v1" was never a decision to exclude anybody.
 *
 * Persisted rather than per-session on purpose. Asking again every lesson is
 * the same wall arriving more often, and a child who has already told us the
 * tablet does not turn has answered the question.
 *
 * Nothing about this is sent anywhere. It changes layout on this device and is
 * not a fact about how the child learns.
 *
 * SHAPED AS A STORE so `RotateLock` can read it through
 * `useSyncExternalStore`, exactly as it already reads the orientation. The
 * alternative - read storage in an effect and call `setState` - is what
 * React's `set-state-in-effect` rule exists to stop, and it would render one
 * frame of the prompt to a child who had already dismissed it.
 */

const listeners = new Set<() => void>();

export function subscribeContinuesSideways(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab of the same app counts: the choice is about the device.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function continuesSideways(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    // Private mode, or storage refused. The prompt then behaves as it always
    // has, which is the state this improves on rather than regresses.
    return false;
  }
}

/** The server cannot know how a tablet is mounted. */
export const continuesSidewaysOnServer = () => false;

export function rememberContinuesSideways(): void {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // Not remembered next time, and that is the whole cost: the notify below
    // still lets the child through now.
  }
  for (const l of listeners) l();
}
