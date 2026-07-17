import type { Density } from "@/lib/constants";
import type { TextContent } from "@/lib/types";

/**
 * Text modality (Lesson Player). One heading + a body that reshapes with the
 * active reading density (Simplify / Expand / Slower) — the SAME segment, not new
 * content. An optional callout accompanies a chosen density.
 */
export function TextSegment({
  content,
  density,
}: {
  content: TextContent;
  density: Density | null;
}) {
  const body = (density && content.body[density]) ?? content.body.default;

  return (
    <article className="motion-safe:animate-nevo-reveal">
      <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[26px] lg:text-[28px]">
        {content.heading}
      </h2>

      <p className="mt-4 text-base leading-[1.65] text-nevo-near-black sm:text-[18px] lg:text-[19px]">
        {body}
      </p>

      {content.callout && density && (
        <div className="mt-6 rounded-[12px] bg-nevo-cream-elevated p-4 shadow-elevation-1">
          <p className="font-mono text-[11px] tracking-[0.12em] text-nevo-navy uppercase">
            {content.callout.label}
          </p>
          <p className="mt-1.5 text-[15px] leading-[1.55] text-nevo-near-black sm:text-base">
            {content.callout.text}
          </p>
        </div>
      )}
    </article>
  );
}
