/**
 * Micro-behavioural capture for baseline profiling (SCRUM-104 frontend
 * contract): every interaction is stamped with `performance.now()`, raw streams
 * are held ephemerally (IndexedDB, in-memory fallback), reduced to a feature
 * vector on completion, submitted to `/api/baseline/submit`, and the raw data
 * is purged after transmission. Raw streams never leave the device.
 */

export interface CaptureEvent {
  /** e.g. "playback_start", "tap", "check_answer", "module_end". */
  kind: string;
  /** `performance.now()` at the moment of interaction. */
  t: number;
  payload?: Record<string, unknown>;
}

const DB_NAME = "nevo-baseline";
const STORE = "streams";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE))
        req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

/**
 * One capture session spans the whole profiling run. `record` is synchronous
 * (an in-memory push); IndexedDB persistence is batched in the background so
 * timing capture never waits on storage.
 */
export class BaselineCapture {
  private events: CaptureEvent[] = [];
  private db: Promise<IDBDatabase | null> | null = null;
  readonly sessionId: string;

  /** Construction is pure (safe in a state initializer); the DB opens lazily. */
  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  private ensureDb() {
    this.db ??= openDb();
    return this.db;
  }

  record(kind: string, payload?: Record<string, unknown>) {
    this.events.push({ kind, t: performance.now(), payload });
  }

  /** Snapshot the raw stream into IndexedDB (ephemeral, purged on submit). */
  async persist() {
    const db = await this.ensureDb();
    if (!db) return;
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(this.events, this.sessionId);
    } catch {
      // Storage is best-effort; the in-memory stream remains authoritative.
    }
  }

  /** Purge the raw stream everywhere (after the feature vector is submitted). */
  async purge() {
    this.events = [];
    const db = await this.ensureDb();
    if (!db) return;
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(this.sessionId);
    } catch {
      // Best-effort.
    }
  }

  /** All events of a kind, in order. */
  ofKind(kind: string): CaptureEvent[] {
    return this.events.filter((e) => e.kind === kind);
  }

  get stream(): readonly CaptureEvent[] {
    return this.events;
  }
}

/**
 * Reduce the Module 1 stream to its feature-vector slice. Raw taps stay on
 * device; only these aggregates are transmitted.
 * TODO(api): reconcile field names with the ratified baseline contract.
 */
export function reduceGridSpan(capture: BaselineCapture) {
  const taps = capture.ofKind("tap");
  const correct = taps.filter((t) => t.payload?.correct === true);
  const gaps: number[] = [];
  for (let i = 1; i < correct.length; i++) {
    const gap = correct[i].t - correct[i - 1].t;
    if (gap > 0 && gap < 30_000) gaps.push(gap);
  }
  const spans = capture
    .ofKind("round_complete")
    .map((e) => Number(e.payload?.length ?? 0));
  return {
    module: "grid_span",
    maxSpan: spans.length ? Math.max(...spans) : 0,
    roundsCompleted: spans.length,
    retries: taps.filter((t) => t.payload?.correct === false).length,
    meanRecallGapMs: gaps.length
      ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
      : null,
  };
}
