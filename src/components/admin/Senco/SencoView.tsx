"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { classesApi, type AdminClass } from "@/lib/api/classes";
import { intelligenceApi, type AttentionFlag } from "@/lib/api/intelligence";
import { studentsApi, type AdminStudentRow } from "@/lib/api/students";
import { yearGroupLabel } from "@/lib/constants/yearGroups";
import { cn } from "@/lib/utils";
import {
  Avatar,
  CARD,
  PRIMARY_BTN,
  PlusIcon,
  ROW_DIVIDER,
  SectionHeading,
} from "../Roster/primitives";

/**
 * D8 Learning Support and D8b Learner Profiles - the SENCo surface.
 *
 * The frame calls these "the highest-stakes screens in the layer", and the
 * register is the whole point: EVERYTHING READS IN HUMAN TERMS. No clinical
 * labels, no confidence scores, no raw signal talk, no diagnosis. What Nevo
 * noticed is described as behaviour in a moment, never as a property of a
 * child. If a change to this screen would make a sentence read like a
 * judgement about a learner, it is the wrong change.
 *
 * Nothing here has been shared with anyone. The overview says so out loud,
 * because a SENCo looking at a list of flagged children needs to know the list
 * is theirs and has not gone anywhere.
 *
 * ============================================================================
 * "ESCALATED BY A TEACHER" IS NOT BUILT, AND CANNOT BE.
 *
 * D8 puts teacher escalations ABOVE Nevo's own flags, and says why: "a
 * teacher's escalation carries a human concern". It is the more important half
 * of this screen.
 *
 * There is no teacher-to-SENCo transport anywhere in the API. Nothing creates
 * an escalation, nothing stores one, nothing lists one. The teacher console
 * already hit this from the other side - its escalation sheet had to stop
 * confirming delivery, because it was reporting a safeguarding referral as
 * sent over a handler that posted nothing.
 *
 * So the section is ABSENT rather than empty-stated: an empty "Escalated by a
 * teacher" list would tell a SENCo that no teacher has raised a concern, which
 * is a claim this console cannot make and the most damaging possible thing to
 * get wrong on this screen. The overview says plainly what it does and does not
 * cover instead. Raised with backend as the single highest priority on the
 * SENCo surface.
 * ============================================================================
 *
 * TODO(api): D8b's list cards carry three figures per learner - active
 * support, lessons completed, adaptations this week. Each needs its own
 * per-student request, and there is no bulk route, so at 247 profiles that is
 * ~741 calls to paint a list. They are shown on the individual profile, where
 * they cost three calls for one learner, and the list carries identity only.
 */

type Phase = "loading" | "ready" | "failed";
type View = "attention" | "profiles";

const SEARCH_BAR =
  "flex h-[42px] w-full max-w-[320px] flex-1 items-center gap-[9px] rounded-[10px] border-[1.5px] border-nevo-near-black/10 bg-nevo-cream-elevated px-[15px] text-[14.5px] text-nevo-near-black outline-none transition-colors placeholder:text-nevo-near-black/50 focus-within:border-nevo-navy";

const FILTER_PILL =
  "flex h-[42px] cursor-pointer items-center gap-[7px] rounded-[10px] border-[1.5px] border-nevo-near-black/16 px-[14px] text-[13.5px] font-medium text-nevo-near-black/72 transition-colors hover:bg-nevo-navy/[0.06]";

