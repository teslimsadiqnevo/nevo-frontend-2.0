import { api } from "./client";
import type { SignalEventType } from "@/lib/constants";

/**
 * Signal batch submission (FE Architecture §3) - wired to the live backend
 * (`POST /api/signals/`, Bearer). Batching/flushing lives in the `useSignals`
 * hook; this module shapes a flushed batch to the ingest contract.
 *
 * The backend validates `eventType` against a closed enum, so a batch may only
 * carry types it knows - one unknown type rejects the whole batch (422).
 * Types outside the enum (session context, system-busy brackets, module
 * boundaries, breaks, baseline profiling) are partitioned out at submit and
 * dropped after a dev-console note.
 * TODO(api): flagged to backend - extend SignalEventType with the Touch Signal
 * Contract + SCRUM-101/104 types so the full stream can land.
 */
export interface SignalEvent {
  type: SignalEventType;
  timestamp: string;
  payload?: Record<string, unknown>;
}

/**
 * What a stream of signals belongs to.
 *
 * Onboarding and profiling are not lessons, and used to be sent with a made-up
 * lesson tag in `lessonId` because the field was required. `lessonId` is now
 * nullable and this says what the stream actually is (backend, 3 Sep).
 */
export type SignalSessionType = "lesson" | "onboarding" | "profiling" | "sso";

/** The session envelope the ingest endpoint requires with every batch. */
export interface SignalSessionEnvelope {
  sessionId: string;
  /**
   * The lesson this stream belongs to. NULL for a stream that is not a lesson
   * - see `sessionType`, which is how the backend tells them apart now.
   */
  lessonId: string | null;
  /** Defaults to "lesson" server-side, so non-lesson streams must say so. */
  sessionType?: SignalSessionType;
  /** ISO timestamp of the session's first event capture. */
  startedAt: string;
}

/** 202 receipt. */
export interface SignalBatchReceipt {
  session_id: string;
  accepted_events: number;
}

/** Event types the backend ingest enum accepts today (OpenAPI SignalEventType). */
const BACKEND_EVENT_TYPES = new Set([
  "time_on_segment",
  "replay",
  "scroll",
  "simplify_trigger",
  "expand_trigger",
  "slower_trigger",
  "comprehension_response",
  "exit_attempt",
  "break_suggested",
  "break_taken",
  "engagement_signal",
  "modality_suggestion_shown",
  "modality_suggestion_accepted",
  "modality_suggestion_declined",
  "modality_suggestion_ignored",
  "modality_switch_outcome",
  "modality_manual_switch",
  "calculation_step_response",
  "calculation_complete",
  "narration_played",
  "narration_replayed",
  "manipulative_piece_placed",
]);

export const signalsApi = {
  /**
   * Submit a flushed batch. Resolves with the receipt, or `null` when nothing
   * in the batch is backend-known (no request made).
   */
  submitBatch: (
    session: SignalSessionEnvelope,
    events: SignalEvent[],
  ): Promise<SignalBatchReceipt | null> => {
    const known = events.filter((e) => BACKEND_EVENT_TYPES.has(e.type));
    if (process.env.NODE_ENV === "development" && known.length < events.length) {
      const dropped = events
        .filter((e) => !BACKEND_EVENT_TYPES.has(e.type))
        .map((e) => e.type);
      console.debug("[signals] dropped types outside the ingest enum:", [
        ...new Set(dropped),
      ]);
    }
    if (known.length === 0) return Promise.resolve(null);
    // No trailing slash: Next 308-redirects slashed API routes before the
    // proxy runs; FastAPI's own slash redirect is followed server-side.
    return api.post<SignalBatchReceipt>("/api/signals", {
      session: {
        sessionId: session.sessionId,
        lessonId: session.lessonId,
        sessionType: session.sessionType ?? "lesson",
        startedAt: session.startedAt,
      },
      events: known.map((e) => ({
        sessionId: session.sessionId,
        eventType: e.type,
        timestamp: e.timestamp,
        eventData: e.payload,
      })),
    });
  },
};
