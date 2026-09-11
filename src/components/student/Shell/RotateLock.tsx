"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { RotatePrompt } from "./RotatePrompt";

/**
 * Hold the app still while the rotate prompt is up.
 *
 * `RotatePrompt` is pure CSS - shown by a media query when a touch device is
 * held landscape - and it COVERS the app without stopping it. The page beneath
 * stayed fully live: every control still in the tab order, every heading still
 * in the accessibility tree, every button still clickable by anything that
 * reaches it. A child on a keyboard or on switch access could tab straight into
 * the lesson they cannot see and activate things blind, and a screen reader
 * read out a page its user had been asked to turn away from - with "Turn your
 * tablet upright" somewhere in the middle of it.
 *
 * Keyboards and switch access are not edge cases here. They are how a good
 * number of the children this is built for drive a tablet at all.
 *
 * `inert` takes the whole subtree out of the tab order AND out of the
 * accessibility tree in one attribute, so the prompt becomes the only thing
 * there is - which is what it looks like. Focus moves to it and returns where
 * it was when the device comes back upright.
 *
 * The prompt itself is left exactly as it was, CSS and all: it must appear the
 * instant the device turns, including before this hydrates. Where JavaScript
 * has not run, or `inert` is not supported, the behaviour is the one that
 * shipped - covered but live - and nothing is worse than it was.
 */
const HELD_SIDEWAYS = "(orientation: landscape) and (pointer: coarse)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(HELD_SIDEWAYS);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const clientSnapshot = () => window.matchMedia(HELD_SIDEWAYS).matches;
/** The server cannot know which way a tablet is being held. */
const serverSnapshot = () => false;

export function RotateLock({ children }: { children: React.ReactNode }) {
  const sideways = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  const prompt = useRef<HTMLDivElement>(null);
  /** Where the child was before the prompt took over. */
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sideways) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    prompt.current?.focus();
    return () => {
      // By the time this runs the subtree is no longer inert, so the element
      // can take focus again. It may also have gone - a lesson advanced, a
      // dialog closed - in which case `focus()` is a no-op and the browser
      // leaves focus on the body, which is where it would have been anyway.
      returnTo.current?.focus();
      returnTo.current = null;
    };
  }, [sideways]);

  return (
    <>
      <div inert={sideways}>{children}</div>
      <RotatePrompt ref={prompt} />
    </>
  );
}
