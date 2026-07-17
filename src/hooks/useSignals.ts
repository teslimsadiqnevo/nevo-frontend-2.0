"use client";

import { useCallback, useEffect, useRef } from "react";
import { signalsApi, type SignalEvent } from "@/lib/api";
import { SIGNAL_BATCH, type SignalEventType } from "@/lib/constants";

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

  const trackEvent = useCallback(
    (type: SignalEventType, payload?: Record<string, unknown>) => {
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
