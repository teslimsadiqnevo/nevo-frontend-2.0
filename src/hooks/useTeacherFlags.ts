"use client";

import { useCallback } from "react";
import { intelligenceApi, type AttentionFlag } from "@/lib/api/intelligence";
import { useLiveQuery } from "./useLiveQuery";
import { useStudentDirectory } from "./useStudentDirectory";

/**
 * "Worth your attention" - the teacher's open flags, from
 * `GET /api/intelligence/flags`.
 *
 * The endpoint names a student by id only, so the directory resolves the name
 * and class. A flag whose student cannot be resolved still shows: the
 * description is the substance, and dropping a flag because we could not
 * label it would hide the very thing the teacher is meant to see.
 *
 * Acknowledged flags are filtered out - the section is what still needs the
 * teacher, not a history.
 *
 * WHAT THE CARD LOSES. C03 pairs each flag with a five-bar evidence sparkline,
 * an evidence caption and two actions. None has a source: the flag carries no
 * series and no target. A live card therefore shows the accent, who it is
 * about, what Nevo noticed and when - and one action that genuinely works.
 *
 * `evidenceSeries` and `actionTargets` shipped on 31 Aug, and design then
 * deferred the flag card's sparkline AND its second action to v1.5 - so the
 * card ships without them deliberately, and neither field is read.
 *
 * `acknowledged` has a write now (`POST /api/intelligence/flags/{id}/
 * acknowledge`) and this hook already filters acknowledged flags out, but
 * NOTHING on C03 acknowledges one: the card's second slot is navigation, and
 * design deferred it. The endpoint has no caller until a control is drawn.
 */

export interface TeacherFlag {
  id: string;
  /** The student's name, or null when the directory could not resolve it. */
  name: string | null;
  /** Their class, when known. */
  context: string | null;
  note: string;
  generatedAt: string;
  /** Navy accent and the drop glyph, as C03 uses for a sudden change. */
  isSudden: boolean;
}

/** C03 distinguishes a sudden change from a pattern; `flagType` has no enum. */
function suddenish(flagType: string): boolean {
  const t = flagType.toLowerCase();
  return (
    t.includes("sudden") ||
    t.includes("drop") ||
    t.includes("stall") ||
    t.includes("stopped") ||
    t.includes("disengag")
  );
}

export interface TeacherFlags {
  flags: TeacherFlag[];
  /** Live flags are in hand - an empty list is a real calm morning. */
  live: boolean;
  /** The call failed; the caller should not claim anything either way. */
  failed: boolean;
  loading: boolean;
}

export function useTeacherFlags(): TeacherFlags {
  const run = useCallback(() => intelligenceApi.getFlags(), []);
  const { data, failed, loading } = useLiveQuery<AttentionFlag[]>(run, []);
  const { students } = useStudentDirectory();

  if (data === null) return { flags: [], live: false, failed, loading };

  const byId = new Map(students.map((s) => [s.studentId, s]));
  return {
    flags: data
      .filter((f) => !f.acknowledged)
      .map((f) => {
        const student = byId.get(f.studentId);
        return {
          id: f.id,
          name: student?.name ?? null,
          context: student?.className ?? null,
          note: f.description,
          generatedAt: f.generatedAt,
          isSudden: suddenish(f.flagType),
        };
      }),
    live: true,
    failed: false,
    loading: false,
  };
}
