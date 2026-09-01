"use client";

import { useEffect, useState } from "react";
import { usersApi, type CurrentUser } from "@/lib/api/users";
import { getSession } from "@/lib/auth/session";

/**
 * The signed-in user's identity, shaped for rendering.
 *
 * This replaces the two-hop recovery the console ran before
 * `GET /api/v1/users/me` existed - walk the teacher's classes, read each
 * class's teacher list, find the row whose `teacher_id` matches our
 * `user_id` - which was speculative, cost two round trips, and rested on an
 * id equivalence nothing confirmed. One call answers it outright.
 *
 * Resolved once per signed-in user and shared, because the sidebar mounts on
 * every screen and identity does not change mid-session. Keyed by user id so
 * a sign-out and a second sign-in in the same page load cannot inherit the
 * first user's name.
 *
 * Null until it resolves, and null forever if it cannot - every caller
 * already draws a nameless state, which is exactly what a failed load
 * should look like.
 */

export interface Identity {
  userId: string;
  role: string;
  name: string | null;
  initials: string | null;
  email: string | null;
  /** The school's display name, not its id. */
  school: string | null;
  subjects: string[];
}

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

function toIdentity(user: CurrentUser): Identity {
  // Prefer the given/family pair; `display_name` is the backend's own
  // fallback and may be an identifier rather than a person's name.
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const name = full || user.display_name || "";
  return {
    userId: user.user_id,
    role: user.role,
    name: name || null,
    initials: name ? initialsFrom(name) : null,
    email: user.email,
    school: user.school?.name ?? null,
    subjects: user.subjects ?? [],
  };
}

let cache: { userId: string; promise: Promise<Identity | null> } | null = null;

function resolveIdentity(userId: string): Promise<Identity | null> {
  if (cache?.userId !== userId) {
    cache = {
      userId,
      promise: usersApi
        .me()
        .then(toIdentity)
        .catch(() => null),
    };
  }
  return cache.promise;
}

/**
 * Everyone currently rendering an identity.
 *
 * The cache above is resolved once per user, so a teacher who renames
 * themselves would otherwise keep seeing the old name in the sidebar until a
 * reload - the profile page would say one thing and the rail another. A save
 * publishes the new identity here and every mounted consumer follows.
 */
const listeners = new Set<(next: Identity | null) => void>();

/** Replace the resolved identity after a successful write. */
export function publishIdentity(user: CurrentUser): void {
  const next = toIdentity(user);
  cache = { userId: next.userId, promise: Promise.resolve(next) };
  listeners.forEach((fn) => fn(next));
}

export function useCurrentUser(): Identity | null {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    let alive = true;
    void resolveIdentity(session.userId).then((value) => {
      if (alive) setIdentity(value);
    });
    const onPublish = (next: Identity | null) => {
      if (alive) setIdentity(next);
    };
    listeners.add(onPublish);
    return () => {
      alive = false;
      listeners.delete(onPublish);
    };
  }, []);

  return identity;
}
