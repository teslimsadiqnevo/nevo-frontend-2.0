"use client";

import { notFound } from "next/navigation";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
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
  const { liveExtras, live, sample } = useTeacherClasses();

  if (fixture) return <ClassDetail klass={fixture} />;

  const assigned = liveExtras.find((c) => c.class_id === classId);
  if (assigned) return <LiveClassDetail klass={assigned} />;

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
