"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  analyticsApi,
  type OutcomePeriod,
  type SchoolConceptMastery,
  type SchoolHealth,
  type TransformationMetrics,
} from "@/lib/api/analytics";
import { cn } from "@/lib/utils";
import { CARD, PRIMARY_BTN } from "../Roster/primitives";
import { DualTrackBars, TrendLine, type DualTrackRow, type TrendPoint } from "./charts";

/**
 * D20 Cohort Analytics (SCRUM-65) - the proprietor's proof that Nevo is
 * working.
 *
 * ============================================================================
 * THE SCREEN'S HEADLINE METRIC DOES NOT EXIST, so this is not the screen D20
 * draws. That needs saying plainly rather than being discovered later.
 *
 * D20 and D15b are built on FOUR TRANSFORMATION INDICES:
 *     Self-Regulation Index · Metacognitive Calibration ·
 *     Conceptual Flexibility · Active Learning Efficiency
 * with the growth chart being "Self-Regulation Index, cohort average, week by
 * week" and the headline reading "+8 points since April".
 *
 * None of the four exists anywhere in the API. `GET /api/transformation-metrics`
 * returns VOLUMES - lessons transformed, transformation runs, sessions,
 * adaptations applied and per session - which is how much adapting happened,
 * not how a cohort is growing. There is no index, no month-over-month trend on
 * one, and nothing to put on a week-by-week axis.
 *
 * Inventing an index from the counters would be the worst option available: a
 * proprietor would read a number called Self-Regulation, quote it to a parent
 * or an investor, and it would mean nothing. So the four cards are ABSENT, and
 * what ships is what the school's data genuinely supports:
 *
 *   - participation and completion, as counts and as a trend
 *   - how much Nevo is adapting, labelled as volume
 *   - dual-track mastery across every concept, which is the one genuinely
 *     diagnostic thing here: where understanding runs ahead of reading, the
 *     barrier is the text
 *
 * Building the four indices needs backend to define and compute them. That is
 * the ask, and it is a product question before it is an engineering one.
 * ============================================================================
 *
 * TODO(api): D20's headline section, "Same objective · different journeys" -
 * three anonymised learners on one objective showing genuinely different
 * content sequences - is not built. It needs adaptation sequences keyed to a
 * shared objective, and adaptations carry a lesson, not a concept, so three
 * learners cannot be shown to have taken different routes through the SAME
 * objective. The join does not exist. This is the ticket's stated headline, so
 * it is the second ask after the indices.
 *
 * TODO(api): D9 Reports - the report list with PDF/CSV export - shares this
 * route and has no endpoint at all. Still blocked.
 *
 * AGGREGATE ONLY. Nothing on this screen names a student or can be narrowed to
 * one. That boundary is what keeps cohort analytics inside admin scope.
 */

type Phase = "loading" | "ready" | "failed";

/** Enough of a picture to be worth drawing a trend through. */
const MIN_PERIODS = 3;

