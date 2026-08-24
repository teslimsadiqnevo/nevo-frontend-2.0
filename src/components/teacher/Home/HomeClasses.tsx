"use client";

import Link from "next/link";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { HOME_CLASSES } from "@/lib/mocks/teacherHome";
import { cn } from "@/lib/utils";

/**
 * Home's class trio, driven by the teacher's real assignments when a session
 * has them. The per-class status line stays fixture copy (the backend serves
 * no summary yet), but the SET of classes is live, so a teacher never sees
 * three classes that aren't theirs. Assignments with no fixture behind them
 * render as quiet cards rather than being dropped or dressed up.
 */
export function HomeClasses() {
  const { classes, liveExtras } = useTeacherClasses();

  return (
    <div className="mt-3.5 flex flex-wrap gap-3 xl:mt-4 xl:gap-3.5">
      {classes.map((c) => {
        const copy = HOME_CLASSES.find((h) => h.name === c.name);
        return (
          <Link
            key={c.id}
            href={`/teacher/classes/${c.id}`}
            className="min-w-[180px] flex-1 cursor-pointer rounded-[12px] bg-nevo-cream-elevated px-[18px] py-4 shadow-elevation-1 transition-[filter] hover:brightness-[0.985] xl:px-[22px] xl:py-5"
          >
            <span className="text-[15.5px] font-semibold text-nevo-near-black xl:text-[17px]">
              {c.name}
            </span>
            <div className="mt-[3px] text-[12px] text-nevo-near-black/55 xl:mt-1 xl:text-[13px]">
              {c.subjects}
            </div>
            <div className="mt-3 flex items-center gap-2 xl:mt-3.5 xl:gap-[9px]">
              <span
                className={cn(
                  "size-[9px] shrink-0 rounded-full",
                  (copy?.glance ?? c.summaryTone === "glance")
                    ? "bg-nevo-violet"
                    : "bg-nevo-navy/30",
                )}
              />
              <span className="text-[12.5px] text-nevo-near-black/70 xl:text-[13.5px]">
                <span className="xl:hidden">
                  {copy?.statusShort ?? c.summary}
                </span>
                <span className="hidden xl:inline">
                  {copy?.status ?? c.summary}
                </span>
              </span>
            </div>
          </Link>
        );
      })}

      {liveExtras.map((a) => (
        <div
          key={a.assignment_id}
          className="min-w-[180px] flex-1 rounded-[12px] bg-nevo-cream-elevated px-[18px] py-4 shadow-elevation-1 xl:px-[22px] xl:py-5"
        >
          <span className="text-[15.5px] font-semibold text-nevo-near-black xl:text-[17px]">
            {a.class_name}
          </span>
          <div className="mt-[3px] text-[12px] text-nevo-near-black/55 xl:mt-1 xl:text-[13px]">
            {a.class_code ? `Class code ${a.class_code}` : "Assigned to you"}
          </div>
          <div className="mt-3 text-[12.5px] text-nevo-near-black/50 xl:mt-3.5 xl:text-[13.5px]">
            Synced from your school
          </div>
        </div>
      ))}
    </div>
  );
}
