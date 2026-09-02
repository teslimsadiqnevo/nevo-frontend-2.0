"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  schoolIntelligenceApi,
  type ComplianceAudit,
} from "@/lib/api/schoolIntelligence";
import { cn } from "@/lib/utils";
import { labelHero } from "../Compliance/ndpaClaims";
import { NARRATIVE_SAMPLE, WORTH_A_GLANCE } from "./overviewSample";

/**
 * D04 Overview Dashboard - the first thing a general-oversight admin sees,
 * built to answer "why are we paying for this" in ten seconds. Narrative-first,
 * with a light activity snapshot under it. Dense metrics live in Reports.
 *
 * WHAT IS REAL. `GET /api/admin/compliance-audit` carries the school name and
 * three genuine school-wide numbers - students profiled, adaptation events
 * logged, and diagnostic labels stored - so the compliance card and the
 * snapshot are not fixtures. The compliance card is the important one: the
 * whole NDPA claim is that Nevo holds no diagnostic label about any child, and
 * this is the number that proves it.
 *
 * WHAT IS NOT. The board-ready narrative has no endpoint behind it, and neither
 * does the "worth a glance" roll-up. Both render the frame's copy marked as a
 * sample rather than passing for this school's own position.
 *
 * The frame's other two snapshot stats - classes active, teachers active - have
 * no source at all, so they are absent rather than invented.
 *
 * The early state is chosen by a real signal: a school with nothing in the
 * adaptation log has not started teaching yet, and the frame's early copy is
 * simply true of it - so that variant is NOT marked as a sample.
 *
 * TODO(api): a narrative/summary endpoint, a roll-up of things needing a
 * decision, and class/teacher activity counts.
 * Both cards open their drill-down: the compliance card to D22, and the
 * adaptations figure to D21.
 */

const CARD = "rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

type Phase = "loading" | "ready" | "failed";

function SampleNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-[13px] leading-[1.5] text-nevo-near-black/55 italic">
      {children}
    </p>
  );
}

