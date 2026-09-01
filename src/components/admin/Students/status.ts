/**
 * The student status vocabulary, as the API actually defines it.
 *
 * `UserStatus` is an enum of exactly three values - `active`, `invited`,
 * `deactivated` - and admin was testing it as a boolean:
 *
 *     const deactivated = student.status.toLowerCase() !== "active";
 *
 * That folds `invited` into `deactivated`, which is wrong in both directions.
 * A child who has been invited and has never signed in was described in the
 * past tense ("Was in JSS 2A", "How Amara WAS getting on"), and - far worse -
 * was offered the deactivated-only actions, which include the permanent
 * `DELETE /api/v1/students/{id}`.
 *
 * So the three states are named here once and read everywhere.
 *
 * UNKNOWN IS NOT DEACTIVATED. Anything outside the enum resolves to `invited`,
 * the state that grants nothing: an admin over-checking an invitation is
 * harmless, while a value we failed to recognise must never open the erase
 * path. `erasable()` is deliberately the strictest test in this file.
 */

export type StudentStatus = "active" | "invited" | "deactivated";

export function studentStatus(raw: string | null | undefined): StudentStatus {
  const s = (raw ?? "").toLowerCase();
  if (s === "active") return "active";
  if (s === "deactivated") return "deactivated";
  return "invited";
}

/** The label the admin sees. Three words, matching the three states. */
export function statusLabel(raw: string | null | undefined): string {
  const s = studentStatus(raw);
  return s === "active" ? "Active" : s === "invited" ? "Invited" : "Deactivated";
}

/** Past tense is only correct for someone who was actually here. */
export function wasHere(raw: string | null | undefined): boolean {
  return studentStatus(raw) === "deactivated";
}

/**
 * May this record be permanently erased?
 *
 * Two conditions, and both are required.
 *
 * The status must be exactly `deactivated` - D7c's two-step rule is that erase
 * follows deactivation, never precedes it.
 *
 * And the record must be IDENTIFIABLE. The erase modal's only real safeguard
 * is typing the student's name back, and the name it asks for falls back to
 * the constant "This student" when a record has no first name, last name or
 * login identifier - which is exactly the shape of a student who never
 * completed sign-up. A fence that is the same string for every student in the
 * school is not a fence, so a record we cannot name cannot be erased from
 * here.
 */
export function erasable(student: {
  status: string | null | undefined;
  firstName?: string | null;
  lastName?: string | null;
  loginIdentifier?: string | null;
}): boolean {
  if (studentStatus(student.status) !== "deactivated") return false;
  return Boolean(
    student.firstName?.trim() ||
      student.lastName?.trim() ||
      student.loginIdentifier?.trim(),
  );
}
