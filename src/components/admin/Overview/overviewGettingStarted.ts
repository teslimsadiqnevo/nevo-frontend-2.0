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
 *
 * The other three render as OPEN steps, and this is the honest limit of the
 * screen rather than a considered position: `early` only tests that no lesson
 * has been taught yet, and a school can perfectly well have invited its
 * teachers or connected SSO before its first lesson. An open circle beside
 * those is a checklist affordance, not a verified "you have not done this" -
 * but it will read as one to some admins, and the only real fix is a signal.
 *
 * TODO(api): settle the remaining three from data rather than leaving them
 * open - teachers from the roster count, sign-in from the SSO status the IT
 * screen already reads, consent once any endpoint reports it for a school.
 * Each is one call; none is worth adding to this screen's failure surface
 * until they can be fetched together.
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
export const STEP_STUDENTS = 2;
