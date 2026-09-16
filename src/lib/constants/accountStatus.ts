import type { UserStatus } from "@/lib/api/teachers";

/**
 * Whether a child's account lets them into Nevo, in the teacher console's voice.
 *
 * WHY THIS EXISTS. Design ruled on 14 Sep that the teacher roster carries NO
 * consent column, ever. That ruling rested on a premise that turned out to be
 * false: that the "Deactivated" pill already told a teacher why a child could
 * not get in. That pill is on the ADMIN roster, not the teacher one. So the
 * ruling left a dependency behind, and this is it, quoted from the ruling:
 *
 *     "No consent, no reason, just whether the child is active."
 *
 * Those eight words are the entire design brief. Nothing here may say WHY an
 * account is off, and nothing may hint at consent - that is the half the
 * ruling deliberately withheld from teachers.
 *
 * NO TEACHER-FACING FRAME DRAWS THIS. Searched on 16 Sep: zero hits for
 * deactivated / inactive / invited / suspended across all 58 teacher boards.
 * The nearest drawn treatment is admin's, `SCRUM-40 D7b`: "Violet 'Deactivated'
 * pill by the name". VIOLET IS NOT AVAILABLE HERE. On the teacher roster violet
 * already means "Nevo has a learning profile for this student" - it is the row's
 * left border and the legend under the list says so - and the C16b markers next
 * to it were deliberately rendered as WORDS rather than colour for exactly this
 * reason. A third meaning on the same colour is the kind of thing nobody notices
 * until a teacher acts on the wrong one. So these say their words, muted, and
 * borrow no colour at all.
 *
 * THE WORDS ARE ADMIN'S, ON PURPOSE. `src/components/admin/Students/status.ts`
 * has said "Active" / "Invited" / "Deactivated" since the admin lane was built.
 * One fact about one child should not have two vocabularies depending on who is
 * looking, so this file reuses them rather than inventing a teacher dialect.
 * That file still holds its own copy of this logic; the two must not drift, and
 * collapsing it into this one is raised as its own task.
 *
 * UNKNOWN IS NOT DEACTIVATED. Inherited from that file, and the reasoning is
 * worth keeping: anything outside the enum resolves to `invited`, the state that
 * grants nothing. Admin's version guards a permanent erase path. Here the stake
 * is smaller but the direction is the same - telling a teacher a child is
 * switched off, on the strength of a value we did not recognise, is a claim
 * about a real child that we cannot support.
 */

/** Narrow an unvalidated wire value. Anything unrecognised is `invited`. */
export function accountStatus(raw: string | null | undefined): UserStatus {
  const s = (raw ?? "").toLowerCase();
  if (s === "active") return "active";
  if (s === "deactivated") return "deactivated";
  return "invited";
}

/**
 * What the roster row says about the account, or `null` for the ordinary case.
 *
 * `active` is deliberately unmarked. A marker on every row is not an indicator,
 * it is decoration, and the teacher is looking for the exception.
 */
export const ROSTER_MARKER: Record<UserStatus, string | null> = {
  active: null,
  // The account exists and nobody has used it yet. NOT the same as deactivated:
  // folding the two together describes a child who has simply not started as
  // one who has been switched off.
  invited: "Invited",
  // Switched off by the school. No reason is given, per the ruling, and none is
  // available on this read anyway.
  deactivated: "Deactivated",
};

/** The marker for a row, or null when there is nothing to say. */
export function rosterMarker(raw: string | null | undefined): string | null {
  return ROSTER_MARKER[accountStatus(raw)];
}

/**
 * Whether the child can currently work in Nevo.
 *
 * Only `active` can. `invited` has an account and has not opened it, which is
 * a different sentence from "cannot get in" - the roster's own "Hasn't started
 * yet" line already covers the behaviour, so this exists for the callers that
 * need the permission rather than the history.
 */
export function canWork(raw: string | null | undefined): boolean {
  return accountStatus(raw) === "active";
}
