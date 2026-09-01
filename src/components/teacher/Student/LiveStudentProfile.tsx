"use client";

import Link from "next/link";
import type { StudentProfileState } from "@/hooks/useStudentProfile";
import {
  ADAPTATIONS_FOOTNOTE_DESKTOP_TAIL,
  ADAPTATIONS_FOOTNOTE_MAIN,
  ADAPTATIONS_LABEL,
} from "@/lib/mocks/teacherIntelligence";
import { cn } from "@/lib/utils";
import { MasteryDualTrack } from "./MasteryDualTrack";

/**
 * C08 Student Profile for a real student.
 *
 * WHAT IS SHOWN. Who they are, whether anything is flagged, how they are
 * doing per concept - the dual-track bars the frame already draws, from
 * `mastery/student` - and whatever Nevo recommends, which the backend writes
 * in plain language already.
 *
 * WHAT IS RULED OUT (Olayinka, 30 Aug 2026), not merely deferred: the
 * learner profile's `workingMemoryCapacity` and `attentionSpan` are never
 * rendered here or on any teacher surface - a number against a child's
 * working memory is the clinical framing C08 forbids and the D22 compliance
 * claim cannot survive.
 *
 * Backend enforced this at the source on 31 Aug: the teacher-scoped profile
 * read no longer returns either field, and they are gone from the type. The
 * ruling stands regardless - if they ever reappear in a payload, they still
 * do not get rendered.
 *
 * The C16c adaptation insights are live, from `/api/adaptations/student/{id}`,
 * with suppressed entries excluded - the section is what actually happened.
 *
 * Recent sessions come from `students/{id}/progress`. Its rows are not
 * clickable: C08d's session panel wants a section-by-section breakdown, and
 * nothing serves one. Its position indices are not shown either - the spec
 * does not say whether they are 0- or 1-based, and "section 0" in front of a
 * teacher is worse than no position.
 *
 * Accommodations are what Nevo is OFFERING, on stated evidence - which is a
 * different thing from the engine parameters above, and reads in the same
 * register the recommendations already do.
 *
 * ALSO ABSENT, for want of an endpoint: the noticing banner and the confidence
 * dimensions. The "what Nevo has seen" evidence list has an endpoint that does
 * not fit it - see `students.ts`.
 * The early state is real: `status: not_observed_yet` is precisely the
 * student the frame's calm early profile was drawn for.
 */

const SECTION_H =
  "text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase xl:text-sm";

/** The support Nevo turned on, named the way the console talks about it. */
const ACCOMMODATION_LABEL: Record<string, string> = {
  reading: "Reading support",
  attention: "Attention support",
  numerical: "Number support",
};

/** `LessonCompletionStatus`, in the frame's plain register. */
const SESSION_NOTE: Record<string, string> = {
  completed: "Finished this lesson",
  in_progress: "Working through it",
  exited: "Left partway through",
};

