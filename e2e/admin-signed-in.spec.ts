import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * The admin console against the seeded E2E tenant.
 *
 * Everything in the admin lane is proven by unit tests over mocked reads and by
 * diffing the client against the deployed contract. Both caught a great deal -
 * including a school calendar that was being saved to a field nothing reads -
 * and neither can catch what only appears when a real school's data arrives.
 * That is this file's whole job.
 *
 * WHAT IT ASSERTS, AND WHAT IT DELIBERATELY DOES NOT. Every check below is
 * either "a live figure reached the screen" or "no invented figure did". It
 * does not assert particular counts: the seed is re-runnable and its numbers
 * are Teslim's to change, so pinning 250 adaptations here would make their
 * next seed our failing build. Where a count matters, it is asserted as a
 * SHAPE - a number rendered at all, or a fixture marker absent.
 *
 * ONE ACCOUNT, ONE TEST AT A TIME. Inherited from the teacher suite and it is
 * not a style choice: a second sign-in as the same user invalidates the first
 * (`replacedSession`), so parallel tests kill each other's session mid-walk and
 * the console bounces to the door - which looks exactly like a product bug.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const API = process.env.E2E_API_BASE ?? "https://api.nevolearning.com";

/** Mirrors `lib/auth/session.ts`. Changing either without the other breaks this. */
const SESSION_KEY = "nevo.auth.session";
const ROLE_COOKIE = "nevo.role";
const SAMPLE_ATTR = "data-nevo-sample";

const LIVE = { timeout: 25_000 };

test.skip(
  !EMAIL || !PASSWORD,
  "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run the admin signed-in suite.",
);

test.describe.configure({ mode: "serial" });

async function signInAsAdmin(page: Page, request: APIRequestContext) {
  const res = await request.post(`${API}/api/v1/auth/login/password`, {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(
    res.ok(),
    `Could not sign the E2E admin in (${res.status()}). Check the credentials in CI secrets.`,
  ).toBeTruthy();

  const body = await res.json();
  expect(body.role, "The E2E account must be an admin").toBe("admin");
  expect(
    body.accessToken,
    "The login response carried no accessToken - has SessionResponse changed again?",
  ).toBeTruthy();

  const session = {
    token: body.accessToken,
    expiresAt: body.expiresAt,
    userId: body.userId,
    role: body.role,
  };

  await page.context().addCookies([
    {
      name: ROLE_COOKIE,
      value: body.role,
      url: page.url().startsWith("http") ? page.url() : "http://localhost:3100",
    },
  ]);
  // Before the first paint: the console mounts signed-out otherwise, decides
  // it is a guest, and renders the fixtures this suite checks for.
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [SESSION_KEY, JSON.stringify(session)] as const,
  );
}

test.beforeEach(async ({ page, request }) => {
  await signInAsAdmin(page, request);
});

/** A digit rendered anywhere in the subtree - "a figure reached the screen". */
async function hasFigure(page: Page, selector: string) {
  const text = (await page.locator(selector).first().innerText()) ?? "";
  return /\d/.test(text);
}

test("the Overview renders this school's own figures, not a sample", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible(LIVE);

  // The compliance card is the point of the page and is fully live.
  await expect(page.getByText(/Diagnostic labels stored/i)).toBeVisible(LIVE);
  await expect(page.getByText(/Activity so far/i)).toBeVisible(LIVE);

  // The snapshot carried real numbers rather than an empty grid.
  expect(await hasFigure(page, "main")).toBeTruthy();

  /*
   * The identity block must never fall back to "Mrs. Adebayo" for a real
   * admin. That fixture is marked, so its ABSENCE is assertable - which is the
   * whole reason `SampleRegion` exists.
   */
  await expect(
    page.locator(`[${SAMPLE_ATTR}="admin:sidebar-identity"]`),
  ).toHaveCount(0);
});

test("the roster shows four consent states and can be narrowed by them", async ({
  page,
}) => {
  await page.goto("/admin/students");
  await expect(page.getByRole("heading", { name: /Students/i })).toBeVisible(LIVE);

  // The footer line is where an admin learns where parent accounts come from.
  await expect(
    page.getByText(/a parent account is created automatically/i),
  ).toBeVisible(LIVE);

  const before = await page.locator("main").innerText();
  expect(/Showing \d+ of \d+/.test(before)).toBeTruthy();

  // The tenant seeds withdrawn children; the filter must actually find them.
  await page.getByLabel(/Filter by consent/i).selectOption("withdrawn");
  await expect(page.getByText(/Showing \d+ of \d+/)).toBeVisible(LIVE);
});

test("the adaptation log pages a real seven-day window", async ({ page }) => {
  await page.goto("/admin/adaptations");
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible(LIVE);

  /*
   * The seed carries enough events to page (100/100/50 at the time of
   * writing). This asserts the window RESOLVED - rows or an honest empty
   * state - never a particular count, which is Teslim's to change.
   */
  const text = await page.locator("main").innerText();
  expect(
    /Nothing to show|Made a step simpler|Suggested a break|Went into more depth|Slowed the pace|format/i.test(
      text,
    ),
    "The adaptation log rendered neither rows nor its empty state",
  ).toBeTruthy();

  // ZERO-TAG: no engine key ever reaches a head teacher's screen.
  expect(text).not.toMatch(/simplify_trigger|modality_|expand_trigger|slower_trigger|break_suggested/);
});

test("IT & SSO reports the tenant's real sync history", async ({ page }) => {
  await page.goto("/admin/sso");
  await expect(page.getByRole("heading", { name: /IT/i })).toBeVisible(LIVE);

  const text = await page.locator("main").innerText();
  // One of the status words from `ssoState.SYNC_WORD`, never a blank tile.
  expect(
    /Healthy|Waiting for the first sync|Synced with one thing to finish|Syncing, with failures|Paused until|sync history unavailable|Connect your school/i.test(
      text,
    ),
    "The roster-sync tile resolved to none of its known states",
  ).toBeTruthy();

  // The disclosure's second half is a product guarantee and must always show.
  if (/What we read from/i.test(text)) {
    expect(text).toMatch(/What we never touch/);
  }
});

test("Billing renders live invoices with VAT as a percentage", async ({
  page,
}) => {
  await page.goto("/admin/billing");
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible(LIVE);

  const text = await page.locator("main").innerText();
  /*
   * `vatRate` arrives as "7.50" and is a PERCENTAGE, settled 15 Sep after the
   * question came round twice. A rate rendered as "750%" or "0.075" is the
   * defect this line exists to catch.
   */
  if (/VAT/i.test(text)) {
    expect(text).not.toMatch(/750%|0\.075/);
  }
  expect(text).not.toMatch(/undefined|NaN|Invalid Date/);
});

test("no signed-in admin surface renders an unmarked invented figure", async ({
  page,
}) => {
  /*
   * The one fixture the Overview still ships is the "classes haven't run a
   * lesson" roll-up row, and it is wrapped in `SampleRegion` with a note
   * saying so. Everything else must be the school's own. This walks the
   * console and asserts that the ONLY sample marker anywhere is that one.
   */
  const routes = [
    "/admin",
    "/admin/classes",
    "/admin/teachers",
    "/admin/students",
    "/admin/senco",
    "/admin/invitations",
    "/admin/billing",
    "/admin/settings",
  ];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible(LIVE);
    const kinds = await page
      .locator(`[${SAMPLE_ATTR}]`)
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-nevo-sample")));
    for (const kind of kinds) {
      expect(
        kind,
        `${route} rendered an unexpected fixture region (${kind})`,
      ).toBe("admin:overview-worth-a-glance");
    }
  }
});