function todayLine(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function OverviewView() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [audit, setAudit] = useState<ComplianceAudit | null>(null);
  const [adaptationTotal, setAdaptationTotal] = useState<number | null>(null);

  const load = useCallback(() => {
    Promise.all([
      schoolIntelligenceApi.complianceAudit(),
      schoolIntelligenceApi.adaptationLog({ limit: 1 }).catch(() => null),
    ])
      .then(([a, log]) => {
        setAudit(a);
        setAdaptationTotal(log?.total ?? a.adaptationEventsLogged);
        setPhase("ready");
      })
      .catch(() => setPhase("failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setPhase("loading");
    load();
  };

  // A school with nothing in the adaptation log has not started teaching yet.
  const early = (adaptationTotal ?? 0) === 0;
  const school = audit?.schoolName ?? "your school";

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[860px]">
        <span className="text-[13px] text-nevo-near-black/55 xl:text-[13.5px]">
          {todayLine()}
        </span>
        <h2 className="mt-1 text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
          {phase === "ready" ? school : "Overview"}
        </h2>

        {phase === "loading" && (
          <div className={cn(CARD, "mt-6 h-[300px] animate-pulse")} />
        )}

        {phase === "failed" && (
          <div className={cn(CARD, "mt-6 px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load your school&rsquo;s overview
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has changed for your teachers or students. Try again in a
              moment.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-5 h-[46px] cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
            >
              Try again
            </button>
          </div>
        )}

        {phase === "ready" && audit && (
          <>
            {/* Narrative. Real only in the early case, where the frame's copy
                happens to be true of a school that has not started. */}
            <div className={cn(CARD, "mt-6 px-[26px] py-7")}>
              <h3 className="text-[19px] font-semibold text-nevo-near-black">
                {early
                  ? `Welcome to Nevo, ${school}`
                  : `What Nevo is doing for ${school}`}
              </h3>
              {early ? (
                <>
                  <p className="mt-1 text-[13.5px] text-nevo-near-black/55">
                    Your board summary begins once lessons do
                  </p>
                  <p className="mt-4 max-w-[68ch] text-[15px] leading-[1.7] text-nevo-near-black/78">
                    There&rsquo;s nothing to report on learning just yet
                    &ndash; exactly as expected this early. As your teachers
                    begin running lessons, this space fills with a
                    plain-language account of how your students are getting on,
                    written so you could read it aloud in a governors&rsquo;
                    meeting without changing a word.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-[13.5px] text-nevo-near-black/55">
                    This half-term
                  </p>
                  <p className="mt-4 max-w-[68ch] text-[15px] leading-[1.7] text-nevo-near-black/78">
                    {NARRATIVE_SAMPLE}
                  </p>
                  <SampleNote>
                    This summary is a sample. Nothing yet writes your
                    school&rsquo;s own board narrative, so none of the figures
                    above are {school}&rsquo;s.
                  </SampleNote>
                </>
              )}
            </div>

            {/* The compliance card is fully real, and is the point of the
                page. Its copy comes from `ndpaClaims.ts` because D22 states
                the same claim and the two used to word it independently -
                both asserting that nothing of the kind is held, above a live
                count that can come back non-zero. One source now, so they
                cannot drift apart again. */}
            <div className={cn(CARD, "mt-4 px-[26px] py-7")}>
              <div className="flex items-baseline gap-3">
                <span className="text-[38px] leading-none font-semibold text-nevo-navy">
                  {audit.diagnosticLabelsStored}
                </span>
                <span className="text-[15px] font-semibold text-nevo-near-black">
                  {labelHero(audit.diagnosticLabelsStored, "overview").unit}
                </span>
              </div>
              <p className="mt-3 max-w-[62ch] text-sm leading-[1.6] text-nevo-near-black/66">
                {labelHero(audit.diagnosticLabelsStored, "overview").body}
              </p>
              <p className="mt-3 text-[13px] text-nevo-near-black/50">
                {`Checked ${new Date(audit.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}
                {audit.findings.length > 0
                  ? ` · ${audit.findings.length} finding${audit.findings.length === 1 ? "" : "s"} to review`
                  : ""}
              </p>
              <Link
                href="/admin/compliance"
                className="mt-4 inline-block text-[13.5px] font-semibold text-nevo-navy hover:underline"
              >
                What we store &rarr;
              </Link>
            </div>

            <h3 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
              {early ? "Where things stand" : "Activity this half-term"}
            </h3>
            {/* Only the figures the audit actually returns. Classes active and
                teachers active have no source, so they are not here. */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={cn(CARD, "px-[22px] py-5")}>
                <span className="text-[30px] leading-none font-semibold text-nevo-near-black">
                  {audit.studentsProfiled}
                </span>
                <p className="mt-2 text-[14.5px] font-semibold text-nevo-near-black">
                  Students learning
                </p>
                <p className="mt-px text-[13px] text-nevo-near-black/58">
                  have a live learning profile
                </p>
              </div>
              <div className={cn(CARD, "px-[22px] py-5")}>
                <span className="text-[30px] leading-none font-semibold text-nevo-near-black">
                  {(adaptationTotal ?? audit.adaptationEventsLogged).toLocaleString("en-GB")}
                </span>
                <p className="mt-2 text-[14.5px] font-semibold text-nevo-near-black">
                  Adaptations made
                </p>
                <p className="mt-px text-[13px] text-nevo-near-black/58">
                  across all students so far
                </p>
                <Link
                  href="/admin/adaptations"
                  className="mt-3 inline-block text-[13.5px] font-semibold text-nevo-navy hover:underline"
                >
                  See the log &rarr;
                </Link>
              </div>
            </div>

            <h3 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
              Worth a glance
            </h3>
            <div className={cn(CARD, "mt-3 overflow-hidden")}>
              {WORTH_A_GLANCE.map((g, i) => (
                <Link
                  key={g.title}
                  href={g.href}
                  className={cn(
                    "flex items-center gap-4 px-[22px] py-[18px] transition-[filter] hover:brightness-[0.985]",
                    i < WORTH_A_GLANCE.length - 1 &&
                      "border-b border-nevo-near-black/7",
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] font-semibold text-nevo-near-black">
                      {g.title}
                    </span>
                    <span className="mt-0.5 text-[13px] text-nevo-near-black/58">
                      {g.sub}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13.5px] font-semibold text-nevo-navy">
                    {g.action} &rarr;
                  </span>
                </Link>
              ))}
            </div>
            <SampleNote>
              These three are a sample. Nothing yet rolls up what actually needs
              a decision at {school}, so the counts above are not yours &ndash;
              the links go to the real screens.
            </SampleNote>
          </>
        )}
      </div>
    </div>
  );
}
