"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  schoolIntelligenceApi,
  type AdaptationEventRow,
} from "@/lib/api/schoolIntelligence";
import { cn } from "@/lib/utils";

/**
 * D21 Adaptation log - the receipts behind "adaptations this week". A
 * chronological record of what Nevo changed across the school and the plain
 * signal behind each one. Behaviour framing, never character.
 *
 * ANONYMISED LEARNERS, AND THIS IS THE IMPORTANT BIT. The frame is explicit:
 * "No diagnostic category, no confidence score, no named student." But
 * `GET /api/admin/adaptation-log` returns `studentFirstName` on every row - it
 * hands us more than the design permits. The name is deliberately never
 * rendered; each learner becomes a stable letter derived from their id, the
 * way D20's cohort journeys do it. The API being able to say more is not a
 * reason to.
 *
 * WHAT THE FRAME DRAWS THAT THE API CANNOT FILL:
 * - Before / after. Each row expands to show what the lesson looked like
 *   either side of the change; the response carries `adaptation` and `trigger`
 *   and nothing describing the prior state. The expander shows what exists.
 * - Type and class filters. `eventType` is not a query parameter, and no
 *   endpoint lists classes, so neither filter has a source. The date range is
 *   real - `dateFrom` - and is the one filter offered.
 *
 * TODO(api): a before/after pair on the event, an eventType filter, and a class
 * list so the frame's other two filters can exist.
 */

const CARD = "rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]";
const PAGE = 5;

type Phase = "loading" | "ready" | "failed";

const RANGES = [
  { label: "This week", days: 7 },
  { label: "This month", days: 30 },
  { label: "This term", days: 120 },
] as const;

