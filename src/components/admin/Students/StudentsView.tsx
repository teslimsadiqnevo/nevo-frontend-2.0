"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { classesApi, type AdminClass } from "@/lib/api/classes";
import { studentsApi, type AdminStudentRow } from "@/lib/api/students";
import { yearGroupLabel } from "@/lib/constants/yearGroups";
import { cn } from "@/lib/utils";
import { ConsentPill, blockedByConsent } from "./ConsentPill";
import { statusLabel, studentStatus } from "./status";
import {
  Avatar,
  CARD,
  GHOST_BTN,
  PRIMARY_BTN,
  PlusIcon,
  ROW_DIVIDER,
} from "../Roster/primitives";

/**
 * D7 Students - the school roster.
 *
 * ============================================================================
 * WHAT THIS SCREEN CANNOT DO YET, AND WHY IT IS BUILT ANYWAY
 * ============================================================================
 * D7's stated purpose is "the roster with consent front and centre", and as of
 * 7 Sep it can be. The list row now carries a typed `consent` object - status,
 * actor, timestamp and channel - in the four states SCRUM-40 asks for, so the
 * column, the count clause and the row action arrive together rather than being
 * guessed at.
 *
 * What this is still NOT derived from is `status`. An active account is a
 * different fact from a parent having agreed, and a school reading this screen
 * is reading a legal position. A row whose read did not carry consent renders
 * "Unknown", never "Not sent" - see `ConsentPill`.
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

export function StudentsView() {
  const router = useRouter();
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [classOf, setClassOf] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState(params.get("class") ?? "");
  const [includeInactive, setIncludeInactive] = useState(false);

  const load = useCallback((cid: string, inactive: boolean) => {
    Promise.all([
      studentsApi.list({ classId: cid || undefined, includeInactive: inactive }),
      classesApi.list(),
    ])
      .then(([rows, cls]) => {
        setStudents(rows);
        setClasses(cls);
        setPhase("ready");
        // One request per class builds studentId -> classId. Skipped entirely
        // when the view is already narrowed to a single class.
        if (cid) {
          setClassOf(Object.fromEntries(rows.map((r) => [r.id, cid])));
          return;
        }
        cls.forEach((c) => {
          studentsApi
            .list({ classId: c.id, includeInactive: inactive })
            .then((inClass) =>
              setClassOf((prev) => {
                const next = { ...prev };
                inClass.forEach((s) => {
                  next[s.id] = c.id;
                });
                return next;
              }),
            )
            .catch(() => undefined);
        });
      })
      .catch(() => setPhase("failed"));
  }, []);

  useEffect(() => {
    load(classId, includeInactive);
  }, [load, classId, includeInactive]);

  const classById = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        (s.loginIdentifier ?? "").toLowerCase().includes(needle),
    );
  }, [students, search]);

  const filtering = Boolean(search.trim() || classId || includeInactive);

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[960px]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="m-0 text-[28px] font-semibold tracking-[-0.018em] text-nevo-near-black">
              Students
            </h2>
            {phase === "ready" ? (
              <p className="mt-1.5 text-[14.5px] text-nevo-near-black/60">
                {students.length} enrolled
                {blockedByConsent(students) > 0 ? (
                  <>
                    {" · "}
                    <span className="text-nevo-navy">
                      {blockedByConsent(students)}
                      {" can’t begin lessons yet"}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          {phase === "ready" && students.length > 0 ? (
            <Link href="/admin/invitations" className={PRIMARY_BTN}>
              <PlusIcon />
              Enrol a student
            </Link>
          ) : null}
        </div>

        {phase === "loading" ? <div className={cn(CARD, "mt-[22px] h-[320px] animate-pulse")} /> : null}

        {phase === "failed" ? (
          <div className={cn(CARD, "mt-[22px] px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load your students
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has changed - this is only about showing you the roster.
              Try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase("loading");
                load(classId, includeInactive);
              }}
              className={cn(PRIMARY_BTN, "mt-5")}
            >
              Try again
            </button>
          </div>
        ) : null}

        {phase === "ready" && students.length === 0 && !filtering ? <EmptyState /> : null}

        {phase === "ready" && (students.length > 0 || filtering) ? (
          <>
            <div className="mt-[18px] flex flex-wrap items-center gap-3">
              <label className={SEARCH_BAR}>
                <SearchIcon />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students"
                  aria-label="Search students"
                  className="min-w-0 flex-1 border-none bg-transparent outline-none"
                />
              </label>

              <label className={FILTER_PILL}>
                <span className="sr-only">Filter by class</span>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="cursor-pointer appearance-none bg-transparent outline-none"
                >
                  <option value="">All classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setIncludeInactive((v) => !v)}
                aria-pressed={includeInactive}
                className={cn(
                  FILTER_PILL,
                  includeInactive && "border-nevo-navy bg-nevo-navy/[0.06] text-nevo-navy",
                )}
              >
                {includeInactive ? "Showing deactivated" : "Show deactivated"}
              </button>
            </div>

            <div className={cn(CARD, "mt-[18px]")}>
              {/* Four tracks, matching the rows. Consent sits BEFORE status
                  deliberately: it is the question D07 exists to answer, and the
                  two are easy to conflate when read side by side. */}
              <div className="grid grid-cols-[1.5fr_1fr_112px_112px] gap-4 border-b border-nevo-near-black/8 bg-nevo-near-black/[0.03] px-6 py-[13px] text-[11.5px] font-semibold uppercase tracking-[0.05em] text-nevo-near-black/50">
                <span>Student</span>
                <span>Class</span>
                <span>Consent</span>
                <span>Status</span>
              </div>

              {visible.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="m-0 text-sm text-nevo-near-black/62">
                    No students match that.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setClassId("");
                      setIncludeInactive(false);
                    }}
                    className="mt-3 cursor-pointer text-sm font-semibold text-nevo-navy hover:opacity-75"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                visible.map((s, i) => {
                  const cls = classOf[s.id] ? classById.get(classOf[s.id]) : undefined;
                  // Three states, not two - an invited child is not a
                  // deactivated one. See ./status.
                  const st = studentStatus(s.status);
                  const deactivated = st === "deactivated";
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => router.push(`/admin/students/${s.id}`)}
                      className={cn(
                        "grid w-full cursor-pointer grid-cols-[1.5fr_1fr_112px_112px] items-center gap-4 px-6 py-[15px] text-left transition-colors hover:bg-nevo-navy/[0.03]",
                        i < visible.length - 1 && ROW_DIVIDER,
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={s.name} size={34} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold text-nevo-near-black">
                            {s.name}
                          </span>
                          {s.loginIdentifier ? (
                            <span className="block truncate text-[13px] text-nevo-near-black/60">
                              {s.loginIdentifier}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="min-w-0 truncate text-sm text-nevo-near-black/66">
                        {cls ? (
                          <>
                            {cls.name}
                            {yearGroupLabel(cls.yearGroup) ? (
                              <span className="text-nevo-near-black/45">
                                {" "}
                                · {yearGroupLabel(cls.yearGroup)}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="block h-3.5 w-20 rounded bg-nevo-near-black/[0.07]"
                          />
                        )}
                      </span>
                      <span className="flex">
                        <ConsentPill consent={s.consent} />
                      </span>
                      <span className="flex">
                        <span
                          className={cn(
                            "inline-flex flex-none items-center rounded-full px-3 py-1 text-[12.5px] font-semibold text-nevo-navy",
                            deactivated
                              ? "bg-nevo-near-black/[0.07] text-nevo-near-black/60"
                              : st === "invited"
                                ? "bg-nevo-violet/24"
                                : "bg-nevo-navy/12",
                          )}
                        >
                          {statusLabel(s.status)}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <div className="max-w-[440px]">
        <Image
          src="/illustrations/empty-admin-students.png"
          alt=""
          width={320}
          height={200}
          className="mx-auto mb-3 h-[200px] w-auto object-contain"
          priority
        />
        <h3 className="m-0 text-xl font-semibold text-nevo-near-black">
          No students yet
        </h3>
        <p className="mt-2.5 text-[15px] leading-[1.6] text-nevo-near-black/64">
          Enrol your students and each one gets their own way in. If
          you&rsquo;ve connected SSO, your roster can come across automatically.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/admin/invitations" className={PRIMARY_BTN}>
            <PlusIcon />
            Enrol a student
          </Link>
          <Link href="/admin/sso" className={GHOST_BTN}>
            Import from SSO
          </Link>
        </div>
      </div>
    </div>
  );
}
