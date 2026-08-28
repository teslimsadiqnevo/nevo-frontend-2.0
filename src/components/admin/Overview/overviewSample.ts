/**
 * The two parts of D04 that have no endpoint behind them.
 *
 * Kept in one file, separate from the screen, so it is obvious at a glance what
 * on the Overview is fixture and what is real - and so deleting this file is
 * all it takes once the endpoints exist. Both are rendered under an explicit
 * sample note; neither is ever passed off as the school's own position.
 *
 * TODO(api): a board-narrative endpoint, and a roll-up of what actually needs a
 * decision. Until then this copy is D04's, verbatim.
 */

/** D04's `narrativePop`, verbatim - a worked example of the register. */
export const NARRATIVE_SAMPLE =
  "This half-term, 287 students across 12 active classes have been learning with Nevo. The clearest movement has been in comprehension: across JSS 2 and JSS 3, students are working through reading-heavy lessons more steadily than last term, and fewer are stalling on the written sections that used to slow them down. Teachers have leaned on Nevo's adaptations most in Mathematics, where the listen-first versions are helping students who found dense worked examples hard to hold onto. Nine students have been flagged for a closer look; every one has been picked up by their teacher, and four have already settled. Nothing in the picture is cause for concern - the school is using Nevo the way it's meant to be used.";

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
