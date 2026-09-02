"use client";

import { DEMO_FLAGS } from "@/lib/demo/demoData";
import { cn } from "@/lib/utils";
import { Reveal } from "../chrome";

/**
 * Scene 3. The signal.
 *
 * The argument of the whole demo lives here: a console that only DISPLAYS is
 * another dashboard, and teachers already have those. What earns a teacher's
 * attention is a system that has noticed something and can say what and why.
 *
 * So this scene lifts the three flags out of the dashboard and gives them the
 * whole screen, in the product's own words. The notes are not summarised or
 * rewritten for the stage - they are the strings the console ships, because
 * their register IS the product: plain, specific, non-clinical, and about
 * behaviour in a moment rather than a label on a child.
 *
 * The evidence bars are the fixtures' own five-session series. The changed
 * session carries the accent, which is the one thing the eye needs.
 */
export function InsightScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[62px]">
      <Reveal show={progress > 0.02}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          Before first period
        </p>
        <h2 className="m-0 mt-3 max-w-[1250px] text-[52px] font-semibold leading-[1.1] tracking-[-0.026em] text-nevo-near-black">
          Three learners have changed pattern this week
        </h2>
      </Reveal>

      <div className="mt-11 grid flex-1 grid-cols-3 gap-7">
        {DEMO_FLAGS.slice(0, 3).map((f, i) => (
          <Reveal key={f.id} show={progress > 0.1} delay={160 + i * 190}>
            <article
              className={cn(
                "flex h-full flex-col rounded-2xl bg-nevo-cream-elevated p-9",
                "shadow-[0_2px_10px_rgba(43,43,47,0.07)]",
                // The learner the story follows reads a shade stronger, so the
                // next scene's cut to her profile is a continuation.
                f.id === "amara-written-pace" && "ring-2 ring-nevo-navy/45",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-[27px] font-semibold tracking-[-0.014em] text-nevo-near-black">
                  {f.name}
                </span>
                {f.isSudden ? (
                  <span className="rounded-full bg-nevo-navy/12 px-3 py-1 text-[14px] font-semibold text-nevo-navy">
                    Sudden change
                  </span>
                ) : null}
              </div>
              <p className="m-0 mt-1.5 text-[16px] text-nevo-near-black/55">
                {f.context}
              </p>

              <p className="m-0 mt-6 flex-1 text-[19px] leading-[1.55] text-nevo-near-black/82">
                {f.note}
              </p>

              {/* The fixture's own five-session series. */}
              <div className="mt-7 flex h-[86px] items-end gap-2.5">
                {f.evidence.map(([height, emphasis], j) => (
                  <span
                    key={j}
                    className={cn(
                      "flex-1 rounded-t-[4px] transition-[height] duration-[900ms] ease-out",
                      emphasis === "accent"
                        ? "bg-nevo-navy"
                        : emphasis === "soft"
                          ? "bg-nevo-violet"
                          : "bg-nevo-near-black/16",
                    )}
                    style={{
                      height: progress > 0.16 ? `${height}%` : "0%",
                      transitionDelay: `${300 + i * 190 + j * 70}ms`,
                    }}
                  />
                ))}
              </div>
              <p className="m-0 mt-3 text-[14.5px] text-nevo-near-black/50">
                {f.evidenceLabel}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
