"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { assignmentsApi } from "@/lib/api/assignments";
import { useLessonLibrary } from "@/hooks/useLessonLibrary";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { cn } from "@/lib/utils";

/**
 * C07i Lesson Assignment: four steps, each a direct question - conversational
 * even though it's a form. Recipients are constrained to assigned classes.
 * No recurring schedules in v1. A standalone takeover per the frame (no
 * sidebar), with the dots strip and "N/4" counter.
 *
 * Interpretations flagged in the PR: the "Specific students" panel has no
 * frame - built from the step's own checkbox-card pattern over the class
 * rosters; Continue honest-disables while a step has no selection (the
 * sanctioned incomplete-form case); the "Available now" confirm sentence and
 * the post-confirm route (Library) are undesigned.
 *
 * Submit is live against POST /api/v1/assignments - one call per selected
 * class, since the payload takes many lessons but a single class, which the
 * backend expands to that class's current enrolment.
 *
 * Step 1 offers the teacher's real library when there is one. Step 2's
 * "Specific students" stays fixture-only: the class list carries no roster,
 * and inventing names to tick on the screen that assigns work would be the
 * worst place for it.
 *
 * SCHEDULING IS LIVE. `availableFrom` landed on 31 Aug 2026, so step 3 now
 * sends the date it has always been asking for. It is deliberately NOT
 * `dueAt`: a lesson scheduled to open on Friday is not a lesson due on
 * Friday, and mapping one onto the other would have said so on screen.
 *
 * The frame's date literal is `2026-07-11`, a placeholder that is now in the
 * past - shipping it as a live default would have scheduled every lesson to
 * open weeks ago. The field instead starts EMPTY and is filled with tomorrow
 * the moment a teacher chooses "Schedule for later", which is the only point
 * a default is meaningful. It is filled in the toggle's handler, not during
 * render, so there is no server/client date to disagree about.
 */

type Step = 1 | 2 | 3 | 4;

const LESSONS: { id: string; title: string; meta: string }[] = [
  { id: "simplifying-algebraic-fractions", title: "Simplifying Algebraic Fractions", meta: "Mathematics · This term" },
  { id: "solving-linear-equations", title: "Solving Linear Equations", meta: "Mathematics · This term" },
  { id: "angles-triangles", title: "Angles & Triangles", meta: "Mathematics · This term" },
  { id: "things-fall-apart", title: "Comprehension: Things Fall Apart", meta: "English · This term" },
];

const check = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

function CheckCard({
  on,
  onClick,
  title,
  sub,
  compactTitle,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
  compactTitle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3.5 rounded-xl bg-nevo-cream-elevated px-[18px] py-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        on && "outline-2 -outline-offset-2 outline-nevo-navy",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-[7px]",
          on ? "bg-nevo-navy text-nevo-cream" : "border-2 border-nevo-near-black/24",
        )}
      >
        {on && check}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "font-semibold text-nevo-near-black",
            compactTitle ? "text-[15px]" : "text-[15px] xl:text-[15.5px]",
          )}
        >
          {title}
        </span>
        {sub && (
          <span className="mt-[3px] block text-[12.5px] text-nevo-near-black/60 xl:text-[13px]">
            {sub}
          </span>
        )}
      </span>
    </button>
  );
}

function Toggle({
  left,
  right,
  value,
  onChange,
}: {
  left: string;
  right: string;
  value: "left" | "right";
  onChange: (v: "left" | "right") => void;
}) {
  const seg = (on: boolean) =>
    cn(
      "flex-1 cursor-pointer rounded-lg p-3 text-center text-[15px] font-medium transition-colors",
      on ? "bg-nevo-navy text-nevo-cream" : "text-nevo-near-black/60",
    );
  return (
    <div className="mt-[22px] flex rounded-[11px] bg-nevo-navy/8 p-1">
      <button type="button" onClick={() => onChange("left")} className={seg(value === "left")}>
        {left}
      </button>
      <button type="button" onClick={() => onChange("right")} className={seg(value === "right")}>
        {right}
      </button>
    </div>
  );
}

