/**
 * The ONE part of D04 that still has no endpoint behind it.
 *
 * The board narrative used to live here too. It is gone: `GET
 * /api/v1/school/narrative` landed on 7 Sep with `source` as a const
 * "live_school_data", so the Overview shows the school's own summary and the
 * note admitting the figures were not theirs went with it.
 *
 * Kept in one file, separate from the screen, so it is obvious at a glance what
 * on the Overview is fixture and what is real - and so deleting this file is
 * all it takes once the last endpoint exists. It renders under an explicit
 * sample note and is never passed off as the school’s own position.
 *
 * TODO(api): a roll-up of what actually needs a decision. Until then this copy
 * is D04's, verbatim, and rendered under an explicit sample note.
 */

/** D04's `narrativePop`, verbatim - a worked example of the register. */
export interface GlanceRow {
  title: string;
  sub: string;
  action: string;
  /** The destination is real even though the count is not. */
  href: string;
}

export const WORTH_A_GLANCE: GlanceRow[] = [
  {
    title: "6 students are waiting on parent consent",
    sub: "They can look around, but can't begin live lessons until it's confirmed.",
    action: "Review in Students",
    href: "/admin/students",
  },
  {
    title: "4 students have active support flags",
    sub: "Each is already with their teacher this half-term - nothing new is unattended.",
    action: "Open Learning Support",
    href: "/admin/senco",
  },
  {
    title: "2 classes haven't run a lesson yet",
    sub: "JSS 1B and SSS 2 Arts - might be worth a nudge to their teachers.",
    action: "View Classes",
    href: "/admin/classes",
  },
];
