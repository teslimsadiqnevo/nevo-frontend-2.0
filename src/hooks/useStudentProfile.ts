"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  studentsApi,
  type Accommodations,
  type ConceptMasteryRow,
  type LessonProgress,
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
  /** Lessons worked through, newest first. */
  sessions: LessonProgress[];
  /** What Nevo is offering, and why. Null when the read failed. */
  accommodations: Accommodations | null;
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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [adaptations, setAdaptations] = useState<StudentAdaptation[]>([]);
  const [sessions, setSessions] = useState<LessonProgress[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodations | null>(
    null,
  );
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
      .progress(studentId)
      .then((p) => {
        if (cancelled) return;
        setSessions(
          [...p.lessons].sort(
            (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
          ),
        );
      })
      .catch(() => {});
    void studentsApi
      .accommodations(studentId)
      .then((a) => {
        if (!cancelled) setAccommodations(a);
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
      // Straight from the mastery read since 31 Aug. It used to be resolved
      // through a second, best-effort `/api/concepts` call whose failure was
      // swallowed - and when it failed a teacher was shown a raw UUID as the
      // name of the concept their student was struggling with.
      name: m.conceptName,
      understanding: pct(m.masteryProbabilityConcept),
      reading: pct(m.masteryProbabilityReading),
      practiceCount: m.practiceCount,
    })),
    recommendations,
    adaptations,
    sessions,
    accommodations,
    observed,
    loading,
    missing,
    failed,
  };
}
