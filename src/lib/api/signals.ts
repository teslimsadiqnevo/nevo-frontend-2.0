import { api } from "./client";
import type { SignalEventType } from "@/lib/constants";

/**
 * Signal event submission (FE Architecture §3). Batching/flushing lives in the
 * `useSignals` hook; this module just submits a flushed batch to the backend.
 */
export interface SignalEvent {
  type: SignalEventType;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export const signalsApi = {
  /** Flush a batch of events for a lesson session → `/api/signals/`. */
  submitBatch: (sessionId: string, events: SignalEvent[]) =>
    api.post("/api/signals/", { sessionId, events }),
};
