"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  classesApi,
  type AdminClass,
  type LearnerObservation,
} from "@/lib/api/classes";
import { intelligenceApi, type AttentionFlag } from "@/lib/api/intelligence";
import { studentsApi, type AdminStudentRow } from "@/lib/api/students";
import { yearGroupLabel } from "@/lib/constants/yearGroups";
import { cn } from "@/lib/utils";
import { NoAccess, failureKind } from "../NoAccess";
import { WriteFailed } from "../WriteFailed";
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
 * THE ARITHMETIC THAT JUSTIFIED THIS DEFERRAL WAS TWO-THIRDS WRONG. It read:
 * "Each needs its own per-student request, and there is no bulk route, so at
 * 247 profiles that is ~741 calls to paint a list." Of D8b's three list
 * figures only ONE costs a call per learner:
 *
 *   - ACTIVE SUPPORT still does. `GET /api/intelligence/accommodations/{id}`
 *     is the only accommodations route in the spec and takes no student list.
 *   - ADAPTATIONS THIS WEEK is ONE windowed call:
 *     `GET /api/admin/adaptation-log?dateFrom=...`, whose rows carry
 *     `studentId`. `schoolIntelligenceApi.adaptationLog` already does exactly
 *     this in AdaptationLogView.
 *   - LESSONS COMPLETED arrives per learner on the class roster read as the
 *     `completed_lessons` observation with its count - and this screen already
 *     makes one request per class.
 *
 * LESSONS COMPLETED IS BUILT, at no extra cost: the per-class fan-out was
 * switched from `studentsApi.list({classId})` to `classesApi.classStudents`,
 * which carries the same membership plus `observations`. Same number of calls.
 *
 * ADAPTATIONS THIS WEEK IS NOT BUILT, and the "one windowed call" above
 * overstates it. `GET /api/admin/adaptation-log` caps `limit` at 100, and
 * `AdaptationEventLogResponse.total` carries NO DESCRIPTION in the deployed
 * spec - so it is not known to be window-scoped or uncapped, and a per-learner
 * tally gated on it could under-report silently. Doing it honestly needs a
 * paging loop terminating on a short page (`events.length < limit`), which is
 * a real piece of work rather than a free one.
 *
 * TODO(api): a list-scoped accommodations read, for ACTIVE SUPPORT. That is
 * the one of the three that genuinely costs a call per learner.
 */

type Phase = "loading" | "ready" | "failed" | "denied";
type View = "attention" | "profiles";

/**
 * Lessons finished, off the roster observations, or null when we were not told.
 *
 * `observations` is OPTIONAL on `ClassStudentResponse` and `count` is optional
 * and nullable on each entry, so three separate things mean "no figure": no
 * observations array, no `completed_lessons` entry, and an entry whose count is
 * null. All three return null and none of them is a zero.
 */