function initialsOf(first: string | null, last: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function LiveStudentProfile({
  state,
  classHref,
}: {
  state: StudentProfileState;
  classHref?: string;
}) {
  const {
    profile,
    concepts,
    recommendations,
    adaptations,
    sessions,
    accommodations,
    observed,
  } = state;
  if (!profile) return null;

  const { student, openFlagCount } = profile;
  const name = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const early = !observed && concepts.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[860px]">
        <Link
          href={classHref ?? "/teacher/classes"}
          className="inline-flex cursor-pointer items-center gap-[7px] text-sm text-nevo-near-black/60 transition-transform active:scale-[0.99]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {classHref ? "Back to the class" : "My Classes"}
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-nevo-navy text-xl font-semibold text-nevo-cream xl:size-16">
            {initialsOf(student.firstName, student.lastName)}
          </span>
          <div className="min-w-0">
            <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
              {name || "This student"}
            </h2>
            <span className="mt-[3px] block text-[14.5px] text-nevo-near-black/60">
              {[
                student.ageBand,
                observed ? "Learning profile building" : "No profile yet",
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        </div>

        {openFlagCount > 0 && (
          <div className="mt-6 flex max-w-[660px] items-start gap-3.5 rounded-[12px] bg-nevo-violet/14 px-[18px] py-4">
            <span className="mt-px shrink-0 text-nevo-navy">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8h.01M11 12h1v4h1" />
              </svg>
            </span>
            <p className="text-[14.5px] leading-[1.55] text-nevo-near-black/78">
              {`${openFlagCount} ${openFlagCount === 1 ? "thing is" : "things are"} worth your attention for ${name.split(" ")[0] || "this student"}.`}{" "}
              <Link href="/teacher/dashboard" className="font-semibold text-nevo-navy">
                See what Nevo noticed
              </Link>
            </p>
          </div>
        )}

        {early && (
          <div className="mt-6 flex max-w-[660px] items-start gap-4 rounded-[12px] bg-nevo-cream-elevated px-[26px] py-6 shadow-elevation-1">
            <span className="mt-px shrink-0 text-nevo-violet">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </span>
            <div>
              <h3 className="text-[16px] font-semibold text-nevo-near-black xl:text-[17px]">
                {`Nevo is still getting to know ${name.split(" ")[0] || "them"}`}
              </h3>
              <p className="mt-[5px] text-sm leading-[1.55] text-nevo-near-black/66 xl:text-[14.5px]">
                A picture builds as they work through lessons. There&rsquo;s
                nothing to read into a quiet profile this early.
              </p>
            </div>
          </div>
        )}

        {concepts.length > 0 && (
          <>
            <h3 className={cn(SECTION_H, "mt-8")}>Concept mastery</h3>
            <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.5] text-nevo-near-black/60">
              How well each idea has landed, and how much the reading itself is
              shaping that.
            </p>
            <div className="mt-4 flex flex-col gap-5 rounded-[12px] bg-nevo-cream-elevated px-[22px] py-6 shadow-elevation-1 xl:px-[26px]">
              {concepts.map((c) => (
                <MasteryDualTrack
                  key={c.conceptId}
                  concept={c.name}
                  understanding={c.understanding}
                  reading={c.reading}
                />
              ))}
            </div>
          </>
        )}

        {accommodations && accommodations.activeAccommodations.length > 0 && (
          <>
            <h3 className={cn(SECTION_H, "mt-8")}>What Nevo is offering</h3>
            <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.5] text-nevo-near-black/60">
              Support Nevo has turned on, and what it saw that led there.
            </p>
            <div className="mt-3.5 divide-y divide-nevo-near-black/7 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1">
              {accommodations.signals.map((sig) => (
                <div key={sig.accommodation} className="px-[22px] py-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[15px] font-semibold text-nevo-near-black">
                      {ACCOMMODATION_LABEL[sig.accommodation] ??
                        sig.accommodation}
                    </span>
                    <span className="rounded-full bg-nevo-navy/9 px-[9px] py-0.5 text-[11px] font-semibold whitespace-nowrap text-nevo-near-black/55">
                      {`across ${sig.lessonCount} ${sig.lessonCount === 1 ? "lesson" : "lessons"}`}
                    </span>
                  </div>
                  {sig.evidence.length > 0 && (
                    <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-[1.5] text-nevo-near-black/70">
                      {sig.evidence.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {recommendations.length > 0 && (
          <>
            <h3 className={cn(SECTION_H, "mt-8")}>What might help</h3>
            <div className="mt-3.5 divide-y divide-nevo-near-black/7 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1">
              {recommendations.map((r) => (
                <p
                  key={r.id}
                  className="px-[22px] py-4 text-[14.5px] leading-[1.55] text-nevo-near-black/82"
                >
                  {r.recommendationText}
                </p>
              ))}
            </div>
          </>
        )}

        {/* C16c - what Nevo quietly adjusted, and why. */}
        {adaptations.length > 0 && (
          <>
            <h3 className="mt-8 block text-[11px] font-bold tracking-[0.14em] text-nevo-violet uppercase">
              {ADAPTATIONS_LABEL}
            </h3>
            <p className="mt-2 text-[13px] text-nevo-near-black/60">
              {`Nevo quietly adjusts lessons based on how each student learns. Here is what has happened for ${name.split(" ")[0] || "them"} recently.`}
            </p>
            <div className="mt-3.5 flex flex-col gap-2 xl:mt-4">
              {adaptations.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3.5 rounded-[8px] bg-nevo-cream-elevated px-[18px] py-4 xl:gap-4"
                >
                  <span className="w-[46px] shrink-0 pt-px text-[12px] text-nevo-near-black/55">
                    {new Date(entry.timestamp).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-nevo-near-black">
                      {entry.lessonTitle}
                    </span>
                    <p className="mt-1 text-[13px] leading-[1.55] text-nevo-near-black/72">
                      {entry.adaptation}
                    </p>
                    {entry.trigger && (
                      <p className="mt-1 text-[12.5px] leading-[1.5] text-nevo-near-black/55">
                        {`After noticing: ${entry.trigger}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-[1.55] text-nevo-near-black/55 italic">
              {ADAPTATIONS_FOOTNOTE_MAIN}
              <span className="hidden xl:inline">
                {" "}
                {ADAPTATIONS_FOOTNOTE_DESKTOP_TAIL}
              </span>
            </p>
          </>
        )}

        {sessions.length > 0 && (
          <>
            <h3 className={cn(SECTION_H, "mt-8")}>Recent sessions</h3>
            <div className="mt-3.5 divide-y divide-nevo-near-black/7 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1">
              {sessions.slice(0, 8).map((l) => (
                <div key={l.lessonId} className="flex gap-[18px] px-[22px] py-4">
                  <span className="w-[70px] shrink-0 pt-0.5 text-[13.5px] text-nevo-near-black/55">
                    {new Date(l.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-nevo-near-black">
                      {l.title}
                    </span>
                    <span className="mt-[5px] block text-[14px] leading-[1.5] text-nevo-near-black/72">
                      {SESSION_NOTE[l.status] ?? l.status.replace(/_/g, " ")}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* C08's help-seeking line, per design (1 Sep): the activity section,
            below the engagement data, one plain line at the surrounding scale
            - not a card, not a badge.

            Deliberately OUTSIDE the sessions block: a child can have asked
            Nevo for help without a completed session in that list, and the
            line is about their help-seeking, not their sessions. Aggregate
            only, and absent entirely when the server withholds it. */}
        {state.helpSeeking && (
          <p className="mt-8 text-[14.5px] leading-[1.55] text-nevo-near-black/72">
            {state.helpSeeking}
          </p>
        )}

        <div className="mt-8">
          <Link
            href="/teacher/connect"
            className="inline-flex h-[50px] cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/35 px-[22px] text-[15px] font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
          >
            Send them a message
          </Link>
        </div>
      </div>
    </div>
  );
}
