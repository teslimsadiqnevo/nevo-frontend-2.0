"use client";

import { DemoLockup } from "../DemoLockup";
import { Reveal } from "../chrome";

/**
 * Scene 1. Product identity, one sentence, nothing else.
 *
 * The temptation on an opening slide is to say what the product does. It
 * does not work on a conference screen: an audience that has just looked up
 * can read about six words. So this holds two lines and a mark, lets them
 * land, and gets out of the way - the console itself is the argument, and it
 * is four seconds away.
 *
 * The cream ground is the product's own, not a dark "tech launch" backdrop,
 * so the cut into the console is a continuation rather than a jolt.
 *
 * The mark is the REAL Nevo lockup from `public/brand`. An earlier version of
 * this scene drew a rounded navy square with an "N" in it, which was invented
 * - the actual mark is a linked-node glyph beside the wordmark, and putting a
 * made-up logo on the opening frame of a conference video is about the worst
 * place to get branding wrong.
 */
export function IntroScene({ progress }: { progress: number }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-nevo-cream">
      {/* A single, very slow breathing wash. Motion that says "alive" without
          asking to be watched. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(1100px 620px at 50% 44%, rgba(154,156,203,0.20) 0%, rgba(247,241,230,0) 70%)",
        }}
      />

      <div className="relative flex flex-col items-center">
        <Reveal show={progress > 0.06} delay={0}>
          <DemoLockup width={560} priority />
        </Reveal>

        <Reveal show={progress > 0.16} delay={80}>
          <h1 className="m-0 mt-14 text-[86px] font-semibold leading-none tracking-[-0.034em] text-nevo-near-black">
            Teacher Console
          </h1>
        </Reveal>

        <Reveal show={progress > 0.34} delay={120}>
          <p className="m-0 mt-9 text-[36px] font-normal leading-none tracking-[-0.014em] text-nevo-near-black/58">
            One place to understand every learner.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
