"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  uploadsApi,
  type UploadStage,
  type UploadStatus,
  type UploadStructure,
} from "@/lib/api/uploads";
import { getToken } from "@/lib/auth/session";

/**
 * Drives the staged (block) upload: stage a file, then poll until the parse
 * settles.
 *
 * POLLING, not a race. The status endpoint is the only way to learn a parse
 * has finished, and there is no push - so this asks again on an interval and
 * stops when the contract says it is done. It does NOT cap the wait and call
 * a slow parse a failure: only `status: "failed"`, or a rejected request, is
 * a failure. A parse that takes longer than expected is still a parse.
 *
 * `stage` is the backend's own vocabulary (`lessons` -> `structure` ->
 * `complete`), enumerated on 1 Sep - before that it was an unconstrained
 * string and nothing could be mapped onto the designed steps.
 */

const POLL_MS = 2000;
/** Long enough to say "this is taking a while", never to give up. */
const SLOW_AFTER_MS = 30_000;

export interface StagedUpload {
  uploadId: string | null;
  status: UploadStatus | null;
  stage: UploadStage | null;
  structure: UploadStructure | null;
  /** The parse failed, or the request did. */
  failed: boolean;
  /** The server's own reason, when it gave one. */
  error: string | null;
  /** Still going, and long enough that a teacher deserves telling. */
  slow: boolean;
  start: (file: File, scope: string, subject?: string) => void;
  reset: () => void;
}

export function useStagedUpload(): StagedUpload {
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [stage, setStage] = useState<UploadStage | null>(null);
  const [structure, setStructure] = useState<UploadStructure | null>(null);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  /**
   * Bumped after every poll so the effect below always re-schedules.
   *
   * Keying the effect on `status` alone stopped the polling dead: the create
   * response already says "processing", so the first tick set it to the same
   * value, nothing changed, and no further tick was ever scheduled. One poll
   * and then silence, with the screen waiting for ever.
   */
  const [tick, setTick] = useState(0);
  const startedAt = useRef<number | null>(null);

  const reset = useCallback(() => {
    setUploadId(null);
    setStatus(null);
    setStage(null);
    setStructure(null);
    setFailed(false);
    setError(null);
    setSlow(false);
    setTick(0);
    startedAt.current = null;
  }, []);

  const start = useCallback(
    (file: File, scope: string, subject?: string) => {
      if (!getToken()) return;
      reset();
      startedAt.current = Date.now();
      void uploadsApi
        .create(file, scope, subject)
        .then((res) => {
          setUploadId(res.uploadId);
          setStatus(res.status);
          setStage(res.stage);
        })
        .catch(() => setFailed(true));
    },
    [reset],
  );

  // Poll while the parse is still running. Settles on ready/confirmed, and
  // stops on failed or cancelled with the server's reason kept.
  useEffect(() => {
    if (!uploadId) return;
    if (status === "ready" || status === "confirmed") return;
    if (status === "failed" || status === "cancelled") return;
    let cancelled = false;
    const tick = setTimeout(() => {
      void uploadsApi
        .status(uploadId)
        .then((res) => {
          if (cancelled) return;
          setStatus(res.status);
          setStage(res.stage);
          setStructure(res.structure ?? null);
          setError(res.error);
          if (res.status === "failed") setFailed(true);
          if (startedAt.current) {
            setSlow(Date.now() - startedAt.current > SLOW_AFTER_MS);
          }
          setTick((n) => n + 1);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(tick);
    };
    // `tick` is what guarantees the next poll; `status` is what stops it.
  }, [uploadId, status, tick]);

  return {
    uploadId,
    status,
    stage,
    structure,
    failed,
    error,
    slow,
    start,
    reset,
  };
}
