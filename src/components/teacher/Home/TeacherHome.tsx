"use client";

import Link from "next/link";
import { MOCK_TEACHER } from "@/components/teacher/Shell/teacherNav";
import { useHasSession } from "@/hooks/useHasSession";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import {
  GOOD_TO_KNOW,
  HOME_ACTIVITY,
  HOME_FLAGS,
} from "@/lib/mocks/teacherHome";
import { cn } from "@/lib/utils";
import { ClassPulse } from "./ClassPulse";
import { HomeClasses } from "./HomeClasses";
import { FlagCard } from "./FlagCard";

/**
 * Teacher Home (C03 / `Nevo Teacher Home` frame) - the 10-second scan: date +
 * greeting, "Worth your attention" flags (or the calm no-flags card), one
 * good-to-know note, the class trio, recent activity, and the Ask Nevo drawer.
 * Content column caps at 1040px centred, inner 940px.
 *
 * Everything below the greeting - the pulse, the flags, the class trio, the
 * activity list - is fixture content: no intelligence endpoint exists. So the
 * page reads the live class list to decide what it is honestly allowed to say:
 *
 *   - a real teacher with no classes gets the greeting and a line saying so,
 *     and the sections simply are not there. C14 draws no Home empty state, so
 *     rather than invent one this follows its stated principle for the quiet
 *     Insights week: "it isn't drawn as empty, the section simply isn't there".
 *   - a real teacher with classes still gets fixture activity, so it is marked
 *     as a sample rather than passed off as their week.
 *   - the greeting uses the teacher's real name, from `GET /api/v1/users/me`,
 *     and falls back to a nameless welcome rather than the fixture persona.
 *
 * TODO(api): flags/classes/activity come from the intelligence layer; the C03
 * loading skeleton ships when that fetch exists.
 */

const SECTION_H =
  "text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase xl:text-sm";

function todayLine(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function TeacherHome() {
  const { classes, liveClasses, live, sample } = useTeacherClasses();
  // Live and genuinely empty - not merely "the fixtures did not match".
  const noClasses = live && classes.length === 0 && liveClasses.length === 0;
  // A teacher whose classes failed to load is still not the fixture persona.
  const signedIn = useHasSession();
  // Null while it loads, and if the profile call fails - both greet without a
  // name rather than borrowing one.
  const identity = useCurrentUser();
  const greetName = signedIn ? identity?.name : MOCK_TEACHER.name;
  const flags = noClasses ? [] : HOME_FLAGS;
  const hasFlags = flags.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[940px]">
        <span className="text-[13px] text-nevo-near-black/55 xl:text-[13.5px]">
          {todayLine()}
        </span>
        <h2 className="mt-1 text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
          {greetName ? `Welcome back, ${greetName}` : "Welcome back"}
        </h2>
        {hasFlags && (
          <p className="mt-2 hidden text-[15.5px] leading-[1.55] text-nevo-near-black/60 xl:block">
            Three things are worth your eye before first period. Everything else
            is running smoothly.
          </p>
        )}

        {noClasses ? (
          <p className="mt-2.5 max-w-[560px] text-[15.5px] leading-[1.55] text-nevo-near-black/62">
            You don&rsquo;t have any classes yet. When your school adds you to
            one, your students&rsquo; week will show up here.
          </p>
        ) : (
          (live || sample) && (
            <p className="mt-2 max-w-[560px] text-[13px] leading-[1.5] text-nevo-near-black/55 italic">
              We can&rsquo;t read your class activity yet, so everything below
              is a sample.
            </p>
          )
        )}

        {/* C16a: the pulse leads - class weather first, specifics below. */}
        {!noClasses && <ClassPulse />}

        {/* All of this is class-derived. With no classes there is nothing
            truthful to put here - including the calm no-flags card, which
            would claim everyone is moving along. */}
        {!noClasses && (
          <>
            {hasFlags ? (
              <>
                <div className="mt-[26px] flex items-center gap-2.5 xl:mt-8">
                  <h3 className={SECTION_H}>Worth your attention</h3>
                  <span className="rounded-full bg-nevo-near-black/10 px-2 py-0.5 text-[12px] text-nevo-near-black/70 xl:px-[9px] xl:text-[12.5px]">
                    {flags.length}
                  </span>
                </div>
                <div className="mt-3.5 flex flex-col gap-3 xl:mt-4 xl:gap-3.5">
                  {flags.map((flag) => (
                    <FlagCard key={flag.id} flag={flag} />
                  ))}
                </div>

                {/* Good to know - a quiet win, never a flag */}
                <div className="mt-[22px] flex max-w-[660px] items-start gap-3 rounded-[12px] bg-nevo-violet/14 px-[18px] py-4">
                  <span className="mt-px shrink-0 text-nevo-navy">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M12 3a5 5 0 0 0-3 9c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a5 5 0 0 0-3-9z" />
                      <path d="M10 20h4" />
                    </svg>
                  </span>
                  <p className="text-[14.5px] leading-[1.55] text-nevo-near-black/78">
                    <strong className="font-semibold text-nevo-near-black">
                      Good to know:
                    </strong>{" "}
                    {GOOD_TO_KNOW}
                  </p>
                </div>
              </>
            ) : (
              // Calm morning - nothing flagged (C03 no-flags state)
              <div className="mt-[26px] flex max-w-[660px] items-center gap-4 rounded-[12px] bg-nevo-cream-elevated px-[26px] py-6 shadow-elevation-1">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-nevo-violet/24 text-nevo-navy">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-[16px] font-semibold text-nevo-near-black xl:text-[17px]">
                    Nothing needs you right now
                  </h3>
                  <p className="mt-[5px] text-sm leading-[1.5] text-nevo-near-black/66 xl:text-[14.5px]">
                    Everyone&rsquo;s moving along at their own pace. We&rsquo;ll
                    let you know the moment something&rsquo;s worth a look.
                  </p>
                </div>
              </div>
            )}

            <h3 className={cn(SECTION_H, "mt-[30px] xl:mt-10")}>My classes</h3>
            <HomeClasses />

            <h3 className={cn(SECTION_H, "mt-[30px] xl:mt-9")}>
              Recent activity
            </h3>
            <div className="mt-3.5 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1 xl:mt-4">
              {HOME_ACTIVITY.map((a, i) => (
                <Link
                  key={a.lesson}
                  href={a.href}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-4 px-[22px] py-4 transition-[filter] hover:brightness-[0.985]",
                    i < HOME_ACTIVITY.length - 1 &&
                      "border-b border-nevo-near-black/7",
                  )}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-[15.5px] font-semibold text-nevo-near-black">
                      {a.lesson}
                    </span>
                    <span className="mt-[3px] text-[13px] text-nevo-near-black/55">
                      {a.klass} · {a.when}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3.5">
                    <div className="h-1.5 w-[130px] overflow-hidden rounded-full bg-nevo-navy/14">
                      <span
                        className="block h-full rounded-full bg-nevo-navy"
                        style={{
                          width: `${Math.round((a.done / a.total) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-[120px] text-right text-sm text-nevo-near-black/68">
                      {a.done} of {a.total} done
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
