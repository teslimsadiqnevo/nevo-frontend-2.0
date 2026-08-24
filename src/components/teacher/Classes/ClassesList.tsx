"use client";

import Link from "next/link";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { SCHOOL_LINE } from "@/lib/mocks/teacherClasses";
import { cn } from "@/lib/utils";

/**
 * My Classes list (C05 / `Nevo Teacher Classes` frame). Desktop: a 3-column
 * grid of class cards with the summary row under a divider. Tablet: cards
 * stack to one column as horizontal rows (name + meta left, summary right).
 * No classes yet renders the calm empty state - assignment is the admin's job,
 * never a dead end.
 *
 * Data is live-first via useTeacherClasses: real assignments enrich the
 * fixtures by name; live classes without a fixture render as quiet cards
 * (name + class code) that open the minimal live detail, since the backend
 * serves no roster or lessons for them yet.
 */

function SummaryDot({ tone }: { tone: "glance" | "ok" }) {
  return (
    <span
      className={cn(
        "size-[9px] shrink-0 rounded-full",
        tone === "glance"
          ? "bg-nevo-violet"
          : "bg-nevo-navy/30",
      )}
    />
  );
}

export function ClassesList() {
  const { classes, liveExtras, sample } = useTeacherClasses();

  if (classes.length === 0 && liveExtras.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="flex max-w-[400px] flex-col items-center text-center">
          <div className="flex size-[88px] items-center justify-center rounded-[20px] bg-nevo-cream-elevated text-nevo-violet shadow-elevation-1">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="8" r="3" />
              <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
              <path d="M17 6.5a3 3 0 0 1 0 6" />
              <path d="M18.5 20a6.5 6.5 0 0 0-3.2-5.6" />
            </svg>
          </div>
          <h2 className="mt-[26px] text-[22px] font-semibold tracking-[-0.01em] text-nevo-near-black">
            Your classes will appear here once assigned
          </h2>
          <p className="mt-3 text-base leading-[1.6] text-nevo-near-black/66">
            This usually happens before your first sign-in. If it&rsquo;s
            taking a while, your school admin can set it up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[1000px]">
        <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
          My Classes
        </h2>
        <p className="mt-[7px] text-sm text-nevo-near-black/60 xl:mt-2 xl:text-[15px]">
          {SCHOOL_LINE}
        </p>

        {/* Sample data must never pass for a roster: if the live list didn't
            arrive, say so plainly rather than letting fixtures stand in
            silently. */}
        {sample && (
          <div className="mt-3.5 flex max-w-[560px] items-start gap-2.5 rounded-[10px] bg-nevo-violet/14 px-[14px] py-3">
            <span className="mt-px shrink-0 text-nevo-navy">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8h.01M11 12h1v4h1" />
              </svg>
            </span>
            <span className="text-[13.5px] leading-[1.5] text-nevo-near-black/78">
              We couldn&rsquo;t reach your school just now, so these are sample
              classes.
            </span>
          </div>
        )}

        {/* Desktop grid */}
        <div className="mt-6 hidden grid-cols-3 gap-4 xl:grid">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/classes/${c.id}`}
              className="flex cursor-pointer flex-col rounded-[12px] bg-nevo-cream-elevated p-6 shadow-elevation-1 transition-[filter,transform] hover:brightness-[0.985] active:scale-[0.99]"
            >
              <span className="text-[19px] font-semibold tracking-[-0.01em] text-nevo-near-black">
                {c.name}
              </span>
              <span className="mt-[5px] text-[13.5px] text-nevo-near-black/60">
                {c.subjects}
              </span>
              <span className="mt-0.5 text-[13.5px] text-nevo-near-black/50">
                {c.count} students
              </span>
              <div className="mt-[18px] flex items-center gap-[9px] border-t border-nevo-near-black/8 pt-4">
                <SummaryDot tone={c.summaryTone} />
                <span className="text-sm text-nevo-near-black/72">
                  {c.summary}
                </span>
              </div>
            </Link>
          ))}
          {liveExtras.map((a) => (
            <Link
              key={a.assignment_id}
              href={`/teacher/classes/${a.class_id}`}
              className="flex cursor-pointer flex-col rounded-[12px] bg-nevo-cream-elevated p-6 shadow-elevation-1 transition-[filter,transform] hover:brightness-[0.985] active:scale-[0.99]"
            >
              <span className="text-[19px] font-semibold tracking-[-0.01em] text-nevo-near-black">
                {a.class_name}
              </span>
              {a.class_code && (
                <span className="mt-[5px] text-[13.5px] text-nevo-near-black/60">
                  {`Class code ${a.class_code}`}
                </span>
              )}
              <span className="mt-0.5 text-[13.5px] text-nevo-near-black/50">
                Synced from your school
              </span>
            </Link>
          ))}
        </div>

        {/* Tablet: stacked horizontal cards */}
        <div className="mt-5 flex flex-col gap-3 xl:hidden">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/classes/${c.id}`}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-[12px] bg-nevo-cream-elevated px-[22px] py-5 shadow-elevation-1 transition-[filter,transform] hover:brightness-[0.985] active:scale-[0.99]"
            >
              <div className="min-w-0">
                <span className="text-[17px] font-semibold text-nevo-near-black">
                  {c.name}
                </span>
                <div className="mt-1 text-[13px] text-nevo-near-black/60">
                  {c.subjects} · {c.count} students
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <SummaryDot tone={c.summaryTone} />
                <span className="text-[13.5px] text-nevo-near-black/70">
                  {c.summary}
                </span>
              </div>
            </Link>
          ))}
          {liveExtras.map((a) => (
            <Link
              key={a.assignment_id}
              href={`/teacher/classes/${a.class_id}`}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-[12px] bg-nevo-cream-elevated px-[22px] py-5 shadow-elevation-1 transition-[filter,transform] hover:brightness-[0.985] active:scale-[0.99]"
            >
              <div className="min-w-0">
                <span className="text-[17px] font-semibold text-nevo-near-black">
                  {a.class_name}
                </span>
                <div className="mt-1 text-[13px] text-nevo-near-black/60">
                  {a.class_code ? `Class code ${a.class_code}` : "Assigned to you"}
                </div>
              </div>
              <span className="shrink-0 text-[13.5px] text-nevo-near-black/50">
                Synced from your school
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
