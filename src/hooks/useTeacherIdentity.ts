"use client";

import { useEffect, useState } from "react";
import { classesApi } from "@/lib/api/classes";
import { getSession } from "@/lib/auth/session";

/**
 * The signed-in teacher's own name and email.
 *
 * There is no profile endpoint. `/api/v1/auth/session` carries a `user_id` and
 * a role and nothing else, which is why the console has been showing a teacher
 * no name at all rather than the fixture persona.
 *
 * But `GET /api/v1/classes/{class_id}/teachers` returns `first_name`,
 * `last_name` and `email` for everyone assigned to a class - and a teacher
 * already holds their own class ids, because `/teachers/me/classes` is the one
 * call the console has always made. So the name is reachable in two hops:
 *
 *   /teachers/me/classes  ->  a class_id
 *   /classes/{id}/teachers ->  the row whose teacher_id is our user_id
 *
 * It rests on `teacher_id` being the same id the session calls `user_id`. That
 * is unconfirmed - no account with both a teacher role and a class exists to
 * check it against - so the whole thing is written to fail safe: no classes, no
 * matching row, or any error at all resolves to null, and every caller then
 * shows exactly what it shows today. Being wrong costs nothing.
 *
 * Resolved once per page load and shared, because the sidebar mounts on every
 * screen and identity does not change mid-session.
 *
 * TODO(api): a teacher profile endpoint, or a name on the session payload,
 * either of which would delete this file.
 */

export interface TeacherIdentity {
  name: string | null;
  email: string | null;
  initials: string | null;
}

/** Enough classes to survive one odd row, few enough to stay cheap. */
const MAX_CLASSES_TRIED = 3;

function initialsFrom(name: string): string | null {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((w) => !/^(mr|mrs|ms|miss|dr|prof)\.?$/i.test(w));
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return null;
}

let pending: Promise<TeacherIdentity | null> | null = null;

async function resolveIdentity(): Promise<TeacherIdentity | null> {
  const session = getSession();
  if (!session) return null;
  try {
    const classes = await classesApi.myClasses();
    for (const klass of classes.slice(0, MAX_CLASSES_TRIED)) {
      // Speculative: this is documented as an admin read, and a 403 here must
      // never be mistaken for a dead session and sign the teacher out.
      const teachers = await classesApi
        .classTeachers(klass.class_id, { tolerateAuthFailure: true })
        .catch(() => null);
      const me = teachers?.find((t) => t.teacher_id === session.userId);
      if (!me) continue;
      const name = [me.first_name, me.last_name].filter(Boolean).join(" ").trim();
      return {
        name: name || null,
        email: me.email,
        initials: name ? initialsFrom(name) : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Null until it resolves, and null forever if it cannot. */
export function useTeacherIdentity(): TeacherIdentity | null {
  const [identity, setIdentity] = useState<TeacherIdentity | null>(null);

  useEffect(() => {
    let alive = true;
    pending ??= resolveIdentity();
    void pending.then((value) => {
      if (alive) setIdentity(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return identity;
}
