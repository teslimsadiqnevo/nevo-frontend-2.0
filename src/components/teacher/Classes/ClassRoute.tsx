"use client";

import { notFound } from "next/navigation";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { useHydrated } from "@/hooks/useHydrated";
import { getToken } from "@/lib/auth/session";
import type { TeacherClass } from "@/lib/mocks/teacherClasses";
import { ClassDetail } from "./ClassDetail";
import { LiveClassDetail } from "./LiveClassDetail";

/**
 * Resolves a class route. Most ids are fixture-backed and render the full
 * console detail. An id the fixtures don't know may still be a real class
 * the school assigned - those carry no roster or lessons yet, so they get
 * the honest minimal screen rather than a 404 that reads like the class
 * doesn't exist.
 *
 * The 404 is held back until the live list has actually answered, so a slow
 * backend never turns a real class into a missing one.
 */
export function ClassRoute({
  fixture,
  classId,
}: {
  fixture: TeacherClass | null;
  classId: string;
}) {
  const { liveClasses, live, sample } = useTeacherClasses();
  const hydrated = useHydrated();

  // See LessonRoute: on the server this route rendered "This page doesn't
  // exist" for a signed-in teacher's own class, because getToken() is false
  // there. Decide nothing until the client is running.
  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="h-[280px] w-full max-w-[860px] animate-pulse rounded-[12px] bg-nevo-cream-elevated" />
      </div>
    );
  }

  // A real class is only ever itself. This is checked before the fixtures so
  // that a live class can never be answered with a fixture of the same name.
  const assigned = liveClasses.find((c) => c.class_id === classId);
  if (assigned) return <LiveClassDetail klass={assigned} />;

  // Fixtures back the designed screens only while there is no live data.
  if (!live && fixture) return <ClassDetail klass={fixture} />;

  // Resolved (or nothing to resolve with) and still unknown - it is a 404.
  if (live || sample || !getToken()) notFound();

  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <span
        role="status"
        aria-label="Looking for this class"
        className="size-6 rounded-full border-[2.5px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:800ms]"
      />
    </div>
  );
}