function relativeDay(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const days = Math.round((now - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(then).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function SencoView() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<View>("attention");
  const [flags, setFlags] = useState<AttentionFlag[]>([]);
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [classOf, setClassOf] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [now, setNow] = useState(0);

  const load = useCallback(() => {
    Promise.all([
      intelligenceApi.getFlags({ limit: 50 }),
      studentsApi.list(),
      classesApi.list(),
    ])
      .then(([f, s, c]) => {
        setFlags(f);
        setStudents(s);
        setClasses(c);
        setNow(Date.now());
        setPhase("ready");
        c.forEach((klass) => {
          studentsApi
            .list({ classId: klass.id })
            .then((inClass) =>
              setClassOf((prev) => {
                const next = { ...prev };
                inClass.forEach((st) => {
                  next[st.id] = klass.id;
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
    load();
  }, [load]);

  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  const openFlags = useMemo(
    () => flags.filter((f) => !f.acknowledged),
    [flags],
  );

  const profiles = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return students
      .filter((s) => (classId ? classOf[s.id] === classId : true))
      .filter((s) => (needle ? s.name.toLowerCase().includes(needle) : true));
  }, [students, search, classId, classOf]);

  const acknowledge = (flagId: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, acknowledged: true } : f)),
    );
    intelligenceApi.acknowledgeFlag(flagId).catch(() =>
      setFlags((prev) =>
        prev.map((f) => (f.id === flagId ? { ...f, acknowledged: false } : f)),
      ),
    );
  };

  const describeClass = (studentId: string) => {
    const c = classOf[studentId] ? classById.get(classOf[studentId]) : undefined;
    if (!c) return null;
    return [c.name, yearGroupLabel(c.yearGroup)].filter(Boolean).join(" · ");
  };

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[880px]">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-[54ch]">
            <h2 className="m-0 text-[28px] font-semibold tracking-[-0.018em] text-nevo-near-black">
              {view === "attention" ? "Learning Support" : "Learner profiles"}
            </h2>
            <p className="mt-1.5 text-[14.5px] leading-[1.6] text-nevo-near-black/62">
              {view === "attention"
                ? "Patterns Nevo has flagged. You decide what happens next - nothing here has been shared with anyone."
                : `${students.length} ${students.length === 1 ? "profile" : "profiles"}, in plain language.`}
            </p>
          </div>
          <Link href="/admin/senco/export" className={PRIMARY_BTN}>
            <PlusIcon />
            Progress report
          </Link>
        </div>

        <div
          role="tablist"
          aria-label="Learning support"
          className="mt-7 flex gap-1 border-b border-nevo-near-black/10"
        >
          {(
            [
              ["attention", "Needs attention"],
              ["profiles", "Learner profiles"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={cn(
                "-mb-px cursor-pointer border-b-2 px-4 pb-3 pt-2 text-[14.5px] font-semibold transition-colors",
                view === key
                  ? "border-nevo-navy text-nevo-navy"
                  : "border-transparent text-nevo-near-black/55 hover:text-nevo-near-black/80",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {phase === "loading" ? (
          <div className={cn(CARD, "mt-6 h-[320px] animate-pulse")} />
        ) : null}

        {phase === "failed" ? (
          <div className={cn(CARD, "mt-6 px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load Learning Support
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has been missed - this is only about showing it to you.
              Try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase("loading");
                load();
              }}
              className={cn(PRIMARY_BTN, "mt-5")}
            >
              Try again
            </button>
          </div>
        ) : null}

        {/* ------------------------------------------------ NEEDS ATTENTION */}
        {phase === "ready" && view === "attention" ? (
          openFlags.length === 0 ? (
            <div className={cn(CARD, "mt-6 px-6 py-14 text-center")}>
              <h3 className="m-0 text-xl font-semibold text-nevo-near-black">
                Nothing needs your attention right now
              </h3>
              <p className="mx-auto mt-2.5 max-w-[48ch] text-[15px] leading-[1.6] text-nevo-near-black/64">
                When Nevo notices a pattern worth a look, it&rsquo;ll appear
                here. You can still create a progress report for any student at
                any time.
              </p>
              <Link href="/admin/senco/export" className={cn(PRIMARY_BTN, "mx-auto mt-6")}>
                Create a progress report
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-7 flex items-center justify-between gap-4">
                <SectionHeading>Flagged by Nevo</SectionHeading>
                <span className="text-[13px] text-nevo-near-black/50">
                  {openFlags.length} to look at
                </span>
              </div>

              <div className={cn(CARD, "mt-3.5")}>
                {openFlags.map((f, i) => {
                  const student = byId.get(f.studentId);
                  const name = student?.name ?? "A student";
                  const cls = describeClass(f.studentId);
                  return (
                    <div
                      key={f.id}
                      className={cn(
                        "flex items-start gap-3.5 px-[22px] py-[18px]",
                        i < openFlags.length - 1 && ROW_DIVIDER,
                      )}
                    >
                      <Avatar name={name} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[15px] font-semibold text-nevo-near-black">
                            {name}
                          </span>
                          {cls ? (
                            <span className="text-[13px] text-nevo-near-black/58">
                              {cls}
                            </span>
                          ) : null}
                        </div>
                        {/* Zero-Tag: behaviour in the moment, never a label. */}
                        <p className="m-0 mt-1.5 text-sm leading-[1.55] text-nevo-near-black/78">
                          {f.description}
                        </p>
                        <p className="m-0 mt-1.5 text-xs text-nevo-near-black/50">
                          Noticed {relativeDay(f.generatedAt, now)}
                        </p>
                      </div>
                      <div className="flex flex-none flex-col items-end gap-2">
                        <Link
                          href={`/admin/senco/${f.studentId}`}
                          className="cursor-pointer text-[13px] font-semibold text-nevo-navy hover:opacity-75"
                        >
                          Open profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => acknowledge(f.id)}
                          className="cursor-pointer text-[13px] font-semibold text-nevo-near-black/55 transition-opacity hover:text-nevo-near-black/80"
                        >
                          Mark as seen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
        ) : null}

        {/* Said plainly, because an absent section is otherwise indistinguishable
            from a section with nothing in it. */}
        {phase === "ready" && view === "attention" ? (
          <p className="mt-5 max-w-[62ch] text-[13px] leading-[1.6] text-nevo-near-black/55">
            This list covers what Nevo noticed on its own. Concerns a teacher
            raises with you directly don&rsquo;t reach this screen yet - they
            come to you the way they always have.
          </p>
        ) : null}

        {/* ------------------------------------------------ LEARNER PROFILES */}
        {phase === "ready" && view === "profiles" ? (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className={SEARCH_BAR}>
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
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search learners"
                  aria-label="Search learners"
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
            </div>

            <div className={cn(CARD, "mt-4")}>
              {profiles.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="m-0 text-sm text-nevo-near-black/62">
                    No profiles match. Try a different name or filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setClassId("");
                    }}
                    className="mt-3 cursor-pointer text-sm font-semibold text-nevo-navy hover:opacity-75"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                profiles.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/admin/senco/${s.id}`}
                    className={cn(
                      "flex items-center gap-3.5 px-[22px] py-4 transition-colors hover:bg-nevo-navy/[0.03]",
                      i < profiles.length - 1 && ROW_DIVIDER,
                    )}
                  >
                    <Avatar name={s.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold text-nevo-near-black">
                        {s.name}
                      </div>
                      {describeClass(s.id) ? (
                        <div className="truncate text-[13px] text-nevo-near-black/58">
                          {describeClass(s.id)}
                        </div>
                      ) : null}
                    </div>
                    <span className="flex-none text-[13px] font-semibold text-nevo-navy">
                      View profile
                    </span>
                  </Link>
                ))
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
