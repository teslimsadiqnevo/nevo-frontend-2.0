"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { classesApi, type AdminClass } from "@/lib/api/classes";
import {
  studentsApi,
  type Accommodations,
  type AdminStudentDetail,
  type ConceptMasteryRow,
  type StudentAdaptation,
} from "@/lib/api/students";
import { yearGroupLabel } from "@/lib/constants/yearGroups";
import { cn } from "@/lib/utils";
import { Avatar, CARD, GHOST_BTN, PRIMARY_BTN, ROW_DIVIDER } from "../Roster/primitives";

/**
 * D8b Learner Profile - the SENCo's plain-language view of one learner.
 *
 * "Everything reads in human terms: no clinical labels, no confidence scores,
 * no raw signal talk." That sentence governs every decision on this screen,
 * and two of them are worth spelling out:
 *
 * 1. THE DUAL-TRACK MASTERY BARS CARRY NO NUMBERS. The comparison is the whole
 *    point of the section - understanding against the reading level the
 *    material demands, so that a gap points at the text rather than the
 *    concept - but a percentage beside a child's name is a confidence score,
 *    which this screen explicitly does not show. Two bars and a plain sentence
 *    say the same thing without inviting anyone to quote a figure at a parent.
 *
 * 2. ACCOMMODATIONS ARE A RECORD OF WHAT NEVO IS DOING, NOT A LABEL ABOUT THE
 *    CHILD. The frame is emphatic and the copy says so on screen. `source` and
 *    `persistedAsLabel` are typed and unrendered; a `true` on the latter would
 *    contradict what D22 Compliance promises school-wide, and would be a bug
 *    to report rather than a thing to display.
 *
 * Zero-Tag holds throughout: engine parameters are never rendered here, the
 * same as on every teacher surface.
 *
 * TODO(api): "Export Profile as PDF" has no endpoint - there is no PDF route
 * on any intelligence or student read - so the action is absent rather than a
 * button that fails. The IEP exporter is the supported way to get something
 * shareable out of this data, and this screen links to it.
 *
 * TODO(api): D8b's ENGAGEMENT PATTERNS section has no dedicated source. The
 * nearest is `frontendSignals` on the accommodations read, which is a list of
 * signal names rather than the titled observations the frame draws. It is
 * rendered as what it is - what Nevo has noticed - rather than dressed up as
 * something richer.
 */

type Phase = "loading" | "ready" | "failed";

