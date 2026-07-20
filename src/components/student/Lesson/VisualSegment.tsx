import { ArrowRight, Leaf } from "lucide-react";
import { IllustrationWrapper } from "@/components/shared";
import type { VisualContent } from "@/lib/types";

/**
 * Visual modality (Lesson Player) — the segment as a picture: an illustration
 * (a quiet cream-elevated placeholder until real art lands) plus an optional
 * on-brand input→output diagram.
 */
export function VisualSegment({ content }: { content: VisualContent }) {
  return (
    <article className="motion-safe:animate-nevo-reveal">
      <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[26px] lg:text-[28px]">
        {content.heading}
      </h2>

      {content.illustration ? (
        <figure className="mt-5 flex flex-col items-center gap-2">
          <IllustrationWrapper
            src={content.illustration.src}
            alt={content.illustration.alt}
            width={640}
            height={480}
            className="w-full max-w-[420px]"
          />
          {content.illustration.caption && (
            <figcaption className="text-center text-sm text-nevo-near-black/55">
              {content.illustration.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        // No art yet — a quiet placeholder rather than an empty gap. There is no
        // caption to show here: `caption` lives on the illustration we don't have.
        <div className="mt-5 flex flex-col items-center gap-2 rounded-[12px] border-2 border-dashed border-nevo-near-black/15 bg-nevo-cream-elevated px-6 py-10">
          <Leaf className="size-9 text-nevo-violet" strokeWidth={1.75} />
          <p className="text-center text-sm text-nevo-near-black/55">
            Picture on the way
          </p>
        </div>
      )}

      {content.diagram && (
        <div className="mt-6 flex items-center justify-center gap-4 rounded-[12px] bg-nevo-cream-elevated p-5">
          <DiagramColumn
            label={content.diagram.inLabel}
            items={content.diagram.inputs}
            tone="in"
          />
          <ArrowRight
            className="size-6 shrink-0 text-nevo-near-black/35"
            strokeWidth={2}
          />
          <DiagramColumn
            label={content.diagram.outLabel}
            items={content.diagram.outputs}
            tone="out"
          />
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
    <div className="flex flex-1 flex-col items-center gap-2">
      <p className="font-mono text-[10px] tracking-[0.12em] text-nevo-near-black/45 uppercase">
        {label}
      </p>
      <div className="flex flex-col items-stretch gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={
              tone === "in"
                ? "rounded-full bg-nevo-violet/25 px-3 py-1 text-center text-[13px] font-medium text-nevo-near-black"
                : "rounded-full bg-nevo-navy px-3 py-1 text-center text-[13px] font-medium text-nevo-cream"
            }
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
