import type {
  AdaptationLog,
  ComplianceAudit,
} from "@/lib/api/schoolIntelligence";

/**
 * Canned answers for the admin demo, and the shim that serves them.
 *
 * WHY THIS EXISTS. The teacher and student apps already fall back to designed
 * fixtures when nothing is signed in - `useLiveQuery` returns nothing without
 * a token and every screen has a sample state behind it - so their demos just
 * do not sign in. The admin console does not work that way: every screen calls
 * the API on mount and renders "We couldn't load…" when it 401s. Mounting the
 * real components in a demo would have shown a film of error cards.
 *
 * So `window.fetch` is patched for the life of the demo route and put back on
 * unmount. That is deliberately the smallest possible intervention: no
 * production code changes, no mocking library, no build flag, and nothing that
 * can leak into the real console - the patch lives and dies with the component
 * that installed it.
 *
 * The alternative worth doing properly one day is giving the admin screens the
 * same fixture fallback the rest of the product has, which would make every
 * admin surface demoable without any of this. That is a product change and
 * wants its own review.
 *
 * ONE SCHOOL ACROSS THE TRILOGY. The three apps ship three different fictional
 * schools - Corona Secondary (teacher), a primary-age persona (student), and
 * Brightgate Academy (admin). Watched back to back that reads as three
 * unrelated institutions, so the demo names this one Corona Secondary School
 * to match the teacher film. The admin is still Mrs. Adebayo and the teacher is
 * still Ms. Adeyemi, which is as it should be: a proprietor is not the teacher.
 */

const SCHOOL_NAME = "Corona Secondary School";

/**
 * The compliance audit the trust story turns on.
 *
 * `diagnosticLabelsStored: 0` is the whole claim - Nevo adapts to a child
 * without ever writing down a label about them - and it is the number the
 * D22 screen is built to display. It is zero here because it is zero in the
 * product; this is not a flattering demo value.
 */
export const DEMO_COMPLIANCE: ComplianceAudit = {
  schoolId: "corona-secondary",
  schoolName: SCHOOL_NAME,
  generatedAt: "2026-09-03T07:20:00Z",
  studentsProfiled: 284,
  adaptationEventsLogged: 11_642,
  diagnosticLabelsStored: 0,
  compliant: true,
  findings: [],
};

/**
 * Adaptation events, in the product's own register.
 *
 * Every `adaptation` line describes what the system DID, and every `trigger`
 * describes what it saw - behaviour in a moment, never a property of a child.
 * That distinction is the point of the scene, so these read the way the real
 * rows do rather than being summarised for the stage.
 */
export const DEMO_ADAPTATION_LOG: AdaptationLog = {
  total: 11_642,
  limit: 20,
  offset: 0,
  events: [
    {
      id: "ev-1",
      studentId: "s-amara",
      studentFirstName: "Amara",
      lessonId: "adding-fractions",
      lessonTitle: "Adding Fractions",
      timestamp: "2026-09-03T08:14:00Z",
      trigger: "Slower on written segments, three sessions running",
      adaptation: "Offered the same recap as audio. She took it.",
      eventType: "modality_switch",
    },
    {
      id: "ev-2",
      studentId: "s-tunde",
      studentFirstName: "Tunde",
      lessonId: "adding-fractions",
      lessonTitle: "Adding Fractions",
      timestamp: "2026-09-03T08:09:00Z",
      trigger: "Two wrong attempts on the same step",
      adaptation: "Raised support to full and re-showed the worked example.",
      eventType: "scaffold_raise",
    },
    {
      id: "ev-3",
      studentId: "s-chisom",
      studentFirstName: "Chisom",
      lessonId: "telling-the-time",
      lessonTitle: "Telling the Time",
      timestamp: "2026-09-03T07:58:00Z",
      trigger: "Fourteen minutes without a pause",
      adaptation: "Offered a movement break. Declined, and not offered again.",
      eventType: "break_offer",
    },
    {
      id: "ev-4",
      studentId: "s-emeka",
      studentFirstName: "Emeka",
      lessonId: "photosynthesis",
      lessonTitle: "Photosynthesis",
      timestamp: "2026-09-03T07:41:00Z",
      trigger: "Finished the section early, first attempt correct",
      adaptation: "Lowered support and offered the stretch question.",
      eventType: "scaffold_lower",
    },
    {
      id: "ev-5",
      studentId: "s-zainab",
      studentFirstName: "Zainab",
      lessonId: "photosynthesis",
      lessonTitle: "Photosynthesis",
      timestamp: "2026-09-03T07:33:00Z",
      trigger: "Re-read the same paragraph three times",
      adaptation: "Offered the diagram version of the same idea.",
      eventType: "modality_switch",
    },
  ],
};

/** Answers the demo knows, matched loosely on path. */
function answerFor(url: string): unknown | undefined {
  if (url.includes("/admin/compliance-audit")) return DEMO_COMPLIANCE;
  if (url.includes("/admin/adaptation-log")) return DEMO_ADAPTATION_LOG;
  return undefined;
}

/**
 * Patch `window.fetch` for the demo, and hand back the undo.
 *
 * Anything the demo does not have an answer for falls through to the real
 * fetch rather than being swallowed - a request this file has not thought
 * about should behave exactly as it would outside the demo, not silently
 * resolve to nothing.
 */
export function installDemoApi(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const original = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const body = answerFor(url);
    if (body === undefined) return original(input, init);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  return () => {
    window.fetch = original;
  };
}
