/**
 * MasteryDualTrack (`Nevo Teacher MasteryDualTrack`) - one concept, two
 * tracks: how well the student has understood it (navy, the heavier bar) and
 * how much the reading load is shaping the result (violet, deliberately
 * thinner and lighter - it is context, not a score).
 *
 * SCRUM-38 attribution is text-only: a flagged row gets a navy-outlined pill
 * carrying the words, never an alarm colour and never a hue change on the
 * bars. The component repeats down the C08 mastery panel, so its geometry is
 * literal: 92px label column, 34px value column, 12px gaps, 8px/6px rails.
 *
 * The auto-flag rules leave a deliberate-looking gap (one track under 40 with
 * the other 40-59 flags nothing); reproduced exactly as the frame computes
 * it rather than "corrected" - flagged to design.
 */

const AUTO_FLAG = (u: number, r: number): string => {
  if (u < 40 && r >= 60) return "Concept support needed";
  if (r < 40 && u >= 60) return "Reading support needed";
  if (u < 40 && r < 40) return "Needs support";
  return "";
};

/** Frame clamps to 0-100; NaN would emit `width:NaN%`, so guard it too. */
const clamp = (v: number, fallback: number) =>
  Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : fallback;

export function MasteryDualTrack({
  concept,
  understanding,
  reading,
  /** Any string overrides the auto label; the literal "none" suppresses it. */
  flag,
}: {
  concept: string;
  understanding: number;
  reading: number;
  flag?: string;
}) {
  const u = clamp(understanding, 72);
  const r = clamp(reading, 48);
  const label = flag ? (flag === "none" ? "" : flag) : AUTO_FLAG(u, r);

  return (
    <div className="flex w-full flex-col gap-2.5">
      {concept && (
        <div className="flex items-center gap-2.5">
          <span className="text-[14.5px] font-semibold tracking-[-0.005em] text-nevo-near-black">
            {concept}
          </span>
          {label && (
            <span className="rounded-full border border-nevo-navy/45 px-2.5 py-[3px] text-[11px] font-semibold tracking-[0.01em] text-nevo-navy">
              {label}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="w-[92px] shrink-0 text-xs text-nevo-near-black/70">
            Understanding
          </span>
          <div
            role="progressbar"
            aria-label={concept ? `${concept} - understanding` : "Understanding"}
            aria-valuenow={u}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 flex-1 overflow-hidden rounded-[4px] bg-nevo-navy/10"
          >
            <div
              className="h-full rounded-[4px] bg-nevo-navy"
              style={{ width: `${u}%` }}
            />
          </div>
          <span className="w-[34px] shrink-0 text-right text-[13px] font-medium text-nevo-near-black">
            {u}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-[92px] shrink-0 text-xs text-nevo-near-black/70">
            Reading level
          </span>
          <div
            role="progressbar"
            aria-label={concept ? `${concept} - reading level` : "Reading level"}
            aria-valuenow={r}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-nevo-violet/10"
          >
            <div
              className="h-full rounded-[3px] bg-nevo-violet"
              style={{ width: `${r}%` }}
            />
          </div>
          <span className="w-[34px] shrink-0 text-right text-[13px] font-medium text-nevo-near-black/70">
            {r}%
          </span>
        </div>
      </div>
    </div>
  );
}
