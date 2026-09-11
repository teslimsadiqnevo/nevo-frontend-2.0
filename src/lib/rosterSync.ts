import type { RosterSyncHistory, RosterSyncRun } from "@/lib/api/sso";

/**
 * What "View technical details" is allowed to open onto.
 *
 * Pure and separate from the screen so the rules below are testable without a
 * DOM, because each of them is a claim about a school's sync that this console
 * has got wrong before in one direction or another.
 */

/**
 * The run the panel describes: the most recently STARTED one.
 *
 * Not `runs[0]` - the contract documents no ordering on `RosterSyncHistory
 * .runs`, and a client that assumes one will silently describe an old run as
 * the latest. Sorted on `startedAt`, which is required on every run.
 */
export function latestRun(
  history: RosterSyncHistory | null | undefined,
): RosterSyncRun | null {
  const runs = history?.runs;
  if (!Array.isArray(runs) || runs.length === 0) return null;
  return [...runs].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  )[0];
}

/**
 * Whether there is anything to disclose at all.
 *
 * `api.get<T>` is a cast and not a validation, so `issues` is typed as an array
 * here on an assertion the compiler never checks - hence `Array.isArray` at the
 * boundary rather than trusting the declared type.
 *
 * A run with NOTHING to report opens no disclosure. There is deliberately no
 * "No issues found" state: an empty `issues[]` is the absence of a report, not
 * evidence the sync was clean, and this console must not turn one into the
 * other.
 */
export function hasTechnicalDetail(run: RosterSyncRun | null): boolean {
  if (!run) return false;
  const issues = Array.isArray(run.issues) ? run.issues : [];
  return issues.length > 0 || Boolean(run.failureReason);
}

/** The issues, defensively - see `hasTechnicalDetail` on why this re-checks. */
export function runIssues(run: RosterSyncRun | null) {
  return run && Array.isArray(run.issues) ? run.issues : [];
}
