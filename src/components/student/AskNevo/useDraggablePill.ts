"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

/**
 * Lets a child move the Ask Nevo trigger out of their own way.
 *
 * It is `fixed`, so it sits ON whatever is scrolling underneath - on the lesson
 * player that is the text they are reading. #313 bought clearance by padding
 * the bottom of the player, which stops the trigger covering the LAST line but
 * does nothing for a child who simply wants it somewhere else. Where "out of
 * the way" is depends on the child, the device, the hand they hold it in and
 * what they are doing, so this is theirs to decide rather than ours to guess.
 *
 * THE HARD PART IS THAT IT MUST STILL BE A BUTTON. A drag and a tap begin
 * identically, so movement past `THRESHOLD_PX` is what separates them - below
 * that it is a tap and the drawer opens as before. Anything else would make the
 * control unreliable for a child with a tremor or an imprecise touch, which is
 * a large part of who this app is for.
 *
 * It cannot be dragged off screen: every position is clamped into the viewport,
 * and re-clamped when the viewport changes, so a rotated tablet can never
 * strand it somewhere unreachable.
 */

/** Movement below this is a tap, not a drag. */
const THRESHOLD_PX = 6;
/** Keep this much of a gap between the trigger and any viewport edge. */
const MARGIN_PX = 8;
const STORAGE_KEY = "nevo.asknevo.offset";

interface Offset {
  x: number;
  y: number;
}

const ZERO: Offset = { x: 0, y: 0 };

function read(): Offset {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return ZERO;
    const v = JSON.parse(raw) as Partial<Offset>;
    return typeof v?.x === "number" && typeof v?.y === "number"
      ? { x: v.x, y: v.y }
      : ZERO;
  } catch {
    // Private mode, blocked storage: it just starts where it was designed to.
    return ZERO;
  }
}

function write(offset: Offset): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offset));
  } catch {
    // The move still applies for this session; it just is not remembered.
  }
}

export interface DraggablePill {
  /** Spread onto the button. */
  handlers: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
  };
  style: React.CSSProperties;
  dragging: boolean;
}

/**
 * The CALLER owns the element ref and passes it in, rather than this returning
 * one. That is not a style preference: an object returned from a hook that
 * carries a ref is treated by the React Compiler's `react-hooks/refs` rule as a
 * ref container, and every read of `.style` or `.dragging` on it in JSX then
 * fails as "cannot access refs during render". Handing the ref in keeps the
 * return value plain data.
 *
 * @param elRef the button this is moving.
 * @param onActivate what a real tap should do - opening the drawer.
 */
export function useDraggablePill(
  elRef: RefObject<HTMLElement | null>,
  onActivate: () => void,
): DraggablePill {
  const [offset, setOffset] = useState<Offset>(ZERO);
  const [dragging, setDragging] = useState(false);
  // A drag ends in a click event the browser fires anyway; this swallows it so
  // moving the trigger never also opens the drawer.
  const movedRef = useRef(false);
  // Held in a ref so `onClick` never has to depend on it: the caller passes a
  // fresh closure each render, and depending on it would rebuild every handler
  // on every frame of a drag.
  const activateRef = useRef(onActivate);
  useEffect(() => {
    activateRef.current = onActivate;
  }, [onActivate]);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  // Mirrors `offset` for the pointer handlers, which need the committed value
  // without re-subscribing on every frame of a drag. Synced in an effect and
  // NOT during render - `react-hooks/refs` forbids the latter, and this file is
  // the third place in this codebase to have tried it.
  const offsetRef = useRef(ZERO);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  /** The nearest offset to `want` that keeps the whole trigger on screen. */
  const clamp = useCallback(
    (want: Offset): Offset => {
      const el = elRef.current;
      if (!el) return want;
      const r = el.getBoundingClientRect();
      // The rect already includes the current transform, so take it back off to
      // find where the CSS anchor actually puts this thing.
      const baseLeft = r.left - offsetRef.current.x;
      const baseTop = r.top - offsetRef.current.y;
      const minX = MARGIN_PX - baseLeft;
      const maxX = window.innerWidth - MARGIN_PX - r.width - baseLeft;
      const minY = MARGIN_PX - baseTop;
      const maxY = window.innerHeight - MARGIN_PX - r.height - baseTop;
      return {
        x: Math.min(Math.max(want.x, minX), maxX),
        y: Math.min(Math.max(want.y, minY), maxY),
      };
    },
    [elRef],
  );

  // Restore after mount: localStorage is invisible to the server, so reading it
  // during render would be a hydration mismatch. Clamped on the way in, because
  // the position may have been stored on a larger window - or by the other
  // breakpoint's trigger, which is a different size.
  useEffect(() => {
    const stored = read();
    if (stored.x === 0 && stored.y === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffset(clamp(stored));
  }, [clamp]);

  // A rotated tablet or a resized window must never strand it off screen.
  useEffect(() => {
    const onResize = () => setOffset((o) => clamp(o));
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [clamp]);

  // Remember where they put it, once the drag is over. Declared after the ref
  // sync above so `offsetRef` already holds the final position when this runs.
  useEffect(() => {
    if (dragging) return;
    const o = offsetRef.current;
    if (o.x !== 0 || o.y !== 0) write(o);
  }, [dragging]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    // Left button / touch / pen only - a right-click is not a drag.
    if (e.button !== 0) return;
    movedRef.current = false;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (!movedRef.current && Math.hypot(dx, dy) < THRESHOLD_PX) return;
      if (!movedRef.current) {
        movedRef.current = true;
        setDragging(true);
      }
      setOffset(
        clamp({ x: startRef.current.ox + dx, y: startRef.current.oy + dy }),
      );
    },
    [clamp],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (movedRef.current) setDragging(false);
  }, []);

  const onClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (movedRef.current) {
      // This click is the tail of a drag. Swallow it, and let the NEXT press
      // start clean - a child who moves it and then taps it must get the
      // drawer.
      movedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    activateRef.current();
  }, []);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onClick },
    style: {
      transform: `translate(${offset.x}px, ${offset.y}px)`,
      // The browser must not pan the page while a child is moving this.
      touchAction: "none",
      // The idle button animates `transform` on press; following the pointer
      // through that transition would lag behind the finger.
      transition: dragging ? "none" : undefined,
    },
    dragging,
  };
}
