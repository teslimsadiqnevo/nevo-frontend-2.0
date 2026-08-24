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
 * fixture surface as `liveExtras` so a screen can show them honestly without
 * inventing detail the backend doesn't serve yet.
 *
 * Every console surface that shows classes reads from here, so a real
 * teacher sees their own classes rather than the fixture three.
 *
 * The live call is capped - a Render cold start must never blank the
 * console - and a call that never lands raises `sample`, so screens can say
 * plainly that they are showing stand-in data instead of passing fixtures
 * off as a roster.
 */

const LIVE_TIMEOUT_MS = 6000;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export interface TeacherClasses {
  /** Fixture-backed classes the teacher has, real join code layered on. */
  classes: TeacherClass[];
  /** Real assignments with no fixture behind them. */
  liveExtras: AssignedClass[];
  /** Live data is in hand. */
  live: boolean;
  /** A session exists but the live list never arrived - fixtures stand in. */
  sample: boolean;
}

export function useTeacherClasses(): TeacherClasses {
  const [liveClasses, setLiveClasses] = useState<AssignedClass[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const timeout = new Promise<null>((resolve) => {
      timers.push(setTimeout(() => resolve(null), LIVE_TIMEOUT_MS));
    });
    void Promise.race([classesApi.myClasses().catch(() => null), timeout]).then(
      (res) => {
        if (cancelled) return;
        if (res) setLiveClasses(res);
        else setFailed(true);
      },
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (liveClasses === null) {
    return {
      classes: TEACHER_CLASSES,
      liveExtras: [],
      live: false,
      sample: failed,
    };
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
  return { classes, liveExtras, live: true, sample: false };
}
