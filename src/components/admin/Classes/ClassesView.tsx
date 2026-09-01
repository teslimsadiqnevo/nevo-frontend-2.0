"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  classesApi,
  type AdminClass,
  type AssignedTeacher,
} from "@/lib/api/classes";
import { yearGroupLabel, yearGroupOptions, yearGroupOrder } from "@/lib/constants/yearGroups";
import { cn } from "@/lib/utils";
import {
  CARD,
  GHOST_BTN,
  NoTeacherYet,
  PRIMARY_BTN,
  PlusIcon,
  ROW_DIVIDER,
} from "../Roster/primitives";
import { ClassFormSheet } from "./ClassFormSheet";

/**
 * D5 Classes - the list a school actually works from.
 *
 * SCRUM-40 calls this the operational backbone, and its "done when" is the
 * thing to hold onto: a class with NO TEACHER must be identifiable without
 * opening a row. That single requirement is why this screen fetches more than
 * the list endpoint gives it - see the teacher-label note below.
 *
 * Everything here is enrolment fact. No lesson content, no scores, no
 * adaptation reasoning - the spec calls that boundary structural rather than a
 * matter of taste, and the roster routes honour it.
 *
 * TODO(api): `GET /api/v1/classes` returns no teachers. SCRUM-40's data note
 * asks for `teachers:[{id,name,role}]` on each row and the whole screen is
 * built around it, so until that lands each row resolves its own teachers
 * through `GET /api/v1/classes/{id}/teachers`. That is N+1 requests, fired in
 * parallel after the list paints, with the column showing a quiet placeholder
 * until they land - the list itself never waits on them. Fine at fourteen
 * classes, wrong at four hundred. Folding teachers into the list response
 * deletes this entire mechanism.
 *
 * TODO(api): no endpoint reports when the SSO roster last synced, so the
 * SSO-sourced source line names the provider without the spec's "Last synced
 * 20 minutes ago" clause.
 */

type Phase = "loading" | "ready" | "failed";

const SEARCH_BAR =
  "flex h-[42px] w-full max-w-[340px] flex-1 items-center gap-[9px] rounded-[10px] border-[1.5px] border-nevo-near-black/10 bg-nevo-cream-elevated px-[15px] text-[14.5px] text-nevo-near-black outline-none transition-colors placeholder:text-nevo-near-black/50 focus-within:border-nevo-navy";

const FILTER_PILL =
  "flex h-[42px] cursor-pointer items-center gap-[7px] rounded-[10px] border-[1.5px] border-nevo-near-black/16 px-[14px] text-[13.5px] font-medium text-nevo-near-black/72 transition-colors hover:bg-nevo-navy/[0.06]";

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-none text-nevo-near-black/50"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

/** "Ms. Adeyemi +1" - the primary leads the label, the rest are a count. */
function teacherLabel(teachers: AssignedTeacher[]): string {
  const named = [...teachers].sort((a, b) =>
    a.role === b.role ? 0 : a.role === "primary" ? -1 : 1,
  );
  const first = named[0];
  const name =
    [first.first_name, first.last_name].filter(Boolean).join(" ").trim() ||
    first.email ||
    "Assigned teacher";
  return named.length > 1 ? `${name} +${named.length - 1}` : name;
}

