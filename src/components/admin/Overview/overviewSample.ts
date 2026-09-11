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
 * TODO(api): a roll-up of what actually needs a decision. No single endpoint
 * returns one.
 *
 * TWO OF THESE THREE ROWS ARE LIVE NOW and have left this file - see
 * `overviewGlance.ts`. What follows is the history, kept because the third row
 * is still fixture and the reasoning still applies to it:
 *
 *   - "waiting on parent consent" is `GET /api/v1/students` filtered on
 *     `consent.status === "pending"`.
 *   - "active support flags" is `GET /api/intelligence/flags` on
 *     `!acknowledged`, deduped by `studentId` - a call SencoView already makes.
 *   - "classes haven't run a lesson" is the only one with no source. The
 *     nearest proxy is `GET /api/admin/adaptation-log?classId=`, one call per
 *     class, which is not the same claim.
 *
 * Both of those moved with the change, and they had to: a sample note reading
 * "These three are a sample" would have been false the moment two of them were
 * real, and a `SampleRegion` wrapped around live rows would train the e2e suite
 * to accept a genuine roll-up as an invented one. The wrapper now encloses this
 * row alone.
 *
 * DELETING THIS FILE IS STILL THE GOAL. It is one row from being empty.
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
    title: "2 classes haven't run a lesson yet",
    sub: "JSS 1B and SSS 2 Arts - might be worth a nudge to their teachers.",
    action: "View Classes",
    href: "/admin/classes",
  },
];
