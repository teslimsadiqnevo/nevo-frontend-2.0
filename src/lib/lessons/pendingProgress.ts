import { lessonsApi } from "@/lib/api/lessons";
import { ApiError } from "@/lib/api/client";
import { getToken } from "@/lib/auth/session";
import type { LessonStatus } from "@/lib/api/lessons";

/**
 * Where a child got to, when the write did not land.
 *
 * `useLessonProgress` already holds the newest failed write and re-sends it on
 * `online` - and that mechanism is correct, for exactly as long as the player
 * stays mounted. It held it in a REF, and registered the `online` listener in
 * the same hook, so both died the moment the player unmounted.
 *
 * Which is the one moment it was guaranteed to be needed. A child offline
 * mid-lesson is shown a banner saying we will save where they got to when they
 * are back; they tap X, and a dialog headed "Your progress is saved" offers
 * "Leave for now". Taking it fires one more doomed write and immediately routes
 * away - unmounting the hook, removing the listener, and dropping the buffer.
 * When the connection returned there was nothing left to send, and the child
 * re-read the segments they had already done.
 *
 * So the two screens that explicitly promise recovery were the two that
 * guaranteed it could not happen.
 *
 * Held here instead: outside the hook, outside the player, and across the
 * navigation. Keyed by lesson, because a child can leave more than one.
 */

const KEY = "nevo.lesson.pendingProgress";

/** A position from another week is not worth restoring over a newer one. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface PendingWrite {
  sessionId: string;
  status: LessonStatus;
  segment?: number;
  module?: number;
  heldAt: number;
}

type Store = Record<string, PendingWrite>;

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Private mode or a full quota. The in-memory re-send still covers the
    // case where the player stays open; this only adds surviving the exit.
  }
}

/** Remember a write that did not land, replacing any older one for this lesson. */
export function holdProgress(
  lessonId: string,
  entry: Omit<PendingWrite, "heldAt">,
): void {
  const store = read();
  store[lessonId] = { ...entry, heldAt: Date.now() };
  write(store);
}

export function clearProgress(lessonId: string): void {
  const store = read();
  if (!(lessonId in store)) return;
  delete store[lessonId];
  write(store);
}

export function pendingProgressFor(lessonId: string): PendingWrite | null {
  return read()[lessonId] ?? null;
}

/**
 * Send everything still held, for every lesson.
 *
 * Deliberately not per-lesson: a child who gave up on a lesson offline may
 * never open that lesson again, and their position should still reach Home's
 * "Pick back up" card. Mounting any student screen is enough.
 *
 * A 4xx DROPS the entry - the server has answered about this write, and a
 * stale session id it will never accept would otherwise be retried for ever.
 * Anything else keeps it, because a transport failure is exactly what this is
 * for.
 */
export async function flushPendingProgress(): Promise<void> {
  if (!getToken()) return;
  const store = read();
  const lessonIds = Object.keys(store);
  if (lessonIds.length === 0) return;

  await Promise.all(
    lessonIds.map(async (lessonId) => {
      const held = store[lessonId];
      if (!held?.sessionId || Date.now() - held.heldAt > MAX_AGE_MS) {
        clearProgress(lessonId);
        return;
      }
      try {
        await lessonsApi.saveProgress(lessonId, {
          sessionId: held.sessionId,
          status: held.status,
          ...(held.segment !== undefined
            ? { segmentPosition: held.segment }
            : {}),
          ...(held.module !== undefined ? { modulePosition: held.module } : {}),
        });
        clearProgress(lessonId);
      } catch (cause) {
        const status = cause instanceof ApiError ? cause.status : 0;
        if (status >= 400 && status < 500) clearProgress(lessonId);
      }
    }),
  );
}
