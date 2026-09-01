"use client";

import Link from "next/link";
import { useState } from "react";
import type { AssignedClass } from "@/lib/api";
import {
  lastSeenLine,
  studentName,
  useClassRoster,
} from "@/hooks/useClassRoster";
import { cn } from "@/lib/utils";
import { ClassQrDialog, ClassQrScreen } from "./ClassQr";

/**
 * A class the school assigned, drawn from what the backend actually serves:
 * the assignment, the class code, and - since 30 Aug - the real roster from
 * `GET /api/v1/classes/{class_id}/students`.
 *
 * What it still does not have is the intelligence layer. The fixture-backed
 * `ClassDetail` shows per-student chips, seats and "worth a glance" dots;
 * none of that has an endpoint, so these rows carry only what is real:
 * who is on the roster, whether Nevo has observed them yet, and when they
 * were last here.
 *
 * Rows link to the student's profile, which reads live since the student
 * endpoints were wired.
 *
 * `observations` and `seatContext` shipped on 31 Aug and reach this screen,
 * but are not drawn: `observations` is an untyped `string[]` with no enum,
 * description or bound, so its CONTENTS have to be read against a real class
 * before any of it goes in front of a teacher - the field-name check that
 * satisfied the Zero-Tag rulings says nothing about what is inside. Until
 * then these stay ordinary roster rows rather than C16b observation rows.
 */
export function LiveClassDetail({ klass }: { klass: AssignedClass }) {
  const [qr, setQr] = useState<"none" | "dialog" | "screen">("none");
  const role = klass.role === "co_teacher" ? "Co-teacher" : "Primary teacher";
  const { students, loading, failed } = useClassRoster(klass.class_id);
  const observed = students.filter((s) => s.profileStatus === "observed").length;

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[880px]">
        <Link
          href="/teacher/classes"
          className="inline-flex cursor-pointer items-center gap-[7px] text-sm text-nevo-near-black/60 transition-transform active:scale-[0.99]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
          My Classes
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
              {klass.class_name}
            </h2>
            <span className="mt-[5px] block text-[14.5px] text-nevo-near-black/60">
              {students.length > 0
                ? `${role} · ${students.length} ${students.length === 1 ? "student" : "students"}`
                : `${role} · Synced from your school`}
            </span>
          </div>
          {klass.class_code && (
            <button
              type="button"
              onClick={() => setQr("dialog")}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-nevo-navy/35 px-4 text-sm font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 20h1" />
              </svg>
              Class code
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-6 flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[68px] animate-pulse rounded-[12px] bg-nevo-cream-elevated"
              />
            ))}
          </div>
        )}

        {!loading && students.length > 0 && (
          <>
            <h3 className="mt-7 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase xl:mt-8 xl:text-sm">
              Roster
            </h3>
            <p className="mt-2 max-w-[560px] text-[13px] leading-[1.5] text-nevo-near-black/60">
              {observed === 0
                ? "Nevo hasn’t watched anyone here long enough to build a profile. That starts with their first lesson."
                : `Nevo has a learning profile for ${observed} of ${students.length}. The rest build as they work.`}
            </p>
            <div className="mt-3.5 flex flex-col gap-2 xl:mt-4">
              {students.map((student) => (
                <Link
                  key={student.studentId}
                  href={`/teacher/students/${student.studentId}?class=${klass.class_id}`}
                  className={cn(
                    "cursor-pointer transition-[filter] hover:brightness-[0.985]",
                    "flex flex-col rounded-[12px] bg-nevo-cream-elevated px-[18px] py-4 shadow-elevation-1 xl:flex-row xl:items-center xl:gap-4 xl:p-5",
                    student.profileStatus === "observed" &&
                      "border-l-[3px] border-nevo-violet",
                  )}
                >
                  <div className="flex min-w-0 items-baseline gap-1.5 xl:w-[36%] xl:shrink-0 xl:flex-col xl:gap-0">
                    <span className="truncate text-[15px] font-semibold text-nevo-near-black">
                      {studentName(student)}
                    </span>
                    {student.loginIdentifier && (
                      <span className="shrink-0 text-[12px] text-nevo-near-black/55 xl:mt-0.5">
                        <span className="xl:hidden">{"· "}</span>
                        {student.loginIdentifier}
                      </span>
                    )}
                  </div>
                  <span className="mt-1.5 text-[13px] text-nevo-near-black/60 xl:mt-0 xl:flex-1">
                    {student.profileStatus === "observed"
                      ? "Learning profile building"
                      : "No profile yet"}
                  </span>
                  <span className="mt-1 shrink-0 text-[13px] whitespace-nowrap text-nevo-near-black/55 xl:mt-0">
                    {lastSeenLine(student)}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-[7px] text-[12px] text-nevo-near-black/55">
              <span className="size-2 shrink-0 rounded-full bg-nevo-violet" />
              Nevo has a learning profile for this student
            </div>
          </>
        )}

        {!loading && students.length === 0 && (
          <div className="mt-6 flex max-w-[620px] items-start gap-3.5 rounded-[12px] bg-nevo-cream-elevated px-[22px] py-5 shadow-elevation-1">
            <span className="mt-px shrink-0 text-nevo-navy">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8h.01M11 12h1v4h1" />
              </svg>
            </span>
            <div>
              <h3 className="text-[15.5px] font-semibold text-nevo-near-black xl:text-base">
                {failed
                  ? "We couldn’t load this class’s roster"
                  : "Nobody has joined this class yet"}
              </h3>
              <p className="mt-1.5 text-sm leading-[1.55] text-nevo-near-black/68 xl:text-[14.5px]">
                {failed
                  ? "Nothing has changed for your students. Try again in a moment."
                  : klass.class_code
                    ? "Share the class code and your students will appear here as they join."
                    : "Your students will appear here as your school adds them."}
              </p>
            </div>
          </div>
        )}
      </div>

      {qr === "dialog" && klass.class_code && (
        <ClassQrDialog
          className={klass.class_name}
          code={klass.class_code}
          onClose={() => setQr("none")}
          onProject={() => setQr("screen")}
        />
      )}
      {qr === "screen" && klass.class_code && (
        <ClassQrScreen
          className={klass.class_name}
          code={klass.class_code}
          onClose={() => setQr("none")}
        />
      )}
    </div>
  );
}
