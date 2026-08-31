/**
 * Student PIN length.
 *
 * THE CONTRACT IS A RANGE, NOT A NUMBER. `POST /api/v1/auth/login/pin` and
 * `POST /api/v1/auth/pin` both declare `pin` as `^\d{4,8}$` - anything from
 * four to eight digits is a valid PIN as far as the backend is concerned.
 *
 * The screens cannot honour a range, because they auto-submit the moment the
 * boxes fill and a range gives them no way to know when a child is done. So
 * they commit to ONE length, and this is it.
 *
 * That commitment has teeth: a student whose account was issued a PIN of a
 * different length cannot sign in at all, and - because the login screen
 * cannot tell a rejected PIN from a rejected identifier - they are told their
 * PIN is wrong rather than that we sent the wrong number of digits. That is
 * exactly what happened with the seeded demo account: the screens were fixed
 * at 4, the account was issued 6, and the first four digits were submitted on
 * the fourth keystroke with digits five and six discarded.
 *
 * Set to 6 on 31 Aug 2026 to match the accounts the backend is currently
 * issuing. Design frame 00 draws four boxes and says "try 1234", so design and
 * the backend disagree and one of them has to move - raised with Olayinka for
 * the 9pm call. Whichever way that lands, it is this constant that changes,
 * and both screens follow it.
 */
export const STUDENT_PIN_LENGTH = 6;

/** What the backend will actually accept, for validation before we send. */
export const STUDENT_PIN_MIN = 4;
export const STUDENT_PIN_MAX = 8;