function formatPeriod(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ReportsView() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [health, setHealth] = useState<SchoolHealth | null>(null);
  const [outcomes, setOutcomes] = useState<OutcomePeriod[]>([]);
  const [mastery, setMastery] = useState<SchoolConceptMastery[]>([]);
  const [transformation, setTransformation] = useState<TransformationMetrics | null>(null);

  const load = useCallback(() => {
    // School health answers first because it carries the schoolId the other
    // two reads need.
    analyticsApi
      .getSchoolHealth()
      .then((h) => {
        setHealth(h);
        setPhase("ready");
        analyticsApi
          .getOutcomes({ schoolId: h.schoolId })
          .then((o) => setOutcomes(o.outcomes))
          .catch(() => undefined);
        analyticsApi
          .getSchoolMastery(h.schoolId)
          .then(setMastery)
          .catch(() => undefined);
        analyticsApi
          .getTransformationMetrics()
          .then(setTransformation)
          .catch(() => undefined);
      })
      .catch(() => setPhase("failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () => [...outcomes].sort((a, b) => a.period.localeCompare(b.period)),
    [outcomes],
  );

  const completionPoints: TrendPoint[] = useMemo(
    () =>
      sorted.map((p) => ({
        label: formatPeriod(p.period),
        value: p.completionRate,
        display: `${Math.round(p.completionRate * 100)}%`,
      })),
    [sorted],
  );

  const adaptationPoints: TrendPoint[] = useMemo(
    () =>
      sorted.map((p) => ({
        label: formatPeriod(p.period),
        value: p.averageAdaptations,
        display: p.averageAdaptations.toFixed(1),
      })),
    [sorted],
  );

  const masteryRows: DualTrackRow[] = useMemo(
    () =>
      [...mastery]
        // Widest gap first: where the text is most in the way.
        .sort(
          (a, b) =>
            b.masteryProbabilityConcept -
            b.masteryProbabilityReading -
            (a.masteryProbabilityConcept - a.masteryProbabilityReading),
        )
        .slice(0, 8)
        .map((m) => ({
          key: m.conceptId,
          label: m.conceptName ?? "Unnamed concept",
          concept: m.masteryProbabilityConcept,
          reading: m.masteryProbabilityReading,
          meta: `${m.studentCount} ${m.studentCount === 1 ? "learner" : "learners"}`,
        })),
    [mastery],
  );

  const enoughForTrend = sorted.length >= MIN_PERIODS;

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[880px]">
        <h2 className="m-0 text-[28px] font-semibold tracking-[-0.018em] text-nevo-near-black">
          Cohort analytics
        </h2>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-[1.6] text-nevo-near-black/62">
          How your school is using Nevo, and where the material is getting in
          the way. Everything here is school-wide - no individual learner
          appears on this screen.
        </p>

        {phase === "loading" ? (
          <div className={cn(CARD, "mt-7 h-[360px] animate-pulse")} />
        ) : null}

        {phase === "failed" ? (
          <div className={cn(CARD, "mt-7 px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load your analytics
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has changed - this is only about showing them to you. Try
              again in a moment.
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

        {phase === "ready" && health ? (
          <>
            {/* Stat tiles: label, value, no delta - there is no prior period
                on this route to compare against. */}
            <div className="mt-7 grid grid-cols-4 gap-3.5 max-lg:grid-cols-2">
              <Stat label="Students" value={health.studentCount.toLocaleString()} />
              <Stat
                label="Active this month"
                value={health.activeStudentsLast30Days.toLocaleString()}
              />
              <Stat
                label="Lessons completed"
                value={health.completedLessonSessions.toLocaleString()}
              />
              <Stat
                label="Taking part"
                value={`${Math.round(health.participationRate * 100)}%`}
              />
            </div>

            {enoughForTrend ? (
              <>
                <div className={cn(CARD, "mt-6 px-6 py-[26px]")}>
                  <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
                    Lessons finished
                  </h3>
                  <p className="m-0 mt-1 text-[13px] text-nevo-near-black/58">
                    The share of started lessons that got finished, period by
                    period.
                  </p>
                  <div className="mt-5">
                    <TrendLine
                      points={completionPoints}
                      max={1}
                      ariaLabel="Completion rate over time"
                    />
                  </div>
                </div>

                {/* A second chart, never a second axis on the first. */}
                <div className={cn(CARD, "mt-5 px-6 py-[26px]")}>
                  <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
                    How often Nevo adapted
                  </h3>
                  <p className="m-0 mt-1 text-[13px] text-nevo-near-black/58">
                    Average adaptations per session. This is a volume, not a
                    score - more is not automatically better.
                  </p>
                  <div className="mt-5">
                    <TrendLine
                      points={adaptationPoints}
                      max={Math.max(1, ...adaptationPoints.map((p) => p.value)) * 1.15}
                      ariaLabel="Average adaptations per session over time"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className={cn(CARD, "mt-6 px-6 py-12 text-center")}>
                <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
                  Still gathering this cohort&rsquo;s picture
                </h3>
                <p className="mx-auto mt-2 max-w-[48ch] text-sm leading-[1.6] text-nevo-near-black/62">
                  There aren&rsquo;t enough lessons yet to show a trend with
                  confidence. It fills in on its own as your school keeps
                  learning - nothing to set up.
                </p>
              </div>
            )}

            {masteryRows.length > 0 ? (
              <div className={cn(CARD, "mt-5 px-6 py-[26px]")}>
                <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
                  Where the reading is getting in the way
                </h3>
                <p className="m-0 mb-5 mt-1 max-w-[62ch] text-[13px] leading-[1.6] text-nevo-near-black/58">
                  Two tracks per concept: how well the school understands the
                  idea, and the reading level the material demands. Where the
                  two part company, the barrier is the text rather than the
                  concept - and that is something you can change.
                </p>
                <DualTrackBars rows={masteryRows} />
              </div>
            ) : null}

            {transformation ? (
              <div className={cn(CARD, "mt-5 px-6 py-[26px]")}>
                <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
                  How much Nevo adapted
                </h3>
                <p className="m-0 mt-1 text-[13px] text-nevo-near-black/58">
                  Volumes for the whole school, this period.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3.5 max-lg:grid-cols-2">
                  <Stat
                    label="Lessons transformed"
                    value={transformation.lessonsTransformed.toLocaleString()}
                    plain
                  />
                  <Stat
                    label="Adaptations applied"
                    value={transformation.adaptationsApplied.toLocaleString()}
                    plain
                  />
                  <Stat
                    label="Per session"
                    value={transformation.adaptationsPerSession.toFixed(1)}
                    plain
                  />
                </div>
              </div>
            ) : null}

            <p className="mt-6 max-w-[62ch] text-[13px] leading-[1.6] text-nevo-near-black/55">
              This screen shows the shape of a cohort - never a named student,
              never a score against a child, never a label. That boundary is
              what keeps cohort analytics inside admin scope.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  plain = false,
}: {
  label: string;
  value: string;
  plain?: boolean;
}) {
  return (
    <div className={cn(plain ? "" : CARD, plain ? "" : "px-5 py-[18px]")}>
      <div className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-nevo-navy">
        {value}
      </div>
      <div className="mt-2 text-[13px] font-medium text-nevo-near-black/62">{label}</div>
    </div>
  );
}
