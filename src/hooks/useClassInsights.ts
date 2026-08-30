"use client";

import { useEffect, useState } from "react";
import { intelligenceApi, type AttentionFlag } from "@/lib/api/intelligence";
import {
  classInsightsApi,
  type ClassMasteryRow,
  type ClassMisconception,
} from "@/lib/api/students";
import { getToken } from "@/lib/auth/session";
import { useHasSession } from "./useHasSession";
import { useStudentDirectory } from "./useStudentDirectory";

/**
 * C09 Insights for one class, from three reads.
 *
 * There is no `/classes/{id}/insights` - which is why this looked blocked for
 * most of a day. The data is there under its own names: `misconceptions/class`
 * is the misconception section outright, `mastery/class` is the class-mastery
 * panel (and unlike the per-student read it carries `conceptName`), and the
 * flags endpoint filters by class.
 *
 * WHAT STILL HAS NO SOURCE: the written summary at the top of C09, the
 * per-student recommendations, and C14 A2's "looking ahead". Those stay absent
 * rather than becoming invented prose about a real class.
 *
 * Each read stands alone: a class can have mastery and no misconceptions, and
 * one failing must not empty the others.
 */

export interface InsightsConcept {
  conceptId: string;
  name: string;
  /** 0-100, as the dual-track bars want. */
  understanding: number;
  reading: number;
  studentCount: number;
}

export interface InsightsFlag {
  id: string;
  name: string | null;
  note: string;
  isSudden: boolean;
}

export interface ClassInsightsState {
  misconceptions: ClassMisconception[];
  concepts: InsightsConcept[];
  flags: InsightsFlag[];
  loading: boolean;
  /** Every read landed and there was nothing in any of them. */
  empty: boolean;
}

const pct = (p: number) => Math.round(Math.max(0, Math.min(1, p)) * 100);

function suddenish(flagType: string): boolean {
  const t = flagType.toLowerCase();
  return ["sudden", "drop", "stall", "stopped", "disengag"].some((w) =>
    t.includes(w),
  );
}

export function useClassInsights(classId: string | null): ClassInsightsState {
  const [misconceptions, setMisconceptions] = useState<ClassMisconception[]>([]);
  const [mastery, setMastery] = useState<ClassMasteryRow[]>([]);
  const [flags, setFlags] = useState<AttentionFlag[]>([]);
  const [settled, setSettled] = useState(0);
  const signedIn = useHasSession();
  const { students } = useStudentDirectory();

  useEffect(() => {
    if (!classId || !getToken()) return;
    let cancelled = false;
    // No resets here: `LiveClassInsights` is keyed by class id, so switching
    // class remounts this with fresh state. Clearing it from the effect body
    // would be a setState during render's shadow, which this codebase rules
    // out - and the key is the better answer anyway.
    const done = () => {
      if (!cancelled) setSettled((n) => n + 1);
    };

    void classInsightsApi
      .misconceptions(classId)
      .then((rows) => {
        if (!cancelled) setMisconceptions(rows);
      })
      .catch(() => {})
      .finally(done);
    void classInsightsApi
      .mastery(classId)
      .then((rows) => {
        if (!cancelled) setMastery(rows);
      })
      .catch(() => {})
      .finally(done);
    void intelligenceApi
      .getFlags({ classId })
      .then((rows) => {
        if (!cancelled) setFlags(rows.filter((f) => !f.acknowledged));
      })
      .catch(() => {})
      .finally(done);

    return () => {
      cancelled = true;
    };
  }, [classId]);

  const byId = new Map(students.map((s) => [s.studentId, s]));
  const loading = Boolean(classId) && signedIn && settled < 3;

  return {
    misconceptions,
    concepts: mastery.map((m) => ({
      conceptId: m.conceptId,
      name: m.conceptName,
      understanding: pct(m.masteryProbabilityConcept),
      reading: pct(m.masteryProbabilityReading),
      studentCount: m.studentCount,
    })),
    flags: flags.map((f) => ({
      id: f.id,
      name: byId.get(f.studentId)?.name ?? null,
      note: f.description,
      isSudden: suddenish(f.flagType),
    })),
    loading,
    empty:
      !loading &&
      misconceptions.length === 0 &&
      mastery.length === 0 &&
      flags.length === 0,
  };
}
