"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { classesApi } from "@/lib/api/classes";
import { teachersApi, type TeacherSummary } from "@/lib/api/teachers";
import { cn } from "@/lib/utils";
import {
  Avatar,
  CARD,
  GHOST_BTN,
  PRIMARY_BTN,
  PlusIcon,
  ROW_DIVIDER,
} from "../Roster/primitives";
import { StatusPill, isInvited } from "./status";

/**
 * D6 Teachers - admin oversight of staff.
 *
 * EXPLICITLY NOT A PERFORMANCE SURFACE. An admin can see that a teacher is on
 * the platform and what they hold; never their students' scores, never the
 * contents of their notes, never a judgement of their teaching. SCRUM-40 calls
 * that boundary structural, and the frame puts it in writing on the detail page
 * rather than leaving it implied.
 *
 * Three columns only - Teacher, Classes, Status - and deliberately no
 * last-active column: recency lives on the detail page, so the list cannot be
 * read as a league table.
 *
 * Invites are not built here. "Invite a teacher" routes to D19 School
 * Invitations, which owns single and bulk invite, the pending pipeline, resend
 * and revoke. SCRUM-40 is explicit that this screen must not rebuild that form.
 *
 * TODO(api): `GET /api/v1/teachers` carries no `class_count`, so the Classes
 * column resolves per row through `GET /api/v1/teachers/{id}/classes` - N+1,
 * fired after the list paints, exactly as D5 does. Folding a count into the
 * list response removes it.
 *
 * TODO(api): no `source` field either, so the SSO-sourced state (invite absent,
 * source line pointing at IT & SSO) cannot be detected and is not built.
 */

type Phase = "loading" | "ready" | "failed";

const SEARCH_BAR =
  "flex h-[42px] w-full max-w-[340px] flex-1 items-center gap-[9px] rounded-[10px] border-[1.5px] border-nevo-near-black/10 bg-nevo-cream-elevated px-[15px] text-[14.5px] text-nevo-near-black outline-none transition-colors placeholder:text-nevo-near-black/50 focus-within:border-nevo-navy";

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

export function TeachersView() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  // Search is server-side: a school past one page still finds people, which a
  // client-side filter over an already-fetched list would not manage.
  const load = useCallback((term: string) => {
    teachersApi
      .list(term.trim() || undefined)
      .then((rows) => {
        setTeachers(rows);
        setPhase("ready");
        rows.forEach((t) => {
          classesApi
            .teacherClasses(t.id)
            .then((list) => setCounts((prev) => ({ ...prev, [t.id]: list.length })))
            .catch(() => undefined);
        });
      })
      .catch(() => setPhase("failed"));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => load(search), search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const pending = teachers.filter((t) => isInvited(t.status)).length;
  const countLine = [
    `${teachers.length} ${teachers.length === 1 ? "teacher" : "teachers"}`,
    pending > 0
      ? `${pending} ${pending === 1 ? "invitation" : "invitations"} pending`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[900px]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="m-0 text-[28px] font-semibold tracking-[-0.018em] text-nevo-near-black">
              Teachers
            </h2>
            {phase === "ready" ? (
              <p className="mt-1.5 text-[14.5px] text-nevo-near-black/60">{countLine}</p>
            ) : null}
          </div>
          {phase === "ready" && teachers.length > 0 ? (
            <Link href="/admin/invitations" className={PRIMARY_BTN}>
              <PlusIcon />
              Invite a teacher
            </Link>
          ) : null}
        </div>

        {phase === "loading" ? <div className={cn(CARD, "mt-[22px] h-[320px] animate-pulse")} /> : null}

        {phase === "failed" ? (
          <div className={cn(CARD, "mt-[22px] px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load your teachers
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has changed - this is only about showing you the list. Try
              again in a moment.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase("loading");
                load(search);
              }}
              className={cn(PRIMARY_BTN, "mt-5")}
            >
              Try again
            </button>
          </div>
        ) : null}

        {phase === "ready" && teachers.length === 0 && !search.trim() ? <EmptyState /> : null}

        {phase === "ready" && (teachers.length > 0 || search.trim()) ? (
          <>
            <div className="mt-[18px] flex flex-wrap items-center gap-3">
              <label className={SEARCH_BAR}>
                <SearchIcon />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search teachers"
                  aria-label="Search teachers"
                  className="min-w-0 flex-1 border-none bg-transparent outline-none"
                />
              </label>
            </div>

            <div className={cn(CARD, "mt-[18px]")}>
              <div className="grid grid-cols-[1.6fr_120px_120px] gap-4 border-b border-nevo-near-black/8 bg-nevo-near-black/[0.03] px-6 py-[13px] text-[11.5px] font-semibold uppercase tracking-[0.05em] text-nevo-near-black/50 max-lg:hidden">
                <span>Teacher</span>
                <span>Classes</span>
                <span>Status</span>
              </div>

              {teachers.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="m-0 text-sm text-nevo-near-black/62">
                    No teachers match that.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-3 cursor-pointer text-sm font-semibold text-nevo-navy hover:opacity-75"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                teachers.map((t, i) => {
                  const held = counts[t.id];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => router.push(`/admin/teachers/${t.id}`)}
                      className={cn(
                        "grid w-full cursor-pointer grid-cols-[1.6fr_120px_120px] items-center gap-4 px-6 py-[15px] text-left transition-colors hover:bg-nevo-navy/[0.03] max-lg:flex max-lg:items-center max-lg:justify-between max-lg:gap-3 max-lg:px-[18px] max-lg:py-[13px]",
                        i < teachers.length - 1 && ROW_DIVIDER,
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={t.name} email={t.email} size={34} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold text-nevo-near-black">
                            {t.name}
                          </span>
                          {t.email ? (
                            <span className="block truncate text-[13px] text-nevo-near-black/60">
                              {t.email}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="text-sm text-nevo-near-black/66 max-lg:hidden">
                        {held === undefined ? (
                          <span
                            aria-hidden="true"
                            className="block h-3.5 w-14 rounded bg-nevo-near-black/[0.07]"
                          />
                        ) : held === 0 ? (
                          "—"
                        ) : (
                          `${held} ${held === 1 ? "class" : "classes"}`
                        )}
                      </span>
                      <span className="flex max-lg:flex-none">
                        <StatusPill status={t.status} />
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
          src="/illustrations/empty-admin-teachers.png"
          alt=""
          width={320}
          height={200}
          className="mx-auto mb-3 h-[200px] w-auto object-contain"
          priority
        />
        <h3 className="m-0 text-xl font-semibold text-nevo-near-black">No teachers yet</h3>
        <p className="mt-2.5 text-[15px] leading-[1.6] text-nevo-near-black/64">
          Invite your teachers and each one gets their own console. If
          you&rsquo;ve connected SSO, your staff can come across automatically -
          nothing is sent until you invite them.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/admin/invitations" className={PRIMARY_BTN}>
            <PlusIcon />
            Invite a teacher
          </Link>
          <Link href="/admin/sso" className={GHOST_BTN}>
            Import from SSO
          </Link>
        </div>
      </div>
    </div>
  );
}
