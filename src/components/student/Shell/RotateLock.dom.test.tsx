import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { RotateLock } from "./RotateLock";

/**
 * Covering the app is not the same as stopping it.
 *
 * `RotatePrompt` is a `fixed inset-0` overlay shown by a media query when a
 * touch device is held landscape. It hid the app and left it running: every
 * control still in the tab order, every heading still in the accessibility
 * tree. A child on a keyboard or on switch access could tab into the lesson
 * they had just been asked to turn away from and activate things they could not
 * see, and a screen reader read the whole page out as if nothing had happened.
 *
 * None of that is visible to anyone testing with a mouse on a desktop, which
 * never matches the query at all - which is why it lasted.
 */

let listeners: (() => void)[] = [];
let sideways = false;

/**
 * A `matchMedia` that can be turned. Replacing the one in `vitest.setup.ts` is
 * safe - it is ours, not jsdom's; jsdom implements none.
 */
function installMatchMedia() {
  listeners = [];
  sideways = false;
  window.matchMedia = ((query: string) =>
    ({
      get matches() {
        return sideways;
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => {
        listeners = listeners.filter((l) => l !== fn);
      },
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

/** Turn the tablet, and tell everyone watching. */
function turn(to: "sideways" | "upright") {
  act(() => {
    sideways = to === "sideways";
    listeners.forEach((l) => l());
  });
}

const app = () => document.querySelector("div[inert], div:has(> button)");

beforeEach(() => {
  installMatchMedia();
});

afterEach(() => {
  listeners = [];
});

function Lesson() {
  return (
    <RotateLock>
      <button type="button">Next</button>
    </RotateLock>
  );
}

describe("RotateLock", () => {
  it("leaves the app alone while the tablet is upright", () => {
    render(<Lesson />);

    expect(app()?.hasAttribute("inert")).toBe(false);
  });

  it("makes the app inert when the tablet is turned", () => {
    // The regression: without this the button below is still tabbable and
    // still in the accessibility tree, behind an opaque overlay.
    render(<Lesson />);

    turn("sideways");

    expect(app()?.hasAttribute("inert")).toBe(true);
  });

  it("gives it back when the tablet comes upright again", () => {
    render(<Lesson />);
    turn("sideways");

    turn("upright");

    expect(app()?.hasAttribute("inert")).toBe(false);
  });

  it("moves focus to the prompt, so it is announced at all", () => {
    // `role="status"` on a region whose content never changes - only its CSS
    // `display` - is not reliably announced by anything. Focus is.
    render(<Lesson />);
    screen.getByRole("button", { name: "Next" }).focus();

    turn("sideways");

    expect(document.activeElement).toBe(screen.getByRole("status"));
    expect(document.activeElement).toHaveTextContent(
      "Turn your tablet upright",
    );
  });

  it("puts focus back where the child left it", () => {
    render(<Lesson />);
    const next = screen.getByRole("button", { name: "Next" });
    next.focus();
    turn("sideways");

    turn("upright");

    expect(document.activeElement).toBe(next);
  });

  it("never renders inert on the server", () => {
    // The server cannot know which way a tablet is held. Reading the media
    // query there would throw, and guessing would hydrate into a mismatch - so
    // the server snapshot is always upright and the client settles after
    // mount. Asserted through an actual server render, because that is the
    // only place the server snapshot is ever used.
    sideways = true;

    const markup = renderToStaticMarkup(<Lesson />);

    expect(markup).not.toContain("inert");
  });
});
