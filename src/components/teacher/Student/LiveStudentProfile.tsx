"use client";

import Link from "next/link";
import type { StudentProfileState } from "@/hooks/useStudentProfile";
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
 * WHAT IS DELIBERATELY NOT SHOWN. The learner profile carries
 * `workingMemoryCapacity` and `attentionSpan`. They are engine parameters,
 * and putting a number against a child's working memory is exactly the
 * clinical framing C08 forbids - "the page has to hold up if a parent or the
 * SENCo reads it" - and sits badly beside the compliance screen's claim that
 * Nevo holds no diagnostic label about anyone. They are fetched, typed, and
 * left off the page pending a product decision.
 *
 * ALSO ABSENT, for want of an endpoint: the "what Nevo has seen" evidence
 * list, recent sessions, the noticing banner, and the confidence dimensions.
 * The early state is real: `status: not_observed_yet` is precisely the
 * student the frame's calm early profile was drawn for.
 */

const SECTION_H =
  "text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase xl:text-sm";

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
  const { profile, concepts, recommendations, observed } = state;
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
