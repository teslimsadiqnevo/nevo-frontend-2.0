"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import {
  parentApi,
  type GrowthNarrative,
  type ParentChild,
} from "@/lib/api/parent";
import { ChildGrowth } from "./ChildGrowth";

/**
 * The signed-in parent portal (D15d).
 *
 * SEPARATE FROM `/parent/[token]`, which is public and stays that way: a
 * statutory data right must not sit behind a login. This surface is the other
 * half - what a parent sees once consent has given them an account.
 *
 * NO PROXY GUARD, deliberately. `proxy.ts` is optimistic by its own admission
 * (it reads a mirror cookie, not a session) and it is a shared file three
 * sessions edit. The real boundary is the API's Bearer check, which answers
 * 401 without a session and 403 for any non-parent role, and both are handled
 * here. A guard would add a second, weaker copy of a rule the server already
 * enforces.
 *
 * THERE IS NO PARENT SIGN-IN SCREEN, and none is invented here. Design has not
 * drawn one, and guessing at a door on a surface this sensitive is worse than
 * saying the true thing: the link the school sent still works, and it is how a
 * parent gets back in today. Flagged for a frame.
 */

type Phase = "loading" | "ready" | "signed-out" | "not-parent" | "failed";

export function ParentHome() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // A missing local session and a session the server rejects are the SAME
    // fact to a parent, so they take the same path instead of being handled in
    // two places. Folding the local check into the chain also keeps every
    // setState inside a callback - `react-hooks/set-state-in-effect` exists
    // because a synchronous setState in an effect body cascades an extra
    // render. No request is made without a session; the throw happens first.
    Promise.resolve()
      .then(() => {
        if (!getSession()) throw new ApiError(401, "no local session");
        return parentApi.myChildren();
      })
      .then((kids) => {
        if (cancelled) return;
        setChildren(kids);
        // One child is the overwhelmingly common case; making a parent pick
        // from a list of one is a step that exists only for the code's benefit.
        setSelected(kids.length === 1 ? kids[0].studentId : null);
        setPhase("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) setPhase("signed-out");
        else if (e instanceof ApiError && e.status === 403) setPhase("not-parent");
        else setPhase("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return (
      <Shell>
        <span
          role="status"
          aria-label="Loading"
          className="mx-auto block size-[22px] rounded-full border-[2.5px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:800ms]"
        />
      </Shell>
    );
  }

  if (phase === "signed-out" || phase === "not-parent") {
    return (
      <Shell>
        <Card>
          <h1 className="text-[21px] font-semibold text-nevo-near-black">
            Open the link your school sent you
          </h1>
          <p className={BODY}>
            {phase === "not-parent"
              ? "This page is for parents and guardians. If you have a Nevo account for school, sign in there instead."
              : "Your consent link takes you straight to your child’s details, and lets you see and manage their data at any time."}
          </p>
          <p className={BODY}>
            If you can’t find it, your child’s school can send you a new one.
          </p>
        </Card>
      </Shell>
    );
  }

  if (phase === "failed") {
    return (
      <Shell>
        <Card>
          <h1 className="text-[21px] font-semibold text-nevo-near-black">
            We couldn’t load this just now
          </h1>
          <p className={BODY}>
            Something went wrong at our end. Please try again in a moment.
          </p>
        </Card>
      </Shell>
    );
  }

  if (children.length === 0) {
    return (
      <Shell>
        <Card>
          <h1 className="text-[21px] font-semibold text-nevo-near-black">
            Nothing to show yet
          </h1>
          <p className={BODY}>
            Your account isn’t linked to a child yet. Your child’s school can
            sort that out for you.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      {children.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {children.map((c) => {
            const on = c.studentId === selected;
            return (
              <button
                key={c.studentId}
                type="button"
                onClick={() => setSelected(c.studentId)}
                aria-pressed={on}
                className={`cursor-pointer rounded-full px-4 py-2 text-[14.5px] font-semibold transition-colors ${
                  on
                    ? "bg-nevo-navy text-nevo-cream"
                    : "bg-nevo-cream-elevated text-nevo-near-black hover:bg-nevo-navy/10"
                }`}
              >
                {c.firstName ?? "Your child"}
              </button>
            );
          })}
        </div>
      )}

      {selected ? (
        <GrowthFor key={selected} studentId={selected} />
      ) : (
        <Card>
          <h1 className="text-[21px] font-semibold text-nevo-near-black">
            Choose a child
          </h1>
          <p className={BODY}>
            Pick a name above to see how they&rsquo;re getting on.
          </p>
        </Card>
      )}
    </Shell>
  );
}

/**
 * Switching children must never leave one child's narrative sitting under
 * another child's name, even for the length of a request. On this screen that
 * is a serious thing to get wrong.
 *
 * KEYED BY `studentId` AT THE CALL SITE, so a switch remounts this with fresh
 * state rather than mutating it. The first version reset the phase and the
 * narrative at the top of the effect instead, which worked but is exactly what
 * `react-hooks/set-state-in-effect` exists to catch: a synchronous setState in
 * an effect body cascades an extra render. The remount gets the same property
 * for free, and there is no reset to forget.
 */
function GrowthFor({ studentId }: { studentId: string }) {
  const [growth, setGrowth] = useState<GrowthNarrative | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    parentApi
      .childGrowth(studentId)
      .then((g) => {
        if (cancelled) return;
        setGrowth(g);
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (phase === "loading") {
    return (
      <span
        role="status"
        aria-label="Loading"
        className="mx-auto block size-[22px] rounded-full border-[2.5px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:800ms]"
      />
    );
  }

  if (phase === "failed" || !growth) {
    return (
      <Card>
        <h1 className="text-[21px] font-semibold text-nevo-near-black">
          We couldn’t load this just now
        </h1>
        <p className={BODY}>Please try again in a moment.</p>
      </Card>
    );
  }

  return <ChildGrowth growth={growth} />;
}

const BODY = "mt-3 text-[15px] leading-[1.6] text-nevo-near-black/68";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] bg-nevo-cream-elevated px-[22px] py-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {children}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-nevo-cream px-6 py-9 text-nevo-near-black">
      <div className="mx-auto w-full max-w-[720px]">{children}</div>
    </main>
  );
}
