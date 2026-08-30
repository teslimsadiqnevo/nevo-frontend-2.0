"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  studentsApi,
  type ConceptMasteryRow,
  type Recommendation,
  type StudentAdaptation,
  type StudentProfileResponse,
} from "@/lib/api/students";
import { getToken } from "@/lib/auth/session";
import { useHasSession } from "./useHasSession";

/**
 * One student, as their teacher can see them.
 *
 * Four reads. Only the first decides whether the page exists: identity is the
 * page, and mastery, recommendations and concept names are enrichment that a
 * profile reads perfectly well without. So a failure in any of those three
 * leaves its section absent rather than failing the screen.
 *
 * `missing` separates "no such student" from "could not load them", because
 * telling a teacher a child is gone when the network blinked is the worse
 * error - the same rule the lesson route follows.
 *
 * The learner profile is fetched but NOT surfaced: see `students.ts`. Its
 * `status` is the one part that is safe and useful, since "not observed yet"
 * is exactly what the frame's early state says.
 */

export interface MasteryConcept {
  conceptId: string;
  /** Resolved from `/api/concepts`; the id itself if it cannot be. */
  name: string;
  /** 0-100, as the frame's bars want. */
  understanding: number;
  reading: number;
  practiceCount: number;
}

export interface StudentProfileState {
  profile: StudentProfileResponse | null;
  concepts: MasteryConcept[];
  recommendations: Recommendation[];
  /** What Nevo adjusted, newest first, suppressed ones excluded. */
  adaptations: StudentAdaptation[];
  /** `observed` once Nevo has watched enough to adapt. */
  observed: boolean;
  loading: boolean;
  missing: boolean;
  failed: boolean;
}

const pct = (p: number) => Math.round(Math.max(0, Math.min(1, p)) * 100);

export function useStudentProfile(studentId: string): StudentProfileState {
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [mastery, setMastery] = useState<ConceptMasteryRow[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [adaptations, setAdaptations] = useState<StudentAdaptation[]>([]);
  const [observed, setObserved] = useState(false);
  const [missing, setMissing] = useState(false);
  const [failed, setFailed] = useState(false);
  const signedIn = useHasSession();
  const loading = signedIn && !profile && !missing && !failed;

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    // The page itself.
    void studentsApi
      .profile(studentId)
      .then((res) => {
        if (!cancelled) setProfile(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setMissing(true);
        else setFailed(true);
      });

    // Enrichment. Each is allowed to fail on its own.
    void studentsApi
      .mastery(studentId)
      .then((rows) => {
        if (!cancelled) setMastery(rows);
      })
      .catch(() => {});
    void studentsApi
      .concepts()
      .then((list) => {
        if (!cancelled) setNames(new Map(list.map((c) => [c.id, c.name])));
      })
      .catch(() => {});
    void studentsApi
      .recommendations(studentId)
      .then((rows) => {
        if (!cancelled) setRecommendations(rows);
      })
      .catch(() => {});
    void studentsApi
      .adaptations(studentId)
      .then((rows) => {
        // A suppressed adaptation is one Nevo considered and withheld; the
        // section is what actually happened for this student.
        if (!cancelled) setAdaptations(rows.filter((a) => !a.suppressed));
      })
      .catch(() => {});
    void studentsApi
      .learnerProfile(studentId)
      .then((p) => {
        if (!cancelled) setObserved(p.status === "observed");
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return {
    profile,
    concepts: mastery.map((m) => ({
      conceptId: m.conceptId,
      name: names.get(m.conceptId) ?? m.conceptId,
      understanding: pct(m.masteryProbabilityConcept),
      reading: pct(m.masteryProbabilityReading),
      practiceCount: m.practiceCount,
    })),
    recommendations,
    adaptations,
    observed,
    loading,
    missing,
    failed,
  };
}
