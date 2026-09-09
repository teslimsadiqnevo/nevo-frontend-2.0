import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { useDraggablePill } from "./useDraggablePill";

/**
 * A drag and a tap begin identically, so the whole risk of making this movable
 * is that it stops being a button.
 *
 * That matters more here than it would elsewhere: this app is built for SEND
 * learners, and a child with a tremor or an imprecise touch will not press
 * cleanly. If a few stray pixels counted as a drag, "Ask Nevo" would silently
 * stop opening for exactly the children most likely to need it. So the
 * threshold is tested from both sides, and so is the click the browser fires at
 * the end of a drag - which would otherwise open the drawer every time a child
 * moved the thing.
 */

const STORAGE_KEY = "nevo.asknevo.offset";

function Pill({ onActivate }: { onActivate: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const pill = useDraggablePill(ref, onActivate);
  return (
    <button
      type="button"
      aria-label="Ask Nevo"
      ref={ref}
      style={pill.style}
      {...pill.handlers}
      data-dragging={pill.dragging}
    />
  );
}

/** jsdom lays nothing out, so the element needs a believable box. */
const stubRect = (left = 300, top = 700, width = 52, height = 52) => {
  Element.prototype.getBoundingClientRect = function () {
    const t = (this as HTMLElement).style.transform;
    const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(t ?? "");
    const dx = m ? Number(m[1]) : 0;
    const dy = m ? Number(m[2]) : 0;
    return {
      left: left + dx,
      top: top + dy,
      width,
      height,
      right: left + dx + width,
      bottom: top + dy + height,
      x: left + dx,
      y: top + dy,
      toJSON: () => ({}),
    } as DOMRect;
  };
};

const press = (el: HTMLElement, x: number, y: number) =>
  fireEvent.pointerDown(el, {
    pointerId: 1,
    button: 0,
    clientX: x,
    clientY: y,
  });
const move = (el: HTMLElement, x: number, y: number) =>
  fireEvent.pointerMove(el, { pointerId: 1, clientX: x, clientY: y });
const lift = (el: HTMLElement, x: number, y: number) =>
  fireEvent.pointerUp(el, { pointerId: 1, clientX: x, clientY: y });

beforeEach(() => {
  window.localStorage.clear();
  stubRect();
  // Pointer capture is not implemented in jsdom.
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = () => true;
  Object.defineProperty(window, "innerWidth", {
    value: 375,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: 812,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("useDraggablePill", () => {
  it("still opens the drawer on a clean tap", () => {
    const onActivate = vi.fn();
    render(<Pill onActivate={onActivate} />);
    const btn = screen.getByRole("button");

    press(btn, 320, 720);
    lift(btn, 320, 720);
    fireEvent.click(btn);

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("still opens the drawer when the press wobbles a few pixels", () => {
    // The case that matters most: an imprecise touch is a tap, not a drag.
    const onActivate = vi.fn();
    render(<Pill onActivate={onActivate} />);
    const btn = screen.getByRole("button");

    press(btn, 320, 720);
    move(btn, 323, 722);
    lift(btn, 323, 722);
    fireEvent.click(btn);

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(btn.style.transform).toBe("translate(0px, 0px)");
  });

  it("moves instead of opening when the child actually drags it", () => {
    const onActivate = vi.fn();
    render(<Pill onActivate={onActivate} />);
    const btn = screen.getByRole("button");

    press(btn, 320, 720);
    move(btn, 300, 640);
    lift(btn, 300, 640);
    // The browser fires this after any drag that began on the element.
    fireEvent.click(btn);

    expect(onActivate).not.toHaveBeenCalled();
    expect(btn.style.transform).toBe("translate(-20px, -80px)");
  });

  it("opens on the next tap after being moved", () => {
    const onActivate = vi.fn();
    render(<Pill onActivate={onActivate} />);
    const btn = screen.getByRole("button");

    press(btn, 320, 720);
    move(btn, 300, 640);
    lift(btn, 300, 640);
    fireEvent.click(btn);
    expect(onActivate).not.toHaveBeenCalled();

    // A child who moves it out of the way and then wants help must get help.
    press(btn, 300, 640);
    lift(btn, 300, 640);
    fireEvent.click(btn);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("cannot be dragged off the screen", () => {
    render(<Pill onActivate={vi.fn()} />);
    const btn = screen.getByRole("button");

    // Hurl it far past the top-left corner.
    press(btn, 320, 720);
    move(btn, -5000, -5000);
    lift(btn, -5000, -5000);

    // Base box is left 300 / top 700, so the furthest it may travel is
    // (8 - 300, 8 - 700) - flush against the 8px margin, still fully visible.
    expect(btn.style.transform).toBe("translate(-292px, -692px)");
  });

  it("remembers where it was put", () => {
    render(<Pill onActivate={vi.fn()} />);
    const btn = screen.getByRole("button");

    press(btn, 320, 720);
    move(btn, 300, 640);
    lift(btn, 300, 640);

    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"),
    ).toEqual({
      x: -20,
      y: -80,
    });
  });

  it("comes back where it was left", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ x: -20, y: -80 }),
    );

    render(<Pill onActivate={vi.fn()} />);

    expect(screen.getByRole("button").style.transform).toBe(
      "translate(-20px, -80px)",
    );
  });
});
