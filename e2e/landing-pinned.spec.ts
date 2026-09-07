import { expect, test } from "@playwright/test";

/**
 * The pinned sections, after the scroll driver stopped ticking every frame.
 *
 * This exists because I broke these once already. The driver used to be an
 * always-on `requestAnimationFrame` loop; making it event-driven is worth
 * ~2.5s of main-thread work, but the pinned sections derive their state from
 * `getBoundingClientRect()`, so they move when LAYOUT changes and not only
 * when someone scrolls. If an invalidation source is missed, the pin sticks
 * or the panels stop advancing - and neither shows up in a Lighthouse score.
 *
 * Playwright rather than the in-app browser or a Chrome tab: both of those
 * ran HIDDEN, which pauses rAF and stops painting, so every screenshot came
 * back blank and I mistook it for a bug in the page. A headless browser
 * paints.
 */

test.describe("the pinned adaptive-demo section", () => {
  test("advances its panels as the page scrolls", async ({ page }) => {
    await page.goto("/");
    const track = page.locator("#nv-adapt-track");
    await expect(track).toBeAttached();

    const phaseAt = async (ratio: number) => {
      await page.evaluate((r) => {
        const t = document.getElementById("nv-adapt-track")!;
        const top = t.offsetTop + (t.offsetHeight - window.innerHeight) * r;
        window.scrollTo(0, Math.max(0, top));
      }, ratio);
      // Two frames: one for the scroll event, one for the driver's own frame.
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
      );
      return page.evaluate(() => {
        const vis = [...document.querySelectorAll<HTMLElement>(".nv-panel")]
          .map((p, i) => ({ i, o: Number(p.style.opacity || "0") }))
          .filter((p) => p.o > 0.5);
        return vis.length ? vis[vis.length - 1].i : -1;
      });
    };

    const atStart = await phaseAt(0.05);
    const atMiddle = await phaseAt(0.5);
    const atEnd = await phaseAt(0.95);

    // The whole point of the section: scrolling moves through the panels.
    expect(atStart).toBe(0);
    expect(atEnd).toBeGreaterThan(atStart);
    expect(atMiddle).toBeGreaterThanOrEqual(atStart);
  });

  test("pins and releases rather than sticking", async ({ page }) => {
    await page.goto("/");
    const posAt = async (ratio: number) => {
      await page.evaluate((r) => {
        const t = document.getElementById("nv-adapt-track")!;
        window.scrollTo(0, Math.max(0, t.offsetTop + (t.offsetHeight - window.innerHeight) * r));
      }, ratio);
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
      );
      return page.evaluate(() => document.getElementById("nv-pin")?.style.position ?? "none");
    };

    // Before the track it sits in flow; inside it, it is fixed.
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await posAt(0.5)).toBe("fixed");
    // Past the end it returns to flow, or the section would never let go.
    expect(await posAt(1.2)).toBe("absolute");
  });
});

test.describe("the classroom section", () => {
  test("reveals its tiles on scroll", async ({ page }) => {
    await page.goto("/");
    const shownAt = async (y: number) => {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
      );
      return page.evaluate(
        () =>
          [...document.querySelectorAll<HTMLElement>("#nv-classroom [style*='opacity']")].filter(
            (t) => t.style.opacity === "1",
          ).length,
      );
    };
    await page.evaluate(() => {
      const s = document.getElementById("nv-classroom")!;
      window.scrollTo(0, s.offsetTop - window.innerHeight);
    });
    const before = await shownAt(await page.evaluate(() => window.scrollY));
    const after = await shownAt(
      await page.evaluate(() => document.getElementById("nv-classroom")!.offsetTop),
    );
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