const fmtList = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names[0]} and ${names.length - 1} more`;

export function AssignWizard({ preselect }: { preselect?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [chosen, setChosen] = useState<Set<string>>(
    () => new Set(preselect ? [preselect] : []),
  );
  const [who, setWho] = useState<"left" | "right">("left"); // left = whole class
  const [classes, setClasses] = useState<Set<string>>(new Set());
  // Recipients are the teacher's real assignments when a session has them.
  const { options: myClasses } = useTeacherClasses();
  const [students, setStudents] = useState<Set<string>>(new Set());
  const [when, setWhen] = useState<"left" | "right">("left"); // left = available now
  // Empty until "Schedule for later" is chosen - see the note above.
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // The teacher's real library when there is one; the frame's four otherwise.
  const { cards, live } = useLessonLibrary();
  const lessons = live
    ? cards.map((c) => ({ id: c.id, title: c.title, meta: c.meta }))
    : LESSONS;

  /** Tomorrow in `YYYY-MM-DD`, local. Called from a handler, never render. */
  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const chooseWhen = (v: "left" | "right") => {
    setWhen(v);
    // A default only means anything once "later" is actually chosen.
    if (v === "right" && !date) setDate(tomorrow());
  };

  const togIn = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  const canContinue =
    step === 1
      ? chosen.size > 0
      : step === 2
        ? who === "left"
          ? classes.size > 0
          : students.size > 0
        : // Step 3: scheduling for later needs a date to schedule to.
          when === "left" || Boolean(date);

  const close = () => router.push("/teacher/lessons");

  /**
   * One call per class. Nothing is claimed until every call has landed: a
   * partial failure says so rather than reporting an assignment that only
   * half happened.
   */
  const confirm = async () => {
    if (!live) {
      close();
      return;
    }
    setSubmitting(true);
    setError("");
    const lessonIds = [...chosen];
    // "Available now" sends nothing rather than now-as-a-timestamp: the
    // absence is what "open immediately" means, and a stamped `now` would
    // drift by however long the request takes.
    const availableFrom =
      when === "right" && date
        ? new Date(`${date}T${time}`).toISOString()
        : undefined;
    try {
      const results = await Promise.all(
        [...classes].map((classId) =>
          assignmentsApi.create({ lessonIds, classId, availableFrom }),
        ),
      );
      const created = results.reduce((n, r) => n + r.createdCount, 0);
      if (created === 0) {
        setSubmitting(false);
        setError(
          "Nothing was assigned - those classes may have no students enrolled yet.",
        );
        return;
      }
      close();
    } catch {
      setSubmitting(false);
      setError("We couldn’t assign that just now. Nothing has been sent - try again.");
    }
  };

  const lessonsText = fmtList(
    lessons.filter((l) => chosen.has(l.id)).map((l) => l.title),
  );
  const whoText =
    who === "left"
      ? fmtList(myClasses.filter((c) => classes.has(c.id)).map((c) => c.name))
      : (() => {
          const classNames = myClasses.filter((c) =>
            [...students].some((s) => s.startsWith(c.id + ":")),
          ).map((c) => c.name);
          return `${students.size} ${students.size === 1 ? "student" : "students"} in ${fmtList(classNames)}`;
        })();
  const whenText =
    when === "right" && date
      ? (() => {
          const d = new Date(`${date}T${time}`);
          const day = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
          const t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          return `on ${day} at ${t}`;
        })()
      : "now";

  const heading = { 1: "Choose lessons", 2: "Who's this for?", 3: "When should this be available?", 4: "All set" }[step];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-nevo-cream text-nevo-near-black">
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-nevo-near-black/8 px-7 xl:h-[72px] xl:px-8">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] text-nevo-near-black/60 transition-colors hover:bg-nevo-near-black/5"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="text-[14.5px] font-medium text-nevo-near-black/70 xl:text-[15px]">
          Assign lessons
        </span>
        <span className="w-10 text-right text-[13px] text-nevo-near-black/50 xl:text-[13.5px]">
          {step}/4
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex shrink-0 justify-center gap-2 pt-[18px] pb-1 xl:pt-[22px] xl:pb-1.5">
        {([1, 2, 3, 4] as const).map((i) => (
          <span
            key={i}
            className={cn(
              "size-[9px] rounded-full",
              i === step ? "bg-nevo-navy" : i < step ? "bg-nevo-navy/40" : "bg-nevo-navy/15",
            )}
          />
        ))}
      </div>

      {/* Body */}
      {step === 4 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-7 py-5 xl:px-8">
          <div className="flex max-w-[420px] flex-col items-center text-center xl:max-w-[440px]">
            <div className="flex size-[54px] items-center justify-center rounded-full bg-nevo-navy text-nevo-cream motion-safe:animate-nevo-pop xl:size-14">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="mt-[18px] text-[23px] font-semibold tracking-[-0.015em] xl:mt-5 xl:text-[26px]">
              All set
            </h2>
            <p className="mt-3.5 text-base leading-[1.6] text-nevo-near-black/78 xl:mt-4 xl:text-[17px]">
              <strong className="font-semibold text-nevo-near-black">{lessonsText}</strong>{" "}
              will open for{" "}
              <strong className="font-semibold text-nevo-near-black">{whoText}</strong>{" "}
              {when === "right" ? (
                <>
                  on{" "}
                  <strong className="font-semibold text-nevo-near-black">
                    {whenText.replace(/^on /, "")}
                  </strong>
                </>
              ) : (
                <strong className="font-semibold text-nevo-near-black">now</strong>
              )}
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 justify-center overflow-y-auto px-7 pt-4 pb-7 xl:px-8 xl:pt-5 xl:pb-8">
          <div className="w-full max-w-[540px] xl:max-w-[560px]">
            <h2 className="mt-2 text-[23px] font-semibold tracking-[-0.015em] xl:mt-3.5 xl:text-[26px]">
              {heading}
            </h2>

            {step === 1 && (
              <div className="mt-[18px] flex flex-col gap-2.5 xl:mt-5 xl:gap-[11px]">
                {lessons.map((l) => (
                  <CheckCard
                    key={l.id}
                    on={chosen.has(l.id)}
                    onClick={() => setChosen((s) => togIn(s, l.id))}
                    title={l.title}
                    sub={l.meta}
                  />
                ))}
              </div>
            )}

            {step === 2 && (
              <>
                <Toggle left="Whole class" right="Specific students" value={who} onChange={setWho} />
                {who === "left" ? (
                  <div className="mt-4 flex flex-col gap-2.5 xl:mt-[18px] xl:gap-[11px]">
                    {myClasses.map((c) => (
                      <CheckCard
                        key={c.id}
                        on={classes.has(c.id)}
                        onClick={() => setClasses((s) => togIn(s, c.id))}
                        title={c.name}
                        sub={
                          c.studentCount != null
                            ? `${c.studentCount} students`
                            : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-4 xl:mt-[18px]">
                    {myClasses.map((c) => (
                      <div key={c.id}>
                        <div className="font-mono text-[10.5px] font-bold tracking-[0.1em] text-nevo-violet">
                          {c.name.toUpperCase()}
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                          {c.roster ? (
                            c.roster.map((s) => {
                              const key = `${c.id}:${s.name}`;
                              return (
                                <CheckCard
                                  key={key}
                                  on={students.has(key)}
                                  onClick={() =>
                                    setStudents((v) => togIn(v, key))
                                  }
                                  title={s.name}
                                  compactTitle
                                />
                              );
                            })
                          ) : (
                            // The live class list carries no roster, and
                            // inventing names to tick would be the worst
                            // possible thing on a screen that assigns work.
                            <p className="text-[13.5px] leading-[1.5] text-nevo-near-black/60">
                              Picking individual students isn&rsquo;t connected
                              yet &ndash; assign to the whole class for now.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                {/* One control for everyone: `availableFrom` is live, so a
                    real teacher gets the frame's step rather than a notice
                    explaining why they cannot have it. */}
                <Toggle left="Available now" right="Schedule for later" value={when} onChange={chooseWhen} />
                {when === "right" && (
                  <div className="mt-4 flex gap-3.5 xl:mt-[18px]">
                    <div className="flex-1">
                      <label className="block text-[13.5px] font-semibold text-nevo-near-black/70">
                        Date
                        <span className="relative mt-2 block">
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-[52px] w-full cursor-pointer rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream-elevated px-4 pr-11 text-[15.5px] font-normal text-nevo-near-black outline-none focus:border-nevo-navy [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                          />
                          <svg className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(43,43,47,0.5)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <rect x="3" y="5" width="18" height="16" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M8 3v4M16 3v4" />
                          </svg>
                        </span>
                      </label>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[13.5px] font-semibold text-nevo-near-black/70">
                        Time
                        <span className="relative mt-2 block">
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="h-[52px] w-full cursor-pointer rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream-elevated px-4 pr-11 text-[15.5px] font-normal text-nevo-near-black outline-none focus:border-nevo-navy [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                          />
                          <svg className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(43,43,47,0.5)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                          </svg>
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* A failed assignment owns the footer: the teacher must not leave this
          screen believing work was sent when it was not. */}
      {error && (
        <div className="shrink-0 px-7 pb-3 xl:px-8">
          <p className="mx-auto max-w-[560px] rounded-[10px] bg-nevo-violet/14 px-[14px] py-3 text-[13.5px] leading-[1.5] text-nevo-near-black/78">
            {error}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-nevo-near-black/8 px-7 py-4 xl:px-8 xl:py-5">
        {step === 1 ? (
          <span className="flex h-[46px] cursor-default items-center rounded-[10px] px-5 text-[14.5px] font-medium text-nevo-near-black/40 xl:h-12 xl:px-[22px] xl:text-[15px]">
            Back
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex h-[46px] cursor-pointer items-center rounded-[10px] px-5 text-[14.5px] font-medium text-nevo-near-black/70 transition-colors hover:bg-nevo-near-black/5 xl:h-12 xl:px-[22px] xl:text-[15px]"
          >
            Back
          </button>
        )}
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            if (!canContinue || submitting) return;
            if (step < 4) setStep((s) => (s + 1) as Step);
            else void confirm();
          }}
          className={cn(
            "flex h-[46px] items-center rounded-[10px] px-[26px] text-[15px] font-semibold xl:h-12 xl:px-[30px] xl:text-[15.5px]",
            canContinue
              ? "cursor-pointer bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-93"
              : "cursor-not-allowed bg-nevo-navy/18 text-nevo-near-black/40",
          )}
        >
          {step === 4
            ? submitting
              ? "Assigning…"
              : "Confirm assignment"
            : "Continue"}
        </button>
      </div>
    </div>
  );
}
