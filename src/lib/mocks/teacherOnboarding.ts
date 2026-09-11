/**
 * Teacher onboarding fixture (C01). The invite arrives pre-filled from the
 * school's setup; the teacher only confirms and adds a light profile. The
 * name lines up with the console fixture teacher (Adunni "Ms." Adeyemi) and
 * the class list is the real TEACHER_CLASSES fixture, exactly as the frame's
 * own mock data has it.
 *
 * IT HAS BEEN REPLACED (verified 11 Sep 2026). `SetPasswordForm.tsx:224`
 * calls `invitesApi.acceptJoin(token, { password })`, so the simulated verify
 * round-trip this comment used to describe is gone, and the two timing
 * constants that drove it went with it - nothing in `src/` referenced them.
 *
 * What survives is `TEACHER_INVITE.school`, used as a display string while an
 * SSO hand-back resolves (`TeacherSsoCallback.tsx:133`). Note the activate
 * page deliberately does NOT use the email or name here - see the comment at
 * `app/auth/teacher/activate/page.tsx:13`.
 */
export const TEACHER_INVITE = {
  school: "Corona Secondary School",
  location: "Lagos",
  email: "a.adeyemi@coronaschools.edu.ng",
  name: "Adunni Adeyemi",
  subjects: ["Mathematics", "English"],
};


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
