"use client";

import { useEffect } from "react";
import { writeSignal } from "@/lib/signals/ephemeralStore";

/**
 * Minimal behavioural capture into the ephemeral store (SCRUM-76): interaction
 * timing the affective inference engine (SCRUM-70) reads locally. Everything
 * stays on-device in IndexedDB and is purged at session end - payloads carry
 * timing and coarse position only, never content (no key values, no text).
 */
export function useBehaviouralCapture(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (e: PointerEvent) => {
      void writeSignal("click", {
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        pointerType: e.pointerType,
      });
    };
    // Timing only - deliberately no e.key, so no content is ever captured.
    const onKeyDown = () => {
      void writeSignal("keystroke", {});
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);
}
