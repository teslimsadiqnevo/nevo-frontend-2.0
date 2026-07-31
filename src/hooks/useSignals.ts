"use client";

import { useCallback, useEffect, useRef } from "react";
import { signalsApi, type SignalEvent } from "@/lib/api";
import {
  SIGNAL_BATCH,
  SIGNAL_EVENT_TYPES,
  type SignalEventType,
} from "@/lib/constants";

/** Form-factor tag for session context (Touch Signal Contract G6). */
function formFactor(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/** Signature of `trackEvent` — pass down to child components that emit signals. */
export type TrackEvent = (
  type: SignalEventType,
  payload?: Record<string, unknown>,
) => void;

/**
 * Signal collection (FE Architecture §3) — central to the Intelligence Framework.
 *
 * Captures interaction events and batches them: flushes every 5s, immediately at
 * 20 events, and on unmount (lesson exit/completion). On network failure the
 * batch is re-queued rather than lost (offline resilience).
 *
 *   const { trackEvent } = useSignals(sessionId);
 *   trackEvent("time_on_segment", { segmentId, duration });
 */
export function useSignals(sessionId: string) {
  const queue = useRef<SignalEvent[]>([]);
  const sessionRef = useRef(sessionId);

  // Keep the latest sessionId in a ref without mutating it during render.
  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  const flush = useCallback(() => {
    if (queue.current.length === 0) return;
    const batch = queue.current;
    queue.current = [];
    signalsApi.submitBatch(sessionRef.current, batch).catch(() => {
      // Re-queue on failure so events are never lost silently.
      queue.current = [...batch, ...queue.current];
    });
  }, []);

  // Every session opens with its interpretation context (G6): the form factor
  // and reduced-motion mode the signals were produced under. Seeded lazily on
  // the first trackEvent so it is guaranteed FIRST in the stream regardless of
  // effect ordering, and once per session id.
  const contextEmittedFor = useRef<string | null>(null);

  const trackEvent = useCallback(
    (type: SignalEventType, payload?: Record<string, unknown>) => {
      if (contextEmittedFor.current !== sessionRef.current) {
        contextEmittedFor.current = sessionRef.current;
        queue.current.push({
          type: SIGNAL_EVENT_TYPES.SESSION_CONTEXT,
          timestamp: new Date().toISOString(),
          payload: {
            formFactor: formFactor(),
            reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches,
          },
        });
      }
      queue.current.push({
        type,
        timestamp: new Date().toISOString(),
        payload,
      });
      if (queue.current.length >= SIGNAL_BATCH.MAX_BATCH_SIZE) flush();
    },
    [flush],
  );

  useEffect(() => {
    const id = setInterval(flush, SIGNAL_BATCH.FLUSH_INTERVAL_MS);
    return () => {
      clearInterval(id);
      flush();
    };
  }, [flush]);

  return { trackEvent, flush };
}
