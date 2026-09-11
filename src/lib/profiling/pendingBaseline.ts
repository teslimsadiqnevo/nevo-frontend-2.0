import { baselineApi } from "@/lib/api/baseline";
import { getSession } from "@/lib/auth/session";

/**
 * The baseline a child has already sat, waiting for the account it belongs to.
 *
 * `POST /api/baseline/submit` is Bearer. The profiling run is phase 0 of the
 * onboarding sequence and the account is not created until phase 2, so the
 * submit used to go out with NO TOKEN, 401, and be given up on at once -
 * `submitWithRetry` deliberately does not retry a 4xx - while `.finally()`
 * purged the raw capture and a `submitted` ref blocked any second attempt.
 * Several minutes of a SEND learner's attention, in the run that happens once,
 * silently destroyed. Only SSO children were spared, because their session is
 * stored before they reach the sequence.
 *
 * WORSE ON A SHARED TABLET. `/student/onboarding` is a pre-auth route and the
 * guard lets a signed-in child straight through, so where the last child did
 * not sign out their token was still in localStorage. The submit then
 * SUCCEEDED - and wrote this child's cognitive assessment to the previous
 * child's account, under a screen reading "All set. Nevo is ready for you."
 *
 * So the run no longer submits. It parks the reduced vector here, and it is
 * sent once an account exists AND that account is provably this child's. Only
 * the reduced vector is ever held; the raw capture still never leaves the
 * device and is still purged as soon as it has been reduced.
 */

const KEY = "nevo.baseline.pending";

/**
 * How long a parked baseline is worth sending. A child who abandons onboarding
 * and returns weeks later is not the same measurement.
 */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface PendingBaseline {
  sessionId: string;
  features: Record<string, unknown>[];
  capturedAt: number;
}

export function holdBaseline(
  sessionId: string,
  features: Record<string, unknown>[],
): void {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ sessionId, features, capturedAt: Date.now() }),
    );
  } catch {
    // Private mode, or storage full. Nothing else to do: the run is over and
    // the child is moving on. Losing it here is the old behaviour, not a
    // regression - and it is now the only way to lose it.
  }
}

export function readPendingBaseline(): PendingBaseline | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<PendingBaseline>;
    if (!v?.sessionId || !Array.isArray(v.features)) return null;
    if (typeof v.capturedAt !== "number") return null;
    if (Date.now() - v.capturedAt > MAX_AGE_MS) {
      clearPendingBaseline();
      return null;
    }
    return v as PendingBaseline;
  } catch {
    return null;
  }
}

export function clearPendingBaseline(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/**
 * Send a parked baseline, but only to the child who sat it.
 *
 * `expectedUserId` is the id the account-creation call just returned. The
 * stored session must match it, which is what makes this safe on a shared
 * device: a token left behind by the previous child cannot satisfy it, so the
 * baseline stays parked rather than being written to a stranger.
 *
 * Left parked on failure too. A submit that did not land is not a reason to
 * throw away the only copy - that was the original defect.
 */
export async function flushPendingBaseline(
  expectedUserId: string | null | undefined,
): Promise<boolean> {
  const pending = readPendingBaseline();
  if (!pending) return false;

  const session = getSession();
  if (!session?.token || !expectedUserId || session.userId !== expectedUserId) {
    return false;
  }

  const ok = await baselineApi.submitWithRetry(
    pending.sessionId,
    pending.features,
  );
  if (ok) clearPendingBaseline();
  return ok;
}