function completedLessons(
  observations: LearnerObservation[] | undefined,
): number | null {
  const hit = observations?.find((o) => o.pattern === "completed_lessons");
  return typeof hit?.count === "number" ? hit.count : null;
}

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
  /** A "mark as seen" the server refused. Nothing moved; say why. */
  const [ackFailed, setAckFailed] = useState(false);
  /** The flag currently being marked, so the row can say it is in flight. */
  const [acking, setAcking] = useState<string | null>(null);
  /**
   * How each class's own roster read went. THREE STATES: the previous fix had
   * only "failed", and `undefined` doubled as both "fine" and "still in the
   * air" - so selecting a class before its request landed printed "No profiles
   * match", the same false absence, in a different window.
   */
  const [classRead, setClassRead] = useState<
    Record<string, "pending" | "ok" | "failed">
  >({});
  /*
   * Lessons finished, per learner, from the SAME per-class read that builds
   * `classOf`. It is keyed by student rather than by class so a row can ask for
   * its own figure without knowing which request carried it.
   *
   * A learner ABSENT from this map has no figure - and the row renders nothing
   * rather than a dash or a zero. "0 lessons" and "we have not read your class
   * yet" are different statements, and on a SENCo screen the second must never
   * be printed as the first.
   */
  const [lessonsDone, setLessonsDone] = useState<Record<string, number>>({});

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
        /*
         * One request per class, and each can fail on its own. A class whose
         * roster did not answer contributes NO entries to `classOf`, so
         * filtering to it matched nobody and the screen said "No profiles
         * match. Try a different name or filter." - which reads as a fact
         * about the school's records. A SENCo checking who she holds profiles
         * for before a review meeting concluded Nevo held none.
         */
        setClassRead(
          Object.fromEntries(c.map((k) => [k.id, "pending" as const])),
        );
        /*
         * READS THE CLASS ROSTER, NOT THE STUDENT LIST. This used to call
         * `studentsApi.list({ classId })`, whose `StudentSummaryResponse`
         * carries no `observations` - so D8b's "lessons completed" figure was
         * deferred as needing a request per learner when the request the screen
         * ALREADY MAKES could carry it. `GET /api/v1/classes/{id}/students`
         * returns the same membership plus `observations`, at the same cost.
         */
        c.forEach((klass) => {
          classesApi
            .classStudents(klass.id)
            .then((inClass) => {
              setClassOf((prev) => {
                const next = { ...prev };
                inClass.forEach((st) => {
                  next[st.studentId] = klass.id;
                });
                return next;
              });
              setLessonsDone((prev) => {
                const next = { ...prev };
                inClass.forEach((st) => {
                  const done = completedLessons(st.observations);
                  if (done !== null) next[st.studentId] = done;
                });
                return next;
              });
              setClassRead((prev) => ({ ...prev, [klass.id]: "ok" }));
            })
            .catch(() =>
              setClassRead((prev) => ({ ...prev, [klass.id]: "failed" })),
            );
        });
      })
      .catch((err: unknown) => setPhase(failureKind(err)));
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

  /*
   * PESSIMISTIC, AND DELIBERATELY SO.
   *
   * This used to flip the flag first and roll it back on failure. That is the
   * usual optimistic trade, and it is the wrong one HERE, because the flag
   * disappearing is not a cosmetic state - it is what makes the card below
   * render "Nothing needs your attention right now". Clearing the last open
   * flag therefore stated the SENCo's whole queue was empty before the POST had
   * returned, and on a failure the row came back with the reassurance already
   * read. A screen whose job is to say what needs looking at must not say
   * "nothing" on the strength of a write nobody has confirmed.
   *
   * #301 added the words for the failure but left this ordering, which is the
   * half that produces the false claim.
   *
   * The rollback is gone with it: there is nothing to roll back if nothing
   * moved, and the old rollback called `setAckFailed` from inside a `setFlags`
   * updater - a side effect in a function React is free to run twice.
   */
  const acknowledge = (flagId: string) => {
    // A BACKSTOP, not the guard that does the work: every row's button is
    // disabled while one is in flight, which is what the test can actually
    // reach and what stops two acknowledgements racing each other's
    // `setFlags`. This line only matters if that `disabled` is ever dropped.
    if (acking) return;
    setAcking(flagId);
    setAckFailed(false);
    intelligenceApi
      .acknowledgeFlag(flagId)
      .then(() =>
        setFlags((prev) =>
          prev.map((f) => (f.id === flagId ? { ...f, acknowledged: true } : f)),
        ),
      )
      .catch(() => setAckFailed(true))
      .finally(() => setAcking(null));
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

        {phase === "denied" ? (
          <NoAccess what="learning support" />
        ) : phase === "failed" ? (
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
        {phase === "ready" && view === "attention" && ackFailed ? (
          <WriteFailed className="mt-6" what="record that as seen" />
        ) : null}

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
                          disabled={acking !== null}
                          className="cursor-pointer text-[13px] font-semibold text-nevo-near-black/55 transition-opacity hover:text-nevo-near-black/80 disabled:cursor-wait disabled:opacity-50"
                        >
                          {acking === f.id ? "Marking…" : "Mark as seen"}
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
                  {classId && classRead[classId] === "failed" ? (
                    <p className="m-0 text-sm text-nevo-near-black/62">
                      We couldn&rsquo;t read that class&rsquo;s roster just now,
                      so there&rsquo;s nothing to show here yet &ndash; this is
                      not a record that the class has no profiles.
                    </p>
                  ) : classId && classRead[classId] !== "ok" ? (
                    /* Still in the air. Not an answer, so not a claim. */
                    <p className="m-0 text-sm text-nevo-near-black/62">
                      Still reading that class&rsquo;s roster&hellip;
                    </p>
                  ) : (
                    <p className="m-0 text-sm text-nevo-near-black/62">
                      No profiles match. Try a different name or filter.
                    </p>
                  )}
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
                    {/* ABSENT, NOT ZERO. A learner whose class roster has not
                        answered - or failed - is simply not in `lessonsDone`,
                        and gets no figure at all. Rendering "0" or a dash here
                        would attribute the silence to the child. */}
                    {typeof lessonsDone[s.id] === "number" ? (
                      <span className="flex-none text-[13px] text-nevo-near-black/55">
                        {`${lessonsDone[s.id]} ${lessonsDone[s.id] === 1 ? "lesson" : "lessons"} finished`}
                      </span>
                    ) : null}
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
