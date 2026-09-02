"use client";

import { BreakOfferPill } from "@/components/student/Lesson/BreakOfferPill";
import { ModalitySuggestionPill } from "@/components/student/Lesson/ModalitySuggestionPill";
import { ScaffoldIndicator } from "@/components/student/Lesson/ScaffoldIndicator";
import { MODALITY, SCAFFOLD_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Reveal } from "../chrome";

/**
 * The three adaptation beats - support, channel, rest.
 *
 * These are the reason the film exists, so each gets its own scene and its own
 * screen-sized statement of what just happened and who decided it.
 *
 * THE COMPONENTS ARE THE PRODUCT'S OWN, lifted out of the player and shown at
 * a size a room can read. That is a deliberate trade. Inside the tablet these
 * are a four-dot indicator and a small card - correct for a child holding a
 * device at arm's length, illegible from the back of a hall. Rather than
 * redraw them larger and misrepresent the product, the real component is
 * mounted and the surrounding frame is scaled up around it, so what the
 * audience reads is genuinely what a student sees.
 *
 * WHAT IS NOT DONE HERE: nothing simulates a student tapping. An earlier plan
 * drove the real `LessonPlayer` through all three segments with scripted
 * clicks, which meant scripting a quick check, a calculation solver and two
 * breaks to reach the one offer that matters. Every one of those is a chance
 * for a live demo to stall on the wrong frame. The beats are shown at rest
 * instead, held long enough to be read.
 */

/** The right-hand panel: what changed, and who decided it. */
function Explain({
  eyebrow,
  title,
  body,
  decidedBy,
  show,
}: {
  eyebrow: string;
  title: string;
  body: string;
  decidedBy: string;
  show: boolean;
}) {
  return (
    <div className="flex max-w-[790px] flex-col">
      <Reveal show={show}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          {eyebrow}
        </p>
        <h2 className="m-0 mt-3 text-[52px] font-semibold leading-[1.1] tracking-[-0.026em] text-nevo-near-black">
          {title}
        </h2>
      </Reveal>
      <Reveal show={show} delay={220}>
        <p className="m-0 mt-7 text-[24px] leading-[1.55] text-nevo-near-black/70">
          {body}
        </p>
      </Reveal>
      <Reveal show={show} delay={420}>
        <p className="m-0 mt-9 border-l-[3px] border-nevo-violet pl-5 text-[21px] leading-[1.5] text-nevo-navy">
          {decidedBy}
        </p>
      </Reveal>
    </div>
  );
}

/** A neutral card standing in for the lesson surface behind the offer. */
function LessonSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[700px] rounded-[26px] bg-nevo-cream-elevated px-10 py-11 shadow-[0_20px_60px_rgba(43,43,47,0.16)]">
      {children}
    </div>
  );
}

const noop = () => undefined;

/* ------------------------------------------------------------- 1. SUPPORT */

export function SupportScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full items-center gap-[84px] bg-nevo-cream px-[96px] pb-[176px] pt-[40px]">
      <Reveal show={progress > 0.04} className="flex-none">
        <LessonSurface>
          <p className="m-0 text-[17px] font-medium uppercase tracking-[0.12em] text-nevo-near-black/40">
            Adding Fractions &middot; step 2 of 3
          </p>
          <p className="m-0 mt-6 text-[30px] leading-[1.45] text-nevo-near-black/85">
            Now try one on your own. What is <strong>2/5 + 1/5</strong>?
          </p>

          {/* The real indicator, at the level the fixture's plan actually
              carries for this segment. */}
          <div className="mt-11 flex items-center justify-end">
            <div className="scale-[2.1] origin-right">
              <ScaffoldIndicator level={SCAFFOLD_LEVELS.FULL} />
            </div>
          </div>
        </LessonSurface>
      </Reveal>

      <Explain
        show={progress > 0.12}
        eyebrow="Nevo adapts &middot; support"
        title="The help comes up on its own"
        body="Amara did not ask for this, and she was not asked to rate the difficulty. Nevo saw the work get harder and raised the level of support behind it."
        decidedBy="Four small circles. No score, no percentage, no label about the child - a signal the system gives itself."
      />
    </div>
  );
}

/* ------------------------------------------------------------- 2. CHANNEL */

export function ChannelScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full items-center gap-[84px] bg-nevo-cream px-[96px] pb-[176px] pt-[40px]">
      <Reveal show={progress > 0.04} className="flex-none">
        <LessonSurface>
          <p className="m-0 text-[17px] font-medium uppercase tracking-[0.12em] text-nevo-near-black/40">
            Adding Fractions &middot; recap
          </p>

          {/* The real offer. `suggestModality: AUDIO` is what the fixture's
              own plan carries for this segment - the same listen-first
              adaptation her teacher recommended in the other film. */}
          <div className="relative mt-8 h-[230px]">
            <div className="origin-top-left scale-[1.62]">
              <div className="relative w-[380px]">
                <ModalitySuggestionPill
                  modality={MODALITY.AUDIO}
                  onAccept={noop}
                  onAcceptStart={noop}
                  onDismiss={noop}
                />
              </div>
            </div>
          </div>
        </LessonSurface>
      </Reveal>

      <Explain
        show={progress > 0.12}
        eyebrow="Nevo adapts &middot; channel"
        title="Another way in, offered once"
        body="Reading has been the slow part all week. So the same content is offered as audio - not swapped silently, and not forced."
        decidedBy="Two plain buttons, and no auto-dismiss. An offer that times itself out is indistinguishable from one she turned down."
      />
    </div>
  );
}

/* ---------------------------------------------------------------- 3. REST */

export function RestScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full items-center gap-[84px] bg-nevo-cream px-[96px] pb-[176px] pt-[40px]">
      <Reveal show={progress > 0.04} className="flex-none">
        <LessonSurface>
          <p className="m-0 text-[17px] font-medium uppercase tracking-[0.12em] text-nevo-near-black/40">
            Adding Fractions &middot; 14 minutes in
          </p>
          <div className="relative mt-8 h-[150px]">
            <div className="origin-top-left scale-[1.62]">
              <div className={cn("relative w-[380px]")}>
                <BreakOfferPill trigger="affect" onAccept={noop} onDismiss={noop} />
              </div>
            </div>
          </div>
        </LessonSurface>
      </Reveal>

      <Explain
        show={progress > 0.12}
        eyebrow="Nevo adapts &middot; rest"
        title="It knows when to stop"
        body="Fourteen minutes in, the signals change. Nevo offers a break rather than pushing on through the part where nothing more goes in."
        decidedBy="Offered, never imposed. Saying no costs her nothing and is not held against her."
      />
    </div>
  );
}
