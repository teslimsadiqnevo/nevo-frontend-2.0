import type { SchoolRosterCounts } from "@/lib/api/school";

/**
 * D04's Getting-started checklist - the "Just onboarded, honest early state"
 * variant of the Overview.
 *
 * The frame draws THREE variants of this screen and gives the early one its own
 * roll-up: a live school gets "Worth a glance", a just-onboarded school gets
 * "Getting started". The screen used to render "Worth a glance" in both cases,
 * so a school with no students was told "6 students are waiting on parent
 * consent" - three invented counts, under a note admitting they were invented.
 *
 * Copy is D04's `ksData`, verbatim. Only the school name in the first row is
 * substituted, because the frame hard-codes its own fixture school there.
 *
 * WHAT A TICK MEANS HERE. A tick is a positive CLAIM about this school, so it
 * is only ever set from a signal we actually hold:
 *   - "Workspace created" is true by construction - the admin is signed into a
 *     school that exists.
 *   - "Add your students" reads `studentsProfiled` from the compliance audit,
 *     which the screen already fetches.
 *   - "Invite your teachers" reads `counts.teachers` from
 *     `GET /api/v1/school/overview`, which the screen already fetches for its
 *     snapshot tiles.
 *
 * TWO render as OPEN steps, and this is the honest limit of the screen rather
 * than a considered position. It used to be three: the teachers row is settled
 * now, from a count the screen was already holding. An open circle beside the
 * remaining two is a checklist affordance, not a verified "you have not done
 * this" - it will still read as one to some admins, and the only real fix is a
 * signal for each.
 *
 * TODO (client, not api): settle the remaining three from data rather than
 * leaving them open. This used to end "consent once any endpoint reports it
 * for a school" and "each is one call" - the first was retired by this file's
 * own correction block below, and the second stopped being true when
 * OverviewView put `counts` in state. What is actually left:
 *
 *   - TEACHERS ticks today from `counts.teachers > 0`, no new call at all.
 *   - SIGN-IN needs `ssoApi.status()` added to the existing `Promise.all` with
 *     a `.catch(() => null)` like its two neighbours, and settles only the
 *     "connect a provider" half - "share your school code" stays unverifiable
 *     and MUST stay open.
 *   - CONSENT ticks from `studentsApi.list()` when no row is `not_sent`.
 *
 * Whichever lands, export its index beside STEP_WORKSPACE and STEP_STUDENTS.
 *
 * THAT WAS TRUE AND IS NOT ANY MORE. This used to read: "The consent row's
 * action is 'When ready' rather than a link... No endpoint reads consent for a
 * roster, so there is nothing to link to."
 *
 * Both halves are now false. `AdminStudentRow` carries `consent`, which is
 * what `blockedByConsent` counts on the roster header, and
 * `consentsApi.requestParentConsent` finally has callers - the row and the
 * student's own record. So the row links to the place the action lives.
 *
 * Left as a caution rather than deleted: a docblock that stops being true is
 * the most expensive comment in a codebase, because the next person re-makes
 * the decision on it. Four were found wrong in a single pass on 10 Sep.
 */

export interface StartStep {
  title: string;
  sub: string;
  /** The action's label. Empty when the step is not an action. */
  cta: string;
  /** Absent when the step has nowhere to go yet. */
  href?: string;
}

export function gettingStartedSteps(school: string): StartStep[] {
  return [
    {
      title: "Workspace created",
      sub: `${school} is live on Nevo.`,
      cta: "",
    },
    {
      title: "Invite your teachers",
      sub: "They each get a link to set up their own console.",
      cta: "Invite teachers",
      href: "/admin/invitations",
    },
    {
      title: "Add your students",
      sub: "Import a roster, or enrol them class by class.",
      cta: "Enrol students",
      href: "/admin/students",
    },
    {
      title: "Choose how everyone signs in",
      sub: "Connect Microsoft or Google, or share your school code.",
      cta: "Set up sign-in",
      href: "/admin/sso",
    },
    {
      title: "Send parent consent requests",
      sub: "Students can begin lessons once a parent confirms.",
      cta: "Send requests",
      href: "/admin/students",
    },
  ];
}

/** Indices of the steps a real signal can currently settle. */
export const STEP_WORKSPACE = 0;
export const STEP_TEACHERS = 1;
export const STEP_STUDENTS = 2;

/**
 * Whether "Invite your teachers" may be ticked.
 *
 * `SchoolRosterCounts.teachers` is the school's teacher headcount. Nothing on
 * the contract makes it required - the schema carries a default of 0 and has
 * no `required` array - so an ABSENT number is unknown, and so is a `null`
 * counts object, which is what OverviewView holds after
 * `schoolApi.overview().catch(() => null)`. Unknown returns false and the row
 * stays open, in the same state as the steps no signal reaches. That is the
 * absence of a claim, not the claim that this school has no teachers.
 *
 * The type test is the point. `(counts?.teachers ?? 0) > 0` reads the same and
 * invites the next edit to default a missing count to zero, which is exactly
 * the move this checklist must never make.
 *
 * `> 0` IS THE RIGHT THRESHOLD, AND THIS DOES NOT TICK AT REGISTRATION. The
 * schema counts `sencoAdmins` and `otherAdmins` in fields of their own, and
 * the founding admin comes back from registration as an admin - never inside
 * `teachers`. A school that has just registered and invited nobody reads 0.
 *
 * The contract does not settle whether a teacher who was invited but has not
 * joined is counted; students are split active/invited and teachers are not.
 * It does not matter here - under either reading a non-zero count means a
 * teacher was invited, which is what this step asks. It WOULD matter for
 * anything rendering the number as accounts.
 */
export function teachersOnRoster(
  counts: SchoolRosterCounts | null | undefined,
): boolean {
  return typeof counts?.teachers === "number" && counts.teachers > 0;
}
