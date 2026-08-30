/**
 * Teacher onboarding fixture (C01). The invite arrives pre-filled from the
 * school's setup; the teacher only confirms and adds a light profile. The
 * name lines up with the console fixture teacher (Adunni "Ms." Adeyemi) and
 * the class list is the real TEACHER_CLASSES fixture, exactly as the frame's
 * own mock data has it.
 *
 * TODO(api): the invite endpoints landed on 30 Aug - `/api/v1/invites` (admin
 * only; a teacher gets 403) and `GET /api/v1/join/{token}` plus its accept -
 * so the simulated verify round-trip below can be replaced. It has not been.
 */
export const TEACHER_INVITE = {
  school: "Corona Secondary School",
  location: "Lagos",
  email: "a.adeyemi@coronaschools.edu.ng",
  name: "Adunni Adeyemi",
  subjects: ["Mathematics", "English"],
};

/** Simulated email-verification round trip ("Waiting for verification…"). */
export const VERIFY_MS = 2800;
/** "Complete" holds briefly, then the dashboard (frame: "brief hold"). */
export const COMPLETE_HOLD_MS = 1400;

const COUNT_WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];

/** "Three classes are set up and waiting for you." - derived, not hardcoded. */
export function classCountLine(n: number): string {
  const word = COUNT_WORDS[n] ?? String(n);
  return n === 1
    ? "One class is set up and waiting for you."
    : `${word} classes are set up and waiting for you.`;
}
