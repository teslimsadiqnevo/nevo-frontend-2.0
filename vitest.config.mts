import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Two projects, because this codebase has two genuinely different kinds of
 * testable thing and running both in jsdom would be slower for no benefit:
 *
 *   node  pure logic in `lib/` - marking, expiry, adapters, payload shaping.
 *         No DOM, so no jsdom tax.
 *   dom   hooks and components. jsdom rather than happy-dom deliberately:
 *         `client.ts` calls `window.location.assign` and `session.ts` writes
 *         `document.cookie` with Expires/SameSite, and jsdom's navigation and
 *         cookie-jar behaviour is the better specified of the two. With no
 *         existing test infrastructure, we want failures that are OURS rather
 *         than the DOM shim's.
 *
 * `.mts` is required: package.json declares no `"type": "module"`, so a `.ts`
 * config would be parsed as CommonJS and these imports would throw.
 *
 * The `@/*` alias is read from tsconfig.json rather than redeclared here, so
 * the two cannot drift apart.
 */
export default defineConfig({
  plugins: [react()],
  // Vite resolves the `@/*` alias from tsconfig.json natively now, so the
  // `vite-tsconfig-paths` plugin is one fewer dependency in a lockfile three
  // sessions share.
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/lib/**/*.test.ts"],
          // `.dom.test.ts` opts a lib file into jsdom. Some of `lib/` is not
          // pure - the session store is localStorage and document.cookie -
          // and running it here fails on `window is not defined` rather than
          // on anything true about the code.
          exclude: ["src/lib/**/*.dom.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: [
            "src/{hooks,components}/**/*.test.{ts,tsx}",
            "src/**/*.dom.test.{ts,tsx}",
          ],
        },
      },
    ],
  },
});
