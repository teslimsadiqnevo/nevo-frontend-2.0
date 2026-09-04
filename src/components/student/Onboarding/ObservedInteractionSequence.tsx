"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignals } from "@/hooks";
import { authApi } from "@/lib/api";
import { invitesApi } from "@/lib/api/invites";
import {
  getOnboardingDraft,
  rememberOnboardedStudent,
} from "@/lib/auth/onboarding";
import { FIRST_LESSON_ID } from "@/lib/mocks";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { randomId } from "@/lib/utils";
import { ProfilingFlow } from "@/components/student/Profiling/ProfilingFlow";
import { TransitionScreen } from "./TransitionScreen";
import { ConsentGate } from "./ConsentGate";
import { PinCreationScreen } from "./PinCreationScreen";
import { YoureInScreen } from "./YoureInScreen";

/**
 * Onboarding Phase C — one continuous experience: a calm transition, the
 * Baseline Cognitive Profiling flow (SCRUM-104 — design retired the Observed
 * Interaction Sequence's four activities and this flow took their slot), the
 * Consent Gate, PIN Creation, and the "You're In" hand-off into the app.
 * Manual students arrive from Steps 1–3, SSO students from the callback; only
 * the transition copy and the PIN step differ, driven by the session
 * (`user.method`), never a URL param.
 */
export function ObservedInteractionSequence() {
  const router = useRouter();
  const { user } = useAuth();
  const isSso = user?.method === "sso";
  /*
   * The join token, and the identifier redeeming it hands back.
   *
   * A ref rather than state: it is written inside the PIN screen's own store
   * step and read in the completion that immediately follows, so it must not
   * wait for a re-render - and nothing renders from it.
   */
  const joinToken = getOnboardingDraft().joinToken;
  const identifierRef = useRef<string | null>(null);
  // Where "You're In" hands off to. Read here rather than at the tap so the
  // answer is ready by the time a child gets to the last screen.
  const { data: dashboard } = useStudentDashboard();
  // One profile-seeding session spans the whole sequence; useSignals batches the
  // events and flushes on completion (unmount). TODO(api): the backend may issue
  // a real onboarding session id / dedicated endpoint — swap in here.
  const [sessionId] = useState(() => `onboarding-${randomId()}`);
  const { trackEvent } = useSignals(sessionId);
  const [phase, setPhase] = useState<"transition" | "activities">("transition");
  const [index, setIndex] = useState(0);

  if (phase === "transition") {
    return (
      <TransitionScreen
        path={isSso ? "sso" : "manual"}
        onDone={() => setPhase("activities")}
        track={trackEvent}
      />
    );
  }

  const advance = () => setIndex((i) => i + 1);

  if (index === 0) {
    return <ProfilingFlow track={trackEvent} onDone={advance} />;
  }

  if (index === 1) {
    return <ConsentGate onContinue={advance} track={trackEvent} />;
  }

  if (index === 2) {
    return (
      <PinCreationScreen
        sso={isSso}
        /*
         * A join-link child has no session yet, so there is nothing to
         * `POST /auth/pin` against. Redeeming the invitation IS the account
         * creation: it stores the PIN and hands back the login identifier the
         * next sign-in will be checked against. Without a token there is
         * nowhere to put the PIN, so none is claimed to be stored.
         */
        storePin={async (pin) => {
          const draft = getOnboardingDraft();
          const [first, ...rest] = (draft.name ?? "").trim().split(/\s+/);
          const firstName = first || null;
          const lastName = rest.join(" ") || null;

          // A join link redeems the invitation; that IS the account creation
          // and it carries its own identity.
          if (joinToken) {
            const res = await invitesApi.acceptJoin(joinToken, {
              pin,
              firstName,
              lastName,
            });
            identifierRef.current = res.loginIdentifier;
            return;
          }

          /*
           * Otherwise the child came in by school and class code. Both halves
           * of this went public on 3 Sep; before that there was nowhere to put
           * the PIN and no identifier to remember, so this path onboarded a
           * child who then had no account.
           *
           * The connection token is fetched HERE rather than when the class
           * was chosen: it lives 20 minutes, and the profiling probes and
           * consent gate sit in between. Asking for it at the moment it is
           * spent means it cannot go stale in a child's hands.
           */
          const connection = await authApi.connectClassCode({
            classId: draft.classId,
            schoolCode: draft.schoolCode,
          });
          if (!connection.onboardingToken) {
            throw new Error("no onboarding token");
          }
          const res = await authApi.completeAccount({
            pin,
            onboardingToken: connection.onboardingToken,
            firstName,
            lastName,
            age: draft.age ?? null,
          });
          identifierRef.current = res.loginIdentifier;
        }}
        onComplete={() => {
          // The device now belongs to this student - but only if the server
          // issued an identifier it will recognise. SSO students re-enter
          // through their provider, not a PIN.
          if (!isSso) rememberOnboardedStudent(identifierRef.current);
          advance();
        }}
      />
    );
  }

  // "You're In" — the hand-off out of onboarding straight into the first lesson
  // (Product Arch B.2: land in a lesson, never an empty dashboard).
  //
  // This sent EVERY child into `FIRST_LESSON_ID` - the mock photosynthesis
  // lesson - whatever their year group, subject or what their teacher had
  // actually set. B.2 asks us to land them in a lesson; it does not ask us to
  // invent one. A real assignment is used when there is one, and when there is
  // not the child goes to their lessons list, which after the truthfulness
  // pass says plainly that nothing is set yet rather than inventing something.
  //
  // Signed out, the mock remains the destination: the whole of onboarding is
  // the designed walkthrough in that state, and the demo lesson is the point.
  const assigned = dashboard?.assignments.find((a) => a.status !== "completed");
  const firstLesson = assigned
    ? `/student/lessons/${assigned.lesson.id}`
    : dashboard
      ? "/student/lessons"
      : `/student/lessons/${FIRST_LESSON_ID}`;

  return (
    <YoureInScreen
      onDone={() => router.push(firstLesson)}
      track={trackEvent}
    />
  );
}
