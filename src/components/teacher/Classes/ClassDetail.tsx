"use client";

import Link from "next/link";
import { useState } from "react";
import {
  STATUS_LABEL,
  type StudentStatus,
  type TeacherClass,
} from "@/lib/mocks/teacherClasses";
import { cn } from "@/lib/utils";

/**
 * Class detail (C05 / `Nevo Teacher Classes` frame): back link, class header
 * with the glance/flag legend, and the Roster / Lessons / Activity pill tabs.
 * Roster rows open the student profile; a sudden change carries the navy drop
 * glyph. Status dots: violet = worth a glance, navy ring = flagged, muted =
 * on track.
 */

const TABS = ["Roster", "Lessons", "Activity"] as const;
type Tab = (typeof TABS)[number];

function statusDotClass(status: StudentStatus, small = false): string {
  return cn(
    "shrink-0 rounded-full",
    small ? "size-[9px]" : "size-[11px]",
    status === "glance" && "bg-nevo-violet",
    status === "flag" &&
      (small
        ? "border-2 border-nevo-navy bg-transparent"
        : "border-[2.5px] border-nevo-navy bg-transparent"),
    status === "ok" && "bg-nevo-navy/28",
  );
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

const DROP_GLYPH = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v9" />
    <path d="M8 11l4 4 4-4" />
  </svg>
);

/** Student profile route id, e.g. "Tunde Adeyemi" -> "tunde-adeyemi". */
function studentHref(name: string): string {
  return `/teacher/students/${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function ClassDetail({ klass }: { klass: TeacherClass }) {
  const [tab, setTab] = useState<Tab>("Roster");

  const glanceCount = klass.roster.filter((r) => r.status === "glance").length;
  const flagCount = klass.roster.filter((r) => r.status === "flag").length;

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
              {klass.name}
            </h2>
            <span className="mt-[5px] block text-[14.5px] text-nevo-near-black/60">
              {klass.subjects} · {klass.count} students
            </span>
          </div>
          {(glanceCount > 0 || flagCount > 0) && (
            <div className="flex gap-4">
              {glanceCount > 0 && (
                <div className="flex items-center gap-[7px]">
                  <span className={statusDotClass("glance", true)} />
                  <span className="text-[13.5px] text-nevo-near-black/65">
                    {glanceCount} worth a glance
                  </span>
                </div>
              )}
              {flagCount > 0 && (
                <div className="flex items-center gap-[7px]">
                  <span className={statusDotClass("flag", true)} />
                  <span className="text-[13.5px] text-nevo-near-black/65">
                    {flagCount} flagged
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-[22px] flex gap-2.5">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "cursor-pointer rounded-full px-[15px] py-2 text-[13.5px] font-medium transition-[transform,background-color] active:scale-[0.99]",
                tab === t
                  ? "bg-nevo-navy text-nevo-cream"
                  : "border border-nevo-near-black/8 bg-nevo-cream-elevated text-nevo-near-black/70",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Roster" && (
          <div className="mt-4 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1">
            {klass.roster.map((student, i) => (
              <Link
                key={student.name}
                href={studentHref(student.name)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3.5 px-5 py-3.5 transition-[filter] hover:brightness-[0.985] xl:gap-4 xl:px-[22px] xl:py-[15px]",
                  i < klass.roster.length - 1 &&
                    "border-b border-nevo-near-black/7",
                )}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nevo-navy/10 text-[12.5px] font-semibold text-nevo-navy">
                    {initialsOf(student.name)}
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    {student.isSudden && (
                      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-nevo-navy text-nevo-cream">
                        {DROP_GLYPH}
                      </span>
                    )}
                    <span className="text-[15.5px] font-medium text-nevo-near-black">
                      {student.name}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "text-[13.5px]",
                      student.status === "ok"
                        ? "text-nevo-near-black/50"
                        : "text-nevo-navy",
                    )}
                  >
                    {STATUS_LABEL[student.status]}
                  </span>
                  <span className={statusDotClass(student.status)} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === "Lessons" && (
          <div className="mt-4 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1">
            {klass.lessons.map((lesson, i) => (
              <Link
                key={lesson.title}
                href={lesson.href}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 px-[22px] py-4 transition-[filter] hover:brightness-[0.985]",
                  i < klass.lessons.length - 1 &&
                    "border-b border-nevo-near-black/7",
                )}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-[15.5px] font-semibold text-nevo-near-black">
                    {lesson.title}
                  </span>
                  <span className="mt-[3px] text-[13px] text-nevo-near-black/55">
                    {lesson.meta}
                  </span>
                </div>
                <span className="shrink-0 text-[13.5px] text-nevo-near-black/60">
                  {lesson.status}
                </span>
              </Link>
            ))}
          </div>
        )}

        {tab === "Activity" && (
          <div className="mt-4 rounded-[12px] bg-nevo-cream-elevated px-6 py-[22px] shadow-elevation-1">
            <p className="text-[15px] leading-[1.6] text-nevo-near-black/78">
              {klass.activitySummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
