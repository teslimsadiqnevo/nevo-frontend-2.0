import type {
  GrowthDimension,
  GrowthNarrative,
  GrowthTrend,
} from "@/lib/api/parent";

/**
 * D15d Parent Growth View — "How {child} Is Growing".
 *
 * A parent-facing view of how their child is growing, written entirely in plain
 * language. The frame is emphatic and the backend agrees with it: no scores, no
 * percentages, no clinical terms, no labels. Every sentence here arrives
 * pre-written and selected by evidence; there is a backend test that fails if a
 * statement contains a digit, and nothing on this screen computes a judgement.
 *
 * TWO PLACES THIS DEPARTS FROM THE FRAME, both because the data cannot support
 * what the frame says. Flagged to design rather than decided quietly:
 *
 * 1. "THIS TERM" IS NOT SAYABLE. The frame says "this term" three times. The
 *    roster holds no term dates anywhere, so the window is a fixed 90 days
 *    against the preceding 90 - which is why the API sends both ranges. Saying
 *    "than last term" would claim something nobody can support, so the screen
 *    says what was actually compared and shows the dates.
 *
 * 2. "KNOWING WHAT SHE KNOWS" IS GENDERED, and so is the enum behind it
 *    (`knowing_what_she_knows`). The example child in the frame is Amara; a
 *    real child may be any gender and the API sends no pronoun. The one title
 *    that carried a pronoun is neutral here. The STATEMENT text cannot be
 *    fixed from this side - it arrives written - and the templates look
 *    gendered too. Raised with backend.
 */

const CARD =
  "flex flex-col gap-2.5 rounded-[12px] border-l-[3px] bg-nevo-cream-elevated px-5 py-[18px]";
const TITLE =
  "text-[17px] font-semibold tracking-[-0.01em] text-nevo-near-black";
const NOTE = "text-[14.5px] leading-[1.55] text-nevo-near-black/72";
const PILL =
  "self-start rounded-full px-[11px] py-1 text-[11px] font-semibold tracking-[0.02em]";
const SECTION =
  "text-[11px] font-bold uppercase tracking-[0.14em] text-nevo-violet";

/** The frame's four titles, keyed by the enum the API sends. */
const DIMENSION_TITLE: Record<GrowthDimension, string> = {
  staying_with_hard_problems: "Staying with hard problems",
  // Frame reads "Knowing what she knows". Neutral, because the child may be
  // any gender and nothing in the payload says which.
  knowing_what_she_knows: "Knowing what they know",
  connecting_ideas: "Connecting ideas",
  learning_new_things_faster: "Learning new things faster",
};

/**
 * Plain words for each trend. Deliberately not "emerging" or "insufficient
 * data" - a parent is not reading a report, and the frame rules out clinical
 * terms explicitly.
 */
const TREND_LABEL: Record<GrowthTrend, string> = {
  growing: "Growing",
  steady: "Steady",
  emerging: "Starting out",
  not_enough_yet: "Not enough yet",
};

/**
 * `not_enough_yet` is quieter, never alarming. It is not a bad result and must
 * not read as one - there is simply not enough for anyone to say. No red
 * anywhere on a parent surface.
 */
const TREND_STYLE: Record<GrowthTrend, { border: string; pill: string }> = {
  growing: {
    border: "border-l-nevo-violet",
    pill: "bg-nevo-violet/20 text-nevo-navy",
  },
  steady: {
    border: "border-l-nevo-violet",
    pill: "bg-nevo-violet/20 text-nevo-navy",
  },
  emerging: {
    border: "border-l-nevo-violet",
    pill: "bg-nevo-violet/20 text-nevo-navy",
  },
  not_enough_yet: {
    border: "border-l-nevo-near-black/15",
    pill: "bg-nevo-near-black/8 text-nevo-near-black/60",
  },
};

export function ChildGrowth({ growth }: { growth: GrowthNarrative }) {
  const child = growth.studentFirstName;

  return (
    <div>
      <div className={SECTION}>{growth.headline}</div>
      <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.018em] text-nevo-near-black">
        How {child} Is Growing
      </h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-nevo-near-black/68">
        {growth.summary}
      </p>

      <div className={`${SECTION} mt-8`}>Growing over the last few months</div>

      <div className="mt-3.5 grid gap-3.5 md:grid-cols-2">
        {growth.statements.map((s) => {
          const style = TREND_STYLE[s.trend];
          return (
            <div key={s.dimension} className={`${CARD} ${style.border}`}>
              <span className={`${PILL} ${style.pill}`}>
                {TREND_LABEL[s.trend]}
              </span>
              <div className={TITLE}>{DIMENSION_TITLE[s.dimension]}</div>
              {/* Rendered as sent. It is written in advance and selected by
                  evidence, so nothing here reformats or interpolates it. */}
              <div className={NOTE}>{s.statement}</div>
            </div>
          );
        })}
      </div>

      <p className="mt-7 text-[13.5px] leading-[1.6] text-nevo-near-black/55">
        This is how {child} is growing as a learner, described in plain terms.
        Nevo never gives {child} a score, a percentage or a label.
      </p>

      {/* What was actually compared. The frame says "this term"; there are no
          term dates in the system, so this states the real window instead of
          implying one nobody can support. */}
      <p className="mt-2.5 text-[13px] leading-[1.6] text-nevo-near-black/45">
        Based on {formatRange(growth.periodStart, growth.periodEnd)}, compared
        with {formatRange(growth.comparisonStart, growth.comparisonEnd)}.
      </p>
    </div>
  );
}

/**
 * "12 June to 10 September". Falls back to the raw value rather than rendering
 * "Invalid Date" - a broken date should cost the sentence, not the page.
 */
export function formatRange(startIso: string, endIso: string): string {
  const start = formatDay(startIso);
  const end = formatDay(endIso);
  return start && end ? `${start} to ${end}` : `${startIso} to ${endIso}`;
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}
