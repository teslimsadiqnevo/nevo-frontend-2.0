import { DENSITY, type Density } from "@/lib/constants";
import type { TextContent } from "@/lib/types";

/**
 * Text modality (Lesson Player frame 17). One heading + a body that reshapes
 * with the active reading density — the SAME segment, not new content. Simplify
 * strips to the fewest words (+ "IN SHORT" callout); Expand adds depth, key-term
 * chips and the "WORD EQUATION" callout; Slower breaks the idea into small
 * numbered step cards under a lead line.
 */
export function TextSegment({
  content,
  density,
}: {
  content: TextContent;
  density: Density | null;
}) {
  const body = (density && content.body[density]) ?? content.body.default;
  const callout = content.callouts?.[density ?? "default"];
  const steps = density === DENSITY.SLOWER ? content.slowerSteps : undefined;
  const keyTerms = density === DENSITY.EXPAND ? content.keyTerms : undefined;

  return (
    <article>
      <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[26px] lg:text-[28px]">
        {content.heading}
      </h2>

      <p className="mt-4 text-base leading-[1.75] text-nevo-near-black/82 sm:text-[18px] lg:text-[19px]">
        {body}
      </p>

      {steps && steps.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 rounded-[12px] bg-nevo-cream-elevated px-4.5 py-4 shadow-elevation-1"
            >
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-nevo-navy text-sm font-semibold text-nevo-cream">
                {i + 1}
              </span>
              <p className="text-base leading-[1.6] text-nevo-near-black/82 sm:text-[18px] lg:text-[19px]">
                {step}
              </p>
            </div>
          ))}
        </div>
      )}

      {keyTerms && keyTerms.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {keyTerms.map((term) => (
            <span
              key={term}
              className="rounded-full bg-nevo-violet/18 px-3 py-1.5 text-[13px] font-medium text-nevo-navy"
            >
              {term}
            </span>
          ))}
        </div>
      )}

      {callout && (
        <div className="mt-[22px] rounded-[12px] bg-nevo-violet/8 p-5">
          <p className="font-mono text-[11px] tracking-[0.06em] text-nevo-navy uppercase">
            {callout.label}
          </p>
          <p className="mt-2.5 text-base leading-[1.7] font-medium text-nevo-near-black sm:text-[18px] lg:text-[19px]">
            {callout.text}
          </p>
          {callout.sub && (
            <p className="mt-1.5 text-[13px] leading-[1.6] text-nevo-near-black/60">
              {callout.sub}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
