"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LIBRARY_FILTERS,
  LIBRARY_LESSONS,
  type LessonStatus,
  type LibraryFilter,
} from "@/lib/mocks/teacherLibrary";
import { cn } from "@/lib/utils";

/**
 * Lesson Library (C06 / `Nevo Teacher Library` frame). Upload sits level with
 * search - for a new teacher, uploading is the first move, not searching an
 * empty shelf. Desktop: search + upload in one row, 3-column grid; tablet:
 * upload full-width below search, 2-column grid. Simple subject pills, no
 * filter modal. Empty shelf and no-results are distinct calm states.
 */

const SEARCH_ICON = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);

const PLUS_ICON = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

function statusPillClass(status: LessonStatus): string {
  return cn(
    "shrink-0 rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold whitespace-nowrap",
    status === "Assigned" && "bg-nevo-violet/24 text-nevo-navy",
    status === "Ready" && "bg-nevo-navy/10 text-nevo-near-black/60",
    status === "Draft" && "bg-nevo-near-black/6 text-nevo-near-black/50",
  );
}

function UploadButton({ className }: { className?: string }) {
  return (
    <Link
      href="/teacher/lessons/upload"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-[9px] rounded-[10px] bg-nevo-navy text-[15px] font-semibold text-nevo-cream transition-[filter,transform] hover:brightness-93 active:scale-[0.99]",
        className,
      )}
    >
      {PLUS_ICON}
      Upload a lesson
    </Link>
  );
}

export function LessonLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("All");

  const lessons = LIBRARY_LESSONS;
  const q = query.trim().toLowerCase();
  const shown = lessons.filter(
    (l) =>
      (filter === "All" || l.subject === filter) &&
      (!q ||
        l.title.toLowerCase().includes(q) ||
        l.meta.toLowerCase().includes(q)),
  );
  const hasQuery = q.length > 0;

  // Empty shelf (new teacher) - uploading is the entire page.
  if (lessons.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="flex max-w-[420px] flex-col items-center text-center">
          <div className="flex size-[88px] items-center justify-center rounded-[20px] bg-nevo-cream-elevated text-nevo-violet shadow-elevation-1">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
              <path d="M4 19a2 2 0 0 1 2-2h12" />
              <path d="M9 7h6" />
            </svg>
          </div>
          <h2 className="mt-[26px] text-[22px] font-semibold tracking-[-0.01em] text-nevo-near-black">
            Nothing here yet
          </h2>
          <p className="mt-3 text-base leading-[1.6] text-nevo-near-black/66">
            Upload your first lesson and Nevo will get it ready for your
            students. A PDF, Word doc or slides all work.
          </p>
          <UploadButton className="mt-6 h-[52px] px-[26px] text-[15.5px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
        Lesson Library
      </h2>

      {/* Search + upload: one row on desktop, stacked full-width on tablet */}
      <div className="mt-[18px] max-w-[1000px] xl:mt-[22px] xl:flex xl:items-center xl:gap-3.5">
        <div className="relative flex-1">
          <span
            className={cn(
              "absolute top-1/2 left-4 -translate-y-1/2",
              hasQuery ? "text-nevo-navy" : "text-nevo-near-black/45",
            )}
          >
            {SEARCH_ICON}
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons"
            aria-label="Search lessons"
            className={cn(
              "h-12 w-full rounded-[10px] border-[1.5px] bg-nevo-cream-elevated px-11 text-[15px] text-nevo-near-black outline-none placeholder:text-nevo-near-black/45 xl:h-[50px] xl:text-[15.5px]",
              hasQuery ? "border-nevo-navy" : "border-nevo-near-black/14",
            )}
          />
          {hasQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-nevo-near-black/40"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        <UploadButton className="mt-3 h-12 w-full shrink-0 xl:mt-0 xl:h-[50px] xl:w-auto xl:px-[22px]" />
      </div>

      {/* Subject pills */}
      <div className="mt-4 flex max-w-[1000px] flex-wrap gap-2 xl:mt-[18px] xl:gap-[9px]">
        {LIBRARY_FILTERS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setFilter(label)}
            className={cn(
              "cursor-pointer rounded-full px-[15px] py-2 text-[13.5px] font-medium transition-[transform,background-color] active:scale-[0.99]",
              filter === label
                ? "bg-nevo-navy text-nevo-cream"
                : "border border-nevo-near-black/8 bg-nevo-cream-elevated text-nevo-near-black/72",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {hasQuery && shown.length > 0 && (
        <p className="mt-[18px] text-sm text-nevo-near-black/60">
          {`${shown.length} ${shown.length === 1 ? "lesson" : "lessons"} matching “${query.trim()}”`}
        </p>
      )}

      {shown.length > 0 ? (
        <div className="mt-[18px] grid max-w-[1000px] grid-cols-2 gap-3.5 xl:grid-cols-3 xl:gap-4">
          {shown.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/teacher/lessons/${lesson.id}`}
              className="flex min-h-[158px] cursor-pointer flex-col rounded-[12px] bg-nevo-cream-elevated p-5 shadow-elevation-1 transition-[filter,transform] hover:brightness-[0.985] active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2.5">
                <span className="text-[16.5px] leading-[1.3] font-semibold tracking-[-0.01em] text-nevo-near-black">
                  {lesson.title}
                </span>
                <span className={statusPillClass(lesson.status)}>
                  {lesson.status}
                </span>
              </div>
              <span className="mt-2 text-[13.5px] text-nevo-near-black/60">
                {lesson.meta}
              </span>
              <div className="flex-1" />
              <div className="mt-3.5 border-t border-nevo-near-black/8 pt-3 text-[13px] text-nevo-near-black/55">
                {lesson.assigned}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // No lessons match the search/filter
        <div className="mt-10 flex flex-col items-center p-6 text-center">
          <div className="flex size-[72px] items-center justify-center rounded-[18px] bg-nevo-cream-elevated text-nevo-violet shadow-elevation-1">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
          </div>
          <h3 className="mt-[18px] text-lg font-semibold text-nevo-near-black">
            No lessons match that
          </h3>
          <p className="mt-1.5 max-w-[340px] text-[14.5px] leading-[1.5] text-nevo-near-black/62">
            Try a different word or clear the search. You can always upload a
            new lesson.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("All");
            }}
            className="mt-[18px] cursor-pointer text-[14.5px] font-medium text-nevo-navy"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
