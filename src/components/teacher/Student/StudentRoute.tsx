"use client";

import { notFound } from "next/navigation";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { getToken } from "@/lib/auth/session";
import type { StudentProfileData } from "@/lib/mocks/teacherStudents";
import { LiveStudentProfile } from "./LiveStudentProfile";
import { StudentProfile } from "./StudentProfile";

/**
 * Resolves a student route, live first - the same shape as the class and
 * lesson routes, and for the same reason: a real student is only ever
 * themselves, never a fixture that happens to share an id.
 *
 * A 404 is a 404. Any other failure is a retry, because telling a teacher a
 * child is gone when the network blinked is the worse error.
 */
export function StudentRoute({
  fixture,
  studentId,
  classHref,
}: {
  fixture: StudentProfileData | null;
  studentId: string;
  classHref?: string;
}) {
  const state = useStudentProfile(studentId);

  if (state.profile) {
    return <LiveStudentProfile state={state} classHref={classHref} />;
  }

  if (state.loading) {
    return (
      <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
        <div className="mx-auto max-w-[860px]">
          <div className="h-5 w-32 animate-pulse rounded bg-nevo-cream-elevated" />
          <div className="mt-4 flex items-center gap-4">
            <div className="size-14 animate-pulse rounded-full bg-nevo-cream-elevated xl:size-16" />
            <div className="h-8 w-56 animate-pulse rounded bg-nevo-cream-elevated" />
          </div>
          <div className="mt-8 h-[220px] animate-pulse rounded-[12px] bg-nevo-cream-elevated" />
        </div>
      </div>
    );
  }

  if (state.failed) {
    return (
      <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
        <div className="mx-auto max-w-[660px] rounded-[12px] bg-nevo-cream-elevated px-[26px] py-7 shadow-elevation-1">
          <h2 className="text-[17px] font-semibold text-nevo-near-black">
            We couldn&rsquo;t load this student
          </h2>
          <p className="mt-2 text-sm leading-[1.55] text-nevo-near-black/62">
            Nothing has changed for them. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 h-[46px] cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Fixtures back the designed screen only when there is no live data at all.
  if (!getToken() && fixture) return <StudentProfile student={fixture} />;

  if (state.missing || !getToken()) notFound();

  return null;
}
