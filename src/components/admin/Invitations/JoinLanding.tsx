"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { invitesApi, type JoinLookup } from "@/lib/api/invites";
import { cn } from "@/lib/utils";
import { PRIMARY_BTN, Spinner } from "../Roster/primitives";

/**
 * The join-link landing (D19, "JOIN LINK · parent / student-facing landing").
 *
 * This is the one surface in the admin ticket that a parent or a child will
 * ever see, and the only one that is MOBILE-FIRST - a join link arrives in a
 * message and gets opened on a phone. The desktop variant is the same page
 * with room around it, not a different design.
 *
 * It is also PUBLIC. `proxy.ts` guards only `/teacher`, `/admin` and the two
 * sign-in doors, so `/join/:token` needs no exemption - but that is worth
 * knowing rather than rediscovering: this page must never assume a session,
 * and `lookupJoin` is deliberately the only call it makes before someone
 * chooses to continue.
 *
 * Three states, and two of them are dead ends by design. An expired or revoked
 * link says so plainly and points at the school; it offers no retry, because
 * there is nothing the person holding it can do from here. Neither is styled
 * as an error - a link that ran out of time is not the reader's mistake.
 *
 * TODO(api): `GET /api/v1/join/{token}` returns
 * `{status, role, schoolName, expiresAt}` and no NAME, so D19's "Welcome,
 * Amara" cannot be personalised. The greeting is warm but general rather than
 * addressed to somebody we cannot name.
 *
 * TODO(screen): "Get Started" hands off to the role's existing activation
 * flow. Teachers have one - `/auth/teacher/activate` already reads a token off
 * the URL and redeems it. Students do not: they land on onboarding with the
 * token in the query and nothing yet reads it. Raised, and the student half of
 * this handoff is not finished until that route exists.
 */

type Phase = "loading" | "ready" | "failed";

/** Which panel to show. Decided once, when the lookup lands. */
type Outcome = "valid" | "expired" | "invalid";

export function JoinLanding({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [lookup, setLookup] = useState<JoinLookup | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("invalid");

  useEffect(() => {
    invitesApi
      .lookupJoin(token)
      .then((res) => {
        setLookup(res);
        // The clock is read HERE, in an effect, not during render - and a
        // link that says "valid" but is past its date is treated as expired,
        // because the date is the fact and the label is a summary of it.
        const status = (res.status ?? "").toLowerCase();
        const past = Date.parse(res.expiresAt) < Date.now();
        setOutcome(
          status === "valid" && !past
            ? "valid"
            : status === "expired" || (status === "valid" && past)
              ? "expired"
              : "invalid",
        );
        setPhase("ready");
      })
      // A 404 or 410 is not an error state here - it IS the answer, and the
      // "no longer valid" panel below is what it means.
      .catch(() => setPhase("failed"));
  }, [token]);

  const valid = phase === "ready" && outcome === "valid";
  const expired = phase === "ready" && outcome === "expired";
  const invalid = phase === "failed" || (phase === "ready" && outcome === "invalid");

  const isTeacher = (lookup?.role ?? "").toLowerCase() === "teacher";
  const onward = isTeacher
    ? `/auth/teacher/activate?token=${encodeURIComponent(token)}`
    : `/student/onboarding?token=${encodeURIComponent(token)}`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-nevo-cream px-6 py-12">
      <div className="w-full max-w-[420px] text-center">
        {phase === "loading" ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Spinner />
            <p className="m-0 text-sm text-nevo-near-black/60">
              Checking your invitation…
            </p>
          </div>
        ) : null}

        {valid ? (
          <>
            <p className="m-0 text-[15px] leading-[1.6] text-nevo-near-black/62">
              {lookup?.schoolName
                ? `${lookup.schoolName} has invited you to Nevo`
                : "You have been invited to Nevo"}
            </p>
            <h1 className="m-0 mt-3 text-[30px] font-semibold tracking-[-0.02em] text-nevo-near-black">
              Welcome
            </h1>
            <p className="m-0 mt-2.5 text-[15px] text-nevo-near-black/62">
              You are joining as {isTeacher ? "a teacher" : "a student"}
            </p>
            <Link href={onward} className={cn(PRIMARY_BTN, "mt-8 w-full justify-center")}>
              Get started
            </Link>
          </>
        ) : null}

        {expired ? (
          <>
            <h1 className="m-0 text-[26px] font-semibold tracking-[-0.018em] text-nevo-near-black">
              This invite has expired
            </h1>
            <p className="m-0 mt-3 text-[15px] leading-[1.6] text-nevo-near-black/62">
              Contact your school administrator to request a new invite.
            </p>
          </>
        ) : null}

        {invalid ? (
          <>
            <h1 className="m-0 text-[26px] font-semibold tracking-[-0.018em] text-nevo-near-black">
              This invite is no longer valid
            </h1>
            <p className="m-0 mt-3 text-[15px] leading-[1.6] text-nevo-near-black/62">
              Contact your school administrator for help.
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