export function ClassesView() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [teachers, setTeachers] = useState<Record<string, AssignedTeacher[]>>({});
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback((includeArchived: boolean) => {
    classesApi
      .list(includeArchived)
      .then((rows) => {
        setClasses(rows);
        setPhase("ready");
        // The list paints first; teacher labels settle in behind it. A row
        // that fails to resolve stays a placeholder rather than claiming the
        // class has nobody teaching it - "No teacher yet" is a fact, and we
        // only state it once the roster has actually answered.
        rows.forEach((c) => {
          classesApi
            .classTeachers(c.id)
            .then((list) => setTeachers((prev) => ({ ...prev, [c.id]: list })))
            .catch(() => undefined);
        });
      })
      .catch(() => setPhase("failed"));
  }, []);

  useEffect(() => {
    load(showArchived);
  }, [load, showArchived]);

  const retry = () => {
    setPhase("loading");
    load(showArchived);
  };

  // SSO owns the class list where the school signed in with a provider, so
  // Create is ABSENT rather than disabled - the spec is specific that manual
  // controls go away instead of greying out.
  const ssoSourced = classes.length > 0 && classes.every((c) => c.source === "sso");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return classes
      .filter((c) => (year ? c.yearGroup === year : true))
      .filter((c) =>
        needle
          ? c.name.toLowerCase().includes(needle) ||
            (yearGroupLabel(c.yearGroup) ?? "").toLowerCase().includes(needle)
          : true,
      )
      .sort(
        (a, b) =>
          yearGroupOrder(a.yearGroup) - yearGroupOrder(b.yearGroup) ||
          a.name.localeCompare(b.name),
      );
  }, [classes, search, year]);

  const studentTotal = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const filtering = Boolean(search.trim() || year);

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[900px]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="m-0 text-[28px] font-semibold tracking-[-0.018em] text-nevo-near-black">
              Classes
            </h2>
            {phase === "ready" ? (
              <p className="mt-1.5 text-[14.5px] text-nevo-near-black/60">
                {classes.length} {classes.length === 1 ? "class" : "classes"} &middot;{" "}
                {studentTotal} {studentTotal === 1 ? "student" : "students"}
              </p>
            ) : null}
          </div>
          {phase === "ready" && classes.length > 0 && !ssoSourced ? (
            <button type="button" onClick={() => setCreating(true)} className={PRIMARY_BTN}>
              <PlusIcon />
              Create a class
            </button>
          ) : null}
        </div>

        {phase === "loading" ? <div className={cn(CARD, "mt-[22px] h-[320px] animate-pulse")} /> : null}

        {phase === "failed" ? (
          <div className={cn(CARD, "mt-[22px] px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load your classes
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has changed - this is only about showing you the list. Try
              again in a moment.
            </p>
            <button type="button" onClick={retry} className={cn(PRIMARY_BTN, "mt-5")}>
              Try again
            </button>
          </div>
        ) : null}

        {phase === "ready" && classes.length === 0 && !showArchived ? (
          <EmptyState onCreate={() => setCreating(true)} />
        ) : null}

        {phase === "ready" && (classes.length > 0 || showArchived) ? (
          <>
            {ssoSourced ? (
              <p className="mt-[18px] text-[13.5px] leading-[1.55] text-nevo-near-black/62">
                These classes come from your school&rsquo;s connected roster.{" "}
                <Link href="/admin/sso" className="font-semibold text-nevo-navy hover:opacity-75">
                  IT &amp; SSO
                </Link>
              </p>
            ) : null}

            <div className="mt-[18px] flex flex-wrap items-center gap-3">
              <label className={SEARCH_BAR}>
                <SearchIcon />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search classes"
                  aria-label="Search classes"
                  className="min-w-0 flex-1 border-none bg-transparent outline-none"
                />
              </label>

              <label className={cn(FILTER_PILL, "relative")}>
                <span className="sr-only">Filter by year group</span>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="cursor-pointer appearance-none bg-transparent pr-1 outline-none"
                >
                  <option value="">All years</option>
                  {yearGroupOptions().map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                aria-pressed={showArchived}
                className={cn(
                  FILTER_PILL,
                  showArchived && "border-nevo-navy bg-nevo-navy/[0.06] text-nevo-navy",
                )}
              >
                {showArchived ? "Showing archived" : "Show archived"}
              </button>
            </div>

            <div className={cn(CARD, "mt-[18px]")}>
              <div className="grid grid-cols-[1.4fr_90px_90px_1.2fr] gap-4 border-b border-nevo-near-black/8 bg-nevo-near-black/[0.03] px-6 py-[13px] text-[11.5px] font-semibold uppercase tracking-[0.05em] text-nevo-near-black/50 max-lg:grid-cols-[1.3fr_70px_1fr]">
                <span>Class</span>
                <span className="max-lg:hidden">Year</span>
                <span>Students</span>
                <span>Teachers</span>
              </div>

              {visible.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="m-0 text-sm text-nevo-near-black/62">
                    {filtering ? "No classes match that." : "No archived classes."}
                  </p>
                  {filtering ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setYear("");
                      }}
                      className="mt-3 cursor-pointer text-sm font-semibold text-nevo-navy hover:opacity-75"
                    >
                      Clear search
                    </button>
                  ) : null}
                </div>
              ) : (
                visible.map((c, i) => {
                  const assigned = teachers[c.id];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => router.push(`/admin/classes/${c.id}`)}
                      className={cn(
                        "grid w-full cursor-pointer grid-cols-[1.4fr_90px_90px_1.2fr] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-nevo-navy/[0.03] max-lg:grid-cols-[1.3fr_70px_1fr] max-lg:px-[18px] max-lg:py-[13px]",
                        i < visible.length - 1 && ROW_DIVIDER,
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[15.5px] font-semibold text-nevo-near-black">
                          {c.name}
                        </span>
                        {/* The Year column drops on tablet, so the year group
                            rides under the name there instead of vanishing. */}
                        <span className="mt-0.5 hidden text-[12.5px] text-nevo-near-black/55 max-lg:block">
                          {yearGroupLabel(c.yearGroup) ?? "No year group"}
                        </span>
                        {c.archivedAt ? (
                          <span className="mt-1 inline-flex items-center rounded-full bg-nevo-violet/24 px-[9px] py-0.5 text-[11px] font-semibold text-nevo-navy">
                            Archived
                          </span>
                        ) : null}
                      </span>
                      <span className="text-sm text-nevo-near-black/66 max-lg:hidden">
                        {yearGroupLabel(c.yearGroup) ?? "—"}
                      </span>
                      <span className="text-sm text-nevo-near-black/66">{c.studentCount}</span>
                      <span className="flex min-w-0 items-center">
                        {assigned === undefined ? (
                          <span
                            aria-hidden="true"
                            className="h-3.5 w-24 rounded bg-nevo-near-black/[0.07]"
                          />
                        ) : assigned.length === 0 ? (
                          <NoTeacherYet />
                        ) : (
                          <span className="truncate text-sm text-nevo-near-black/78">
                            {teacherLabel(assigned)}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : null}
      </div>

      {creating ? (
        <ClassFormSheet
          onClose={() => setCreating(false)}
          onSaved={(id) => {
            setCreating(false);
            router.push(`/admin/classes/${id}`);
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * The first-run state. Two ways forward, because a school that has connected a
 * provider should not be typing its roster in by hand.
 */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <div className="max-w-[420px]">
        <Image
          src="/illustrations/empty-admin-classes.png"
          alt=""
          width={320}
          height={200}
          className="mx-auto mb-3 h-[200px] w-auto object-contain"
          priority
        />
        <h3 className="m-0 text-xl font-semibold text-nevo-near-black">No classes yet</h3>
        <p className="mt-2.5 text-[15px] leading-[1.6] text-nevo-near-black/64">
          Create your first class, then assign a teacher and enrol students. If
          you connect SSO, your classes can come across automatically.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={onCreate} className={PRIMARY_BTN}>
            <PlusIcon />
            Create a class
          </button>
          <Link href="/admin/sso" className={GHOST_BTN}>
            Import from SSO
          </Link>
        </div>
      </div>
    </div>
  );
}
