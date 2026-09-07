import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests.
 *
 * SIGNED-OUT AND READ-ONLY, deliberately, for now. Two things have to exist
 * before this suite can sign in:
 *
 *   1. A seeded tenant. The shared demo account holds REAL school staff and
 *      children (`scripts/shape-probe.mjs` says so, and is GET-only for that
 *      reason), so a write-path test would mutate real people's records.
 *      Blocked on `POST /api/v1/schools/register`, which 500s on valid input -
 *      raised with backend 7 Sep.
 *   2. Nothing else. The sample marks that make a signed-in assertion honest
 *      are already in place; see `lib/sampleData.ts`.
 *
 * So what this covers is what can be checked truthfully without an account:
 * that the route guards send people to the right door, and that the public
 * pages render. Both are real properties - the guard one is security-relevant -
 * and neither can be faked by the fixture fallback.
 *
 * `webServer` builds and starts the app itself, so `npm run e2e` needs nothing
 * running first and CI needs no separate step.
 */
export default defineConfig({
  testDir: "./e2e",
  // The app is the shared resource here, not the CPU: these are read-only
  // navigations, so they parallelise safely.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,

  use: {
    //  not : an empty E2E_BASE_URL should fall back, not become the
    // base URL.  only catches null/undefined and silently produced "".
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3100",
    // Kept only for a failure, so a green run costs nothing on disk.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Production build, not `next dev`: dev-mode overlays and slower
        // compiles make timing-sensitive assertions flaky, and the thing
        // being shipped is the build.
        command: "npm run build && npx next start -p 3100",
        url: "http://localhost:3100",
        timeout: 300_000,
        reuseExistingServer: !process.env.CI,
      },
});
