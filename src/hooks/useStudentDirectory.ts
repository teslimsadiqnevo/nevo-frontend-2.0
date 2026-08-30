"use client";

import { useEffect, useState } from "react";
import { classesApi, type ClassStudent } from "@/lib/api/classes";
import { getToken } from "@/lib/auth/session";
import { useHasSession } from "./useHasSession";
import { studentName } from "./useClassRoster";

/**
 * Every student the teacher can actually write to, across their classes.
 *
 * There is no "my students" endpoint, so this is the class list joined to each
 * class's roster - one call, then one per class. A teacher has a handful of
 * classes, so that is a handful of requests, and the alternative is a compose
 * screen listing invented children.
 *
 * A class whose roster fails contributes nothing rather than failing the whole
 * directory: a partial list of real students beats no list.
 *
 * TODO(api): a single roster-wide read would replace this fan-out.
 */

/** Enough for any real teacher; a guard against a pathological account. */
const MAX_CLASSES = 12;

export interface DirectoryStudent {
  studentId: string;
  name: string;
  initials: string;
  className: string;
}

export interface StudentDirectory {
  students: DirectoryStudent[];
  loading: boolean;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function toDirectory(className: string, roster: ClassStudent[]) {
  return roster.map((s) => {
    const name = studentName(s);
    return {
      studentId: s.studentId,
      name,
      initials: initialsOf(name),
      className,
    };
  });
}

export function useStudentDirectory(): StudentDirectory {
  const [students, setStudents] = useState<DirectoryStudent[] | null>(null);
  const signedIn = useHasSession();
  const loading = signedIn && students === null;

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    void (async () => {
      try {
        const classes = await classesApi.myClasses();
        const rosters = await Promise.all(
          classes.slice(0, MAX_CLASSES).map((c) =>
            classesApi
              .classStudents(c.class_id)
              .then((roster) => toDirectory(c.class_name, roster))
              .catch(() => []),
          ),
        );
        if (!cancelled) setStudents(rosters.flat());
      } catch {
        if (!cancelled) setStudents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { students: students ?? [], loading };
}
