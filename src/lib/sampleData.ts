/**
 * Marking sample data so a test can see it.
 *
 * WHY THIS EXISTS. The console is live-first with a fixture fallback, and that
 * is deliberate: a signed-out visitor sees the designed screens, and a
 * signed-in teacher whose read fails is told so. The problem is what it does
 * to an end-to-end test.
 *
 * An E2E asserting "the teacher signs in and sees their class list" PASSES
 * when the live read 401s, 500s, or returns the wrong shape - because the
 * fallback renders a class list, which is exactly what the assertion looks
 * for. The suite goes green while the console shows sample children to a real
 * teacher. That is not a hypothetical: it is the reason E2E was sequenced
 * AFTER unit and component tests rather than before.
 *
 * The fix is not to remove the fallback - it is load-bearing for the
 * signed-out demo. It is to make every fixture render carry a mark, so one
 * test can assert the mark is absent everywhere after signing in. That single
 * assertion is worth more than a dozen flow tests, because it catches the
 * failure this architecture actually has: silent degradation to samples.
 *
 * Applied at the point a component DECIDES to render fixtures, not on every
 * element inside one.
 *
 *     <div {...sampleMark()}>…the designed demo…</div>
 *
 * The attribute is always emitted, including in production. It is inert, it
 * costs nothing, and a mark that only exists in test builds cannot catch a
 * production regression - which is the case that matters most.
 */

/** The attribute an E2E asserts the absence of once signed in. */
export const SAMPLE_ATTR = "data-nevo-sample";

/**
 * Spread onto the element that wraps a fixture render.
 *
 * `kind` names the surface, so a failing E2E says WHICH screen fell back
 * rather than only that something did.
 */
export function sampleMark(kind: string): Record<string, string> {
  return { [SAMPLE_ATTR]: kind };
}

/**
 * Every sample region currently on the page.
 *
 * Exposed for the E2E to call rather than reimplementing the selector, and
 * usable from the browser console when a screen looks wrong and it is not
 * obvious whether the data is real.
 */
export function sampleRegions(root: ParentNode = document): string[] {
  return Array.from(root.querySelectorAll(`[${SAMPLE_ATTR}]`)).map(
    (el) => el.getAttribute(SAMPLE_ATTR) ?? "",
  );
}
