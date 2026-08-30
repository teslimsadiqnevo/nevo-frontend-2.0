"use client";

import { useEffect, useState } from "react";
import { classesApi, type AssignedClass } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { TEACHER_CLASSES, type TeacherClass } from "@/lib/mocks/teacherClasses";

/**
 * The teacher's class list, live-first: GET /api/v1/teachers/me/classes when
 * a session exists, the design fixtures otherwise.
 *
 * NO NAME MATCHING. This hook used to pair a live class with a fixture of the
 * same name and hand back the fixture - roster, lessons, observations and all -
 * with only the join code replaced. That was defensible while no roster
 * endpoint existed and indefensible the moment one did: the demo school's real
 * class is called "JSS 2A", which is also a fixture name, so a real teacher
 * opening their own class was shown six invented children, complete with seat
 * numbers, as though they were their students.
 *
 * So a live class is now only ever itself. Fixtures back the designed screens
 * when there is no live data at all, and never stand in for a real class.
 *
 * The live call is capped - a Render cold start must never blank the console -
 * and a call that never lands raises `sample`, so screens can say plainly that
 * they are showing stand-in data.
 */

const LIVE_TIMEOUT_MS = 6000;

/** Id, name and code - all any picker or selector actually needs. */
export interface ClassOption {
  id: string;
  name: string;
  joinCode: string | null;
  /**
   * Fixture-only. The live class list carries neither a headcount nor a
   * roster, and a picker must say "we don't know" rather than borrow a
   * number. `GET /api/v1/classes/{id}/students` has both, per class - see
   * `useClassRoster` - but that is a fetch per class and belongs to the
   * screen that needs it.
   */
  studentCount?: number;
  roster?: { name: string }[];
}

export interface TeacherClasses {
  /** Fixture classes, for the designed screens. Empty once live data lands. */
  classes: TeacherClass[];
  /** The teacher's real assignments. Empty until they do. */
  liveClasses: AssignedClass[];
  /** Whichever of the two is real right now, flattened for pickers. */
  options: ClassOption[];
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
      liveClasses: [],
      options: TEACHER_CLASSES.map((c) => ({
        id: c.id,
        name: c.name,
        joinCode: c.joinCode,
        studentCount: c.count,
        roster: c.roster.map((r) => ({ name: r.name })),
      })),
      live: false,
      sample: failed,
    };
  }

  return {
    classes: [],
    liveClasses,
    options: liveClasses.map((c) => ({
      id: c.class_id,
      name: c.class_name,
      joinCode: c.class_code,
    })),
    live: true,
    sample: false,
  };
}
