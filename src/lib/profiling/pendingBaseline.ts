import { baselineApi } from "@/lib/api/baseline";
import { consentsApi, processingWithdrawn } from "@/lib/api/consents";
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
  /**
   * WHOSE MEASUREMENTS THESE ARE, when that is knowable at the moment they are
   * parked.
   *
   * The warm-up is sat by a child who is already signed in, so their id is
   * recorded and nothing else may ever send this vector. The onboarding run is
   * phase 0, before any account exists, so there is no id to record: `null`
   * means "belongs to the account the run that captured it goes on to create",
   * and `sessionId` is what ties it to that run.
   */
  ownerUserId: string | null;
}

export function holdBaseline(
  sessionId: string,
  features: Record<string, unknown>[],
  ownerUserId: string | null = null,
): void {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        sessionId,
        features,
        capturedAt: Date.now(),
        ownerUserId,
      }),
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
    // A record written before `ownerUserId` existed reads as an onboarding
    // vector, which is the safe reading: it then has to prove its run.
    return { ...(v as PendingBaseline), ownerUserId: v.ownerUserId ?? null };
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
 * `expectedUserId` is the id the account-creation call just returned, and the
 * stored session must match it.
 *
 * THAT CHECK ALONE USED TO BE THE WHOLE GUARD, and it stopped proving anything
 * the moment `acceptJoin` began storing a session (16 Sep). It was only ever
 * safe by accident: an invite-link child had no token, so a vector could not
 * be sent at all, and a token left behind by the previous child did not match
 * the new account. Give the new account a session of its own - which is the
 * fix this guard shipped beside - and `session.userId === expectedUserId`
 * becomes true by construction, for ANY parked vector, including one the
 * previous child left behind when their warm-up submit failed.
 *
 * So the vector now has to prove whose it is, and there are two cases:
 *
 *  - Parked by a signed-in child (the daily warm-up): `ownerUserId` is their
 *    id and only that child may send it.
 *  - Parked before an account existed (the onboarding run): there is no id to
 *    check, so the caller passes the `sessionId` of the run it just completed
 *    and the vector must be that run's. An earlier run's leftovers are refused.
 *
 * A caller that passes no `runSessionId` can therefore only ever flush an
 * owned vector, never an anonymous one. That is the conservative direction.
 *
 * Left parked on failure too. A submit that did not land is not a reason to
 * throw away the only copy - that was the original defect.
 */
export async function flushPendingBaseline(
  expectedUserId: string | null | undefined,
  runSessionId?: string | null,
): Promise<boolean> {
  const pending = readPendingBaseline();
  if (!pending) return false;

  const session = getSession();
  if (!session?.token || !expectedUserId || session.userId !== expectedUserId) {
    return false;
  }

  const ownedByThisChild =
    pending.ownerUserId != null && pending.ownerUserId === expectedUserId;
  const parkedByThisRun =
    pending.ownerUserId == null &&
    Boolean(runSessionId) &&
    pending.sessionId === runSessionId;
  if (!ownedByThisChild && !parkedByThisRun) return false;

  /*
   * A WITHDRAWN GUARDIAN STOPS THIS, and this is the last place it can be
   * stopped.
   *
   * Withdrawal is the one consent answer the frontend is entitled to act on,
   * and until now nothing in the baseline path asked: the run measured, the
   * vector parked, and the flush sent it. `LearningNotice` said so in a
   * comment - "NOT HANDLED HERE: withdrawal" - and no other caller picked it
   * up. The capture surfaces now gate themselves, but a vector parked BEFORE
   * a withdrawal would still be sitting here afterwards, so the send has to
   * ask too.
   *
   * REFUSED AND DISCARDED, not refused and kept. Keeping it would leave a
   * child's cognitive measurements on the device after the moment we were
   * told to stop processing them, which is the thing withdrawal asks us not
   * to do.
   *
   * A FAILED READ IS NOT A WITHDRAWAL. Same ruling as `useConsentGate`: a bad
   * minute at the backend or a child on 3G must not silently stop delivering
   * measurements for a guardian who did consent. Only an answer that says
   * withdrawn stops anything.
   */
  if (await processingWithdrawnNow()) {
    clearPendingBaseline();
    return false;
  }

  const ok = await baselineApi.submitWithRetry(
    pending.sessionId,
    pending.features,
  );
  if (ok) clearPendingBaseline();
  return ok;
}

async function processingWithdrawnNow(): Promise<boolean> {
  try {
    return processingWithdrawn(await consentsApi.myConsentGate());
  } catch {
    return false;
  }
}