/** A stable letter per learner, so rows stay comparable without a name. */
function learnerTag(studentId: string, order: string[]): string {
  const i = order.indexOf(studentId);
  if (i === -1) return "?";
  // A..Z, then AA, AB - a school never has enough in one view to matter.
  let n = i;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;
  const yesterday = new Date(today.getTime() - 864e5);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${time}`;
}

export function AdaptationLogView() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [rows, setRows] = useState<AdaptationEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [shown, setShown] = useState(PAGE);
  const [expanded, setExpanded] = useState<string | null>(null);
  /*
   * The footer used to end "· 0 diagnostic labels in this or any log" - a
   * hardcoded zero, on a screen that never asked. Design's build rules are
   * explicit that this number must be a real query and not cosmetic, so it
   * comes from the compliance audit. Null means we could not reach it, and
   * then the footer says nothing rather than asserting a zero we do not have.
   */
  const [labels, setLabels] = useState<number | null>(null);

  useEffect(() => {
    schoolIntelligenceApi
      .complianceAudit()
      .then((a) => setLabels(a.diagnosticLabelsStored))
      .catch(() => setLabels(null));
  }, []);

  const range = RANGES[rangeIdx];

  const load = useCallback(
    (days: number, limit: number) => {
      const from = new Date(Date.now() - days * 864e5).toISOString();
      schoolIntelligenceApi
        .adaptationLog({ dateFrom: from, limit })
        .then((log) => {
          setRows(log.events);
          setTotal(log.total);
          setPhase("ready");
        })
        .catch(() => setPhase("failed"));
    },
    [],
  );

  useEffect(() => {
    load(range.days, shown);
  }, [load, range.days, shown]);

  // Order of first appearance decides the letters, so they read A, B, C down
  // the page rather than jumping about.
  const learnerOrder = [...new Set(rows.map((r) => r.studentId))];

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[820px]">
        <Link
          href="/admin/dashboard"
          className="text-[13.5px] font-medium text-nevo-navy hover:underline"
        >
          &larr; School Overview
        </Link>

        <h2 className="mt-3 text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
          Adaptation log
        </h2>
        {phase === "ready" && (
          <p className="mt-1.5 text-[15px] text-nevo-near-black/60">
            {total === 0
              ? `No adaptations in the last ${range.days} days`
              : `${total.toLocaleString("en-GB")} adaptation${total === 1 ? "" : "s"} in the last ${range.days} days`}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              type="button"
              onClick={() => {
                setRangeIdx(i);
                setShown(PAGE);
                setExpanded(null);
              }}
              aria-pressed={i === rangeIdx}
              className={cn(
                "cursor-pointer rounded-full px-[13px] py-1.5 text-[12.5px] font-medium transition-[filter]",
                i === rangeIdx
                  ? "bg-nevo-navy text-nevo-cream"
                  : "border border-nevo-near-black/8 bg-nevo-cream-elevated text-nevo-near-black/70 hover:brightness-[0.985]",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {phase === "loading" && (
          <div className={cn(CARD, "mt-5 h-[280px] animate-pulse")} />
        )}

        {phase === "failed" && (
          <div className={cn(CARD, "mt-5 px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load the adaptation log
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has changed for your students. Try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase("loading");
                load(range.days, shown);
              }}
              className="mt-5 h-[46px] cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
            >
              Try again
            </button>
          </div>
        )}

        {phase === "ready" && rows.length === 0 && (
          <div className={cn(CARD, "mt-5 px-[26px] py-8 text-center")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              Nothing to show for this range
            </h3>
            <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-[1.55] text-nevo-near-black/62">
              No adaptations were made in the last {range.days} days. Try a
              wider range, or check back once lessons are running.
            </p>
          </div>
        )}

        {phase === "ready" && rows.length > 0 && (
          <>
            <div className={cn(CARD, "mt-5 overflow-hidden")}>
              {rows.map((r, i) => {
                const open = expanded === r.id;
                return (
                  <div
                    key={r.id}
                    className={cn(
                      i < rows.length - 1 && "border-b border-nevo-near-black/7",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : r.id)}
                      aria-expanded={open}
                      className="flex w-full cursor-pointer items-start gap-4 px-[22px] py-[18px] text-left transition-[filter] hover:brightness-[0.985]"
                    >
                      <span className="w-[128px] shrink-0 text-[13px] text-nevo-near-black/55">
                        {fmtTime(r.timestamp)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[15px] font-semibold text-nevo-near-black">
                          {r.eventType}
                        </span>
                        <span className="mt-0.5 text-[13.5px] leading-[1.5] text-nevo-near-black/66">
                          {r.adaptation}
                        </span>
                        {r.lessonTitle && (
                          <span className="mt-1 text-[12.5px] text-nevo-near-black/50">
                            {r.lessonTitle}
                          </span>
                        )}
                      </span>
                      {/* Never the name, even though the API sends one. */}
                      <span className="shrink-0 rounded-full bg-nevo-violet/24 px-[11px] py-1 text-[12px] font-semibold text-nevo-navy">
                        {`Learner ${learnerTag(r.studentId, learnerOrder)}`}
                      </span>
                    </button>
                    {open && (
                      <div className="px-[22px] pb-5 pl-[166px]">
                        <span className="text-[12.5px] font-semibold tracking-[0.05em] text-nevo-near-black/50 uppercase">
                          Signal behind it
                        </span>
                        <p className="mt-1.5 max-w-[62ch] text-sm leading-[1.6] text-nevo-near-black/72">
                          {r.trigger}
                        </p>
                        {/* Was "No diagnostic category, no confidence score,
                            no named student" - a guarantee about the contents
                            of `r.trigger`, which is a backend string this
                            client never inspects. What follows is true of the
                            product and of this log's own rendering, both of
                            which we can stand behind. */}
                        <p className="mt-3 max-w-[62ch] text-[13px] leading-[1.5] text-nevo-near-black/50">
                          The signal describes behaviour in the moment. Nevo
                          records no diagnostic category and no confidence
                          score, and this log never shows a learner&rsquo;s
                          name.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] text-nevo-near-black/55">
                {`Showing ${rows.length} of ${total.toLocaleString("en-GB")}`}
                {labels === null
                  ? ""
                  : labels === 0
                    ? " · the last compliance check found no diagnostic labels stored"
                    : ` · the last compliance check found ${labels} diagnostic label${labels === 1 ? "" : "s"} stored`}
              </span>
              {rows.length < total && (
                <button
                  type="button"
                  onClick={() => setShown((s) => s + PAGE)}
                  className="h-[42px] cursor-pointer rounded-[10px] border-[1.5px] border-nevo-navy/30 px-4 text-[13.5px] font-semibold text-nevo-navy transition-colors hover:bg-nevo-navy/6"
                >
                  Load earlier adaptations
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
