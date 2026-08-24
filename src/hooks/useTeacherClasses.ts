"use client";

import { useEffect, useState } from "react";
import { classesApi, type AssignedClass } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { TEACHER_CLASSES, type TeacherClass } from "@/lib/mocks/teacherClasses";

/**
 * The teacher's class list, live-first: GET /api/v1/teachers/me/classes when
 * a session exists, the design fixtures otherwise. Live classes that match a
 * fixture by name keep the fixture's rich console data (roster, lessons,
 * summaries) with the real class code layered on top; live classes with no
 * fixture surface as `liveExtras` so the list can show them honestly without
 * inventing detail the backend doesn't serve yet.
 *
 * The live call is capped - a Render cold start must never blank the console.
 */

const LIVE_TIMEOUT_MS = 6000;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function useTeacherClasses(): {
  classes: TeacherClass[];
  liveExtras: AssignedClass[];
  live: boolean;
} {
  const [liveClasses, setLiveClasses] = useState<AssignedClass[] | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const timeout = new Promise<null>((resolve) => {
      timers.push(setTimeout(() => resolve(null), LIVE_TIMEOUT_MS));
    });
    void Promise.race([classesApi.myClasses().catch(() => null), timeout]).then(
      (res) => {
        if (!cancelled && res) setLiveClasses(res);
      },
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (liveClasses === null) {
    return { classes: TEACHER_CLASSES, liveExtras: [], live: false };
  }

  const classes: TeacherClass[] = [];
  const liveExtras: AssignedClass[] = [];
  for (const assigned of liveClasses) {
    const fixture = TEACHER_CLASSES.find(
      (c) => norm(c.name) === norm(assigned.class_name),
    );
    if (fixture) {
      classes.push({
        ...fixture,
        joinCode: assigned.class_code ?? fixture.joinCode,
      });
    } else {
      liveExtras.push(assigned);
    }
  }
  return { classes, liveExtras, live: true };
}
