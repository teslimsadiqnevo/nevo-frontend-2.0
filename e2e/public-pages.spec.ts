import { expect, test } from "@playwright/test";

/**
 * The pages a stranger can reach, and the one that takes their details.
 *
 * `/tosse` gets the most attention here because it is the only surface that
 * has been in front of real schools, and because it broke in production in a
 * way no unit test would have caught: the form posted `school_name` and
 * `student_count` to an endpoint whose contract is camelCase, and `role` as a
 * display label rather than an enum value, so EVERY submission 422'd at the
 * booth. The contract gate catches that class now, but the values a person
 * actually sees and picks are worth pinning in a browser.
 *
 * Nothing here submits anything. A submission creates a real lead in a real
 * list that someone follows up.
 */

test.describe("the landing page", () => {
  test("renders without a client-side error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("the way in", () => {
  /*
   * The registration wizard had NO ENTRANCE. Its only two references in `src`
   * were `proxy.ts`'s pre-auth allowlist and `AdminShell`'s bare-route list -
   * both config, neither a link - so the only href on the whole landing
   * surface was a mailto, and a school could reach sign-up only if somebody
   * sent them the URL out of band.
   *
   * This lives in the browser rather than in a unit test because a link that
   * exists in the JSX and is covered by a fixed nav, or points at a route that
   * 404s, is still not an entrance.
   */
  test("offers a school a way to sign up and a way back in", async ({ page }) => {
    await page.goto("/");

    const signUp = page.locator('a[href="/admin/onboarding"]').first();
    await expect(signUp).toBeVisible();

    const signIn = page.locator('a[href="/auth/admin"]').first();
    await expect(signIn).toBeVisible();
  });

  test("the sign-up link actually reaches the wizard", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/admin/onboarding"]').first().click();
    await page.waitForURL("**/admin/onboarding");
    // `proxy.ts` lists this route as PRE-AUTH, so a stranger must land on it
    // rather than be bounced to sign-in.
    await expect(page).toHaveURL(/\/admin\/onboarding/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("the bare console address does not 404", async ({ page }) => {
    // `/admin` had no page at all while being guarded as a real route, so a
    // signed-in admin who typed it got the global not-found. Signed out, the
    // proxy should send us to sign-in - never to a 404.
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).not.toHaveURL(/not-found/);
  });
});

test.describe("a locked-out admin", () => {
  /*
   * `AdminSignIn` told them to "reset your password" and offered nothing to
   * press, while its own docblock claimed "No reset endpoint exists anywhere in
   * the spec". Two do, and the teacher console had been consuming both since
   * 1 Sep. A proprietor locked out of their own school had no way back.
   *
   * In a browser rather than a unit test because the value here is the PATH -
   * a link that renders but 404s, or a route that renders a placeholder, is
   * still no way back in.
   */
  test("can reach a reset screen from the sign-in page", async ({ page }) => {
    await page.goto("/auth/admin");
    const link = page.getByRole("link", { name: "Forgot your password?" });
    await expect(link).toBeVisible();

    await link.click();
    await page.waitForURL("**/auth/admin/reset");
    // The real screen, not the placeholder that was there before.
    await expect(page.locator("body")).not.toContainText("Placeholder");
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test("the role-neutral reset route is no longer a placeholder", async ({ page }) => {
    // The backend composes the emailed link, so this side cannot know which URL
    // it points at. If it sends anyone here, they must not land on nothing.
    const response = await page.goto("/auth/forgot-password");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).not.toContainText("Placeholder");
  });
});

test.describe("the TOSSE interest page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tosse");
  });

  test("renders without a client-side error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.reload();
    expect(errors).toEqual([]);
  });

  test("offers exactly the three intent cards the ticket specifies", async ({
    page,
  }) => {
    // SCRUM-117 names these three, and the enum was renamed on the backend to
    // match them. If a fourth appears, or one changes wording, the enum and
    // the page have drifted apart again.
    for (const label of [
      "I want to become a Founding Partner",
      "Schedule a walkthrough for my team",
      "I'm interested, contact me this week",
    ]) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("offers all five roles", async ({ page }) => {
    // Two of these - Teacher and Parent - had no enum value at all until 6
    // Sep and were being collapsed to `other`. Their presence in the list is
    // what makes the mapping worth keeping honest.
    // Selected by ARIA role rather than by text: the control is a real
    // `combobox` with a `listbox` of `option`s, so this asserts the
    // accessibility markup is right at the same time as the contents. A
    // text-matched button would have passed just as well on a plain div.
    await page.getByRole("combobox").click();
    const options = page.getByRole("option");
    await expect(options).toHaveCount(5);
    await expect(options).toHaveText([
      "School Proprietor / Owner",
      "Academic Director / Head of School",
      "Teacher",
      "Parent",
      "Other",
    ]);
  });

  test("keeps submit disabled until the form is complete", async ({ page }) => {
    // The endpoint is not idempotent and takes ~2.4s. An enabled button on an
    // incomplete form invites a double tap and two leads for one school.
    const submit = page.getByRole("button", {
      name: /Join the Founding Partner Programme/i,
    });
    await expect(submit).toBeDisabled();
  });
});

test.describe("what a stranger must not be shown", () => {
  test("the landing page carries no sample-data marks", async ({ page }) => {
    // Public marketing has no fallback and should never have one. This is
    // the same assertion the signed-in suite will make across the console
    // once there is an account to sign in with - proven here on a surface
    // where the answer is knowable today.
    await page.goto("/");
    await expect(page.locator("[data-nevo-sample]")).toHaveCount(0);
  });
});
