"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ApiError,
  signalsApi,
  type SignalEvent,
  type SignalSessionType,
} from "@/lib/api";
import { getToken } from "@/lib/auth/session";
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
 *   const { trackEvent } = useSignals(sessionId, lessonId);
 *   trackEvent("time_on_segment", { segmentId, duration });
 *
 * THE SESSION ID MUST BE THE BACKEND'S. Both `session.sessionId` and every
 * `events[].sessionId` are declared `format: uuid`, and the player used to
 * pass a string it built itself - `lesson-<id>-<random>`. It is not a UUID, so
 * EVERY batch this app ever sent was rejected 422 before a single field was
 * read: time on segment, scroll depth, replays, modality switches,
 * comprehension responses, breaks. The whole evidence stream the Intelligence
 * Framework runs on, silently refused at the door.
 *
 * Silently, because a 4xx is deliberately not re-queued (it would fail
 * identically every five seconds forever) and the failure has no user-facing
 * effect. Nothing surfaced it until the network tab was read against a real
 * signed-in account.
 *
 * So `sessionId` is now the id `POST /api/v1/lessons/{id}/session` issues -
 * the same one `PUT /progress` requires, which is the backend telling us these
 * are one session, not two. It arrives asynchronously, so events captured
 * before it lands are HELD (capped, newest kept) and go out with the first
 * batch that can be addressed, rather than being thrown at a validator that
 * will refuse them.
 *
 * `lessonId` is NULLABLE as of 3 Sep, and `sessionType` says what a stream is -
 * lesson, onboarding, profiling or sso. A non-lesson stream can finally be
 * addressed, so the note that used to sit here (holding forever, not this
 * hook's to fix) is resolved.
 *
 * TWO WAYS A BATCH CAN BE LOST, and both are guarded:
 *
 * Ingest is Bearer-only, and a 4xx batch is DROPPED rather than retried -
 * correctly, since a contract rejection would fail identically every five
 * seconds forever. But onboarding happens BEFORE a session exists, so every
 * pre-auth batch would 401 and be dropped: a child's whole profiling stream,
 * gone, with nothing to show it. So an unauthenticated flush now HOLDS
 * instead of sending, and the events go out on the first flush after
 * `POST /auth/pin` returns a session.
 *
 * Holding is capped and keeps the NEWEST events, so a stream that never gets
 * a session costs a bounded amount of memory rather than growing for the life
 * of the screen. That is a real loss, and the honest one: the alternative is
 * pretending a 401 was a delivery.
 */
/** The ingest contract declares both ids `format: uuid`; anything else is a 422. */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useSignals(
  sessionId: string | null,
  lessonId?: string,
  sessionType: SignalSessionType = "lesson",
) {
  const queue = useRef<SignalEvent[]>([]);
  const sessionRef = useRef(sessionId);
  const lessonRef = useRef(lessonId);
  const typeRef = useRef(sessionType);
  // The envelope's startedAt: when this session began capturing (reset per id).
  const startedAtRef = useRef<string>(new Date().toISOString());

  // Keep the latest ids in refs without mutating them during render.
  useEffect(() => {
    // Only a genuinely NEW session restarts the capture window. Going from
    // "not issued yet" to the issued id is this session resolving, not a
    // second one - resetting there would stamp the envelope later than the
    // events it carries.
    if (sessionRef.current && sessionRef.current !== sessionId) {
      startedAtRef.current = new Date().toISOString();
    }
    sessionRef.current = sessionId;
    lessonRef.current = lessonId;
    typeRef.current = sessionType;
  }, [sessionId, lessonId, sessionType]);

  const flush = useCallback(() => {
    if (queue.current.length === 0) return;

    const session = sessionRef.current;
    const lesson = lessonRef.current;
    const type = typeRef.current;
    const hold = () => {
      if (queue.current.length > SIGNAL_BATCH.MAX_HELD_EVENTS) {
        queue.current = queue.current.slice(-SIGNAL_BATCH.MAX_HELD_EVENTS);
      }
    };

    // Ingest is Bearer-only. Without a token this would 401, and a 4xx batch
    // is dropped - so onboarding's whole stream would vanish. Hold it for the
    // session that PIN completion is about to create.
    if (!getToken()) {
      hold();
      return;
    }

    // The session id is always required and always a UUID. The lesson id is
    // required only for a LESSON stream; onboarding, profiling and sso send
    // null and say so through `sessionType`.
    if (!session || !UUID.test(session)) {
      hold();
      return;
    }
    const lessonOk = type === "lesson" ? !!lesson && UUID.test(lesson) : true;
    if (!lessonOk) {
      hold();
      return;
    }

    const batch = queue.current;
    queue.current = [];
    signalsApi
      .submitBatch(
        {
          sessionId: session,
          lessonId: type === "lesson" ? (lesson ?? null) : null,
          sessionType: type,
          startedAt: startedAtRef.current,
        },
        batch,
      )
      .catch((cause) => {
        // Re-queue only what can heal: network failures and server errors.
        // A 4xx (no session yet, contract rejection) would fail identically
        // every 5s forever - drop those batches instead of hammering.
        const status = cause instanceof ApiError ? cause.status : 0;
        if (status >= 400 && status < 500) return;
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
