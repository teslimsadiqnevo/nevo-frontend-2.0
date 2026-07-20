import { ArrowRight, Leaf } from "lucide-react";
import { IllustrationWrapper } from "@/components/shared";
import type { VisualContent } from "@/lib/types";

/**
 * Visual modality (Lesson Player frame 17) — the segment as a picture: an
 * illustration (a quiet dashed placeholder until real art lands) plus the
 * on-brand input→output diagram card.
 */
export function VisualSegment({ content }: { content: VisualContent }) {
  return (
    <article>
      <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[26px] lg:text-[28px]">
        {content.heading}
      </h2>
      {content.intro && (
        <p className="mt-4 text-base leading-[1.6] text-nevo-near-black/82 sm:text-[18px] lg:text-[19px]">
          {content.intro}
        </p>
      )}

      <figure className="mt-[22px]">
        {content.illustration ? (
          <div className="flex justify-center">
            <IllustrationWrapper
              src={content.illustration.src}
              alt={content.illustration.alt}
              width={640}
              height={480}
              className="w-full max-w-[420px]"
            />
          </div>
        ) : (
          // No art yet — the frame's dashed cream-elevated placeholder.
          <div className="flex h-[180px] flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-nevo-navy/22 bg-nevo-cream-elevated shadow-elevation-1 sm:h-[220px]">
            <Leaf className="size-[46px] text-nevo-violet" strokeWidth={1.6} />
            <span className="font-mono text-[11px] tracking-[0.04em] text-nevo-near-black/50">
              illustration on the way
            </span>
          </div>
        )}
        {content.illustration?.caption && (
          <figcaption className="mx-0.5 mt-2.5 text-[13px] leading-[1.5] text-nevo-near-black/60">
            {content.illustration.caption}
          </figcaption>
        )}
      </figure>

      {content.diagram && (
        <div className="mt-4 rounded-[12px] bg-nevo-cream-elevated p-5 shadow-elevation-1">
          <div className="flex items-center gap-3.5">
            <DiagramColumn
              label={content.diagram.inLabel}
              items={content.diagram.inputs}
              tone="in"
            />
            <ArrowRight
              className="size-6 shrink-0 text-nevo-violet"
              strokeWidth={2}
            />
            <DiagramColumn
              label={content.diagram.outLabel}
              items={content.diagram.outputs}
              tone="out"
            />
          </div>
        </div>
      )}
    </article>
  );
}

function DiagramColumn({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "in" | "out";
}) {
  return (
    <div className="flex flex-1 flex-col items-start gap-1.5">
      <p className="font-mono text-[10px] tracking-[0.06em] text-nevo-near-black/50 uppercase">
        {label}
      </p>
      {items.map((item) => (
        <span
          key={item}
          className={
            tone === "in"
              ? "inline-flex items-center rounded-full bg-nevo-violet/18 px-3 py-[7px] text-[13px] font-medium text-nevo-navy"
              : "inline-flex items-center rounded-full bg-nevo-navy px-3 py-[7px] text-[13px] font-medium text-nevo-cream"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}
