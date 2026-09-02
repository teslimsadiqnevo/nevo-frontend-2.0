"use client";

import { useCallback } from "react";
import { classesApi, type ClassStudent } from "@/lib/api/classes";
import { useLiveQuery } from "./useLiveQuery";

/**
 * One class's roster, from `GET /api/v1/classes/{class_id}/students`.
 *
 * The endpoint gives identity, account status, whether Nevo has observed the
 * learner yet, and when they last had a session. It gives no per-student
 * observations, chips or flags - those are the intelligence layer's, and the
 * fixture-backed class detail is the only place they exist today.
 *
 * Three outcomes a screen has to tell apart, because they read very
 * differently to a teacher: the roster arrived, the roster arrived and is
 * genuinely empty (nobody has joined yet), and we could not load it. The
 * last one must never render as the second.
 *
 * `observations` and `seatContext` are on every roster row. `observations` is
 * now BOUNDED - `{pattern, count}` with a closed five-value enum, replacing
 * the untyped `string[]` it shipped as on 31 Aug (backend, 3 Sep). The reason
 * it was never drawn is the reason it changed: an untyped string is exactly
 * what the Zero-Tag rulings say must not reach a teacher sight unseen, and
 * the guarantee now lives in the schema rather than in an assurance.
 *
 * Still not drawn, and that is a design question rather than a contract one:
 * C05's roster has no row drawn for it, and the wording for each pattern is
 * ours to write. Read, not drawn - but no longer blocked.
 */

export interface ClassRoster {
  students: ClassStudent[];
  loading: boolean;
  /** The call did not land - distinct from a class with no students. */
  failed: boolean;
}

export function useClassRoster(classId: string): ClassRoster {
  const run = useCallback(
    () => classesApi.classStudents(classId),
    [classId],
  );
  const { data, failed, loading } = useLiveQuery<ClassStudent[]>(run, [classId]);
  return { students: data ?? [], loading, failed };
}

/** The name to show: the given/family pair, or the backend's fallback. */
export function studentName(student: ClassStudent): string {
  const full = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || student.displayName;
}

/** When they were last here, in the console's plain voice. */
export function lastSeenLine(student: ClassStudent): string {
  if (!student.latestSessionAt) return "Hasn’t started yet";
  const then = new Date(student.latestSessionAt);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "Here today";
  if (days === 1) return "Here yesterday";
  if (days < 7) return `Here ${days} days ago`;
  return `Last here ${then.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;
}