/** Readable names for the accommodation and signal enums. */
function humanise(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

export function LearnerProfileView({ studentId }: { studentId: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [student, setStudent] = useState<AdminStudentDetail | null>(null);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodations | null>(null);
  const [mastery, setMastery] = useState<ConceptMasteryRow[]>([]);
  const [adaptations, setAdaptations] = useState<StudentAdaptation[]>([]);

  const load = useCallback(() => {
    Promise.all([studentsApi.get(studentId), classesApi.list(true)])
      .then(([s, c]) => {
        setStudent(s);
        setClasses(c);
        setPhase("ready");
        // Each section owns its own failure: a profile is still worth showing
        // when one of the three intelligence reads does not answer.
        studentsApi.accommodations(studentId).then(setAccommodations).catch(() => undefined);
        studentsApi.mastery(studentId).then(setMastery).catch(() => undefined);
        studentsApi.adaptations(studentId).then(setAdaptations).catch(() => undefined);
      })
      .catch(() => setPhase("failed"));
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (phase === "loading") {
    return (
      <Wrapper>
        <div className={cn(CARD, "h-[420px] animate-pulse")} />
      </Wrapper>
    );
  }

  if (phase === "failed" || !student) {
    return (
      <Wrapper>
        <div className={cn(CARD, "px-[26px] py-7")}>
          <h3 className="text-[17px] font-semibold text-nevo-near-black">
            We couldn&rsquo;t load this profile
          </h3>
          <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
            Nothing has changed - this is only about showing it to you. Try
            again in a moment.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setPhase("loading");
                load();
              }}
              className={PRIMARY_BTN}
            >
              Try again
            </button>
            <Link href="/admin/senco" className={GHOST_BTN}>
              Back to profiles
            </Link>
          </div>
        </div>
      </Wrapper>
    );
  }

  const name =
    [student.firstName, student.lastName].filter(Boolean).join(" ").trim() ||
    student.loginIdentifier ||
    "This learner";
  const firstName = student.firstName ?? name.split(" ")[0];
  const cls = classes.find((c) => student.classIds.includes(c.id));
  const active = accommodations?.activeAccommodations ?? [];
  const signals = accommodations?.frontendSignals ?? [];

  return (
    <Wrapper>
      <Link
        href="/admin/senco"
        className="text-[13.5px] font-semibold text-nevo-navy hover:opacity-75"
      >
        &larr; Back to profiles
      </Link>

      <div className="mt-3 flex items-center gap-4">
        <Avatar name={name} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[26px] font-semibold tracking-[-0.018em] text-nevo-near-black">
            {name}
          </h2>
          <div className="mt-[3px] truncate text-[14.5px] text-nevo-near-black/62">
            {cls ? [cls.name, yearGroupLabel(cls.yearGroup)].filter(Boolean).join(" · ") : "No class"}
          </div>
        </div>
      </div>

      <SectionLabel>Current accommodations</SectionLabel>
      <div className={cn(CARD, "mt-2.5 px-6 py-[22px]")}>
        {active.length === 0 ? (
          <p className="m-0 text-sm text-nevo-near-black/62">
            Nevo isn&rsquo;t adjusting anything for {firstName} at the moment.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {active.map((a) => (
              <li
                key={a}
                className="rounded-full bg-nevo-navy/12 px-3.5 py-1.5 text-[13.5px] font-semibold text-nevo-navy"
              >
                {humanise(a)}
              </li>
            ))}
          </ul>
        )}
        <p className="m-0 mt-4 border-t border-nevo-near-black/8 pt-3.5 text-[13px] leading-[1.55] text-nevo-near-black/60">
          What Nevo is currently doing for this learner. This is the
          accommodation record for the IEP, not a learning-style label.
        </p>
      </div>

      <SectionLabel>What Nevo has noticed</SectionLabel>
      <div className={cn(CARD, "mt-2.5 px-6 py-[22px]")}>
        {signals.length === 0 ? (
          <p className="m-0 text-sm text-nevo-near-black/62">
            Nothing consistent enough to describe yet. This fills in as{" "}
            {firstName} works through more lessons.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {signals.map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-sm leading-[1.55] text-nevo-near-black/78">
                <span
                  aria-hidden="true"
                  className="mt-[7px] size-[6px] flex-none rounded-full bg-nevo-violet"
                />
                {humanise(s)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <SectionLabel>Concept mastery · dual-track</SectionLabel>
      <div className={cn(CARD, "mt-2.5")}>
        <p className="m-0 px-6 pb-4 pt-[22px] text-[13px] leading-[1.6] text-nevo-near-black/60">
          Two tracks per concept: how well {firstName} understands it, and the
          reading level the material demands. When the two part company, the
          barrier is the text, not the concept - the distinction this profile
          exists to draw.
        </p>
        {mastery.length === 0 ? (
          <p className="m-0 border-t border-nevo-near-black/8 px-6 py-6 text-sm text-nevo-near-black/62">
            No concepts have enough practice behind them yet.
          </p>
        ) : (
          mastery.slice(0, 10).map((row, i) => {
            // Bars, never numbers - see the note at the top of this file.
            const concept = Math.max(0, Math.min(1, row.masteryProbabilityConcept));
            const reading = Math.max(0, Math.min(1, row.masteryProbabilityReading));
            const gap = concept - reading;
            const textIsTheBarrier = gap > 0.15;
            return (
              <div
                key={row.conceptId}
                className={cn("px-6 py-4", i < Math.min(mastery.length, 10) - 1 && ROW_DIVIDER)}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14.5px] font-semibold text-nevo-near-black">
                    {row.conceptName}
                  </span>
                  {textIsTheBarrier ? (
                    <span className="flex-none text-[12.5px] font-semibold text-nevo-navy">
                      Reading is the barrier here
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <Track label="Understands the idea" value={concept} tone="navy" />
                  <Track label="Handles the reading" value={reading} tone="violet" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <SectionLabel>Recent adaptations</SectionLabel>
      <div className={cn(CARD, "mt-2.5")}>
        {adaptations.length === 0 ? (
          <p className="m-0 px-6 py-6 text-sm text-nevo-near-black/62">
            Nevo hasn&rsquo;t needed to adjust a lesson for {firstName} yet.
          </p>
        ) : (
          adaptations.slice(0, 8).map((a, i) => (
            <div
              key={a.id}
              className={cn(
                "px-6 py-4",
                i < Math.min(adaptations.length, 8) - 1 && ROW_DIVIDER,
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14.5px] font-semibold text-nevo-near-black">
                  {a.lessonTitle}
                </span>
                <span className="flex-none text-xs text-nevo-near-black/50">
                  {new Date(a.timestamp).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <p className="m-0 mt-1.5 text-sm leading-[1.55] text-nevo-near-black/78">
                {a.adaptation}
              </p>
              {/* A withheld adaptation is as much a part of the record as an
                  applied one - the IEP should show what Nevo considered. */}
              {a.suppressed ? (
                <p className="m-0 mt-1 text-[12.5px] text-nevo-near-black/55">
                  Considered and held back this time.
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="mt-8 border-t border-nevo-near-black/10 pt-5">
        <Link href="/admin/senco/export" className={PRIMARY_BTN}>
          Create a progress report
        </Link>
        <p className="mt-2 max-w-[52ch] text-[13px] leading-[1.5] text-nevo-near-black/55">
          A progress report turns this into plain prose you can review and share
          with {firstName}&rsquo;s guardian.
        </p>
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[780px]">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-0 mt-7 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-nevo-near-black/45">
      {children}
    </h3>
  );
}

/**
 * One track of the dual-track bar. No number, by design - the label says what
 * it is and the length says how far along, which is all a SENCo needs to see
 * the two diverge.
 */
function Track({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "navy" | "violet";
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[150px] flex-none text-[12.5px] text-nevo-near-black/62">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="h-2 flex-1 overflow-hidden rounded-full bg-nevo-near-black/[0.08]"
      >
        <span
          className={cn(
            "block h-full rounded-full",
            tone === "navy" ? "bg-nevo-navy" : "bg-nevo-violet",
          )}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
    </div>
  );
}
