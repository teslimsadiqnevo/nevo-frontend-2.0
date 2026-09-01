"use client";

import Link from "next/link";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { schoolApi } from "@/lib/api/school";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Spinner } from "../Roster/primitives";
import {
  FIELD,
  FIELD_HELP,
  FIELD_LABEL,
  FieldNote,
  StepHeading,
  WIZARD_PRIMARY,
  type WizardState,
} from "./OnboardingWizard";

/**
 * D1.1 School sign-up - first contact.
 *
 * A proprietor arrives from a sales conversation and needs to feel this is a
 * serious system, in under a minute of typing.
 *
 * Validation rules that are easy to get wrong and are set by SCRUM-39:
 *   - the primary stays disabled until EVERY required field is valid
 *   - no inline nagging while a field is still focused; corrections appear on
 *     BLUR only
 *   - corrections are navy, never red, with no icon, and they say what is
 *     needed rather than what was wrong
 *   - while submitting, fields go READ-ONLY rather than visually disabled
 *
 * A duplicate email is not a dead end: it offers a way to sign in.
 *
 * NOTE: `POST /api/v1/auth/school-code/verify` already RETURNS an `authMethod`
 * for a school, so the backend holds the concept - there is simply no way to
 * set it at onboarding. That makes the D1.2 gap a missing write, not a missing
 * model, which should be the easier half to close.
 *
 * TODO(api): `POST /api/v1/schools/register` declares a 201 with no body.
 * SCRUM-39 expects a session back, so the wizard signs in immediately
 * afterwards with the same credentials to get one - the later steps need a
 * session to write to `PATCH /api/v1/school`. A session on the register
 * response would remove that second round trip.
 */

type Phase = "idle" | "submitting" | "duplicate" | "failed";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 10;

export function SignUpStep({
  state,
  onChange,
  onDone,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<Phase>("idle");

  const submitting = phase === "submitting";
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const emailValid = EMAIL.test(state.email.trim());
  const passwordValid = password.length >= MIN_PASSWORD;
  const confirmValid = confirm.length > 0 && confirm === password;
  const valid =
    state.schoolName.trim().length > 0 &&
    state.adminName.trim().length > 0 &&
    emailValid &&
    passwordValid &&
    confirmValid;

  const submit = () => {
    if (!valid) return;
    setPhase("submitting");
    schoolApi
      .register({
        schoolName: state.schoolName.trim(),
        adminName: state.adminName.trim(),
        email: state.email.trim(),
        password,
      })
      // The register response carries no session, so sign in for one. The
      // later steps cannot write to the school record without it.
      .then(() => authApi.loginPassword({ email: state.email.trim(), password }))
      .then(() => onDone())
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 409) {
          setPhase("duplicate");
          return;
        }
        setPhase("failed");
      });
  };

  return (
    <>
      <StepHeading
        title="Let's set up your school"
        sub="A few details to create your Nevo workspace. You can come back to anything except how everyone signs in."
      />

      <div className="mt-8 flex flex-col gap-5">
        <div>
          <label htmlFor="ob-school" className={FIELD_LABEL}>
            School name
          </label>
          <input
            id="ob-school"
            value={state.schoolName}
            readOnly={submitting}
            onChange={(e) => onChange({ schoolName: e.target.value })}
            onBlur={() => blur("school")}
            placeholder="Brightgate Academy"
            autoComplete="organization"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="ob-name" className={FIELD_LABEL}>
            Your full name
          </label>
          <input
            id="ob-name"
            value={state.adminName}
            readOnly={submitting}
            onChange={(e) => onChange({ adminName: e.target.value })}
            onBlur={() => blur("name")}
            placeholder="Folake Adebayo"
            autoComplete="name"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="ob-email" className={FIELD_LABEL}>
            Work email address
          </label>
          <input
            id="ob-email"
            type="email"
            value={state.email}
            readOnly={submitting}
            onChange={(e) => {
              onChange({ email: e.target.value });
              if (phase === "duplicate") setPhase("idle");
            }}
            onBlur={() => blur("email")}
            placeholder="f.adebayo@brightgate.edu.ng"
            autoComplete="email"
            className={FIELD}
          />
          {touched.email && state.email.trim() && !emailValid ? (
            <FieldNote>This needs to be a full email address.</FieldNote>
          ) : null}
          {phase === "duplicate" ? (
            <FieldNote>
              This email is already set up with a school.{" "}
              <Link href="/auth/admin" className="underline underline-offset-2">
                Sign in instead
              </Link>
              , or use another address.
            </FieldNote>
          ) : null}
        </div>

        <div>
          <label htmlFor="ob-password" className={FIELD_LABEL}>
            Password
          </label>
          <input
            id="ob-password"
            type="password"
            value={password}
            readOnly={submitting}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => blur("password")}
            autoComplete="new-password"
            className={FIELD}
          />
          {touched.password && password && !passwordValid ? (
            <FieldNote>
              This needs to be at least {MIN_PASSWORD} characters.
            </FieldNote>
          ) : (
            <p className={FIELD_HELP}>
              At least {MIN_PASSWORD} characters. A phrase you&rsquo;ll remember
              is stronger than a short jumble.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ob-confirm" className={FIELD_LABEL}>
            Confirm password
          </label>
          <input
            id="ob-confirm"
            type="password"
            value={confirm}
            readOnly={submitting}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => blur("confirm")}
            autoComplete="new-password"
            className={FIELD}
          />
          {touched.confirm && confirm && !confirmValid ? (
            <FieldNote>These two need to match.</FieldNote>
          ) : null}
        </div>
      </div>

      {phase === "failed" ? (
        <div className="mt-6 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3.5">
          <p className="m-0 text-[13.5px] leading-[1.55] text-nevo-navy">
            That didn&rsquo;t go through, and nothing has been created yet.
            We&rsquo;re on it - everything you typed is still here.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={!valid || submitting}
        className={cn(WIZARD_PRIMARY, "mt-8")}
      >
        {submitting ? (
          <span className="inline-flex items-center justify-center gap-2.5">
            <Spinner />
            Creating your workspace…
          </span>
        ) : (
          "Continue"
        )}
      </button>
    </>
  );
}
